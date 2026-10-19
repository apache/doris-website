---
{
    "title": "SHOW TABLET",
    "language": "ko",
    "description": "tablet 정보를 확인합니다. ID로 단일 tablet의 위치를 찾거나, 테이블 또는 파티션에 있는 모든 tablet의 복제본 배치, 버전, 데이터 크기를 나열합니다.",
    "keywords": [
        "SHOW TABLET",
        "SHOW TABLETS FROM",
        "Doris tablet 정보",
        "복제본 배치",
        "LocalDataSize",
        "RemoteDataSize",
        "CompactionStatus",
        "VersionCount",
        "tablet 문제 해결"
    ]
}
---

## 설명 {#description}

`SHOW TABLET`은 tablet 정보를 확인하는 관리자 전용 명령으로, 두 가지 형식이 있습니다:

- `SHOW TABLET <tablet_id>`: 주어진 tablet ID로 해당 tablet이 속한 데이터베이스, 테이블, 파티션, 인덱스를 조회합니다.
- `SHOW TABLETS FROM <table_name>`: 테이블 전체 또는 특정 파티션에 있는 모든 tablet의 복제본 배치, 버전, 데이터 크기, compaction 상태를 나열합니다.

두 형식은 흔히 함께 사용합니다. 첫 번째 형식으로 tablet을 찾은 다음, 두 번째 형식으로 같은 파티션의 다른 복제본을 확인합니다.

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Replica status troubleshooting / Data skew analysis / Compaction troubleshooting -->

:::info 참고

두 문 모두 Internal Catalog의 테이블만 지원합니다. External Catalog는 지원하지 않습니다.

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

> 필수. 조회할 tablet의 ID입니다.

### SHOW TABLETS FROM {#show-tablets-from}

**1. `<table_name>`**

> 필수. 테이블 이름입니다. `db_name.table_name` 형식을 지원합니다.

**2. `PARTITIONS ( <partition_name> [, ... ] )`**

> 선택 사항. 결과를 지정한 파티션으로 제한합니다. 생략하면 테이블의 모든 파티션을 확인합니다.

**3. `WHERE <where_condition>`**

> 선택 사항. 필터 조건입니다. 다음 세 필드에 대한 동등 비교만 지원하며, `AND`로 결합할 수 있습니다:
>
> | 필드 | 타입 | 설명 |
> | --- | --- | --- |
> | `Version` | Integer | 복제본 버전으로 필터링 |
> | `BackendId` | Integer | 복제본이 배치된 BE 노드의 ID로 필터링 |
> | `State` | String | 복제본 상태로 필터링: `NORMAL`, `ROLLUP`, `CLONE`, `DECOMMISSION` |
>
> 다른 필드, 동등 비교 이외의 비교 연산, `OR`를 사용하면 모두 오류가 발생합니다:
>
> ```text
> Where clause should looks like: Version = "version", or state = "NORMAL|ROLLUP|CLONE|DECOMMISSION", or BackendId = 10000 or compound predicate with operator AND
> ```

**4. `ORDER BY <column_name>`**

> 선택 사항. 결과의 열을 기준으로 정렬합니다. 정렬 기준 열은 아래의 "반환 값"에 나열된 열 중 하나여야 합니다.
>
> `ORDER BY`를 지정하면 Doris는 정렬 전에 모든 tablet을 수집하므로, 결과는 **전역적으로 정렬된** Top-N입니다.

**5. `LIMIT [ <offset>, ] <row_count>`**

> 선택 사항. 반환할 행 수를 제한합니다. 테이블에 tablet이 많을 때 사용하는 것이 좋습니다.
>
> `LIMIT`와 `OFFSET`은 정렬 후에 적용됩니다. `ORDER BY`가 없으면 필요한 수의 행을 수집하는 즉시 스캔을 중단하며, 결과는 `(TabletId, ReplicaId)` 순으로 정렬된 앞부분의 행들입니다.

:::caution 동작 변경 (4.1.4)

- 4.1.4 이전에는 `ORDER BY`가 스캔 중 먼저 도달한 행만 정렬할 수 있었으므로, 결과가 실제 전역 Top-N이 아니었습니다. 4.1.4부터는 정렬 전에 모든 tablet을 수집합니다.
- 4.1.4 이전에는 `OFFSET`만 단독으로 지정하면(양수 `LIMIT` 없이) 무시되었으며, `OFFSET`이 전체 행 수보다 크면 결과 전체가 비워졌습니다. 4.1.4부터는 `OFFSET`이 항상 적용됩니다.

