---
{
    "title": "BE 日志管理",
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

本文主要介绍 Backend(BE) 进程的日志管理。

该文档适用于 2.1.4 及之后的 Doris 版本。

## 日志分类

当使用 `sh bin/start_be.sh --daemon` 方式启动 BE 进程后，BE 日志目录下会产生以下类型的日志文件：

- be.INFO

 BE 进程运行日志。BE 的主日志文件。BE 进程所有等级（DEBUG、INFO、WARN、ERROR 等）的运行日志都会打印到这个日志文件中。

 注意这个文件是一个软链，他指向的是当前最新的 BE 运行日志文件。

- be.WARNING

 BE 进程运行日志。但只会打印 WARN 级别以上的运行日志。be.WARNING 中的内容是 be.INFO 日志内容的子集。主要用于快速查看告警或错误级别日志。

 注意这个文件是一个软链，他指向的是当前最新的 BE 告警日志文件。

- be.out

 用于接收标准输出流和错误数据流的日志。比如 start 脚本中的 `echo` 命令输出等，或其他未被 glog 框架捕获到的日志信息。通常作为运行日志的补充。

 通常在 BE 异常宕机情况下，需要查看这个日志来获取异常堆栈。

- jni.log

 BE 进程通过 JNI 调用 Java 程序时，Java 程序打印的日志。

 TODO：未来版本中，这部分日志会统一到 be.INFO 日志中。

- be.gc.log

 BE JVM 的 GC 日志。该日志的行为由 be.conf 中的 JVM 启动项 `JAVA_OPTS` 控制。

## 日志配置

包括配置日志的存放路径、保留时间、保留数目、大小等。

以下配置项均在 `be.conf` 文件中配置。

| 配置项 | 默认值 | 可选项 | 说明 |
| --- | --- | --- | --- |
| `LOG_DIR` | `ENV(DORIS_HOME)/log` |  | 所有日志的存放路径。默认为 BE 部署路径的 `log/` 目录下。注意这是一个环境变量，配置名需大写。 |
| `sys_log_level` | `INFO` | `INFO`, `WARNING`, `ERROR`, `FATAL` | `be.INFO` 的日志等级。默认为 INFO。不建议修改，INFO 等级包含许多关键日志信息。|
| `sys_log_roll_num` | 10 |  | 控制 `be.INFO` 和 `be.WARNING` 最大文件数量。默认 10。当因为日志滚动或切分后，日志文件数量大于这个阈值后，老的日志文件将被删除  |
|`sys_log_verbose_modules`| | | 可以设置指定代码目录下的文件开启 DEBUG 级别日志。请参阅 "开启 DEBUG 日志" 章节 |
|`sys_log_verbose_level`| | | 请参阅 "开启 DEBUG 日志" 章节 |
|`sys_log_verbose_flags_v`| | | 请参阅 "开启 DEBUG 日志" 章节 |
| `sys_log_roll_mode` | `SIZE-MB-1024` | `TIME-DAY`, `TIME-HOUR`, `SIZE-MB-nnn` | `be.INFO` 和 `be.WARNING` 日志的滚动策略。默认为 `SIZE-MB-1024`，即每个日志达到 1024MB 大小后，生成一个新的日志文件。也可以设置按天或按小时滚动 |
| `log_buffer_level` | 空 | 空 或 `-1` | BE 日志输出模式。默认情况下，BE 日志会异步下刷到磁盘日志文件中。如果设置为 -1，则日志内容会实时下刷。实时下刷会影响日志性能，但可以尽可能多的保留最新的日志。如在 BE 异常宕机情况下，可以看到最后的日志信息。|
| `disable_compaction_trace_log` | true | true, false | 默认为 true，即关闭 compaction 操作的 tracing 日志。如果为 false，则会打印和 Compaction 操作相关的 tracing 日志，用于排查问题。|
| `aws_log_level` | 0 | | 用于控制 aws sdk 的日志等级。默认为 0，表示关闭 aws sdk 日志。默认情况下，aws sdk 日志已经被 glog 主动捕获，并会正常打印主动捕获的日志。个别情况下，需要开启 aws sdk 日志以查看更多未被捕获的日志。不同数字代表不同日志等级：Off = 0, Fatal = 1, Error = 2, Warn = 3, Info = 4, Debug = 5, Trace = 6 |
| `s3_file_writer_log_interval_second` | 60 | | 当执行 S3 Upload 操作时，会每隔 60 秒（默认）打印操作进度。 |
| `enable_debug_log_timeout_secs` | 0 | | 当值大于 0 时，会打印 pipeline 执行引擎的一些详细执行日志。主要用于排查问题。默认情况下关闭 |
| `sys_log_enable_custom_date_time_format` | false | | 是否允许自定义日志中的日期格式（自 2.1.7 版本支持） |
| `sys_log_custom_date_time_format` | `%Y-%m-%d %H:%M:%S` | | 默认的日志日期自定义格式，仅当 `sys_log_enable_custom_date_time_format` 为 `true` 时生效（自 2.1.7 版本支持） |
| `sys_log_custom_date_time_ms_format` | `,{:03d}` | | 默认的日志日期中的时间精度，仅当 `sys_log_enable_custom_date_time_format` 为 `true` 时生效（自 2.1.7 版本支持） |

## 开启 DEBUG 日志

### 静态配置

在 `be.conf` 中设置 `sys_log_verbose_modules` 与 `sys_log_verbose_level`。

```text
sys_log_verbose_modules=plan_fragment_executor,olap_scan_node
sys_log_verbose_level=3
```

`sys_log_verbose_modules` 指定要开启的文件名，可以通过通配符 `*` 指定。比如：

```text
sys_log_verbose_modules=*
```

表示开启所有 DEBUG 日志。

`sys_log_verbose_level` 表示 DEBUG 的级别。数字越大，则 DEBUG 日志越详细。取值范围在 1-10。

### 动态调整

通过以下 RESTful API 即可：

```bash
curl -X POST "http://<be_host>:<webport>/api/glog/adjust?module=<module_name>&level=<level_number>"
```

动态调整方式同样支持通配符，例如使用 `module=*&level=10` 将打开所有 BE vlog。但通配符与单独的模块名互不隶属，例如将 `moduleA` 的 vlog 级别调整为 `10`，再使用 `module=*&level=-1`，并**不会**关闭 `moduleA` 的 vlog。

注意：动态调整的配置不会被持久化，BE 重启后将会失效。

另外无论通过何种方式，只要模块不存在，GLOG 将会创建对应日志模块（没有实际影响），并不会返回错误。

## 容器环境日志配置

在某些情况下，通过容器环境（如 k8s）部署 FE 进程。所有日志需要通过标准输出流而不是文件进行输出。

此时，可以通过 `sh bin/start_be.sh --console` 命令前台启动 BE 进程，并将所有日志输出到标准输出流。

为了在同一标准输出流中区分不同日志类型，会在每条日志前添加不同的前缀以示区分。如：

```
RuntimeLogger W20240624 00:36:46.325274 1460943 olap_server.cpp:710] Have not get FE Master heartbeat yet
RuntimeLogger I20240624 00:36:46.325999 1459644 olap_server.cpp:208] tablet checkpoint tasks producer thread started
RuntimeLogger I20240624 00:36:46.326066 1460954 olap_server.cpp:448] begin to produce tablet meta checkpoint tasks.
RuntimeLogger I20240624 00:36:46.326093 1459644 olap_server.cpp:213] tablet path check thread started
RuntimeLogger I20240624 00:36:46.326190 1459644 olap_server.cpp:219] cache clean thread started
RuntimeLogger I20240624 00:36:46.326336 1459644 olap_server.cpp:231] path gc threads started. number:1
RuntimeLogger I20240624 00:36:46.326643 1460958 olap_server.cpp:424] try to start path gc thread!
```

不同的前缀说明如下：

- `RuntimeLogger`：对应 `fe.log` 中的日志。

> 后续版本会增加对 jni.log 的支持。

此外，针对容器环境还有一个额外配置参数：

| 配置项 | 默认值 | 可选项 | 说明 |
| --- | --- | --- | --- |
| `enable_file_logger` | true | true, false  | 是否启用文件日志。默认为 `true`。当使用 `--console` 命令启动 BE 进程时，日志会同时输出到标准输出流，以及正常的日志文件中。当为 `false` 时，日志只会输出到标准输出流，不会再产生日志文件 |
