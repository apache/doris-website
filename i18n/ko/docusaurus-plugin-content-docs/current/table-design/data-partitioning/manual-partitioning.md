---
{
    "title": "수동 파티셔닝",
    "language": "ko",
    "description": "Doris의 수동 파티셔닝 가이드: Range 파티셔닝, List 파티셔닝, NULL 파티셔닝의 상세 구문과 사용 사례를 설명하고, 네 가지 Range 파티션 형식(FIXED RANGE, LESS THAN, BATCH RANGE, MULTI RANGE)의 예제를 제공합니다."
}
---

<!-- Knowledge type: Operational steps / Configuration parameters -->
<!-- Applicable scenario: Table design / Data partitioning planning -->

수동 파티셔닝은 사용자가 테이블을 생성할 때 파티션 규칙을 명시적으로 지정하는 파티셔닝 방식입니다. 이 문서에서는 Doris에서 수동 파티셔닝을 사용하는 방법과 함께 Range 파티셔닝, List 파티셔닝, NULL 파티셔닝의 구문, 사용 사례, 모범 사례를 설명합니다.

## 파티션 컬럼 규칙 {#partition-column-rules}

수동 파티셔닝을 사용하기 전에 파티션 컬럼에 적용되는 일반 규칙을 알아두어야 합니다.

-   파티션 컬럼은 하나 이상의 컬럼으로 구성할 수 있으며, 반드시 KEY 컬럼이어야 합니다.
-   파티션 컬럼의 타입에 관계없이 파티션 값을 작성할 때는 큰따옴표로 묶어야 합니다.
-   파티션 수에는 이론적인 상한이 없습니다. 다만 기본적으로 테이블당 파티션 수는 4096개로 제한됩니다. 이 제한을 초과하려면 FE 설정 `max_multi_partition_num`과 `max_dynamic_partition_num`을 수정하세요.
-   파티셔닝을 지정하지 않고 테이블을 생성하면 시스템이 테이블과 이름이 같고 전체 값 범위를 포함하는 단일 파티션을 자동으로 생성합니다. 이 파티션은 사용자에게 표시되지 않으며 수정하거나 삭제할 수 없습니다.
-   범위가 겹치는 파티션은 생성할 수 없습니다.

## Range 파티셔닝 {#range-partitioning}

Range 파티셔닝은 파티션 컬럼의 값 범위에 따라 데이터를 서로 다른 파티션으로 나눕니다. 파티션 컬럼으로는 일반적으로 시간 컬럼을 사용하므로 이전 데이터와 새 데이터를 쉽게 관리할 수 있습니다.

