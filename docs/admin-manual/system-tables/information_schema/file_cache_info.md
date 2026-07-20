---
{
    "title": "file_cache_info",
    "language": "en",
    "description": "View block-level File Cache entries on BE nodes. This system table is supported in Doris 4.1 and later."
}
---

## Overview

The `file_cache_info` system table exposes block-level File Cache entries on all alive BE nodes. Use it to analyze cache space by tablet, BE, cache path, or cache type, and to investigate cache skew or unexpected cache growth.

:::tip Version

This system table is supported in Doris 4.1 and later. It is not available in Doris 4.0.x.

:::

Each row represents one cached block. The result reflects the current cache state and can change while queries populate or evict cache entries.

:::caution

Querying this table scans persisted File Cache metadata on the selected BE nodes and can generate additional I/O when the cache contains many blocks. Avoid frequent unfiltered queries. Filter by `BE_ID` when you only need data from specific BE nodes.

:::

## Database

`information_schema`

## Table Information

| Column Name | Type | Description |
|---|---|---|
| `HASH` | STRING | Hash of the remote file to which the cached block belongs. |
| `OFFSET` | BIGINT | Starting offset of the cached block in the remote file, in bytes. |
| `TABLET_ID` | BIGINT | ID of the tablet associated with the cached block. The value is `0` when the block is not associated with a tablet. |
| `SIZE` | BIGINT | Size of the cached block, in bytes. |
| `TYPE` | STRING | Cache type. Possible values are `normal`, `index`, `ttl`, and `disposable`. |
| `REMOTE_PATH` | STRING | Reserved for the remote file path. Currently returns an empty string. |
| `CACHE_PATH` | STRING | Local File Cache root path on the BE node. |
| `BE_ID` | BIGINT | ID of the BE node that stores the cached block. |

## Examples

### Query the cache entries of a tablet

```sql
SELECT *
FROM information_schema.file_cache_info
WHERE TABLET_ID = 1761571031445;
```

```text
+----------------------------------+--------+---------------+-------+-------+-------------+------------------------------+---------------+
| HASH                             | OFFSET | TABLET_ID     | SIZE  | TYPE  | REMOTE_PATH | CACHE_PATH                   | BE_ID         |
+----------------------------------+--------+---------------+-------+-------+-------------+------------------------------+---------------+
| 468448215c52334ae5bee147259b1027 |      0 | 1761571031445 | 15120 | index |             | /mnt/disk1/project/filecache | 1761571031251 |
| 71bb73d34cd8ffe280b16dd329df5ba1 |  15120 | 1761571031445 | 13117 | index |             | /mnt/disk1/project/filecache | 1761571031251 |
| 77c6b69d1a7c4fe740a11bab5c1bbaa3 |  28237 | 1761571031445 | 12249 | index |             | /mnt/disk1/project/filecache | 1761571031251 |
+----------------------------------+--------+---------------+-------+-------+-------------+------------------------------+---------------+
```

### Summarize cache usage

The following query summarizes the cache space occupied by a tablet on each BE and for each cache type:

```sql
SELECT BE_ID, TABLET_ID, TYPE, SUM(SIZE) AS CACHE_BYTES
FROM information_schema.file_cache_info
WHERE TABLET_ID = 1761571031445
GROUP BY BE_ID, TABLET_ID, TYPE
ORDER BY CACHE_BYTES DESC;
```

```text
+---------------+---------------+-------+-------------+
| BE_ID         | TABLET_ID     | TYPE  | CACHE_BYTES |
+---------------+---------------+-------+-------------+
| 1761571031251 | 1761571031445 | index |       40486 |
+---------------+---------------+-------+-------------+
```
