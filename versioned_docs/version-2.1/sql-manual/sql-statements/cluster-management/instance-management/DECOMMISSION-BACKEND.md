---
{
    "title": "DECOMMISSION BACKEND",
    "language": "en"
}
---

## Description

This statement is used to safely decommission a BE node from the cluster. This operation is asynchronous.

## Syntax

```sql
ALTER SYSTEM DECOMMISSION BACKEND "<be_identifier>" [, "<be_identifier>" ... ]
```

Where:

```sql
be_identifier
  : "<be_host>:<be_heartbeat_port>"
  | "<backend_id>"
```

## Required Parameters

**1. <be_host>**

> It can be the hostname or IP address of the BE node.

**2. <heartbeat_port>**

> The heartbeat port of the BE node, the default is 9050.

**3. <backend_id>**

> The ID of the BE node.

:::tip
`<be_host>`, `<be_heartbeat_port>`, and `<backend_id>` can all be obtained by querying with the [SHOW BACKENDS](./SHOW-BACKENDS.md) statement.
:::

## Access Control Requirements

The user who executes this SQL must have at least the following permissions:

| Privilege | Object | Notes |
|-----------|----|-------|
| NODE_PRIV |    |       |

## Usage Notes

1. After executing this command, you can use the [SHOW BACKENDS](./SHOW-BACKENDS.md) statement to view the decommissioning status (the value of the `SystemDecommissioned` column is `true`) and the decommissioning progress (the value of the `TabletNum` column will slowly drop to 0).
2. Under normal circumstances, after the value of the `TabletNum` column drops to 0, this BE node will be deleted. If you do not want Doris to automatically delete the BE, you can change the configuration `drop_backend_after_decommission` of the FE Master to false.
3. If the current BE stores a relatively large amount of data, the DECOMMISSION operation may last for several hours or even days.
4. If the progress of the DECOMMISSION operation gets stuck, specifically, the `TabletNum` column in the [SHOW BACKENDS](./SHOW-BACKENDS.md) statement remains fixed at a certain value, it may be due to the following situations:
   - There is no suitable other BE to migrate the tablets on the current BE. For example, in a 3-node cluster with a table having 3 replicas, if one of the nodes is to be decommissioned, this node cannot find other BEs to migrate the data (the other two BEs already have one replica each).
   - The tablets on the current BE are still in the [Recycle Bin](../../recycle/SHOW-CATALOG-RECYCLE-BIN.md). You can empty the recycle bin and then wait for decommission.
   - The tablet on the current BE is too large, causing the migration of a single tablet to always timeout and unable to migrate this tablet away. You can adjust the configuration `max_clone_task_timeout_sec` of the FE Master to a larger value (the default is 7200 seconds).
   - There are unfinished transactions on the tablets of the current BE. You can wait for the transactions to complete or manually abort the transactions.
   - In other cases, you can filter the keyword `replicas to decommission` in the logs of the FE Master to find the abnormal tablet, use the [SHOW TABLET](../../table-and-view/data-and-status-management/SHOW-TABLET.md) statement to find the table to which this tablet belongs, then create a new table, migrate the data from the old table to the new table, and finally use the [DROP TABLE FORCE](../../table-and-view/table/DROP-TABLE.md) to delete the old table.

## Examples

1. Safely decommission two nodes from the cluster according to the Host and HeartbeatPort of the BE.
   ```sql
   ALTER SYSTEM DECOMMISSION BACKEND "192.168.0.1:9050", "192.168.0.2:9050";
   ```

2. Safely decommission a node from the cluster according to the ID of the BE.
    ```sql
    ALTER SYSTEM DECOMMISSION BACKEND "10002";
    ```
