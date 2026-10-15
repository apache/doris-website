---
{
    "title": "Hive の Bitmap/HLL UDF",
    "language": "ja",
    "description": "Hive で Bitmap と HLL を生成・操作する UDF。結果を Doris に直接ロードできるため、辞書の構築や事前集約を Doris 側で行う必要がなくなり、ロード時間とストレージコストを削減できます。"
}
---

Doris は、Hive テーブルで Bitmap と HLL を直接生成・操作するための Hive UDF を提供します。Hive で生成した Bitmap と HLL は Doris カーネルと完全に互換性があり、Hive Catalog または Spark Load を使って Doris に直接ロードできます。

HLL の詳細については、[HLL による近似重複排除](../../query-acceleration/distinct-counts/hll-approximate-deduplication)を参照してください。

## ユースケース

| シナリオ                                | 利点                                                                                                  |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Doris へのデータロード時間を短縮する | 辞書の構築と事前集約を Hive 側で完了するため、Doris へのロード時に再構築する必要がありません |
| Hive と Doris のストレージコストを削減する | Bitmap と HLL が元データを圧縮します。通常、HLL のストレージ使用量は Bitmap より大幅に少なくなります |
| Hive で柔軟に計算する | Bitmap の積集合・和集合・差集合、HLL の和集合・カーディナリティ推定に対応します。結果を Doris に直接ロードできます |

:::tip
HLL は近似アルゴリズムであり、通常、結果には正確な値と比べて 1%～2% の誤差があります。高い精度が必要な場合は Bitmap を使用してください。
:::

## 関数一覧

<!-- Knowledge type: Function reference -->

### Bitmap の UDF

| 関数         | 種別  | 説明                          |
| ---------------- | ----- | ------------------------------------ |
| `to_bitmap`      | UDAF  | 集約して Doris Bitmap の列を生成します |
| `bitmap_union`   | UDAF  | グループ内の Bitmap の和集合を計算します |
| `bitmap_count`   | UDF   | Bitmap の要素数を返します |
| `bitmap_and`     | UDF   | 二つの Bitmap の積集合を計算します |
| `bitmap_or`      | UDF   | 二つの Bitmap の和集合を計算します |
| `bitmap_xor`     | UDF   | 二つの Bitmap の対称差集合を計算します |

### HLL の UDF

| 関数          | 種別  | 説明                                                  |
| ----------------- | ----- | ------------------------------------------------------------ |
| `to_hll`          | UDAF  | `to_bitmap` と同様に、集約して Doris HLL の列を生成します |
| `hll_union`       | UDAF  | `bitmap_union` と同様に、グループ内の HLL の和集合を計算します |
| `hll_cardinality` | UDF   | `bitmap_count` と同様に、HLL 内の異なる要素の概数を返します |

## 使用手順

<!-- Knowledge type: Operation steps -->

全体の手順は次の四つのステップです。

1. `hive-udf.jar` をビルドして HDFS にアップロードします。
2. Hive で JAR をロードし、UDF を登録します。
3. Hive で UDF を使って Bitmap または HLL を生成・操作します。
4. Hive Catalog または Spark Load を使って結果を Doris にロードします。

### ステップ 1: UDF JAR をビルドする

Hive Bitmap と HLL の UDF は Hive / Spark で使用するため、まず Doris FE モジュールをビルドして `hive-udf.jar` を取得する必要があります。

```bash
# 1. Clone the Doris source code
git clone https://github.com/apache/doris.git
cd doris
git submodule update --init --recursive

# 2. Enter the fe directory
cd fe

# 3. Run maven package (all submodules of fe will be packaged)
mvn package -Dmaven.test.skip=true

# You can also package only the hive-udf module
mvn package -pl hive-udf -am -Dmaven.test.skip=true

# 4. After packaging, hive-udf.jar will be generated under hive-udf/target
#    Upload it to HDFS (here uploading to the root directory as an example)
hdfs dfs -put hive-udf/target/hive-udf.jar /
```

### ステップ 2: Hive で JAR をロードし、UDF を登録する

Hive に接続し、HDFS の `hostname` と `port` を実際の環境に合わせて変更してください。

