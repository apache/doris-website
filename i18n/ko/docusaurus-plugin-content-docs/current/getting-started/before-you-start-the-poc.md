---
{
    "title": "Apache Doris POC를 완료하는 방법",
    "language": "ko",
    "description": "POC 중 테이블 생성에 실패하거나, 쿼리가 느리거나, 데이터 레이크 처리가 멈추나요? 이 문서는 신규 사용자가 자주 묻는 질문과 해결 방법을 테이블 설계, 데이터 적재, 쿼리 튜닝, 데이터 레이크 쿼리의 네 가지 시나리오로 정리합니다.",
    "sidebar_label": "POC 전 필독",
    "tags": ["POC", "Table Design", "Query Tuning", "Data Lake", "New Users"]
}
---

이 문서는 POC를 더 빠르게 진행할 수 있도록 신규 사용자가 자주 묻는 질문을 정리했습니다. 내용은 일반적인 POC 작업 순서에 따라 구성되어 있습니다:

1. **테이블 설계** - 데이터 모델, 정렬 키, 파티셔닝 및 버킷팅 전략을 선택합니다.
2. **데이터 적재** - 적절한 적재 방식을 선택하고 흔히 발생하는 문제를 피합니다.
3. **쿼리 튜닝** - 느린 쿼리를 진단하고 버킷 및 인덱스 구성을 최적화합니다.
4. **데이터 레이크 쿼리** - Lakehouse 시나리오에 필요한 추가 최적화 팁을 살펴봅니다.

:::tip 빠른 점검 목록
5분 안에 기본 사항을 점검하세요:
1. 테이블에 적절한 데이터 모델(Duplicate/Unique/Aggregate Key)을 사용하고 있나요?
2. 버킷 수가 BE 수의 정수 배수인가요?
3. 시간 기반 쿼리에 파티션 컬럼이 포함되어 있나요?
4. Data Cache가 활성화되어 있나요(데이터 레이크 쿼리 시나리오)?
:::

## 테이블 설계 {#table-design}

Doris에서 테이블을 생성할 때는 적재 및 쿼리 성능에 영향을 미치는 네 가지 요소를 결정해야 합니다. 데이터 모델, 정렬 키, 파티셔닝, 버킷팅입니다.

### 데이터 모델 {#data-model}

데이터를 쓰는 방식에 따라 적절한 모델을 선택하세요:

| 데이터 특성 | 권장 모델 | 이유 |
|---|---|---|
| 데이터 추가만 수행(로그, 이벤트, 팩트 테이블) | **Duplicate Key** (기본값) | 모든 행을 유지하며 쿼리 성능이 가장 우수함 |
| 기본 키를 기준으로 업데이트(CDC, Upsert) | **Unique Key** | 새 행이 동일한 키를 가진 기존 행을 대체함 |
| 사전 집계된 지표(PV, UV, 요약 데이터) | **Aggregate Key** | 쓰기 시점에 SUM/MAX/MIN으로 행을 병합함 |

**대부분의 시나리오에는 Duplicate Key가 적합합니다.** 자세한 내용은 [데이터 모델 개요](../table-design/data-model/intro)를 참조하세요.

### 정렬 키 {#sort-key}

Doris는 정렬 키의 처음 36바이트에 [접두사 인덱스](../table-design/index/prefix-index)를 생성합니다. 정렬 키를 설정할 때는 다음 원칙을 따르세요:

- **필터에 자주 사용하는 컬럼을 앞에 배치하세요**: WHERE 조건에 가장 자주 사용하는 컬럼을 앞쪽에 배치합니다.
- **고정 길이 타입을 먼저 배치하세요**: INT, BIGINT, DATE와 같은 고정 길이 타입을 VARCHAR 앞에 배치합니다. VARCHAR를 만나면 접두사 인덱스가 그 지점에서 바로 잘리기 때문입니다.
- **역색인을 추가해 보완하세요**: 접두사 인덱스가 다루지 못하는 컬럼에는 [역색인](../table-design/index/inverted-index/overview)을 추가하여 필터링 속도를 높입니다.

