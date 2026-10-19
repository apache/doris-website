---
{
    "title": "Hudi Catalog",
    "language": "ko",
    "description": "Hudi Catalog는 Hive Catalog를 재사용하며, Hive Metastore 또는 Hive Metastore와 호환되는 메타데이터 서비스에 연결합니다."
}
---

Hudi Catalog는 Hive Catalog를 재사용합니다. Doris는 Hive Metastore 또는 Hive Metastore와 호환되는 메타데이터 서비스에 연결하여 Hudi의 데이터베이스 및 테이블 정보를 자동으로 가져오고 데이터를 쿼리할 수 있습니다.

[Apache Doris와 Apache Hudi 빠른 시작](../best-practices/doris-hudi.md).

## 활용 시나리오 {#applicable-scenarios}

| 시나리오 | 설명 |
| -------- | ----------- |
| 쿼리 가속 | Doris의 분산 컴퓨팅 엔진으로 Hudi 데이터에 직접 접근하여 쿼리를 가속합니다. |
| 데이터 통합 | Hudi 데이터를 읽어 Doris 내부 테이블에 쓰거나, Doris 컴퓨팅 엔진으로 ZeroETL 작업을 수행합니다. |
| 데이터 다시 쓰기 | 지원하지 않습니다. |

## Catalog 구성 {#configuring-catalog}

