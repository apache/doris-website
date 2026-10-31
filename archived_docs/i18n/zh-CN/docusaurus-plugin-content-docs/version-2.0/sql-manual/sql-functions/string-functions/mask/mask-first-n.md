---
{
    "title": "MASK_FIRST_N",
    "language": "zh-CN"
}
---

## mask_first_n
## 描述
## 语法

`VARCHAR mask_first_n(VARCHAR str[, INT n])`

返回带有掩码的前 n 个值的 str 的掩码版本。 大写字母转换为“X”，小写字母转换为“x”，数字转换为“n”。 例如，mask_first_n("1234-5678-8765-4321", 4) 结果为 nnnn-5678-8765-4321。

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

mysql> select mask_first_n(name, 5) from test;
+-------------------------+
| mask_first_n(`name`, 5) |
+-------------------------+
| xxxnn3EFG               |
| NULL                    |
| nnnXxCdEf               |
+-------------------------+
```

### keywords
    mask_first_n
