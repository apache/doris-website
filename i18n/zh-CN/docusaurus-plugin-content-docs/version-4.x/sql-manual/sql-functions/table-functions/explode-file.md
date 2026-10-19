---
{
    "title": "EXPLODE_FILE",
    "language": "zh-CN",
    "description": "在 LATERAL VIEW 中展开 FILE 的六个字段。"
}
---

## 描述

在 LATERAL VIEW 中将一个 FILE 展开为六个字段。NULL FILE 返回零行。此函数只展开值中已有的字段，不访问远端存储。

:::note
自 4.2.0 起支持
:::

## 语法

```sql
LATERAL VIEW EXPLODE_FILE(<file>) <table_alias>
AS <uri>, <offset>, <size>, <content_type>, <checksum>, <inline>
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `<file>` | 必填，FILE 表达式或 NULL FILE。普通 STRUCT 不直接接受，应先显式 CAST 为 FILE。 |
| `<table_alias>` | 展开结果的表别名。 |
| 字段别名 | 按语法中的顺序提供六个别名。 |

## 返回值

返回以下六个可为 NULL 的列。非 NULL FILE 恰好返回一行，即使 inline 之外的部分或全部元数据字段为 NULL。

| 列 | 类型 |
| --- | --- |
| uri | VARCHAR(65533) |
| offset | BIGINT |
| size | BIGINT |
| content_type | VARCHAR(1024) |
| checksum | VARCHAR(1024) |
| inline | VARBINARY |

## 示例

```sql
SELECT uri, size, HEX(CAST(inline_bytes AS STRING)) AS inline_hex
FROM (SELECT CAST(NAMED_STRUCT(
    'uri', 'urn:example:file', 'offset', NULL, 'size', CAST(3 AS BIGINT),
    'content_type', NULL, 'checksum', NULL, 'inline', X'00FF80'
) AS FILE) AS f) t
LATERAL VIEW EXPLODE_FILE(f) e AS uri, off, size, mime, checksum, inline_bytes;
```

```text
+------------------+------+------------+
| uri              | size | inline_hex |
+------------------+------+------------+
| urn:example:file |    3 | 00FF80     |
+------------------+------+------------+
```

```sql
SELECT uri, size
FROM (SELECT CAST(NULL AS FILE) AS f) t
LATERAL VIEW EXPLODE_FILE(f) e AS uri, off, size, mime, checksum, inline_bytes;
```

```text
Empty set (0.030 sec)
```

另一种 NULL 行为见 [EXPLODE_FILE_OUTER](explode-file-outer.md)，字段约束见 [FILE](../../basic-element/sql-data-types/semi-structured/FILE.md)。
