---
{
    "title": "PARSE_TO_VARIANT",
    "language": "zh-CN",
    "description": "PARSE_TO_VARIANT 函数将 JSON 字符串解析为 VARIANT 类型的值，解析失败时报错。"
}
---

## 描述

`PARSE_TO_VARIANT` 函数将 JSON 格式的字符串解析为 `VARIANT` 类型的值。当输入不是合法 JSON 时，函数会报错并终止查询；如果需要在解析失败时返回 NULL 而不是报错，请使用 [`TRY_PARSE_TO_VARIANT`](./try-parse-to-variant.md)。

输入为 NULL 时返回 NULL。

自 4.1.4 版本开始支持。

## 语法

```sql
PARSE_TO_VARIANT(<str>)
```

## 参数

| 参数      | 说明                                  |
| --------- | ------------------------------------- |
| `<str>`   | 需要解析的 JSON 字符串，类型为 VARCHAR |

## 返回值

返回 `VARIANT` 类型的值。

- 输入为 NULL 时返回 NULL；
- 输入不是合法 JSON 时报错。

## 举例

```sql
SELECT PARSE_TO_VARIANT('{"a": 10, "b": "hello"}') AS v;
```

```text
+---------------------------+
| v                         |
+---------------------------+
| {"a":10,"b":"hello"}      |
+---------------------------+
```

```sql
SELECT PARSE_TO_VARIANT(NULL) AS v;
```

```text
+------+
| v    |
+------+
| NULL |
+------+
```

```sql
SELECT PARSE_TO_VARIANT('not a json');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = ... parse json failed ...
```

## 相关文档

- [VARIANT 数据类型](../../../basic-element/sql-data-types/semi-structured/VARIANT.md)
- [TRY_PARSE_TO_VARIANT](./try-parse-to-variant.md)
