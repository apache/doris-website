---
{
  "title": "HTTP",
  "language": "en"
}
---

HTTP table-valued-function (tvf) allows users to read and access file content on HTTP paths as if accessing relational table format data. Currently supports `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` file formats.

:::note
Supported since 4.0.3
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
| uri               | HTTP address for access. Supports `http`, `https` and `hf` protocols.|
| format            | File format, supports `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` |

About `hf://`(Hugging Face), please see [Analyzing Hugging Face Data](../../../lakehouse/huggingface.md).

### Optional Parameters

| Parameter     | Description   | Notes    |
|-------|-----------|------------------------|
|  `http.header.xxx`  | Used to specify arbitrary HTTP Headers, which will be directly passed to the HTTP Client. For example `"http.header.Authorization" = "Bearer hf_MWYzOJJoZEymb..."`, the final Header will be `Authorization: Bearer hf_MWYzOJJoZEymb...` |
| `http.enable.range.request` | Whether to use range request to access HTTP service. Default is `true`.|
| `http.max.request.size.bytes` | Maximum access size limit when using non-range request mode. Default is 100MB |

When `http.enable.range.request` is `true`, the system will first try to access the HTTP service using range request. If the HTTP service does not support range request, it will automatically fall back to non-range request mode. And the maximum access data size is limited by `http.max.request.size.bytes`.

## Examples

- Read CSV data from GitHub

  ```sql
  SELECT COUNT(*) FROM
  HTTP(
      "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/load_p0/http_stream/all_types.csv",
      "format" = "csv",
      "column_separator" = ","
  );
  ```

- Access Parquet data from GitHub

  ```sql
  SELECT arr_map, id FROM
  HTTP(
      "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/external_table_p0/tvf/t.parquet",
      "format" = "parquet"
  );
  ```

- Access JSON data from GitHub and use with `desc function`

  ```sql
  DESC FUNCTION
  HTTP(
      "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/load_p0/stream_load/basic_data.json",
      "format" = "json",
      "strip_outer_array" = "true"
  );
  ```

