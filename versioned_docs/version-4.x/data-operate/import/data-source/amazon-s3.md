---
{
    "title": "Amazon S3",
    "language": "en",
    "description": "How to load data from Amazon S3 into Doris: complete steps, parameters, and examples for asynchronous loading with S3 Load and synchronous loading with TVF.",
    "keywords": [
        "Amazon S3 load",
        "Doris S3 Load",
        "S3 TVF",
        "AWS S3 data loading",
        "Broker Load S3",
        "AWS Assume Role"
    ]
}
---

<!-- Knowledge type: Procedure / Data loading -->
<!-- Use case: Load files from AWS S3 into Doris -->

Doris provides two ways to load files from AWS S3, suited to asynchronous and synchronous scenarios respectively:

| Method | Type | Use case |
| --- | --- | --- |
| **S3 Load** | Asynchronous | Large-batch data loading, scheduled jobs, and offline loading that requires high throughput and stability |
| **TVF (Table Value Function)** | Synchronous | Ad hoc queries, ETL processing, and synchronous writes combined with `INSERT INTO ... SELECT` |

> Tip: S3 Load is implemented based on Broker Load. For detailed behavior, see the [Broker Load Manual](../import-way/broker-load-manual.md).

## Method 1: Load with S3 Load (asynchronous)

<!-- Knowledge type: Procedure -->

S3 Load is an asynchronous loading method. It returns immediately after submission and runs in the background. It is suitable for scenarios with large data volumes or that require background batch processing.

### Step 1: Prepare the data

Create a CSV file `s3load_example.csv` on S3 with the following content:

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

### Step 2: Create a table in Doris

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Step 3: Load the data with S3 Load

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
    "provider" = "S3",
    "s3.endpoint" = "s3.us-west-2.amazonaws.com",
    "s3.region" = "us-west-2",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

Key parameters:

| Parameter | Description |
| --- | --- |
| `DATA INFILE` | URI of the file on S3 to load, in the format `s3://bucket/path` |
| `COLUMNS TERMINATED BY` | CSV column delimiter |
| `FORMAT AS` | File format, for example `CSV` |
| `provider` | Object storage provider. Use `S3` for AWS S3 |
| `s3.endpoint` | Endpoint of the S3 service, for example `s3.us-west-2.amazonaws.com` |
| `s3.region` | Region where the S3 bucket is located |
| `s3.access_key` | AWS Access Key |
| `s3.secret_key` | AWS Secret Key |
| `timeout` | Timeout of the load job, in seconds |

### Step 4: Check the loaded data

```sql
SELECT * FROM test_s3load;
```

Expected result:

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

## Method 2: Load with TVF (synchronous) {#load-with-tvf}
<!-- Knowledge type: Procedure -->

TVF (Table Value Function) treats a file on S3 as a table. You can query it directly with `SELECT` and write the result synchronously into a Doris table by combining it with `INSERT INTO`. It is suitable for scenarios that require high result visibility with moderate data volumes.

### Step 1: Prepare the data

Create a CSV file `s3load_example.csv` on S3 with the following content:

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

### Step 2: Create a table in Doris

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Step 3: Load the data with TVF

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "s3.endpoint" = "s3.us-west-2.amazonaws.com",
    "s3.region" = "us-west-2",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

Key parameters:

| Parameter | Description |
| --- | --- |
| `uri` | URI of the file to read on S3 |
| `format` | File format, for example `csv` |
| `s3.endpoint` | Endpoint of the S3 service |
| `s3.region` | Region where the S3 bucket is located |
| `s3.access_key` | AWS Access Key |
| `s3.secret_key` | AWS Secret Key |
| `column_separator` | Column delimiter |
| `csv_schema` | Schema definition of the CSV file, in the format `column_name:type;...` |

### Step 4: Check the loaded data

```sql
SELECT * FROM test_s3load;
```

Expected result:

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

## Authentication with AWS Assume Role

<!-- Knowledge type: Configuration / Authentication -->

In addition to using Access Key / Secret Key, Doris also supports authenticating S3 Load and TVF via `AWS Assume Role`. This is suitable for enterprises with restrictions on distributing credentials. For detailed configuration, see [AWS Integration - Assumed Role Authentication](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication).

## FAQ

<!-- Knowledge type: FAQ -->

**Q1: How to choose between S3 Load and TVF?**

- For large-batch, offline, scheduled jobs: prefer **S3 Load** (asynchronous, runs in the background, supports timeout control).
- For ad hoc queries, or when you need to process data in SQL before writing: prefer **TVF** (synchronous, can be combined with `SELECT` / `INSERT`).

**Q2: How to specify the Region and Endpoint of an S3 file?**

- Use `s3.region` to specify the region where the bucket is located, for example `us-west-2`.
- Use `s3.endpoint` to specify the service address, for example `s3.us-west-2.amazonaws.com`.
- The two must be consistent, otherwise connection failures or redirect errors may occur.

**Q3: Is `csv_schema` required for TVF loading?**

When the source file is CSV, it is recommended to provide `csv_schema` explicitly to specify the name and type of each column, avoiding the uncertainty caused by type inference.

**Q4: What if an S3 Load job runs for too long?**

Increase `timeout` in `PROPERTIES` (in seconds) appropriately. The example uses `3600`, which can be adjusted based on the data scale.

## Troubleshooting

<!-- Knowledge type: Troubleshooting -->

| Symptom | Possible cause | Recommended action |
| --- | --- | --- |
| Connection to S3 fails / times out | `s3.endpoint` does not match `s3.region`, or the network is unreachable | Verify the Endpoint and Region; confirm that Doris BE nodes can access S3 |
| Authentication fails (403) | Access Key / Secret Key is incorrect, or the permissions are insufficient | Check whether the AK/SK are correct; confirm the read permissions on the corresponding bucket and object |
| File not found | The `DATA INFILE` / `uri` path is incorrect | Verify the bucket name, key path, and case sensitivity |
| CSV parsing error | The delimiter or schema does not match | Check `COLUMNS TERMINATED BY` / `column_separator` and `csv_schema` |
| Job times out | Large data volume or slow network | Increase `timeout`, or split the file and load in parallel |

## Related documents

- [Broker Load Manual](../import-way/broker-load-manual.md)
- [AWS Integration - Assumed Role Authentication](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication)
