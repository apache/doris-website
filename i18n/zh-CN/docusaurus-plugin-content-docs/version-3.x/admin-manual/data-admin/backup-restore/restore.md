---
{
    "title": "恢复",
    "language": "zh-CN",
    "description": "以下 SQL 语句可用于查看名为examplerepo的 Repository 中的现有备份。"
}
---

## 前提条件

1. 确保您拥有**管理员**权限以执行恢复操作。
2. 确保您有一个有效的**备份**快照可供恢复，请参考[备份](backup.md)。

## 1. 获取快照的备份时间戳

以下 SQL 语句可用于查看名为`example_repo`的 Repository 中的现有备份。

   ```sql
   mysql> SHOW SNAPSHOT ON example_repo;
   +-----------------+---------------------+--------+
   | Snapshot            | Timestamp              | Status   |
   +-----------------+---------------------+--------+
   | exampledb_20241225 | 2022-04-08-15-52-29 | OK     |
   +-----------------+---------------------+--------+
   1 row in set (0.15 sec)
   ```

## 2. 从快照恢复

### Option 1：恢复快照到当前数据库

以下 SQL 语句从名为`example_repo`的 Repository 中恢复标签为 `restore_label1` 和时间戳为 `2022-04-08-15-52-29` 的快照到当前数据库。

```sql
RESTORE SNAPSHOT `restore_label1`
FROM `example_repo`
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```

### Option 2：恢复快照到指定数据库

以下 SQL 语句从名为`example_repo`的 Repository 中恢复标签为 `restore_label1` 和时间戳为 `2022-04-08-15-52-29` 的快照到名为 `destdb` 的数据库。

```sql
RESTORE SNAPSHOT destdb.`restore_label1`
FROM `example_repo`
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```

### Option 3：从快照恢复单个表

从`example_repo`中的快照恢复表`backup_tbl`到当前数据库，快照的标签为 `restore_label1`，时间戳为 `2022-04-08-15-52-29`。

```sql
RESTORE SNAPSHOT `restore_label1`
FROM `example_repo`
ON ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```

### Option 4：从快照恢复分区和表

从`example_repo`中的备份快照`snapshot_2`恢复表`backup_tbl`的分区 p1 和 p2，以及表`backup_tbl2`到当前数据库`example_db1`，并将其重命名为`new_tbl`，快照标签为时间版本为`"2018-05-04-17-11-01"`。

   ```sql
   RESTORE SNAPSHOT `restore_label1`
   FROM `example_repo`
   ON
   (
       `backup_tbl` PARTITION (`p1`, `p2`),
       `backup_tbl2` AS `new_tbl`
   )
   PROPERTIES
   (
       "backup_timestamp"="2022-04-08-15-55-43"
   );
   ```

## 3. 查看恢复作业的执行情况

    ```sql
    mysql> SHOW RESTORE\G;
    *************************** 1. row ***************************
                  JobId: 17891851
                  Label: snapshot_label1
              Timestamp: 2022-04-08-15-52-29
                  DbName: default_cluster:example_db1
                  State: FINISHED
              AllowLoad: false
          ReplicationNum: 3
            RestoreObjs: {
      "name": "snapshot_label1",
      "database": "example_db",
      "backup_time": 1649404349050,
      "content": "ALL",
      "olap_table_list": [
        {
          "name": "backup_tbl",
          "partition_names": [
            "p1",
            "p2"
          ]
        }
      ],
      "view_list": [],
      "odbc_table_list": [],
      "odbc_resource_list": []
    }
              CreateTime: 2022-04-08 15:59:01
        MetaPreparedTime: 2022-04-08 15:59:02
    SnapshotFinishedTime: 2022-04-08 15:59:05
    DownloadFinishedTime: 2022-04-08 15:59:12
            FinishedTime: 2022-04-08 15:59:18
        UnfinishedTasks:
                Progress:
              TaskErrMsg:
                  Status: [OK]
                Timeout: 86400
    1 row in set (0.01 sec)
    ```
