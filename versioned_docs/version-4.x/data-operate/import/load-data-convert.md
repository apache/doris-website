---
{
    "title": "Data Transformation During Import",
    "language": "en",
    "description": "How to perform column mapping, column transformation, pre-filtering, and post-filtering during Doris data import to simplify the ETL pipeline.",
    "keywords": [
        "Doris data import",
        "import data transformation",
        "column mapping",
        "column transformation",
        "pre-filtering",
        "post-filtering",
        "Stream Load",
        "Broker Load",
        "Routine Load",
        "PRECEDING FILTER",
        "jsonpaths"
    ]
}
---

<!-- Knowledge type: Procedure / Configuration -->
<!-- Applicable scenario: Data import / ETL pipeline simplification / Data cleansing -->

Doris provides powerful data transformation capabilities during import, which can simplify part of the data processing pipeline and reduce reliance on additional ETL tools. With these built-in transformation features, you can improve import efficiency and ensure consistent data processing logic.

## Transformation Capability Overview

Doris supports the following four data transformation methods during import:

| Transformation Method | Purpose | Execution Timing |
| --- | --- | --- |
| Column mapping | Maps source data columns to different columns of the target table | After data parsing |
| Column transformation | Performs real-time transformation on source data using functions and expressions | After column mapping |
| Pre-filtering | Filters out unneeded raw data before column mapping and column transformation | After data parsing, before column mapping |
| Post-filtering | Filters the final result after column mapping and column transformation | After column transformation |

The support of each import method for the four transformation capabilities is as follows:

| Import Method | Column Mapping | Column Transformation | Pre-filtering | Post-filtering |
| --- | --- | --- | --- | --- |
| Stream Load | Supported | Supported | Not supported | Supported |
| Broker Load | Supported | Supported | Supported | Supported |
| Routine Load | Supported | Supported | Supported | Supported |
| Insert Into | Implemented via SELECT | Implemented via SELECT | Implemented via WHERE | Implemented via WHERE |

## Import Syntax

Different import methods use different parameters or clauses to declare data transformation logic. The following table summarizes the correspondence.

### Stream Load

Data transformation is implemented by setting the following parameters in the HTTP header:

| Parameter | Description |
| --- | --- |
| `columns` | Specifies column mapping and column transformation |
| `where` | Specifies post-filtering |

> **Note**: Stream Load does not support pre-filtering.

Example:

```shell
curl --location-trusted -u user:passwd \
    -H "columns: k1, k2, tmp_k3, k3 = tmp_k3 + 1" \
    -H "where: k1 > 1" \
    -T data.csv \
    http://<fe_ip>:<fe_http_port>/api/example_db/example_table/_stream_load
```

### Broker Load

Data transformation is implemented in the SQL statement through the following clauses:

| Clause | Description |
| --- | --- |
| `column list` | Specifies column mapping, in the format `(k1, k2, tmp_k3)` |
| `SET` | Specifies column transformation |
| `PRECEDING FILTER` | Specifies pre-filtering |
| `WHERE` | Specifies post-filtering |

Example:

```sql
LOAD LABEL test_db.label1
(
    DATA INFILE("s3://bucket_name/data.csv")
    INTO TABLE `test_tbl`
    (k1, k2, tmp_k3)
    PRECEDING FILTER k1 = 1
    SET (
        k3 = tmp_k3 + 1
    )
    WHERE k1 > 1
)
WITH S3 (...);
```

### Routine Load

Data transformation is implemented in the SQL statement through the following clauses:

| Clause | Description |
| --- | --- |
| `COLUMNS` | Specifies column mapping and column transformation |
| `PRECEDING FILTER` | Specifies pre-filtering |
| `WHERE` | Specifies post-filtering |

Example:

```sql
CREATE ROUTINE LOAD test_db.label1 ON test_tbl
    COLUMNS(k1, k2, tmp_k3, k3 = tmp_k3 + 1),
    PRECEDING FILTER k1 = 1,
    WHERE k1 > 1
    ...
```

### Insert Into

Insert Into can perform data transformation directly in the `SELECT` statement, and uses the `WHERE` clause for data filtering.

## Column Mapping

<!-- Knowledge type: Procedure -->

Column mapping defines the correspondence between source data columns and target table columns. It can handle the following scenarios:

- The column order in the source data does not match that of the target table
- The number of columns in the source data does not match that of the target table

### Implementation Principle

The implementation of column mapping can be divided into two core steps:

1. **Source data parsing**: Parses the raw data into intermediate variables based on the data format.
2. **Assignment via column mapping**: Maps the intermediate variables to the target table fields by column name.

The following are the processing flows for three different data formats:

#### Importing CSV Format Data

![](/images/load-data-convert-csv-en.png)

