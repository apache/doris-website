---
{
    "title": "FE 日志管理",
    "language": "zh-CN",
    "description": "Apache Doris FE 日志管理指南：日志分类（fe.log/fe.warn.log/fe.audit.log/fe.out/fe.gc.log）、日志保留与滚动配置、运行时开启 DEBUG 日志、容器环境标准输出日志接入。",
    "keywords": [
        "Doris FE 日志",
        "fe.log",
        "fe.warn.log",
        "fe.audit.log",
        "fe.out",
        "fe.gc.log",
        "审计日志",
        "GC 日志",
        "日志级别",
        "DEBUG 日志",
        "sys_log_verbose_modules",
        "sys_log_mode",
        "log_rollover_strategy",
        "日志滚动",
        "日志保留",
        "日志压缩",
        "Kubernetes FE 日志",
        "容器日志",
        "标准输出日志",
        "enable_file_logger",
        "运行时修改日志级别",
        "Doris 日志排查"
    ]
}
---

本文面向 Doris 集群的运维和开发人员，介绍 FE（Frontend）进程的日志体系：包括日志文件分类、日志保留与滚动策略、运行时开启 DEBUG 日志，以及容器环境下的日志接入方式。

> 本文档适用于 Doris 2.1.4 及之后的版本。

<!-- 知识类型: 操作指南 + 配置参数 -->
<!-- 适用场景: 日常运维 / 故障排查 / 性能调优 / 容器化部署 -->

## 适用场景

