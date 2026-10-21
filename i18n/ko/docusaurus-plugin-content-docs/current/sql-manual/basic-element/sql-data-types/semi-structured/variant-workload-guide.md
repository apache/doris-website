---
{
    "title": "VARIANT 워크로드 가이드",
    "language": "ko",
    "description": "VARIANT를 사용해야 하는 경우, 기본 모드, sparse 모드, DOC 모드, Schema Template 중에서 선택하는 방법, 설정을 시작하는 방법을 안내하는 의사 결정 가이드입니다."
}
---

## 개요 {#overview}

`VARIANT`는 반정형 JSON을 저장하고 자주 사용하는 경로에 Subcolumnization을 적용합니다.

새로운 `VARIANT` 워크로드의 데이터 모델을 결정할 때 이 가이드를 참고하세요. 다음과 같은 질문에 답하는 데 도움이 됩니다.

- 이 워크로드에는 `VARIANT`와 정적 컬럼 중 어느 것을 사용해야 하나요?
- JSON의 경로 수가 매우 많다면 기본 동작, sparse 컬럼, DOC 모드 중 무엇으로 시작해야 하나요?
- 어떤 설정은 기본값으로 두고, 어떤 설정부터 변경해야 하나요?

이미 `VARIANT`를 사용하기로 결정했고 구문이나 타입 규칙만 필요하다면 [VARIANT](./VARIANT.md)를 참고하세요. 실행 가능한 최소한의 가져오기 예제가 필요하다면 [Variant 데이터 적재](../../../../data-operate/import/complex-types/variant.md)를 참고하세요.

:::tip VARIANT를 선택하는 이유
`VARIANT`는 JSON의 유연성을 유지하면서도 Doris가 자주 사용하는 경로에 Subcolumnization을 적용할 수 있게 합니다. 따라서 전체 문서 스키마를 미리 고정하지 않고도 일반적인 필터, 집계, 경로 단위 인덱스를 효율적으로 사용할 수 있습니다. 경로 수가 매우 많은 JSON에서도 스토리지 계층의 최적화 덕분에 훨씬 많은 경로에 Subcolumnization을 실용적으로 적용할 수 있습니다.
:::

## VARIANT가 적합한 경우 {#when-variant-fits}

다음 조건 대부분에 해당한다면 일반적으로 `VARIANT`가 적합합니다.

- 입력이 JSON이거나, 시간이 지나면서 필드가 바뀌는 다른 반정형 데이터입니다.
- 쿼리가 보통 모든 행의 모든 필드가 아니라 일부 핫 경로에 접근합니다.
- 컬럼형 분석 성능을 유지하면서 스키마의 유연성을 확보하고 싶습니다.
- 일부 경로에는 인덱스가 필요하지만, 나머지 많은 경로는 동적으로 유지해도 됩니다.

다음 조건이 주를 이룬다면 정적 컬럼을 사용하는 편이 좋습니다.

- 스키마가 안정적이고 사전에 알려져 있습니다.
- 핵심 필드를 조인 키, 정렬 키 또는 타입을 엄격히 관리하는 컬럼으로 자주 사용합니다. VARIANT 값도 조인하거나 정렬할 수 있지만, 타입이 지정된 컬럼이 더 빠르고 해당 타입의 의미 체계를 유지합니다.
- 경로별 분석보다 원본 JSON 보관이 주된 요구 사항입니다.

## 먼저 확인할 네 가지 질문 {#four-questions-first}

설정을 변경하기 전에 먼저 다음 네 가지 질문에 답해 보세요.

### 1. 명확한 핫 경로가 있나요? {#1-are-there-clear-hot-paths}

쿼리가 동일한 JSON 경로에 반복해서 접근한다면 Doris는 해당 경로에 Subcolumnization을 계속 적용할 수 있습니다. 이때 `VARIANT`의 이점이 가장 큽니다.