#### Importing JSON Format Data with jsonpaths Specified

![](/images/load-data-convert-json1-en.png)

#### Importing JSON Format Data without jsonpaths Specified

![](/images/load-data-convert-json2-en.png)

### Scenario 1: Import JSON Data with jsonpaths Specified

Assume the following source data (header column names are shown only for ease of explanation; the actual data has no header):

```plain
{"k1":1,"k2":"100","k3":"beijing","k4":1.1}
{"k1":2,"k2":"200","k3":"shanghai","k4":1.2}
{"k1":3,"k2":"300","k3":"guangzhou","k4":1.3}
{"k1":4,"k2":"\\N","k3":"chongqing","k4":1.4}
```

#### Create the Target Table

```sql
CREATE TABLE example_table
(
    col1 INT,
    col2 STRING,
    col3 INT,
    col4 DOUBLE
) ENGINE = OLAP
DUPLICATE KEY(col1)
DISTRIBUTED BY HASH(col1) BUCKETS 1;
```

#### Import the Data

- Stream Load

```sql
curl --location-trusted -u user:passwd \
    -H "columns:col1, col3, col2, col4" \
    -H "jsonpaths:[\"$.k1\", \"$.k2\", \"$.k3\", \"$.k4\"]" \
    -H "format:json" \
    -H "read_json_by_line:true" \
    -T data.json \
    -X PUT \
    http://<fe_ip>:<fe_http_port>/api/example_db/example_table/_stream_load
```

- Broker Load

```sql
LOAD LABEL example_db.label_broker
(
    DATA INFILE("s3://bucket_name/data.json")
    INTO TABLE example_table
    FORMAT AS "json"
    (col1, col3, col2, col4)
    PROPERTIES
    (
        "jsonpaths" = "[\"$.k1\", \"$.k2\", \"$.k3\", \"$.k4\"]"
    )
)
WITH s3 (...);
```

- Routine Load

```sql
CREATE ROUTINE LOAD example_db.example_routine_load ON example_table
COLUMNS(col1, col3, col2, col4)
PROPERTIES
(
    "format" = "json",
    "jsonpaths" = "[\"$.k1\", \"$.k2\", \"$.k3\", \"$.k4\"]",
    "read_json_by_line" = "true"
)
FROM KAFKA (...);
```

#### Query Result

```
mysql> SELECT * FROM example_table;
+------+-----------+------+------+
| col1 | col2      | col3 | col4 |
+------+-----------+------+------+
|    1 | beijing   |  100 |  1.1 |
|    2 | shanghai  |  200 |  1.2 |
|    3 | guangzhou |  300 |  1.3 |
|    4 | chongqing | NULL |  1.4 |
+------+-----------+------+------+
```

### Scenario 2: Import JSON Data without jsonpaths Specified

Assume the following source data (header column names are shown only for ease of explanation; the actual data has no header):

```plain
{"k1":1,"k2":"100","k3":"beijing","k4":1.1}
{"k1":2,"k2":"200","k3":"shanghai","k4":1.2}
{"k1":3,"k2":"300","k3":"guangzhou","k4":1.3}
{"k1":4,"k2":"\\N","k3":"chongqing","k4":1.4}
```

#### Create the Target Table

```sql
CREATE TABLE example_table
(
    col1 INT,
    col2 STRING,
    col3 INT,
    col4 DOUBLE
) ENGINE = OLAP
DUPLICATE KEY(col1)
DISTRIBUTED BY HASH(col1) BUCKETS 1;
```

#### Import the Data

- Stream Load

```sql
curl --location-trusted -u user:passwd \
    -H "columns:k1, k3, k2, k4,col1 = k1, col2 = k3, col3 = k2, col4 = k4" \
    -H "format:json" \
    -H "read_json_by_line:true" \
    -T data.json \
    -X PUT \
    http://<fe_ip>:<fe_http_port>/api/example_db/example_table/_stream_load
```

- Broker Load

```sql
LOAD LABEL example_db.label_broker
(
    DATA INFILE("s3://bucket_name/data.json")
    INTO TABLE example_table
    FORMAT AS "json"
    (k1, k3, k2, k4)
    SET (
        col1 = k1,
        col2 = k3,
        col3 = k2,
        col4 = k4
    )
)
WITH s3 (...);
```

- Routine Load

```sql
CREATE ROUTINE LOAD example_db.example_routine_load ON example_table
COLUMNS(k1, k3, k2, k4, col1 = k1, col2 = k3, col3 = k2, col4 = k4),
PROPERTIES
(
    "format" = "json",
    "read_json_by_line" = "true"
)
FROM KAFKA (...);
```

#### Query Result

