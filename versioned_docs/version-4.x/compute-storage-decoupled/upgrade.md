---
{
    "title": "Compute-Storage Decoupled Cluster Upgrade Guide (Rolling Upgrade)",
    "sidebar_label": "Rolling Upgrade Guide",
    "language": "en",
    "description": "How to perform a rolling upgrade on a Doris compute-storage decoupled cluster, covering the upgrade order and steps for MetaService, Recycler, BE, and FE.",
    "keywords": ["Doris upgrade", "compute-storage decoupled upgrade", "rolling upgrade", "MetaService upgrade", "BE upgrade", "FE upgrade"]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Cluster upgrade / Version migration -->

Doris compute-storage decoupled clusters support **rolling upgrades**, which require no full downtime and minimize impact on upstream applications. This document describes the complete upgrade procedure for compute-storage decoupled mode, including pre-upgrade checks, per-component upgrade steps, and answers to frequently asked questions.

To upgrade a compute-storage integrated cluster, refer to [Cluster Upgrade](../admin-manual/cluster-management/upgrade).

## Version Numbering

<!-- Knowledge type: Configuration parameters -->

Doris uses a three-part version number (for example, `3.0.3`). Run the following SQL to check the current version:

```sql
MySQL [(none)]> select @@version_comment;
+----------------------------------------------------------+
| @@version_comment                                        |
+----------------------------------------------------------+
| Doris version doris-3.0.3-rc03-43f06a5e26 (Cloud Mode)  |
+----------------------------------------------------------+
```

The version number fields are as follows:

| Position | Meaning | Example |
|------|------|------|
| First | Major version | `3` |
| Second | Minor version | `0` |
| Third | Patch version | `3` |
| Fourth (optional) | Emergency bug-fix release, indicating a critical defect in the patch version | `2.0.2.1` |

The `Cloud Mode` suffix in the version string indicates that the cluster is running in compute-storage decoupled mode. Clusters running in compute-storage integrated mode do not have this suffix.

**Mode switching restriction:** Switching between compute-storage decoupled mode and compute-storage integrated mode is **not supported**.

**Downgrade restriction:** Upgrading from a lower version to a higher version is supported, and patch-version downgrades are supported. **Minor-version and major-version downgrades are not supported.**

## Prerequisites

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Pre-deployment check / Environment validation -->

Before upgrading, confirm that all of the following conditions are met:

1. **Confirm the deployment mode:** Verify that the cluster is running in compute-storage decoupled mode (the version string contains the `Cloud Mode` suffix).
2. **Configure import retry:** Ensure that import jobs have a retry mechanism to prevent job failures caused by node restarts during the upgrade.
3. **Check component status:** Verify that MetaService, Recycler, FE, and BE are all running normally with no error logs.
4. **Back up FE metadata:** Back up the metadata directory of the Master FE (default: the `doris-meta` directory under the FE directory). If that directory is empty, check the `meta_dir` configuration item in `conf/fe.conf` for the actual path.
5. **Download the installation package:** Download the target-version installation package from the [Doris official website](https://doris.apache.org/download) and verify the SHA-512 checksum to ensure package integrity.

## Upgrade Process Overview

<!-- Knowledge type: Operational steps -->

Upgrade each component in the following order:

1. Upgrade MetaService
2. Upgrade Recycler (only if deployed separately)
3. Upgrade BE
4. Upgrade FE
    1. Upgrade Observer FE nodes first
    2. Then upgrade other non-Master FE nodes
    3. Finally upgrade the Master FE node

## Upgrade Steps

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Cluster upgrade / Version migration -->

### Step 1: Upgrade MetaService

Perform the following operations on each MetaService instance. Environment variables used in this step:

| Variable | Meaning |
|------|------|
| `${MS_HOME}` | Working directory of MetaService |
| `${MS_PACKAGE_DIR}` | Directory containing the new MetaService installation package |

**1. Stop the current MetaService**

```shell
cd ${MS_HOME}
sh bin/stop.sh
```

**2. Back up the existing binaries**

```shell
mv ${MS_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${MS_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

**3. Deploy the new installation package**

```shell
cp ${MS_PACKAGE_DIR}/bin ${MS_HOME}/bin
cp ${MS_PACKAGE_DIR}/lib ${MS_HOME}/lib
```

**4. Start the new MetaService**

```shell
sh ${MS_HOME}/bin/start.sh --daemon
```

**5. Verify the upgrade**

Confirm that the MetaService process is running normally and that the new version number appears in `${MS_HOME}/log/doris_cloud.out`.

---

### Step 2: Upgrade Recycler (If Applicable)

:::caution
If the Recycler component is not deployed separately, skip this step.
:::

Perform the following operations on each Recycler instance. MetaService and Recycler share the same installation package. Environment variables used in this step:

| Variable | Meaning |
|------|------|
| `${RECYCLER_HOME}` | Working directory of Recycler |
| `${MS_PACKAGE_DIR}` | Directory containing the new installation package (shared with MetaService) |

**1. Stop the current Recycler**

```shell
cd ${RECYCLER_HOME}
sh bin/stop.sh
```

**2. Back up the existing binaries**

```shell
mv ${RECYCLER_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${RECYCLER_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

**3. Deploy the new installation package**

```shell
cp ${MS_PACKAGE_DIR}/bin ${RECYCLER_HOME}/bin
cp ${MS_PACKAGE_DIR}/lib ${RECYCLER_HOME}/lib
```

**4. Start the new Recycler**

```shell
sh ${RECYCLER_HOME}/bin/start.sh --recycler --daemon
```

**5. Verify the upgrade**

Confirm that the Recycler process is running normally and that the new version number appears in `${RECYCLER_HOME}/log/doris_cloud.out`.

---

### Step 3: Upgrade BE

:::tip
Before upgrading BE, confirm that all MetaService and Recycler (if applicable) instances have been upgraded.
:::

Perform the following operations on each BE instance. Environment variables used in this step:

| Variable | Meaning |
|------|------|
| `${BE_HOME}` | Working directory of BE |
| `${BE_PACKAGE_DIR}` | Directory containing the new BE installation package |

**1. Stop the current BE**

```shell
cd ${BE_HOME}
sh bin/stop_be.sh
```

**2. Back up the existing binaries**

```shell
mv ${BE_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${BE_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

**3. Deploy the new installation package**

```shell
cp ${BE_PACKAGE_DIR}/bin ${BE_HOME}/bin
cp ${BE_PACKAGE_DIR}/lib ${BE_HOME}/lib
```

**4. Start the new BE**

```shell
sh ${BE_HOME}/bin/start_be.sh --daemon
```

**5. Verify the upgrade**

Run the following SQL to confirm the BE version and status:

```sql
show backends;
```

---

### Step 4: Upgrade FE

:::tip
Before upgrading FE, confirm that all BE instances have been upgraded.
:::

FE nodes must be upgraded one at a time in the following order: **Observer -> non-Master -> Master**.

Perform the following operations on each FE instance. Environment variables used in this step:

| Variable | Meaning |
|------|------|
| `${FE_HOME}` | Working directory of FE |
| `${FE_PACKAGE_DIR}` | Directory containing the new FE installation package |

**1. Stop the current FE**

```shell
cd ${FE_HOME}
sh bin/stop_fe.sh
```

**2. Back up the existing binaries**

```shell
mv ${FE_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${FE_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

**3. Deploy the new installation package**

```shell
cp ${FE_PACKAGE_DIR}/bin ${FE_HOME}/bin
cp ${FE_PACKAGE_DIR}/lib ${FE_HOME}/lib
```

**4. Start the new FE**

```shell
sh ${FE_HOME}/bin/start_fe.sh --daemon
```

**5. Verify the upgrade**

Run the following SQL to confirm the FE version and status:

```sql
show frontends;
```

## FAQ

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Troubleshooting -->

**Q1: When upgrading a compute-storage integrated cluster, replica rebalancing must be disabled before the upgrade. Is this also required for compute-storage decoupled mode?**

No. In compute-storage decoupled mode, Doris stores data on HDFS or object storage (S3), so there is no replica rebalancing requirement. This operation is not needed.

**Q2: Given that MetaService provides a dedicated metadata service, why does FE metadata still need to be backed up?**

Currently, metadata is maintained jointly by MetaService and FE, with each responsible for different parts. To ensure upgrade safety, back up the FE metadata directory before upgrading.
