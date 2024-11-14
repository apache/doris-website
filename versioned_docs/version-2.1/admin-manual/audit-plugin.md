---
{
    "title": "Audit Log Plugin",
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

This plugin can regularly import the audit logs of FE into a specified system table, making it convenient for users to view and analyze audit logs through SQL.

## Using the Audit Log Plugin

Starting from Doris 2.1, the audit log plugin is integrated directly into the Doris kernel as a built-in plugin. Users do not need to install the plugin separately.

After the cluster starts, a system table named `audit_log` will be created under the `__internal_schema` database to store audit logs.

:::note
For versions prior to Doris 2.1, please refer to the 2.0 version documentation.
:::

:::warning
After upgrading to version 2.1, the original audit log plugin will be unavailable. Refer to the **Audit Log Migration** section to see how to migrate audit log table data.
:::

### Enabling the Plugin

The audit log plugin can be enabled or disabled at any time using the global variable `enable_audit_plugin` (default is disabled), for example:

`set global enable_audit_plugin = true;`

Once enabled, Doris will write the enabled audit logs to the `audit_log` table.

The audit log plugin can be disabled at any time:

`set global enable_audit_plugin = false;`

After disabling, Doris will stop writing to the `audit_log` table. The existing audit logs will not be affected.

### Audit log table

With the upgrade of Doris version, the fields of the audit log table will also increase. For details, please refer to [audit_log](./system-tables/internal_schema/audit_log.md)

Starting from version 2.1.8 and 3.0.3, the `audit_log` system table will automatically add new fields of `audit_log` table as the Doris version is upgraded.

In previous versions, users need to manually add fields to the `audit_log` system table through the `ALTER TABLE` command.

### Related configurations

The audit log table is a dynamic partitioned table, partitioned by day, and retains data for the last 30 days by default.

The following global variables can control some writing behaviors of the audit log table:

- `audit_plugin_max_batch_interval_sec`: The maximum write interval for the audit log table. Default 60 seconds.
- `audit_plugin_max_batch_bytes`: The maximum amount of data written in each batch of the audit log table. Default 50MB.
- `audit_plugin_max_sql_length`: The maximum length of statements recorded in the audit log table. Default 4096.
- `audit_plugin_load_timeout`: The default timeout of audit log load job. Default 600 seconds.

Can be set via `set global xxx=yyy`.

FE configurations:

- `skip_audit_user_list` (Since 3.0.1)

    If you do not want certain users' operations to be recorded in the audit log, you can modify this configuration.

    ```
    skip_audit_user_list=root
    -- or
    skip_audit_user_list=user1,user2
    ```

## Compilation, Configuration and Deployment

### FE Configuration

The audit log plug-in framework is enabled by default in Doris and is controlled by the FE configuration `plugin_enable`

These can be set using `set global xxx=yyy`.

FE Configuration:

- `skip_audit_user_list` (supported since 3.0.1)

    If you do not want the operations of certain users to be recorded in the audit log, you can modify this configuration.

    ```
    skip_audit_user_list=root
    -- or
    skip_audit_user_list=user1,user2
    ```

## Audit Log Migration

After upgrading to version 2.1, the original audit log plugin will be unavailable. This section explains how to migrate data from the original audit log table to the new audit log table.

1. Confirm the field information of the old and new audit log tables.

    The default audit log table should be `doris_audit_db__`.`doris_audit_log_tbl__`.
    
    The new audit log table is `__internal_schema`.`audit_log`.
    
    You can check if the field information of the two tables matches by using the `DESC table_name` command. Typically, the fields of the old table should be a subset of the new table.

2. Migrate Audit Log Table Data

    You can use the following statement to migrate data from the original table to the new table:
    
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

3. Remove Original Plugin

    After migration, you can remove the original plugin by using the `UNINSTALL PLUGIN AuditLoader;` command.

## FAQ

1. No data in the audit log table, or no new data is being ingested after running for a period of time

    You can troubleshoot by following these steps:
    
    - Check if partitions are created correctly

        The audit log table is a dynamic partition table partitioned by day. By default, it creates partitions for the next 3 days and retains historical partitions for 30 days. Data can only be written to the audit log if partitions are created correctly.

        You can check the scheduling status of dynamic partitions by using `show dynamic partition tables from __internal_schema` and troubleshoot based on error reasons. Possible error reasons may include:

        - Number of nodes is less than the required replication number: The audit log table defaults to 3 replicas, so at least 3 BE nodes are required. You can modify the replication number using the `alter table` statement, for example:
        
            `alter table __internal_schema.audit_log set ("dynamic_partition.replication_num" = "2")`
        
        - No suitable storage medium: You can check the `storage_medium` property by using `show create table __internal_schema.audit_log`. If there is no corresponding storage medium on the BE, partition creation may fail.
        
        - No suitable resource group: The audit log table defaults to the default resource group. You can check if the resource group has enough node resources by using the `show backends` command.

    - Search for `AuditLoad` in the `fe.log` on the Master FE to see if there are any related error logs

        The audit log is imported into the table through internal stream load operations. If there are issues with the import process, error logs will be printed in the `fe.log`.
