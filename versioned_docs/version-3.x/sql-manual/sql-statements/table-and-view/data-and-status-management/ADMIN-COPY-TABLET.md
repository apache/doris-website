---
{
    "title": "ADMIN COPY TABLET",
    "language": "en",
    "description": "This statement is used to make a snapshot for the specified tablet, mainly used to load the tablet locally to reproduce the problem."
}
---

## Description

This statement is used to make a snapshot for the specified tablet, mainly used to load the tablet locally to reproduce
the problem.

## Syntax

```sql
ADMIN COPY TABLET <tablet_id> PROPERTIES ("<key>"="<value>" [,...]).
```

## Required Parameters

**1. `<tablet_id>`**

The ID of the tablet to be copied.

## Optional Parameters

  ```sql
  [ PROPERTIES ("<key>"="<value>" [, ... ]) ]
  ```

The PROPERTIES clause allows specifying additional parameters:

**1. `<backend_id>`**

Specifies the id of the BE node where the replica is located. If not specified, a replica is randomly selected.

**2. `<version>`**

Specifies the version of the snapshot. The version must be less than or equal to the largest version of the replica. If
not specified, the largest version is used.

**3. `<expiration_minutes>`**

Snapshot retention time. The default is 1 hour. It will automatically clean up after a timeout. Unit minutes.

## Return Value

| Column            | DataType | Note                                                                                                                                                                                                                 |
|-------------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| TabletId          | string   | The ID of the tablet for which the snapshot was created.                                                                                                                                                             |
| BackendId         | string   | The ID of the BE node where the snapshot is stored.                                                                                                                                                                  |
| Ip                | string   | The IP address of the BE node storing the snapshot.                                                                                                                                                                  |
| Path              | string   | The storage path where the snapshot is saved on the BE node.                                                                                                                                                         |
| ExpirationMinutes | string   | The duration (in minutes) after which the snapshot will be automatically deleted.                                                                                                                                    |
| CreateTableStmt   | string   | The table creation statement for the table corresponding to the tablet. This statement is not the original table-building statement, but a simplified table-building statement for later loading the tablet locally. |

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege  | Object   | Notes                                                                                                                            |
|:-----------|:---------|:---------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv | Database | Required to execute administrative operations on the database, including managing tables, partitions, and system-level commands. |

## Examples

- Take a snapshot of the replica on the specified BE node

  ```sql
  ADMIN COPY TABLET 10020 PROPERTIES("backend_id" = "10003");
  ```
  
  ```text
           TabletId: 10020
          BackendId: 10003
                 Ip: 192.168.10.1
               Path: /path/to/be/storage/snapshot/20220830101353.2.3600
  ExpirationMinutes: 60
    CreateTableStmt: CREATE TABLE `tbl1` (
    `k1` int(11) NULL,
    `k2` int(11) NULL
  ) ENGINE=OLAP
  DUPLICATE KEY(`k1`, `k2`)
  DISTRIBUTED BY HASH(k1) BUCKETS 1
  PROPERTIES (
  "replication_num" = "1",
  "version_info" = "2"
  );
  ```

- Take a snapshot of the specified version of the replica on the specified BE node

  ```sql
  ADMIN COPY TABLET 10010 PROPERTIES("backend_id" = "10003", "version" = "10");
  ```
  
  ```text
           TabletId: 10010
          BackendId: 10003
                 Ip: 192.168.10.1
               Path: /path/to/be/storage/snapshot/20220830101353.2.3600
  ExpirationMinutes: 60
    CreateTableStmt: CREATE TABLE `tbl1` (
    `k1` int(11) NULL,
    `k2` int(11) NULL
  ) ENGINE=OLAP
  DUPLICATE KEY(`k1`, `k2`)
  DISTRIBUTED BY HASH(k1) BUCKETS 1
  PROPERTIES (
  "replication_num" = "1",
  "version_info" = "2"
  );
  ```

