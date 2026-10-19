---
{
    "title": "RESTORE",
    "language": "ko",
    "description": "이 문은 BACKUP 명령으로 백업한 데이터를 지정된 데이터베이스로 복원하는 데 사용됩니다. 이 명령은 비동기적으로 실행됩니다."
}
---

## 설명 {#description}

이 문은 BACKUP 명령으로 백업한 데이터를 지정된 데이터베이스로 복원하는 데 사용됩니다. 이 명령은 비동기적으로 실행됩니다. 제출에 성공한 후에는 [SHOW RESTORE](./SHOW-RESTORE.md) 명령으로 진행 상황을 확인해야 합니다.

## 구문 {#syntax}

```sql
RESTORE SNAPSHOT [<db_name>.]<snapshot_name>
FROM `<repository_name>`
[ { ON | EXCLUDE } ] (
    `<table_name>` [PARTITION (`<partition_name>`, ...)] [AS `<table_alias>`]
    [, ...] ) ]
)
[ PROPERTIES ( "<key>" = "<value>" [ , ... ] )]
```

## 필수 매개변수 {#required-parameters}

**1.`<db_name>`**

복원할 데이터가 속한 데이터베이스의 이름입니다.

**2.`<snapshot_name>`**

데이터 스냅샷 이름입니다.

**3.`<repository_name>`**

리포지토리 이름입니다. [CREATE REPOSITORY](./CREATE-REPOSITORY.md)로 리포지토리를 생성할 수 있습니다.

**4.`[ PROPERTIES ( "<key>" = "<value>" [ , ... ] ) ]`**

복원 작업의 속성이며, 형식은 `<key>` = `<value>`입니다. 현재 다음 속성을 지원합니다.

- "backup_timestamp" = "2018-05-04-16-45-08": 해당 백업에서 복원할 시점의 버전을 지정하는 필수 속성입니다. 이 정보는 `SHOW SNAPSHOT ON repo;` 문으로 확인할 수 있습니다.
- "replication_num" = "3": 복원할 테이블 또는 파티션의 복제본 수를 지정합니다. 기본값은 3입니다. 기존 테이블 또는 파티션을 복원하는 경우 복제본 수가 기존 테이블 또는 파티션의 복제본 수와 같아야 합니다. 또한 여러 복제본을 수용할 수 있는 충분한 수의 호스트가 있어야 합니다.
- "reserve_replica" = "true": 기본값은 false입니다. 이 속성이 true이면 replication_num 속성은 무시되며, 복원된 테이블 또는 파티션의 복제본 수는 백업 전과 동일하게 유지됩니다. 복제본 수가 서로 다른 여러 테이블이나 한 테이블 내의 여러 파티션을 지원합니다.
- "reserve_colocate" = "true": 기본값은 false입니다. 이 속성이 false이면 colocate 속성을 복원하지 않습니다. 이 속성이 true이면 복원된 테이블이 colocate 속성을 유지합니다.
- "reserve_dynamic_partition_enable" = "true": 기본값은 false입니다. 이 속성이 true이면 복원된 테이블의 'dynamic_partition_enable' 값이 백업 전과 동일하게 유지됩니다. 이 속성이 true가 아니면 복원된 테이블에 'dynamic_partition_enable=false'가 설정됩니다.
- "timeout" = "3600": 작업의 제한 시간이며, 기본값은 하루입니다. 단위는 초입니다.
- "meta_version" = 40: 지정한 meta_version을 사용하여 이전에 백업한 메타데이터를 읽습니다. 이 매개변수는 임시 해결책으로, 이전 버전의 Doris에서 백업한 데이터를 복원하는 경우에만 사용합니다. 최신 버전에서 백업한 데이터에는 이미 메타데이터 버전이 포함되어 있으므로 지정할 필요가 없습니다.
- "clean_tables" : 복원 대상에 속하지 않는 테이블을 정리할지 지정합니다. 예를 들어, 복원 전 대상 데이터베이스에 스냅샷에 없는 테이블이 있다면 `clean_tables`를 지정하여 복원 중에 이러한 추가 테이블을 삭제하고 휴지통으로 이동할 수 있습니다.
  - 이 기능은 Apache Doris 2.1.6 버전부터 지원됩니다.
- "clean_partitions": 복원 대상에 속하지 않는 파티션을 정리할지 지정합니다. 예를 들어, 복원 전 대상 테이블에 스냅샷에 없는 파티션이 있다면 `clean_partitions`를 지정하여 복원 중에 이러한 추가 파티션을 삭제하고 휴지통으로 이동할 수 있습니다.
  - 이 기능은 Apache Doris 2.1.6 버전부터 지원됩니다.
