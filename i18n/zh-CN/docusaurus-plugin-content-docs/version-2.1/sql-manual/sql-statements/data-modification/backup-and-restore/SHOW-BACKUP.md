---
{
"title": "SHOW BACKUP",
"language": "zh-CN"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## 描述

该语句用于查看BACKUP任务

## 语法

```sql
 SHOW BACKUP [FROM <db_name>]
     [WHERE SnapshotName { LIKE | = } '<snapshot_name>' ]
```

## 参数

**1.`<db_name>`**

备份任务所属数据库名。

**2.`<snapshot_name>`**

备份的名称。

## 返回

| 列名 | 说明 |
| -- | -- |
| JobId | 唯一作业id |
| SnapshotName | 备份的名称 |
| DbName | 所属数据库 |
| State | 当前阶段：<ul><li>PENDING：提交作业后的初始状态。</li><li>SNAPSHOTING：执行快照中。</li><li>UPLOAD_SNAPSHOT：快照结束，准备上传。</li><li>UPLOADING：正在上传快照。</li><li>SAVE_META：将作业元信息保存为本地文件。</li><li>UPLOAD_INFO：上传作业元信息。</li><li>FINISHED：作业成功。</li><li>CANCELLED：作业失败。</li></ul> |
| BackupObjs | 备份的表和分区 |
| CreateTime | 任务提交时间 |
| SnapshotFinishedTime | 快照完成时间 |
| UploadFinishedTime | 快照上传完成时间 |
| FinishedTime | 作业结束时间 |
| UnfinishedTasks | 在 SNAPSHOTING 和 UPLOADING 阶段会显示还未完成的子任务 id |
| Progress |  任务进度 |
| TaskErrMsg | 显示任务的错误信息 |
| Status | 如果作业失败，显示失败信息 |
| Timeout | 作业超时时间，单位秒 |

## 示例

1. 查看 example_db 下最后一次 BACKUP 任务。

```sql
SHOW BACKUP FROM example_db;
```

2. 查看备份名称为snapshot_label的BACKUP任务。

```sql
show backup from example_db where SnapshotName = 'snapshot_label';
```
