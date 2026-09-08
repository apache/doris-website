---
{
    "title": "TRY_PARSE_TO_VARIANT",
    "language": "zh-CN",
    "description": "TRY_PARSE_TO_VARIANT 函数将 JSON 字符串解析为 VARIANT 类型的值，解析失败时返回 NULL。"
}
---

## 描述

`TRY_PARSE_TO_VARIANT` 函数将 JSON 格式的字符串解析为 `VARIANT` 类型的值。与 [`PARSE_TO_VARIANT`](./parse-to-variant.md) 的区别是：当输入不是合法 JSON 时，该函数返回 NULL 而不是报错，因此适合用于数据质量无法保证的场景。

该函数的返回值总是可为 NULL 的。

自 4.1.4 版本开始支持。

## 语法

```sql
TRY_PARSE_TO_VARIANT(<str>)
```

## 参数

| 参数      | 说明                                  |
| --------- | ------------------------------------- |
| `<str>`   | 需要解析的 JSON 字符串，类型为 VARCHAR |

## 返回值

返回 `VARIANT` 类型的值。

- 输入为 NULL 时返回 NULL；
- 输入不是合法 JSON 时返回 NULL。

## 举例

```sql
SELECT TRY_PARSE_TO_VARIANT('{"a": 10, "b": "hello"}') AS v;
```

```text
+---------------------------+
| v                         |
+---------------------------+
| {"a":10,"b":"hello"}      |
+---------------------------+
```

```sql
SELECT TRY_PARSE_TO_VARIANT('not a json') AS v;
```

```text
+------+
| v    |
+------+
| NULL |
+------+
```

```sql
SELECT TRY_PARSE_TO_VARIANT(NULL) AS v;
```

```text
+------+
| v    |
+------+
| NULL |
+------+
```

## 相关文档

- [VARIANT 数据类型](../../../basic-element/sql-data-types/semi-structured/VARIANT.md)
- [PARSE_TO_VARIANT](./parse-to-variant.md)
