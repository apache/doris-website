---
{
    "title": "backend_tablets",
    "language": "en",
    "description": "View the information of talbet on Backends.(added by doris 3.0.7)"
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

View the information of talbet on Backends.(added by doris 3.0.7)

## Database


`information_schema`


## Table Information

| Column Name        | Type         | Description                      |
| ------------------ | ------------ | -------------------------------- |
| BE_ID              | bigint       | The ID of the Backend            |
| TABLET_ID          | bigint       | The ID of the Tablet             |
| REPLICA_ID         | bigint       | The ID of the replica            |
| PARTITION_ID       | bigint       | The ID of the partition          |
| TABLET_PATH        | varchar(256) | The Path of the tablet           |
| TABLET_LOCAL_SIZE  | bigint       | The Size of the tablet on local  |
| TABLET_REMOTE_SIZE | bigint       | The Size of the tablet on remote |
| VERSION_COUNT      | bigint       | The number of version            |
| SEGMENT_COUNT      | bigint       | The size of segment              |
| NUM_COLUMNS        | bigint       | The number of columns            |
| ROW_SIZE           | bigint       | The size of row                  |
| COMPACTION_SCORE   | int          | Compaction Score                 |
| COMPRESS_KIND      | varchar(256) | The Kind of Compression          |
| IS_USED            | bool         | Is the tablet datadir opened     |
| IS_ALTER_FAILED    | bool         | Whether the alter operate failed |
| CREATE_TIME        | datetime     | Tablet Create Time               |
| UPDATE_TIME        | datetime     | Last Tablet Writted Time         |
| IS_OVERLAP         | bool         | Whether tablets overlap          |
