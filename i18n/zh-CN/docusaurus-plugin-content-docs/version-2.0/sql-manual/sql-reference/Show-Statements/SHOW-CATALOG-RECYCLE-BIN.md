---
{
    "title": "SHOW-CATALOG-RECYCLE-BIN",
    "language": "zh-CN"
}
---

## SHOW-CATALOG-RECYCLE-BIN

### Name


:::tip 提示
该功能自 Apache Doris  1.2 版本起支持
:::

SHOW CATALOG RECYCLE BIN



## 描述

该语句用于展示回收站中可回收的库，表或分区元数据信息

语法：

```sql
SHOW CATALOG RECYCLE BIN [ WHERE NAME [ = "name" | LIKE "name_matcher"] ]
```

说明：

```
各列含义如下：
        Type：                元数据类型:Database、Table、Partition
        Name：                元数据名称		
        DbId：                database对应的id
        TableId：             table对应的id
        PartitionId：         partition对应的id
        DropTime：            元数据放入回收站的时间
```


## 举例

 1. 展示所有回收站元数据
    
      ```sql
       SHOW CATALOG RECYCLE BIN;
      ```

 2. 展示回收站中名称'test'的元数据
    
      ```sql
       SHOW CATALOG RECYCLE BIN WHERE NAME = 'test';
      ```

### Keywords

    SHOW, CATALOG RECYCLE BIN

### Best Practice

