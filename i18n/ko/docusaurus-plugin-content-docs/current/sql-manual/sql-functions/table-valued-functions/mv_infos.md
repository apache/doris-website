---
{
    "title": "MV_INFOS",
    "language": "ko",
    "description": "비동기 구체화된 뷰용 임시 테이블을 생성하는 테이블 함수"
}
---

## 설명 {#description}

비동기 구체화된 뷰용 임시 테이블을 생성하는 테이블 함수로, 특정 데이터베이스에 생성된 비동기 구체화된 뷰의 정보를 조회할 수 있습니다.

## 구문 {#syntax}
```sql
MV_INFOS("database"="<database>")
```

## 필수 매개변수 {#required-parameters}
**`<database>`**
> 조회할 클러스터 데이터베이스 이름을 지정합니다.


## 반환 값 {#return-value}

| 필드                   | 유형    | 설명                                                                |
|------------------------|---------|---------------------------------------------------------------------|
| Id                     | BIGINT  | 구체화된 뷰 ID                                                      |
| Name                   | TEXT    | 구체화된 뷰 이름                                                    |
| JobName                | TEXT    | 구체화된 뷰에 해당하는 새로 고침 작업의 이름입니다. `jobs("type"="mv")` 및 `tasks("type"="mv")`를 쿼리하는 데 사용할 수 있습니다. |
| State                  | TEXT    | 구체화된 뷰의 메타데이터 상태입니다. 가능한 값은 `INIT`, `NORMAL`, `SCHEMA_CHANGE`입니다. |
| SchemaChangeDetail     | TEXT    | `State`가 `SCHEMA_CHANGE`로 변경된 이유입니다. 구체화된 뷰가 스키마 변경 상태가 아니면 비어 있습니다. |
| RefreshState           | TEXT    | 최근 새로 고침의 상태입니다. 가능한 값은 `INIT`, `SUCCESS`, `FAIL`입니다. |
| RefreshInfo            | TEXT    | 구체화된 뷰에 정의된 새로 고침 전략으로, 빌드 모드, 새로 고침 방식, 트리거 모드를 포함합니다. |
| QuerySql               | TEXT    | 구체화된 뷰에 정의된 SQL 쿼리                                       |
| MvProperties           | TEXT    | 구체화된 뷰의 속성                                                  |
| MvPartitionInfo        | TEXT    | 구체화된 뷰의 파티션 정보                                           |
| SyncWithBaseTables     | BOOLEAN | 구체화된 뷰의 데이터가 기본 테이블과 동기화되어 있는지 여부입니다. 동기화되지 않은 파티션을 확인하려면 [SHOW PARTITIONS](../../sql-statements/table-and-view/table/SHOW-PARTITIONS)를 사용하세요. |
| IvmBaseTableStreams    | TEXT    | IVM 기본 테이블과 Doris가 자동으로 생성하는 내부 Table Streams 간의 매핑입니다. IVM을 사용하지 않는 구체화된 뷰에서는 일반적으로 비어 있습니다. |

`RefreshInfo`는 `BUILD <BuildMode> REFRESH <RefreshMethod> ON <RefreshTrigger> [schedule]` 형식으로 표시됩니다. 각 부분의 의미는 아래 열거형 섹션에서 설명합니다.

### MV 정보의 열거형 필드 {#mv-info-enum-fields}

다음 열거형 필드는 구체화된 뷰의 정의와 정상 작동 여부를 확인할 때 자주 사용됩니다.

- `State`: 구체화된 뷰의 메타데이터 상태입니다.
  - `INIT`: 구체화된 뷰가 생성되었지만 아직 정상적으로 사용할 수 있는 메타데이터 상태에 도달하지 않았습니다.
  - `NORMAL`: 구체화된 뷰의 메타데이터가 정상입니다. 대부분의 경우 이 상태여야 합니다.
  - `SCHEMA_CHANGE`: 기본 테이블이나 관련 객체의 스키마 변경이 이 구체화된 뷰에 영향을 주었습니다. `SchemaChangeDetail`에서 이유를 확인하세요. 일반적으로 구체화된 뷰를 직접 쿼리할 수 있지만, 새로 고침이 성공할 때까지 투명한 재작성에 사용하지 못할 수 있습니다.
