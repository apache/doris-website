---
{
    "title": "Analyzing Files on S3/HDFS",
    "language": "en",
    "description": "Learn how to use Apache Doris Table Value Function (TVF) to directly query and analyze Parquet, ORC, CSV, and JSON files on storage systems like S3 and HDFS, with support for automatic schema inference, multi-file matching, and data import."
}
---

Through the Table Value Function (TVF) feature, Doris can directly query and analyze files on object storage or HDFS as tables without importing data in advance, and supports automatic column type inference.

## Supported Storage Systems

Doris provides the following TVFs for accessing different storage systems:

| TVF | Supported Storage | Description |
|-----|-------------------|-------------|
| [S3](../sql-manual/sql-functions/table-valued-functions/s3.md) | S3-compatible object storage | Supports AWS S3, Alibaba Cloud OSS, Tencent Cloud COS, etc. |
| [HDFS](../sql-manual/sql-functions/table-valued-functions/hdfs.md) | HDFS | Supports Hadoop Distributed File System |
| [HTTP](../sql-manual/sql-functions/table-valued-functions/http.md) | HTTP | Supports accessing files from HTTP addresses (since version 4.0.2) |
| [FILE](../sql-manual/sql-functions/table-valued-functions/file.md) | S3/HDFS/HTTP/Local | Unified table function supporting multiple storage types (since version 3.1.0) |

## Use Cases

### Scenario 1: Direct Query and Analysis of Files

TVF is ideal for directly analyzing files on storage systems without importing data into Doris first.

The following example queries a Parquet file on object storage using the S3 TVF:

```sql
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
)
ORDER BY p_partkey LIMIT 5;
```

Example query result:

```
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

A TVF is essentially a table and can appear anywhere a "table" can appear in SQL statements, such as:

- In the `FROM` clause
- In the `WITH` clause of a CTE
- In `JOIN` statements

### Scenario 2: Creating Views to Simplify Access

You can create logical views for TVFs using the `CREATE VIEW` statement to avoid repeatedly writing connection information and to support permission management:

```sql
-- Create a view based on TVF
CREATE VIEW tvf_view AS 
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
);

-- View the structure of the view
DESC tvf_view;

-- Query the view
SELECT * FROM tvf_view;

-- Grant access to other users
GRANT SELECT_PRIV ON db.tvf_view TO other_user;
```

### Scenario 3: Importing Data into Doris

Combined with the `INSERT INTO SELECT` syntax, you can import file data into Doris tables:

```sql
-- 1. Create the target table
CREATE TABLE IF NOT EXISTS test_table
(
    id int,
    name varchar(50),
    age int
)
DISTRIBUTED BY HASH(id) BUCKETS 4
PROPERTIES("replication_num" = "1");

-- 2. Import data via TVF
INSERT INTO test_table (id, name, age)
SELECT cast(id as INT) as id, name, cast(age as INT) as age
FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
);
```

## Core Features

### Multi-File Matching

The file path (URI) supports using wildcards and range patterns to match multiple files:

| Pattern | Example | Match Result |
|---------|---------|--------------|
| `*` | `file_*` | All files starting with `file_` |
| `{n..m}` | `file_{1..3}` | `file_1`, `file_2`, `file_3` |
| `{a,b,c}` | `file_{a,b}` | `file_a`, `file_b` |

### Using Resource to Simplify Configuration

TVF supports referencing pre-created S3 or HDFS Resources through the `resource` property, avoiding the need to repeatedly fill in connection information for each query.

**1. Create a Resource**

```sql
CREATE RESOURCE "s3_resource"
PROPERTIES
(
    "type" = "s3",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.bucket" = "bucket"
);
```

**2. Use the Resource in TVF**

```sql
SELECT * FROM s3(
    'uri' = 's3://bucket/path/to/tvf_test/test.parquet',
    'format' = 'parquet',
    'resource' = 's3_resource'
);
```

:::tip
- Properties in the Resource serve as default values; properties specified in the TVF will override properties with the same name in the Resource
- Using Resources enables centralized management of connection information for easier maintenance and permission control
:::

### Automatic Schema Inference

You can view the automatically inferred schema of a TVF using the `DESC FUNCTION` syntax:

```sql
DESC FUNCTION s3 (
    "URI" = "s3://bucket/path/to/tvf_test/test.parquet",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "format" = "parquet",
    "use_path_style" = "true"
);
```

```
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

**Schema Inference Rules:**

| File Format | Inference Method |
|-------------|------------------|
| Parquet, ORC | Automatically obtains schema from file metadata |
| CSV, JSON | Parses the first row of data to get the schema; default column type is `string` |
| Multi-file matching | Uses the schema of the first file |

### Manually Specifying Column Types (CSV/JSON)

For CSV and JSON formats, you can manually specify column names and types using the `csv_schema` property in the format `name1:type1;name2:type2;...`:

```sql
S3 (
    'uri' = 's3://bucket/path/to/tvf_test/test.csv',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk',
    'format' = 'csv',
    'column_separator' = '|',
    'csv_schema' = 'k1:int;k2:int;k3:int;k4:decimal(38,10)'
)
```

**Supported Column Types:**

| Integer Types | Floating-Point Types | Other Types |
|---------------|----------------------|-------------|
| tinyint | float | decimal(p,s) |
| smallint | double | date |
| int | | datetime |
| bigint | | char |
| largeint | | varchar |
| | | string |
| | | boolean |

:::note
- If the column type does not match (e.g., the file contains a string but `int` is specified), the column returns `null`
- If the number of columns does not match (e.g., the file has 4 columns but 5 are specified), missing columns return `null`
:::

## Notes

| Scenario | Behavior |
|----------|----------|
| `uri` matches no files or all files are empty | TVF returns an empty result set; using `DESC FUNCTION` to view the schema will show a placeholder column `__dummy_col` |
| First line of CSV file is empty (file is not empty) | Error message: `The first line is empty, can not parse column numbers` |
