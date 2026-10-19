---
{
    "title": "데이터 레이크 쿼리 최적화",
    "language": "ko",
    "description": "이 문서에서는 레이크 데이터(Hive, Iceberg, Paimon 등)를 쿼리할 때 사용할 수 있는 최적화 방법과 전략을 소개합니다."
}
---

이 문서에서는 레이크 데이터(Hive, Iceberg, Paimon 등)를 쿼리할 때 사용할 수 있는 최적화 방법과 전략을 소개합니다.

## 파티션 프루닝 {#partition-pruning}

쿼리에 파티션 컬럼 조건을 지정하면 불필요한 파티션을 제거하여 읽어야 할 데이터 양을 줄일 수 있습니다.

`EXPLAIN <SQL>`을 사용하면 `partition` 항목을 통해 `XXX_SCAN_NODE`의 파티션 프루닝 적용 여부와 이 쿼리에서 스캔해야 하는 파티션 수를 확인할 수 있습니다.

예:

```
0:VPAIMON_SCAN_NODE(88)
    table: paimon_ctl.db.table
    predicates: (user_id[#4] = 431304818)
    inputSplitNum=15775, totalFileSize=951754154566, scanRanges=15775
    partition=203/0
```

## 로컬 데이터 캐시 {#local-data-cache}

Data Cache는 원격 스토리지 시스템(HDFS 또는 객체 스토리지)에서 최근에 접근한 데이터 파일을 로컬 디스크에 캐싱하여 동일한 데이터에 접근하는 후속 쿼리의 속도를 높입니다.

캐시 기능은 기본적으로 비활성화되어 있습니다. 구성 및 활성화 방법은 [Data Cache](../data-cache.md) 문서를 참조하세요.

4.0.2 버전부터 캐시 워밍업 기능을 지원하며, 이를 통해 데이터 캐시를 능동적으로 활용하여 쿼리 성능을 더욱 높일 수 있습니다.

## HDFS 읽기 최적화 {#hdfs-read-optimization}

[HDFS 문서](../storages/hdfs.md)의 **HDFS IO 최적화** 섹션을 참조하세요.

## 분할 수 제한 {#split-count-limit}

외부 테이블(Hive, Iceberg, Paimon 등)을 쿼리할 때 Doris는 병렬 처리를 위해 파일을 여러 분할로 나눕니다. 일부 시나리오에서는, 특히 작은 파일이 많을 때 분할이 지나치게 많이 생성되어 다음과 같은 문제가 발생할 수 있습니다.

1. 메모리 부담: 분할이 너무 많으면 FE 메모리를 많이 사용합니다.
2. OOM 문제: 분할 수가 지나치게 많으면 OutOfMemoryError가 발생할 수 있습니다.
3. 성능 저하: 너무 많은 분할을 관리하면 쿼리 계획 수립에 드는 오버헤드가 증가합니다.

`max_file_split_num` 세션 변수를 사용하면 테이블 스캔당 허용되는 최대 분할 수를 제한할 수 있습니다(4.0.4부터 지원).

- 유형: `int`
- 기본값: `100000`
- 설명: 비배치 모드에서 테이블 스캔당 허용되는 최대 분할 수입니다. 분할 수가 너무 많아 발생하는 OOM을 방지합니다.

사용 예:

```sql
-- Set maximum split count to 50000
SET max_file_split_num = 50000;

-- Disable this limit (set to 0 or negative number)
SET max_file_split_num = 0;
```

이 제한을 설정하면 Doris는 분할 수가 지정된 한도를 넘지 않도록 최소 분할 크기를 동적으로 계산합니다.

## File Scanner V2 {#file-scanner-v2}

> 4.1.4 버전부터 지원합니다.

File Scanner V2는 외부 테이블 파일을 스캔하는 새로운 실행 엔진입니다. Parquet, ORC, CSV, JSON 형식뿐 아니라 Hive, Iceberg, Paimon, Hudi 같은 테이블 형식의 읽기도 지원합니다. 기존 스캐너와 비교해 데이터 프루닝과 병렬 분할을 개선하고 메모리 사용 효율을 높였습니다.

`enable_file_scanner_v2` 세션 변수로 제어합니다.

- 유형: `boolean`
- 기본값: `true`(기본적으로 활성화)
- 설명: 활성화하면 `FileScanNode`가 지원되는 쿼리 스캔에 File Scanner V2를 사용합니다. JDBC Catalog와 Iceberg 시스템 테이블 같은 시나리오에서는 여전히 기존 스캔 경로를 사용합니다.

