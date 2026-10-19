---
{
    "title": "세션 변수 목록",
    "language": "ko",
    "description": "Doris 세션 변수의 값, 기본값 및 동작에 미치는 영향."
}
---

:::caution 이 페이지는 작성 중이며 아직 완성되지 않았습니다

이 페이지는 Doris의 세션 변수를 정리합니다. 현재는 최근 버전에서 **추가되었거나, 기본값이 변경되었거나, 제거된** 변수만 다루므로 아직 완전한 참조 문서는 아닙니다. 여기에 없는 변수는 `SHOW VARIABLES LIKE '<pattern>'`로 현재 값을 확인하세요.

변수의 분류, 적용 범위 및 설정 방법은 [변수](./variables.md)를 참조하세요.

:::

## 확인 및 설정 {#inspect-and-set}

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
| 동작 수정 | `profile_level`이 Master FE로 전달되도록 수정; `return_object_data_as_binary`에 따라 SQL Cache 결과를 구분 |

## 4.1.4의 변경 사항 {#what-changed-in-414}

| 분류 | 변수 |
| --- | --- |
| 추가 | `enable_file_scanner_v2`, `enable_external_scan_task_reuse`, `file_split_size_on_fe`, `file_split_size_on_be`, `enable_expr_zonemap_filter`, `enable_local_exchange_before_agg`, `enable_local_exchange_before_streaming_agg`, `runtime_filter_broadcast_join_producer_num`, `runtime_filter_tree_publish_max_send_bytes`, `bucket_shuffle_downgrade_ratio`, `eager_aggregation_on_broadcast_join`, `eager_agg_broadcast_row_count`, `force_eager_agg_hint`, `enable_topn_lazy_mat_phase2_no_write_file_cache`, `file_cache_query_limit_bytes`, `file_presigned_url_ttl_seconds`, `force_forward_all_queries` |
| 기본값 또는 의미 변경 | `max_scanners_concurrency`, `enable_runtime_filter_partition_prune`, `enable_nereids_distribute_planner` |
| 제거 | `eager_aggregation_on_join`, `plan_nereids_dump` |

## 외부 테이블 스캔 {#external-table-scan}

### `enable_file_cache` {#enable_file_cache}

| 항목 | 값 |
| --- | --- |
| 유형 | Boolean |
| 기본값 | `true` (4.1.5 이전에는 `false`) |
| 버전 | 4.1.5에서 기본값 변경 |

쿼리에서 File Cache를 사용할지 여부입니다. 같은 이름의 BE 설정도 활성화해야 합니다. BE 설정이 `false`이면 세션 변수만 활성화해도 캐시를 사용하지 않습니다. 4.1.5에서는 두 설정의 기본값이 모두 `true`로 변경되었습니다. 업그레이드 후에는 명시적으로 지정한 설정과 영구 저장된 전역 변수를 확인하세요. 경로, 용량 및 제한 사항은 [File Cache](../../compute-storage-decoupled/file-cache/file-cache.md)를 참조하세요.

### `enable_file_scanner_v2` {#enable_file_scanner_v2}

| 항목 | 값 |
| --- | --- |
| 유형 | Boolean |
| 기본값 | `true` |
| 버전 | 4.1.4에서 추가 |

외부 파일을 스캔할 때 File Scanner V2를 사용할지 여부입니다. 활성화하면 `FileScanNode`는 지원하는 쿼리 시나리오에서 새로운 네이티브 스캔 엔진을 사용합니다. Parquet, ORC, CSV, JSON 형식과 Hive, Iceberg, Paimon, Hudi 테이블 형식을 지원합니다. JDBC Catalog와 Iceberg 시스템 테이블은 계속 기존 스캔 경로를 사용합니다.

쿼리 문제가 새 스캐너와 관련이 있다고 의심되면 `false`로 설정하여 동작을 비교하세요. [데이터 레이크 쿼리 튜닝](../../lakehouse/best-practices/optimization.md)을 참조하세요.

### `enable_external_scan_task_reuse` {#enable_external_scan_task_reuse}

| 항목 | 값 |
| --- | --- |
| 유형 | Boolean |
| 기본값 | `true` |
| 버전 | 4.1.4에서 추가 |

하나의 문 내에서 동등한 외부 테이블 스캔 노드가 생성한 분할을 재사용할지 여부입니다. 활성화하면 동일한 외부 테이블에 대한 자체 조인이나 여러 번 참조되는 CTE에서 분할 계획을 다시 수립하지 않으므로 FE의 계획 수립 시간이 줄어듭니다. Hive, Hudi, Iceberg, Paimon에 적용됩니다.

### `file_split_size_on_fe` {#file_split_size_on_fe}

| 항목 | 값 |
| --- | --- |
| 유형 | Long (바이트) |
| 기본값 | `536870912` (512 MB) |
| 버전 | 4.1.4에서 추가 |

