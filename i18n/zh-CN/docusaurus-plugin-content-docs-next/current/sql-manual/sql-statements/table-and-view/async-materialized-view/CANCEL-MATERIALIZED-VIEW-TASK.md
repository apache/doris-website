---
{
    "title": "CANCEL MATERIALIZED VIEW TASK",
    "language": "zh-CN",
    "description": "该语句用于取消物化视图的 task"
}
---

## 描述

该语句用于取消物化视图的 task

## 语法

```sql
CANCEL MATERIALIZED VIEW TASK <task_id> ON <mv_name>
```

## 必选参数
**1. `<task_id>`**

> 指定物化视图创建 job 的 task id。


**2. `<mv_name>`**

> 指定物化视图的名字。
>
> 物化视图的名字必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个名字串用反引号括起来（例如`My Object`）。
>
> 物化视图的名字不能使用保留关键字。
>
> 有关更多详细信息，请参阅保留关键字。

## 权限控制
执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege）  | 对象（Object） | 说明（Notes）                                        |
| :--------- | :----- | :------------------------------------------- |
| ALTER_PRIV | 物化视图  | CANCEL 属于物化视图的 ALTER 操作 |


## 示例

- 取消物化视图 mv1 的 id 为 1 的 task

    ```sql
    CANCEL MATERIALIZED VIEW TASK 1 on mv1;
    ```

