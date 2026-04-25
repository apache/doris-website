---
{
    "title": "HTTP",
    "language": "en",
    "description": "Apache Doris HTTP table-valued function (TVF) enables direct SQL queries on any HTTP/HTTPS endpoint data, including REST API responses, remote data files, and Hugging Face datasets. Supports JSON, CSV, Parquet, ORC format parsing."
}
---

HTTP table-valued-function (TVF) allows users to read data returned from any HTTP endpoint as if accessing relational table format data. As long as the returned data is in a supported format, it can be queried and analyzed directly via SQL. Currently supports `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` data formats.

Typical use cases include:

- Querying data files hosted on HTTP/HTTPS (e.g., GitHub, S3, etc.).
- Directly querying HTTP API endpoints that return JSON-formatted data.
- Accessing datasets hosted on Hugging Face.

:::note
Supported since version 4.0.2.
:::

## Syntax

```sql
HTTP(
    "uri" = "<uri>",
    "format" = "<format>"
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
  )
```

### Required Parameters

| Parameter         | Description                  |
|-------------------|------------------------------|
| uri               | The HTTP address to access. Supports `http`, `https`, and `hf` protocols. Can be a URL to a data file or an API endpoint that returns data. |
| format            | Data format, i.e., how the content returned by the HTTP endpoint is parsed. Supports `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`. |

For `hf://` (Hugging Face), please refer to [Analyzing Hugging Face Data](../../../lakehouse/huggingface.md).

### Optional Parameters

| Parameter      | Description    | Notes    |
|-------|-----------|------------------------|
| `http.header.xxx`  | Used to specify arbitrary HTTP Headers, which are passed directly to the HTTP Client. | e.g., `"http.header.Authorization" = "Bearer hf_MWYzOJJoZEymb..."`, the resulting Header will be `Authorization: Bearer hf_MWYzOJJoZEymb...` |
| `http.enable.range.request` | Whether to use range requests to access the HTTP service. Default is `true`. | |
| `http.max.request.size.bytes` | Maximum access size limit when using non-range request mode. Default is 100 MB. | |

When `http.enable.range.request` is `true`, the system will first attempt to access the HTTP service using range requests. If the HTTP service does not support range requests, it will automatically fall back to non-range request mode. The maximum data access size is limited by `http.max.request.size.bytes`.

## Examples

### Reading Data Files over HTTP

- Read CSV data from GitHub

    ```sql
    SELECT COUNT(*) FROM
    HTTP(
        "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/load_p0/http_stream/all_types.csv",
        "format" = "csv",
        "column_separator" = ","
    );
    ```

- Read Parquet data from GitHub

    ```sql
    SELECT arr_map, id FROM
    HTTP(
        "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/external_table_p0/tvf/t.parquet",
        "format" = "parquet"
    );
    ```

- Read JSON data from GitHub and use `DESC FUNCTION` to view the schema

    ```sql
    DESC FUNCTION
    HTTP(
        "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/load_p0/stream_load/basic_data.json",
        "format" = "json",
        "strip_outer_array" = "true"
    );
    ```

### Querying HTTP API Endpoints

You can use the HTTP table function to directly query HTTP API endpoints that return JSON-formatted data. For example, querying a REST API that returns JSON data:

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
For HTTP API endpoints that do not support Range Requests, the system will automatically fall back to non-Range Request mode. You can manually disable Range Requests via the `http.enable.range.request` parameter.
:::
