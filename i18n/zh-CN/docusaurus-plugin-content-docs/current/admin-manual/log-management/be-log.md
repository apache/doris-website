---
{
    "title": "BE 日志管理",
    "language": "zh-CN",
    "description": "Apache Doris Backend (BE) 进程日志管理指南：日志分类、日志路径与滚动策略配置、DEBUG 日志开启方式以及容器环境下的日志输出配置。",
    "keywords": [
        "Doris BE 日志",
        "Backend 日志",
        "be.INFO",
        "be.WARNING",
        "be.out",
        "jni.log",
        "be.gc.log",
        "sys_log_level",
        "sys_log_roll_mode",
        "sys_log_verbose_modules",
        "DEBUG 日志",
        "动态调整日志级别",
        "glog adjust",
        "容器日志",
        "Kubernetes BE 日志",
        "enable_file_logger",
        "Doris 日志路径",
        "BE 日志配置"
    ]
}
---

本文介绍 Apache Doris Backend (BE) 进程的日志体系：包括日志文件分类、日志路径与滚动策略的配置、DEBUG 日志的开启方法，以及在容器化（如 Kubernetes）环境中如何将日志输出到标准输出流。

本文档适用于 Apache Doris 2.1.4 及之后的版本。

<!-- 知识类型: 配置参数 / 操作步骤 -->
<!-- 适用场景: 日常运维 / 故障排查 / 容器化部署 -->

## 适用场景

