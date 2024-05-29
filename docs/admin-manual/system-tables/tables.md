---
{
    "title": "tables",
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

Stores all table information under the current catalog.

## Database

`information_schema`

## Table Information

| Column | Type | Description |
|---|---|---|---|
| TABLE_CATALOG   | VARCHAR(512)  | Catalog  | 
| TABLE_SCHEMA    | VARCHAR(64)   | Database  | 
| TABLE_NAME      | VARCHAR(64)   | Table  | 
| TABLE_TYPE      | VARCHAR(64)   | Table type: SYSTEM VIEW, VIEW, BASE TABLE  | 
| ENGINE          | VARCHAR(64)   | Table engine type  | 
| VERSION         | BIGINT        | Invalid value  | 
| ROW_FORMAT      | VARCHAR(10)   | Invalid value  | 
| TABLE_ROWS      | BIGINT        | Estimated row count  | 
| AVG_ROW_LENGTH  | BIGINT        | Average row size | 
| DATA_LENGTH     | BIGINT        | Estimated table size  | 
| MAX_DATA_LENGTH | BIGINT        | Invalid value  | 
| INDEX_LENGTH    | BIGINT        | Invalid value  | 
| DATA_FREE       | BIGINT        | Invalid value  | 
| AUTO_INCREMENT  | BIGINT        | Invalid value  | 
| CREATE_TIME     | DATETIME      | Create time | 
| UPDATE_TIME     | DATETIME      | Update time  | 
| CHECK_TIME      | DATETIME      | Invalid value  | 
| TABLE_COLLATION | VARCHAR(32)   | Fix value: utf-8  | 
| CHECKSUM        | BIGINT        | Invalid value | 
| CREATE_OPTIONS  | VARCHAR(255)  | Invalid value | 
| TABLE_COMMENT   | VARCHAR(2048) | Comment |

## Example

None

