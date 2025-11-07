---
{
    "title": "NEGATIVE",
    "language": "zh-CN"
}
---

## 描述

返回传参 x 的负值

## 语法

```sql
NEGATIVE(<x>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<x>` | 自变量 支持类型`BIGINT DOUBLE DECIMAL` |

## 返回值

返回整型或者浮点数。特殊情况：

- 当参数为 NULL 时，返回 NULL
- 当参数为 0 时，返回 0

## 举例

```sql
SELECT negative(-10);
```

```text
+---------------+
| negative(-10) |
+---------------+
|            10 |
+---------------+
```

```sql
SELECT negative(12);
```

```text
+--------------+
| negative(12) |
+--------------+
|          -12 |
+--------------+
```

```sql
SELECT negative(0);
```

```text
+-------------+
| negative(0) |
+-------------+
|           0 |
+-------------+
```

```sql
SELECT negative(null);
```

```text
+----------------+
| negative(NULL) |
+----------------+
|           NULL |
+----------------+
```
