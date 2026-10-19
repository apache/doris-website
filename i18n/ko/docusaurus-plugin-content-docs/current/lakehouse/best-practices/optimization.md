---
{
    "title": "데이터 레이크 쿼리 최적화",
    "language": "ko",
    "description": "이 문서는 레이크 데이터(Hive, Iceberg, Paimon 등)를 쿼리할 때 사용할 수 있는 주요 최적화 방법과 전략을 소개합니다."
}
---

이 문서는 레이크 데이터(Hive, Iceberg, Paimon 등)를 쿼리할 때 사용할 수 있는 주요 최적화 방법과 전략을 소개합니다.

## 파티션 프루닝 {#partition-pruning}

쿼리에 파티션 컬럼 조건을 지정하면 불필요한 파티션을 제외하여 읽어야 하는 데이터 양을 줄일 수 있습니다.

`EXPLAIN <SQL>`을 사용하여 `partition` 항목을 확인할 수 있습니다. 이 항목은 `XXX_SCAN_NODE`에 있으며, 파티션 프루닝의 적용 여부와 해당 쿼리에서 스캔해야 하는 파티션 수를 보여 줍니다.

예를 들면 다음과 같습니다.

```
0:VPAIMON_SCAN_NODE(88)
    table: paimon_ctl.db.table
    predicates: (user_id[#4] = 431304818)
    inputSplitNum=15775, totalFileSize=951754154566, scanRanges=15775
    partition=203/0
```

## 로컬 데이터 캐시 {#local-data-cache}

Data Cache는 원격 스토리지 시스템(HDFS 또는 객체 스토리지)에서 최근에 접근한 데이터 파일을 로컬 디스크에 캐시하여, 이후 동일한 데이터에 접근하는 쿼리의 속도를 높입니다.

캐시 기능은 기본적으로 비활성화되어 있습니다. 설정 및 활성화 방법은 [Data Cache](../data-cache.md) 문서를 참조하세요.

버전 4.0.2부터는 캐시 워밍업 기능을 지원하므로, 데이터 캐시를 더욱 적극적으로 활용하여 쿼리 성능을 높일 수 있습니다.

## 외부 split 분산 {#external-split-spreading}

외부 split 분산을 지원하는 개발 빌드에서는 동일한 원격 파일 split에 대한 반복 쿼리를 처리 가능한 여러 BE에 분산할 수 있습니다. 이러한 쿼리로 하나의 BE가 포화 상태에 이르고 다른 처리 가능한 BE에는 여유 용량이 있다면 이 기능의 활성화를 고려하세요.

```sql
-- Enable automatic spreading for the current session.
SET external_scan_consistent_hash_spread_num = 0;
```

