---
{
    "title": "集群升级",
    "language": "zh-CN",
    "description": "Apache Doris 集群滚动升级指南：版本兼容性规则、元数据兼容性测试、BE/FE 节点升级步骤与常见问题处理。",
    "keywords": [
        "Doris 升级",
        "Doris 滚动升级",
        "Doris 集群升级",
        "FE 升级",
        "BE 升级",
        "元数据兼容性测试",
        "metadata_failure_recovery",
        "disable_balance",
        "副本修复与均衡",
        "Doris 版本号规则",
        "跨版本升级",
        "灰度升级"
    ]
}
---

Apache Doris 提供滚动升级能力，在升级过程中逐步替换 FE 与 BE 节点的二进制文件，最大限度减少停机时间，确保集群在升级期间保持可用。本文面向集群管理员，介绍版本兼容性规则、元数据兼容性测试方法以及具体的升级操作步骤。

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 集群升级 / 版本迭代 / 滚动升级 -->

## 适用场景

| 场景 | 是否适用 | 说明 |
| --- | --- | --- |
| 同二位版本内的三位版本升级（如 2.1.3 → 2.1.7） | 适用 | 可直接滚动升级 |
| 跨二位版本升级（如 3.0 → 3.3） | 适用，需逐级 | 需按 3.0 → 3.1 → 3.2 → 3.3 依次升级 |
| 跨一位版本升级（如 2.x → 3.x） | 适用，需逐级 | 不建议直接跨大版本，需按二位版本依次升级 |
| 单 FE 节点集群升级 | 适用，需先做兼容性测试 | 强烈建议先扩容至 3 FE 高可用，或先做元数据兼容性测试 |
| 元数据可能不兼容的版本升级 | 适用，需先做兼容性测试 | 升级前必须验证元数据兼容性 |

## 前置条件

在执行升级前，请确认满足以下条件：

- 已阅读目标版本的 Release Note，确认版本间的行为变更与兼容性。
- 数据已使用 3 副本存储，避免升级失败导致数据丢失。
- 客户端任务已添加重试机制（详见下文「升级注意事项」）。
- 已准备一台开发机或 BE 节点用于元数据兼容性测试。
- 已下载并解压目标版本的 Doris 安装包（下文以 `${DORIS_NEW_HOME}` 表示新版本根目录，`${DORIS_OLD_HOME}` 表示线上运行的旧版本根目录）。

## 版本兼容性说明

Doris 版本号由三位组成，第一位表示重大里程碑版本，第二位表示功能版本，第三位表示 bug 修复，三位版本中不发布新功能。以 Doris 2.1.3 为例：

| 位次 | 示例值 | 含义 |
| --- | --- | --- |
| 第一位 | 2 | 第 2 个里程碑版本 |
| 第二位 | 1 | 该里程碑下的功能版本 |
| 第三位 | 3 | 该功能版本下的第 3 个 bug fix 版本 |

升级时遵循以下规则：

| 升级类型 | 是否支持跨版本 | 推荐路径 |
| --- | --- | --- |
| 三位版本（二位版本相同） | 支持 | 可直接升级，如 2.1.3 → 2.1.7 |
| 二位版本 | 不建议跨版本 | 按二位版本号依次升级，如 3.0 → 3.1 → 3.2 → 3.3 |
| 一位版本 | 不建议跨版本 | 先升至同一位的最新二位版本，再跨大版本升级 |

