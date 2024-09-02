---
{
    "title": "table_properties",
    "language": "zh-CN"
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

## 概述

用于查看表（包括内表和外表）的属性信息。

:::tip
该系统表自 2.1.6 和 3.0.2 版本支持。
:::

## 所属数据库

`information_schema`

## 表信息

| 列名 | 类型 | 说明 |
|---|---|---|
| TABLE_CATALOG | VARCHAR(64 )| 表所属 Catalog  | 
| TABLE_SCHEMA | VARCHAR(64)  | 表所属 Database  | 
| TABLE_NAME | VARCHAR(64)  | 表名  | 
| PROPERTY_NAME    | STRING   | 属性名称  | 
| PROPERTY_VALUE      | STRING   | 属性值  | 

:::tip
关于表属性的具体减少，请参阅**建表**相关文档。
:::
<!-- 
## 示例

1. 查询所有表属性

    ```
    mysql> select * from information_schema.table_properties;
    +---------------+---------------+----------------------+------------------------------------------------+-------------------------+
    | TABLE_CATALOG | TABLE_SCHEMA  | TABLE_NAME           | PROPERTY_NAME                                  | PROPERTY_VALUE          |
    +---------------+---------------+----------------------+------------------------------------------------+-------------------------+
    ...
    | internal      | test_database | test_table           | min_load_replica_num                           | -1                      |
    | internal      | test_database | test_table           | data_sort.col_num                              | 3                       |
    | internal      | test_database | test_table           | group_commit_interval_ms                       | 10000                   |
    | internal      | test_database | test_table           | data_sort.sort_type                            | LEXICAL                 |
    | internal      | test_database | test_table           | is_being_synced                                | false                   |
    | internal      | test_database | test_table           | binlog.enable                                  | false                   |
    | internal      | test_database | test_table           | enable_mow_light_delete                        | false                   |
    | internal      | test_database | test_table           | binlog.ttl_seconds                             | 86400                   |
    | internal      | test_database | test_table           | inverted_index_storage_format                  | V2                      |
    | internal      | test_database | test_table           | time_series_compaction_empty_rowsets_threshold | 5                       |
    | internal      | test_database | test_table           | default.replication_allocation                 | tag.location.default: 1 |
    | internal      | test_database | test_table           | time_series_compaction_level_threshold         | 1                       |
    | internal      | test_database | test_table           | time_series_compaction_time_threshold_seconds  | 3600                    |
    | internal      | test_database | test_table           | storage_format                                 | V2                      |
    | internal      | test_database | test_table           | store_row_column                               | false                   |
    | internal      | test_database | test_table           | light_schema_change                            | true                    |
    | internal      | test_database | test_table           | enable_unique_key_merge_on_write               | false                   |
    | internal      | test_database | test_table           | in_memory                                      | false                   |
    | internal      | test_database | test_table           | file_cache_ttl_seconds                         | 0                       |
    | internal      | test_database | test_table           | group_commit_data_bytes                        | 134217728               |
    | internal      | test_database | test_table           | compaction_policy                              | size_based              |
    | internal      | test_database | test_table           | _auto_bucket                                   | false                   |
    | internal      | test_database | test_table           | binlog.max_history_nums                        | 9223372036854775807     |
    | internal      | test_database | test_table           | time_series_compaction_file_count_threshold    | 2000                    |
    | internal      | test_database | test_table           | skip_write_index_on_load                       | false                   |
    | internal      | test_database | test_table           | disable_auto_compaction                        | false                   |
    | internal      | test_database | test_table           | row_store_page_size                            | 16384                   |
    | internal      | test_database | test_table           | time_series_compaction_goal_size_mbytes        | 1024                    |
    | internal      | test_database | test_table           | storage_medium                                 | HDD                     |
    | internal      | test_database | test_table           | enable_single_replica_compaction               | false                   |
    | internal      | test_database | test_table           | compression                                    | LZ4F                    |
    | internal      | test_database | test_table           | binlog.max_bytes                               | 9223372036854775807     |
    +---------------+---------------+----------------------+------------------------------------------------+-------------------------+
    ```

2. 查询默认副本数

    ```
    mysql> select * from information_schema.table_properties where PROPERTY_NAME="default.replication_allocation";
    +---------------+----------------------+----------------------+--------------------------------+-------------------------+
    | TABLE_CATALOG | TABLE_SCHEMA         | TABLE_NAME           | PROPERTY_NAME                  | PROPERTY_VALUE          |
    +---------------+----------------------+----------------------+--------------------------------+-------------------------+
    | internal      | __internal_schema    | column_statistics    | default.replication_allocation | tag.location.default: 1 |
    | internal      | __internal_schema    | partition_statistics | default.replication_allocation | tag.location.default: 1 |
    | internal      | __internal_schema    | audit_log            | default.replication_allocation | tag.location.default: 1 |
    | internal      | test_database        | test_table           | default.replication_allocation | tag.location.default: 1 |
    +---------------+----------------------+----------------------+--------------------------------+-------------------------+
    ``` -->

