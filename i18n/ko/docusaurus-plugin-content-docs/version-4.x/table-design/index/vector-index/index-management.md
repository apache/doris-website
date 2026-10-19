---
{
    "title": "ANN 인덱스 관리",
    "language": "ko",
    "description": "Apache Doris ANN 벡터 인덱스의 생성, 빌드, 조회 및 삭제를 위한 전체 SQL 작업 가이드로, HNSW, IVF 및 양자화 매개변수 설명을 포함합니다.",
    "keywords": [
        "ANN 인덱스",
        "벡터 인덱스 관리",
        "HNSW",
        "IVF",
        "벡터 유사도 검색",
        "Doris 벡터 검색",
        "BUILD INDEX",
        "스칼라 양자화 SQ",
        "곱 양자화 PQ"
    ]
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

<!-- Knowledge type: Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Vector retrieval table creation / Index operations / Performance tuning -->

# ANN 인덱스 관리 {#ann-index-management}

Apache Doris의 근사 최근접 이웃(ANN) 인덱스는 고차원 벡터 열에서 벡터 유사도 검색을 효율적으로 수행하는 데 사용됩니다. Doris 4.x부터 일반 인덱스 작업 구문에서 ANN 인덱스를 지원합니다. 이 문서에서는 ANN 인덱스와 관련된 SQL 작업 구문과 매개변수를 설명합니다.

## 빠른 탐색 {#quick-navigation}

사용 사례에 따라 해당 섹션으로 이동할 수 있습니다.

| 사용 사례                                              | 섹션                                            |
| ----------------------------------------------------- | -------------------------------------------------- |
| 벡터 열에 인덱스를 처음 생성 | [ANN 인덱스 생성](#create-an-ann-index)        |
| 기존 데이터에 인덱스를 오프라인으로 빌드               | [ANN 인덱스 빌드](#build-an-ann-index)          |
| 기존 인덱스와 매개변수 설정 조회    | [ANN 인덱스 조회](#view-an-ann-index)            |
| 더 이상 필요하지 않은 인덱스 삭제                | [ANN 인덱스 삭제](#drop-an-ann-index)            |
| HNSW, IVF 등의 특정 알고리즘 또는 양자화기 선택 | [인덱스 매개변수](#index-parameters)      |

## 사전 요구 사항 {#prerequisites}

ANN 인덱스를 생성하기 전에 다음 사항을 확인하세요.

-   벡터 열의 데이터 타입이 `ARRAY<FLOAT> NOT NULL`이어야 합니다.
-   적절한 거리 측정 유형을 선택해야 합니다. `l2_distance`(유클리드 거리) 또는 `inner_product`를 사용할 수 있습니다.
-   데이터 규모와 재현율/성능 요구 사항에 따라 인덱스 알고리즘(HNSW, IVF 또는 IVF On-Disk)을 선택해야 합니다.

## ANN 인덱스 생성 {#create-an-ann-index}

Doris는 ANN 인덱스를 생성하는 두 가지 방법을 제공합니다. 데이터가 이미 적재되었는지에 따라 선택하세요.

| 방법                                | 적용 상황                                                  | 인덱스 빌드 시점                |
| ------------------------------------- | -------------------------------------------------------------------- | -------------------------------------- |
| 테이블 생성 시 인덱스 정의 | 테이블이 아직 생성되지 않았거나, 데이터가 기록될 때마다 인덱스를 계속 빌드해야 하는 경우 | 데이터 적재 중 동기적으로 빌드   |
| 인덱스 생성과 빌드를 별도로 수행 | 테이블에 데이터가 이미 존재하며, 나중에 인덱스를 추가해야 하는 경우 | `BUILD INDEX`로 비동기적으로 빌드 |

### 방법 1: 테이블 생성 시 인덱스 정의 {#method-1-define-the-index-when-creating-the-table}

ANN 인덱스는 `INDEX ... USING ANN`을 사용하여 `CREATE TABLE` 문의 열 정의 뒤에 직접 선언합니다. 데이터가 적재될 때 인덱스가 동기적으로 빌드됩니다.

```sql
CREATE TABLE [IF NOT EXISTS] <table_name> (
    <columns_definition>
    INDEX <index_name> (<vector_column>) USING ANN PROPERTIES (
        "<key>" = "<value>" [, ...]
    )
)
...
```

### 방법 2: 인덱스를 별도로 생성 {#method-2-create-the-index-separately}

기존 테이블에서는 `CREATE INDEX` 또는 `ALTER TABLE ADD INDEX`로 ANN 인덱스를 추가한 다음, [BUILD INDEX](#build-an-ann-index)를 사용하여 기존 데이터에 인덱스를 빌드합니다.

```sql
CREATE INDEX [IF NOT EXISTS] <index_name>
             ON <table_name> (<column_name>)
             USING ANN
             PROPERTIES ("<key>" = "<value>" [, ...])
             [COMMENT '<index_comment>']

-- Or

ALTER TABLE <table_name> ADD INDEX <index_name>(<column_name>)
             USING ANN
             [PROPERTIES ("<key>" = "<value>" [, ...])]
             [COMMENT '<index_comment>']
```

## 인덱스 매개변수 {#index-parameters}

ANN 인덱스의 동작은 `PROPERTIES`의 속성에 따라 결정됩니다. 속성은 일반 속성, 인덱스 알고리즘별 속성, 양자화기별 속성의 세 범주로 나뉩니다.

### 일반 속성 {#general-attributes}

모든 ANN 인덱스에서 설정해야 하는 기본 속성입니다.

| 속성     | 설명                                                                  | 기본값 |
| ------------- | ---------------------------------------------------------------------------- | ------- |
| `index_type`  | ANN 인덱스 유형입니다. 사용 가능한 값: `ivf`, `ivf_on_disk`, `hnsw`           | -       |
| `metric_type` | 거리 측정 유형입니다. 사용 가능한 값: `l2_distance`(유클리드 거리), `inner_product` | - |
| `dim`         | 벡터 열의 차원 수                                           | -       |
| `quantizer`   | 양자화기 유형입니다. 사용 가능한 값: `flat`, `sq4`, `sq8`, `pq`             | `flat`  |

### 인덱스 알고리즘별 속성 {#index-algorithm-specific-attributes}

#### IVF / IVF On-Disk {#ivf--ivf-on-disk}

| 속성 | 설명                                                                                                              | 기본값 |
| --------- | ------------------------------------------------------------------------------------------------------------------------ | ------- |
| `nlist`   | 클러스터(역방향 목록)의 개수입니다. `ivf`와 `ivf_on_disk` 모두에 필요합니다. 값이 클수록 재현율이 높아지지만 빌드 시간과 리소스 사용량도 증가합니다. | `1024`  |

#### HNSW {#hnsw}

| 속성         | 설명                                                                  | 기본값 |
| ----------------- | ---------------------------------------------------------------------------- | ------- |
| `max_degree`      | 노드당 최대 연결 수로, 재현율과 쿼리 성능에 영향을 줍니다. | `32` |
| `ef_construction` | 인덱스 빌드 중 사용하는 후보 큐의 크기입니다. 값이 클수록 그래프의 품질이 높아지지만 빌드 시간도 증가합니다. | `40` |

### 양자화기별 속성 {#quantizer-specific-attributes}

`quantizer`는 벡터 저장 공간을 압축하는 데 사용됩니다. 양자화기별 차이는 다음과 같습니다.

| 양자화기 | 의미                                                                                          | 추가 매개변수             |
| --------- | ------------------------------------------------------------------------------------------------ | ---------------------------- |
| `flat`    | 양자화를 수행하지 않습니다. 벡터를 원래의 32비트 부동소수점 수로 저장합니다.               | 없음                         |
| `sq4`     | 스칼라 양자화입니다. 각 차원을 32비트 부동소수점 수 대신 4비트 정수로 저장합니다.      | 없음                         |
| `sq8`     | 스칼라 양자화입니다. 각 차원을 32비트 부동소수점 수 대신 8비트 정수로 저장합니다.    | 없음                         |
| `pq`      | 곱 양자화입니다. 벡터를 여러 하위 벡터로 나누고 각각 양자화합니다. | `pq_m`과 `pq_nbits`가 필요함 |

#### 곱 양자화(PQ)의 추가 매개변수 {#extra-parameters-for-product-quantization-pq}

| 속성  | 설명                                                                              |
| ---------- | ---------------------------------------------------------------------------------------- |
| `pq_m`     | 하위 벡터의 개수입니다. 벡터 차원 수 `dim`은 `pq_m`으로 나누어떨어져야 합니다.       |
| `pq_nbits` | 하위 벡터당 비트 수입니다. faiss에서는 일반적으로 `pq_nbits`가 24 이하여야 합니다. |

## 인덱스 생성 예시 {#index-creation-examples}

다음 SQL 예시는 일반적인 조합을 다루며 템플릿으로 사용할 수 있습니다.

### 테이블 생성 시 HNSW 인덱스 선언 {#declare-an-hnsw-index-when-creating-the-table}

```sql
CREATE TABLE tbl_ann (
    id int NOT NULL,
    embedding array<float> NOT NULL,
    INDEX ann_index (embedding) USING ANN PROPERTIES(
        "index_type"="hnsw",
        "metric_type"="l2_distance",
        "dim"="128"
    )
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

### IVF 인덱스 {#ivf-index}

```sql
CREATE INDEX ann_ivf_index ON tbl_ivf (`embedding`) USING ANN PROPERTIES(
    "index_type"="ivf",
    "metric_type"="l2_distance",
    "dim"="128",
    "nlist"="1024"
);
```

### HNSW 인덱스 {#hnsw-index}

```sql
CREATE INDEX ann_hnsw_index ON tbl_hnsw (`embedding`) USING ANN PROPERTIES(
    "index_type"="hnsw",
    "metric_type"="l2_distance",
    "dim"="128",
    "max_degree"="32",
    "ef_construction"="40"
);
```

### HNSW + SQ {#hnsw--sq}

```sql
CREATE INDEX ann_hnsw_sq ON tbl_hnsw (`embedding`) USING ANN PROPERTIES(
    "index_type"="hnsw",
    "metric_type"="l2_distance",
    "dim"="128",
    "max_degree"="32",
    "ef_construction"="40",
    "quantizer"="sq8"
);
```

### HNSW + PQ {#hnsw--pq}

```sql
CREATE INDEX ann_hnsw_pq ON tbl_hnsw (`embedding`) USING ANN PROPERTIES(
    "index_type"="hnsw",
    "metric_type"="l2_distance",
    "dim"="128",
    "max_degree"="32",
    "ef_construction"="40",
    "quantizer"="pq",
    "pq_m"="8",
    "pq_nbits"="8"
);
```

### IVF + SQ {#ivf--sq}

```sql
CREATE INDEX ann_ivf_sq ON tbl_ivf (`embedding`) USING ANN PROPERTIES(
    "index_type"="ivf",
    "metric_type"="l2_distance",
    "dim"="128",
    "nlist"="1024",
    "quantizer"="sq8"
);
```

### IVF + PQ {#ivf--pq}

```sql
CREATE INDEX ann_ivf_pq ON tbl_ivf (`embedding`) USING ANN PROPERTIES(
    "index_type"="ivf",
    "metric_type"="l2_distance",
    "dim"="128",
    "nlist"="1024",
    "quantizer"="pq",
    "pq_m"="8",
    "pq_nbits"="8"
);
```

## ANN 인덱스 빌드 {#build-an-ann-index}

인덱스를 `CREATE INDEX` 또는 `ALTER TABLE ADD INDEX`로 별도로 생성한 경우, `BUILD INDEX`를 사용하여 기존 데이터에 인덱스를 빌드합니다. 이 작업은 **비동기적으로** 실행됩니다.

### 빌드 시작 {#trigger-a-build}

```sql
BUILD INDEX <index_name> ON <table_name> [PARTITION (<partition_name> [, ...])]
```

### 빌드 진행 상황 모니터링 {#monitor-build-progress}

`SHOW BUILD INDEX`를 사용하여 인덱스 빌드 작업의 진행 상황과 상태를 확인합니다.

```sql
-- View the progress of all BUILD INDEX tasks (a database can be specified)
SHOW BUILD INDEX [FROM db_name];

-- View the progress of BUILD INDEX tasks for a specific table
SHOW BUILD INDEX WHERE TableName = "<table_name>";
```

출력에는 `JobId`, `TableName`, `State`(예: `FINISHED` 또는 `RUNNING`), `Progress` 등의 열이 포함됩니다. 예시:

```sql
mysql> show build index where TableName = "sift_1M";
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| JobId         | TableName | PartitionName | AlterInvertedIndexes                                                                                                                                | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| 1764579876673 | sift_1M   | sift_1M       | [ADD INDEX idx_test_ann (`embedding`) USING ANN PROPERTIES("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024")],  | 2025-12-01 17:59:54.277 | 2025-12-01 17:59:56.987 | 82            | FINISHED |      | NULL     |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
1 row in set (0.00 sec)
```

### 빌드 취소 {#cancel-a-build}

진행 중인 인덱스 빌드 작업을 취소하려면 다음 구문을 사용합니다.

```sql
CANCEL BUILD INDEX ON <table_name> [(<job_id> [, ...])]
```

## ANN 인덱스 조회 {#view-an-ann-index}

`SHOW INDEX` 또는 `SHOW CREATE TABLE`로 인덱스 정보를 조회할 수 있습니다.

```sql
SHOW INDEX[ES] FROM [<db_name>.]<table_name> [FROM <db_name>]

-- Or

SHOW CREATE TABLE [<db_name>.]<table_name>
```

`SHOW INDEX`의 출력에는 `Table`, `Key_name`, `Index_type`(ANN 인덱스의 경우 `ANN`으로 표시), `Properties`(전체 인덱스 설정 포함) 등의 열이 포함됩니다. 예시:

```sql
mysql> SHOW INDEX FROM sift_1M;
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
| Table   | Non_unique | Key_name     | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Properties                                                                             |
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
| sift_1M |            | idx_test_ann |              | embedding   |           |             |          |        |      | ANN        |         | ("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024") |
+---------+------------+--------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+----------------------------------------------------------------------------------------+
1 row in set (0.01 sec)
```

## ANN 인덱스 삭제 {#drop-an-ann-index}

`DROP INDEX` 또는 `ALTER TABLE DROP INDEX`를 사용하여 기존 ANN 인덱스를 삭제합니다.

```sql
DROP INDEX [IF EXISTS] <index_name> ON [<db_name>.]<table_name>

-- Or

ALTER TABLE [<db_name>.]<table_name> DROP INDEX <index_name>
```
