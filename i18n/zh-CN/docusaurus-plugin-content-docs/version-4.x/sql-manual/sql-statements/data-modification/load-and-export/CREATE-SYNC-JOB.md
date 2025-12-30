---
{
    "title": "CREATE SYNC JOB",
    "language": "zh-CN",
    "description": "数据同步 (Sync Job) 功能支持用户提交一个常驻的数据同步作业，通过从指定的远端地址读取 Binlog 日志，增量同步用户在 MySQL 数据库中数据更新操作的 CDC (Change Data Capture) 信息。"
}
---

## 描述

数据同步 (Sync Job) 功能支持用户提交一个常驻的数据同步作业，通过从指定的远端地址读取 Binlog 日志，增量同步用户在 MySQL 数据库中数据更新操作的 CDC (Change Data Capture) 信息。

用户可通过 [SHOW SYNC JOB](../../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-SYNC-JOB) 查看数据同步作业的状态。

## 语法

```sql
CREATE SYNC [<db>.]<job_name>
(<channel_desc> [, ... ])
<binlog_desc>
```
where:
```sql
channel_desc
  : FROM <mysql_db>.<src_tbl> INTO <des_tbl> [ <columns_mapping> ]
```
```sql
binlog_desc
  : FROM BINLOG ("<key>" = "<value>" [, ... ])
```

## 必选参数

**1. `<job_name>`**

> 同步作业名称，是当前数据库中作业的唯一标识。相同 `<job_name>` 的作业在同一时刻只能有一个在运行。

**2. `<channel_desc>`**

> 用于描述 MySQL 源表到 Doris 目标表之间的映射关系。
>
>
> - **`<mysql_db.src_tbl>`**  
>   指定 MySQL 端的数据库及源表。
>
> - **`<des_tbl>`**  
>   指定 Doris 端的目标表。目标表必须为 Unique 表，并且需开启表的 batch delete 功能（详见 `help alter table` 中的“批量删除功能”）。
>
> - **`<columns_mapping>`** (可选)  
>   指定 MySQL 源表和 Doris 目标表之间的列映射关系。如果不指定，FE 会默认按照列顺序一一对应。  
>   > **注意：** 不支持使用 `col_name = expr` 的形式指定列映射。
>   >
>   > **示例：**
>   > - 假设目标表列为 `(k1, k2, v1)`，可通过调整顺序实现 `(k2, k1, v1)`；
>   > - 或者通过映射忽略源数据中的多余列，例如 `(k2, k1, v1, dummy_column)`。

**3. `<binlog_desc>`**

> 用来描述远端数据源，目前仅支持 Canal 数据源。
>
> 对于 Canal 数据源，相关属性均以 `canal.` 为前缀：
>
> - **`canal.server.ip`**：Canal 服务器的地址
> - **`canal.server.port`**：Canal 服务器的端口
> - **`canal.destination`**：实例的标识
> - **`canal.batchSize`**：获取数据的最大 batch 大小（默认值为 8192）
> - **`canal.username`**：实例的用户名
> - **`canal.password`**：实例的密码
> - **`canal.debug`** (可选)：设置为 true 时，会打印出每个 batch 及每行数据的详细信息

## 注意事项

- 当前数据同步作业仅支持连接 Canal 服务器。
- 同一数据库中，相同 `<job_name>` 的作业在同一时刻只能有一个运行。
- Doris 目标表必须为 Unique 表，且需启用 batch delete 功能，否则数据同步可能失败。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限     | 对象         | 说明                                      |
|---------|------------|-----------------------------------------|
| LOAD_PRIV  | 表 | 该操作只能由拥有导入表的 LOAD_PRIV 权限的用户或角色执行。 |

## 示例

1. **简单示例：** 为 `test_db` 数据库的目标表 `test_tbl` 创建一个名为 `job1` 的数据同步作业，连接本地 Canal 服务器，对应 MySQL 源表 `mysql_db1.tbl1`。

   ```sql
   CREATE SYNC `test_db`.`job1`
   (
       FROM `mysql_db1`.`tbl1` INTO `test_tbl`
   )
   FROM BINLOG
   (
       "type" = "canal",
       "canal.server.ip" = "127.0.0.1",
       "canal.server.port" = "11111",
       "canal.destination" = "example",
       "canal.username" = "",
       "canal.password" = ""
   );
   ```

2. **多表同步及列映射示例：** 为 `test_db` 数据库的多张表创建一个名为 `job1` 的数据同步作业，对应多个 MySQL 源表，并显式指定列映射。

   ```sql
   CREATE SYNC `test_db`.`job1`
   (
       FROM `mysql_db`.`t1` INTO `test1` (k1, k2, v1),
       FROM `mysql_db`.`t2` INTO `test2` (k3, k4, v2)
   )
   FROM BINLOG
   (
       "type" = "canal",
       "canal.server.ip" = "xx.xxx.xxx.xx",
       "canal.server.port" = "12111",
       "canal.destination" = "example",
       "canal.username" = "username",
       "canal.password" = "password"
   );
   ```