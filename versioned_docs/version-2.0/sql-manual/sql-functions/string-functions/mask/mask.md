---
{
    "title": "MASK",
    "language": "en"
}
---

## mask
### description
#### syntax

`VARCHAR mask(VARCHAR str[, VARCHAR upper[, VARCHAR lower[, VARCHAR number]]])`

Returns a masked version of str . By default, upper case letters are converted to "X", lower case letters are converted to "x" and numbers are converted to "n". For example mask("abcd-EFGH-8765-4321") results in xxxx-XXXX-nnnn-nnnn. You can override the characters used in the mask by supplying additional arguments: the second argument controls the mask character for upper case letters, the third argument for lower case letters and the fourth argument for numbers. For example, mask("abcd-EFGH-8765-4321", "U", "l", "#") results in llll-UUUU-####-####.

### example

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
