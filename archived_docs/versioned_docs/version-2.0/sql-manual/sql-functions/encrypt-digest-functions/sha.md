---
{
"title": "SHA",
"language": "en"
}
---

### description

Use SHA1 to digest the message.

### Syntax

``` sql
{ SHA | SHA1 }(str)
```

### example

```SQL
select sha("123");
```

```
+------------------------------------------+
| sha1('123')                              |
+------------------------------------------+
| 40bd001563085fc35165329ea1ff5c5ecbdbbeef |
+------------------------------------------+
```
