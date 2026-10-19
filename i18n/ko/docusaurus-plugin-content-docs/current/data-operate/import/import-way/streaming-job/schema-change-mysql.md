---
{
    "title": "MySQL 스키마 변경 동기화",
    "language": "ko",
    "sidebar_label": "스키마 변경 동기화",
    "description": "MySQL CDC 테이블 자동 생성 동기화에서 지원하는 스키마 변경과 동기화 동작을 설명합니다.",
    "keywords": [
        "MySQL Schema Change",
        "MySQL CDC",
        "Auto Table Creation Sync",
        "Continuous Load",
        "Streaming Job",
        "ADD COLUMN",
        "DROP COLUMN"
    ]
}
---

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during MySQL Auto Table Creation Sync -->

MySQL 스키마 변경 동기화는 연속 데이터 적재 중에 업스트림 MySQL의 컬럼 변경 사항을 Doris에 자동으로 적용합니다. 이 기능은 [테이블 자동 생성을 사용하는 MySQL CDC](./continuous-load-mysql-database.md)에만 적용됩니다. [SQL 매핑을 사용하는 MySQL CDC](./continuous-load-mysql-table.md)에서는 지원되지 않습니다.

:::tip

MySQL 스키마 변경 동기화는 Doris 4.1.4부터 지원됩니다.

:::

## 지원되는 스키마 변경 {#supported-schema-changes}

| MySQL 작업 | Doris 동작 |
| --- | --- |
| `ADD COLUMN` | 동일한 이름과 [MySQL 데이터 타입 매핑](./data-type-mapping-mysql.md)에 정의된 타입으로 컬럼을 추가하고 컬럼 주석을 복사합니다. DEFAULT 및 `NOT NULL` 제약 조건은 복사하지 않으며, 기존 행에는 값을 소급하여 채우지 않습니다. 이후 행에는 MySQL이 binlog에 기록한 실제 값을 사용합니다. |
| `DROP COLUMN` | 동일한 이름의 컬럼을 삭제합니다. |

## 고려 사항 {#considerations}

- 추가하려는 컬럼이 이미 존재하거나 삭제하려는 컬럼이 존재하지 않으면 Doris는 해당 작업을 건너뛰므로 재시도 시 작업이 실패하지 않습니다.
- `FIRST`와 `AFTER`로 지정한 컬럼 위치는 Doris에 동기화되지 않습니다. 새 컬럼은 기존 Doris 컬럼 뒤에 추가됩니다.
- `CHANGE COLUMN`, `MODIFY COLUMN`, `RENAME COLUMN`, DEFAULT 변경 및 `NULL` / `NOT NULL` 제약 조건 변경은 자동으로 동기화되지 않습니다. 이러한 작업을 수행하기 전에 연속 데이터 적재 작업을 일시 중지하고, Doris 대상 테이블을 수동으로 변경한 다음, 두 스키마가 호환되는지 확인한 후 작업을 재개하세요.
- 기본 키, 인덱스, 파티션, 테이블 이름 및 기타 테이블 수준의 스키마 변경은 자동으로 동기화되지 않습니다.
- 테이블 자동 생성 동기화에서는 스키마 변경 동기화가 기본적으로 활성화됩니다. 현재 Doris는 이를 비활성화하는 SQL 속성을 제공하지 않습니다. `cdc_stream()` 테이블 함수(SQL 매핑 동기화)는 내부적으로 스키마 변경 동기화를 비활성화합니다.

## 관련 문서 {#related-docs}

- [테이블 자동 생성을 사용하는 MySQL CDC](./continuous-load-mysql-database.md)
- [MySQL 데이터 타입 매핑](./data-type-mapping-mysql.md)
- [연속 데이터 적재 개요](./continuous-load-overview.md)