**지원되는 컬럼 타입:** `DATE`, `DATETIME`, `TIMESTAMP_NS`, `TIMESTAMPTZ`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`.

Range 파티셔닝은 다양한 상황에 맞게 다음 네 가지 형식을 지원합니다.

| 형식 | 사용 사례 |
|------|----------|
| FIXED RANGE | 각 파티션의 상한과 하한을 정밀하게 제어해야 할 때 |
| LESS THAN | 파티션의 상한만 지정하고 시간순으로 파티션을 추가할 때 |
| BATCH RANGE | 동일한 간격으로 숫자 또는 시간 파티션을 일괄 생성할 때 |
| MULTI RANGE | 시간 범위마다 서로 다른 간격을 적용하여 일괄 생성할 때 |

### 1. FIXED RANGE {#1-fixed-range}

파티션에 대해 왼쪽 끝은 포함하고 오른쪽 끝은 제외하는 구간을 정의합니다.

**구문:**

```sql
PARTITION BY RANGE(col1[, col2, ...])
(
    PARTITION partition_name1 VALUES [("k1-lower1", "k2-lower1", "k3-lower1",...), ("k1-upper1", "k2-upper1", "k3-upper1", ...)),
    PARTITION partition_name2 VALUES [("k1-lower1-2", "k2-lower1-2", ...), ("k1-upper1-2", MAXVALUE, ))
)
```

**예제:**

```sql
PARTITION BY RANGE(`date`)
(
    PARTITION `p201701` VALUES [("2017-01-01"), ("2017-02-01")),
    PARTITION `p201702` VALUES [("2017-02-01"), ("2017-03-01")),
    PARTITION `p201703` VALUES [("2017-03-01"), ("2017-04-01"))
)
```

### 2. LESS THAN {#2-less-than}

파티션의 상한만 정의합니다. 하한은 이전 파티션의 상한에 따라 결정됩니다.

**구문:**

```sql
PARTITION BY RANGE(col1[, col2, ...])
(
    PARTITION partition_name1 VALUES LESS THAN MAXVALUE | ("value1", "value2", ...),
    PARTITION partition_name2 VALUES LESS THAN MAXVALUE | ("value1", "value2", ...)
)
```

**예제:**

```sql
PARTITION BY RANGE(`date`)
(
    PARTITION `p201701` VALUES LESS THAN ("2017-02-01"),
    PARTITION `p201702` VALUES LESS THAN ("2017-03-01"),
    PARTITION `p201703` VALUES LESS THAN ("2017-04-01"),
    PARTITION `p2018` VALUES [("2018-01-01"), ("2019-01-01")),
    PARTITION `other` VALUES LESS THAN (MAXVALUE)
)
```

### 3. BATCH RANGE {#3-batch-range}

숫자 및 시간 타입의 RANGE 파티션을 일괄 생성합니다. 지정된 간격에 따라 각 파티션에 대해 왼쪽 끝은 포함하고 오른쪽 끝은 제외하는 구간을 정의합니다.

**구문:**

```sql
PARTITION BY RANGE(int_col)
(
    FROM (start_num) TO (end_num) INTERVAL interval_value
)

PARTITION BY RANGE(date_col)
(
    FROM ("start_date") TO ("end_date") INTERVAL num YEAR | num MONTH | num WEEK | num DAY | 1 HOUR
)
```

**예제:**

```sql
PARTITION BY RANGE(age)
(
    FROM (1) TO (100) INTERVAL 10
)