### 파티셔닝 {#partitioning}

시간 컬럼이 있다면 `AUTO PARTITION BY RANGE(date_trunc(time_col, 'day'))`를 사용해 [파티션 프루닝](../table-design/data-partitioning/auto-partitioning)을 활성화하세요. Doris가 관련 없는 파티션을 자동으로 건너뜁니다.

### 버킷팅 {#bucketing}

기본값은 **Random bucketing**이며, Duplicate Key 테이블에 권장됩니다. 특정 컬럼으로 자주 필터링하거나 JOIN한다면 `DISTRIBUTED BY HASH(that_column)`을 사용하세요. 자세한 내용은 [데이터 버킷팅](../table-design/data-partitioning/data-bucketing)을 참조하세요.

**버킷 수를 선택하는 방법:**

| 원칙 | 설명 |
|---|---|
| BE 수의 정수 배수로 설정 | 데이터를 고르게 분산합니다. 나중에 BE를 추가해 확장하더라도 쿼리는 보통 여러 파티션을 사용하므로 성능에 영향을 주지 않습니다 |
| 가능한 한 적게 설정 | 작은 파일이 생성되는 것을 방지합니다 |
| 버킷당 압축 데이터 <= 20 GB | Unique Key 테이블은 <= 10 GB. `SHOW TABLETS FROM your_table`로 확인하세요 |
| 파티션당 버킷 수는 128개 이하 | 더 필요하다면 먼저 파티션 수를 늘리세요. 최대 상한은 1024개이지만 운영 환경에서는 거의 필요하지 않습니다 |

### 테이블 생성 템플릿 {#table-creation-templates}

#### 로그 / 이벤트 분석 {#log--event-analytics}

**사용 사례:** 로그, 이벤트, 센서 데이터 등 데이터를 추가만 하는 시나리오.

**사전 요구 사항:** 특별한 요구 사항이 없습니다.

```sql
CREATE TABLE app_logs
(
    log_time      DATETIME    NOT NULL,
    log_level     VARCHAR(10),
    service_name  VARCHAR(50),
    trace_id      VARCHAR(64),
    message       STRING,
    INDEX idx_message (message) USING INVERTED PROPERTIES("parser" = "unicode")
)
AUTO PARTITION BY RANGE(date_trunc(`log_time`, 'day'))
()
DISTRIBUTED BY RANDOM BUCKETS 10;
```

**확인 절차:**

```sql
-- 1. Verify that partitions are created automatically
SHOW PARTITIONS FROM app_logs;

-- 2. Verify that data is evenly distributed
SHOW TABLETS FROM app_logs;
```

#### 실시간 대시보드 및 Upsert(CDC) {#real-time-dashboards-and-upsert-cdc}

**사용 사례:** 사용자 프로필, 주문 기록 등 기본 키 기반 업데이트가 필요한 시나리오.

**사전 요구 사항:** 기본 키 컬럼이 명확하게 정의되어 있어야 합니다.

```sql
CREATE TABLE user_profiles
(
    user_id       BIGINT      NOT NULL,
    username      VARCHAR(50),
    email         VARCHAR(100),
    status        TINYINT,
    updated_at    DATETIME
)
UNIQUE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**확인 절차:**

```sql
-- 1. Verify primary key uniqueness (only one latest row per user_id)
SELECT user_id, count(*) as cnt FROM user_profiles GROUP BY user_id HAVING cnt > 1;

-- 2. Verify data distribution
SHOW TABLETS FROM user_profiles;
```

#### 지표 집계 {#metric-aggregation}

**사용 사례:** 트래픽 통계, 비즈니스 보고서 등 사전 집계가 필요한 시나리오.

**사전 요구 사항:** 집계 차원 컬럼과 지표 컬럼이 명확하게 정의되어 있어야 합니다.

```sql
CREATE TABLE site_metrics
(
    dt            DATE        NOT NULL,
    site_id       INT         NOT NULL,
    pv            BIGINT      SUM DEFAULT '0',
    uv            BIGINT      MAX DEFAULT '0'
)
AGGREGATE KEY(dt, site_id)
AUTO PARTITION BY RANGE(date_trunc(`dt`, 'day'))
()
DISTRIBUTED BY HASH(site_id) BUCKETS 10;
```

**확인 절차:**

```sql
-- 1. Verify that aggregation works (metrics with the same dt+site_id are merged)
SELECT dt, site_id, pv, uv FROM site_metrics ORDER BY dt DESC LIMIT 10;

