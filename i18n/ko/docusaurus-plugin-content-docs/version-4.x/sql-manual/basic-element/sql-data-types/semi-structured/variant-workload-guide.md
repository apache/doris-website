---
{
    "title": "VARIANT 워크로드 가이드",
    "language": "ko",
    "description": "VARIANT를 언제 사용해야 하는지, 기본 모드, 희소 모드, DOC 모드, Schema Template 중 무엇을 선택해야 하는지, 설정을 어디서부터 시작해야 하는지 안내합니다."
}
---

## 개요 {#overview}

`VARIANT`는 반정형 JSON을 저장하고 자주 사용하는 경로에 Subcolumnization을 적용합니다.

새로운 `VARIANT` 워크로드의 데이터 모델을 결정할 때 이 가이드를 활용하세요. 다음과 같은 질문에 답하는 데 도움이 됩니다.

- 이 워크로드에는 `VARIANT`와 정적 컬럼 중 무엇을 사용해야 할까요?
- JSON의 폭이 매우 넓다면 기본 동작, 희소 컬럼, DOC 모드 중 무엇으로 시작해야 할까요?
- 어떤 설정은 기본값으로 두고, 어떤 설정부터 변경해야 할까요?

이미 `VARIANT`를 사용하기로 결정했고 구문이나 타입 규칙만 필요하다면 [VARIANT](./VARIANT)를 참조하세요. 바로 실행할 수 있는 최소한의 데이터 적재 예제가 필요하다면 [Variant 데이터 적재](../../../../data-operate/import/complex-types/variant)를 참조하세요.

:::tip VARIANT를 선택하는 이유
`VARIANT`는 JSON의 유연성을 유지하면서도 Doris가 자주 사용하는 경로에 Subcolumnization을 적용할 수 있게 합니다. 따라서 문서 전체의 스키마를 미리 고정하지 않아도 일반적인 필터링, 집계, 경로별 인덱스가 효율적으로 작동합니다. 폭이 매우 넓은 JSON에서도 스토리지 계층의 최적화 덕분에 훨씬 많은 경로에 Subcolumnization을 실용적으로 적용할 수 있습니다.
:::

## VARIANT가 적합한 경우 {#when-variant-fits}

다음 조건 대부분에 해당한다면 일반적으로 `VARIANT`가 적합합니다.

- 입력이 JSON 또는 다른 반정형 데이터이며, 필드가 시간이 지나면서 바뀝니다.
- 쿼리가 모든 행의 모든 필드를 읽기보다 일부 핫 경로에 주로 접근합니다.
- 컬럼형 분석 성능을 유지하면서 스키마 유연성을 확보하려고 합니다.
- 일부 경로에는 인덱스가 필요하지만, 나머지 많은 경로는 동적으로 유지해도 됩니다.

다음 조건이 더 중요하다면 정적 컬럼을 우선 고려하세요.

- 스키마가 안정적이고 미리 알려져 있습니다.
- 핵심 필드가 조인 키, 정렬 키 또는 타입을 엄격하게 관리하는 컬럼으로 자주 사용됩니다.
- 주된 요구 사항이 경로별 분석이 아니라 원본 JSON의 보관입니다.

## 먼저 확인할 네 가지 질문 {#four-questions-first}

설정을 변경하기 전에 다음 네 가지 질문에 답해 보세요.

### 1. 핫 경로가 명확한가요? {#1-are-there-clear-hot-paths}

쿼리가 같은 JSON 경로에 반복해서 접근한다면 Doris는 해당 경로에 Subcolumnization을 계속 적용할 수 있습니다. 이런 경우에 `VARIANT`의 이점이 가장 큽니다.

### 2. 일부 경로에 고정된 타입이나 안정적인 인덱스가 필요한가요? {#2-do-a-few-paths-need-fixed-types-or-stable-indexes}

그렇다면 해당 경로에만 Schema Template을 사용하세요. Schema Template은 비즈니스상 중요한 소수의 필드를 위한 기능이며, 문서 전체를 정의하기 위한 기능은 아닙니다.

