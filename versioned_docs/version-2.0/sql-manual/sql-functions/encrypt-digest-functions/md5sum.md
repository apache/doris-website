---
{
"title": "MD5SUM",
"language": "en"
}
---

### description

Calculates an MD5 128-bit checksum for the strings

### Syntax

```sql
MD5SUM(str[,str])
```

### example

```sql
select md5("abcd");
```

```
+----------------------------------+
| md5('abcd')                      |
+----------------------------------+
| e2fc714c4727ee9395f324cd2e7f331f |
+----------------------------------+
```

```sql
select md5sum("ab","cd");
```

```
+----------------------------------+
| md5sum('ab', 'cd')               |
+----------------------------------+
| e2fc714c4727ee9395f324cd2e7f331f |
+----------------------------------+
```
