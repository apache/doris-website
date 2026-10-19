---
{
    "title": "세션 변수 목록",
    "language": "ko",
    "description": "Doris 세션 변수의 값, 기본값 및 효과를 설명합니다."
}
---

:::caution 이 페이지는 작성 중이며 아직 완성되지 않았습니다

이 페이지는 Doris의 세션 변수를 모아 정리한 문서입니다. 현재는 최근 버전에서
**추가되거나, 기본값이 변경되거나, 제거된** 변수만 다루며, 아직 전체 변수를 다루는
참조 문서는 아닙니다. 여기에 없는 변수의 현재 값은 `SHOW VARIABLES LIKE '<pattern>'`으로
확인할 수 있습니다.

변수의 분류, 적용 범위 및 설정 방법은 [변수](./variables.md)를 참고하세요.

:::

## 조회 및 설정 {#inspect-and-set}

```sql
-- Inspect
SHOW VARIABLES LIKE 'enable_file_scanner_v2';

-- Current session only
SET enable_file_scanner_v2 = false;

-- Globally (applies to sessions created afterwards)
SET GLOBAL enable_file_scanner_v2 = false;
```

## 4.1.5의 변경 사항 {#what-changed-in-415}

| 분류 | 변수 |
| --- | --- |
| 추가 | `enable_hyperscan_fallback` |
| 기본값 변경 | `enable_file_cache`: `false`에서 `true`로 변경 |
| 동작 수정 | `profile_level`이 Master FE로 전달됨. `return_object_data_as_binary`에 따라 SQL Cache 결과를 구분함 |

## 4.1.4의 변경 사항 {#what-changed-in-414}

| 분류 | 변수 |
| --- | --- |
| 추가 | `enable_file_scanner_v2`, `enable_expr_zonemap_filter`, `enable_local_exchange_before_agg`, `enable_local_exchange_before_streaming_agg`, `runtime_filter_broadcast_join_producer_num`, `runtime_filter_tree_publish_max_send_bytes`, `bucket_shuffle_downgrade_ratio`, `eager_aggregation_on_broadcast_join`, `eager_agg_broadcast_row_count`, `force_eager_agg_hint`, `enable_topn_lazy_mat_phase2_no_write_file_cache`, `file_cache_query_limit_bytes`, `file_presigned_url_ttl_seconds`, `force_forward_all_queries` |
| 의미 변경 | `enable_runtime_filter_partition_prune`, `enable_nereids_distribute_planner` |
| 제거 | `eager_aggregation_on_join`, `plan_nereids_dump` |

## 외부 테이블 스캔 {#external-table-scan}

### `enable_file_cache` {#enable_file_cache}

| 항목 | 값 |
| --- | --- |
| 타입 | Boolean |
| 기본값 | `true` (4.1.5 이전에는 `false`) |
| 버전 | 4.1.5에서 기본값 변경 |

쿼리에서 File Cache를 사용할지 여부입니다. 같은 이름의 BE 설정도 활성화해야 합니다. 세션 변수만 활성화하고 BE 설정이 `false`이면 캐시를 사용하지 않습니다. 4.1.5에서 두 기본값이 모두 `true`로 변경되었습니다. 업그레이드 후에는 명시적으로 지정한 설정과 영구 저장된 전역 변수를 확인하세요. 경로, 용량 및 제한 사항은 [File Cache](../../compute-storage-decoupled/file-cache/file-cache.md)를 참고하세요.

### `external_scan_consistent_hash_spread_num` {#external_scan_consistent_hash_spread_num}

이 옵션은 외부 split 분산을 지원하는 개발 빌드용입니다. 동일한 원격 파일 split을 대상으로 독립적으로 계획된 쿼리를 조건에 맞는 여러 backend로 분산하여, 특정 backend에 스캔이 지속적으로 집중되는 현상을 줄일 수 있습니다.

| 항목 | 값 |
| --- | --- |
| 타입 | Integer |
| 기본값 | `1` |
| 유효한 값 | `0`부터 `2147483647`까지 |
| 적용 범위 | 세션. `SET GLOBAL`은 새 세션에 적용됨 |

