---
{
    "title": "table_options",
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

`table_options` is a built-in system table of doris, which is stored under the information_schema database. You can view the current table options information of each table through the `table_options` system table.

## Database

`information_schema`

## Table Information

+-----------------+-------------+------+-------+---------+-------+
| Field           | Type        | Null | Key   | Default | Extra |
+-----------------+-------------+------+-------+---------+-------+
| TABLE_CATALOG   | VARCHAR(64) | Yes  | false | NULL    |       |
| TABLE_SCHEMA    | VARCHAR(64) | Yes  | false | NULL    |       |
| TABLE_NAME      | VARCHAR(64) | Yes  | false | NULL    |       |
| TABLE_MODEL     | TEXT        | Yes  | false | NULL    |       |
| TABLE_MODEL_KEY | TEXT        | Yes  | false | NULL    |       |
| DISTRIBUTE_KEY  | TEXT        | Yes  | false | NULL    |       |
| DISTRIBUTE_TYPE | TEXT        | Yes  | false | NULL    |       |
| BUCKETS_NUM     | INT         | Yes  | false | NULL    |       |
| PARTITION_NUM   | INT         | Yes  | false | NULL    |       |
+-----------------+-------------+------+-------+---------+-------+


### Example
mysql> select * from information_schema.table_options where table_schema="test_table_options_db";
+---------------+-----------------------+----------------------------+-------------+-------------------------------------+----------------+-----------------+-------------+---------------+
| TABLE_CATALOG | TABLE_SCHEMA          | TABLE_NAME                 | TABLE_MODEL | TABLE_MODEL_KEY                     | DISTRIBUTE_KEY | DISTRIBUTE_TYPE | BUCKETS_NUM | PARTITION_NUM |
+---------------+-----------------------+----------------------------+-------------+-------------------------------------+----------------+-----------------+-------------+---------------+
| internal      | test_table_options_db | randomtable                | DUP         | user_id,date,timestamp              | RANDOM         | RANDOM          |          16 |             1 |
| internal      | test_table_options_db | test_row_column_page_size1 | DUP         | aaa                                 | aaa            | HASH            |           1 |             1 |
| internal      | test_table_options_db | aggregate_table            | AGG         | user_id,date,city,age,sex           | user_id        | HASH            |           1 |             1 |
| internal      | test_table_options_db | rangetable                 | AGG         | user_id,date,timestamp,city,age,sex | user_id        | HASH            |           8 |             3 |
| internal      | test_table_options_db | unique_table               | UNI         | user_id,username                    | user_id        | HASH            |           1 |             1 |
| internal      | test_table_options_db | listtable                  | AGG         | user_id,date,timestamp,city,age,sex | user_id        | HASH            |          16 |             3 |
| internal      | test_table_options_db | duplicate_table            | DUP         | timestamp,type,error_code           | type           | HASH            |           1 |             1 |
+---------------+-----------------------+----------------------------+-------------+-------------------------------------+----------------+-----------------+-------------+---------------+


### KeyWords

    table_options, information_schema
