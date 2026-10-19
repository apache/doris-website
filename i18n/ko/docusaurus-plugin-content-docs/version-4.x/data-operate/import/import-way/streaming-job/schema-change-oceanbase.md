---
{
    "title": "OceanBase 스키마 변경 동기화",
    "language": "ko",
    "sidebar_label": "스키마 변경 동기화",
    "description": "CDC 자동 테이블 생성 동기화에서 지원하는 OceanBase 스키마 변경 사항과 Doris의 적용 방식, 제한 사항을 알아봅니다.",
    "keywords": [
        "OceanBase 스키마 변경",
        "OceanBase CDC",
        "자동 테이블 생성 동기화",
        "연속 데이터 적재",
        "ADD COLUMN",
        "DROP COLUMN"
    ]
}
---

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during OceanBase Auto Table Creation Sync -->

OceanBase 스키마 변경 동기화는 연속 데이터 적재 중 업스트림의 컬럼 변경 사항을 Doris 대상 테이블에 자동으로 적용합니다. 이 기능은 [자동 테이블 생성을 사용하는 OceanBase CDC](./continuous-load-oceanbase-database.md)에만 적용됩니다.

:::caution 실험적 기능

OceanBase 스키마 변경 동기화는 Doris 4.1.4부터 실험적 기능으로 제공되며, MySQL 호환 모드만 지원합니다.

:::

OceanBase는 MySQL CDC의 스키마 변경 처리 경로를 사용하므로, 지원되는 변경 사항과 동작은 MySQL과 동일합니다.

## 지원되는 스키마 변경 {#supported-schema-changes}

| OceanBase 작업 | Doris 동작 |
| --- | --- |
| `ADD COLUMN` | 동일한 이름과 [OceanBase 데이터 타입 매핑](./data-type-mapping-oceanbase.md)에 정의된 타입으로 컬럼을 추가하고, 컬럼 주석을 복사합니다. DEFAULT 및 `NOT NULL` 제약 조건은 복사하지 않으며, 기존 행에 대한 백필은 수행하지 않습니다. 이후의 행에는 OceanBase가 binlog에 기록한 실제 값을 사용합니다. |
| `DROP COLUMN` | 동일한 이름의 컬럼을 삭제합니다. |

## 고려 사항 {#considerations}

- 추가하려는 컬럼이 이미 존재하거나 삭제하려는 컬럼이 존재하지 않으면, Doris는 해당 작업을 건너뛰어 재시도로 인해 데이터 적재 작업이 실패하지 않도록 합니다.
- `FIRST`와 `AFTER`로 지정한 컬럼 위치는 Doris에 동기화되지 않습니다. 새 컬럼은 기존 Doris 컬럼 뒤에 추가됩니다.
- `CHANGE COLUMN`, `MODIFY COLUMN`, `RENAME COLUMN`, DEFAULT 변경 및 `NULL` / `NOT NULL` 제약 조건 변경은 자동으로 동기화되지 않습니다.
- 기본 키, 인덱스, 파티션, 테이블 이름 및 기타 테이블 수준의 스키마 변경은 자동으로 동기화되지 않습니다.
- 지원되지 않는 스키마 변경을 수행하기 전에 연속 데이터 적재 작업을 일시 중지하고, Doris 대상 테이블을 수동으로 변경한 다음, 두 스키마가 호환되는지 확인한 후 작업을 재개합니다.
- 자동 테이블 생성 동기화는 기본적으로 스키마 변경 동기화를 활성화합니다. 현재 Doris는 이를 비활성화하는 SQL 속성을 제공하지 않습니다.

## 예제 {#example}

OceanBase 원본 테이블에 컬럼을 추가합니다:

```sql
ALTER TABLE source_db.users ADD COLUMN city VARCHAR(50);
INSERT INTO source_db.users VALUES (2, 'Alice', 'Hangzhou');
```

작업이 증분 데이터를 처리하면 Doris 대상 테이블에 `city` 컬럼이 나타납니다:

```sql
DESC target_db.users;
```

```text
+-------+--------------+------+-------+---------+-------+
| Field | Type         | Null | Key   | Default | Extra |
+-------+--------------+------+-------+---------+-------+
| id    | int          | No   | true  | NULL    |       |
| name  | varchar(100) | Yes  | false | NULL    | NONE  |
| city  | varchar(50)  | Yes  | false | NULL    | NONE  |
+-------+--------------+------+-------+---------+-------+
```

## 관련 문서 {#related-documents}

- [자동 테이블 생성을 사용하는 OceanBase CDC](./continuous-load-oceanbase-database.md)
- [OceanBase 데이터 타입 매핑](./data-type-mapping-oceanbase.md)
- [연속 데이터 적재 개요](./continuous-load-overview.md)
