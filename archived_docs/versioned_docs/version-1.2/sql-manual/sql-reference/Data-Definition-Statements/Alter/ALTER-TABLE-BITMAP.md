---
{
    "title": "ALTER-TABLE-BITMAP",
    "language": "en"
}
---

## ALTER-TABLE-BITMAP

### Name

ALTER TABLE BITMAP

### Description

This statement is used to perform a bitmap index operation on an existing table.

grammar:

```sql
ALTER TABLE [database.]table alter_clause;
```

The alter_clause of bitmap index supports the following modification methods

1. Create a bitmap index

 Syntax:

```sql
ADD INDEX [IF NOT EXISTS] index_name (column [, ...],) [USING BITMAP] [COMMENT 'balabala'];
```

Notice:

- Currently only supports bitmap indexes
- BITMAP indexes are only created on a single column

2. Delete the index

Syntax:

```sql
DROP INDEX [IF EXISTS] index_name;
```

### Example

1. Create a bitmap index for siteid on table1

```sql
ALTER TABLE table1 ADD INDEX [IF NOT EXISTS] index_name (siteid) [USING BITMAP] COMMENT 'balabala';
```

2. Delete the bitmap index of the siteid column on table1

```sql
ALTER TABLE table1 DROP INDEX [IF EXISTS] index_name;
```

### Keywords

```text
ALTER, TABLE, BITMAP, INDEX, ALTER TABLE
```

### Best Practice