```
mysql> SELECT * FROM example_table;
+------+-----------+------+------+
| col1 | col2      | col3 | col4 |
+------+-----------+------+------+
|    1 | beijing   |  100 |  1.1 |
|    2 | shanghai  |  200 |  1.2 |
|    3 | guangzhou |  300 |  1.3 |
|    4 | chongqing | NULL |  1.4 |
+------+-----------+------+------+
```

### Scenario 3: Adjust Column Order

Assume the following source data (header column names are shown only for ease of explanation; the actual data has no header):

```plain
column 1, column 2, column 3, column 4
1,100,beijing,1.1
2,200,shanghai,1.2
3,300,guangzhou,1.3
4,\N,chongqing,1.4
```

The target table has four columns k1, k2, k3, and k4. The mapping should be as follows:

```plain
column 1 -> k1
column 2 -> k3
column 3 -> k2
column 4 -> k4
```

#### Create the Target Table

```sql
CREATE TABLE example_table
(
    k1 INT,
    k2 STRING,
    k3 INT,
    k4 DOUBLE
) ENGINE = OLAP
DUPLICATE KEY(k1)
DISTRIBUTED BY HASH(k1) BUCKETS 1;
```

#### Import the Data

- Stream Load

```sql
curl --location-trusted -u user:passwd \
    -H "column_separator:," \
    -H "columns: k1,k3,k2,k4" \
    -T data.csv \
    -X PUT \
    http://<fe_ip>:<fe_http_port>/api/example_db/example_table/_stream_load
```

- Broker Load

```sql
LOAD LABEL example_db.label_broker
(
    DATA INFILE("s3://bucket_name/data.csv")
    INTO TABLE example_table
    COLUMNS TERMINATED BY ","
    (k1, k3, k2, k4)
)
WITH s3 (...);
```

- Routine Load

```sql
CREATE ROUTINE LOAD example_db.example_routine_load ON example_table
COLUMNS(k1, k3, k2, k4),
COLUMNS TERMINATED BY ","
FROM KAFKA (...);
```

#### Query Result

```
mysql> select * from example_table;
+------+-----------+------+------+
| k1   | k2        | k3   | k4   |
+------+-----------+------+------+
|    2 | shanghai  |  200 |  1.2 |
|    4 | chongqing | NULL |  1.4 |
|    3 | guangzhou |  300 |  1.3 |
|    1 | beijing   |  100 |  1.1 |
+------+-----------+------+------+
```

### Scenario 4: Source File Has More Columns Than the Table

Assume the following source data (header column names are shown only for ease of explanation; the actual data has no header):

```plain
column 1, column 2, column 3, column 4
1,100,beijing,1.1
2,200,shanghai,1.2
3,300,guangzhou,1.3
4,\N,chongqing,1.4
```

The target table has three columns k1, k2, and k3, while the source file contains four columns. Only the 1st, 2nd, and 4th columns of the source file are needed, with the following mapping:

```plain
column 1 -> k1
column 2 -> k2
column 4 -> k3
```

To skip certain columns in the source file, simply use any column name that does not exist in the target table during column mapping. These column names can be customized without restriction, and the data of these columns will be automatically ignored during import.

#### Create the Example Table

```sql
CREATE TABLE example_table
(
    k1 INT,
    k2 STRING,
    k3 DOUBLE
) ENGINE = OLAP
DUPLICATE KEY(k1)
DISTRIBUTED BY HASH(k1) BUCKETS 1;
```

#### Import the Data

- Stream Load

```sql
curl --location-trusted -u user:password \
    -H "column_separator:," \
    -H "columns: k1,k2,tmp_skip,k3" \
    -T data.csv \
    http://<fe_ip>:<fe_http_port>/api/example_db/example_table/_stream_load
```

- Broker Load

```sql
LOAD LABEL example_db.label_broker
(
    DATA INFILE("s3://bucket_name/data.csv")
    INTO TABLE example_table
    COLUMNS TERMINATED BY ","
    (tmp_k1, tmp_k2, tmp_skip, tmp_k3)
    SET (
        k1 = tmp_k1,
        k2 = tmp_k2,
        k3 = tmp_k3
    )
)
WITH s3 (...);
```

- Routine Load

```sql
CREATE ROUTINE LOAD example_db.example_routine_load ON example_table
COLUMNS(k1, k2, tmp_skip, k3),
PROPERTIES
(
    "format" = "csv",
    "column_separator" = ","
)
FROM KAFKA (...);
```

> Note: `tmp_skip` in the example can be replaced with any name, as long as it is not in the column definition of the target table.

#### Query Result

```
mysql> select * from example_table;
+------+------+------+
| k1   | k2   | k3   |
+------+------+------+
|    1 | 100  |  1.1 |
|    2 | 200  |  1.2 |
|    3 | 300  |  1.3 |
|    4 | NULL |  1.4 |
+------+------+------+
```

