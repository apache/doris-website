---
{
    "title": "데이터 캐시",
    "language": "ko",
    "description": "Apache Doris 데이터 캐시는 HDFS 및 오브젝트 스토리지 데이터를 로컬에 캐시하여 Lakehouse 쿼리를 가속화합니다. Hive, Iceberg, Hudi, Paimon 테이블에 대해 캐시 워밍업, 쿼리 수준의 캐시 채우기 제어, 캐시 허용 제어를 지원합니다."
}
---

데이터 캐시는 최근에 접근한 데이터 파일을 원격 스토리지 시스템(HDFS 또는 오브젝트 스토리지)에서 로컬 디스크로 캐시하여 동일한 데이터에 대한 후속 쿼리를 가속화합니다. 같은 데이터에 자주 접근하는 시나리오에서는 원격 데이터에 반복적으로 접근하는 오버헤드를 줄여 핫 데이터에 대한 쿼리 분석의 성능과 안정성을 높일 수 있습니다.

## 적용 시나리오 {#applicable-scenarios}

데이터 캐시 기능은 Hive, Iceberg, Hudi, Paimon 테이블에 대한 쿼리에만 적용됩니다. 내부 테이블 쿼리나 파일 기반이 아닌 외부 테이블 쿼리(예: JDBC, Elasticsearch)에는 영향을 주지 않습니다.

데이터 캐시가 쿼리 효율을 높일 수 있는지는 여러 요인에 따라 달라집니다. 데이터 캐시에 적합한 시나리오는 다음과 같습니다.

* 고속 로컬 디스크

  데이터 캐시 디렉터리에는 SSD 또는 NVME 미디어 기반의 고속 로컬 디스크를 사용하는 것이 좋습니다. 기계식 하드 디스크를 데이터 캐시 디렉터리로 사용하는 것은 권장하지 않습니다. 눈에 띄는 성능 향상을 얻으려면 로컬 디스크의 IO 대역폭과 IOPS가 네트워크 대역폭 및 원본 스토리지 시스템의 IO 대역폭과 IOPS보다 훨씬 높아야 합니다.

* 충분한 캐시 공간

  데이터 캐시는 캐시 제거 정책으로 LRU 전략을 사용합니다. 쿼리 대상 데이터에서 핫 데이터와 콜드 데이터의 구분이 명확하지 않으면 캐시된 데이터가 자주 갱신되고 교체되어 쿼리 성능이 저하될 수 있습니다. 쿼리 패턴에서 핫 데이터와 콜드 데이터가 명확히 구분되고(예: 대부분의 쿼리가 오늘 데이터에만 접근하고 과거 데이터에는 거의 접근하지 않는 경우), 핫 데이터를 저장할 만큼 캐시 공간이 충분한 시나리오에서 데이터 캐시를 활성화하는 것이 좋습니다.

* 원격 스토리지의 불안정한 IO 지연 시간

  이러한 상황은 주로 HDFS 스토리지에서 발생합니다. 대부분의 기업에서는 여러 업무 부서가 같은 HDFS를 공유하므로 사용량이 많은 시간대에 IO 지연 시간이 매우 불안정해질 수 있습니다. 이때 안정적인 IO 지연 시간을 보장해야 한다면 데이터 캐시를 활성화하는 것이 좋습니다. 다만 앞의 두 조건도 함께 고려해야 합니다.

## 데이터 캐시 활성화 {#enabling-data-cache}

Doris 4.2부터 데이터 캐시는 기본적으로 활성화됩니다. BE 구성 `enable_file_cache`와 세션 변수 `enable_file_cache`의 기본값은 모두 `true`입니다. 사용하려면 `be.conf`에 캐시 디렉터리를 구성하세요. FE 매개변수로 세션별 또는 전역적으로 캐시를 활성화하거나 비활성화할 수 있습니다.

### BE 구성 {#be-configuration}

먼저 `be.conf`에 캐시 경로 정보를 구성하고 BE 노드를 다시 시작하여 구성을 적용합니다.

