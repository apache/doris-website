---
{
    "title": "JSON_EACH",
    "language": "zh-CN",
    "description": "将顶层 JSON 对象展开为键值对集合，每行包含一个键和对应的 JSON 类型值。需配合 LATERAL VIEW 使用。"
}
---

## 描述

`json_each` 表函数将顶层 JSON 对象展开为一组键值对，每行包含一个键（`key`）和对应的值（`value`）。其中 `value` 列保持 JSON 类型，字符串值在输出中保留 JSON 引号。

该函数需配合 [`LATERAL VIEW`](../../../query-data/lateral-view.md) 使用。

## 语法

```sql
JSON_EACH(<json_str>)
```

## 参数

| 参数         | 说明                                         |
| ------------ | -------------------------------------------- |
| `<json_str>` | 需要展开的 JSON 字符串，内容应为 JSON 对象。 |

## 返回值

返回多列多行数据，每行对应 JSON 对象中的一个键值对：

| 列名    | 类型   | 说明                                                   |
| ------- | ------ | ------------------------------------------------------ |
| `key`   | String | JSON 对象的键名                                        |
| `value` | JSON   | 对应的值，保持 JSON 类型（字符串值带引号，如 `"foo"`） |

特殊情况：
- 如果 `<json_str>` 为 NULL，返回 0 行
- 如果 `<json_str>` 为空对象（`{}`），返回 0 行

## 示例

基本用法：展开包含字符串值的 JSON 对象

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each('{"a":"foo","b":"bar"}') t AS k, v;
```

```text
+---+-------+
| k | v     |
+---+-------+
| a | "foo" |
| b | "bar" |
+---+-------+
```

> `value` 列类型为 JSON，字符串值保留 JSON 引号。

包含多种类型值的 JSON 对象

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each('{"str":"hello","num":42,"bool":true,"null_val":null,"arr":[1,2]}') t AS k, v;
```

```text
+----------+---------+
| k        | v       |
+----------+---------+
| str      | "hello" |
| num      | 42      |
| bool     | true    |
| null_val | NULL    |
| arr      | [1,2]   |
+----------+---------+
```

NULL 参数：返回 0 行

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each(NULL) t AS k, v;
-- Empty set
```
空对象：返回 0 行

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each('{}') t AS k, v;
-- Empty set
```