### Scenario 5: Source File Has Fewer Columns Than the Table

Assume the following source data (header column names are shown only for ease of explanation; the actual data has no header):

```plain
column 1, column 2, column 3, column 4
1,100,beijing,1.1
2,200,shanghai,1.2
3,300,guangzhou,1.3
4,\N,chongqing,1.4
```

The target table has five columns k1, k2, k3, k4, and k5, while the source file contains four columns. Only the 1st, 2nd, 3rd, and 4th columns of the source file are needed, with the following mapping:

```plain
column 1 -> k1
column 2 -> k3
column 3 -> k2
column 4 -> k4
k5 uses the default value
```

The handling rules for missing columns in the target table are as follows:

- If the column has a default value, the default value is used.
- If the column is nullable but has no default value, NULL is used.
- If the column is non-nullable and has no default value, the import fails.

#### Create the Example Table

```sql
CREATE TABLE example_table
(
    k1 INT,
    k2 STRING,
    k3 INT,
    k4 DOUBLE,
    k5 INT DEFAULT 2
) ENGINE = OLAP
DUPLICATE KEY(k1)
DISTRIBUTED BY HASH(k1) BUCKETS 1;
```

#### Import the Data

- Stream Load

```sql
curl --location-trusted -u user:passwd \
    -H "column_separator:," \
    -H "columns: k1,k3,k2,k4" \
    -T data.csv \
    http://<fe_ip>:<fe_http_port>/api/example_db/example_table/_stream_load
```

- Broker Load

```sql
LOAD LABEL example_db.label_broker
(
    DATA INFILE("s3://bucket_name/data.csv")
    INTO TABLE example_table
    COLUMNS TERMINATED BY ","
    (tmp_k1, tmp_k3, tmp_k2, tmp_k4)
    SET (
        k1 = tmp_k1,
        k3 = tmp_k3,
        k2 = tmp_k2,
        k4 = tmp_k4
    )
)
WITH s3 (...);
```

- Routine Load

```sql
CREATE ROUTINE LOAD example_db.example_routine_load ON example_table
COLUMNS(k1, k3, k2, k4),
COLUMNS TERMINATED BY ","
FROM KAFKA (...);
```

#### Query Result

```
mysql> select * from example_table;
+------+-----------+------+------+------+
| k1   | k2        | k3   | k4   | k5   |
+------+-----------+------+------+------+
|    1 | beijing   |  100 |  1.1 |    2 |
|    2 | shanghai  |  200 |  1.2 |    2 |
|    3 | guangzhou |  300 |  1.3 |    2 |
|    4 | chongqing | NULL |  1.4 |    2 |
+------+-----------+------+------+------+
```

## Column Transformation

<!-- Knowledge type: Procedure -->

Column transformation allows you to transform column values from the source file. It supports most built-in functions. Column transformation is usually defined together with column mapping: columns are mapped first, and then transformed.

### Scenario 1: Arithmetic Transformation of Source Column Values

Assume the following source data (header column names are shown only for ease of explanation; the actual data has no header):

```plain
column 1, column 2, column 3, column 4
1,100,beijing,1.1
2,200,shanghai,1.2
3,300,guangzhou,1.3
4,\N,chongqing,1.4
```

The table has four columns k1, k2, k3, and k4. The import mapping and transformation are as follows:

```plain
column 1       -> k1
column 2 * 100 -> k3
column 3       -> k2
column 4       -> k4
```

#### Create the Example Table

```sql
CREATE TABLE example_table
(
    k1 INT,
    k2 STRING,
    k3 INT,
    k4 DOUBLE
)
ENGINE = OLAP
DUPLICATE KEY(k1)
DISTRIBUTED BY HASH(k1) BUCKETS 1;
```

#### Import the Data

- Stream Load

```sql
curl --location-trusted -u user:passwd \
    -H "column_separator:," \
    -H "columns: k1, tmp_k3, k2, k4, k3 = tmp_k3 * 100" \
    -T data.csv \
    http://host:port/api/example_db/example_table/_stream_load
```

- Broker Load

```sql
LOAD LABEL example_db.label1
(
    DATA INFILE("s3://bucket_name/data.csv")
    INTO TABLE example_table
    COLUMNS TERMINATED BY ","
    (k1, tmp_k3, k2, k4)
    SET (
        k3 = tmp_k3 * 100
    )
)
WITH s3 (...);
```

- Routine Load

```sql
CREATE ROUTINE LOAD example_db.example_routine_load ON example_table
COLUMNS(k1, tmp_k3, k2, k4, k3 = tmp_k3 * 100),
COLUMNS TERMINATED BY ","
FROM KAFKA (...);
```

#### Query Result

