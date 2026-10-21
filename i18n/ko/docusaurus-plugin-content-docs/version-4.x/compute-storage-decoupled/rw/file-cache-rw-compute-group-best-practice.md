---
{
    "title": "읽기/쓰기 분리를 위한 File Cache 최적화 모범 사례",
    "sidebar_label": "읽기/쓰기 분리: File Cache 최적화",
    "language": "ko",
    "description": "캐시 워밍업 구성을 통해 읽기/쓰기가 분리된 Apache Doris 컴퓨팅-스토리지 분리 배포 환경에서 읽기 전용 컴퓨팅 그룹의 Cache Miss 문제를 해결하고 쿼리 성능의 안정성을 높이는 방법을 설명합니다.",
    "keywords": ["File Cache", "cache warm-up", "read-write separation", "Cache Miss", "compute group", "compute-storage decoupled", "Compaction", "query performance"]
}
---

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Performance tuning / Read-write separation deployment -->

Apache Doris의 컴퓨팅-스토리지 분리 아키텍처에서 여러 컴퓨팅 그룹을 배포하여 읽기/쓰기를 분리하면 쿼리 성능은 File Cache 적중률에 크게 좌우됩니다. 읽기 전용 컴퓨팅 그룹에서 캐시 미스(Cache Miss)가 발생하면 원격 오브젝트 스토리지에서 데이터를 가져와야 하므로 쿼리 지연 시간이 크게 늘어날 수 있습니다.

이 문서에서는 캐시 워밍업과 관련 구성을 통해 **Compaction**, **데이터 수집**, **Schema Change**로 인한 캐시 미스 문제를 줄이고 읽기 전용 클러스터의 쿼리 성능을 안정적으로 유지하는 방법을 설명합니다.

## 핵심 문제: 새 데이터 버전(Rowsets)으로 인한 캐시 무효화 {#the-core-problem-cache-invalidation-caused-by-new-data-versions-rowsets}

<!-- Knowledge type: Principle explanation -->

Doris에서는 Compaction, Schema Change, 데이터 수집이 모두 새로운 데이터 파일 집합(Rowsets)을 생성합니다. 쓰기 전용 컴퓨팅 그룹은 기본적으로 쓰기 작업 중에 데이터를 로컬 File Cache에 캐싱하므로 해당 컴퓨팅 그룹의 쿼리 성능은 영향을 받지 않습니다.

읽기 전용 컴퓨팅 그룹이 메타데이터를 동기화하여 새 Rowsets를 인식하더라도 새 데이터 파일은 로컬 캐시에 없습니다. 이때 쿼리가 새 Rowset에 접근하면 캐시 미스가 발생하여 성능이 저하됩니다.

**핵심은 쿼리가 데이터에 접근하기 전에 읽기 전용 컴퓨팅 그룹의 캐시에 데이터를 미리 또는 지능적으로 로드하는 것입니다.**

## 캐시 워밍업 메커니즘 개요 {#cache-warm-up-mechanism-overview}

<!-- Knowledge type: Feature overview -->
<!-- Applicable scenario: Pre-deployment planning -->

캐시 워밍업은 원격 스토리지의 데이터를 BE 노드의 File Cache에 미리 로드하는 과정입니다. Doris는 크게 두 가지 워밍업 방식을 제공합니다.

| 워밍업 방식 | 적용 시나리오 | 특징 |
| --- | --- | --- |
| 능동 증분 워밍업 | 사용자에게 워밍업 관계를 구성할 권한이 있는 대부분의 시나리오 | 지능적으로 자동화되며 우선적으로 권장되는 방식 |
| 읽기 전용 컴퓨팅 그룹 자동 워밍업 | 워밍업 관계를 구성할 권한이 없거나 MoW가 아닌 테이블을 사용하는 경우 | 가볍고 구성이 간단함 |

### 능동 증분 워밍업(권장) {#active-incremental-warm-up-recommended}

<!-- Knowledge type: Operational steps -->

쓰기 컴퓨팅 그룹과 읽기 전용 컴퓨팅 그룹 사이에 워밍업 관계를 설정하면 쓰기나 Compaction 등의 이벤트로 새 Rowsets가 생성될 때 시스템이 연결된 읽기 전용 컴퓨팅 그룹에 알림을 보내고 비동기 캐시 워밍업을 수행하도록 트리거합니다.

자세한 구성 방법은 [FileCache 능동 증분 워밍업](./read-write-separation)을 참조하세요.

### 읽기 전용 컴퓨팅 그룹 자동 워밍업 {#read-only-compute-group-automatic-warm-up}

<!-- Knowledge type: Configuration parameters -->