:::

## 반환 값 {#return-value}

### SHOW TABLET {#show-tablet-1}

| 열            | 데이터 타입 | 설명                                                                   |
|---------------|----------|------------------------------------------------------------------------|
| DbName        | String   | tablet이 속한 데이터베이스의 이름.                                     |
| TableName     | String   | tablet이 속한 테이블의 이름.                                           |
| PartitionName | String   | tablet이 속한 파티션의 이름.                                           |
| IndexName     | String   | tablet이 속한 인덱스의 이름.                                           |
| DbId          | Int      | 데이터베이스의 ID.                                                     |
| TableId       | Int      | 테이블의 ID.                                                           |
| PartitionId   | Int      | 파티션의 ID.                                                           |
| IndexId       | Int      | 인덱스의 ID.                                                           |
| IsSync        | Boolean  | tablet이 복제본과 동기화되어 있는지 여부.                               |
| Order         | Int      | 인덱스 내 tablet의 순서.                                               |
| QueryHits     | Int      | 이 tablet의 쿼리 적중 횟수.                                            |
| WindowAccessCount | Int  | 슬라이딩 통계 윈도우 내에서 이 tablet에 접근한 횟수.                    |
| LastAccessTime| Int      | 이 tablet에 마지막으로 접근한 시점의 타임스탬프(밀리초). 접근한 적이 없으면 `0`. |
| DetailCmd     | String   | tablet의 상세 정보를 확인하는 명령.                                    |

### SHOW TABLETS FROM {#show-tablets-from-1}

각 행은 복제본 하나에 해당하므로, 동일한 `TabletId`가 복제본마다 한 번씩 나타납니다.

| 열 | 데이터 타입 | 설명 |
|---|---|---|
| TabletId | Int | tablet ID |
| ReplicaId | Int | 복제본 ID |
| BackendId | Int | 복제본이 배치된 BE 노드의 ID |
| SchemaHash | Int | 복제본의 스키마 해시 |
| Version | Int | 복제본의 현재 가시 버전 |
| LstSuccessVersion | Int | 마지막으로 데이터 적재에 성공한 버전 |
| LstFailedVersion | Int | 마지막으로 실패한 버전. `-1`은 실패한 버전이 없음을 의미 |
| LstFailedTime | String | 마지막 버전 실패 시각. 없으면 `\N` |
| LocalDataSize | Int | 복제본의 로컬 데이터 크기(바이트). 컴퓨팅-스토리지 분리 모드에서는 일반적으로 `0`이며, 아래의 "분리 모드에서 데이터 크기가 의미하는 바" 참조 |
| RemoteDataSize | Int | 복제본의 원격 데이터 크기(바이트) |
| RowCount | Int | 복제본의 행 수 |
| State | String | 복제본 상태: `NORMAL`, `ROLLUP`, `CLONE`, `DECOMMISSION` |
| LstConsistencyCheckTime | String | 마지막 일관성 검사 시각. 검사한 적이 없으면 `\N` |
| CheckVersion | Int | 마지막 일관성 검사 버전. `-1`은 검사한 적이 없음을 의미 |
| VisibleVersionCount | Int | 복제본의 가시 버전 수 |
| VersionCount | Int | 복제본의 전체 버전 수. compaction이 지연되는지 판단하는 데 유용 |
| QueryHits | Int | 이 복제본의 쿼리 적중 횟수 |
| WindowAccessCount | Int | 슬라이딩 통계 윈도우 내에서 이 tablet에 접근한 횟수 |
| LastAccessTime | Int | 이 tablet에 마지막으로 접근한 시점의 타임스탬프(밀리초). 접근한 적이 없으면 `0` |
| PathHash | Int | 복제본이 저장된 데이터 디렉터리의 해시 |
| Path | String | 복제본이 저장된 BE 데이터 루트 디렉터리. 경로를 확인할 수 없으면 빈 값 |
| MetaUrl | String | 복제본 메타데이터를 확인하기 위한 HTTP 주소. 형식: `http://<be_host>:<be_http_port>/api/meta/header/<tablet_id>` |
| CompactionStatus | String | 복제본의 compaction 상태를 확인하기 위한 HTTP 주소. 형식: `http://<be_host>:<be_http_port>/api/compaction/show?tablet_id=<tablet_id>` |
| CooldownReplicaId | Int | Cooldown 복제본 ID. 계층형 스토리지를 사용하지 않으면 `-1` |
| CooldownMetaId | String | Cooldown 메타데이터 ID. 계층형 스토리지를 사용하지 않으면 빈 값 |
| PrimaryBackendId | Int | 이 tablet의 기본 BE 노드 ID. **컴퓨팅-스토리지 분리 모드에서만 반환됨** |

