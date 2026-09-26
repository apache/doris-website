---
{
    "title": "CCR Syncer 操作手册",
    "language": "zh-CN",
    "description": "Apache Doris CCR Syncer 操作手册：覆盖部署要求、启动停止、任务管理 API、升级、高可用与性能调优。",
    "keywords": [
        "Doris CCR",
        "CCR Syncer",
        "跨集群同步",
        "Cross Cluster Replication",
        "binlog 同步",
        "Doris 容灾",
        "Doris 主从同步",
        "ccr_syncer",
        "create_ccr",
        "enable_db_binlog",
        "Syncer 高可用",
        "Syncer 升级",
        "Doris 数据同步",
        "Doris backup restore"
    ]
}
---

<!-- 知识类型: 操作手册 / 配置参数 / API 参考 -->
<!-- 适用场景: 部署运维 CCR Syncer / 管理跨集群同步任务 / 升级与调优 -->

本手册面向需要在生产环境中部署和运维 Apache Doris CCR Syncer 的用户，覆盖部署前的环境检查、Syncer 的启动停止、同步任务的 HTTP API 管理、版本升级流程，以及高可用与性能调优要点。

## 适用场景

| 场景 | 说明 |
|------|------|
| 首次部署 Syncer | 完成网络、权限、版本及表属性检查后启动 Syncer |
| 管理 CCR 任务 | 通过 HTTP API 创建、暂停、恢复、删除同步任务 |
| 升级 Syncer 与 Doris | 按"先 Syncer、后下游、再上游"的顺序滚动升级 |
| 高可用部署 | 使用 MySQL 作为元数据后端，实现 Syncer 故障自动接管 |
| 大规模库同步调优 | 调整 FE/BE 与 MySQL 参数，支撑大 tablet 数量的同步任务 |

## 前置条件

<!-- 知识类型: 部署前检查 -->
<!-- 适用场景: 环境验收 / 部署前确认 -->

部署 Syncer 前请先确认以下要求均已满足，否则同步任务会出现连接失败、数据错误或任务中断等问题。

### 网络要求

- Syncer 与上下游集群的 FE、BE 之间网络互通。
- 下游 BE 与上游 BE 之间通过 Doris BE 进程使用的 IP（即 `show frontends` / `show backends` 中看到的 IP）直通。

### 权限要求

Syncer 同步时需要用户提供上下游的账户，该账户需要拥有下述权限：

- `Select_priv`：对数据库、表的只读权限。
- `Load_priv`：对数据库、表的写权限，包括 Load、Insert、Delete 等。
- `Alter_priv`：对数据库、表的更改权限，包括重命名库 / 表，添加 / 删除 / 变更列，添加 / 删除分区等操作。
- `Create_priv`：创建数据库、表、视图的权限。
- `Drop_priv`：删除数据库、表、视图的权限。
- `Admin` 权限（之后考虑移除），用于检测 `enable binlog` 配置。

### 版本要求

- Syncer 版本 >= 下游 Doris 版本 >= 上游 Doris 版本。因此升级顺序为：先升级 Syncer，再升级下游 Doris，最后升级上游 Doris。
- Doris 2.0 的最低支持版本为 2.0.15，Doris 2.1 的最低支持版本为 2.1.6。
- 从 Syncer 2.1.8 和 3.0.4 开始，Syncer 不再支持 Doris 2.0。

### 表属性与集群配置要求

**表属性要求**

- `light_schema_change`：Syncer 要求上下游表都设置 `light_schema_change` 属性，否则会导致数据同步出错。最新版本的 Doris 在建表时会默认启用该属性；如果使用 1.1 及之前版本的 Doris，或从老版本升级而来，需要在开启 Syncer 同步前给存量 OLAP 表都设置上 `light_schema_change` 属性。

**FE 配置要求**

- `restore_reset_index_id`：如果要同步的表中带有 inverted index，必须在目标集群上将该配置设为 `false`。
- `ignore_backup_tmp_partitions`：如果上游有创建 tmp partition，Doris 会禁止做 backup，导致 Syncer 同步中断。可在 FE 设置 `ignore_backup_tmp_partitions=true` 规避该问题。

## 开启库中所有表的 binlog

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 库级别同步准备 -->

库级别同步需要源集群中所有表都开启 binlog。可以使用以下脚本批量开启：

```shell
bash bin/enable_db_binlog.sh -h host -p port -u user -P password -d db
```

参数说明：

