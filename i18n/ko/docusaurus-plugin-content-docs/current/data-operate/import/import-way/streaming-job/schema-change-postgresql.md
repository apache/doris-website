---
{
    "title": "PostgreSQL 스키마 변경 동기화",
    "language": "ko",
    "sidebar_label": "스키마 변경 동기화",
    "description": "PostgreSQL CDC 자동 테이블 생성 동기화에서 지원하는 스키마 변경 사항과 동기화 동작을 설명합니다.",
    "keywords": [
        "PostgreSQL Schema Change",
        "PostgreSQL CDC",
        "Auto Table Creation Sync",
        "Continuous Load",
        "Streaming Job",
        "ADD COLUMN",
        "DROP COLUMN"
    ]
}
---

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during PostgreSQL Auto Table Creation Sync -->

PostgreSQL 스키마 변경 동기화는 지속적 데이터 적재 중 업스트림 PostgreSQL의 컬럼 변경 사항을 Doris에 자동으로 적용합니다. 이 기능은 [자동 테이블 생성을 사용하는 PostgreSQL CDC](./continuous-load-postgresql-database.md)에만 적용됩니다. [SQL 매핑을 사용하는 PostgreSQL CDC](./continuous-load-postgresql-table.md)에서는 지원되지 않습니다.

:::tip

PostgreSQL 스키마 변경 동기화는 Doris 4.1.0부터 지원됩니다.

:::

## 지원되는 스키마 변경 {#supported-schema-changes}

| PostgreSQL 연산 | Doris 동작 |
| --- | --- |
| `ADD COLUMN` | 이름이 같고 [PostgreSQL 데이터 타입 매핑](./data-type-mapping-postgresql.md)에 정의된 타입을 사용하는 컬럼을 추가합니다. DEFAULT 및 `NOT NULL` 제약 조건은 복사하지 않으며, 기존 행에는 값을 소급하여 채우지 않습니다. 이후 행에는 PostgreSQL이 WAL에 기록한 실제 값을 사용합니다. |
| `DROP COLUMN` | 이름이 같은 컬럼을 삭제합니다. |

## 고려 사항 {#considerations}

- DDL만 실행한 경우에는 PostgreSQL 스키마 변경 사항이 즉시 전파되지 않습니다. 변경된 테이블에서 이후 INSERT, UPDATE 또는 DELETE가 발생하면 Doris가 새 스키마를 감지하고 적용합니다.
- 전체 스냅샷 단계에서는 자동 스키마 변경 동기화가 지원되지 않습니다. 전체 스냅샷이 완료되고 작업이 증분 단계로 전환된 후에 업스트림 스키마를 변경하세요.
- 추가하려는 컬럼이 이미 존재하거나 삭제하려는 컬럼이 존재하지 않으면, Doris는 해당 연산을 건너뛰어 재시도로 인해 작업이 실패하지 않도록 합니다.
- 한 번의 스키마 변경에서 컬럼을 동시에 추가하고 삭제하면, Doris는 컬럼 이름 변경일 가능성이 있다고 판단해 대상 테이블을 자동으로 변경하지 않습니다. 이를 통해 의도하지 않은 데이터 손실을 방지합니다.
- 컬럼 이름 변경, 컬럼 타입 변경, DEFAULT 변경, `NULL` / `NOT NULL` 제약 조건 변경은 자동으로 동기화되지 않습니다. 지속적 데이터 적재 작업을 일시 중지하고 Doris 대상 테이블을 수동으로 변경한 다음, 두 스키마가 호환되는지 확인하고 작업을 재개하세요.
- 자동 테이블 생성 동기화에서는 기본적으로 스키마 변경 동기화가 활성화됩니다. Doris는 현재 이 기능을 비활성화하는 SQL 속성을 제공하지 않습니다. `cdc_stream()` 테이블 함수(SQL 매핑 동기화)는 내부적으로 스키마 변경 동기화를 비활성화합니다.

:::caution 동작 변경 (4.1.4)

4.1.4 버전부터 PostgreSQL 스키마 변경 감지는 Relation 이벤트를 기반으로 수행됩니다.

- `ADD COLUMN`과 `DROP COLUMN`만 인식합니다.
- 컬럼을 동시에 추가하고 삭제하는 변경(`RENAME`일 가능성이 있음)은 건너뛰며, 대상 테이블은 그대로 유지됩니다.
- 컬럼 타입 변경은 건너뜁니다.
- 추가된 컬럼은 **더 이상 업스트림 컬럼의 `DEFAULT` 값을 포함하지 않습니다**.
- 이 기능은 자동 테이블 생성 동기화(at-least-once) 경로에만 적용됩니다. SQL 매핑(TVF / exactly-once) 경로에서는 지원되지 않습니다.

:::

## 관련 문서 {#related-docs}

- [자동 테이블 생성을 사용하는 PostgreSQL CDC](./continuous-load-postgresql-database.md)
- [PostgreSQL 데이터 타입 매핑](./data-type-mapping-postgresql.md)
- [지속적 데이터 적재 개요](./continuous-load-overview.md)
