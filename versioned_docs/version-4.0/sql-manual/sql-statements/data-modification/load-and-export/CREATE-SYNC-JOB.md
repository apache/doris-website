---
{
    "title": "CREATE SYNC JOB",
    "language": "en"
}
---

## Description

The data synchronization (Sync Job) function allows users to submit a persistent data synchronization job. It incrementally synchronizes the CDC (Change Data Capture) of data update operations from a MySQL database by reading the Binlog from a specified remote source. Currently, the synchronization job supports connecting to Canal, obtaining parsed Binlog data from the Canal server, and importing it into Doris.

Users can view the status of synchronization jobs via [SHOW SYNC JOB](../../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-SYNC-JOB).

## Syntax

```sql
CREATE SYNC [<db>.]<job_name>
(<channel_desc> [, ... ])
<binlog_desc>
```
where:
```sql
channel_desc
  : FROM <mysql_db>.<src_tbl> INTO <des_tbl> [ <columns_mapping> ]
```
```sql
binlog_desc
  : FROM BINLOG ("<key>" = "<value>" [, ... ])
```

## Required Parameters

**1. `<job_name>`**

> Specifies the unique name of the synchronization job within the current database. Only one job with the same `<job_name>` can be running at a time.

**2. `<channel_desc>`**

> Describes the mapping relationship between the MySQL source table and the Doris target table.
>
>
> - **`<mysql_db.src_tbl>`**: Specifies the source table in MySQL (including the database name).
> - **`<des_tbl>`**: Specifies the target table in Doris. The target table must be unique, and its batch delete function must be enabled.
> - **`<columns_mapping>`** (Optional): Defines the mapping between columns of the source and target tables. If omitted, columns are mapped one-to-one in order. Note that the form `col_name = expr` is not supported.

**3. `<binlog_desc>`**

> Describes the remote data source for the Binlog.
>
> The properties for the Canal data source (keys prefixed with `canal.`) include:
>
> - **`canal.server.ip`**: Address of the Canal server.
> - **`canal.server.port`**: Port of the Canal server.
> - **`canal.destination`**: Identifier of the Canal instance.
> - **`canal.batchSize`**: Maximum batch size to fetch (default is 8192).
> - **`canal.username`**: Username for the Canal instance.
> - **`canal.password`**: Password for the Canal instance.
> - **`canal.debug`** (Optional): If set to true, prints detailed batch and row information.

## Usage Notes

- Currently, the synchronization job only supports connecting to a Canal server.
- Only one synchronization job with the same `<job_name>` can run concurrently within a database.
- The target table specified in `<channel_desc>` must have its batch delete function enabled.

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:
| Privilege | Object | Notes                |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV        | Table   | This operation can only be performed by users or roles who have the LOAD_PRIV privilege for the imported table. |

## Examples

1. **Create a simple synchronization job**

   Create a synchronization job named `job1` in the `test_db` database that maps the MySQL source table `mysql_db1.tbl1` to the Doris target table `test_tbl`, connecting to a local Canal server.

   ```sql
   CREATE SYNC `test_db`.`job1`
   (
     FROM `mysql_db1`.`tbl1` INTO `test_tbl`
   )
   FROM BINLOG
   (
     "type" = "canal",
     "canal.server.ip" = "127.0.0.1",
     "canal.server.port" = "11111",
     "canal.destination" = "example",
     "canal.username" = "",
     "canal.password" = ""
   );
   ```

2. **Create a synchronization job with multiple channels and explicit column mapping**

   Create a synchronization job named `job1` in the `test_db` database for multiple MySQL source tables with one-to-one mapping and explicitly specified column orders.

   ```sql
   CREATE SYNC `test_db`.`job1`
   (
     FROM `mysql_db`.`t1` INTO `test1` (k1, k2, v1),
     FROM `mysql_db`.`t2` INTO `test2` (k3, k4, v2)
   )
   FROM BINLOG
   (
     "type" = "canal",
     "canal.server.ip" = "xx.xxx.xxx.xx",
     "canal.server.port" = "12111",
     "canal.destination" = "example",
     "canal.username" = "username",
     "canal.password" = "password"
   );
   ```