```sql
-- Load the UDF JAR
add jar hdfs://hostname:port/hive-udf.jar;

-- Register Bitmap UDAFs
create temporary function to_bitmap     as 'org.apache.doris.udf.ToBitmapUDAF'    USING JAR 'hdfs://hostname:port/hive-udf.jar';
create temporary function bitmap_union  as 'org.apache.doris.udf.BitmapUnionUDAF' USING JAR 'hdfs://hostname:port/hive-udf.jar';

-- Register Bitmap UDFs
create temporary function bitmap_count  as 'org.apache.doris.udf.BitmapCountUDF'  USING JAR 'hdfs://hostname:port/hive-udf.jar';
create temporary function bitmap_and    as 'org.apache.doris.udf.BitmapAndUDF'    USING JAR 'hdfs://hostname:port/hive-udf.jar';
create temporary function bitmap_or     as 'org.apache.doris.udf.BitmapOrUDF'     USING JAR 'hdfs://hostname:port/hive-udf.jar';
create temporary function bitmap_xor    as 'org.apache.doris.udf.BitmapXorUDF'    USING JAR 'hdfs://hostname:port/hive-udf.jar';

-- Register HLL UDAFs
create temporary function to_hll        as 'org.apache.doris.udf.ToHllUDAF'       USING JAR 'hdfs://hostname:port/hive-udf.jar';
create temporary function hll_union     as 'org.apache.doris.udf.HllUnionUDAF'    USING JAR 'hdfs://hostname:port/hive-udf.jar';

-- Register HLL UDF
create temporary function hll_cardinality as 'org.apache.doris.udf.HllCardinalityUDF' USING JAR 'hdfs://hostname:port/hive-udf.jar';
```

### ステップ 3: Hive で生成・計算する

#### テストデータの準備

```sql
use hive_test;

-- Regular Hive table that stores raw data
CREATE TABLE IF NOT EXISTS `hive_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` int       COMMENT ''
) COMMENT 'source table';

insert into hive_table select 1, 'a', 'b', 12345;
insert into hive_table select 1, 'a', 'c', 12345;
insert into hive_table select 2, 'b', 'c', 23456;
insert into hive_table select 3, 'c', 'd', 34567;
```

#### Bitmap の例

```sql
-- Create a Hive Bitmap table; the binary column stores the Bitmap
CREATE TABLE IF NOT EXISTS `hive_bitmap_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` binary    COMMENT 'bitmap'
) COMMENT 'bitmap table';

-- Aggregate and generate Bitmap with to_bitmap, then write into the Hive Bitmap table
insert into hive_bitmap_table
select
    k1,
    k2,
    k3,
    to_bitmap(uuid) as uuid
from hive_table
group by k1, k2, k3;

-- Count the number of elements in the Bitmap
select k1, k2, k3, bitmap_count(uuid) from hive_bitmap_table;

-- Compute the Bitmap union after grouping
select k1, bitmap_union(uuid) from hive_bitmap_table group by k1;
```

#### HLL の例

```sql
-- Create a Hive HLL table; the binary column stores the HLL
CREATE TABLE IF NOT EXISTS `hive_hll_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` binary    COMMENT 'hll'
) COMMENT 'hll table';

-- Aggregate and generate HLL with to_hll, then write into the Hive HLL table
insert into hive_hll_table
select
    k1,
    k2,
    k3,
    to_hll(uuid) as uuid
from hive_table
group by k1, k2, k3;

-- Count the number of elements in the HLL
select k1, k2, k3, hll_cardinality(uuid) from hive_hll_table;
+-----+-----+-----+------+
| k1  | k2  | k3  | _c3  |
+-----+-----+-----+------+
| 1   | a   | b   | 1    |
| 1   | a   | c   | 1    |
| 2   | b   | c   | 1    |
| 3   | c   | d   | 1    |
+-----+-----+-----+------+

-- Compute the HLL union after grouping (returns 3 rows)
select k1, hll_union(uuid) from hive_hll_table group by k1;

-- You can also merge first and then count
select k3, hll_cardinality(hll_union(uuid)) from hive_hll_table group by k3;
+-----+------+
| k3  | _c1  |
+-----+------+
| b   | 1    |
| c   | 2    |
| d   | 1    |
+-----+------+
```

### ステップ 4: Hive の Bitmap / HLL を Doris にロードする

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Hive already has Bitmap / HLL data and needs to be written into a Doris internal table -->

**推奨方法: Hive Catalog**

Hive テーブルが `TEXT` 形式で保存されている場合、`binary` 型は Base64 エンコードされた文字列として保存されます。Hive Catalog を使うと、[`bitmap_from_base64`](../../sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-from-base64) または [`hll_from_base64`](../../sql-manual/sql-functions/scalar-functions/hll-functions/hll-from-base64) 関数を使って、データを Doris の内部テーブルに直接書き込めます。

一連の手順は次のとおりです。

1. Hive で `TEXTFILE` 形式のテーブルを作成します。
2. Doris で [Hive Catalog](../../lakehouse/catalogs/hive-catalog) を作成します。
3. Doris で対応する Bitmap / HLL 内部テーブルを作成します。
4. `INSERT INTO ... SELECT` を使って Hive から Doris にデータを書き込みます。