읽기 전용 컴퓨팅 그룹의 BE 노드에서 이 구성을 활성화하면 시스템이 새 Rowsets를 감지할 때마다 비동기 워밍업 작업을 자동으로 트리거합니다.

읽기 전용 컴퓨팅 그룹의 `be.conf`에 다음을 설정합니다.

```properties
enable_warmup_immediately_on_new_rowset = true
```

### 그룹 간 피어 캐시 읽기(폴백) {#cross-group-peer-cache-read-fallback}

<!-- Knowledge type: Architecture selection decision -->

워밍업으로 처리하지 못한 콜드 읽기는 [피어 캐시 읽기](../file-cache/file-cache-peer-read)로 폴백할 수 있습니다. 로컬 캐시 미스가 발생하면 읽기 전용 컴퓨팅 그룹은 먼저 쓰기 컴퓨팅 그룹에 속한 BE의 File Cache에서 블록을 읽고, 이 시도가 실패한 경우에만 오브젝트 스토리지에 접근합니다. 쓰기 컴퓨팅 그룹을 채우기 컴퓨팅 그룹(`peer_cache_fill_compute_group_id`)으로 설정하면 쓰기 그룹이 읽기 전용 그룹을 대신해 오브젝트 스토리지에서 누락된 블록을 가져오고 자체 캐시에도 사본을 보관합니다.

피어 캐시 읽기는 기본적으로 활성화되어 있습니다. 이는 쿼리 시점에 수행되는 수동적인 읽기 방식으로 워밍업을 대체하지 않으며, 읽기 전용 쿼리가 쓰기 컴퓨팅 그룹의 네트워크와 캐시 읽기 용량을 활용할 수 있게 합니다. 엄격한 격리가 필요하면 이 기능을 비활성화하세요.

## Compaction과 Schema Change가 쿼리 성능에 미치는 영향 완화 {#mitigating-the-impact-of-compaction-and-schema-change-on-query-performance}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Troubleshooting / Performance tuning -->

백그라운드 Compaction은 기존 Rowsets를 병합하여 새 Rowsets를 생성합니다. 새 Rowsets의 워밍업이 완료되지 않으면 Cache Miss로 인해 읽기 전용 컴퓨팅 그룹의 쿼리 성능이 불안정해질 수 있습니다. 다음 두 가지 방안으로 이 문제를 해결할 수 있습니다.

### 방안 1: 능동 증분 워밍업 + 지연 커밋(권장) {#option-1-active-incremental-warm-up--delayed-commit-recommended}

이 방안은 읽기 전용 컴퓨팅 그룹이 Compaction이나 Schema Change로 생성된, 아직 캐싱되지 않은 새 Rowsets를 쿼리하는 것을 근본적으로 방지합니다.

**작동 방식:**

1. 쓰기 컴퓨팅 그룹과 읽기 전용 컴퓨팅 그룹 사이에 능동 증분 워밍업 관계를 구성합니다.
2. 쓰기 컴퓨팅 그룹의 BE 노드에서 Compaction과 Schema Change의 지연 커밋 기능을 활성화합니다.

쓰기 컴퓨팅 그룹의 `be.conf`에 다음을 설정합니다.

```properties
enable_compaction_delay_commit_for_warm_up = true
```

**처리 흐름:**

1. 쓰기 컴퓨팅 그룹에서 Compaction 또는 Schema Change 작업이 완료되어 새 Rowset이 생성됩니다.
2. 새 Rowset은 **즉시 커밋되지 않습니다**(읽기 전용 컴퓨팅 그룹에는 보이지 않음).
3. 시스템이 연결된 읽기 전용 컴퓨팅 그룹에 새 Rowset의 캐시 워밍업을 트리거합니다.
4. 연결된 모든 읽기 전용 컴퓨팅 그룹의 워밍업이 완료된 후에만 새 Rowset이 커밋되어 모든 컴퓨팅 그룹에 표시됩니다.

**장점:**

- **원활한 전환**: 읽기 전용 컴퓨팅 그룹에 보이는 모든 Compaction 결과가 이미 캐시에 있으므로 쿼리 성능이 불안정해지지 않습니다.
- **높은 안정성**: 읽기/쓰기 분리 시나리오에서 쿼리 성능을 보장하는 가장 안정적인 방안입니다.

### 방안 2: 읽기 전용 컴퓨팅 그룹 자동 워밍업 + 쿼리의 워밍업 상태 인식 {#option-2-read-only-compute-group-automatic-warm-up--query-awareness}

이 방안은 쿼리 계층에서 지능적으로 선택하여 워밍업이 아직 완료되지 않은 새 Rowsets를 가능한 한 건너뜁니다.

