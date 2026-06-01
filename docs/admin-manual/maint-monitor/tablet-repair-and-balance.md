---
{
    "title": "Data Replica Management",
    "language": "en",
    "description": "Covers the scheduling strategies for Doris Tablet replica balancing and repair, methods for viewing replica status, and common operational commands to help administrators manage cluster replicas efficiently."
}
---

# Data Replica Management

This document is for cluster administrators. It covers the replica balancing and repair mechanism of Apache Doris, scheduling priorities, methods for viewing replica status, and common operational practices for handling replica anomalies or skewed cluster load.

Starting from version 0.9.0, Doris introduced an optimized replica management strategy and provides richer tools for viewing replica status. This document helps you understand the replica scheduling principles and quickly recover the cluster in scenarios such as replica corruption, node downtime, or disk skew.

> For replica repair and balancing of tables with the Colocation attribute, refer to [Colocate Join](../../query-data/join#colocate-join).

<!-- Knowledge Type: Architecture Principles / Operations -->
<!-- Applicable Scenarios: Replica Repair / Cluster Balancing / Status Troubleshooting -->

## Applicable Scenarios

| Scenario | Recommended Section |
| --- | --- |
| Understanding replica scheduling principles | [Replica Repair](#replica-repair), [Replica Balancing](#replica-balancing) |
| Viewing the overall replica health of the cluster | [Viewing Replica Status](#viewing-replica-status) |
| Locating abnormal replicas of a specific Tablet | [Tablet-Level Status Check](#tablet-level-status-check) |
| Manual recovery after a BE goes down or disk fails | [Best Practices](#best-practices) |
| Adjusting repair/balancing speed or pausing balancing | [Resource Control](#resource-control), [Related Configuration](#related-configuration) |
| Skewed cluster load or uneven disk usage | [Replica Balancing](#replica-balancing) |

## Terminology

| Term | Meaning |
| --- | --- |
| Tablet | The logical shard of a Doris table. A table has multiple shards. |
| Replica | A copy of a shard. By default, a shard has 3 replicas. |
| Healthy Replica | A replica whose Backend is alive and whose version is complete. |
| TabletChecker (TC) | A resident background thread that periodically scans all Tablets, checks their status, and decides whether to send a Tablet to the TabletScheduler based on the result. |
| TabletScheduler (TS) | A resident background thread that handles Tablets sent by TabletChecker for repair, and also performs cluster replica balancing. |
| TabletSchedCtx (TSC) | An encapsulation of a Tablet. After TC selects a Tablet, it wraps it as a TSC and sends it to TS. |
| Storage Medium | Storage medium. Doris supports specifying different storage media (SSD and HDD) at partition granularity. Replica scheduling strategies schedule each storage medium separately. |

The overall workflow is as follows:

```text

              +--------+              +-----------+
              |  Meta  |              |  Backends |
              +---^----+              +------^----+
                  | |                        | 3. Send clone tasks
 1. Check tablets | |                        |
           +--------v------+        +-----------------+
           | TabletChecker +--------> TabletScheduler |
           +---------------+        +-----------------+
                   2. Waiting to be scheduled


```

The diagram above is a simplified workflow: TabletChecker checks Tablet status and sends Tablets that need repair to TabletScheduler, which dispatches clone tasks to BE.

## Replica Status

The multiple replicas of a Tablet may become inconsistent in status due to various conditions. Doris attempts to repair these inconsistent replicas automatically so the cluster can recover from the error state as quickly as possible.

### Replica Health Status

| Status | Meaning |
| --- | --- |
| BAD | The replica is corrupted. Includes but is not limited to unrecoverable damage caused by disk failure, bugs, and so on. |
| VERSION\_MISSING | Version missing. Each batch of imports in Doris corresponds to a data version, and the data of a replica consists of multiple consecutive versions. Due to import errors, delays, or other reasons, some replicas may have incomplete data versions. |
| HEALTHY | Healthy replica. The data is normal and the BE node where the replica resides is in a normal state (heartbeat is normal and the node is not being decommissioned). |

### Tablet Health Status

The health status of a Tablet is determined by the status of all its replicas. The following statuses exist:

| Status | Meaning |
| --- | --- |
| REPLICA\_MISSING | Replica missing. The number of live replicas is less than the expected number of replicas. |
| VERSION\_INCOMPLETE | The number of live replicas is greater than or equal to the expected number of replicas, but the number of healthy replicas is less than the expected number. |
| REPLICA\_RELOCATING | The number of live replicas with complete versions equals the replication num, but some of the BE nodes hosting these replicas are unavailable (such as being decommissioned). |
| REPLICA\_MISSING\_IN\_CLUSTER | In multi-cluster scenarios, the number of healthy replicas is greater than or equal to the expected number, but the number of replicas within the corresponding cluster is less than the expected number. |
| REDUNDANT | Replica redundancy. All healthy replicas are within the corresponding cluster, but the number exceeds the expected count; or there are extra unavailable replicas. |
| FORCE\_REDUNDANT | A special status. It appears only when "the number of existing replicas >= the number of available nodes >= the expected number of replicas, and the number of live replicas < the expected number of replicas". In this case, a replica must be deleted first to free up an available node for creating a new replica. |
| COLOCATE\_MISMATCH | A shard status specific to Colocation tables: the shard replica distribution does not match the distribution specified by the Colocation Group. |
| COLOCATE\_REDUNDANT | A shard status specific to Colocation tables: the shard replicas of the Colocation table are redundant. |
| HEALTHY | A healthy shard, meaning none of the conditions 1 through 8 above is met. |

## Replica Repair

TabletChecker, as a resident background process, periodically checks the status of all shards. Shards in unhealthy states are handed over to TabletScheduler for scheduling and repair. The actual repair operation is performed by clone tasks on BE; FE is only responsible for generating these clone tasks.

> Note 1: The main idea of replica repair is to first bring the number of replicas to the expected value by creating or supplementing them, and then delete the redundant replicas.
>
> Note 2: A clone task is the process of copying specified data from a designated remote BE to a designated destination BE.

### Repair by Status

Doris uses different repair methods for different statuses:

1. REPLICA\_MISSING / REPLICA\_RELOCATING

    Select a low-load and available BE node as the destination, and a healthy replica as the source. The clone task copies a complete replica from the source to the destination. For replica supplementation, an available BE node is selected directly, without considering the storage medium.

2. VERSION\_INCOMPLETE

    Select a relatively complete replica as the destination and a healthy replica as the source. The clone task attempts to copy the missing versions from the source to the replica on the destination.

3. REPLICA\_MISSING\_IN\_CLUSTER

    Handled the same way as REPLICA\_MISSING.

4. REDUNDANT

    After replica repair, a shard typically has redundant replicas. One redundant replica is selected for deletion. The selection of the redundant replica follows this priority:

    1. The BE hosting the replica has been decommissioned
    2. The replica is corrupted
    3. The BE hosting the replica is unreachable or being decommissioned
    4. The replica is in CLONE state (an intermediate state during clone task execution)
    5. The replica has missing versions
    6. The replica is in the wrong cluster
    7. The BE hosting the replica has high load

5. FORCE\_REDUNDANT

    Unlike REDUNDANT, in this case the number of live replicas is less than the expected number, but there are no additional available nodes for creating a new replica. Therefore, a replica must be deleted first to free up an available node for creating a new replica. The order of replica deletion is the same as REDUNDANT.

6. COLOCATE\_MISMATCH

    Select one of the BE nodes specified by the Colocation Group's replica distribution as the destination node for replica supplementation.

7. COLOCATE\_REDUNDANT

    Delete a replica on a BE node not specified by the Colocation Group's replica distribution.

When selecting replica nodes, Doris does not place replicas of the same Tablet on different BEs of the same host. This ensures that even if all BEs on the same host go down, not all replicas are lost.

### Scheduling Priority

Shards waiting to be scheduled in TabletScheduler are assigned different priorities based on their status. Shards with higher priority are scheduled first. The following priorities currently exist:

| Priority | Trigger Condition |
| --- | --- |
| VERY\_HIGH | REDUNDANT: shards with redundant replicas. Although the urgency is the lowest, this is processed the fastest and can quickly free up disk space and other resources, so it is processed first.<br/>FORCE\_REDUNDANT: same as above. |
| HIGH | REPLICA\_MISSING with most replicas missing (such as 2 out of 3 replicas lost).<br/>VERSION\_INCOMPLETE with most replicas having missing versions.<br/>COLOCATE\_MISMATCH: shards related to Colocation tables should be repaired as soon as possible.<br/>COLOCATE\_REDUNDANT. |
| NORMAL | REPLICA\_MISSING but most replicas alive (such as 1 out of 3 replicas lost).<br/>VERSION\_INCOMPLETE but most replicas have complete versions.<br/>REPLICA\_RELOCATING with most replicas needing to relocate (such as 2 out of 3 replicas). |
| LOW | REPLICA\_MISSING\_IN\_CLUSTER.<br/>REPLICA\_RELOCATING but most replicas are stable. |

### Manual Priority

The system automatically determines the scheduling priority. However, if you want certain tables or partitions to be repaired more quickly, you can use the following command to specify priority repair for a table or partition:

```sql
ADMIN REPAIR TABLE tbl [PARTITION (p1, p2, ...)];
```

This command tells TabletChecker that, while scanning Tablets, problematic Tablets in the tables or partitions marked for priority repair should be given `VERY_HIGH` priority.

> Note: This command is only a hint and does not guarantee a successful repair. The priority may change as TabletScheduler schedules. This information is lost after a Master FE switch or restart.

To cancel the priority, use the following command:

```sql
ADMIN CANCEL REPAIR TABLE tbl [PARTITION (p1, p2, ...)];
```

### Dynamic Priority Adjustment

Priority ensures that severely damaged shards are repaired first, improving system availability. However, if high-priority repair tasks keep failing, low-priority tasks may never be scheduled. Therefore, Doris dynamically adjusts task priorities based on their running status to ensure that all tasks have a chance to be scheduled:

- After 5 consecutive scheduling failures (such as failing to obtain resources or to find a suitable source or destination), the priority is lowered.
- If a task has not been scheduled for 30 minutes, its priority is raised.
- The priority of the same Tablet task is adjusted at most once every 5 minutes.

To preserve the weight of the initial priority, the following rules apply: an initial priority of `VERY_HIGH` is lowered at most to `NORMAL`; an initial priority of `LOW` is raised at most to `HIGH`. This dynamic adjustment also applies to priorities set manually by users.

## Replica Balancing

Doris automatically performs replica balancing within the cluster. Two balancing strategies are currently supported: **load balancing** and **partition balancing**.

| Strategy | Main Goal | Applicable Scenarios | Notes |
| --- | --- | --- | --- |
| Load balancing | Balance both disk usage and replica count on nodes | Need to consider both disk capacity and replica balance | Computes the score using two dimensions |
| Partition balancing | Distribute replicas of each partition evenly across nodes | High requirements for partition read/write and need to avoid hotspots | Does not consider disk usage; disk capacity needs attention |

The strategy can only be configured via [tablet_rebalancer_type](../config/fe-config) before FE startup; runtime switching is not supported.

Regardless of the strategy, replica balancing always ensures that replicas of the same Tablet are not placed on BEs on the same host.

### Load Balancing

The main idea of load balancing is: for certain shards, first create a replica on a low-load node, and then delete the replicas of those shards on high-load nodes. At the same time, because of the existence of different storage media, BE nodes within the same cluster may have one or two types of storage media. A shard whose storage medium is A should, after balancing, still be stored on storage medium A as much as possible. Therefore, BE nodes in the cluster are divided by storage medium, and load balancing scheduling is performed separately for the BE node groups of each storage medium.

#### BE Node Load

`ClusterLoadStatistics` (CLS) represents the load balance of each Backend in a cluster. TabletScheduler uses this statistic to trigger cluster balancing. Currently, a loadScore is calculated for each BE as its load score using two metrics: **disk usage** and **replica count**. A higher score indicates a heavier load on the BE.

Disk usage and replica count each have a weight coefficient, **capacityCoefficient** and **replicaNumCoefficient**, and **their sum is always 1**.

- If a valid `backend_load_capacity_coeficient` parameter is configured (value range `0.0`~`1.0`), then `capacityCoefficient = backend_load_capacity_coeficient`.
- Otherwise, `capacityCoefficient` is dynamically adjusted based on the actual disk usage:
    - When the overall disk usage of a BE is below 50%, `capacityCoefficient` is 0.5.
    - When the disk usage is above 75% (adjustable via the FE configuration item `capacity_used_percent_high_water`), the value is 1.
    - When the usage is between 50% and 75%, the weight coefficient increases smoothly, with the formula:

```text
capacityCoefficient = 2 * disk usage - 0.5
```

This weight coefficient ensures that when disk usage is too high, the load score of the Backend is higher, so the load on the BE is reduced as quickly as possible.

TabletScheduler updates CLS every 20 seconds.

### Partition Balancing

The main idea of partition balancing is: minimize the difference in the number of replicas of each partition on each Backend (that is, partition skew). Therefore, only the number of replicas is considered, not disk usage.

To minimize the number of migrations, partition balancing uses a two-dimensional greedy strategy and balances the partition with the largest partition skew first. When balancing a partition, it tries to choose a direction that reduces the difference in replica counts across Backends for the entire cluster (that is, cluster skew / total skew).

#### Skew Statistics

The skew statistics are represented by `ClusterBalanceInfo`:

- `partitionInfoBySkew`: sorted by partition skew as the key, making it easy to find the max partition skew.
- `beByTotalReplicaCount`: sorted by the total number of replicas on each Backend as the key.

`ClusterBalanceInfo` is also stored in CLS and is also updated every 20 seconds. There may be multiple partitions with the max partition skew; one is chosen randomly for calculation.

### Balancing Strategy Scheduling

In each scheduling round, TabletScheduler uses LoadBalancer to select a certain number of healthy shards as balance candidates. In the next scheduling round, it attempts to perform balancing scheduling based on these candidate shards.

## Resource Control

Both replica repair and balancing are completed through replica copying between BEs. If too many tasks are executed on the same BE at the same time, significant IO pressure is created. Therefore, Doris controls the number of tasks that can be executed on each node during scheduling.

| Resource | Description |
| --- | --- |
| Resource control unit | The minimum unit is a disk, that is, a data path specified in `be.conf`. |
| Replica repair slot | Each disk has 2 slots by default. A clone task occupies one slot on each of the source and destination. When the slot is 0, no more tasks are allocated. The slot can be adjusted via FE's `schedule_slot_num_per_hdd_path` or `schedule_slot_num_per_ssd_path`. |
| Balancing task slot | Each disk provides 2 independent slots by default for balancing tasks. The purpose is to prevent high-load nodes from being unable to free space through balancing because slots are occupied by repair tasks. |

## Viewing Replica Status

Viewing replica status is mainly used to understand the status of replicas and the running status of replica repair and balancing tasks. Most of this status **only exists on** the Master FE node, so the following commands need to be executed by connecting directly to the Master FE.

### Replica Status

#### Global Status Check

The replica status of the entire cluster can be viewed with the `SHOW PROC '/cluster_health/tablet_health';` command:

```text
+-------+--------------------------------+-----------+------------+-------------------+----------------------+----------------------+--------------+----------------------------+-------------------------+-------------------+---------------------+----------------------+----------------------+------------------+-----------------------------+-----------------+-------------+------------+
| DbId  | DbName                         | TabletNum | HealthyNum | ReplicaMissingNum | VersionIncompleteNum | ReplicaRelocatingNum | RedundantNum | ReplicaMissingInClusterNum | ReplicaMissingForTagNum | ForceRedundantNum | ColocateMismatchNum | ColocateRedundantNum | NeedFurtherRepairNum | UnrecoverableNum | ReplicaCompactionTooSlowNum | InconsistentNum | OversizeNum | CloningNum |
+-------+--------------------------------+-----------+------------+-------------------+----------------------+----------------------+--------------+----------------------------+-------------------------+-------------------+---------------------+----------------------+----------------------+------------------+-----------------------------+-----------------+-------------+------------+
| 10005 | default_cluster:doris_audit_db | 84        | 84         | 0                 | 0                    | 0                    | 0            | 0                          | 0                       | 0                 | 0                   | 0                    | 0                    | 0                | 0                           | 0               | 0           | 0          |
| 13402 | default_cluster:ssb1           | 709       | 708        | 1                 | 0                    | 0                    | 0            | 0                          | 0                       | 0                 | 0                   | 0                    | 0                    | 0                | 0                           | 0               | 0           | 0          |
| 10108 | default_cluster:tpch1          | 278       | 278        | 0                 | 0                    | 0                    | 0            | 0                          | 0                       | 0                 | 0                   | 0                    | 0                    | 0                | 0                           | 0               | 0           | 0          |
| Total | 3                              | 1071      | 1070       | 1                 | 0                    | 0                    | 0            | 0                          | 0                       | 0                 | 0                   | 0                    | 0                    | 0                | 0                           | 0               | 0           | 0          |
+-------+--------------------------------+-----------+------------+-------------------+----------------------+----------------------+--------------+----------------------------+-------------------------+-------------------+---------------------+----------------------+----------------------+------------------+-----------------------------+-----------------+-------------+------------+
```

Key column descriptions:

- `HealthyNum`: the number of Tablets in healthy status in the corresponding Database.
- `ReplicaCompactionTooSlowNum`: the number of Tablets whose replicas have too many versions.
- `InconsistentNum`: the number of Tablets with inconsistent replicas.
- `Total` row: statistics for the entire cluster. Under normal conditions, `TabletNum` and `HealthyNum` should be equal; if not, you can drill down to locate the specific Tablet.

For example, the `ssb1` database has 1 Tablet in an unhealthy state. You can view the specific Tablet with the following command (where `13402` is the corresponding DbId):

```sql
SHOW PROC '/cluster_health/tablet_health/13402';
```

```text
+-----------------------+--------------------------+--------------------------+------------------+--------------------------------+-----------------------------+-----------------------+-------------------------+--------------------------+--------------------------+----------------------+---------------------------------+---------------------+-----------------+
| ReplicaMissingTablets | VersionIncompleteTablets | ReplicaRelocatingTablets | RedundantTablets | ReplicaMissingInClusterTablets | ReplicaMissingForTagTablets | ForceRedundantTablets | ColocateMismatchTablets | ColocateRedundantTablets | NeedFurtherRepairTablets | UnrecoverableTablets | ReplicaCompactionTooSlowTablets | InconsistentTablets | OversizeTablets |
+-----------------------+--------------------------+--------------------------+------------------+--------------------------------+-----------------------------+-----------------------+-------------------------+--------------------------+--------------------------+----------------------+---------------------------------+---------------------+-----------------+
| 14679                 |                          |                          |                  |                                |                             |                       |                         |                          |                          |                      |                                 |                     |                 |
+-----------------------+--------------------------+--------------------------+------------------+--------------------------------+-----------------------------+-----------------------+-------------------------+--------------------------+--------------------------+----------------------+---------------------------------+---------------------+-----------------+
```

The output shows the specific unhealthy Tablet ID (such as 14679), which is in the `ReplicaMissing` state. The next section covers how to view the status of each replica of a specific Tablet.

#### Table (Partition) Level Status Check

The following command can be used to view the replica status of a specified table or partition, and the `WHERE` clause can be used to filter by status. For example, view replicas in OK status on partitions `p1` and `p2` of table `tbl1`:

```sql
SHOW REPLICA STATUS FROM tbl1 PARTITION (p1, p2) WHERE STATUS = "OK";
```

```text
+----------+-----------+-----------+---------+-------------------+--------------------+------------------+------------+------------+-------+--------+--------+
| TabletId | ReplicaId | BackendId | Version | LastFailedVersion | LastSuccessVersion | CommittedVersion | SchemaHash | VersionNum | IsBad | State  | Status |
+----------+-----------+-----------+---------+-------------------+--------------------+------------------+------------+------------+-------+--------+--------+
| 29502429 | 29502432  | 10006     | 2       | -1                | 2                  | 1                | -1         | 2          | false | NORMAL | OK     |
| 29502429 | 36885996  | 10002     | 2       | -1                | -1                 | 1                | -1         | 2          | false | NORMAL | OK     |
| 29502429 | 48100551  | 10007     | 2       | -1                | -1                 | 1                | -1         | 2          | false | NORMAL | OK     |
| 29502433 | 29502434  | 10001     | 2       | -1                | 2                  | 1                | -1         | 2          | false | NORMAL | OK     |
| 29502433 | 44900737  | 10004     | 2       | -1                | -1                 | 1                | -1         | 2          | false | NORMAL | OK     |
| 29502433 | 48369135  | 10006     | 2       | -1                | -1                 | 1                | -1         | 2          | false | NORMAL | OK     |
+----------+-----------+-----------+---------+-------------------+--------------------+------------------+------------+------------+-------+--------+--------+
```

This shows the status of all replicas:

- An `IsBad` value of `true` means the replica is corrupted.
- The `Status` column shows other statuses. For details, run `HELP SHOW REPLICA STATUS;`.

The `SHOW REPLICA STATUS` command is mainly used to view the health status of replicas. To view more additional information about replicas, use:

```sql
SHOW TABLETS FROM tbl1;
```

```text
+----------+-----------+-----------+------------+---------+-------------+-------------------+-----------------------+------------------+----------------------+---------------+----------+----------+--------+-------------------------+--------------+----------------------+--------------+----------------------+----------------------+----------------------+
| TabletId | ReplicaId | BackendId | SchemaHash | Version | VersionHash | LstSuccessVersion | LstSuccessVersionHash | LstFailedVersion | LstFailedVersionHash | LstFailedTime | DataSize | RowCount | State  | LstConsistencyCheckTime | CheckVersion |     CheckVersionHash | VersionCount | PathHash             | MetaUrl              | CompactionStatus     |
+----------+-----------+-----------+------------+---------+-------------+-------------------+-----------------------+------------------+----------------------+---------------+----------+----------+--------+-------------------------+--------------+----------------------+--------------+----------------------+----------------------+----------------------+
| 29502429 | 29502432  | 10006     | 1421156361 | 2       | 0           | 2                 | 0                     | -1               | 0                    | N/A           | 784      | 0        | NORMAL | N/A                     | -1           |     -1               | 2            | -5822326203532286804 | url                  | url                  |
| 29502429 | 36885996  | 10002     | 1421156361 | 2       | 0           | -1                | 0                     | -1               | 0                    | N/A           | 784      | 0        | NORMAL | N/A                     | -1           |     -1               | 2            | -1441285706148429853 | url                  | url                  |
| 29502429 | 48100551  | 10007     | 1421156361 | 2       | 0           | -1                | 0                     | -1               | 0                    | N/A           | 784      | 0        | NORMAL | N/A                     | -1           |     -1               | 2            | -4784691547051455525 | url                  | url                  |
+----------+-----------+-----------+------------+---------+-------------+-------------------+-----------------------+------------------+----------------------+---------------+----------+----------+--------+-------------------------+--------------+----------------------+--------------+----------------------+----------------------+----------------------+
```

The output above shows additional information such as replica size, row count, version count, and the data path where the replica resides.

> Note: The content of the `State` column shown here does not represent the health status of the replica, but the task status of the replica, such as CLONE, SCHEMA\_CHANGE, ROLLUP, and so on.

In addition, the following command can be used to view the replica distribution of a specified table or partition and check whether the replica distribution is even:

```sql
SHOW REPLICA DISTRIBUTION FROM tbl1;
```

```text
+-----------+------------+-------+---------+
| BackendId | ReplicaNum | Graph | Percent |
+-----------+------------+-------+---------+
| 10000     | 7          |       | 7.29 %  |
| 10001     | 9          |       | 9.38 %  |
| 10002     | 7          |       | 7.29 %  |
| 10003     | 7          |       | 7.29 %  |
| 10004     | 9          |       | 9.38 %  |
| 10005     | 11         | >     | 11.46 % |
| 10006     | 18         | >     | 18.75 % |
| 10007     | 15         | >     | 15.62 % |
| 10008     | 13         | >     | 13.54 % |
+-----------+------------+-------+---------+
```

The output shows the count and percentage of replicas of table `tbl1` on each BE node, along with a simple graphical display.

#### Tablet-Level Status Check

When you need to locate a specific Tablet, use the following command. For example, to view the Tablet with ID `29502553`:

```sql
SHOW TABLET 29502553;
```

```text
+------------------------+-----------+---------------+-----------+----------+----------+-------------+----------+--------+---------------------------------------------------------------------------+
| DbName                 | TableName | PartitionName | IndexName | DbId     | TableId  | PartitionId | IndexId  | IsSync | DetailCmd                                                                 |
+------------------------+-----------+---------------+-----------+----------+----------+-------------+----------+--------+---------------------------------------------------------------------------+
| default_cluster:test   | test      | test          | test      | 29502391 | 29502428 | 29502427    | 29502428 | true   | SHOW PROC '/dbs/29502391/29502428/partitions/29502427/29502428/29502553'; |
+------------------------+-----------+---------------+-----------+----------+----------+-------------+----------+--------+---------------------------------------------------------------------------+
```

The output shows the database, table, partition, rollup table, and other information that the Tablet belongs to. Copy the command in the `DetailCmd` column and run it:

```sql
SHOW PROC '/dbs/29502391/29502428/partitions/29502427/29502428/29502553';
```

```text
+-----------+-----------+---------+-------------+-------------------+-----------------------+------------------+----------------------+---------------+------------+----------+----------+--------+-------+--------------+----------------------+----------+------------------+
| ReplicaId | BackendId | Version | VersionHash | LstSuccessVersion | LstSuccessVersionHash | LstFailedVersion | LstFailedVersionHash | LstFailedTime | SchemaHash | DataSize | RowCount | State  | IsBad | VersionCount | PathHash             | MetaUrl  | CompactionStatus |
+-----------+-----------+---------+-------------+-------------------+-----------------------+------------------+----------------------+---------------+------------+----------+----------+--------+-------+--------------+----------------------+----------+------------------+
| 43734060  | 10004     | 2       | 0           | -1                | 0                     | -1               | 0                    | N/A           | -1         | 784      | 0        | NORMAL | false | 2            | -8566523878520798656 | url      | url              |
| 29502555  | 10002     | 2       | 0           | 2                 | 0                     | -1               | 0                    | N/A           | -1         | 784      | 0        | NORMAL | false | 2            | 1885826196444191611  | url      | url              |
| 39279319  | 10007     | 2       | 0           | -1                | 0                     | -1               | 0                    | N/A           | -1         | 784      | 0        | NORMAL | false | 2            | 1656508631294397870  | url      | url              |
+-----------+-----------+---------+-------------+-------------------+-----------------------+------------------+----------------------+---------------+------------+----------+----------+--------+-------+--------------+----------------------+----------+------------------+
```

The output shows the status of all replicas of the corresponding Tablet. The content is the same as `SHOW TABLETS FROM tbl1;`, but the status of all replicas of one specific Tablet is clearly visible.

### Replica Scheduling Tasks

The following commands can be used to view **pending**, **running**, and **finished** scheduling tasks separately:

| Status | Command |
| --- | --- |
| Pending | `SHOW PROC '/cluster_balance/pending_tablets';` |
| Running | `SHOW PROC '/cluster_balance/running_tablets';` |
| Finished | `SHOW PROC '/cluster_balance/history_tablets';` |

Example output (`pending_tablets`):

```text
+----------+--------+-----------------+---------+----------+----------+-------+---------+--------+----------+---------+---------------------+---------------------+---------------------+----------+------+-------------+---------------+---------------------+------------+---------------------+--------+---------------------+-------------------------------+
| TabletId | Type   | Status          | State   | OrigPrio | DynmPrio | SrcBe | SrcPath | DestBe | DestPath | Timeout | Create              | LstSched            | LstVisit            | Finished | Rate | FailedSched | FailedRunning | LstAdjPrio          | VisibleVer | VisibleVerHash      | CmtVer | CmtVerHash          | ErrMsg                        |
+----------+--------+-----------------+---------+----------+----------+-------+---------+--------+----------+---------+---------------------+---------------------+---------------------+----------+------+-------------+---------------+---------------------+------------+---------------------+--------+---------------------+-------------------------------+
| 4203036  | REPAIR | REPLICA_MISSING | PENDING | HIGH     | LOW      | -1    | -1      | -1     | -1       | 0       | 2019-02-21 15:00:20 | 2019-02-24 11:18:41 | 2019-02-24 11:18:41 | N/A      | N/A  | 2           | 0             | 2019-02-21 15:00:43 | 1          | 0                   | 2      | 0                   | unable to find source replica |
+----------+--------+-----------------+---------+----------+----------+-------+---------+--------+----------+---------+---------------------+---------------------+---------------------+----------+------+-------------+---------------+---------------------+------------+---------------------+--------+---------------------+-------------------------------+
```

The meaning of each column is as follows:

| Column | Meaning |
| --- | --- |
| TabletId | The ID of the Tablet waiting to be scheduled. A scheduling task targets only one Tablet. |
| Type | Task type: REPAIR or BALANCE. |
| Status | The current status of the Tablet, such as REPLICA\_MISSING. |
| State | Scheduling task status: PENDING / RUNNING / FINISHED / CANCELLED / TIMEOUT / UNEXPECTED. |
| OrigPrio | Initial priority. |
| DynmPrio | The current priority after dynamic adjustment. |
| SrcBe | The ID of the source BE node. |
| SrcPath | The hash value of the source BE node path. |
| DestBe | The ID of the destination BE node. |
| DestPath | The hash value of the destination BE node path. |
| Timeout | The timeout for the task after it is successfully scheduled, in seconds. |
| Create | The time the task was created. |
| LstSched | The last time the task was scheduled. |
| LstVisit | The last time the task was visited. "Visited" refers to any handling time related to the task, including being scheduled and reporting task execution. |
| Finished | The time the task finished. |
| Rate | The data copy rate of the clone task. |
| FailedSched | The number of times the task failed to be scheduled. |
| FailedRunning | The number of times the task failed to execute. |
| LstAdjPrio | The time of the last priority adjustment. |
| CmtVer / CmtVerHash / VisibleVer / VisibleVerHash | Version information used to execute the clone task. |
| ErrMsg | Error messages that occurred during task scheduling and execution. |

The meaning of each column in `running_tablets` is the same as in `pending_tablets`.

`history_tablets` keeps only the last 1000 completed tasks by default. The meaning of each column is the same as above:

- A `State` value of `FINISHED` means the task completed normally.
- Other values can be diagnosed based on the error message in the `ErrMsg` column.

## Viewing Cluster Load and Scheduling Resources

### Cluster Load

The current load of the cluster can be viewed with the following command:

```sql
SHOW PROC '/cluster_balance/cluster_load_stat/location_default';
```

First, you see the breakdown by storage medium:

```text
+---------------+
| StorageMedium |
+---------------+
| HDD           |
| SSD           |
+---------------+
```

Drill into a storage medium to see the balance status of BE nodes that include that storage medium:

```sql
SHOW PROC '/cluster_balance/cluster_load_stat/location_default/HDD';
```

```text
+----------+-----------------+-----------+---------------+----------------+-------------+------------+----------+-----------+--------------------+-------+
| BeId     | Cluster         | Available | UsedCapacity  | Capacity       | UsedPercent | ReplicaNum | CapCoeff | ReplCoeff | Score              | Class |
+----------+-----------------+-----------+---------------+----------------+-------------+------------+----------+-----------+--------------------+-------+
| 10003    | default_cluster | true      | 3477875259079 | 19377459077121 | 17.948      | 493477     | 0.5      | 0.5       | 0.9284678149967587 | MID   |
| 10002    | default_cluster | true      | 3607326225443 | 19377459077121 | 18.616      | 496928     | 0.5      | 0.5       | 0.948660871419998  | MID   |
| 10005    | default_cluster | true      | 3523518578241 | 19377459077121 | 18.184      | 545331     | 0.5      | 0.5       | 0.9843539990641831 | MID   |
| 10001    | default_cluster | true      | 3535547090016 | 19377459077121 | 18.246      | 558067     | 0.5      | 0.5       | 0.9981869446537612 | MID   |
| 10006    | default_cluster | true      | 3636050364835 | 19377459077121 | 18.764      | 547543     | 0.5      | 0.5       | 1.0011489897614072 | MID   |
| 10004    | default_cluster | true      | 3506558163744 | 15501967261697 | 22.620      | 468957     | 0.5      | 0.5       | 1.0228319835582569 | MID   |
| 10007    | default_cluster | true      | 4036460478905 | 19377459077121 | 20.831      | 551645     | 0.5      | 0.5       | 1.057279369420761  | MID   |
| 10000    | default_cluster | true      | 4369719923760 | 19377459077121 | 22.551      | 547175     | 0.5      | 0.5       | 1.0964036415787461 | MID   |
+----------+-----------------+-----------+---------------+----------------+-------------+------------+----------+-----------+--------------------+-------+
```

The meaning of each column is as follows:

| Column | Meaning |
| --- | --- |
| Available | A value of true means the BE heartbeat is normal and it is not being decommissioned. |
| UsedCapacity | Bytes, the disk space already used by the BE. |
| Capacity | Bytes, the total disk space of the BE. |
| UsedPercent | Percentage, the disk space usage on the BE. |
| ReplicaNum | The number of replicas on the BE. |
| CapCoeff / ReplCoeff | Weight coefficients for disk space and replica count. |
| Score | Load score. A higher score means heavier load. |
| Class | Classification by load level: LOW / MID / HIGH. Balancing scheduling migrates replicas from high-load nodes to low-load nodes. |

You can drill down further to view the usage of each path on a specific BE. For example, view the BE with ID 10001:

```sql
SHOW PROC '/cluster_balance/cluster_load_stat/location_default/HDD/10001';
```

```text
+------------------+------------------+---------------+---------------+---------+--------+----------------------+
| RootPath         | DataUsedCapacity | AvailCapacity | TotalCapacity | UsedPct | State  | PathHash             |
+------------------+------------------+---------------+---------------+---------+--------+----------------------+
| /home/disk4/palo | 498.757 GB       | 3.033 TB      | 3.525 TB      | 13.94 % | ONLINE | 4883406271918338267  |
| /home/disk3/palo | 704.200 GB       | 2.832 TB      | 3.525 TB      | 19.65 % | ONLINE | -5467083960906519443 |
| /home/disk1/palo | 512.833 GB       | 3.007 TB      | 3.525 TB      | 14.69 % | ONLINE | -7733211489989964053 |
| /home/disk2/palo | 881.955 GB       | 2.656 TB      | 3.525 TB      | 24.65 % | ONLINE | 4870995507205544622  |
| /home/disk5/palo | 694.992 GB       | 2.842 TB      | 3.525 TB      | 19.36 % | ONLINE | 1916696897889786739  |
+------------------+------------------+---------------+---------------+---------+--------+----------------------+
```

The output shows the disk usage of each data path on the specified BE.

### Scheduling Resources

The slot usage of each node can be viewed with the following command:

```sql
SHOW PROC '/cluster_balance/working_slots';
```

```text
+----------+----------------------+------------+------------+-------------+----------------------+
| BeId     | PathHash             | AvailSlots | TotalSlots | BalanceSlot | AvgRate              |
+----------+----------------------+------------+------------+-------------+----------------------+
| 10000    | 8110346074333016794  | 2          | 2          | 2           | 2.459007474009069E7  |
| 10000    | -5617618290584731137 | 2          | 2          | 2           | 2.4730105014001578E7 |
| 10001    | 4883406271918338267  | 2          | 2          | 2           | 1.6711402709780257E7 |
| 10001    | -5467083960906519443 | 2          | 2          | 2           | 2.7540126380326536E7 |
| 10002    | 9137404661108133814  | 2          | 2          | 2           | 2.417217089806745E7  |
| 10002    | 1885826196444191611  | 2          | 2          | 2           | 1.6327378456676323E7 |
+----------+----------------------+------------+------------+-------------+----------------------+
```

The slot usage is shown at data-path granularity. `AvgRate` is the historical statistical copy rate of clone tasks on that path, in bytes per second.

### Viewing Priority Repair

The following command shows the tables or partitions set for priority repair via the `ADMIN REPAIR TABLE` command:

```sql
SHOW PROC '/cluster_balance/priority_repair';
```

`RemainingTimeMs` indicates how long until these priority repair items are automatically removed from the priority repair queue, preventing priority repair from continuously failing and tying up resources.

### Viewing Scheduler Statistics

Doris collects statistics about TabletChecker and TabletScheduler during operation, which can be viewed with the following command:

```sql
SHOW PROC '/cluster_balance/sched_stat';
```

```text
+---------------------------------------------------+-------------+
| Item                                              | Value       |
+---------------------------------------------------+-------------+
| num of tablet check round                         | 12041       |
| cost of tablet check(ms)                          | 7162342     |
| num of tablet checked in tablet checker           | 18793506362 |
| num of unhealthy tablet checked in tablet checker | 7043900     |
| num of tablet being added to tablet scheduler     | 1153        |
| num of tablet schedule round                      | 49538       |
| cost of tablet schedule(ms)                       | 49822       |
| num of tablet being scheduled                     | 4356200     |
| num of tablet being scheduled succeeded           | 320         |
| num of tablet being scheduled failed              | 4355594     |
| num of tablet being scheduled discard             | 286         |
| num of tablet priority upgraded                   | 0           |
| num of tablet priority downgraded                 | 1096        |
| num of clone task                                 | 230         |
| num of clone task succeeded                       | 228         |
| num of clone task failed                          | 2           |
| num of clone task timeout                         | 2           |
| num of replica missing error                      | 4354857     |
| num of replica version missing error              | 967         |
| num of replica relocating                         | 0           |
| num of replica redundant error                    | 90          |
| num of replica missing in cluster error           | 0           |
| num of balance scheduled                          | 0           |
+---------------------------------------------------+-------------+
```

The meaning of each row is as follows:

| Metric | Meaning |
| --- | --- |
| num of tablet check round | The number of times Tablet Checker has run. |
| cost of tablet check(ms) | The total time cost of Tablet Checker. |
| num of tablet checked in tablet checker | The number of tablets checked by Tablet Checker. |
| num of unhealthy tablet checked in tablet checker | The number of unhealthy tablets checked by Tablet Checker. |
| num of tablet being added to tablet scheduler | The number of tablets submitted to Tablet Scheduler. |
| num of tablet schedule round | The number of times Tablet Scheduler has run. |
| cost of tablet schedule(ms) | The total time cost of Tablet Scheduler. |
| num of tablet being scheduled | The total number of Tablets scheduled. |
| num of tablet being scheduled succeeded | The total number of Tablets successfully scheduled. |
| num of tablet being scheduled failed | The total number of Tablets that failed to be scheduled. |
| num of tablet being scheduled discard | The total number of Tablets that failed to be scheduled and were discarded. |
| num of tablet priority upgraded | The number of times priorities were raised. |
| num of tablet priority downgraded | The number of times priorities were lowered. |
| num of clone task | The number of clone tasks generated. |
| num of clone task succeeded | The number of successful clone tasks. |
| num of clone task failed | The number of failed clone tasks. |
| num of clone task timeout | The number of clone tasks that timed out. |
| num of replica missing error | The number of tablets checked with the replica missing status. |
| num of replica version missing error | The number of tablets checked with the version missing status (including num of replica relocating and num of replica missing in cluster error). |
| num of replica relocating | The number of tablets checked with the replica relocating status. |
| num of replica redundant error | The number of tablets checked with the replica redundant status. |
| num of replica missing in cluster error | The number of tablets checked with the not-in-corresponding-cluster status. |
| num of balance scheduled | The number of balance schedulings. |

> Note: All of the above statuses are cumulative historical values. The FE log also periodically prints these statistics, where the value in parentheses indicates the change in each statistic since the last time the statistics were printed.

## Related Configuration

<!-- Knowledge Type: Configuration Parameters -->
<!-- Applicable Scenarios: Replica Repair / Balancing Tuning -->

### Adjustable Parameters (FE)

The following adjustable parameters are all configurable in `fe.conf`.

| Parameter | Description | Default | Importance |
| --- | --- | --- | --- |
| use\_new\_tablet\_scheduler | Whether to enable the new replica scheduling method. The new replica scheduling method is the one covered in this document. | true | High |
| tablet\_repair\_delay\_factor\_second | Delays repair for different scheduling priorities by different amounts of time, to prevent a large number of unnecessary replica repair tasks during routine restarts, upgrades, and so on. Base coefficient: HIGH delays `base coefficient * 1`, NORMAL delays `base coefficient * 2`, LOW delays `base coefficient * 3`. The lower the priority, the longer the wait. Lower this when replicas need to be repaired quickly. | 60 seconds | High |
| schedule\_slot\_num\_per\_path | The default number of slots allocated to each disk for replica repair, representing the number of replica repair tasks that can run simultaneously on a single disk. A higher value means faster repair but greater impact on IO. | 2 | High |
| balance\_load\_score\_threshold | The threshold for cluster balancing. When the deviation of a BE node's load score from the average load score does not exceed this value, the cluster is considered balanced. Lower this when a more even load is desired. | 0.1 (that is, 10%) | Medium |
| storage\_high\_watermark\_usage\_percent | The maximum space usage limit of a disk. When this limit is exceeded, the disk is no longer used as a destination for balancing scheduling. | 0.85 | Medium |
| storage\_min\_left\_capacity\_bytes | The minimum remaining space limit of a disk. When the remaining space is below this limit, the disk is no longer used as a destination for balancing scheduling. | 2097152000 (2 GB) | Medium |
| disable\_balance | Controls whether to disable the balancing feature. During balancing, some features (such as ALTER TABLE) are prohibited, and balancing may continue for a long time. Set to true when prohibited operations need to be performed as soon as possible. | false | Medium |

### Adjustable Parameters (BE)

The following adjustable parameters are all configurable in `be.conf`.

| Parameter | Description | Default | Importance |
| --- | --- | --- | --- |
| clone\_worker\_count | Affects the speed of replica balancing. When disk pressure is low, this parameter can be adjusted to speed up replica balancing. | 3 | Medium |

### Non-Adjustable Parameters

The following parameters are not yet modifiable; they are listed here for reference only.

| Item | Description |
| --- | --- |
| TabletChecker scheduling interval | TabletChecker performs a check and schedule every 20 seconds. |
| TabletScheduler scheduling interval | TabletScheduler schedules every 5 seconds. |
| Number of TabletScheduler tasks scheduled per batch | TabletScheduler schedules at most 50 Tablets per round. |
| Maximum number of TabletScheduler pending and running tasks | The maximum number of pending and running tasks is 2000. Once exceeded, TabletChecker no longer generates new scheduling tasks for TabletScheduler. |
| Maximum number of TabletScheduler balancing tasks | The maximum number of balancing tasks is 500. Once exceeded, no new balancing tasks are generated. |
| Number of slots per disk for balancing tasks | The number of slots per disk for balancing tasks is 2. This slot is independent of the slots used for replica repair. |
| Cluster balance information update interval | TabletScheduler recalculates the cluster load score every 20 seconds. |
| Minimum and maximum timeout for a clone task | The timeout for a clone task ranges from 3 min to 2 hour. The specific timeout is calculated as `(tablet size) / (5 MB/s)`. A clone task is terminated after 3 failed runs. |
| Dynamic priority adjustment strategy | The minimum priority adjustment interval is 5 min. A tablet's priority is lowered after 5 scheduling failures, and raised after 30 min without being scheduled. |

## Related Issues

- In some cases, the default replica repair and balancing strategy may saturate the network (this often occurs with gigabit network cards and a large number of disks per BE). In this case, some parameters need to be adjusted to reduce the number of simultaneous balancing and repair tasks.
- The current replica balancing strategy for Colocate Tables cannot guarantee that replicas of the same Tablet are not distributed on BEs of the same host. However, the replica repair strategy for Colocate Tables detects this misdistribution and corrects it. After correction, the balancing strategy may again consider the replicas unbalanced and rebalance them, causing the two states to alternate continuously and preventing the Colocate Group from stabilizing. For this case, try to keep the cluster homogeneous when using the Colocate attribute, to reduce the probability of replicas being distributed on the same host.

## Best Practices

<!-- Knowledge Type: Operations -->
<!-- Applicable Scenarios: Replica Repair / Cluster Recovery / Emergency Handling -->

### Controlling and Managing Cluster Replica Repair and Balancing Progress

In most cases, with the default parameter configuration, Doris can automatically perform replica repair and cluster balancing. However, in some cases, manual intervention to adjust parameters is needed to achieve specific goals, such as prioritizing the repair of a certain table or partition, disabling cluster balancing to reduce cluster load, or prioritizing the repair of non-colocation table data. This section covers how to control and manage cluster replica repair and balancing progress by modifying parameters.

#### 1. Delete Corrupted Replicas

In some cases, Doris may be unable to automatically detect certain corrupted replicas, causing queries or imports to frequently report errors on the corrupted replicas. In this case, the corrupted replicas need to be deleted manually. This method applies to: deleting replicas with too many versions that cause -235 errors, deleting replicas with damaged files, and so on.

Steps:

1. Find the Tablet ID corresponding to the replica. Assume it is 10001.
2. Run `show tablet 10001;` and then run the `show proc` statement it returns to view the details of each replica of the Tablet.
3. Assume the Backend ID where the replica to be deleted resides is 20001. Run the following statement to mark the replica as `bad`:

    ```sql
    ADMIN SET REPLICA STATUS PROPERTIES("tablet_id" = "10001", "backend_id" = "20001", "status" = "bad");
    ```

4. Run the `show proc` statement again to confirm that the `IsBad` column of the corresponding replica is `true`.

A replica marked as `bad` no longer participates in imports and queries. At the same time, the replica repair logic automatically supplements a new replica.

#### 2. Prioritize Repairing a Table or Partition

Run `help admin repair table;` to view the help. This command attempts to prioritize the repair of Tablets in the specified table or partition.

#### 3. Stop Balancing Tasks

Balancing tasks occupy some network bandwidth and IO resources. To stop the generation of new balancing tasks, run:

```sql
ADMIN SET FRONTEND CONFIG ("disable_balance" = "true");
```

#### 4. Stop All Replica Scheduling Tasks

Replica scheduling tasks include balancing and repair tasks. These tasks occupy some network bandwidth and IO resources. The following command stops all replica scheduling tasks (excluding those already running, including both colocation tables and ordinary tables):

```sql
ADMIN SET FRONTEND CONFIG ("disable_tablet_scheduler" = "true");
```

#### 5. Stop All Replica Scheduling Tasks for Colocation Tables

Replica scheduling for colocation tables and ordinary tables runs independently. In some cases, you may want to stop the balancing and repair work for colocation tables first, so that cluster resources can be used to repair ordinary tables:

```sql
ADMIN SET FRONTEND CONFIG ("disable_colocate_balance" = "true");
```

#### 6. Use a More Conservative Strategy to Repair Replicas

Doris automatically repairs replicas when it detects missing replicas, BE downtime, and so on. To reduce errors caused by transient issues (such as brief BE downtime), Doris delays triggering these tasks.

- The `tablet_repair_delay_factor_second` parameter: defaults to 60 seconds. Depending on the repair task priority, the repair task is triggered after a delay of 60 seconds, 120 seconds, or 180 seconds. The following command extends this time to tolerate longer abnormal periods and avoid triggering unnecessary repair tasks:

    ```sql
    ADMIN SET FRONTEND CONFIG ("tablet_repair_delay_factor_second" = "120");
    ```

#### 7. Use a More Conservative Strategy to Trigger Colocation Group Redistribution

Redistribution of colocation groups may be accompanied by a large number of tablet migrations. `colocate_group_relocate_delay_second` controls the trigger delay for redistribution; the default is 1800 seconds. If a BE node may be offline for a long time, try increasing this parameter to avoid unnecessary redistribution:

```sql
ADMIN SET FRONTEND CONFIG ("colocate_group_relocate_delay_second" = "3600");
```

#### 8. Faster Replica Balancing

The Doris replica balancing logic first adds a normal replica and then deletes the old replica, achieving replica migration. When deleting the old replica, Doris waits for the import tasks that have already started on the replica to complete, to avoid the balancing task affecting import tasks. However, this slows down the execution of the balancing logic. The following parameter makes Doris skip this wait and delete the old replica directly:

```sql
ADMIN SET FRONTEND CONFIG ("enable_force_drop_redundant_replica" = "true");
```

This operation may cause some import tasks to fail during balancing (requiring retry), but it significantly accelerates balancing.

### Recommended Procedure for Fast Cluster Recovery

To quickly recover the cluster to a normal state, consider the following approach:

1. Find the Tablet that causes high-priority tasks to report errors and mark the problematic replica as `bad`.
2. Use the `ADMIN REPAIR` statement to prioritize the repair of certain tables.
3. Stop the replica balancing logic to avoid consuming cluster resources, and re-enable it after the cluster recovers.
4. Use a more conservative strategy to trigger repair tasks to handle the avalanche effect caused by frequent BE downtime.
5. As needed, disable scheduling tasks for colocation tables to focus cluster resources on repairing other high-priority data.

## FAQ

### Q: The `SHOW PROC '/cluster_health/tablet_health'` command reports an error or shows incomplete data. What should I do?

This command requires a direct connection to the Master FE. Check whether the FE you are currently connected to is the Master.

### Q: A replica has been in `REPLICA_MISSING` for a long time without being repaired. How do I troubleshoot?

Check the `ErrMsg` in `SHOW PROC '/cluster_balance/pending_tablets'`. Common causes: no suitable source or destination can be found, insufficient disk space, the node is being decommissioned.

### Q: There are too many scheduling failures for repair tasks. What should I do?

Use `SHOW PROC '/cluster_balance/sched_stat'` to view failure statistics. Consider increasing `schedule_slot_num_per_hdd_path` or `schedule_slot_num_per_ssd_path`, or check for issues such as insufficient disk space or unavailable nodes.

### Q: Replica balancing is saturating the network. What should I do?

Reduce the number of simultaneous balancing and repair tasks, or temporarily run `ADMIN SET FRONTEND CONFIG ("disable_balance" = "true");`.

### Q: A Colocate Group cannot stabilize for a long time. What should I do?

Try to keep the cluster homogeneous and increase `colocate_group_relocate_delay_second` to reduce unnecessary redistribution.

### Q: After a BE goes down, a large number of replicas are repaired immediately, causing load jitter. What should I do?

Increase `tablet_repair_delay_factor_second` to allow a longer tolerance period.

### Q: After deleting a `bad` replica, errors still occur. What should I do?

Confirm via `SHOW PROC '/dbs/.../<tablet_id>'` that all replicas have been re-supplemented, and wait for the clone task to complete.