详细版本说明可参考 [版本规则](https://doris.apache.org/zh-CN/community/release-versioning)。

## 升级注意事项

<!-- 知识类型: 操作前检查 -->
<!-- 适用场景: 升级前准备 -->

升级前请重点关注以下三项内容：

| 注意事项 | 处理方式 |
| --- | --- |
| 版本间行为变更 | 升级前查看目标版本的 Release Note，确认是否存在不兼容的行为变更 |
| 客户端任务重试 | 升级过程中节点会依次重启，需为 Stream Load 与查询任务添加重试机制；Routine Load、Flink Doris Connector、Spark Doris Connector 已内置重试，无需额外处理 |
| 副本修复与均衡 | 升级前需关闭副本修复与均衡功能；无论升级成功与否，升级完成后都必须重新打开 |

:::caution 注意

Doris 升级只需要替换 FE 目录下的 `/bin`、`/lib` 以及 BE 目录下的 `/bin`、`/lib`。

在 2.0.2 及之后的版本，FE 和 BE 部署路径下新增了 `custom_lib/` 目录（如没有可以手动创建），用于存放用户自定义的第三方 jar 包（如 `hadoop-lzo-*.jar`、`orai18n.jar` 等）。该目录在升级时无需替换。

:::

## 元数据兼容性测试

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 升级前验证 / 元数据兼容性 -->

元数据兼容性测试用于在升级前验证新版本能否正常加载现有元数据，防止升级失败导致数据丢失。建议每次升级前都执行该测试。

:::caution 注意

在生产环境中，建议保持 3 个以上的 FE 节点做高可用配置。如果只有 1 个 FE 节点，必须先做元数据兼容性测试，再进行升级操作。元数据兼容性非常重要，如果因为元数据不兼容导致升级失败，可能会导致数据丢失。

测试时还需注意：

- 建议在开发机或 BE 节点上做元数据兼容性测试，尽量避免在 FE 节点上做兼容性测试。
- 如果只能在 FE 节点上做兼容性测试，建议选择非 Master 节点，并停止原有 FE 进程。

:::

### 1. 备份元数据信息

在开始升级工作前，需要备份 Master FE 节点的元数据信息。

通过 `show frontends` 中的 `IsMaster` 列可以判断 Master FE 节点。备份 FE 元信息时无需停止 FE 节点，可以直接热备份。默认情况下，FE 元数据位于 `fe/doris-meta` 目录下，也可通过 `fe.conf` 中的 `meta_dir` 参数确认元数据目录。

### 2. 修改测试用的 FE 配置文件

编辑测试环境的 `fe.conf`：

```shell
vi ${DORIS_NEW_HOME}/conf/fe.conf
```

将所有端口设置为与线上不同，同时修改 `clusterId` 参数：

```text
...
## modify port
http_port = 18030
rpc_port = 19020
query_port = 19030
arrow_flight_sql_port = 19040
edit_log_port = 19010

## modify clusterIP
clusterId=<a_new_clusterID, such as 123456>
...
```

测试环境端口示例如下：

| 参数 | 示例值 | 说明 |
| --- | --- | --- |
| `http_port` | 18030 | FE HTTP 服务端口 |
| `rpc_port` | 19020 | FE Thrift Server 端口 |
| `query_port` | 19030 | FE MySQL 协议查询端口 |
| `arrow_flight_sql_port` | 19040 | Arrow Flight SQL 端口 |
| `edit_log_port` | 19010 | FE BDBJE 通信端口 |
| `clusterId` | 123456 | 测试集群 ID，需与线上不同 |

### 3. 拷贝 Master FE 元数据

将备份的 Master FE 元数据拷贝到新的兼容性测试环境中：

```shell
cp ${DORIS_OLD_HOME}/fe/doris-meta/* ${DORIS_NEW_HOME}/fe/doris-meta
```

### 4. 修改元数据 VERSION 文件中的 cluster\_id

将拷贝后的元数据目录中 `VERSION` 文件的 `cluster_id` 修改为新的 cluster ID，例如上例中的 123456：

```shell
vi ${DORIS_NEW_HOME}/fe/doris-meta/image/VERSION
clusterId=123456
```

### 5. 在测试环境中启动 FE 进程

```shell
sh ${DORIS_NEW_HOME}/bin/start_fe.sh --daemon --metadata_failure_recovery
```

在 2.0.2 之前的版本，需要先在 `fe.conf` 中加入 `metadata_failure_recovery=true`，再启动 FE 进程：

```shell
echo "metadata_failure_recovery=true" >> ${DORIS_NEW_HOME}/conf/fe.conf
sh ${DORIS_NEW_HOME}/bin/start_fe.sh --daemon
```

### 6. 验证 FE 启动成功

通过 MySQL 客户端连接测试 FE，使用上例中的 `query_port` 为 19030：

```shell
mysql -uroot -P19030 -h127.0.0.1
```

若能成功连接，则说明新版本可以正常加载当前的元数据，元数据兼容性测试通过。

## 升级流程总览

完整升级流程如下，需严格按顺序执行：

1. 关闭副本修复与均衡功能。
2. 升级 BE 节点（多副本集群可灰度升级）。
3. 升级 FE 节点（先升级 Observer/Follower，再升级 Master）。
4. 打开副本修复与均衡功能。

整体原则是 **先升级 BE，再升级 FE**；在升级 FE 时，**先升级 Observer FE 与 Follower FE 节点，最后升级 Master FE 节点**。

## 升级步骤

### 第 1 步：关闭副本修复与均衡功能

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 升级前准备 -->

升级过程中会有节点重启，可能触发不必要的集群均衡和副本修复逻辑，需先关闭以下三项配置：

```sql
admin set frontend config("disable_balance" = "true");
admin set frontend config("disable_colocate_balance" = "true");
admin set frontend config("disable_tablet_scheduler" = "true");
```

涉及的配置项含义如下：

| 配置项 | 升级前值 | 作用 |
| --- | --- | --- |
| `disable_balance` | `true` | 关闭副本均衡，避免节点重启触发副本迁移 |
| `disable_colocate_balance` | `true` | 关闭 Colocate Join 表的副本均衡 |
| `disable_tablet_scheduler` | `true` | 关闭 Tablet 调度，避免副本修复 |

### 第 2 步：升级 BE 节点

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: BE 滚动升级 -->

:::info 备注

为了保证您的数据安全，请使用 3 副本存储数据，以避免升级误操作或失败导致的数据丢失问题。

:::

在多副本集群中，可以选择一台 BE 节点先做灰度升级，验证通过后再依次升级其他节点。

#### 2.1 停止待升级的 BE 节点

```shell
sh ${DORIS_OLD_HOME}/be/bin/stop_be.sh
```

#### 2.2 备份原有 `/bin` 与 `/lib` 目录

```shell
mv ${DORIS_OLD_HOME}/be/bin ${DORIS_OLD_HOME}/be/bin_back
mv ${DORIS_OLD_HOME}/be/lib ${DORIS_OLD_HOME}/be/lib_back
```

#### 2.3 拷贝新版本的 `/bin` 与 `/lib` 目录

```shell
cp -r ${DORIS_NEW_HOME}/be/bin ${DORIS_OLD_HOME}/be/bin
cp -r ${DORIS_NEW_HOME}/be/lib ${DORIS_OLD_HOME}/be/lib
```

#### 2.4 启动该 BE 节点

```shell
sh ${DORIS_OLD_HOME}/be/bin/start_be.sh --daemon
```

#### 2.5 验证升级结果

连接集群，查看该节点信息：

```sql
show backends\G
```

若该 BE 节点 `Alive` 状态为 `true`，且 `Version` 值为新版本，则该节点升级成功。确认无误后，按相同流程依次升级其他 BE 节点。

### 第 3 步：升级 FE 节点

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: FE 滚动升级 -->

多个 FE 节点情况下，先升级非 Master 节点（Observer 或 Follower），全部完成后最后升级 Master 节点。

#### 3.1 停止待升级的 FE 节点

```shell
sh ${DORIS_OLD_HOME}/fe/bin/stop_fe.sh
```

#### 3.2 备份原有目录

需要备份 `/bin`、`/lib`、`/mysql_ssl_default_certificate` 三个目录：

```shell
mv ${DORIS_OLD_HOME}/fe/bin ${DORIS_OLD_HOME}/fe/bin_back
mv ${DORIS_OLD_HOME}/fe/lib ${DORIS_OLD_HOME}/fe/lib_back
mv ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate_back
```

#### 3.3 拷贝新版本的目录

```shell
cp -r ${DORIS_NEW_HOME}/fe/bin ${DORIS_OLD_HOME}/fe/bin
cp -r ${DORIS_NEW_HOME}/fe/lib ${DORIS_OLD_HOME}/fe/lib
cp -r ${DORIS_NEW_HOME}/fe/mysql_ssl_default_certificate ${DORIS_OLD_HOME}/fe/mysql_ssl_default_certificate
```

#### 3.4 启动该 FE 节点

```shell
sh ${DORIS_OLD_HOME}/fe/bin/start_fe.sh --daemon
```

#### 3.5 验证升级结果

连接集群，查看该节点信息：

```sql
show frontends\G
```

若该 FE 节点 `Alive` 状态为 `true`，且 `Version` 值为新版本，则该节点升级成功。

#### 3.6 依次升级剩余 FE 节点

按相同流程依次升级其他非 Master FE 节点，**最后升级 Master FE 节点**。

### 第 4 步：打开副本修复与均衡功能

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 升级后收尾 -->

升级完成，并且所有 BE 节点状态变为 `Alive` 后，重新打开集群副本修复和均衡功能：

```sql
admin set frontend config("disable_balance" = "false");
admin set frontend config("disable_colocate_balance" = "false");
admin set frontend config("disable_tablet_scheduler" = "false");
```

## 各版本升级注意事项

<!-- 知识类型: 行为说明 -->
<!-- 适用场景: 跨版本升级 / 升级后行为变更确认 -->

本节记录升级到特定版本时需要额外关注的行为变更。除本节内容外，仍需查阅目标版本的 Release Note 确认完整的变更列表。

### 从 3.x 升级到 4.0 时的会话变量迁移

FE 通过内部变量 `variable_version` 记录会话变量默认值的迁移进度。从 3.x 升级到 4.0 时（`variable_version` 低于 400），FE 会自动调整以下变量的**全局默认值**：

| 变量 | 迁移后的默认值 | 说明 |
| --- | --- | --- |
| `enable_ansi_query_organization_behavior` | `false` | 保持 3.x 的查询组织行为，避免升级后语义变化 |
| `enable_new_type_coercion_behavior` | `false` | 保持 3.x 的类型转换行为 |
| `enable_sql_cache` | `true` | 开启 SQL Cache |
| `enable_nereids_distribute_planner` | `true` | **自 4.0.8 版本起新增的迁移项**，见下方说明 |

该迁移只在 `variable_version` 从低于 400 提升到 400 时执行一次，之后不会覆盖用户显式设置的值。

### 升级到 4.0.8

:::caution 启用 Nereids 分布式规划器

自 4.0.8 版本起，从 3.x 升级到 4.0 会启用 Nereids 分布式规划器（`enable_nereids_distribute_planner`）。

在 4.0.8 之前，如果集群的元数据镜像中持久化了 `enable_nereids_distribute_planner=false`，升级后该值会被原样恢复，集群继续使用旧版分布式规划器。4.0.8 将该变量纳入 `variable_version=400` 的迁移逻辑，升级后统一启用新的分布式规划器。

升级后如果观察到查询计划的分布方式与升级前不同，可以先执行 `SET GLOBAL enable_nereids_distribute_planner = false;` 回退，并反馈相关查询。

:::

升级到 4.0.8 时，还需关注以下变更：

| 变更内容 | 影响范围 | 处理方式 |
| --- | --- | --- |
| Compaction 不再因内存水位高而暂停（BE 配置 `enable_compaction_pause_on_high_memory` 默认 `true` → `false`） | 所有部署形态 | 如需保留旧行为，显式设置为 `true`。详见 [BE 配置项](../config/be-config) |
| 自动分桶最小分桶数由 1 提升到 3（FE 配置 `autobucket_min_buckets`） | 使用 `BUCKETS AUTO` 建表 | 只影响升级后新创建的分区。详见 [数据分桶](../../table-design/data-partitioning/data-bucketing) |
| BE `_stream_load_forward` 接口需要开启配置并通过认证 | 存算分离模式下依赖 Group Commit BE 转发的部署 | 在所有 BE 的 `be.conf` 中设置 `enable_group_commit_streamload_be_forward=true`，并确认导入账号具备全局 `LOAD` 权限。详见 [Group Commit](../../data-operate/import/load-best-practices/group-commit-manual) |
| 节点增删改接口需要全局 `ADMIN` 权限 | 调用 `/rest/v2/manager/node/{action}/{be\|fe\|broker}` 的自动化脚本 | 为调用方补充带 `ADMIN` 权限的账号认证。详见 [Node Action](../open-api/fe-http/node-action) |
| Stream Load 会校验账号对实际承载请求的 Compute Group 的访问权限 | 存算分离模式下的 Stream Load | 为导入账号补充对应 Compute Group 的授权。详见 [Stream Load](../../data-operate/import/import-way/stream-load-manual) |
| 存算分离模式下数据量统一按远端大小上报 | 依赖 `SHOW TABLETS`、`information_schema.partitions` 做容量统计的脚本 | 改用 `REMOTE_DATA_SIZE` 统计。详见 [partitions](../system-tables/information_schema/partitions) |
| Routine Load 的 Kafka 敏感属性在查询结果中脱敏为 `******` | 依赖 `SHOW ROUTINE LOAD` 读取认证信息的脚本 | 改从配置管理侧获取原值。详见 [SHOW ROUTINE LOAD](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD) |
| 预热任务时间戳格式由 `HH:mm:ss` 改为 `yyyy-MM-dd HH:mm:ss` | 解析预热任务状态的脚本 | 调整时间解析格式。详见 [读写分离](../../compute-storage-decoupled/rw/read-write-separation) |
| 扫描报错不再统一加 `failed to initialize storage reader` 前缀 | 按该前缀匹配告警的监控规则 | 改用错误码与 `tablet=` / `backend=` 信息定位 |

### 升级到 4.1.4

:::caution 启用 Nereids 分布式规划器

自 4.1.4 版本起，升级会把会话变量 `enable_nereids_distribute_planner` 的**全局默认值刷新为 `true`**，即使集群元数据中此前持久化的是 `false`。

升级后如果观察到查询计划的分布方式与升级前不同，可以执行 `SET GLOBAL enable_nereids_distribute_planner = false;` 回退，并反馈相关查询。

:::

:::caution 浮点数的字符串输出形式变化

自 4.1.4 版本起，FLOAT / DOUBLE 转字符串时输出**能够无损还原该值的最短字符串**，而不再按固定有效位数输出。存储的数值不变，但文本形式可能与 4.1.3 不同（例如 `246.9120025634766` → `246.91200256347656`，`0.0000123456` → `1.23456e-05`）。

影响 MySQL 协议查询结果、`CAST(... AS STRING)`、复杂类型 / JSON / VARIANT 展示、`SELECT INTO OUTFILE`、EXPORT 以及外表浮点列。如果下游系统对浮点数的字符串形式做精确比对，升级后需要相应调整。详见 [浮点类型](../../sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT)。

:::

升级到 4.1.4 时，需要关注以下变更：

**接口与语法移除**

| 变更内容 | 影响范围 | 处理方式 |
| --- | --- | --- |
| `iceberg_meta()` 表函数移除 | 使用该表函数查询 Iceberg 元数据的 SQL | 改用 Iceberg 系统表 `<table>$<system_table_name>`。详见 [ICEBERG_META](../../sql-manual/sql-functions/table-valued-functions/iceberg-meta) |
| FE `/api/<ns>/<db>/<tbl>/upload` 系列接口移除，FE 配置 `http_load_submitter_max_worker_threads` 同时移除 | 通过该接口上传小文件导入的脚本 | 改用 Stream Load 或 S3 / HDFS / LOCAL TVF。详见 [Upload Action](../open-api/fe-http/upload-action) |
| `PLAN REPLAYER PLAY '<file>'` 语句移除 | 回放 Minidump 的调试流程 | 仅保留 `PLAN REPLAYER DUMP` |
| Workload Policy 的 `set_session_variable` 动作移除 | 使用该动作的 Workload Policy | 改用 `cancel_query` / `move_query_to_group` |
| BE 配置 `get_stack_trace_tool` 移除，BE 线程栈 HTTP 输出字段调整 | 采集 BE 线程栈的脚本 | 按新的输出字段解析 |
| 存算分离 BE 配置 `s3_client_retry_slow_down` 移除 | 依赖该配置控制 S3 限流重试的部署 | BE 现在对 S3 429 / 503 始终重试，Recycler 不重试，无需配置 |
| Query Profile 中的 `HdfsIO` 计时器及其 7 个计数器移除 | 解析 Profile 的自动化脚本 | 改用其他 IO 相关计数器 |

**默认值与行为变更**

| 变更内容 | 影响范围 | 处理方式 |
| --- | --- | --- |
| 自动分桶最小分桶数由 1 提升到 3（FE 配置 `autobucket_min_buckets`） | 使用 `BUCKETS AUTO` 建表 | 只影响升级后新创建的分区。详见 [数据分桶](../../table-design/data-partitioning/data-bucketing) |
| 会话变量 `max_scanners_concurrency` 默认值由 4 调整为 8 | 所有查询 | 如需保留旧行为可显式设置回 4 |
| FE 配置 `default_get_version_from_ms_timeout_second` 默认值由 3 调整为 30 | 存算分离模式 | 无需处理，可减少 Meta Service 抖动导致的查询失败 |
| BE 配置 `enable_cache_read_from_peer` 默认值由 `true` 调整为 `false`，`cache_read_from_peer_expired_seconds` 移除 | 依赖跨 Compute Group Peer Cache 读取的部署 | 如需保留旧行为，在 `be.conf` 中显式设置 `enable_cache_read_from_peer=true` |
| 会话变量 `eager_aggregation_on_join` 移除，新增 `eager_aggregation_on_broadcast_join`（默认 `true`）和 `eager_agg_broadcast_row_count`（默认 250000） | 设置过 `eager_aggregation_on_join` 的会话 / 脚本 | 删除对该变量的设置 |
| `jobs()` 表函数中 Streaming Job 的 `Lag` 列改名为 `LagBytes`，单位由秒改为字节；新增 `LastSourceEventTimestamp` 列 | 解析 `jobs()` 输出的脚本、基于 `streaming_job_per_job_lag` 指标的监控 | 改用 `LagBytes` 列和 `streaming_job_per_job_lag_bytes` 指标。详见 [持续导入](../../data-operate/import/import-way/streaming-job/continuous-load-overview) |
| Arrow Flight SQL 返回的 `DATETIME` / `DATETIMEV2` 改为**不带时区**的 Arrow Timestamp（`TIMESTAMPTZ` 仍带时区） | 通过 Arrow Flight SQL 读取时间列的客户端 | 按不带时区的语义解析 |
| 聚合函数的任意参数中包含聚合函数时报错 `aggregate function cannot contain aggregate parameters` | 形如 `group_concat(x ORDER BY sum(k))` 的历史 SQL | 改写 SQL，先聚合再引用 |
| 表属性 `default.replication_num` 与 `default.replication_allocation` 变为互斥 | 同时设置了两者的建表 / 改表语句 | 只保留其中一个 |
| Paimon `paimon.table-option.*` Catalog 属性被限制为 7 个键的白名单 | 使用其他 `paimon.table-option.*` 键的 Catalog | 移除白名单外的键。详见 [Paimon Catalog](../../lakehouse/catalogs/paimon-catalog) |
| 存储属性新增保留键 `doris.fs.cache.key`，并移除隐式的 `fs.<schema>.impl.disable.cache=true` 默认值 | 使用外部存储的 Catalog / TVF | 升级时**先升级 BE 再升级 FE** |
| 存算分离模式下 `ADMIN SET FRONTEND CONFIG` 限制为 `root` 用户执行 | 使用非 root 账号动态改 FE 配置的脚本 | 改用 root 账号，或改为在 `fe.conf` 中配置 |
| FE 配置 `s3_load_endpoint_white_list`、`jdbc_driver_url_white_list`、`force_sqlserver_jdbc_encrypt_false` 不再支持动态修改 | 通过 `ADMIN SET FRONTEND CONFIG` 修改这些配置的脚本 | 改为在 `fe.conf` 中配置并重启 FE |
| Routine Load 的 Kafka 敏感属性、`information_schema` 加密密钥的 `IV` / `CIPHER` 列在查询结果中脱敏为 `******` | 依赖这些结果读取认证信息的脚本 | 改从配置管理侧获取原值 |

**部署与配置文件变更**

| 变更内容 | 影响范围 | 处理方式 |
| --- | --- | --- |
| JDK 17 的 `JAVA_OPTS` 需要把 `--add-opens=java.base/java.nio=ALL-UNNAMED` 改为 `--add-opens=java.base/java.nio=org.apache.arrow.memory.core,ALL-UNNAMED` | 自定义修改过 `fe.conf` / `be.conf` 中 `JAVA_OPTS_FOR_JDK_17` 的部署 | 按新版本发布包中的 `fe.conf` / `be.conf` 同步该参数，否则 Arrow 相关功能（Arrow Flight SQL 等）可能启动或运行失败 |
| be-java-extensions 中 `paimon-scanner` 模块更名为 `paimon-connector` | 自定义部署脚本中引用 `be/lib/java_extensions/paimon-scanner` 的场景 | 调整为 `paimon-connector` |
| BE `_stream_load_forward` 接口需要开启配置并通过认证 | 存算分离模式下依赖 Group Commit BE 转发的部署 | 在所有 BE 的 `be.conf` 中设置 `enable_group_commit_streamload_be_forward=true`，并确认导入账号具备全局 `LOAD` 权限。详见 [Group Commit](../../data-operate/import/load-best-practices/group-commit-manual) |

## 常见问题

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 升级失败 / 异常处理 -->

### Q: 升级后 BE / FE 节点 `Alive` 为 `false`，`Version` 仍是旧版本？

进程未拉起或新版本启动失败。检查 `be.log` / `fe.log` 错误日志，确认 `/bin`、`/lib` 是否替换正确。

### Q: 升级后 FE 启动失败，提示元数据不兼容？

跨版本过大或未做元数据兼容性测试。回滚到旧版本，按本文「元数据兼容性测试」流程先做测试，必要时逐级升级。

### Q: 升级后 `custom_lib/` 中的 jar 包丢失？

误将 `custom_lib/` 覆盖。仅替换 `/bin` 和 `/lib`，`custom_lib/` 不应替换。

### Q: 升级期间 Stream Load 任务失败？

节点重启导致客户端连接中断。在客户端增加重试机制；Routine Load、Flink/Spark Doris Connector 已内置重试。

### Q: 升级后副本数异常或副本迁移频繁？

未关闭 `disable_balance` / `disable_tablet_scheduler`，或升级后忘记重新打开。确认四个配置项的开关流程，升级前关闭、升级完成后重新打开。

### Q: 跨二位版本升级失败？

未按版本依次升级。回滚后按 `3.0 → 3.1 → 3.2 → 3.3` 等依次升级路径执行。

### Q: 单 FE 集群升级失败导致元数据丢失？

未做元数据兼容性测试。升级前扩容至 3 FE 高可用，或在开发机/BE 节点上做元数据兼容性测试。