### 3. 실제로 와이드 JSON 문제가 발생하고 있나요? {#3-is-this-really-becoming-wide-json}

경로 수가 계속 늘어나 메타데이터나 컴팩션에 부담을 주거나, 눈에 띄는 쿼리 오버헤드를 유발하기 시작하면 와이드 JSON 문제가 발생한 것입니다.

### 4. 와이드 JSON에서 핫 경로 분석과 전체 문서 반환 중 무엇이 더 중요한가요? {#4-for-wide-json-what-matters-more-hot-path-analytics-or-whole-document-return}

- 주된 활용이 여전히 핫 필드의 경로 기반 필터링, 집계, 인덱싱이라면 희소 컬럼을 우선 고려하세요.
- 주된 활용이 데이터 적재 효율이나 전체 문서 반환이라면 DOC 모드를 우선 고려하세요.

## 핵심 개념 {#key-concepts}

아래 스토리지 모드를 읽기 전에 다음 용어를 이해해 두세요. 각 용어를 2-3줄로 설명합니다. 구현 세부 사항은 [VARIANT](./VARIANT)를 참조하세요.

**Subcolumnization.** 데이터를 `VARIANT` 컬럼에 쓸 때 Doris가 JSON 경로를 자동으로 발견하고 핫 경로를 독립적인 컬럼형 서브컬럼으로 추출하여 효율적인 분석을 지원하는 기능입니다.

<img src="/images/variant/variant-default-storage.png" alt="기본 VARIANT: 자동 서브컬럼 추출" width="720" />

**Schema Template.** 선택한 경로를 안정적인 타입으로 고정하는 `VARIANT` 컬럼의 선언입니다. 타입, 인덱싱 가능 여부, 동작의 예측 가능성을 유지해야 하는 핵심 비즈니스 필드에 사용하세요. 가능한 모든 경로를 나열하려고 하지 마세요.

**와이드 JSON.** 서로 다른 경로의 수가 계속 늘어나 메타데이터 크기, 쓰기 비용, 컴팩션 비용 또는 쿼리 비용을 증가시키기 시작하면 와이드 JSON 문제가 발생한 것입니다.

**희소 컬럼.** 와이드 JSON에서 핫 경로와 콜드 경로가 명확하게 나뉘는 경우, 희소 컬럼은 핫 경로에 Subcolumnization을 유지하면서 콜드 경로인 롱테일 경로를 공유 희소 스토리지에 저장합니다. 희소 스토리지는 여러 물리 컬럼에 걸친 샤딩을 지원하여 읽기 병렬성을 높입니다.

<img src="/images/variant/variant-sparse-storage.png" alt="희소 컬럼: 핫/콜드 경로 분리" width="720" />

위 그림처럼 `user_id`, `page`와 같은 핫 경로는 분석 성능을 온전히 유지하는 독립적인 컬럼형 서브컬럼으로 남고, 수천 개의 롱테일 경로는 공유 희소 스토리지에 모입니다. 이 임계값은 `variant_max_subcolumns_count`로 제어합니다.

**희소 샤딩.** 롱테일 경로 수가 매우 많으면 단일 희소 컬럼이 읽기 병목이 될 수 있습니다. 희소 샤딩은 해시를 기준으로 롱테일 경로를 여러 물리 컬럼에 분산하여(`variant_sparse_hash_shard_count`) 병렬로 스캔할 수 있게 합니다.

<img src="/images/variant/variant-sparse-sharding.png" alt="희소 샤딩: 롱테일 경로 병렬 읽기" width="720" />

**DOC 모드.** 쓰기 시점의 Subcolumnization을 지연하고, 원본 JSON을 맵 형식의 저장 필드인 **doc map**에 추가로 저장합니다. 저장 공간을 더 사용하는 대신 빠른 데이터 적재와 효율적인 전체 문서 반환을 제공합니다. Subcolumnization은 이후 컴팩션 중에 수행됩니다.

<img src="/images/variant/variant-doc-mode.png" alt="DOC 모드: 추출 지연 + 빠른 문서 반환" width="700" />

