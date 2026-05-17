---
{
    "title": "Azure Storage",
    "language": "en",
    "description": "How to import data from Azure Storage into Apache Doris: asynchronous import via S3 Load or synchronous import via TVF, with complete steps and examples.",
    "keywords": [
        "Azure Storage import",
        "Doris Azure Blob",
        "S3 Load Azure",
        "TVF Azure",
        "Doris data import",
        "s3_client_http_scheme",
        "Azure Blob import Doris"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Importing data from Azure Storage into Apache Doris -->

Apache Doris supports importing files from Azure Storage (Azure Blob Storage). This document describes two typical import methods. You can choose the appropriate option based on data volume and real-time requirements.

## Method selection

The following table compares the core differences between the two import methods, helping you choose quickly:

| Import method | Execution mode | Applicable scenario | Reference document |
|----------|----------|----------|----------|
| S3 Load | Asynchronous | Large-scale data import, background scheduling required | [Broker Load Manual](../import-way/broker-load-manual.md) |
| TVF (Table-Valued Function) | Synchronous | Ad hoc queries, small-batch data import, quick verification |  |

## Prerequisites

Before importing data from Azure Storage using either method, confirm the following configurations:

- **HTTPS transport**: Azure Storage requires HTTPS transport by default (corresponding to the storage account configuration `Secure transfer required: Enabled`). You must set `s3_client_http_scheme = https` in Doris `be.conf`, otherwise it cannot be accessed properly.
- **Region can be omitted**: In the properties for Azure-compatible S3 protocol, the `s3.region` parameter can be omitted.
- **Access credentials**: Prepare the Access Key (AK) and Secret Key (SK) of the Azure Storage account.
- **Endpoint format**: Use an Endpoint address in the form of `<StorageAccount>.blob.core.windows.net`.

:::caution Caution
If HTTPS is not enabled in the BE configuration, the import will fail due to a protocol mismatch. Complete the above configuration before performing import operations.
:::

## Method 1: Import using S3 Load (asynchronous)

S3 Load is an asynchronous batch import method, suitable for importing large-scale data from Azure Storage into Doris. The complete steps are as follows.

### Step 1: Prepare data

Create a CSV file `s3load_example.csv` on Azure Storage with the following content:

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

### Step 3: Import data using S3 Load

Run the following SQL to submit an S3 Load task:

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
    "provider" = "AZURE",
    "s3.endpoint" = "StorageAccountA.blob.core.windows.net",
    "s3.region" = "westus3",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

Key parameter descriptions:

| Parameter | Description |
|------|------|
| `provider` | Must be set to `AZURE` to identify the object storage provider |
| `s3.endpoint` | Azure Blob service address, in the format `<StorageAccount>.blob.core.windows.net` |
| `s3.region` | Can be omitted in Azure scenarios |
| `s3.access_key` | Access Key of the Azure Storage account |
| `s3.secret_key` | Secret Key of the Azure Storage account |
| `timeout` | Import task timeout (in seconds) |

### Step 4: Verify the imported data

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

## Method 2: Import using TVF (synchronous)

TVF (Table-Valued Function) is a synchronous import method that can read and write data within a single SQL statement, suitable for small-batch data or ad hoc scenarios.

### Step 1: Prepare data

Create a CSV file `s3load_example.csv` on Azure Storage with the following content:

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

### Step 3: Import data using TVF

Import data directly via `INSERT INTO ... SELECT FROM S3(...)`:

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "AZURE",
    "s3.endpoint" = "StorageAccountA.blob.core.windows.net",
    "s3.region" = "westus3",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

Key parameter descriptions:

| Parameter | Description |
|------|------|
| `uri` | Object path on Azure Storage, in the format `s3://<bucket>/<object>` |
| `format` | File format, such as `csv`, `parquet`, `orc`, etc. |
| `provider` | Must be set to `AZURE` |
| `s3.endpoint` | Azure Blob service address |
| `s3.region` | Can be omitted in Azure scenarios |
| `s3.access_key` / `s3.secret_key` | Azure Storage access credentials |
| `column_separator` | Column separator (applicable to CSV) |
| `csv_schema` | CSV column definition, in the format `column_name:type;column_name:type` |

### Step 4: Verify the imported data

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

### Q1: How should you choose between S3 Load and TVF?

- **S3 Load**: Executes asynchronously, suitable for large-batch data, scenarios that require tracking import status by Label, or scheduling as periodic tasks.
- **TVF**: Executes synchronously, suitable for small-batch data, ad hoc queries, quick verification of file content, or scenarios that require transforming data in SELECT before writing.

### Q2: Why does an error or connection failure occur when accessing Azure Storage?

Confirm the following:

1. `s3_client_http_scheme = https` is set in `be.conf` on the BE node, and the BE has been restarted to take effect.
2. When the Azure Storage account has `Secure transfer required` enabled, HTTPS must be used.
3. The format of `s3.endpoint` is correct: `<StorageAccount>.blob.core.windows.net`, without a protocol prefix.
4. The AK/SK is valid and has read permission for the target Bucket.

### Q3: Is `s3.region` required?

No. In Azure scenarios, `s3.region` can be omitted. If specified, it does not affect the import process.

### Q4: What format should the URI use?

Whether for `DATA INFILE` in S3 Load or `uri` in TVF, use the form `s3://<bucket_name>/<object_path>` to access objects on Azure Storage.

## Troubleshooting

| Symptom | Possible cause | Solution |
|------|----------|----------|
| Import task reports a connection error | HTTPS is not enabled on BE | Set `s3_client_http_scheme = https` in `be.conf` and restart BE |
| Permission or authentication failure reported | Incorrect AK/SK or insufficient permission | Check whether the Access Key and Secret Key are correct, and confirm read permission for the target container |
| Endpoint cannot be resolved | Endpoint contains a protocol prefix or is misspelled | Use `<StorageAccount>.blob.core.windows.net` without a prefix such as `https://` |
| Import task times out | Large data volume or slow network | Increase the `timeout` value in `PROPERTIES` |

## Related documents

- [Broker Load Manual](../import-way/broker-load-manual.md)
