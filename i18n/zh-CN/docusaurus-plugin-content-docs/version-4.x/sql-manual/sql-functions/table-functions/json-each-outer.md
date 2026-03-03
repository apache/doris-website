---
{
    "title": "JSON_EACH_OUTER",
    "language": "zh-CN",
    "description": "将顶层 JSON 对象展开为键值对集合，每行包含一个键和对应的 JSON 类型值。与 json_each 的区别在于：当输入为 NULL 或空对象时，返回一行 NULL 值而非 0 行。需配合 LATERAL VIEW 使用。"
}
---

## 描述

`json_each_outer` 表函数将顶层 JSON 对象展开为一组键值对，每行包含一个键（`key`）和对应的值（`value`）。其中 `value` 列保持 JSON 类型，字符串值在输出中保留 JSON 引号。

与 [`json_each`](json-each.md) 的区别在于：当输入为 NULL 或空对象时，`json_each_outer` 返回一行 `NULL, NULL`，而 `json_each` 返回 0 行。

该函数需配合 [`LATERAL VIEW`](../../../query-data/lateral-view.md) 使用。

## 语法

```sql
JSON_EACH_OUTER(<json_str>)
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
- 如果 `<json_str>` 为 NULL，返回 1 行 `NULL, NULL`
- 如果 `<json_str>` 为空对象（`{}`），返回 1 行 `NULL, NULL`

## 示例

基本用法：展开包含字符串值的 JSON 对象

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_outer('{"a":"foo","b":"bar"}') t AS k, v;
```

```text
+---+-------+
| k | v     |
+---+-------+
| a | "foo" |
| b | "bar" |
+---+-------+
```

NULL 参数：返回 1 行 NULL

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_outer(NULL) t AS k, v;
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
LATERAL VIEW json_each_outer('{}') t AS k, v;
```

```text
+------+------+
| k    | v    |
+------+------+
| NULL | NULL |
+------+------+
```