| 场景 | 推荐章节 |
| --- | --- |
| 想了解 FE 产生哪些日志文件、各自用途 | [日志分类](#日志分类) |
| 调整日志保留天数、单文件大小、滚动策略 | [日志配置](#日志配置) |
| 排查问题时需要打开某个类或包的 DEBUG 日志 | [开启 DEBUG 日志](#开启-debug-日志) |
| 在 Kubernetes 等容器环境部署，需要把日志接到 stdout | [容器环境日志配置](#容器环境日志配置) |
| 想知道审计日志在哪、记录了什么 | [日志分类](#日志分类) 中的 `fe.audit.log` 与 [日志配置](#日志配置) 中的审计相关参数 |

## 日志分类

<!-- 知识类型: 概念说明 -->
<!-- 适用场景: 排查问题前快速确认日志归属 -->

使用 `sh bin/start_fe.sh --daemon` 启动 FE 进程后，FE 的日志目录（由配置项 `LOG_DIR` 控制，默认是 FE 部署目录下的 `log/`）会产生以下几类日志文件：

| 日志文件 | 类型 | 内容说明 |
| --- | --- | --- |
| `fe.log` | 运行日志（主） | FE 进程的主日志，包含所有等级（DEBUG、INFO、WARN、ERROR 等）的运行日志。 |
| `fe.warn.log` | 运行日志（告警） | 只记录 WARN 及以上级别的日志，是 `fe.log` 的子集，便于快速查看告警或错误。 |
| `fe.audit.log` | 审计日志 | 记录所有通过该 FE 节点执行的数据库操作（SQL、DDL、DML 等）。 |
| `fe.out` | 标准输出/错误流 | 接收 start 脚本中的 `echo` 输出，以及未被 log4j 框架捕获的日志信息，是运行日志的补充。少数情况下需要查看以获取更多信息。 |
| `fe.gc.log` | JVM GC 日志 | FE JVM 的垃圾回收日志，行为由 `fe.conf` 中的 `JAVA_OPTS` 启动项控制。 |

## 日志配置

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 调整日志保留策略、滚动方式、压缩归档 -->

以下配置项均位于 `fe.conf` 文件中，用于控制日志的存放路径、保留时间、保留数目、单文件大小等行为。

### 通用配置

| 配置项 | 默认值 | 可选项 | 说明 |
| --- | --- | --- | --- |
| `LOG_DIR` | `ENV(DORIS_HOME)/log` | | 所有日志的存放路径。默认为 FE 部署路径的 `log/` 目录下。注意这是一个环境变量，配置名需大写。 |
| `sys_log_level` | `INFO` | `INFO`, `WARN`, `ERROR`, `FATAL` | `fe.log` 的日志等级，默认为 INFO。不建议修改，INFO 等级包含许多关键日志信息。 |
| `sys_log_mode` | `NORMAL` | `NORMAL`, `BRIEF`, `ASYNC` | FE 日志的输出模式。`NORMAL` 为默认模式，日志同步输出且包含位置信息；`ASYNC` 为日志异步输出且包含位置信息；`BRIEF` 为日志异步输出但不包含位置信息。三种模式的性能依次递增。 |

:::note
从 3.0.2 版本开始，`sys_log_mode` 配置默认改为 `ASYNC`。
:::

### 运行日志（fe.log / fe.warn.log）

| 配置项 | 默认值 | 可选项 | 说明 |
| --- | --- | --- | --- |
| `log_roll_size_mb` | 1024 | | 控制 `fe.log`、`fe.warn.log`、`fe.audit.log` 单个文件最大大小。默认 1024 MB。单个日志文件超过该阈值后，会自动切分新文件。 |
| `sys_log_roll_interval` | `DAY` | `DAY`, `HOUR` | 控制 `fe.log` 和 `fe.warn.log` 的滚动间隔。默认为 1 天，即每天生成一个新日志文件。 |
| `sys_log_roll_num` | 10 | | 控制 `fe.log` 和 `fe.warn.log` 一天内的最大文件数量。默认 10。当日志滚动或切分导致文件数量超过该阈值后，老的日志文件将被删除。 |
| `sys_log_enable_compress` | false | true, false | 是否开启历史 `fe.log` 和 `fe.warn.log` 日志压缩。默认关闭。开启后，历史日志会使用 gzip 压缩归档。 |
| `sys_log_verbose_modules` | | | 设置指定的 Java package 或类开启 DEBUG 级别日志，详见 [开启 DEBUG 日志](#开启-debug-日志)。 |

:::tip
`sys_log_roll_num` 控制的是一天内的保留日志数量，而不是总数量，需要配合 `sys_log_delete_age` 共同决定总保留日志数量。
:::

### 审计日志（fe.audit.log）

| 配置项 | 默认值 | 可选项 | 说明 |
| --- | --- | --- | --- |
| `audit_log_dir` | `ENV(DORIS_HOME)/log` | | 可以单独指定 `fe.audit.log` 的存放路径。默认为 FE 部署路径的 `log/` 目录下。 |
| `audit_log_roll_interval` | `DAY` | `DAY`, `HOUR` | 控制 `fe.audit.log` 的滚动间隔。默认为 1 天，即每天生成一个新日志文件。 |
| `audit_log_roll_num` | 90 | | 控制 `fe.audit.log` 最大文件数量。默认 90。当日志滚动或切分导致文件数量超过该阈值后，老的日志文件将被删除。 |
| `audit_log_enable_compress` | false | true, false | 是否开启历史 `fe.audit.log` 日志压缩。默认关闭。开启后，历史审计日志会使用 gzip 压缩归档。 |
| `audit_log_modules` | `{"slow_query", "query", "load", "stream_load"}` | | `fe.audit.log` 中的模块类型。默认包括慢查询、查询、导入、stream load。其中"查询"指所有 DDL、DML、SQL 操作；"慢查询"指这些操作执行时间超过 `qe_slow_log_ms` 阈值的操作；"导入"指 Broker Load；"stream load"指 stream load 操作。 |
| `qe_slow_log_ms` | 5000 | | 当 DDL、DML、SQL 语句的执行时间超过该阈值后，会在 `fe.audit.log` 的 `slow_query` 模块中单独记录。默认 5000 ms。 |
| `sql_digest_generation_threshold_ms` | 5000 | | sql_digest 生成的时间阈值，单位为毫秒。如果一个查询的响应时间超过该阈值，则会在 `fe.audit.log` 中为其生成 sql_digest。默认 5000 ms。 |

### 按时间保留（log_rollover_strategy = age）

| 配置项 | 默认值 | 可选项 | 说明 |
| --- | --- | --- | --- |
| `log_rollover_strategy` | `age` | `age`, `size` | 日志保留策略。默认为 `age`，即按时间策略保留历史日志；`size` 表示按日志大小保留历史日志。 |
| `sys_log_delete_age` | 7d | 支持格式如 7d, 10h, 60m, 120s | 仅当 `log_rollover_strategy` 为 `age` 时生效。控制 `fe.log` 和 `fe.warn.log` 文件的保留天数，默认 7 天。会自动删除 7 天前的日志。 |
| `audit_log_delete_age` | 30d | 支持格式如 7d, 10h, 60m, 120s | 仅当 `log_rollover_strategy` 为 `age` 时生效。控制 `fe.audit.log` 文件的保留天数，默认 30 天。会自动删除 30 天前的日志。 |

### 按大小保留（log_rollover_strategy = size）

| 配置项 | 默认值 | 可选项 | 说明 |
| --- | --- | --- | --- |
| `info_sys_accumulated_file_size` | 4 | | 仅当 `log_rollover_strategy` 为 `size` 时生效。控制 `fe.log` 文件的累计大小，默认 4 GB。当累计日志大小超过该阈值后，会删除历史日志文件。 |
| `warn_sys_accumulated_file_size` | 2 | | 仅当 `log_rollover_strategy` 为 `size` 时生效。控制 `fe.warn.log` 文件的累计大小，默认 2 GB。当累计日志大小超过该阈值后，会删除历史日志文件。 |
| `audit_sys_accumulated_file_size` | 4 | | 仅当 `log_rollover_strategy` 为 `size` 时生效。控制 `fe.audit.log` 文件的累计大小，默认 4 GB。当累计日志大小超过该阈值后，会删除历史日志文件。 |

## 开启 DEBUG 日志

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 故障排查 / 临时定位某个类或包的运行细节 -->

FE 的 DEBUG 级别日志可以通过修改配置文件开启，也可以通过 UI 界面或 REST API 在运行时打开。三种方式对比如下：

| 方式 | 是否需要重启 | 影响范围 | 适用场景 |
| --- | --- | --- | --- |
| 修改 `fe.conf` 配置 | 需要重启 FE | 重启后所有节点按各自配置生效 | 长期开启某些 DEBUG 日志 |
| FE UI 界面 | 不需要重启 | 仅影响当前 FE 节点 | 临时定位问题、可视化操作 |
| REST API | 不需要重启 | 仅影响目标 FE 节点 | 临时定位问题、脚本化批量操作 |

### 方式一：通过配置文件开启

在 `fe.conf` 中添加配置项 `sys_log_verbose_modules`，示例如下：

```text
# 仅开启类 org.apache.doris.catalog.Catalog 的 Debug 日志
sys_log_verbose_modules=org.apache.doris.catalog.Catalog

# 开启包 org.apache.doris.catalog 下所有类的 Debug 日志
sys_log_verbose_modules=org.apache.doris.catalog

# 开启包 org 下所有类的 Debug 日志
sys_log_verbose_modules=org
```

添加配置项并重启 FE 节点，即可生效。

### 方式二：通过 FE UI 界面

UI 界面支持在运行时修改日志级别，无需重启 FE 节点。操作步骤：

1. 在浏览器打开 FE 节点的 HTTP 端口（默认为 8030），并登录 UI 界面。
2. 点击上方导航栏的 `Log` 标签。

    ![通过 FE UI 界面](/images/log_manage/fe_web_log1.png)

3. 在 Add 输入框中输入包名或具体的类名，即可打开对应的 DEBUG 日志。例如输入 `org.apache.doris.catalog.Catalog`，可以打开 Catalog 类的 DEBUG 日志：

    ![通过 FE UI 界面](/images/log_manage/fe_web_log2.png)

4. 在 Delete 输入框中输入包名或具体的类名，可以关闭对应的 DEBUG 日志。

:::note
这里的修改只会影响对应 FE 节点的日志级别，不会影响其他 FE 节点。
:::

### 方式三：通过 REST API 修改

通过 REST API 也可以在运行时修改日志级别，无需重启 FE 节点。

- **开启 DEBUG 日志**

    ```shell
    curl -X POST -uuser:passwd fe_host:http_port/rest/v1/log?add_verbose=org.apache.doris.catalog.Catalog
    ```

    其中用户名密码为登录 Doris 的 root 或 admin 用户，`add_verbose` 参数指定要开启 DEBUG 日志的包名或类名。若成功则返回：

    ```json
    {
        "msg": "success", 
        "code": 0, 
        "data": {
            "LogConfiguration": {
                "VerboseNames": "org,org.apache.doris.catalog.Catalog", 
                "AuditNames": "slow_query,query,load", 
                "Level": "INFO"
            }
        }, 
        "count": 0
    }
    ```

- **关闭 DEBUG 日志**

    ```shell
    curl -X POST -uuser:passwd fe_host:http_port/rest/v1/log?del_verbose=org.apache.doris.catalog.Catalog
    ```

    `del_verbose` 参数指定要关闭 DEBUG 日志的包名或类名。

## 容器环境日志配置

<!-- 知识类型: 操作步骤 + 配置参数 -->
<!-- 适用场景: Kubernetes 等容器化部署 / 日志通过 stdout 接入采集系统 -->

在某些场景下（例如通过 Kubernetes 部署 FE 进程），需要把所有日志通过标准输出流而不是文件输出，以便容器日志采集系统统一收集。

### 启动方式

通过以下命令前台启动 FE 进程，所有日志会输出到标准输出流：

```shell
sh bin/start_fe.sh --console
```

### 日志前缀识别

为了在同一标准输出流中区分不同类型的日志，每条日志前会添加不同的前缀。示例输出如下：

```text
RuntimeLogger 2024-06-24 00:05:21,522 INFO (main|1) [DorisFE.start():158] Doris FE starting...
RuntimeLogger 2024-06-24 00:05:21,530 INFO (main|1) [FrontendOptions.analyzePriorityCidrs():194] configured prior_cidrs value: 172.20.32.136/24
RuntimeLogger 2024-06-24 00:05:21,535 INFO (main|1) [FrontendOptions.initAddrUseIp():101] local address: /172.20.32.136.
RuntimeLogger 2024-06-24 00:05:21,740 INFO (main|1) [ConsistencyChecker.initWorkTime():106] consistency checker will work from 23:00 to 23:00
RuntimeLogger 2024-06-24 00:05:21,889 ERROR (main|1) [Util.report():128] SLF4J: Class path contains multiple SLF4J bindings.
```

不同前缀对应的日志类型如下：

| 前缀 | 对应日志文件 | 说明 |
| --- | --- | --- |
| `StdoutLogger` | `fe.out` | 标准输出流中的日志。 |
| `StderrLogger` | `fe.out` | 标准错误流中的日志。 |
| `RuntimeLogger` | `fe.log` | FE 主运行日志。 |
| `AuditLogger` | `fe.audit.log` | 审计日志。 |
| 无前缀 | `fe.gc.log` | GC 日志。 |

### 容器环境额外配置

| 配置项 | 默认值 | 可选项 | 说明 |
| --- | --- | --- | --- |
| `enable_file_logger` | true | true, false | 是否启用文件日志。默认为 `true`。当使用 `--console` 命令启动 FE 进程时，日志会同时输出到标准输出流以及正常的日志文件中。当为 `false` 时，日志只会输出到标准输出流，不再产生日志文件。 |
