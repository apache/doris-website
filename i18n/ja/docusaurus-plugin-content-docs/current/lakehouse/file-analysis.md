---
{
  "title": "S3/HDFSでのファイル解析",
  "language": "ja",
  "description": "Apache DorisのTable Value Function（TVF）を使用して、S3やHDFSなどのストレージシステム上のParquet、ORC、CSV、JSONファイルを直接クエリおよび分析する方法を学び、自動スキーマ推論、マルチファイルマッチング、データインポートをサポートします。"
}
---
Table Value Function (TVF) 機能により、Dorisは事前にデータをインポートすることなく、オブジェクトストレージやHDFS上のファイルをテーブルとして直接クエリおよび分析でき、自動的な列タイプ推論もサポートします。

## サポートされているストレージシステム

Dorisは、異なるストレージシステムにアクセスするために以下のTVFを提供します：

| TVF | サポートされているストレージ | 説明 |
|-----|-------------------|-------------|
| [S3](../sql-manual/sql-functions/table-valued-functions/s3.md) | S3互換オブジェクトストレージ | AWS S3、Alibaba Cloud OSS、Tencent Cloud COSなどをサポート |
| [HDFS](../sql-manual/sql-functions/table-valued-functions/hdfs.md) | HDFS | Hadoop Distributed File Systemをサポート |
| [HTTP](../sql-manual/sql-functions/table-valued-functions/http.md) | HTTP | HTTPアドレスからのファイルアクセスをサポート（バージョン4.0.2以降） |
| [FILE](../sql-manual/sql-functions/table-valued-functions/file.md) | S3/HDFS/HTTP/Local | 複数のストレージタイプをサポートする統合テーブル関数（バージョン3.1.0以降） |

## 使用例

### シナリオ1：ファイルの直接クエリと分析

TVFは、最初にDorisにデータをインポートすることなく、ストレージシステム上のファイルを直接分析するのに適しています。

以下の例では、S3 TVFを使用してオブジェクトストレージ上のParquetファイルをクエリします：

```sql
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
)
ORDER BY p_partkey LIMIT 5;
```
クエリ結果の例:

```
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
TVFは本質的にはテーブルであり、SQLステートメントで「テーブル」が使用できるあらゆる場所で使用できます。例えば：

- `FROM`句内
- CTEの`WITH`句内
- `JOIN`ステートメント内

### シナリオ2：アクセスを簡素化するためのビューの作成

接続情報の繰り返し記述を避け、権限管理をサポートするために、`CREATE VIEW`ステートメントを使用してTVFの論理ビューを作成できます：

```sql
-- Create a view based on TVF
CREATE VIEW tvf_view AS 
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
);

-- View the structure of the view
DESC tvf_view;

-- Query the view
SELECT * FROM tvf_view;

-- Grant access to other users
GRANT SELECT_PRIV ON db.tvf_view TO other_user;
```
### シナリオ3: Dorisへのデータインポート

`INSERT INTO SELECT`構文と組み合わせることで、ファイルデータをDorisテーブルにインポートできます：

```sql
-- 1. Create the target table
CREATE TABLE IF NOT EXISTS test_table
(
    id int,
    name varchar(50),
    age int
)
DISTRIBUTED BY HASH(id) BUCKETS 4
PROPERTIES("replication_num" = "1");

-- 2. Import data via TVF
INSERT INTO test_table (id, name, age)
SELECT cast(id as INT) as id, name, cast(age as INT) as age
FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
);
```
## 主要機能

### マルチファイルマッチング

ファイルパス（URI）では、ワイルドカードや範囲パターンを使用して複数のファイルをマッチさせることができます：

| パターン | 例 | マッチ結果 |
|---------|---------|--------------|
| `*` | `file_*` | `file_`で始まるすべてのファイル |
| `{n..m}` | `file_{1..3}` | `file_1`、`file_2`、`file_3` |
| `{a,b,c}` | `file_{a,b}` | `file_a`、`file_b` |

### Resourceを使用した設定の簡素化

TVFでは、`resource`プロパティを通じて事前に作成されたS3またはHDFS Resourcesを参照することで、各クエリごとに接続情報を繰り返し入力する必要がなくなります。

**1. Resourceを作成する**

```sql
CREATE RESOURCE "s3_resource"
PROPERTIES
(
    "type" = "s3",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.bucket" = "bucket"
);
```
**2. TVFでリソースを使用する**

```sql
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    'resource' = 's3_resource'
);
```
:::tip
- Resource内のプロパティはデフォルト値として機能します。TVFで指定されたプロパティは、Resource内の同じ名前のプロパティを上書きします
- Resourceを使用することで、接続情報の一元管理が可能になり、メンテナンスと権限制御が容易になります
:::

### 自動スキーマ推論

`DESC FUNCTION`構文を使用して、TVFの自動推論されたスキーマを表示できます：

```sql
DESC FUNCTION s3 (
    "URI" = "s3://bucket/path/to/tvf_test/test.parquet",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "format" = "parquet",
    "use_path_style" = "true"
);
```
```
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
**スキーマ推論ルール:**

| ファイル形式 | 推論方法 |
|-------------|------------------|
| Parquet, ORC | ファイルメタデータからスキーマを自動取得 |
| CSV, JSON | データの最初の行を解析してスキーマを取得; デフォルトの列タイプは `string` |
| 複数ファイルマッチング | 最初のファイルのスキーマを使用 |

### 列タイプの手動指定 (CSV/JSON)

CSVおよびJSON形式では、`csv_schema` プロパティを使用して `name1:type1;name2:type2;...` の形式で列名とタイプを手動で指定できます:

```sql
S3 (
    'uri' = 's3://bucket/path/to/tvf_test/test.csv',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk',
    'format' = 'csv',
    'column_separator' = '|',
    'csv_schema' = 'k1:int;k2:int;k3:int;k4:decimal(38,10)'
)
```
**サポートされているカラムタイプ:**

| Integer Types | Floating-Point Types | Other Types |
|---------------|----------------------|-------------|
| tinyint | float | decimal(p,s) |
| smallint | double | date |
| int | | datetime |
| bigint | | char |
| largeint | | varchar |
| | | string |
| | | boolean |

:::note
- カラムタイプが一致しない場合（例：ファイルに文字列が含まれているが`int`が指定されている）、カラムは`null`を返します
- カラム数が一致しない場合（例：ファイルに4つのカラムがあるが5つが指定されている）、不足しているカラムは`null`を返します
:::

## 注記

| シナリオ | 動作 |
|----------|----------|
| `uri`がファイルにマッチしないまたはすべてのファイルが空 | TVFは空の結果セットを返します。`DESC FUNCTION`を使用してスキーマを表示すると、プレースホルダーカラム`__dummy_col`が表示されます |
| CSVファイルの最初の行が空（ファイルは空ではない） | エラーメッセージ：`The first line is empty, can not parse column numbers` |
