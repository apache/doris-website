---
{
    "title": "Local Files",
    "language": "en",
    "description": "Apache Doris local file import guide: import CSV, JSON, Parquet, and ORC local files into Doris using Stream Load, Streamloader, or MySQL Load.",
    "keywords": [
        "Doris local file import",
        "Stream Load",
        "Streamloader",
        "MySQL Load",
        "LOAD DATA LOCAL INFILE",
        "CSV import",
        "local data import"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Import local files or client-side local data into Apache Doris -->

This document explains how to import data from local files into Apache Doris. Doris provides three local file import methods, and you can choose the appropriate one based on data size, number of files, and client environment.

## Choosing a Method

The following table compares the characteristics and applicable scenarios of the three local import methods to help you make a quick choice:

| Import Method | Protocol/Underlying | Sync/Async | Supported Formats | Typical Scenarios | Reference |
|---------|----------|----------|---------|---------|---------|
| **Stream Load** | HTTP | Synchronous | CSV, JSON, Parquet, ORC | Single file, scripted import | [Stream Load](../import-way/stream-load-manual.md) |
| **Streamloader** | Built on Stream Load | Synchronous | CSV, JSON, Parquet, ORC | Multiple files, concurrent import of large data volumes | [Streamloader](../../../connection-integration/data-integration/doris-streamloader) |
| **MySQL Load** | MySQL protocol | Synchronous | CSV | Local CSV files imported through a MySQL client | [MySQL Load](../import-way/mysql-load-manual.md) |

Brief description of each method:

- **Stream Load**: imports local files or data streams into Doris over HTTP. The import result is returned immediately after execution, and you can use the return value to determine whether the import succeeded.
- **Streamloader**: an official Doris client tool built on top of Stream Load. It supports multi-file and multi-concurrency imports, which can significantly reduce the time required for large data volume imports.
- **MySQL Load**: compatible with the standard MySQL [LOAD DATA](https://dev.mysql.com/doc/refman/8.0/en/load-data.html) syntax, mainly used for importing local CSV files through a MySQL client.

## Import Using Stream Load

### Step 1: Prepare the Data

Create a CSV file `streamload_example.csv` with the following content:

```SQL
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

### Step 2: Create a Table in the Database

Create the target table in Doris using the following syntax:

```SQL
CREATE TABLE testdb.test_streamload(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)           COMMENT "User name",
    age                INT                   COMMENT "User age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Step 3: Import Data Using Stream Load

Submit a Stream Load import job using `curl`:

```Bash
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:," \
    -H "columns:user_id,name,age" \
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```

Stream Load is a synchronous import method, and the import result is returned directly to the user:

```SQL
{
    "TxnId": 3,
    "Label": "123",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 10,
    "NumberLoadedRows": 10,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 118,
    "LoadTimeMs": 173,
    "BeginTxnTimeMs": 1,
    "StreamLoadPutTimeMs": 70,
    "ReadDataTimeMs": 2,
    "WriteDataTimeMs": 48,
    "CommitAndPublishTimeMs": 52
}
```

### Step 4: Check the Imported Data

```SQL
select count(*) from testdb.test_streamload;
+----------+
| count(*) |
+----------+
|       10 |
+----------+
```

## Import Using the Streamloader Tool

### Step 1: Prepare the Data

Create a CSV file `streamloader_example.csv` with the following content:

```SQL
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

### Step 2: Create a Table in the Database

Create the target table in Doris using the following syntax:

```SQL
CREATE TABLE testdb.test_streamloader(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)           COMMENT "User name",
    age                INT                   COMMENT "User age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Step 3: Import Data Using the Streamloader Tool

```Bash
doris-streamloader --source_file="streamloader_example.csv" --url="http://localhost:8330" --header="column_separator:," --db="testdb" --table="test_streamloader"
```

This is a synchronous import method, and the import result is returned directly to the user:

```SQL
Load Result: {
        "Status": "Success",
        "TotalRows": 10,
        "FailLoadRows": 0,
        "LoadedRows": 10,
        "FilteredRows": 0,
        "UnselectedRows": 0,
        "LoadBytes": 118,
        "LoadTimeMs": 623,
        "LoadFiles": [
                "streamloader_example.csv"
        ]
}
```

### Step 4: Check the Imported Data

```SQL
select count(*) from testdb.test_streamloader;
+----------+
| count(*) |
+----------+
|       10 |
+----------+
```

## Import Local Data Using MySQL Load

### Step 1: Prepare the Data

Create a file named `client_local.csv` with the following sample data:

```SQL
1,10
2,20
3,30
4,40
5,50
6,60
```

### Step 2: Create a Table in the Database

Before running the `LOAD DATA` command, connect to the MySQL client first:

```Shell
mysql --local-infile  -h <fe_ip> -P <fe_query_port> -u root -D testdb
```

To run MySQL Load correctly, you must use the following options when connecting:

1. When connecting with the MySQL client, you must add the `--local-infile` option, otherwise an error may occur.
2. When connecting through JDBC, specify `allowLoadLocalInfile=true` in the URL.

Then create the target table in Doris:

```SQL
CREATE TABLE testdb.t1 (
    pk     INT, 
    v1     INT SUM
) AGGREGATE KEY (pk) 
DISTRIBUTED BY hash (pk);
```

### Step 3: Import Data Using MySQL Load

After connecting to the MySQL client, create the import job with the following command:

```SQL
LOAD DATA LOCAL
INFILE 'client_local.csv'
INTO TABLE testdb.t1
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```

### Step 4: Check the Imported Data

MySQL Load is a synchronous import method. The result is returned to the user on the command line after the import. If the import fails, the specific error message is displayed.

The following is the result of a successful import, which returns the number of imported rows:

```SQL
Query OK, 6 rows affected (0.17 sec)
Records: 6  Deleted: 0  Skipped: 0  Warnings: 0
```

## Frequently Asked Questions (FAQ)

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Troubleshooting failures of local file imports -->

**Q1: How do I choose among the three import methods?**

- For a single file or scripted scenario: choose Stream Load.
- For multiple files with a large data volume where you want to speed things up with concurrency: choose Streamloader.
- For an existing MySQL client environment where you need to import a local CSV: choose MySQL Load.

**Q2: When running MySQL Load, the error `The used command is not allowed with this MySQL version` is reported.**

Confirm the following two points:

1. Whether the `--local-infile` option is added when connecting through the MySQL command line.
2. Whether `allowLoadLocalInfile=true` is added to the URL when connecting through JDBC.

**Q3: Which data formats does Stream Load support?**

It supports four formats: CSV, JSON, Parquet, and ORC. You can specify the `format` parameter through an HTTP Header.

**Q4: How do I tell whether a Stream Load import succeeded?**

Check the `Status` field in the returned result: a value of `Success` indicates success. You can also check the `NumberLoadedRows` and `NumberFilteredRows` fields to confirm the number of imported and filtered rows.
