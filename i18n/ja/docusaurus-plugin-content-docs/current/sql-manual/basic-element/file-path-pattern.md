---
{
    "title": "ファイルパスパターン",
    "language": "ja",
    "description": "S3、HDFS、その他のオブジェクトストレージなど、リモートストレージのファイルにアクセスする際に Doris がサポートするファイルパスパターンとワイルドカード。"
}
---

## 説明

リモートストレージ（S3、HDFS、その他の S3 互換オブジェクトストレージ）上のファイルにアクセスする際、Doris はワイルドカードや範囲式を含む柔軟なファイルパスパターンをサポートします。このドキュメントでは、サポートされるパス形式とパターンマッチング構文を説明します。

これらのパスパターンは、次の機能で使用できます。
- [S3 TVF](../sql-functions/table-valued-functions/s3)
- [HDFS TVF](../sql-functions/table-valued-functions/hdfs)
- [Broker Load](../../data-operate/import/import-way/broker-load-manual)
- TVF からの INSERT INTO SELECT

## サポートされる URI 形式

### S3 形式の URI

| 形式 | 書式 | 例 |
|-------|--------|---------|
| AWS クライアント形式（Hadoop S3） | `s3://bucket/path/to/file` | `s3://my-bucket/data/file.csv` |
| S3A 形式 | `s3a://bucket/path/to/file` | `s3a://my-bucket/data/file.csv` |
| S3N 形式 | `s3n://bucket/path/to/file` | `s3n://my-bucket/data/file.csv` |
| 仮想ホスト形式 | `https://bucket.endpoint/path/to/file` | `https://my-bucket.s3.us-west-1.amazonaws.com/data/file.csv` |
| パス形式 | `https://endpoint/bucket/path/to/file` | `https://s3.us-west-1.amazonaws.com/my-bucket/data/file.csv` |

### その他のクラウドストレージ URI

| プロバイダー | スキーム | 例 |
|----------|--------|---------|
| Alibaba Cloud OSS | `oss://` | `oss://my-bucket/data/file.csv` |
| Tencent Cloud COS | `cos://`, `cosn://` | `cos://my-bucket/data/file.csv` |
| Baidu Cloud BOS | `bos://` | `bos://my-bucket/data/file.csv` |
| Huawei Cloud OBS | `obs://` | `obs://my-bucket/data/file.csv` |
| Google Cloud Storage | `gs://` | `gs://my-bucket/data/file.csv` |
| Azure Blob Storage | `azure://` | `azure://container/data/file.csv` |

### HDFS URI

| 形式 | 書式 | 例 |
|-------|--------|---------|
| 標準形式 | `hdfs://namenode:port/path/to/file` | `hdfs://namenode:8020/user/data/file.csv` |
| HA モード | `hdfs://nameservice/path/to/file` | `hdfs://my-ha-cluster/user/data/file.csv` |

## ワイルドカードパターン

Doris はファイルパスの照合に glob 形式のパターンマッチングを使用します。次のワイルドカードをサポートします。

### 基本的なワイルドカード

| パターン | 説明 | 例 | 一致するファイル |
|---------|-------------|---------|---------|
| `*` | パス区切り間のゼロ文字以上に一致 | `*.csv` | `file.csv`、`data.csv`、`a.csv` |
| `?` | ちょうど一文字に一致 | `file?.csv` | `file1.csv`、`fileA.csv`。`file10.csv` には一致しない |
| `[abc]` | 角括弧内のいずれか一文字に一致 | `file[123].csv` | `file1.csv`、`file2.csv`、`file3.csv` |
| `[a-z]` | 指定した範囲のいずれか一文字に一致 | `file[a-c].csv` | `filea.csv`、`fileb.csv`、`filec.csv` |
| `[!abc]` | 角括弧内にない一文字に一致 | `file[!0-9].csv` | `filea.csv`、`fileb.csv`。`file1.csv` には一致しない |

### 範囲展開（波括弧パターン）

Doris は波括弧パターン `{start..end}` による数値範囲の展開をサポートします。

| パターン | 展開結果 | 一致する値 |
|---------|-----------|---------|
| `{1..3}` | `{1,2,3}` | `1`、`2`、`3` |
| `{01..05}` | `{1,2,3,4,5}` | `1`、`2`、`3`、`4`、`5`（先頭のゼロは保持されない） |
| `{3..1}` | `{1,2,3}` | `1`、`2`、`3`（逆順の範囲もサポート） |
| `{a,b,c}` | `{a,b,c}` | `a`、`b`、`c`（列挙） |
| `{1..3,5,7..9}` | `{1,2,3,5,7,8,9}` | 範囲と値の組み合わせ |

:::caution 注意
- Doris はできるだけ多くのファイルに一致させようとします。波括弧式内の無効な部分は通知なくスキップされ、有効な部分は展開されます。たとえば、`file_{a..b,-1..3,4..5}` は `file_4` と `file_5` に一致します（無効な `a..b` と負の範囲 `-1..3` はスキップされますが、`4..5` は通常どおり展開されます）。
- 範囲全体が負の場合（例：`{-1..2}`）、その範囲はスキップされます。有効な範囲と組み合わせた場合（例：`{-1..2,1..3}`）、有効な範囲 `1..3` のみが展開されます。
- コンマ区切りの値と範囲を併用する場合、数値のみが使用できます。たとえば、`{1..4,a}` では数値でない `a` が無視され、結果は `{1,2,3,4}` になります。
- `{a,b,c}` のような純粋な列挙パターン（`..` による範囲を含まないもの）は、そのまま glob マッチングに渡され、期待どおりに動作します。
:::