```
mysql> select * from example_table;
+------+-----------+-------+------+
| k1   | k2        | k3    | k4   |
+------+-----------+-------+------+
|    1 | beijing   | 10000 |  1.1 |
|    2 | shanghai  | 20000 |  1.2 |
|    3 | guangzhou | 30000 |  1.3 |
|    4 | chongqing |  NULL |  1.4 |
+------+-----------+-------+------+
```

### Scenario 2: Conditional Column Transformation Using the CASE WHEN Function

Assume the following source data (header column names are shown only for ease of explanation; the actual data has no header):

```plain
column 1, column 2, column 3, column 4
1,100,beijing,1.1
2,200,shanghai,1.2
3,300,guangzhou,1.3
4,\N,chongqing,1.4
```

The table has four columns k1, k2, k3, and k4. The values beijing, shanghai, guangzhou, and chongqing in the source data are converted to their corresponding region IDs before import:

```plain
column 1                                 -> k1
column 2                                 -> k2
column 3 (after region ID conversion)    -> k3
column 4                                 -> k4
```

#### Create the Example Table

```sql
CREATE TABLE example_table
(
    k1 INT,
    k2 INT,
    k3 INT,
    k4 DOUBLE
)
ENGINE = OLAP
DUPLICATE KEY(k1)
DISTRIBUTED BY HASH(k1) BUCKETS 1;
```

#### Import the Data

- Stream Load

```sql
curl --location-trusted -u user:passwd \
    -H "column_separator:," \
    -H "columns: k1, k2, tmp_k3, k4, k3 = CASE tmp_k3 WHEN 'beijing' THEN 1 WHEN 'shanghai' THEN 2 WHEN 'guangzhou' THEN 3 WHEN 'chongqing' THEN 4 ELSE NULL END" \
    -T data.csv \
    http://host:port/api/example_db/example_table/_stream_load
```

- Broker Load

```sql
LOAD LABEL example_db.label1
(
    DATA INFILE("s3://bucket_name/data.csv")
    INTO TABLE example_table
    COLUMNS TERMINATED BY ","
    (k1, k2, tmp_k3, k4)
    SET (
        k3 = CASE tmp_k3 WHEN 'beijing' THEN 1 WHEN 'shanghai' THEN 2 WHEN 'guangzhou' THEN 3 WHEN 'chongqing' THEN 4 ELSE NULL END
    )
)
WITH s3 (...);
```

- Routine Load

```sql
CREATE ROUTINE LOAD example_db.example_routine_load ON example_table
COLUMNS(k1, k2, tmp_k3, k4, k3 = CASE tmp_k3 WHEN 'beijing' THEN 1 WHEN 'shanghai' THEN 2 WHEN 'guangzhou' THEN 3 WHEN 'chongqing' THEN 4 ELSE NULL END),
COLUMNS TERMINATED BY ","
FROM KAFKA (...);
```

#### Query Result

```
mysql> select * from example_table;
+------+------+------+------+
| k1   | k2   | k3   | k4   |
+------+------+------+------+
|    1 |  100 |    1 |  1.1 |
|    2 |  200 |    2 |  1.2 |
|    3 |  300 |    3 |  1.3 |
|    4 | NULL |    4 |  1.4 |
+------+------+------+------+
```

### Scenario 3: Handling NULL Values in the Source File

Assume the following source data (header column names are shown only for ease of explanation; the actual data has no header):

```plain
column 1, column 2, column 3, column 4
1,100,beijing,1.1
2,200,shanghai,1.2
3,300,guangzhou,1.3
4,\N,chongqing,1.4
```

The table has four columns k1, k2, k3, and k4. While converting the region ID, the null value of the k2 column in the source data is converted to 0 during import:

```
column 1                                  -> k1
column 2 (convert null to 0 if null)      -> k2
column 3                                  -> k3
column 4                                  -> k4
```

#### Create the Example Table

```sql
CREATE TABLE example_table
(
    k1 INT,
    k2 INT,
    k3 INT,
    k4 DOUBLE
)
ENGINE = OLAP
DUPLICATE KEY(k1)
DISTRIBUTED BY HASH(k1) BUCKETS 1;
```

#### Import the Data

- Stream Load

```sql
curl --location-trusted -u user:passwd \
    -H "column_separator:," \
    -H "columns: k1, tmp_k2, tmp_k3, k4, k2 = ifnull(tmp_k2, 0), k3 = CASE tmp_k3 WHEN 'beijing' THEN 1 WHEN 'shanghai' THEN 2 WHEN 'guangzhou' THEN 3 WHEN 'chongqing' THEN 4 ELSE NULL END" \
    -T data.csv \
    http://host:port/api/example_db/example_table/_stream_load
```

- Broker Load

