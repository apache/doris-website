---
{
    "title": "Doris 통계 수집 및 관리: CBO 옵티마이저 설정 가이드",
    "language": "ko",
    "description": "Apache Doris에서 통계를 수집, 관리하고 조정하는 방법을 알아봅니다. 이 문서에서는 ANALYZE 명령, 자동 수집 메커니즘, 외부 테이블 통계, 설정 항목 및 일반적인 문제 해결 방법을 소개합니다.",
    "keywords": ["Doris 통계", "ANALYZE", "CBO", "자동 수집", "테이블 통계", "컬럼 통계", "자동 분석"],
    "sidebar_label": "통계"
}
---

# 통계 {#statistics}

<!-- Knowledge type: Concept + Operation guide -->
<!-- Applicable scenarios: CBO tuning, statistics collection and management, query performance troubleshooting -->

통계는 Doris CBO(Cost-Based Optimizer)의 비용 추정 기반이며, 통계의 정확도는 쿼리 실행 계획의 품질을 직접적으로 좌우합니다. 이 문서에서는 통계 수집 방법, 관리 명령, 관련 설정 및 일반적인 문제 해결 방법을 소개합니다.

**적용 버전**: Doris 2.0 이상.

## 읽기 전 확인 사항 {#pre-reading-checklist}

- [ ] 사용 중인 Doris 버전을 알고 있습니다(자동 수집 기능은 2.0.3 이상에서 지원됩니다).
- [ ] 대상 객체의 유형을 확인했습니다. 내부 테이블, Hive, Iceberg, Paimon, JDBC 등이 해당합니다.
- [ ] 대상 컬럼의 유형을 알고 있습니다(기본 유형만 수집을 지원합니다).
- [ ] 수집을 수동으로 실행해야 하는지, 자동 수집을 사용할지 알고 있습니다.

## 한눈에 보는 핵심 개념 {#core-concepts-at-a-glance}

<!-- Knowledge type: Concept -->
<!-- Applicable scenarios: Understanding the role and composition of statistics -->

**한 문장 정의**: 통계는 Doris가 테이블과 컬럼 수준에서 기록하는 데이터 분포 메타데이터로, 옵티마이저가 비용을 추정하고 최적의 계획을 선택하는 데 사용합니다.

Doris는 테이블 수준에서 컬럼별로 다음 지표를 포함한 통계를 수집합니다.

| 지표          | 설명                          |
| --------------- | ------------------------------------ |
| `row_count`     | 전체 행 수                 |
| `data_size`     | 컬럼의 전체 데이터 크기        |
| `avg_size_byte` | 컬럼의 행당 평균 데이터 크기 |
| `ndv`           | 고유 값 수(카디널리티) |
| `min`           | 최솟값                        |
| `max`           | 최댓값                        |
| `null_count`    | NULL 값의 수                |

**지원하는 컬럼 유형**: BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DATE, DATETIME, STRING, VARCHAR, TEXT.

**지원하지 않는 유형(자동으로 건너뜀)**: JSONB, VARIANT, MAP, STRUCT, ARRAY, HLL, BITMAP, TIME, TIMEV2, VARBINARY.

수집 결과는 `internal.__internal_schema.column_statistics` 테이블에 저장됩니다.

## 통계 수집 {#collecting-statistics}

<!-- Knowledge type: Operation guide -->
<!-- Applicable scenarios: Manually or automatically triggering statistics collection -->

Doris는 기본적으로 내부 테이블에 자동 샘플링을 사용하므로 대부분 수동으로 개입할 필요가 없습니다. 세밀하게 제어하려면 수동 수집을 사용합니다.

### 수집 방법 비교 {#comparison-of-collection-methods}

