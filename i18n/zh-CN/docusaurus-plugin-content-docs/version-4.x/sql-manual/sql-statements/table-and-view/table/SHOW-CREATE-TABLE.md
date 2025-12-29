---
{
    "title": "SHOW-CREATE-TABLE",
    "language": "zh-CN",
    "description": "该语句用于展示数据表的创建语句。"
}
---

## 描述

该语句用于展示数据表的创建语句。

## 语法

```sql
SHOW [BRIEF] CREATE TABLE [<db_name>.]<table_name>
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
**1.`BRIEF`**
> 仅显示表的基本信息，不包括列的定义。

**2.`<db_name>`**
> 指定数据库的标识符（即名称）。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My Database`）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅标识符要求和保留关键字。

## 返回值
| 列名 | 说明   |
| -- |------|
| Table | 表名   |
| Create Table | 建表语句 |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| Select_priv        | 表（Table）    | SHOW CREATE TABLE 属于表 SELECT 操作 |


## 示例

1. 查看某个表的建表语句

   ```sql
   SHOW CREATE TABLE demo.test_table;
   ```
2. 查看某个表的简化建表语句

   ```sql
   SHOW BRIEF CREATE TABLE demo.test_table;
   ```