위 그림처럼 쓰기 시점에는 JSON을 Doc Store에 원래 형태 그대로 보존하여 빠르게 적재합니다. 서브컬럼은 이후 컴팩션 중에 추출합니다. 읽기 시점에 경로 기반 쿼리(예: `SELECT v['user_id']`)는 구체화된 서브컬럼에서 컬럼형 스토리지의 성능을 온전히 활용하여 읽고, 전체 문서 쿼리(`SELECT v`)는 서브컬럼에서 문서를 재구성하지 않고 Doc Store에서 직접 읽습니다.

DOC 모드에는 쿼리 대상 경로의 구체화 여부에 따라 세 가지 읽기 경로가 있습니다.

<img src="/images/variant/variant-doc-mode-readpaths.png" alt="DOC 모드: 읽기 경로 상세" width="720" />

- **DOC Materialized**: 쿼리 대상 경로가 이미 서브컬럼으로 추출된 상태입니다(컴팩션 이후 또는 `variant_doc_materialization_min_rows` 조건 충족 시). 기본 VARIANT와 동일하게 컬럼형 스토리지의 성능을 온전히 활용하여 읽습니다.
- **DOC Map**: 쿼리 대상 경로가 아직 구체화되지 않은 상태입니다. 쿼리가 doc map 전체를 스캔하여 값을 찾는 방식으로 폴백하므로, 와이드 JSON에서는 훨씬 느립니다.
- **DOC Map (샤딩 적용)**: 동일한 폴백 방식이지만, `variant_doc_hash_shard_count`를 통해 doc map을 여러 물리 컬럼에 분산하므로 병렬 스캔이 가능하고 값을 훨씬 빠르게 복원할 수 있습니다.

**Storage Format V3.** 컬럼 메타데이터를 세그먼트 푸터에서 분리합니다. 수천 개의 서브컬럼이 있을 때 발생하는 메타데이터 병목을 없애므로, 모든 `VARIANT` 테이블에 권장되며 특히 와이드 JSON에 유용합니다.

## 권장 선택 절차 {#recommended-decision-path}

<img src="/images/variant/variant-decision-flowchart.png" alt="VARIANT 모드 선택 절차" width="520" />

## 스토리지 모드 {#storage-modes}

아래 테이블에서 시작할 모드를 고른 다음 해당 절을 읽어 보세요.

| | 일반적인 시나리오 | 권장 모드 | 주요 설정 |
|---|---|---|---|
| **A** | 이벤트 로그, 감사 로그 | 기본 VARIANT + V3 | 기본값 유지 |
| **B** | 광고 / 텔레메트리 / 사용자 프로필(폭이 넓고 핫 경로가 적음) | 희소 모드 + V3 | `variant_max_subcolumns_count`, `variant_sparse_hash_shard_count` |
| **C** | 모델 출력 / 트레이스 / 보관 데이터(데이터 적재 우선 또는 전체 문서 반환) | DOC 모드 + V3 | `variant_enable_doc_mode`, `variant_doc_materialization_min_rows` |
| **D** | 주문 / 결제 / 기기(핵심 경로에 안정적인 타입이 필요함) | Schema Template + A 또는 B | 핵심 경로만 정의 |

### 기본 모드 {#default-mode}

대부분의 새로운 `VARIANT` 워크로드에서 가장 안전한 출발점입니다.

대표적인 예는 쿼리가 몇 가지 익숙한 경로에 반복해서 접근하는 이벤트 로그나 감사 데이터입니다.

```sql
CREATE TABLE IF NOT EXISTS event_log (
    ts DATETIME NOT NULL,
    event_id BIGINT NOT NULL,
    event_type VARCHAR(64),
    payload VARIANT
)
DUPLICATE KEY(`ts`, `event_id`)
DISTRIBUTED BY HASH(`event_id`) BUCKETS 16
PROPERTIES (
    "replication_num" = "1",
    "storage_format" = "V3"
);
```