- `RefreshState`: 최근 새로 고침의 결과 상태입니다.
  - `INIT`: 아직 새로 고침 결과가 기록되지 않았습니다.
  - `SUCCESS`: 최근 새로 고침이 성공적으로 완료되었습니다.
  - `FAIL`: 최근 새로 고침이 실패했습니다. `JobName`을 사용하여 `tasks("type"="mv")`를 쿼리하고 실패한 작업의 `ErrorMsg`를 확인하세요.
- `RefreshInfo.BuildMode`: Doris가 구체화된 뷰 데이터를 빌드하는 시점입니다.
  - `IMMEDIATE`: 생성 직후 구체화된 뷰를 빌드합니다.
  - `DEFERRED`: 생성 시에는 빌드하지 않습니다. 구체화된 뷰에 최신 데이터를 반영하려면 나중에 새로 고침해야 합니다.
- `RefreshInfo.RefreshMethod`: Doris가 새로 고칠 데이터를 선택하는 방식입니다.
  - `COMPLETE`: 항상 구체화된 뷰 전체를 새로 고칩니다.
  - `PARTITIONS`: 변경된 구체화된 뷰 파티션을 다시 계산합니다.
  - `INCREMENTAL`: Incremental View Maintenance (IVM)를 사용하여 행 수준의 변경 사항을 처리합니다.
  - `AUTO`: Doris가 IVM, 파티션 새로 고침 또는 전체 새로 고침을 자동으로 선택합니다.
- `RefreshInfo.RefreshTrigger`: 새로 고침 작업을 트리거하는 조건입니다.
  - `MANUAL`: 새로 고침을 수동으로 트리거합니다.
  - `COMMIT`: 관련 기본 테이블의 데이터 변경으로 새로 고침이 트리거됩니다.
  - `SCHEDULE`: 일정에 따라 새로 고침이 트리거됩니다. 일정의 세부 정보는 `ON SCHEDULE` 뒤에 `RefreshInfo`의 일부로 표시됩니다.
- `MvPartitionInfo.partitionType`: 구체화된 뷰의 파티션 구성 방식입니다.
  - `FOLLOW_BASE_TABLE`: 구체화된 뷰의 파티션이 기본 테이블의 파티션 열을 따릅니다.
  - `SELF_MANAGE`: 구체화된 뷰가 자체 파티션을 관리합니다.
  - `EXPR`: 구체화된 뷰의 파티션이 표현식으로 정의됩니다.
- `SyncWithBaseTables`: 구체화된 뷰의 데이터가 기본 테이블과 동기화되어 있는지 여부입니다.
  - `1` 또는 `true`: 동기화되어 있습니다.
  - `0` 또는 `false`: 완전히 동기화되지 않았습니다. 파티션으로 나뉜 구체화된 뷰에서는 `SHOW PARTITIONS FROM <mv_name>`을 사용하여 파티션 수준의 동기화 상태를 확인하세요.
