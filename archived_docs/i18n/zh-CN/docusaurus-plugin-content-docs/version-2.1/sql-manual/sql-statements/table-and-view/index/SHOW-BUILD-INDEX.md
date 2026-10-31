---
{
    "title": "SHOW BUILD INDEX",
    "language": "zh-CN",
    "description": "查看索引构建任务的状态。"
}
---

## 描述

查看索引构建任务的状态。

## 语法

```sql
SHOW BUILD INDEX [ (FROM | IN) <database_name>
[ where_clause ] [ sort_clause ] [ limit_clause ] ] 
```

其中：

```sql
where_clause
  : WHERE <output_column_name = value>
```

其中：

```sql
sort_clause
  :
   ORDER BY <output_column_name>
```

其中：

```sql
limit_clause
  :
   LIMIT <n>
```

## 可选参数（Optional Parameters）

1. `<database_name>`

    > 指定数据库的标识符（即名称），在其所在的集群（Cluster）中必须唯一。
    >
    > 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My Object`）。
    >
    > 标识符不能使用保留关键字。
    >
    > 有关更多详细信息，请参阅标识符要求和保留关键字。

2. `<WHERE output_column_name = value>`

    > 指定输出过滤条件，output_column_name 必须在输出的字段列表中。

3. `<ORDER BY output_column_name>`

    > 指定输出排序列，output_column_name 必须在输出的字段列表中。

4. `LIMIT <n>`

    > 指定输出行数限制，n 必须是数字。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object）     | 说明（Notes） |
| :---------------- | :----------------- | :------------ |
| SHOW_PRIV         | 数据库（Database） |               |

## 注意事项

- 目前只对倒排索引生效，其他索引如 bloomfilter index 不生效。

- 目前只对存算一体模式生效，存算分离模式不生效。

## 示例（Examples）

- 查看所有索引构建任务

    ```sql
    SHOW BUILD INDEX
    ```

- 查看数据库 database1 的索引构建任务

    ```sql
    SHOW BUILD INDEX FROM database1
    ```

- 查看数据库 table1 的索引构建任务

    ```sql
    SHOW BUILD INDEX WHERE TableName = 'table1'
    ```

- 查看数据库 table1 的索引构建任务，并按照输出的 JobId 排序取前 10 行

    ```sql
    SHOW BUILD INDEX WHERE TableName = 'table1' ORDER BY JobId LIMIT 10
    ```

