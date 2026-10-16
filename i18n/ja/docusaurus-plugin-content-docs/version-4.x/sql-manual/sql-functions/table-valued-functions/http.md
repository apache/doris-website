---
{
    "title": "HTTP",
    "language": "ja",
    "description": "Apache Doris の HTTP テーブル値関数（TVF）を使用すると、REST API のレスポンス、リモートデータファイル、Hugging Face のデータセットなど、任意の HTTP/HTTPS エンドポイントのデータを SQL で直接クエリできます。JSON、CSV、Parquet、ORC 形式の解析に対応します。"
}
---

HTTP テーブル値関数（TVF）を使用すると、任意の HTTP エンドポイントから返されたデータを、リレーショナルテーブルのデータのように読み取れます。返されたデータが対応形式であれば、SQL で直接クエリおよび分析できます。現在、`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` のデータ形式に対応しています。

主な用途は次のとおりです。

- HTTP/HTTPS 上でホストされているデータファイル（GitHub、S3 など）をクエリする。
- JSON 形式のデータを返す HTTP API エンドポイントを直接クエリする。
- Hugging Face 上でホストされているデータセットにアクセスする。

:::note
バージョン 4.0.2 以降でサポートされています。
:::

## 構文

```sql
HTTP(
    "uri" = "<uri>",
    "format" = "<format>"
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
  )
```

### 必須パラメータ

| パラメータ         | 説明                  |
|-------------------|------------------------------|
| uri               | アクセス先の HTTP アドレスです。`http`、`https`、`hf` プロトコルに対応します。データファイルの URL、またはデータを返す API エンドポイントを指定できます。 |
| format            | HTTP エンドポイントから返された内容を解析するデータ形式です。`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` に対応します。 |

`hf://`（Hugging Face）については、[Hugging Face データの分析](../../../lakehouse/huggingface.md)を参照してください。

### オプションパラメータ

| パラメータ      | 説明    | 備考    |
|-------|-----------|------------------------|
| `http.header.xxx`  | 任意の HTTP ヘッダーを指定し、HTTP クライアントにそのまま渡します。 | 例：`"http.header.Authorization" = "Bearer hf_MWYzOJJoZEymb..."` を指定すると、ヘッダーは `Authorization: Bearer hf_MWYzOJJoZEymb...` になります。 |
| `http.enable.range.request` | HTTP サービスへのアクセスに範囲リクエストを使用するかどうかを指定します。デフォルトは `true` です。 | |
| `http.max.request.size.bytes` | 範囲リクエストを使用しないモードでの最大アクセスサイズです。デフォルトは 100 MB です。 | |

`http.enable.range.request` が `true` の場合、システムは最初に範囲リクエストで HTTP サービスへのアクセスを試みます。HTTP サービスが範囲リクエストに対応していない場合は、自動的に範囲リクエストを使用しないモードに切り替わります。アクセスできるデータの最大サイズは `http.max.request.size.bytes` によって制限されます。

## 例

### HTTP 経由でデータファイルを読み取る

- GitHub 上の CSV データを読み取る

    ```sql
    SELECT COUNT(*) FROM
    HTTP(
        "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/load_p0/http_stream/all_types.csv",
        "format" = "csv",
        "column_separator" = ","
    );
    ```

- GitHub 上の Parquet データを読み取る

    ```sql
    SELECT arr_map, id FROM
    HTTP(
        "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/external_table_p0/tvf/t.parquet",
        "format" = "parquet"
    );
    ```

- GitHub 上の JSON データを読み取り、`DESC FUNCTION` でスキーマを確認する

    ```sql
    DESC FUNCTION
    HTTP(
        "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/load_p0/stream_load/basic_data.json",
        "format" = "json",
        "strip_outer_array" = "true"
    );
    ```

### HTTP API エンドポイントをクエリする

HTTP テーブル関数を使用すると、JSON 形式のデータを返す HTTP API エンドポイントを直接クエリできます。たとえば、JSON データを返す REST API は次のようにクエリします。

```sql
SELECT * FROM
HTTP(
    "uri" = "https://api.example.com/v1/data",
    "format" = "json",
    "http.header.Authorization" = "Bearer your_token",
    "strip_outer_array" = "true"
);
```

:::tip
範囲リクエストに対応していない HTTP API エンドポイントでは、システムは自動的に範囲リクエストを使用しないモードに切り替わります。`http.enable.range.request` パラメータを使用して、範囲リクエストを手動で無効にすることもできます。
:::