| 参数 | 说明 |
|------|------|
| `-h` | 源集群 FE 的 host |
| `-p` | 源集群 FE 的 MySQL 协议端口 |
| `-u` | 用户名 |
| `-P` | 密码 |
| `-d` | 要开启 binlog 的数据库名 |

## 启动 Syncer

<!-- 知识类型: 操作步骤 / 配置参数 -->
<!-- 适用场景: 启动 Syncer 进程 -->

假设环境变量 `${SYNCER_HOME}` 被设置为 Syncer 的工作目录，可以使用 `bin/start_syncer.sh` 启动 Syncer。常用启动选项如下：

| 选项 | 描述 | 命令示例 | 默认值 |
|------|------|----------|--------|
| `--daemon` | 后台运行 Syncer | `bin/start_syncer.sh --daemon` | `false` |
| `--db_type` | Syncer 可使用两种数据库保存元数据：`sqlite3`（本地存储）和 `mysql`（本地或远端存储）。当使用 `mysql` 存储元数据时，Syncer 会使用 `CREATE IF NOT EXISTS` 创建名为 `ccr` 的库，元数据表保存在其中。 | `bin/start_syncer.sh --db_type mysql` | `sqlite3` |
| `--db_dir` | **仅在数据库使用 `sqlite3` 时生效**，可指定 SQLite3 生成的数据库文件名及路径。 | `bin/start_syncer.sh --db_dir /path/to/ccr.db` | `SYNCER_HOME/db/ccr.db` |
| `--db_host`<br/>`--db_port`<br/>`--db_user`<br/>`--db_password` | **仅在数据库使用 `mysql` 时生效**，用于设置 MySQL 的主机、端口、用户和密码。 | `bin/start_syncer.sh --db_host 127.0.0.1 --db_port 3306 --db_user root --db_password "qwe123456"` | `db_host` 和 `db_port` 默认为示例值；`db_user` 和 `db_password` 默认为空。 |
| `--log_dir` | 指定日志输出路径 | `bin/start_syncer.sh --log_dir /path/to/ccr_syncer.log` | `SYNCER_HOME/log/ccr_syncer.log` |
| `--log_level` | 指定日志输出等级，日志格式如下：`time level msg hooks`。在 `--daemon` 下默认值为 `info`；前台运行时默认值为 `trace`，并通过 `tee` 保存日志到 `log_dir`。 | `bin/start_syncer.sh --log_level info` | `info`（后台运行）<br/>`trace`（前台运行） |
| `--host`<br/>`--port` | 指定 Syncer 的 `host` 和 `port`。`host` 用于区分集群中 Syncer 的实例，可理解为 Syncer 的名称，集群中 Syncer 的名称格式为 `host:port`。 | `bin/start_syncer.sh --host 127.0.0.1 --port 9190` | `host` 默认为 `127.0.0.1`<br/>`port` 默认为 `9190` |
| `--pid_dir` | 指定 PID 文件保存路径。PID 文件为 `stop_syncer.sh` 脚本停止 Syncer 的凭据，保存对应 Syncer 的进程号。为方便集群化管理，可自定义路径。 | `bin/start_syncer.sh --pid_dir /path/to/pids` | `SYNCER_HOME/bin` |

## 停止 Syncer

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 停止单个或批量 Syncer -->

可以使用 `bin/stop_syncer.sh` 停止 Syncer，根据场景选择以下三种方法之一：

| 方法 | 适用场景 | 命令示例 |
|------|----------|----------|
| **方法 1** 停止单个 Syncer | 已知要停止的 Syncer 的 `host` 和 `port`（需要与启动时一致） | `bash bin/stop_syncer.sh --host 127.0.0.1 --port 9190` |
| **方法 2** 批量停止 Syncer | 已知要停止的多个 PID 文件名 | `bash bin/stop_syncer.sh --files "127.0.0.1_9190.pid 127.0.0.1_9191.pid"` |
| **方法 3** 停止所有 Syncer | 停止 `pid_dir` 路径下所有 PID 文件对应的 Syncer | `bash bin/stop_syncer.sh --pid_dir /path/to/pids` |

`bin/stop_syncer.sh` 的选项如下：

