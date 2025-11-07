---
{
    "title": "MASK_LAST_N",
    "language": "zh-CN"
}
---

## mask_last_n
## 描述
## 语法

`VARCHAR mask_last_n(VARCHAR str[, INT n])`

返回 str 的掩码版本，其中最后 n 个字符被转换为掩码。 大写字母转换为“X”，小写字母转换为“x”，数字转换为“n”。 例如，mask_last_n("1234-5678-8765-4321", 4) 结果为 1234-5678-8765-nnnn。

## 举例

```
// table test
+-----------+
| name      |
+-----------+
| abc123EFG |
| NULL      |
| 456AbCdEf |
+-----------+

mysql> select mask_last_n(name, 5) from test;
+------------------------+
| mask_last_n(`name`, 5) |
+------------------------+
| abc1nnXXX              |
| NULL                   |
| 456AxXxXx              |
+------------------------+
```

### keywords
    mask_last_n
