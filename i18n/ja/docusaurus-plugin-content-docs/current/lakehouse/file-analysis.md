---
{
    "title": "S3/HDFS 上のファイルの分析",
    "language": "ja",
    "description": "Apache Doris の Table Value Function（TVF）を使用して、S3 や HDFS などのストレージ上にある Parquet、ORC、CSV、JSON ファイルを直接クエリ・分析する方法を説明します。スキーマの自動推論、複数ファイルのマッチング、データのインポート、クエリ結果のファイルへのエクスポートにも対応しています。"
}
---

Table Value Function（TVF）を使用すると、Doris はオブジェクトストレージや HDFS 上のファイルを、事前にデータをインポートすることなくテーブルとして直接クエリ・分析できます。列の型も自動的に推論されます。バージョン 4.1.0 以降は、`INSERT INTO` TVF 構文によるクエリ結果のファイルシステムへのエクスポートにも対応しています。

## 対応ストレージシステム

Doris は、ストレージシステムごとに次の TVF を提供しています。

| TVF | 対応ストレージ | 説明 |
|-----|-------------------|-------------|
| [S3](../sql-manual/sql-functions/table-valued-functions/s3.md) | S3 互換オブジェクトストレージ | AWS S3、Alibaba Cloud OSS、Tencent Cloud COS などに対応 |
| [HDFS](../sql-manual/sql-functions/table-valued-functions/hdfs.md) | HDFS | Hadoop Distributed File System に対応 |
| [HTTP](../sql-manual/sql-functions/table-valued-functions/http.md) | HTTP | HTTP アドレス上のファイルへのアクセスに対応（バージョン 4.0.2 以降） |
| [FILE](../sql-manual/sql-functions/table-valued-functions/file.md) | S3/HDFS/HTTP/ローカル | 複数のストレージ種別に対応する統合テーブル関数（バージョン 3.1.0 以降） |

## 対応ファイル形式

TVF は次のファイル形式の読み取りと分析に対応しています。形式ごとの詳細とパラメータについては、各リンクを参照してください。

- [Parquet](./file-formats/parquet.md)
- [ORC](./file-formats/orc.md)
- [テキスト / CSV / JSON](./file-formats/text.md)
- [Lance](./file-formats/lance.md)（バージョン 4.2 以降で対応）

## ユースケース

### シナリオ 1：ファイルを直接クエリ・分析する

TVF は、ストレージ上のファイルを Doris にインポートせずに直接分析する場合に適しています。

次の例では、S3 TVF を使用してオブジェクトストレージ上の Parquet ファイルをクエリします。

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

クエリ結果の例：

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

TVF は実質的にテーブルとして扱われ、SQL 文でテーブルを指定できる場所に使用できます。たとえば、次の場所です。

- `FROM` 句
- CTE の `WITH` 句
- `JOIN` 文

### シナリオ 2：ビューを作成してアクセスを簡素化する

`CREATE VIEW` 文で TVF の論理ビューを作成すると、接続情報を繰り返し記述せずに済み、権限も管理できます。

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

### シナリオ 3：Doris にデータをインポートする

`INSERT INTO SELECT` 構文と組み合わせると、ファイルのデータを Doris のテーブルにインポートできます。

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

### シナリオ 4：クエリ結果をファイルにエクスポートする（バージョン 4.1.0 以降） {#export-query-results}

:::tip
この機能は Apache Doris バージョン 4.1.0 以降でサポートされており、現在は実験的機能です。
:::

`INSERT INTO` TVF 構文を使用すると、クエリ結果をローカルファイルシステム、HDFS、または S3 互換オブジェクトストレージに直接ファイルとしてエクスポートできます。CSV、Parquet、ORC 形式に対応しています。

**構文：**

```sql
INSERT INTO tvf_name(
    "file_path" = "<file_path_prefix>",
    "format" = "<file_format>",
    ... -- other connection properties and format options
)
[WITH LABEL label_name]
SELECT ... ;
```

`tvf_name` には次の値を指定できます。

| TVF 名 | 出力先ストレージ | 説明 |
|----------|---------------|-------------|
| `local` | ローカルファイルシステム | BE ノードのローカルディスクにエクスポートします。`backend_id` の指定が必要です |
| `hdfs` | HDFS | Hadoop Distributed File System にエクスポートします |
| `s3` | S3 互換オブジェクトストレージ | AWS S3、Alibaba Cloud OSS、Tencent Cloud COS などにエクスポートします |

**共通プロパティ：**

| プロパティ | 必須 | 説明 |
|----------|----------|-------------|
| `file_path` | はい | 出力ファイルのパスのプレフィックス。実際に生成されるファイル名の形式は `{prefix}{query_id}_{idx}.{ext}` です |
| `format` | いいえ | 出力ファイル形式。`csv`（デフォルト）、`parquet`、`orc` に対応します |
| `max_file_size` | いいえ | ファイルごとの最大サイズ（バイト単位）。超過すると新しいファイルが自動的に作成されます |
| `delete_existing_files` | いいえ | 書き込み前に出力先ディレクトリ内の既存ファイルを削除するかどうか。デフォルトは `false` です |

**CSV 形式の追加プロパティ：**

