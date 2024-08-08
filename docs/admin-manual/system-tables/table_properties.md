---
{
    "title": "table_properties",
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

`table_properties` is a built-in system table of doris, which is stored under the information_schema database. 
You can view the current table properties information of each table through the `table_properties` system table.

## Database

`information_schema`

## Table Information

+----------------+-------------+------+-------+---------+-------+
| Field          | Type        | Null | Key   | Default | Extra |
+----------------+-------------+------+-------+---------+-------+
| TABLE_CATALOG  | varchar(64) | Yes  | false | NULL    |       |
| TABLE_SCHEMA   | varchar(64) | Yes  | false | NULL    |       |
| TABLE_NAME     | varchar(64) | Yes  | false | NULL    |       |
| PROPERTY_NAME  | text        | Yes  | false | NULL    |       |
| PROPERTY_VALUE | text        | Yes  | false | NULL    |       |
+----------------+-------------+------+-------+---------+-------+


### Example
mysql> select * from information_schema.table_properties where table_name="rangetable" and table_schema="test_table_properties_db";
+---------------+--------------------------+------------+------------------------------------------------+-------------------------+
| TABLE_CATALOG | TABLE_SCHEMA             | TABLE_NAME | PROPERTY_NAME                                  | PROPERTY_VALUE          |
+---------------+--------------------------+------------+------------------------------------------------+-------------------------+
| internal      | test_table_properties_db | rangetable | min_load_replica_num                           | -1                      |
| internal      | test_table_properties_db | rangetable | data_sort.col_num                              | 6                       |
| internal      | test_table_properties_db | rangetable | group_commit_interval_ms                       | 10000                   |
| internal      | test_table_properties_db | rangetable | data_sort.sort_type                            | LEXICAL                 |
| internal      | test_table_properties_db | rangetable | is_being_synced                                | false                   |
| internal      | test_table_properties_db | rangetable | binlog.enable                                  | false                   |
| internal      | test_table_properties_db | rangetable | enable_mow_light_delete                        | false                   |
| internal      | test_table_properties_db | rangetable | binlog.ttl_seconds                             | 86400                   |
| internal      | test_table_properties_db | rangetable | inverted_index_storage_format                  | V2                      |
| internal      | test_table_properties_db | rangetable | time_series_compaction_empty_rowsets_threshold | 5                       |
| internal      | test_table_properties_db | rangetable | default.replication_allocation                 | tag.location.default: 1 |
| internal      | test_table_properties_db | rangetable | time_series_compaction_level_threshold         | 1                       |
| internal      | test_table_properties_db | rangetable | time_series_compaction_time_threshold_seconds  | 3600                    |
| internal      | test_table_properties_db | rangetable | storage_format                                 | V2                      |
| internal      | test_table_properties_db | rangetable | store_row_column                               | false                   |
| internal      | test_table_properties_db | rangetable | light_schema_change                            | true                    |
| internal      | test_table_properties_db | rangetable | enable_unique_key_merge_on_write               | false                   |
| internal      | test_table_properties_db | rangetable | in_memory                                      | false                   |
| internal      | test_table_properties_db | rangetable | file_cache_ttl_seconds                         | 0                       |
| internal      | test_table_properties_db | rangetable | group_commit_data_bytes                        | 134217728               |
| internal      | test_table_properties_db | rangetable | compaction_policy                              | size_based              |
| internal      | test_table_properties_db | rangetable | _auto_bucket                                   | false                   |
| internal      | test_table_properties_db | rangetable | binlog.max_history_nums                        | 9223372036854775807     |
| internal      | test_table_properties_db | rangetable | time_series_compaction_file_count_threshold    | 2000                    |
| internal      | test_table_properties_db | rangetable | skip_write_index_on_load                       | false                   |
| internal      | test_table_properties_db | rangetable | disable_auto_compaction                        | false                   |
| internal      | test_table_properties_db | rangetable | row_store_page_size                            | 16384                   |
| internal      | test_table_properties_db | rangetable | time_series_compaction_goal_size_mbytes        | 1024                    |
| internal      | test_table_properties_db | rangetable | storage_medium                                 | HDD                     |
| internal      | test_table_properties_db | rangetable | enable_single_replica_compaction               | false                   |
| internal      | test_table_properties_db | rangetable | compression                                    | LZ4F                    |
| internal      | test_table_properties_db | rangetable | binlog.max_bytes                               | 9223372036854775807     |
+---------------+--------------------------+------------+------------------------------------------------+-------------------------+



### KeyWords

    table_options, information_schema
