---
{
    "title": "Importing Data from Google Cloud Storage (GCS)",
    "language": "en",
    "description": "How to import data from Google Cloud Storage into Apache Doris: asynchronous import via S3 Load, or synchronous import via S3 TVF.",
    "keywords": [
        "Google Cloud Storage import",
        "GCS import to Doris",
        "S3 Load GCP",
        "S3 TVF GCS",
        "Doris object storage import",
        "GCP provider"
    ],
    "sidebar_label": "Google Cloud Storage"
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Importing data from Google Cloud Storage into Apache Doris -->

Apache Doris supports importing files from Google Cloud Storage (GCS) by accessing GCS buckets through the S3-compatible protocol. This document describes two import methods and their complete operating procedures.

## Choosing an Approach

Doris provides two methods for importing files from Google Cloud Storage. Choose one based on data volume and timeliness requirements:

| Import Method | Execution Mode | Applicable Scenario | Reference |
|---------|---------|---------|---------|
| S3 Load | Asynchronous | Large-batch data imports, long-running jobs | [Broker Load Manual](../import-way/broker-load-manual.md) |
| S3 TVF (table function) | Synchronous | Small-batch data imports, ad-hoc queries, quick validation | This document |

Recommendations:

- For larger data volumes or jobs that need to run in the background, use **S3 Load**.
- For immediate results or use with `INSERT INTO ... SELECT`, use **S3 TVF**.

## Prerequisites

Prepare the following information before importing:

- Google Cloud Storage bucket name (`your_bucket_name`).
- Access credentials: Access Key and Secret Key.
- GCS Endpoint and Region (for example, `storage.us-west2.rep.googleapis.com` and `US-WEST2`).
- A deployed and accessible Apache Doris cluster.

## Method 1: Import with S3 Load (Asynchronous)

S3 Load is suitable for asynchronous imports of large data volumes. For detailed parameters and advanced usage, see the [Broker Load Manual](../import-way/broker-load-manual.md).

### Step 1: Prepare the Data

Create a CSV file `s3load_example.csv` and upload it to Google Cloud Storage. The file contents are:

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

### Step 3: Import the Data with S3 Load

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
    "provider" = "GCP",
    "s3.endpoint" = "storage.us-west2.rep.googleapis.com",
    "s3.region" = "US-WEST2",
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
| `provider` | Object storage provider. For GCS, this is fixed at `GCP` |
| `s3.endpoint` | GCS S3-compatible access endpoint |
| `s3.region` | Region where the GCS bucket is located |
| `s3.access_key` | GCS access key ID |
| `s3.secret_key` | GCS secret access key |
| `timeout` | Import timeout, in seconds |

### Step 4: Verify the Imported Data

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

## Method 2: Import with TVF (Synchronous)

The S3 table function (TVF) is suitable for synchronous imports and ad-hoc queries, and works directly with `INSERT INTO ... SELECT`.

### Step 1: Prepare the Data

Create a CSV file `s3load_example.csv` and upload it to Google Cloud Storage. The file contents are:

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

### Step 3: Import the Data with TVF

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "GCP",
    "s3.endpoint" = "storage.us-west2.rep.googleapis.com",
    "s3.region" = "US-WEST2",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

Key parameters:

| Parameter | Description |
|------|------|
| `uri` | S3 URI of the file in object storage |
| `format` | File format, such as `csv`, `parquet`, or `orc` |
| `provider` | Object storage provider. For GCS, this is fixed at `GCP` |
| `s3.endpoint` | GCS S3-compatible access endpoint |
| `s3.region` | Region where the GCS bucket is located |
| `s3.access_key` | GCS access key ID |
| `s3.secret_key` | GCS secret access key |
| `column_separator` | Column separator |
| `csv_schema` | CSV column definitions, in the format `column_name:type;column_name:type` |

### Step 4: Verify the Imported Data

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

## FAQ

<!-- Knowledge type: Troubleshooting -->

**Q1: What value should the `provider` parameter use?**

When importing from Google Cloud Storage, `provider` must be set to `GCP` so that Doris accesses GCS through its S3-compatible protocol.

**Q2: How do I choose between S3 Load and S3 TVF?**

- For large data volumes that need to run asynchronously in the background, choose **S3 Load**.
- For small data volumes that need immediate results or that work alongside SQL queries, choose **S3 TVF**.

**Q3: How do I obtain the Access Key and Secret Key for GCS?**

You can create and manage HMAC keys (Access Key / Secret Key) for S3-compatible access on the **Cloud Storage > Settings > Interoperability** page in the Google Cloud Console.

**Q4: How do I determine the Endpoint and Region?**

The Endpoint and Region depend on the region where the bucket is located. For example, the `US-WEST2` region corresponds to the endpoint `storage.us-west2.rep.googleapis.com`. Replace these values according to the actual location of your bucket.

**Q5: What should I do if the import fails with a timeout?**

Increase the `timeout` parameter in `PROPERTIES` (in seconds). The default is `3600`. For very large files or slow networks, extend it as needed.