기본값인 `1`은 기존 스케줄링 방식을 유지합니다. 분산 기능은 BE의 실시간 CPU 사용률을 사용하지 않으며, 처리량이 일정 배수로 증가함을 보장하지 않습니다. 또한 캐시 복사본과 워밍업을 위한 읽기가 늘어날 수 있습니다. 동일한 쿼리, 캐시 상태 및 리소스 조건에서 처리량을 비교하세요. 후보 수 제한, 데이터 지역성 규칙 및 초기화 명령은 [`external_scan_consistent_hash_spread_num`](../../sql-manual/basic-element/session-variables.md#external_scan_consistent_hash_spread_num)을 참조하세요.

## HDFS 읽기 최적화 {#hdfs-read-optimization}

[HDFS 문서](../storages/hdfs.md)의 **HDFS IO 최적화** 섹션을 참조하세요.

## split 수 제한 {#split-count-limit}

외부 테이블(Hive, Iceberg, Paimon 등)을 쿼리할 때 Doris는 병렬 처리를 위해 파일을 여러 split으로 나눕니다. 일부 상황에서는, 특히 작은 파일이 많을 때 split이 지나치게 많이 생성되어 다음과 같은 문제가 발생할 수 있습니다.

1. 메모리 부담: split이 너무 많으면 FE 메모리를 상당량 소비합니다
2. OOM 문제: split 수가 과도하면 OutOfMemoryError가 발생할 수 있습니다
3. 성능 저하: 너무 많은 split을 관리하면 쿼리 계획 수립에 드는 오버헤드가 증가합니다

`max_file_split_num` 세션 변수로 테이블 스캔당 허용되는 최대 split 수를 제한할 수 있습니다(4.0.4부터 지원).

- 유형: `int`
- 기본값: `100000`
- 설명: 배치 모드가 아닐 때 테이블 스캔당 허용되는 최대 split 수입니다. split이 너무 많아 OOM이 발생하는 것을 방지합니다.

사용 예시:

```sql
-- Set maximum split count to 50000
SET max_file_split_num = 50000;

-- Disable this limit (set to 0 or negative number)
SET max_file_split_num = 0;
```

이 제한을 설정하면 Doris는 split 수가 지정한 한도를 초과하지 않도록 최소 split 크기를 동적으로 계산합니다.

## File Scanner V2 {#file-scanner-v2}

> 버전 4.1.4부터 지원됩니다.

File Scanner V2는 외부 테이블 파일을 스캔하는 새로운 실행 엔진입니다. Parquet, ORC, CSV, JSON 형식뿐 아니라 Hive, Iceberg, Paimon, Hudi 등의 테이블 형식에 대한 읽기도 지원합니다. 기존 스캐너에 비해 데이터 프루닝, 동시 분할 처리 및 메모리 사용이 개선되었습니다.

`enable_file_scanner_v2` 세션 변수로 제어합니다.

- 유형: `boolean`
- 기본값: `true`(기본적으로 활성화됨)
- 설명: 활성화하면 `FileScanNode`는 지원되는 쿼리 스캔에 File Scanner V2를 사용합니다. JDBC Catalog 및 Iceberg 시스템 테이블 등의 경우에는 기존 스캔 경로를 계속 사용합니다.

쿼리 문제가 새 스캐너와 관련이 있다고 의심되면 일시적으로 비활성화하여 비교할 수 있습니다.

```sql
SET enable_file_scanner_v2 = false;
```

### 데이터 프루닝 동작 {#data-pruning-behavior}

File Scanner V2는 **안전한 파티션 프루닝과 표현식 ZoneMap 프루닝을 항상 수행**하며, 더 이상 아래 세션 변수의 제어를 받지 않습니다. 이 두 변수는 기존 스캐너에만 영향을 주며, 기존 스캐너는 계속 해당 설정을 따릅니다.

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `enable_runtime_filter_partition_prune` | `true` | Runtime Filter 파티션 프루닝의 활성화 여부. File Scanner V2는 안전한 파티션 프루닝을 항상 활성화하므로 `false`로 설정해도 영향을 받지 않음 |
| `enable_expr_zonemap_filter` | `true` | 표현식 ZoneMap 필터링의 활성화 여부. File Scanner V2는 안전한 표현식 ZoneMap 필터링을 항상 활성화함 |

## Merge IO 최적화 {#merge-io-optimization}

Doris는 HDFS 및 객체 스토리지와 같은 원격 스토리지 시스템에 대한 IO 접근을 Merge IO 기술로 최적화합니다. Merge IO 기술은 기본적으로 인접한 여러 작은 IO 요청을 하나의 큰 IO 요청으로 병합하여 IOPS를 줄이고 IO 처리량을 높입니다.

예를 들어 원래 요청에서 [0, 10] 및 [20, 50] 구간을 파일 `file1`에서 읽어야 한다면 다음과 같습니다.

```
Request Range: [0, 10], [20, 50]
```

Merge IO를 적용하면 다음과 같이 하나의 요청으로 병합됩니다.

```
Request Range: [0, 50]
```

이 예에서는 두 IO 요청이 하나로 병합되지만, 일부 추가 데이터(10-20 사이의 데이터)도 읽게 됩니다. 따라서 Merge IO는 IO 작업 수를 줄이는 한편, 읽기 증폭 문제를 일으킬 수 있습니다.

Query Profile에서 Merge IO의 세부 정보를 확인할 수 있습니다.

```
- MergedSmallIO:
    - MergedBytes: 3.00 GB
    - MergedIO: 424
    - RequestBytes: 2.50 GB
    - RequestIO: 65.555K (65555)
```

여기서 `RequestBytes`와 `RequestIO`는 원래 요청의 데이터 양과 요청 수를 나타냅니다. `MergedBytes`와 `MergedIO`는 병합 후의 데이터 양과 요청 수를 나타냅니다.

`MergedBytes`가 `RequestBytes`보다 훨씬 크면 읽기 증폭이 심하다는 의미입니다. 다음 파라미터로 이를 조정할 수 있습니다.

- `merge_io_read_slice_size_bytes`

    세션 변수이며, 버전 3.1.3부터 지원됩니다. 기본값은 8MB입니다. 읽기 증폭이 심하다면 이 파라미터를 64KB 등으로 줄인 후, 변경된 IO 요청과 쿼리 지연 시간이 개선되는지 확인할 수 있습니다.

## Parquet Page Cache {#parquet-page-cache}

:::info
버전 4.1.0부터 지원됩니다.
:::

Parquet Page Cache는 Parquet 파일을 위한 페이지 단위 캐싱 메커니즘입니다. 이 기능은 Doris의 기존 Page Cache 프레임워크와 통합되며, 압축 해제된(또는 압축된) 데이터 페이지를 메모리에 캐시하여 쿼리 성능을 크게 높입니다.

### 주요 기능 {#key-features}

1. **통합 Page Cache 연동**
    - Doris 내부 테이블에서 사용하는 것과 동일한 기반 `StoragePageCache` 프레임워크를 공유합니다
    - 메모리 풀과 캐시 제거 정책을 공유합니다
    - 기존 캐시 통계와 RuntimeProfile을 재사용하여 성능을 통합 모니터링합니다

2. **지능형 캐싱 전략**
    - **압축률 고려**: `parquet_page_cache_decompress_threshold` 파라미터를 기준으로 압축된 데이터와 압축 해제된 데이터 중 어느 것을 캐시할지 자동으로 결정합니다
    - **유연한 저장 방식**: `decompressed size / compressed size ≤ threshold`이면 압축 해제된 데이터를 캐시하고, 그렇지 않으면 `enable_parquet_cache_compressed_pages`에 따라 압축된 데이터를 캐시할지 결정합니다
    - **캐시 키 설계**: `file_path::mtime::offset`을 캐시 키로 사용하여 파일 수정 후에도 캐시 일관성을 보장합니다

### 설정 파라미터 {#configuration-parameters}

다음은 BE 설정 파라미터입니다.

- `enable_parquet_page_cache`

    Parquet Page Cache 기능의 활성화 여부입니다. 기본값은 `false`입니다.

- `parquet_page_cache_decompress_threshold`

    압축된 데이터와 압축 해제된 데이터 중 어느 것을 캐시할지 결정하는 임계값입니다. 기본값은 `1.5`입니다. `decompressed size / compressed size` 비율이 이 임계값 이하이면 압축 해제된 데이터를 캐시하고, 그렇지 않으면 `enable_parquet_cache_compressed_pages` 설정에 따라 압축된 데이터를 캐시할지 결정합니다.

- `enable_parquet_cache_compressed_pages`

    압축률이 임계값을 초과할 때 압축된 데이터 페이지를 캐시할지 여부입니다. 기본값은 `false`입니다.

### 성능 모니터링 {#performance-monitoring}

Query Profile에서 Parquet Page Cache 사용 현황을 확인할 수 있습니다.

```
ParquetPageCache:
    - PageCacheHitCount: 1024
    - PageCacheMissCount: 128
```

여기서 `PageCacheHitCount`는 캐시 적중 횟수를, `PageCacheMissCount`는 캐시 미스 횟수를 나타냅니다.