| 값 | 동작 |
| --- | --- |
| `1` (기본값) | 기존 스케줄링 전략, 설정된 후보 수 및 전역 split 재분배를 유지합니다. 스캔을 하나의 backend로 **제한하지 않습니다**. |
| `0` | 쿼리의 compute group에서 조건에 맞는 모든 backend로 자동 분산합니다. `enable_file_cache` 또는 `use_consistent_hash_for_external_scan`이 활성화되어 있으면 consistent hashing을 사용하고, 그렇지 않으면 무작위 전략을 사용합니다. |
| `N > 1` | 파일 캐싱 또는 consistent hashing이 활성화되어 있으면 최대 N개의 서로 다른 consistent-hash 후보 내에서 분산하며, 후보 수는 조건에 맞는 backend 수를 초과하지 않습니다. 그렇지 않으면 round-robin 스케줄링을 유지합니다. |

```sql
-- Enable automatic spreading for this session, without requiring file cache or hash scheduling.
SET external_scan_consistent_hash_spread_num = 0;

-- Limit the hash candidate set. This does not require the cluster to have exactly three backends.
SET use_consistent_hash_for_external_scan = true;
SET external_scan_consistent_hash_spread_num = 3;

-- Preserve the original scheduling.
SET external_scan_consistent_hash_spread_num = 1;
-- Restore the compiled default, also 1.
UNSET VARIABLE external_scan_consistent_hash_spread_num;
```

분산 모드에서는 해당 쿼리의 정책에 따라 이미 할당된 스캔 가중치가 가장 작은 후보를 선택합니다. 가중치가 같은 후보 중에서는 균등한 확률로 무작위 선택합니다. 각 split은 한 번만 할당됩니다. 실시간 backend CPU 사용량을 기준으로 선택하지 않으며, 처리량이 일정 배수로 늘어난다고 보장하지도 않습니다. 파일 데이터 적재와 스키마 스캔은 기존 동작을 유지합니다.

분산 모드에서 최적화된 로컬 스케줄링이 활성화되어 있으면, 원격으로 접근 가능한 split은 호스트 힌트와 일치하는 backend를 우선합니다. 단, 해당 backend에 할당된 스캔 가중치가 조건에 맞는 모든 backend의 최소 가중치보다 크지 않아야 합니다. 그렇지 않으면 설정된 스케줄링 전략을 따릅니다. 이러한 로컬 우선순위에 따라 원격 split의 해시 후보에 포함되지 않은 backend가 선택될 수도 있습니다. 원격으로 접근할 수 없는 split은 여전히 필수 호스트와 일치하는 backend를 사용해야 합니다.

분산을 사용하면 이후의 전역 split 재분배가 비활성화되므로, 할당은 각 split의 적격 후보와 데이터 위치 제약을 벗어나지 않습니다. split이 여러 개이면 각 split의 후보 내에서만 부하를 조정하므로, 기존 전역 재분배보다 분산이 고르지 않을 수 있습니다.

이 옵션은 파일 캐싱을 활성화하지 않습니다. 파일 캐싱이 활성화되어 있을 때 `0`을 사용하면 조건에 맞는 모든 backend에 캐시 사본이 생성되어 캐시 준비를 위한 읽기와 캐시 저장 공간 사용량이 늘어날 수 있습니다. N을 명시하면 원격 해시 후보 수를 제한하지만, 데이터 위치에 따른 우선순위가 먼저 적용됩니다. 캐시 복제본을 미리 생성하지는 않습니다. 먼저 `1`을 사용하세요. 반복되는 쿼리가 포화 상태의 backend에 집중되고 조건에 맞는 다른 backend에 여유 용량이 있을 때 분산을 활성화하세요. 동일한 쿼리, 캐시 상태 및 리소스로 두 모드를 비교하세요.

영구 저장된 전역 값은 업그레이드 시에도 유지됩니다. 컴파일 시 기본값을 변경해도 저장된 전역 값 `0`은 초기화되지 않습니다. 새 세션에서 기존 스케줄링을 유지하려면 `SET GLOBAL external_scan_consistent_hash_spread_num = 1`을 사용하세요. 기존 세션에서는 세션 값을 별도로 변경해야 합니다. 음수, 정수가 아닌 값 또는 허용 범위를 벗어난 값은 거부됩니다.

### `enable_file_scanner_v2` {#enable_file_scanner_v2}

| 항목 | 값 |
| --- | --- |
| 타입 | Boolean |
| 기본값 | `true` |
| 버전 | 4.1.4에서 추가 |

