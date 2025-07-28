---
{
    "title": "SHOW-BACKENDS",
    "language": "en"
}
---

## SHOW-BACKENDS

### Name

SHOW BACKENDS

### Description

This statement is used to view the BE nodes in the cluster

```sql
 SHOW BACKENDS;
```

illustrate:

        1. LastStartTime indicates the last BE start time.
        2. LastHeartbeat indicates the last heartbeat.
        3. Alive indicates whether the node is alive or not.
        4. If SystemDecommissioned is true, it means that the node is being safely decommissioned.
        5. If ClusterDecommissioned is true, it means that the node is going offline in the current cluster.
        6. TabletNum represents the number of shards on the node.
        7. DataUsedCapacity Indicates the space occupied by the actual user data.
        8. AvailCapacity Indicates the available space on the disk.
        9. TotalCapacity represents the total disk space. TotalCapacity = AvailCapacity + DataUsedCapacity + other non-user data files occupy space.
       10. UsedPct Indicates the percentage of disk used.
       11. ErrMsg is used to display the error message when the heartbeat fails.
       12. Status is used to display some status information of BE in JSON format, including the time information of the last time BE reported its tablet.
       13. HeartbeatFailureCounter: The current number of heartbeats that have failed consecutively. If the number exceeds the `max_backend_heartbeat_failure_tolerance_count` configuration, the isAlive will be set to false.
       14. NodeRole is used to display the role of Backend node. Now there are two roles: mix and computation. Mix node represent the origin Backend node and computation Node represent the compute only node.

### Example

### Keywords

    SHOW, BACKENDS

### Best Practice

