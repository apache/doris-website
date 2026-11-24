---
{
    "title": "Generic MySQL",
    "language": "en",
    "description": "Prepare a self-managed MySQL source for Doris continuous load.",
    "keywords": [
        "MySQL",
        "Doris continuous load",
        "binlog",
        "binlog_row_image",
        "CDC"
    ]
}
---

:::caution Experimental feature

Doris continuous load is experimental and supported starting with Doris 4.1.5.

:::

Use this guide to prepare a self-managed MySQL source for Doris continuous load. For a managed MySQL service, see its setup guide in the [supported data sources](../continuous-load-overview.md#supported-data-sources-and-sync-modes).

## Prerequisite Checklist

| Check | Requirement |
| --- | --- |
| Binary logging | `log_bin = ON`, `binlog_format = ROW`, and `binlog_row_image = FULL` |
| Binlog retention | Covers the longest expected interruption and replication lag |
| Sync user | `SELECT` on the source database and global `REPLICATION SLAVE` and `REPLICATION CLIENT` privileges |
| Source tables | Each table to sync has a primary key |
| Network | The Doris FE and the CDC Client on the BE can reach the source on its configured port, usually `3306` |

## Step 1: Check the Current Binlog Configuration

Open a new MySQL connection and run the following query.

```sql
SHOW GLOBAL VARIABLES
WHERE Variable_name IN (
    'server_id', 'log_bin', 'binlog_format', 'binlog_row_image',
    'binlog_expire_logs_seconds', 'expire_logs_days'
);
SHOW SESSION VARIABLES WHERE Variable_name IN ('binlog_format', 'binlog_row_image');
```

Check that `server_id` is nonzero and unique in the replication topology. Both the global and session values should show `ROW` for `binlog_format` and `FULL` for `binlog_row_image`.

## Step 2: Configure and Verify Binlog

If any setting needs to change, edit the `[mysqld]` section of the server option file, commonly `my.cnf`. The following example uses a server ID of `101`. Choose an unused ID for your topology. If binary logging is already enabled, keep its existing file path and prefix.

```ini
[mysqld]
server-id = 101
log-bin = mysql-bin
binlog_format = ROW
binlog_row_image = FULL
```

Set the retention period in the same section. For example, to retain logs for three days, use `binlog_expire_logs_seconds = 259200` on MySQL 8.0 and later or `expire_logs_days = 3` on MySQL 5.6 and 5.7. Choose a period that covers the longest expected interruption and replication lag. If MySQL purges a file that contains the saved offset, Doris cannot resume from that offset. See the [MySQL binary log options](https://dev.mysql.com/doc/refman/8.4/en/replication-options-binary-log.html).

Restart MySQL during a maintenance window to apply the option file, then rerun the checks from Step 1. Changes to global `binlog_format` or `binlog_row_image` made at runtime apply to new sessions. Reconnect existing writer sessions when applying those changes without a restart.

## Step 3: Create a Sync User

Run the following statements as a MySQL administrator. Replace `source_db` with the database to sync, `192.0.2.10` with the client IP that MySQL sees, and `<password>` with the account password. If Doris connects from multiple client IPs, allow each required client address.

```sql
CREATE USER 'doris_sync'@'192.0.2.10' IDENTIFIED BY '<password>';
GRANT SELECT ON source_db.* TO 'doris_sync'@'192.0.2.10';
GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'doris_sync'@'192.0.2.10';
```

Connect as the sync user and run `SHOW BINARY LOG STATUS;` on MySQL 8.4 or later, or `SHOW MASTER STATUS;` on earlier versions. The result should contain a binary log file and position. To verify snapshot access, run a `SELECT` against a source table as the same user.

After preparing the source, follow [MySQL CDC with Auto Table Creation](../continuous-load-mysql-database.md) or [MySQL CDC with SQL Mapping](../continuous-load-mysql-table.md) to create the job.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| The connector reports an invalid binlog format or row image | Check the global settings and the effective settings in writer sessions. |
| The sync user cannot read the binlog | Check the account's host restriction and global replication privileges. |
| The job cannot resume from its saved offset | Check whether the required binary log file is still listed by `SHOW BINARY LOGS;` and review retention. |