| 场景 | 推荐查看的章节 |
| --- | --- |
| 了解 BE 进程产生了哪些日志文件 | [日志分类](#日志分类) |
| 调整日志存放路径、滚动策略、保留数量 | [日志配置](#日志配置) |
| 排查问题，需要打开 DEBUG 级别日志 | [开启 DEBUG 日志](#开启-debug-日志) |
| 在 Kubernetes 等容器环境部署 BE，需将日志输出到 stdout | [容器环境日志配置](#容器环境日志配置) |
| BE 异常宕机后查找堆栈信息 | 查看 `be.out`（见[日志分类](#日志分类)） |

## 日志分类

使用 `sh bin/start_be.sh --daemon` 启动 BE 进程后，BE 日志目录下会生成以下日志文件：

| 文件名 | 内容 | 说明 |
| --- | --- | --- |
| `be.INFO` | BE 进程的主运行日志，包含 DEBUG、INFO、WARN、ERROR 等所有等级 | 软链文件，指向当前最新的 BE 运行日志文件 |
| `be.WARNING` | 仅包含 WARN 级别及以上的运行日志，是 `be.INFO` 的子集 | 软链文件，指向当前最新的 BE 告警日志文件，用于快速查看告警或错误 |
| `be.out` | 标准输出流（stdout）与标准错误流（stderr）日志，例如启动脚本中的 `echo` 输出，以及未被 glog 框架捕获的日志 | BE 异常宕机时，通常通过该文件获取异常堆栈 |
| `jni.log` | BE 通过 JNI 调用 Java 程序时，Java 程序打印的日志 | TODO：未来版本中，该日志会统一合并到 `be.INFO` 中 |
| `be.gc.log` | BE JVM 的 GC 日志 | 由 `be.conf` 中的 JVM 启动项 `JAVA_OPTS` 控制 |

## 日志配置

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 日志路径调整 / 滚动策略调优 / 日志保留策略管理 -->

以下配置项均位于 `be.conf` 文件中，用于控制日志的存放路径、保留时间、保留数量、单文件大小、滚动策略等。

| 配置项 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- |
| `LOG_DIR` | `ENV(DORIS_HOME)/log` | — | 所有日志的存放路径，默认在 BE 部署路径的 `log/` 目录下。注意这是一个环境变量，配置名需大写。 |
| `sys_log_level` | `INFO` | `INFO`、`WARNING`、`ERROR`、`FATAL` | `be.INFO` 的日志等级，默认为 `INFO`。不建议修改，`INFO` 等级包含许多关键日志信息。 |
| `sys_log_roll_num` | `10` | — | `be.INFO` 与 `be.WARNING` 的最大文件数量，默认为 10。日志滚动或切分后，文件数量超过该阈值时，旧日志将被删除。 |
| `sys_log_verbose_modules` | 空 | — | 指定开启 DEBUG 级别日志的源代码文件，详见 [开启 DEBUG 日志](#开启-debug-日志)。 |
| `sys_log_verbose_level` | 空 | — | DEBUG 日志的详细级别，详见 [开启 DEBUG 日志](#开启-debug-日志)。 |
| `sys_log_verbose_flags_v` | 空 | — | 对应 glog 中的 `FLAGS_v`，用于全局控制 DEBUG 日志详细程度，详见 [开启 DEBUG 日志](#开启-debug-日志)。 |
| `sys_log_roll_mode` | `SIZE-MB-1024` | `TIME-DAY`、`TIME-HOUR`、`SIZE-MB-nnn` | `be.INFO` 与 `be.WARNING` 的滚动策略。默认 `SIZE-MB-1024`，即每达到 1024 MB 滚动生成一个新文件；也可改为按天或按小时滚动。 |
| `log_buffer_level` | 空 | 空 或 `-1` | BE 日志输出模式。默认异步刷盘；设置为 `-1` 时实时刷盘，会损失部分性能，但可在 BE 异常宕机时尽可能保留最新日志。 |
| `disable_compaction_trace_log` | `true` | `true`、`false` | 是否关闭 Compaction 操作的 tracing 日志。默认 `true` 关闭；设为 `false` 时会打印 Compaction tracing 日志，便于排查 Compaction 相关问题。 |
| `aws_log_level` | `0` | `0`–`6` | 控制 AWS SDK 的日志等级，默认为 `0`（关闭）。glog 已主动捕获并打印 AWS SDK 日志，仅在需要查看未被捕获的日志时开启。等级映射：`Off=0`、`Fatal=1`、`Error=2`、`Warn=3`、`Info=4`、`Debug=5`、`Trace=6`。 |
| `s3_file_writer_log_interval_second` | `60` | — | 执行 S3 Upload 操作时，打印操作进度的时间间隔（秒）。 |
| `enable_debug_log_timeout_secs` | `0` | — | 大于 `0` 时，打印 Pipeline 执行引擎的详细执行日志，用于排查问题。默认关闭。 |
| `sys_log_enable_custom_date_time_format` | `false` | `true`、`false` | 是否允许自定义日志中的日期格式（自 2.1.7 版本支持）。 |
| `sys_log_custom_date_time_format` | `%Y-%m-%d %H:%M:%S` | — | 自定义日志日期格式，仅当 `sys_log_enable_custom_date_time_format` 为 `true` 时生效（自 2.1.7 版本支持）。 |
| `sys_log_custom_date_time_ms_format` | `,{:03d}` | — | 自定义日志日期中的毫秒精度格式，仅当 `sys_log_enable_custom_date_time_format` 为 `true` 时生效（自 2.1.7 版本支持）。 |

## 开启 DEBUG 日志

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 故障排查 / 性能问题定位 -->

BE 的 DEBUG 日志支持两种开启方式：

- **静态配置**：在 `be.conf` 中配置后重启 BE 生效，配置永久保留。
- **动态调整**：通过 RESTful API 即时修改，无需重启，但配置不持久化，BE 重启后失效。

### 静态配置

在 `be.conf` 中设置 `sys_log_verbose_modules` 与 `sys_log_verbose_level`：

```text
sys_log_verbose_modules=plan_fragment_executor,olap_scan_node
sys_log_verbose_level=3
```

参数说明：

| 参数 | 作用 |
| --- | --- |
| `sys_log_verbose_modules` | 指定要开启 DEBUG 的源码文件名，多个文件用英文逗号分隔，支持通配符 `*`。例如 `sys_log_verbose_modules=*` 表示开启所有模块的 DEBUG 日志。 |
| `sys_log_verbose_level` | DEBUG 详细级别，取值范围 `1`–`10`，数字越大日志越详细。 |
| `sys_log_verbose_flags_v` | 对应 glog 的 `FLAGS_v`，全局控制日志详细程度。仅当 `n <= FLAGS_v` 时，`VLOG(n)` 日志才会输出，可实现更精细的输出粒度控制。其作用范围**不受** `sys_log_verbose_modules` 限制。 |

通常情况下，只需配置 `sys_log_verbose_modules` 与 `sys_log_verbose_level` 即可。只有在发现某些调试日志没有按预期输出时，才需要额外设置 `sys_log_verbose_flags_v`。

### 动态调整

自 Doris 2.1 起，BE 的 DEBUG 日志支持通过 RESTful API 动态调整：

```bash
curl -X POST "http://<be_host>:<webport>/api/glog/adjust?module=<module_name>&level=<level_number>"
```

参数说明：

- `<be_host>`：BE 节点的主机地址。
- `<webport>`：BE 的 HTTP 端口，默认 `8040`。
- `<module_name>`：要调整的模块名（源码文件名），支持通配符 `*`。
- `<level_number>`：DEBUG 详细级别，`-1` 表示关闭。

使用注意事项：

- **配置不持久化**：动态调整的配置在 BE 重启后失效，重启后需重新设置。
- **通配符与单模块互不隶属**：例如先将 `moduleA` 的 vlog 级别设置为 `10`，再执行 `module=*&level=-1`，并**不会**关闭 `moduleA` 的 vlog。
- **模块名不会校验**：无论使用何种方式，只要模块不存在，glog 都会创建对应日志模块（无实际影响），不会返回错误。

## 容器环境日志配置

<!-- 知识类型: 配置参数 / 操作步骤 -->
<!-- 适用场景: Kubernetes / 容器化部署 / stdout 日志采集 -->

在容器环境（如 Kubernetes）部署 BE 时，通常要求所有日志通过标准输出流而非文件输出，以便由容器编排平台统一采集。

### 启动方式

使用 `--console` 参数前台启动 BE 进程，将所有日志输出到标准输出流：

```shell
sh bin/start_be.sh --console
```

### 日志前缀说明

由于多种日志类型都汇聚到同一标准输出流，BE 会为每条日志添加前缀以示区分。示例输出：

```text
RuntimeLogger W20240624 00:36:46.325274 1460943 olap_server.cpp:710] Have not get FE Master heartbeat yet
RuntimeLogger I20240624 00:36:46.325999 1459644 olap_server.cpp:208] tablet checkpoint tasks producer thread started
RuntimeLogger I20240624 00:36:46.326066 1460954 olap_server.cpp:448] begin to produce tablet meta checkpoint tasks.
RuntimeLogger I20240624 00:36:46.326093 1459644 olap_server.cpp:213] tablet path check thread started
RuntimeLogger I20240624 00:36:46.326190 1459644 olap_server.cpp:219] cache clean thread started
RuntimeLogger I20240624 00:36:46.326336 1459644 olap_server.cpp:231] path gc threads started. number:1
RuntimeLogger I20240624 00:36:46.326643 1460958 olap_server.cpp:424] try to start path gc thread!
```

各前缀含义：

| 前缀 | 对应日志 |
| --- | --- |
| `RuntimeLogger` | 对应 `be.INFO` 中的日志 |

> 后续版本将增加对 `jni.log` 的前缀支持。

### 容器环境专属配置

| 配置项 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- |
| `enable_file_logger` | `true` | `true`、`false` | 是否同时启用文件日志。默认为 `true`，即使用 `--console` 启动时，日志会同时输出到 stdout 与日志文件。设置为 `false` 时，日志仅输出到 stdout，不再生成日志文件。 |

## 常见问题

### Q: BE 异常宕机，`be.INFO` 中未见明显堆栈

查看 `be.out`，BE 异常退出时的崩溃堆栈通常会输出到此文件。

### Q: 修改 `be.conf` 后日志配置未生效

静态配置需要重启 BE 才能生效；如需即时生效，请使用[动态调整](#动态调整) RESTful API。

### Q: 动态调整 vlog 级别后重启失效

动态调整不会持久化，重启后需要重新设置，或改写入 `be.conf`。

### Q: 开启 DEBUG 日志后日志量过大、磁盘吃紧

减小 `sys_log_verbose_level`、收窄 `sys_log_verbose_modules` 范围，或调整 `sys_log_roll_num` 控制保留数量。

### Q: 容器环境下没有看到日志输出到 stdout

确认 BE 是通过 `sh bin/start_be.sh --console` 启动；如希望关闭文件日志，将 `enable_file_logger` 设为 `false`。

### Q: AWS SDK 相关问题排查

临时调高 `aws_log_level`（如 `4` 或 `5`），完成排查后调回 `0` 以避免日志量过大。
