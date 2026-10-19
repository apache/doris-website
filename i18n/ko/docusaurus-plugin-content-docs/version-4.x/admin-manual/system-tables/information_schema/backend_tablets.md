---
{
    "title": "backend_tablets",
    "language": "ko",
    "description": "Backend의 Tablet 정보를 조회합니다. (doris 3.0.7에서 추가됨)"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## 개요 {#overview}

Backend의 Tablet 정보를 조회합니다. (doris 3.0.7에서 추가됨)

## 데이터베이스 {#database}


`information_schema`


## 테이블 정보 {#table-information}

| 컬럼 이름          | 타입         | 설명                             |
| ------------------ | ------------ | -------------------------------- |
| BE_ID              | bigint       | Backend ID                       |
| TABLET_ID          | bigint       | Tablet ID                        |
| REPLICA_ID         | bigint       | 복제본 ID                        |
| PARTITION_ID       | bigint       | 파티션 ID                        |
| TABLET_PATH        | varchar(256) | Tablet 경로                      |
| TABLET_LOCAL_SIZE  | bigint       | 로컬에 저장된 Tablet의 크기       |
| TABLET_REMOTE_SIZE | bigint       | 원격에 저장된 Tablet의 크기       |
| VERSION_COUNT      | bigint       | 버전 수                          |
| SEGMENT_COUNT      | bigint       | 세그먼트 크기                    |
| NUM_COLUMNS        | bigint       | 컬럼 수                          |
| ROW_SIZE           | bigint       | 행 크기                          |
| COMPACTION_SCORE   | int          | Compaction 점수                  |
| COMPRESS_KIND      | varchar(256) | 압축 유형                        |
| IS_USED            | bool         | Tablet의 datadir이 열려 있는지 여부 |
| IS_ALTER_FAILED    | bool         | alter 작업 실패 여부             |
| CREATE_TIME        | datetime     | Tablet 생성 시간                 |
| UPDATE_TIME        | datetime     | Tablet에 마지막으로 기록한 시간  |
| IS_OVERLAP         | bool         | Tablet 간 중첩 여부              |

## 컴퓨팅-스토리지 분리 모드에서의 데이터 크기 의미 {#data-size-semantics-in-compute-storage-decoupled-mode}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Capacity reconciliation in decoupled deployments -->

이 테이블의 정보는 BE가 직접 보고합니다. `TABLET_LOCAL_SIZE`와 `TABLET_REMOTE_SIZE`는 rowset이 실제로 저장된 위치에 따라 구분됩니다. 원격 스토리지에 저장된 rowset의 크기는 `TABLET_REMOTE_SIZE`에 포함됩니다. 컴퓨팅-스토리지 분리 모드에서는 데이터가 원격 스토리지에 저장되므로 데이터 크기는 `TABLET_REMOTE_SIZE`에 표시됩니다.

버전 4.0.8부터 [`SHOW TABLETS`](../../../sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET)와 [`information_schema.partitions`](./partitions)도 이 테이블과 동일한 기준을 따릅니다. 분리 모드에서는 데이터 크기를 일관되게 원격 데이터 크기로 보고합니다. 4.0.8 이전에는 세 가지 결과가 서로 일치하지 않을 수 있었습니다.
