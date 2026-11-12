---
{
    "title": "PMOD",
    "language": "zh-CN"
}
---

## pmod

## 描述
## 语法

```sql
BIGINT PMOD(BIGINT x, BIGINT y)
DOUBLE PMOD(DOUBLE x, DOUBLE y)
```
返回在模系下`x mod y`的最小正数解.
具体地来说, 返回 `(x%y+y)%y`.

## 举例

```
MySQL [test]> SELECT PMOD(13,5);
+-------------+
| pmod(13, 5) |
+-------------+
|           3 |
+-------------+
MySQL [test]> SELECT PMOD(-13,5);
+-------------+
| pmod(-13, 5) |
+-------------+
|           2 |
+-------------+
```

### keywords
	PMOD
