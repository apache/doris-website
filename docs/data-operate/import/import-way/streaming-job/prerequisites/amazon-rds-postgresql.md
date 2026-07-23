---
{
    "title": "Amazon RDS PostgreSQL",
    "language": "en",
    "description": "Enable logical replication on Amazon RDS PostgreSQL and configure the sync user and Publication to prepare for Doris streaming ingestion.",
    "keywords": [
        "Amazon RDS PostgreSQL",
        "Doris streaming ingestion",
        "Logical Replication",
        "rds.logical_replication",
        "rds_replication",
        "Publication",
        "dbz_publication",
        "publication_name",
        "CDC sync"
    ]
}
---

<!-- Knowledge type: Procedure / Configuration parameters -->
<!-- Applicable scenario: Pre-deployment check / Environment preparation -->

Doris streaming ingestion supports synchronizing data from **Amazon RDS PostgreSQL 14 and above**. Before starting a sync task, you must enable **Logical Replication** on the RDS instance and complete the configuration of the sync user, permissions, and Publication.

This document is intended for RDS PostgreSQL instance administrators and describes the prerequisite steps required for Doris streaming ingestion.

### Pre-check Checklist

Before you start the configuration, confirm the following conditions:

| Check item | Requirement |
| --- | --- |
| RDS PostgreSQL version | 14 and above |
| Operation permissions | AWS permissions to modify parameter groups and restart the instance |
| Database permissions | Permissions to create users, grant privileges, and create Publications |
| Maintenance window | An off-peak window has been planned (modifying logical replication parameters requires restarting the instance) |

### Configuration Flow Overview

The overall configuration flow is as follows:

1. Check the current status of `rds.logical_replication`
2. Create and configure a custom parameter group (if not enabled)
3. Apply the parameter group to the instance and restart it
4. Create the Doris sync user and grant privileges
5. Configure the Publication based on the Doris version

---

## Step 1: Check the Current Configuration

<!-- Knowledge type: Procedure -->

**Purpose**: Confirm whether logical replication is currently enabled on the RDS instance, and decide whether the parameter group needs to be modified.

After connecting to the RDS instance, run the following SQL:

```sql
SHOW rds.logical_replication;
```

Choose the next path based on the result:

