---
{
    "title": "转换为 FILE",
    "language": "zh-CN",
    "description": "STRUCT 到 FILE 的显式转换，包括嵌套值转换与 NULL 处理规则。"
}
---

# 转换为 FILE

FILE 支持从 STRUCT 显式转换。CAST 和 TRY_CAST 不支持将 FILE 转换为其他类型，包括 STRUCT。**FILE 与 STRUCT 之间不支持隐式转换，须使用 CAST。** 转换本身不访问远端存储，字段定义及取值约束见 [FILE](../semi-structured/FILE.md)。

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

### FROM NULL

SQL NULL 可显式转换为 NULL FILE。

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

## NULL 处理与 TRY_CAST

NULL STRUCT 转换后为 NULL FILE。非 NULL STRUCT 的 uri 或 inline 至少一项非 NULL，已提供的字段须满足 FILE 取值约束。非法 FILE 值会使 CAST 报错，即使 `enable_strict_cast=false` 也不例外。

TRY_CAST 沿用既有转换规则。严格模式下，一行转换失败时，该行的整个目标值返回 NULL；类型及 STRUCT schema 检查仍在分析阶段进行。

```sql
SET enable_strict_cast = true;
SELECT TRY_CAST(NAMED_STRUCT(
    'uri', 's3://linrrzqqq/doris-file-type-test/my-github-avatar.jpg', 'offset', NULL, 'size', CAST(-1 AS BIGINT),
    'content_type', NULL, 'checksum', NULL, 'inline', NULL
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

STRUCT 到 FILE 的转换同样适用于 ARRAY 元素、STRUCT 字段和 MAP value。可以先转换单个值再构造容器，或在匹配的容器类型之间 CAST。不支持将嵌套的 FILE 值转换为其他类型。父容器为 NULL 时，不校验其隐藏的 FILE 子值。

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
