---
{
    "title": "TO_MONDAY",
    "language": "en",
    "description": "Round a date or datetime down to the nearest Monday, return type is Date or DateV2. Specially, input 1970-01-01, 1970-01-02,"
}
---

## to_monday
### Description
#### Syntax

`DATE to_monday(DATETIME date)`

Round a date or datetime down to the nearest Monday, return type is Date or DateV2.
Specially, input 1970-01-01, 1970-01-02, 1970-01-03 and 1970-01-04 will return '1970-01-01'

### example

```
MySQL [(none)]> select to_monday('2022-09-10');
+----------------------------------+
| to_monday('2022-09-10 00:00:00') |
+----------------------------------+
| 2022-09-05                       |
+----------------------------------+
```

### keywords
    MONDAY
