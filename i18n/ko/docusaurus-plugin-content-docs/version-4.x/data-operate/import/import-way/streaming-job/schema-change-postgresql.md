---
{
    "title": "PostgreSQL 스키마 변경 동기화",
    "language": "ko",
    "sidebar_label": "스키마 변경 동기화",
    "description": "PostgreSQL CDC Auto Table Creation Sync에서 지원되는 스키마 변경과 동기화 동작을 설명합니다.",
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

:::caution 실험적 기능

Doris의 지속적 데이터 적재는 실험적 기능이며 Doris 4.1.5부터 지원됩니다.

:::

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during PostgreSQL Auto Table Creation Sync -->

PostgreSQL Schema Change Sync는 지속적 데이터 적재 중 업스트림 PostgreSQL 열 변경 사항을 Doris에 자동으로 적용합니다. 이 기능은 [Auto Table Creation을 사용하는 PostgreSQL CDC](./continuous-load-postgresql-database.md)에만 적용됩니다. [SQL Mapping을 사용하는 PostgreSQL CDC](./continuous-load-postgresql-table.md)에서는 지원되지 않습니다.

## 지원되는 스키마 변경 {#supported-schema-changes}

| PostgreSQL 작업 | Doris 동작 |
| --- | --- |
| `ADD COLUMN` | 동일한 이름의 열을 추가하며, 유형은 [PostgreSQL 데이터 유형 매핑](./data-type-mapping-postgresql.md)에 정의된 유형을 사용합니다. DEFAULT 및 `NOT NULL` 제약 조건은 복사되지 않으며 기존 행은 백필되지 않습니다. 이후 행에는 PostgreSQL이 WAL에 기록한 실제 값이 사용됩니다. |
| `DROP COLUMN` | 동일한 이름의 열을 삭제합니다. |

## 고려 사항 {#considerations}

- PostgreSQL 스키마 변경은 DDL만 실행한 경우 즉시 전파되지 않습니다. Doris는 변경된 테이블에서 이후 INSERT, UPDATE 또는 DELETE를 받은 후 새 스키마를 감지하고 적용합니다.
- 전체 스냅샷 단계에서는 자동 스키마 변경 동기화가 지원되지 않습니다. 전체 스냅샷이 완료되고 작업이 증분 단계에 진입한 후 업스트림 스키마를 변경하세요.
- 추가하려는 열이 이미 존재하거나 삭제하려는 열이 존재하지 않으면 Doris는 해당 작업을 건너뛰므로 재시도로 작업이 실패하지 않습니다.
- 하나의 스키마 변경에서 열 추가와 삭제가 동시에 발생하면 Doris는 이를 열 이름 변경일 가능성이 있는 것으로 간주하고 대상 테이블을 자동으로 변경하지 않습니다. 이렇게 하면 실수로 데이터가 손실되는 것을 방지할 수 있습니다.
- 열 이름 변경, 열 유형 변경, DEFAULT 변경, `NULL` / `NOT NULL` 제약 조건 변경은 자동으로 동기화되지 않습니다. 지속적 데이터 적재 작업을 일시 중지하고 Doris 대상 테이블을 수동으로 변경한 뒤 두 스키마가 호환되는지 확인하고 작업을 재개하세요.
- Auto Table Creation Sync는 기본적으로 Schema Change Sync를 활성화합니다. Doris 4.1에서는 이를 비활성화하는 SQL 속성을 제공하지 않습니다. `cdc_stream()` 테이블 함수(SQL Mapping Sync)는 내부적으로 Schema Change Sync를 비활성화합니다.

:::caution 스키마 변경 동작

PostgreSQL 스키마 변경 감지는 Relation 이벤트를 기반으로 합니다:

- `ADD COLUMN` 및 `DROP COLUMN`만 인식됩니다.
- 열 추가와 삭제가 동시에 포함된 변경(`RENAME`일 수 있음)은 건너뛰며 대상 테이블은 변경되지 않습니다.
- 열 유형 변경은 건너뜁니다.
- 추가된 열에는 **업스트림 열의 `DEFAULT` 값이 포함되지 않습니다**.
- 이 기능은 Auto Table Creation Sync (at-least-once) 경로에만 적용됩니다. SQL Mapping (TVF / exactly-once) 경로에서는 지원되지 않습니다.

:::

## 관련 문서 {#related-docs}

- [Auto Table Creation을 사용하는 PostgreSQL CDC](./continuous-load-postgresql-database.md)
- [PostgreSQL 데이터 유형 매핑](./data-type-mapping-postgresql.md)
- [지속적 데이터 적재 개요](./continuous-load-overview.md)
