---
{
    "title": "IVF",
    "language": "ko",
    "description": "Apache Doris에서 IVF 인덱스로 대규모 벡터 검색을 가속하는 방법: 원리, 매개변수 튜닝, 재현율 최적화, 성능 벤치마크.",
    "keywords": [
        "IVF",
        "Inverted File Index",
        "벡터 인덱스",
        "ANN 인덱스",
        "근사 최근접 이웃 검색",
        "Apache Doris 벡터 검색",
        "nlist",
        "nprobe",
        "재현율 최적화",
        "벡터 데이터베이스"
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

# IVF: IVF 인덱스로 Apache Doris의 벡터 검색 가속하기 {#ivf-accelerating-vector-search-in-apache-doris-with-ivf-indexes}

<!-- Knowledge type: Feature concept + Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Vector index selection / Index building / Recall and performance tuning -->

**한 문장 정의**: IVF(Inverted File Index)는 클러스터링으로 벡터 공간을 분할하여 검색 범위를 좁히는 근사 최근접 이웃(ANN) 인덱스입니다. Apache Doris 4.x부터 기본 지원됩니다.

이 문서에서는 다음 질문에 답합니다.

- IVF 인덱스란 무엇이며, 벡터 검색을 어떻게 가속하나요?
- Apache Doris에서 IVF 인덱스를 생성, 구축, 삭제하려면 어떻게 해야 하나요?
- 재현율과 성능의 균형을 맞추려면 `nlist`, `nprobe` 등의 주요 매개변수를 어떻게 선택해야 하나요?
- 재현율에 영향을 주는 요인은 무엇이며, 성능 저하를 어떻게 방지할 수 있나요?

## 빠른 탐색 {#quick-navigation}

| 목표 | 바로 가기 |
| --- | --- |
| IVF의 기본 원리 이해 | [IVF 인덱스란](#what-is-the-ivf-index) |
| IVF 인덱스 생성 및 사용 | [Apache Doris에서 IVF 사용하기](#using-ivf-in-apache-doris) |
| 재현율 튜닝 | [재현율 최적화](#recall-optimization) |
| 쿼리 성능 문제 해결 | [쿼리 성능](#query-performance) |
| 성능 벤치마크 재현 | [벤치마크](#benchmark) |
| 자주 묻는 질문 | [자주 묻는 질문](#faq) |

---

## IVF 인덱스란 {#what-is-the-ivf-index}

<!-- Knowledge type: Concept explanation -->

### 역색인에서 벡터 역색인으로 {#from-inverted-indexes-to-vector-inverted-indexes}

IVF(Inverted File)라는 용어는 정보 검색 분야에서 유래했습니다. 텍스트 검색을 예로 들어 보겠습니다.

- **정방향 인덱스**: 각 문서가 단어 목록을 관리합니다. 쿼리는 모든 문서를 스캔해야 합니다.

    | 문서 | 단어 |
    | --- | --- |
    | 문서 1 | the, cow, says, moo |
    | 문서 2 | the, cat, and, the, hat |
    | 문서 3 | the, dish, ran, away, with, the, spoon |

- **역색인**: 각 단어가 "이 단어를 포함하는 문서" 목록을 관리합니다. 쿼리는 관련 목록만 스캔하면 됩니다.

    | 단어 | 문서 |
    | --- | --- |
    | the | 문서 1, 문서 3, 문서 4, 문서 5, 문서 7 |
    | cow | 문서 2, 문서 3, 문서 4 |
    | says | 문서 5 |
    | moo | 문서 7 |

오늘날 텍스트는 주로 벡터 임베딩으로 표현됩니다. IVF는 역색인의 개념을 차용합니다. 클러스터의 중심점이 "사전" 역할을 하고, 각 중심점은 "이 클러스터에 속하는 벡터" 목록을 관리합니다. 쿼리는 선택된 소수의 클러스터만 살펴보면 됩니다.

### IVF가 벡터 검색을 가속하는 원리 {#why-ivf-accelerates-vector-search}

데이터셋이 수백만 개 또는 수십억 개의 벡터로 늘어나면 정확한 kNN 검색, 즉 쿼리 벡터와 데이터베이스의 모든 벡터 사이의 거리를 계산하는 작업은 대규모 행렬 곱셈에 해당하며, 계산 비용이 감당하기 어려울 정도로 커집니다.

근사 최근접 이웃(ANN) 검색은 정확도를 약간 양보하는 대신 속도를 열 배 수준으로 높입니다. IVF는 업계에서 가장 널리 사용되는 효과적인 ANN 방법 중 하나입니다. 핵심 아이디어는 **"분할 정복"**입니다.

1. 전체 벡터 데이터셋을 여러 클러스터로 분할하고, 각 클러스터를 **중심점**으로 표현합니다.
2. 쿼리 시점에 먼저 쿼리 벡터와 중심점이 가장 가까운 소수의 클러스터를 찾은 다음, 해당 클러스터 내부만 검색하고 나머지 데이터는 건너뜁니다.

![IVF 검색](/images/vector-search/dataset-points-query-clusters.png)

---

## Apache Doris에서 IVF 사용하기 {#using-ivf-in-apache-doris}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Table creation / Index building / Index management -->

Apache Doris는 4.x 버전부터 IVF 기반 ANN 인덱스를 지원합니다. 인덱스 유형은 `ANN`으로 고정되며, `index_type=ivf`를 지정하여 IVF 알고리즘을 선택합니다.

### 인덱스 구축 방식 {#index-building-approaches}

ANN 인덱스를 생성하는 방법은 두 가지이며, 각각 적합한 사용 상황이 다릅니다.

| 방식 | 구축 시점 | 장점 | 단점 | 적합한 상황 |
| --- | --- | --- | --- | --- |
| 테이블 생성 시 인덱스 정의 | 데이터 적재 중 동기적으로 구축 | 데이터가 기록되는 즉시 쿼리 가속 가능 | 쓰기 속도 저하, Compaction 시 인덱스 재구축으로 리소스 낭비 가능 | 인덱스 매개변수가 이미 확정된 운영 환경 |
| `CREATE INDEX` + `BUILD INDEX` | 데이터 적재 후 비동기적으로 구축 | 데이터 적재에 영향을 주지 않으며 매개변수 튜닝이 편리함 | 구축 중에는 가속 불가 | 매개변수 튜닝 단계, 초대형 테이블 초기화 |

### 방식 1: 테이블 생성 시 인덱스 정의 {#approach-1-define-the-index-at-table-creation}

```sql
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT "",
  INDEX ann_index (embedding) USING ANN PROPERTIES(
      "index_type"="ivf",
      "metric_type"="l2_distance",
      "dim"="128",
      "nlist"="1024"
  )
) ENGINE=OLAP
DUPLICATE KEY(id) COMMENT "OLAP"
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1"
);

INSERT INTO sift_1M
SELECT *
FROM S3(
  "uri" = "https://selectdb-customers-tools-bj.oss-cn-beijing.aliyuncs.com/sift_database.tsv",
  "format" = "csv");
```

### 방식 2: CREATE INDEX + BUILD INDEX {#approach-2-create-index--build-index}

**1단계**: 인덱스 없이 테이블을 생성하고 데이터를 적재합니다.

```sql
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT ""
) ENGINE=OLAP
DUPLICATE KEY(id) COMMENT "OLAP"
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1"
);

INSERT INTO sift_1M
SELECT *
FROM S3(
  "uri" = "https://selectdb-customers-tools-bj.oss-cn-beijing.aliyuncs.com/sift_database.tsv",
  "format" = "csv");
```

**2단계**: `CREATE INDEX`를 실행하여 인덱스 정의를 추가합니다. 이 시점에는 인덱스 메타데이터만 등록되며, 기존 데이터에 대한 인덱스는 아직 구축되지 않습니다.

```sql
CREATE INDEX idx_test_ann ON sift_1M (`embedding`) USING ANN PROPERTIES (
  "index_type"="ivf",
  "metric_type"="l2_distance",
  "dim"="128",
  "nlist"="1024"
);

SHOW DATA ALL FROM sift_1M;
```

예상 출력(`LocalIndexSize`는 여전히 0):

```text
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
| TableName | IndexName | ReplicaCount | RowCount | LocalTotalSize | LocalDataSize | LocalIndexSize | RemoteTotalSize | RemoteDataSize | RemoteIndexSize |
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
| sift_1M   | sift_1M   | 10           | 1000000  | 170.093 MB     | 170.093 MB    | 0.000          | 0.000           | 0.000          | 0.000           |
|           | Total     | 10           |          | 170.093 MB     | 170.093 MB    | 0.000          | 0.000           | 0.000          | 0.000           |
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
```

**3단계**: `BUILD INDEX`를 실행하여 기존 데이터에 인덱스를 구축합니다. 이 작업은 비동기적으로 실행됩니다.

```sql
BUILD INDEX idx_test_ann ON sift_1M;
```

**4단계**: `SHOW BUILD INDEX`로 작업 상태를 확인합니다.

```sql
SHOW BUILD INDEX WHERE TableName = "sift_1M";
```

작업이 완료되면 데이터 크기를 다시 확인합니다. 인덱스 크기(`LocalIndexSize`)가 생성되어 있습니다.

```text
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| JobId         | TableName | PartitionName | AlterInvertedIndexes                                                                                                                                | CreateTime              | FinishTime              | TransactionId | State    | Msg  | Progress |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+
| 1764392359610 | sift_1M   | sift_1M       | [ADD INDEX idx_test_ann (`embedding`) USING ANN PROPERTIES("dim" = "128", "index_type" = "ivf", "metric_type" = "l2_distance", "nlist" = "1024")],  | 2025-12-01 14:18:22.360 | 2025-12-01 14:18:27.885 | 5036          | FINISHED |      | NULL     |
+---------------+-----------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+-------------------------+---------------+----------+------+----------+

mysql> SHOW DATA ALL FROM sift_1M;
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
| TableName | IndexName | ReplicaCount | RowCount | LocalTotalSize | LocalDataSize | LocalIndexSize | RemoteTotalSize | RemoteDataSize | RemoteIndexSize |
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
| sift_1M   | sift_1M   | 10           | 1000000  | 671.084 MB     | 170.093 MB    | 500.991 MB     | 0.000           | 0.000          | 0.000           |
|           | Total     | 10           |          | 671.084 MB     | 170.093 MB    | 500.991 MB     | 0.000           | 0.000          | 0.000           |
+-----------+-----------+--------------+----------+----------------+---------------+----------------+-----------------+----------------+-----------------+
```

### 인덱스 삭제 {#dropping-the-index}

매개변수를 튜닝할 때는 재현율을 확보하기 위해 다양한 매개변수 조합을 테스트해야 하는 경우가 많습니다. `DROP INDEX`를 사용하면 인덱스를 유연하게 관리할 수 있습니다.

```sql
ALTER TABLE sift_1M DROP INDEX idx_test_ann;
```

### 벡터 쿼리 실행 {#running-vector-queries}

ANN 인덱스는 **TopN 검색**과 **범위 검색**을 모두 가속합니다.

**운영 환경 권장 사항**: 고차원 벡터를 문자열로 표현하면 SQL 파싱 과정에서 추가 오버헤드가 발생하므로, 동시 요청이 많은 환경에서는 원시 SQL을 직접 사용하지 않는 것이 좋습니다. 다음 두 가지 최적화 방법을 권장합니다.

1. Prepare Statement를 사용하여 SQL을 미리 파싱합니다.
2. 공식 Doris 벡터 검색 [Python 라이브러리](https://github.com/uchenily/doris_vector_search)를 사용합니다. 이 라이브러리는 Prepare Statement 호출을 감싸고 쿼리 결과를 pandas DataFrame으로 바로 변환하므로 AI 애플리케이션 개발에 편리합니다.

예제 코드:

```python
from doris_vector_search import DorisVectorClient, AuthOptions

auth = AuthOptions(
    host="127.0.0.1",
    query_port=9030,
    user="root",
    password="",
)

client = DorisVectorClient(database="test", auth_options=auth)

tbl = client.open_table("sift_1M")

query = [0.1] * 128  # Example 128-dimensional vector

# SELECT id FROM sift_1M ORDER BY l2_distance_approximate(embedding, query) LIMIT 10;
result = tbl.search(query, metric_type="l2_distance").limit(10).select(["id"]).to_pandas()

print(result)
```

예상 출력:

```text
       id
0  123911
1  926855
2  123739
3   73311
4  124493
5  153178
6  126138
7  123740
8  125741
9  124048
```

---

## 재현율 최적화 {#recall-optimization}

<!-- Knowledge type: Performance tuning -->
<!-- Applicable scenarios: Index parameter tuning / Recall troubleshooting -->

벡터 검색의 핵심 지표는 재현율입니다. **성능 수치는 재현율이 허용 가능한 수준일 때만 의미가 있습니다.** 재현율에 영향을 주는 주요 요인은 다음과 같습니다.

1. IVF 인덱스 매개변수(`nlist`)와 쿼리 매개변수(`nprobe`)
2. 인덱스의 벡터 양자화
3. Segment의 크기와 개수

이 절에서는 1번과 3번 항목을 다룹니다. 벡터 양자화는 다른 문서에서 설명합니다.

### 인덱스 하이퍼파라미터: nlist와 nprobe {#index-hyperparameters-nlist-and-nprobe}

IVF는 인덱스 구축 시점과 쿼리 시점에 주요 매개변수를 사용합니다.

**인덱스 구축 단계**:

1. **클러스터링**: k-means와 같은 클러스터링 알고리즘으로 벡터를 `nlist`개의 클러스터로 분할한 다음, 각 클러스터의 중심점을 계산하여 저장합니다.
2. **벡터 할당**: 각 벡터를 중심점이 가장 가까운 클러스터에 할당하고, 해당 역색인 목록에 벡터를 추가합니다.

**쿼리 단계**:

1. **클러스터 선택**: 쿼리 벡터에서 모든 `nlist`개 중심점까지의 거리를 계산하고 가장 가까운 `nprobe`개의 클러스터를 선택합니다.
2. **클러스터 내부 전수 검색**: 선택한 `nprobe`개의 클러스터 내부에서 벡터를 하나씩 비교하여 최근접 이웃을 찾습니다.

| 매개변수 | 용도 | 영향 | Doris 기본값 |
| --- | --- | --- | --- |
| `nlist` | 클러스터(역색인 목록) 개수 | 값이 클수록 더 세밀하게 분할되어 검색이 빨라지지만, 클러스터링 비용이 증가하고 이웃이 서로 다른 클러스터에 흩어질 가능성이 커짐 | 1024 |
| `nprobe` | 쿼리 시 탐색할 클러스터 개수 | 값이 클수록 재현율과 지연 시간이 높아짐. 값이 작을수록 빠르지만 결과를 놓칠 가능성이 커짐 | 64 |

**SIFT_1M 데이터셋의 측정 결과**:

| nlist | nprobe | recall@100 |
| --- | --- | --- |
| 1024 | 64 | 0.9542 |
| 1024 | 32 | 0.9034 |
| 1024 | 16 | 0.8299 |
| 1024 | 8 | 0.7337 |
| 512 | 32 | 0.9384 |
| 512 | 16 | 0.8763 |
| 512 | 8 | 0.7869 |

### 실무에서의 하이퍼파라미터 선택 {#hyperparameter-selection-in-practice}

정확한 최적 매개변수를 미리 결정할 수는 없지만, 다음과 같이 체계적으로 선택할 수 있습니다.

1. 인덱스 없이 벡터 컬럼을 2~3개 포함하는 임시 테이블 `table_multi_index`를 생성합니다.
2. Stream Load나 다른 방법으로 이 테이블에 데이터를 적재합니다.
3. 각 벡터 컬럼에 서로 다른 매개변수로 `CREATE INDEX`와 `BUILD INDEX`를 실행합니다.
4. 각 컬럼의 재현율을 비교하여 가장 적합한 매개변수 조합을 선택합니다.

예제:

```sql
ALTER TABLE tbl DROP INDEX idx_embedding;
CREATE INDEX idx_embedding ON tbl (`embedding`) USING ANN PROPERTIES (
  "index_type"="ivf",
  "metric_type"="inner_product",
  "dim"="768",
  "nlist"="1024"
);
BUILD INDEX idx_embedding ON tbl;
```

### 인덱스가 포괄하는 행 수 {#number-of-rows-covered-by-the-index}

Doris 내부 테이블의 데이터는 다음 계층으로 구성됩니다.

- **Table**에서 **Tablet**으로: 버킷 키에 따라 N개의 **Tablet**에 균등하게 분산됩니다. Tablet은 데이터 마이그레이션과 리밸런싱의 기본 단위입니다.
- **Tablet**에서 **Rowset**으로: 데이터 적재 또는 Compaction이 수행될 때마다 새로운 **Rowset**이 추가됩니다. Rowset은 버전 관리 단위입니다.
- **Rowset**에서 **Segment**로: 실제 데이터는 **Segment** 파일에 저장됩니다.

역색인과 마찬가지로 벡터 인덱스도 Segment 단위로 동작합니다. Segment 크기는 BE 설정 항목인 `write_buffer_size`와 `vertical_compaction_max_segment_size`로 제어합니다. 데이터 적재 또는 Compaction 중에 memtable이 일정 크기까지 쌓이면 Segment 파일로 플러시되며, 해당 Segment에 대한 벡터 인덱스가 구축됩니다. 인덱스 컬럼이 여러 개이면 인덱스도 여러 개 생성됩니다.

각 IVF 인덱스 매개변수 조합이 효과적으로 포괄할 수 있는 데이터 양에는 한계가 있습니다. **Segment의 행 수가 임계값을 초과하면 재현율이 떨어집니다.**

> 팁: `SHOW TABLETS FROM <table>`을 사용하여 테이블의 Compaction 상태를 확인합니다. 해당 URL을 열면 Segment 개수를 볼 수 있습니다.

### Compaction이 재현율에 미치는 영향 {#effect-of-compaction-on-recall}

Compaction은 여러 작은 Segment를 더 큰 Segment로 병합합니다. 이로 인해 작은 데이터 규모에 맞춰 튜닝한 인덱스 매개변수가 더 이상 효과적이지 않게 되어 재현율이 떨어집니다.

**권장 사항**: `BUILD INDEX`를 실행하기 전에 FULL COMPACTION을 수행합니다. 완전히 병합된 Segment에 인덱스를 구축하면 다음 두 가지 이점이 있습니다.

- 재현율이 안정적으로 유지됩니다.
- 인덱스 구축으로 발생하는 쓰기 증폭이 줄어듭니다.

---

## 쿼리 성능 {#query-performance}

<!-- Knowledge type: Performance tuning -->
<!-- Applicable scenarios: Online query performance optimization / Memory capacity planning -->

### 인덱스 파일의 콜드 로딩 {#cold-loading-of-index-files}

Doris ANN 인덱스는 Meta의 오픈 소스 [faiss](https://github.com/facebookresearch/faiss)를 기반으로 구현되었습니다. **IVF 인덱스는 메모리에 완전히 적재되어야 쿼리를 가속할 수 있습니다.**

권장 사항: 동시 요청이 많은 쿼리를 실행하기 전에 콜드 쿼리를 실행하여 관련된 모든 Segment 인덱스 파일이 메모리에 적재되었는지 확인합니다. 그렇지 않으면 첫 쿼리의 성능이 크게 저하됩니다.

### 메모리 사용량과 성능 {#memory-footprint-and-performance}

> **양자화 압축을 사용하지 않는 IVF 인덱스는 인덱싱하는 벡터 메모리의 약 1.02배를 차지합니다.**

예를 들어, 차원이 128이고 행 수가 1M인 데이터셋의 IVF FLAT 인덱스 메모리 사용량은 대략 다음과 같습니다.

```text
128 * 4 * 1,000,000 * 1.02 ≈ 500 MB
```

참고 값:

| dim | rows | 예상 메모리 사용량 |
| --- | --- | --- |
| 128 | 1M | 500 MB |
| 768 | 1M | 2.9 GB |

쿼리 성능을 보장하려면 BE에 전체 인덱스를 담을 수 있는 충분한 메모리가 있어야 합니다. 그렇지 않으면 인덱스 파일에 대한 잦은 IO로 인해 쿼리 성능이 크게 저하됩니다.

---

## 벤치마크 {#benchmark}

<!-- Knowledge type: Performance benchmark -->
<!-- Applicable scenarios: Performance reproduction / Selection evaluation -->

**배포 권장 사항**: 벤치마크는 운영 환경을 모방해야 합니다. FE와 BE를 분리하여 배포하고, 클라이언트도 별도의 머신에서 실행합니다.

**테스트 프레임워크**: [VectorDBBench](https://github.com/zilliztech/VectorDBBench).

### Performance768D1M {#performance768d1m}

벤치마크 명령어:

```bash
# load
NUM_PER_BATCH=1000000 python3 -m vectordbbench doris --host 127.0.0.1 --port 9030 --case-type Performance768D1M --db-name Performance768D1M --stream-load-rows-per-batch 500000 --index-prop index_type=ivf,nlist=1024 --skip-search-serial --skip-search-concurrent

# search
NUM_PER_BATCH=1000000 python3 -m vectordbbench doris --host 127.0.0.1 --port 9030 --case-type Performance768D1M --db-name Performance768D1M --search-concurrent --search-serial --num-concurrency 10,40,80 --stream-load-rows-per-batch 500000 --index-prop index_type=ivf,nlist=1024 --session-var ivf_nprobe=64 --skip-load --skip-drop-old
```

---

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->

**Q1: IVF와 HNSW 중 무엇을 선택해야 하나요?**
IVF는 메모리가 충분하고 구축 비용과 쿼리 지연 시간 사이의 균형을 맞춰야 하는 대규모 환경에 적합합니다. HNSW는 쿼리 지연 시간 면에서 유리하지만 메모리 사용량이 더 많습니다. 자세한 내용은 [HNSW 문서](./hnsw.md)를 참조하세요.

**Q2: `BUILD INDEX` 이후에도 재현율이 낮은 이유는 무엇인가요?**
일반적인 원인으로는 `nprobe`가 너무 낮게 설정된 경우, Segment가 너무 커서 인덱스가 충분히 포괄하지 못하는 경우, BUILD 전에 FULL COMPACTION을 실행하지 않은 경우가 있습니다. [재현율 최적화](#recall-optimization)를 참조하세요.

**Q3: 동시 요청이 많은 쿼리를 실행하기 전에 콜드 쿼리를 실행하는 이유는 무엇인가요?**
IVF 인덱스는 메모리에 완전히 적재되어야 쿼리를 가속할 수 있습니다. 콜드 쿼리는 디스크에서 메모리로 인덱스를 적재하여 캐시를 워밍업하므로, 첫 온라인 쿼리에서 발생하는 성능 저하를 방지합니다.

**Q4: `nlist`의 기본값인 1024를 조정해야 하나요?**
Doris의 기본값은 `nlist=1024`와 `nprobe=64`이며, 대부분의 중간 규모 데이터셋에 적합합니다. [실무에서의 하이퍼파라미터 선택](#hyperparameter-selection-in-practice)에 따라 실제 데이터 크기와 재현율 요구 사항에 맞게 조정하세요.

**Q5: `DROP INDEX`를 실행하면 메모리가 즉시 해제되나요?**
`DROP INDEX`는 인덱스 정의를 제거하며, 인덱스 파일은 이후에 정리됩니다. 매개변수를 튜닝할 때는 `CREATE INDEX` 및 `BUILD INDEX` 작업 흐름과 함께 사용하세요.

---

## 문제 해결 {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->

| 증상 | 가능한 원인 | 해결 방법 |
| --- | --- | --- |
| 재현율이 예상보다 현저히 낮음 | `nprobe`가 너무 낮음 / Segment가 너무 큼 / FULL COMPACTION을 실행하지 않음 | `nprobe`를 높이고, BUILD 전에 FULL COMPACTION을 실행하며, `nlist`를 조정 |
| 첫 쿼리의 지연 시간이 매우 길고 이후 쿼리는 정상임 | 인덱스가 아직 메모리에 적재되지 않음(콜드 로딩) | 동시 요청이 많은 쿼리를 실행하기 전에 콜드 쿼리로 워밍업 |
| BE 메모리가 부족하고 쿼리 성능이 저하됨 | 전체 인덱스가 메모리에 상주하지 않아 IO가 자주 발생함 | BE 메모리를 늘리고, 메모리 사용량을 줄이기 위해 양자화 압축 사용을 고려 |
| `BUILD INDEX`가 오랫동안 완료되지 않음 | 작업이 비동기적으로 실행되며 데이터 양이 많음 | `SHOW BUILD INDEX WHERE TableName = "<tbl>"`로 진행 상황 확인 |
| 데이터 적재 속도가 느려짐 | 테이블 생성 시 인덱스가 동기적으로 구축됨 | `CREATE INDEX` + `BUILD INDEX` 방식으로 전환하여 비동기적으로 구축 |