BE에서 더 세분화할 수 있을 때 FE가 생성하는 큰 단위 파일 분할의 목표 크기입니다. 양수가 아닌 값으로 설정하면 BE 측 세분화를 비활성화하고 기존 FE 분할 정책을 사용합니다.

### `file_split_size_on_be` {#file_split_size_on_be}

| 항목 | 값 |
| --- | --- |
| 유형 | Long (바이트) |
| 기본값 | `67108864` (64 MB) |
| 버전 | 4.1.4에서 추가 |

Parquet row group 또는 ORC stripe 단위로 BE가 생성하는 작은 단위 분할의 목표 크기입니다. row group이나 stripe는 나눌 수 없으므로 개별 분할의 크기가 이 목표를 초과할 수 있습니다.

### `enable_expr_zonemap_filter` {#enable_expr_zonemap_filter}

| 항목 | 값 |
| --- | --- |
| 유형 | Boolean |
| 기본값 | `false` |
| 버전 | 4.1.4에서 추가 |

이 변수를 따르는 스캐너에서 표현식 ZoneMap 필터링을 제어합니다.

File Scanner V2는 항상 안전한 방식의 표현식 ZoneMap 필터링을 수행하며, 이 변수의 영향을 받지 않습니다.

### `enable_runtime_filter_partition_prune` {#enable_runtime_filter_partition_prune}

| 항목 | 값 |
| --- | --- |
| 유형 | Boolean |
| 기본값 | `true` |
| 버전 | 4.1.4에서 의미 변경 |

이 변수를 따르는 스캐너에서 런타임 필터를 이용한 파티션 프루닝을 제어합니다.

4.1.4부터 File Scanner V2는 항상 안전한 방식의 파티션 프루닝을 수행하므로, 이 변수를 `false`로 설정해도 File Scanner V2에는 영향을 주지 않습니다.

### `max_scanners_concurrency` {#max_scanners_concurrency}

| 항목 | 값 |
| --- | --- |
| 유형 | Int |
| 기본값 | `8` (4.1.4 이전에는 `4`) |
| 버전 | 4.1.4에서 기본값 변경 |

ScanNode의 최대 스캔 동시 실행 수입니다. 4.1.4에서는 스캔 스레드가 병목일 때 처리량을 높이기 위해 기본값을 `4`에서 `8`로 늘렸습니다. 기존 동작을 유지하려면 `4`로 다시 설정하세요.

## 쿼리 계획 수립 및 실행 {#query-planning-and-execution}

### `enable_nereids_distribute_planner` {#enable_nereids_distribute_planner}

| 항목 | 값 |
| --- | --- |
| 유형 | Boolean |
| 기본값 | `true` |
| 버전 | 4.1.4에서 업그레이드 시 동작 변경 |

Nereids 분산 플래너를 사용할지 여부입니다.

4.1 계열에서는 4.1.4부터 마이그레이션 시 **전역 기본값을 `true`로 갱신**하는 작업이 `variable_version < 400`인 경우에만 수행됩니다. 일반적으로 3.x에서 업그레이드할 때 이 조건에 해당하며, `false`가 영구 저장되어 있어도 갱신합니다. 이미 4.x를 실행 중인 클러스터를 업그레이드할 때는 다시 갱신하지 않습니다. 업그레이드 후 실행 계획의 분산 방식이 달라지면 `SET GLOBAL enable_nereids_distribute_planner = false;`를 실행하여 이전 동작으로 되돌리세요.

### `runtime_filter_broadcast_join_producer_num` {#runtime_filter_broadcast_join_producer_num}

| 항목 | 값 |
| --- | --- |
| 유형 | Int |
| 기본값 | `3` |
| 버전 | 4.1.4에서 추가 |

브로드캐스트 조인에서 각 런타임 필터를 생성하는 BE의 최대 수입니다. `0` 이하의 값으로 설정하면 제한이 없어집니다.

브로드캐스트 조인에서는 빌드 측의 모든 BE가 동일한 내용의 런타임 필터를 생성하므로, 생성자 수를 제한하면 대규모 클러스터에서 RPC 오버헤드가 크게 줄어듭니다. 이 설정은 Nereids 분산 계획 경로에만 영향을 줍니다. 기존 Coordinator 경로는 기존 동작을 유지합니다.

### `runtime_filter_tree_publish_max_send_bytes` {#runtime_filter_tree_publish_max_send_bytes}

| 항목 | 값 |
| --- | --- |
| 유형 | Long (바이트) |
| 기본값 | `268435456` (256 MB) |
| 버전 | 4.1.4에서 추가 |

전역 런타임 필터를 배포할 때 단일 RPC로 전송하는 최대 바이트 수입니다. 이 임계값을 초과하면 Doris가 트리(다단계) 배포로 전환하므로, 병합 노드가 동일한 대형 필터를 모든 스캔 노드에 전송하지 않아도 됩니다.

