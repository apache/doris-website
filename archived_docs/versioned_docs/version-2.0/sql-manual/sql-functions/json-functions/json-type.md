---
{
    "title": "JSON_TYPE",
    "language": "en"
}
---

## json_type

### description

It is used to determine the type of the field specified by json_path in JSON data. If the field does not exist, return NULL. If it exists, return one of the following types

- object
- array
- null
- bool
- int
- bigint
- largeint
- double
- string

#### Syntax

```sql
STRING json_type(JSON j, VARCHAR json_path)
```

### example

Refer to [json tutorial](../../sql-reference/Data-Types/JSON.md)

### keywords

json_type

