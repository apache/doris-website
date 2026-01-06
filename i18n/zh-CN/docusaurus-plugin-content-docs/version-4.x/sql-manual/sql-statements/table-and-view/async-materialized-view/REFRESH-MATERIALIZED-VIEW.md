---
{
    "title": "REFRESH MATERIALIZED VIEW",
    "language": "zh-CN",
    "description": "该语句用于手动刷新指定的异步物化视图"
}
---

## 描述

该语句用于手动刷新指定的异步物化视图

## 语法

```sql
REFRESH MATERIALIZED VIEW <mv_name> <refresh_type>
```

其中：
```sql
refresh_type
  : { <partitionSpec> | COMPLETE | AUTO }
```

```sql
partitionSpec
  : PARTITIONS (<partition_name> [, <partition_name> [, ... ] ])
```

## 必选参数
**1. `<mv_name>`**

> 指定物化视图的名字。
>
> 物化视图的名字必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个名字串用反引号括起来（例如`My Object`）。
>
> 物化视图的名字不能使用保留关键字。
>
> 有关更多详细信息，请参阅保留关键字。

**2. `<refresh_type>`**

> 指定物化视图的刷新方式。
>
> 其刷新方式可以是`COMPLETE`， `AUTO`， `partitionSpec` 三种之一

## 可选参数
**1. `<partition_name>`**
> 指定要刷新分区的分区名称
>

## 权限控制
执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege）  | 对象（Object） | 说明（Notes）                                        |
| :--------- | :----- | :------------------------------------------- |
| ALTER_PRIV | 物化视图  | REFRESH 属于物化视图的 ALTER 操作 |

## 注意事项
- AUTO：会计算物化视图的哪些分区和基表不同步（目前，如果基表是外表，会被认为始终和物化视图同步，因此如果基表是外表，需要指定`COMPLETE`或指定要刷新的分区），然后刷新对应的分区
- COMPLETE：会强制刷新物化视图的所有分区，不会判断分区是否和基表同步
- partitionSpec：会强制刷新指定的分区，不会判断分区是否和基表同步

## 示例


- 刷新物化视图 mv1(自动计算要刷新的分区)

    ```sql
    REFRESH MATERIALIZED VIEW mv1 AUTO;
    ```


- 刷新名字为 p_19950801_19950901 和 p_19950901_19951001 的分区

    ```sql
    REFRESH MATERIALIZED VIEW mv1 partitions(p_19950801_19950901,p_19950901_19951001);
    ```
 

- 强制刷新物化视图全部数据

    ```sql
    REFRESH MATERIALIZED VIEW mv1 complete;
    ```
