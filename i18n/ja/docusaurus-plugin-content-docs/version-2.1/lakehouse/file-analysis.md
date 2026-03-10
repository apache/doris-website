---
{
  "title": "S3/HDFS上のファイルを分析する",
  "language": "ja",
  "description": "Table Value Function機能を通じて、DorisはオブジェクトストレージまたはHDFS上のファイルをTableとして直接クエリおよび分析できます。"
}
---
Table Value Function機能を通じて、DorisはオブジェクトストレージやHDFS上のファイルをTableとして直接クエリおよび分析できます。また、自動的な列タイプ推論もサポートしています。

より詳しい使用方法については、Table Value Function文書を参照してください：

* [S3](../sql-manual/sql-functions/table-valued-functions/s3.md)：S3互換オブジェクトストレージでのファイル分析をサポート。

* [HDFS](../sql-manual/sql-functions/table-valued-functions/hdfs.md)：HDFSでのファイル分析をサポート。

## 基本的な使用方法

ここでは、S3 Table Value Functionを例として、オブジェクトストレージ上のファイルを分析する方法を説明します。

### クエリ

```sql
SELECT * FROM S3 (
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key'='sk'
)
```
`S3(...)`はTVF（Table Value Function）です。Table Value Functionは本質的にはテーブルなので、「テーブル」が使用できるあらゆるSQL文で使用できます。

TVFの属性には、分析対象のファイルパス、ファイル形式、オブジェクトストレージの接続情報などが含まれます。ファイルパス（URI）では、ワイルドカードを使用して複数のファイルをマッチできます。以下のファイルパスが有効です：

* 特定のファイルをマッチ

  `s3://bucket/path/to/tvf_test/test.parquet`

* `test_`で始まるすべてのファイルをマッチ

  `s3://bucket/path/to/tvf_test/test_*`

* `.parquet`拡張子を持つすべてのファイルをマッチ

  `s3://bucket/path/to/tvf_test/*.parquet`

* `tvf_test`ディレクトリ内のすべてのファイルをマッチ

  `s3://bucket/path/to/tvf_test/*`

* ファイル名に`test`を含むファイルをマッチ

  `s3://bucket/path/to/tvf_test/*test*`

### ファイルカラムタイプの自動推論

`DESC FUNCTION`構文を使用してTVFのSchemaを確認できます：

```sql
DESC FUNCTION s3 (
    "URI" = "s3://bucket/path/to/tvf_test/test.parquet",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "format" = "parquet",
    "use_path_style"="true"
);
+---------------+--------------+------+-------+---------+-------+
| Field         | Type         | Null | Key   | Default | Extra |
+---------------+--------------+------+-------+---------+-------+
| p_partkey     | INT          | Yes  | false | NULL    | NONE  |
| p_name        | TEXT         | Yes  | false | NULL    | NONE  |
| p_mfgr        | TEXT         | Yes  | false | NULL    | NONE  |
| p_brand       | TEXT         | Yes  | false | NULL    | NONE  |
| p_type        | TEXT         | Yes  | false | NULL    | NONE  |
| p_size        | INT          | Yes  | false | NULL    | NONE  |
| p_container   | TEXT         | Yes  | false | NULL    | NONE  |
| p_retailprice | DECIMAL(9,0) | Yes  | false | NULL    | NONE  |
| p_comment     | TEXT         | Yes  | false | NULL    | NONE  |
+---------------+--------------+------+-------+---------+-------+
```
Dorisは以下のルールに基づいてSchemaを推論します：

* ParquetおよびORCフォーマットの場合、DorisはファイルメタデータからSchemaを取得します。

* 複数のファイルがマッチする場合、最初のファイルのSchemaがTVFのSchemaとして使用されます。

* CSVおよびJSONフォーマットの場合、Dorisはフィールド、区切り文字などに基づいて**データの最初の行**を解析してSchemaを取得します。

  デフォルトでは、すべてのカラム型は`string`です。`csv_schema`属性を使用して、カラム名と型を個別に指定できます。Dorisは指定されたカラム型をファイル読み取りに使用します。フォーマットは`name1:type1;name2:type2;...`です。例：

  ```sql
  S3 (
      'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
      's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
      's3.region' = 'us-east-1',
      's3.access_key' = 'ak'
      's3.secret_key'='sk',
      'format' = 'csv',
      'column_separator' = '|',
      'csv_schema' = 'k1:int;k2:int;k3:int;k4:decimal(38,10)'
  )
  ```