쿼리 문제가 새 스캐너와 관련이 있다고 의심되면 일시적으로 비활성화하여 비교할 수 있습니다.

```sql
SET enable_file_scanner_v2 = false;
```

### 데이터 프루닝 동작 {#data-pruning-behavior}

File Scanner V2는 **항상 안전한 파티션 프루닝과 표현식 ZoneMap 프루닝을 수행**하며, 더 이상 아래 세션 변수의 영향을 받지 않습니다. 이 두 변수는 여전히 해당 설정을 따르는 기존 스캐너에만 영향을 줍니다.

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `enable_runtime_filter_partition_prune` | `true` | Runtime Filter 파티션 프루닝의 활성화 여부입니다. File Scanner V2는 항상 안전한 파티션 프루닝을 활성화하므로 `false`로 설정해도 영향을 받지 않습니다 |
| `enable_expr_zonemap_filter` | `false` | 표현식 ZoneMap 필터링의 활성화 여부입니다. File Scanner V2는 항상 안전한 표현식 ZoneMap 필터링을 활성화합니다 |

### BE 측 분할 세분화 {#be-side-fine-grained-split-refinement}

> 4.1.4 버전부터 지원합니다.

File Scanner V2를 활성화하면 FE는 파일을 큰 단위로만 분할하고, BE는 각 분할을 Parquet Row Group 또는 ORC Stripe 단위로 더 잘게 나누어 동일한 스캔 인스턴스 내에서 병렬로 실행합니다. 인접한 Row Group / Stripe는 목표 크기에 가까워질 때까지 병합됩니다.

| 세션 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `file_split_size_on_fe` | `536870912` (512MB) | BE 측 세분화가 적용될 때 FE가 생성하는 큰 단위 파일 분할의 목표 크기(바이트) |
| `file_split_size_on_be` | `67108864` (64MB) | BE에서 생성하는 세부 파일 분할의 목표 크기(바이트) |

적용 범위: Hive, Iceberg, 네이티브 Paimon RawFile, 파일 기반 테이블 반환 함수에서 생성한 네이티브 Parquet / ORC 분할입니다. File Scanner V2가 활성화되어 있고, 생성된 작업을 두 개 이상의 스캐너가 처리할 수 있어야 합니다.

다음 시나리오에서는 이 방식이 적용되지 않고 기존 FE 분할 전략을 사용합니다. 이 전략은 `file_split_size`, `max_initial_file_split_size`, `max_file_split_size`, `max_file_split_num`으로 제어합니다.

- Parquet / ORC 이외의 형식;
- File Scanner V2가 비활성화된 경우;
- `max_file_scanners_concurrency = 1`이거나 BE가 작은 LIMIT 쿼리에 스캐너 하나만 사용하는 경우;
- 트랜잭션(Full ACID) Hive 테이블 스캔;
- 테이블 수준 메타데이터 COUNT로 최적화된 스캔;
- 삭제 파일이 연결된 Iceberg 데이터 파일;
- 직렬화된 논리 / JNI Paimon 분할;
- `file_split_size_on_fe` 또는 `file_split_size_on_be`가 양수가 아닌 값으로 설정된 경우.

:::tip 참고
Row Group 또는 Stripe는 더 이상 나눌 수 없는 최소 단위이므로, 단일 분할의 실제 크기가 `file_split_size_on_be`로 설정한 목표 크기를 초과할 수 있습니다.
:::

## 외부 스캔 작업 재사용 {#external-scan-task-reuse}

> 4.1.4 버전부터 지원합니다.

하나의 SQL 문에서 동일한 외부 테이블을 여러 번 참조하는 경우(예: 셀프 조인 또는 여러 번 참조되는 CTE), 이와 동등한 스캔 노드들은 이미 생성된 동일한 분할 집합을 재사용할 수 있습니다. 따라서 FE가 분할 계획을 반복해서 수립하지 않아도 됩니다.

`enable_external_scan_task_reuse` 세션 변수로 제어합니다.

- 유형: `boolean`
- 기본값: `true`
- 설명: 동일한 문 내에서 동일한 외부 테이블 스캔 노드가 생성한 분할을 재사용할지 여부입니다. Hive, Hudi, Iceberg, Paimon에 적용됩니다.

## Merge IO 최적화 {#merge-io-optimization}

Doris는 HDFS와 객체 스토리지 같은 원격 스토리지 시스템에 대해 Merge IO 기술로 IO 접근을 최적화합니다. Merge IO 기술은 인접한 여러 소규모 IO 요청을 하나의 대규모 IO 요청으로 병합하여 IOPS를 줄이고 IO 처리량을 높입니다.

