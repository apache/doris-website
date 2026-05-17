---
{
    "title": "Amazon Aurora MySQL",
    "language": "en",
    "description": "Prerequisite steps for enabling Binlog and configuring a sync user on Amazon Aurora MySQL to support Doris streaming ingestion.",
    "keywords": [
        "Amazon Aurora MySQL",
        "Aurora Binlog configuration",
        "Doris streaming ingestion",
        "binlog_format ROW",
        "binlog_row_image FULL",
        "binlog retention hours",
        "RDS Parameter Group",
        "MySQL CDC prerequisites"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Pre-deployment check / Data source onboarding prerequisite configuration -->

Doris streaming ingestion supports Amazon Aurora MySQL-Compatible Edition versions **5.6, 5.7, and 8.0.x**. Because Aurora MySQL does not enable Binlog by default, you must first complete prerequisite work on the Aurora cluster before syncing data: enable and configure Binlog, create a sync user, and set the Binlog retention period.

This document is intended for users who plan to onboard Aurora MySQL data into Doris streaming ingestion. It provides an end-to-end configuration workflow.

### Prerequisite Checklist

Before onboarding to Doris, confirm that the Aurora cluster meets the following conditions:

| Check item | Expected value | Verification method |
| :--- | :--- | :--- |
| Whether Binlog is enabled | `log_bin = ON` | `SHOW VARIABLES LIKE 'log_bin';` |
| Binlog format | `binlog_format = ROW` | `SHOW VARIABLES LIKE 'binlog_format';` |
| Binlog row image | `binlog_row_image = FULL` | `SHOW VARIABLES LIKE 'binlog_row_image';` |
| Sync user | A dedicated account exists with replication privileges | Run `SHOW GRANTS FOR ...;` |
| Binlog retention period | At least 72 hours | `CALL mysql.rds_show_configuration;` |

If all conditions are met, you can proceed directly to the Doris streaming ingestion configuration. If any item is not satisfied, complete the configuration following the steps below.

## Step 1: Check the Current Binlog Configuration

Connect to the **Aurora writer instance** and run the following SQL to check the Binlog status:

```sql
-- Check if binlog is enabled
SHOW VARIABLES LIKE 'log_bin';

-- Check binlog format
SHOW VARIABLES LIKE 'binlog_format';

-- Check binlog row image
SHOW VARIABLES LIKE 'binlog_row_image';
```

Choose your next path based on the results:

- If all three conditions are met (`log_bin = ON`, `binlog_format = ROW`, and `binlog_row_image = FULL`), you can **skip directly to** [Step 4: Create a Sync User](#step-4-create-a-sync-user).
- Otherwise, continue with [Step 2](#step-2-configure-the-cluster-parameter-group) to enable Binlog through the cluster parameter group.

## Step 2: Configure the Cluster Parameter Group

Aurora MySQL does not allow direct modification of runtime parameters; you must modify them through a **DB Cluster Parameter Group**.

Steps:

1. Log in to the [AWS RDS Console](https://console.aws.amazon.com/rds/).
2. In the left navigation pane, select **Parameter groups**, and click **Create parameter group**.
3. For the type, choose **DB Cluster Parameter Group**, and select the Aurora MySQL version family that matches your target cluster.
4. Edit the newly created cluster parameter group, search for `binlog_format`, and set the value to `ROW`:

    ![MySQL Binlog Format Setting](/images/next/data-operate/streaming-job/mysql-binlog-setting.png)

5. Search for `binlog_row_image` and set the value to `FULL`.
6. Click **Save Changes** to save.

A summary of the key parameters that need to be modified:

| Parameter | Recommended value | Description |
| :--- | :--- | :--- |
| `binlog_format` | `ROW` | Row-level logging is required for CDC sync |
| `binlog_row_image` | `FULL` | Ensures Binlog contains the complete image of all columns |

## Step 3: Apply the Cluster Parameter Group and Restart

The newly created parameter group must be bound to the target cluster, and the writer instance must be restarted before the changes take effect.

1. In the RDS console, select the target Aurora cluster and click **Modify**.
2. Under **DB cluster parameter group**, select the cluster parameter group created in [Step 2](#step-2-configure-the-cluster-parameter-group).
3. Check **Apply immediately** to apply the changes immediately.
4. Restart the Aurora **writer instance** so that the configuration takes effect.

:::caution
Modifying the `binlog_format` parameter requires restarting the Aurora writer instance to take effect. Perform this operation during off-peak hours.
:::

After the restart, run the SQL from [Step 1](#step-1-check-the-current-binlog-configuration) again to confirm. All three parameters should match the expected values.

## Step 4: Create a Sync User

Create a dedicated account for Doris streaming ingestion to facilitate privilege management and auditing.

1. Create the user:

    ```sql
    CREATE USER 'doris_sync'@'%' IDENTIFIED BY '<password>';
    ```

2. Grant the privileges required for sync:

    ```sql
    GRANT SELECT, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'doris_sync'@'%';
    ```

Description of the required privileges:

| Privilege | Purpose |
| :--- | :--- |
| `SELECT` | Read business table data during the full-load phase |
| `REPLICATION SLAVE` | Read the Binlog stream as a replication client |
| `REPLICATION CLIENT` | Query metadata such as Binlog file positions |

## Step 5: Configure the Binlog Retention Period

Aurora reclaims Binlog relatively quickly by default, which may make it impossible to resume replication after an interruption. It is recommended to set the Binlog retention period to **at least 72 hours** to ensure that binary logs remain available in failure scenarios.

Use the `mysql.rds_set_configuration` stored procedure to set it:

```sql
CALL mysql.rds_set_configuration('binlog retention hours', 72);
```

You can use the following SQL to verify the current configuration:

```sql
CALL mysql.rds_show_configuration;
```

:::caution
If this configuration item is not set, or is set to too short an interval, gaps may appear in the binary logs, which can affect Doris's ability to resume replication.
:::

## FAQ

**Q1: Why is the value still not `ROW` after I changed `binlog_format`?**

A: Aurora MySQL does not allow direct modification of runtime parameters. You must create and bind a **DB Cluster Parameter Group** as described in [Step 2](#step-2-configure-the-cluster-parameter-group), and then restart the **writer instance** for the change to take effect. Modifying the default parameter group will not work.

**Q2: Do checks and configuration have to be performed on the writer instance?**

A: Yes. Binlog is generated only on the Aurora writer instance, so all SQL checks and sync user creation should be performed on the writer instance.

**Q3: What is the impact of setting `binlog retention hours` too high?**

A: It consumes more storage space. It is recommended to set this value based on your actual failure recovery time window, with a minimum of 72 hours.

## Troubleshooting

| Symptom | Possible cause | Solution |
| :--- | :--- | :--- |
| `log_bin` is still `OFF` | The custom cluster parameter group is not bound, or the writer instance has not been restarted | Follow [Step 3](#step-3-apply-the-cluster-parameter-group-and-restart) to bind the parameter group and restart the writer instance |
| `binlog_format` is not `ROW` | The instance parameter group was modified instead of the cluster parameter group | Set `binlog_format = ROW` in the **DB Cluster Parameter Group** |
| Doris sync reports that the Binlog file cannot be found | `binlog retention hours` is too small, and the Binlog has been reclaimed | Use `mysql.rds_set_configuration` to increase the retention period to at least 72 hours |
| Sync user authentication fails | Host restriction on the user or insufficient privileges | Confirm that the user host is `'%'` or the Doris BE egress IP, and that `REPLICATION SLAVE, REPLICATION CLIENT` have been granted |
