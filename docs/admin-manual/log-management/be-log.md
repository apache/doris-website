---
{
    "title": "BE Log Management",
    "language": "en"
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

This document mainly introduces the log management of the Backend (BE) process.

This document is applicable to Doris versions 2.1.4 and later.

## Log Categories

When starting the BE process using `sh bin/start_be.sh --daemon`, the following types of log files will be generated in the BE log directory:

- be.INFO

  BE process running log. The main log file for BE. All levels of BE process running logs (DEBUG, INFO, WARN, ERROR, etc.) will be printed to this log file.

  Note that this file is a symbolic link pointing to the current latest BE running log file.

- be.WARNING

  BE process running log. However, only WARN level and above running logs will be printed. The content in be.WARNING is a subset of the be.INFO log content. It is mainly used for quickly viewing warning or error level logs.

  Note that this file is a symbolic link pointing to the current latest BE warning log file.

- be.out

  Used to receive standard output streams and error data streams. For example, output from `echo` commands in start scripts, or other log information not captured by the glog framework. Usually used as a supplement to running logs.

  Typically, in the event of a BE crash, you need to check this log to obtain the stack trace of the exception.

- jni.log

  Logs printed by Java programs when the BE process calls Java programs through JNI.

  TODO: In future versions, this part of the logs will be unified into the be.INFO log.

- be.gc.log

  BE JVM's GC log. The behavior of this log is controlled by the JVM startup option `JAVA_OPTS` in be.conf.

## Log Configuration

Includes configuring log storage paths, retention time, retention count, size, etc.

The following configuration items are configured in the `be.conf` file.

| Configuration Item | Default Value | Options | Description |
| --- | --- | --- | --- |
| `LOG_DIR` | `ENV(DORIS_HOME)/log` |  | Storage path for all logs. By default, it is the `log/` directory under the BE deployment path. Note that this is an environment variable, and the configuration name needs to be in uppercase. |
| `sys_log_level` | `INFO` | `INFO`, `WARNING`, `ERROR`, `FATAL` | Log level for `be.INFO`. Default is INFO. Not recommended to change, as INFO level contains many critical log information. |
| `sys_log_roll_num` | 10 |  | Controls the maximum number of files for `be.INFO` and `be.WARNING`. Default is 10. When the number of log files exceeds this threshold due to log rolling or splitting, older log files will be deleted. |
| `sys_log_verbose_modules`| | | Can set specific code directories to enable DEBUG level logs. See the "Enable DEBUG Logs" section for details. |
| `sys_log_verbose_level`| | | See the "Enable DEBUG Logs" section for details. |
| `sys_log_verbose_flags_v`| | | See the "Enable DEBUG Logs" section for details. |
| `sys_log_roll_mode` | `SIZE-MB-1024` | `TIME-DAY`, `TIME-HOUR`, `SIZE-MB-nnn` | Rolling strategy for `be.INFO` and `be.WARNING` logs. Default is `SIZE-MB-1024`, meaning a new log file is generated after each log reaches 1024MB in size. Can also set to roll by day or hour. |
| `log_buffer_level` | Empty | Empty or `-1` | BE log output mode. By default, BE logs are asynchronously flushed to disk log files. If set to -1, log content will be flushed in real-time. Real-time flushing affects log performance but can retain the latest logs as much as possible. This allows viewing the last log information in the event of a BE crash. |
| `disable_compaction_trace_log` | true | true, false | Default is true, meaning tracing logs for compaction operations are disabled. If set to false, tracing logs related to Compaction operations will be printed for troubleshooting. |
| `aws_log_level` | 0 | | Controls the log level for the AWS SDK. Default is 0, indicating AWS SDK logs are turned off. By default, AWS SDK logs are actively captured by glog and will be printed normally. In some cases, you may need to enable AWS SDK logs to view more uncaptured logs. Different numbers represent different log levels: Off = 0, Fatal = 1, Error = 2, Warn = 3, Info = 4, Debug = 5, Trace = 6. |
| `s3_file_writer_log_interval_second` | 60 | | When performing S3 Upload operations, the progress of operations is printed every 60 seconds by default. |
| `enable_debug_log_timeout_secs` | 0 | | When the value is greater than 0, some detailed execution logs of the pipeline execution engine will be printed. Mainly used for troubleshooting. By default, this is turned off. |
| `sys_log_enable_custom_date_time_format` | false | | Whether to allow custom date format in logs (supported since version 2.1.7) |
| `sys_log_custom_date_time_format` | `%Y-%m-%d %H:%M:%S` | | The default custom format for log date, only effective when `sys_log_enable_custom_date_time_forma` is `true` (supported since version 2.1.7) |
| `sys_log_custom_date_time_ms_format` | `,{:03d}` | | The default time precision in the log date. This is only effective when `sys_log_enable_custom_date_time_format` is `true` (supported since version 2.1.7) |


## Enable DEBUG Log

### Static Configuration

Set `sys_log_verbose_modules` and `sys_log_verbose_level` in `be.conf`:

```text
sys_log_verbose_modules=plan_fragment_executor,olap_scan_node
sys_log_verbose_level=3
```

`sys_log_verbose_modules` Specifies the names of the files to be opened, which can be specified by the wildcard `*`. For example:

```text
sys_log_verbose_modules=*
```

will turn on all BE verbose log.

`sys_log_verbose_level` Indicates the level of DEBUG. The higher the number, the more detailed the DEBUG log. The value ranges from 1 to 10.

### Dynamic Modification

Since 2.1, the DEBUG log of BE supports dynamic modification via the following RESTful API:

```bash
curl -X POST "http://<be_host>:<webport>/api/glog/adjust?module=<module_name>&level=<level_number>"
```

The dynamic adjustment method also supports wildcards, e.g. using `module=*&level=10` will turn on all BE vlogs, but wildcards are not attached to individual module names. e.g. adjusting the vlog level of `moduleA` to `10`, then using `module=*&level=-1` will **NOT** turn off the vlog of `moduleA`'s vlog.

Note: Dynamically adjusted configurations are not persisted and will expire after a BE reboot.

In addition, GLOG will create the corresponding log module if the module does not exist (no real effect) and will not return an error, regardless of the method.

## Container Environment Log Configuration

In some cases, the FE process is deployed through container environments (such as k8s). All logs need to be output through standard output streams instead of files.

At this time, you can start the BE process in the foreground and output all logs to the standard output stream by using the command `sh bin/start_be.sh --console`.

To distinguish different types of logs in the same standard output stream, a different prefix will be added before each log. For example:

```
RuntimeLogger W20240624 00:36:46.325274 1460943 olap_server.cpp:710] Have not get FE Master heartbeat yet
RuntimeLogger I20240624 00:36:46.325999 1459644 olap_server.cpp:208] tablet checkpoint tasks producer thread started
RuntimeLogger I20240624 00:36:46.326066 1460954 olap_server.cpp:448] begin to produce tablet meta checkpoint tasks.
RuntimeLogger I20240624 00:36:46.326093 1459644 olap_server.cpp:213] tablet path check thread started
RuntimeLogger I20240624 00:36:46.326190 1459644 olap_server.cpp:219] cache clean thread started
RuntimeLogger I20240624 00:36:46.326336 1459644 olap_server.cpp:231] path gc threads started. number:1
RuntimeLogger I20240624 00:36:46.326643 1460958 olap_server.cpp:424] try to start path gc thread!
```

The meanings of different prefixes are as follows:

- `RuntimeLogger`: corresponds to the logs in `fe.log`.

> Support for `jni.log` will be added in future versions.

In addition, there is an additional configuration parameter for container environments:

| Configuration Item | Default Value | Options | Description |
| --- | --- | --- | --- |
| `enable_file_logger` | true | true, false | Whether to enable file logging. The default is `true`. When starting the BE process with the `--console` command, logs will be output to both the standard output stream and the normal log file. When set to `false`, logs will only be output to the standard output stream and will not generate log files. |