| 구분       | 수동 수집(ANALYZE)         | 자동 수집(기본 활성화)        |
| --------------- | ----------------------------------- | ------------------------------------------- |
| 실행 계기         | 사용자가 직접 실행            | 백그라운드 스레드가 주기적으로 스캔        |
| 사용 사례        | 긴급 업데이트, 최초 수집, 디버깅 | 일상적인 유지 관리, 장기적인 최신 상태 유지    |
| 최소 버전 | 2.0                                 | 2.0.3                                       |
| 샘플링 전략 | 행 수 또는 비율 지정        | 기본적으로 4194304개 행(2^22)을 샘플링         |
| 제어 단위 | 테이블 / 데이터베이스 / 컬럼       | 클러스터 수준 스위치 + 테이블 수준 정책   |

### 수동 수집 {#manual-collection}

**목적**: 테이블 또는 데이터베이스의 통계 수집 및 갱신을 즉시 실행합니다.

**명령**: `ANALYZE` 문으로 수집 작업을 수동 제출합니다. 자세한 내용은 SQL 매뉴얼의 [ANALYZE](../../sql-manual/sql-statements/statistics/ANALYZE)를 참조하세요.

**대표 예시**:

`lineitem` 테이블의 모든 컬럼에 대해 전체 수집을 수행합니다.

```sql
ANALYZE TABLE lineitem;
```

`tpch100` 데이터베이스에 있는 모든 테이블의 모든 컬럼에 대해 전체 수집을 수행합니다.

```sql
ANALYZE DATABASE tpch100;
```

`lineitem` 테이블에서 100000개 행을 샘플링하여 통계를 수집합니다.

```sql
ANALYZE TABLE lineitem WITH SAMPLE ROWS 100000;
```

`l_orderkey`와 `l_linenumber` 컬럼에 대해 `lineitem` 테이블에서 100000개 행을 샘플링하여 통계를 수집합니다.

```sql
ANALYZE TABLE lineitem (l_orderkey, l_linenumber) WITH SAMPLE ROWS 100000;
```

### 자동 수집 {#auto-collection}

**목적**: 백그라운드 스레드가 주기적으로 스캔하여 통계를 자동으로 최신 상태로 유지합니다.

**스위치**: `ENABLE_AUTO_ANALYZE` 변수로 제어합니다.

```sql
SET GLOBAL ENABLE_AUTO_ANALYZE = TRUE;  -- Enable auto collection
SET GLOBAL ENABLE_AUTO_ANALYZE = FALSE; -- Disable auto collection
```

#### 동작 방식 {#working-mechanism}

활성화하면 백그라운드 스레드가 `InternalCatalog`에 속한 모든 데이터베이스와 테이블을 주기적으로 스캔합니다. 각 폴링 주기에서 다음 규칙에 따라 재수집 여부를 결정합니다.

1. 테이블에 통계가 없는 컬럼이 있습니다.
2. 테이블의 통계 상태 점수가 임계값보다 낮습니다(기본값은 90이며, `table_stats_health_threshold`로 제어). 상태 점수가 100에 가까울수록 데이터 변경량이 적으며, 90 미만이면 통계가 실제 데이터와 크게 달라 재수집이 필요하다는 뜻입니다.
3. 내부 테이블의 경우 데이터가 변경되었지만 최근 24시간 동안 통계가 수집되지 않았습니다.

**폴링 간격**: 기본값은 5분입니다(`auto_check_statistics_in_minutes`를 `fe.conf`에서 설정). 첫 번째 폴링은 클러스터 시작 후 5분이 지나면 시작되며, 각 폴링이 완료된 후 스레드는 5분 동안 대기한 다음 다음 폴링을 시작합니다.

:::caution 참고
한 차례 폴링에 걸리는 시간은 테이블 수와 데이터 양에 따라 달라집니다. 특정 테이블의 통계가 5분 이내에 수집된다는 보장은 없습니다.
:::

#### 주요 매개변수 {#key-parameters}

| 매개변수                            | 용도                                       | 기본값      |
| ------------------------------------ | --------------------------------------------- | ------------ |
| `auto_analyze_table_width_threshold` | 자동 수집을 허용하는 최대 컬럼 수 | 300          |
| `huge_table_default_sample_rows`     | 자동 수집 시 샘플링하는 행 수    | 4194304 (2^22) |
| `auto_analyze_start_time`            | 자동 수집 시작 시간                | 0:00:00      |
| `auto_analyze_end_time`              | 자동 수집 종료 시간                  | 23:59:59     |

