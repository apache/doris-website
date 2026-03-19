---
{
  "title": "ファイルパスパターン",
  "language": "ja",
  "description": "DorisがS3、HDFS、その他のオブジェクトストレージなどのリモートストレージシステム内のファイルにアクセスする際にサポートするファイルパスパターンとワイルドカード。"
}
---
## 説明

リモートストレージシステム（S3、HDFS、その他のS3互換オブジェクトストレージ）からファイルにアクセスする際、Dorisはワイルドカードや範囲表現を含む柔軟なファイルパスパターンをサポートします。このドキュメントでは、サポートされているパス形式とパターンマッチング構文について説明します。

これらのパスパターンは以下でサポートされています：
- [S3 TVF](../sql-functions/table-valued-functions/s3)
- [HDFS TVF](../sql-functions/table-valued-functions/hdfs)
- [Broker Load](../../data-operate/import/import-way/broker-load-manual)
- INSERT INTO SELECT from TVF

## サポートされているURI形式

### S3スタイルURI

| スタイル | 形式 | 例 |
|-------|--------|---------|
| AWS Client Style (Hadoop S3) | `s3://bucket/path/to/file` | `s3://my-bucket/data/file.csv` |
| S3A Style | `s3a://bucket/path/to/file` | `s3a://my-bucket/data/file.csv` |
| S3N Style | `s3n://bucket/path/to/file` | `s3n://my-bucket/data/file.csv` |
| Virtual Host Style | `https://bucket.endpoint/path/to/file` | `https://my-bucket.s3.us-west-1.amazonaws.com/data/file.csv` |
| Path Style | `https://endpoint/bucket/path/to/file` | `https://s3.us-west-1.amazonaws.com/my-bucket/data/file.csv` |

### その他のクラウドストレージURI

| プロバイダー | スキーム | 例 |
|----------|--------|---------|
| Alibaba Cloud OSS | `oss://` | `oss://my-bucket/data/file.csv` |
| Tencent Cloud COS | `cos://`, `cosn://` | `cos://my-bucket/data/file.csv` |
| Baidu Cloud BOS | `bos://` | `bos://my-bucket/data/file.csv` |
| Huawei Cloud OBS | `obs://` | `obs://my-bucket/data/file.csv` |
| Google Cloud Storage | `gs://` | `gs://my-bucket/data/file.csv` |
| Azure Blob Storage | `azure://` | `azure://container/data/file.csv` |

### HDFS URI

| スタイル | 形式 | 例 |
|-------|--------|---------|
| 標準 | `hdfs://namenode:port/path/to/file` | `hdfs://namenode:8020/user/data/file.csv` |
| HAモード | `hdfs://nameservice/path/to/file` | `hdfs://my-ha-cluster/user/data/file.csv` |

## ワイルドカードパターン

Dorisはファイルパスにglob形式のパターンマッチングを使用します。以下のワイルドカードがサポートされています：

### 基本ワイルドカード

| パターン | 説明 | 例 | マッチする対象 |
|---------|-------------|---------|---------|
| `*` | パスセグメント内でゼロ個以上の文字にマッチ | `*.csv` | `file.csv`, `data.csv`, `a.csv` |
| `?` | 正確に1文字にマッチ | `file?.csv` | `file1.csv`, `fileA.csv`, ただし`file10.csv`は対象外 |
| `[abc]` | 角括弧内の任意の1文字にマッチ | `file[123].csv` | `file1.csv`, `file2.csv`, `file3.csv` |
| `[a-z]` | 範囲内の任意の1文字にマッチ | `file[a-c].csv` | `filea.csv`, `fileb.csv`, `filec.csv` |
| `[!abc]` | 角括弧内にない任意の1文字にマッチ | `file[!0-9].csv` | `filea.csv`, `fileb.csv`, ただし`file1.csv`は対象外 |

### 範囲展開（波括弧パターン）

Dorisは波括弧パターン`{start..end}`を使用した数値範囲展開をサポートします：

| パターン | 展開 | マッチする対象 |
|---------|-----------|---------|
| `{1..3}` | `{1,2,3}` | `1`, `2`, `3` |
| `{01..05}` | `{1,2,3,4,5}` | `1`, `2`, `3`, `4`, `5`（先頭のゼロは保持されません） |
| `{3..1}` | `{1,2,3}` | `1`, `2`, `3`（逆順範囲サポート） |
| `{a,b,c}` | `{a,b,c}` | `a`, `b`, `c`（列挙） |
| `{1..3,5,7..9}` | `{1,2,3,5,7,8,9}` | 範囲と値の混在 |

:::caution 注意
- Dorisは可能な限り多くのファイルをマッチさせようとします。波括弧表現の無効な部分は静かにスキップされ、有効な部分は引き続き展開されます。例えば、`file_{a..b,-1..3,4..5}`は`file_4`と`file_5`にマッチします（無効な`a..b`と負の範囲`-1..3`はスキップされますが、`4..5`は正常に展開されます）。
- 範囲全体が負の場合（例：`{-1..2}`）、その範囲はスキップされます。有効な範囲と混在している場合（例：`{-1..2,1..3}`）、有効な範囲`1..3`のみが展開されます。
- 範囲でカンマ区切り値を使用する場合、数値のみが許可されます。例えば、`{1..4,a}`では、非数値の`a`は無視され、結果として`{1,2,3,4}`となります。
- `{a,b,c}`のような（`..`範囲を含まない）純粋な列挙パターンは、直接globマッチングに渡され、期待通りに動作します。
:::

### パターンの組み合わせ

複数のパターンを単一のパスで組み合わせることができます：