| 选项 | 描述 | 命令示例 | 默认值 |
|------|------|----------|--------|
| `--pid_dir` | 指定 PID 文件所在目录，上述三种停止方法都依赖于此选项执行。 | `bash bin/stop_syncer.sh --pid_dir /path/to/pids` | `SYNCER_HOME/bin` |
| `--host`<br/>`--port` | 停止 `pid_dir` 路径下 `host:port` 对应的 Syncer。仅指定 `host` 时退化为**方法 3**；`host` 和 `port` 都不为空时生效为**方法 1**。 | `bash bin/stop_syncer.sh --host 127.0.0.1 --port 9190` | `host`：`127.0.0.1`<br/>`port`：空 |
| `--files` | 停止 `pid_dir` 路径下指定 PID 文件名对应的 Syncer，文件之间用空格分隔，并整体用 `"` 包裹。 | `bash bin/stop_syncer.sh --files "127.0.0.1_9190.pid 127.0.0.1_9191.pid"` | 无 |

## Syncer 操作 API

<!-- 知识类型: API 参考 -->
<!-- 适用场景: 通过 HTTP API 管理 CCR 同步任务 -->

Syncer 通过 HTTP 接口对外提供同步任务管理能力。所有操作请求的通用模板如下：

```shell
curl -X POST -H "Content-Type: application/json" -d {json_body} http://ccr_syncer_host:ccr_syncer_port/operator
```

- `json_body`：以 JSON 的格式发送操作所需信息。
- `operator`：对应 Syncer 的不同操作（如 `create_ccr`、`pause`、`resume` 等）。

所有接口返回均为 JSON，成功时 `success` 字段为 `true`；失败时 `success` 字段为 `false`，并存在 `ErrMsgs` 字段：