| 매개변수            | 필수 여부 | 설명                              |
| ------------------- | --- | -------------------------------------- |
| `enable_file_cache` | 아니요   | 데이터 캐시 활성화 여부입니다. Doris 4.2부터 기본적으로 활성화됩니다.               |
| `file_cache_path`   | 예   | 캐시 디렉터리 관련 구성으로, JSON 형식입니다.                      |
| `clear_file_cache`  | 아니요   | 기본값은 false입니다. true이면 BE 노드가 다시 시작될 때 캐시 디렉터리를 비웁니다. |

`file_cache_path` 구성 예제:

```sql
file_cache_path=[{"path": "/path/to/file_cache1", "total_size":53687091200},{"path": "/path/to/file_cache2", "total_size":53687091200},{"path": "/path/to/file_cache3", "total_size":53687091200}]
```

`path`는 캐시를 저장하는 경로이며, 하나 이상의 경로를 구성할 수 있습니다. 디스크당 하나의 경로만 구성하는 것이 좋습니다.

`total_size`는 캐시 공간 크기의 상한이며, 단위는 바이트입니다. 캐시 공간을 초과하면 LRU 전략에 따라 캐시된 데이터를 제거합니다.

### FE 구성 {#fe-configuration}

단일 세션에서 데이터 캐시 활성화:

```sql
SET enable_file_cache = true;
```

전역적으로 데이터 캐시 활성화:

```sql
SET GLOBAL enable_file_cache = true;
```

외부 파일 스캔은 BE 구성 `enable_file_cache`, 세션 변수 `enable_file_cache`, 캐시 허용 제어가 모두 활성화된 경우에만 캐시를 통해 데이터를 읽습니다. 이 세션 변수는 내부 테이블에는 영향을 주지 않습니다.

:::caution[Doris 4.2부터 File Cache가 기본적으로 활성화됨]

- 스토리지와 컴퓨팅이 결합된 BE에서 `file_cache_path`를 설정하지 않으면 `${DORIS_HOME}/file_cache`에 캐시가 생성되며, `total_size`가 없으면 디스크 사용률이 85%–88%에 이를 때까지 커질 수 있습니다. 크기를 제한하려면 `file_cache_path`에 `total_size`를 지정하거나, `enable_file_cache = false`를 `be.conf`에 설정하여 이전 동작을 유지하세요.
- BE 구성은 영구 저장되지 않으므로, 업그레이드된 BE는 `be.conf`에 해당 키가 설정되어 있지 않으면 바이너리에 컴파일된 기본값을 사용합니다. 세션 변수는 FE 이미지에 영구 저장되므로 이전 버전에서 업그레이드한 클러스터는 기존 값을 유지합니다. 업그레이드 후 외부 테이블을 캐시하려면 `SET GLOBAL enable_file_cache = true`를 실행하세요.

:::

## 캐시 상태 확인 {#cache-observability}

### 캐시 적중률 확인 {#view-cache-hit-rate}

`set enable_profile=true`를 실행하여 세션 변수를 활성화하면 FE 웹 페이지의 `Queries` 탭에서 작업의 Profile을 확인할 수 있습니다. 데이터 캐시 관련 지표는 다음과 같습니다.

```sql
-  FileCache:  0ns
    -  BytesScannedFromCache:  2.02  GB
    -  BytesScannedFromRemote:  0.00  
    -  BytesWriteIntoCache:  0.00  
    -  LocalIOUseTimer:  2s723ms
    -  NumLocalIOTotal:  444
    -  NumRemoteIOTotal:  0
    -  NumSkipCacheIOTotal:  0
    -  RemoteIOUseTimer:  0ns
    -  WriteCacheIOUseTimer:  0ns
```

* `BytesScannedFromCache`: 로컬 캐시에서 읽은 데이터의 양입니다.

* `BytesScannedFromRemote`: 원격에서 읽은 데이터의 양입니다.

* `BytesWriteIntoCache`: 캐시에 쓴 데이터의 양입니다.

* `LocalIOUseTimer`: 로컬 캐시의 IO 시간입니다.

* `RemoteIOUseTimer`: 원격 읽기의 IO 시간입니다.