```sql
LOAD LABEL example_db.label1
(
    DATA INFILE("s3://bucket_name/data.csv")
    INTO TABLE example_table
    COLUMNS TERMINATED BY ","
    (k1, tmp_k2, tmp_k3, k4)
    SET (
        k2 = ifnull(tmp_k2, 0),
        k3 = CASE tmp_k3 WHEN 'beijing' THEN 1 WHEN 'shanghai' THEN 2 WHEN 'guangzhou' THEN 3 WHEN 'chongqing' THEN 4 ELSE NULL END
    )
)
WITH s3 (...);
```

- Routine Load

```sql
CREATE ROUTINE LOAD example_db.example_routine_load ON example_table
COLUMNS(k1, tmp_k2, tmp_k3, k4, k2 = ifnull(tmp_k2, 0), k3 = CASE tmp_k3 WHEN 'beijing' THEN 1 WHEN 'shanghai' THEN 2 WHEN 'guangzhou' THEN 3 WHEN 'chongqing' THEN 4 ELSE NULL END),
COLUMNS TERMINATED BY ","
FROM KAFKA (...);
```

#### Query Result

```
mysql> select * from example_table;
+------+------+------+------+
| k1   | k2   | k3   | k4   |
+------+------+------+------+
|    1 |  100 |    1 |  1.1 |
|    2 |  200 |    2 |  1.2 |
|    3 |  300 |    3 |  1.3 |
|    4 |    0 |    4 |  1.4 |
+------+------+------+------+
```

## Pre-filtering

<!-- Knowledge type: Procedure / Configuration -->

Pre-filtering filters raw data before transformation. It can filter out data that does not need to be processed in advance, reducing the amount of data for subsequent processing and improving import efficiency. **This feature is supported only by Broker Load and Routine Load.**

### Use Cases

- **Filter before transformation**: Filtering before column mapping and column transformation can remove some unneeded data in advance.
- **Filter columns are not in the table and are only used as filter flags**: For example, the source data stores rows from multiple tables (or rows from multiple tables are written into the same Kafka message queue), and each row contains a column with a table name to indicate which table the row belongs to. You can use a pre-filter condition to select the data of the corresponding table for import.

### Limitations

| Limitation | Description |
| --- | --- |
| Filter column limitation | Pre-filtering can only filter independent simple columns in the column list, and cannot filter columns produced by expressions. For example, when the column mapping is `(a, tmp, b = tmp + 1)`, the column `b` cannot be used as a filter condition. |
| Data processing limitation | Pre-filtering occurs before data transformation and uses raw data values for comparison. The raw data is treated as a string type. For example, data such as `\N` is compared directly as the string `\N`, instead of being converted to NULL before comparison. |

### Example 1: Pre-filtering with a Numeric Condition

This example shows how to use a simple numeric comparison condition to filter source data. By setting the filter condition `k1 > 1`, unwanted records are filtered out before data transformation.

Assume the following source data (header column names are shown only for ease of explanation; the actual data has no header):

```plain
column 1, column 2, column 3, column 4
1,100,beijing,1.1
2,200,shanghai,1.2
3,300,guangzhou,1.3
4,\N,chongqing,1.4
```

The pre-filter condition is:

```
column 1 > 1, that is, only data with column 1 > 1 is imported, and the rest is filtered out.
```

#### Create the Example Table

```sql
CREATE TABLE example_table
(
    k1 INT,
    k2 INT,
    k3 STRING,
    k4 DOUBLE
)
ENGINE = OLAP
DUPLICATE KEY(k1)
DISTRIBUTED BY HASH(k1) BUCKETS 1;
```

#### Import the Data

- Broker Load

```sql
LOAD LABEL example_db.label1
(
    DATA INFILE("s3://bucket_name/data.csv")
    INTO TABLE example_table
    COLUMNS TERMINATED BY ","
    (k1, k2, k3, k4)
    PRECEDING FILTER k1 > 1
)
WITH s3 (...);
```

- Routine Load

```sql
CREATE ROUTINE LOAD example_db.example_routine_load ON example_table
COLUMNS(k1, k2, k3, k4),
COLUMNS TERMINATED BY ","
PRECEDING FILTER k1 > 1
FROM KAFKA (...)
```

#### Query Result

```
mysql> select * from example_table;
+------+------+-----------+------+
| k1   | k2   | k3        | k4   |
+------+------+-----------+------+
|    2 |  200 | shanghai  |  1.2 |
|    3 |  300 | guangzhou |  1.3 |
|    4 | NULL | chongqing |  1.4 |
+------+------+-----------+------+
```

### Example 2: Filter Invalid Data Using an Intermediate Column

This example shows how to handle an import scenario that contains invalid data.

The source data is:

```plain text
1,1
2,abc
3,3
```

#### Create Table Statement