-- 2. Verify that partition pruning works
EXPLAIN SELECT * FROM site_metrics WHERE dt = '2024-01-01';
```

## 데이터 적재 {#data-ingestion}

적절한 적재 방식을 선택하고 다음 권장 사항을 따라 흔히 발생하는 성능 문제를 방지하세요:

- **대량 데이터에는 `INSERT INTO VALUES`를 사용하지 마세요.** 대신 [Stream Load](../data-operate/import/import-way/stream-load-manual) 또는 [Broker Load](../data-operate/import/import-way/broker-load-manual)를 사용하세요. 자세한 내용은 [데이터 적재 개요](../data-operate/import/load-manual)를 참조하세요.
- **먼저 클라이언트 측에서 쓰기를 묶으세요.** 소규모 배치를 자주 적재하면 버전이 과도하게 누적됩니다. 클라이언트 측에서 묶기 어렵다면 [Group Commit](../data-operate/import/load-best-practices/group-commit-manual)을 사용하세요.
- **대규모 적재는 작은 배치로 나누세요.** 오래 실행되는 적재 작업은 실패하면 처음부터 다시 시작해야 합니다. 증분 데이터 적재에는 [S3 TVF를 사용한 INSERT INTO SELECT](../data-operate/import/import-way/streaming-job/continuous-load-overview)를 사용하세요.
- **Random bucketing을 사용하는 Duplicate Key 테이블에서는 `load_to_single_tablet`를 활성화하여** 쓰기 증폭을 줄이세요.

**빠른 확인:**

```sql
-- View ingestion task status
SHOW LOAD WHERE label = 'your_label';

-- Check version pile-up (a high Version Count indicates ingestion is too frequent)
SHOW TABLETS FROM your_table;
```

자세한 내용은 [데이터 적재 모범 사례](../data-operate/import/load-best-practices/load-best-practices)를 참조하세요.

## 쿼리 튜닝 {#query-tuning}

### 버킷팅 {#bucketing-1}

버킷 수는 쿼리 병렬성과 스케줄링 오버헤드에 직접 영향을 주므로 적절한 균형을 찾아야 합니다:

- **버킷을 너무 많이 사용하지 마세요.** 작은 태블릿이 너무 많으면 스케줄링 오버헤드가 발생하고 쿼리 성능이 최대 50%까지 저하될 수 있습니다.
- **버킷을 너무 적게 사용하지 마세요.** 태블릿이 너무 적으면 CPU 병렬성이 제한됩니다.
- **데이터 편중을 방지하세요.** `SHOW TABLETS`로 태블릿 크기를 확인하세요. 크기 차이가 크다면 Random bucketing으로 전환하거나 카디널리티가 더 높은 버킷팅 컬럼을 선택하세요.

**진단 명령:**

```sql
-- Check tablet size distribution (used to detect data skew)
SHOW TABLETS FROM your_table\G
-- Review the tablet count and size to decide whether to adjust the bucket count
```

버킷 수를 선택하는 방법은 [버킷팅](#bucketing)을 참조하세요.

### 인덱스 {#indexes}

- **정렬 키를 올바르게 설정하세요.** PostgreSQL 등의 시스템과 달리 Doris는 정렬 키의 처음 36바이트만 인덱싱하며, VARCHAR를 만나면 즉시 잘립니다. 접두사 범위를 벗어나는 컬럼은 정렬 키의 이점을 얻을 수 없으므로 [역색인](../table-design/index/inverted-index/overview)이 필요합니다. [정렬 키](#sort-key)를 참조하세요.

**정렬 키가 작동하는지 확인:**

```sql
EXPLAIN SELECT * FROM your_table WHERE filter_column = 'xxx';
-- Check whether the Sort Key index is used
```

### 진단 도구 {#diagnostic-tools}

느린 쿼리를 진단하려면 [Query Profile](../query-acceleration/query-profile)을 사용하세요.

**빠른 시작:**

```sql
-- 1. Run the query and obtain the query_id
SET enable_profile = true;
SELECT ...;

