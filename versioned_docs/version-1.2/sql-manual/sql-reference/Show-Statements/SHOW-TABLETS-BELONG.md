---
{
    "title": "SHOW-TABLETS-BELONG",
    "language": "en"
}
---

<version since="dev">

## SHOW-TABLETS-BELONG

</version>

### Name

SHOW TABLETS BELONG

### Description

Used to show tablets and information of their belonging table

grammar：

```sql
SHOW TABLETS BELONG tablet-ids;
```

illustrate：

1. tablet-ids：one or more tablet-ids, with comma separated
2. Columns of result keep same with result of `SHOW-DATA` for the same table

### Example

1. show information of four tablet-ids (actually, three tablet-ids. Result will be deduplicated)

    ```sql
    SHOW TABLETS BELONG 27028,78880,78382,27028;
    ```

    ```
+---------------------+-----------+-----------+--------------+-----------+--------------+----------------+
| DbName              | TableName | TableSize | PartitionNum | BucketNum | ReplicaCount | TabletIds      |
+---------------------+-----------+-----------+--------------+-----------+--------------+----------------+
| default_cluster:db1 | kec       | 613.000 B | 379          | 604       | 604          | [78880, 78382] |
| default_cluster:db1 | test      | 1.874 KB  | 1            | 1         | 1            | [27028]        |
+---------------------+-----------+-----------+--------------+-----------+--------------+----------------+
    ```

### Keywords

    SHOW, TABLETS, BELONG

### Best Practice