現在サポートされているカラム型名は以下の通りです：

  | Column Type Name |
  | ------------ |
  | tinyint      |
  | smallint     |
  | int          |
  | bigint       |
  | largeint     |
  | float        |
  | double       |
  | decimal(p,s) |
  | date         |
  | datetime     |
  | char         |
  | varchar      |
  | string       |
  | boolean      |

* フォーマットが一致しないカラム（例：ファイルにはstringが含まれているが、ユーザーが`int`として定義した場合、または他のファイルが最初のファイルと異なるSchemaを持つ場合）、または欠損しているカラム（例：ファイルには4つのカラムがあるが、ユーザーが5つのカラムを定義した場合）については、これらのカラムは`null`を返します。

## 適用可能なシナリオ

### クエリ分析

TVFは、事前にDorisにデータをインポートすることなく、ストレージシステム上の独立したファイルを直接分析するのに非常に適しています。

ファイル分析には以下のような任意のSQL文を使用できます：

```sql
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key'='sk'
)
ORDER BY p_partkey LIMIT 5;
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
| p_partkey | p_name                                   | p_mfgr         | p_brand  | p_type                  | p_size | p_container | p_retailprice | p_comment           |
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
|         1 | goldenrod lavender spring chocolate lace | Manufacturer#1 | Brand#13 | PROMO BURNISHED COPPER  |      7 | JUMBO PKG   |           901 | ly. slyly ironi     |
|         2 | blush thistle blue yellow saddle         | Manufacturer#1 | Brand#13 | LARGE BRUSHED BRASS     |      1 | LG CASE     |           902 | lar accounts amo    |
|         3 | spring green yellow purple cornsilk      | Manufacturer#4 | Brand#42 | STANDARD POLISHED BRASS |     21 | WRAP CASE   |           903 | egular deposits hag |
|         4 | cornflower chocolate smoke green pink    | Manufacturer#3 | Brand#34 | SMALL PLATED BRASS      |     14 | MED DRUM    |           904 | p furiously r       |
|         5 | forest brown coral puff cream            | Manufacturer#3 | Brand#32 | STANDARD POLISHED TIN   |     15 | SM PKG      |           905 |  wake carefully     |
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
```
TVFはテーブルが表示できるSQLの任意の位置に表示できます。例えば、`CTE`の`WITH`句や`FROM`句などです。この方法により、ファイルを任意の分析において通常のテーブルとして扱うことができます。

また、`CREATE VIEW`文を使用してTVFの論理ビューを作成することもできます。その後、このTVFを他のビューと同様にアクセスし、権限を管理するなどして、他のユーザーが接続情報やその他の属性を繰り返し書くことなくこのViewにアクセスできるようになります。

```sql
-- Create a view based on a TVF
CREATE VIEW tvf_view AS 
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key'='sk'
);

-- Describe the view as usual
DESC tvf_view;

-- Query the view as usual
SELECT * FROM tvf_view;

-- Grant SELECT priv to other user on this view
GRANT SELECT_PRIV ON db.tvf_view TO other_user;
```
### データインポート

TVFはDorisへのデータインポートの手法として使用できます。`INSERT INTO SELECT`構文により、ファイルをDorisに簡単にインポートできます。

```sql
-- Create a Doris table
CREATE TABLE IF NOT EXISTS test_table
(
    id int,
    name varchar(50),
    age int
)
DISTRIBUTED BY HASH(id) BUCKETS 4
PROPERTIES("replication_num" = "1");

-- 2. Load data into table from TVF
INSERT INTO test_table (id,name,age)
SELECT cast(id as INT) as id, name, cast (age as INT) as age
FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key'='sk'
);
```
## Notes

1. 指定された`uri`がどのファイルにもマッチしない場合、またはマッチしたすべてのファイルが空の場合、TVFは空の結果セットを返します。この場合、`DESC FUNCTION`を使用してこのTVFのSchemaを表示すると、仮想カラム`__dummy_col`が表示されますが、これは意味がなくプレースホルダーとしてのみ機能します。

2. 指定されたファイル形式が`csv`で、読み取られたファイルが空でないものの、ファイルの最初の行が空の場合、ファイルの最初の行からSchemaを解析できないため、エラー`The first line is empty, can not parse column numbers`が表示されます。
