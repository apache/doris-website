---
{
    "title": "NULL_OR_EMPTY",
    "language": "zh-CN"
}
---

## 描述

`null_or_empty` 函数用于判断给定的值是否为 NULL 或空。如果输入值为 NULL 或空字符串，则返回 true，否则返回 false。

## 语法

```sql
NULL_OR_EMPTY (<str>)
```

## 参数

| 参数    | 说明       |
| ------- | ---------- |
| `<str>` | 字符串类型 |

## 返回值

如果字符串为空字符串或者 NULL，返回 true；否则返回 false。

## 示例

```sql
select null_or_empty(null);
```

```text
+---------------------+
| null_or_empty(NULL) |
+---------------------+
|                   1 |
+---------------------+
```

```sql
select null_or_empty("");
```

```text
+-------------------+
| null_or_empty('') |
+-------------------+
|                 1 |
+-------------------+
```

```sql
select null_or_empty("a");
```

```text
+--------------------+
| null_or_empty('a') |
+--------------------+
|                  0 |
+--------------------+
```