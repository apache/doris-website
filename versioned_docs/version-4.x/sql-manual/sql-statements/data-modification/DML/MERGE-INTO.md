---
{
    "title": "MERGE-INTO",
    "language": "en"
}
---

## Description

Inserts, updates, and deletes values in a table that are based on values in a second table or a subquery. Merging can be useful if the second table is a change log that contains new rows (to be inserted), modified rows (to be updated), or marked rows (to be deleted) in the target table.

The command supports semantics for handling the following cases:

- Values that match (for updates and deletes).
- Values that don’t match (for inserts).

The target table for this command must be a UNIQUE KEY model table.

## Syntax

```sql
MERGE INTO <target_table>
    USING <source>
    ON <join_expr>
    { matchedClause | notMatchedClause } [ ... ]
```

where

```sql
matchedClause ::=
    WHEN MATCHED
        [ AND <case_predicate> ]
        THEN { UPDATE SET <col_name> = <expr> [ , <col_name> = <expr> ... ] | DELETE } 
```

```sql
notMatchedClause ::=
    WHEN NOT MATCHED
        [ AND <case_predicate> ]
        THEN INSERT [ ( <col_name> [ , ... ] ) ] VALUES ( <expr> [ , ... ] )
```

## Parameters

**\<target_table\>**

> Specifies the table to merge.


**\<source\>**

> Specifies the table or subquery to join with the target table.

**\<join_expr\>**

> Specifies the expression on which to join the target table and source.

### matchedClause (for updates or deletes)

**WHEN MATCHED ... AND \<case_predicate\>**

> Optionally specifies an expression which, when true, causes the matching case to be executed.  
> Default: No value (matching case is always executed)

**WHEN MATCHED ... THEN { UPDATE SET ... | DELETE }**

> Specifies the action to perform when the values match.

**SET col_name = expr [ , col_name = expr ... ]**

> Updates the specified column in the target table by using the corresponding expression for the new column value (can refer to both the target and source relations).  
> In a single SET subclause, you can specify multiple columns to update.

**DELETE**

> Deletes the rows in the target table when they match the source.

### notMatchedClause (for inserts)

**WHEN NOT MATCHED ... AND \<case_predicate\>**

> Optionally specifies an expression which, when true, causes the not-matching case to be executed.
> Default: No value (not-matching case is always executed)

**WHEN NOT MATCHED ... THEN INSERT [ ( col_name [ , ... ] ) ] VALUES ( expr [ , ... ] )**

> Specifies the action to perform when the values don’t match.

**( col_name [ , ... ] )**

> Optionally specifies one or more columns in the target table to be inserted with values from the source.
> Default: No value (all columns in the target table are inserted)

**VALUES ( expr [ , ... ] )**

> Specifies the corresponding expressions for the inserted column values (must refer to the source relations).

## Access Control Requirements

The [user](../../../../admin-manual/auth/authentication-and-authorization.md) executing this SQL command must have at least the following [privileges](../../../../admin-manual/auth/authentication-and-authorization.md):

| Privilege | Object | Description |
| :---------------- | :------------ | :- |
| SELECT_PRIV       | target table and source |  |
| LOAD_PRIV       | target table |  |

## Usage Note

- The target table for this command must be a UNIQUE KEY model table.
- A single MERGE statement can include multiple matching and not-matching clauses (that is, WHEN MATCHED ... and WHEN NOT MATCHED ...).
- Any matching or not-matching clause that omits the AND subclause (default behavior) must be the last of its clause type in the statement (for example, a WHEN MATCHED ... clause can’t be followed by a WHEN MATCHED AND ... clause). Doing so results in an unreachable case, which returns an error.

### Duplicate join behavior¶

Currently, Doris does not detect whether duplicate join rows occur. If they do, the behavior is undefined.

If, after the join, multiple operations (such as update, delete, or insert) are applied to the same target table row simultaneously, the behavior is similar to that of an INSERT statement: if a Sequence column exists, the final written data is determined by the value of the Sequence column; otherwise, one of the rows is written arbitrarily.

## Examples

The following example performs a basic merge operation, updating data in the target table using values from the source table. First, create and load two tables:

```sql
CREATE TABLE `merge_into_source_table` (
      `c1` int NULL,
      `c2` varchar(255) NULL
    ) ENGINE=OLAP
    PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
    );

CREATE TABLE `merge_into_target_base_table` (
      `c1` int NULL,
      `c2` varchar(255) NULL
    ) ENGINE=OLAP
    UNIQUE KEY(`c1`)
    DISTRIBUTED BY HASH(`c1`)
    PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
    );

INSERT INTO merge_into_source_table VALUES (1, 12), (2, 22), (3, 33);
INSERT INTO merge_into_target_base_table VALUES (1, 1), (2, 10);
```

Display the values in the tables:

```sql
SELECT * FROM merge_into_source_table;
```

```
+----+----+
| c1 | c2 |
+----+----+
| 1  | 12 |
| 2  | 22 |
| 3  | 33 |
+----+----+
```

```sql
SELECT * FROM merge_into_target_base_table;
```

```
+----+----+
| c1 | c2 |
+----+----+
| 2  | 10 |
| 1  | 1  |
+----+----+
```

Run the MERGE statement:

```sql
WITH tmp AS (SELECT * FROM merge_into_source_table)
MERGE INTO merge_into_target_base_table t1
    USING tmp t2
    ON t1.c1 = t2.c1
    WHEN MATCHED AND t1.c2 = 10 THEN DELETE
    WHEN MATCHED THEN UPDATE SET c2 = 10
    WHEN NOT MATCHED THEN INSERT VALUES(t2.c1, t2.c2)
```

Display the new values in the target table (the source table is unchanged):


```sql
SELECT * FROM merge_into_target_base_table;
```

```
+----+----+
| c1 | c2 |
+----+----+
| 3  | 33 |
| 1  | 10 |
+----+----+
```