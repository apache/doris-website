---
{
    "title": "SYNC",
    "language": "en",
    "description": "This statement is used to synchronize metadata for non-master Frontend (FE) nodes. In Apache Doris, only the master FE node can write metadata,"
}
---

## Description

This statement is used to synchronize metadata for non-master Frontend (FE) nodes. In Apache Doris, only the master FE node can write metadata, while other FE nodes forward metadata write operations to the master. After the master completes the metadata writing operation, non-master nodes may experience a short delay in replaying the metadata. You can use this statement to force synchronization of metadata.

## Syntax

```sql
SYNC;
```

## Access Control Requirements  

Any user or role can perform this operation.


## Examples

Synchronize metadata:

    ```sql
    SYNC;
    ```