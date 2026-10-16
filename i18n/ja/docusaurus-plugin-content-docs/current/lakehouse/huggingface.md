---
{
    "title": "Hugging Face データの分析",
    "language": "ja",
    "description": "Apache Doris を使用して Hugging Face のデータセットを SQL で直接クエリし、分析する方法を説明します。CSV、Parquet、JSON 形式に対応し、ファイルをダウンロードせずに機械学習データを高速に取り込めます。"
}
---

[Hugging Face](https://huggingface.co/) は、機械学習モデル、データセット、その他のリソースを保存、共有し、共同で開発できるプラットフォームです。[Hugging Face Dataset](https://huggingface.co/datasets) のリポジトリには、CSV、Parquet、JSONL など、さまざまな形式のデータファイルを格納できます。

Doris では、[HTTP テーブル値関数](../sql-manual/sql-functions/table-valued-functions/http.md)を使用し、Hugging Face のデータセットに SQL で直接アクセスして分析できます。

:::note
この機能はバージョン 4.0.2 以降でサポートされています。
:::

## 機能

| 機能 | 説明 |
|---------|-------------|
| アクセスプロトコル | HTTP プロトコルを使用して Hugging Face Dataset にアクセスします |
| 型推論 | 型の自動推論をサポートします |
| 対応ファイル形式 | CSV、JSON、Parquet、ORC |
| データ操作 | `CREATE TABLE AS SELECT` と `INSERT INTO ... SELECT` をサポートします |

パラメータは File テーブル値関数と同じです。

## URI の構文

Hugging Face のデータセットにアクセスするための URI 形式は次のとおりです。

```
hf://datasets/<owner>/<repo>[@<branch>]/<path>
```

| 構成要素 | 説明 | 必須 |
|-----------|-------------|----------|
| `owner` | データセットの所有者 | はい |
| `repo` | データセットのリポジトリ名 | はい |
| `branch` | ブランチ名。デフォルトは `main` | いいえ |
| `path` | ファイルパス。ワイルドカードを使用できます | はい |

**ワイルドカードの説明：**

| ワイルドカード | 説明 | 例 |
|----------|-------------|---------|
| `*` | 単一のディレクトリ階層内の任意の文字列に一致します | `*/*.parquet` は直下の各サブディレクトリにあるすべての Parquet ファイルに一致します |
| `**` | 複数のディレクトリ階層に再帰的に一致します | `**/*.parquet` はすべての階層にある Parquet ファイルに一致します |
| `[...]` | 文字集合内の任意の一文字に一致します | `test-0000[0-9].parquet` は test-00000 から test-00009 までに一致します |

## ユースケース

### ケース 1：データをすばやくクエリする

ファイルをダウンロードせずに、Hugging Face の公開データセットを SQL で直接クエリします。

**例：** `fka/awesome-chatgpt-prompts` リポジトリの CSV データをクエリします。

```sql
SELECT COUNT(*) FROM
HTTP(
    "uri" = "hf://datasets/fka/awesome-chatgpt-prompts/blob/main/prompts.csv",
    "format" = "csv"
);
```

> 対応するデータファイル： https://huggingface.co/datasets/fka/awesome-chatgpt-prompts/blob/main/prompts.csv

**例：** ワイルドカードで複数のファイルに一致させ、`stanfordnlp/imdb` リポジトリの Parquet ファイルをクエリします。

```sql
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/stanfordnlp/imdb@main/*/*.parquet",
    "format" = "parquet"
) ORDER BY text LIMIT 1;
```

> 対応するデータファイル： https://huggingface.co/datasets/stanfordnlp/imdb/blob/main/plain_text/test-00000-of-00001.parquet

### ケース 2：ローカルテーブルにデータを取り込む

Hugging Face のデータセットを Doris のテーブルに取り込み、後で分析できるようにします。

**方法 1：** `CREATE TABLE AS SELECT` を使用して新しいテーブルを作成し、データを取り込みます。

```sql
CREATE TABLE hf_table AS
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/stanfordnlp/imdb@script/dataset_infos.json",
    "format" = "json"
);
```

> 対応するデータファイル： https://huggingface.co/datasets/stanfordnlp/imdb/blob/script/dataset_infos.json

**方法 2：** `INSERT INTO ... SELECT` を使用して既存のテーブルにデータを挿入します。

```sql
INSERT INTO hf_table
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/stanfordnlp/imdb@main/**/test-00000-of-0000[1].parquet",
    "format" = "parquet"
) ORDER BY text LIMIT 1;
```

> 対応するデータファイル： https://huggingface.co/datasets/stanfordnlp/imdb/blob/main/plain_text/test-00000-of-00001.parquet

### ケース 3：非公開データセットにアクセスする

認証が必要なデータセットにアクセスするには、リクエストにトークン認証を追加する必要があります。

**手順：**

1. Hugging Face アカウントにログインし、アクセストークン（`hf_` で始まるもの）を取得します。
2. SQL で `http.header.Authorization` プロパティを使用してトークンを渡します。

**例：**

```sql
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/gaia-benchmark/GAIA/blob/main/2023/validation/metadata.level1.parquet",
    "format" = "parquet",
    "http.header.Authorization" = "Bearer hf_MWYzOJJoZEymb..."
) LIMIT 1\G
```
