---
{
    "title": "SHOW-TABLETS-BELONG",
    "language": "zh-CN"
}
---

<version since="dev">

## SHOW-TABLETS-BELONG

</version>

### Name

SHOW TABLETS BELONG

## 描述

该语句用于展示指定Tablets归属的表的信息

语法：

```sql
SHOW TABLETS BELONG tablet-ids;
```

说明：

1. tablet-ids：代表一到多个tablet-id构成的列表。如有多个，使用逗号分隔
2. 结果中 table 相关的信息和 `SHOW-DATA` 语句的口径一致

## 举例

1. 展示3个tablet-id的相关信息（tablet-id可去重）

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

