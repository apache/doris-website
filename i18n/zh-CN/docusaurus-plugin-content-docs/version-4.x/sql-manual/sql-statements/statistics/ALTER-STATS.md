---
{
    "title": "ALTER STATS",
    "language": "zh-CN",
    "description": "手动修改指定表中指定列的统计信息。请参阅统计信息章节"
}
---

## 描述

手动修改指定表中指定列的统计信息。请参阅[统计信息](../../../query-acceleration/optimization-technology-principle/statistics)章节

## 语法

```sql
ALTER TABLE <table_name>
  [ INDEX <index_name> ]
  MODIFY COLUMN <column_name>
  SET STATS (<column_stats>)
```

其中：

```sql
column_stats
  : -- column stats value
  ("key1" = "value1", "key2" = "value2" [...])
```

## 必选参数

1. `<table_name>`: 指定表的标识符（即名称）

2. `<column_name>`: 指定列标识符（即名称）。在不指定 index_name 的情况下，就是基表的列名称。

3. `<column_stats>` :

    要设置的统计信息值，以 key = value 的形式给出，key 和 value 需要用引号包裹，kv 对之间用逗号分隔。可以设置的统计信息包括：
    
    - row_count，总行数

    - ndv，列的基数
    
    - num_nulls，列的空值数量
    
    - data_size，列的总大小
    
    - min_value，列的最小值
    
    - max_value，列的最大值
    
    其中 row_count 是必须指定的，其他属性为可选项。如果不设置，该列的对应统计信息属性值就为空。

## 可选参数

1. `<index_name> `: 同步物化视图（请参阅“同步物化视图”章节）标识符（即名称）。一张表可以创建 0 到多个物化视图，如果需要设置某个物化视图中某一列的统计信息，需要使用 index_name 来制定物化视图的名称。不指定的情况下，设定的是基表中列的属性。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :---------------- | :------------- | :------------ |
| ALTER_PRIV        | 表（Table）    |               |

## 注意事项

用户手动对某张表注入统计信息后，这张表就不再参与统计信息的自动收集（请参阅“统计信息自动收集”章节），以免覆盖用户手动注入的信息。如果不再使用注入的统计信息，可以使用 drop stats 语句删掉已经注入的信息，这样可以让该表重新开启自动收集。

## 示例

- 给 Part 表的 p_parkey 列（基表列，因为没有指定 index_name）注入统计信息。

    ```sql
    alter 
        table part
        modify column p_partkey 
        set stats ('row_count'='2.0E7', 'ndv'='2.0252576E7', 'num_nulls'='0.0', 'data_size'='8.0E7', 'min_value'='1', 'max_value'='20000000');
    ```

- 给 Part 表的 index1 物化视图的 col1 列（物化视图列，因为指定了 index_name）注入统计信息。

    ```sql
    alter 
        table part index index1
        modify column col1 
        set stats ('row_count'='2.0E7', 'ndv'='2.0252576E7', 'num_nulls'='0.0', 'data_size'='8.0E7', 'min_value'='1', 'max_value'='20000000');
    ```
