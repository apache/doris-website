---
{
    "title": "ANN 리소스 산정 가이드",
    "sidebar_label": "리소스 산정",
    "language": "ko",
    "description": "Apache Doris 벡터 검색(ANN)에 필요한 메모리와 CPU 리소스를 산정하는 방법입니다. 이 문서에서는 HNSW/IVF 및 다양한 양자화 모드에 대한 용량 계획 방법을 설명합니다.",
    "keywords": [
        "ANN 리소스 산정",
        "벡터 검색 용량 계획",
        "HNSW 메모리 산정",
        "IVF 메모리 산정",
        "벡터 양자화 sq8 sq4 pq",
        "Doris 벡터 인덱스 CPU"
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

<!-- Knowledge type: Capacity planning / Resource estimation -->
<!-- Applicable scenarios: Pre-launch capacity planning / Cluster sizing / Memory and CPU budget estimation -->

벡터 검색(ANN) 워크로드에서는 일반적으로 디스크 용량보다 메모리와 CPU가 먼저 제약 요인이 됩니다. 이 문서는 운영 환경에 도입하기 전에 Apache Doris 벡터 검색 클러스터의 사양을 계획할 수 있도록 실용적인 리소스 산정 방법을 제공합니다.

## 빠른 탐색 {#quick-navigation}

- **ANN에 별도의 리소스 산정이 필요한 이유**를 알아보려면 [ANN 리소스 특성](#ann-resource-characteristics)을 참조하세요.
- **메모리를 바로 산정**하려면 [HNSW 메모리 산정](#hnsw-memory-estimation)과 [IVF 메모리 산정](#ivf-memory-estimation)을 참조하세요.
- **CPU를 산정**하려면 [CPU 코어 수 산정](#cpu-core-estimation)을 참조하세요.
- **운영 환경에서 확보해야 할 여유분**을 알아보려면 [운영 환경의 안전 여유분](#production-safety-margin-do-not-design-against-100-memory)을 참조하세요.
- **인덱스를 선택**하려면 [시나리오별 권장 사항](#scenario-based-recommendations)을 참조하세요.

## 산정 개요 {#estimation-overview}

일반적인 산정 순서는 다음과 같습니다.

1. **인덱스 메모리 산정**: 데이터 규모, 인덱스 유형, 양자화 모드를 기준으로 메모리에 상주할 인덱스의 메모리 사용량을 산정합니다.
2. **CPU 코어 수 산정**: 목표 QPS와 지연 시간을 기준으로 메모리 대비 CPU 비율에 맞춰 CPU 코어 수를 정합니다.
3. **안전 여유분 확보**: 쿼리 실행, 비벡터 컬럼 접근, Compaction을 위한 여유 공간을 확보합니다.

## ANN 리소스 특성 {#ann-resource-characteristics}

<!-- Knowledge type: Concept explanation -->

일반적인 OLAP 인덱스와 비교하면 ANN의 리소스 사용에는 다음과 같은 특성이 있습니다.

| 리소스 구분 | 리소스 특성 |
|----------|----------|
| 빌드 단계 CPU | 사용률이 높습니다. 데이터 적재 시 CPU 부하가 큽니다. |
| 빌드 단계 메모리 | Segment가 너무 크면 메모리가 부족해 단일 인덱스 빌드에 실패할 수 있습니다. |
| 쿼리 단계 메모리 | 높은 쿼리 성능을 얻으려면 일반적으로 인덱스를 최대한 메모리에 상주시켜야 합니다. |
| 쿼리 단계 CPU | QPS가 높은 시나리오에서는 CPU 코어 수가 중요합니다. |

Doris는 메모리 사용량을 줄이기 위해 `sq8`, `sq4`, `pq`의 세 가지 양자화 모드를 지원합니다. 양자화를 사용하면 일반적으로 다음과 같은 대가가 따릅니다.

- **데이터 적재 속도 저하**: 추가 인코딩 오버헤드가 발생합니다.
- **쿼리 속도 저하 가능성**: 추가 디코딩 또는 재구성 오버헤드가 발생합니다.
- **재현율 저하 가능성**: 손실 인코딩으로 인해 오차가 발생합니다.

## 산정에 필요한 입력 정보 체크리스트 {#estimation-input-checklist}

<!-- Knowledge type: Operational steps -->

산정을 시작하기 전에 다음 입력 정보를 준비하세요.

| 입력 정보 | 설명 |
|--------|------|
| 벡터 차원 `D` | 단일 벡터의 float 차원 수입니다. 예: `768`. |
| 전체 행 수 `N` | 인덱싱할 벡터의 총개수입니다. |
| 인덱스 유형 | `hnsw` / `ivf` / `ivf_on_disk` |
| 양자화 모드 | `flat` / `sq8` / `sq4` / `pq` |
| `max_degree` | HNSW에만 해당합니다. 그래프의 이웃 노드 수를 제어합니다. 기본값은 `32`입니다. |
| 목표 QPS 및 지연 시간 | CPU 코어 수 산정에 사용합니다. |

## HNSW 메모리 산정 {#hnsw-memory-estimation}

<!-- Knowledge type: Capacity planning formula -->

### 기본 파라미터에서의 경험식 {#empirical-formula-under-default-parameters}

기본값인 `max_degree=32`를 사용할 경우:

```
HNSW_FLAT_Bytes ~= 1.3 * D * 4 * N
```

각 항목의 의미는 다음과 같습니다.

- `D * 4 * N`은 원본 float32 벡터의 메모리 사용량입니다.
- `1.3`은 HNSW 그래프 구조로 인한 추가 오버헤드(약 `0.3`배)를 나타냅니다.

### `max_degree` 조정 시 보정 {#adjustment-when-tuning-max_degree}

`max_degree`가 클수록 그래프 구조의 오버헤드가 커집니다. 다음과 같이 비례해서 조정합니다.

```
HNSW_factor   ~= 1 + 0.3 * (max_degree / 32)
HNSW_FLAT_Bytes ~= HNSW_factor * D * 4 * N
```

### 양자화에 따른 대략적인 메모리 절감 효과 {#approximate-memory-reduction-from-quantization}

| 양자화 모드 | 메모리 비율(FLAT 대비) |
|----------|------------------------|
| `sq8` | 약 `1/4` |
| `sq4` | 약 `1/8` |
| `pq` | 일반적으로 `sq4`와 비슷함(예: `pq_m=D/2, pq_nbits=8`) |

### `ivf_on_disk` 참고 사항 {#notes-on-ivf_on_disk}

`ivf_on_disk`는 IVF의 학습 및 쿼리 파라미터 모델(`nlist` / `ivf_nprobe`)을 재사용하지만, 역색인 리스트 본문은 디스크에 저장하고 캐시를 통해 쿼리를 처리합니다. 용량을 계획할 때는 먼저 아래 IVF 산정치를 "전체 인덱스가 메모리에 상주하는 경우"의 상한으로 보고, 메모리에 상주시킬 것으로 예상하는 핫 데이터의 크기를 기준으로 `ann_index_ivf_list_cache_limit`을 별도로 계획하면 됩니다.

### 빠른 참조 (`D=768`, `max_degree=32`) {#quick-reference-d768-max_degree32}

| 행 수 | FLAT | SQ8 | SQ4 | PQ (`m=384, nbits=8`) |
|------|------|------|------|--------------------------|
| 1M | 4 GB | 1 GB | 0.5 GB | 0.5 GB |
| 10M | 40 GB | 10 GB | 5 GB | 5 GB |
| 100M | 400 GB | 100 GB | 50 GB | 50 GB |
| 1B | 4000 GB | 1000 GB | 500 GB | 500 GB |
| 10B | 40000 GB | 10000 GB | 5000 GB | 5000 GB |

## IVF 메모리 산정 {#ivf-memory-estimation}

<!-- Knowledge type: Capacity planning formula -->

IVF는 HNSW보다 구조적 오버헤드가 작으며, 다음과 같이 근사할 수 있습니다.

```
IVF_FLAT_Bytes ~= D * 4 * N
```

양자화를 적용했을 때 IVF의 메모리 절감 비율은 HNSW와 같습니다.

| 양자화 모드 | 메모리 비율(FLAT 대비) |
|----------|------------------------|
| `sq8` | 약 `1/4` |
| `sq4` | 약 `1/8` |
| `pq` | 일반적으로 `sq4`와 비슷함 |

### 빠른 참조 (`D=768`) {#quick-reference-d768}

| 행 수 | FLAT | SQ8 | SQ4 | PQ (`m=384, nbits=8`) |
|------|------|------|------|--------------------------|
| 1M | 3 GB | 0.75 GB | 0.35 GB | 0.35 GB |
| 10M | 30 GB | 7.5 GB | 3.5 GB | 3.5 GB |
| 100M | 300 GB | 75 GB | 35 GB | 35 GB |
| 1B | 3000 GB | 750 GB | 350 GB | 350 GB |
| 10B | 30000 GB | 7500 GB | 3500 GB | 3500 GB |

## CPU 코어 수 산정 {#cpu-core-estimation}

<!-- Knowledge type: Capacity planning formula -->

QPS가 높은 시나리오에서는 다음 경험적 비율을 출발점으로 삼을 수 있습니다.

```
16 cores : 64 GB   (about 1 core : 4 GB)
```

참고: 양자화를 활성화하더라도 CPU 수요가 인덱스 메모리와 같은 비율로 줄어드는 것은 아닙니다. 실제로는 다음과 같이 접근합니다.

1. 먼저 **FLAT 기준으로 환산한 워크로드**를 바탕으로 CPU를 산정합니다.
2. 그런 다음 실제 부하 테스트 결과를 바탕으로 적정 수준까지 점진적으로 줄입니다.

## 운영 환경의 안전 여유분(메모리 100% 사용을 기준으로 설계하지 않기) {#production-safety-margin-do-not-design-against-100-memory}

<!-- Knowledge type: Best practice -->

위 공식은 ANN 인덱스 자체만을 대상으로 하며, 전체 SQL 실행 오버헤드는 포함하지 않습니다. 예를 들어 다음과 같은 쿼리가 있습니다.

```sql
SELECT id, text, l2_distance_approximate(embedding, [...]) AS dist
FROM tbl
ORDER BY dist
LIMIT N;
```

TopN late materialization을 사용하더라도 실행 계층에서는 비벡터 컬럼과 연산자 상태를 처리할 추가 메모리가 필요합니다. 운영 환경에서는 다음을 권장합니다.

- ANN 인덱스 메모리를 장비 전체 메모리의 약 **70%** 이내로 유지합니다.
- 나머지 메모리는 쿼리 실행, Compaction, 기타 데이터 접근에 사용합니다.

## 시나리오별 권장 사항 {#scenario-based-recommendations}

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenarios: Index type and quantization mode selection -->

| 시나리오 | 권장 방안 | 설명 |
|------|----------|------|
| 메모리 예산이 충분하고 성능이 우선인 경우 | `HNSW + FLAT` | 재현율과 지연 시간 측면에서 가장 우수합니다. |
| 메모리가 제한된 경우 | `HNSW/IVF + PQ` | 일반적으로 `SQ8/SQ4`보다 균형이 좋습니다. |
| PQ 초기 파라미터 | `pq_m = D / 2` | 이후 재현율 및 지연 시간 부하 테스트 결과를 바탕으로 세부 조정합니다. |
| 쿼리 성능 요구 수준이 낮은 경우 | 먼저 CPU 사양을 낮춤 | "데이터 적재 시에는 높은 CPU 사양을 사용하고 안정화 후에는 사양을 낮추는" 전략도 사용할 수 있습니다. |

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Frequently asked questions -->

**질문1: 양자화를 활성화하면 메모리를 얼마나 줄일 수 있나요?**

답변: `sq8`은 FLAT의 약 `1/4`이며, `sq4`와 `pq`(예: `pq_m=D/2, pq_nbits=8`)는 약 `1/8`입니다. 정확한 값은 HNSW 그래프 구조의 오버헤드에도 영향을 받습니다.

**질문2: 양자화로 줄어든 메모리와 같은 비율로 CPU를 줄여도 되나요?**

답변: 권장하지 않습니다. 양자화는 주로 메모리 사용량을 줄이며, CPU 수요는 같은 비율로 줄어들지 않습니다. 먼저 FLAT 기준으로 환산한 워크로드를 바탕으로 CPU를 산정한 다음, 부하 테스트 결과에 따라 줄이는 것이 좋습니다.

**질문3: `max_degree`를 높이면 메모리는 어떻게 달라지나요?**

답변: HNSW 그래프 구조의 오버헤드는 `1 + 0.3 * (max_degree / 32)`에 따라 증가합니다. 예를 들어 `max_degree=64`일 때 계수는 약 `1.6`입니다.

**질문4: `ivf_on_disk`에는 메모리를 얼마나 할당해야 하나요?**

답변: 상한은 "IVF 전체가 메모리에 상주하는 경우"입니다. 실제 메모리 상주 크기는 `ann_index_ivf_list_cache_limit`에 의해 결정되며, 핫 데이터의 크기를 기준으로 별도로 평가할 수 있습니다.

**질문5: 메모리 100% 사용을 목표로 설계하면 안 되는 이유는 무엇인가요?**

답변: ANN 인덱스 외에도 SQL 실행 계층(비벡터 컬럼, 연산자 상태), Compaction, 기타 접근 작업이 메모리를 사용합니다. 약 30%의 여유분을 확보하고 인덱스 메모리는 전체 메모리의 70% 이내로 유지하는 것이 좋습니다.

## 관련 문서 {#related-documents}

- [벡터 검색 개요](./overview.md)
- [HNSW](./hnsw.md)
- [IVF](./ivf.md)
- [ANN 인덱스 관리](./index-management.md)
