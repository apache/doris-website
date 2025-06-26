---
{
    "title": "SHOW-PARTITIONS",
    "language": "zh-CN"
}
---

## SHOW-PARTITIONS

### Name

SHOW PARTITIONS

## 描述

该语句用于展示分区信息。支持 Internal catalog 和 Hive Catalog

语法：

```SQL
 SHOW [TEMPORARY] PARTITIONS FROM [db_name.]table_name [WHERE] [ORDER BY] [LIMIT];
```

说明：

对于 Internal catalog：
1. 支持 PartitionId,PartitionName,State,Buckets,ReplicationNum,LastConsistencyCheckTime 等列的过滤
2. TEMPORARY 指定列出临时分区



对于 Hive Catalog：
支持返回所有分区，包括多级分区



## 举例

1. 展示指定 db 下指定表的所有非临时分区信息

    ```SQL
    SHOW PARTITIONS FROM example_db.table_name;
    ```

2. 展示指定 db 下指定表的所有临时分区信

    ```SQL
    SHOW TEMPORARY PARTITIONS FROM example_db.table_name;
    ```

3. 展示指定 db 下指定表的指定非临时分区的信息

    ```SQL
     SHOW PARTITIONS FROM example_db.table_name WHERE PartitionName = "p1";
    ```

4. 展示指定 db 下指定表的最新非临时分区的信息

    ```SQL
    SHOW PARTITIONS FROM example_db.table_name ORDER BY PartitionId DESC LIMIT 1;
    ```

### Keywords

    SHOW, PARTITIONS

### Best Practice

