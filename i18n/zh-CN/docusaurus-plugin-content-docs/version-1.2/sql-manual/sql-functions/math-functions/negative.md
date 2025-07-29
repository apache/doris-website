---
{
    "title": "NEGATIVE",
    "language": "zh-CN"
}
---

## negative

## 描述
## 语法

```sql
BIGINT negative(BIGINT x)
DOUBLE negative(DOUBLE x)
DECIMAL negative(DECIMAL x)
```
返回`-x`.

## 举例

```
mysql> SELECT negative(-10);
+---------------+
| negative(-10) |
+---------------+
|            10 |
+---------------+
mysql> SELECT negative(12);
+--------------+
| negative(12) |
+--------------+
|          -12 |
+--------------+
```

### keywords
	NEGATIVE
