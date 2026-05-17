---
{
    "title": "CANCEL DECOMMISSION BACKEND",
    "language": "en",
    "description": "This statement is used to cancel the decommissioning operation of a BE node."
}
---

## Description

This statement is used to cancel the decommissioning operation of a BE node.

:::tip
This statement is not supported in decoupling storage and computing mode.
:::

## Syntax

```sql
CANCEL DECOMMISSION BACKEND "<be_identifier>" [, "<be_identifier>" ... ]
```

Where:

```sql
be_identifier
  : "<be_host>:<be_heartbeat_port>"
  | "<backend_id>"
```

## Required Parameters

**<be_host>**

> It can be the hostname or IP address of the BE node.

**<heartbeat_port>**

> The heartbeat port of the BE node, the default is 9050.

**<backend_id>**

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

1. After executing this command, you can view the decommissioning status (the value of the `SystemDecommissioned` column is false) and the decommissioning progress (the value of the `TabletNum` column no longer decreases slowly) through the [SHOW BACKENDS](./SHOW-BACKENDS.md) statement.
2. The cluster will slowly migrate the tablets from other nodes back to the current BE, so that the number of tablets on each BE will eventually tend to approach.

## Examples

1. Safely decommission two nodes from the cluster according to the Host and HeartbeatPort of the BE.
   ```sql
   CANCEL DECOMMISSION BACKEND "192.168.0.1:9050", "192.168.0.2:9050";
   ```

2. Safely decommission one node from the cluster according to the ID of the BE.
   ```sql
   CANCEL DECOMMISSION BACKEND "10002";
   ```
