---
{
    "title": "PostgreSQL 스키마 변경 동기화",
    "language": "ko",
    "sidebar_label": "스키마 변경 동기화",
    "description": "PostgreSQL CDC 자동 테이블 생성 동기화에서 지원되는 스키마 변경과 동기화 동작을 설명합니다.",
    "keywords": [
        "PostgreSQL 스키마 변경",
        "PostgreSQL CDC",
        "자동 테이블 생성 동기화",
        "연속 적재",
        "스트리밍 작업",
        "ADD COLUMN",
        "DROP COLUMN"
    ]
}
---

:::caution 실험적 기능

Doris 연속 적재는 실험적 기능이며 Doris 4.1.5부터 지원됩니다.

:::

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during PostgreSQL Auto Table Creation Sync -->

PostgreSQL 스키마 변경 동기화는 연속 적재 중 업스트림 PostgreSQL 열 변경 사항을 Doris에 자동으로 적용합니다. 이 기능은 [PostgreSQL CDC 자동 테이블 생성 동기화](./continuous-load-postgresql-database.md)에만 적용됩니다. [PostgreSQL CDC SQL 매핑](./continuous-load-postgresql-table.md)에서는 지원되지 않습니다.

## 지원되는 스키마 변경 {#supported-schema-changes}

| PostgreSQL 작업 | Doris 동작 |
| --- | --- |
| `ADD COLUMN` | 같은 이름의 열을 추가하며, 유형은 [PostgreSQL 데이터 유형 매핑](./data-type-mapping-postgresql.md)에 정의된 유형을 따릅니다. DEFAULT 및 `NOT NULL` 제약 조건은 복사되지 않으며 기존 행은 백필되지 않습니다. 이후 행에는 PostgreSQL이 WAL에 기록한 실제 값이 사용됩니다. |
| `DROP COLUMN` | 같은 이름의 열을 삭제합니다. |

## 고려 사항 {#considerations}

- DDL만 실행한 경우 PostgreSQL 스키마 변경은 즉시 전파되지 않습니다. 변경된 테이블에 이후 INSERT, UPDATE 또는 DELETE가 수신된 후 Doris가 새 스키마를 감지하고 적용합니다.
- 전체 스냅샷 단계에서는 자동 스키마 변경 동기화가 지원되지 않습니다. 전체 스냅샷이 완료되고 작업이 증분 단계에 진입한 후 업스트림 스키마를 변경하십시오.
- 추가된 열이 이미 존재하거나 삭제할 열이 존재하지 않으면 Doris는 재시도로 인해 작업이 실패하지 않도록 해당 작업을 건너뜁니다.
- 하나의 스키마 변경에서 열 추가와 삭제가 동시에 발생하면 Doris는 이를 열 이름 변경 가능성으로 간주하고 대상 테이블을 자동으로 변경하지 않습니다. 이는 실수로 인한 데이터 손실을 방지합니다.
- 열 이름 변경, 열 유형 변경, DEFAULT 변경, `NULL` / `NOT NULL` 제약 조건 변경은 자동으로 동기화되지 않습니다. 연속 적재 작업을 일시 중지하고 Doris 대상 테이블을 수동으로 변경한 다음 두 스키마의 호환성을 확인하고 작업을 재개하십시오.
- 자동 테이블 생성 동기화는 기본적으로 스키마 변경 동기화를 활성화합니다. 현재 Doris는 이를 비활성화하는 SQL 속성을 제공하지 않습니다. `cdc_stream()` 테이블 함수(SQL 매핑 동기화)는 내부적으로 스키마 변경 동기화를 비활성화합니다.

:::caution 스키마 변경 동작

PostgreSQL 스키마 변경 감지는 Relation 이벤트에 의해 구동됩니다.

- `ADD COLUMN` 및 `DROP COLUMN`만 인식됩니다.
- 열을 추가하고 삭제하는 변경이 동시에 발생하면 (`RENAME`일 가능성이 있음) 해당 변경을 건너뛰고 대상 테이블은 변경하지 않은 상태로 유지됩니다.
- 열 유형 변경은 건너뜁니다.
- 추가된 열에는 **업스트림 열의 `DEFAULT` 값이 전달되지 않습니다**.
- 이 기능은 자동 테이블 생성 동기화(at-least-once) 경로에만 적용됩니다. SQL 매핑(TVF / exactly-once) 경로에서는 지원되지 않습니다.

:::

## 관련 문서 {#related-docs}

- [PostgreSQL CDC 자동 테이블 생성](./continuous-load-postgresql-database.md)
- [PostgreSQL 데이터 유형 매핑](./data-type-mapping-postgresql.md)
- [연속 적재 개요](./continuous-load-overview.md)
