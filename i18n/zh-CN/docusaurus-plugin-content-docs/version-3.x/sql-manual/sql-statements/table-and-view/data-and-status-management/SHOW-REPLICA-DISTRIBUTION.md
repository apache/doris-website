---
{
    "title": "SHOW REPLICA DISTRIBUTION",
    "language": "zh-CN",
    "description": "该语句用于展示一个表或分区副本分布状态"
}
---

## 描述

该语句用于展示一个表或分区副本分布状态

## 语法

```sql
SHOW REPLICA DISTRIBUTION FROM [ <database_name>.]<table_name> [<partition_list>] 
[where_clause]
```

其中：

```sql
partition_list
  : PARTITION (<partition_name>[ , ... ])
```

其中：

```sql
where_clause
: WHERE <output_column_name> = <value>
```

## 必选参数

**1. `<table_name>`**

> 指定表的标识符（即名称），在其所在的数据库（Database）中必须唯一。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如 My Object）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅标识符要求和保留关键字。

## 可选参数

**1. `<db_name>`**

> 指定数据库的标识符（即名称），在其所在的集群（Cluster）中必须唯一。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如 My Object）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅标识符要求和保留关键字。

**2. `<partition_list>`**

> 指定分区的标识符（即名称）列表，以逗号分割，在其所在的表（Table）中必须唯一。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My Object`）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅标识符要求和保留关键字。


## 返回值

| 列名          | 类型     | 说明                             |
|-------------|--------|--------------------------------|
| BackendId   | Int    | BE（Backend）节点的 ID，表示该副本所在的节点。  |
| ReplicaNum  | Int    | 该 BE 节点上的副本数量。                 |
| ReplicaSize | Int    | 该 BE 节点上所有副本占用的存储大小（单位：bytes）。 |
| NumGraph    | String | 以可视化方式（> 符号）表示副本数量的比例。         |
| NumPercent  | String | 以百分比表示副本数量的占比，例如 100.00%。      |
| SizeGraph   | String | 以可视化方式（> 符号）表示副本存储大小的比例。       |
| SizePercent | String | 以百分比表示副本存储大小的占比，例如 100.00%。    |



## 示例

- 查看表的副本分布

  ```sql
  SHOW REPLICA DISTRIBUTION FROM sell_user;
  ```

  ```text
  *************************** 1. row ***************************
  BackendId: 10009
   ReplicaNum: 4
  ReplicaSize: 8857
     NumGraph: >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
   NumPercent: 100.00%
    SizeGraph: >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  SizePercent: 100.00%
  ```

- 查看表的分区的副本分布

  ```sql
  SHOW REPLICA DISTRIBUTION FROM db1.tbl1 PARTITION(p1, p2);
  ```


