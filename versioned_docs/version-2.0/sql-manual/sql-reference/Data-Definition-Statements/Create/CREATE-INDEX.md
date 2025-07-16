---
{
    "title": "CREATE-INDEX",
    "language": "en"
}
---

## CREATE-INDEX

### Name

CREATE INDEX

### Description

This statement is used to create an index
grammar:

```sql
CREATE INDEX [IF NOT EXISTS] index_name ON table_name (column [, ...],) [USING INVERTED] [COMMENT 'balabala'];
```
Notice:
- INVERTED indexes are only created on a single column

### Example

1. Create a inverted index for siteid on table1

    ```sql
    CREATE INDEX [IF NOT EXISTS] index_name ON table1 (siteid) USING INVERTED COMMENT 'balabala';
    ```


### Keywords

```text
CREATE, INDEX
```

### Best Practice

