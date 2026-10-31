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
| timezone | Specifies the time zone, which affects some functions affected by the time zone, such as `strftime`, `alignment_timestamp`, `from_unixtime`, etc. For details, please refer to the [Time Zone](https://chatgpt.com/advanced/time - zone.md) documentation. If not specified, "Asia/Shanghai" will be used. |
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

1. Import a batch of data from HDFS. The imported file is `file.txt`, separated by commas, and imported into the table `my_table`.

    ```sql
    LOAD LABEL example_db.label1
    (
        DATA INFILE("hdfs://hdfs_host:hdfs_port/input/file.txt")
        INTO TABLE `my_table`
        COLUMNS TERMINATED BY ","
    )
    WITH BROKER hdfs
    (
        "username"="hdfs_user",
        "password"="hdfs_password"
    );
    ```

2. Import data from HDFS using wildcards to match two batches of files and import them into two tables respectively. Use wildcards to match two batches of files, `file - 10*` and `file - 20*`, and import them into the tables `my_table1` and `my_table2` respectively. For `my_table1`, specify to import into partition `p1`, and import the values of the second and third columns in the source file after adding 1.

    ```sql
    LOAD LABEL example_db.label2
    (
        DATA INFILE("hdfs://hdfs_host:hdfs_port/input/file-10*")
        INTO TABLE `my_table1`
        PARTITION (p1)
        COLUMNS TERMINATED BY ","
        (k1, tmp_k2, tmp_k3)
        SET (
            k2 = tmp_k2 + 1,
            k3 = tmp_k3 + 1
        ),
        DATA INFILE("hdfs://hdfs_host:hdfs_port/input/file-20*")
        INTO TABLE `my_table2`
        COLUMNS TERMINATED BY ","
        (k1, k2, k3)
    )
    WITH BROKER hdfs
    (
        "username"="hdfs_user",
        "password"="hdfs_password"
    );
    ```

3. Import a batch of data from HDFS. Specify the separator as the default Hive separator `\\x01`, and use the wildcard `*` to specify all files in all directories under the `data` directory. Use simple authentication and configure namenode HA at the same time.

    ```sql
    LOAD LABEL example_db.label3
    (
        DATA INFILE("hdfs://hdfs_host:hdfs_port/user/doris/data/*/*")
        INTO TABLE `my_table`
        COLUMNS TERMINATED BY "\\x01"
    )
    WITH BROKER my_hdfs_broker
    (
        "username" = "",
        "password" = "",
        "fs.defaultFS" = "hdfs://my_ha",
        "dfs.nameservices" = "my_ha",
        "dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
        "dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
        "dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
        "dfs.client.failover.proxy.provider.my_ha" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
    );
    ```

4. Import data in Parquet format and specify the `FORMAT` as `parquet`. By default, it is determined by the file suffix.

    ```sql
    LOAD LABEL example_db.label4
    (
        DATA INFILE("hdfs://hdfs_host:hdfs_port/input/file")
        INTO TABLE `my_table`
        FORMAT AS "parquet"
        (k1, k2, k3)
    )
    WITH BROKER hdfs
    (
        "username"="hdfs_user",
        "password"="hdfs_password"
    );
    ```

5. Import data and extract partition fields from the file path. The columns in the `my_table` are `k1, k2, k3, city, utc_date`. The directory `hdfs://hdfs_host:hdfs_port/user/doris/data/input/dir/city = beijing` contains the following files:
    ```text
    hdfs://hdfs_host:hdfs_port/input/city=beijing/utc_date=2020-10-01/0000.csv
    hdfs://hdfs_host:hdfs_port/input/city=beijing/utc_date=2020-10-02/0000.csv
    hdfs://hdfs_host:hdfs_port/input/city=tianji/utc_date=2020-10-03/0000.csv
    hdfs://hdfs_host:hdfs_port/input/city=tianji/utc_date=2020-10-04/0000.csv
    ```
    The files only contain three columns of data, `k1, k2, k3`, and the two columns of data, `city` and `utc_date`, will be extracted from the file path.

    ```sql
    LOAD LABEL example_db.label10
    (
        DATA INFILE("hdfs://hdfs_host:hdfs_port/input/city=beijing/*/*")
        INTO TABLE `my_table`
        FORMAT AS "csv"
        (k1, k2, k3)
        COLUMNS FROM PATH AS (city, utc_date)
    )
    WITH BROKER hdfs
    (
        "username"="hdfs_user",
        "password"="hdfs_password"
    );
    ```

6. Filter the data to be imported. Only rows where `k1 = 1` in the original data and `k1 > k2` after conversion will be imported.

    ```sql
    LOAD LABEL example_db.label6
    (
        DATA INFILE("hdfs://host:port/input/file")
        INTO TABLE `my_table`
        (k1, k2, k3)
        SET (
            k2 = k2 + 1
        )
        PRECEDING FILTER k1 = 1
        WHERE k1 > k2
    )
    WITH BROKER hdfs
    (
        "username"="user",
        "password"="pass"
    );
    ```

7. Import data, extract the time partition field from the file path, and the time contains `%3A` (in the HDFS path, `:` is not allowed, so all `:` will be replaced by `%3A`).

   ```sql
   LOAD LABEL example_db.label7
   (
       DATA INFILE("hdfs://host:port/user/data/*/test.txt") 
       INTO TABLE `tbl12`
       COLUMNS TERMINATED BY ","
       (k2,k3)
       COLUMNS FROM PATH AS (data_time)
       SET (
           data_time=str_to_date(data_time, '%Y-%m-%d %H%%3A%i%%3A%s')
       )
   )
   WITH BROKER hdfs
   (
       "username"="user",
       "password"="pass"
   );
   ```

   The directory contains the following files:

   ```text
   /user/data/data_time=2020-02-17 00%3A00%3A00/test.txt
   /user/data/data_time=2020-02-18 00%3A00%3A00/test.txt
   ```

   The table structure is:

   ```text
   data_time DATETIME,
   k2        INT,
   k3        INT
   ```

8. Import a batch of data from HDFS, specifying the timeout period and the filtering ratio. Use the broker `my_hdfs_broker` with plain - text authentication. Delete the columns in the original data that match the columns where `v2 > 100` in the imported data, and import other columns normally.

   ```sql
   LOAD LABEL example_db.label8
   (
       MERGE DATA INFILE("HDFS://test:802/input/file")
       INTO TABLE `my_table`
       (k1, k2, k3, v2, v1)
       DELETE ON v2 > 100
   )
   WITH HDFS
   (
       "hadoop.username"="user",
       "password"="pass"
   )
   PROPERTIES
   (
       "timeout" = "3600",
       "max_filter_ratio" = "0.1"
   );
   ```

   Use the `MERGE` method for import. `my_table` must be a table with the Unique Key model. When the value of the `v2` column in the imported data is greater than 100, the row will be considered a deletion row.

   The timeout period for the import task is 3600 seconds, and an error rate of up to 10% is allowed.

9. Specify the `source_sequence` column during import to ensure the replacement order in the `UNIQUE_KEYS` table:

   ```sql
   LOAD LABEL example_db.label9
   (
       DATA INFILE("HDFS://test:802/input/file")
       INTO TABLE `my_table`
       COLUMNS TERMINATED BY ","
       (k1,k2,source_sequence,v1,v2)
       ORDER BY source_sequence
   ) 
   WITH HDFS
   (
       "hadoop.username"="user",
       "password"="pass"
   )
   ```

   `my_table` must be a table with the Unique Key model and a `Sequence Col` must be specified. The data will be ordered according to the values in the `source_sequence` column of the source data.

10. Import a batch of data from HDFS, specifying the file format as `json` and setting `json_root` and `jsonpaths`:

    ```sql
    LOAD LABEL example_db.label10
    (
        DATA INFILE("HDFS://test:port/input/file.json")
        INTO TABLE `my_table`
        FORMAT AS "json"
        PROPERTIES(
          "json_root" = "$.item",
          "jsonpaths" = "[$.id, $.city, $.code]"
        )       
    )
    WITH BROKER HDFS (
        "hadoop.username" = "user",
        "password" = ""
    )
    PROPERTIES
    (
        "timeout"="1200",
        "max_filter_ratio"="0.1"
    );
    ```

    `jsonpaths` can be used in conjunction with `column list` and `SET (column_mapping)`:

    ```sql
    LOAD LABEL example_db.label10
    (
        DATA INFILE("HDFS://test:port/input/file.json")
        INTO TABLE `my_table`
        FORMAT AS "json"
        (id, code, city)
        SET (id = id * 10)
        PROPERTIES(
          "json_root" = "$.item",
          "jsonpaths" = "[$.id, $.code, $.city]"
        )       
    )
    WITH BROKER HDFS (
        "hadoop.username" = "user",
        "password" = ""
    )
    PROPERTIES
    (
        "timeout"="1200",
        "max_filter_ratio"="0.1"
    );
    ```

11. Import data in CSV format from Tencent Cloud COS.

    ```sql
    LOAD LABEL example_db.label10
    (
        DATA INFILE("cosn://my_bucket/input/file.csv")
        INTO TABLE `my_table`
        (k1, k2, k3)
    )
    WITH BROKER "broker_name"
    (
        "fs.cosn.userinfo.secretId" = "xxx",
        "fs.cosn.userinfo.secretKey" = "xxxx",
        "fs.cosn.bucket.endpoint_suffix" = "cos.xxxxxxxxx.myqcloud.com"
    )
    ```

12. Remove double quotes and skip the first 5 rows when importing CSV data.

    ```sql 
    LOAD LABEL example_db.label12
    (
        DATA INFILE("cosn://my_bucket/input/file.csv")
        INTO TABLE `my_table`
        (k1, k2, k3)
        PROPERTIES("trim_double_quotes" = "true", "skip_lines" = "5")
    )
    WITH BROKER "broker_name"
    (
        "fs.cosn.userinfo.secretId" = "xxx",
        "fs.cosn.userinfo.secretKey" = "xxxx",
        "fs.cosn.bucket.endpoint_suffix" = "cos.xxxxxxxxx.myqcloud.com"
    )
    ```