---
{
    "title": "SHOW VIEW",
    "language": "en",
    "description": "This statement is used to display all views based on the given table"
}
---

## Description

This statement is used to display all views based on the given table

grammar:

```sql
  SHOW VIEW { FROM | IN } table [ FROM db ]
```

## Example

1. Show all views created based on table testTbl

    ```sql
    SHOW VIEW FROM testTbl;
    ```

## Keywords

    SHOW, VIEW

## Best Practice

