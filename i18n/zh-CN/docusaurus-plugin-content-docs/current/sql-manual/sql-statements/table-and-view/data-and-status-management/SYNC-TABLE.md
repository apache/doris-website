---
{
    "title": "SYNC TABLE",
    "language": "zh-CN"
}

---

## 描述

此语句适用于启用了异步组提交功能的表。

在 异步模式下，写入操作在数据写入内存缓冲区后立即返回成功，无需等待数据提交到磁盘。这可以提高导入性能，但我们不知道何时数据可见。

`SYNC TABLE`命令用于解决此问题。它会阻塞当前会话，并等待指定表正在进行的异步导入事务任务完成后再返回。这确保了命令完成后最新组提交批次的数据可见。

## 语法

```sql
SYNC TABLE <table_name> 
```

## 必选参数

1. `<table_name>` ：等待异步模式下的组提交完成的表的名称。

## 示例

1. 创建表并在设置组提交为异步模式。

    ```sql
    CREATE TABLE `dt` (
        `id` int(11) NOT NULL,
        `name` varchar(50) NULL,
    ) ENGINE=OLAP
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 3
    PROPERTIES (
        "replication_num" = "1",
        "group_commit_interval_ms" = "10000"
    );

    SET group_commit = 'async_mode';
    ```

2. 插入一些数据，等待后数据变得可见。

  ```sql
    INSERT INTO dt VALUES (1, "tom"), (2, "jerry");

    sync table dt;

    select * from dt;
    +------+-------+
    | id   | name  |
    +------+-------+
    |    2 | jerry |
    |    1 | tom   |
    +------+-------+
    2 rows in set (0.07 sec)
  ```
  
## 注意事项（Usage Note）

1. 存算分离模式不支持这个命令，在此模式下执行会报错，例如：

    ```sql
    sync table dt;
    ```

    报错信息如下：

    ```sql
    ERROR 1105 (HY000): errCode = 2, detailMessage = syncTable command not support in cloud mode now.
    ```