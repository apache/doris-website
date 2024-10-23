---
{
    "title": "processlist",
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

View All Current Connections

## Database


`information_schema`


## Table Information

| Column Name       | Type           | Description                          |
| ----------------- | -------------- | ------------------------------------ |
| CURRENT_CONNECTED | varchar(16)    | Deprecated, always No                |
| ID                | largeint       | Connection ID                        |
| USER              | varchar(32)    | Connected user                       |
| HOST              | varchar(261)   | Connection address                   |
| LOGIN_TIME        | datetime       | Login time                           |
| CATALOG           | varchar(64)    | Current Catalog                      |
| DB                | varchar(64)    | Current Database                     |
| COMMAND           | varchar(16)    | Type of MySQL Command currently sent |
| TIME              | int            | Execution time of the last query     |
| STATE             | varchar(64)    | Status of the last query             |
| QUERY_ID          | varchar(256)   | ID of the last query                 |
| INFO              | varchar(65533) | Query statement of the last query    |
| FE                | varchar(64)    | Connected Front-End (FE)             |
| CLOUD_CLUSTER     | varchar(64)    | Name of the Cloud Cluster being used |