---
{
    "title": "IVF On-Disk",
    "language": "ko",
    "description": "Apache Doris의 IVF On-Disk 인덱스는 역색인 목록을 디스크에 저장하고 전용 캐시를 사용하여 대규모 벡터 검색의 메모리 사용량을 줄입니다.",
    "keywords": [
        "IVF On-Disk",
        "Apache Doris 벡터 인덱스",
        "ANN 인덱스",
        "ivf_on_disk",
        "벡터 검색 메모리 최적화",
        "ivf_nprobe",
        "ann_index_ivf_list_cache_limit",
        "대규모 벡터 검색"
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

# Apache Doris의 IVF On-Disk {#ivf-on-disk-in-apache-doris}

<!-- Knowledge type: Capability definition + Configuration parameters + Performance reference -->
<!-- Applicable scenarios: Large-scale vector retrieval / Constrained memory budget / ANN index selection -->

`ivf_on_disk`는 Apache Doris가 대규모 벡터 검색(ANN) 시나리오를 위해 제공하는 인덱스 유형입니다. IVF 역색인 목록의 주요 부분을 디스크에 저장하고 전용 캐시를 통해 자주 사용하는 데이터를 필요할 때 불러오므로, IVF 검색 기능을 유지하면서 상주 메모리 사용량을 크게 줄일 수 있습니다.

## 빠른 탐색 {#quick-navigation}

- `ivf_on_disk`가 필요한 이유는 [배경 및 목표](#background-and-goals)를 참고하세요.
- 테이블을 생성할 때 바로 사용하려면 [인덱스 DDL](#1-index-ddl)과 [쿼리 매개변수](#2-query-parameters)를 참고하세요.
- 메모리 사용량을 제어하려면 [BE 캐시 구성](#3-be-cache-configuration)과 [튜닝 권장 사항](#tuning-recommendations)을 참고하세요.
- 실제 환경에서의 동작을 평가하려면 [성능 참고 데이터](#performance-reference-data)를 참고하세요.
- 메모리 내 IVF와 비교하려면 [IVF와 비교](#comparison-with-ivf)를 참고하세요.

## 배경 및 목표 {#background-and-goals}

<!-- Knowledge type: Capability definition -->

벡터 수가 수천만 개 이상에 이르면, IVF를 전부 메모리에 저장할 때 인덱스의 메모리 비용이 급격히 증가하여 리소스 병목이 발생합니다. `ivf_on_disk`의 설계 목표는 다음과 같습니다.

- IVF의 매개변수 모델과 검색 의미 체계(`nlist` / `nprobe`)를 유지합니다.
- "전체를 메모리에 상주시켜야 하는" 방식에서 "디스크 + 전용 캐시" 방식으로 전환합니다.
- 기존 ANN SQL 사용 방식과 운영 관행을 계속 사용할 수 있도록 합니다.

즉, `ivf_on_disk`는 주로 **메모리 예산이 제한되어 있지만 ANN 가속이 필요한** 프로덕션 시나리오를 위한 기능입니다.

## IVF와 비교 {#comparison-with-ivf}

<!-- Knowledge type: Architecture selection decision -->

다음 표를 통해 `ivf_on_disk`를 `ivf`보다 우선하여 선택해야 하는 상황을 빠르게 판단할 수 있습니다.

| 비교 항목 | `ivf`(메모리)   | `ivf_on_disk`(디스크 + 캐시)                |
| -------------------- | ------------------- | ------------------------------------------- |
| 역색인 목록 저장 방식 | 전체를 메모리에 저장    | 주로 디스크에 저장하고 캐시를 통해 필요할 때 불러옴  |
| 메모리 사용량         | 높음, 데이터 양에 비례하여 증가 | 훨씬 낮음, 캐시 한도로 상한을 명시적으로 설정할 수 있음 |
| 쿼리 지연 시간        | 가장 낮음              | 메모리 내 IVF보다 약간 높으며, 캐시 적중률의 영향을 받음 |
| 매개변수 모델      | `nlist` / `nprobe`  | 동일                                   |
| 쿼리 함수      | ANN 쿼리 함수 | 동일                                   |
| 적용 규모     | 소규모~중규모     | 수천만 개 이상                  |
| 마이그레이션 비용       | -                   | 낮음, `index_type`만 변경하면 됨    |

## 사용자 인터페이스 {#user-interface}

### 1) 인덱스 DDL {#1-index-ddl}

<!-- Knowledge type: Operational steps -->

`index_type="ivf_on_disk"`를 지정하여 ANN 인덱스를 생성합니다.

```sql
CREATE TABLE vec_tbl (
    id BIGINT NOT NULL,
    embedding ARRAY<FLOAT> NOT NULL,
    INDEX idx_emb (embedding) USING ANN PROPERTIES (
        "index_type" = "ivf_on_disk",
        "metric_type" = "l2_distance",
        "dim" = "768",
        "nlist" = "1024"
    )
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

주요 사항:

- `ivf`와 `ivf_on_disk` 모두 `nlist`를 명시적으로 지정해야 합니다.
- `metric_type`은 `l2_distance`와 `inner_product`를 지원합니다.
- 쿼리 함수는 기존과 동일하게 `l2_distance_approximate` / `inner_product_approximate`를 사용합니다.

### 2) 쿼리 매개변수 {#2-query-parameters}

<!-- Knowledge type: Configuration parameters -->

`ivf_nprobe`는 여전히 IVF 계열에서 쿼리 단계의 가장 중요한 매개변수입니다.

```sql
SET ivf_nprobe = 64;
```

일반적으로 `nprobe` 값이 클수록 재현율이 높아지지만, 쿼리 지연 시간도 그에 따라 증가합니다.

### 3) BE 캐시 구성 {#3-be-cache-configuration}

<!-- Knowledge type: Configuration parameters -->

`ivf_on_disk`는 IVF 역색인 목록을 위한 전용 캐시를 도입합니다. 관련 BE 구성은 다음과 같습니다.

| 구성 항목                              | 기본값 | 설명                                                |
| ----------------------------------------------- | ------- | ---------------------------------------------------------- |
| `ann_index_ivf_list_cache_limit`                | `70%`   | 캐시 상한입니다. 백분율은 머신 전체의 물리 메모리가 아니라 BE 프로세스에서 사용할 수 있는 메모리(`mem_limit`으로 제한됨)를 기준으로 합니다. |
| `ann_index_ivf_list_cache_stale_sweep_time_sec` | `3600`  | 캐시에서 오래된 항목을 정리하는 주기이며, 단위는 초입니다. |

## 관측성 {#observability}

<!-- Knowledge type: Monitoring metrics -->
<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

`ivf_on_disk`의 성능 병목을 파악할 수 있도록 전용 Profile 카운터와 BE 메트릭을 제공합니다. 이를 통해 현재 캐시 크기가 적절한지, 지연 시간이 주로 디스크 페이지 폴트에서 발생하는지 또는 검색 연산 자체에서 발생하는지 확인할 수 있습니다.

주요 Profile 필드:

- `AnnIvfOnDiskLoadCosts`
- `AnnIvfOnDiskCacheHitCnt`
- `AnnIvfOnDiskCacheMissCnt`

주요 BE 메트릭:

- `ann_ivf_on_disk_fetch_page_costs_ms`
- `ann_ivf_on_disk_fetch_page_cnt`
- `ann_ivf_on_disk_search_costs_ms`
- `ann_ivf_on_disk_search_cnt`
- `ann_ivf_on_disk_cache_hit_cnt`
- `ann_ivf_on_disk_cache_miss_cnt`

## 사용 시 유의 사항 {#usage-notes}

<!-- Knowledge type: Usage constraints -->

- `ivf_on_disk`에는 기존 ANN 인덱스의 주요 사용 제약 사항(예: 벡터 컬럼 타입 및 인덱스 매개변수의 유효성)이 동일하게 적용됩니다.
- 학습 품질과 검색 효과는 여전히 데이터 규모와 매개변수 조합(`nlist`, `ivf_nprobe`)에 따라 달라집니다.
- `ivf_on_disk`는 Stream Load와 같은 일반적인 데이터 적재 경로를 지원합니다. 프로덕션 환경에 적용하기 전에 실제 업무 데이터로 검증하는 것이 좋습니다.

## 성능 참고 데이터 {#performance-reference-data}

<!-- Knowledge type: Performance reference -->

다음 표는 캐시가 포괄하는 데이터 비율, 메모리 사용량, 지연 시간 사이의 실질적인 상충 관계를 보여 주는 참고용 벤치마크 결과입니다.

| 시나리오               | 메모리 사용량 (GB) | AnnIndexIVFListCache 적중률 | 최대 QPS | Recall@100 | 평균 지연 시간 (s) | P99 지연 시간 (s) | P95 지연 시간 (s) |
| ---------------------- | ----------------: | -----------------------------: | ------: | ---------: | ------------------: | --------------: | --------------: |
| Brute Force(인덱스 없음) |                 - |                              - |  0.2922 |     0.0000 |            292.5394 |        307.9490 |        307.9442 |
| 메모리 내 IVF          |              32.0 |                           100% | 71.8535 |     0.9598 |              0.4167 |          0.5623 |          0.5151 |
| OnDisk 캐시 100%      |              32.0 |                           100% | 72.3649 |     0.9599 |              0.8274 |          1.1236 |          1.0395 |
| OnDisk 캐시 79%       |              22.0 |                            70% | 45.0266 |     0.9599 |              1.9900 |          4.4059 |          3.3568 |
| OnDisk 캐시 60%       |              16.7 |                            55% | 38.3141 |     0.9599 |              2.3281 |          4.0063 |          3.5542 |

데이터 해석 지침:

- 재현율이 거의 동일할 때(약 0.96), 캐시를 줄이면 메모리 사용량이 크게 감소하지만 꼬리 지연 시간이 증가합니다.
- 캐시가 포괄하는 데이터 비율이 100%에 가까워지면 `ivf_on_disk`는 메모리 내 IVF에 근접한 재현율을 유지할 수 있지만, 지연 시간은 다소 증가합니다.
- 프로덕션 환경에서는 적중률 메트릭을 지속적으로 모니터링하고, 이를 바탕으로 `ann_index_ivf_list_cache_limit`를 조정하는 것이 좋습니다.

## 튜닝 권장 사항 {#tuning-recommendations}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Performance tuning -->

다음 단계에 따라 반복적으로 튜닝하는 것을 권장합니다.

1. 먼저 `nlist` / `ivf_nprobe`에 `ivf`에서 기준으로 사용하던 매개변수 값을 그대로 적용하여 테스트를 시작합니다.
2. 메모리 예산에 맞게 `ann_index_ivf_list_cache_limit`를 설정한 다음, 적중률과 지연 시간의 변화를 관찰합니다.
3. 재현율은 안정적이지만 지연 시간 변동이 크다면, 우선 캐시 비율을 높인 뒤 적중률을 다시 테스트합니다.
4. 캐시 비율을 변경한 후에는 `ivf_nprobe`도 함께 다시 조정하여 재현율과 지연 시간의 균형을 맞춥니다.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Frequently asked questions -->

**Q1: `ivf_on_disk`와 `ivf`의 SQL 사용 방식에 차이가 있나요?**

차이가 없습니다. 인덱스를 생성할 때 `index_type`을 `ivf_on_disk`로 변경하기만 하면 됩니다. 쿼리 함수(`l2_distance_approximate` / `inner_product_approximate`)와 매개변수(`ivf_nprobe`)는 동일합니다.

**Q2: `ann_index_ivf_list_cache_limit`의 백분율은 무엇을 기준으로 하나요?**

머신 전체의 물리 메모리가 아니라 BE 프로세스에서 사용할 수 있는 메모리(`mem_limit`으로 제한됨)를 기준으로 합니다. BE 메모리 상한을 기준으로 캐시 비율을 계획하세요.

**Q3: 어느 정도의 적중률이 적절한가요?**

업무에서 허용할 수 있는 꼬리 지연 시간에 따라 달라집니다. 참고 데이터에 따르면 적중률이 100%일 때 지연 시간이 가장 안정적입니다. 적중률이 55%-70%로 떨어지면 메모리 사용량은 크게 줄어들지만, P99 지연 시간은 수 초 수준까지 증가할 수 있습니다. 관측성 메트릭을 기준으로 지속적으로 튜닝하세요.

**Q4: `ivf_on_disk`를 `ivf`보다 우선하여 선택해야 하는 경우는 언제인가요?**

벡터 규모가 크고(수천만 개 이상), 메모리 예산이 빠듯하며, ANN 가속이 필요한 경우에는 `ivf_on_disk`를 우선 선택하세요. 지연 시간에 매우 민감하고 메모리가 충분한 경우에는 `ivf`를 선택하세요.

## 관련 문서 {#related-documents}

- [벡터 인덱스 개요](./overview.md)
- [IVF 인덱스](./ivf.md)
- [HNSW 인덱스](./hnsw.md)
- [벡터 인덱스 관리](./index-management.md)
- [대규모 벡터 검색 성능](./performance-large-scale.md)