외부 파일을 스캔할 때 File Scanner V2를 사용할지 여부입니다. 활성화하면 `FileScanNode`가
지원하는 쿼리 시나리오에 새 네이티브 스캔 엔진을 사용합니다. Parquet, ORC, CSV, JSON
형식과 Hive, Iceberg, Paimon, Hudi 테이블 형식을 지원합니다. JDBC Catalog와 Iceberg 시스템
테이블은 여전히 기존 스캔 경로를 사용합니다.

쿼리 문제가 새 스캐너와 관련이 있다고 의심되면 `false`로 설정하여 동작을 비교하세요.
[데이터 레이크 쿼리 튜닝](../../lakehouse/best-practices/optimization.md)을 참고하세요.

### `enable_expr_zonemap_filter` {#enable_expr_zonemap_filter}

| 항목 | 값 |
| --- | --- |
| 타입 | Boolean |
| 기본값 | `true` |
| 버전 | 4.1.4에서 추가 |

이 변수를 따르는 스캐너에서 표현식 ZoneMap 필터링을 제어합니다.

File Scanner V2는 항상 안전한 방식의 표현식 ZoneMap 필터링을 수행하며,
이 변수의 영향을 받지 않습니다.

### `enable_runtime_filter_partition_prune` {#enable_runtime_filter_partition_prune}

| 항목 | 값 |
| --- | --- |
| 타입 | Boolean |
| 기본값 | `true` |
| 버전 | 4.1.4에서 의미 변경 |

이 변수를 따르는 스캐너에서 runtime filter를 통한 파티션 프루닝을 제어합니다.

4.1.4부터 File Scanner V2는 항상 안전한 방식의 파티션 프루닝을 수행하므로, 이 변수를
`false`로 설정해도 File Scanner V2에는 영향을 주지 않습니다.

## 쿼리 계획 및 실행 {#query-planning-and-execution}

### `enable_nereids_distribute_planner` {#enable_nereids_distribute_planner}

| 항목 | 값 |
| --- | --- |
| 타입 | Boolean |
| 기본값 | `true` |
| 버전 | 4.1.4에서 업그레이드 동작 변경 |

Nereids 분산 플래너를 사용할지 여부입니다.

개발 버전인 dev의 기본값은 `true`입니다. 분산 플래너를 명시적으로 비활성화하려면 `SET GLOBAL enable_nereids_distribute_planner = false;`를 실행하고 현재 세션도 별도로 설정하세요. 4.1 계열의 버전 마이그레이션 동작은 dev와 다릅니다. 업그레이드가 저장된 전역 설정을 항상 덮어쓴다고 가정하지 마세요.

### `runtime_filter_broadcast_join_producer_num` {#runtime_filter_broadcast_join_producer_num}

| 항목 | 값 |
| --- | --- |
| 타입 | Int |
| 기본값 | `3` |
| 버전 | 4.1.4에서 추가 |

broadcast join에서 각 runtime filter를 생성하는 BE의 최대 수입니다.
`0` 이하의 값은 제한을 해제합니다.

broadcast join에서는 build 측의 모든 BE가 동일한 runtime filter 내용을 생성하므로,
생성자 수를 제한하면 대규모 클러스터에서 RPC 오버헤드를 크게 줄일 수 있습니다. 이 설정은 Nereids
분산 계획 경로에만 영향을 주며, 기존 Coordinator 경로는 원래 동작을 유지합니다.

### `runtime_filter_tree_publish_max_send_bytes` {#runtime_filter_tree_publish_max_send_bytes}

| 항목 | 값 |
| --- | --- |
| 타입 | Long (바이트) |
| 기본값 | `268435456` (256 MB) |
| 버전 | 4.1.4에서 추가 |

전역 runtime filter를 배포할 때 단일 RPC로 전송하는 최대 바이트 수입니다. 이 임계값을
초과하면 Doris는 트리(다단계) 배포로 전환하므로, 병합 노드가 동일한 대용량 필터를 모든
스캔 노드에 직접 전송하지 않아도 됩니다.

값이 `0`이면 트리 배포를 비활성화하고 직접 배포로 전환합니다. 값은
`0` 이상이어야 하며, 그렇지 않으면 설정에 실패합니다.

### `bucket_shuffle_downgrade_ratio` {#bucket_shuffle_downgrade_ratio}

| 항목 | 값 |
| --- | --- |
| 타입 | Double |
| 기본값 | `0.8` |
| 버전 | 4.1.4에서 추가 (실험적 기능) |

