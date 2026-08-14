---
{
    "title": "Cluster Upgrade",
    "language": "en",
    "description": "Apache Doris cluster rolling upgrade guide: version compatibility rules, metadata compatibility testing, BE/FE node upgrade steps, and common troubleshooting.",
    "keywords": [
        "Doris upgrade",
        "Doris rolling upgrade",
        "Doris cluster upgrade",
        "FE upgrade",
        "BE upgrade",
        "metadata compatibility testing",
        "metadata_failure_recovery",
        "disable_balance",
        "replica repair and balance",
        "Doris version numbering",
        "cross-version upgrade",
        "canary upgrade"
    ]
}
---

Apache Doris supports rolling upgrades by progressively replacing the binaries on FE and BE nodes, which minimizes downtime and keeps the cluster available during the upgrade. This document is for cluster administrators and covers version compatibility rules, the metadata compatibility test procedure, and the detailed upgrade steps.

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Cluster upgrade / Version iteration / Rolling upgrade -->

## Applicable Scenarios

| Scenario | Applicable | Notes |
| --- | --- | --- |
| Patch-version upgrade within the same minor version (for example, 2.1.3 to 2.1.7) | Yes | Rolling upgrade can be applied directly |
| Minor-version upgrade across minor versions (for example, 3.0 to 3.3) | Yes, step by step | Upgrade in sequence: 3.0 to 3.1, 3.1 to 3.2, 3.2 to 3.3 |
| Major-version upgrade (for example, 2.x to 3.x) | Yes, step by step | Directly upgrading across major versions is not recommended; upgrade minor version by minor version |
| Upgrade of a single-FE cluster | Yes, after compatibility testing | Scale out to a 3-FE high-availability deployment first, or run a metadata compatibility test before upgrading |
| Upgrade across versions where metadata may be incompatible | Yes, after compatibility testing | Metadata compatibility must be verified before the upgrade |

## Prerequisites

Before performing the upgrade, confirm the following:

