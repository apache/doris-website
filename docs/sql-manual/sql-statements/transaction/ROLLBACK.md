---
{
    "title": "ROLLBACK",
    "language": "en"
}
---

## Description

Rollback an explicit transaction. It is used in pairs with [BEGIN](./BEGIN).

## Syntax（Syntax）

```sql
ROLLBACK
```

## Usage Notes

- If an explicit transaction is not started, executing this command will not take effect.

## Examples

The following example creates a table named `test`, starts a transaction, inserts two rows of data, rolls back the transaction, and then executes a query.

```sql
CREATE TABLE `test` (
  `ID` int NOT NULL,
  `NAME` varchar(100) NULL,
  `SCORE` int NULL
) ENGINE=OLAP
DUPLICATE KEY(`ID`)
DISTRIBUTED BY HASH(`ID`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);

BEGIN;
INSERT INTO test VALUES(1, 'Bob', 100);
INSERT INTO test VALUES(2, 'Bob', 100);
ROLLBACK;
SELECT * FROM test;
```
