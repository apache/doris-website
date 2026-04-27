---
{
    "title": "CANCEL-ALTER-TABLE",
    "language": "zh-CN",
    "description": "该语句用于取消（撤销）一个正在执行的 ALTER TABLE 操作。当一个 ALTER TABLE 操作正在执行时，您可以使用此命令来终止该操作。"
}
---

## 描述

该语句用于取消（撤销）一个正在执行的 ALTER TABLE 操作。当一个 ALTER TABLE 操作正在执行时，您可以使用此命令来终止该操作。

## 语法

```sql
CANCEL ALTER TABLE { COLUMN | MATERIALIZED VIEW | ROLLUP } FROM <db_name>.<table_name> [ <job_id1> [ , <job_id2> ... ]]
```

## 必选参数
**1. `{ COLUMN | MATERIALIZED VIEW | ROLLUP }`**
>指定要取消的修改类型，必须选择其中一个
>- `COLUMN`：取消对表列的修改操作
>- `ROLLUP`：取消对视图的修改操作
>- `MATERIALIZED VIEW`: 取消对物化视图的修改操作

**2.`<db_name>`**
> 指定数据库的标识符（即名称）。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My Database`）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅标识符要求和保留关键字。

**3.`<table_name>`**
> 指定表的标识符（即名称），在其所在的数据库（Database）中必须唯一。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My Object`）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅标识符要求和保留关键字。

## 可选参数
**1. `<job_id>`**
> 要取消的具体作业 ID。
>
> 如果指定了作业 ID，则只取消指定的作业；如果不指定，则取消该表上所有正在执行的指定类型（COLUMN 或 ROLLUP）的修改操作。
>
> 可以指定多个作业 ID，用逗号分隔。
>
> 作业 ID 可以通过 `SHOW ALTER TABLE COLUMN` 或 `SHOW ALTER TABLE ROLLUP` 命令查看。


## 权限控制
执行此 SQL 命令的用户必须至少具有以下权限：


| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| ALTER_PRIV        | 表（Table）    | CANCEL ALTER TABLE 属于表 ALTER 操作 |


## 注意事项
- 该命令为异步操作，具体是否执行成功需要使用`SHOW ALTER TABLE COLUMN` 或 `SHOW ALTER TABLE ROLLUP`查看任务状态确认

## 示例

1. 撤销 ALTER TABLE COLUMN 操作

```sql
CANCEL ALTER TABLE COLUMN
FROM db_name.table_name
```

2. 撤销 ALTER TABLE ROLLUP 操作


```sql
CANCEL ALTER TABLE ROLLUP
FROM db_name.table_name
```

3. 根据 job id 批量撤销 rollup 操作


```sql
CANCEL ALTER TABLE ROLLUP
FROM db_name.table_name (jobid,...)
```


4. 撤销 ALTER CLUSTER 操作

```sql
（待实现...）
```
