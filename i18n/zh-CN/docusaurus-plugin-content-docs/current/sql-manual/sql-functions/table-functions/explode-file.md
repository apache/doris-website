---
{
    "title": "EXPLODE_FILE",
    "language": "zh-CN",
    "description": "在 LATERAL VIEW 中展开 FILE 的六个字段。"
}
---

## 描述

在 `LATERAL VIEW` 中将一个 `FILE` 展开为六个字段。NULL `FILE` 返回零行。此函数只展开值中已有的字段，不访问远端存储。

## 语法

```sql
LATERAL VIEW EXPLODE_FILE(<file>) <table_alias>
AS <uri>, <offset>, <size>, <content_type>, <checksum>, <inline>
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<file>` | 必填，`FILE` 表达式或 `NULL`（`FILE` 类型）。 |
| `<table_alias>` | 展开结果的表别名。 |
| 字段别名 | 按语法中的顺序提供六个别名。 |

## 返回值

返回以下六个可为 `NULL` 的列。非 NULL `FILE` 恰好返回一行，即使部分或全部字段为 `NULL`。

| 列 | 类型 |
| --- | --- |
| uri | STRING |
| offset | BIGINT |
| size | BIGINT |
| content_type | STRING |
| checksum | STRING |
| inline | VARBINARY |

## 示例

以下为概念示例，假设上游数据源提供 `FILE` 列 `f`（当前版本尚未启用 SQL `FILE` 构造函数与表列）：

```sql
SELECT uri, size, HEX(CAST(inline_bytes AS STRING)) AS inline_hex
FROM file_source
LATERAL VIEW EXPLODE_FILE(f) e AS uri, off, size, mime, checksum, inline_bytes;
```

```text
+-----------------------------+--------+------------+
| uri                         | size   | inline_hex |
+-----------------------------+--------+------------+
| s3://bucket/path/avatar.jpg | 158663 | NULL       |
+-----------------------------+--------+------------+
```

当 `f` 为 `NULL` 时：

```sql
SELECT uri, size
FROM (SELECT IF(false, f, NULL) AS f FROM file_source) t
LATERAL VIEW EXPLODE_FILE(f) e AS uri, off, size, mime, checksum, inline_bytes;
```

```text
Empty set (0.030 sec)
```

另一种 NULL 行为见 [EXPLODE_FILE_OUTER](explode-file-outer.md)，字段定义与约束见 [FILE](../../basic-element/sql-data-types/semi-structured/FILE.md)。
