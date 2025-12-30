---
{
    "title": "SHOW EXPORT",
    "language": "en",
    "description": "This statement is used to display the execution status of a specified export job."
}
---

## Description

This statement is used to display the execution status of a specified export job.

## Syntax

```sql
SHOW EXPORT
[ FROM <db_name> ]
  [
    WHERE
      [ ID = <job_id> ]
      [ STATE = { "PENDING" | "EXPORTING" | "FINISHED" | "CANCELLED" } ]
      [ LABEL = <label> ]
   ]
[ ORDER BY <column_name> [ ASC | DESC ] [, column_name [ ASC | DESC ] ... ] ]
[ LIMIT <limit> ];
```

## Optional Parameters

**1. `<db_name>`**: Optional parameter. If not specified, the current default database will be used.

**2. `<job_id>`**: Optional parameter. Used to specify the export job ID to display.

**3. `<label>`**: Optional parameter. Used to specify the label of the export job to display.

**4. `<column_name>`**: Optional parameter. Used to specify the column name for sorting.

**5. `<limit>`**: Optional parameter. If specified, only the specified number of matching records will be displayed; if not specified, all records will be displayed.


## Return Value

| Column      | DataType    | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
|-------------|-------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| JobId       | string      | Unique ID of the job                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Label       | string      | The label of the export job. If not specified, the system will generate one by default.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| State       | string      | Job status: <br> - `PENDING`: Job waiting for scheduling <br> - `EXPORTING`: Data exporting <br> - `FINISHED`: Job successful <br> - `CANCELLED`: Job failed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Progress    | string      | Job progress. This progress is measured in query plan units. For example, if there are 10 threads and 3 are completed, the progress is 30%.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| TaskInfo    | json        | Job information displayed in JSON format: <br> - db: Database name <br> - tbl: Table name <br> - partitions: Specified partitions for export, `empty` list means all partitions <br> - column_separator: Column delimiter for the exported file <br> - line_delimiter: Line delimiter for the exported file <br> - tablet num: Total number of involved tablets <br> - broker: Name of the broker used <br> - coord num: Number of query plans <br> - max_file_size: Maximum size of an exported file <br> - delete_existing_files: Whether to delete existing files and directories in the export directory <br> - columns: Columns to export, empty value means export all columns <br> - format: File format of the export |
| Path        | string      | Export path on remote storage                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| CreateTime  | string      | Job creation time                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| StartTime   | string      | Job start time                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| FinishTime  | string      | Job finish time                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Timeout     | int         | Job timeout (in seconds). The time is calculated from CreateTime.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ErrorMsg    | string      | If the job encounters an error, the error reason will be displayed here.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| OutfileInfo | string      | If the export job is successful, the specific `SELECT INTO OUTFILE` result information will be displayed here.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege    | Object              | Notes                                           |
|:-------------|:--------------------|:------------------------------------------------|
| SELECT_PRIV  | Database (Database) | Requires read access to the database and table. |


## Examples

- Display all export jobs for the default db

    ```sql
    SHOW EXPORT;
    ```

- Display export jobs for a specified db, ordered by StartTime in descending order

    ```sql
     SHOW EXPORT FROM example_db ORDER BY StartTime DESC;
    ```

- Display export jobs for a specified db where the state is "exporting", ordered by StartTime in descending order

    ```sql
    SHOW EXPORT FROM example_db WHERE STATE = "exporting" ORDER BY StartTime DESC;
    ```

- Display export job for a specified db and job_id

    ```sql
      SHOW EXPORT FROM example_db WHERE ID = job_id;
    ```

- Display export job for a specified db and label

    ```sql
     SHOW EXPORT FROM example_db WHERE LABEL = "mylabel";
    ```

