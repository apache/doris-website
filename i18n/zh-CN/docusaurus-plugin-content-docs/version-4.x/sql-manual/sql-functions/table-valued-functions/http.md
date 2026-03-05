---
{
    "title": "HTTP",
    "language": "zh-CN",
    "description": "Apache Doris HTTP 表函数（TVF）支持通过 SQL 直接查询任意 HTTP/HTTPS 端点数据，包括 REST API 接口、远程数据文件及 Hugging Face 数据集。支持 JSON、CSV、Parquet、ORC 等格式解析。"
}
---

HTTP 表函数（table-valued-function，tvf），可以让用户像访问关系表格式数据一样，读取任意 HTTP 端点返回的数据。只要返回的数据满足支持的格式，即可直接通过 SQL 进行查询和分析。目前支持 `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` 数据格式。

典型使用场景包括：

- 查询 HTTP/HTTPS 上托管的数据文件（如 GitHub、S3 等）。
- 直接查询返回 JSON 格式数据的 HTTP API 接口。
- 访问 Hugging Face 上托管的数据集。

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
| uri               | 访问的 HTTP 地址。支持 `http`、`https` 和 `hf` 协议。可以是数据文件的 URL，也可以是返回数据的 API 端点。|
| format            | 数据格式，即 HTTP 端点返回内容的解析方式。支持 `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`。 |

关于 `hf://`（Hugging Face），请参阅 [Analyzing Hugging Face Data](../../../lakehouse/huggingface.md)。

### 可选参数

| 参数      | 描述    | 备注    |
|-------|-----------|------------------------|
| `http.header.xxx`  | 用于指定任意的 HTTP Header，这些信息会直接透传给 HTTP Client。 | 如 `"http.header.Authorization" = "Bearer hf_MWYzOJJoZEymb..."`，最终 Header 为 `Authorization: Bearer hf_MWYzOJJoZEymb...` |
| `http.enable.range.request` | 是否使用 range request 访问 HTTP 服务。默认为 `true`。 | |
| `http.max.request.size.bytes` | 当使用非 range request 方式访问时，最大访问大小限制。默认是 100 MB。 | |

当 `http.enable.range.request` 为 `true` 时，系统会优先尝试使用 range request 访问 HTTP 服务。如果 HTTP 服务不支持 range request，则会自动回退到非 range request 方式访问。并且最大访问数据量受到 `http.max.request.size.bytes` 限制。

## 示例

### 读取 HTTP 上的数据文件

- 读取 GitHub 上的 CSV 数据

    ```sql
    SELECT COUNT(*) FROM
    HTTP(
        "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/load_p0/http_stream/all_types.csv",
        "format" = "csv",
        "column_separator" = ","
    );
    ```

- 读取 GitHub 上的 Parquet 数据

    ```sql
    SELECT arr_map, id FROM
    HTTP(
        "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/external_table_p0/tvf/t.parquet",
        "format" = "parquet"
    );
    ```

- 读取 GitHub 上的 JSON 数据，并配合 `DESC FUNCTION` 查看 Schema

    ```sql
    DESC FUNCTION
    HTTP(
        "uri" = "https://raw.githubusercontent.com/apache/doris/refs/heads/master/regression-test/data/load_p0/stream_load/basic_data.json",
        "format" = "json",
        "strip_outer_array" = "true"
    );
    ```

### 查询 HTTP API 接口

通过 HTTP 表函数，可以直接查询返回 JSON 格式数据的 HTTP API 接口。例如，查询一个返回 JSON 数据的 REST API：

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
对于不支持 Range Request 的 HTTP API 接口，系统会自动回退到非 Range Request 方式访问。可通过 `http.enable.range.request` 参数手动关闭 Range Request。
:::