* `NumLocalIOTotal`: 로컬 캐시의 IO 작업 횟수입니다.

* `NumRemoteIOTotal`: 원격 IO 작업 횟수입니다.

* `WriteCacheIOUseTimer`: 캐시에 쓰는 데 걸린 IO 시간입니다.

`BytesScannedFromRemote`가 0이면 모든 읽기가 캐시에 적중했음을 의미합니다.

### 모니터링 지표 {#monitoring-metrics}

사용자는 시스템 테이블 [`file_cache_statistics`](../admin-manual/system-tables/information_schema/file_cache_statistics)를 통해 각 Backend 노드의 캐시 통계를 확인할 수 있습니다.

## 쿼리별 캐시 제한 {#cache-query-limit}

Doris는 쿼리 수준에서 서로 독립적인 두 가지 데이터 캐시 제어 기능을 제공합니다.

| 제어 방식 | 주요 매개변수 | 제한 도달 후 동작 |
|---|---|---|
| 캐시 점유율 기준 제한 | `file_cache_query_limit_percent` | 캐시 미스 시 캐시 채우기는 계속 허용되며, BE가 쿼리 수준 LRU 기록 및 다른 캐시 큐를 통해 공간을 확보함 |
| 바이트 임계값에 따른 원격 스캔 캐시 쓰기 중단 | `file_cache_query_limit_bytes` | 다음 캐시 블록으로 인해 허용된 바이트 수가 임계값을 초과하게 되면, 이후 캐시 미스에서는 로컬 캐시를 채우지 않고 원격 스토리지에서 읽음 |

### 캐시 점유율 기준 제한 {#limit-by-cache-footprint-percentage}

> 이 기능은 버전 4.0.3부터 지원됩니다.

캐시 점유율 제한은 단일 쿼리가 각 File Cache 인스턴스에서 사용할 수 있는 최대 비율을 제어합니다. 여러 사용자나 복잡한 쿼리가 캐시 리소스를 공유할 때, 하나의 대규모 쿼리가 캐시를 과도하게 점유하여 다른 핫 데이터를 밀어낼 위험을 줄입니다.

이 기능을 사용하려면 BE와 FE 구성 및 세션 변수를 설정해야 합니다.

**1. BE 구성**

- `enable_file_cache_query_limit`:
  - 유형: Boolean
  - 기본값: `false`
  - 설명: BE 측 파일 캐시 쿼리 제한 기능의 주 스위치입니다. 활성화된 경우에만 BE가 FE에서 전달한 쿼리 제한 매개변수를 처리합니다.

**2. FE 구성**

- `file_cache_query_limit_max_percent`:
  - 유형: Integer
  - 기본값: `100`
  - 설명: 세션 변수의 상한을 검증하는 데 사용하는 쿼리 제한의 최댓값입니다.

**3. 세션 변수**

- `file_cache_query_limit_percent`:
  - 유형: Integer (1-100)
  - 기본값: `-1`
  - 설명: 쿼리가 사용할 수 있는 캐시의 최대 비율입니다. 이 값은 `file_cache_query_limit_max_percent`의 제한을 받습니다. 계산된 캐시 할당량은 최소 256 MB여야 하며, 그렇지 않으면 BE가 로그에 경고를 기록합니다.

**사용 예제**

```sql
-- Set the session variable to limit a query to at most 50% of the cache
SET file_cache_query_limit_percent = 50;

-- Execute the query
SELECT * FROM large_table;
```

**참고:**

1. 값은 `[1, file_cache_query_limit_max_percent]` 범위에 있어야 합니다.
2. 이 제어 기능을 사용하기 전에 BE에서 `enable_file_cache`와 `enable_file_cache_query_limit`를 모두 활성화하고, 쿼리 세션에서 `enable_file_cache`가 `true`인지 확인하세요.
3. 비율에 따른 할당량에 도달한 후에도 캐시 미스 시 데이터 캐시에 쓸 수 있습니다. 이 제어 기능은 쿼리를 추가 쓰기 중단 모드로 전환하지 않습니다.

