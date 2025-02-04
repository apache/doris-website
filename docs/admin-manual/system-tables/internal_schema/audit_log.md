---
{
    "title": "audit_log",
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

## Overview

Store audit logs

## Database


`__internal_schema`


## Table Information

| Column Name       | Type         | Description                                                  |
| ----------------- | ------------ | ------------------------------------------------------------ |
| query_id          | varchar(48)  | ID of the Query                                              |
| time              | datetime(3)  | Time when the query was executed(in milliseconds)                           |
| client_ip         | varchar(128) | IP address of the client sending the query                   |
| user              | varchar(128) | User                                                         |
| catalog           | varchar(128) | Current Catalog during statement execution                   |
| db                | varchar(128) | Current Database during statement execution                  |
| state             | varchar(128) | Execution status of the statement                            |
| error_code        | int          | Error code                                                   |
| error_message     | text         | Error message                                                |
| query_time        | bigint       | Execution time of the statement                              |
| scan_bytes        | bigint       | Amount of data scanned                                       |
| scan_rows         | bigint       | Number of rows scanned                                       |
| return_rows       | bigint       | Number of rows returned                                      |
| shuffleSendRows             | bigint  | The number of rows transferred between nodes during statement execution. Supported since version 3.0. |
| shuffleSendBytes            | bigint    | The amount of data transferred between nodes during statement execution. Supported since version 3.0. | 
| scanBytesFromLocalStorage   | bigint    | The amount of data read from the local disk. Supported since version 3.0. |
| scanBytesFromRemoteStorage  | bigint    | The amount of data read from the remote storage. Supported since version 3.0. |
| stmt_id           | bigint       | Statement ID                                                 |
| stmt_type                   | string    | Statement type. Supported since version 3.0. |
| is_query          | tinyint      | Whether it is a query                                        |
| is_nereids                  | booean    | Is using Nereids Optimizer. |
| frontend_ip       | varchar(128) | IP address of the connected Frontend                         |
| cpu_time_ms       | bigint       | Cumulative CPU time (in milliseconds) consumed by the Backend for statement execution |
| sql_hash          | varchar(128) | Hash value of the statement                                  |
| sql_digest        | varchar(128) | Digest (signature) of the statement                          |
| peak_memory_bytes | bigint       | Peak memory usage of the Backend during statement execution  |
| workload_group    | text         | Workload Group used for statement execution                  |
| compute_group                 | string    | In storage and computation decouped mode, the compute group used by the execution statement. Supported since version 3.0.|
| trace_id                    | string    | Trace ID set when executing the statement |
| stmt              | text         | Statement text                                               |


## Description

- `client_ip`: If a proxy service is used and the IP pass-through is not enabled, the proxy service IP may be recorded here instead of the real client IP.
- `state`: `EOF` indicates that the query is executed successfully. `OK` indicates that the DDL and DML statements are executed successfully. `ERR` indicates that the statement execution fails.


