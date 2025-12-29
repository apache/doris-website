---
{
    "title": "SHOW CREATE FUNCTION",
    "language": "zh-CN",
    "description": "该语句用于展示用户自定义函数的创建语句"
}
---

## 描述

该语句用于展示用户自定义函数的创建语句

## 语法

```sql
SHOW CREATE [ GLOBAL ] FUNCTION <function_name>( <arg_type> ) [ FROM <db_name> ];
```

## 必选参数

**1. `<function_name>`**

> 需要查询创建语句的自定义函数的名称。

**2. `<arg_type>`**

> 需要查询创建语句的自定义函数的参数列表。
>
> 参数列表对应位置需要填写对应位置参数的数据类型

## 可选参数

**1.`GLOBAL`**

> GLOBAL 为选填项
>
> 若填写 GLOBAL 则为全局搜索该函数
>
> 若不填写 GLOABL 则只在当前数据库下搜索该函数

**2.`<db_name>`**

> FROM db_name 表示从指定的数据库中查询该自定义函数

## 返回值

| 列名 | 说明          |
| -- |-------------|
| SYMBOL | 函数包名        |
| FILE | jar 包路径     |
| ALWAYS_NULLABLE | 结果是否可以为 NULL |
| TYPE | 函数类型        |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）     |
|:--------------|:-----------|:--------------|
| SHOW_PRIV     | 函数  | 需要对该函数有 show 权限 |

## 示例

```sql
SHOW CREATE FUNCTION add_one(INT)
```

```text
| Function Signature | Create Function
+--------------------+-------------------------------------------------------
| add_one(INT)       | CREATE FUNCTION add_one(INT) RETURNS INT PROPERTIES (
  "SYMBOL"="org.apache.doris.udf.AddOne",
  "FILE"="file:///xxx.jar",
  "ALWAYS_NULLABLE"="true",
  "TYPE"="JAVA_UDF"
  ); |
+--------------------+-------------------------------------------------------
```