### 2. 일부 경로에 고정된 타입이나 안정적인 인덱스가 필요한가요? {#2-do-a-few-paths-need-fixed-types-or-stable-indexes}

그렇다면 해당 경로에만 Schema Template을 사용하세요. 이 기능은 문서 전체를 기술하기 위한 것이 아니라, 비즈니스에 중요한 소수의 필드를 위한 것입니다.

### 3. JSON의 경로 수가 정말 많아지고 있나요? {#3-is-this-really-becoming-wide-json}

경로 수가 계속 늘어나 메타데이터 부담, 컴팩션 부담 또는 눈에 띄는 쿼리 오버헤드를 유발하기 시작하면 와이드 JSON 문제가 발생한 것입니다.

### 4. 와이드 JSON에서 핫 경로 분석과 전체 문서 반환 중 무엇이 더 중요한가요? {#4-for-wide-json-what-matters-more-hot-path-analytics-or-whole-document-return}

- 핫 필드에 대한 경로 기반 필터링, 집계, 인덱싱이 여전히 주된 가치라면 sparse 컬럼을 우선 고려하세요.
- 수집 효율이나 전체 문서 반환이 주된 가치라면 DOC 모드를 우선 고려하세요.

## 주요 개념 {#key-concepts}

아래 스토리지 모드를 읽기 전에 다음 용어를 이해해 두세요. 각 용어는 2-3줄로 설명합니다. 구현에 관한 자세한 내용은 [VARIANT](./VARIANT.md)를 참고하세요.

**Subcolumnization.** `VARIANT` 컬럼에 데이터를 쓸 때 Doris가 JSON 경로를 자동으로 발견하고, 효율적인 분석을 위해 핫 경로를 독립적인 컬럼형 서브컬럼으로 추출합니다.

<img src="/images/variant/variant-default-storage.png" alt="기본 VARIANT: 자동 서브컬럼 추출" width="720" />

**Schema Template.** `VARIANT` 컬럼에서 선택한 경로의 타입을 고정하는 선언입니다. 타입과 인덱스 적용 가능 여부, 동작을 예측 가능하게 유지해야 하는 핵심 비즈니스 필드에 사용하세요. 가능한 모든 경로를 나열하려고 하지 마세요.

**와이드 JSON.** 서로 다른 경로의 수가 계속 늘어나 메타데이터 크기, 쓰기 비용, 컴팩션 비용 또는 쿼리 비용이 증가하기 시작하면 와이드 JSON 문제가 발생한 것입니다.

**Sparse 컬럼.** 와이드 JSON의 핫 경로와 콜드 경로가 명확히 구분될 때, sparse 컬럼은 핫 경로에 Subcolumnization을 유지하면서 콜드 경로인 롱테일 경로를 공유 sparse 스토리지로 옮깁니다. Sparse 스토리지는 여러 물리 컬럼에 걸친 샤딩을 지원하여 읽기 병렬성을 높입니다.

<img src="/images/variant/variant-sparse-storage.png" alt="Sparse 컬럼: 핫/콜드 경로 분리" width="720" />

위 그림처럼 핫 경로(예: `user_id`, `page`)는 독립적인 컬럼형 서브컬럼으로 유지되어 컬럼형 분석 성능을 온전히 활용하고, 수천 개의 롱테일 경로는 공유 sparse 스토리지에 모입니다. 이 임계값은 `variant_max_subcolumns_count`로 제어합니다.

**Sparse 샤딩.** 롱테일 경로 수가 매우 많으면 단일 sparse 컬럼이 읽기 병목이 될 수 있습니다. Sparse 샤딩은 해시를 기준으로 롱테일 경로를 여러 물리 컬럼에 분산하여(`variant_sparse_hash_shard_count`) 병렬로 스캔할 수 있게 합니다.

<img src="/images/variant/variant-sparse-sharding.png" alt="Sparse 샤딩: 롱테일 경로 병렬 읽기" width="720" />

