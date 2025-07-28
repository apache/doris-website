---
{
    "title": "ADMIN DIAGNOSE TABLET",
    "language": "en"
}
---

## ADMIN DIAGNOSE TABLET
### Description

    This statement is used to diagnose the specified tablet. The results will show information about the tablet and some potential problems.

    grammar:

        ADMIN DIAGNOSE TABLET tblet_id

    illustrate:

        The lines of information in the result are as follows:
        1. TabletExist:                         Whether the Tablet exists
        2. TabletId:                            Tablet ID
        3. Database:                            The DB to which the Tablet belongs and its ID
        4. Table:                               The Table to which Tablet belongs and its ID
        5. Partition:                           The Partition to which the Tablet belongs and its ID
        6. MaterializedIndex:                   The materialized view to which the Tablet belongs and its ID
        7. Replicas(ReplicaId -> BackendId):    Tablet replicas and their BE.
        8. ReplicasNum:                         Whether the number of replicas is correct.
        9. ReplicaBackendStatus:                Whether the BE node where the replica is located is normal.
        10.ReplicaVersionStatus:                Whether the version number of the replica is normal.
        11.ReplicaStatus:                       Whether the replica status is normal.
        12.ReplicaCompactionStatus:             Whether the replica Compaction status is normal.

### Example

    1. Diagnose tablet 10001

        ADMIN DIAGNOSE TABLET 10001;

### Keywords
    ADMIN,DIAGNOSE,TABLET
