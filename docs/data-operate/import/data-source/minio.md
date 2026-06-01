---
{
    "title": "Importing Data from MinIO",
    "language": "en",
    "description": "How to import CSV, Parquet, and other files from MinIO object storage into Doris? Both asynchronous S3 Load and synchronous TVF methods are supported.",
    "keywords": [
        "MinIO import",
        "Doris MinIO",
        "S3 Load",
        "S3 TVF",
        "object storage import",
        "use_path_style",
        "MinIO endpoint"
    ],
    "sidebar_label": "MinIO"
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Importing files from MinIO object storage into Doris -->

[MinIO](https://min.io/) is an S3-compatible object storage. Doris provides two methods for importing files from MinIO. Choose between them based on data volume and timeliness requirements:

| Import method | Execution mode | Applicable scenario | Documentation reference |
|----------|----------|----------|----------|
| S3 Load   | Asynchronous | Large-batch data import; tasks that need to run in the background | [Broker Load Manual](../import-way/broker-load-manual.md) |
| TVF (Table Value Function) | Synchronous | Small-batch, ad-hoc query imports; works with `INSERT INTO ... SELECT` | Examples in this document |

## Prerequisites

Before importing MinIO data using either method, confirm the following conditions:

- A Doris cluster is deployed and can access the MinIO service normally.
- You have obtained the MinIO endpoint, region, access key, and secret key.
- The CSV/Parquet files to be imported have been uploaded to a MinIO bucket.

:::caution Important: MinIO Connection Configuration Notes
When using S3 Load or TVF to import MinIO data, note the following two points:

- **Endpoint protocol prefix**: If MinIO is deployed on a local network without TLS enabled, you need to explicitly add `http://` to the `endpoint`, for example `"s3.endpoint" = "http://localhost:9000"`.
- **Path access style**: The S3 SDK uses virtual-hosted style by default, but MinIO does not enable this access mode by default. Add `"use_path_style" = "true"` to force path style.
:::

## Method 1: Import Using S3 Load (Asynchronous)

S3 Load is suitable for importing files from MinIO into Doris as an asynchronous task. For detailed steps, refer to the [Broker Load Manual](../import-way/broker-load-manual.md).

### Step 1: Prepare the Data

Create a CSV file `s3load_example.csv` and upload it to MinIO with the following content:

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

### Step 2: Create a Table in Doris

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Step 3: Import Data Using S3 Load

Execute the following SQL to submit an S3 Load task:

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
    "s3.endpoint" = "play.min.io:9000",
    "s3.region" = "us-east-1",
    "s3.access_key" = "myminioadmin",
    "s3.secret_key" = "minio-secret-key-change-me",
    "use_path_style" = "true"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

### Step 4: Verify the Imported Data

Run a query to verify whether the data has been imported successfully:

```sql
SELECT * FROM test_s3load;
```

Expected output:

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

## Method 2: Import Using TVF (Synchronous)

The TVF (Table Value Function) method reads MinIO files as a virtual table through the `S3()` function, and combined with `INSERT INTO ... SELECT` it completes the import synchronously. It is suitable for small-batch or ad-hoc scenarios.

### Step 1: Prepare the Data

Create a CSV file `s3load_example.csv` and upload it to MinIO with the following content:

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

### Step 2: Create a Table in Doris

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Step 3: Import Data Using TVF

Execute the following SQL to import the data synchronously:

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "S3",
    "s3.endpoint" = "play.min.io:9000",
    "s3.region" = "us-east-1",
    "s3.access_key" = "myminioadmin",
    "s3.secret_key" = "minio-secret-key-change-me",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int",
    "use_path_style" = "true"
);
```

### Step 4: Verify the Imported Data

Run a query to verify whether the data has been imported successfully:

```sql
SELECT * FROM test_s3load;
```

Expected output:

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

The following parameters must be configured correctly for both S3 Load and TVF:

| Parameter | Description | Example value |
|------|------|--------|
| `provider` | Object storage provider. Set to `S3` when using MinIO. | `S3` |
| `s3.endpoint` | MinIO service address. The `http://` prefix is required when TLS is not enabled. | `http://localhost:9000` |
| `s3.region` | The region where MinIO is deployed. Can be set to any value but must remain consistent. | `us-east-1` |
| `s3.access_key` | MinIO access key ID. | `myminioadmin` |
| `s3.secret_key` | MinIO access key secret. | `minio-secret-key-change-me` |
| `use_path_style` | Whether to use path-style access. Must be set to `true` for MinIO. | `true` |

## FAQ

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Troubleshooting / Connection configuration -->

### Q1: How do I choose between S3 Load and TVF?

- **S3 Load**: Executes asynchronously. Suitable for large-batch data imports. After submission, Doris schedules and runs the task in the background, and you can query the task status with `SHOW LOAD`.
- **TVF**: Executes synchronously. Suitable for small-batch, ad-hoc analysis, or scenarios combined with `INSERT INTO ... SELECT` pipelines. Returns results immediately.

### Q2: What should I do if I get endpoint-related errors when connecting to MinIO?

Confirm whether the endpoint has the correct protocol prefix:

- TLS not enabled: Must include `http://`, such as `http://localhost:9000`.
- TLS enabled: Use the `https://` prefix.

### Q3: What should I do if access reports a bucket parsing error or 404?

MinIO does not support virtual-hosted style access by default. You need to explicitly add the following to the import parameters:

```text
"use_path_style" = "true"
```

### Q4: Are other formats such as Parquet/ORC supported?

Yes. Replace `FORMAT AS "CSV"` (or `"format" = "csv"` in TVF) with `parquet`, `orc`, or other corresponding formats. For details, see the [Broker Load Manual](../import-way/broker-load-manual.md).