값을 `0`으로 설정하면 트리 배포를 비활성화하고 직접 배포 방식을 사용합니다. 값은 `0` 이상이어야 하며, 그렇지 않으면 설정에 실패합니다.

### `bucket_shuffle_downgrade_ratio` {#bucket_shuffle_downgrade_ratio}

| 항목 | 값 |
| --- | --- |
| 유형 | Double |
| 기본값 | `0.8` |
| 버전 | 4.1.4에서 추가 (실험적) |

기준 테이블 측의 총 버킷 수가 전체 인스턴스 수에 이 비율을 곱한 값보다 작으면 버킷 셔플 조인을 일반 셔플 조인으로 전환합니다. 값이 `0` 이하이면 전환하지 않습니다. 기본값인 `0.8`은 기존 동작을 유지합니다.

### `enable_local_exchange_before_agg` {#enable_local_exchange_before_agg}

| 항목 | 값 |
| --- | --- |
| 유형 | Boolean |
| 기본값 | `true` |
| 버전 | 4.1.4에서 추가 |

집계 연산자 앞에 로컬 교환을 삽입할지 여부입니다.

:::caution
이 설정을 비활성화하는 것은 권장하지 않습니다. 4.1.4 이전에는 이 동작을 비활성화하면 직렬 또는 비해시 로컬 교환에서 **잘못된 결과**가 반환될 수 있었습니다. 이 문제는 4.1.4에서 수정되었습니다.
:::

### `enable_local_exchange_before_streaming_agg` {#enable_local_exchange_before_streaming_agg}

| 항목 | 값 |
| --- | --- |
| 유형 | Boolean |
| 기본값 | `false` |
| 버전 | 4.1.4에서 추가 |

스트리밍 집계 연산자 앞에 로컬 교환을 삽입할지 여부입니다.

### `eager_aggregation_on_broadcast_join` {#eager_aggregation_on_broadcast_join}

| 항목 | 값 |
| --- | --- |
| 유형 | Boolean |
| 기본값 | `true` |
| 버전 | 4.1.4에서 추가 |

브로드캐스트 조인에서 eager aggregation(집계 푸시다운)을 허용할지 여부입니다.

### `eager_agg_broadcast_row_count` {#eager_agg_broadcast_row_count}

| 항목 | 값 |
| --- | --- |
| 유형 | Int |
| 기본값 | `250000` |
| 버전 | 4.1.4에서 추가 |

브로드캐스트 조인에 eager aggregation을 적용할지 결정하는 데 사용하는 행 수 임계값입니다.

### `force_eager_agg_hint` {#force_eager_agg_hint}

| 항목 | 값 |
| --- | --- |
| 유형 | String |
| 기본값 | `""` (빈 문자열) |
| 버전 | 4.1.4에서 추가 |

eager aggregation 푸시다운을 강제하는 매칭 힌트로, 테스트와 디버깅을 위한 설정입니다.
**운영 환경에서는 사용하지 않는 것이 좋습니다.**

형식은 `<func>:<qualifier.column | *>=<push|nopush>`이며, 항목은 `;`로 구분합니다:

```sql
SET force_eager_agg_hint = 'sum:t1.a=push; sum:t2.a=nopush; count:*=push';
```

항목은 집계 함수별로 매칭되지만, 그 효과는 개별 집계 함수에 독립적으로 적용되는 것이 아니라 현재 푸시다운 후보 분기 또는 하위 트리에 적용됩니다. 분기에서 매칭된 항목 중 하나라도 `nopush`이면 해당 분기를 푸시다운하지 않습니다. 그렇지 않고 매칭된 항목 중 하나라도 `push`이면 해당 분기가 강제로 푸시다운될 수 있으며, 같은 분기의 다른 집계도 이 분기 단위 결정을 따릅니다.

### `force_forward_all_queries` {#force_forward_all_queries}

| 항목 | 값 |
| --- | --- |
| 유형 | Boolean |
| 기본값 | `false` |
| 버전 | 4.1.4에서 추가 |

활성화하면 현재 세션의 모든 쿼리가 master FE로 전달됩니다. master와 follower FE 간의 메타데이터 불일치로 발생하는 문제를 진단할 때 유용합니다. 이 변수는 같은 이름의 FE 설정 항목에 대응하는 세션 수준 설정입니다.

## 캐시 {#cache}

### `file_cache_query_limit_bytes` {#file_cache_query_limit_bytes}

| 항목 | 값 |
| --- | --- |
| 유형 | Long (바이트) |
| 기본값 | `-1` |
| 버전 | 4.1.4에서 추가 |

각 BE에서 단일 쿼리가 read-through를 통해 파일 캐시에 기록할 수 있는 원격 스캔 데이터의 최대 바이트 수입니다:

