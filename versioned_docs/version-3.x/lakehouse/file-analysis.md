---
{
    "title": "Analyze Files on S3/HDFS",
    "language": "en"
}
---

Through the Table Value Function feature, Doris can directly query and analyze files on object storage or HDFS as a Table. It also supports automatic column type inference.

For more usage methods, refer to the Table Value Function documentation:

* [S3](../sql-manual/sql-functions/table-valued-functions/s3.md): Supports file analysis on S3-compatible object storage.

* [HDFS](../sql-manual/sql-functions/table-valued-functions/hdfs.md): Supports file analysis on HDFS.

* [FILE]: Please refer to 4.x document.

## Basic Usage

Here we illustrate how to analyze files on object storage using the S3 Table Value Function as an example.

### Query

```sql
SELECT * FROM S3 (
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key'='sk'
)
```

The `S3(...)` is a TVF (Table Value Function). A Table Value Function is essentially a table, so it can appear in any SQL statement where a "table" can appear.

The attributes of a TVF include the file path to be analyzed, file format, connection information of the object storage, etc. The file path (URI) can use wildcards to match multiple files. The following file paths are valid:

* Match a specific file

  `s3://bucket/path/to/tvf_test/test.parquet`

* Match all files starting with `test_`

  `s3://bucket/path/to/tvf_test/test_*`

* Match all files with the `.parquet` suffix

  `s3://bucket/path/to/tvf_test/*.parquet`

* Match all files in the `tvf_test` directory

  `s3://bucket/path/to/tvf_test/*`

* Match files with `test` in the filename

  `s3://bucket/path/to/tvf_test/*test*`

### Automatic Inference of File Column Types

You can view the Schema of a TVF using the `DESC FUNCTION` syntax:

```sql
DESC FUNCTION s3 (
    "URI" = "s3://bucket/path/to/tvf_test/test.parquet",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "format" = "parquet",
    "use_path_style"="true"
);
+---------------+--------------+------+-------+---------+-------+
| Field         | Type         | Null | Key   | Default | Extra |
+---------------+--------------+------+-------+---------+-------+
| p_partkey     | INT          | Yes  | false | NULL    | NONE  |
| p_name        | TEXT         | Yes  | false | NULL    | NONE  |
| p_mfgr        | TEXT         | Yes  | false | NULL    | NONE  |
| p_brand       | TEXT         | Yes  | false | NULL    | NONE  |
| p_type        | TEXT         | Yes  | false | NULL    | NONE  |
| p_size        | INT          | Yes  | false | NULL    | NONE  |
| p_container   | TEXT         | Yes  | false | NULL    | NONE  |
| p_retailprice | DECIMAL(9,0) | Yes  | false | NULL    | NONE  |
| p_comment     | TEXT         | Yes  | false | NULL    | NONE  |
+---------------+--------------+------+-------+---------+-------+
```

Doris infers the Schema based on the following rules:

* For Parquet and ORC formats, Doris obtains the Schema from the file metadata.

* In the case of matching multiple files, the Schema of the first file is used as the TVF's Schema.

* For CSV and JSON formats, Doris parses the **first line of data** to obtain the Schema based on fields, delimiters, etc.

  By default, all column types are `string`. You can specify column names and types individually using the `csv_schema` attribute. Doris will use the specified column types for file reading. The format is: `name1:type1;name2:type2;...`. For example:

  ```sql
  S3 (
      'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
      's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
      's3.region' = 'us-east-1',
      's3.access_key' = 'ak'
      's3.secret_key'='sk',
      'format' = 'csv',
      'column_separator' = '|',
      'csv_schema' = 'k1:int;k2:int;k3:int;k4:decimal(38,10)'
  )
  ```

  The currently supported column type names are as follows:

  | Column Type Name |
  | ------------ |
  | tinyint      |
  | smallint     |
  | int          |
  | bigint       |
  | largeint     |
  | float        |
  | double       |
  | decimal(p,s) |
  | date         |
  | datetime     |
  | char         |
  | varchar      |
  | string       |
  | boolean      |

* For columns with mismatched formats (e.g., the file contains a string, but the user defines it as `int`; or other files have a different Schema than the first file), or missing columns (e.g., the file has 4 columns, but the user defines 5 columns), these columns will return `null`.

## Applicable Scenarios

### Query Analysis

TVF is very suitable for directly analyzing independent files on storage systems without having to import the data into Doris in advance.

You can use any SQL statement for file analysis, such as:

```sql
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key'='sk'
)
ORDER BY p_partkey LIMIT 5;
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
| p_partkey | p_name                                   | p_mfgr         | p_brand  | p_type                  | p_size | p_container | p_retailprice | p_comment           |
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
|         1 | goldenrod lavender spring chocolate lace | Manufacturer#1 | Brand#13 | PROMO BURNISHED COPPER  |      7 | JUMBO PKG   |           901 | ly. slyly ironi     |
|         2 | blush thistle blue yellow saddle         | Manufacturer#1 | Brand#13 | LARGE BRUSHED BRASS     |      1 | LG CASE     |           902 | lar accounts amo    |
|         3 | spring green yellow purple cornsilk      | Manufacturer#4 | Brand#42 | STANDARD POLISHED BRASS |     21 | WRAP CASE   |           903 | egular deposits hag |
|         4 | cornflower chocolate smoke green pink    | Manufacturer#3 | Brand#34 | SMALL PLATED BRASS      |     14 | MED DRUM    |           904 | p furiously r       |
|         5 | forest brown coral puff cream            | Manufacturer#3 | Brand#32 | STANDARD POLISHED TIN   |     15 | SM PKG      |           905 |  wake carefully     |
+-----------+------------------------------------------+----------------+----------+-------------------------+--------+-------------+---------------+---------------------+
```

TVF can appear in any position in SQL where a Table can appear, such as in the `WITH` clause of a `CTE`, in the `FROM` clause, etc. This way, you can treat the file as a regular table for any analysis.

You can also create a logical view for a TVF using the `CREATE VIEW` statement. After that, you can access this TVF like other views, manage permissions, etc., and allow other users to access this View without having to repeatedly write connection information and other attributes.

```sql
-- Create a view based on a TVF
CREATE VIEW tvf_view AS 
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key'='sk'
);

-- Describe the view as usual
DESC tvf_view;

-- Query the view as usual
SELECT * FROM tvf_view;

-- Grant SELECT priv to other user on this view
GRANT SELECT_PRIV ON db.tvf_view TO other_user;
```

### Data Import

TVF can be used as a method for data import into Doris. With the `INSERT INTO SELECT` syntax, we can easily import files into Doris.

```sql
-- Create a Doris table
CREATE TABLE IF NOT EXISTS test_table
(
    id int,
    name varchar(50),
    age int
)
DISTRIBUTED BY HASH(id) BUCKETS 4
PROPERTIES("replication_num" = "1");

-- 2. Load data into table from TVF
INSERT INTO test_table (id,name,age)
SELECT cast(id as INT) as id, name, cast (age as INT) as age
FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key'='sk'
);
```

## Notes

1. If the specified `uri` does not match any files, or all matched files are empty, the TVF will return an empty result set. In this case, using `DESC FUNCTION` to view the Schema of this TVF will yield a virtual column `__dummy_col`, which is meaningless and only serves as a placeholder.

2. If the specified file format is `csv`, and the file read is not empty but the first line of the file is empty, an error `The first line is empty, can not parse column numbers` will be prompted, as the Schema cannot be parsed from the first line of the file.
