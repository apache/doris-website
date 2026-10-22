---
{
    "title": "FL_GET_BINARY",
    "language": "zh-CN",
    "description": "返回 FILE 值中已存储的二进制内容。"
}
---

## 描述

返回 [FILE](../../basic-element/sql-data-types/semi-structured/FILE.md) 值的 `inline` 字段中已存储的二进制内容。此函数不会访问 URI 或下载文件内容。

## 语法

```sql
FL_GET_BINARY(<file>)
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<file>` | FILE 类型的表达式或 NULL。传入其他类型的参数会报错。 |

## 返回值

返回类型为可空的 `VARBINARY`。FILE 为 NULL 或 `inline` 字段为 NULL 时，返回 NULL。二进制内容长度为零时，返回的二进制值长度也为零。已存储的字节按原样返回，`offset` 和 `size` 不会限定返回的字节范围。

## 示例

读取已存储的二进制内容，使用 `FROM_BINARY` 将结果显示为十六进制文本。

```sql
SELECT FROM_BINARY(FL_GET_BINARY(CAST(NAMED_STRUCT(
    'uri', 's3://bucket/a.png', 'offset', CAST(2 AS BIGINT), 'size', CAST(3 AS BIGINT),
    'content_type', 'image/png', 'checksum', NULL, 'inline', X'00FF80'
) AS FILE))) AS binary_hex;
```

```text
binary_hex
00FF80
```

输入为 NULL：

```sql
SELECT FL_GET_BINARY(NULL) AS binary_value;
```

```text
binary_value
NULL
```

FILE 包含 URI，未存储二进制内容：

```sql
SELECT FL_GET_BINARY(CAST(NAMED_STRUCT(
    'uri', 's3://bucket/a.png', 'offset', NULL, 'size', NULL,
    'content_type', NULL, 'checksum', NULL, 'inline', NULL
) AS FILE)) AS binary_value;
```

```text
binary_value
NULL
```

二进制内容为空：

```sql
SELECT FROM_BINARY(FL_GET_BINARY(CAST(NAMED_STRUCT(
    'uri', NULL, 'offset', NULL, 'size', NULL,
    'content_type', NULL, 'checksum', NULL, 'inline', CAST(UNHEX('') AS VARBINARY)
) AS FILE))) = '' AS is_empty;
```

```text
is_empty
1
```
