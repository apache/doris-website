---
{
    "title": "转换为/从 FILE",
    "language": "zh-CN",
    "description": "FILE 与 STRUCT、JSON、VARIANT 的显式双向转换及 NULL 处理规则。"
}
---

# 转换为/从 FILE

FILE 支持与 STRUCT、JSON、VARIANT 显式双向转换。**FILE 与这些类型之间不支持隐式转换，须使用 CAST。** 转换本身不访问远端存储，字段定义及取值约束见 [FILE](../semi-structured/FILE.md)。

## 转换为 FILE

### FROM STRUCT

源 STRUCT 须包含完整六字段，按名称匹配，不区分大小写，字段顺序可不同。offset 和 size 须为 BIGINT 或 NULL，inline 须为 VARBINARY 或 NULL，文本字段须为 CHAR/VARCHAR/STRING 或 NULL。未知、缺失、重复或类型不兼容的字段会被拒绝。

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

### FROM JSON

JSON 对象须恰好包含 uri、offset、size、content_type、checksum、inline 六个小写 key。offset 和 size 接受 BIGINT 范围的 JSON 整数或 null；inline 接受标准、带 padding 的 Base64 字符串或 null，空字符串表示空字节序列。

```sql
SELECT CAST(JSON_PARSE(
    '{"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":3,"content_type":null,"checksum":null,"inline":"YWJj"}'
) AS FILE) AS f;
```
```text
+-----------------------------------------------------------------------------------------------------------+
| f                                                                                                         |
+-----------------------------------------------------------------------------------------------------------+
| {"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":3,"content_type":null,"checksum":null,"inline":"YWJj"} |
+-----------------------------------------------------------------------------------------------------------+
```

### FROM VARIANT

对象形式的 VARIANT 使用与 JSON 相同的字段名、字段类型及 Base64 表示。

```sql
SELECT CAST(PARSE_TO_VARIANT(
    '{"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":3,"content_type":null,"checksum":null,"inline":"YWJj"}'
) AS FILE) AS f;
```
```text
+-----------------------------------------------------------------------------------------------------------+
| f                                                                                                         |
+-----------------------------------------------------------------------------------------------------------+
| {"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":3,"content_type":null,"checksum":null,"inline":"YWJj"} |
+-----------------------------------------------------------------------------------------------------------+
```

### FROM NULL

SQL NULL 和 JSON null 可显式转换为 NULL FILE。

```sql
SELECT CAST(NULL AS FILE) AS f;
```
```text
+------+
| f    |
+------+
| NULL |
+------+
```

## 从 FILE 转换

### TO STRUCT

目标 STRUCT 须包含完整六字段，按名称匹配，不区分大小写。各字段均须允许 NULL：uri、content_type、checksum 使用字符串类型，offset 和 size 使用 BIGINT，inline 使用 VARBINARY。转换保留 inline 原始二进制内容。

```sql
SELECT CAST(f AS STRUCT<uri:STRING, offset:BIGINT, size:BIGINT,
    content_type:STRING, checksum:STRING, inline:VARBINARY>) AS s
FROM (SELECT CAST(NAMED_STRUCT(
    'uri', 's3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg', 'offset', NULL, 'size', CAST(3 AS BIGINT),
    'content_type', NULL, 'checksum', NULL, 'inline', X'616263'
) AS FILE) AS f) t;
```
```text
+------------------------------------------------------------------------------------------------------------------+
| s                                                                                                                |
+------------------------------------------------------------------------------------------------------------------+
| {"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg", "offset":null, "size":3, "content_type":null, "checksum":null, "inline":0x616263} |
+------------------------------------------------------------------------------------------------------------------+
```

### TO JSON

结果为包含六个小写 key 的对象，inline 表示为 Base64 字符串或 null。

```sql
SELECT CAST(f AS JSON) AS j
FROM (SELECT CAST(NAMED_STRUCT(
    'uri', 's3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg', 'offset', NULL, 'size', CAST(3 AS BIGINT),
    'content_type', NULL, 'checksum', NULL, 'inline', X'616263'
) AS FILE) AS f) t;
```
```text
+-----------------------------------------------------------------------------------------------------------+
| j                                                                                                         |
+-----------------------------------------------------------------------------------------------------------+
| {"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":3,"content_type":null,"checksum":null,"inline":"YWJj"} |
+-----------------------------------------------------------------------------------------------------------+
```

### TO VARIANT

结果使用与 JSON 相同的六字段对象表示，inline 使用 Base64。

```sql
SELECT CAST(f AS VARIANT) AS v
FROM (SELECT CAST(NAMED_STRUCT(
    'uri', 's3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg', 'offset', NULL, 'size', CAST(3 AS BIGINT),
    'content_type', NULL, 'checksum', NULL, 'inline', X'616263'
) AS FILE) AS f) t;
```
```text
+-----------------------------------------------------------------------------------------------------------+
| v                                                                                                         |
+-----------------------------------------------------------------------------------------------------------+
| {"checksum":null,"content_type":null,"inline":"YWJj","offset":null,"size":3,"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg"} |
+-----------------------------------------------------------------------------------------------------------+
```

## NULL 处理与 TRY_CAST

NULL FILE 转换为 STRUCT、JSON 或 VARIANT 后仍为 NULL。非 NULL FILE 的 uri 或 inline 至少一项非 NULL，已提供的字段须满足 FILE 取值约束。非法 FILE 值会使 CAST 报错，即使 `enable_strict_cast=false` 也不例外。

TRY_CAST 沿用既有转换规则。严格模式下，一行转换失败时，该行的整个目标值返回 NULL；类型及 STRUCT schema 检查仍在分析阶段进行。

```sql
SET enable_strict_cast = true;
SELECT TRY_CAST(JSON_PARSE(
    '{"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":-1,"content_type":null,"checksum":null,"inline":null}'
) AS FILE) AS f;
```
```text
+------+
| f    |
+------+
| NULL |
+------+
```

## 嵌套转换

相同的显式转换规则适用于 ARRAY 元素、STRUCT 字段和 MAP value。可以先转换单个值再构造容器，或在匹配的容器类型之间 CAST；父容器为 NULL 时，不校验其隐藏的 FILE 子值。

STRING 不能直接整体转换为包含 FILE 的容器，VARIANT 与此类容器也不能直接整体互转。`ARRAY<VARIANT>` 与 `ARRAY<FILE>` 之间的逐元素转换仍受支持。

```sql
SELECT CAST(ARRAY(NAMED_STRUCT(
    'uri', 's3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg', 'offset', NULL, 'size', CAST(3 AS BIGINT),
    'content_type', NULL, 'checksum', NULL, 'inline', X'616263'
)) AS ARRAY<FILE>) AS files;
```
```text
+-------------------------------------------------------------------------------------------------------------+
| files                                                                                                       |
+-------------------------------------------------------------------------------------------------------------+
| [{"uri":"s3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg","offset":null,"size":3,"content_type":null,"checksum":null,"inline":"YWJj"}] |
+-------------------------------------------------------------------------------------------------------------+
```