### 바이트 임계값에 따른 원격 스캔 캐시 쓰기 중단 {#stop-remote-scan-cache-writes-by-byte-threshold}

컴퓨팅과 스토리지가 분리된 모드에서 `file_cache_query_limit_bytes` 세션 변수는 단일 SELECT 쿼리에 대해 **각 BE**에서 Hive, Iceberg, Hudi 또는 Paimon 데이터 파일의 캐시 미스로 인해 데이터 캐시 채우기가 허용된 누적 바이트 수를 제한합니다. BE에서 `enable_file_cache=true`가 필요하지만, `enable_file_cache_query_limit` 또는 `file_cache_query_limit_max_percent`에는 의존하지 않습니다.

| 매개변수 | 유형 | 기본값 | 설명 |
|---|---|---|---|
| `file_cache_query_limit_bytes` | BigInt | `-1` | 각 BE에서 단일 쿼리에 적용되는 원격 스캔 캐시 채우기 임계값이며, 단위는 바이트입니다. `0`보다 작은 값은 이 제어 기능을 비활성화하고, `0`은 쿼리 시작 시점부터 캐시 채우기를 비활성화합니다. 양수 값은 캐시 블록 단위로 허용된 바이트 수를 누적합니다 |

같은 쿼리의 병렬 Scanner는 BE 내에서 하나의 임계값을 공유합니다. 이 임계값은 쿼리 전체 또는 클러스터 전체의 합계가 아닙니다. 다음 캐시 블록으로 인해 허용된 바이트 수가 임계값을 초과하게 되면, 해당 BE에서 쿼리가 remote-only-on-miss 모드로 전환됩니다. 요청 범위가 로컬 캐시에 완전히 포함되어 있으면 계속 로컬에서 읽을 수 있고, 완전히 포함되어 있지 않으면 데이터 캐시를 채우지 않고 원격 스토리지에서 직접 읽습니다. 쿼리 결과는 달라지지 않습니다.

다음 예제는 각 BE에 원격 스캔 캐시 채우기 임계값을 1 GiB로 설정합니다.

```sql
SET enable_profile = true;
SET profile_level = 2;
SET file_cache_query_limit_bytes = 1073741824;

SELECT COUNT(*) FROM hive_catalog.sales.orders;
```

일회성 스캔이 시작부터 데이터 캐시에 쓰지 않도록 하려면 임계값을 `0`으로 설정하고, 쿼리 후 기본값으로 복원하세요.

```sql
SET file_cache_query_limit_bytes = 0;
SELECT COUNT(*) FROM hive_catalog.sales.orders;

SET file_cache_query_limit_bytes = -1;
```

Query Profile을 활성화한 후 `RemoteOnlyOnMissTriggered`와 `RemoteOnlyOnMissThresholdBytes`를 Scanner의 `FileCache` 지표 그룹에서 확인하세요. `RemoteOnlyOnMissTriggered=1`이면 Scanner가 쿼리의 remote-only-on-miss 모드 전환을 관측했음을 의미합니다. `BytesWriteIntoCache`와 `NumSkipCacheIOTotal`을 사용하여 실제 쓰기와 캐시를 건너뛴 I/O를 확인하세요. `NumSkipCacheIOTotal`에는 다른 캐시 정책에 의해 건너뛴 I/O도 포함될 수 있으므로, 이 값만으로는 임계값에 도달하여 해당 모드로 전환되었음을 입증할 수 없습니다.

:::note