-- 2. View the Query Profile
SHOW PROFILELIST;
SHOW PROFILE WHERE query_id = 'xxx';
```

## 데이터 레이크 쿼리 {#data-lake-queries}

POC에서 Doris를 통해 Hive, Iceberg, Paimon 등의 데이터 레이크 데이터를 쿼리한다면(Lakehouse 시나리오), 다음 사항이 테스트 결과에 가장 큰 영향을 줍니다.

### 파티션 프루닝이 작동하는지 확인 {#make-sure-partition-pruning-works}

데이터 레이크 테이블에는 방대한 양의 데이터가 저장되는 경우가 많습니다. 따라서 Doris가 필요한 파티션만 스캔하도록 WHERE 절에 항상 파티션 컬럼을 포함하세요. `EXPLAIN <SQL>`을 실행하고 `partition` 필드를 확인하여 프루닝이 작동하는지 확인하세요:

```
0:VPAIMON_SCAN_NODE(88)
    partition=203/0          -- 203 partitions are pruned, 0 are actually scanned
```

파티션 수가 예상보다 훨씬 많다면 WHERE 절의 조건이 파티션 컬럼과 올바르게 일치하는지 확인하세요.

### Data Cache 활성화 {#enable-data-cache}

원격 스토리지(HDFS / 오브젝트 스토리지)의 IO 지연 시간은 로컬 디스크보다 몇 배 더 깁니다. Data Cache는 최근에 접근한 원격 데이터를 BE 로컬 디스크에 캐시하므로, **동일한 데이터를 반복해서 쿼리하면 내부 테이블에 가까운 성능을 얻을 수 있습니다**.

- 캐시는 기본적으로 비활성화되어 있습니다. 설정 방법은 [Data Cache](../lakehouse/data-cache) 문서를 참조하세요.
- 버전 4.0.2부터 **캐시 사전 적재(Cache prewarming)**를 지원하므로 POC 테스트 전에 자주 사용하는 데이터를 미리 적재할 수 있습니다.

:::tip
POC에서는 쿼리를 한 번 실행해 캐시에 데이터를 저장한 다음, 두 번째 쿼리의 지연 시간을 기준값으로 사용하세요. 이렇게 하면 운영 환경의 안정 상태 성능을 더 정확하게 반영할 수 있습니다.
:::

### 작은 파일 관리 {#manage-small-files}

데이터 레이크 데이터에는 작은 파일이 많이 포함되는 경우가 흔합니다. 작은 파일은 수많은 Split으로 나뉘어 FE 메모리 부담을 높이고 심하면 OOM을 일으키며, 쿼리 계획 수립 오버헤드도 증가시킵니다.

- **데이터 소스에서 관리(권장):** Hive/Spark 측에서 작은 파일을 주기적으로 병합하여 각 파일 크기를 128 MB보다 크게 유지하세요.
- **Doris 측 보완책:** `SET max_file_split_num = 50000;`(4.0.4부터 지원)을 사용해 스캔당 최대 Split 수를 제한하고 OOM을 방지하세요.

### Query Profile로 진단 {#use-query-profile-for-diagnosis}

데이터 레이크 쿼리의 병목은 대개 연산보다 IO에 있습니다. [Query Profile](../query-acceleration/query-profile)을 사용하면 느린 쿼리의 근본 원인을 찾을 수 있습니다. 다음 사항을 중점적으로 확인하세요:

- **Split 수와 데이터 양**: 지나치게 많은 데이터를 스캔하고 있는지 확인합니다.
- **MergeIO 지표**: `MergedBytes`가 `RequestBytes`보다 훨씬 크다면 읽기 증폭이 심한 상태입니다. `merge_io_read_slice_size_bytes`(기본값 8 MB)를 줄여 완화하세요.
- **캐시 적중률**: Data Cache가 효과적으로 작동하는지 확인합니다.

더 많은 최적화 기법은 [데이터 레이크 쿼리 튜닝](../lakehouse/best-practices/optimization)을 참조하세요.

## 자주 발생하는 오류와 해결 방법 {#common-errors-and-solutions}

### 테이블 생성 시 "Tablet count should be greater than 0" 오류 발생 {#table-creation-fails-with-tablet-count-should-be-greater-than-0}

**원인:** 버킷 수가 0으로 설정되어 있거나 버킷팅이 지정되지 않았습니다.

**해결 방법:** DDL에 `DISTRIBUTED BY HASH(xxx) BUCKETS n`이 포함되어 있는지 확인하고 BUCKETS 뒤에 양의 정수가 오는지 확인하세요.

```sql
-- Correct example
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 쿼리가 느리고 인덱스가 사용되지 않는 것으로 의심되는 경우 {#slow-query-suspected-the-index-is-not-used}

**진단 절차:**

1. `EXPLAIN SQL`을 실행해 쿼리 계획을 보고 Sort Key 인덱스가 사용되는지 확인하세요.
2. `SHOW TABLETS FROM table_name`을 실행해 태블릿 크기가 고른지 확인하세요.
3. Query Profile에서 병목을 찾으세요.

```sql
-- Check whether the index is used (look at output_id for Sort Key columns)
EXPLAIN SELECT * FROM table_name WHERE key_col = 'xxx';

-- Check tablet size (to detect data skew)
SHOW TABLETS FROM table_name;
```

### 데이터 레이크 쿼리에서 OOM 발생 {#oom-on-data-lake-queries}

**원인:** 작은 파일이 너무 많아 Split 수가 급증합니다.

**해결 방법:**

1. 데이터 소스 측에서 작은 파일을 병합하세요(각 파일 > 128 MB).
2. Doris 측에서 Split 수를 제한하세요:

```sql
SET max_file_split_num = 50000;
```

### 적재 버전 누적으로 인한 쿼리 지연 {#ingestion-version-pile-up-causes-slow-queries}

**원인:** 소규모 배치를 자주 적재하면 버전이 너무 많이 생성됩니다.

**해결 방법:**

1. 적재 배치를 묶고 적재 빈도를 줄이세요.
2. Group Commit을 활성화하세요:

```sql
SET group_commit_mode = 'async_mode';
```

## 자주 묻는 질문 {#faq}

### Q: POC에는 얼마나 걸리나요? {#q-how-long-does-a-poc-take}

기본 기능 검증(테이블 생성, 데이터 적재, 간단한 쿼리)에는 보통 1-2일이 걸립니다. 세부적인 성능 튜닝에는 3-5일이 걸립니다.

### Q: 테이블을 생성할 때 버킷 수는 어떻게 선택해야 하나요? {#q-how-should-i-choose-the-bucket-count-when-creating-a-table}

데이터가 고르게 분산되도록 먼저 BE 노드 수의 정수 배수로 설정하세요. 버킷당 압축 데이터는 <= 20 GB여야 합니다(Unique Key 테이블은 <= 10 GB).

### Q: 쿼리가 예상보다 느리면 어떻게 해야 하나요? {#q-what-should-i-do-if-queries-are-slower-than-expected}

1. `EXPLAIN`을 실행해 인덱스가 사용되는지 확인하세요.
2. `SHOW TABLETS`를 실행해 데이터 편중이 있는지 확인하세요.
3. Query Profile에서 병목을 찾으세요.

### Q: Data Cache를 활성화해야 하나요? {#q-should-i-enable-data-cache}

워크로드에 데이터 레이크 쿼리(Hive/Iceberg/Paimon)가 포함된다면 활성화하세요. 첫 쿼리에서 데이터를 자동으로 캐시하며, 반복 쿼리에서는 내부 테이블에 가까운 성능을 얻을 수 있습니다.