워크로드가 희소 컬럼이나 DOC 모드를 도입할 만큼 넓은지 아직 확실하지 않고, 주된 활용이 여전히 몇 가지 공통 경로에 대한 필터링, 집계, 그룹화인 경우 사용하세요.

유의 사항:
- 경로 증가로 이미 부담이 발생하고 있는 경우가 아니라면 `variant_max_subcolumns_count`를 미리 높이지 마세요.
- JSON의 폭이 넓지 않다면 희소 컬럼이나 DOC 모드를 활성화해도 이점 없이 복잡성만 늘어납니다.

### 희소 모드 {#sparse-mode}

데이터의 폭이 넓지만 대부분의 쿼리가 여전히 소수의 핫 경로에 집중한다면 희소 컬럼을 선택하세요.

대표적인 예는 선택적 속성이 수천 개 있지만 정기적으로 쿼리하는 속성은 수십 개뿐인 광고, 텔레메트리 또는 프로필 JSON입니다.

```sql
CREATE TABLE IF NOT EXISTS telemetry_wide (
    ts DATETIME NOT NULL,
    device_id BIGINT NOT NULL,
    attributes VARIANT<
        'device_type' : STRING,
        'region' : STRING,
        properties(
            'variant_max_subcolumns_count' = '2048',
            'variant_sparse_hash_shard_count' = '64'
        )
    >
)
DUPLICATE KEY(`ts`, `device_id`)
DISTRIBUTED BY HASH(`device_id`) BUCKETS 32
PROPERTIES (
    "replication_num" = "1",
    "storage_format" = "V3"
);
```

전체 키 수가 매우 많지만 주된 워크로드가 여전히 경로 기반 필터링, 집계, 인덱싱인 경우 사용하세요.

