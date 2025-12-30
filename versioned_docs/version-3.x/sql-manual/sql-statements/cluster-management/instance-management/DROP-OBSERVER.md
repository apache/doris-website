---
{
    "title": "DROP OBSERVER",
    "language": "en",
    "description": "This statement deletes the node with the OBSERVER role of FRONTEND (only used by administrators!)"
}
---

## Description

This statement deletes the node with the OBSERVER role of FRONTEND (only used by administrators!)

## Syntax

```sql
ALTER SYSTEM DROP OBSERVER "<observer_host>:<edit_log_port>"
```

## Required Parameters

**1. `<observer_host>`**

> Can be the hostname or IP address of the FE node

**2. `<edit_log_port>`**

> bdbje communication port of FE node, the default is 9010

## Access Control Requirements

The user executing this SQL command must have at least the following permissions:

| Privilege | Object | Notes |
|-----------|----|-------|
| NODE_PRIV |    |       |

## Usage Notes

1. After deleting the OBSERVER node, use[`SHOW FRONTENDS`](./SHOW-FRONTENDS.md)command to verify that they were successfully deleted.

## Examples

1. Deleting an OBSERVER node

   ```sql
   ALTER SYSTEM DROP OBSERVER "host_ip:9010"
   ```
   This command deletes an OBSERVER node in the cluster (IP host_ip, port 9010)
