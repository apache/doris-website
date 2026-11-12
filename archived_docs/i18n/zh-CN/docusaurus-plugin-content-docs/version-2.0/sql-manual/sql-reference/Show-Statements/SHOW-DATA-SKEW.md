---
{
"title": "SHOW-DATA-SKEW",
"language": "zh-CN"
}
---

## SHOW-DATA-SKEW

### Name

SHOW DATA SKEW

## 描述

    该语句用于查看表或某个分区的数据倾斜情况。

    语法：

        SHOW DATA SKEW FROM [db_name.]tbl_name PARTITION (partition_name);

    说明：

        1. 必须指定且仅指定一个分区。对于非分区表，分区名称同表名。
        2. 结果将展示指定分区下，各个分桶的数据行数，数据量，以及每个分桶数据量在总数据量中的占比。

## 举例

    1. 查看表的数据倾斜情况

        SHOW DATA SKEW FROM db1.test PARTITION(p1);

### Keywords

    SHOW,DATA,SKEW

### Best Practice