**DOC 모드.** 쓰기 시점의 Subcolumnization을 지연하고, 원본 JSON을 map 형식의 저장 필드(**doc map**)로 추가 저장합니다. 추가 저장 공간을 사용하는 대신 빠른 수집과 효율적인 전체 문서 반환을 제공합니다. Subcolumnization은 이후 컴팩션 과정에서 수행됩니다.

<img src="/images/variant/variant-doc-mode.png" alt="DOC 모드: 추출 지연 + 빠른 문서 반환" width="700" />

위 그림처럼 쓰기 중에는 빠른 수집을 위해 JSON을 Doc Store에 그대로 보존합니다. 서브컬럼은 이후 컴팩션 과정에서 추출됩니다. 읽기 시 경로 기반 쿼리(예: `SELECT v['user_id']`)는 구체화된 서브컬럼에서 컬럼형 읽기 성능을 온전히 활용하고, 전체 문서 쿼리(`SELECT v`)는 서브컬럼에서 문서를 재구성하지 않고 Doc Store에서 직접 읽습니다.

DOC 모드에는 쿼리 대상 경로의 구체화 여부에 따라 서로 다른 세 가지 읽기 경로가 있습니다.

<img src="/images/variant/variant-doc-mode-readpaths.png" alt="DOC 모드: 읽기 경로 상세" width="720" />

- **DOC Materialized**: 쿼리 대상 경로가 이미 서브컬럼으로 추출된 상태입니다(컴팩션 이후 또는 `variant_doc_materialization_min_rows` 조건을 충족했을 때). 기본 VARIANT와 동일하게 컬럼형 읽기 성능을 온전히 활용합니다.
- **DOC Map**: 쿼리 대상 경로가 아직 구체화되지 않았습니다. 쿼리는 값을 찾기 위해 전체 doc map을 스캔하는 방식으로 전환되며, 와이드 JSON에서는 훨씬 느립니다.
- **DOC Map (Sharded)**: 동일한 대체 경로를 사용하지만, `variant_doc_hash_shard_count`를 통해 doc map을 여러 물리 컬럼에 분산하므로 병렬 스캔과 훨씬 빠른 값 조회가 가능합니다.

**Storage Format V3.** 컬럼 메타데이터를 세그먼트 푸터와 분리합니다. 서브컬럼이 수천 개 존재할 때 발생하는 메타데이터 병목을 제거하므로, 모든 `VARIANT` 테이블, 특히 와이드 JSON에 권장합니다.

## 권장 선택 절차 {#recommended-decision-path}

<img src="/images/variant/variant-decision-flowchart.png" alt="VARIANT 모드 선택 절차" width="520" />

## 스토리지 모드 {#storage-modes}

아래 표에서 시작점을 선택한 다음 해당 섹션을 읽어 보세요.

| | 일반적인 시나리오 | 권장 모드 | 주요 설정 |
|---|---|---|---|
| **A** | 이벤트 로그, 감사 로그 | 기본 VARIANT + V3 | 기본값 유지 |
| **B** | 광고 / 텔레메트리 / 사용자 프로필(전체 경로는 많고 핫 경로는 적음) | Sparse + V3 | `variant_max_subcolumns_count`, `variant_sparse_hash_shard_count` |
| **C** | 모델 출력 / 트레이스 / 아카이브(수집 우선 또는 전체 문서 반환) | DOC 모드 + V3 | `variant_enable_doc_mode`, `variant_doc_materialization_min_rows` |
| **D** | 주문 / 결제 / 디바이스(핵심 경로에 안정적인 타입 필요) | Schema Template + A 또는 B | 핵심 경로만 정의 |

### 기본 모드 {#default-mode}

대부분의 새로운 `VARIANT` 워크로드에서 가장 안전한 시작점입니다.

대표적인 예는 쿼리가 익숙한 몇 가지 경로에 반복해서 접근하는 이벤트 로그나 감사 데이터입니다.

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