예를 들어, 원래 요청으로 읽어야 하는 구간이 [0, 10]과 [20, 50]이고 대상 파일이 `file1`인 경우:

```
Request Range: [0, 10], [20, 50]
```

Merge IO를 적용하면 다음과 같이 하나의 요청으로 병합됩니다.

```
Request Range: [0, 50]
```

이 예에서는 두 IO 요청을 하나로 병합하지만, 일부 데이터(10-20 사이의 데이터)도 추가로 읽습니다. 따라서 Merge IO는 IO 작업 수를 줄이지만 읽기 증폭을 유발할 가능성도 있습니다.

Query Profile에서 Merge IO의 세부 정보를 확인할 수 있습니다.

```
- MergedSmallIO:
    - MergedBytes: 3.00 GB
    - MergedIO: 424
    - RequestBytes: 2.50 GB
    - RequestIO: 65.555K (65555)
```

여기서 `RequestBytes`와 `RequestIO`는 원래 요청의 데이터 양과 요청 수를 나타냅니다. `MergedBytes`와 `MergedIO`는 병합 후의 데이터 양과 요청 수를 나타냅니다.

`MergedBytes`가 `RequestBytes`보다 훨씬 크면 읽기 증폭이 심하다는 의미입니다. 다음 매개변수로 조정할 수 있습니다.

- `merge_io_read_slice_size_bytes`

    세션 변수이며 3.1.3 버전부터 지원합니다. 기본값은 8MB입니다. 읽기 증폭이 심한 경우 이 매개변수 값을 64KB 등으로 줄이고, 변경 후 IO 요청과 쿼리 지연 시간이 개선되는지 확인할 수 있습니다.

## Parquet Page Cache {#parquet-page-cache}

:::info
4.1.0 버전부터 지원합니다.
:::

Parquet Page Cache는 Parquet 파일을 위한 페이지 단위 캐싱 메커니즘입니다. 이 기능은 Doris의 기존 Page Cache 프레임워크와 통합되어 압축 해제된(또는 압축된) 데이터 페이지를 메모리에 캐싱함으로써 쿼리 성능을 크게 향상합니다.

### 주요 기능 {#key-features}

1. **통합 Page Cache 연동**
    - Doris 내부 테이블에서 사용하는 것과 동일한 기반 `StoragePageCache` 프레임워크를 공유합니다.
    - 메모리 풀과 캐시 교체 정책을 공유합니다.
    - 기존 캐시 통계와 RuntimeProfile을 재사용하여 성능을 통합 모니터링합니다.

2. **지능형 캐싱 전략**
    - **압축률에 따른 판단**: `parquet_page_cache_decompress_threshold` 매개변수에 따라 압축된 데이터와 압축 해제된 데이터 중 어느 쪽을 캐싱할지 자동으로 결정합니다.
    - **유연한 저장 방식**: `decompressed size / compressed size ≤ threshold`일 때는 압축 해제된 데이터를 캐싱하고, 그렇지 않으면 `enable_parquet_cache_compressed_pages`에 따라 압축된 데이터를 캐싱할지 결정합니다.
    - **캐시 키 설계**: `file_path::mtime::offset`을 캐시 키로 사용하여 파일 수정 후에도 캐시 일관성을 보장합니다.

### 구성 매개변수 {#configuration-parameters}

다음은 BE 구성 매개변수입니다.

- `enable_parquet_page_cache`

    Parquet Page Cache 기능의 활성화 여부입니다. 기본값은 `false`입니다.

- `parquet_page_cache_decompress_threshold`

    압축된 데이터와 압축 해제된 데이터 중 어느 쪽을 캐싱할지 결정하는 임계값입니다. 기본값은 `1.5`입니다. `decompressed size / compressed size` 비율이 이 임계값 이하이면 압축 해제된 데이터를 캐싱하고, 그렇지 않으면 `enable_parquet_cache_compressed_pages` 설정에 따라 압축된 데이터를 캐싱할지 결정합니다.

- `enable_parquet_cache_compressed_pages`

    압축률이 임계값을 초과할 때 압축된 데이터 페이지를 캐싱할지 여부입니다. 기본값은 `false`입니다.

### 성능 모니터링 {#performance-monitoring}

Query Profile에서 Parquet Page Cache 사용 현황을 확인할 수 있습니다.

```
ParquetPageCache:
    - PageCacheHitCount: 1024
    - PageCacheMissCount: 128
```

여기서 `PageCacheHitCount`는 캐시 적중 횟수를, `PageCacheMissCount`는 캐시 미스 횟수를 나타냅니다.
