---
{
    "title": "NULLIF",
    "language": "zh-CN"
}
---

## 描述

如果两个输入值相等，则返回 `NULL`；否则返回第一个输入值。该函数等价于以下 `CASE WHEN` 表达式：

```sql
CASE
    WHEN <expr1> = <expr2> THEN NULL
    ELSE <expr1>
END
```

## 语法

```sql
NULLIF(<expr1>, <expr2>)
```

## 参数

| 参数 | 说明 |
|-----------|-------------|
| `<expr1>` | 需要进行比较的第一个输入值。 |
| `<expr2>` | 需要与第一个输入值进行比较的第二个值。 |

## 返回值

- 如果 `<expr1>` 等于 `<expr2>`，则返回 `NULL`。
- 否则，返回 `<expr1>` 的值。

## 举例

```sql
SELECT NULLIF(1, 1);
```

```text
+--------------+
| NULLIF(1, 1) |
+--------------+
|         NULL |
+--------------+
```

```sql
SELECT NULLIF(1, 0);
```

```text
+--------------+
| NULLIF(1, 0) |
+--------------+
|            1 |
+--------------+
```