---
{
    "title": "DROP FUNCTION",
    "language": "zh-CN",
    "description": "删除一个自定义函数。"
}
---

## 描述

删除一个自定义函数。

## 语法

```sql
DROP [ GLOBAL ] <function_name> ( <arg_type> )
```

## 必选参数

**1. `<function_name>`**

> 指定要删除的函数的名字。
>
> 该函数名称需要与建立函数时的函数名称完全一致

**2. `<arg_type>`**

> 指定要删除函数的参数列表。
>
> 参数列表对应位置需要填写对应位置参数的数据类型

## 可选参数

**1.`GLOBAL`**

> GLOBAL 为选填项
>
> 若填写 GLOBAL 则为全局搜索该函数并删除
> 
> 若不填写 GLOABL 则只在当前数据库下搜索该函数并删除

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）    |
|:--------------|:-----------|:-------------|
| ADMIN_PRIV    | 函数（自定义函数）  | DROP 属于管理操作 |


## 注意事项

- 函数的名字、参数类型完全一致才能够被删除

## 示例

```sql
DROP FUNCTION my_add(INT, INT)
```

```sql
DROP GLOBAL FUNCTION my_add(INT, INT)
```


