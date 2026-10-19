---
{
    "title": "catalog_meta_cache_statistics",
    "language": "ko",
    "description": "FE 노드의 External Catalog 메타데이터 캐시 구성, 활동 및 메모리 관리 통계를 조회합니다."
}
---

## 개요 {#overview}

`catalog_meta_cache_statistics`는 현재 사용자에게 보이는 FE, External Catalog, 메타데이터 캐시 엔진, 캐시 항목의 각 조합을 행 하나로 표시합니다. 캐시 구성과 Caffeine 활동 정보뿐 아니라 Doris 4.1.4에서 도입된 보유 메모리 한도, 추정 사용량, 축출 가중치, 캐시 저장 거부 정보도 포함합니다.

## 데이터베이스 {#database}

`information_schema`

## 테이블 정보 {#table-information}

| 열 | 유형 | 설명 |
|---|---|---|
| `FE_HOST` | STRING | 해당 행을 보고하는 FE 노드입니다. |
| `CATALOG_NAME` | STRING | External Catalog 이름입니다. |
| `ENGINE_NAME` | STRING | 메타데이터 캐시 엔진입니다. 예를 들어 `hive`, `iceberg`, `paimon` 등이 있습니다. |
| `ENTRY_NAME` | STRING | 엔진 내의 캐시 항목입니다. |
| `EFFECTIVE_ENABLED` | BOOLEAN | 활성화, TTL, 용량 및 가중치 설정을 평가한 결과, 항목이 현재 실제로 활성화되어 있는지 여부입니다. |
| `CONFIG_ENABLED` | BOOLEAN | 설정된 `enable` 값입니다. |
| `AUTO_REFRESH` | BOOLEAN | 관리형 자동 새로 고침이 활성화되어 있는지 여부입니다. |
| `TTL_SECOND` | BIGINT | 만료 시간(초)입니다. `-1`은 만료되지 않음을 의미하며, `0`은 항목을 비활성화합니다. |
| `CAPACITY` | BIGINT | 설정된 항목 수 기준 용량입니다. `max-weight`를 사용하면 항목 수 한도가 동시에 적용되지는 않지만, `0`이면 여전히 항목이 비활성화됩니다. |
| `ESTIMATED_SIZE` | BIGINT | 캐시된 매핑의 대략적인 개수입니다. |
| `REQUEST_COUNT` | BIGINT | 전체 캐시 조회 요청 수입니다. |
| `HIT_COUNT` | BIGINT | 캐시 적중 횟수입니다. |
| `MISS_COUNT` | BIGINT | 캐시 미스 횟수입니다. |
| `HIT_RATE` | DOUBLE | `0.0`부터 `1.0`까지의 캐시 적중률입니다. |
| `LOAD_SUCCESS_COUNT` | BIGINT | 캐시 데이터 적재 성공 횟수입니다. |
| `LOAD_FAILURE_COUNT` | BIGINT | 캐시 데이터 적재 실패 횟수입니다. |
| `TOTAL_LOAD_TIME_MS` | BIGINT | 전체 캐시 데이터 적재 시간(밀리초)입니다. |
| `AVG_LOAD_PENALTY_MS` | DOUBLE | 평균 데이터 적재 시간(밀리초)입니다. |
| `EVICTION_COUNT` | BIGINT | Caffeine에 의한 축출과 로컬 예산에 따른 명시적 축출 횟수입니다. |
| `INVALIDATE_COUNT` | BIGINT | 명시적 무효화 횟수입니다. |
| `LAST_LOAD_SUCCESS_TIME` | STRING | 가장 최근에 데이터 적재가 성공한 시각입니다. |
| `LAST_LOAD_FAILURE_TIME` | STRING | 가장 최근에 데이터 적재가 실패한 시각입니다. |
| `LAST_ERROR` | STRING | 가장 최근의 데이터 적재 오류입니다. 기록된 오류가 없으면 비어 있습니다. |
| `WEIGHT_BOUNDED` | BOOLEAN | 이 항목에 적용되는 FE, Catalog 또는 항목 단위의 메모리 한도가 있는지 여부입니다. |
| `MAX_WEIGHT` | BIGINT | 항목에 실제로 적용되는 메모리 한도(바이트)입니다. |
| `ESTIMATED_WEIGHT` | BIGINT | 이 항목에 대해 현재 예약된 추정 가중치(바이트)입니다. |
| `EVICTION_WEIGHT` | BIGINT | 자동 축출과 로컬 예산에 따른 축출로 해제된 추정 바이트 수의 누적값입니다. |
| `WEIGHT_REJECT_COUNT` | BIGINT | 추정이 불완전하거나 가중치 예산이 부족해 캐시 저장이 거부된 누적 횟수입니다. |
| `CATALOG_MAX_WEIGHT` | BIGINT | Catalog 메모리 한도(바이트)입니다. |
| `CATALOG_ESTIMATED_WEIGHT` | BIGINT | 이 Catalog에서 관리되는 항목 전체에 대해 현재 예약된 추정 가중치입니다. |
| `GLOBAL_MAX_WEIGHT` | BIGINT | FE 전체의 외부 메타데이터 캐시 메모리 한도(바이트)입니다. |
| `GLOBAL_ESTIMATED_WEIGHT` | BIGINT | FE에서 관리되는 외부 메타데이터 캐시 전체에 대해 현재 예약된 추정 가중치입니다. |
| `LAST_WEIGHT_REJECT_REASON` | STRING | 가장 최근에 가중치 기반 캐시 저장이 거부된 사유입니다. |

항목 수 한도가 적용되는 항목이거나 상위 한도가 설정되지 않은 경우, 가중치 관련 숫자 열은 해당 값이 적용되지 않을 때 `-1`을 사용합니다.

가중치 열의 값은 시간에 따라 다음 두 가지 방식으로 해석합니다.

- `ESTIMATED_WEIGHT`는 gauge 지표입니다. 쿼리 시점의 예약량을 나타냅니다.
- `WEIGHT_REJECT_COUNT`와 나머지 횟수 열은 현재 캐시 인스턴스의 누적값입니다. Catalog 속성 변경이나 FE 재시작 후 캐시 그룹이 재구성되면 영부터 다시 집계됩니다.

이 테이블은 과거 시점의 수집 데이터를 보관하지 않습니다. 추이를 확인하려면 주기적으로 데이터를 수집하세요.

## 사용 예시 {#usage-example}

Catalog별로 메모리 한도가 적용되는 항목의 메모리 예약량을 집계합니다. 보통 FE 메모리 문제를 조사할 때 가장 먼저 실행하는 쿼리입니다.

```sql
SELECT fe_host, catalog_name,
       SUM(estimated_weight) AS estimated_weight,
       SUM(weight_reject_count) AS weight_reject_count
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
GROUP BY fe_host, catalog_name
ORDER BY estimated_weight DESC;
```

메모리 한도가 적용되는 항목과 가장 최근의 캐시 저장 결과를 확인합니다.

```sql
SELECT fe_host, catalog_name, engine_name, entry_name,
       max_weight, estimated_weight,
       weight_reject_count, last_weight_reject_reason
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
ORDER BY fe_host, catalog_name, engine_name, entry_name;
```

특정 Catalog의 캐시 동작 상태와 데이터 적재 실패를 확인합니다.
특정 Catalog의 캐시 동작 상태와 데이터 적재 실패를 확인합니다.

```sql
SELECT engine_name, entry_name, effective_enabled,
       estimated_size, request_count, hit_rate,
       load_failure_count, last_error
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'iceberg_ctl'
ORDER BY engine_name, entry_name;
```