```sql
CREATE TABLE example_table
(
    k1 INT,
    k2 INT NOT NULL
)
ENGINE = OLAP
DUPLICATE KEY(k1)
DISTRIBUTED BY HASH(k1) BUCKETS 1;
```

For the k2 column whose type is int, `abc` is invalid dirty data. To filter out this data, you can introduce an intermediate column for filtering.

#### Import Statement

- Broker Load

```sql
LOAD LABEL example_db.label1
(
    DATA INFILE("s3://bucket_name/data.csv")
    INTO TABLE example_table
    COLUMNS TERMINATED BY ","
    (k1, tmp, k2 = tmp)
    PRECEDING FILTER tmp != "abc"
)
WITH s3 (...);
```

- Routine Load

```sql
CREATE ROUTINE LOAD example_db.example_routine_load ON example_table
COLUMNS(k1, tmp, k2 = tmp),
COLUMNS TERMINATED BY ","
PRECEDING FILTER tmp != "abc"
FROM KAFKA (...);
```

#### Import Result

```sql
mysql> select * from example_table;
+------+----+
| k1   | k2 |
+------+----+
|    1 |  1 |
|    3 |  3 |
+------+----+
```

## Post-filtering

<!-- Knowledge type: Procedure -->

Post-filtering is performed after data transformation and can filter based on the transformed result.

### Scenario 1: Direct Filtering Without Column Mapping or Transformation

Assume the following source data (header column names are shown only for ease of explanation; the actual data has no header):

```plain
column 1, column 2, column 3, column 4
1,100,beijing,1.1
2,200,shanghai,1.2
3,300,guangzhou,1.3
4,\N,chongqing,1.4
```

The table has four columns k1, k2, k3, and k4. Without column mapping or transformation, only the rows where the 4th column of the source file is greater than 1.2 are imported.

#### Create the Example Table

```sql
CREATE TABLE example_table
(
    k1 INT,
    k2 INT,
    k3 STRING,
    k4 DOUBLE
)
ENGINE = OLAP
DUPLICATE KEY(k1)
DISTRIBUTED BY HASH(k1) BUCKETS 1;
```

#### Import the Data

- Stream Load

```sql
curl --location-trusted -u user:passwd \
    -H "column_separator:," \
    -H "columns: k1, k2, k3, k4" \
    -H "where: k4 > 1.2" \
    -T data.csv \
    http://host:port/api/example_db/example_table/_stream_load
```

- Broker Load

```sql
LOAD LABEL example_db.label1
(
    DATA INFILE("s3://bucket_name/data.csv")
    INTO TABLE example_table
    COLUMNS TERMINATED BY ","
    (k1, k2, k3, k4)
    where k4 > 1.2
)
WITH s3 (...);
```

- Routine Load

```sql
CREATE ROUTINE LOAD example_db.example_routine_load ON example_table
COLUMNS(k1, k2, k3, k4),
COLUMNS TERMINATED BY ","
WHERE k4 > 1.2;
FROM KAFKA (...)
```

#### Query Result

```
mysql> select * from example_table;
+------+------+-----------+------+
| k1   | k2   | k3        | k4   |
+------+------+-----------+------+
|    3 |  300 | guangzhou |  1.3 |
|    4 | NULL | chongqing |  1.4 |
+------+------+-----------+------+
```

### Scenario 2: Filter Data After Column Transformation

Assume the following source data (header column names are shown only for ease of explanation; the actual data has no header):

```plain
column 1, column 2, column 3, column 4
1,100,beijing,1.1
2,200,shanghai,1.2
3,300,guangzhou,1.3
4,\N,chongqing,1.4
```

The table has four columns k1, k2, k3, and k4. In the column transformation example, the province name is converted to an ID. Here, the goal is to filter out rows whose ID is 3.

#### Create the Example Table

```sql
CREATE TABLE example_table
(
    k1 INT,
    k2 INT,
    k3 INT,
    k4 DOUBLE
)
ENGINE = OLAP
DUPLICATE KEY(k1)
DISTRIBUTED BY HASH(k1) BUCKETS 1;
```

#### Import the Data

- Stream Load

```sql
curl --location-trusted -u user:passwd \
    -H "column_separator:," \
    -H "columns: k1, k2, tmp_k3, k4, k3 = case tmp_k3 when 'beijing' then 1 when 'shanghai' then 2 when 'guangzhou' then 3 when 'chongqing' then 4 else null end" \
    -H "where: k3 != 3" \
    -T data.csv \
    http://host:port/api/example_db/example_table/_stream_load
```

- Broker Load

