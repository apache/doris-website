---
{
  "title": "HTTP",
  "description": "HTTP table-valued-function (tvf) を使用することで、ユーザーはHTTPパス上のファイルコンテンツをリレーショナルtable形式のデータにアクセスするように読み取りおよびアクセスすることができます。",
  "language": "ja"
}
---
HTTPTable値関数（tvf）を使用すると、ユーザーはHTTPパス上のファイルコンテンツをリレーショナルtable形式のデータにアクセスするかのように読み取りおよびアクセスできます。現在、`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`ファイル形式をサポートしています。

:::note
4.0.2以降でサポート
:::

## Syntax

```sql
HTTP(
    "uri" = "<uri>",
    "format" = "<format>"
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
  )
```
### 必須パラメーター

| Parameter         | デスクリプション                  |
|-------------------|------------------------------|
| uri               | アクセス用のHTTPアドレス。`http`、`https`、`hf`プロトコルをサポートします。|
| format            | ファイル形式。`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`をサポートします。 |

`hf://`（Hugging Face）については、[Analyzing Hugging Face Data](../../../lakehouse/huggingface.md)を参照してください。

### オプションパラメーター

| Parameter     | デスクリプション   | 注釈    |
|-------|-----------|------------------------|
|  `http.header.xxx`  | 任意のHTTP Headerを指定するために使用され、HTTP Clientに直接渡されます。例：`"http.header.Authorization" = "Bearer hf_MWYzOJJoZEymb..."`の場合、最終的なHeaderは`Authorization: Bearer hf_MWYzOJJoZEymb...`になります。 |
| `http.enable.range.request` | HTTPサービスへのアクセスにrange requestを使用するかどうか。デフォルトは`true`です。|
| `http.max.request.size.bytes` | 非range requestモード使用時の最大アクセスサイズ制限。デフォルトは100MBです。 |

`http.enable.range.request`が`true`の場合、システムは最初にrange requestを使用してHTTPサービスへのアクセスを試みます。HTTPサービスがrange requestをサポートしていない場合、自動的に非range requestモードにフォールバックします。そして最大アクセスデータサイズは`http.max.request.size.bytes`によって制限されます。

## 例

- GitHubからCSVデータを読み取る

  ```sql
  SELECT COUNT(*) FROM
  HTTP(
      "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/load_p0/http_stream/all_types.csv",
      "format" = "csv",
      "column_separator" = ","
  );
  ```
- GitHubからParquetデータにアクセスする

  ```sql
  SELECT arr_map, id FROM
  HTTP(
      "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/external_table_p0/tvf/t.parquet",
      "format" = "parquet"
  );
  ```
- GitHubからJSONデータにアクセスし、`desc function`で使用する

  ```sql
  DESC FUNCTION
  HTTP(
      "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/load_p0/stream_load/basic_data.json",
      "format" = "json",
      "strip_outer_array" = "true"
  );
  ```
