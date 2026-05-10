---
{
    "title": "Tencent Cloud COS",
    "language": "en",
    "description": "How to import data from Tencent Cloud COS into Apache Doris: complete steps and examples for the S3 Load asynchronous mode and the TVF synchronous mode.",
    "keywords": [
        "Tencent Cloud COS",
        "Tencent COS",
        "S3 Load",
        "TVF",
        "object storage import",
        "Doris import",
        "import COS to Doris",
        "S3 protocol"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Import data files from Tencent Cloud COS into Apache Doris -->

Apache Doris accesses Tencent Cloud Object Storage (COS) through the S3-compatible protocol. The following two import modes are supported, and you can choose the one that fits your data volume and latency requirements.

## Choosing a Solution

| Import method | Mode | Applicable scenario | Reference |
| --- | --- | --- | --- |
| S3 Load | Asynchronous | Offline, large-batch data import; the import job runs in the background and you can check its status | [Broker Load Manual](../import-way/broker-load-manual.md) |
| TVF (Table Value Function) | Synchronous | Ad hoc queries or small-batch imports; reads COS files directly with `INSERT INTO ... SELECT` | - |

## Prerequisites

Before running the import, prepare the following information:

- The COS bucket name and object path (for example, `s3://your_bucket_name/s3load_example.csv`)
- The COS endpoint (for example, `cos.ap-beijing.myqcloud.com`) and region (for example, `ap-beijing`)
- An AccessKey (`access_key`) and SecretKey (`secret_key`) with permission to access the bucket
- An accessible Apache Doris cluster

The examples in this document all use the following CSV file `s3load_example.csv`:

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

And the following target table `test_s3load`:

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

## Method 1: Asynchronous Import with S3 Load

S3 Load is an asynchronous import method suitable for offline or large-volume scenarios. For the detailed mechanism, see the [Broker Load Manual](../import-way/broker-load-manual.md).

### Step 1: Prepare the data

Upload the `s3load_example.csv` file shown above to the target bucket in Tencent Cloud COS.

### Step 2: Create the table in Doris

Run the `CREATE TABLE` statement from the [Prerequisites](#prerequisites) section to create the target table `test_s3load`.

### Step 3: Submit the S3 Load job

Submit the import job with the following SQL. Replace `<your-ak>` and `<your-sk>` with your actual credentials, and replace `your_bucket_name` with the actual bucket name:

```sql
LOAD LABEL s3_load_2022_04_01
(
    DATA INFILE("s3://your_bucket_name/s3load_example.csv")
    INTO TABLE test_s3load
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (user_id, name, age)
)
WITH S3
(
    "provider" = "COS",
    "s3.endpoint" = "cos.ap-beijing.myqcloud.com",
    "s3.region" = "ap-beijing",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

### Step 4: Check the import result

```sql
SELECT * FROM test_s3load;
```

Sample result:

```text
mysql> select * from test_s3load;
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

## Method 2: Synchronous Import with TVF

A TVF (Table Value Function) reads COS files as a table through the `S3` function. Combined with `INSERT INTO ... SELECT`, it performs a synchronous import, which fits small-batch or ad hoc query scenarios.

### Step 1: Prepare the data

Upload the `s3load_example.csv` file shown above to the target bucket in Tencent Cloud COS.

### Step 2: Create the table in Doris

Run the `CREATE TABLE` statement from the [Prerequisites](#prerequisites) section to create the target table `test_s3load`.

### Step 3: Import the data with the TVF

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "COS",
    "s3.endpoint" = "cos.ap-beijing.myqcloud.com",
    "s3.region" = "ap-beijing",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

### Step 4: Check the import result

```sql
SELECT * FROM test_s3load;
```

Sample result:

```text
mysql> select * from test_s3load;
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

## Key Parameters

<!-- Knowledge type: Configuration parameters -->

The following table lists the parameters commonly used when importing data from Tencent Cloud COS:

| Parameter | Description | Example |
| --- | --- | --- |
| `provider` | Object storage provider. Fixed to `COS` for Tencent Cloud COS | `COS` |
| `s3.endpoint` | COS endpoint, matching the region of the bucket | `cos.ap-beijing.myqcloud.com` |
| `s3.region` | COS region | `ap-beijing` |
| `s3.access_key` | Tencent Cloud access key ID | `<your-ak>` |
| `s3.secret_key` | Tencent Cloud access key secret | `<your-sk>` |
| `uri` / `DATA INFILE` | COS file path. Always use the `s3://` prefix | `s3://your_bucket_name/s3load_example.csv` |
| `format` / `FORMAT AS` | File format (CSV, Parquet, ORC, and so on) | `csv` |
| `column_separator` / `COLUMNS TERMINATED BY` | Column separator | `,` |
| `csv_schema` | Declares the CSV column schema in TVF mode | `user_id:int;name:string;age:int` |
| `timeout` | Timeout for the S3 Load job (in seconds) | `3600` |

## FAQ

<!-- Knowledge type: Troubleshooting -->

**Q1: How do I choose between S3 Load and TVF imports?**

- Large data volumes that can run asynchronously in the background: choose **S3 Load**.
- Small data volumes that need immediate results, or cases where you need to use COS files inside a SELECT query: choose **TVF**.

**Q2: How do I find the value for `s3.endpoint`?**

Use the public or internal COS domain name corresponding to the region of your bucket. For example, the Beijing region uses `cos.ap-beijing.myqcloud.com`, and the Shanghai region uses `cos.ap-shanghai.myqcloud.com`. See the official Tencent Cloud COS documentation for details.

**Q3: Does the URI have to start with `s3://`?**

Yes. Doris accesses COS through the S3 protocol, so both the `DATA INFILE` of S3 Load and the `uri` of the TVF must use the `s3://bucket_name/path` format.

**Q4: Why does the row order in the result differ from the source file?**

A Doris table is distributed: data is spread across multiple tablets according to the bucket key `HASH(user_id)`, and `SELECT *` does not guarantee a specific order. To get an ordered output, use `ORDER BY` explicitly.

**Q5: How do I troubleshoot a failed import?**

- Check whether the `access_key` / `secret_key` has read permission on the target bucket.
- Confirm that `s3.endpoint` and `s3.region` match the region of the bucket.
- For an S3 Load job, run `SHOW LOAD WHERE LABEL = 's3_load_2022_04_01';` to view error details.