```json
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

字段说明：

| 字段 | 说明 |
|------|------|
| `name` | CCR 同步任务的名称，唯一即可 |
| `host`、`port` | 对应集群 master 的 host 和 MySQL（JDBC）端口 |
| `thrift_port` | 对应 FE 的 `rpc_port` |
| `user`、`password` | Syncer 以何种身份去开启事务、拉取数据等 |
| `database`、`table` | 库级别同步时填入 `database`，`table` 留空；表级别同步时需同时填入 `database` 和 `table` |

### 查看同步进度

```shell
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "job_name"
}' http://ccr_syncer_host:ccr_syncer_port/get_lag
```

`job_name` 是 `create_ccr` 时创建的 `name`。

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

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: 多实例容灾部署 -->

Syncer 高可用依赖 MySQL。如果使用 MySQL 作为后端存储，Syncer 可以发现其他 Syncer 实例；当某个 Syncer 实例 crash 时，其他实例会分担它的任务。

## 升级流程

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 滚动升级 Syncer 与 Doris 集群 -->

升级顺序必须遵循"先 Syncer、再下游 Doris、最后上游 Doris"的原则，以保证版本兼容性。

### 1. 升级 Syncer

假设以下环境变量已设置：

- `${SYNCER_HOME}`：Syncer 的工作目录。
- `${SYNCER_PACKAGE_DIR}`：包含新 Syncer 的目录。

通过以下步骤升级每个 Syncer。

#### 1.1 保存启动命令

将以下命令的输出保存到文件中，便于升级后用相同参数启动：

```shell
ps -elf | grep ccr_syncer
```

#### 1.2 停止当前 Syncer

```shell
sh bin/stop_syncer.sh --pid_dir ${SYNCER_HOME}/bin
```

#### 1.3 备份现有的 MetaService 二进制文件

```shell
mv ${SYNCER_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
```

#### 1.4 部署新包

```shell
cp ${SYNCER_PACKAGE_DIR}/bin ${SYNCER_HOME}/bin
```

#### 1.5 启动新的 Syncer

使用在 1.1 中保存的命令启动新的 Syncer。

### 2. 升级下游 Doris（如有必要）

按照 [升级 Doris](../../cluster-management/upgrade) 指南中的说明升级下游集群。

### 3. 升级上游 Doris（如有必要）

按照 [升级 Doris](../../cluster-management/upgrade) 指南中的说明升级上游集群。

## 使用须知

<!-- 知识类型: 注意事项 / 性能调优 -->
<!-- 适用场景: 生产环境运维 / 大规模同步调优 -->

:::caution

在未出现异常时，`is_being_synced` 属性应该完全由 Syncer 控制开启或关闭，用户不要自行修改该属性。

:::

### 注意事项

- CCR 同步期间，backup/restore job 和 binlogs 都在 FE 内存中，因此建议在 FE 给每个 CCR job 都留出 4GB 及以上的堆内存（源和目标集群都需要），同时注意修改下列配置减少无关 job 对内存的消耗：
    - 修改 FE 配置 `max_backup_restore_job_num_per_db`：记录在内存中的每个 DB 的 backup/restore job 数量。默认值是 10，设置为 2 就可以了。
    - 修改源集群 db/table property，设置 binlog 保留限制：
        - `binlog.max_bytes`：binlog 最大占用内存，建议至少保留 4GB（默认无限制）。
        - `binlog.ttl_seconds`：binlog 保留时间。2.0.5 之前的老版本默认无限制；之后的版本默认值为一天（86400）。
        - 例如要修改 binlog ttl seconds 为保留一个小时：`ALTER TABLE table SET ("binlog.ttl_seconds"="3600")`。
- CCR 正确性也依赖于目标集群的事务状态，因此要保证在同步过程中事务不会过快被回收，需要调大下列配置：
    - `label_num_threshold`：用于控制 TXN Label 数量。
    - `stream_load_default_timeout_second`：用于控制 TXN 超时时间。
    - `label_keep_max_second`：用于控制 TXN 结束后保留时间。
    - `streaming_label_keep_max_second`：同上。
- 如果是 db 同步且源集群的 tablet 数量较多，那么产生的 CCR job 可能非常大，需要修改下列 FE 配置：
    - `max_backup_tablets_per_job`：一次 backup 任务涉及的 tablet 上限，需要根据 tablet 数量调整（默认值为 30w，过多的 tablet 数量会有 FE OOM 风险，优先考虑能否降低 tablet 数量）。
    - `thrift_max_message_size`：FE thrift server 允许的单次 RPC packet 上限，默认值为 100MB，如果 tablet 数量太多导致 snapshot info 大小超过 100MB，则需要调整该限制，最大 2GB。
        - Snapshot info 大小可以从 CCR Syncer 日志中找到，关键字：`snapshot response meta size: %d, job info size: %d`，snapshot info 大小约等于 `meta size + job info size`。
    - `fe_thrift_max_pkg_bytes`：同上，一个额外的参数，2.0 中需要调整，默认值为 20MB。
    - `restore_download_task_num_per_be`：发送给每个 BE 的 download task 数量上限，默认值是 3，对 restore job 来说太小了，需要调整为 0（也就是关闭这个限制）；2.1.8 和 3.0.4 起不再需要这个配置。
    - `backup_upload_task_num_per_be`：发送给每个 BE 的 upload task 数量上限，默认值是 3，对 backup job 来说太小了，需要调整为 0（也就是关闭这个限制）；2.1.8 和 3.0.4 起不再需要这个配置。
    - 除了上述 FE 的配置外，如果 CCR job 的 db type 是 mysql，还需要调整 MySQL 的一些配置：
        - MySQL 服务端会限制单次 select/insert 返回 / 插入数据包的大小。增加下列配置以放松该限制，比如调整到上限 1GB：

            ```text
            [mysqld]
            max_allowed_packet = 1024MB
            ```

        - MySQL client 也会有该限制。在 CCR Syncer 2.1.6 / 2.0.15 及之前的版本，上限为 128MB；之后的版本可以通过参数 `--mysql_max_allowed_packet` 调整（单位 bytes），默认值为 1024MB。

        > 注：在 2.1.8 和 3.0.4 以后，CCR Syncer 不再将 snapshot info 保存在 db 中，因此默认的数据包大小已经足够了。
- 同上，BE 端也需要修改几个配置：
    - `thrift_max_message_size`：BE thrift server 允许的单次 RPC packet 上限，默认值为 100MB，如果 tablet 数量太多导致 agent task 大小超过 100MB，则需要调整该限制，最大 2GB。
    - `be_thrift_max_pkg_bytes`：同上，只有 2.0 中需要调整的参数，默认值为 20MB。
- 即使修改了上述配置，当 tablet 数量继续上升时，产生的 snapshot 大小可能会超过 2GB，也就是 Doris FE edit log 和 RPC message size 的阈值，导致同步失败。从 2.1.8 和 3.0.4 开始，Doris 可以通过压缩 snapshot 来进一步提高备份恢复支持的 tablet 数量。可以通过下面几个参数开启压缩：
    - `restore_job_compressed_serialization`：开启对 restore job 的压缩（影响元数据兼容性，默认关闭）。
    - `backup_job_compressed_serialization`：开启对 backup job 的压缩（影响元数据兼容性，默认关闭）。
    - `enable_restore_snapshot_rpc_compression`：开启对 snapshot info 的压缩，主要影响 RPC（默认开启）。

    > 注：由于识别 backup/restore job 是否压缩需要额外的代码，而 2.1.8 和 3.0.4 之前的代码中不包含相关代码，因此一旦有 backup/restore job 生成，就无法回退到更早的 Doris 版本。有两种情况例外：已经 cancel 或者 finished 的 backup/restore job 不会被压缩，因此在回退前等待 backup/restore job 完成或者主动取消 job 后，就能安全回退。
- CCR 内部会使用 db/table 名作为一些内部 job 的 label，因此如果 CCR job 中碰到了 label 超过限制，可以调整 FE 参数 `label_regex_length` 来放松该限制（默认值为 128）。
- 由于 backup 暂时不支持备份带有 cooldown tablet 的表，如果碰到了会导致同步中断，因此需要在创建 CCR job 前检查是否有 table 设置了 `storage_policy` 属性。

### 性能相关参数

如果用户的数据量非常大，备份、恢复执行完需要的时间可能会超过一天（默认值），那么需要按需调整下列参数：

- `backup_job_default_timeout_ms`：备份 / 恢复任务超时时间，源、目标集群的 FE 都需要配置。
- 上游修改 binlog 保留时间：`ALTER DATABASE $db SET PROPERTIES ("binlog.ttl_seconds" = "xxxx")`。

下游 BE 下载速度慢时，可调整以下参数：

- `max_download_speed_kbps`：下游单个 BE 中单个下载线程的下载限速，默认值为 50MB/s。
- `download_worker_count`：下游执行下载任务的线程数，默认值为 1；需要结合客户机型调整，在不影响客户正常读写时调到最大；如果调整了这个参数，就可以不用调整 `max_download_speed_kbps`。
    - 例如客户机器网卡最大提供 1GB 的带宽，现在最大允许下载线程利用 200MB 的带宽，那么在不改变 `max_download_speed_kbps` 的情况下，`download_worker_count` 应该配置成 4。

如需限制下游 BE 下载 binlog 速度，在 BE 端配置参数：

```shell
download_binlog_rate_limit_kbs=1024 # 限制单个 BE 节点从源集群拉取 Binlog（包括 Local Snapshot）的速度为 1 MB/s
```

详细说明：

1. `download_binlog_rate_limit_kbs` 参数在源集群 BE 节点配置，通过设置该参数能够有效限制数据拉取速度。
2. `download_binlog_rate_limit_kbs` 参数主要用于设置单个 BE 节点的速度，若计算集群整体速率一般需要参数值乘以集群节点数。

## 常见问题

<!-- 知识类型: 故障排查 / 常见问题 -->
<!-- 适用场景: 同步异常排查 -->

### Q: 同步报错或数据错误怎么排查？

通常是上下游表未设置 `light_schema_change` 属性。给存量表显式设置 `light_schema_change` 属性后重试。

### Q: 含 inverted index 的表同步失败怎么办？

目标集群未关闭 `restore_reset_index_id`。在目标集群 FE 设置 `restore_reset_index_id=false`。

### Q: 上游有 tmp partition 导致 backup 被禁止怎么办？

FE 默认禁止对存在 tmp partition 的库做 backup。在源集群 FE 设置 `ignore_backup_tmp_partitions=true`。

### Q: Syncer 版本与 Doris 版本不匹配怎么处理？

升级顺序错误，或 Syncer 2.1.8 / 3.0.4 已不支持 Doris 2.0。严格遵循"先 Syncer、再下游、最后上游"的升级顺序。

### Q: FE 出现 OOM 怎么办？

单个 DB 的 backup/restore job 数量过多，或 tablet 数量过大。调小 `max_backup_restore_job_num_per_db`，并按需调整 `max_backup_tablets_per_job`、`thrift_max_message_size` 等参数。

### Q: Snapshot 大小超过 2GB 导致同步失败怎么办？

大规模 tablet 场景下 RPC / edit log 超阈值。升级到 2.1.8 / 3.0.4 及以上版本，并开启 `restore_job_compressed_serialization`、`backup_job_compressed_serialization` 等压缩参数。

### Q: 同步任务因 label 超长失败怎么办？

内部 job label 长度超过限制。调大 FE 参数 `label_regex_length`（默认 128）。

### Q: 带 `storage_policy` 的表同步中断怎么处理？

backup 暂不支持包含 cooldown tablet 的表。创建 CCR job 前检查并避免对设置了 `storage_policy` 的表做同步。

### Q: 下游 BE 下载速度慢怎么优化？

单线程下载且默认限速较低。调大 `download_worker_count`，或调整 `max_download_speed_kbps`。