- 이 제어 기능은 컴퓨팅과 스토리지가 분리된 모드에서 SELECT 쿼리의 캐시 미스 후 수행되는 데이터 캐시 채우기에만 적용됩니다. 원격에서 읽는 바이트 수를 제한하거나 명시적인 캐시 워밍업에 영향을 주지 않습니다. remote-only-on-miss 모드는 원격 I/O와 쿼리 지연 시간을 늘릴 수 있습니다.
- 캐시 허용 여부는 캐시 블록 단위로 평가됩니다. 남은 할당량이 다음 블록보다 작으면 해당 블록 전체를 건너뜁니다. `RemoteOnlyOnMissTriggered`는 블록으로 인해 임계값을 초과하게 되는 경우에만 `1`로 바뀝니다.
- BE 매개변수 `enable_file_cache_query_limit_segment_meta`는 Doris 내부 테이블의 Segment footer 및 Segment 메타데이터 쓰기를 같은 임계값에 포함할지 제어합니다. Hive, Iceberg, Hudi, Paimon 데이터 파일의 캐시 채우기에는 항상 `file_cache_query_limit_bytes`가 적용됩니다. 매개변수의 전체 적용 범위와 내부 테이블 동작은 [File Cache 구성 및 사용 가이드](../compute-storage-decoupled/file-cache/file-cache.md)를 참조하세요.

:::

## 캐시 워밍업 {#cache-warmup}

데이터 캐시는 외부 데이터를 BE 노드의 로컬 캐시에 미리 적재할 수 있는 캐시 "워밍업" 기능을 제공합니다. 이를 통해 이후 해당 데이터를 처음 쿼리할 때 캐시 적중률과 쿼리 성능을 높일 수 있습니다.

> 이 기능은 버전 4.0.2부터 지원됩니다.

### 구문 {#syntax}

```sql
WARM UP SELECT <select_expr_list>
FROM <table_reference>
[WHERE <boolean_expression>]
```

사용 제한 사항:

* 지원:

  * 단일 테이블 쿼리(table_reference는 하나만 허용)
  * 지정된 열에 대한 단순 SELECT
  * WHERE 필터링(일반 조건자 지원)

* 지원하지 않음:

  * JOIN, UNION, 하위 쿼리, CTE
  * GROUP BY, HAVING, ORDER BY
  * LIMIT
  * INTO OUTFILE
  * 여러 테이블 / 복잡한 쿼리 계획
  * 기타 복잡한 구문

### 예제 {#examples}

1. 전체 테이블 워밍업

  ```sql
  WARM UP SELECT * FROM hive_db.tpch100_parquet.lineitem;
  ```

2. 파티션별 일부 열 워밍업

  ```sql
  WARM UP SELECT l_orderkey, l_shipmode
  FROM hive_db.tpch100_parquet.lineitem
  WHERE dt = '2025-01-01';
  ```

3. 필터 조건에 따른 일부 열 워밍업

  ```sql
  WARM UP SELECT l_shipmode, l_linestatus
  FROM hive_db.tpch100_parquet.lineitem
  WHERE l_orderkey = 123456;
  ```

### 실행 결과 {#execution-results}

`WARM UP SELECT`를 실행하면 FE가 각 BE에 작업을 배포합니다. BE는 원격 데이터를 스캔하여 데이터 캐시에 씁니다.

시스템은 각 BE의 스캔 및 캐시 쓰기 통계를 직접 반환합니다(참고: 통계는 대체로 정확하지만 약간의 오차가 있을 수 있습니다). 예를 들면 다음과 같습니다.

```
+---------------+-----------+-------------+---------------------------+----------------------------+---------------------+
| BackendId     | ScanRows  | ScanBytes   | ScanBytesFromLocalStorage | ScanBytesFromRemoteStorage | BytesWriteIntoCache |
+---------------+-----------+-------------+---------------------------+----------------------------+---------------------+
| 1755134092928 | 294744184 | 11821864798 | 538154009                 | 11283717130                | 11899799492         |
| 1755134092929 | 305293718 | 12244439301 | 560970435                 | 11683475207                | 12332861380         |
| TOTAL         | 600037902 | 24066304099 | 1099124444                | 22967192337                | 24232660872         |
+---------------+-----------+-------------+---------------------------+----------------------------+---------------------+
```

필드 설명:

* `ScanRows`: 스캔하여 읽은 행 수입니다.
* `ScanBytes`: 스캔하여 읽은 데이터의 양입니다.
* `ScanBytesFromLocalStorage`: 로컬 캐시에서 스캔하여 읽은 데이터의 양입니다.
* `ScanBytesFromRemoteStorage`: 원격 스토리지에서 스캔하여 읽은 데이터의 양입니다.
* `BytesWriteIntoCache`: 이번 워밍업 중 데이터 캐시에 쓴 데이터의 양입니다.

