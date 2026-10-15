---
{
    "title": "手動パーティショニング",
    "language": "ja",
    "description": "Doris の手動パーティショニングに関するガイドです。Range、List、NULL パーティショニングの構文と用途を説明し、Range パーティションの四つの形式（FIXED RANGE、LESS THAN、BATCH RANGE、MULTI RANGE）の例を示します。"
}
---

<!-- Knowledge type: Operational steps / Configuration parameters -->
<!-- Applicable scenario: Table design / Data partitioning planning -->

手動パーティショニングでは、テーブルの作成時にユーザーがパーティションのルールを明示的に指定します。この記事では、Doris での手動パーティショニングの使い方として、Range、List、NULL パーティショニングの構文、用途、ベストプラクティスを説明します。

## パーティション列のルール

手動パーティショニングを使用する前に、パーティション列に関する次の一般的なルールを確認してください。

-   パーティション列には一つ以上の列を指定できます。いずれも KEY 列である必要があります。
-   パーティション列の型にかかわらず、パーティション値を記述する際は二重引用符で囲む必要があります。
-   パーティション数に理論上の上限はありません。ただし、デフォルトではテーブルごとに 4096 パーティションまでに制限されています。この制限を超えるには、FE の設定項目 `max_multi_partition_num` と `max_dynamic_partition_num` を変更します。
-   パーティションを指定せずにテーブルを作成すると、システムは全値域を対象とする、テーブルと同じ名前の単一のパーティションを自動生成します。このパーティションはユーザーには表示されず、変更も削除もできません。
-   範囲が重複するパーティションは作成できません。

## Range パーティショニング

Range パーティショニングは、パーティション列の値の範囲に基づいてデータを分割します。通常は時刻を表す列をパーティション列に使用し、新旧データの管理を容易にします。

**サポートされる列の型:** `DATE`、`DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ`、`TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT`。

Range パーティショニングには、用途に応じて次の四つの形式があります。

| 形式 | 用途 |
|------|----------|
| FIXED RANGE | 各パーティションの上限と下限を正確に指定する場合 |
| LESS THAN | パーティションの上限のみを指定し、時系列順にパーティションを追加する場合 |
| BATCH RANGE | 数値または時刻のパーティションを一定の間隔で一括作成する場合 |
| MULTI RANGE | 時間範囲ごとに異なる間隔を指定して一括作成する場合 |

### 1. FIXED RANGE

パーティションの範囲を、下限を含み上限を含まない区間として定義します。

**構文:**

```sql
PARTITION BY RANGE(col1[, col2, ...])
(
    PARTITION partition_name1 VALUES [("k1-lower1", "k2-lower1", "k3-lower1",...), ("k1-upper1", "k2-upper1", "k3-upper1", ...)),
    PARTITION partition_name2 VALUES [("k1-lower1-2", "k2-lower1-2", ...), ("k1-upper1-2", MAXVALUE, ))
)
```

**例:**

```sql
PARTITION BY RANGE(`date`)
(
    PARTITION `p201701` VALUES [("2017-01-01"), ("2017-02-01")),
    PARTITION `p201702` VALUES [("2017-02-01"), ("2017-03-01")),
    PARTITION `p201703` VALUES [("2017-03-01"), ("2017-04-01"))
)
```

### 2. LESS THAN

パーティションの上限のみを定義します。下限は前のパーティションの上限で決まります。

**構文:**

```sql
PARTITION BY RANGE(col1[, col2, ...])
(
    PARTITION partition_name1 VALUES LESS THAN MAXVALUE | ("value1", "value2", ...),
    PARTITION partition_name2 VALUES LESS THAN MAXVALUE | ("value1", "value2", ...)
)
```

**例:**

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

### 3. BATCH RANGE

数値型と時刻型の RANGE パーティションを一括作成します。各パーティションの範囲は、指定した間隔ごとに、下限を含み上限を含まない区間として定義されます。

**構文:**

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

**例:**

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

### 4. MULTI RANGE

下限を含み上限を含まない区間の RANGE パーティションを一括作成します。同じ文の中で異なる間隔を指定できます。

**例:**

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

## List パーティショニング

List パーティショニングは、パーティション列に列挙した値に基づいてデータを分割します。行の値がパーティションに定義された列挙値のいずれかと一致する場合に限り、その行は該当するパーティションに格納されます。

**サポートされる列の型:** `BOOLEAN`、`TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT`、`DATE`、`DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ`、`CHAR`、`VARCHAR`。

**構文キーワード:** `VALUES IN (...)` を使用して、各パーティションに含める列挙値を指定します。

### 単一列の List パーティショニング

```sql
PARTITION BY LIST(city)
(
    PARTITION `p_cn` VALUES IN ("Beijing", "Shanghai", "Hong Kong"),
    PARTITION `p_usa` VALUES IN ("New York", "San Francisco"),
    PARTITION `p_jp` VALUES IN ("Tokyo")
)
```

### 複数列の List パーティショニング

```sql
PARTITION BY LIST(id, city)
(
    PARTITION p1_city VALUES IN (("1", "Beijing"), ("1", "Shanghai")),
    PARTITION p2_city VALUES IN (("2", "Beijing"), ("2", "Shanghai")),
    PARTITION p3_city VALUES IN (("3", "Beijing"), ("3", "Shanghai"))
)
```

## NULL パーティショニング

デフォルトでは、パーティション列は NOT NULL である必要があります。この制約を持たない列をパーティション列として使用するには、次のセッション変数を設定します。

```sql
SET allow_partition_column_nullable = true;
```

NULL 値の扱いはパーティションの種類によって異なります。

| パーティションの種類 | NULL 値の扱い |
|----------|-------------|
| LIST パーティション | NULL 値を格納するパーティションをサポート |
| RANGE パーティション（LESS THAN を使用） | NULL 値は上限値が最も小さい LESS THAN パーティションに格納される |
| RANGE パーティション（LESS THAN を使用しない） | NULL 値は挿入できない |

### シナリオ 1: LIST パーティションで NULL を扱う

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

### シナリオ 2: RANGE パーティションでは NULL が上限値の最も小さい LESS THAN パーティションに格納される

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

### シナリオ 3: RANGE パーティションでは LESS THAN を使用しない場合に NULL を挿入できない

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