- `0` 미만: 제한 없음(기능 비활성화);
- `0`과 같음: 쿼리가 파일 캐시에 전혀 기록하지 않음;
- `0` 초과: 쿼리의 누적 원격 스캔 데이터양이 이 임계값에 도달하면 파일 캐시에 기록하는 것을 중지함.

일회성 대규모 스캔으로 자주 사용하는 데이터가 캐시에서 축출되는 것을 방지할 때 사용합니다.

### `enable_topn_lazy_mat_phase2_no_write_file_cache` {#enable_topn_lazy_mat_phase2_no_write_file_cache}

| 항목 | 값 |
| --- | --- |
| 유형 | Boolean |
| 기본값 | `false` |
| 버전 | 4.1.4에서 추가 |

활성화하면 TopN 지연 구체화의 2단계 읽기에서 파일 캐시 미스가 발생할 경우 원격 스토리지에 직접 접근하며, **캐시에 없는 범위를 파일 캐시에 다시 기록하지 않습니다**. 2단계 읽기 패턴이 무작위이고 캐시 적중률이 낮을 때 도움이 됩니다.

## AI 함수 {#ai-functions}

### `file_presigned_url_ttl_seconds` {#file_presigned_url_ttl_seconds}

| 항목 | 값 |
| --- | --- |
| 유형 | Long (초) |
| 기본값 | `3600` |
| 버전 | 4.1.4에서 추가 |

멀티모달 `EMBED()` 시나리오에서 S3 호환 스토리지의 객체에 대해 생성되는 presigned URL의 만료 시간입니다. 미디어 파일이 크고 제공자가 파일을 가져오는 데 시간이 오래 걸리면 이 값을 늘리세요. [EMBED](../sql-functions/ai-functions/distance-functions/embed.md)를 참조하세요.

## 프로파일 및 결과 출력 {#profile-and-result-output}

### `profile_level` {#profile_level}

| 항목 | 값 |
| --- | --- |
| 유형 | Integer (`1`, `2` 또는 `3`) |
| 기본값 | `2` |
| 버전 | 4.1.5에서 전달 동작 수정 |

Query Profile의 상세 수준을 제어합니다. `1`은 병합된 카운터를 수집하고, `2`는 상세 정보를 출력하며, `3`은 성능에 영향을 줄 수 있는 추가 카운터를 활성화합니다. 4.1.5부터 Master FE로 전달되는 쿼리에도 현재 세션의 수준이 유지됩니다. [Query Profile](../../query-acceleration/query-profile.md)을 참조하세요.

### `return_object_data_as_binary` {#return_object_data_as_binary}

| 항목 | 값 |
| --- | --- |
| 유형 | Boolean |
| 기본값 | `false` |
| 버전 | 4.1.5에서 SQL Cache 구분 동작 수정 |

MySQL 결과에서 HLL, BITMAP, QUANTILE_STATE 객체를 원시 바이너리 데이터로 반환할지 여부입니다. `false`이면 이 값들은 NULL로 반환됩니다. 4.1.5부터는 이 변수에 따라 SQL 결과 캐시 항목을 구분하므로, 바이너리 출력을 활성화한 세션이 이를 비활성화한 세션에서 캐시한 NULL 결과를 재사용하지 않습니다.

## 정규 표현식 {#regular-expressions}

### `enable_hyperscan_fallback` {#enable_hyperscan_fallback}

| 항목 | 값 |
| --- | --- |
| 유형 | Boolean |
| 기본값 | `true` |
| 버전 | 4.1.5에서 추가 |

Hyperscan에서 패턴을 컴파일할 수 없을 때 RE2로 폴백할지 여부입니다. `true`이면 Doris가 RE2를 시도하고, `false`이면 Hyperscan 컴파일 오류를 반환합니다. 폴백하더라도 RE2 자체가 지원하지 않는 문법이 추가되는 것은 아닙니다. 이 변수는 고급 Boost.Regex 문법을 활성화하는 `enable_extended_regex`와는 다른 경로를 제어합니다. [REGEXP](../sql-functions/scalar-functions/string-functions/regexp.md)를 참조하세요.

## 제거된 변수 {#removed-variables}

| 변수 | 제거된 버전 | 참고 사항 |
| --- | --- | --- |
| `eager_aggregation_on_join` | 4.1.4 | 집계 푸시다운 전략이 재설계되었습니다. 대신 `eager_aggregation_on_broadcast_join`과 `eager_agg_broadcast_row_count`를 사용하세요. 여전히 이 변수를 설정하는 스크립트가 있다면 해당 설정을 제거하세요 |
| `plan_nereids_dump` | 4.1.4 | 이제 minidump를 재생하는 동안에만 활성화되는 내부 상태이므로 `SET`으로 더 이상 설정할 수 없습니다 |
