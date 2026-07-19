---
{
    "title": "Huawei Cloud OBS",
    "language": "en",
    "description": "Use S3 Load for asynchronous import or TVF for synchronous import to efficiently load CSV/Parquet and other files from Huawei Cloud OBS into Apache Doris.",
    "keywords": [
        "Huawei Cloud OBS",
        "Huawei Cloud OBS",
        "Doris import OBS",
        "S3 Load OBS",
        "TVF S3",
        "object storage import",
        "OBS Endpoint",
        "obs.cn-north-1.myhuaweicloud.com"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Import data files from Huawei Cloud OBS into Apache Doris -->

Apache Doris supports importing data files directly from Huawei Cloud Object Storage Service (OBS). This is commonly used for offline data migration, historical data backfill, and ingesting data lake files into the warehouse. This document uses CSV files as an example to walk through the complete steps for both import methods.

## Choosing an approach

Doris provides two ways to import files from Huawei Cloud OBS. Choose based on data size and timeliness requirements:

| Import method | Type | Applicable scenario | Reference |
|---------|------|---------|---------|
| **S3 Load** | Asynchronous import | Large-batch data import; jobs run in the background and support retry on failure | [Broker Load Manual](../import-way/broker-load-manual.md) |
| **TVF (Table Value Function)** | Synchronous import | Small to medium data volumes, ad hoc queries, used together with `INSERT INTO ... SELECT` | This document, [Import using TVF](#import-using-tvf) |

> Note: Both methods access OBS through the S3 protocol and require the Endpoint, Region, Access Key, and Secret Key provided by OBS.

## Prerequisites

Before starting the import, make sure the following are ready:

- An accessible Huawei Cloud OBS bucket with the data files to be imported already uploaded.
- The OBS **Endpoint** (such as `obs.cn-north-1.myhuaweicloud.com`) and the corresponding **Region** (such as `cn-north-1`).
- An **Access Key (AK)** and **Secret Key (SK)** with read permission on the bucket.
- A deployed Apache Doris cluster, and the current user has the `LOAD_PRIV` privilege on the target database and table.

## Import using S3 Load

S3 Load is an asynchronous import method. Once a job is submitted, Doris schedules and executes it in the background, which is suitable for large data volumes. For detailed parameters and status queries, see the [Broker Load Manual](../import-way/broker-load-manual.md).

### Step 1: Prepare the data

Upload the CSV file `s3load_example.csv` to Huawei Cloud OBS. The file content is as follows:

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

Create a target table in Doris that matches the file structure:

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Step 3: Import data with S3 Load

Submit an S3 Load job to import the CSV file from OBS into the target table:

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
    "provider" = "OBS",
    "s3.endpoint" = "obs.cn-north-1.myhuaweicloud.com",
    "s3.region" = "cn-north-1",
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
|------|------|
| `DATA INFILE` | The OBS file path, using the `s3://` protocol prefix |
| `provider` | Must be fixed as `OBS`, indicating the object storage type is Huawei Cloud |
| `s3.endpoint` | The Endpoint of the OBS service, set according to the region of the bucket |
| `s3.region` | The Region where the OBS bucket is located |
| `s3.access_key` / `s3.secret_key` | The AK/SK used for authentication |
| `timeout` | The job timeout, in seconds |

### Step 4: Verify the imported data

After the import completes, query the target table to verify that the data is written correctly:

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

## Import using TVF

The TVF (Table Value Function) exposes a file on OBS as a virtual table returned by a table function, so you can complete a synchronous import directly with `INSERT INTO ... SELECT`. This makes it convenient to combine with SQL expressions for lightweight ETL.

### Step 1: Prepare the data

Upload the same CSV file `s3load_example.csv` used in S3 Load to OBS:

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

### Step 3: Import data with TVF

Read the OBS file through the `S3` table function and write it into the target table with `INSERT INTO ... SELECT`:

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "OBS",
    "s3.endpoint" = "obs.cn-north-1.myhuaweicloud.com",
    "s3.region" = "cn-north-1",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

Key parameters:

| Parameter | Description |
|------|------|
| `uri` | The OBS file URI, using the `s3://` protocol prefix |
| `format` | The file format; use `csv` for CSV files |
| `provider` | Must be fixed as `OBS` |
| `s3.endpoint` / `s3.region` | The OBS Endpoint and Region |
| `s3.access_key` / `s3.secret_key` | The AK/SK required for OBS authentication |
| `column_separator` | The field delimiter; the default for CSV is `,` |
| `csv_schema` | The CSV column type definition, in the format `column_name:type;column_name:type;...` |

### Step 4: Verify the imported data

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

**Q1: How should you choose between S3 Load and TVF?**

- Large data volume, asynchronous execution, and retry on failure are needed: choose **S3 Load**.
- Small data volume, immediate results are needed, or lightweight transformation with SQL expressions during import is required: choose **TVF**.

**Q2: Why must the `provider` parameter be set to `OBS`?**

The `provider` parameter identifies the vendor type of the underlying object storage. Although Huawei Cloud OBS is compatible with the S3 protocol, it differs in details such as signing. It must be explicitly declared as `OBS` so that Doris can use the corresponding access adapter.

**Q3: How do you find the OBS Endpoint and Region?**

You can find them on the bucket overview page in the Huawei Cloud OBS console. A typical Endpoint looks like `obs.<region>.myhuaweicloud.com`. For example, the `cn-north-1` region corresponds to `obs.cn-north-1.myhuaweicloud.com`.

**Q4: What file formats are supported in addition to CSV?**

Both S3 Load and TVF support common formats such as `csv`, `parquet`, `orc`, and `json`. Specify the format with the `FORMAT AS` or `format` parameter.

## Troubleshooting

| Symptom | Possible cause | Suggested action |
|------|---------|---------|
| Error `Access Denied` or `403` | Incorrect AK/SK, or the account does not have read permission on the bucket | Verify the AK/SK in the Huawei Cloud console and grant the account read permission on the OBS bucket |
| Error `endpoint is invalid` | Endpoint is misspelled or does not match the region | Confirm the region of the bucket and use the Endpoint for that region |
| Import job stays in `PENDING` state | The cluster is busy or import concurrency is limited | Use `SHOW LOAD` to check the job status, and adjust concurrency or wait for resources to be released if necessary |
| TVF reports a column count or type mismatch | `csv_schema` does not match the actual column structure of the file | Verify the column order, column count, and data types of the file, and update `csv_schema` accordingly |
| Import times out | The file is large and the default `timeout` is insufficient | Increase `timeout` in `PROPERTIES` (in seconds) |

## Related documents

- [Broker Load Manual](../import-way/broker-load-manual.md)