**컬럼이 많은 테이블의 제한 조정**(컬럼이 많은 테이블의 과도한 리소스 소비 방지):

```sql
SET GLOBAL auto_analyze_table_width_threshold = 350;
```

**사용량이 적은 시간대에 실행**(서비스에 미치는 영향 방지):

```sql
SET GLOBAL auto_analyze_start_time = "03:00:00"; -- Start time: 3:00 AM
SET GLOBAL auto_analyze_end_time   = "14:00:00"; -- End time: 2:00 PM
```

더 정확한 데이터 분포 정보를 얻으려면 `huge_table_default_sample_rows`를 높여 샘플링하는 행 수를 늘릴 수 있습니다.

### 외부 테이블 수집 {#external-table-collection}

<!-- Knowledge type: Operation guide -->
<!-- Applicable scenarios: Statistics for external tables such as Hive / Iceberg / JDBC / Paimon -->

**외부 테이블 유형**: 대표적으로 Hive, Iceberg, JDBC, Paimon 등이 있습니다.

#### 기능 지원 현황 {#capability-matrix}

| 외부 테이블 유형 | 수동 전체 수집 | 수동 샘플링 | 자동 수집 |
| ------------------- | ----------- | --------------- | --------------- |
| Hive                | 지원   | 지원       | 지원       |
| Iceberg             | 지원   | 미지원   | 미지원   |
| JDBC                | 지원   | 미지원   | 미지원   |
| 기타              | 미지원 | 미지원 | 미지원   |

#### 기본 동작 {#default-behavior}

외부 Catalog는 과거 데이터에 대한 과도한 스캔을 방지하기 위해 기본적으로 자동 컬럼 통계 수집에 참여하지 않으며, 테이블의 행 수만 수집합니다. 컬럼 통계의 자동 수집을 활성화하려면 다음을 실행합니다.

```sql
ALTER CATALOG <catalog_name> SET PROPERTIES ('enable.auto.analyze'='true');  -- Enable
ALTER CATALOG <catalog_name> SET PROPERTIES ('enable.auto.analyze'='false'); -- Disable
```

**테이블 수준 제어**(Catalog 속성보다 우선 적용):

```sql
ALTER TABLE <table_name> SET ("auto_analyze_policy" = "enable");          -- Enable
ALTER TABLE <table_name> SET ("auto_analyze_policy" = "disable");         -- Disable
ALTER TABLE <table_name> SET ("auto_analyze_policy" = "base_on_catalog"); -- Follow the catalog
```

외부 테이블에는 통계 상태 점수 개념이 없습니다. 자동 수집을 활성화하면 기본적으로 외부 테이블의 통계는 24시간 동안 한 번만 자동 수집됩니다. 최소 간격은 `external_table_auto_analyze_interval_in_millis`로 조정할 수 있습니다.

#### 행 수 추정 전략 {#row-count-estimation-strategy}

| 외부 테이블 유형 | 추정 방법                                                       |
| ------------------- | ----------------------------------------------------------------------- |
| Hive                | 먼저 Parameters에서 `numRows`를 가져옵니다. 없으면 `totalSize`와 스키마를 함께 사용하여 추정하고, 이 값도 없으면 파일 크기를 기준으로 추정합니다. |
| Iceberg             | 스냅샷 API를 호출하여 `total-records`와 `total-position-deletes`를 가져와 계산합니다. |
| Paimon              | 스캔 API를 호출하여 각 split의 행 수를 합산합니다.        |
| JDBC                | 백엔드 데이터베이스의 행 수 조회문으로 가져옵니다(MySQL, Oracle, PostgreSQL, SQLServer 지원). |
| 기타              | 자동 조회 및 추정은 아직 지원하지 않습니다.     |

