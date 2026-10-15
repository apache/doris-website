---
{
    "title": "SHOW RESTORE",
    "language": "zh-CN",
    "description": "该语句用于查看 RESTORE 任务"
}
---

## 描述

该语句用于查看 RESTORE 任务

## 语法

```SQL
SHOW [BRIEF] RESTORE [FROM <db_name>]
```

## 参数

**1.`<db_name>`**

恢复任务所属数据库名。

## 返回

- BRIEF: 仅返回精简格式的 RESTORE 任务信息，不包含 RestoreObjs, Progress, TaskErrMsg 三列

| 列名 | 说明 |
| -- | -- |
| JobId | 唯一作业 id |
| Label | 要恢复的备份的名称 |
| Timestamp | 要恢复的备份的时间版本 |
| DbName | 所属数据库 |
| State | 当前阶段：<ul><li>PENDING：提交作业后的初始状态。</li><li>SNAPSHOTING：执行快照中。</li><li>DOWNLOAD：快照完成，准备下载仓库中的快照。</li><li>DOWNLOADING：快照下载中。</li><li>COMMIT：快照下载完成，准备生效。</li><li>COMMITTING：生效中。</li><li>FINISHED：作业成功。</li><li>CANCELLED：作业失败。</li></ul> |
| AllowLoad | 恢复时是否允许导入（当前不支持）|
| ReplicationNum | 指定恢复的副本数 |
| ReserveReplica | 是否保留副本 |
| ReplicaAllocation | 是否保留动态分区启用 |
| RestoreJobs | 要恢复的表和分区 |
| CreateTime | 任务提交时间 |
| MetaPreparedTime | 元数据准备完成时间 |
| SnapshotFinishedTime | 快照完成时间 |
| DownloadFinishedTime | 快照下载完成时间 |
| FinishedTime | 作业结束时间 |
| UnfinishedTasks | 在 SNAPSHOTING、DOWNLOADING 和 COMMITTING 阶段会显示还未完成的子任务 id |
| Progress |  任务进度 |
| TaskErrMsg | 显示任务的错误信息 |
| Status | 如果作业失败，显示失败信息 |
| Timeout | 作业超时时间，单位秒 |

## 示例

1. 查看 example_db 下最近一次 RESTORE 任务。

```sql
SHOW RESTORE FROM example_db;
```
