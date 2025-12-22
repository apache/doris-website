---
{
    "title": "FE 日志管理",
    "language": "zh-CN",
    "description": "本文主要介绍 Frontend(FE) 进程的日志管理。"
}
---

本文主要介绍 Frontend(FE) 进程的日志管理。

该文档适用于 2.1.4 及之后的 Doris 版本。

## 日志分类

当使用 `sh bin/start_fe.sh --daemon` 方式启动 FE 进程后，FE 日志目录下会产生以下类型的日志文件：

- fe.log

 FE 进程运行日志。FE 的主日志文件。FE 进程所有等级（DEBUG、INFO、WARN、ERROR 等）的运行日志都会打印到这个日志文件中。

- fe.warn.log

 FE 进程运行日志。但只会打印 WARN 级别以上的运行日志。fe.warn.log 中的内容是 fe.log 日志内容的子集。主要用于快速查看告警或错误级别日志。

- fe.audit.log

 审计日志。用于记录通过这个 FE 节点执行的所有数据库操作记录。包括 SQL、DDL、DML 语句等。

- fe.out

 用于接收标准输出流和错误数据流的日志。比如 start 脚本中的 `echo` 命令输出等，或其他未被 log4j 框架捕获到的日志信息。通常作为运行日志的补充。少数情况下，需要查看 fe.out 的内容以获取更多信息。

- fe.gc.log

 FE JVM 的 GC 日志。该日志的行为由 fe.conf 中的 JVM 启动项 `JAVA_OPTS` 控制。

## 日志配置

包括配置日志的存放路径、保留时间、保留数目、大小等。

以下配置项均在 `fe.conf` 文件中配置。