```sql
LOAD LABEL example_db.label1
(
    DATA INFILE("s3://bucket_name/data.csv")
    INTO TABLE example_table
    COLUMNS TERMINATED BY ","
    (k1, k2, tmp_k3, k4)
    SET (
        k3 = CASE tmp_k3 WHEN 'beijing' THEN 1 WHEN 'shanghai' THEN 2 WHEN 'guangzhou' THEN 3 WHEN 'chongqing' THEN 4 ELSE NULL END
    )
    WHERE k3 != 3
)
WITH s3 (...); 
```

- Routine Load

```sql
CREATE ROUTINE LOAD example_db.example_routine_load ON example_table
COLUMNS(k1, k2, tmp_k3, k4),
COLUMNS TERMINATED BY ","
SET (
    k3 = CASE tmp_k3 WHEN 'beijing' THEN 1 WHEN 'shanghai' THEN 2 WHEN 'guangzhou' THEN 3 WHEN 'chongqing' THEN 4 ELSE NULL END
)
WHERE k3 != 3;
FROM KAFKA (...)
```

#### Query Result

```
mysql> select * from example_table;
+------+------+------+------+
| k1   | k2   | k3   | k4   |
+------+------+------+------+
|    1 |  100 |    1 |  1.1 |
|    2 |  200 |    2 |  1.2 |
|    4 | NULL |    4 |  1.4 |
+------+------+------+------+
```

### Scenario 3: Multi-condition Filtering

Assume the following source data (header column names are shown only for ease of explanation; the actual data has no header):

```plain
column 1, column 2, column 3, column 4
1,100,beijing,1.1
2,200,shanghai,1.2
3,300,guangzhou,1.3
4,\N,chongqing,1.4
```

The table has four columns k1, k2, k3, and k4. Filter out rows where the k1 column is null, and also filter out rows where the k4 column is less than 1.2.

#### Create the Example Table

```sql
CREATE TABLE example_table
(
    k1 INT,
    k2 INT,
    k3 STRING,
    k4 DOUBLE
)
ENGINE = OLAP
DUPLICATE KEY(k1)
DISTRIBUTED BY HASH(k1) BUCKETS 1;
```

#### Import the Data

- Stream Load

```sql
curl --location-trusted -u user:passwd \
    -H "column_separator:," \
    -H "columns: k1, k2, k3, k4" \
    -H "where: k1 is not null and k4 > 1.2" \
    -T data.csv \
    http://host:port/api/example_db/example_table/_stream_load
```

- Broker Load

```sql
LOAD LABEL example_db.label1
(
    DATA INFILE("s3://bucket_name/data.csv")
    INTO TABLE example_table
    COLUMNS TERMINATED BY ","
    (k1, k2, k3, k4)
    where k1 is not null and k4 > 1.2
)
WITH s3 (...);
```

- Routine Load

```sql
CREATE ROUTINE LOAD example_db.example_routine_load ON example_table
COLUMNS(k1, k2, k3, k4),
COLUMNS TERMINATED BY ","
WHERE k1 is not null and k4 > 1.2
FROM KAFKA (...);
```

#### Query Result

```
mysql> select * from example_table;
+------+------+-----------+------+
| k1   | k2   | k3        | k4   |
+------+------+-----------+------+
|    3 |  300 | guangzhou |  1.3 |
|    4 | NULL | chongqing |  1.4 |
+------+------+-----------+------+
```

## FAQ

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Troubleshooting / Usage consultation -->

### 1. Why does Stream Load not have `PRECEDING FILTER`?

Stream Load does not support pre-filtering. It can only perform post-filtering through the `where` parameter. If pre-filtering is required, use Broker Load or Routine Load.

### 2. Why does pre-filtering not treat `\N` as NULL?

Pre-filtering occurs before data transformation and uses raw data values for comparison. The raw data is treated as a string type. For `\N`, the string `\N` is used directly for comparison, instead of being converted to NULL first. To filter by NULL, use post-filtering (`WHERE`).

### 3. How do I skip certain columns in the source file during column mapping?

In the column mapping list, assign a column name that does not exist in the target table (such as `tmp_skip`) to the unwanted column. These temporary column names are placeholders only and are automatically ignored during import.

### 4. How are columns handled when the target table has columns that the source file does not have?

They are filled according to the following rules:

- If the column has a default value, the default value is used.
- If the column is nullable but has no default value, NULL is used.
- If the column is non-nullable and has no default value, the import fails.

### 5. Which functions can be used in column transformation?

Column transformation supports most built-in functions, such as `ifnull`, `CASE WHEN`, string functions, date functions, and arithmetic operations. They can be used in the `columns` or `SET` clause.

### 6. Why can pre-filtering not reference columns assigned by an expression?

Pre-filtering can only filter independent simple columns and cannot filter columns generated by expressions (such as `b = tmp + 1`). Use post-filtering (`WHERE`) to reference such columns instead.
