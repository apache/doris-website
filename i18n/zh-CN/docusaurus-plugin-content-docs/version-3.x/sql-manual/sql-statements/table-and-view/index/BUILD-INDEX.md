---
{
    "title": "BUILD INDEX",
    "language": "zh-CN",
    "description": "为整个表或者表的分区构建索引，必须指定表名和索引名，可选指定分区列表。"
}
---

## 描述

为整个表或者表的分区构建索引，必须指定表名和索引名，可选指定分区列表。

## 语法

```sql
BUILD INDEX <index_name> ON <table_name> [partition_list]
```

其中：

```sql
partition_list
  : PARTITION (<partition_name1>[ , parition_name2 ][ ... ])
```

## 必选参数

**1. `<index_name>`**

> 指定索引的标识符（即名称），在其所在的表（Table）中必须唯一。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My Object`）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅标识符要求和保留关键字。

**2. `<table_name>`**

> 指定表的标识符（即名称），在其所在的数据库（Database）中必须唯一。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My Object`）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅标识符要求和保留关键字。

## 可选参数

**1.`<partition_list>`**

> 指定分区的标识符（即名称）列表，以逗号分割，在其所在的表（Table）中必须唯一。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My Object`）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅标识符要求和保留关键字。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| ALTER_PRIV        | 表（Table）    | BUILD INDEX 属于表 ALTER 操作 |

## 注意事项

- 目前只对倒排索引生效，其他索引如 bloomfilter index 不生效。

- 目前只对存算一体模式生效，存算分离模式不生效。

- BUILD INDEX 的进度可以通过 SHOW BUILD INDEX 查看

## 示例

- 在 table1 整个表上构建索引 index1

    ```sql
    BUILD INDEX index1 ON table1
    ```

- 在 table1 的分区 p1 和 p2 上构建索引 index1

    ```sql
    BUILD INDEX index1 ON table1 PARTITION(p1, p2)
    ```