### パターンの組み合わせ

ひとつのパスに複数のパターンを組み合わせることができます。

```
s3://bucket/data_{1..3}/file_*.csv
```

次のパスに一致します。
- `s3://bucket/data_1/file_a.csv`
- `s3://bucket/data_1/file_b.csv`
- `s3://bucket/data_2/file_a.csv`
- ... など

## 例

### S3 TVF の例

**ディレクトリ内のすべての CSV ファイルに一致させる：**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/data/*.csv",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "csv"
);
```

**数値範囲に一致するファイルを検索する：**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/logs/data_{1..10}.csv",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "csv"
);
```

**日付でパーティション分割されたディレクトリ内のファイルに一致させる：**

```sql
SELECT * FROM S3(
    "uri" = "s3://my-bucket/logs/year=2024/month=*/day=*/data.parquet",
    "s3.access_key" = "xxx",
    "s3.secret_key" = "xxx",
    "s3.region" = "us-east-1",
    "format" = "parquet"
);
```

:::caution ゼロ埋めされたディレクトリ
`month=01`、`month=02` のようなゼロ埋めされたディレクトリ名には、範囲パターンではなくワイルドカード（`*`）を使用してください。`{01..12}` は `{1,2,...,12}` に展開されるため、`month=01` には一致しません。
:::

**番号付きの分割ファイル（Spark の出力など）に一致させる：**

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

**パターンに一致するすべての CSV ファイルをロードする：**

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
    "AWS_ENDPOINT" = "https://s3.us-west-2.amazonaws.com",
    "AWS_ACCESS_KEY" = "xxx",
    "AWS_SECRET_KEY" = "xxx",
    "AWS_REGION" = "us-west-2"
);
```

**数値範囲を展開してファイルをロードする：**

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
    "AWS_ENDPOINT" = "https://s3.us-west-2.amazonaws.com",
    "AWS_ACCESS_KEY" = "xxx",
    "AWS_SECRET_KEY" = "xxx",
    "AWS_REGION" = "us-west-2"
);
```

**ワイルドカードを使用して HDFS からロードする：**

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

**数値範囲を使用して HDFS からロードする：**

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

**ワイルドカードを使用して S3 から挿入する：**

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

## パフォーマンス上の考慮事項

### 具体的なプレフィックスを使用する

Doris はパスパターンからワイルドカードを含まない最長のプレフィックスを抽出し、S3/HDFS のファイル一覧取得を最適化します。プレフィックスをより具体的にすると、ファイルをより速く見つけられます。

```sql
-- Good: specific prefix reduces listing scope
"uri" = "s3://bucket/data/2024/01/15/*.csv"

-- Less optimal: broad wildcard at early path segment
"uri" = "s3://bucket/data/**/file.csv"
```

### 番号が決まっている場合は範囲パターンを優先する

ファイルの番号が正確にわかっている場合は、ワイルドカードの代わりに範囲パターンを使用します。

```sql
-- Better: explicit range
"uri" = "s3://bucket/data/part-{0001..0100}.csv"

-- Less optimal: wildcard matches unknown files
"uri" = "s3://bucket/data/part-*.csv"
```

### 深い階層に対する再帰的なワイルドカードを避ける

`**` のように深い階層を再帰的に探索するパターンは、大きなバケットではファイル一覧の取得が遅くなることがあります。

```sql
-- Avoid when possible
"uri" = "s3://bucket/**/*.csv"

-- Prefer explicit path structure
"uri" = "s3://bucket/data/year=*/month=*/day=*/*.csv"
```

## トラブルシューティング

| 問題 | 原因 | 対処方法 |
|-------|-------|----------|
| ファイルが見つからない | パターンに一致するファイルがない | パスとパターンの構文を確認し、まず単一のファイルで試す |
| ファイル一覧の取得が遅い | ワイルドカードの範囲が広すぎる、またはファイル数が多すぎる | より具体的なプレフィックスを使用し、ワイルドカードの範囲を限定する |
| 無効な URI エラー | パスの構文が正しくない | URI スキームとバケット名の形式を確認する |
| アクセスが拒否される | 認証情報または権限に問題がある | S3/HDFS の認証情報とバケットポリシーを確認する |

### パスパターンのテスト

大規模なロードジョブを実行する前に、結果を制限したクエリでパターンをテストします。

```sql
-- Test if files exist and match pattern
SELECT * FROM S3(
    "uri" = "s3://bucket/your/pattern/*.csv",
    ...
) LIMIT 1;
```

一致したファイルのスキーマを確認するには、`DESC FUNCTION` を使用します。

```sql
DESC FUNCTION S3(
    "uri" = "s3://bucket/your/pattern/*.csv",
    ...
);
```
