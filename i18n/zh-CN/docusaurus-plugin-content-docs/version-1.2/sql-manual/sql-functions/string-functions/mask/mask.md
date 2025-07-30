---
{
    "title": "MASK",
    "language": "zh-CN"
}
---

## mask
## 描述
## 语法

`VARCHAR mask(VARCHAR str[, VARCHAR upper[, VARCHAR lower[, VARCHAR number]]])`

返回 str 的掩码版本。 默认情况下，大写字母转换为“X”，小写字母转换为“x”，数字转换为“n”。 例如 mask("abcd-EFGH-8765-4321") 结果为 xxxx-XXXX-nnnn-nnnn。 您可以通过提供附加参数来覆盖掩码中使用的字符：第二个参数控制大写字母的掩码字符，第三个参数控制小写字母，第四个参数控制数字。 例如，mask("abcd-EFGH-8765-4321", "U", "l", "#") 会得到 llll-UUUU-####-####。

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

mysql> select mask(name) from test;
+--------------+
| mask(`name`) |
+--------------+
| xxxnnnXXX    |
| NULL         |
| nnnXxXxXx    |
+--------------+

mysql> select mask(name, '*', '#', '$') from test;
+-----------------------------+
| mask(`name`, '*', '#', '$') |
+-----------------------------+
| ###$$$***                   |
| NULL                        |
| $$$*#*#*#                   |
+-----------------------------+
```

### keywords
    mask
