---
{
    "title": "ALTER-TABLE-COMMENT",
    "language": "en"
}
---

## ALTER-TABLE-COMMENT

### Name

ALTER TABLE COMMENT

### Description

This statement is used to modify the comment of an existing table. The operation is synchronous, and the command returns to indicate completion.

grammar：

```sql
ALTER TABLE [database.]table alter_clause;
```

1. Modify table comment

grammar：

```sql
MODIFY COMMENT "new table comment";
```

2. Modify column comment

grammar：

```sql
MODIFY COLUMN col1 COMMENT "new column comment";
```

### Example

1. Change the table1's comment to table1_comment

```sql
ALTER TABLE table1 MODIFY COMMENT "table1_comment";
```

2. Change the table1's col1 comment to table1_comment

```sql
ALTER TABLE table1 MODIFY COLUMN col1 COMMENT "table1_col1_comment";
```

### Keywords

```text
ALTER, TABLE, COMMENT, ALTER TABLE
```

### Best Practice

