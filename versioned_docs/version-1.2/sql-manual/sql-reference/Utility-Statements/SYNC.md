---
{
    "title": "SYNC",
    "language": "en"
}
---

## SYNC

### Name

SYNC

### Description

Used to synchronize metadata for fe non-master nodes. doris only master node can write fe metadata, other fe nodes write metadata operations will be forwarded to master. After master finishes metadata writing operation, there will be a short delay for non-master nodes to replay metadata, you can use this statement to synchronize metadata.

grammar:

```sql
SYNC;
```

### Example

1. Synchronized metadata:

    ```sql
    SYNC;
    ```

### Keywords

    SYNC

### Best Practice

