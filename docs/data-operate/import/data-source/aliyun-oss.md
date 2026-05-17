---
{
    "title": "Aliyun OSS",
    "language": "en",
    "description": "This article describes how to efficiently import CSV and other files from Aliyun OSS into Apache Doris using S3 Load and TVF.",
    "keywords": [
        "Aliyun OSS",
        "Aliyun OSS",
        "Doris import OSS",
        "S3 Load",
        "Table Value Function",
        "TVF import",
        "object storage import",
        "Broker Load",
        "OSS endpoint"
    ]
}
---

<!-- Knowledge type: Procedure / Data Import -->
<!-- Applicable scenario: Loading data from Aliyun OSS into Doris -->

Apache Doris supports importing files from Aliyun OSS (Object Storage Service), covering two typical scenarios: bulk asynchronous import and ad-hoc synchronous import. This article presents a comparison of the two approaches, the operation steps, and common troubleshooting.

## Choosing an Approach

Before selecting an import method, refer to the table below to choose the approach that fits your scenario:

| Import Method | Trigger Command                       | Sync/Async | Applicable Scenario                                                  | Reference                                                         |
| ------------- | ------------------------------------- | ---------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| S3 Load       | `LOAD LABEL ...`                      | Async      | Large-batch data import, requires task management and retry on failure | [Broker Load Manual](../import-way/broker-load-manual.md)         |
| TVF Import    | `INSERT INTO ... SELECT FROM S3(...)` | Sync       | Ad-hoc queries, lightweight data import, requires immediate results  | -                                                                 |

## Prerequisites

Before you begin, make sure the following information is ready:

- The Aliyun OSS `bucket` name and the target file path
- Access credentials: `AccessKey` (AK) and `SecretKey` (SK)
- OSS Endpoint and Region information
- The Doris cluster can access OSS (either over the public network or the internal network)

:::caution About Endpoint Selection
The public-network and internal-network Endpoints of Aliyun OSS are different. If the Doris cluster and OSS are in the same Region, use the internal-network Endpoint to get lower latency, more stable bandwidth, and to avoid public-network traffic charges.

- Internal Endpoint: `oss-cn-hangzhou-internal.aliyuncs.com`
- Public Endpoint: `oss-cn-hangzhou.aliyuncs.com`
:::

## Importing with S3 Load (Asynchronous)

S3 Load is an asynchronous import method based on Broker Load and is suitable for batch data loading. For the detailed mechanism, refer to the [Broker Load Manual](../import-way/broker-load-manual.md).

### Step 1: Prepare the data

Create a CSV file `s3load_example.csv` on Aliyun OSS with the following content:

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

### Step 3: Run the S3 Load import

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
    "provider" = "OSS",
    "s3.endpoint" = "oss-cn-hangzhou.aliyuncs.com",
    "s3.region" = "oss-cn-hangzhou",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

Key parameters:

| Parameter         | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `provider`        | Object storage type. For Aliyun OSS, this is fixed as `OSS`.         |
| `s3.endpoint`     | OSS service Endpoint. Choose based on the Region and network environment. |
| `s3.region`       | OSS Region name, for example `oss-cn-hangzhou`.                      |
| `s3.access_key`   | The AccessKey ID of the Aliyun account.                              |
| `s3.secret_key`   | The AccessKey Secret of the Aliyun account.                          |
| `timeout`         | Task timeout, in seconds.                                            |

### Step 4: Check the import result

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

## Importing with TVF (Synchronous)

TVF (Table Value Function) lets you read object storage files directly as a table-valued function and write the data into a target table synchronously through `INSERT INTO ... SELECT`. This approach is suitable for ad-hoc data import or small-batch loading.

### Step 1: Prepare the data

Create a CSV file `s3load_example.csv` on Aliyun OSS with the following content:

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

### Step 3: Run the TVF import

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "OSS",
    "s3.endpoint" = "oss-cn-hangzhou.aliyuncs.com",
    "s3.region" = "oss-cn-hangzhou",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

Key parameters:

| Parameter           | Description                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| `uri`               | The OSS file address, using the `s3://` protocol prefix.                   |
| `format`            | File format, for example `csv`, `parquet`, or `orc`.                       |
| `provider`          | Object storage type. For Aliyun OSS, this is fixed as `OSS`.               |
| `s3.endpoint`       | OSS service Endpoint.                                                      |
| `s3.region`         | OSS Region name.                                                           |
| `s3.access_key`     | The AccessKey ID of the Aliyun account.                                    |
| `s3.secret_key`     | The AccessKey Secret of the Aliyun account.                                |
| `column_separator`  | The CSV column separator.                                                  |
| `csv_schema`        | CSV column definitions, in the form `column_name:type;column_name:type;...`. |

### Step 4: Check the import result

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

<!-- Knowledge type: FAQ / Troubleshooting -->

## FAQ

### Q1: How do I choose between S3 Load and TVF import?

- Use **S3 Load** when the data volume is large and you need asynchronous execution with task scheduling and retry mechanisms.
- Use **TVF import** when you need ad-hoc queries or synchronous writes and require immediate results.

### Q2: What is the difference between an internal Endpoint and a public Endpoint?

- When the Doris cluster and OSS are in the same Region, using the **internal Endpoint** (such as `oss-cn-hangzhou-internal.aliyuncs.com`) provides lower latency, more stable bandwidth, and avoids public-network traffic charges.
- For cross-Region access, or when the cluster is deployed outside Aliyun, use the **public Endpoint** (such as `oss-cn-hangzhou.aliyuncs.com`).

### Q3: Why must the `provider` parameter be set to `OSS`?

The `provider` parameter tells the Doris backend which object storage type is in use, so it can adapt to the authentication and protocol details of Aliyun OSS. When importing files from Aliyun OSS, you must explicitly set this parameter to `OSS`.

### Q4: What should I do if an S3 Load task hangs or times out?

- Increase the `timeout` value (in seconds) in `PROPERTIES`.
- Check network connectivity and prefer using the internal Endpoint.
- Run `SHOW LOAD` to view the task status and the cause of failure. For details, see the [Broker Load Manual](../import-way/broker-load-manual.md).

### Q5: Does TVF import support formats other than CSV?

Yes. You can specify formats such as `csv`, `parquet`, and `orc` through the `format` parameter. For non-CSV formats, you do not need to specify `column_separator` or `csv_schema`.
