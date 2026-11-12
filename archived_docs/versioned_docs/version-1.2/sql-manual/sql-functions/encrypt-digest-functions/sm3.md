---
{
"title": "SM3",
"language": "en"
}
---

## SM3

### description
Calculates an SM3 256-bit checksum for the string
#### Syntax

`SM3(str)`

### example

```
MySQL > select sm3("abcd");
+------------------------------------------------------------------+
| sm3('abcd')                                                      |
+------------------------------------------------------------------+
| 82ec580fe6d36ae4f81cae3c73f4a5b3b5a09c943172dc9053c69fd8e18dca1e |
+------------------------------------------------------------------+
1 row in set (0.009 sec)
```

### keywords

    SM3