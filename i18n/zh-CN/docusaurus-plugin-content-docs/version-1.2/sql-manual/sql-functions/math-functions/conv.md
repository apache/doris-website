---
{
    "title": "CONV",
    "language": "zh-CN"
}
---

## conv

## 描述
## 语法

```sql
VARCHAR CONV(VARCHAR input, TINYINT from_base, TINYINT to_base)
VARCHAR CONV(BIGINT input, TINYINT from_base, TINYINT to_base)
```
对输入的数字进行进制转换，输入的进制范围应该在`[2,36]`以内。

## 举例

```
MySQL [test]> SELECT CONV(15,10,2);
+-----------------+
| conv(15, 10, 2) |
+-----------------+
| 1111            |
+-----------------+

MySQL [test]> SELECT CONV('ff',16,10);
+--------------------+
| conv('ff', 16, 10) |
+--------------------+
| 255                |
+--------------------+

MySQL [test]> SELECT CONV(230,10,16);
+-------------------+
| conv(230, 10, 16) |
+-------------------+
| E6                |
+-------------------+
```

### keywords
	CONV
