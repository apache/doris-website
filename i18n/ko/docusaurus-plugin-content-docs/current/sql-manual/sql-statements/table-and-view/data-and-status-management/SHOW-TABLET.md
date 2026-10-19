---
{
    "title": "SHOW TABLET",
    "language": "ko",
    "description": "태블릿 정보를 조회합니다. ID로 단일 태블릿의 위치를 확인하거나 테이블 또는 파티션에 속한 모든 태블릿의 복제본 배치, 버전 및 데이터 크기를 나열합니다.",
    "keywords": [
        "SHOW TABLET",
        "SHOW TABLETS FROM",
        "Doris 태블릿 정보",
        "복제본 배치",
        "LocalDataSize",
        "RemoteDataSize",
        "CompactionStatus",
        "VersionCount",
        "태블릿 문제 해결"
    ]
}
---

## 설명 {#description}

`SHOW TABLET`은 태블릿 정보를 조회하는 구문으로, 관리자만 사용할 수 있으며 다음 두 가지 형식이 있습니다.

- `SHOW TABLET <tablet_id>`: 태블릿 ID를 지정하여 해당 태블릿이 속한 데이터베이스, 테이블, 파티션 및 인덱스를 조회합니다.
- `SHOW TABLETS FROM <table_name>`: 테이블 또는 특정 파티션에 속한 모든 태블릿의 복제본 배치, 버전, 데이터 크기 및 컴팩션 상태를 나열합니다.

두 형식은 함께 사용하는 경우가 많습니다. 먼저 첫 번째 형식으로 태블릿의 위치를 확인한 다음, 두 번째 형식으로 같은 파티션에 있는 다른 복제본을 조회합니다.

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Replica status troubleshooting / Data skew analysis / Compaction troubleshooting -->

:::info 참고

두 구문 모두 Internal Catalog의 테이블만 지원합니다. External Catalog는 지원하지 않습니다.

:::

## 구문 {#syntax}

```sql
-- Inspect a single tablet by its id
SHOW TABLET <tablet_id>

-- List every tablet of a table
SHOW TABLETS FROM <table_name>
    [ PARTITIONS ( <partition_name> [, ... ] ) ]
    [ WHERE <where_condition> ]
    [ ORDER BY <column_name> [ ASC | DESC ] [, ... ] ]
    [ LIMIT [ <offset>, ] <row_count> ]
```

## 매개변수 {#parameters}

### SHOW TABLET {#show-tablet}

**1. `<tablet_id>`**

> 필수 항목입니다. 조회할 태블릿의 ID입니다.

### SHOW TABLETS FROM {#show-tablets-from}

**1. `<table_name>`**

> 필수 항목입니다. 테이블 이름입니다. `db_name.table_name` 형식을 지원합니다.

**2. `PARTITIONS ( <partition_name> [, ... ] )`**

> 선택 항목입니다. 결과를 지정한 파티션으로 제한합니다. 생략하면 테이블의 모든 파티션을 조회합니다.

**3. `WHERE <where_condition>`**

> 선택 항목입니다. 필터 조건입니다. 다음 세 필드에 대한 동등 비교만 지원하며, `AND`로 결합할 수 있습니다.
>
> | 필드 | 타입 | 설명 |
> | --- | --- | --- |
> | `Version` | Integer | 복제본 버전으로 필터링합니다 |
> | `BackendId` | Integer | 복제본이 위치한 BE 노드 ID로 필터링합니다 |
> | `State` | String | 복제본 상태로 필터링합니다: `NORMAL`, `ROLLUP`, `CLONE`, `DECOMMISSION` |
>
> 다른 필드, 동등 비교가 아닌 비교 연산, `OR`를 사용하면 모두 오류가 발생합니다.
>
> ```text
> Where clause should looks like: Version = "version", or state = "NORMAL|ROLLUP|CLONE|DECOMMISSION", or BackendId = 10000 or compound predicate with operator AND
> ```

**4. `ORDER BY <column_name>`**

> 선택 항목입니다. 결과의 컬럼을 기준으로 정렬합니다. 정렬 컬럼은 아래의 "반환 값"에 나열된 컬럼 중 하나여야 합니다.
>
> `ORDER BY`를 지정하면 Doris는 모든 태블릿을 수집한 후 정렬하므로, 결과는 **전체를 기준으로 정렬된** Top-N입니다.

**5. `LIMIT [ <offset>, ] <row_count>`**

> 선택 항목입니다. 반환할 행 수를 제한합니다. 테이블에 태블릿이 많은 경우 사용을 권장합니다.
>
> `LIMIT`과 `OFFSET`은 정렬 후에 적용됩니다. `ORDER BY`가 없으면 필요한 수의 행을 수집하는 즉시 스캔을 중단합니다. `LIMIT`이 있으면 스캔 순서상 앞부분의 행이 반환되고, `LIMIT`이 없으면 전체 결과가 `(TabletId, ReplicaId)` 순서로 정렬됩니다.

:::caution 동작 변경 (4.1.4)

