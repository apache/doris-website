---
{
    "title": "Importing Data from HDFS",
    "language": "en",
    "description": "Describes how to import HDFS files into Apache Doris using HDFS Load (asynchronous) and TVF (synchronous), including complete steps and examples.",
    "sidebar_label": "HDFS",
    "keywords": [
        "Doris HDFS import",
        "HDFS Load",
        "HDFS TVF",
        "Broker Load",
        "Hadoop data import",
        "asynchronous import",
        "synchronous import",
        "fs.defaultFS",
        "hadoop.username"
    ]
}
---

<!-- Knowledge type: Procedure / Data import -->
<!-- Applicable scenario: Importing data from HDFS to Doris -->

Apache Doris provides two ways to import files from HDFS, each suited to different business scenarios.

## Choosing an Approach

Before you start, choose the appropriate import method based on data volume, latency requirements, and business scenario:

| Import method | Execution mode | Applicable scenario | Reference |
|----------|----------|----------|----------|
| **HDFS Load** | Asynchronous | Large-batch, scheduled offline jobs where the current session does not need to be blocked until the import finishes | [Broker Load Manual](../import-way/broker-load-manual.md) |
| **TVF (Table-Valued Function)** | Synchronous | Small-batch imports and ad-hoc query scenarios, flexibly combined with `INSERT INTO ... SELECT` | Examples below in this document |

> Tip: Both methods rely on correct HDFS connection parameters (`fs.defaultFS`, `hadoop.username`, etc.). Make sure the Doris cluster can reach HDFS over the network.

---

## Method 1: Importing with HDFS Load (Asynchronous)

<!-- Knowledge type: Procedure -->

HDFS Load is an asynchronous import method based on Broker Load, suitable for loading large batches of data. For full capabilities, see the [Broker Load Manual](../import-way/broker-load-manual.md).

### Step 1: Prepare the HDFS Data File

On HDFS, create a CSV file `hdfsload_example.csv` with the following content:

```text
1,Emily,25
2,Benjamin,35
3,Olivia,28
4,Alexander,60
5,Ava,17
6,William,69
7,Sophia,32
8,James,64
9,Emma,37
10,Liam,64
```

### Step 2: Create the Target Table in Doris

```sql
CREATE TABLE test_hdfsload(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Step 3: Submit the HDFS Load Job

```sql
LOAD LABEL hdfs_load_2022_04_01
(
    DATA INFILE("hdfs://127.0.0.1:8020/tmp/hdfsload_example.csv")
    INTO TABLE test_hdfsload
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (user_id, name, age)
)
with HDFS
(
    "fs.defaultFS" = "hdfs://127.0.0.1:8020",
    "hadoop.username" = "user"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

Key parameters:

| Parameter | Description |
|------|------|
| `LABEL` | Unique identifier of the import job, used for tracking and deduplication |
| `DATA INFILE` | HDFS file path |
| `COLUMNS TERMINATED BY` | Column delimiter, must match the source file |
| `FORMAT AS` | File format, here `CSV` |
| `fs.defaultFS` | HDFS NameNode address |
| `hadoop.username` | Username for accessing HDFS |
| `timeout` | Job timeout (in seconds) |

### Step 4: Verify the Import Result

```sql
SELECT * FROM test_hdfsload;
```

Expected output:

```text
mysql> select * from test_hdfsload;
+---------+-----------+------+
| user_id | name      | age  |
+---------+-----------+------+
|       5 | Ava       |   17 |
|      10 | Liam      |   64 |
|       7 | Sophia    |   32 |
|       9 | Emma      |   37 |
|       1 | Emily     |   25 |
|       4 | Alexander |   60 |
|       2 | Benjamin  |   35 |
|       3 | Olivia    |   28 |
|       6 | William   |   69 |
|       8 | James     |   64 |
+---------+-----------+------+
10 rows in set (0.04 sec)
```

---

## Method 2: Importing with TVF (Synchronous)

<!-- Knowledge type: Procedure -->

TVF (Table-Valued Function) is a synchronous import method, suitable for flexibly reading from HDFS and writing into Doris with `INSERT INTO ... SELECT`.

### Step 1: Prepare the HDFS Data File

On HDFS, create a CSV file `hdfsload_example.csv` with the following content:

```text
1,Emily,25
2,Benjamin,35
3,Olivia,28
4,Alexander,60
5,Ava,17
6,William,69
7,Sophia,32
8,James,64
9,Emma,37
10,Liam,64
```

### Step 2: Create the Target Table in Doris

```sql
CREATE TABLE test_hdfsload(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Step 3: Import Data Synchronously via TVF

```sql
INSERT INTO test_hdfsload
SELECT * FROM hdfs (
    "uri" = "hdfs://127.0.0.1:8020/tmp/hdfsload_example.csv",
    "fs.defaultFS" = "hdfs://127.0.0.1:8020",
    "hadoop.username" = "doris",
    "format" = "csv",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

Key parameters:

| Parameter | Description |
|------|------|
| `uri` | Full path of the HDFS file |
| `fs.defaultFS` | HDFS NameNode address |
| `hadoop.username` | Username for accessing HDFS |
| `format` | File format, for example `csv` |
| `csv_schema` | Column definitions of the CSV file, in the form `column_name:type;column_name:type` |

### Step 4: Verify the Import Result

```sql
SELECT * FROM test_hdfsload;
```

Expected output:

```text
mysql> select * from test_hdfsload;
+---------+-----------+------+
| user_id | name      | age  |
+---------+-----------+------+
|       5 | Ava       |   17 |
|      10 | Liam      |   64 |
|       7 | Sophia    |   32 |
|       9 | Emma      |   37 |
|       1 | Emily     |   25 |
|       4 | Alexander |   60 |
|       2 | Benjamin  |   35 |
|       3 | Olivia    |   28 |
|       6 | William   |   69 |
|       8 | James     |   64 |
+---------+-----------+------+
10 rows in set (0.04 sec)
```

---

## FAQ

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Import failure troubleshooting / parameter selection -->

### Q1: How do I choose between HDFS Load and TVF?

- For larger data volumes where asynchronous execution is acceptable, choose **HDFS Load**.
- For smaller data volumes where you need the import result immediately, or want to combine the import with `INSERT INTO ... SELECT` for transformation, choose **TVF**.

### Q2: What are the common required parameters for connecting to HDFS?

- `fs.defaultFS`: HDFS NameNode address. Required.
- `hadoop.username`: Username for accessing HDFS. Required.
- If authentication such as Kerberos is enabled, add the corresponding authentication configuration.

### Q3: How should `csv_schema` be written in TVF?

The format is `column_name:type;column_name:type`, for example `user_id:int;name:string;age:int`. It must match the actual column order and types of the CSV file.

### Q4: What if an HDFS Load job times out?

Adjust `timeout` (in seconds) in `PROPERTIES`; the default is 3600. For large files, increase it as needed.

### Q5: Why does the import result not match the order of the source file?

Doris is a distributed storage engine, and `SELECT *` does not guarantee order by default. To get ordered output, add an explicit `ORDER BY`.
