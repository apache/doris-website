---
{
    "title": "DROP FOLLOWER",
    "language": "en",
    "description": "This statement deletes the node with the FOLLOWER role of FRONTEND. (For administrators only!)"
}
---

## Description

This statement deletes the node with the FOLLOWER role of FRONTEND. (For administrators only!)

## Syntax

```sql
ALTER SYSTEM DROP FOLLOWER "<follower_host>:<edit_log_port>"
```

## Required Parameters

**1. `<follower_host>`**

> Can be the hostname or IP address of the FE node

**2. `<edit_log_port>`**

> bdbje communication port of FE node, the default is 9010

## Access Control Requirements

The user executing this SQL command must have at least the following permissions:

| Privilege | Object | Notes |
|-----------|----|-------|
| NODE_PRIV |    |       |

## Usage Notes

1. Before deleting a FOLLOWER node, make sure that the node that needs to be taken offline is not a Master node.
2. Before deleting a FOLLOWER node, ensure that the number of FOLLOWER nodes in the cluster is an odd number after they go offline.
3. After deleting the FOLLOWER node[`SHOW FRONTENDS`](./SHOW-FRONTENDS.md)command to verify that they were successfully deleted.

## Examples

1. Delete a FOLLOWER node

   ```sql
   ALTER SYSTEM DROP FOLLOWER "host_ip:9010"
   ```
   This command deletes a FOLLOWER node in the cluster (IP host_ip, port 9010)
