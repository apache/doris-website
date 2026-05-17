---
{
    "title": "DESCRIBE",
    "language": "zh-CN",
    "description": "该语句用于展示指定 table 的 schema 信息"
}
---

## 描述

该语句用于展示指定 table 的 schema 信息

## 语法

```sql
DESC[RIBE] [<ctl_name>.][<db_name>.]<table_name> [ALL];
```
## 必选参数

**1.`<table_name>`**

> 指定表的标识符（即名称），在其所在的数据库（Database）中必须唯一。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My Object`）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅标识符要求和保留关键字。

## 可选参数

**1.`<ctl_name>.<db_name>`**

> 指定数据目录和数据库的标识符（即名称）。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My Database`）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅标识符要求和保留关键字。

**2.`ALL`**

> 仅针对内表有效。返回内表的所有 Index 信息。 

## 返回值

不指定 `ALL` 的情况下，返回值如下：

| 列名 | 说明           |
| -- |--------------|
| Field | 列名           |
| Type | 数据类型         |
| Null | 是否允许为 NULL 值 |
| Key | 是否为 key 列      |
| Default | 默认值          |
| Extra | 显示一些额外的信息    |

在 3.0.7 版本中，新增会话变量 `show_column_comment_in_describe`。当指定为 `true` 时，将额外增加 `Comment` 列，用于显示列的注释信息。

指定 `ALL` 的情况下，针对内表，返回值如下： 

| 列名 | 说明           |
| -- |--------------|
| IndexName | 表名           |
| IndexKeysType |   表模型           |
| Field | 列名           |
| Type | 数据类型         |
| Null | 是否允许为 NULL 值 |
| Key | 是否为 key 列      |
| Default | 默认值          |
| Extra | 显示一些额外的信息    |
| Visible | 是否可见         |
| DefineExpr |     定义表达式         |
| WhereClause |     过滤条件 相关的定义         |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                                    |
|:--------------| :------------- |:---------------------------------------------|
| SELECT_PRIV   | 表（Table）    | 当执行 DESC 时，需要拥有被查询的表的 SELECT_PRIV 权限 |


## 举例

1. 显示 Base 表 Schema

```sql
DESC test_table;
```
```text
+---------+-------------+------+-------+---------+-------+
| Field   | Type        | Null | Key   | Default | Extra |
+---------+-------------+------+-------+---------+-------+
| user_id | bigint      | No   | true  | NULL    |       |
| name    | varchar(20) | Yes  | false | NULL    | NONE  |
| age     | int         | Yes  | false | NULL    | NONE  |
+---------+-------------+------+-------+---------+-------+
```

```sql
SET show_column_comment_in_describe=true;
DESC test_table;
```
```text
+---------+-------------+------+-------+---------+-------+----------+
| Field   | Type        | Null | Key   | Default | Extra | Comment  |
+---------+-------------+------+-------+---------+-------+----------+
| user_id | bigint      | No   | true  | NULL    |       | Key1     |
| name    | varchar(20) | Yes  | false | NULL    | NONE  | username |
| age     | int         | Yes  | false | NULL    | NONE  | user_age |
+---------+-------------+------+-------+---------+-------+----------+
```

2. 显示表所有 index 的 schema

```sql
DESC demo.test_table ALL;
```

```text
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
| IndexName  | IndexKeysType | Field   | Type        | InternalType | Null | Key   | Default | Extra | Visible | DefineExpr | WhereClause |
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
| test_table | DUP_KEYS      | user_id | bigint      | bigint       | No   | true  | NULL    |       | true    |            |             |
|            |               | name    | varchar(20) | varchar(20)  | Yes  | false | NULL    | NONE  | true    |            |             |
|            |               | age     | int         | int          | Yes  | false | NULL    | NONE  | true    |            |             |
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
```


