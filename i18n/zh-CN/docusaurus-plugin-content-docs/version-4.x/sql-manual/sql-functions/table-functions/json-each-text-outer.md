---
{
    "title": "JSON_EACH_TEXT_OUTER",
    "language": "zh-CN",
    "description": "将顶层 JSON 对象展开为键值对集合，每行包含一个键和对应的 TEXT 类型值。与 json_each_text 的区别在于：当输入为 NULL 或空对象时，返回一行 NULL 值而非 0 行。需配合 LATERAL VIEW 使用。"
}
---

## 描述

`json_each_text_outer` 表函数将顶层 JSON 对象展开为一组键值对，每行包含一个键（`key`）和对应的值（`value`）。与 [`json_each_outer`](json-each-outer.md) 不同，`value` 列的类型为 TEXT，字符串值在输出中**不保留** JSON 引号。

与 [`json_each_text`](json-each-text.md) 的区别在于：当输入为 NULL 或空对象时，`json_each_text_outer` 返回一行 `NULL, NULL`，而 `json_each_text` 返回 0 行。

该函数需配合 [`LATERAL VIEW`](../../../query-data/lateral-view.md) 使用。

## 语法

```sql
JSON_EACH_TEXT_OUTER(<json_str>)
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
- 如果 `<json_str>` 为 NULL，返回 1 行 `NULL, NULL`
- 如果 `<json_str>` 为空对象（`{}`），返回 1 行 `NULL, NULL`
- JSON 值为 `null` 时，对应的 TEXT 值为 SQL `NULL`

## 示例

基本用法：展开包含字符串值的 JSON 对象

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text_outer('{"a":"foo","b":"bar"}') t AS k, v;
```

```text
+---+-----+
| k | v   |
+---+-----+
| a | foo |
| b | bar |
+---+-----+
```

> `value` 列类型为 TEXT，字符串值**不保留** JSON 引号（与 `json_each_outer` 的区别）。

NULL 参数：返回 1 行 NULL

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text_outer(NULL) t AS k, v;
```

```text
+------+------+
| k    | v    |
+------+------+
| NULL | NULL |
+------+------+
```

空对象：返回 1 行 NULL

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text_outer('{}') t AS k, v;
```

```text
+------+------+
| k    | v    |
+------+------+
| NULL | NULL |
+------+------+
```