| Returned value | Meaning | Next step |
| --- | --- | --- |
| `on` | Logical replication is enabled | Skip to [Step 4: Create the Sync User](#step-4-create-the-sync-user) |
| `off` | Logical replication is not enabled | Continue with [Step 2](#step-2-configure-the-parameter-group) |

---

## Step 2: Configure the Parameter Group

<!-- Knowledge type: Procedure / Configuration parameters -->

**Purpose**: Create a custom parameter group and set `rds.logical_replication` to enabled.

Steps:

1. Log in to the [AWS RDS console](https://console.aws.amazon.com/rds/).
2. In the left navigation pane, choose **Parameter groups**, and click **Create parameter group**.
3. Select the PostgreSQL version family that matches the target instance, and create a new parameter group.
4. Edit the parameter group, search for `rds.logical_replication`, and set its value to `1`:

    ![PostgreSQL WAL Setting](/images/next/data-operate/streaming-job/pgwalsetting.png)

5. Click **Save Changes** to save.

Key parameter description:

| Parameter | Value | Description |
| --- | --- | --- |
| `rds.logical_replication` | `1` | Enables logical replication; equivalent to setting `wal_level` to `logical` |

---

## Step 3: Apply the Parameter Group and Restart

<!-- Knowledge type: Procedure -->

**Purpose**: Bind the new parameter group to the RDS instance and restart it to make the configuration take effect.

Steps:

1. In the RDS console, select the target instance and click **Modify**.
2. In **DB parameter group**, select the parameter group created in [Step 2](#step-2-configure-the-parameter-group).
3. Select **Apply immediately** to apply the change immediately.
4. Restart the RDS instance to make the configuration take effect.

:::caution
Modifying the `rds.logical_replication` parameter requires restarting the RDS instance to take effect. Perform this operation during off-peak hours.
:::

---

## Step 4: Create the Sync User

<!-- Knowledge type: Procedure / Configuration parameters -->

**Purpose**: Create a database account dedicated to Doris streaming ingestion, and grant the required read and replication privileges.

### 1. Create the User

```sql
CREATE USER doris_sync PASSWORD '<password>';
```

### 2. Grant Schema Access Privileges

The following uses the `public` schema as an example. Replace it with the target schema as needed:

```sql
GRANT USAGE ON SCHEMA "public" TO doris_sync;
GRANT SELECT ON ALL TABLES IN SCHEMA "public" TO doris_sync;
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" GRANT SELECT ON TABLES TO doris_sync;
```

### 3. Grant Replication Privileges

```sql
GRANT rds_replication TO doris_sync;
```

:::tip
Amazon RDS PostgreSQL uses the `rds_replication` role to grant replication privileges, instead of the standard PostgreSQL `REPLICATION` attribute.
:::

Privilege overview:

| Privilege | Purpose |
| --- | --- |
| `USAGE ON SCHEMA` | Allows access to the specified schema |
| `SELECT ON ALL TABLES` | Allows reading all existing tables in the schema |
| `ALTER DEFAULT PRIVILEGES ... SELECT` | Automatically grants `SELECT` privilege on tables added in the future |
| `rds_replication` | The role required to perform logical replication in RDS |

---

## Step 5: Configure the Publication

<!-- Knowledge type: Procedure / Configuration parameters -->

### Doris 4.0

A Publication named `dbz_publication` must be created in advance with `FOR ALL TABLES`:

```sql
CREATE PUBLICATION dbz_publication FOR ALL TABLES;
```

If the sync user has superuser privileges, such as the `rds_superuser` role, Doris can automatically create `dbz_publication` when the task starts, and you do not need to execute this statement manually. Doris 4.0 does not support custom Publication names or Publications that contain only a subset of tables.

### Doris 4.1.0 and later

By default, you do not need to create a Publication manually. When `publication_name` is not set, Doris uses the sync account to create a Publication named `doris_pub_<job_id>` and cleans it up when the job is deleted. The sync account therefore needs permission to create Publications.

If `publication_name` is explicitly set when creating the Streaming Job, create a Publication with the same name in advance. A custom Publication must include all source tables synchronized by the job and must be maintained and cleaned up by the user. For example:

```sql
CREATE PUBLICATION doris_pub_custom
FOR TABLE public.orders, public.customers;
```

Set `"publication_name" = "doris_pub_custom"` when creating the job. The name can contain only lowercase letters, digits, and underscores, cannot start with a digit, and is limited to 63 characters.

---

## FAQ

<!-- Knowledge type: FAQ -->

**Q1: If `SHOW rds.logical_replication;` returns `on`, do I still need to restart the instance?**

No. `on` means logical replication is already in effect, and you can skip directly to [Step 4: Create the Sync User](#step-4-create-the-sync-user).

**Q2: Can I use a Publication with a different name?**

Doris 4.0 does not support custom names and only supports `dbz_publication FOR ALL TABLES`. Since version 4.1.0, you can specify a custom name through `publication_name`, but you must create the Publication before creating the job and ensure that it includes all synchronized tables.

**Q3: Is it required to use the `rds_replication` role?**

Yes. For security reasons, RDS PostgreSQL does not allow using the standard PostgreSQL `REPLICATION` attribute. You must grant privileges through `GRANT rds_replication`.

**Q4: Is it mandatory to manually create the Publication?**

In Doris 4.0, a regular sync user must create `dbz_publication` manually, while Doris can create it automatically when the user has superuser privileges. Since version 4.1.0, when `publication_name` is omitted, Doris automatically creates and manages the default Publication. Only a custom Publication must be created in advance. For details, see [Step 5](#step-5-configure-the-publication).

---

## Troubleshooting

<!-- Knowledge type: Troubleshooting -->

| Symptom | Possible cause | Solution |
| --- | --- | --- |
| `SHOW rds.logical_replication;` still returns `off` | The parameter group is not bound to the instance, or the instance has not been restarted | Check whether the instance uses the new parameter group, and restart it |
| Permission error when creating the user | The current account does not have sufficient privileges | Use an administrator account with the privilege to create users |
| `GRANT rds_replication` returns an error | The current account does not have permission to grant this role | Use an `rds_superuser` account or another account with the grant privilege |
| Doris 4.0 reports that `dbz_publication` does not exist | `dbz_publication` has not been created, and the sync account lacks superuser privileges | Execute `CREATE PUBLICATION dbz_publication FOR ALL TABLES;`, or use an account with the required privileges |
| Doris 4.1.0 or later fails to create the default Publication | The sync account lacks permission to create Publications | Grant the required privileges to the sync account, or have an administrator create a custom Publication in advance and configure `publication_name` |
| Doris 4.1.0 or later reports that a custom Publication does not exist | `publication_name` is configured, but a Publication with the same name has not been created | Create the Publication as described in [Step 5](#step-5-configure-the-publication), or remove `publication_name` to use the default Publication managed by Doris |
| Parameter changes do not take effect | **Apply immediately** was not selected, or the instance was not restarted | Re-execute [Step 3](#step-3-apply-the-parameter-group-and-restart) |
