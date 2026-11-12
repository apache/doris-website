---
{
    "title": "CREATE-TABLE-LIKE",
    "language": "en"
}
---

## CREATE-TABLE-LIKE

### Name

CREATE TABLE LIKE

### Description

This statement is used to create an empty table with the exact same table structure as another table, and can optionally replicate some rollups.

grammar:

```sql
CREATE [EXTERNAL] TABLE [IF NOT EXISTS] [database.]table_name LIKE [database.]table_name [WITH ROLLUP (r1,r2,r3,...)]
```

illustrate: 

- The copied table structure includes Column Definition, Partitions, Table Properties, etc.
- The user needs to have `SELECT` permission on the copied original table
- Support for copying external tables such as MySQL
- Support the rollup of copying OLAP Table

### Example

1. Create an empty table with the same table structure as table1 under the test1 library, the table name is table2

    ```sql
    CREATE TABLE test1.table2 LIKE test1.table1
    ```

2. Create an empty table with the same table structure as test1.table1 under the test2 library, the table name is table2

    ```sql
    CREATE TABLE test2.table2 LIKE test1.table1
    ```

3. Create an empty table with the same table structure as table1 under the test1 library, the table name is table2, and copy the two rollups of r1 and r2 of table1 at the same time

    ```sql
    CREATE TABLE test1.table2 LIKE test1.table1 WITH ROLLUP (r1,r2)
    ```

4. Create an empty table with the same table structure as table1 under the test1 library, the table name is table2, and copy all the rollups of table1 at the same time

    ```sql
    CREATE TABLE test1.table2 LIKE test1.table1 WITH ROLLUP
    ```

5. Create an empty table with the same table structure as test1.table1 under the test2 library, the table name is table2, and copy the two rollups of r1 and r2 of table1 at the same time

    ```sql
    CREATE TABLE test2.table2 LIKE test1.table1 WITH ROLLUP (r1,r2)
    ```

6. Create an empty table with the same table structure as test1.table1 under the test2 library, the table name is table2, and copy all the rollups of table1 at the same time

    ```sql
    CREATE TABLE test2.table2 LIKE test1.table1 WITH ROLLUP
    ```

7. Create an empty table under the test1 library with the same table structure as the MySQL outer table1, the table name is table2

    ```sql
    CREATE TABLE test1.table2 LIKE test1.table1
    ```

### Keywords

    CREATE, TABLE, LIKE

### Best Practice

