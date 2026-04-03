---
{
  "title": "HTTP",
  "language": "ja",
  "description": "Apache Doris HTTPテーブル値関数（TVF）は、REST APIレスポンス、リモートデータファイル、Hugging Faceデータセットを含む、任意のHTTP/HTTPSエンドポイントデータに対する直接的なSQLクエリを可能にします。JSON、CSV、Parquet、ORC形式の解析をサポートします。"
}
---
HTTP table-valued-function (TVF) を使用すると、ユーザーはHTTPエンドポイントから返されるデータを、リレーショナルテーブル形式のデータにアクセスするかのように読み取ることができます。返されるデータがサポートされている形式である限り、SQLを介して直接クエリおよび分析できます。現在、`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` データ形式をサポートしています。

典型的な使用例には以下があります：

- HTTP/HTTPSでホストされているデータファイルのクエリ（GitHub、S3など）。
- JSON形式のデータを返すHTTP APIエンドポイントの直接クエリ。
- Hugging Faceでホストされているデータセットへのアクセス。

:::note
バージョン4.0.2以降でサポートされています。
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

| Parameter         | Description                  |
|-------------------|------------------------------|
| uri               | アクセスするHTTPアドレス。`http`、`https`、`hf`プロトコルをサポート。データファイルへのURLまたはデータを返すAPIエンドポイントを指定可能。 |
| format            | データ形式、つまりHTTPエンドポイントが返すコンテンツの解析方法。`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`をサポート。 |

`hf://`（Hugging Face）については、[Analyzing Hugging Face Data](../../../lakehouse/huggingface.md)を参照してください。

### オプションパラメータ

| Parameter      | Description    | Notes    |
|-------|-----------|------------------------|
| `http.header.xxx`  | 任意のHTTP Headerを指定するために使用され、HTTP Clientに直接渡される。 | 例：`"http.header.Authorization" = "Bearer hf_MWYzOJJoZEymb..."`の場合、結果のHeaderは`Authorization: Bearer hf_MWYzOJJoZEymb...`となる |
| `http.enable.range.request` | HTTPサービスへのアクセスにrange requestを使用するかどうか。デフォルトは`true`。 | |
| `http.max.request.size.bytes` | non-range requestモード使用時の最大アクセスサイズ制限。デフォルトは100 MB。 | |

`http.enable.range.request`が`true`の場合、システムは最初にrange requestを使用してHTTPサービスへのアクセスを試行します。HTTPサービスがrange requestをサポートしていない場合、自動的にnon-range requestモードにフォールバックします。データアクセスの最大サイズは`http.max.request.size.bytes`によって制限されます。

## 例

### HTTP経由でのデータファイルの読み込み

- GitHubからCSVデータを読み込み

    ```sql
    SELECT COUNT(*) FROM
    HTTP(
        "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/load_p0/http_stream/all_types.csv",
        "format" = "csv",
        "column_separator" = ","
    );
    ```
- GitHubからParquetデータを読み取る

    ```sql
    SELECT arr_map, id FROM
    HTTP(
        "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/external_table_p0/tvf/t.parquet",
        "format" = "parquet"
    );
    ```
- GitHubからJSONデータを読み取り、`DESC FUNCTION`を使用してスキーマを表示する

    ```sql
    DESC FUNCTION
    HTTP(
        "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/load_p0/stream_load/basic_data.json",
        "format" = "json",
        "strip_outer_array" = "true"
    );
    ```
### HTTP API エンドポイントのクエリ

HTTP table function を使用して、JSON形式のデータを返すHTTP APIエンドポイントに直接クエリを実行できます。例えば、JSONデータを返すREST APIにクエリを実行する場合：

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
Range RequestsをサポートしていないHTTP APIエンドポイントの場合、システムは自動的に非Range Requestモードにフォールバックします。`http.enable.range.request`パラメータを使用してRange Requestsを手動で無効にすることができます。
:::