### 분리 모드에서 데이터 크기가 의미하는 바 {#data-size-semantics-in-decoupled-mode}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Capacity reconciliation in decoupled deployments -->

:::caution 동작 변경 (4.0.8)

4.0.8 버전부터 컴퓨팅-스토리지 분리 모드의 복제본 데이터 크기는 일관되게 **원격** 기준으로 보고됩니다. 복제본 통계에서 원격으로 기록하지 않은 데이터 크기도 `RemoteDataSize`에 포함되며, 해당 `LocalDataSize`는 `0`으로 보고됩니다. 따라서 분리 모드 클러스터에서는 일반적으로 `LocalDataSize`가 `0`으로 표시되고, 실제 데이터 크기는 `RemoteDataSize`에 표시됩니다.

4.0.8 이전에는 이 데이터 크기가 `LocalDataSize`에 포함되어, 로컬과 원격 데이터 크기에 대해 `SHOW TABLETS`, [`information_schema.partitions`](../../../../admin-manual/system-tables/information_schema/partitions), [`information_schema.backend_tablets`](../../../../admin-manual/system-tables/information_schema/backend_tablets)가 서로 일치하지 않는 정보를 제공했습니다. 이 변경은 크기를 보고하는 방식만 조정하며, 데이터의 저장 위치나 실제 크기는 바꾸지 않습니다.

:::

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다:

| 권한       | 대상     | 설명                                                                                     |
|:-----------|:---------|:-----------------------------------------------------------------------------------------|
| Admin_priv | 전역     | 두 문 모두 전역 `ADMIN` 권한이 필요합니다. 권한이 없으면 `Access denied` 오류가 발생합니다. |

## 예제 {#examples}

### ID로 단일 tablet 확인 {#inspect-a-single-tablet-by-its-id}

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

`SHOW PROC` 문은 `DetailCmd` 열에 표시되며, 이 문으로 해당 tablet의 복제본을 더 자세히 확인할 수 있습니다.

### 테이블의 모든 tablet 나열 {#list-every-tablet-of-a-table}

```sql
SHOW TABLETS FROM example_db.sell_user;
```

### 결과를 특정 파티션으로 제한 {#restrict-the-result-to-specific-partitions}

```sql
SHOW TABLETS FROM example_db.sell_user PARTITIONS(p202601, p202602);
```

### 복제본 상태와 배치 노드로 필터링 {#filter-by-replica-state-and-hosting-node}

```sql
SHOW TABLETS FROM example_db.sell_user WHERE State = "NORMAL" AND BackendId = 10003;
```

### compaction이 지연되는 tablet 찾기 {#find-tablets-where-compaction-is-lagging}

버전 수를 기준으로 내림차순 정렬하면 compaction 부하가 가장 큰 tablet을 찾을 수 있습니다:

```sql
SHOW TABLETS FROM example_db.sell_user ORDER BY VersionCount DESC LIMIT 10;
```

결과의 `CompactionStatus` 열은 HTTP 주소입니다. 브라우저에서 이 주소를 열면 해당 복제본의 자세한 compaction 상태를 확인할 수 있습니다.

### 데이터 편향 찾기 {#find-data-skew}

데이터 크기를 기준으로 내림차순 정렬하면 나머지보다 눈에 띄게 큰 tablet을 빠르게 찾을 수 있습니다:

```sql
-- Integrated storage-compute mode
SHOW TABLETS FROM example_db.sell_user ORDER BY LocalDataSize DESC LIMIT 10;

-- Compute-storage decoupled mode (data size is reported in RemoteDataSize)
SHOW TABLETS FROM example_db.sell_user ORDER BY RemoteDataSize DESC LIMIT 10;
```
