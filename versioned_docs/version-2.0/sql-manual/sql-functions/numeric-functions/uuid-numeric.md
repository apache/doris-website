---
{
    "title": "UUID_NUMERIC",
    "language": "en"
}
---

## uuid_numeric
### description
#### Syntax

`LARGEINT uuid_numeric()`

Return a uuid in type `LARGEINT`. 

Note that `LARGEINT` has type Int128, so we could get a negative number from `uuid_numeric()`.

### example

```

mysql> select uuid_numeric();
+----------------------------------------+
| uuid_numeric()                         |
+----------------------------------------+
| 82218484683747862468445277894131281464 |
+----------------------------------------+
```

### keywords
    
    UUID UUID-NUMERIC 
