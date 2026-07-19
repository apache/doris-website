---
{
    "title": "恢复",
    "language": "zh-CN",
    "description": "本指南介绍如何在 Doris 中从 Repository 的备份快照恢复数据库、表或分区，包含查询快照、按场景执行 RESTORE 以及查看恢复作业进度的完整步骤。",
    "keywords": [
        "Doris 恢复",
        "RESTORE SNAPSHOT",
        "数据恢复",
        "备份恢复",
        "SHOW SNAPSHOT",
        "SHOW RESTORE",
        "backup_timestamp",
        "跨库恢复",
        "分区恢复",
        "表重命名恢复"
    ]
}
---

本指南介绍如何使用 Doris 的 `RESTORE` 语句，从已有 Repository 中的备份快照恢复数据库、表或分区，并跟踪恢复作业的执行情况。适用于数据回滚、迁移到新集群、跨库复制以及单表/分区级数据修复等场景。

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 数据恢复 / 跨库迁移 / 分区级回滚 -->

## 适用场景

| 场景                  | 推荐方式                                | 说明                                                       |
|---------------------|-------------------------------------|----------------------------------------------------------|
| 恢复整个快照到当前数据库        | [恢复快照到当前数据库](#方式-1恢复快照到当前数据库)      | 最常用，将快照中的全部对象恢复到当前 `USE` 的数据库                            |
| 恢复整个快照到其他数据库        | [恢复快照到指定数据库](#方式-2恢复快照到指定数据库)      | 用于跨库迁移或在另一个数据库下复制一份数据                                    |
| 仅恢复快照中的某张表          | [从快照恢复单个表](#方式-3从快照恢复单个表)          | 只需要回滚或迁移特定一张表时使用                                         |
| 恢复指定分区或在恢复时为表重命名    | [从快照恢复分区和表](#方式-4从快照恢复分区和表)        | 支持只恢复部分分区，以及恢复后通过 `AS` 重命名表，避免覆盖现有对象                     |

## 前提条件

- 拥有 **管理员** 权限以执行恢复操作。
- 已有可用的备份快照，备份操作请参考[备份](./backup)。
- 已知备份所在的 Repository 名称（示例中使用 `example_repo`）。

## 恢复流程总览

1. 在目标 Repository 中查询可用快照，获取快照名与备份时间戳。
2. 根据业务需求，选择整库、跨库、单表或分区级别的 `RESTORE` 语句执行恢复。
3. 通过 `SHOW RESTORE` 查看恢复作业的状态与进度，确认恢复完成。

## 1. 获取快照的备份时间戳

执行恢复前，需要先确定快照名（Label）以及备份完成时的时间戳。以下 SQL 用于查看名为 `example_repo` 的 Repository 中的现有备份：

```sql
mysql> SHOW SNAPSHOT ON example_repo;
+--------------------+---------------------+--------+
| Snapshot           | Timestamp           | Status |
+--------------------+---------------------+--------+
| exampledb_20241225 | 2022-04-08-15-52-29 | OK     |
+--------------------+---------------------+--------+
1 row in set (0.15 sec)
```

输出列含义：

| 列名        | 说明                                          |
|-----------|---------------------------------------------|
| Snapshot  | 快照的 Label，由备份时指定                            |
| Timestamp | 快照完成时生成的时间戳，作为 `RESTORE` 的 `backup_timestamp` 入参 |
| Status    | 快照在 Repository 中的状态，`OK` 表示可用               |

## 2. 从快照恢复

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 整库恢复 / 跨库恢复 / 单表恢复 / 分区恢复 -->

根据要恢复的对象范围与目标位置，从下列四种方式中选择一种执行。

### 方式 1：恢复快照到当前数据库

将名为 `example_repo` 的 Repository 中、Label 为 `restore_label1`、时间戳为 `2022-04-08-15-52-29` 的快照恢复到当前数据库：

```sql
RESTORE SNAPSHOT `restore_label1`
FROM `example_repo`
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```

### 方式 2：恢复快照到指定数据库

将上述快照恢复到名为 `destdb` 的数据库，可用于跨库迁移或在另一个数据库下保留一份数据副本：

```sql
RESTORE SNAPSHOT destdb.`restore_label1`
FROM `example_repo`
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```

### 方式 3：从快照恢复单个表

从 `example_repo` 中 Label 为 `restore_label1`、时间戳为 `2022-04-08-15-52-29` 的快照中，仅恢复表 `backup_tbl` 到当前数据库：

```sql
RESTORE SNAPSHOT `restore_label1`
FROM `example_repo`
ON ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```

### 方式 4：从快照恢复分区和表

从 `example_repo` 中的备份快照 `snapshot_2` 恢复表 `backup_tbl` 的分区 `p1` 和 `p2`，以及表 `backup_tbl2`，到当前数据库 `example_db1`，并将 `backup_tbl2` 重命名为 `new_tbl`，快照时间戳为 `2018-05-04-17-11-01`：

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

### 关键参数说明

| 参数                       | 说明                                                                                       |
|--------------------------|------------------------------------------------------------------------------------------|
| `SNAPSHOT <label>`       | 本次恢复作业的 Label，用于在 `SHOW RESTORE` 中识别该作业                                                 |
| `FROM <repo>`            | 备份所在的 Repository 名称                                                                       |
| `ON ( ... )`             | 可选；指定要恢复的对象，可包含表名、`PARTITION (...)` 子句以及 `AS <new_name>` 重命名子句。省略时恢复快照内的全部对象           |
| `PROPERTIES("backup_timestamp"=...)` | 必填；要恢复的快照时间戳，对应 `SHOW SNAPSHOT` 输出中的 `Timestamp` 列                                          |

## 3. 查看恢复作业的执行情况

通过 `SHOW RESTORE` 查看当前数据库下的恢复作业状态与各阶段耗时：

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

关键字段含义：

| 字段                     | 说明                                                            |
|------------------------|---------------------------------------------------------------|
| `JobId`                | 恢复作业的内部 ID                                                    |
| `Label` / `Timestamp`  | 本次恢复对应的快照 Label 与备份时间戳                                        |
| `DbName`               | 目标数据库                                                         |
| `State`                | 作业当前状态，`FINISHED` 表示恢复成功                                      |
| `RestoreObjs`          | 本次恢复包含的对象，包括表名、分区列表、视图与外表等                                    |
| `CreateTime` 等时间字段     | 作业创建、元数据准备、快照拉取、下载、最终完成的时间点，可用于排查耗时瓶颈                         |
| `Status`               | 错误状态，`[OK]` 表示无异常；非 OK 时结合 `TaskErrMsg` 排查                    |
| `Timeout`              | 作业超时时间，单位为秒                                                   |