- 4.1.4 이전에는 `ORDER BY`가 스캔에서 먼저 도달한 행만 정렬할 수 있었으므로, 결과가 실제 전체 데이터의 Top-N이 아닐 수 있었습니다. 4.1.4부터는 모든 태블릿을 수집한 후 정렬합니다.
- 4.1.4 이전에는 `OFFSET`을 단독으로 지정하면(양수인 `LIMIT` 없이) 무시되었으며, `OFFSET`이 전체 행 수보다 크면 결과가 모두 비워졌습니다. 4.1.4부터는 `OFFSET`이 항상 적용됩니다.

:::

## 반환 값 {#return-value}

### SHOW TABLET {#show-tablet-1}

| 컬럼        | 데이터 타입 | 설명                                                                   |
|---------------|----------|------------------------------------------------------------------------|
| DbName        | String   | 태블릿이 속한 데이터베이스의 이름입니다.                     |
| TableName     | String   | 태블릿이 속한 테이블의 이름입니다.                        |
| PartitionName | String   | 태블릿이 속한 파티션의 이름입니다.                    |
| IndexName     | String   | 태블릿이 속한 인덱스의 이름입니다.                        |
| DbId          | Int      | 데이터베이스의 ID입니다.                                                |
| TableId       | Int      | 테이블의 ID입니다.                                                   |
| PartitionId   | Int      | 파티션의 ID입니다.                                               |
| IndexId       | Int      | 인덱스의 ID입니다.                                                   |
| IsSync        | Boolean  | 태블릿이 복제본과 동기화되어 있는지 여부입니다.                       |
| Order         | Int      | 인덱스 내에서 태블릿의 순서입니다.                              |
| QueryHits     | Int      | 이 태블릿의 쿼리 적중 횟수입니다.                               |
| WindowAccessCount | Int  | 슬라이딩 통계 윈도우 내에서 이 태블릿에 접근한 횟수입니다. |
| LastAccessTime| Int      | 이 태블릿에 마지막으로 접근한 시각의 밀리초 단위 타임스탬프입니다. 접근한 적이 없으면 `0`입니다. |
| DetailCmd     | String   | 태블릿의 상세 정보를 조회하는 명령입니다.         |

### SHOW TABLETS FROM {#show-tablets-from-1}

각 행은 하나의 복제본에 해당하므로, 동일한 `TabletId`가 복제본마다 한 번씩 나타납니다.

| 컬럼 | 데이터 타입 | 설명 |
|---|---|---|
| TabletId | Int | 태블릿 ID |
| ReplicaId | Int | 복제본 ID |
| BackendId | Int | 복제본이 위치한 BE 노드의 ID |
| SchemaHash | Int | 복제본의 스키마 해시 |
| Version | Int | 복제본의 현재 가시 버전 |
| LstSuccessVersion | Int | 마지막으로 데이터 적재에 성공한 버전 |
| LstFailedVersion | Int | 마지막으로 실패한 버전. `-1`은 실패한 버전이 없음을 의미합니다 |
| LstFailedTime | String | 마지막 버전 실패 시각. 실패한 적이 없으면 `\N`입니다 |
| LocalDataSize | Int | 복제본의 로컬 데이터 크기(바이트 단위). 컴퓨팅-스토리지 분리 모드에서는 일반적으로 `0`이며, 아래의 "분리 모드에서의 데이터 크기 의미"를 참조하세요 |
| RemoteDataSize | Int | 복제본의 원격 데이터 크기(바이트 단위) |
| RowCount | Int | 복제본의 행 수 |
| State | String | 복제본 상태: `NORMAL`, `ROLLUP`, `CLONE`, `DECOMMISSION` |
| LstConsistencyCheckTime | String | 마지막 일관성 검사 시각. 검사한 적이 없으면 `\N`입니다 |
| CheckVersion | Int | 마지막 일관성 검사의 버전. `-1`은 검사한 적이 없음을 의미합니다 |
| VisibleVersionCount | Int | 복제본의 가시 버전 수 |
| VersionCount | Int | 복제본의 전체 버전 수. 컴팩션이 지연되는지 판단하는 데 유용합니다 |
| QueryHits | Int | 이 복제본의 쿼리 적중 횟수 |
| WindowAccessCount | Int | 슬라이딩 통계 윈도우 내에서 이 태블릿에 접근한 횟수 |
| LastAccessTime | Int | 이 태블릿에 마지막으로 접근한 시각의 밀리초 단위 타임스탬프. 접근한 적이 없으면 `0`입니다 |
| PathHash | Int | 복제본이 위치한 데이터 디렉터리의 해시 |
| Path | String | 복제본이 위치한 BE 데이터 루트 디렉터리. 경로를 확인할 수 없으면 비어 있습니다 |
| MetaUrl | String | 복제본 메타데이터를 조회하는 HTTP 주소. 형식은 `http://<be_host>:<be_http_port>/api/meta/header/<tablet_id>`입니다 |
| CompactionStatus | String | 복제본의 컴팩션 상태를 조회하는 HTTP 주소. 형식은 `http://<be_host>:<be_http_port>/api/compaction/show?tablet_id=<tablet_id>`입니다 |
| CooldownReplicaId | Int | Cooldown 복제본 ID. 계층형 스토리지가 활성화되지 않았으면 `-1`입니다 |
| CooldownMetaId | String | Cooldown 메타데이터 ID. 계층형 스토리지가 활성화되지 않았으면 비어 있습니다 |
| PrimaryBackendId | Int | 이 태블릿의 기본 BE 노드 ID. **컴퓨팅-스토리지 분리 모드에서만 반환됩니다** |

