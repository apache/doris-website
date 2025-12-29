---
{
    "title": "CANCEL BUILD INDEX",
    "language": "zh-CN",
    "description": "取消索引构建的后台任务。"
}
---

## 描述

取消索引构建的后台任务。

## 语法

```sql
CANCEL BUILD INDEX ON <table_name> [ job_list ]
```

其中：

```sql
job_list
  : (<job_id1>[ , job_id2 ][ ... ])
```

## 必选参数

**1. `<table_name>`**

> 指定表的标识符（即名称），在其所在的数据库（Database）中必须唯一。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My Object`）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅标识符要求和保留关键字。

## 可选参数

**1. `<job_list>`**

> 指定索引构建任务的标识符列表，以括号包围的逗号分割。
>
> 标识符必须是数字，可以通过 SHOW BUILD INDEX 查看。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                        |
| :---------------- | :------------- | :----------------------------------- |
| ALTER_PRIV        | 表（Table）    | CANCEL BUILD INDEX 属于表 ALTER 操作 |

## 注意事项

- 目前只对倒排索引生效，其他索引如 bloomfilter index 不生效。
- 目前只对存算一体模式生效，存算分离模式不生效。
- BUILD INDEX 的进度和索引构建任务可以通过 SHOW BUILD INDEX 查看

## 示例

- 取消表 table1 上的所有索引构建任务

    ```sql
    CANCEL BUILD INDEX ON TABLE table1
    ```

- 取消表 table1 上的索引构建任务 jobid1 和 jobid2

    ```sql
    CANCEL BUILD INDEX ON TABLE table1(jobid1, jobid2)
    ```