워크로드의 경로 수가 sparse 컬럼이나 DOC 모드를 사용할 만큼 많은지 아직 확실하지 않고, 몇 가지 공통 경로에 대한 필터링, 집계, 그룹화에서 여전히 대부분의 가치를 얻는다면 이 모드를 사용하세요.

유의 사항:

- 경로 증가로 이미 부담이 생긴 경우가 아니라면 `variant_max_subcolumns_count`를 초기에 높이지 마세요.
- JSON의 경로 수가 많지 않다면 sparse 컬럼이나 DOC 모드를 활성화해도 이점 없이 복잡성만 늘어납니다.

### Sparse 모드 {#sparse-mode}

데이터의 경로 수는 많지만 대부분의 쿼리가 여전히 소수의 핫 경로에 집중한다면 sparse 컬럼을 선택하세요.

대표적인 예는 선택적 속성이 수천 개 있지만 정기적으로 쿼리하는 속성은 수십 개에 불과한 광고, 텔레메트리, 프로필 JSON입니다.

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

전체 키 수는 매우 많지만 주된 워크로드가 여전히 경로 기반 필터링, 집계, 인덱싱이라면 이 모드를 사용하세요.

유의 사항:

- 핫 경로 분석이 병목이라면 곧바로 DOC 모드부터 선택하지 마세요.
- `variant_max_subcolumns_count`의 기본값은 `2048`이며, 대부분의 워크로드에서 자동 Subcolumnization을 시작하기에 이미 적절한 값입니다. 사실상 모든 경로에 Subcolumnization이 적용될 정도로 크게 설정하지 마세요. 추출되는 서브컬럼의 규모가 정말로 매우 커야 하는 워크로드라면 [DOC 모드](#doc-mode-template)를 우선 고려하세요.

### DOC 모드 {#doc-mode-template}

경로 기반 분석 최적화보다 전체 JSON 문서 반환이나 수집 오버헤드 최소화가 더 중요하다면 DOC 모드를 선택하세요.

대표적인 예는 전체 데이터로 반환하는 경우가 많은 모델 응답, 트레이스 스냅샷, 보관된 JSON 문서입니다.

DOC 모드는 다음과 같은 경우에 도움이 됩니다.

- Subcolumnization 규모가 매우 커져 경로 수가 10,000개에 가까워지면 하드웨어 요구 사항이 빠르게 증가합니다. 이 규모에서는 DOC 모드가 더 안정적인 선택입니다.
- 기본 모드의 즉시 Subcolumnization과 비교하면 컴팩션 메모리 사용량이 약 삼분의 이만큼 줄어들 수 있습니다.
- Sparse 와이드 컬럼 수집 워크로드에서는 처리량이 약 5–10배 향상될 수 있습니다.
- 쿼리가 전체 `VARIANT` 값(`SELECT variant_col`)을 읽을 때 DOC 모드는 수천 개의 서브컬럼에서 문서를 재구성하지 않으므로, 속도가 여러 자릿수 수준으로 향상됩니다.

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

수집 처리량이 최우선이거나, 전체 JSON 문서를 반환해야 하는 경우가 많거나, 경로 수가 매우 많은 컬럼을 `SELECT variant_col`로 자주 읽는다면 이 모드를 사용하세요.

유의 사항:

- 모든 와이드 JSON 워크로드에서 DOC 모드가 기본 해답은 아닙니다. 핫 경로 분석이 주를 이룬다면 보통 sparse 컬럼이 더 적합합니다.
- DOC 모드와 sparse 컬럼은 상호 배타적입니다. 동시에 활성화할 수 없습니다.
- `DROP`, `RENAME`, 주석 변경을 제외하면 Schema Template이 있는 컬럼은 변경할 수 없으므로, `variant_doc_materialization_min_rows`도 나중에 변경할 수 없습니다. 테이블 생성 시 값을 결정하세요.

### Schema Template {#schema-template}

소수의 경로에 안정적인 타입, 안정적인 동작 또는 경로별 인덱스가 필요하다면 Schema Template을 선택하세요.

대표적인 예는 비즈니스에 중요한 몇 가지 경로의 타입과 검색 가능 여부를 유지해야 하는 주문, 결제, 디바이스 데이터입니다.

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

비즈니스에 중요한 필드가 소수이고 해당 경로에 더 엄격한 타입 지정이나 경로 단위 인덱스 전략이 필요하다면 사용하세요. 필요에 따라 Schema Template을 sparse 컬럼이나 기본 `VARIANT`와 함께 사용하세요.

유의 사항:

- 전체 JSON 스키마를 정적 템플릿으로 만들지 마세요. 그러면 `VARIANT`를 사용하는 의미가 사라집니다.
- Schema Template은 핵심 경로만 포함하고, 나머지는 동적으로 유지해야 합니다.
- 컬럼을 생성한 뒤에는 Schema Template을 변경할 수 없습니다. 운영 데이터 적재 전에 핵심 경로를 결정하세요.

## 성능 {#performance}

아래 차트는 경로가 10K개인 와이드 컬럼 데이터셋에서 단일 경로 추출 시간을 비교합니다(200K개 행, 키 하나 추출, CPU 16개, 3회 실행의 중앙값).

<img src="/images/variant/variant-bench-query-time.svg" alt="와이드 컬럼 단일 경로 추출: 쿼리 시간" width="720" />

| 모드 | 쿼리 시간 | 최대 메모리 사용량 |
|---|---:|---:|
| DOC Materialized | 76 ms | 1 MiB |
| VARIANT 기본 모드 | 76 ms | 1 MiB |
| DOC Map (Sharded) | 148 ms | 1 MiB |
| JSONB | 887 ms | 32 GiB |
| DOC Map | 2,533 ms | 1 MiB |
| MAP\<STRING,STRING\> | 2,800 ms | 1 MiB |
| STRING(원본 JSON) | 6,104 ms | 48 GiB |

주요 결과:

- **구체화된 서브컬럼이 가장 빠릅니다.** 기본 모드와 DOC Materialized는 모두 ~76 ms를 기록하며, 원본 STRING보다 80배, JSONB보다 12배 빠릅니다.
- **DOC Map에 샤딩을 적용하면 도움이 됩니다.** doc map을 샤딩하면 아직 구체화되지 않은 경로의 쿼리 시간이 2.5 s에서 148 ms로 줄어듭니다.
- **JSONB와 STRING은 메모리를 많이 사용합니다.** 최대 메모리 사용량은 32–48 GiB이며, VARIANT 모드는 1 MiB를 사용합니다.

## 권장 사항 {#best-practices}

### 데이터 적재 단계 {#import-phase}

- **새 `VARIANT` 테이블에는 처음부터 Storage Format V3를 사용하세요.** V3는 컬럼 메타데이터를 세그먼트 푸터와 분리합니다. 이를 사용하지 않으면 와이드 JSON 워크로드에서 파일 열기가 느려지고 메모리 오버헤드가 커집니다.
- **초기에 Schema Template으로 핵심 경로의 타입을 고정하세요.** Schema Template이 없으면 시스템이 타입을 자동으로 추론합니다. 배치마다 동일한 경로의 타입이 바뀌면(예: 정수에서 문자열로 변경) 해당 경로가 JSONB로 승격되고 그 경로의 인덱스가 사라집니다.
- **기본 설정으로 시작한 뒤 증상에 따라 조정하세요.** 대부분의 워크로드에서는 기본값으로 충분합니다. AI 학습, 커넥티드 차량, 사용자 태그 시스템처럼 유난히 큰 규모의 Subcolumnization과 많은 경로 단위 인덱스가 필요한 워크로드에 한해 시나리오별로 조정하세요. 첫날부터 지나치게 많은 설정을 적용하면(매우 큰 `variant_max_subcolumns_count`, 필요하지 않은 DOC 모드 활성화 등) 효과가 있다는 근거 없이 복잡성만 늘어납니다.

### 쿼리 단계 {#query-phase}

- **`SELECT *`를 경로 수가 매우 많은 `VARIANT` 컬럼의 주 쿼리 패턴으로 사용하지 마세요.** DOC 모드가 없으면 `SELECT *`나 `SELECT variant_col`은 모든 서브컬럼에서 큰 JSON을 재구성해야 하므로, `SELECT v['path']`처럼 경로를 지정하는 것보다 훨씬 느립니다.
- **필터에서는 하위 경로를 저장된 타입으로 CAST하세요.** `v['id'] = 123`과 같은 비교는 경로를 암시적으로 형 변환하고 행별로 평가하므로 zone maps, BloomFilter, 인덱스가 사용되지 않습니다. 경로가 저장된 타입을 사용해 `CAST(v['id'] AS BIGINT) = 123`처럼 작성하세요(타입은 `DESC`로 확인할 수 있으며, 먼저 `SET describe_extend_variant_column = true`를 실행해야 합니다). 문자열 경로를 문자열 리터럴과 비교할 때는 CAST가 필요하지 않습니다.
- **어떤 비교 규칙이 적용되는지 알아 두세요.** 경로를 리터럴과 비교하면 리터럴을 기준으로 선택한 타입으로 경로를 형 변환합니다. 두 VARIANT 값을 비교하거나 VARIANT 값으로 그룹화, 조인, 정렬할 때는 VARIANT의 의미 체계를 사용합니다. 숫자가 문자열보다 앞에 정렬되며, `1`은 `"1"`과 절대 같지 않습니다. [비교, 그룹화 및 정렬](./VARIANT.md#comparison-grouping-and-ordering)을 참고하세요.

### 운영 단계 {#operations-phase}

- **컴팩션 부담을 확인하세요.** 서브컬럼이 늘어나면 병합 비용이 증가합니다. Compaction Score가 계속 상승한다면 `variant_max_subcolumns_count`가 너무 높거나 수집 속도가 너무 빠른지 확인하세요.
- **스키마 드리프트를 주의하세요.** JSON 구조가 자주 바뀌면 핫 경로가 sparse 스토리지로 이동하여 쿼리가 갑자기 느려질 수 있습니다. Schema Template으로 중요한 경로를 고정하세요.
- **타입 충돌을 주의하세요.** 동일한 경로에서 타입 충돌이 자주 발생한다면 JSONB 승격과 인덱스 손실을 방지하도록 Schema Template으로 해당 경로의 타입을 고정해야 한다는 신호입니다.

## 간단한 검증 {#quick-verify}

테이블을 생성한 뒤 다음 최소한의 절차로 모든 기능이 동작하는지 확인하세요.

```sql
-- Insert sample data. INSERT stores a plain string as a VARIANT string, so parse the JSON text.
INSERT INTO event_log VALUES
    ('2025-01-01 10:00:00', 1001, 'click', PARSE_TO_VARIANT('{"page": "home", "user_id": 42, "duration_ms": 320}')),
    ('2025-01-01 10:00:01', 1002, 'purchase', PARSE_TO_VARIANT('{"item": "widget", "price": 9.99, "user_id": 42}')),
    ('2025-01-01 10:00:02', 1003, 'click', PARSE_TO_VARIANT('{"page": "search", "user_id": 99, "query": "doris variant"}'));

-- Verify data
SELECT payload['user_id'], payload['page'] FROM event_log;

-- Check Subcolumnization results
SET describe_extend_variant_column = true;
DESC event_log;

-- Check the type of one path, row by row
SELECT variant_type(payload['user_id']) FROM event_log;
```

## 관련 문서 {#related-reading}

- [VARIANT](./VARIANT.md)
- [Variant 데이터 적재](../../../../data-operate/import/complex-types/variant.md)
- [Storage Format V3](../../../../table-design/storage-format.md)
- [SEARCH 함수](../../../../table-design/index/inverted-index/search-function.md)
