---
{
  "title": "Hive HLL UDF",
  "language": "ja",
  "description": "Hive HLL UDFは、Hive テーブルにおいてHLL操作を生成するためのUDFセットを提供し、これはDoris HLLと同一です。"
}
---
# Hive HLL UDF

Hive HLL UDFは、HiveテーブルでHLL操作を生成するためのUDFセットを提供します。これらはDoris HLLと同一です。Hive HLLはSpark HLL Loadを通じてDorisにインポートできます。HLLの詳細については、近似重複排除でのHLLの使用を参照してください。:[Approximate Deduplication Using HLL](https://doris.apache.org/docs/query-acceleration/distinct-counts/using-hll/)

機能紹介：
 1. UDAF

   · to_hll：Doris HLLカラムを返す集約関数で、to_bitmap関数と類似しています

   · hll_union：グループのunionを計算する集約関数で、Doris HLLカラムを返し、bitmap_union関数と類似しています

 2. UDF

   · hll_cardinality：HLLに追加された個別要素の数を返し、bitmap_count関数と類似しています

主な目的：
 1. 辞書構築とHLL事前集約の必要性を排除することで、Dorisへのデータインポート時間を短縮
 2. HLLを使用してデータを圧縮することでHiveストレージを節約し、Bitmap統計と比較してストレージコストを大幅に削減
 3. unionやcardinality統計を含む柔軟なHLL操作をHiveで提供し、結果のHLLを直接Dorisにインポート可能

注意：
HLL統計は近似計算であり、エラー率は約1%から2%です。


## 使用方法

### Hiveテーブルを作成してテストデータを挿入

```sql
-- Create a test database, e.g., hive_test
use hive_test;

-- Create a Hive HLL table
CREATE TABLE IF NOT EXISTS `hive_hll_table`(
  `k1`   int       COMMENT '',
  `k2`   String    COMMENT '',
  `k3`   String    COMMENT '',
  `uuid` binary    COMMENT 'hll'
) comment  'comment'

-- Create a normal Hive table and insert test data
CREATE TABLE IF NOT EXISTS `hive_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` int       COMMENT ''
) comment  'comment'

insert into hive_table select 1, 'a', 'b', 12345;
insert into hive_table select 1, 'a', 'c', 12345;
insert into hive_table select 2, 'b', 'c', 23456;
insert into hive_table select 3, 'c', 'd', 34567;
```
### Hive HLL UDFの使用:

Hive HLL UDFはHive/Sparkで使用する必要があります。まず、FEをコンパイルしてhive-udf.jarファイルを取得します。
コンパイル準備: ldbソースコードをコンパイル済みの場合は、直接FEをコンパイルできます。そうでない場合は、thriftを手動でインストールする必要があります。コンパイルとインストールについては[Setting Up Dec Env for FE - IntelliJ IDEA](https://doris.apache.org/community/developer-guide/fe-idea-dev/)を参照してください。

```sql
-- Clone the Doris source code
git clone https://github.com/apache/doris.git
cd doris
git submodule update --init --recursive

-- Install thrift (skip if already installed)
-- Enter the FE directory
cd fe

-- Execute the Maven packaging command (all FE submodules will be packaged)
mvn package -Dmaven.test.skip=true
-- Or package only the hive-udf module
mvn package -pl hive-udf -am -Dmaven.test.skip=true

-- The packaged hive-udf.jar file will be generated in the target directory
-- Upload the compiled hive-udf.jar file to HDFS, e.g., to the root directory
hdfs dfs -put hive-udf/target/hive-udf.jar /

```
その後、Hiveに入り、以下のSQL文を実行してください：

```sql
-- Load the hive hll udf jar package, modify the hostname and port according to your actual situation
add jar hdfs://hostname:port/hive-udf.jar;

-- Create UDAF functions
create temporary function to_hll as 'org.apache.doris.udf.ToHllUDAF' USING JAR 'hdfs://hostname:port/hive-udf.jar';
create temporary function hll_union as 'org.apache.doris.udf.HllUnionUDAF' USING JAR 'hdfs://hostname:port/hive-udf.jar';


-- Create UDF functions
create temporary function hll_cardinality as 'org.apache.doris.udf.HllCardinalityUDF' USING JAR 'hdfs://node:9000/hive-udf.jar';


-- Example: Use the to_hll UDAF to aggregate and generate HLL, and write it to the Hive HLL table
insert into hive_hll_table
select 
    k1,
    k2,
    k3,
    to_hll(uuid) as uuid
from 
    hive_table
group by 
    k1,
    k2,
    k3

-- Example: Use hll_cardinality to calculate the number of elements in the HLL
select k1, k2, k3, hll_cardinality(uuid) from hive_hll_table;
+-----+-----+-----+------+
| k1  | k2  | k3  | _c3  |
+-----+-----+-----+------+
| 1   | a   | b   | 1    |
| 1   | a   | c   | 1    |
| 2   | b   | c   | 1    |
| 3   | c   | d   | 1    |
+-----+-----+-----+------+

-- Example: Use hll_union to calculate the union of groups, returning 3 rows
select k1, hll_union(uuid) from hive_hll_table group by k1;

-- Example: Also can merge and then continue to statistics
select k3, hll_cardinality(hll_union(uuid)) from hive_hll_table group by k3;
+-----+------+
| k3  | _c1  |
+-----+------+
| b   | 1    |
| c   | 2    |
| d   | 1    |
+-----+------+
```
### Hive HLL UDF 説明

## Hive HLL を Doris にインポートする

### 方法1: Catalog（推奨）

TEXT形式として指定されたHiveテーブルを作成します。Binary型の場合、Hiveはそれをbase64エンコードされた文字列として保存します。この時、Hive Catalogを使用して[hll_from_base64](../sql-manual/sql-functions/scalar-functions/hll-functions/hll-from-base64)関数を使ってHLLデータを直接Dorisにインポートできます。

完全な例は以下の通りです：

1. Hiveテーブルを作成する

```sql
CREATE TABLE IF NOT EXISTS `hive_hll_table`(
`k1`   int       COMMENT '',
`k2`   String    COMMENT '',
`k3`   String    COMMENT '',
`uuid` binary    COMMENT 'hll'
) stored as textfile

-- then reuse the previous steps to insert data from a normal table into it using the to_hll function
```
2. [Dorisカタログを作成する](../lakehouse/catalogs/hive-catalog)

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://127.0.0.1:9083'
);
```
3. Doris内部テーブルを作成する

```sql
CREATE TABLE IF NOT EXISTS `doris_test`.`doris_hll_table`(
    `k1`   int                   COMMENT '',
    `k2`   varchar(10)           COMMENT '',
    `k3`   varchar(10)           COMMENT '',
    `uuid` HLL  HLL_UNION  COMMENT 'hll'
)
AGGREGATE KEY(k1, k2, k3)
DISTRIBUTED BY HASH(`k1`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```
4. HiveからDorisにデータをインポートする

```sql
insert into doris_hll_table select k1, k2, k3, hll_from_base64(uuid) from hive.hive_test.hive_hll_table;

-- View the imported data, combining hll_to_base64 for decoding
select *, hll_to_base64(uuid) from doris_hll_table;
+------+------+------+------+---------------------+
| k1   | k2   | k3   | uuid | hll_to_base64(uuid) |
+------+------+------+------+---------------------+
|    1 | a    | b    | NULL | AQFw+a9MhpKhoQ==    |
|    1 | a    | c    | NULL | AQFw+a9MhpKhoQ==    |
|    2 | b    | c    | NULL | AQGyB7kbWBxh+A==    |
|    3 | c    | d    | NULL | AQFYbJB5VpNBhg==    |
+------+------+------+------+---------------------+

-- Also can use Doris's native HLL functions for statistics, and see that the results are consistent with the previous statistics in Hive
select k3, hll_cardinality(hll_union(uuid)) from doris_hll_table group by k3;
+------+----------------------------------+
| k3   | hll_cardinality(hll_union(uuid)) |
+------+----------------------------------+
| b    |                                1 |
| d    |                                1 |
| c    |                                2 |
+------+----------------------------------+

-- At this time, querying the external table data, i.e., the data before import, can also verify the correctness of the data
select k3, hll_cardinality(hll_union(hll_from_base64(uuid))) from hive.hive_test.hive_hll_table group by k3;
+------+---------------------------------------------------+
| k3   | hll_cardinality(hll_union(hll_from_base64(uuid))) |
+------+---------------------------------------------------+
| d    |                                                 1 |
| b    |                                                 1 |
| c    |                                                 2 |
+------+---------------------------------------------------+
```