파일 크기를 스캔할 때 리소스가 소모되는 것이 우려된다면 Hive의 파일 크기 기반 추정을 비활성화할 수 있습니다.

```sql
SET GLOBAL enable_get_row_count_from_file_list = FALSE;
```

외부 테이블의 추정 행 수를 조회합니다.

```sql
SHOW TABLE STATS table_name;
```

:::tip 팁
`row_count`가 `-1`로 표시되면 행 수를 가져올 수 없거나 테이블이 비어 있다는 뜻입니다.
:::

## 통계 작업 관리 {#statistics-job-management}

<!-- Knowledge type: Operation guide -->
<!-- Applicable scenarios: View, terminate, and delete statistics jobs and statistics results -->

### 통계 작업 조회 {#viewing-statistics-jobs}

**목적**: 제출된 비동기 통계 수집 작업을 조회합니다(동기 작업은 이력을 남기지 않습니다).

**명령**:

```sql
SHOW ANALYZE [job_id];
```

자세한 내용은 [SHOW ANALYZE](../../sql-manual/sql-statements/statistics/SHOW-ANALYZE)를 참조하세요.

**참고**: 시스템은 과거 작업을 20000개까지만 보관합니다. 출력 컬럼의 의미는 다음과 같습니다.

| 컬럼          | 설명                                |
| --------------- | ------------------------------------------ |
| `job_id`        | 통계 작업 ID                          |
| `catalog_name`  | Catalog 이름                               |
| `db_name`       | 데이터베이스 이름                              |
| `tbl_name`      | 테이블 이름                                 |
| `col_name`      | 컬럼 이름 목록(`index_name:column_name`) |
| `job_type`      | 작업 유형                                   |
| `analysis_type` | 통계 유형                            |
| `message`       | 작업 메시지                                |
| `state`         | 작업 상태                                  |
| `progress`      | 작업 진행률                               |
| `schedule_type` | 스케줄링 유형                            |
| `start_time`    | 작업 시작 시간                             |
| `end_time`      | 작업 종료 시간                               |

**예시**:

```sql
mysql> SHOW ANALYZE 245073\G
*************************** 1. row ***************************
              job_id: 93021
        catalog_name: internal
             db_name: tpch
            tbl_name: region
            col_name: [region:r_regionkey,region:r_comment,region:r_name]
            job_type: MANUAL
       analysis_type: FUNDAMENTALS
             message:
               state: FINISHED
            progress: 3 Finished  |  0 Failed  |  0 In Progress  |  3 Total
       schedule_type: ONCE
          start_time: 2024-07-11 15:15:00
            end_time: 2024-07-11 15:15:33
```

### 통계 태스크 조회 {#viewing-statistics-tasks}

**목적**: 하나의 작업에는 여러 태스크가 포함될 수 있으며, 각 태스크는 하나의 컬럼에 해당합니다. 태스크 수준의 진행 상황을 조회할 수 있습니다.

**명령**:

```sql
SHOW ANALYZE TASK STATUS [job_id];
```

**예시**:

```sql
mysql> SHOW ANALYZE TASK STATUS 93021;
+---------+-------------+------------+---------+------------------------+-----------------+----------+
| task_id | col_name    | index_name | message | last_state_change_time | time_cost_in_ms | state    |
+---------+-------------+------------+---------+------------------------+-----------------+----------+
| 93022   | r_regionkey | region     |         | 2024-07-11 15:15:33    | 32883           | FINISHED |
| 93023   | r_comment   | region     |         | 2024-07-11 15:15:33    | 32883           | FINISHED |
| 93024   | r_name      | region     |         | 2024-07-11 15:15:33    | 32883           | FINISHED |
+---------+-------------+------------+---------+------------------------+-----------------+----------+
```

### 컬럼 통계 조회 {#viewing-column-statistics}

**목적**: 수집된 컬럼 수준 통계를 조회합니다.

**명령**:

```sql
SHOW COLUMN [cached] STATS table_name [ (column_name [, ...]) ];
```