| プロパティ | 説明 |
|----------|-------------|
| `column_separator` | 列区切り文字。デフォルトは `,` です |
| `line_delimiter` | 行区切り文字。デフォルトは `\n` です |
| `compress_type` | 圧縮形式。`gz`、`zstd`、`lz4`、`snappy` に対応します |

**例 1：CSV を HDFS にエクスポートする**

```sql
INSERT INTO hdfs(
    "file_path" = "/tmp/export/csv_data_",
    "format" = "csv",
    "column_separator" = ",",
    "hadoop.username" = "doris",
    "fs.defaultFS" = "hdfs://namenode:8020",
    "delete_existing_files" = "true"
)
SELECT * FROM my_table ORDER BY id;
```

**例 2：Parquet を S3 にエクスポートする**

```sql
INSERT INTO s3(
    "uri" = "s3://bucket/export/parquet_data_",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "format" = "parquet"
)
SELECT * FROM my_table WHERE dt = '2024-01-01';
```

**例 3：ORC を S3 にエクスポートする**

```sql
INSERT INTO s3(
    "uri" = "s3://bucket/export/orc_data_",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "format" = "orc",
    "delete_existing_files" = "true"
)
SELECT c_int, c_varchar, c_string FROM my_table WHERE c_int IS NOT NULL ORDER BY c_int;
```

**例 4：CSV をローカル BE ノードにエクスポートする**

```sql
INSERT INTO local(
    "file_path" = "/tmp/export/local_csv_",
    "backend_id" = "10001",
    "format" = "csv"
)
SELECT * FROM my_table ORDER BY id;
```

:::note
- `file_path` はファイル名のプレフィックスです。実際に生成されるファイル名の形式は `{prefix}{query_id}_{idx}.{ext}` で、`idx` は 0 から始まり、順に増加します。
- `local` TVF を使用する場合は、`backend_id` でファイルの書き込み先となる BE ノードを指定する必要があります。
- `delete_existing_files` を使用すると、書き込み前に `file_path` があるディレクトリ内のすべてのファイルが削除されます。注意して使用してください。
- `INSERT INTO TVF` の実行には ADMIN 権限または LOAD 権限が必要です。
- S3 TVF では、`file_path` プロパティは `uri` プロパティに相当します。
:::

## 主な機能

### 複数ファイルのマッチング

ファイルパス（URI）にはワイルドカードや範囲パターンを使用でき、複数のファイルにマッチさせることができます。

| パターン | 例 | マッチするファイル |
|---------|---------|--------------|
| `*` | `file_*` | `file_` で始まるすべてのファイル |
| `{n..m}` | `file_{1..3}` | `file_1`, `file_2`, `file_3` |
| `{a,b,c}` | `file_{a,b}` | `file_a`, `file_b` |

### Resource を使用して設定を簡素化する

TVF では、`resource` プロパティを使って事前に作成した S3 または HDFS の Resource を参照できます。これにより、クエリごとに接続情報を繰り返し指定する必要がなくなります。

**1. Resource を作成する**

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

**2. TVF で Resource を使用する**

```sql
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    'resource' = 's3_resource'
);
```

:::tip
- Resource のプロパティはデフォルト値として使用されます。TVF で同名のプロパティを指定した場合は、その値が Resource の値より優先されます
- Resource を使用すると接続情報を一元管理でき、保守と権限管理が容易になります
:::

### スキーマの自動推論

`DESC FUNCTION` 構文を使用すると、TVF によって自動推論されたスキーマを確認できます。

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

**スキーマの推論規則：**

| ファイル形式 | 推論方法 |
|-------------|------------------|
| Parquet、ORC | ファイルのメタデータからスキーマを自動取得します |
| CSV、JSON | データの先頭行を解析してスキーマを取得します。列のデフォルトの型は `string` です |
| 複数ファイルのマッチング | 最初のファイルのスキーマを使用します |

### 列の型を手動で指定する（CSV/JSON）

CSV と JSON 形式では、`csv_schema` プロパティを使用して、`name1:type1;name2:type2;...` の形式で列名と型を手動指定できます。

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

**対応する列の型：**

| 整数型 | 浮動小数点型 | その他の型 |
|---------------|----------------------|-------------|
| tinyint | float | decimal(p,s) |
| smallint | double | date |
| int | | datetime |
| bigint | | char |
| largeint | | varchar |
| | | string |
| | | boolean |
| | | uuid |

UUID 列には `"csv_schema" = "id:int;u:uuid"` のようなスキーマを指定します。値には標準形式またはハイフンを省略した十六進数の UUID テキストを使用できます。CSV/JSON のスキーマ推論では UUID は自動的に識別されません。入力規則については [UUID 型](../sql-manual/basic-element/sql-data-types/uuid.md) を参照してください。

:::note
- 列の型が一致しない場合（例：ファイルには文字列が含まれるが `int` を指定した場合）、その列は `null` を返します
- 列数が一致しない場合（例：ファイルには 4 列あるが 5 列を指定した場合）、不足している列は `null` を返します
:::

## 注意事項

| 状況 | 動作 |
|----------|----------|
| `uri` に一致するファイルがない、またはすべてのファイルが空 | TVF は空の結果セットを返します。`DESC FUNCTION` でスキーマを確認すると、プレースホルダー列 `__dummy_col` が表示されます |
| CSV ファイルの先頭行が空（ファイル自体は空ではない） | エラーメッセージ：`The first line is empty, can not parse column numbers` |