## 캐시 허용 제어 {#cache-admission-control}

> 이 기능은 실험적 기능이며 버전 4.1.0부터 지원됩니다.

캐시 허용 제어 기능은 사용자, Catalog, 데이터베이스, 테이블 등의 기준에 따라 쿼리가 읽은 데이터를 File Cache(데이터 캐시)에 저장하도록 허용할지 사용자가 제어할 수 있는 메커니즘을 제공합니다.
대규모 ETL 작업이나 부하가 큰 ad-hoc 쿼리처럼 대량의 콜드 데이터를 읽는 시나리오에서, 읽은 데이터를 모두 캐시에 저장하도록 허용하면 기존 핫 데이터가 자주 밀려나는 "캐시 오염"이 발생하여 캐시 적중률과 전체 쿼리 성능이 저하될 수 있습니다. 이 기능을 활성화하면 캐시 진입이 거부된 데이터는 원격 기반 스토리지(예: HDFS, S3)에서 직접 가져오므로 핵심 핫 데이터가 밀려나는 것을 효과적으로 방지합니다.

캐시 허용 제어 기능은 기본적으로 비활성화되어 있으며, FE에서 관련 매개변수를 구성하여 활성화해야 합니다.

### FE 구성 {#fe-configuration-1}

`fe.conf`에서 이 기능을 활성화하고 규칙 구성 파일 경로를 지정한 다음, FE 노드를 다시 시작해야 적용됩니다. 규칙 파일 자체의 변경 사항은 동적으로 로드할 수 있습니다.

| 매개변수                                       | 필수 여부 | 설명                               |
| ----------------------------------------------- | -------- |-------------------------------------------|
| `enable_file_cache_admission_control`           | 예      | 캐시 허용 제어 활성화 여부입니다. 기본값은 `false`입니다. |
| `file_cache_admission_control_json_dir`         | 예      | 허용 규칙 JSON 파일을 저장하는 디렉터리 경로입니다. 이 디렉터리의 모든 `.json` 파일이 자동으로 로드되며, 규칙의 추가, 삭제, 수정 사항은 **동적으로 적용됩니다**. |

### 캐시 허용 규칙 구성 형식 {#admission-rules-configuration-format}

규칙 구성은 `.json` 파일로 저장하며, 이 파일을 `file_cache_admission_control_json_dir` 디렉터리에 배치합니다. 파일 내용은 JSON 배열 형식이어야 합니다.

#### 필드 설명 {#field-description}

| 필드 이름 | 유형 | 설명 | 예제 |
|--------|------|-------------------------------|-----------------------|
| `id` | Long | 규칙 ID입니다. | `1` |
| `user_identity` | String | 사용자 식별 정보입니다(형식: `user@host`, 예: `%`는 모든 IP와 일치). **비워 두거나 생략하면 전역적으로 모든 사용자와 일치합니다.** | `"root@%"` |
| `catalog_name` | String | Catalog 이름입니다. **비워 두거나 생략하면 모든 Catalog와 일치합니다.** | `"hive_cat"` |
| `database_name` | String | 데이터베이스 이름입니다. **비워 두거나 생략하면 모든 데이터베이스와 일치합니다.** | `"db1"` |
| `table_name` | String | 테이블 이름입니다. **비워 두거나 생략하면 모든 테이블과 일치합니다.** | `"tbl1"` |
| `partition_pattern` | String | (아직 구현되지 않음) 파티션 정규식입니다. 비어 있으면 모든 파티션과 일치합니다. | `""` |
| `rule_type` | Integer | 규칙 유형: `0`은 캐시 거부(블랙리스트), `1`은 캐시 허용(화이트리스트)을 의미합니다. | `0` |
| `enabled` | Integer | 현재 규칙의 활성화 여부: `0`은 비활성화, `1`은 활성화를 의미합니다. | `1` |
| `created_time` | Long | 생성 시간(UNIX 타임스탬프, 초)입니다. | `1766557246` |
| `updated_time` | Long | 갱신 시간(UNIX 타임스탬프, 초)입니다. | `1766557246` |

