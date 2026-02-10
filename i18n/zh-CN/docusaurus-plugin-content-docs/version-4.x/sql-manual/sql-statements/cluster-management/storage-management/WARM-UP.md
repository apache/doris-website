---
{
    "title": "WARM UP",
    "language": "zh_CN",
    "description": "WARM UP COMPUTE GROUP 语句用于预热计算组中的数据，以提高查询性能。预热操作可以从另一个计算组中获取资源，也可以指定特定的表和分区进行预热。预热操作返回一个作业 ID，可以用于追踪预热作业的状态。"
}
---

## 描述

WARM UP COMPUTE GROUP 语句用于预热计算组中的数据，以提高查询性能。预热操作可以从另一个计算组中获取资源，也可以指定特定的表和分区进行预热。预热操作返回一个作业 ID，可以用于追踪预热作业的状态。

> 关于如何针对 Catalog 查询场景下预热缓存，请参阅 [Data Cache 文档](../../../../lakehouse/data-cache.md)。

## 语法

```sql
WARM UP COMPUTE GROUP <destination_compute_group_name> WITH COMPUTE GROUP <source_compute_group_name> FORCE;
```
```sql
WARM UP COMPUTE GROUP <destination_compute_group_name> WITH <warm_up_list>;
```
```sql
warm_up_list ::= warm_up_item [AND warm_up_item...];
```
```sql
warm_up_item ::= TABLE <table_name> [PARTITION <partition_name>];

```
## 参数

| 参数                  | 描说明述                                                         |
|---------------------------|--------------------------------------------------------------|
| destination_compute_group_name | 要预热的目标计算组的名称。                                   |
| source_compute_group_name  | 从中获取资源的源集群的名称。                                 |
| warm_up_list              | 要预热的特定项目的列表，可以包括表和分区。                   |
| table_name                | 用于预热的表的名称。                                         |
| partition_name            | 用于预热的分区的名称。                                       |

## 返回值

* JobId: 预热作业的 ID。

## 示例

1. 使用名为 source_group_name 的计算组预热名为 destination_group_name 的计算组。

```sql
   WARM UP COMPUTE GROUP destination_group_name WITH COMPUTE GROUP source_group_name;
```

2. 使用名为 destination_group 的计算组预热表 sales_data 和 customer_info 以及表 orders 的分区 q1_2024。

```sql
    WARM UP COMPUTE GROUP destination_group WITH 
        TABLE sales_data 
        AND TABLE customer_info 
        AND TABLE orders PARTITION q1_2024;

```

