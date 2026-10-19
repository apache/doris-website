---
{
    "title": "catalog_meta_cache_statistics",
    "language": "ko",
    "description": "FE 노드에서 External Catalog 메타데이터 캐시의 구성, 활동 및 메모리 관리 통계를 확인합니다."
}
---

## 개요 {#overview}

`catalog_meta_cache_statistics`는 현재 사용자에게 표시되는 각 FE, External Catalog, 메타데이터 캐시 엔진 및 캐시 항목의 조합마다 한 행을 표시합니다. 캐시 구성과 Caffeine 활동 통계뿐 아니라 Doris 4.1.4에 도입된 캐시 유지 메모리 한도, 추정 사용량 및 캐시 수용 거부 통계도 포함합니다.

## 데이터베이스 {#database}

`information_schema`

## 테이블 정보 {#table-information}

| 열 | 타입 | 설명 |
|---|---|---|
| `FE_HOST` | STRING | 해당 행을 보고하는 FE 노드. |
| `CATALOG_NAME` | STRING | External Catalog 이름. |
| `ENGINE_NAME` | STRING | `hive`, `iceberg`, `paimon` 등의 메타데이터 캐시 엔진. |
| `ENTRY_NAME` | STRING | 엔진 내 캐시 항목. |
| `EFFECTIVE_ENABLED` | BOOLEAN | 활성화 여부, TTL, 용량 및 가중치 설정을 평가한 결과, 해당 항목이 현재 실제로 활성화되어 있는지 여부. |
| `CONFIG_ENABLED` | BOOLEAN | 설정된 `enable` 값. |
| `AUTO_REFRESH` | BOOLEAN | 관리형 자동 새로 고침의 활성화 여부. |
| `TTL_SECOND` | BIGINT | 만료 시간(초). `-1`은 만료되지 않음을 의미하며, `0`은 해당 항목을 비활성화합니다. |
| `CAPACITY` | BIGINT | 설정된 항목 수 기준 용량. `max-weight`를 사용하는 경우 항목 수 제한으로 동시에 적용되지는 않지만, `0`이면 여전히 해당 항목이 비활성화됩니다. |
| `ESTIMATED_SIZE` | BIGINT | 캐시된 매핑의 대략적인 수. |
| `REQUEST_COUNT` | BIGINT | 총 캐시 조회 요청 수. |
| `HIT_COUNT` | BIGINT | 캐시 적중 횟수. |
| `MISS_COUNT` | BIGINT | 캐시 미스 횟수. |
| `HIT_RATE` | DOUBLE | `0.0`부터 `1.0`까지의 캐시 적중률. |
| `LOAD_SUCCESS_COUNT` | BIGINT | 캐시 데이터 적재 성공 횟수. |
| `LOAD_FAILURE_COUNT` | BIGINT | 캐시 데이터 적재 실패 횟수. |
| `TOTAL_LOAD_TIME_MS` | BIGINT | 총 캐시 데이터 적재 시간(밀리초). |
| `AVG_LOAD_PENALTY_MS` | DOUBLE | 평균 데이터 적재 시간(밀리초). |
| `EVICTION_COUNT` | BIGINT | Caffeine에 의한 제거 및 로컬 예산에 따른 명시적 제거 횟수. |
| `EVICTION_RATE` | DOUBLE | `EVICTION_COUNT`를 `REQUEST_COUNT`로 나눈 비율. 요청이 없으면 `0`입니다. |
| `INVALIDATE_COUNT` | BIGINT | 명시적 무효화 횟수. |
| `LAST_LOAD_SUCCESS_TIME` | STRING | 가장 최근에 데이터 적재에 성공한 시각. |
| `LAST_LOAD_FAILURE_TIME` | STRING | 가장 최근에 데이터 적재에 실패한 시각. |
| `LAST_ERROR` | STRING | 가장 최근의 데이터 적재 오류. 기록된 오류가 없으면 비어 있습니다. |
| `MAX_WEIGHT` | BIGINT | 해당 항목에 실제로 적용되는 메모리 한도(바이트). |
| `ESTIMATED_WEIGHT` | BIGINT | 해당 항목에 현재 예약된 추정 가중치(바이트). |
| `WEIGHT_REJECT_COUNT` | BIGINT | 추정이 불완전하거나 가중치 예산이 부족하여 캐시 수용이 거부된 누적 횟수. |
| `LAST_WEIGHT_REJECT_REASON` | STRING | 가장 최근의 가중치 기반 캐시 수용 거부 사유. |

적용되는 FE, Catalog 또는 항목 메모리 한도가 없는 항목의 경우, `MAX_WEIGHT`는 `-1`이고 `ESTIMATED_WEIGHT`는 `0`입니다.

가중치 관련 열은 시간에 따라 다음 두 가지 방식으로 해석됩니다.

- `ESTIMATED_WEIGHT`는 게이지입니다. 쿼리 시점의 예약량을 나타냅니다.
- `WEIGHT_REJECT_COUNT`와 그 밖의 횟수 관련 열은 현재 캐시 인스턴스의 누적값입니다. Catalog 속성 변경이나 FE 재시작 후 캐시 그룹이 재구성되면 영부터 다시 집계됩니다.

이 테이블은 과거 샘플을 보관하지 않습니다. 추이를 확인하려면 주기적으로 샘플을 수집하세요.

## 사용 예시 {#usage-example}

메모리 관리가 적용되는 항목의 예약량을 Catalog별로 집계합니다. 일반적으로 FE 메모리 문제를 조사할 때 가장 먼저 실행하는 쿼리입니다.

```sql
SELECT fe_host, catalog_name,
       SUM(estimated_weight) AS estimated_weight,
       SUM(weight_reject_count) AS weight_reject_count
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
GROUP BY fe_host, catalog_name
ORDER BY estimated_weight DESC;
```

메모리 관리가 적용되는 항목과 가장 최근의 캐시 수용 결과를 확인합니다.

```sql
SELECT fe_host, catalog_name, engine_name, entry_name,
       max_weight, estimated_weight,
       weight_reject_count, last_weight_reject_reason
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
ORDER BY fe_host, catalog_name, engine_name, entry_name;
```

특정 Catalog의 캐시 활성화 여부와 데이터 적재 실패를 확인합니다.
특정 Catalog의 캐시 활성화 여부와 데이터 적재 실패를 확인합니다.

```sql
SELECT engine_name, entry_name, effective_enabled,
       estimated_size, request_count, hit_rate,
       load_failure_count, last_error
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'iceberg_ctl'
ORDER BY engine_name, entry_name;
```
