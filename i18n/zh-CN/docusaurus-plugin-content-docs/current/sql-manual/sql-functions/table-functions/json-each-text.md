---
{
    "title": "JSON_EACH_TEXT",
    "language": "zh-CN",
    "description": "将顶层 JSON 对象展开为键值对集合，每行包含一个键和对应的 TEXT 类型值。需配合 LATERAL VIEW 使用。"
}
---

## 描述

`json_each_text` 表函数将顶层 JSON 对象展开为一组键值对，每行包含一个键（`key`）和对应的值（`value`）。与 [`json_each`](json-each.md) 不同，`value` 列的类型为 TEXT，字符串值在输出中**不保留** JSON 引号。

该函数需配合 [`LATERAL VIEW`](../../../query-data/lateral-view.md) 使用。

## 语法

```sql
JSON_EACH_TEXT(<json_str>)
```

## 参数

| 参数         | 说明                                         |
| ------------ | -------------------------------------------- |
| `<json_str>` | 需要展开的 JSON 字符串，内容应为 JSON 对象。 |

## 返回值

返回多列多行数据，每行对应 JSON 对象中的一个键值对：

| 列名    | 类型 | 说明                                                   |
| ------- | ---- | ------------------------------------------------------ |
| `key`   | TEXT | JSON 对象的键名                                        |
| `value` | TEXT | 对应的值，以文本形式返回（字符串值不带引号，如 `foo`） |

特殊情况：
- 如果 `<json_str>` 为 NULL，返回 0 行
- 如果 `<json_str>` 为空对象（`{}`），返回 0 行
- JSON 值为 `null` 时，对应的 TEXT 值为 SQL `NULL`

## 示例

基本用法：展开包含字符串值的 JSON 对象

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text('{"a":"foo","b":"bar"}') t AS k, v;
```

```text
+---+-----+
| k | v   |
+---+-----+
| a | foo |
| b | bar |
+---+-----+
```

> `value` 列类型为 TEXT，字符串值**不保留** JSON 引号（与 `json_each` 的区别）。

包含多种类型值的 JSON 对象

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text('{"str":"hello","num":42,"bool":true,"null_val":null}') t AS k, v;
```

```text
+----------+-------+
| k        | v     |
+----------+-------+
| str      | hello |
| num      | 42    |
| bool     | true  |
| null_val | NULL  |
+----------+-------+
```

> JSON 中的 `null` 值对应 SQL `NULL`。

NULL 参数：返回 0 行

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text(NULL) t AS k, v;
-- Empty set
```

空对象：返回 0 行

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text('{}') t AS k, v;
-- Empty set
```
