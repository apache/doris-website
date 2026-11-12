---
{
    "title": "POSITIVE",
    "language": "zh-CN"
}
---

## positive

## 描述
## 语法

```sql
BIGINT positive(BIGINT x)
DOUBLE positive(DOUBLE x)
DECIMAL positive(DECIMAL x)
```
返回`x`.

## 举例

```
mysql> SELECT positive(-10);
+---------------+
| positive(-10) |
+---------------+
|           -10 |
+---------------+
mysql> SELECT positive(12);
+--------------+
| positive(12) |
+--------------+
|           12 |
+--------------+
```

### keywords
	POSITIVE
