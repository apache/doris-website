---
{
    "title": "IF",
    "language": "zh-CN"
}
---

## 描述

如果表达式 `<condition>` 成立，则返回 `<value_true>`；否则返回 `<value_false_or_null>`。  
返回类型：`<value_true>` 表达式的结果类型。

## 语法

```sql
IF(<condition>, <value_true>, <value_false_or_null>)
```

## 参数

| 参数                     | 说明                              |
|-------------------------|----------------------------------|
| `<condition>`           | 用于判断的布尔表达式。             |
| `<value_true>`          | 当 `<condition>` 为真时返回的值。    |
| `<value_false_or_null>` | 当 `<condition>` 为假时返回的值。    |

## 举例

```sql
SELECT user_id, IF(user_id = 1, "true", "false") AS test_if FROM test;
```

```text
+---------+---------+
| user_id | test_if |
+---------+---------+
| 1       | true    |
| 2       | false   |
+---------+---------+
```