```
s3://bucket/data_{1..3}/file_*.csv
```
これは以下にマッチします：
- `s3://bucket/data_1/file_a.csv`
- `s3://bucket/data_1/file_b.csv`
- `s3://bucket/data_2/file_a.csv`
- ... など

## 例

### S3 TVF の例

**ディレクトリ内のすべてのCSVファイルにマッチ：**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/data/*.csv",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "csv"
);
```
**数値範囲でファイルをマッチ:**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/logs/data_{1..10}.csv",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "csv"
);
```
**日付でパーティション分けされたディレクトリ内のファイルをマッチ:**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/logs/year=2024/month=*/day=*/data.parquet",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "parquet"
);
```
:::caution ゼロパディングされたディレクトリ
`month=01`、`month=02`のようなゼロパディングされたディレクトリ名の場合は、範囲パターンではなくワイルドカード（`*`）を使用してください。パターン`{01..12}`は`{1,2,...,12}`に展開されるため、`month=01`にマッチしません。
:::

**番号付きファイル分割のマッチ（例：Spark出力）：**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/output/part-{00000..00099}.csv",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "csv"
);
```
### Broker Load の例

**パターンにマッチするすべてのCSVファイルを読み込む:**

```sql
LOAD LABEL db.label_wildcard
(
    DATA INFILE("s3://my-bucket/data/file_*.csv")
    INTO TABLE my_table
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (col1, col2, col3)
)
WITH S3 (
    "provider" = "S3",
    "AWS_ENDPOINT" = "s3.us-west-2.amazonaws.com",
    "AWS_ACCESS_KEY" = "xxx",
    "AWS_SECRET_KEY" = "xxx",
    "AWS_REGION" = "us-west-2"
);
```
**数値範囲展開を使用してファイルを読み込む:**

```sql
LOAD LABEL db.label_range
(
    DATA INFILE("s3://my-bucket/exports/data_{1..5}.csv")
    INTO TABLE my_table
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (col1, col2, col3)
)
WITH S3 (
    "provider" = "S3",
    "AWS_ENDPOINT" = "s3.us-west-2.amazonaws.com",
    "AWS_ACCESS_KEY" = "xxx",
    "AWS_SECRET_KEY" = "xxx",
    "AWS_REGION" = "us-west-2"
);
```
**ワイルドカードを使用してHDFSから読み込む:**

```sql
LOAD LABEL db.label_hdfs_wildcard
(
    DATA INFILE("hdfs://namenode:8020/user/data/2024-*/*.csv")
    INTO TABLE my_table
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (col1, col2, col3)
)
WITH HDFS (
    "fs.defaultFS" = "hdfs://namenode:8020",
    "hadoop.username" = "user"
);
```
**数値範囲でHDFSから読み込み:**

```sql
LOAD LABEL db.label_hdfs_range
(
    DATA INFILE("hdfs://namenode:8020/data/file_{1..3,5,7..9}.csv")
    INTO TABLE my_table
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (col1, col2, col3)
)
WITH HDFS (
    "fs.defaultFS" = "hdfs://namenode:8020",
    "hadoop.username" = "user"
);
```
### INSERT INTO SELECT の例

**ワイルドカードを使用したS3からの挿入:**

```sql
INSERT INTO my_table (col1, col2, col3)
SELECT * FROM S3(
    "uri" = "s3://my-bucket/data/part-*.parquet",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "parquet"
);
```
## パフォーマンスに関する考慮事項

### 具体的なプレフィックスを使用する

Dorisはパスパターンから最長の非ワイルドカードプレフィックスを抽出し、S3/HDFSリスト操作を最適化します。より具体的なプレフィックスを使用することで、ファイル検出が高速化されます。

```sql
-- Good: specific prefix reduces listing scope
"uri" = "s3://bucket/data/2024/01/15/*.csv"

-- Less optimal: broad wildcard at early path segment
"uri" = "s3://bucket/data/**/file.csv"
```
### 既知のシーケンスには範囲パターンを優先する

正確なファイル番号付けがわかっている場合は、ワイルドカードの代わりに範囲パターンを使用してください：

```sql
-- Better: explicit range
"uri" = "s3://bucket/data/part-{0001..0100}.csv"

-- Less optimal: wildcard matches unknown files
"uri" = "s3://bucket/data/part-*.csv"
```
### 深い再帰ワイルドカードの回避

`**`のような深い再帰パターンは、大きなバケットでファイルリストの処理が遅くなる原因となります：

```sql
-- Avoid when possible
"uri" = "s3://bucket/**/*.csv"

-- Prefer explicit path structure
"uri" = "s3://bucket/data/year=*/month=*/day=*/*.csv"
```
## トラブルシューティング

| 問題 | 原因 | 解決方法 |
|-------|-------|----------|
| ファイルが見つからない | パターンがファイルにマッチしない | パスとパターンの構文を確認し、まず単一ファイルでテストする |
| ファイル一覧の処理が遅い | ワイルドカードが広範囲すぎるか、ファイル数が多すぎる | より具体的なプレフィックスを使用し、ワイルドカードのスコープを制限する |
| 無効なURIエラー | パス構文の形式が不正 | URIスキームとバケット名の形式を確認する |
| アクセス拒否 | 認証情報または権限の問題 | S3/HDFSの認証情報とバケットポリシーを確認する |

### パスパターンのテスト

大規模なロードジョブを実行する前に、限定的なクエリでパターンをテストしてください：

```sql
-- Test if files exist and match pattern
SELECT * FROM S3(
    "uri" = "s3://bucket/your/pattern/*.csv",
    ...
) LIMIT 1;
```
一致したファイルのスキーマを検証するには `DESC FUNCTION` を使用します：

```sql
DESC FUNCTION S3(
    "uri" = "s3://bucket/your/pattern/*.csv",
    ...
);
```
