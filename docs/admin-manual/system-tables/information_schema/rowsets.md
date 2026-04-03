---
{
    "title": "rowsets",
    "language": "en",
    "description": "Returns basic information about the Rowset."
}
---

## Overview

Returns basic information about the Rowset.

## Database


`information_schema`


## Table Information

| Column Name            | Type        | Description                                                  |
| ---------------------- | ----------- | ------------------------------------------------------------ |
| BACKEND_ID             | bigint      | The ID of the Backend, which is a unique identifier for the Backend. |
| ROWSET_ID              | varchar(64) | The ID of the Rowset, which is a unique identifier for the Rowset. |
| TABLET_ID              | bigint      | The ID of the Tablet, which is a unique identifier for the Tablet. |
| ROWSET_NUM_ROWS        | bigint      | The number of data rows contained in the Rowset.             |
| TXN_ID                 | bigint      | The transaction ID that wrote to the Rowset.                 |
| NUM_SEGMENTS           | bigint      | The number of Segments contained in the Rowset.              |
| START_VERSION          | bigint      | The starting version number of the Rowset.                   |
| END_VERSION            | bigint      | The ending version number of the Rowset.                     |
| INDEX_DISK_SIZE        | bigint      | The storage space for indexes within the Rowset.             |
| DATA_DISK_SIZE         | bigint      | The storage space for data within the Rowset.                |
| CREATION_TIME          | datetime    | The creation time of the Rowset.                             |
| NEWEST_WRITE_TIMESTAMP | datetime    | The most recent write time of the Rowset.                    |
| SCHEMA_VERSION         | int         | The Schema version number of the table corresponding to the Rowset data. |
| COMMIT_TSO             | bigint      | The commit TSO recorded in the Rowset metadata (64-bit). This is typically available only when FE-level `enable_tso_feature = true`, table-level `enable_tso = true`, and the transaction successfully obtained a valid TSO. If commit TSO is not recorded, the value is typically `-1`. |

## Usage Notes

- `COMMIT_TSO` is useful for tracing the global commit order of rowsets created by TSO-enabled tables.
- `COMMIT_TSO` being `-1` usually means TSO recording was not enabled for that table or the transaction did not persist a commit TSO.
- `COMMIT_TSO` reflects committed rowset metadata only. It does not expose the current internal state of `TSOService`, and table-level TSO settings do not change how timestamps are allocated by the service.

Example:

```sql
SELECT BACKEND_ID, TXN_ID, TABLET_ID, ROWSET_ID, COMMIT_TSO
FROM information_schema.rowsets
WHERE COMMIT_TSO != -1
ORDER BY COMMIT_TSO DESC
LIMIT 20;
```