기본 테이블 측의 총 버킷 수가 전체 인스턴스 수에 이 비율을 곱한 값보다 작으면
bucket shuffle join을 일반 shuffle join으로 다운그레이드합니다. 값이 `0` 이하이면
다운그레이드하지 않습니다. 기본값인 `0.8`은 기존 동작을 유지합니다.

### `enable_local_exchange_before_agg` {#enable_local_exchange_before_agg}

| 항목 | 값 |
| --- | --- |
| 타입 | Boolean |
| 기본값 | `true` |
| 버전 | 4.1.4에서 추가 |

집계 연산자 앞에 local exchange를 삽입할지 여부입니다.

:::caution
이 기능을 끄는 것은 권장하지 않습니다. 4.1.4 이전에는 이 동작을 비활성화하면 직렬 또는
비해시 local exchange에서 **잘못된 결과**가 반환될 수 있었습니다. 이 문제는 4.1.4에서 수정되었습니다.
:::

### `enable_local_exchange_before_streaming_agg` {#enable_local_exchange_before_streaming_agg}

| 항목 | 값 |
| --- | --- |
| 타입 | Boolean |
| 기본값 | `false` |
| 버전 | 4.1.4에서 추가 |

스트리밍 집계 연산자 앞에 local exchange를 삽입할지 여부입니다.

### `eager_aggregation_on_broadcast_join` {#eager_aggregation_on_broadcast_join}

| 항목 | 값 |
| --- | --- |
| 타입 | Boolean |
| 기본값 | `true` |
| 버전 | 4.1.4에서 추가 |

broadcast join에서 eager aggregation(aggregation push-down)을 허용할지 여부입니다.

### `eager_agg_broadcast_row_count` {#eager_agg_broadcast_row_count}

| 항목 | 값 |
| --- | --- |
| 타입 | Int |
| 기본값 | `250000` |
| 버전 | 4.1.4에서 추가 |

broadcast join에 eager aggregation을 적용할지 결정하는 데 사용하는 행 수 임계값입니다.

### `force_eager_agg_hint` {#force_eager_agg_hint}

| 항목 | 값 |
| --- | --- |
| 타입 | String |
| 기본값 | `""` (빈 문자열) |
| 버전 | 4.1.4에서 추가 |

eager aggregation push-down을 강제하는 매칭 힌트로, 테스트와 디버깅용입니다.
**운영 환경에서는 권장하지 않습니다.**

형식은 `<func>:<qualifier.column | *>=<push|nopush>`이며, 각 항목은 `;`로 구분합니다.

```sql
SET force_eager_agg_hint = 'sum:t1.a=push; sum:t2.a=nopush; count:*=push';
```

항목은 집계 함수별로 매칭되지만, 효과는 개별 집계 함수에 독립적으로 적용되는 것이 아니라
현재 push-down 후보 분기 또는 하위 트리에 적용됩니다. 분기에서 매칭된 항목 중 하나라도
`nopush`이면 해당 분기는 push-down되지 않습니다. 그렇지 않고 매칭된 항목 중 하나라도 `push`이면
해당 분기에 push-down을 강제할 수 있으며, 같은 분기의 다른 집계도
해당 분기 단위의 결정을 따릅니다.

### `force_forward_all_queries` {#force_forward_all_queries}

| 항목 | 값 |
| --- | --- |
| 타입 | Boolean |
| 기본값 | `false` |
| 버전 | 4.1.4에서 추가 |

활성화하면 현재 세션의 모든 쿼리가 master FE로 전달됩니다. master FE와 follower FE 사이의
메타데이터 불일치로 발생하는 문제를 진단할 때 유용합니다. 이 변수는
같은 이름의 FE 설정 항목에 대응하는 세션 수준 변수입니다.

## 캐시 {#cache}

### `file_cache_query_limit_bytes` {#file_cache_query_limit_bytes}

| 항목 | 값 |
| --- | --- |
| 타입 | Long (바이트) |
| 기본값 | `-1` |
| 버전 | 4.1.4에서 추가 |

단일 쿼리가 각 BE에서 read-through를 통해 파일 캐시에 기록할 수 있는
원격 스캔 데이터의 최대 바이트 수입니다.

- `0` 미만: 제한 없음(기능 비활성화).
- `0`과 같음: 쿼리가 파일 캐시에 전혀 기록하지 않음.
- `0` 초과: 누적 원격 스캔 데이터 양이 이 임계값에 도달하면
  쿼리가 파일 캐시에 기록하는 것을 중단함.

