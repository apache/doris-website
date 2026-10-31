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

该语句用于展示分区信息

语法：

```SQL
 SHOW [TEMPORARY] PARTITIONS FROM [db_name.]table_name [WHERE] [ORDER BY] [LIMIT];
```

说明:

1. 支持PartitionId,PartitionName,State,Buckets,ReplicationNum,LastConsistencyCheckTime等列的过滤
2. TEMPORARY指定列出临时分区

## 举例

1. 展示指定db下指定表的所有非临时分区信息

    ```SQL
    SHOW PARTITIONS FROM example_db.table_name;
    ```

2. 展示指定db下指定表的所有临时分区信

    ```SQL
    SHOW TEMPORARY PARTITIONS FROM example_db.table_name;
    ```

3. 展示指定db下指定表的指定非临时分区的信息

    ```SQL
     SHOW PARTITIONS FROM example_db.table_name WHERE PartitionName = "p1";
    ```

4. 展示指定db下指定表的最新非临时分区的信息

    ```SQL
    SHOW PARTITIONS FROM example_db.table_name ORDER BY PartitionId DESC LIMIT 1;
    ```

### Keywords

    SHOW, PARTITIONS

### Best Practice

