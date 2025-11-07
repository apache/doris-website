---
{
    "title": "ADMIN-REBALANCE-DISK",
    "language": "en"
}
---

## ADMIN-REBALANCE-DISK

:::tip Tips
This feature is supported since the Apache Doris 1.2 version
:::

### Name

ADMIN REBALANCE DISK

### Description

This statement is used to try to rebalance disks of the specified backends first, no matter if the cluster is balanced

Grammar:

```
ADMIN REBALANCE DISK [ON ("BackendHost1:BackendHeartBeatPort1", "BackendHost2:BackendHeartBeatPort2", ...)];
```

Explain:

1. This statement only means that the system attempts to rebalance disks of specified backends with high priority, no matter if the cluster is balanced.
2. The default timeout is 24 hours. Timeout means that the system will no longer rebalance disks of specified backends with high priority. The command settings need to be reused.

### Example

1. Attempt to rebalance disks of all backends

```
ADMIN REBALANCE DISK;
```

2. Attempt to rebalance disks oof the specified backends

```
ADMIN REBALANCE DISK ON ("192.168.1.1:1234", "192.168.1.2:1234");
```

### Keywords

ADMIN,REBALANCE,DISK

### Best Practice


