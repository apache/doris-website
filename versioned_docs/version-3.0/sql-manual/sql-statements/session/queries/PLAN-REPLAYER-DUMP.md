---
{
    "title": "PLAN REPLAYER DUMP",
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



## Description

PLAN REPLAYER DUMP is a tool for Doris users to generate execution plan diagnostic files. It captures the state and input data of the query optimizer, facilitating debugging and analysis of query optimization issues. The output is the http address of the corresponding diagnostic file.


## Syntax

```sql
PLAN REPLAYER DUMP <query>
```


## Required Parameters

`<query>`


- Refers to the query statement inside the corresponding DML.
- If it is not a query statement, a parse error will be reported.
- For more details, please refer to the [SELECT](https://doris.apache.org/en-US/docs/sql-manual/sql-statements/Data-Manipulation-Statements/Manipulation/SELECT/) syntax.


## Permission Control


Users executing this SQL command must have at least the following permissions:


| Privilege | Object | Notes |
| :--: | :--: | :--: |
| SELECT_PRIV | Table, View | When executing the <query_sql_statement>, the SELECT_PRIV permission for the queried table, view, or materialized view is required. |


## Examples


### Basic Example

```sql
create database test_replayer;
use database test_replayer;
create table t1 (c1 int, c11 int) distributed by hash(c1) buckets 3 properties('replication_num' = '1');
plan replayer dump select * from t1;
```


Execution result example:

```sql
+-------------------------------------------------------------------------------+
| Plan Replayer dump url                                                        |
| Plan Replayer dump url |
+-------------------------------------------------------------------------------+
| http://127.0.0.1:8030/api/minidump?query_id=6e7441f741e94afd-ad3ba69429ad18ec |
+-------------------------------------------------------------------------------+
```


You can use curl or wget to obtain the corresponding file, for example:

```sql
wget http://127.0.0.1:8030/api/minidump?query_id=6e7441f741e94afd-ad3ba69429ad18ec
```


When permissions are required, you can include the username and password in:

```sql
wget --header="Authorization: Basic $(echo -n 'root:' | base64)" http://127.0.0.1:8030/api/minidump?query_id=6e7441f741e94afd-ad3ba69429ad18ec
```
```