**매개변수**:

| 매개변수     | 설명                                                          |
| ------------- | -------------------------------------------------------------------- |
| `cached`      | FE 메모리 캐시에 있는 통계만 표시                      |
| `table_name`  | 대상 테이블. `db_name.table_name` 형식 사용 가능                |
| `column_name` | 대상 컬럼(쉼표로 구분하여 여러 컬럼 지정 가능). 지정하지 않으면 모든 컬럼 표시 |

**예시**:

```sql
mysql> SHOW COLUMN STATS region (r_regionkey)\G
*************************** 1. row ***************************
  column_name: r_regionkey
   index_name: region
        count: 5.0
          ndv: 5.0
     num_null: 0.0
    data_size: 20.0
avg_size_byte: 4.0
          min: 0
          max: 4
       method: FULL
         type: FUNDAMENTALS
      trigger: MANUAL
  query_times: 0
 updated_time: 2024-07-11 15:15:33
1 row in set (0.36 sec)
```

### 테이블 통계 개요 조회 {#viewing-table-statistics-overview}

**목적**: 테이블 수준의 통계 수집 개요를 조회합니다.

**명령**:

```sql
SHOW TABLE STATS table_name;
```

`table_name`에는 `db_name.table_name` 형식을 사용할 수 있습니다.

**출력 컬럼**:

| 컬럼          | 설명                                                |
| --------------- | ---------------------------------------------------------- |
| `updated_rows`  | 마지막 ANALYZE 이후 이 테이블에서 갱신된 행 수 |
| `query_times`   | 향후 버전에서 쿼리 횟수를 기록하기 위해 예약된 컬럼 |
| `row_count`     | 테이블의 행 수(명령 실행 시점의 정확한 행 수와 다를 수 있음) |
| `updated_time`  | 통계가 마지막으로 갱신된 시간                      |
| `columns`       | 통계가 수집된 컬럼               |
| `trigger`       | 통계 수집이 실행된 방식                          |
| `new_partition` | 새 파티션에 최초로 데이터가 적재되었는지 여부 |
| `user_inject`   | 사용자가 통계를 수동으로 주입했는지 여부          |

### 통계 작업 종료 {#terminating-statistics-jobs}

**목적**: 현재 실행 중인 비동기 통계 작업을 종료합니다.

**명령**:

```sql
KILL ANALYZE job_id;
```

`job_id`는 비동기 `ANALYZE` 실행 시 반환되는 값이며, `SHOW ANALYZE`로도 확인할 수 있습니다.

**예시**: ID가 52357인 통계 작업을 종료합니다.

```sql
mysql> KILL ANALYZE 52357;
```

### 통계 삭제 {#deleting-statistics}

**목적**: 현재 존재하는 테이블의 통계를 수동으로 정리합니다. 삭제된 객체의 통계는 백그라운드에서 주기적으로 정리되므로 수동 작업이 필요하지 않습니다.

**명령**:

```sql
DROP STATS table_name;
```

## 세션 변수 및 설정 항목 {#session-variables-and-configuration-items}

<!-- Knowledge type: Reference -->
<!-- Applicable scenarios: Tuning auto collection and statistics storage -->

### 세션 변수 {#session-variables}

| 세션 변수                      | 설명                                                                                | 기본값                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------- |
| `auto_analyze_start_time`             | 자동 수집 시작 시간                                                             | `0:00:00`                        |
| `auto_analyze_end_time`               | 자동 수집 종료 시간                                                               | `23:59:59`                       |
| `enable_auto_analyze`                 | 자동 수집 활성화 여부                                                         | `TRUE`                           |
| `huge_table_default_sample_rows`      | 대형 테이블에서 샘플링하는 행 수                                                    | `4194304`                        |
| `table_stats_health_threshold`        | 범위는 0-100. 데이터의 (100 - 임계값)%가 변경되면 통계가 오래된 것으로 간주   | `90`                             |
| `auto_analyze_table_width_threshold`  | 자동 수집을 허용하는 최대 컬럼 수. 이를 초과하는 테이블은 제외       | `300`                            |
| `enable_get_row_count_from_file_list` | 파일 크기로 Hive 테이블의 행 수를 추정할지 여부                                   | `TRUE` (2.1.5 이전 기본값은 `FALSE`) |