### 구문 {#syntax}

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'hms', -- required
    'hive.metastore.uris' = '<metastore_thrift_url>', -- required
    {MetaStoreProperties},
    {StorageProperties},
    {HudiProperties},
    {CommonProperties}
);
```

* `[MetaStoreProperties]`

  MetaStoreProperties 섹션에는 Metastore 메타데이터 서비스의 연결 및 인증 정보를 입력합니다. 자세한 내용은 [지원하는 메타데이터 서비스] 섹션을 참조하세요.

* `[StorageProperties]`

  StorageProperties 섹션에는 스토리지 시스템의 연결 및 인증 정보를 입력합니다. 자세한 내용은 [지원하는 스토리지 시스템] 섹션을 참조하세요.

* `[CommonProperties]`

  CommonProperties 섹션에는 공통 속성을 입력합니다. [데이터 Catalog 개요](../catalog-overview.md)의 [공통 속성] 섹션을 참조하세요.

* `{HudiProperties}`

  | 매개변수 이름                  | 이전 이름                | 설명                                                                                                                                               | 기본값 |
  | ------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
  | `hudi.use_hive_sync_partition`  | `use_hive_sync_partition`  | Hive Metastore에 이미 동기화된 파티션 정보를 사용할지 여부입니다. true이면 Hive Metastore에서 파티션 정보를 직접 가져옵니다. 그렇지 않으면 파일 시스템의 메타데이터 파일에서 가져옵니다. Hive Metastore에서 정보를 가져오는 방식이 더 효율적이지만, 사용자는 최신 메타데이터가 Hive Metastore에 동기화되었는지 확인해야 합니다. | false |

## 메타데이터 캐시 {#meta-cache}

Apache Doris는 외부 데이터 소스 접근 성능을 높이기 위해 Hudi 테이블이 의존하는 Hive Metastore 메타데이터인 테이블 객체, 파티션 이름, 파티션 객체, 컬럼 통계를 캐시합니다.

:::tip
Doris 4.1.x 이전 버전에서는 주로 FE 구성 항목으로 메타데이터 캐시를 전역 제어합니다. 자세한 내용은 [메타데이터 캐시](../meta-cache.md)를 참조하세요.
Doris 4.1.x부터 Hudi Catalog의 외부 메타데이터 캐시는 통합된 `meta.cache.*` 키로 구성합니다. 아래 항목은 현재 버전을 기준으로 설명합니다. Doris 4.1.x 및 4.2.x에서는 다른 항목 집합을 사용하며, 해당 항목은 이 페이지의 4.x 버전에서 설명합니다.
:::

### 캐시 속성 구성 {#meta-cache-unified-model}

각 캐시 항목은 통합된 구성 키 형식인 `meta.cache.<engine>.<entry>.{enable,ttl-second,capacity,max-weight}`를 사용합니다. Hudi Catalog는 시스템 테이블에서 캐시를 `hudi` 엔진 아래에 표시하지만, 이 캐시는 공유 Hive Metastore 캐시이며 `hive` 엔진 토큰으로 구성합니다. 키 형식은 `meta.cache.hive.<entry>.*`입니다.

| 속성 | 예시 | 의미 |
|---|---|---|
| `enable` | `true/false` | 이 캐시 항목을 활성화할지 여부입니다. |
| `ttl-second` | `600`, `0`, `-1` | `0`은 항목을 비활성화합니다(즉시 적용되며, 최신 데이터를 확인하는 데 사용할 수 있습니다). `-1`은 만료되지 않음을 의미합니다. 그 밖의 양의 정수는 접근 시점을 기준으로 한 TTL을 초 단위로 나타냅니다. |
| `capacity` | `10000` | 캐시 항목의 최대 개수입니다. `0`은 항목을 비활성화합니다. |
| `max-weight` | `1GB` | Doris 4.1.4부터 지원합니다. 캐시 항목이 유지하는 추정 메모리의 한도를 지정하는 선택 속성입니다. 양수여야 하며, `0`은 허용되지 않습니다. 아래에 표시된 항목에서만 사용할 수 있습니다. |

**적용 조건:** 항목은 `enable=true`, `ttl-second != 0`, `capacity > 0` 조건을 모두 충족할 때 활성화됩니다. FE 전체, Catalog 또는 캐시 항목에 적용되는 메모리 한도도 추정 메모리를 기준으로 캐시 저장 허용 여부를 제어합니다. [외부 메타데이터 캐시 메모리 관리](../external-meta-cache-memory-management)를 참조하세요.

### 캐시 모듈 {#meta-cache-unified-modules}

Hudi Catalog에는 다음 캐시 항목이 포함됩니다. 모든 항목에서 `max-weight`를 사용할 수 있습니다.

| 항목 (`<entry>`) | 속성 키 접두사 | `ENTRY_NAME` | 캐시 내용 및 영향 | 기본 enable / TTL / capacity |
|---|---|---|---|---|
| `table` | `meta.cache.hive.table.` | `hive-table` | Hive Metastore의 테이블 객체입니다. | `true` / 86400 s / 10000 |
| `partition_names` | `meta.cache.hive.partition_names.` | `hive-partition-names` | 파티션 이름 목록입니다. 파티션 탐색과 프루닝에 영향을 줍니다. 비활성화하면 새 파티션이 즉시 표시됩니다. | `true` / 86400 s / 10000 |
| `partition` | `meta.cache.hive.partition.` | `hive-partition` | 위치, 입력 형식 등의 파티션 객체입니다. | `true` / 86400 s / 100000 |
| `column_stats` | `meta.cache.hive.column_stats.` | `hive-column-stats` | Hive Metastore의 컬럼 통계입니다. | `true` / 86400 s / 10000 |

Hudi 테이블의 컬럼 스키마는 공유 `default` 엔진(`meta.cache.default.schema.*`)에서 캐시합니다.

### 기존 매개변수 매핑 및 변환 {#meta-cache-mapping}

| 기존 속성 키 | 통합 키 | 설명 |
|---|---|---|
| `schema.cache.ttl-second` | `meta.cache.default.schema.ttl-second` 및 `meta.cache.hive.table.ttl-second` | 테이블 스키마 및 테이블 객체 캐시의 만료 시간 |
| `partition.cache.ttl-second` | `meta.cache.hive.partition_names.ttl-second` | 파티션 이름 목록의 만료 시간 |

### 권장 사용 방법 {#meta-cache-best-practices}

* **최신 데이터에 실시간으로 접근**: 각 쿼리에서 Hudi 테이블의 최신 파티션을 확인하려면 파티션 이름 캐시의 TTL을 `0`으로 설정하세요.
  ```sql
  -- Disable the partition name cache to detect the latest partitions of Hudi tables
  ALTER CATALOG hudi_ctl SET PROPERTIES ("meta.cache.hive.partition_names.ttl-second" = "0");
  ```
* **성능 최적화**: Catalog 속성 변경이 성공하면 영향을 받는 메타데이터 캐시를 삭제하고, 다음 접근 시 새 구성으로 다시 생성합니다. `meta.cache.max-weight` 또는 `schema.cache.ttl-second`를 변경하면 Catalog의 모든 캐시가 삭제됩니다. `meta.cache.<engine>.<entry>.*`를 변경하면 해당 엔진의 캐시가 삭제됩니다. 이미 실행 중인 쿼리는 영향을 받지 않습니다.

### 모니터링 {#meta-cache-unified-observability}

캐시 지표는 `information_schema.catalog_meta_cache_statistics` 시스템 테이블에서 확인할 수 있습니다. `ENTRY_NAME`에는 위 표에 나열된 이름이 표시되며, `default` 엔진 행은 공유 테이블 스키마 캐시를 나타냅니다.

```sql
SELECT engine_name, entry_name,
       effective_enabled, ttl_second, capacity,
       estimated_size, hit_rate, max_weight, estimated_weight
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'hudi_ctl'
ORDER BY engine_name, entry_name;
```

이 시스템 테이블에 대한 문서는 [catalog_meta_cache_statistics](../../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md)를 참조하세요.

### 지원하는 Hudi 버전 {#supported-hudi-versions}

현재 의존하는 Hudi 버전은 0.15입니다. Hudi 0.14 이상 버전의 데이터에 접근하는 것을 권장합니다.

### 지원하는 쿼리 유형 {#supported-query-types}

| 테이블 유형    | 지원하는 쿼리 유형                                                    |
| ------------- | ------------------------------------------------------------------------ |
| Copy On Write | 스냅샷 쿼리(Snapshot Query), Time Travel, 증분 읽기(Incremental Read)                            |
| Merge On Read | 스냅샷 쿼리(Snapshot Queries), 읽기 최적화 쿼리(Read Optimized Queries), Time Travel, 증분 읽기(Incremental Read)  |

### 지원하는 메타데이터 서비스 {#supported-metadata-services}

* [Hive Metastore](../metastores/hive-metastore.md)

### 지원하는 스토리지 시스템 {#supported-storage-systems}

* [HDFS](../storages/hdfs.md)
* [AWS S3](../storages/s3.md)
* [Google Cloud Storage](../storages/gcs.md)
* [Alibaba Cloud OSS](../storages/aliyun-oss.md)
* [Tencent Cloud COS](../storages/tencent-cos.md)
* [Huawei Cloud OBS](../storages/huawei-obs.md)
* [MINIO](../storages/minio.md)

### 지원하는 데이터 형식 {#supported-data-formats}

* [Parquet](../file-formats/parquet.md)
* [ORC](../file-formats/orc.md)

## 컬럼 타입 매핑 {#column-type-mapping}

| Hudi 타입     | Doris 타입    | 설명                                                   |
| ------------- | ------------- | --------------------------------------------------------- |
| boolean       | boolean       |                                                           |
| int           | int           |                                                           |
| long          | bigint        |                                                           |
| float         | float         |                                                           |
| double        | double        |                                                           |
| decimal(P, S) | decimal(P, S) |                                                           |
| bytes         | string        |                                                           |
| string        | string        |                                                           |
| date          | date          |                                                           |
| timestamp     | datetime(N)   | 정밀도에 따라 datetime(3) 또는 datetime(6)으로 자동 매핑 |
| array         | array         |                                                           |
| map           | map           |                                                           |
| struct        | struct        |                                                           |
| other         | UNSUPPORTED   |                                                           |

## 예시 {#examples}

Hudi Catalog 생성 방법은 Hive Catalog와 유사합니다. 더 많은 예시는 [Hive Catalog](./hive-catalog.mdx)를 참조하세요.

```sql
CREATE CATALOG hudi_hms PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.21.0.1:7004',
    'hadoop.username' = 'hive',
    'dfs.nameservices'='your-nameservice',
    'dfs.ha.namenodes.your-nameservice'='nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1'='172.21.0.2:4007',
    'dfs.namenode.rpc-address.your-nameservice.nn2'='172.21.0.3:4007',
    'dfs.client.failover.proxy.provider.your-nameservice'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```

## 쿼리 작업 {#query-operations}

### 기본 쿼리 {#basic-query}

Catalog를 구성한 후 다음 방법으로 Catalog 내의 테이블을 쿼리할 수 있습니다.

```sql
-- 1. switch to catalog, use database and query
SWITCH hudi_ctl;
USE hudi_db;
SELECT * FROM hudi_tbl LIMIT 10;

