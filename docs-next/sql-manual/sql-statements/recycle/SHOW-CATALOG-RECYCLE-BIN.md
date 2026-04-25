---
{
    "title": "SHOW CATALOG RECYCLE BIN",
    "language": "en",
    "description": "This statement is used to display the recoverable metadata of databases, tables, or partitions in the recycle bin."
}
---

## Description

This statement is used to display the recoverable metadata of databases, tables, or partitions in the recycle bin.

## Syntax

```sql
SHOW CATALOG RECYCLE BIN [ WHERE NAME [ = "<name>" | LIKE "<name_matcher>"] ]
```

## Optional Parameters

Filter by name

**1. `<name>`**
> The name of the database, table, or partition.

Filter by pattern matching

**1. `<name_matcher>`**
> The pattern matching for the name of the database, table, or partition.

## Return Values

| Column         | Type     | Note                                                                                                                                                                             |
|----------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Type           | String   | Metadata type: Database, Table, Partition                                                                                                                                        |
| Name           | String   | Metadata name                                                                                                                                                                    |
| DbId           | Bigint   | ID of the database                                                                                                                                                               |
| TableId        | Bigint   | ID of the table                                                                                                                                                                  |
| PartitionId    | Bigint   | ID of the partition                                                                                                                                                              |
| DropTime       | DateTime | Time when the metadata was moved to the recycle bin                                                                                                                              |
| DataSize       | Bigint   | Data size. If the metadata type is database, this value includes the data size of all tables and partitions in the recycle bin                                                   |
| RemoteDataSize | Decimal  | Data size on remote storage (HDFS or object storage). If the metadata type is database, this value includes the remote data size of all tables and partitions in the recycle bin |

## Access Control Requirements

| Privilege   | Object | Notes |
|-------------|--------|-------|
| ADMIN_PRIV  |        |       |

## Examples

1. Display all metadata in the recycle bin

    ```sql
    SHOW CATALOG RECYCLE BIN;
    ```

2. Display metadata with the name 'test' in the recycle bin

    ```sql
    SHOW CATALOG RECYCLE BIN WHERE NAME = 'test';
    ```

3. Display metadata with names starting with 'test' in the recycle bin

    ```sql
    SHOW CATALOG RECYCLE BIN WHERE NAME LIKE 'test%';
    ```