### FE 설정 항목 {#fe-configuration-items}

:::info 참고
다음 FE 설정 항목은 일반적으로 별도로 신경 쓸 필요가 없습니다.
:::

| FE 설정 항목                        | 설명                                       | 기본값                  |
| -------------------------------------------- | ------------------------------------------------- | ------------------------ |
| `analyze_record_limit`                       | 영구 저장하는 통계 작업 실행 기록 수 제어 | `20000`                  |
| `stats_cache_size`                           | FE 측 통계 캐시의 항목 수 | `500000`                 |
| `statistics_simultaneously_running_task_num` | 동시에 실행할 수 있는 비동기 통계 작업 수 | `3`                      |
| `statistics_sql_mem_limit_in_bytes`          | 각 통계 SQL이 사용할 수 있는 BE 메모리          | `2L * 1024 * 1024` (2 GiB) |

## 자주 묻는 질문(FAQ) {#frequently-asked-questions-faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Common troubleshooting for statistics-related issues -->

### Q1: 테이블의 통계가 수집되었는지 어떻게 확인하나요? {#q1-how-do-i-confirm-whether-statistics-have-been-collected-for-a-table}

**1단계**: 수집 결과가 있는지 확인합니다.

```sql
SHOW COLUMN STATS table_name;
```

**2단계**: FE 캐시에 통계가 로드되어 있는지 확인합니다.

```sql
SHOW COLUMN CACHED STATS table_name;
```

둘 다 비어 있으면 현재 테이블에 통계가 없는 것입니다. 통계가 수집된 경우의 출력 예시는 다음과 같습니다.

```sql
mysql> SHOW COLUMN CACHED STATS mvTestDup;
+-------------+------------+-------+------+----------+-----------+---------------+------+------+--------+--------------+---------+-------------+---------------------+
| column_name | index_name | count | ndv  | num_null | data_size | avg_size_byte | min  | max  | method | type         | trigger | query_times | updated_time        |
+-------------+------------+-------+------+----------+-----------+---------------+------+------+--------+--------------+---------+-------------+---------------------+
| key1        | mvTestDup  | 6.0   | 4.0  | 0.0      | 48.0      | 8.0           | 1    | 1001 | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2024-07-22 10:53:25 |
| key2        | mvTestDup  | 6.0   | 4.0  | 0.0      | 48.0      | 8.0           | 2    | 2001 | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2024-07-22 10:53:25 |
| value2      | mvTestDup  | 6.0   | 4.0  | 0.0      | 24.0      | 4.0           | 4    | 4001 | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2024-07-22 10:53:25 |
| value1      | mvTestDup  | 6.0   | 4.0  | 0.0      | 24.0      | 4.0           | 3    | 3001 | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2024-07-22 10:53:25 |
| mv_key1     | mv1        | 6.0   | 4.0  | 0.0      | 48.0      | 8.0           | 1    | 1001 | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2024-07-22 10:53:25 |
| value3      | mvTestDup  | 6.0   | 4.0  | 0.0      | 24.0      | 4.0           | 5    | 5001 | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2024-07-22 10:53:25 |
+-------------+------------+-------+------+----------+-----------+---------------+------+------+--------+--------------+---------+-------------+---------------------+
6 rows in set (0.00 sec)
```

**3단계**: SQL을 수동으로 실행하여 정확도를 검증합니다.

```sql
SELECT count(1), ndv(col1), min(col1), max(col1) FROM table;
```

`count`와 `ndv`의 자릿수 차이가 한 자리 이내라면 정확도가 허용 가능한 수준입니다.

### Q2: 테이블의 통계가 자동으로 수집되지 않는 이유는 무엇인가요? {#q2-why-does-a-table-never-get-statistics-collected-automatically}

