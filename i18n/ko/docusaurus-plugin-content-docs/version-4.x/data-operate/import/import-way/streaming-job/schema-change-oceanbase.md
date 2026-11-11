---
{
    "title": "OceanBase Schema Change 동기화",
    "language": "ko",
    "sidebar_label": "Schema Change 동기화",
    "description": "CDC Auto Table Creation Sync에서 지원하는 OceanBase Schema Change와 Doris의 적용 방식 및 제한 사항을 알아봅니다.",
    "keywords": [
        "OceanBase Schema Change",
        "OceanBase CDC",
        "Auto Table Creation Sync",
        "continuous load",
        "ADD COLUMN",
        "DROP COLUMN"
    ]
}
---

:::caution 실험적 기능

Doris 연속 데이터 적재는 실험적 기능이며 Doris 4.1.5부터 지원됩니다.

:::

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during OceanBase Auto Table Creation Sync -->

OceanBase Schema Change Sync는 연속 데이터 적재 중 업스트림 열 변경 사항을 Doris 대상 테이블에 자동으로 적용합니다. 이 기능은 [Auto Table Creation을 사용하는 OceanBase CDC](./continuous-load-oceanbase-database.md)에만 적용됩니다.

OceanBase Schema Change Sync는 MySQL 호환 모드만 지원합니다.

OceanBase는 MySQL CDC의 스키마 변경 처리 경로를 사용하므로 지원되는 변경과 동작이 MySQL과 동일합니다.

## 지원되는 스키마 변경 {#supported-schema-changes}

| OceanBase 작업 | Doris 동작 |
| --- | --- |
| `ADD COLUMN` | 같은 이름의 열을 추가하며 [OceanBase 데이터 형식 매핑](./data-type-mapping-oceanbase.md)에 정의된 형식을 사용하고 열 주석을 복사합니다. DEFAULT 및 `NOT NULL` 제약 조건은 복사하지 않으며 기존 행은 백필하지 않습니다. 이후 행에는 OceanBase가 binlog에 기록한 실제 값이 사용됩니다. |
| `DROP COLUMN` | 같은 이름의 열을 삭제합니다. |

## 고려 사항 {#considerations}

- 추가할 열이 이미 존재하거나 삭제할 열이 존재하지 않으면 Doris는 재시도로 작업이 실패하지 않도록 해당 작업을 건너뜁니다.
- `FIRST` 및 `AFTER`로 지정한 열 위치는 Doris에 동기화되지 않습니다. 새 열은 기존 Doris 열 뒤에 추가됩니다.
- `CHANGE COLUMN`, `MODIFY COLUMN`, `RENAME COLUMN`, DEFAULT 변경 및 `NULL` / `NOT NULL` 제약 조건 변경은 자동으로 동기화되지 않습니다.
- 기본 키, 인덱스, 파티션, 테이블 이름 및 기타 테이블 수준 스키마 변경은 자동으로 동기화되지 않습니다.
- 지원되지 않는 스키마 변경을 수행하기 전에 연속 데이터 적재 작업을 일시 중지하고 Doris 대상 테이블을 수동으로 변경한 후 두 스키마가 호환되는지 확인한 다음 작업을 재개합니다.
- Auto Table Creation Sync는 기본적으로 Schema Change Sync를 활성화합니다. 현재 Doris는 이를 비활성화할 SQL 속성을 제공하지 않습니다.

## 예제 {#example}

OceanBase 소스 테이블에 열을 추가합니다:

```sql
ALTER TABLE source_db.users ADD COLUMN city VARCHAR(50);
INSERT INTO source_db.users VALUES (2, 'Alice', 'Hangzhou');
```

작업이 증분 데이터를 처리하면 Doris 대상 테이블에 `city` 열이 나타납니다:

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

- [Auto Table Creation을 사용하는 OceanBase CDC](./continuous-load-oceanbase-database.md)
- [OceanBase 데이터 형식 매핑](./data-type-mapping-oceanbase.md)
- [연속 데이터 적재 개요](./continuous-load-overview.md)
