---
{
    "title": "COMMIT",
    "language": "en",
    "description": "Submit an explicit transaction, used in pairs with BEGIN."
}
---

## Description

Submit an explicit transaction, used in pairs with [BEGIN](./BEGIN).

## Syntax

```sql
COMMIT
```

## Notes

- If an explicit transaction is not enabled, executing this command will not take effect.

## Example

The following example creates a table named `test`, starts a transaction, inserts two rows of data, commits the transaction, and then executes a query.

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
INSERT INTO test VALUES(1, 'Alice', 100);
INSERT INTO test VALUES(2, 'Bob', 100);
COMMIT;
SELECT * FROM test;
```
