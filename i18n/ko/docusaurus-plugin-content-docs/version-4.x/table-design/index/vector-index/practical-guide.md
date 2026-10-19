---
{
    "title": "벡터 인덱스 실무 가이드",
    "sidebar_label": "실무 가이드",
    "language": "ko",
    "description": "Apache Doris 벡터 인덱스(ANN) 실무 가이드: 테이블 생성, 인덱스 생성, 데이터 적재, 쿼리, 튜닝, 문제 해결까지 전체 운영 절차를 다룹니다.",
    "keywords": [
        "Doris 벡터 인덱스",
        "ANN 인덱스",
        "HNSW",
        "IVF",
        "벡터 검색",
        "벡터 검색",
        "시맨틱 검색",
        "RAG",
        "코사인 유사도",
        "벡터 재현율",
        "BUILD INDEX"
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

<!-- Knowledge type: Operational guide / End-to-end workflow -->
<!-- Applicable scenarios: Launching vector retrieval / Performance tuning / Troubleshooting -->

이 문서는 Apache Doris에서 벡터 검색(ANN)을 배포하려는 사용자를 위한 가이드입니다. 테이블 설계부터 쿼리 튜닝과 문제 해결까지 전체 운영 절차를 안내합니다. 시맨틱 검색, RAG 또는 추천 시스템의 후보 검색을 Doris로 이전하는 방안을 검토 중이라면 이 문서의 단계를 그대로 따라 진행할 수 있습니다.

## 빠른 탐색 {#quick-navigation}

| 수행할 작업 | 관련 섹션 |
|---|---|
| Doris 버전과 테이블 모델이 요구 사항을 충족하는지 확인 | [사전 요구 사항 및 제한 사항](#prerequisites-and-limitations) |
| HNSW와 IVF 인덱스 중 선택 | [적용 시나리오 및 인덱스 선택](#applicable-scenarios-and-index-selection) |
| 테이블 생성 -> 데이터 적재 -> 쿼리의 전체 절차 실행 | [전체 운영 절차](#end-to-end-operational-workflow) |
| 코사인 유사도로 정렬 | [코사인 유사도 사용](#using-cosine-similarity) |
| 재현율 향상 / 지연 시간 단축 | [쿼리 및 빌드 튜닝](#query-and-build-tuning) |
| 인덱스 미적용 / 낮은 재현율 / 데이터 적재 실패 문제 해결 | [일반적인 문제 해결](#common-troubleshooting) |

---

## 적용 시나리오 및 인덱스 선택 {#applicable-scenarios-and-index-selection}

<!-- Knowledge type: Architectural selection decision -->

Apache Doris 4.x부터 ANN(Approximate Nearest Neighbor, 근사 최근접 이웃) 벡터 인덱스를 지원합니다. 일반적인 적용 시나리오는 다음과 같습니다.

- 시맨틱 검색
- RAG 검색 증강
- 추천 시스템의 후보 검색
- 이미지 또는 멀티모달 검색
- 이상 탐지

### 인덱스 유형 비교 {#index-type-comparison}

| 인덱스 유형 | 재현율 | 온라인 쿼리 성능 | 빌드 속도 | 메모리 사용량 | 적용 시나리오 |
|---|---|---|---|---|---|
| `hnsw` | 높음 | 좋음 | 느림 | 많음 | 지연 시간이 짧아야 하는 온라인 검색 |
| `ivf` | 중간 | 더 좋음 | 빠름 | 더 효율적 | 대규모 데이터셋 |
| `ivf_on_disk` | 중간 | 중간 | 빠름 | 가장 효율적 | 메모리가 제한된 초대규모 환경 |

### 지원되는 거리 함수 {#supported-distance-functions}

| 함수 | 정렬 방향 | 설명 |
|---|---|---|
| `l2_distance_approximate` | `ORDER BY ... ASC` | 유클리드 거리로, 거리가 작을수록 더 유사함 |
| `inner_product_approximate` | `ORDER BY ... DESC` | 내적으로, 값이 클수록 더 유사함 |

> 코사인 유사도는 `metric_type="cosine"`으로 직접 설정할 수 없습니다. 벡터를 정규화한 뒤 내적을 사용하여 구현해야 합니다. 자세한 내용은 [코사인 유사도 사용](#using-cosine-similarity)을 참조하세요.

---

## 사전 요구 사항 및 제한 사항 {#prerequisites-and-limitations}

<!-- Knowledge type: Environment requirements -->
<!-- Applicable scenarios: Pre-deployment check -->

ANN 인덱스를 사용하기 전에 다음 조건을 확인하세요.

| 확인 항목 | 요구 사항 |
|---|---|
| Doris 버전 | `>= 4.0.0` |
| 테이블 모델 | `DUPLICATE KEY`; `UNIQUE KEY`는 merge-on-write를 활성화해야 함(버전 4.1.4부터 지원) |
| 벡터 컬럼 유형 | `ARRAY<FLOAT> NOT NULL` |
| 차원 일치 | 적재하는 벡터의 차원이 인덱스의 `dim`과 일치해야 함 |

최소한의 테이블 생성 예제:

```sql
CREATE TABLE document_vectors (
    id BIGINT NOT NULL,
    embedding ARRAY<FLOAT> NOT NULL
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

---

## 전체 운영 절차 {#end-to-end-operational-workflow}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: First-time deployment of vector retrieval -->

전체 절차는 테이블 생성 -> 인덱스 설정 -> 데이터 적재 -> 인덱스 빌드 및 모니터링의 4단계로 구성됩니다.

### 1단계: 벡터 테이블 생성 {#step-1-create-the-vector-table}

테이블을 생성하는 방법은 두 가지입니다. 데이터 규모와 적재 방식에 따라 선택하세요.

| 방법 | 장점 | 단점 | 권장 시나리오 |
|---|---|---|---|
| 테이블 생성 시 ANN 인덱스를 바로 정의 | 데이터가 기록되는 즉시 쿼리 가능 | 데이터 적재 속도가 느림 | 소규모, 스트리밍 데이터 적재 |
| 테이블을 생성하고 데이터를 먼저 적재한 뒤 `CREATE INDEX` + `BUILD INDEX` 실행 | 데이터 적재 속도가 빠르고 빌드 시점을 제어할 수 있음 | 별도의 빌드 단계 필요 | 대규모 배치 데이터 적재 |

테이블 생성 시 ANN 인덱스를 바로 정의하는 예제:

```sql
CREATE TABLE document_vectors (
    id BIGINT NOT NULL,
    title VARCHAR(500),
    content TEXT,
    category VARCHAR(100),
    embedding ARRAY<FLOAT> NOT NULL,
    INDEX idx_embedding (embedding) USING ANN PROPERTIES (
        "index_type" = "hnsw",
        "metric_type" = "l2_distance",
        "dim" = "768"
    )
)
ENGINE = OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

### 2단계: 벡터 인덱스 매개변수 설정 {#step-2-configure-vector-index-parameters}

<!-- Knowledge type: Configuration parameters -->

공통 매개변수:

| 매개변수 | 값 | 설명 |
|---|---|---|
| `index_type` | `hnsw` / `ivf` / `ivf_on_disk` | 인덱스 유형 |
| `metric_type` | `l2_distance` / `inner_product` | 거리 측정 방식 |
| `dim` | 정수 | 벡터 차원 |
| `quantizer` | `flat` / `sq8` / `sq4` / `pq` | 양자화 방식(선택 사항) |

HNSW 전용 매개변수:

| 매개변수 | 기본값 | 설명 |
|---|---|---|
| `max_degree` | `32` | 노드당 최대 이웃 수 |
| `ef_construction` | `40` | 빌드 중 탐색 폭 |

IVF 전용 매개변수(`ivf`와 `ivf_on_disk`에서 공통으로 사용):

| 매개변수 | 기본값 | 설명 |
|---|---|---|
| `nlist` | `1024` | 클러스터 중심점 수 |

테이블 생성 후 인덱스를 생성하는 예제:

```sql
CREATE INDEX idx_embedding ON document_vectors (embedding) USING ANN PROPERTIES (
    "index_type" = "hnsw",
    "metric_type" = "l2_distance",
    "dim" = "768",
    "max_degree" = "64",
    "ef_construction" = "128"
);
```

### 3단계: 데이터 적재 {#step-3-ingest-data}

배치 데이터 적재 시 권장 순서:

1. 테이블을 생성하되, **인덱스는 아직 빌드하지 않음**
2. 데이터를 배치로 기록(Stream Load / S3 TVF / SDK)
3. 데이터 적재가 완료되면 인덱스를 한 번에 빌드

운영 환경에서는 이 배치 방식을 권장합니다. 데이터 적재 시간을 크게 줄일 수 있습니다.

### 4단계: 인덱스 빌드 및 모니터링 {#step-4-build-the-index-and-monitor}

데이터 적재 후 인덱스를 생성하는 방식을 사용한다면 빌드를 수동으로 실행해야 합니다.

```sql
BUILD INDEX idx_embedding ON document_vectors;

SHOW BUILD INDEX WHERE TableName = "document_vectors";
```

빌드 상태에는 `PENDING`, `RUNNING`, `FINISHED`, `CANCELLED`가 있습니다.

---

## 쿼리 패턴 {#query-patterns}

<!-- Knowledge type: Operational examples -->

### TopN 최근접 이웃 검색 {#topn-nearest-neighbor-search}

```sql
SELECT id, title,
       l2_distance_approximate(embedding, [0.1, 0.2, ...]) AS dist
FROM document_vectors
ORDER BY dist
LIMIT 10;
```

### 범위 검색 {#range-search}

```sql
SELECT id, title
FROM document_vectors
WHERE l2_distance_approximate(embedding, [0.1, 0.2, ...]) < 0.5;
```

### 필터 조건을 결합한 하이브리드 검색 {#hybrid-search-with-filter-conditions}

```sql
SELECT id, title,
       l2_distance_approximate(embedding, [0.1, 0.2, ...]) AS dist
FROM document_vectors
WHERE category = 'AI'
ORDER BY dist
LIMIT 10;
```

하이브리드 필터링 시나리오에서 Doris는 **사전 필터링** 전략을 사용하여 성능과 재현율의 균형을 맞춥니다.

---

## 코사인 유사도 사용 {#using-cosine-similarity}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Business metric is cosine -->

ANN 인덱스는 `metric_type="cosine"`을 직접 설정하는 방식을 지원하지 않습니다. 서비스에서 코사인 유사도로 정렬해야 한다면 다음 패턴을 사용하세요.

1. 데이터 적재 전에 벡터에 L2 정규화 적용(단위 벡터로 변환)
2. ANN 인덱스를 생성할 때 `metric_type="inner_product"` 사용
3. 쿼리에서 `inner_product_approximate(...)`를 사용하고 `ORDER BY ... DESC`로 정렬

**원리:**

- `cos(x, y) = (x · y) / (||x|| · ||y||)`
- 정규화 후에는 `||x|| = ||y|| = 1`이므로 `cos(x, y) = x · y`

단위 벡터 공간에서는 코사인 유사도 정렬이 내적 정렬과 동등합니다.

---

## 쿼리 및 빌드 튜닝 {#query-and-build-tuning}

<!-- Knowledge type: Performance tuning -->
<!-- Applicable scenarios: Recall not meeting requirements / Latency too high -->

### 쿼리 매개변수 {#query-parameters}

| 인덱스 유형 | 튜닝 매개변수 | 효과 |
|---|---|---|
| HNSW | `hnsw_ef_search` | 값이 클수록 재현율이 높아지고 지연 시간도 늘어남 |
| IVF | `nprobe` 또는 `ivf_nprobe`(버전에 따라 다름) | 값이 클수록 재현율이 높아짐 |

```sql
SET hnsw_ef_search = 100;
SET nprobe = 128;
SET optimize_index_scan_parallelism = true;
```

### 빌드 권장 사항 {#build-recommendations}

1. 대규모 데이터는 먼저 compaction을 실행한 다음 최종 인덱스 빌드를 실행
2. 세그먼트가 너무 커서 재현율에 영향을 주지 않도록 세그먼트 규모를 제어
3. 동일한 데이터셋에 여러 매개변수 조합을 적용하여 A/B 벤치마크 실행

### 용량 추정 {#capacity-estimation}

- 대략적인 벡터 메모리 계산식: `dim * 4 bytes * row_count`
- 여기에 ANN 인덱스 구조의 오버헤드를 추가
- 벡터 이외의 컬럼과 실행 연산자에 필요한 메모리도 확보

단일 노드 및 분산 배포 환경의 10M / 100M 규모 용량 참고 자료는 [대규모 성능 테스트](./performance-large-scale.md)를 참조하세요.

---

## 인덱스 관리 {#index-management}

<!-- Knowledge type: Operational commands -->

자주 사용하는 관리 SQL:

```sql
-- View the index list
SHOW INDEX FROM document_vectors;

-- View data scale
SHOW DATA ALL FROM document_vectors;

-- Drop the index
ALTER TABLE document_vectors DROP INDEX idx_embedding;
```

인덱스 매개변수를 조정하려면 **기존 인덱스를 삭제하고 다시 빌드**하는 방식을 권장합니다.

---

## 일반적인 문제 해결 {#common-troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting -->

### 인덱스가 적용되지 않음 {#index-not-taking-effect}

다음 순서로 확인하세요.

1. 인덱스 존재 여부: `SHOW INDEX` 실행
2. 인덱스 빌드 완료 여부: `SHOW BUILD INDEX` 실행
3. 쿼리에서 `_approximate` 접미사가 붙은 거리 함수를 사용하는지 확인

### 낮은 재현율 {#low-recall}

| 점검 항목 | 권장 조치 |
|---|---|
| HNSW 매개변수 | `max_degree`, `ef_construction`, `hnsw_ef_search` 값을 높임 |
| IVF 탐색 매개변수 | `nprobe` / `ivf_nprobe` 값을 높임 |
| 세그먼트 규모 | compaction 후 인덱스를 다시 빌드 |

### 긴 쿼리 지연 시간 {#high-query-latency}

| 점검 항목 | 권장 조치 |
|---|---|
| 콜드 쿼리와 핫 쿼리 | 인덱스를 메모리에 읽어 들이는 시간이 다릅니다. 서비스 시작 후 워밍업을 수행할 수 있습니다 |
| `hnsw_ef_search` 값이 너무 큼 | 지연 시간을 줄이도록 값을 적절히 낮춤 |
| 병렬 스캔이 비활성화됨 | `optimize_index_scan_parallelism = true` 설정 |
| BE 메모리 부담 | BE 메모리 수준과 GC 동작 확인 |

### 데이터 적재 실패 {#ingestion-failure}

| 일반적인 원인 | 권장 조치 |
|---|---|
| 차원 불일치 | 적재하는 벡터의 차원이 인덱스의 `dim`과 일치하는지 확인 |
| 벡터 컬럼에 NULL이 포함됨 | 서비스 측에서 NULL을 다른 값으로 채우거나 필터링 |
| 잘못된 벡터 배열 형식 | JSON / Stream Load 페이로드 형식 검증 |

---

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Frequently asked questions -->

**Q1: UNIQUE KEY 또는 AGGREGATE KEY 테이블에서 ANN 인덱스를 사용할 수 있나요?**

버전 4.1.4부터 ANN 인덱스는 **DUPLICATE KEY** 모델과 **merge-on-write**가 활성화된 **UNIQUE KEY** 모델을 지원합니다(`enable_unique_key_merge_on_write = "true"`). Merge-on-read UNIQUE KEY 테이블과 AGGREGATE KEY 테이블은 여전히 지원하지 않습니다. 4.1.4 이전 버전에서는 DUPLICATE KEY 모델만 지원합니다.

**Q2: ANN 인덱스와 역색인을 동시에 생성할 수 있나요?**

예. 같은 테이블에 ANN 인덱스와 역색인을 모두 생성할 수 있습니다. 텍스트 필터링과 벡터 정렬을 결합하면 온라인 RAG에서 흔히 사용하는 **하이브리드 검색** 패턴을 구현할 수 있습니다.

**Q3: 코사인 유사도를 사용해야 한다면 어떻게 하나요?**

ANN은 `metric_type="cosine"`을 지원하지 않습니다. 벡터를 정규화한 뒤 `inner_product`를 사용하면 동등한 결과를 얻을 수 있습니다. 자세한 내용은 [코사인 유사도 사용](#using-cosine-similarity)을 참조하세요.

**Q4: BUILD INDEX가 RUNNING 상태에서 멈춰 있으면 어떻게 하나요?**

`SHOW BUILD INDEX`로 진행 상황을 확인하세요. 대규모 테이블의 인덱스 빌드에는 원래 시간이 오래 걸리므로, 먼저 정상적으로 빌드가 진행 중인지 확인하세요. 오랫동안 진행되지 않는다면 BE 메모리와 디스크 상태를 확인하세요.

**Q5: ANN 인덱스 매개변수는 어떻게 조정하나요?**

ANN 인덱스 매개변수는 기존 인덱스에서 직접 수정할 수 없습니다. **먼저 DROP INDEX를 실행한 다음 새 매개변수로 CREATE INDEX를 실행**하고, 마지막으로 BUILD INDEX를 실행하는 방식을 권장합니다.
