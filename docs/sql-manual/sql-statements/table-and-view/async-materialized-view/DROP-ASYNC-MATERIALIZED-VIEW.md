---
{
    "title": "DROP ASYNC MATERIALIZED VIEW",
    "language": "en",
    "description": "This statement is used to delete asynchronous materialized views."
}
---

## Description

This statement is used to delete asynchronous materialized views.

syntax:

```sql
DROP MATERIALIZED VIEW (IF EXISTS)? mvName=multipartIdentifier
```


1. IF EXISTS:
   If the materialized view does not exist, do not throw an error. If this keyword is not declared and the materialized view does not exist, an error will be reported.

2. mv_name:
   The name of the materialized view to be deleted. Required field.

## Example

1. Delete table materialized view mv1

```sql
DROP MATERIALIZED VIEW mv1;
```
2.If present, delete the materialized view of the specified database

```sql
DROP MATERIALIZED VIEW IF EXISTS db1.mv1;
```

## Keywords

    DROP, ASYNC, MATERIALIZED, VIEW

## Best Practice

