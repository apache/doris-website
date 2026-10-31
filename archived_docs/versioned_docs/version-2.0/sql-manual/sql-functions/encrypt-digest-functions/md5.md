---
{
"title": "MD5",
"language": "en"
}
---

### description

Calculates an MD5 128-bit checksum for the string

### Syntax

```
MD5(str)
```

### example

```sql
select md5("abc");
```

```
+----------------------------------+
| md5('abc')                       |
+----------------------------------+
| 900150983cd24fb0d6963f7d28e17f72 |
+----------------------------------+
```