-- 2. use hudi database directly
USE hudi_ctl.hudi_db;
SELECT * FROM hudi_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM hudi_ctl.hudi_db.hudi_tbl LIMIT 10;
```

### 시점 조회(Time Travel) {#time-travel}

Hudi 테이블에 쓰기 작업을 수행할 때마다 새 스냅샷이 생성됩니다. Doris는 Hudi 테이블의 지정된 스냅샷 읽기를 지원합니다. 기본적으로 쿼리 요청은 최신 스냅샷만 읽습니다.

`hudi_meta()` 테이블 함수로 지정된 Hudi 테이블의 타임라인을 쿼리할 수 있습니다.

이 테이블 함수는 3.1.0부터 지원됩니다.

```sql
SELECT * FROM hudi_meta(
    'table' = 'hudi_ctl.hudi_db.hudi_tbl',
    'query_type' = 'timeline'
);

+-------------------+--------+--------------------------+-----------+-----------------------+
| timestamp         | action | file_name                | state     | state_transition_time |
+-------------------+--------+--------------------------+-----------+-----------------------+
| 20241202171214902 | commit | 20241202171214902.commit | COMPLETED | 20241202171215756     |
| 20241202171217258 | commit | 20241202171217258.commit | COMPLETED | 20241202171218127     |
| 20241202171219557 | commit | 20241202171219557.commit | COMPLETED | 20241202171220308     |
| 20241202171221769 | commit | 20241202171221769.commit | COMPLETED | 20241202171222541     |
| 20241202171224269 | commit | 20241202171224269.commit | COMPLETED | 20241202171224995     |
| 20241202171226401 | commit | 20241202171226401.commit | COMPLETED | 20241202171227155     |
| 20241202171228827 | commit | 20241202171228827.commit | COMPLETED | 20241202171229570     |
| 20241202171230907 | commit | 20241202171230907.commit | COMPLETED | 20241202171231686     |
| 20241202171233356 | commit | 20241202171233356.commit | COMPLETED | 20241202171234288     |
| 20241202171235940 | commit | 20241202171235940.commit | COMPLETED | 20241202171236757     |
+-------------------+--------+--------------------------+-----------+-----------------------+
```

`FOR TIME AS OF` 문을 사용하면 스냅샷의 타임스탬프를 기준으로 과거 버전의 데이터를 읽을 수 있습니다. 시간 형식은 Hudi 문서와 일치합니다. 다음은 몇 가지 예시입니다.

```sql
SELECT * FROM hudi_tbl FOR TIME AS OF "2022-10-07 17:20:37";
SELECT * FROM hudi_tbl FOR TIME AS OF "20221007172037";
SELECT * FROM hudi_tbl FOR TIME AS OF "2022-10-07";
```

Hudi 테이블은 `FOR VERSION AS OF` 문을 지원하지 않습니다. Hudi 테이블에 이 구문을 사용하면 오류가 발생합니다.

### 증분 쿼리 {#incremental-query}

증분 읽기(Incremental Read)를 사용하면 지정된 시간 범위 내의 데이터 변경 사항을 쿼리할 수 있으며, 해당 기간이 끝나는 시점의 데이터 최종 상태를 반환합니다.

Doris는 증분 읽기를 지원하기 위해 `@incr` 구문을 제공합니다.

```sql
SELECT * from hudi_table@incr('beginTime'='xxx', ['endTime'='xxx'], ['hoodie.read.timeline.holes.resolution.policy'='FAIL'], ...);
```

* `beginTime`

  필수 항목입니다. 시간 형식은 Hudi 공식 [hudi\_table\_changes](https://hudi.apache.org/docs/0.14.0/quick-start-guide/#incremental-query) 문서의 형식과 일치해야 하며, "earliest"를 지원합니다.

* `endTime`

  선택 항목이며, 기본값은 최신 commitTime입니다.

`@incr` 함수에 더 많은 옵션을 추가할 수 있으며, [Spark 읽기 옵션](https://hudi.apache.org/docs/0.14.0/configurations#Read-Options)과 호환됩니다.

`desc`로 실행 계획을 확인하면 Doris가 `@incr`를 `VHUDI_SCAN_NODE`에 푸시다운되는 조건식으로 변환하는 것을 볼 수 있습니다.

```text
|   0:VHUDI_SCAN_NODE(113)                                                                                            |
|      table: lineitem_mor                                                                                            |
|      predicates: (_hoodie_commit_time[#0] > '20240311151019723'), (_hoodie_commit_time[#0] <= '20240311151606605') |
|      inputSplitNum=1, totalFileSize=13099711, scanRanges=1              
```

## 자주 묻는 질문 {#faq}

1. JNI를 통해 Java SDK로 증분 데이터를 읽을 때 쿼리가 멈춤

    `-Djol.skipHotspotSAAttach=true`를 `JAVA_OPTS_FOR_JDK_17` 또는 `JAVA_OPTS`에 추가하세요. 해당 설정은 `be.conf`에 있습니다.

## 부록 {#appendix}

### 변경 이력 {#change-log}

| Doris 버전 | 지원 기능                               |
| ------------- | ---------------------------------------------- |
| 2.1.8/3.0.4   | Hudi 의존성을 0.15로 업그레이드했습니다. Hadoop Hudi JNI Scanner를 추가했습니다. |
