---
{
    "title": "MASK_LAST_N",
    "language": "en"
}
---

## mask_last_n
### description
#### syntax

`VARCHAR mask_last_n(VARCHAR str[, INT n])`

Returns a masked version of str with the last n values masked. Upper case letters are converted to "X", lower case letters are converted to "x" and numbers are converted to "n". For example, mask_last_n("1234-5678-8765-4321", 4) results in 1234-5678-8765-nnnn.

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
