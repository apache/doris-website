---
{
    "title": "local file",
    "language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

Doris provides multiple ways to load data from local sources:

- **Stream Load**：Load local files or data streams into Doris via HTTP protocol. Supports CSV, JSON, Parquet, and ORC formats. For more information, refer to the [Stream Load documentation](../import-way/stream-load-manual.md).

- **streamloader**：The Streamloader tool is a dedicated client tool for loading data into the Doris database, based on Stream Load. It can provide multi-file and concurrent load capabilities, reducing the time required for loading large volumes of data. For more documentation, refer to [Streamloader](../../../ecosystem/doris-streamloader).

- **MySQL Load**：Doris is compatible with MySQL protocol and supports using the standard [LOAD DATA](https://dev.mysql.com/doc/refman/8.0/en/load-data.html) syntax to load local files, suitable for loading CSV files.

## Using Stream Load to Load Data

### Step 1: Prepare Data

Create a CSV file named `streamload_example.csv` with the following content:

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

### Step 2: Create Table

Create a table in Doris with the following syntax:

```SQL
CREATE TABLE testdb.test_streamload(
    user_id BIGINT NOT NULL COMMENT "User ID",
    name VARCHAR(20) COMMENT "User Name",
    age INT COMMENT "User Age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### Step 3: Load Data

Submit a Stream Load job using `curl`:

```Bash
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:," \
    -H "columns:user_id,name,age" \
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```

Example of load result:

```SQL
{
    "TxnId": 3,
    "Status": "Success",
    "NumberTotalRows": 10,
    "NumberLoadedRows": 10
}
```

### Step 4: Check Loaded Data

```SQL
mysql> SELECT COUNT(*) FROM testdb.test_streamload;
+----------+
| count(*) |
+----------+
|       10 |
+----------+
```

## Using Streamloader Tool to Load Data

### Step 1: Prepare Data

Create a CSV file named `streamloader_example.csv` with the same content as above.

### Step 2: Create Table

Create the table in Doris with the same syntax as above.

### Step 3: Load Data

Use the Streamloader tool to load data:

```Bash
doris-streamloader --source_file="streamloader_example.csv" --url="http://localhost:8330" --header="column_separator:," --db="testdb" --table="test_streamload"
```

Example of load result:

```SQL
Load Result: {
    "Status": "Success",
    "TotalRows": 10,
    "LoadedRows": 10
}
```

### Step 4: Check Loaded Data

```SQL
mysql> SELECT COUNT(*) FROM testdb.test_streamload;
+----------+
| count(*) |
+----------+
|       10 |
+----------+
```

## Using MySQL Load to Load Data

### Step 1: Prepare Data

Create a file named `client_local.csv` with the following sample data:

```SQL
1,10
2,20
3,30
4,40
5,50
6,60
```

### Step 2: Connect to MySQL Client

```Shell
mysql --local-infile -h <fe_ip> -P <fe_query_port> -u root -D testdb
```

Execute MySQL Load and use specified parameter options when connecting:

- When linking MySQL clients, the '-- local inpile' option must be used, otherwise an error may occur.
- To connect through JDBC, it is necessary to specify the configuration 'allowLoadLocalInfille=true' in the URL`

Create the following table in Doris:

```SQL
CREATE TABLE testdb.t1 (
    pk     INT, 
    v1     INT SUM
) AGGREGATE KEY (pk) 
DISTRIBUTED BY hash (pk);
```

### Step 3: Load Data

Execute the MySQL Load command:

```SQL
LOAD DATA LOCAL
INFILE 'client_local.csv'
INTO TABLE testdb.t1
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```

### Step 4: Check Loaded Data

If the load is successful, the result will be displayed as follows:

```SQL
Query OK, 6 row affected (0.17 sec)
Records: 6  Deleted: 0  Skipped: 0  Warnings: 0
```
