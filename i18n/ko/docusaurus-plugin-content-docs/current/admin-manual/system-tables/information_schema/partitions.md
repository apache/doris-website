---
{
    "title": "partitions",
    "language": "ko",
    "description": "데이터베이스에 있는 모든 테이블의 파티션 상태를 표시합니다."
}
---

## 개요 {#overview}

데이터베이스에 있는 모든 테이블의 파티션 상태를 표시합니다.

## 데이터베이스 {#database}

`information_schema`

## 테이블 정보 {#table-information}

| 열 이름                       | 유형          | 설명                                 |
| ----------------------------- | ------------- | ------------------------------------ |
| PARTITION_ID	                | bigint        | 파티션 ID                            |
| TABLE_CATALOG                 | varchar(64)   | Catalog 이름                         |
| TABLE_SCHEMA                  | varchar(64)   | 데이터베이스 이름                    |
| TABLE_NAME                    | varchar(64)   | 테이블 이름                          |
| PARTITION_NAME                | varchar(64)   | 파티션 이름                          |
| SUBPARTITION_NAME             | varchar(64)   | 항상 비어 있음                       |
| PARTITION_ORDINAL_POSITION    | int           | 파티션의 순서상 위치                 |
| SUBPARTITION_ORDINAL_POSITION | int           | 항상 비어 있음                       |
| PARTITION_METHOD              | varchar(13)   | 파티션 방식                          |
| SUBPARTITION_METHOD           | varchar(13)   | 항상 비어 있음                       |
| PARTITION_EXPRESSION          | varchar(2048) | 파티션 표현식                        |
| SUBPARTITION_EXPRESSION       | varchar(2048) | 항상 비어 있음                       |
| PARTITION_DESCRIPTION         | text          | 파티션 설명                          |
| TABLE_ROWS                    | bigint        |                                      |
| AVG_ROW_LENGTH                | bigint        |                                      |
| DATA_LENGTH                   | bigint        |                                      |
| MAX_DATA_LENGTH               | bigint        |                                      |
| INDEX_LENGTH                  | bigint        |                                      |
| DATA_FREE                     | bigint        |                                      |
| CREATE_TIME                   | bigint        |                                      |
| UPDATE_TIME                   | datetime      |                                      |
| CHECK_TIME                    | datetime      |                                      |
| CHECKSUM                      | bigint        |                                      |
| PARTITION_COMMENT             | text          |                                      |
| NODEGROUP                     | varchar(256)  |                                      |
| TABLESPACE_NAME               | varchar(268)  |                                      |
| LOCAL_DATA_SIZE               | text	        | 파티션의 로컬 데이터 크기. 컴퓨팅과 스토리지 분리 모드에서는 일반적으로 `0`이며, 아래 설명 참조 |
| REMOTE_DATA_SIZE              | text          | 파티션의 원격 데이터 크기(클라우드)   |
| STATE                         | text	        | 파티션 상태                          |
| REPLICA_ALLOCATION  	        | text	        | 태블릿 복제본의 배치 정보. 컴퓨팅과 스토리지 분리 모드에서는 `NULL` |
| REPLICA_NUM                   | int 	        | 복제본 수                            |
| STORAGE_POLICY                | text          | 스토리지 정책                        |
| STORAGE_MEDIUM                | text          | 저장 매체                            |
| COOLDOWN_TIME_MS              | text          | 쿨다운 시간                          |
| LAST_CONSISTENCY_CHECK_TIME   | text          | 마지막 일관성 검사 시간              |
| BUCKET_NUM                    | int           | 파티션 버킷 수                       |
| COMMITTED_VERSION             | bigint        | 마지막으로 커밋된 버전               |
| VISIBLE_VERSION               | bigint        | 현재 표시되는 버전                   |
| PARTITION_KEY                 | text          | 파티션 키                            |
| RANGE                         | text          | 파티션 범위(최솟값, 최댓값)           |
| DISTRIBUTION                  | text          | 분산 유형                            |

## 컴퓨팅과 스토리지 분리 모드에서 데이터 크기의 의미 {#data-size-semantics-in-compute-storage-decoupled-mode}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Capacity reconciliation in decoupled deployments / Partition data size statistics -->

:::caution 동작 변경 (4.0.8)

4.0.8 버전부터 컴퓨팅과 스토리지 분리 모드의 파티션 데이터 크기는 일관되게 **원격** 데이터 크기로 집계됩니다. 복제본 통계에서 원격으로 기록하지 않은 데이터 크기는 `REMOTE_DATA_SIZE`에 합산되며, 이에 대응하는 `LOCAL_DATA_SIZE`는 `0`으로 표시됩니다. 따라서 분리형 클러스터에서는 일반적으로 `LOCAL_DATA_SIZE`가 `0`으로 표시되고, 실제 파티션 데이터 크기는 `REMOTE_DATA_SIZE`에 표시됩니다.

4.0.8 이전에는 이 데이터 크기가 `LOCAL_DATA_SIZE`에 합산되어, `information_schema.partitions`, [`SHOW TABLETS`](../../../sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET), [`information_schema.backend_tablets`](./backend_tablets) 사이에서 로컬 및 원격 데이터 크기가 서로 일치하지 않았습니다. 이 변경은 크기를 표시하는 방식만 조정하며, 데이터의 저장 위치나 실제 크기는 바꾸지 않습니다.

이 변경에 따라 분리 모드의 `REPLICA_ALLOCATION`은 `information_schema.partitions`에서 `NULL`로 표시됩니다(이전에는 내부 자리 표시자인 `\N`으로 표시됨). 복제본 배치는 분리형 아키텍처 자체에서 관리하며, 더 이상 통합 모드의 복제본 할당 규칙을 따르지 않습니다.

:::

파티션이 실제로 차지하는 공간을 계산할 때는 분리 모드에서 `REMOTE_DATA_SIZE`를 사용합니다.

```sql
SELECT
    TABLE_SCHEMA,
    TABLE_NAME,
    PARTITION_NAME,
    LOCAL_DATA_SIZE,
    REMOTE_DATA_SIZE
FROM information_schema.partitions
WHERE TABLE_SCHEMA = 'your_db';
```