유의 사항:
- 핫 경로 분석이 병목이라면 DOC 모드부터 도입하지 마세요.
- `variant_max_subcolumns_count`의 기본값은 `2048`이며, 대부분의 워크로드에서 자동 Subcolumnization을 시작하기에 이미 적절한 값입니다. 사실상 모든 경로에 Subcolumnization이 적용될 정도로 크게 설정하지 마세요. 워크로드에 정말로 매우 많은 추출 서브컬럼이 필요하다면 [DOC 모드](#doc-mode-template)를 우선 고려하세요.

### DOC 모드 {#doc-mode-template}

경로 기반 분석 최적화보다 전체 JSON 문서 반환이나 데이터 적재 오버헤드 최소화가 더 중요하다면 DOC 모드를 선택하세요.

대표적인 예는 완전한 데이터 형태로 반환하는 경우가 많은 모델 응답, 트레이스 스냅샷 또는 보관된 JSON 문서입니다.

DOC 모드는 다음과 같은 경우에 도움이 됩니다.

- Subcolumnization 규모가 매우 커지면(경로 수가 10,000개에 가까워지면) 하드웨어 요구 사항이 빠르게 증가합니다. 이 규모에서는 DOC 모드가 더 안정적인 선택입니다.
- 기본 모드에서 즉시 Subcolumnization을 수행할 때와 비교하면 컴팩션 메모리 사용량이 약 삼분의 이 감소할 수 있습니다.
- 희소한 와이드 컬럼을 적재하는 워크로드에서는 처리량이 약 5–10× 향상될 수 있습니다.
- 쿼리가 전체 `VARIANT` 값(`SELECT variant_col`)을 읽을 때 DOC 모드는 수천 개의 서브컬럼에서 문서를 재구성하는 과정을 생략하므로, 속도를 수 자릿수 수준으로 높일 수 있습니다.

**시작하기:**

```sql
CREATE TABLE IF NOT EXISTS trace_archive (
    ts DATETIME NOT NULL,
    trace_id VARCHAR(64) NOT NULL,
    span VARIANT<
        'service_name' : STRING,
        properties(
            'variant_enable_doc_mode' = 'true',
            'variant_doc_materialization_min_rows' = '10000',
            'variant_doc_hash_shard_count' = '64'
        )
    >
)
DUPLICATE KEY(`ts`, `trace_id`)
DISTRIBUTED BY HASH(`trace_id`) BUCKETS 32
PROPERTIES (
    "replication_num" = "1",
    "storage_format" = "V3"
);
```

데이터 적재 처리량이 최우선이거나, 워크로드에서 전체 JSON 문서를 자주 반환해야 하거나, 폭이 매우 넓은 컬럼을 `SELECT variant_col`로 자주 읽는 경우 사용하세요.

유의 사항:
- DOC 모드가 모든 와이드 JSON 워크로드의 기본 해법은 아닙니다. 핫 경로 분석이 주를 이룬다면 대체로 희소 컬럼이 더 적합합니다.
- DOC 모드와 희소 컬럼은 상호 배타적이므로 동시에 활성화할 수 없습니다.

### Schema Template {#schema-template}

소수의 경로에 안정적인 타입, 안정적인 동작 또는 경로별 인덱스가 필요하다면 Schema Template을 선택하세요.

대표적인 예는 비즈니스상 중요한 몇 가지 경로가 정해진 타입과 검색 가능한 상태를 유지해야 하는 주문, 결제 또는 기기 데이터입니다.

```sql
CREATE TABLE IF NOT EXISTS order_events (
    ts DATETIME NOT NULL,
    order_id BIGINT NOT NULL,
    detail VARIANT<
        'status' : STRING,
        'amount' : DECIMAL(18, 2),
        'currency' : STRING
    >,
    INDEX idx_status(detail) USING INVERTED PROPERTIES("field_pattern" = "status")
)
DUPLICATE KEY(`ts`, `order_id`)
DISTRIBUTED BY HASH(`order_id`) BUCKETS 16
PROPERTIES (
    "replication_num" = "1",
    "storage_format" = "V3"
);
```

비즈니스상 중요한 필드가 소수이고, 해당 경로에 더 엄격한 타입 지정이나 경로별 인덱스 전략이 필요한 경우 사용하세요. 필요에 따라 Schema Template을 희소 컬럼이나 기본 `VARIANT`와 함께 사용하세요.

유의 사항:
- JSON 스키마 전체를 정적 템플릿으로 만들지 마세요. 그러면 `VARIANT`를 사용하는 의미가 사라집니다.
- Schema Template에는 핵심 경로만 포함하고 나머지는 동적으로 유지하세요.

## 성능 {#performance}

아래 차트는 경로가 10K개인 와이드 컬럼 데이터셋에서 단일 경로를 추출하는 시간을 비교합니다(200K개 행, 키 하나 추출, CPU 16개, 3회 실행의 중앙값).

<img src="/images/variant/variant-bench-query-time.svg" alt="와이드 컬럼의 단일 경로 추출: 쿼리 시간" width="720" />

| 모드 | 쿼리 시간 | 최대 메모리 |
|---|---:|---:|
| DOC Materialized | 76 ms | 1 MiB |
| VARIANT 기본 모드 | 76 ms | 1 MiB |
| DOC Map (샤딩 적용) | 148 ms | 1 MiB |
| JSONB | 887 ms | 32 GiB |
| DOC Map | 2,533 ms | 1 MiB |
| MAP\<STRING,STRING\> | 2,800 ms | 1 MiB |
| STRING (원본 JSON) | 6,104 ms | 48 GiB |

핵심 결과:

- **구체화된 서브컬럼의 성능이 가장 좋습니다.** 기본 모드와 DOC Materialized 모두 ~76 ms로, 원본 STRING보다 80×, JSONB보다 12× 빠릅니다.
- **DOC Map에 샤딩을 적용하면 도움이 됩니다.** doc map을 샤딩하면 구체화되지 않은 경로의 쿼리 시간이 2.5 s에서 148 ms로 줄어듭니다.
- **JSONB와 STRING은 메모리를 많이 사용합니다.** 최대 메모리 사용량이 32–48 GiB에 달하지만, VARIANT 모드는 1 MiB를 사용합니다.

## 모범 사례 {#best-practices}

### 데이터 적재 단계 {#import-phase}

- **새로운 `VARIANT` 테이블은 Storage Format V3로 시작하세요.** V3는 컬럼 메타데이터를 세그먼트 푸터에서 분리합니다. 이를 사용하지 않으면 와이드 JSON 워크로드에서 파일 열기가 느려지고 메모리 오버헤드가 커집니다.
- **핵심 경로는 초기에 Schema Template으로 고정하세요.** Schema Template이 없으면 시스템이 타입을 자동으로 추론합니다. 배치마다 같은 경로의 타입이 바뀌면(예: 정수에서 문자열로 변경) JSONB로 승격되고 해당 경로의 인덱스가 사라집니다.
- **기본 설정으로 시작하고 증상에 따라 조정하세요.** 대부분의 워크로드에는 기본값으로 충분합니다. AI 학습, 커넥티드 차량, 사용자 태그 시스템 같은 워크로드에서 유난히 큰 Subcolumnization 규모와 많은 경로별 인덱스가 필요할 때만 시나리오에 맞게 조정하세요. 첫날부터 과도하게 설정하면(`variant_max_subcolumns_count`를 매우 크게 설정하거나 필요하지 않은 DOC 모드를 활성화하는 등) 이점이 있다는 근거 없이 복잡성만 늘어납니다.

### 쿼리 단계 {#query-phase}

- **`SELECT *`를 폭이 매우 넓은 `VARIANT` 컬럼의 주 쿼리 패턴으로 사용하지 마세요.** DOC 모드를 사용하지 않으면 `SELECT *` 또는 `SELECT variant_col`은 모든 서브컬럼에서 큰 JSON을 재구성해야 하므로, `SELECT v['path']`처럼 경로를 지정하는 것보다 훨씬 느립니다.
- **쿼리가 타입에 의존할 때는 항상 하위 경로에 CAST를 적용하세요.** 타입 추론 결과가 예상과 다를 수 있습니다. `v['id']`가 실제로 STRING으로 저장되어 있는데 정수 리터럴과 비교하면 인덱스가 사용되지 않으며 결과가 잘못될 수 있습니다.

### 운영 단계 {#operations-phase}

- **컴팩션 부담을 살펴보세요.** 서브컬럼이 늘어나면 병합 비용이 증가합니다. Compaction Score가 계속 상승한다면 `variant_max_subcolumns_count`가 너무 높거나 데이터 적재 속도가 너무 빠르지 않은지 확인하세요.
- **스키마 드리프트를 살펴보세요.** JSON 구조가 자주 바뀌면 핫 경로가 희소 스토리지로 밀려나 쿼리가 갑자기 느려질 수 있습니다. 중요한 경로는 Schema Template으로 고정하세요.
- **타입 충돌을 살펴보세요.** 같은 경로에서 타입 충돌이 자주 발생한다면 JSONB 승격과 인덱스 손실을 방지하도록 해당 경로를 Schema Template으로 고정해야 한다는 신호입니다.

## 빠른 검증 {#quick-verify}

테이블을 생성한 후 다음의 최소한의 절차로 모든 기능이 작동하는지 확인하세요.

```sql
-- Insert sample data
INSERT INTO event_log VALUES
    ('2025-01-01 10:00:00', 1001, 'click', '{"page": "home", "user_id": 42, "duration_ms": 320}'),
    ('2025-01-01 10:00:01', 1002, 'purchase', '{"item": "widget", "price": 9.99, "user_id": 42}'),
    ('2025-01-01 10:00:02', 1003, 'click', '{"page": "search", "user_id": 99, "query": "doris variant"}');

-- Verify data
SELECT payload['user_id'], payload['page'] FROM event_log;

-- Check Subcolumnization results
SET describe_extend_variant_column = true;
DESC event_log;

-- Check per-row types
SELECT variant_type(payload) FROM event_log;
```

## 관련 문서 {#related-reading}

- [VARIANT](./VARIANT)
- [Variant 데이터 적재](../../../../data-operate/import/complex-types/variant)
- [Storage Format V3](../../../../table-design/storage-format)
- [SEARCH 함수](../../../../table-design/index/inverted-index/search-function.md)
