---
{
    "title": "triggers",
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

Stores all table information.

## Database


`information_schema`


## Table Information

| Column Name     | Type          | Description                                                  |
| --------------- | ------------- | ------------------------------------------------------------ |
| TABLE_CATALOG   | varchar(512)  | The Catalog to which the table belongs                       |
| TABLE_SCHEMA    | varchar(64)   | The Database to which the table belongs                      |
| TABLE_NAME      | varchar(64)   | The name of the table                                        |
| TABLE_TYPE      | varchar(64)   | The type of the table, including: SYSTEM VIEW, VIEW, BASE TABLE |
| ENGINE          | varchar(64)   | The storage engine type of the table                         |
| VERSION         | bigint        | Invalid value                                                |
| ROW_FORMAT      | varchar(10)   | Invalid value                                                |
| TABLE_ROWS      | bigint        | Estimated number of rows in the table                        |
| AVG_ROW_LENGTH  | bigint        | Average row size of the table                                |
| DATA_LENGTH     | bigint        | Estimated size of the table                                  |
| MAX_DATA_LENGTH | bigint        | Invalid value                                                |
| INDEX_LENGTH    | bigint        | Invalid value                                                |
| DATA_FREE       | bigint        | Invalid value                                                |
| AUTO_INCREMENT  | bigint        | Invalid value                                                |
| CREATE_TIME     | datetime      | The time when the table was created                          |
| UPDATE_TIME     | datetime      | The time when the table data was last updated                |
| CHECK_TIME      | datetime      | Invalid value                                                |
| TABLE_COLLATION | varchar(32)   | Fixed value: utf-8                                           |
| CHECKSUM        | bigint        | Invalid value                                                |
| CREATE_OPTIONS  | varchar(255)  | Invalid value                                                |
| TABLE_COMMENT   | varchar(2048) | Comments on the table                                        |