---
{
    "title": "Using table_options",
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

## table_options

### Name

table_options

### description

`table_options` is a built-in system table of doris, which is stored under the information_schema database. You can view the current table options information of each table through the `table_options` system table.

The `table_options` table schema is:
```sql
MySQL [(none)]> desc information_schema.table_options;
+-----------------+-------------+------+-------+---------+-------+
| Field           | Type        | Null | Key   | Default | Extra |
+-----------------+-------------+------+-------+---------+-------+
| TABLE_NAME      | VARCHAR(64) | Yes  | false | NULL    |       |
| TABLE_CATALOG   | VARCHAR(64) | Yes  | false | NULL    |       |
| TABLE_SCHEMA    | VARCHAR(64) | Yes  | false | NULL    |       |
| TABLE_MODEL     | TEXT        | Yes  | false | NULL    |       |
| TABLE_MODEL_KEY | TEXT        | Yes  | false | NULL    |       |
| DISTRIBUTE_KEY  | TEXT        | Yes  | false | NULL    |       |
| DISTRIBUTE_TYPE | TEXT        | Yes  | false | NULL    |       |
| BUCKETS_NUM     | INT         | Yes  | false | NULL    |       |
| PARTITION_NUM   | INT         | Yes  | false | NULL    |       |
| PROPERTIES      | TEXT        | Yes  | false | NULL    |       |
+-----------------+-------------+------+-------+---------+-------+
```

### Example

```sql
mysql> select * from information_schema.table_options where table_schema="mydb";
+-----------------------+---------------+--------------+-------------+-------------------------------------+----------------+-----------------+-------------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| TABLE_NAME            | TABLE_CATALOG | TABLE_SCHEMA | TABLE_MODEL | TABLE_MODEL_KEY                     | DISTRIBUTE_KEY | DISTRIBUTE_TYPE | BUCKETS_NUM | PARTITION_NUM | PROPERTIES                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
+-----------------------+---------------+--------------+-------------+-------------------------------------+----------------+-----------------+-------------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| rangetable            | internal      | mydb         | AGG         | user_id,date,timestamp,city,age,sex | user_id        | HASH            |           8 |             3 | {"min_load_replica_num":"-1","data_sort.col_num":"6","group_commit_interval_ms":"10000","data_sort.sort_type":"LEXICAL","is_being_synced":"false","binlog.enable":"false","binlog.ttl_seconds":"86400","inverted_index_storage_format":"V1","time_series_compaction_empty_rowsets_threshold":"5","default.replication_allocation":"tag.location.default: 1","time_series_compaction_level_threshold":"1","time_series_compaction_time_threshold_seconds":"3600","storage_format":"V2","store_row_column":"false","light_schema_change":"true","enable_unique_key_merge_on_write":"false","in_memory":"false","file_cache_ttl_seconds":"0","group_commit_data_bytes":"134217728","compaction_policy":"size_based","_auto_bucket":"false","binlog.max_history_nums":"9223372036854775807","time_series_compaction_file_count_threshold":"2000","skip_write_index_on_load":"false","disable_auto_compaction":"false","time_series_compaction_goal_size_mbytes":"1024","storage_medium":"HDD","enable_single_replica_compaction":"false","compression":"LZ4F","binlog.max_bytes":"9223372036854775807"} |
| plsql_tbl             | internal      | mydb         | DUP         | id                                  | id             | HASH            |           4 |             1 | {"min_load_replica_num":"-1","data_sort.col_num":"1","group_commit_interval_ms":"10000","data_sort.sort_type":"LEXICAL","is_being_synced":"false","binlog.enable":"false","binlog.ttl_seconds":"86400","inverted_index_storage_format":"V1","time_series_compaction_empty_rowsets_threshold":"5","default.replication_allocation":"tag.location.default: 1","time_series_compaction_level_threshold":"1","time_series_compaction_time_threshold_seconds":"3600","storage_format":"V2","store_row_column":"false","light_schema_change":"true","enable_unique_key_merge_on_write":"false","in_memory":"false","file_cache_ttl_seconds":"0","group_commit_data_bytes":"134217728","compaction_policy":"size_based","_auto_bucket":"false","binlog.max_history_nums":"9223372036854775807","time_series_compaction_file_count_threshold":"2000","skip_write_index_on_load":"false","disable_auto_compaction":"false","time_series_compaction_goal_size_mbytes":"1024","storage_medium":"HDD","enable_single_replica_compaction":"false","compression":"LZ4F","binlog.max_bytes":"9223372036854775807"} |
| listtable1            | internal      | mydb         | DUP         | user_id,date,timestamp              | RANDOM         | RANDOM          |          16 |             1 | {"min_load_replica_num":"-1","data_sort.col_num":"3","group_commit_interval_ms":"10000","data_sort.sort_type":"LEXICAL","is_being_synced":"false","binlog.enable":"false","binlog.ttl_seconds":"86400","inverted_index_storage_format":"V1","time_series_compaction_empty_rowsets_threshold":"5","default.replication_allocation":"tag.location.default: 1","time_series_compaction_level_threshold":"1","time_series_compaction_time_threshold_seconds":"3600","storage_format":"V2","store_row_column":"false","light_schema_change":"true","enable_unique_key_merge_on_write":"false","in_memory":"false","file_cache_ttl_seconds":"0","group_commit_data_bytes":"134217728","compaction_policy":"size_based","_auto_bucket":"false","binlog.max_history_nums":"9223372036854775807","time_series_compaction_file_count_threshold":"2000","skip_write_index_on_load":"false","disable_auto_compaction":"false","time_series_compaction_goal_size_mbytes":"1024","storage_medium":"HDD","enable_single_replica_compaction":"false","compression":"LZ4F","binlog.max_bytes":"9223372036854775807"} |
| example_tbl_agg1      | internal      | mydb         | AGG         | user_id,date,city,age,sex           | user_id        | HASH            |           1 |             1 | {"min_load_replica_num":"-1","data_sort.col_num":"5","group_commit_interval_ms":"10000","data_sort.sort_type":"LEXICAL","is_being_synced":"false","binlog.enable":"false","binlog.ttl_seconds":"86400","inverted_index_storage_format":"V1","time_series_compaction_empty_rowsets_threshold":"5","default.replication_allocation":"tag.location.default: 1","time_series_compaction_level_threshold":"1","time_series_compaction_time_threshold_seconds":"3600","storage_format":"V2","store_row_column":"false","light_schema_change":"true","enable_unique_key_merge_on_write":"false","in_memory":"false","file_cache_ttl_seconds":"0","group_commit_data_bytes":"134217728","compaction_policy":"size_based","_auto_bucket":"false","binlog.max_history_nums":"9223372036854775807","time_series_compaction_file_count_threshold":"2000","skip_write_index_on_load":"false","disable_auto_compaction":"false","time_series_compaction_goal_size_mbytes":"1024","storage_medium":"HDD","enable_single_replica_compaction":"false","compression":"LZ4F","binlog.max_bytes":"9223372036854775807"} |
| example_tbl_duplicate | internal      | mydb         | DUP         | timestamp,type,error_code           | type           | HASH            |           1 |             1 | {"min_load_replica_num":"-1","data_sort.col_num":"3","group_commit_interval_ms":"10000","data_sort.sort_type":"LEXICAL","is_being_synced":"false","binlog.enable":"false","binlog.ttl_seconds":"86400","inverted_index_storage_format":"V1","time_series_compaction_empty_rowsets_threshold":"5","default.replication_allocation":"tag.location.default: 1","time_series_compaction_level_threshold":"1","time_series_compaction_time_threshold_seconds":"3600","storage_format":"V2","store_row_column":"false","light_schema_change":"true","enable_unique_key_merge_on_write":"false","in_memory":"false","file_cache_ttl_seconds":"0","group_commit_data_bytes":"134217728","compaction_policy":"size_based","_auto_bucket":"false","binlog.max_history_nums":"9223372036854775807","time_series_compaction_file_count_threshold":"2000","skip_write_index_on_load":"false","disable_auto_compaction":"false","time_series_compaction_goal_size_mbytes":"1024","storage_medium":"HDD","enable_single_replica_compaction":"false","compression":"LZ4F","binlog.max_bytes":"9223372036854775807"} |
+-----------------------+---------------+--------------+-------------+-------------------------------------+----------------+-----------------+-------------+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

### KeyWords

    table_options, information_schema

### Best Practice