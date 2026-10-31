---
{
    "title": "CANCEL-ALTER-TABLE",
    "language": "en"
}
---

## CANCEL-ALTER-TABLE

### Name

CANCEL ALTER TABLE

### Description

This statement is used to undo an ALTER operation.

1. Undo the ALTER TABLE COLUMN operation

grammar:

```sql
CANCEL ALTER TABLE COLUMN
FROM db_name.table_name
```

2. Undo the ALTER TABLE ROLLUP operation

grammar:

```sql
CANCEL ALTER TABLE ROLLUP
FROM db_name.table_name
```

3. Batch cancel rollup operations based on job id

grammar:

```sql
CANCEL ALTER TABLE ROLLUP
FROM db_name.table_name (jobid,...)
```

Notice:

- This command is an asynchronous operation. You need to use `show alter table rollup` to check the task status to confirm whether the execution is successful or not.

4. Undo the ALTER CLUSTER operation

grammar:

```
(To be implemented...)
```

### Example

1. Undo the ALTER COLUMN operation on my_table.

   [CANCEL ALTER TABLE COLUMN]

```sql
CANCEL ALTER TABLE COLUMN
FROM example_db.my_table;
```

1. Undo the ADD ROLLUP operation under my_table.

   [CANCEL ALTER TABLE ROLLUP]

```sql
CANCEL ALTER TABLE ROLLUP
FROM example_db.my_table;
```

1. Undo the ADD ROLLUP operation under my_table according to the job id.

   [CANCEL ALTER TABLE ROLLUP]

```sql
CANCEL ALTER TABLE ROLLUP
FROM example_db.my_table(12801,12802);
```

### Keywords

    CANCEL, ALTER, TABLE, CANCEL ALTER

### Best Practice