| 配置项 | 默认值 | 可选项 | 说明 |
| --- | --- | --- | --- |
| `LOG_DIR` | `ENV(DORIS_HOME)/log` |  | 所有日志的存放路径。默认为 FE 部署路径的 `log/` 目录下。注意这是一个环境变量，配置名需大写。 |
| `sys_log_level` | `INFO` | `INFO`, `WARN`, `ERROR`, `FATAL` | `fe.log` 的日志等级。默认为 INFO。不建议修改，INFO 等级包含许多关键日志信息。|
| `sys_log_roll_num` | 10 |  | 控制 `fe.log` 和 `fe.warn.log` 一天内的最大文件数量。默认 10。当因为日志滚动或切分后，日志文件数量大于这个阈值后，老的日志文件将被删除  |
|`sys_log_verbose_modules`| | | 可以设置指定的 Java package 下的文件开启 DEBUG 级别日志。请参阅 "开启 DEBUG 日志" 章节 |
| `sys_log_enable_compress` | false | true, false | 是否开启历史 `fe.log` 和 `fe.warn.log` 日志压缩。默认关闭。开启后，历史审计日志会使用 gzip 压缩归档 |
| `log_rollover_strategy` | `age` | `age`, `size` | 日志保留策略，默认为 `age`，即根据时间策略保留历史日志。`size` 为按日志大小保留历史日志  |
| `sys_log_delete_age` | 7d | 支持格式如 7d, 10h, 60m, 120s | 仅当 `log_rollover_strategy` 为 `age` 时生效。控制 `fe.log` 和 `fe.warn.log` 文件的保留天数。默认 7 天。会自动删除 7 天前的日志 |
| `audit_log_delete_age` | 30d | 支持格式如 7d, 10h, 60m, 120s | 仅当 `log_rollover_strategy` 为 `age` 时生效。控制 `fe.audit.log` 文件的保留天数。默认 30 天。会自动删除 30 天前的日志 |
| `info_sys_accumulated_file_size` | 4 | | 仅当 `log_rollover_strategy` 为 `size` 时生效。控制 `fe.log` 文件的累计大小。默认为 4GB。当累计日志大小超过这个阈值后，会删除历史日志文件 |
| `warn_sys_accumulated_file_size` | 2 | | 仅当 `log_rollover_strategy` 为 `size` 时生效。控制 `fe.warn.log` 文件的累计大小。默认为 2GB。当累计日志大小超过这个阈值后，会删除历史日志文件 |
| `audit_sys_accumulated_file_size` | 4 | | 仅当 `log_rollover_strategy` 为 `size` 时生效。控制 `fe.audit.log` 文件的累计大小。默认为 4GB。当累计日志大小超过这个阈值后，会删除历史日志文件 |
| `log_roll_size_mb` | 1024 | | 控制 `fe.log`, `fe.warn.log`, `fe.audit.log` 单个文件最大大小。默认 1024MB。单个日志文件超过这个阈值后，会自动切分新的文件 |
| `sys_log_roll_interval` | `DAY` | `DAY`, `HOUR` | 控制 `fe.log` 和 `fe.warn.log` 的滚动间隔。默认为 1 天。即每天生成一个新日志文件 |
| `audit_log_roll_num` | 90 | | 控制 `fe.audit.log` 最大文件数量。默认 90。当因为日志滚动或切分后，日志文件数量大于这个阈值后，老的日志文件将被删除 |
| `audit_log_roll_interval` | `DAY` | `DAY`, `HOUR` | 控制 `fe.audit.log` 的滚动间隔。默认为 1 天。即每天生成一个新日志文件 |
| `audit_log_dir` | `ENV(DORIS_HOME)/log`  | 可以单独指定 `fe.audit.log` 的存放路径。默认为 FE 部署路径的 `log/` 目录下。 |
| `audit_log_modules` | `{"slow_query", "query", "load", "stream_load"}` |  | `fe.audit.log` 中的模块类型。默认包括慢查询、查询、导入、stream load。其中“查询”只所有 DDL、DML、SQL 操作。“慢查询”指这些操作执行时间超过 `qe_slow_log_ms` 阈值的操作。“导入”指 Broker Load。“stream load”指 stream load 操作。 |
| `qe_slow_log_ms` | 5000 |  | 当 DDL、DML、SQL 语句的执行时间超过这个阈值后，会在 `fe.audit.log` 的 `slow_query` 模块中单独记录。默认 5000 ms |
| `sql_digest_generation_threshold_ms` | 5000 |  | sql_digest 生成的时间阈值，单位为毫秒。如果一个查询的响应时间超过这个阈值，则会在 `fe.audit.log` 为其生成 sql_digest。默认 5000 ms |
| `audit_log_enable_compress` | false | true, false | 是否开启历史 `fe.audit.log` 日志压缩。默认关闭。开启后，历史审计日志会使用 gzip 压缩归档 |
| `sys_log_mode` | `NORMAL` | `NORMAL`, `BRIEF`, `ASYNC` | FE 日志的输出模式，其中 `NORMAL` 为默认的输出模式，日志同步输出且包含位置信息。`ASYNC` 默认是日志异步输出且包含位置信息。 `BRIEF` 模式是日志异步输出但不包含位置信息。三种日志输出模式的性能依次递增 |

::: note
从 3.0.2 版本开始，`sys_log_mode` 配置默认改为 `ASYNC`。
:::

:::tip
`sys_log_roll_num` 控制的是一天的保留日志数量，而不是总数量，需要配合 `sys_log_delete_age` 共同确定总保留日志数量。
:::

## 开启 DEBUG 日志

FE 的 Debug 级别日志可以通过修改配置文件开启，也可以通过界面或 API 在运行时打开。

- 通过配置文件开启

   在 fe.conf 中添加配置项 `sys_log_verbose_modules`。举例如下：

   ```text
   # 仅开启类 org.apache.doris.catalog.Catalog 的 Debug 日志
   sys_log_verbose_modules=org.apache.doris.catalog.Catalog
   
   # 开启包 org.apache.doris.catalog 下所有类的 Debug 日志
   sys_log_verbose_modules=org.apache.doris.catalog
   
   # 开启包 org 下所有类的 Debug 日志
   sys_log_verbose_modules=org
   ```

   添加配置项并重启 FE 节点，即可生效。

