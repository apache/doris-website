---
{
    "title": "FILE | 半结构化类型",
    "language": "zh-CN",
    "description": "FILE 的字段定义、类型约束及字段访问。"
}
---

# FILE


## 类型描述

- `FILE` 用来在查询中表示一个文件：可以保存远端文件的位置，也可以直接内联保存二进制内容。
- `FILE` 包含六个名称和类型固定的字段，且六个字段均允许为 `NULL`。
- `FILE` 可嵌套在 `ARRAY`、`STRUCT` 和 `MAP` value 中（不能作为 `MAP` key）。

```sql
FILE
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| uri | STRING | 文件位置（可为 `NULL`）。 |
| offset | BIGINT | 起始字节偏移（可为 `NULL`）。 |
| size | BIGINT | 声明的内容长度，单位为字节（可为 `NULL`）。 |
| content_type | STRING | MIME 媒体类型，例如 `image/png`（可为 `NULL`）。 |
| checksum | STRING | 摘要或 ETag 声明，例如 `ETAG:...`（可为 `NULL`）。 |
| inline | VARBINARY | 内联二进制内容，受 `VARBINARY` 单值长度限制（可为 `NULL`）。 |

- MySQL 查询结果以六字段 JSON 对象展示 `FILE`，`inline` 字段使用 Base64 编码（空字节序列展示为空字符串，NULL 字段展示为 JSON `null`）。

## 类型约束

- **仅用于查询表达式**：`FILE` 可用于查询表达式中，暂不支持在内表、外部 Catalog 表、`CREATE TABLE ... AS SELECT`、`CREATE TABLE ... LIKE` 或物化视图中声明为表列（包括嵌套在 `ARRAY`、`STRUCT`、`MAP` 或 `AGG_STATE` 中的 `FILE`）。
- **暂未提供 SQL 构造函数**：当前版本尚未启用 SQL 层的 `FILE` 构造函数与 `FILE` 表列；非 `NULL` 的 `FILE` 值将在后续版本通过数据源集成或构造函数提供。
- **不支持比较、排序、哈希或分组**：完整 `FILE` 及包含 `FILE` 的容器不能用于比较谓词（如 `=`）、`IN`、`ORDER BY`、`GROUP BY`、`DISTINCT`、`UNION`/`INTERSECT`、`MAP` key，以及需要比较、排序或去重的函数（如 `MIN`、`MAX`、`COLLECT_SET`、`ARRAY_DISTINCT`、`ARRAY_SORT`、`ARRAY_SORTED_MERGE`、`TOPN_ARRAY`、`GROUP_ARRAY_INTERSECT`、`GROUP_ARRAY_UNION`、`GREATEST`、`LEAST`、`NULLIF`）。如需执行这些操作，应先通过 `ELEMENT_AT` 提取普通标量字段。
- **支持透传与负载型聚合**：条件表达式（`IF`、`CASE`、`COALESCE`、`NVL`）、窗口值函数（`FIRST_VALUE`、`LAST_VALUE`、`NTH_VALUE`）以及不比较 `FILE` 本身的负载型聚合（`COUNT`、`ANY_VALUE`、`ARRAY_AGG`、`COLLECT_LIST`、`GROUP_ARRAY`、`MIN_BY(f, k)`、`MAX_BY(f, k)`、`MAP_AGG(k, f)`）支持 `FILE` 及包含 `FILE` 的容器。
- **不支持 CAST / TRY_CAST**：`CAST` 和 `TRY_CAST` 不支持向 `FILE` 或从 `FILE` 进行转换（包括 `NULL`、同类型转换及嵌套 `FILE`）。详见 [FILE 类型转换](../conversion/file-conversion.md)。
- **不支持 UDF 与文件导出**：UDF / UDAF / UDTF 的参数、返回值及聚合中间类型不支持 `FILE`（含嵌套 `FILE`）；`SELECT ... INTO OUTFILE`、Arrow / Flight 输出及 ORC 输出同样不支持 `FILE`。

## 字段访问

- 使用 [FL_GET_BINARY](../../../sql-functions/scalar-functions/fl-get-binary.md) 读取已存储的 `inline` 二进制内容。`FILE` 为 `NULL` 或 `inline` 字段为 `NULL` 时，返回 `NULL`。
- 使用 [ELEMENT_AT](../../../sql-functions/scalar-functions/variant-functions/element-at.md)（`ELEMENT_AT(f, 'field_name')` 或等价下标写法 `f['field_name']`）读取 `uri`、`offset`、`size`、`content_type` 或 `checksum`。字段名须为非 `NULL` 常量字符串，不区分大小写。访问 `inline`、未知字段名、动态选择器或数字下标会报错。
- 使用 [EXPLODE_FILE](../../../sql-functions/table-functions/explode-file.md) 或 [EXPLODE_FILE_OUTER](../../../sql-functions/table-functions/explode-file-outer.md) 将全部六个字段展开为独立列。
- 使用 [TO_JSON](../../../sql-functions/scalar-functions/json-functions/to-json.md) 将 `FILE` 值序列化为 `JSONB`。

以下概念示例展示当上游数据源提供 `FILE` 列 `f` 时的访问方式（当前版本尚未启用 SQL `FILE` 构造函数与表列）：

```sql
-- 通过 ELEMENT_AT（或下标语法）读取元数据字段，通过 FL_GET_BINARY 读取内联二进制内容
SELECT
    ELEMENT_AT(f, 'uri')          AS uri,
    f['offset']                   AS file_offset,
    ELEMENT_AT(f, 'size')         AS file_size,
    ELEMENT_AT(f, 'content_type') AS content_type,
    ELEMENT_AT(f, 'checksum')     AS checksum,
    FL_GET_BINARY(f)              AS file_inline
FROM file_source;

-- 通过 EXPLODE_FILE / EXPLODE_FILE_OUTER 展开全部六个字段
SELECT u, o, s, c, h, b
FROM file_source
LATERAL VIEW EXPLODE_FILE(f) e AS u, o, s, c, h, b;
```