#### JSON 파일 예제 {#json-file-example}

```json
[
  {
    "id": 1,
    "user_identity": "root@%",
    "catalog_name": "hive_cat",
    "database_name": "db1",
    "table_name": "table1",
    "partition_pattern": "",
    "rule_type": 0,
    "enabled": 1,
    "created_time": 1766557246,
    "updated_time": 1766557246
  },
  {
    "id": 2,
    "user_identity": "",
    "catalog_name": "hive_cat",
    "database_name": "",
    "table_name": "",
    "partition_pattern": "",
    "rule_type": 1,
    "enabled": 1,
    "created_time": 1766557246,
    "updated_time": 1766557246
  }
]
```

#### MySQL에서 규칙 가져오기 {#import-rules-from-mysql}

시스템 자동화 연동이 필요한 사용자를 위해 Doris 소스 코드 저장소의 `tools/export_mysql_rule_to_json.sh`에 보조 스크립트가 제공됩니다. 이 스크립트를 사용하면 MySQL 데이터베이스 테이블에 미리 저장된 캐시 허용 규칙을 위 형식에 맞는 JSON 구성 파일로 내보낼 수 있습니다.

### 규칙 일치 원칙 {#rule-matching-principles}

#### 규칙 범위 유형 {#rule-scope-categories}

각 필드(`user_identity`, `catalog_name`, `database_name`, `table_name`)를 비워 두거나 구체적인 값으로 지정하는 조합을 통해 시스템은 7가지 범위의 유효한 규칙을 지원합니다. **계층 간 종속 관계를 따르지 않는 규칙 구성(예: 데이터베이스를 건너뛰고 테이블을 직접 지정하는 경우)은 유효하지 않은 것으로 간주됩니다.**

| user_identity | catalog_name | database_name | table_name | 수준 및 범위             |
|---------------|--------------|---------------|------------|------------------|
| **지정됨**      | **지정됨**     | **지정됨**      | **지정됨**   | 특정 사용자의 테이블 수준 규칙 |
| 비어 있거나 생략됨       | **지정됨**     | **지정됨**      | **지정됨**   | 모든 사용자의 테이블 수준 규칙 |
| **지정됨**      | **지정됨**     | **지정됨**      | 비어 있거나 생략됨   | 특정 사용자의 데이터베이스 수준 규칙 |
| 비어 있거나 생략됨       | **지정됨**     | **지정됨**      | 비어 있거나 생략됨   | 모든 사용자의 데이터베이스 수준 규칙 |
| **지정됨**      | **지정됨**     | 비어 있거나 생략됨      | 비어 있거나 생략됨   | 특정 사용자의 Catalog 수준 규칙 |
| 비어 있거나 생략됨       | **지정됨**     | 비어 있거나 생략됨      | 비어 있거나 생략됨   | 모든 사용자의 Catalog 수준 규칙 |
| **지정됨**      | 비어 있거나 생략됨      | 비어 있거나 생략됨      | 비어 있거나 생략됨   | 특정 사용자의 전역 규칙 |

#### 일치 우선순위 및 순서 {#matching-priority-and-order}

쿼리가 테이블 데이터에 접근하면 시스템은 모든 규칙을 종합적으로 평가하여 캐시 허용 여부를 결정합니다. 판단 과정은 다음 원칙을 따릅니다.

1. **정확한 일치 우선**: 구체적인 계층에서 넓은 계층 순서로(테이블 → 데이터베이스 → Catalog → 전역) 일치 여부를 확인합니다. 가장 구체적인 수준(예: 테이블 수준)에서 일치하는 규칙을 찾으면 즉시 판단을 종료합니다.
2. **블랙리스트 우선(보안 원칙)**: 같은 규칙 수준에서는 **캐시 거부 규칙이 항상 캐시 허용 규칙보다 우선합니다**. 블랙리스트와 화이트리스트가 동시에 일치하면 블랙리스트 작업을 먼저 실행하여 같은 수준의 거부 결정이 먼저 적용되도록 합니다.

