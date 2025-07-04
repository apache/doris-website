---
{
    "title": "JSONB_TYPE",
    "language": "en"
}
---

## jsonb_type

### description

It is used to determine the type of the field specified by json_path in JSONB data. If the field does not exist, return NULL. If it exists, return one of the following types

- object
- array
- null
- bool
- int
- bigint
- double
- string

#### Syntax

```sql
STRING jsonb_type(JSONB j, VARCHAR json_path)
```

### example

Refer to [jsonb tutorial](../../sql-reference/Data-Types/JSONB.md)

### keywords

jsonb_type