- "atomic_restore" - : 먼저 데이터를 임시 테이블에 적재한 다음 원래 테이블을 원자적으로 교체하여, 복원 과정에서 대상 테이블의 읽기 및 쓰기가 영향을 받지 않도록 합니다.
- "force_replace" : 테이블이 이미 존재하고 스키마가 백업된 테이블과 다른 경우 강제로 교체합니다. 
  - `force_replace`를 활성화하려면 반드시 `atomic_restore`를 활성화해야 합니다.

## 선택적 매개변수 {#optional-parameters}

**1.`<table_name>`**

복원할 테이블의 이름입니다. 지정하지 않으면 전체 데이터베이스를 복원합니다.

- ON 절에는 복원할 테이블과 파티션을 지정합니다. 파티션을 지정하지 않으면 기본적으로 해당 테이블의 모든 파티션을 복원합니다. 지정한 테이블과 파티션은 리포지토리의 백업에 이미 존재해야 합니다.
- EXCLUDE 절에는 복원하지 않을 테이블과 파티션을 지정합니다. 지정한 테이블 또는 파티션을 제외한 리포지토리의 나머지 모든 테이블의 모든 파티션이 복원됩니다.

**2.`<partition_name>`**

복원할 파티션의 이름입니다. 지정하지 않으면 해당 테이블의 모든 파티션을 복원합니다.

**3.`<table_alias>`**

테이블 별칭입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 가지고 있어야 합니다.
| 권한     | 객체    | 설명 |
|:--------------|:----------|:------|
| LOAD_PRIV    | USER 또는 ROLE    | LOAD_PRIV 권한이 있는 사용자 또는 역할만 이 작업을 수행할 수 있습니다.  |

## 사용 시 참고 사항 {#usage-notes}

- OLAP 유형의 테이블 복원만 지원됩니다.
- 동일한 데이터베이스에서는 BACKUP 또는 RESTORE 작업을 한 번에 하나만 실행할 수 있습니다.
- 리포지토리에 백업된 테이블을 복원하여 데이터베이스에 이미 있는 같은 이름의 테이블을 교체할 수 있지만, 두 테이블의 구조가 완전히 동일해야 합니다. 테이블 구조에는 테이블 이름, 열, 파티션, Rollup 등이 포함됩니다.
- 복원할 테이블의 일부 파티션을 지정할 수 있으며, 시스템은 파티션의 Range 또는 List가 일치하는지 확인합니다.
- AS 문을 사용하여 리포지토리에 백업된 테이블을 새 이름의 테이블로 복원할 수 있습니다. 단, 새 테이블 이름이 데이터베이스에 이미 존재해서는 안 됩니다. 파티션 이름은 변경할 수 없습니다.
- 복원 작업의 효율성: 클러스터 규모가 같으면 복원 작업에 걸리는 시간은 백업 작업에 걸리는 시간과 거의 같습니다. 복원 작업을 더 빠르게 수행하려면 `replication_num` 매개변수를 설정하여 먼저 복제본 하나만 복원한 다음, [ALTER TABLE PROPERTY](../../../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PROPERTY)로 복제본 수를 조정하여 복제를 완료할 수 있습니다.

## 예제 {#example}

1. example_repo의 백업 snapshot_1에 있는 backup_tbl 테이블을 example_db1 데이터베이스로 복원합니다. 시간 버전은 "2018-05-04-16-45-08"입니다. 복제본 1개로 복원합니다.

```sql
RESTORE SNAPSHOT example_db1.`snapshot_1`
FROM `example_repo`
ON ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2018-05-04-16-45-08",
    "replication_num" = "1"
);
```

2. example_repo의 백업 snapshot_2에 있는 backup_tbl 테이블의 파티션 p1, p2와 backup_tbl2 테이블을 example_db1 데이터베이스로 복원하고, 후자의 이름을 new_tbl로 변경합니다. 시간 버전은 "2018-05-04-17-11-01"입니다. 기본적으로 복제본 3개로 복원합니다.

```sql
RESTORE SNAPSHOT example_db1.`snapshot_2`
FROM `example_repo`
ON
(
    `backup_tbl` PARTITION (`p1`, `p2`),
    `backup_tbl2` AS `new_tbl`
)
PROPERTIES
(
    "backup_timestamp"="2018-05-04-17-11-01"
);
```

3. example_repo의 백업 snapshot_3에서 backup_tbl 테이블을 제외한 모든 테이블을 example_db1 데이터베이스로 복원합니다. 시간 버전은 "2018-05-04-18-12-18"입니다.

```sql
RESTORE SNAPSHOT example_db1.`snapshot_3`
FROM `example_repo`
EXCLUDE ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2018-05-04-18-12-18"
);
```
