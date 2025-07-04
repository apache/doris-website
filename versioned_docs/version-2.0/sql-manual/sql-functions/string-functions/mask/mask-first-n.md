---
{
    "title": "MASK_FIRST_N",
    "language": "en"
}
---

## mask_first_n
### description
#### syntax

`VARCHAR mask_first_n(VARCHAR str[, INT n])`

Returns a masked version of str with the first n values masked. Upper case letters are converted to "X", lower case letters are converted to "x" and numbers are converted to "n". For example, mask_first_n("1234-5678-8765-4321", 4) results in nnnn-5678-8765-4321.

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
