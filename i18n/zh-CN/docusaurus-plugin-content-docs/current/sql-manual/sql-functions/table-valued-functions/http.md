---
{
    "title": "HTTP",
    "language": "zh-CN",
    "description": "HTTP 表函数（table-valued-function,tvf），可以让用户像访问关系表格式数据一样，读取并访问 HTTP 路径上的文件内容。目前支持 csv/csvwithnames/csvwithnamesandtypes/json/parquet/orc 文件格式。"
}
---

HTTP 表函数（table-valued-function,tvf），可以让用户像访问关系表格式数据一样，读取并访问 HTTP 路径上的文件内容。目前支持 `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` 文件格式。

:::note
该函数自 4.0.2 版本支持。
:::

## 语法

```sql
HTTP(
    "uri" = "<uri>",
    "format" = "<format>"
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
  )
```

### 必选参数

| 参数              | 描述                         |
|-------------------|----------------------------|
| uri               | 用于访问的 HTTP 地址。支持 `http`，`https` he `hf` 协议。|
| format            | 文件格式，支持 `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` |


关于 `hf://`(Hugging Face), 请参阅 [Analyzing Hugging Face Data](../../../lakehouse/huggingface.md)。

### 可选参数

| 参数      | 描述    | 备注    |
|-------|-----------|------------------------|
|  `http.header.xxx`  | 用于指定任意的 HTTP Header，这些信息会直接透传给 HTTP Client。如 `"http.header.Authorization" = "Bearer hf_MWYzOJJoZEymb..."`，最终 Header 为 `Authorization: Bearer hf_MWYzOJJoZEymb...` |
| `http.enable.range.request` | 是否使用 range request 访问 HTTP 服务。默认为 `true`。|
| `http.max.request.size.bytes` | 当使用非 range request 方式访问时，最大访问大小限制。默认是 100MB |

当 `http.enable.range.request` 为 `true` 时，系统会优先尝试使用 range request 访问 HTTP 服务。如果 HTTP 服务不支持 range request，则会自动回退到非 range request 方式访问。并且最大访问数据量受到 `http.max.request.size.bytes` 限制。

## 示例

- 读取 github 上的 csv 数据

  ```sql
  SELECT COUNT(*) FROM
  HTTP(
      "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/load_p0/http_stream/all_types.csv",
      "format" = "csv",
      "column_separator" = ","
  );
  ```

- 访问 github 上的 parquet 数据

  ```sql
  SELECT arr_map, id FROM
  HTTP(
      "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/external_table_p0/tvf/t.parquet",
      "format" = "parquet"
  );
  ```

- 访问 github 上的 json 数据，并配合 `desc function` 使用

  ```sql
  DESC FUNCTION
  HTTP(
      "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/load_p0/stream_load/basic_data.json",
      "format" = "json",
      "strip_outer_array" = "true"
  );
  ```
