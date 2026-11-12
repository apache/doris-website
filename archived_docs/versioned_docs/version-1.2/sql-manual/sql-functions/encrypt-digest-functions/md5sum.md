---
{
"title": "MD5SUM",
"language": "en"
}
---

## MD5SUM

### description
Calculates an MD5 128-bit checksum for the strings
#### Syntax

`MD5SUM(str[,str])`

### example

```
MySQL > select md5("abcd");
+----------------------------------+
| md5('abcd')                      |
+----------------------------------+
| e2fc714c4727ee9395f324cd2e7f331f |
+----------------------------------+
1 row in set (0.011 sec)

MySQL > select md5sum("ab","cd");
+----------------------------------+
| md5sum('ab', 'cd')               |
+----------------------------------+
| e2fc714c4727ee9395f324cd2e7f331f |
+----------------------------------+
1 row in set (0.008 sec)

```

### keywords

    MD5SUM