> **참고**: Unique Key MoW 테이블에서는 정확성 요구 사항 때문에 Compaction으로 생성된 Rowsets를 건너뛸 수 없습니다.

**구현 단계:**

1. 읽기 전용 컴퓨팅 그룹의 `be.conf`에서 자동 워밍업을 활성화합니다.

    ```properties
    enable_warmup_immediately_on_new_rowset = true
    ```

2. 쿼리 시점에 세션 변수 또는 사용자 속성을 통해 워밍업 상태를 고려하는 Rowset 선택 전략을 활성화합니다.

    쿼리 세션에 설정하는 경우:

    ```sql
    SET enable_prefer_cached_rowset = true;
    ```

    사용자 속성으로 설정하는 경우:

    ```sql
    SET property for "jack" enable_prefer_cached_rowset = true;
    ```

**처리 흐름:**

1. 읽기 전용 컴퓨팅 그룹이 Compaction으로 생성된 새 Rowset을 감지하면 비동기 워밍업 작업을 트리거합니다.
2. `enable_prefer_cached_rowset`이 활성화되어 있으면 쿼리 실행기는 워밍업이 이미 완료된 Rowset 버전을 우선적으로 선택합니다.
3. 아직 워밍업 중인 새 Rowsets는 쿼리가 데이터 일관성에 영향을 주지 않고 자동으로 건너뛰며, 대신 이미 캐싱된 이전 Rowsets에 접근합니다.

**유의 사항:**

이 방안은 최선형 전략입니다. 새 Rowset에 대응하는 이전 Rowsets가 이미 정리되었거나 쿼리가 최신 데이터 버전에 접근해야 하는 경우에는 쿼리가 여전히 워밍업 완료를 기다리거나 콜드 데이터를 직접 읽습니다.

## 데이터 수집이 쿼리 성능에 미치는 영향 완화 {#mitigating-the-impact-of-data-ingestion-on-query-performance}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: High-frequency writes / Real-time ingestion performance optimization -->

빈번한 데이터 수집(예: `INSERT INTO`, `Stream Load`)은 작은 새 파일(Rowsets)을 계속 생성하여 읽기 전용 컴퓨팅 그룹에서 Cache Miss를 유발합니다. 비즈니스에서 초 단위 또는 초 미만의 데이터 지연을 허용할 수 있다면 다음 조합 전략을 통해 데이터 최신성을 조금 양보하는 대신 성능을 크게 개선할 수 있습니다.

**작동 방식:** 자동 워밍업과 쿼리 시점의 최신성 허용 범위 설정을 결합하면 쿼리 실행기가 지정된 시간 범위 내에서 워밍업이 아직 완료되지 않은 최신 데이터를 지능적으로 건너뜁니다.

**구현 단계:**

1. **워밍업 메커니즘 활성화**: 읽기 전용 컴퓨팅 그룹에서 능동 증분 워밍업을 활성화하거나 자동 워밍업을 활성화합니다.

    ```properties
    enable_warmup_immediately_on_new_rowset = true
    ```

2. **쿼리의 최신성 허용 범위 설정**: 읽기 전용 컴퓨팅 그룹의 쿼리 세션 또는 사용자 속성에 `query_freshness_tolerance_ms`를 설정합니다.

    쿼리 세션에 설정하는 경우:

    ```sql
    -- Allow up to 1000 milliseconds (1 second) of data latency
    SET query_freshness_tolerance_ms = 1000;
    ```

    사용자 속성으로 설정하는 경우:

    ```sql
    SET property for "jack" query_freshness_tolerance_ms = 1000;
    ```

**처리 흐름:**

1. 쿼리가 실행되기 시작하면 접근해야 할 Rowsets를 검사합니다.
2. Rowset이 **최근 1000 ms 이내에 생성**되었고 **워밍업이 아직 완료되지 않았다면** 쿼리 실행기가 이를 자동으로 건너뛰고 대신 이미 캐싱된 이전 데이터에 접근합니다.
3. 대부분의 쿼리가 캐시에 적중하므로 새로 기록된 콜드 데이터를 읽을 때 발생하는 성능 저하를 피할 수 있습니다.

**폴백 동작:** Rowset의 워밍업이 `query_freshness_tolerance_ms`에 지정된 시간보다 오래 걸리면(예: 1000 ms 초과) 쿼리는 더 이상 해당 Rowset을 건너뛰지 않고 콜드 데이터를 직접 읽는 기본 동작으로 돌아갑니다. 이를 통해 데이터가 결국 쿼리에 표시되도록 보장합니다.

**장점:**

