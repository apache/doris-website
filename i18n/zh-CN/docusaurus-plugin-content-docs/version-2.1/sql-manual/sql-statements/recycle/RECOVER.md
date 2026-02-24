---
{
    "title": "RECOVER",
    "language": "zh-CN",
    "description": "该语句用于恢复之前删除的 database、table 或者 partition。"
}
---

## 描述

该语句用于恢复之前删除的 database、table 或者 partition。

支持通过 name、id 来恢复指定的元信息，并且支持将恢复的元信息重命名。

## 语法：

```sql
RECOVER { DATABASE <db_name> [<db_id>] [AS <new_db_name>] 
        | TABLE [<db_name>.]<table_name> [<table_id>] [AS <new_table_name>] 
        | PARTITION <partition_name> [<partition_id>] FROM [<db_name>.]<table_name> [AS <new_partition_name>] }
```

## 必选参数

恢复数据库

**1. `<db_name>`**
> 要恢复的数据库名称。

恢复数据表

**1. `<table_name>`**
> 要恢复的表名称。

恢复分区

**1. `<partition_name>`**
> 要恢复的数据库名称。

**2. `<table_name>`**
> 要恢复的分区所在的表名称。

## 可选参数

恢复数据库

**1. `<db_id>`**
> 要恢复的数据库 ID。

**2. `<new_db_name>`**
> 恢复后新的数据库名称。

恢复数据表

**1. `<db_name>`**
> 要恢复的表所在的数据库名称。

**2. `<table_id>`**
> 要恢复的表 ID。

**3. `<new_table_name>`**
> 恢复后新的数据表名称。

恢复分区

**1. `<partition_id>`**
> 要恢复的分区 ID。

**2. `<db_name>`**
> 要恢复分区所在表的数据库名称。

**3. `<new_partition_name>`**
> 恢复后新的分区名称。

## 权限控制

| 权限         | 对象 | 说明 |
|------------|----|----|
| ADMIN_PRIV |    |    |

## 注意事项

- 该操作仅能恢复之前一段时间内删除的元信息。默认为 1 天。（可通过 fe.conf 中`catalog_trash_expire_second`参数配置）
- 如果恢复元信息时没有指定 id，则默认恢复最后一个删除的同名元数据。
- 可以通过 `SHOW CATALOG RECYCLE BIN` 来查询当前可恢复的元信息。

## 示例

1. 恢复名为 example_db 的 database

    ```sql
    RECOVER DATABASE example_db;
    ```

2. 恢复名为 example_tbl 的 table

    ```sql
    RECOVER TABLE example_db.example_tbl;
    ```

3. 恢复表 example_tbl 中名为 p1 的 partition

    ```sql
    RECOVER PARTITION p1 FROM example_tbl;
    ```

4. 恢复 example_db_id 且名为 example_db 的 database

    ```sql
    RECOVER DATABASE example_db example_db_id;
    ```

5. 恢复 example_tbl_id 且名为 example_tbl 的 table

    ```sql
    RECOVER TABLE example_db.example_tbl example_tbl_id;
    ```

6. 恢复表 example_tbl 中 p1_id 且名为 p1 的 partition

    ```sql
    RECOVER PARTITION p1 p1_id FROM example_tbl;
    ```

7. 恢复 example_db_id 且名为 example_db 的 database，并设定新名字 new_example_db

    ```sql
    RECOVER DATABASE example_db example_db_id AS new_example_db;
    ```

8. 恢复名为 example_tbl 的 table，并设定新名字 new_example_tbl

    ```sql
    RECOVER TABLE example_db.example_tbl AS new_example_tbl;
    ```

9. 恢复表 example_tbl 中 p1_id 且名为 p1 的 partition，并设定新名字 new_p1

    ```sql
    RECOVER PARTITION p1 p1_id AS new_p1 FROM example_tbl;
    ```