일회성 대규모 스캔 때문에 캐시에서 자주 사용하는 데이터가 제거되는 것을 방지할 때 사용하세요.

### `enable_topn_lazy_mat_phase2_no_write_file_cache` {#enable_topn_lazy_mat_phase2_no_write_file_cache}

| 항목 | 값 |
| --- | --- |
| 타입 | Boolean |
| 기본값 | `false` |
| 버전 | 4.1.4에서 추가 |

활성화하면 TopN lazy materialization의 phase-2 읽기에서 파일 캐시 미스가 발생할 경우
원격 스토리지에 직접 접근하며, **캐시에서 찾지 못한 범위를 파일 캐시에 다시 쓰지 않습니다**.
phase-2 읽기 패턴이 무작위이고 캐시 적중률이 낮을 때 도움이 됩니다.

## AI 함수 {#ai-functions}

### `file_presigned_url_ttl_seconds` {#file_presigned_url_ttl_seconds}

| 항목 | 값 |
| --- | --- |
| 타입 | Long (초) |
| 기본값 | `3600` |
| 버전 | 4.1.4에서 추가 |

S3 호환 스토리지의 객체에 대해 멀티모달
`EMBED()` 시나리오에서 생성하는 presigned URL의 만료 시간입니다. 미디어 파일이 크고 제공자가 파일을 가져오는 데
시간이 더 오래 걸리면 이 값을 늘리세요. [EMBED](../sql-functions/ai-functions/distance-functions/embed.md)를 참고하세요.

## Profile 및 결과 출력 {#profile-and-result-output}

### `profile_level` {#profile_level}

| 항목 | 값 |
| --- | --- |
| 타입 | Integer (`1`, `2` 또는 `3`) |
| 기본값 | `2` |
| 버전 | 4.1.5에서 전달 동작 수정 |

Query Profile의 상세 수준을 제어합니다. `1`은 병합된 카운터를 수집하고, `2`는 상세 정보를 출력하며, `3`은 성능에 영향을 줄 수 있는 추가 카운터를 활성화합니다. 4.1.5부터 Master FE로 전달되는 쿼리에도 현재 세션의 수준이 유지됩니다. [Query Profile](../../query-acceleration/query-profile.md)을 참고하세요.

### `return_object_data_as_binary` {#return_object_data_as_binary}

| 항목 | 값 |
| --- | --- |
| 타입 | Boolean |
| 기본값 | `false` |
| 버전 | 4.1.5에서 SQL Cache 구분 동작 수정 |

MySQL 결과에서 HLL, BITMAP, QUANTILE_STATE 객체를 원시 바이너리 데이터로 반환할지 여부입니다. `false`이면 이 값은 NULL로 반환됩니다. 4.1.5부터 이 변수에 따라 SQL 결과 캐시 항목을 구분하므로, 바이너리 출력이 활성화된 세션에서 비활성화된 세션이 캐시한 NULL 결과를 재사용하지 않습니다.

## 정규 표현식 {#regular-expressions}

### `enable_hyperscan_fallback` {#enable_hyperscan_fallback}

| 항목 | 값 |
| --- | --- |
| 타입 | Boolean |
| 기본값 | `true` |
| 버전 | 4.1.5에서 추가 |

Hyperscan이 패턴을 컴파일하지 못할 때 RE2로 fallback할지 여부입니다. `true`이면 Doris는 RE2를 시도하고, `false`이면 Hyperscan 컴파일 오류를 반환합니다. fallback을 사용해도 RE2 자체가 지원하지 않는 구문이 추가로 지원되지는 않습니다. 이 변수는 고급 Boost.Regex 구문을 활성화하는 `enable_extended_regex`와 다른 경로를 제어합니다. [REGEXP](../sql-functions/scalar-functions/string-functions/regexp.md)를 참고하세요.

## 제거된 변수 {#removed-variables}

| 변수 | 제거된 버전 | 참고 사항 |
| --- | --- | --- |
| `eager_aggregation_on_join` | 4.1.4 | aggregation push-down 전략이 개편되었습니다. 대신 `eager_aggregation_on_broadcast_join`과 `eager_agg_broadcast_row_count`를 사용하세요. 아직 이 변수를 설정하는 스크립트가 있다면 해당 설정을 제거하세요 |
| `plan_nereids_dump` | 4.1.4 | 이제 minidump 재생 중에만 활성화되는 내부 상태입니다. 더 이상 `SET`으로 설정할 수 없습니다 |
