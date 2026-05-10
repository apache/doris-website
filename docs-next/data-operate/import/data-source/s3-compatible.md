---
{
    "title": "S3-Compatible Storage",
    "language": "en",
    "description": "How to load data from S3-compatible storage such as MinIO and Ceph into Apache Doris: asynchronous loading via S3 Load or synchronous loading via TVF.",
    "keywords": [
        "S3-compatible storage",
        "Load MinIO into Doris",
        "Load Ceph into Doris",
        "S3 Load",
        "S3 TVF",
        "Broker Load",
        "Object storage import",
        "use_path_style",
        "virtual-hosted style",
        "path style"
    ]
}
---

<!-- Knowledge type: Procedure / Data loading -->
<!-- Applicable scenario: Loading data from S3-compatible storage (MinIO, Ceph, etc.) into Doris -->

Apache Doris supports loading data from various object storage systems that are compatible with the S3 protocol, such as MinIO, Ceph, Huawei Cloud OBS, and Tencent Cloud COS. This document describes the applicable scenarios and complete steps for two loading methods.

## Choosing a Method

Choose the appropriate loading method based on data size and processing mode:

| Loading Method | Mode | Applicable Scenario | Reference |
| --- | --- | --- | --- |
| **S3 Load** | Asynchronous | Large-batch data loading, requires job management and retry mechanisms | [Broker Load Manual](../import-way/broker-load-manual.md) |
| **TVF (Table Value Function)** | Synchronous | Ad-hoc queries, small-batch data loading, consuming data directly in SQL | - |

:::caution Note
The S3 SDK accesses object storage in **virtual-hosted style** by default. If the target storage system does not enable or support this style, add the parameter `"use_path_style" = "true"` to force the use of **path style**.
:::

## Loading with S3 Load (Asynchronous)

S3 Load is suitable for large-scale batch loading. Loading jobs are submitted asynchronously and scheduled by Doris in the background. For the detailed mechanism, refer to the [Broker Load Manual](../import-way/broker-load-manual.md).

### Step 1: Prepare the Data

Create a CSV file `s3load_example.csv` on S3-compatible storage with the following content:

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
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Step 3: Submit the S3 Load Job

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
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "use_path_style" = "true"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

Key parameters:

| Parameter | Description |
| --- | --- |
| `provider` | Object storage provider type. For S3-compatible storage, always use `S3`. |
| `s3.endpoint` | The access endpoint of the S3-compatible storage (without protocol prefix). |
| `s3.region` | The region where the bucket is located. |
| `s3.access_key` | The access key (AK). |
| `s3.secret_key` | The secret key (SK). |
| `use_path_style` | Whether to use path style access. Storage systems such as MinIO usually require this to be set to `true`. |
| `timeout` | The timeout of the loading job, in seconds. |

### Step 4: Verify the Loading Result

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

## Loading with TVF (Synchronous)

TVF treats files in S3-compatible storage as a table for querying. Combined with `INSERT INTO ... SELECT`, it enables synchronous loading and is suitable for ad-hoc analysis and small-batch data loading.

### Step 1: Prepare the Data

Create a CSV file `s3load_example.csv` on S3-compatible storage with the following content:

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
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Step 3: Load Synchronously via TVF

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "S3",
    "s3.endpoint" = "play.min.io:9000",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int",
    "use_path_style" = "true"
);
```

Key parameters:

| Parameter | Description |
| --- | --- |
| `uri` | The full path of the file in S3-compatible storage. |
| `format` | The file format, such as `csv`, `parquet`, or `orc`. |
| `provider` | Object storage provider type. For S3-compatible storage, always use `S3`. |
| `s3.endpoint` | The access endpoint of the S3-compatible storage. |
| `s3.region` | The region where the bucket is located. |
| `s3.access_key` | The access key (AK). |
| `s3.secret_key` | The secret key (SK). |
| `column_separator` | The column separator. |
| `csv_schema` | The column definition of the CSV file, in the format `field_name:type`. |
| `use_path_style` | Whether to use path style access. |

### Step 4: Verify the Loading Result

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

## FAQ

<!-- Knowledge type: Troubleshooting -->

### 1. Why does accessing storage such as MinIO report that the bucket does not exist or cannot be resolved?

The S3 SDK builds the domain name in virtual-hosted style by default (such as `bucket.endpoint`), while MinIO, Ceph, and similar systems usually use path style (such as `endpoint/bucket`). Add `"use_path_style" = "true"` to the loading parameters to resolve this.

### 2. Does `s3.endpoint` need to include the `http://` or `https://` prefix?

No. `s3.endpoint` only takes the host name and port (such as `play.min.io:9000`).

### 3. How do I choose between S3 Load and TVF?

- For large data volumes where you want asynchronous execution and a preserved job history, use **S3 Load**.
- When you need to read S3 files in a single SQL statement and write the result synchronously with `INSERT INTO ... SELECT`, use **TVF**.

### 4. What should I do if the loading job times out?

Increase the `timeout` property of S3 Load (in seconds), or split a large file into multiple smaller files to improve concurrency.
