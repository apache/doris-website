---
{
    "title": "ADMIN-CANCEL-REBALANCE-DISK",
    "language": "en"
}
---

## ADMIN-CANCEL-REBALANCE-DISK

<version since="1.2.0">

### Name

ADMIN CANCEL REBALANCE DISK

### Description

This statement is used to cancel rebalancing disks of specified backends with high priority

Grammar:

ADMIN CANCEL REBALANCE DISK [ON ("BackendHost1:BackendHeartBeatPort1", "BackendHost2:BackendHeartBeatPort2", ...)];

Explain:

1. This statement only indicates that the system no longer rebalance disks of specified backends with high priority. The system will still rebalance disks by default scheduling.

### Example

1. Cancel High Priority Disk Rebalance of all of backends of the cluster

ADMIN CANCEL REBALANCE DISK;

2. Cancel High Priority Disk Rebalance of specified backends

ADMIN CANCEL REBALANCE DISK ON ("192.168.1.1:1234", "192.168.1.2:1234");

### Keywords

ADMIN,CANCEL,REBALANCE DISK

### Best Practice

</version>