- **큰 성능 개선 효과**: 쓰기 처리량이 많은 시나리오에서 쿼리 성능의 급격한 변동을 효과적으로 없앱니다.
- **높은 유연성**: 사용자가 비즈니스 요구 사항에 따라 데이터 최신성과 쿼리 성능 사이의 균형을 유연하게 조정할 수 있습니다.

## 비교 및 선택 가이드 {#comparison-and-selection-guide}

<!-- Knowledge type: Architecture selection decision -->

| 방안 | 적용 시나리오 | Compaction 영향 | Schema Change 영향 | 새로 기록된 데이터의 영향 |
| --- | --- | --- | --- | --- |
| 능동 증분 워밍업 + 지연 커밋(+ 선택적 최신성 허용 범위) | 쿼리 지연 시간에 대한 요구 사항이 매우 엄격하고 워밍업 관계를 구성할 권한이 있는 경우 | 없음 | 없음 | 최신성 허용 범위 구성에 따라 달라짐 |
| 읽기 전용 컴퓨팅 그룹 자동 워밍업 + 캐싱된 데이터 우선 선택(+ 선택적 최신성 허용 범위) | 워밍업 관계를 구성할 권한이 없는 경우. 최신성 허용 범위를 구성하지 않으면 MoW 기본 키 테이블에는 효과가 없음 | 없음 | Cache Miss | 최신성 허용 범위 구성에 따라 달라짐 |

두 방안 모두 [그룹 간 피어 캐시 읽기](../file-cache/file-cache-peer-read)를 폴백으로 결합하여 워밍업으로 처리하지 못한 콜드 데이터의 오브젝트 스토리지 읽기를 줄일 수 있습니다. 위에서 설명한 캐시 워밍업 전략과 관련 구성을 적용하면 읽기/쓰기 분리 아키텍처의 Apache Doris에서 캐시 동작을 효과적으로 관리하고, 캐시 미스로 인한 성능 저하를 최소화하며, 읽기 전용 쿼리 워크로드를 안정적이고 효율적으로 처리할 수 있습니다.

## 자주 묻는 질문 {#frequently-asked-questions}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Troubleshooting / Operations Q&A -->

**질문: 능동 증분 워밍업과 읽기 전용 컴퓨팅 그룹 자동 워밍업을 동시에 활성화할 수 있나요?**

네. 두 기능은 상호 배타적이지 않습니다. 둘 다 활성화하면 워밍업 범위가 넓어집니다. 능동 증분 워밍업을 주로 사용하고 자동 워밍업을 보완 수단으로 사용하는 것을 권장합니다.

**질문: 지연 커밋을 활성화하면 Compaction 결과는 언제 표시되나요?**

연결된 모든 읽기 전용 컴퓨팅 그룹의 워밍업이 완료된 후에만 Compaction 결과가 커밋되어 모든 컴퓨팅 그룹에 표시됩니다. 워밍업 시간이 초과되면 시스템이 Compaction 파이프라인이 차단되지 않도록 강제로 커밋합니다.

**질문: `query_freshness_tolerance_ms`는 어떤 값으로 설정해야 하나요?**

비즈니스에서 허용할 수 있는 데이터 지연을 기준으로 값을 설정하세요. 일반적으로 500~2000 ms 범위에서 성능과 최신성 사이의 균형을 맞출 수 있습니다. 비즈니스의 실시간 요구 사항이 매우 엄격하다면 이 구성을 활성화하지 않는 것이 좋습니다.

**질문: MoW 기본 키 테이블의 Compaction Rowsets는 왜 건너뛸 수 없나요?**

MoW(Merge-on-Write) 테이블의 삭제 의미 체계는 Compaction 후 생성된 데이터 버전에 의존합니다. 해당 Rowsets를 건너뛰면 잘못된 쿼리 결과가 나올 수 있으므로 시스템은 항상 최신 Rowset을 읽습니다.

**질문: 읽기 전용 컴퓨팅 그룹의 쿼리 성능이 갑자기 떨어졌습니다. 원인을 빠르게 진단하려면 어떻게 해야 하나요?**

1. BE 모니터링에서 File Cache 적중률 지표를 확인하여 Cache Miss가 대량으로 발생하는지 파악합니다.
2. 최근 Compaction, Schema Change 또는 대규모 배치 데이터 수집 작업이 있었는지 확인합니다.
3. 워밍업 메커니즘이 올바르게 구성되어 있는지 확인합니다(`enable_warmup_immediately_on_new_rowset` 또는 능동 증분 워밍업).
4. 워밍업 작업의 실행 상태를 확인하여 워밍업이 정상적으로 완료되는지 점검합니다.
