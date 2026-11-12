---
{
    "title": "MinIO | Data Source",
    "language": "en",
    "description": "Doris provides two ways to load files from MinIO:",
    "sidebar_label": "MinIO"
}
---

# MinIO

Doris provides two ways to load files from MinIO:
- Use S3 Load to load MinIO files into Doris, which is an asynchronous load method.
- Use TVF to load MinIO files into Doris, which is a synchronous load method.

## load with S3 Load

Use S3 Load to import files on object storage. For detailed steps, please refer to the [Broker Load Manual](../import-way/broker-load-manual)

### Step 1: Prepare the data

Create a CSV file s3load_example.csv The file is stored on MinIO and its content is as follows:

```
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

### Step 3: Load data using S3 Load

:::caution Caution
When importing data from MinIO with S3 Load, note the following:

- If MinIO is deployed in a local network without TLS, explicitly add `http://` in the endpoint, for example: `"s3.endpoint" = "http://localhost:9000"`.
- The S3 SDK uses virtual-hosted style by default, while MinIO does not enable it by default. Add `"use_path_style" = "true"` to force path-style access.
:::

```sql
LOAD LABEL s3_load_2022_04_05
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

### Step 4: Check the imported data

```sql
SELECT * FROM test_s3load;
```

Results:

```
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

## Load with TVF

### Step 1: Prepare the data

Create a CSV file s3load_example.csv The file is stored on MinIO and its content is as follows:

```
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

### Step 3: Load data using TVF

:::caution Caution
When importing data from MinIO with TVF, note the following:

- If MinIO is deployed in a local network without TLS, explicitly add `http://` in the endpoint, for example: `"s3.endpoint" = "http://localhost:9000"`.
- The S3 SDK uses virtual-hosted style by default, while MinIO does not enable it by default. Add `"use_path_style" = "true"` to force path-style access.
:::

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

### Step 4: Check the imported data

```sql
SELECT * FROM test_s3load;
```

Results:

```
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