- `IvmBaseTableStreams`: IVM에서 사용하는 기본 테이블과 내부 Streams 간의 매핑입니다. 내부 Streams는 Doris가 관리하므로 수동으로 소비하거나 재설정하거나 삭제하지 마세요. [Incremental View Maintenance (IVM)](../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#internal-table-streams)를 참조하세요.

## 예제 {#examples}

데이터베이스 `test`의 구체화된 뷰를 조회합니다.

```sql
select *
from mv_infos("database"="test")
where Name = "mv1"\G
```
```text
*************************** 1. row ***************************
                Id: 19494
              Name: mv1
           JobName: inner_mtmv_19494
             State: NORMAL
SchemaChangeDetail:
      RefreshState: SUCCESS
       RefreshInfo: BUILD DEFERRED REFRESH AUTO ON MANUAL
          QuerySql: SELECT `internal`.`test`.`user`.`k2`, `internal`.`test`.`user`.`k3` FROM `internal`.`test`.`user`
      MvProperties: {partition_sync_limit=100, partition_sync_time_unit=YEAR}
   MvPartitionInfo: MTMVPartitionInfo{partitionType=FOLLOW_BASE_TABLE, relatedTable=user, relatedCol='k2', partitionCol='k2'}
SyncWithBaseTables: 1
IvmBaseTableStreams: \N
```

이 결과의 각 항목은 다음과 같습니다.

- `Id`와 `Name`은 구체화된 뷰를 식별합니다.
- `JobName`은 이 구체화된 뷰의 새로 고침 작업 이름입니다. 이 이름을 사용하여 작업이나 새로 고침 태스크를 쿼리할 수 있습니다. 예를 들어 `select * from jobs("type"="mv") where Name = "inner_mtmv_19494";`로 조회합니다.
- `State`는 `NORMAL`이며, 구체화된 뷰의 메타데이터가 정상임을 의미합니다. `INIT`는 구체화된 뷰가 방금 생성되었거나 초기화되었음을 의미합니다. `SCHEMA_CHANGE`는 기본 테이블의 스키마 변경이 이 구체화된 뷰에 영향을 주었음을 의미합니다. 이 상태에서는 `SchemaChangeDetail`을 확인하세요.
- `SchemaChangeDetail`은 비어 있습니다. `State`가 `SCHEMA_CHANGE`가 아니기 때문입니다.
- `RefreshState`는 `SUCCESS`이며, 최근 새로 고침이 성공했음을 의미합니다. `INIT`는 아직 성공한 새로 고침 상태가 기록되지 않았음을 의미합니다. `FAIL`은 최근 새로 고침이 실패했음을 의미합니다. `tasks("type"="mv")`를 `JobName`으로 쿼리하여 실패한 작업과 해당 작업의 `ErrorMsg`를 확인하세요.
- `RefreshInfo`는 `BUILD DEFERRED REFRESH AUTO ON MANUAL`입니다. `BUILD DEFERRED`는 생성 시 구체화된 뷰를 즉시 빌드하지 않았음을 의미합니다. `REFRESH AUTO`는 Doris가 모든 파티션을 새로 고칠지, 변경된 파티션만 새로 고칠지 결정함을 의미합니다. `ON MANUAL`은 일정에 따르지 않고 수동으로 새로 고침을 트리거함을 의미합니다.
- `QuerySql`은 구체화된 뷰의 쿼리 정의입니다.
- `MvProperties`는 구체화된 뷰의 속성을 보여 줍니다. 이 예제에서는 `partition_sync_limit=100`과 `partition_sync_time_unit=YEAR`로 파티션 동기화를 제한합니다.
- `MvPartitionInfo`는 구체화된 뷰의 파티션 구성 방식을 보여 줍니다. `FOLLOW_BASE_TABLE`은 구체화된 뷰가 기본 테이블의 파티션 열을 따름을 의미합니다. `SELF_MANAGE`는 구체화된 뷰가 자체 파티션을 관리함을 의미합니다. `EXPR`은 구체화된 뷰가 표현식 기반의 파티션 정의를 사용함을 의미합니다.
- `SyncWithBaseTables`는 `1`이며, 구체화된 뷰의 데이터가 기본 테이블과 동기화되어 있음을 의미합니다. `0`은 완전히 동기화되지 않았음을 의미합니다. 파티션으로 나뉜 구체화된 뷰에서는 `SHOW PARTITIONS FROM <mv_name>`을 사용하여 파티션 수준의 동기화 상태를 확인하세요.
- `IvmBaseTableStreams`는 비어 있습니다. 이 예제는 IVM을 사용하지 않기 때문입니다.

이 구체화된 뷰의 최근 새로 고침 작업을 조회하려면 다음을 실행합니다.

```sql
select *
from tasks("type"="mv")
where JobName = "inner_mtmv_19494"
order by CreateTime desc
limit 1;
```
