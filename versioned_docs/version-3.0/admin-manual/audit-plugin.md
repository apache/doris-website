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

- `audit_plugin_max_batch_interval_sec`: The maximum write interval for the audit log table. Default is 60 seconds.
- `audit_plugin_max_batch_bytes`: The maximum amount of data written per batch to the audit log table. Default is 50MB.
- `audit_plugin_max_sql_length`: The maximum length of statements recorded in the audit log table. Default is 4096.
- `audit_plugin_load_timeout`: Default timeout for the audit log import job. Default is 600 seconds.

These can be set using `set global xxx=yyy`.

FE Configuration:

- `skip_audit_user_list` (supported since 3.0.1)

    If you do not want the operations of certain users to be recorded in the audit log, you can modify this configuration.

    ```
    skip_audit_user_list=root
    -- or
    skip_audit_user_list=user1,user2
    ```

## Compilation, Configuration and Deployment

### FE Configuration

The audit log plug-in framework is enabled by default in Doris and is controlled by the FE configuration `plugin_enable`

### AuditLoader Configuration

1. Download the Audit Loader plugin

   The Audit Loader plug-in is provided by default in the Doris distribution. After downloading the Doris installation package through [DOWNLOAD](https://doris.apache.org/download), decompress it and enter the directory, you can find the auditloader.zip file in the extensionsaudit_loader subdirectory.

2. Unzip the installation package

    ```shell
    unzip auditloader.zip
    ```

    Unzip and generate the following files:

    * auditloader.jar: plug-in code package.
    * plugin.properties: plugin properties file.
    * plugin.conf: plugin configuration file.

You can place this file on an http download server or copy(or unzip) it to the specified directory of all FEs. Here we use the latter.  
The installation of this plugin can be found in [INSTALL](../sql-manual/sql-statements/Database-Administration-Statements/INSTALL-PLUGIN.md)  
After executing install, the AuditLoader directory will be automatically generated.

3. Modify plugin.conf

   The following configurations are available for modification:

    * frontend_host_port: FE node IP address and HTTP port in the format <fe_ip>:<fe_http_port>. The default value is 127.0.0.1:8030.
    * database: Audit log database name.
    * audit_log_table: Audit log table name.
    * slow_log_table: Slow query log table name.
    * enable_slow_log: Whether to enable the slow query log import function. The default value is false. You can set the slow query threshold in the FE configuration item. The parameter is qe_slow_log_ms and the default value is 5s.
    * user: Cluster username. The user must have INSERT permission on the corresponding table.
    * password: Cluster user password.

4. Repackaging the Audit Loader plugin

    ```shell
    zip -r -q -m auditloader.zip auditloader.jar plugin.properties plugin.conf
    ```

### Create Audit Table

In Doris, you need to create the library and table of the audit log. The table structure is as follows:

If you need to enable the slow query log import function, you need to create an additional slow table `doris_slow_log_tbl__`, whose table structure is consistent with `doris_audit_log_tbl__`.

Among them, the `dynamic_partition` attribute selects the number of days for audit log retention according to your own needs.

```sql
create database doris_audit_db__;

create table doris_audit_db__.doris_audit_log_tbl__
(
    query_id varchar(48) comment "Unique query id",
    `time` datetime not null comment "Query start time",
    client_ip varchar(32) comment "Client IP",
    user varchar(64) comment "User name",
    db varchar(96) comment "Database of this query",
    state varchar(8) comment "Query result state. EOF, ERR, OK",
    error_code int comment "Error code of failing query.",
    error_message string comment "Error message of failing query.",
    query_time bigint comment "Query execution time in millisecond",
    scan_bytes bigint comment "Total scan bytes of this query",
    scan_rows bigint comment "Total scan rows of this query",
    return_rows bigint comment "Returned rows of this query",
    stmt_id int comment "An incremental id of statement",
    is_query tinyint comment "Is this statemt a query. 1 or 0",
    frontend_ip varchar(32) comment "Frontend ip of executing this statement",
    cpu_time_ms bigint comment "Total scan cpu time in millisecond of this query",
    sql_hash varchar(48) comment "Hash value for this query",
    sql_digest varchar(48) comment "Sql digest of this query, will be empty if not a slow query",
    peak_memory_bytes bigint comment "Peak memory bytes used on all backends of this query",
    stmt string comment "The original statement, trimed if longer than 2G"
) engine=OLAP
duplicate key(query_id, `time`, client_ip)
partition by range(`time`) ()
distributed by hash(query_id) buckets 1
properties(
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-30",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "1",
    "dynamic_partition.enable" = "true",
    "replication_num" = "3"
);

create table doris_audit_db__.doris_slow_log_tbl__
(
    query_id varchar(48) comment "Unique query id",
    `time` datetime not null comment "Query start time",
    client_ip varchar(32) comment "Client IP",
    user varchar(64) comment "User name",
    db varchar(96) comment "Database of this query",
    state varchar(8) comment "Query result state. EOF, ERR, OK",
    error_code int comment "Error code of failing query.",
    error_message string comment "Error message of failing query.",
    query_time bigint comment "Query execution time in millisecond",
    scan_bytes bigint comment "Total scan bytes of this query",
    scan_rows bigint comment "Total scan rows of this query",
    return_rows bigint comment "Returned rows of this query",
    stmt_id int comment "An incremental id of statement",
    is_query tinyint comment "Is this statemt a query. 1 or 0",
    frontend_ip varchar(32) comment "Frontend ip of executing this statement",
    cpu_time_ms bigint comment "Total scan cpu time in millisecond of this query",
    sql_hash varchar(48) comment "Hash value for this query",
    sql_digest varchar(48) comment "Sql digest of a slow query",
    peak_memory_bytes bigint comment "Peak memory bytes used on all backends of this query",
    stmt string comment "The original statement, trimed if longer than 2G "
) engine=OLAP
duplicate key(query_id, `time`, client_ip)
partition by range(`time`) ()
distributed by hash(query_id) buckets 1
properties(
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-30",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "1",
    "dynamic_partition.enable" = "true",
    "replication_num" = "3"
);
```

>**Notice**
>
> In the above table structure: stmt string, this can only be used in 0.15 and later versions, in previous versions, the field type used varchar

### Deployment

You can place the packaged auditloader.zip on an http server, or copy `auditloader.zip` to the same specified directory in all FEs.

### Installation

Install the audit loader plugin:

```sql
INSTALL PLUGIN FROM [source] [PROPERTIES ("key"="value", ...)]
```

Detailed command reference: [INSTALL-PLUGIN.md](../sql-manual/sql-statements/Database-Administration-Statements/INSTALL-PLUGIN)

After successful installation, you can see the installed plug-ins through `SHOW PLUGINS`, and the status is `INSTALLED`.

After completion, the plugin will continuously insert audit logs into this table at specified intervals.

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
