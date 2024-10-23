---
{
    "title": "partition_statistics",
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

Partition statistics

## Database


`__internal_schema`


## Table Information

| Column Name        | Type           | Description                                      |
| ------------------ | -------------- | ------------------------------------------------ |
| catalog_id         | varchar(64)    | ID of the Catalog                                |
| db_id              | varchar(64)    | ID of the Database                               |
| tbl_id             | varchar(64)    | ID of the Table                                  |
| idx_id             | varchar(64)    | ID of the Index                                  |
| part_name          | varchar(64)    | Name of the Partition                            |
| part_id            | bigint         | ID of the Partition                              |
| col_id             | varchar(64)    | ID of the column, currently storing column names |
| count              | bigint         | Number of rows                                   |
| ndv                | hll            | Number of distinct values                        |
| null_count         | bigint         | Number of NULLs                                  |
| min                | varchar(65533) | Minimum value                                    |
| max                | varchar(65533) | Maximum value                                    |
| data_size_in_bytes | bigint         | Data size in bytes                               |
| update_time        | datetime       | Last update time of current statistics           |