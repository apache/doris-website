---
{
  "title": "Hive Bitmap UDF",
  "language": "ja",
  "description": "Hive Bitmap UDFは、hiveテーブルでのbitmap生成とbitmap操作のためのUDFを提供します。HiveのbitmapはDoris bitmapと全く同じです。"
}
---
# Hive UDF

Hive Bitmap UDFは、hiveテーブルでbitmapを生成し、bitmap操作を行うためのUDFを提供します。HiveのbitmapはDorisのbitmapと全く同じです。Hiveのbitmapは(spark bitmap load)を通じてdorisにインポートできます。

主な目的:
 1. dorisへのデータインポート時間を短縮し、辞書構築やbitmap事前集計などのプロセスを除去する;
 2. hiveストレージを節約し、bitmapを使用してデータを圧縮し、ストレージコストを削減する;
 3. hiveで柔軟なbitmap操作を提供する。例えば: 積集合、和集合、差集合操作など。計算されたbitmapも直接dorisにインポート可能; dorisにインポート;

## 使用方法

### HiveでBitmap型テーブルを作成

```sql
-- Example: Create Hive Bitmap Table
CREATE TABLE IF NOT EXISTS `hive_bitmap_table`(
  `k1`   int       COMMENT '',
  `k2`   String    COMMENT '',
  `k3`   String    COMMENT '',
  `uuid` binary    COMMENT 'bitmap'
) comment  'comment'

-- Example：Create Hive Table
CREATE TABLE IF NOT EXISTS `hive_table`(
  `k1`   int       COMMENT '',
  `k2`   String    COMMENT '',
  `k3`   String    COMMENT '',
  `uuid` int       COMMENT ''
) comment  'comment'
```
### Hive Bitmap UDF 使用法:

   Hive Bitmap UDF は Hive/Spark で使用されます。まず、fe をコンパイルして hive-udf-jar-with-dependencies.jar を取得する必要があります。
   コンパイルの準備：ldb ソースコードをコンパイル済みの場合は、fe を直接コンパイルできます。ldb ソースコードをコンパイル済みの場合は、直接コンパイルできます。ldb ソースコードをコンパイルしていない場合は、thrift を手動でインストールする必要があります。
   参考：[Setting Up dev env for FE](https://doris.apache.org/community/developer-guide/fe-idea-dev/)。

```sql
--clone doris code
git clone https://github.com/apache/doris.git
cd doris
git submodule update --init --recursive
--install thrift
--Enter the fe directory
cd fe
--Execute the maven packaging command（All sub modules of fe will be packaged）
mvn package -Dmaven.test.skip=true
--You can also just package the hive-udf module
mvn package -pl hive-udf -am -Dmaven.test.skip=true
```
パッケージ化とコンパイル後、hive-udfディレクトリに入るとtargetディレクトリがあり、hive-udf.jarパッケージが存在します

```sql
-- Load the Hive Bitmap Udf jar package (Upload the compiled hive-udf jar package to HDFS)
add jar hdfs://node:9001/hive-udf-jar-with-dependencies.jar;
-- Create Hive Bitmap UDAF function
create temporary function to_bitmap as 'org.apache.doris.udf.ToBitmapUDAF' USING JAR 'hdfs://node:9001/hive-udf-jar-with-dependencies.jar';
create temporary function bitmap_union as 'org.apache.doris.udf.BitmapUnionUDAF' USING JAR 'hdfs://node:9001/hive-udf-jar-with-dependencies.jar';
-- Create Hive Bitmap UDF function
create temporary function bitmap_count as 'org.apache.doris.udf.BitmapCountUDF' USING JAR 'hdfs://node:9001/hive-udf-jar-with-dependencies.jar';
create temporary function bitmap_and as 'org.apache.doris.udf.BitmapAndUDF' USING JAR 'hdfs://node:9001/hive-udf-jar-with-dependencies.jar';
create temporary function bitmap_or as 'org.apache.doris.udf.BitmapOrUDF' USING JAR 'hdfs://node:9001/hive-udf-jar-with-dependencies.jar';
create temporary function bitmap_xor as 'org.apache.doris.udf.BitmapXorUDF' USING JAR 'hdfs://node:9001/hive-udf-jar-with-dependencies.jar';
-- Example: Generate bitmap by to_bitmap function and write to Hive Bitmap table
insert into hive_bitmap_table
select 
    k1,
    k2,
    k3,
    to_bitmap(uuid) as uuid
from 
    hive_table
group by 
    k1,
    k2,
    k3
-- Example: The bitmap_count function calculate the number of elements in the bitmap
select k1,k2,k3,bitmap_count(uuid) from hive_bitmap_table
-- Example: The bitmap_union function calculate the grouped bitmap union
select k1,bitmap_union(uuid) from hive_bitmap_table group by k1
```
### Hive Bitmap UDF 説明

## Hive BitmapのDorisへのインポート

### 方法1: Catalog（推奨）

HiveでフォーマットをTEXTとして指定したHiveテーブルを作成する際、Binary型の場合、Hiveはbash64エンコード文字列として保存されます。そのため、DorisのHive Catalogを使用してbitmap_from_base64関数を通じて、バイナリデータを直接Bitmapとして保存できます。

完全な例を以下に示します:

1. HiveでHiveテーブルを作成する

```sql
CREATE TABLE IF NOT EXISTS `test`.`hive_bitmap_table`(
`k1`   int       COMMENT '',
`k2`   String    COMMENT '',
`k3`   String    COMMENT '',
`uuid` binary    COMMENT 'bitmap'
) stored as textfile 
```
2. [DorisでCatalogを作成する](../lakehouse/catalogs/hive-catalog.mdx)

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://127.0.0.1:9083'
);
```
3. Doris内部テーブルの作成

```sql
CREATE TABLE IF NOT EXISTS `test`.`doris_bitmap_table`(
    `k1`   int                   COMMENT '',
    `k2`   String                COMMENT '',
    `k3`   String                COMMENT '',
    `uuid` BITMAP  BITMAP_UNION  COMMENT 'bitmap'
)
AGGREGATE KEY(k1, k2, k3)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```
4. HiveからDorisにデータを挿入する

```sql
insert into doris_bitmap_table select k1, k2, k3, bitmap_from_base64(uuid) from hive.test.hive_bitmap_table;
```
### 方法2: Spark Load

詳細については、[Spark Load](https://doris.apache.org/zh-CN/docs/1.2/data-operate/import/import-way/spark-load-manual) -> 基本操作 -> ロード作成（例3: 上流データソースがhive binaryタイプテーブルの場合）を参照してください
