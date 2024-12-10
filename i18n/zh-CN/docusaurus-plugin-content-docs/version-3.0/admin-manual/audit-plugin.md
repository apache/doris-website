---
{
    "title": "审计日志插件",
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

该插件可以将 FE 的审计日志定期的导入到指定的系统表中，以方便用户通过 SQL 对审计日志进行查看和分析。

## 使用审计日志插件

从 Doris 2.1 版本开始，审计日志插件作为内置插件，直接集成到了 Doris 内核中。用户无需在额外安装插件。

集群启动后，会在 `__internal_schema` 库下创建名为 `audit_log` 的系统表，用于存储审计日志。

:::note
如果是 Doris 2.1 之前的版本，请 2.0 版本文档。
:::

:::warning
升级到 2.1 版本后，原有的审计日志插件将不可用。请参阅 **审计日志迁移** 章节查看如何迁移审计日志表数据。
:::

### 开启插件

通过全局变量 `enable_audit_plugin` 可以随时开启或关闭审计日志插件（默认为关闭状态），如：

`set global enable_audit_plugin = true;`

开启后，Doris 会将开启后的审计日志写入 `audit_log` 表。

可以随时关闭审计日志插件：

`set global enable_audit_plugin = false;`

关闭后，Doris 将会停止 `audit_log` 表的写入。已写入的审计日志不会变化。

### 审计日志表

随着 Doris 的版本升级，审计日志表的字段也会增加，具体请参阅 [audit_log](./system-tables/internal_schema/audit_log.md)

自 2.1.8 和 3.0.3 版本开始，`audit_log` 系统表会随着 Doris 版本升级，自动添加新增字段。

之前的版本，用户需手动通过 `ALTER TABLE` 命令为 `audit_log` 系统表增加字段。

### 相关配置

审计日志表是一张动态分区表，按天分区，默认保留最近 30 天的数据。

以下全局变量可以控制审计日志表的一些写入行为：

- `audit_plugin_max_batch_interval_sec`：审计日志表的最大写入间隔。默认 60 秒。
- `audit_plugin_max_batch_bytes`：审计日志表每批次最大写入数据量。默认 50MB。
- `audit_plugin_max_sql_length`：审计日志表里记录的语句的最大长度。默认 4096。
- `audit_plugin_load_timeout`: 审计日志导入作业的默认超时时间。默认 600 秒。

可以通过 `set global xxx=yyy` 进行设置。

FE 配置项：

- `skip_audit_user_list` (自 3.0.1 支持)

    如果不希望某些用户的操作被审计日志记录，可以通过这个配置修改。

    ```
    skip_audit_user_list=root
    -- or
    skip_audit_user_list=user1,user2
    ```

## 审计日志迁移

升级到 2.1 版本后，原有的审计日志插件将不可用。本小节介绍如何将原有审计日志表中的数据迁移到新的审计日志表中。

1. 确认新旧审计日志表的字段信息

    原有审计日志表默认情况下应为：`doris_audit_db__`.`doris_audit_log_tbl__`。

    新的审计日志表为：`__internal_schema`.`audit_log`

    可以通过 `DESC table_name` 命令查看两种表的字段信息是否匹配。通常情况下，旧表的字段应为新表的子集。

2. 迁移审计日志表数据。

    可以使用如下语句将原表中数据迁移到新表中：

    ```sql
    INSERT INTO __internal_schema.audit_log (
    query_id         ,
    time             ,
    client_ip        ,
    user             ,
    db               ,
    state            ,
    error_code       ,
    error_message    ,
    query_time       ,
    scan_bytes       ,
    scan_rows        ,
    return_rows      ,
    stmt_id          ,
    is_query         ,
    frontend_ip      ,
    cpu_time_ms      ,
    sql_hash         ,
    sql_digest       ,
    peak_memory_bytes,
    stmt
    )
    SELECT
    query_id         ,
    time             ,
    client_ip        ,
    user             ,
    db               ,
    state            ,
    error_code       ,
    error_message    ,
    query_time       ,
    scan_bytes       ,
    scan_rows        ,
    return_rows      ,
    stmt_id          ,
    is_query         ,
    frontend_ip      ,
    cpu_time_ms      ,
    sql_hash         ,
    sql_digest       ,
    peak_memory_bytes,
    stmt
    FROM doris_audit_db__.doris_audit_log_tbl__;
    ```

3. 删除原有插件

    迁移后，可以通过 `UNINSTALL PLUGIN AuditLoader;` 命令删除原有插件即可。

## FAQ

1. 审计日志表中没有数据，或运行一段时间后，不再进入新的数据

    可以通过以下步骤排查：

    - 检查分区是否被正常创建

        审计日志表是一张按天分区的动态分区表，默认会创建未来 3 天的分区，并保留历史 30 天的分区。只有分区被正确创建后，才能正常写入审计日志。

        可以通过 `show dynamic partition tables from __internal_schema` 查看动态分区的调度情况，并根据错误原因排查。可能得错误原因包括：

        - 节点数小于所需副本数：审计日志表默认 3 副本，所以至少需要 3 台 BE 节点。或者通过 `alter table` 语句修改副本数，如：

            `alter table __internal_schema.audit_log set ("dynamic_partition.replication_num" = "2")`

        - 没有合适的存储介质：可以通过 `show create table __internal_schema.audit_log` 查看 `storage_medium` 属性，如果 BE 没有对应的存储介质，则分区可能创建失败。

        - 没有合适的资源组：审计日志表默认在 default 资源组。可以通过 `show backends` 命令查看该资源自是否有足够的节点资源。

    - 在 Master FE 的 `fe.log` 中搜索 `AuditLoad` 字样，查看是否有相关错误日志

        审计日志是通过内部的 stream load 操作导入到表中的，有可能是导入流程出现了问题，这些问题会在 `fe.log` 中打印错误日志。

