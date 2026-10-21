---
{
    "title": "FILE | 半结构化类型",
    "language": "zh-CN",
    "description": "FILE 的字段定义、类型约束、获取方式及字段访问。",
    "sidebar_label": "FILE"
}
---

# FILE

:::note
自 4.2.0 起支持
:::

## 类型描述

- `FILE` 用来在查询中表示一个文件：可以保存它的地址，也可以直接保存它的二进制内容。
- FILE 还可以保存文件大小、内容类型等信息；六个字段的名称和类型固定，均允许 NULL。
- FILE 可嵌套在 ARRAY、STRUCT 和 MAP value 中。

```sql
FILE
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| uri | VARCHAR(65533) | 文件位置，按原值保存。 |
| offset | BIGINT | 起始字节偏移，可为 NULL 或非负数；非 NULL 时须提供 size。 |
| size | BIGINT | 声明的内容长度，单位为字节，可为 NULL 或非负数，包括 0。 |
| content_type | VARCHAR(1024) | NULL 或合法且非空的 MIME 类型，例如 `image/png`。 |
| checksum | VARCHAR(1024) | NULL 或非空的 `algorithm:digest` 声明。 |
| inline | VARBINARY | NULL 或二进制内容，包括空字节序列，受 VARBINARY 单值长度限制。 |

- 对于非 NULL FILE，uri 或 inline 至少一项非 NULL。存在 inline 时，其余五个字段均可为 NULL；inline 也可与元数据同时存在，已提供的字段仍须满足各自的约束。
- URI 按原值保存，不检查格式，也不编码或解码。通过 CAST 构造 FILE 不会访问对应对象，也不会核对 inline 是否与 URI、size 或 checksum 一致。
- offset 为 NULL 时，已提供的 size 表示从 0 开始的字节范围；两者均非 NULL 时，范围为 `[offset, offset + size)`，其和不能超过 BIGINT 最大值 `9223372036854775807`。
- 已知 checksum 算法名称使用 `ETAG`、`MD5`、`CRC32`、`CRC32C` 或 `SHA-256`。ETAG 的值为非空字符串；MD5、CRC32/CRC32C、SHA-256 分别要求 32、8、64 位小写十六进制摘要。其他算法的名称及摘要均须非空。Doris 只校验声明格式，不计算或验证内容摘要。
- MySQL 查询结果以六字段 JSON 对象展示 FILE，inline 使用 Base64 表示。

## 类型约束

- FILE 可用于查询表达式，暂不能在内表或外部 Catalog 中声明为表列，包括容器中嵌套的 FILE。
- 完整 FILE 及包含 FILE 的容器不能用于比较、排序、哈希、分组、DISTINCT 或 MAP key；这些操作应先提取普通标量字段。
- FILE 支持与 STRUCT 显式双向转换，不支持与 STRUCT 隐式转换，须使用 CAST。完整规则见 [FILE 类型转换](../conversion/file-conversion.md)。
- UDF 的参数、返回值及聚合中间类型不支持 FILE，包括嵌套 FILE。

## 获取 FILE

### 根据元数据构造

通过显式 CAST，将六字段 STRUCT 值转换为 FILE。值为 NULL 的字段也须提供；转换本身不访问远端存储。

```sql
SELECT CAST(NAMED_STRUCT(
    'uri', 's3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg', 'offset', NULL, 'size', CAST(3 AS BIGINT),
    'content_type', NULL, 'checksum', NULL, 'inline', X'616263'
) AS FILE) AS f;
```
```text
+-----------------------------------------------------------------------------------------------------------+
| f                                                                                                         |
+-----------------------------------------------------------------------------------------------------------+
| {"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":3,"content_type":null,"checksum":null,"inline":"YWJj"} |
+-----------------------------------------------------------------------------------------------------------+
```

也可以构造只有 inline 内容的 FILE：

```sql
SELECT CAST(NAMED_STRUCT(
    'uri', NULL, 'offset', NULL, 'size', NULL,
    'content_type', NULL, 'checksum', NULL, 'inline', X'616263'
) AS FILE) AS f;
```
```text
+--------------------------------------------------------------------------------------------+
| f                                                                                          |
+--------------------------------------------------------------------------------------------+
| {"uri":null,"offset":null,"size":null,"content_type":null,"checksum":null,"inline":"YWJj"} |
+--------------------------------------------------------------------------------------------+
```

### 获取远端对象元数据

使用 [TO_FILE](../../../sql-functions/scalar-functions/to-file.md) 和已有 S3 resource 获取单个对象的元数据。结果包含 URI、size、content_type 和由 ETag 得到的 checksum，offset 与 inline 为 NULL。

```sql
SELECT TO_FILE('file_test_s3_resource', 's3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg') AS f;
```
```text
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| f                                                                                                                                                                                           |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| {"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":158663,"content_type":"image/jpeg","checksum":"ETAG:9CE0C3466E8F035CD0A6CE3389982B15","inline":null} |
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

### 通过目录列举获取

[LIST_FILE](../../../sql-functions/table-valued-functions/list-file.md) 返回 path 和 file，每个对象一行，支持通过参数控制是否递归子目录。列举只获取元数据，不下载文件正文。

```sql
SELECT path, file
FROM LIST_FILE(
    "resource" = "file_test_s3_resource",
    "uri" = "s3://linrrzqqq/doris-file-type-test/",
    "recursive" = "false"
);
```
```text
+----------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| path                                                     | file                                                                                                                                                                                        |
+----------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg | {"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":158663,"content_type":"image/jpeg","checksum":"ETAG:9CE0C3466E8F035CD0A6CE3389982B15","inline":null} |
+----------------------------------------------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

resource 的创建方式和访问要求见各函数文档。

## 字段访问

使用 `ELEMENT_AT(f, 'field_name')` 或等价的下标写法 `f['field_name']` 访问字段。字段名须为非 NULL 常量字符串，不区分大小写；未知字段名、动态选择器及数字下标会报错。FILE 为 NULL 或字段为 NULL 时，访问结果为 NULL。

```sql
SELECT ELEMENT_AT(f, 'uri') AS uri,
       f['size'] AS size,
       HEX(CAST(f['inline'] AS STRING)) AS inline_hex
FROM (SELECT CAST(NAMED_STRUCT(
    'uri', 's3://bucket/picture.jpg', 'offset', NULL, 'size', CAST(3 AS BIGINT),
    'content_type', NULL, 'checksum', NULL, 'inline', X'616263'
) AS FILE) AS f) t;
```
```text
+-------------------------+------+------------+
| uri                     | size | inline_hex |
+-------------------------+------+------------+
| s3://bucket/picture.jpg |    3 | 616263     |
+-------------------------+------+------------+
```
