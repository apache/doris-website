---
{
    "title": "Elastic Scaling",
    "language": "en",
    "description": "Apache Doris elastic scaling guide: add or remove FE/BE nodes online, with DROP and DECOMMISSION as the two scale-in options, without interrupting business.",
    "keywords": [
        "Doris elastic scaling",
        "Doris online scale-out",
        "Doris scale-in",
        "FE scale-out",
        "BE scale-out",
        "FE scale-in",
        "BE scale-in",
        "ALTER SYSTEM ADD FOLLOWER",
        "ALTER SYSTEM ADD OBSERVER",
        "ALTER SYSTEM ADD BACKEND",
        "ALTER SYSTEM DROP BACKEND",
        "ALTER SYSTEM DECOMMISSION BACKEND",
        "DECOMMISSION",
        "data migration",
        "node bring-up and decommission",
        "cluster scale-out"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Cluster scale-out / Cluster scale-in / Node bring-up and decommission -->

Apache Doris supports online elastic scaling: dynamically add or remove nodes to handle business growth or reclaim idle resources without interrupting service. Scaling BE nodes does not affect cluster availability, but it triggers data migration, so run it during off-peak hours.

## Applicable Scenarios

| Scenario | Recommended operation | Description |
| --- | --- | --- |
| Insufficient FE read capacity | Scale out Observer FE | Observer does not participate in master election; it is used to improve metadata read throughput |
| Insufficient FE high availability | Scale out Follower FE | Keep the total of Master and Follower odd; 3 or 5 is recommended |
| Insufficient BE storage or compute | Scale out BE | After adding a BE, the system rebalances automatically and data is gradually distributed evenly |
| Decommission a specific BE node | Scale in BE (DECOMMISSION) | Migrates data first and then takes the node offline; recommended for production |
| Node has failed and must be removed immediately | Scale in BE (DROP) | Takes the node offline immediately and may cause data loss; use only in abnormal situations |

## Prerequisites

- You have cluster administrator privileges and can run `ALTER SYSTEM` operations.
- The IP, port, and role (Follower / Observer / BE) of each node are planned.
- The `http_port` of a newly added FE node matches the `http_port` of every existing FE node in the cluster.
- BE scale-in is performed during off-peak hours, and enough disk space is reserved to receive migrated data.

## Scaling the FE Cluster

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: FE scale-out / FE scale-in -->

### FE Role Description

Doris FE nodes have the following three roles. Every FE node holds the complete metadata:

| Role | Participates in master election | Metadata read/write | Purpose |
| --- | --- | --- | --- |
| Master | Yes (unique) | Read + write | Handles metadata reads and writes. Master metadata changes are synced to other nodes through the BDB JE protocol. Only one Master is allowed per cluster |
| Follower | Yes | Read | Handles metadata reads. When the Master fails, Followers initiate election and elect a new Master. The total of Master and Follower is recommended to be odd |
| Observer | No | Read | Handles metadata reads. Does not participate in master election. Used to scale out FE read capacity |

In general, each FE node can support 10 to 20 BE nodes, and 3 FE nodes are enough for most workloads.

### Scaling Out the FE Cluster

:::info Note
When adding a new FE node, keep the following in mind:

- The `http_port` of the new FE must match the `http_port` of every existing FE node in the cluster.
- When adding a Follower node, the total number of Master and Follower nodes in the cluster is recommended to be odd.
- The `show frontends` command shows the port and role of every node in the current cluster.
:::

1. Start the FE node:

    ```shell
    fe/bin/start_fe.sh --helper <leader_fe_host>:<edit_log_port> --daemon
    ```

2. Register the FE node.

    Register the node as a Follower FE:

    ```sql
    ALTER SYSTEM ADD FOLLOWER "<follower_host>:<edit_log_port>";
    ```

    Or register the node as an Observer FE:

    ```sql
    ALTER SYSTEM ADD OBSERVER "<observer_host>:<edit_log_port>";
    ```

3. Check the status of the newly added FE node:

    ```sql
    show frontends;
    ```

### Scaling In the FE Cluster

During scale-in, make sure the total of Master and Follower nodes remaining in the cluster is still odd. Use the following command to remove a node:

```sql
ALTER SYSTEM DROP FOLLOWER[OBSERVER] "<fe_host>:<edit_log_port>";
```

After scale-in, manually delete the files under the deployment directory of the removed FE node.

## Scaling the BE Cluster

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: BE scale-out / BE scale-in / Data migration -->

### Scaling Out the BE Cluster

1. Start the BE process:

    ```shell
    be/bin/start_be.sh
    ```

2. Register the BE node:

    ```sql
    ALTER SYSTEM ADD backend '<be_host>:<be_heartbeat_service_port>';
    ```

After registration, the new BE joins the cluster automatically, and Doris gradually rebalances existing data onto the new node.

### Scaling In the BE Cluster

When scaling in a BE node, you can choose either DROP or DECOMMISSION. The differences are as follows:

| Item | DROP | DECOMMISSION |
| --- | --- | --- |
| Decommission mechanism | Takes the node offline directly and removes the BE node | After the command is issued, tries to migrate the data on the BE to other nodes; the BE node is taken offline automatically after migration completes |
| Effective time | Takes effect immediately after execution | Takes effect after data migration completes. Depending on the current data volume in the cluster, this may take from hours up to one day |
| Single-replica table handling | May cause data loss | Does not cause data loss |
| Decommissioning multiple nodes at the same time | May cause data loss | Does not cause data loss |
| Production recommendation | Not recommended for production | Recommended for production |

#### Removing a BE Node with DROP

Use this when a node has failed or in a test environment where the node must be removed immediately:

```sql
ALTER SYSTEM DROP backend "<be_host>:<be_heartbeat_service_port>";
```

#### Removing a BE Node with DECOMMISSION

DECOMMISSION is recommended in production: it migrates data first and then takes the node offline:

```sql
ALTER SYSTEM DECOMMISSION backend "<be_host>:<be_heartbeat_service_port>";
```

DECOMMISSION command notes:

- DECOMMISSION is an asynchronous operation. After execution, `SHOW backends;` shows that the `SystemDecommissioned` status of the BE node is `true`, which means the node is being decommissioned.
- The DECOMMISSION command may fail. For example, when the remaining BE storage is not enough to hold the data on the BE being decommissioned, or when the remaining number of machines does not meet the minimum replica count, the command cannot complete, and the BE stays with `SystemDecommissioned` equal to `true`.
- You can check DECOMMISSION progress through `TabletNum` in `SHOW PROC '/backends';`. If decommission is in progress, `TabletNum` keeps decreasing.
- You can cancel decommission with `CANCEL DECOMMISSION BACKEND "<be_host>:<be_heartbeat_service_port>";`. After cancellation, the data on the BE stays at the current remaining volume, and Doris rebalances later.
- You can adjust the `balance_slot_num_per_path` parameter to change the data migration rate.

## FAQ

### Q: A newly added FE node fails to start?

The `http_port` differs from existing FEs, or `--helper` was not used to specify the Leader FE. Check the `http_port` setting in `fe.conf`. For the first start, use `--helper <leader_fe_host>:<edit_log_port>`.

### Q: After `ALTER SYSTEM ADD FOLLOWER`, the cluster still does not recognize the new node?

The node is not started, the network is unreachable, or the port is blocked by a firewall. Check the node status with `show frontends` and confirm that the `edit_log_port` is reachable.

### Q: DECOMMISSION does not finish for a long time?

The remaining BE storage is not enough, or the remaining number of nodes is less than the minimum replica count. Scale out more BE nodes or scale out before decommissioning. Use `SHOW PROC '/backends';` to check whether `TabletNum` is still decreasing.

### Q: How do I cancel DECOMMISSION partway through?

Run `CANCEL DECOMMISSION BACKEND "<be_host>:<be_heartbeat_service_port>";`. Doris rebalances afterward.

### Q: Data migration is too slow?

The default migration concurrency is low. Adjust the `balance_slot_num_per_path` parameter to increase the migration rate.

### Q: Disk space is not released after FE scale-in?

After the scale-in command succeeds, clean up manually by deleting the deployment directory of the removed FE node.
