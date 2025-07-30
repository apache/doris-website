---
{
    "title": "SHOW TABLET",
    "language": "en"
}
---

## Description

This statement is used to show details of a specific tablet (only for administrators).

## Syntax

```sql
SHOW TABLET <tablet_id>;
```

## Required Parameters

**1. `<tablet_id>`**

> The ID of the specific tablet to display information for.

## Return Value

When using `SHOW TABLET <tablet_id>`, the following columns are returned:

| Column        | DataType | Note                                                                   |
|---------------|----------|------------------------------------------------------------------------|
| DbName        | String   | The name of the database that contains the tablet.                     |
| TableName     | String   | The name of the table that contains the tablet.                        |
| PartitionName | String   | The name of the partition that contains the tablet.                    |
| IndexName     | String   | The name of the index that contains the tablet.                        |
| DbId          | Int      | The ID of the database.                                                |
| TableId       | Int      | The ID of the table.                                                   |
| PartitionId   | Int      | The ID of the partition.                                               |
| IndexId       | Int      | The ID of the index.                                                   |
| IsSync        | Boolean  | Whether the tablet is in sync with its replicas.                       |
| Order         | Int      | The order of the tablet.                                               |
| QueryHits     | Int      | The number of query hits on this tablet.                               |
| DetailCmd     | String   | The command to get more detailed information about the tablet.         |

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege  | Object   | Notes                                                                                                                            |
|:-----------|:---------|:---------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv | Database | Required to execute administrative operations on the database, including managing tables, partitions, and system-level commands. |

## Examples

Show details of a specific tablet:

```sql
SHOW TABLET 10145;
```

```text
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+------------------------------------------------------------+
| DbName | TableName | PartitionName | IndexName | DbId  | TableId | PartitionId | IndexId | IsSync | Order | QueryHits | DetailCmd                                                  |
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+------------------------------------------------------------+
| test   | sell_user | sell_user     | sell_user | 10103 | 10143   | 10142       | 10144   | true   | 0     | 0         | SHOW PROC '/dbs/10103/10143/partitions/10142/10144/10145'; |
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+------------------------------------------------------------+
```