### 분리 모드에서의 데이터 크기 의미 {#data-size-semantics-in-decoupled-mode}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Capacity reconciliation in decoupled deployments -->

:::caution 동작 변경 (4.0.8)

버전 4.0.8부터 컴퓨팅-스토리지 분리 모드의 복제본 데이터 크기는 일관되게 **원격** 데이터로 보고됩니다. 복제본 통계에서 원격 데이터로 기록되지 않은 데이터 크기는 `RemoteDataSize`에 포함되며, 이에 대응하는 `LocalDataSize`는 `0`으로 보고됩니다. 따라서 분리형 클러스터에서는 일반적으로 `LocalDataSize`가 `0`으로 표시되고, 실제 데이터 크기는 `RemoteDataSize`에 표시됩니다.

4.0.8 이전에는 해당 데이터 크기가 `LocalDataSize`에 포함되어, `SHOW TABLETS`, [`information_schema.partitions`](../../../../admin-manual/system-tables/information_schema/partitions), [`information_schema.backend_tablets`](../../../../admin-manual/system-tables/information_schema/backend_tablets) 간에 로컬 및 원격 데이터 크기에 대한 보고가 서로 일치하지 않았습니다. 이 변경은 크기를 보고하는 방식만 조정하며, 데이터의 저장 위치나 양은 바꾸지 않습니다.

:::

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자에게는 최소한 다음 권한이 있어야 합니다.

| 권한  | 객체   | 설명                                                                                    |
|:-----------|:---------|:-----------------------------------------------------------------------------------------|
| Admin_priv | Global   | 두 구문 모두 전역 `ADMIN` 권한이 필요합니다. 그렇지 않으면 `Access denied` 오류가 발생합니다. |

## 예제 {#examples}

### ID로 단일 태블릿 조회 {#inspect-a-single-tablet-by-its-id}

```sql
SHOW TABLET 10145;
```

```text
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+-------------------+----------------+------------------------------------------------------------+
| DbName | TableName | PartitionName | IndexName | DbId  | TableId | PartitionId | IndexId | IsSync | Order | QueryHits | WindowAccessCount | LastAccessTime | DetailCmd                                                  |
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+-------------------+----------------+------------------------------------------------------------+
| test   | sell_user | sell_user     | sell_user | 10103 | 10143   | 10142       | 10144   | true   | 0     | 0         | 0                 | 0              | SHOW PROC '/dbs/10103/10143/partitions/10142/10144/10145'; |
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+-------------------+----------------+------------------------------------------------------------+
```

`SHOW PROC` 구문은 `DetailCmd` 컬럼에 표시되며, 해당 태블릿의 복제본 정보를 더 자세히 조회하는 데 사용합니다.

### 테이블의 모든 태블릿 나열 {#list-every-tablet-of-a-table}

```sql
SHOW TABLETS FROM example_db.sell_user;
```

### 결과를 특정 파티션으로 제한 {#restrict-the-result-to-specific-partitions}

```sql
SHOW TABLETS FROM example_db.sell_user PARTITIONS(p202601, p202602);
```

### 복제본 상태와 호스팅 노드로 필터링 {#filter-by-replica-state-and-hosting-node}

```sql
SHOW TABLETS FROM example_db.sell_user WHERE State = "NORMAL" AND BackendId = 10003;
```

### 컴팩션이 지연되는 태블릿 찾기 {#find-tablets-where-compaction-is-lagging}

버전 수를 기준으로 내림차순 정렬하면 컴팩션 부하가 가장 큰 태블릿을 확인할 수 있습니다.

```sql
SHOW TABLETS FROM example_db.sell_user ORDER BY VersionCount DESC LIMIT 10;
```

결과의 `CompactionStatus` 컬럼은 HTTP 주소입니다. 브라우저에서 이 주소를 열면 해당 복제본의 상세 컴팩션 상태를 확인할 수 있습니다.

### 데이터 편향 찾기 {#find-data-skew}

데이터 크기를 기준으로 내림차순 정렬하면 다른 태블릿보다 눈에 띄게 큰 태블릿을 빠르게 확인할 수 있습니다.

```sql
-- Integrated storage-compute mode
SHOW TABLETS FROM example_db.sell_user ORDER BY LocalDataSize DESC LIMIT 10;

-- Compute-storage decoupled mode (data size is reported in RemoteDataSize)
SHOW TABLETS FROM example_db.sell_user ORDER BY RemoteDataSize DESC LIMIT 10;
```