PARTITION BY RANGE(`date`)
(
    FROM ("2000-11-14") TO ("2021-11-14") INTERVAL 2 YEAR
)
```

### 4. MULTI RANGE {#4-multi-range}

왼쪽 끝은 포함하고 오른쪽 끝은 제외하는 구간으로 RANGE 파티션을 일괄 생성하며, 동일한 문 안에서 서로 다른 간격을 지정할 수 있습니다.

**예제:**

```sql
PARTITION BY RANGE(col)
(
    FROM ("2000-11-14") TO ("2021-11-14") INTERVAL 1 YEAR,
    FROM ("2021-11-14") TO ("2022-11-14") INTERVAL 1 MONTH,
    FROM ("2022-11-14") TO ("2023-01-03") INTERVAL 1 WEEK,
    FROM ("2023-01-03") TO ("2023-01-14") INTERVAL 1 DAY,
    PARTITION p_20230114 VALUES [('2023-01-14'), ('2023-01-15'))
)
```

## List 파티셔닝 {#list-partitioning}

List 파티셔닝은 파티션 컬럼에 대해 열거한 값에 따라 데이터를 서로 다른 파티션으로 나눕니다. 행의 값이 해당 파티션에 정의된 열거 값 중 하나와 일치하는 경우에만 그 파티션으로 라우팅됩니다.

**지원되는 컬럼 타입:** `BOOLEAN`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `DATE`, `DATETIME`, `TIMESTAMP_NS`, `TIMESTAMPTZ`, `CHAR`, `VARCHAR`.

**구문 키워드:** `VALUES IN (...)`을 사용하여 각 파티션에 포함되는 열거 값을 지정합니다.

### 단일 컬럼 List 파티셔닝 {#single-column-list-partitioning}

```sql
PARTITION BY LIST(city)
(
    PARTITION `p_cn` VALUES IN ("Beijing", "Shanghai", "Hong Kong"),
    PARTITION `p_usa` VALUES IN ("New York", "San Francisco"),
    PARTITION `p_jp` VALUES IN ("Tokyo")
)
```

### 다중 컬럼 List 파티셔닝 {#multi-column-list-partitioning}

```sql
PARTITION BY LIST(id, city)
(
    PARTITION p1_city VALUES IN (("1", "Beijing"), ("1", "Shanghai")),
    PARTITION p2_city VALUES IN (("2", "Beijing"), ("2", "Shanghai")),
    PARTITION p3_city VALUES IN (("3", "Beijing"), ("3", "Shanghai"))
)
```

## NULL 파티셔닝 {#null-partitioning}

기본적으로 파티션 컬럼은 NOT NULL이어야 합니다. NULL을 허용하는 컬럼을 파티션 컬럼으로 사용하려면 다음 세션 변수를 설정하세요.

```sql
SET allow_partition_column_nullable = true;
```

파티션 타입별 NULL 값 처리 방식은 다음과 같습니다.

| 파티션 타입 | NULL 값 처리 방식 |
|----------|-------------|
| LIST 파티션 | 실제 NULL 파티션 지원 |
| RANGE 파티션(LESS THAN 사용) | NULL 값은 가장 작은 LESS THAN 파티션에 저장됨 |
| RANGE 파티션(LESS THAN 미사용) | NULL 값을 삽입할 수 없음 |

### 시나리오 1: LIST 파티션의 NULL 지원 {#scenario-1-list-partition-supports-null}

```sql
mysql> create table null_list(
    -> k0 varchar null
    -> )
    -> partition by list (k0)
    -> (
    -> PARTITION pX values in ((NULL))
    -> )
    -> DISTRIBUTED BY HASH(`k0`) BUCKETS 1
    -> properties("replication_num" = "1");
Query OK, 0 rows affected (0.11 sec)

mysql> insert into null_list values (null);
Query OK, 1 row affected (0.19 sec)

mysql> select * from null_list;
+------+
| k0   |
+------+
| NULL |
+------+
1 row in set (0.18 sec)
```

### 시나리오 2: RANGE 파티션에서 NULL을 가장 작은 LESS THAN 파티션으로 라우팅 {#scenario-2-range-partition-routes-null-to-the-smallest-less-than-partition}

```sql
mysql> create table null_range(
    -> k0 int null
    -> )
    -> partition by range (k0)
    -> (
    -> PARTITION p10 values less than (10),
    -> PARTITION p100 values less than (100),
    -> PARTITION pMAX values less than (maxvalue)
    -> )
    -> DISTRIBUTED BY HASH(`k0`) BUCKETS 1
    -> properties("replication_num" = "1");
Query OK, 0 rows affected (0.12 sec)

mysql> insert into null_range values (null);
Query OK, 1 row affected (0.19 sec)

mysql> select * from null_range partition(p10);
+------+
| k0   |
+------+
| NULL |
+------+
1 row in set (0.18 sec)
```

### 시나리오 3: LESS THAN을 사용하지 않는 RANGE 파티션에는 NULL을 삽입할 수 없음 {#scenario-3-range-partition-without-less-than-cannot-accept-null}

```sql
mysql> create table null_range2(
    -> k0 int null
    -> )
    -> partition by range (k0)
    -> (
    -> PARTITION p200 values [("100"), ("200"))
    -> )
    -> DISTRIBUTED BY HASH(`k0`) BUCKETS 1
    -> properties("replication_num" = "1");
Query OK, 0 rows affected (0.13 sec)

mysql> insert into null_range2 values (null);
ERROR 5025 (HY000): Insert has filtered data in strict mode, tracking_url=......
```
