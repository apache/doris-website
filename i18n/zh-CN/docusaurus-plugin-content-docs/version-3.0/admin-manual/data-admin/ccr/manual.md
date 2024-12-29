---
{
    "title": "操作手册",
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

## 使用要求

### 网络要求

- 需要 Syncer 与上下游的 FE 和 BE 是互通的

- 下游 BE 与上游 BE 通过 Doris BE 进程使用的 IP （`show frontends/backends` 看到的） 是直通的。

### 权限要求

Syncer 同步时需要用户提供上下游的账户，该账户需要拥有下述权限：

- Select_priv 对数据库、表的只读权限。
- Load_priv 对数据库、表的写权限。包括 Load、Insert、Delete 等。
- Alter_priv 对数据库、表的更改权限。包括重命名 库/表、添加/删除/变更 列、添加/删除 分区等操作。
- Create_priv 创建数据库、表、视图的权限。
- Drop_priv 删除数据库、表、视图的权限。
- Admin 权限 (之后考虑移除), 这个是用来检测 enable binlog config 的。

### 版本要求

版本最低要求：v2.0.15

### 限制
- 不支持没有打开轻量级 SchemaChange 的表，`show create table` 输出中有 `light_schema_change = true` 表名打开了轻量级 SchemaChange。

:::caution
**从 2.1.8/3.0.4 开始，ccr syncer 支持的最小 Doris 版本是 2.1，2.0 版本将不再支持。**
:::

#### 不建议使用版本

Doris 版本
- 2.1.5/2.0.14：如果从之前的版本升级到这两个版本，且用户有 drop partition 操作，那么会在升级、重启时碰到 NPE，原因是这个版本引入了一个新字段，旧版本没有所以默认值为 null。这个问题在 2.1.6/2.0.15 修复。


## 开启库中所有表的 binlog

```shell
bash bin/enable_db_binlog.sh -h host -p port -u user -P password -d db
```

## 启动 Syncer

可以使用 `bin/start_syncer.sh` 启动 Syncer。

| **选项** | **描述** | **命令示例** | **默认值** |
|----------|----------|--------------|------------|
| `--daemon` | 后台运行 Syncer | `bin/start_syncer.sh --daemon` | `false` |
| `--db_type` | Syncer 可使用两种数据库保存元数据：`sqlite3`（本地存储）和 `mysql`（本地或远端存储）。当使用 `mysql` 存储元数据时，Syncer 会使用 `CREATE IF NOT EXISTS` 创建名为 `ccr` 的库，元数据表保存在其中。 | `bin/start_syncer.sh --db_type mysql` | `sqlite3` |
| `--db_dir` | **仅在数据库使用 `sqlite3` 时生效**，可指定 SQLite3 生成的数据库文件名及路径。 | `bin/start_syncer.sh --db_dir /path/to/ccr.db` | `SYNCER_OUTPUT_DIR/db/ccr.db` |
| `--db_host`<br>`--db_port`<br>`--db_user`<br>`--db_password` | **仅在数据库使用 `mysql` 时生效**，用于设置 MySQL 的主机、端口、用户和密码。 | `bin/start_syncer.sh --db_host 127.0.0.1 --db_port 3306 --db_user root --db_password "qwe123456"` | `db_host` 和 `db_port` 默认为示例值；`db_user` 和 `db_password` 默认为空。 |
| `--log_dir` | 指定日志输出路径 | `bin/start_syncer.sh --log_dir /path/to/ccr_syncer.log` | `SYNCER_OUTPUT_DIR/log/ccr_syncer.log` |
| `--log_level` | 指定日志输出等级，日志格式如下：`time level msg hooks`。在 `--daemon` 下默认值为 `info`；前台运行时默认值为 `trace`，并通过 `tee` 保存日志到 `log_dir`。 | `bin/start_syncer.sh --log_level info` | `info`（后台运行）<br>`trace`（前台运行） |
| `--host`<br>`--port` | 指定 Syncer 的 `host` 和 `port`。`host` 用于区分集群中 Syncer 的实例，可理解为 Syncer 的名称，集群中 Syncer 的名称格式为 `host:port`。 | `bin/start_syncer.sh --host 127.0.0.1 --port 9190` | `host` 默认为 `127.0.0.1`<br>`port` 默认为 `9190` |
| `--pid_dir` | 指定 PID 文件保存路径。PID 文件为 `stop_syncer.sh` 脚本停止 Syncer 的凭据，保存对应 Syncer 的进程号。为方便集群化管理，可自定义路径。 | `bin/start_syncer.sh --pid_dir /path/to/pids` | `SYNCER_OUTPUT_DIR/bin` |


## 停止 Syncer

可以使用 `bin/stop_syncer.sh` 停止 Syncer，有三种方法：

| **方法/选项** | **描述** | **命令示例** | **默认值** |
|---------------|----------|--------------|------------|
| **方法 1** 停止单个 Syncer | 指定要停止的 Syncer 的 `host` 和 `port`，注意要与启动时的 `host` 一致。 | `bash bin/stop_syncer.sh --host 127.0.0.1 --port 9190` | 无 |
| **方法 2** 批量停止 Syncer | 指定要停止的 PID 文件名，以空格分隔并用 `"` 包裹。 | `bash bin/stop_syncer.sh --files "127.0.0.1_9190.pid 127.0.0.1_9191.pid"` | 无 |
| **方法 3** 停止所有 Syncer | 默认停止 `pid_dir` 路径下所有 PID 文件对应的 Syncer。 | `bash bin/stop_syncer.sh --pid_dir /path/to/pids` | 无 |

方法 3 的选项如下：

| **选项** | **描述** | **命令示例** | **默认值** |
|----------|----------|--------------|------------|
| `--pid_dir` | 指定 PID 文件所在目录，上述三种停止方法都依赖于此选项执行。 | `bash bin/stop_syncer.sh --pid_dir /path/to/pids` | `SYNCER_OUTPUT_DIR/bin` |
| `--host`<br>`--port` | 停止 `pid_dir` 路径下 `host:port` 对应的 Syncer。仅指定 `host` 时退化为**方法 3**；`host` 和 `port` 都不为空时生效为**方法 1**。 | `bash bin/stop_syncer.sh --host 127.0.0.1 --port 9190` | `host`: 127.0.0.1<br>`port`: 空 |
| `--files` | 停止 `pid_dir` 路径下指定 PID 文件名对应的 Syncer，文件之间用空格分隔，并整体用 `"` 包裹。 | `bash bin/stop_syncer.sh --files "127.0.0.1_9190.pid 127.0.0.1_9191.pid"` | 无 |


## Syncer 操作列表

**请求的通用模板**

```shell
curl -X POST -H "Content-Type: application/json" -d {json_body} http://ccr_syncer_host:ccr_syncer_port/operator
```

json_body: 以 json 的格式发送操作所需信息

operator：对应 Syncer 的不同操作

所以接口返回都是 json, 如果成功则是其中 success 字段为 true, 类似，错误的时候，是 false，然后存在`ErrMsgs`字段

```JSON
{"success":true}

or

{"success":false,"error_msg":"job ccr_test not exist"}
```

### 创建任务

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "ccr_test",
    "src": {
    "host": "localhost",
    "port": "9030",
    "thrift_port": "9020",
    "user": "root",
    "password": "",
    "database": "demo",
    "table": "example_tbl"
    },
    "dest": {
    "host": "localhost",
    "port": "9030",
    "thrift_port": "9020",
    "user": "root",
    "password": "",
    "database": "ccrt",
    "table": "copy"
    }
}' http://127.0.0.1:9190/create_ccr
```

- name: CCR 同步任务的名称，唯一即可

- host、port：对应集群 master 的 host 和 mysql(jdbc) 的端口

- thrift_port：对应 FE 的 rpc_port

- user、password：Syncer 以何种身份去开启事务、拉取数据等

- database、table：

  - 如果是 库级别的同步，则填入 dbName，tableName 为空

  - 如果是表级别同步，则需要填入 dbName、tableName

### 查看同步进度

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/get_lag
```

job_name 是 create_ccr 时创建的 name。

### 暂停任务

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/pause
```

### 恢复任务

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/resume
```

### 删除任务

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/delete
```

### 获取版本

```shell
curl http://ccr_syncer_host:ccr_syncer_port/version

# > return
{"version": "2.0.1"}
```

### 查看任务状态

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/job_status

{
"success": true,
"status": {
    "name": "ccr_db_table_alias",
    "state": "running",
    "progress_state": "TableIncrementalSync"
}
}
```

### 结束同步

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/desync
```

### 获取任务列表

```shell
curl http://ccr_syncer_host:ccr_syncer_port/list_jobs

{"success":true,"jobs":["ccr_db_table_alias"]}
```

## Syncer 高可用

Syncer 高可用依赖 mysql，如果使用 mysql 作为后端存储，Syncer 可以发现其它 Syncer，如果一个 crash 了，其他会分担它的任务。


## 使用须知

:::caution

在未出现异常时，`is_being_synced`属性应该完全由 Syncer 控制开启或关闭，用户不要自行修改该属性。

:::