**확인 1**: 자동 수집 스위치가 켜져 있는지 확인합니다.

```sql
SHOW VARIABLES LIKE "enable_auto_analyze";
-- If false, enable it:
SET GLOBAL enable_auto_analyze = TRUE;
```

**확인 2**: 테이블의 컬럼 수가 `auto_analyze_table_width_threshold`(기본값 300)를 초과하는지 확인합니다. 이를 초과하는 테이블은 자동 수집에서 제외됩니다.

```sql
SHOW VARIABLES LIKE "auto_analyze_table_width_threshold";
-- If smaller than the table width, adjust:
SET GLOBAL auto_analyze_table_width_threshold = 350;
```

**확인 3**: 다른 작업이 실행 중인지 확인합니다.

```sql
SHOW AUTO ANALYZE;
```

자동 수집은 단일 스레드에서 순차적으로 실행되며 모든 데이터베이스와 테이블을 폴링하므로, 전체 순회 주기가 길어질 수 있습니다.

### Q3: 일부 컬럼에 통계가 없는 이유는 무엇인가요? {#q3-why-do-some-columns-have-no-statistics}

기본 유형의 컬럼만 통계 수집을 지원합니다. 복합 유형(예: JSONB, VARIANT, MAP, STRUCT, ARRAY, HLL, BITMAP, TIME, TIMEV2, VARBINARY)은 자동으로 건너뜁니다.

### Q4: 오류 `Stats table not available, please make sure your cluster status is normal` {#q4-error-stats-table-not-available-please-make-sure-your-cluster-status-is-normal}

일반적으로 내부 통계 테이블의 상태가 비정상임을 의미합니다. 문제 해결 단계는 다음과 같습니다.

**1단계**: 모든 BE가 정상 상태인지 확인합니다.

**2단계**: 통계 테이블의 모든 `tabletId`를 조회합니다.

```sql
SHOW TABLETS FROM internal.__internal_schema.column_statistics;
```

**3단계**: 태블릿을 하나씩 진단합니다.

```sql
ADMIN DIAGNOSE TABLET tablet_id;
```

**4단계**: 비정상 태블릿을 복구한 후 통계를 다시 수집합니다.

### Q5: 통계 수집이 제때 이루어지지 않으면 어떻게 하나요? {#q5-how-do-i-deal-with-statistics-collection-that-is-not-timely-enough}

- **긴급한 경우**: 대상 테이블에서 `ANALYZE`를 수동 실행합니다.
- **통계 상태 점수 임계값 조정**: 기본값인 `table_stats_health_threshold = 90`은 데이터가 10% 넘게 변경되어야 수집이 실행됨을 의미합니다. 이 값을 95로 높일 수 있습니다(변경량이 5%를 초과하면 수집 실행).

```sql
SET GLOBAL table_stats_health_threshold = 95;
```

### Q6: 자동 수집이 리소스를 너무 많이 사용하면 어떻게 하나요? {#q6-what-if-auto-collection-consumes-too-many-resources}

자동 수집은 샘플링을 사용하고 단일 스레드에서 순차적으로 실행되므로 일반적으로 리소스 사용량을 제어할 수 있습니다. 다만 다음과 같은 경우에는 메모리 사용량이 많을 수 있습니다.

- 파티션이 많은 테이블.
- 개별 태블릿의 크기가 매우 큰 테이블.

**최적화 권장 사항**:

1. 테이블을 생성할 때 태블릿 수를 적절히 계획하고, 태블릿이 지나치게 커지지 않도록 합니다.
2. 시스템 사용량이 적은 시간대에 자동 수집을 활성화합니다(`auto_analyze_start_time` / `auto_analyze_end_time` 참조).
3. 대형 테이블은 사용량이 적은 시간대에 수동으로 통계를 수집합니다.
4. Doris 3.x 계열에서는 이러한 상황에 대한 최적화가 추가로 이루어질 예정입니다.
