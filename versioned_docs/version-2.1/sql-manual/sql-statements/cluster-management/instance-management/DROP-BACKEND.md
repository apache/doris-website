---
{
    "title": "DROP BACKEND",
    "language": "en",
    "description": "This statement is used to remove BE nodes from the Doris cluster."
}
---

## Description

This statement is used to remove BE nodes from the Doris cluster.

## Syntax

```sql
ALTER SYSTEM DROP BACKEND "<be_identifier>" [, "<be_identifier>" ... ]
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

1. It is not recommended to use this command to take a BE node offline. This command will directly remove the BE node from the cluster. The data on the current node will not be load-balanced to other BE nodes. Data loss may occur if there are single-replica tables in the cluster. A better approach is to use the [DECOMMISSION BACKEND](./DECOMMISSION-BACKEND.md) command to gracefully take the BE node offline.
2. Since this operation is a high-risk operation, when you directly run this command:
   ```sql
   ALTER SYSTEM DROP BACKEND "127.0.0.1:9050";
   ```
   ```text
   ERROR 1105 (HY000): errCode = 2, detailMessage = It is highly NOT RECOMMENDED to use DROP BACKEND stmt.It is not safe to directly drop a backend. All data on this backend will be discarded permanently. If you insist, use DROPP instead of DROP
   ```
   The above prompt message will appear. If you understand what you are doing, you can replace the `DROP` keyword with `DROPP` and continue:
   ```sql
   ALTER SYSTEM DROPP BACKEND "127.0.0.1:9050";
   ```

## Examples

1. Remove two nodes from the cluster based on the Host and HeartbeatPort of the BE nodes:
   ```sql
   ALTER SYSTEM DROPP BACKEND "192.168.0.1:9050", "192.168.0.2:9050";
   ```

2. Remove one node from the cluster based on the ID of the BE node:
    ```sql
    ALTER SYSTEM DROPP BACKEND "10002";
    ```
