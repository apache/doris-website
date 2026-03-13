---
{
    "title": "BROKER LOAD",
    "language": "en",
    "description": "Broker Load is a data import method in Doris, primarily used to import large scale data from remote storage systems such as HDFS or S3."
}
---

## Description

Broker Load is a data import method in Doris, primarily used to import large scale data from remote storage systems such as HDFS or S3. It is initiated through the MySQL API and is an asynchronous import method. The import progress and results can be queried using the `SHOW LOAD` statement.

In earlier versions, S3 and HDFS Load relied on the Broker process. Now, data is read directly from the data source without relying on an additional Broker process. Nevertheless, due to the similar syntax, S3 Load, HDFS Load, and Broker Load are collectively referred to as Broker Load.

## Syntax

```sql
LOAD LABEL [<db_name>.]<load_label>
(
[ { MERGE | APPEND | DELETE } ]
DATA INFILE
(
"<file_path>"[, ...]
)
[ NEGATIVE ]
INTO TABLE `<table_name>`
[ PARTITION ( <partition_name> [ , ... ] ) ]
[ COLUMNS TERMINATED BY "<column_separator>" ]
[ LINES TERMINATED BY "<line_delimiter>" ]
[ FORMAT AS "<file_type>" ]
[ COMPRESS_TYPE AS "<compress_type>" ]
[ (<column_list>) ]
[ COLUMNS FROM PATH AS (<column_name> [ , ... ] ) ]
[ SET (<column_mapping>) ]
[ PRECEDING FILTER <predicate> ]
[ WHERE <predicate> ]
[ DELETE ON <expr> ]
[ ORDER BY <source_sequence> ]
[ PROPERTIES ("<key>"="<value>" [, ...] ) ]
)
WITH BROKER "<broker_name>"
(   <broker_properties>
    [ , ... ])
[ PROPERTIES (
    <load_properties>
    [ , ... ]) ]
[COMMENT "<comment>" ];
```

## Required Parameters

**1. `<db_name>`**
> Specifies the name of the database for import.

**2. `<load_label>`**
> Each import task needs to specify a unique Label. The job progress can be queried later using this Label.

**3. `<table_name>`**
> Specifies the table corresponding to the import task.

**4. `<file_path>`**
> Specifies the file path to be imported. Multiple paths can be specified, and wildcards can be used. The path must ultimately match a file; if it only matches a directory, the import will fail.

**5. `<broker_name>`**
> Specifies the name of the Broker service to be used. For example, in public - cloud Doris, the Broker service name is `bos`.

**6. `<broker_properties>`**
> Specifies the information required by the broker. This information is typically used to enable the Broker to access the remote storage system, such as BOS or HDFS.
>
>```text
>  (
>      "username" = "user",
>      "password" = "pass",
>      ...
>  )
>```

## Optional Parameters

**1. `merge | append | delete`**  
> Data merge type. The default is `append`, indicating that this import is a normal append-write operation. `merge` and `delete` types are only applicable to tables with the unique key model. The `merge` type needs to be used in conjunction with the `[delete on]` statement to mark the delete flag column. The `delete` type indicates that all data imported this time is deletion data.

**2. `negative`**  
> Indicates "negative" import. This method is only applicable to aggregate data tables with an integer sum aggregation type. It negates the integer values corresponding to the sum aggregation columns in the imported data, which is used to offset incorrect data.

**3. `<partition_name>`**  
> Specifies to import only certain partitions of the table, for example: `partition (p1, p2,...)`. Other data outside the partition range will be ignored.

**4. `<column_separator>`**  
> Specifies the column separator, which is only valid in CSV format and can only specify single-byte separators.

**5. `<line_delimiter>`**  
> Specifies the line separator, which is only valid in CSV format and can only specify single-byte separators.

**6. `<file_type>`**  
> Specifies the file format, supporting `csv` (default), `parquet`, and `orc` formats.

**7. `<compress_type>`**  
> Specifies the file compression type, supporting `gz`, `bz2`, and `lz4frame`.

**8. `<column_list>`**  
> Specifies the column order in the original file.

