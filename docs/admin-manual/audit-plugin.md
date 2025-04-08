---
{
    "title": "Audit Log",
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

Doris provides auditing capabilities for database operations, allowing the recording of user logins, queries, and modification operations on the database. In Doris, audit logs can be queried directly through built-in system tables or by viewing Doris's audit log files.

## Enabling Audit Logs

The audit log plugin can be enabled or disabled at any time using the global variable `enable_audit_plugin` (disabled by default), for example:

`set global enable_audit_plugin = true;`

Once enabled, Doris will write the audit logs to the `audit_log` table.

You can disable the audit log plugin at any time:

`set global enable_audit_plugin = false;`

After disabling, Doris will stop writing to the `audit_log` table. The already written audit logs will remain unchanged.

## Viewing the Audit Log Table

:::caution Note

Before version 2.1.8, as the system version was upgraded, the audit log table fields may have increased. After upgrading, you need to add fields to the `audit_log` table using the `ALTER TABLE` command based on the fields in the audit log table.

:::

Starting from Doris version 2.1, Doris can write user behavior operations to the [`audit_log`](../admin-manual/system-tables/internal_schema/audit_log) table in the `__internal_schema` database by enabling the audit log feature.

The audit log table is a dynamically partitioned table, partitioned daily by default, retaining the most recent 30 days of data. You can adjust the retention period of dynamic partitions by modifying the `dynamic_partition.start` property using the `ALTER TABLE` statement.

## Audit Log Files

In `fe.conf`, `LOG_DIR` defines the storage path for FE logs. All database operations executed by this FE node are recorded in `${LOG_DIR}/fe.audit.log`. To view all operations in the cluster, you need to traverse the audit logs of each FE node.

## Audit Log Configuration

**Global Variables:**

Audit log variables can be modified using `set [global] <var_name> = <var_value>`.

| Variable                               | Default Value | Description                                     |
| -------------------------------------- | ------------- | ----------------------------------------------- |
| `audit_plugin_max_batch_interval_sec`  | 60 seconds    | Maximum write interval for the audit log table. |
| `audit_plugin_max_batch_bytes`         | 50MB          | Maximum data volume per batch for the audit log table. |
| `audit_plugin_max_sql_length`          | 4096          | Maximum length of SQL statements recorded in the audit log table. |
| `audit_plugin_load_timeout`            | 600 seconds   | Default timeout for audit log import jobs.      |

**FE Configuration Items:**

FE configuration items can be modified by editing the `fe.conf` directory.

| Configuration Item         | Description                                                                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skip_audit_user_list`     | If you do not want operations of certain users to be recorded in the audit logs, you can modify this configuration (supported since version 3.0.01). For example, use the config to exclude `user1` and `user2` from audit log recording: `skip_audit_user_list=user1,user2`|