- 通过 FE UI 界面

   通过 UI 界面可以在运行时修改日志级别。无需重启 FE 节点。在浏览器打开 FE 节点的 http 端口（默认为 8030），并登陆 UI 界面。之后点击上方导航栏的 `Log` 标签。

   ![通过 FE UI 界面](/images/log_manage/fe_web_log1.png)

   我们在 Add 输入框中可以输入包名或者具体的类名，可以打开对应的 Debug 日志。如输入 `org.apache.doris.catalog.Catalog` 则可以打开 Catalog 类的 Debug 日志：

   ![通过 FE UI 界面](/images/log_manage/fe_web_log2.png)

   你也可以在 Delete 输入框中输入包名或者具体的类名，来关闭对应的 Debug 日志。

   :::note
   这里的修改只会影响对应的 FE 节点的日志级别。不会影响其他 FE 节点的日志级别。
   :::

- 通过 API 修改

   通过以下 API 也可以在运行时修改日志级别。无需重启 FE 节点。

   ```shell
   curl -X POST -uuser:passwd fe_host:http_port/rest/v1/log?add_verbose=org.apache.doris.catalog.Catalog
   ```

   其中用户名密码为登陆 Doris 的 root 或 admin 用户。`add_verbose` 参数指定要开启 Debug 日志的包名或类名。若成功则返回：

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

   也可以通过以下 API 关闭 Debug 日志：

   ```shell
   curl -X POST -uuser:passwd fe_host:http_port/rest/v1/log?del_verbose=org.apache.doris.catalog.Catalog
   ```

   `del_verbose` 参数指定要关闭 Debug 日志的包名或类名。

## 容器环境日志配置

在某些情况下，通过容器环境（如 k8s）部署 FE 进程。所有日志需要通过标准输出流而不是文件进行输出。

此时，可以通过 `sh bin/start_fe.sh --console` 命令前台启动 FE 进程，并将所有日志输出到标准输出流。

为了在同一标准输出流中区分不同日志类型，会在每条日志前添加不同的前缀以示区分。如：

```
RuntimeLogger 2024-06-24 00:05:21,522 INFO (main|1) [DorisFE.start():158] Doris FE starting...
RuntimeLogger 2024-06-24 00:05:21,530 INFO (main|1) [FrontendOptions.analyzePriorityCidrs():194] configured prior_cidrs value: 172.20.32.136/24
RuntimeLogger 2024-06-24 00:05:21,535 INFO (main|1) [FrontendOptions.initAddrUseIp():101] local address: /172.20.32.136.
RuntimeLogger 2024-06-24 00:05:21,740 INFO (main|1) [ConsistencyChecker.initWorkTime():106] consistency checker will work from 23:00 to 23:00
RuntimeLogger 2024-06-24 00:05:21,889 ERROR (main|1) [Util.report():128] SLF4J: Class path contains multiple SLF4J bindings.
```

不同的前缀说明如下：

- `StdoutLogger`：标准输出流中的日志，对应 `fe.out` 中的内容。
- `StderrLogger`：标准错误流中的日志，对应 `fe.out` 中的内容。
- `RuntimeLogger`：对应 `fe.log` 中的日志。
- `AuditLogger`：对应 `fe.audit.log` 中的日志。
- 无前缀：对应 `fe.gc.log` 中的日志。

此外，针对容器环境还有一个额外配置参数：

| 配置项 | 默认值 | 可选项 | 说明 |
| --- | --- | --- | --- |
| `enable_file_logger` | true | true, false  | 是否启用文件日志。默认为 `true`。当使用 `--console` 命令启动 FE 进程时，日志会同时输出到标准输出流，以及正常的日志文件中。当为 `false` 时，日志只会输出到标准输出流，不会再产生日志文件 |
