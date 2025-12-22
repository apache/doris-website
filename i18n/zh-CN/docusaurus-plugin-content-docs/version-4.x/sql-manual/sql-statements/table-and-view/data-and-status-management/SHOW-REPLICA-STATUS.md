---
{
    "title": "SHOW REPLICA STATUS",
    "language": "zh-CN",
    "description": "该语句用于展示一个表或分区的副本状态信息。"
}
---

## 描述

该语句用于展示一个表或分区的副本状态信息。

## 语法

```sql
SHOW REPLICA STATUS FROM [ <database_name>.]<table_name> [<partition_list>] 
[where_clause]
```
其中：

```sql
partition_list
  : PARTITION (<partition_name>[ , ... ])
```

其中：

```sql
where_clause
: WHERE <output_column_name> = <value>
```

## 必选参数

**1. `<table_name>`**

> 指定表的标识符（即名称），在其所在的数据库（Database）中必须唯一。
> 
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如 My Object）。
> 
> 标识符不能使用保留关键字。
> 
> 有关更多详细信息，请参阅标识符要求和保留关键字。


## 可选参数

**1. `<db_name>`**

> 指定数据库的标识符（即名称），在其所在的集群（Cluster）中必须唯一。
> 
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如 My Object）。
> 
> 标识符不能使用保留关键字。
> 
> 有关更多详细信息，请参阅标识符要求和保留关键字。

**2. `<partition_list>`**

> 指定分区的标识符（即名称）列表，以逗号分割，在其所在的表（Table）中必须唯一。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My Object`）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅标识符要求和保留关键字。

**3. `WHERE <output_column_name> = <value>`**

> 指定输出过滤条件，output_column_name 必须在输出的字段列表中。
>
> 当 `output_column_name` 为 `STATUS` 时
> 
> `value` 可选值如下
>   - OK:             replica 处于健康状态
>   - DEAD:           replica 所在 Backend 不可用
>   - VERSION_ERROR:  replica 数据版本有缺失
>   - SCHEMA_ERROR:   replica 的 schema hash 不正确
>   - MISSING:        replica 不存在

## 返回值

| 列名                 | 类型      | 说明                       |
|--------------------|---------|--------------------------|
| TabletId           | Int     | tablet 的唯一标识符。           |
| ReplicaId          | Int     | 副本的唯一标识符。                |
| BackendId          | Int     | 副本所在的 BE（Backend）节点的 ID。 |
| Version            | Int     | 副本的当前版本号。                |
| LastFailedVersion  | Int     | 副本最后失败的版本号，-1 表示没有失败。    |
| LastSuccessVersion | Int     | 副本最后成功的版本号。              |
| CommittedVersion   | Int     | 副本的提交版本号。                |
| SchemaHash         | Int     | 副本的 schema 哈希值。          |
| VersionNum         | Int     | 副本的版本数量。                 |
| IsBad              | Boolean | 指示副本是否处于坏状态（true/false）。 |
| IsUserDrop         | Boolean | 指示副本是否被标记为用户删除。          |
| State              | String  | 副本的当前状态（例如：NORMAL）。      |
| Status             | String  | 副本的健康状态（例如：OK）。          |

## 权限控制

执行此 SQL 命令的用户必须至少拥有以下权限：

| 权限         | 对象       | 说明                                 |
|:-----------|:---------|:-----------------------------------|
| Admin_priv | Database | 执行数据库管理操作所需的权限，包括管理表、分区以及系统级命令等操作。 |

## 示例

- 查看表全部的副本状态

  ```sql
  SHOW REPLICA STATUS FROM db1.tbl1;
  ```

  ```text
  +----------+-----------+-----------+---------+-------------------+--------------------+------------------+------------+------------+-------+------------+--------+--------+
  | TabletId | ReplicaId | BackendId | Version | LastFailedVersion | LastSuccessVersion | CommittedVersion | SchemaHash | VersionNum | IsBad | IsUserDrop | State  | Status |
  +----------+-----------+-----------+---------+-------------------+--------------------+------------------+------------+------------+-------+------------+--------+--------+
  | 10145    | 10146     | 10009     | 14      | -1                | 14                 | 14               | 182881783  | 1          | false | false      | NORMAL | OK     |
  | 10147    | 10148     | 10009     | 14      | -1                | 14                 | 14               | 182881783  | 1          | false | false      | NORMAL | OK     |
  | 10149    | 10150     | 10009     | 14      | -1                | 14                 | 14               | 182881783  | 1          | false | false      | NORMAL | OK     |
  | 10151    | 10152     | 10009     | 14      | -1                | 14                 | 14               | 182881783  | 1          | false | false      | NORMAL | OK     |
  +----------+-----------+-----------+---------+-------------------+--------------------+------------------+------------+------------+-------+------------+--------+--------+
  ```
  
- 查看表某个分区状态为 VERSION_ERROR 的副本

  ```sql
  SHOW REPLICA STATUS FROM tbl1 PARTITION (p1, p2)
  WHERE STATUS = "VERSION_ERROR";
  ```

- 查看表所有状态不健康的副本

  ```sql
  SHOW REPLICA STATUS FROM tbl1
  WHERE STATUS != "OK";
  ```
