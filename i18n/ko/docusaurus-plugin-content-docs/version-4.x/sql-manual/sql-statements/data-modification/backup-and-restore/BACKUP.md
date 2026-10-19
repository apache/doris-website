---
{
    "title": "BACKUP",
    "language": "ko",
    "description": "이 문은 지정된 데이터베이스의 데이터를 백업하는 데 사용됩니다. 이 명령은 비동기 작업으로 실행됩니다."
}
---

## 설명 {#description}

이 문은 지정된 데이터베이스의 데이터를 백업하는 데 사용됩니다. 이 명령은 비동기 작업으로 실행됩니다. 제출 후 `SHOW BACKUP` 명령으로 진행 상황을 확인할 수 있습니다.

## 구문 {#syntax}

```sql
BACKUP SNAPSHOT [<db_name>.]<snapshot_name>
TO `<repository_name>`
[ { ON | EXCLUDE } ]
    ( <table_name> [ PARTITION ( <partition_name> [, ...] ) ]
    [, ...] ) ]

[ PROPERTIES ( "<key>" = "<value>" [ , ... ] )]
```

## 필수 매개변수 {#required-parameters}

**1.`<db_name>`**

백업할 데이터가 속한 데이터베이스의 이름입니다.

**2.`<snapshot_name>`**

데이터 스냅샷 이름을 지정합니다. 스냅샷 이름은 중복될 수 없으며 전역적으로 고유해야 합니다.

**3.`<repository_name>`**

리포지토리 이름입니다. [CREATE REPOSITORY](./CREATE-REPOSITORY.md)를 사용하여 리포지토리를 생성할 수 있습니다.

## 선택적 매개변수 {#optional-parameters}

**1.`<table_name>`**

백업할 테이블의 이름입니다. 지정하지 않으면 전체 데이터베이스를 백업합니다.

- ON 절은 백업할 테이블과 파티션을 지정합니다. 파티션을 지정하지 않으면 기본적으로 해당 테이블의 모든 파티션을 백업합니다.
- EXCLUDE 절은 백업에서 제외할 테이블과 파티션을 지정합니다. 지정된 테이블 또는 파티션을 제외하고 이 데이터베이스에 있는 모든 테이블의 모든 파티션 데이터를 백업합니다.

**2.`<partition_name>`**

백업할 파티션의 이름입니다. 지정하지 않으면 해당 테이블의 모든 파티션을 백업합니다.

**3.`[ PROPERTIES ( "<key>" = "<value>" [ , ... ] ) ]`**

데이터 스냅샷 속성이며, 형식은 `<key>` = `<value>`입니다. 현재 다음 속성을 지원합니다.

- "type" = "full": 전체 업데이트임을 나타냅니다(기본값).
- "timeout" = "3600": 작업 제한 시간이며, 기본값은 하루입니다. 단위는 초입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.
| 권한     | 객체    | 참고 사항 |
|:--------------|:----------|:------|
| LOAD_PRIV    | USER 또는 ROLE    | LOAD_PRIV 권한이 있는 사용자 또는 역할만 이 작업을 수행할 수 있습니다.  |

## 사용 시 참고 사항 {#usage-notes}

- OLAP 유형의 테이블만 백업할 수 있습니다.
- 동일한 데이터베이스에서는 한 번에 하나의 백업 작업만 수행할 수 있습니다.
- 백업 작업은 지정된 테이블 또는 파티션의 기본 테이블과 [동기식 구체화된 뷰](../../../../query-acceleration/materialized-view/sync-materialized-view.md)를 백업하며, 복제본은 하나만 백업합니다. [비동기식 구체화된 뷰](../../../../query-acceleration/materialized-view/async-materialized-view/overview.md)는 지원하지 않습니다.
- 백업 작업의 효율성: 백업 작업의 효율성은 데이터 양, Compute Nodes 수, 파일 수에 따라 달라집니다. 백업할 데이터 샤드가 있는 각 Compute Node는 백업 작업의 업로드 단계에 참여합니다. 노드 수가 많을수록 업로드 효율성이 높아집니다. 여기서 파일 데이터의 양은 샤드 수와 각 샤드의 파일 수만을 의미합니다. 샤드가 많거나 샤드에 작은 파일이 많으면 백업 작업 시간이 늘어날 수 있습니다.

## 예제 {#example}

1. example_db의 example_tbl 테이블을 example_repo 리포지토리에 전체 백업합니다.

```sql
BACKUP SNAPSHOT example_db.snapshot_label1
TO example_repo
ON (example_tbl)
PROPERTIES ("type" = "full");
```

2. example_db에 있는 example_tbl 테이블의 p1, p2 파티션과 example_tbl2 테이블을 example_repo 리포지토리에 전체 백업합니다.

```sql
BACKUP SNAPSHOT example_db.snapshot_label2
TO example_repo
ON
(
    example_tbl PARTITION (p1,p2),
    example_tbl2
);
```

3. example_db에서 example_tbl 테이블을 제외한 모든 테이블을 example_repo 리포지토리에 전체 백업합니다.

```sql
BACKUP SNAPSHOT example_db.snapshot_label3
TO example_repo
EXCLUDE (example_tbl);
```

4. example_db의 테이블을 example_repo 리포지토리에 전체 백업합니다.

```sql
BACKUP SNAPSHOT example_db.snapshot_label3
TO example_repo;
```
