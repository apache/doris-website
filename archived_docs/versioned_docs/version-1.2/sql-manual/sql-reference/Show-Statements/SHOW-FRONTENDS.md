---
{
    "title": "SHOW-FRONTENDS",
    "language": "en"
}
---

## SHOW-FRONTENDS

### Name

SHOW FRONTENDS

### Description

This statement is used to view FE nodes

  grammar:

```sql
SHOW FRONTENDS;
```

illustrate:

1. name indicates the name of the FE node in bdbje.
2. If Join is true, it means that the node has joined the cluster before. But it does not mean that it is still in the cluster (may have lost contact
3. Alive indicates whether the node is alive or not.
4. ReplayedJournalId indicates the maximum metadata journal id that has been replayed by the node.
5. LastHeartbeat is the last heartbeat.
6. IsHelper indicates whether the node is a helper node in bdbje.
7. ErrMsg is used to display the error message when the heartbeat fails.
8. CurrentConnected indicates whether the FE node is currently connected

### Example

### Keywords

    SHOW, FRONTENDS

### Best Practice

