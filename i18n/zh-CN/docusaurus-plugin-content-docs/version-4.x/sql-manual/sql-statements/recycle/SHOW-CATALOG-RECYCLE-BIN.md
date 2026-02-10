---
{
    "title": "SHOW CATALOG RECYCLE BIN",
    "language": "zh-CN",
    "description": "该语句用于展示回收站中可回收的库、表或分区元数据信息。"
}
---

## 描述

该语句用于展示回收站中可回收的库、表或分区元数据信息。

## 语法

```sql
SHOW CATALOG RECYCLE BIN [ WHERE NAME [ = "<name>" | LIKE "<name_matcher>"] ]
```

## 可选参数

通过名称过滤

**1. `<name>`**
> 库、表或分区名称。

通过模式匹配过滤

**1. `<name_matcher>`**
> 库、表或分区名称的模式匹配。

## 返回值

| 列名 | 类型       | 说明                                                                                                      |
|----|----------|---------------------------------------------------------------------------------------------------------|
| Type   | String   | 元数据类型：Database、Table、Partition                                                                         |
| Name   | String   | 元数据名称                                                                                                   |
| DbId   | Bigint   | database 对应的 id                                                                                           |
| TableId   | Bigint   | table 对应的 id                                                                                              |
| PartitionId   | Bigint   | table 对应的 id                                                                                              |
| DropTime   | DateTime | 元数据放入回收站的时间                                                                                             |
| DataSize   | Bigint   | 数据量。如果元数据类型是 database, 该值包含了 database 下在回收站中的所有 table 和 partition 的数据量                                         |
| RemoteDataSize   | Decimal  | 远端存储 (hdfs 或对象存储) 的数据量。如果元数据类型是 database, 该值包含了 database 下在回收站中的所有 table 和 partition 的 remote storage 数据量 |

## 权限控制

| 权限         | 对象 | 说明 |
|------------|----|----|
| ADMIN_PRIV |    |    |


## 示例

 1. 展示所有回收站元数据
    
      ```sql
       SHOW CATALOG RECYCLE BIN;
      ```

 2. 展示回收站中名称'test'的元数据
    
      ```sql
       SHOW CATALOG RECYCLE BIN WHERE NAME = 'test';
      ```

2. 展示回收站中名称以 'test' 开头的元数据

     ```sql
      SHOW CATALOG RECYCLE BIN WHERE NAME LIKE 'test%';
     ```