#### Bitmap の一連の例

**1. Hive で TEXT 形式のテーブルを作成する**

```sql
CREATE TABLE IF NOT EXISTS `test`.`hive_bitmap_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` binary    COMMENT 'bitmap'
) STORED AS TEXTFILE;
```

**2. Doris で Hive Catalog を作成する**

```sql
CREATE CATALOG hive PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://127.0.0.1:9083'
);
```

**3. Doris で Bitmap 内部テーブルを作成する**

```sql
CREATE TABLE IF NOT EXISTS `test`.`doris_bitmap_table`(
    `k1`   int                    COMMENT '',
    `k2`   String                 COMMENT '',
    `k3`   String                 COMMENT '',
    `uuid` BITMAP   BITMAP_UNION  COMMENT 'bitmap'
)
AGGREGATE KEY(k1, k2, k3)
DISTRIBUTED BY HASH(`k1`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

**4. Catalog を使って Hive から Doris にデータを書き込む**

```sql
insert into test.doris_bitmap_table
select k1, k2, k3, bitmap_from_base64(uuid)
from hive.test.hive_bitmap_table;
```

#### HLL の一連の例

**1. Hive で TEXT 形式のテーブルを作成する**

```sql
CREATE TABLE IF NOT EXISTS `hive_hll_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` binary    COMMENT 'hll'
) STORED AS TEXTFILE;

-- You can reuse the previous steps and write data from a regular table using the to_hll function
```

**2. Doris で Hive Catalog を作成する**

```sql
CREATE CATALOG hive PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://127.0.0.1:9083'
);
```

**3. Doris で HLL 内部テーブルを作成する**

```sql
CREATE TABLE IF NOT EXISTS `doris_test`.`doris_hll_table`(
    `k1`   int                  COMMENT '',
    `k2`   varchar(10)          COMMENT '',
    `k3`   varchar(10)          COMMENT '',
    `uuid` HLL   HLL_UNION      COMMENT 'hll'
)
AGGREGATE KEY(k1, k2, k3)
DISTRIBUTED BY HASH(`k1`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

**4. Catalog を使って Hive から Doris にデータを書き込む**

```sql
insert into doris_test.doris_hll_table
select k1, k2, k3, hll_from_base64(uuid)
from hive.hive_test.hive_hll_table;

-- View the loaded results, can be combined with hll_to_base64 for decoding
select *, hll_to_base64(uuid) from doris_test.doris_hll_table;
+------+------+------+------+---------------------+
| k1   | k2   | k3   | uuid | hll_to_base64(uuid) |
+------+------+------+------+---------------------+
|    1 | a    | b    | NULL | AQFw+a9MhpKhoQ==    |
|    1 | a    | c    | NULL | AQFw+a9MhpKhoQ==    |
|    2 | b    | c    | NULL | AQGyB7kbWBxh+A==    |
|    3 | c    | d    | NULL | AQFYbJB5VpNBhg==    |
+------+------+------+------+---------------------+

-- Use native HLL functions on the Doris internal table; the result is consistent with Hive
select k3, hll_cardinality(hll_union(uuid)) from doris_test.doris_hll_table group by k3;
+------+----------------------------------+
| k3   | hll_cardinality(hll_union(uuid)) |
+------+----------------------------------+
| b    |                                1 |
| d    |                                1 |
| c    |                                2 |
+------+----------------------------------+

-- Query the Hive external table directly (data before loading) for cross-validation to confirm consistency
select k3, hll_cardinality(hll_union(hll_from_base64(uuid)))
from hive.hive_test.hive_hll_table
group by k3;
+------+---------------------------------------------------+
| k3   | hll_cardinality(hll_union(hll_from_base64(uuid))) |
+------+---------------------------------------------------+
| d    |                                                 1 |
| b    |                                                 1 |
| c    |                                                 2 |
+------+---------------------------------------------------+
```

## 注意事項

- **HLL の精度**: HLL は近似アルゴリズムであり、通常、結果には正確な値と比べて 1%～2% の誤差があります。高い精度が必要な場合は Bitmap を使用してください。
- **保存形式**: Hive Catalog 経由でロードする場合、Hive テーブルには `TEXTFILE` 形式を使用し、`binary` 列が Base64 文字列として保存されるようにする必要があります。
- **JAR のパス**: 例の `hdfs://hostname:port/hive-udf.jar` は実際の HDFS アドレスに置き換えてください。すべての UDF で同じ JAR を参照することを推奨します。
- **関数の対応関係**: `to_hll` は `to_bitmap`、`hll_union` は `bitmap_union`、`hll_cardinality` は `bitmap_count` に対応しているため、Bitmap と HLL の方式を切り替えやすくなっています。