- You have read the Release Notes of the target version and understand the behavioral changes and compatibility between versions.
- Data is stored with 3 replicas, so that an upgrade failure does not cause data loss.
- Client tasks have retry logic in place (see "Upgrade Considerations" below).
- A development machine or BE node is available for the metadata compatibility test.
- The installation package of the target version has been downloaded and extracted (in the steps below, `${DORIS_NEW_HOME}` refers to the new version's root directory, and `${DORIS_OLD_HOME}` refers to the root directory of the old version running in production).

## Version Compatibility

A Doris version number has three digits. The first digit is the major milestone version, the second digit is the feature version, and the third digit is the bug-fix version. No new features are released in third-digit versions. Take Doris 2.1.3 as an example:

| Position | Example value | Meaning |
| --- | --- | --- |
| First digit | 2 | The 2nd milestone version |
| Second digit | 1 | The feature version under that milestone |
| Third digit | 3 | The 3rd bug-fix version under that feature version |

Follow these rules when upgrading:

| Upgrade type | Cross-version supported | Recommended path |
| --- | --- | --- |
| Third-digit version (same second-digit version) | Supported | Upgrade directly, for example 2.1.3 to 2.1.7 |
| Second-digit version | Cross-version not recommended | Upgrade second-digit version by second-digit version, for example 3.0 to 3.1 to 3.2 to 3.3 |
| First-digit version | Cross-version not recommended | First upgrade to the latest second-digit version under the same first-digit version, then upgrade across the major version |

For detailed version information, see [Versioning rules](https://doris.apache.org/community/release-and-verify/release-versioning).

## Upgrade Considerations

<!-- Knowledge type: Pre-operation check -->
<!-- Applicable scenarios: Pre-upgrade preparation -->

Pay attention to the following three items before upgrading:

| Consideration | How to handle |
| --- | --- |
| Behavioral changes between versions | Read the Release Notes of the target version before upgrading and confirm whether there are incompatible behavioral changes |
| Client task retries | Nodes are restarted in sequence during the upgrade, so retry logic must be added for Stream Load and query tasks. Routine Load, the Flink Doris Connector, and the Spark Doris Connector have built-in retries, so no extra handling is required |
| Replica repair and balance | Replica repair and balance must be disabled before the upgrade. Whether the upgrade succeeds or not, they must be re-enabled after the upgrade is complete |

:::caution Note

A Doris upgrade only requires replacing the `/bin` and `/lib` directories under the FE directory and the `/bin` and `/lib` directories under the BE directory.

In versions 2.0.2 and later, a `custom_lib/` directory has been added under both the FE and BE deployment paths (create it manually if it does not exist). It is used to store user-defined third-party jar files (such as `hadoop-lzo-*.jar` and `orai18n.jar`). This directory does not need to be replaced during the upgrade.

:::

## Metadata Compatibility Test

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Pre-upgrade verification / Metadata compatibility -->

The metadata compatibility test verifies before the upgrade that the new version can load the existing metadata correctly, which prevents data loss from an upgrade failure. It is recommended to run this test before every upgrade.

:::caution Note

In production, it is recommended to keep 3 or more FE nodes in a high-availability configuration. If there is only 1 FE node, the metadata compatibility test must be run before the upgrade. Metadata compatibility is critical: if an upgrade fails because of metadata incompatibility, data loss is possible.

Also note the following:

- It is recommended to run the metadata compatibility test on a development machine or a BE node, and to avoid running it on an FE node.
- If the test can only be run on an FE node, choose a non-Master node and stop its original FE process first.

:::

### 1. Back Up Metadata

Before starting the upgrade, back up the metadata of the Master FE node.

The Master FE node can be identified by the `IsMaster` column in `show frontends`. The FE metadata can be backed up hot, without stopping the FE process. By default, the FE metadata is stored in the `fe/doris-meta` directory; the metadata directory can also be confirmed through the `meta_dir` parameter in `fe.conf`.

### 2. Modify the FE Configuration File for Testing

Edit `fe.conf` in the test environment:

```shell
vi ${DORIS_NEW_HOME}/conf/fe.conf
```

Set all ports to values different from the production ones, and also modify the `clusterId` parameter:

```text
...
## modify port
http_port = 18030
rpc_port = 19020
query_port = 19030
arrow_flight_sql_port = 19040
edit_log_port = 19010

## modify clusterIP
clusterId=<a_new_clusterID, such as 123456>
...
```

Example ports for the test environment:

| Parameter | Example value | Description |
| --- | --- | --- |
| `http_port` | 18030 | FE HTTP service port |
| `rpc_port` | 19020 | FE Thrift Server port |
| `query_port` | 19030 | FE MySQL protocol query port |
| `arrow_flight_sql_port` | 19040 | Arrow Flight SQL port |
| `edit_log_port` | 19010 | FE BDBJE communication port |
| `clusterId` | 123456 | Test cluster ID, must differ from production |

### 3. Copy the Master FE Metadata

Copy the backed-up Master FE metadata to the new compatibility-test environment:

```shell
cp ${DORIS_OLD_HOME}/fe/doris-meta/* ${DORIS_NEW_HOME}/fe/doris-meta
```

### 4. Modify the cluster\_id in the Metadata VERSION File

Modify the `cluster_id` in the `VERSION` file under the copied metadata directory to the new cluster ID, for example 123456 as in the example above:

```shell
vi ${DORIS_NEW_HOME}/fe/doris-meta/image/VERSION
clusterId=123456
```

### 5. Start the FE Process in the Test Environment

```shell
sh ${DORIS_NEW_HOME}/bin/start_fe.sh --daemon --metadata_failure_recovery
```

In versions before 2.0.2, add `metadata_failure_recovery=true` to `fe.conf` first, then start the FE process:

```shell
echo "metadata_failure_recovery=true" >> ${DORIS_NEW_HOME}/conf/fe.conf
sh ${DORIS_NEW_HOME}/bin/start_fe.sh --daemon
```

### 6. Verify That the FE Started Successfully

Connect to the test FE through a MySQL client, using `query_port` 19030 from the example above:

```shell
mysql -uroot -P19030 -h127.0.0.1
```

If the connection succeeds, the new version can load the current metadata correctly, and the metadata compatibility test passes.

## Upgrade Flow Overview

The full upgrade flow is as follows, and the steps must be executed strictly in order:

1. Disable replica repair and balance.
2. Upgrade the BE nodes (a multi-replica cluster can use a canary upgrade).
3. Upgrade the FE nodes (upgrade Observer/Follower nodes first, and the Master last).
4. Re-enable replica repair and balance.

The overall principle is **upgrade BE first, then upgrade FE**. When upgrading FE, **upgrade the Observer FE and Follower FE nodes first, and upgrade the Master FE node last**.

## Upgrade Steps

### Step 1: Disable Replica Repair and Balance

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Pre-upgrade preparation -->

Nodes are restarted during the upgrade, which may trigger unnecessary cluster balancing and replica repair. Disable the following three configurations first:

```sql
admin set frontend config("disable_balance" = "true");
admin set frontend config("disable_colocate_balance" = "true");
admin set frontend config("disable_tablet_scheduler" = "true");
```

The configurations involved are:

| Configuration | Value before upgrade | Effect |
| --- | --- | --- |
| `disable_balance` | `true` | Disables replica balancing, preventing replica migration triggered by node restarts |
| `disable_colocate_balance` | `true` | Disables replica balancing for Colocate Join tables |
| `disable_tablet_scheduler` | `true` | Disables tablet scheduling, preventing replica repair |

### Step 2: Upgrade BE Nodes

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: BE rolling upgrade -->

:::info Note

To ensure data safety, store data with 3 replicas to avoid data loss caused by upgrade mis-operations or failures.

:::

In a multi-replica cluster, you can pick one BE node for a canary upgrade. After it is verified, upgrade the remaining nodes one by one.

#### 2.1 Stop the BE Node to Be Upgraded

```shell
sh ${DORIS_OLD_HOME}/be/bin/stop_be.sh
```

#### 2.2 Back Up the Existing `/bin` and `/lib` Directories

```shell
mv ${DORIS_OLD_HOME}/be/bin ${DORIS_OLD_HOME}/be/bin_back
mv ${DORIS_OLD_HOME}/be/lib ${DORIS_OLD_HOME}/be/lib_back
```

#### 2.3 Copy the New Version's `/bin` and `/lib` Directories

```shell
cp -r ${DORIS_NEW_HOME}/be/bin ${DORIS_OLD_HOME}/be/bin
cp -r ${DORIS_NEW_HOME}/be/lib ${DORIS_OLD_HOME}/be/lib
```

#### 2.4 Start the BE Node

```shell
sh ${DORIS_OLD_HOME}/be/bin/start_be.sh --daemon
```

#### 2.5 Verify the Upgrade

Connect to the cluster and check the node information:

```sql
show backends\G
```

If the `Alive` status of the BE node is `true` and the `Version` value is the new version, the node has been upgraded successfully. After confirming, upgrade the remaining BE nodes one by one in the same way.

### Step 3: Upgrade FE Nodes

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: FE rolling upgrade -->

When there are multiple FE nodes, upgrade the non-Master nodes (Observer or Follower) first, and upgrade the Master node last after all the others are done.

#### 3.1 Stop the FE Node to Be Upgraded

```shell
sh ${DORIS_OLD_HOME}/fe/bin/stop_fe.sh
```

#### 3.2 Back Up the Existing Directories

Back up the three directories `/bin`, `/lib`, and `/mysql_ssl_default_certificate`:

```shell
mv ${DORIS_OLD_HOME}/fe/bin ${DORIS_OLD_HOME}/fe/bin_back
mv ${DORIS_OLD_HOME}/fe/lib ${DORIS_OLD_HOME}/fe/lib_back
mv ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate_back
```

#### 3.3 Copy the New Version's Directories

```shell
cp -r ${DORIS_NEW_HOME}/fe/bin ${DORIS_OLD_HOME}/fe/bin
cp -r ${DORIS_NEW_HOME}/fe/lib ${DORIS_OLD_HOME}/fe/lib
cp -r ${DORIS_NEW_HOME}/fe/mysql_ssl_default_certificate ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate
```

#### 3.4 Start the FE Node

```shell
sh ${DORIS_OLD_HOME}/fe/bin/start_fe.sh --daemon
```

#### 3.5 Verify the Upgrade

Connect to the cluster and check the node information:

```sql
show frontends\G
```

If the `Alive` status of the FE node is `true` and the `Version` value is the new version, the node has been upgraded successfully.

#### 3.6 Upgrade the Remaining FE Nodes One by One

Upgrade the other non-Master FE nodes one by one in the same way, and **upgrade the Master FE node last**.

### Step 4: Re-enable Replica Repair and Balance

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Post-upgrade cleanup -->

After the upgrade is complete and the `Alive` status of all BE nodes has returned to true, re-enable cluster replica repair and balance:

```sql
admin set frontend config("disable_balance" = "false");
admin set frontend config("disable_colocate_balance" = "false");
admin set frontend config("disable_tablet_scheduler" = "false");
```

## Per-Version Upgrade Notes

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Cross-version upgrade / Confirming post-upgrade behavior changes -->

This section records behavior changes that need extra attention when upgrading to a specific version. Beyond this section, always read the target version's release notes for the complete list of changes.

### Session variable migration when upgrading from 3.x to 4.0

FE tracks the migration progress of session variable defaults through the internal variable `variable_version`. When upgrading from 3.x to 4.0 (`variable_version` lower than 400), FE automatically adjusts the **global defaults** of the following variables:

| Variable | Default after migration | Description |
| --- | --- | --- |
| `enable_ansi_query_organization_behavior` | `false` | Keeps the 3.x query organization behavior so semantics do not change after the upgrade |
| `enable_new_type_coercion_behavior` | `false` | Keeps the 3.x type coercion behavior |
| `enable_sql_cache` | `true` | Enables SQL Cache |
| `enable_nereids_distribute_planner` | `true` | **Migration item added in version 4.0.8**, see below |

The migration runs only once, when `variable_version` is raised from below 400 to 400. It never overwrites a value the user has explicitly set afterwards.

### Upgrading to 4.0.8

:::caution Nereids distribute planner is enabled

Starting from version 4.0.8, upgrading from 3.x to 4.0 enables the Nereids distribute planner (`enable_nereids_distribute_planner`).

Before 4.0.8, if the cluster's metadata image had persisted `enable_nereids_distribute_planner=false`, that value was restored as-is after the upgrade and the cluster kept using the legacy distribute planner. Version 4.0.8 adds the variable to the `variable_version=400` migration, so the new distribute planner is enabled consistently after the upgrade.

If query plan distribution differs from before the upgrade, you can roll back with `SET GLOBAL enable_nereids_distribute_planner = false;` and report the affected queries.

:::

The following changes also need attention when upgrading to 4.0.8:

| Change | Affected scope | What to do |
| --- | --- | --- |
| Compaction is no longer paused on high memory (BE config `enable_compaction_pause_on_high_memory` default `true` → `false`) | All deployment modes | Set it back to `true` to keep the old behavior. See [BE Configuration](../config/be-config) |
| The minimum auto bucket number is raised from 1 to 3 (FE config `autobucket_min_buckets`) | Tables created with `BUCKETS AUTO` | Only newly created partitions are affected. See [Data Bucketing](../../table-design/data-partitioning/data-bucketing) |
| The BE `_stream_load_forward` endpoint requires the configuration to be enabled and requests to be authenticated | Deployments relying on Group Commit BE forwarding in decoupled mode | Set `enable_group_commit_streamload_be_forward=true` in every `be.conf` and make sure the load account holds the global `LOAD` privilege. See [Group Commit](../../data-operate/import/load-best-practices/group-commit-manual) |
| Node management APIs require the global `ADMIN` privilege | Automation calling `/rest/v2/manager/node/{action}/{be\|fe\|broker}` | Add authentication with an `ADMIN` account to the caller. See [Node Action](../open-api/fe-http/node-action) |
| Stream Load validates the account's access to the compute group that actually serves the request | Stream Load in decoupled mode | Grant the load account access to the corresponding compute group. See [Stream Load](../../data-operate/import/import-way/stream-load-manual) |
| In decoupled mode, data size is consistently reported as remote size | Scripts computing capacity from `SHOW TABLETS` or `information_schema.partitions` | Use `REMOTE_DATA_SIZE` instead. See [partitions](../system-tables/information_schema/partitions) |
| Sensitive Kafka properties of Routine Load jobs are masked as `******` in query results | Scripts reading credentials from `SHOW ROUTINE LOAD` | Read the original values from your configuration management instead. See [SHOW ROUTINE LOAD](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD) |
| Warm-up timestamps change from `HH:mm:ss` to `yyyy-MM-dd HH:mm:ss` | Scripts parsing warm-up job status | Adjust the time parsing format. See [Read-Write Separation](../../compute-storage-decoupled/rw/read-write-separation) |
| Scan errors no longer carry the `failed to initialize storage reader` prefix | Monitoring rules matching on that prefix | Use the error code and the `tablet=` / `backend=` information instead |

## FAQ

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Upgrade failure / Exception handling -->

### Q: After the upgrade, a BE / FE node shows `Alive` as `false` and `Version` is still the old version. What should I do?

The process did not start, or the new version failed to start. Check the `be.log` / `fe.log` error logs and confirm that `/bin` and `/lib` were replaced correctly.

### Q: After the upgrade, the FE fails to start with a metadata incompatibility error. What should I do?

The cross-version jump was too large, or the metadata compatibility test was not run. Roll back to the old version, run the test following the "Metadata Compatibility Test" procedure in this document, and upgrade step by step if necessary.

### Q: After the upgrade, jar files in `custom_lib/` are missing. What happened?

`custom_lib/` was overwritten by mistake. Only replace `/bin` and `/lib`; `custom_lib/` must not be replaced.

### Q: Stream Load tasks fail during the upgrade. Why?

Node restarts interrupt client connections. Add retry logic on the client side. Routine Load and the Flink/Spark Doris Connectors have built-in retries.

### Q: After the upgrade, the replica count is abnormal or replica migration happens frequently. What is wrong?

`disable_balance` / `disable_tablet_scheduler` were not disabled, or they were not re-enabled after the upgrade. Verify the enable/disable flow of these configurations: disable them before the upgrade and re-enable them after.

### Q: A cross-minor-version upgrade failed. Why?

The versions were not upgraded in sequence. Roll back and follow a step-by-step path such as `3.0 to 3.1 to 3.2 to 3.3`.

### Q: A single-FE cluster upgrade failed and metadata was lost. What should I do?

The metadata compatibility test was not run. Before upgrading, scale out to a 3-FE high-availability deployment, or run the metadata compatibility test on a development machine or BE node.