전체 결정 과정은 다음과 같습니다.

```text
1. Table-level rule matching
   a) Hit Blacklist (rule_type=0) -> Deny
   b) Hit Whitelist (rule_type=1) -> Allow
2. Database-level rule matching
   ...
3. Catalog-level rule matching
   ...
4. Global rule matching (only user_identity matched)
   ...
5. Default fallback decision: If no rules at any level above match, caching is [Denied] by default (equivalent to a global blacklist).
```

> **팁**: 시스템의 기본 대체 전략은 거부이므로, 이 기능을 도입할 때는 일반적으로 먼저 넓은 범위의 전역 허용 규칙(예: 모든 사용자 또는 중요한 업무 Catalog에 대한 화이트리스트)을 설정하는 것이 좋습니다. 그런 다음 오프라인 전체 테이블 스캔이 수행되는 대규모 테이블에 대해 개별적인 테이블 수준 블랙리스트를 구성하세요. 이렇게 하면 콜드 데이터와 핫 데이터를 세밀하게 분리할 수 있습니다.

### 캐시 판단 결과 확인 {#cache-decision-observability}

기능을 활성화하고 구성을 적용한 후에는 `EXPLAIN` 명령으로 단일 테이블의 파일 데이터 수준에서 상세한 캐시 허용 결정을 확인할 수 있습니다(아래 `file cache request` 출력 참조).

```text
|   0:VHIVE_SCAN_NODE(74)                                                                                          |
|      table: test_file_cache_features.tpch1_parquet.lineitem                                                      |
|      inputSplitNum=10, totalFileSize=205792918, scanRanges=10                                                    |
|      partition=1/1                                                                                               |
|      cardinality=1469949, numNodes=1                                                                             |
|      pushdown agg=NONE                                                                                           |
|      file cache request ADMITTED: user_identity:root@%, reason:user table-level whitelist rule, cost:0.058 ms    |
|      limit: 1                                                                                                    |
```

주요 필드 및 결정 설명:
- **ADMITTED** / **DENIED**: 요청의 캐시 진입이 허용되었는지(ADMITTED), 거부되었는지(DENIED)를 나타냅니다.
- **user_identity**: 이 쿼리 실행 중 검증된 사용자 식별 정보입니다.
- **reason**: 결과를 결정한 구체적인 이유(일치한 규칙)입니다. 일반적인 출력으로는 `user table-level whitelist rule`(현재 예제: 특정 사용자의 테이블 수준 화이트리스트), `common table-level blacklist rule`(모든 사용자의 테이블 수준 블랙리스트)이 있습니다. 일반적인 형식은 `[Scope] [Rule Level] [Rule Type] rule`입니다.
- **cost**: 전체 허용 규칙 일치 계산을 완료하는 데 걸린 시간(밀리초)입니다. 오버헤드가 너무 크면 규칙 계층 수를 조정하여 최적화할 수 있습니다.

## 부록 {#appendix}

### 동작 원리 {#principle}

데이터 캐시는 접근한 원격 데이터를 로컬 BE 노드에 캐시합니다. 원본 데이터 파일은 접근한 IO 크기에 따라 Block으로 나뉘며, Block은 로컬 파일 `cache_path/hash(filepath).substr(0, 3)/hash(filepath)/offset`에 저장되고 Block 메타데이터는 BE 노드에 저장됩니다. 같은 원격 파일에 접근할 때 Doris는 해당 파일의 캐시 데이터가 로컬 캐시에 있는지 확인하고, Block의 오프셋과 크기를 바탕으로 로컬 Block에서 읽을 데이터와 원격에서 가져올 데이터를 결정한 다음 새로 가져온 원격 데이터를 캐시합니다. BE 노드가 다시 시작되면 `cache_path` 디렉터리를 스캔하여 Block 메타데이터를 복원합니다. 캐시 크기가 상한에 도달하면 LRU 원칙에 따라 오랫동안 사용하지 않은 Block을 정리합니다.
