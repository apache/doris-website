---
{
    "title": "MySQL 스키마 변경 동기화",
    "language": "ko",
    "sidebar_label": "스키마 변경 동기화",
    "description": "MySQL CDC 자동 테이블 생성 동기화에서 지원되는 스키마 변경 및 동기화 동작을 설명합니다.",
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

:::caution 실험적 기능

Doris 지속적 데이터 적재는 실험적 기능이며 Doris 4.1.5부터 지원됩니다.

:::

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during MySQL Auto Table Creation Sync -->

MySQL 스키마 변경 동기화는 지속적 데이터 적재 중에 업스트림 MySQL의 열 변경 사항을 Doris에 자동으로 적용합니다. 이 기능은 [MySQL CDC 자동 테이블 생성 동기화](./continuous-load-mysql-database.md)에만 적용됩니다. [MySQL CDC SQL 매핑 동기화](./continuous-load-mysql-table.md)에서는 지원되지 않습니다.

## 지원되는 스키마 변경 {#supported-schema-changes}

| MySQL 작업 | Doris 동작 |
| --- | --- |
| `ADD COLUMN` | 같은 이름의 열을 추가합니다. 열 유형은 [MySQL 데이터 유형 매핑](./data-type-mapping-mysql.md)에 정의된 대로 지정되며, 열 주석이 복사됩니다. DEFAULT 및 `NOT NULL` 제약 조건은 복사되지 않으며 과거 행은 백필되지 않습니다. 이후 행에는 MySQL이 binlog에 기록한 실제 값이 사용됩니다. |
| `DROP COLUMN` | 같은 이름의 열을 삭제합니다. |

## 고려 사항 {#considerations}

- 추가할 열이 이미 존재하거나 삭제할 열이 존재하지 않으면 Doris는 작업을 건너뛰므로 재시도해도 작업이 실패하지 않습니다.
- `FIRST` 및 `AFTER`로 지정한 열 위치는 Doris에 동기화되지 않습니다. 새 열은 기존 Doris 열 뒤에 추가됩니다.
- `CHANGE COLUMN`, `MODIFY COLUMN`, `RENAME COLUMN`, DEFAULT 변경, `NULL` / `NOT NULL` 제약 조건 변경은 자동으로 동기화되지 않습니다. 이러한 작업을 수행하기 전에 지속적 데이터 적재 작업을 일시 중지하고 Doris 대상 테이블을 수동으로 변경한 후 두 스키마의 호환성을 확인하고 작업을 재개하십시오.
- 기본 키, 인덱스, 파티션, 테이블 이름 및 기타 테이블 수준 스키마 변경은 자동으로 동기화되지 않습니다.
- 자동 테이블 생성 동기화는 기본적으로 스키마 변경 동기화를 활성화합니다. Doris 4.1에서는 이를 비활성화하는 SQL 속성을 제공하지 않습니다. `cdc_stream()` 테이블 함수(SQL 매핑 동기화)는 내부적으로 스키마 변경 동기화를 비활성화합니다.

## 관련 문서 {#related-docs}

- [MySQL CDC 자동 테이블 생성 동기화](./continuous-load-mysql-database.md)
- [MySQL 데이터 유형 매핑](./data-type-mapping-mysql.md)
- [지속적 데이터 적재 개요](./continuous-load-overview.md)