**9. `columns from path as (<c1>, <c2>,...)`**  
> Specifies the columns to be extracted from the import file path.

**10. `<column_mapping>`**  
> Specifies the column conversion function.

**11. `preceding filter <predicate>`**  
> Data is first spliced into the original data rows according to `column list` and `columns from path as`, then filtered according to the preceding filter condition.

**12. `where <predicate>`**  
> Filters the imported data according to the condition.

**13. `delete on <expr>`**  
> Used in conjunction with the `merge` import mode and is only applicable to tables with the unique key model. It specifies the column representing the delete flag in the imported data and the calculation relationship.

**14. `<source_sequence>`**  
> Only applicable to tables with the unique key model. It specifies the column representing the sequence column in the imported data, mainly to ensure the data order during import.

**15. `properties ("<key>"="<value>",...)`**  
> Specifies the parameters for the import file format, applicable to formats such as CSV, JSON, etc. For example, parameters such as `json_root`, `jsonpaths`, and `fuzzy_parse` can be specified.  
> `enclose`: Enclosure character; when a CSV data field contains a line separator or column separator, a single-byte character can be specified as the enclosure character to prevent accidental truncation. For example, if the column separator is ",", and the enclosure character is "'", and the data is "a,'b,c'", then "b,c" will be parsed as one field.  
> Note: When `enclose` is set to `"`, `trim_double_quotes` must be set to `true`.  
> `escape`: Escape character, used to escape characters in the field that are the same as the enclosure character. For example, if the data is "a,'b,'c'", the enclosure character is "'", and you want "b,'c" to be parsed as one field, you need to specify a single-byte escape character, such as `""`, and then modify the data to "a,'b,'c'".

**16. `<load_properties>`**  
> The optional parameters are as follows and can be added based on the actual environment.

| Parameter | Parameter Description |
| ---------------------- | ------------------------------------------------------------ |
| timeout | Import timeout period, with a default of 4 hours and the unit in seconds. |
| max_filter_ratio | The maximum tolerable ratio of filterable data (due to reasons such as data irregularities), with a default of zero tolerance and a value range from 0 to 1. |
| exec_mem_limit | Import memory limit, with a default of 2GB and the unit in bytes. |
| strict_mode | Whether to impose strict restrictions on the data, with a default of `false`. |
| partial_columns | A boolean type. When set to `true`, it indicates using partial - column updates, with a default value of `false`. It can only be set when the table model is Unique and uses Merge on Write. |
| timezone | Specifies the time zone, which affects some functions affected by the time zone, such as `strftime`, `alignment_timestamp`, `from_unixtime`, etc. For details, please refer to the [Time Zone](../../../../admin-manual/cluster-management/time-zone) documentation. If not specified, "Asia/Shanghai" will be used. |
| load_parallelism | Import concurrency. The default is 1. Increasing the import concurrency will start multiple execution plans to execute the import task simultaneously, speeding up the import process. |
| send_batch_parallelism | Sets the parallelism for sending batch data. If the value of the parallelism exceeds `max_send_batch_parallelism_per_job` in the BE configuration, the value of `max_send_batch_parallelism_per_job` will be used. |
| load_to_single_tablet | A boolean type. When set to `true`, it indicates supporting importing data into a single tablet of the corresponding partition, with a default value of `false`. The number of tasks in the job depends on the overall concurrency and can only be set when importing an OLAP table with a random bucket. |
| priority | Sets the priority of the import task, with options of `HIGH/NORMAL/LOW` and a default of `NORMAL`. For import tasks in the `PENDING` state, tasks with a higher priority will enter the `LOADING` state first. |
| comment | Specifies the remarks information for the import task. |

## Access Control Requirements

Users executing this SQL command must have at least the following permissions:

| Privilege | Object | Notes |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | Table | Import permissions for the specified database table. |

## Examples

For complete examples covering S3, HDFS, JSON format, Merge mode, path-based partition extraction, and more, refer to [Broker Load](../../../../data-operate/import/import-way/broker-load-manual.md) in the Data Import guide.
