---
{
  "title": "Hugging Faceデータの分析",
  "language": "ja",
  "description": "Hugging Face データセットを直接SQLでクエリ・分析するためのApache Dorisの使用方法を学ぶ。ダウンロード不要でCSV、Parquet、JSON形式をサポートし、機械学習データの高速インポートを可能にする。"
}
---
[Hugging Face](https://huggingface.co/)は、ユーザーが機械学習モデル、データセット、その他のリソースを保存、共有、共同構築できる人気の集中型プラットフォームです。[Hugging Face Dataset](https://huggingface.co/datasets)リポジトリには、CSV、Parquet、JSONLなど様々な形式のデータファイルが含まれている場合があります。

Dorisは[HTTP Table Valued Function](../sql-manual/sql-functions/table-valued-functions/http.md)を通じてSQLを使用して、Hugging Faceデータセットのデータに直接アクセスし、分析することができます。

:::note
この機能はバージョン4.0.2以降でサポートされています。
:::

## 機能

| 機能 | 説明 |
|---------|-------------|
| アクセスプロトコル | HTTPプロトコル経由でHugging Face Datasetにアクセス |
| 型推論 | 自動型推論をサポート |
| サポートされているファイル形式 | CSV、JSON、Parquet、ORC |
| データ操作 | `CREATE TABLE AS SELECT`と`INSERT INTO ... SELECT`をサポート |

パラメータはFile Table Valued Functionと同じです。

## URI構文

Hugging FaceデータセットにアクセスするためのURI形式は以下の通りです：

```
hf://datasets/<owner>/<repo>[@<branch>]/<path>
```
| Component | Description | Required |
|-----------|-------------|----------|
| `owner` | データセット所有者 | Yes |
| `repo` | データセットリポジトリ名 | Yes |
| `branch` | ブランチ名、デフォルトは `main` | No |
| `path` | ファイルパス、ワイルドカードをサポート | Yes |

**ワイルドカード説明:**

| Wildcard | Description | Example |
|----------|-------------|---------|
| `*` | 単一ディレクトリレベルで任意の文字にマッチ | `*/*.parquet`は第1レベルサブディレクトリ内のすべてのParquetファイルにマッチ |
| `**` | 複数のディレクトリレベルを再帰的にマッチ | `**/*.parquet`はすべてのレベルのParquetファイルにマッチ |
| `[...]` | 文字セット内の任意の単一文字にマッチ | `test-0000[0-9].parquet`はtest-00000からtest-00009にマッチ |

## 使用事例

### ケース1: 高速データクエリ

ファイルをダウンロードすることなく、SQLを使用してHugging Face上の公開データセットに直接クエリを実行します。

**例:** `fka/awesome-chatgpt-prompts`リポジトリからCSVデータをクエリ：

```sql
SELECT COUNT(*) FROM
HTTP(
    "uri" = "hf://datasets/fka/awesome-chatgpt-prompts/blob/main/prompts.csv",
    "format" = "csv"
);
```
> 対応するデータファイル: https://huggingface.co/datasets/fka/awesome-chatgpt-prompts/blob/main/prompts.csv

**例:** ワイルドカードを使用して複数のファイルにマッチさせ、`stanfordnlp/imdb`リポジトリからParquetファイルをクエリする:

```sql
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/stanfordnlp/imdb@main/*/*.parquet",
    "format" = "parquet"
) ORDER BY text LIMIT 1;
```
> 対応するデータファイル: https://huggingface.co/datasets/stanfordnlp/imdb/blob/main/plain_text/test-00000-of-00001.parquet

### ケース2: ローカルテーブルへのデータインポート

後続の分析のために、Hugging FaceデータセットをDorisテーブルにインポートします。

**方法1:** `CREATE TABLE AS SELECT`を使用して新しいテーブルを作成し、データをインポートする:

```sql
CREATE TABLE hf_table AS
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/stanfordnlp/imdb@script/dataset_infos.json",
    "format" = "json"
);
```
> 対応するデータファイル: https://huggingface.co/datasets/stanfordnlp/imdb/blob/script/dataset_infos.json

**方法 2:** `INSERT INTO ... SELECT`を使用して既存のテーブルにデータを挿入する：

```sql
INSERT INTO hf_table
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/stanfordnlp/imdb@main/**/test-00000-of-0000[1].parquet",
    "format" = "parquet"
) ORDER BY text LIMIT 1;
```
> 対応するデータファイル: https://huggingface.co/datasets/stanfordnlp/imdb/blob/main/plain_text/test-00000-of-00001.parquet

### ケース3: プライベートデータセットへのアクセス

認証が必要なデータセットの場合、リクエストにToken認証を追加する必要があります。

**手順:**

1. Hugging Faceアカウントにログインし、Access Token（`hf_`で始まる）を取得します。
2. SQLの`http.header.Authorization`プロパティを通じてTokenを渡します。

**例:**

```sql
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/gaia-benchmark/GAIA/blob/main/2023/validation/metadata.level1.parquet",
    "format" = "parquet",
    "http.header.Authorization" = "Bearer hf_MWYzOJJoZEymb..."
) LIMIT 1\G
```
