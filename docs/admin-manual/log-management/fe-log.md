---
{
    "title": "FE Log Management",
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

This document mainly introduces the log management of the Frontend (FE) process.

This document is applicable to Doris versions 2.1.4 and later.

## Log Categories

When starting the FE process using `sh bin/start_fe.sh --daemon`, the following types of log files will be generated in the FE log directory:

- fe.log

  FE process running log. The main log file for FE. All levels of FE process logs (DEBUG, INFO, WARN, ERROR, etc.) will be printed to this log file.

- fe.warn.log

  FE process running log. Only prints logs at WARN level and above. The content in fe.warn.log is a subset of the fe.log log content. It is mainly used to quickly view warning or error level logs.

- fe.audit.log

  Audit log. Used to record all database operation records executed through this FE node. This includes SQL, DDL, DML statements, etc.

- fe.out

  Used to receive standard output stream and error data stream logs. For example, output from `echo` commands in start scripts, or other log information not captured by the log4j framework. Usually serves as a supplement to the running log. In rare cases, you may need to check the content of fe.out for more information.

- fe.gc.log

  GC log of the FE JVM. The behavior of this log is controlled by the JVM startup option `JAVA_OPTS` in fe.conf.

## Log Configuration

Includes configuring the log storage path, retention time, retention count, size, etc.

The following configuration items are configured in the `fe.conf` file.

| Configuration Item | Default Value | Options | Description |
| --- | --- | --- | --- |
| `LOG_DIR` | `ENV(DORIS_HOME)/log` |  | Storage path for all logs. By default, it is the `log/` directory under the FE deployment path. Note that this is an environment variable, and the configuration name should be in uppercase. |
| `sys_log_level` | `INFO` | `INFO`, `WARN`, `ERROR`, `FATAL` | Log level of `fe.log`. Default is INFO. Not recommended to change, as INFO level contains many critical log information. |
| `sys_log_roll_num` | 10 |  | Controls the maximum number of files for `fe.log` and `fe.warn.log`. Default is 10. When the number of log files exceeds this threshold due to log rolling or splitting, older log files will be deleted. |
| `sys_log_verbose_modules` |  |  | Can set specific Java package files to enable DEBUG level logging. See the "Enable DEBUG Log" section for details. |
| `sys_log_enable_compress` | false | true, false | Whether to enable compression for historical `fe.log` and `fe.warn.log` logs. Default is off. When enabled, historical audit logs will be archived using gzip compression. |
| `log_rollover_strategy` | `age` | `age`, `size` | Log retention strategy, default is `age`, which retains historical logs based on time. `size` retains historical logs based on log size. |
| `sys_log_delete_age` | 7d | Supports formats like 7d, 10h, 60m, 120s | Only effective when `log_rollover_strategy` is `age`. Controls the number of days to retain `fe.log` and `fe.warn.log` files. Default is 7 days. Logs older than 7 days will be automatically deleted. |
| `audit_log_delete_age` | 7d | Supports formats like 7d, 10h, 60m, 120s | Only effective when `log_rollover_strategy` is `age`. Controls the number of days to retain `fe.audit.log` files. Default is 30 days. Logs older than 30 days will be automatically deleted. |
| `info_sys_accumulated_file_size` | 4 |  | Only effective when `log_rollover_strategy` is `size`. Controls the cumulative size of `fe.log` files. Default is 4GB. When the cumulative log size exceeds this threshold, historical log files will be deleted. |
| `warn_sys_accumulated_file_size` | 2 |  | Only effective when `log_rollover_strategy` is `size`. Controls the cumulative size of `fe.warn.log` files. Default is 2GB. When the cumulative log size exceeds this threshold, historical log files will be deleted. |
| `audit_sys_accumulated_file_size` | 4 |  | Only effective when `log_rollover_strategy` is `size`. Controls the cumulative size of `fe.audit.log` files. Default is 4GB. When the cumulative log size exceeds this threshold, historical log files will be deleted. |
| `log_roll_size_mb` | 1024 |  | Controls the maximum size of individual files for `fe.log`, `fe.warn.log`, `fe.audit.log`. Default is 1024MB. When a single log file exceeds this threshold, a new file will be created automatically. |
| `sys_log_roll_interval` | `DAY` | `DAY`, `HOUR` | Controls the rolling interval of `fe.log` and `fe.warn.log`. Default is 1 day, generating a new log file every day. |
| `audit_log_roll_num` | 90 |  | Controls the maximum number of files for `fe.audit.log`. Default is 90. When the number of log files exceeds this threshold due to log rolling or splitting, older log files will be deleted. |
| `audit_log_roll_interval` | `DAY` | `DAY`, `HOUR` | Controls the rolling interval of `fe.audit.log`. Default is 1 day, generating a new log file every day. |
| `audit_log_dir` | `ENV(DORIS_HOME)/log` |  | Can specify a separate storage path for `fe.audit.log`. Default is the `log/` directory under the FE deployment path. |
| `audit_log_modules` | `{"slow_query", "query", "load", "stream_load"}` |  | Module types in `fe.audit.log`. Default includes slow query, query, load, stream load. "Query" includes all DDL, DML, SQL operations. "Slow query" refers to operations that exceed the `qe_slow_log_ms` threshold. "Load" refers to Broker Load. "Stream load" refers to stream load operations. |
| `qe_slow_log_ms` | 5000 |  | When the execution time of DDL, DML, SQL statements exceeds this threshold, it will be separately recorded in the `slow_query` module of `fe.audit.log`. Default is 5000 ms. |
| `audit_log_enable_compress` | false | true, false | Whether to enable compression for historical `fe.audit.log` logs. Default is off. When enabled, historical audit logs will be archived using gzip compression. |
| `sys_log_mode` | `NORMAL` | `NORMAL`, `BRIEF`, `ASYNC` | Output mode of FE logs. `NORMAL` is the default output mode, with synchronous output and location information. `BRIEF` mode is synchronous output without location information. `ASYNC` mode is asynchronous output without location information, with performance increasing in that order. |


## Enable DEBUG Log

The Debug level log of FE can be enabled by modifying the configuration file or through the interface or API during runtime.

- Enable through configuration file

   Add the configuration item `sys_log_verbose_modules` in fe.conf. For example:

   ```text
   # 仅开启类 org.apache.doris.catalog.Catalog 的 Debug 日志
   sys_log_verbose_modules=org.apache.doris.catalog.Catalog
   
   # 开启包 org.apache.doris.catalog 下所有类的 Debug 日志
   sys_log_verbose_modules=org.apache.doris.catalog
   
   # 开启包 org 下所有类的 Debug 日志
   sys_log_verbose_modules=org
   ```

   Add the configuration item and restart the FE node to take effect.

- Enable through FE UI interface

   You can modify the log level at runtime through the UI interface. No need to restart the FE node. Open the FE node's http port in the browser (default is 8030) and log in to the UI interface. Then click on the `Log` tab in the top navigation bar.

   ![](/images/log_manage/fe_web_log1.png)

   In the Add input box, you can enter the package name or specific class name to open the corresponding Debug log. For example, entering `org.apache.doris.catalog.Catalog` will open the Debug log of the Catalog class:

   ![](/images/log_manage/fe_web_log2.png)

   You can also enter the package name or specific class name in the Delete input box to close the corresponding Debug log.

   :::note
   The modification here will only affect the log level of the corresponding FE node. It will not affect the log level of other FE nodes.
   :::

- Modify through API

   You can also modify the log level at runtime through the following API. No need to restart the FE node.

   ```bash
   curl -X POST -uuser:passwd fe_host:http_port/rest/v1/log?add_verbose=org.apache.doris.catalog.Catalog
   ```

   Where the username and password are the root or admin users logged into Doris. The `add_verbose` parameter specifies the package name or class name for enabling Debug log. If successful, it will return:

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

   You can also close Debug log through the following API:

   ```bash
   curl -X POST -uuser:passwd fe_host:http_port/rest/v1/log?del_verbose=org.apache.doris.catalog.Catalog
   ```

   The `del_verbose` parameter specifies the package name or class name for closing Debug log.

## Container Environment Log Configuration

In some cases, the FE process is deployed through a container environment (such as k8s). All logs need to be output through standard output stream instead of files.

In this case, you can start the FE process in the foreground and output all logs to the standard output stream by using the command `sh bin/start_fe.sh --console`.

To distinguish different types of logs in the same standard output stream, a different prefix will be added before each log. For example:

```
RuntimeLogger 2024-06-24 00:05:21,522 INFO (main|1) [DorisFE.start():158] Doris FE starting...
RuntimeLogger 2024-06-24 00:05:21,530 INFO (main|1) [FrontendOptions.analyzePriorityCidrs():194] configured prior_cidrs value: 172.20.32.136/24
RuntimeLogger 2024-06-24 00:05:21,535 INFO (main|1) [FrontendOptions.initAddrUseIp():101] local address: /172.20.32.136.
RuntimeLogger 2024-06-24 00:05:21,740 INFO (main|1) [ConsistencyChecker.initWorkTime():106] consistency checker will work from 23:00 to 23:00
RuntimeLogger 2024-06-24 00:05:21,889 ERROR (main|1) [Util.report():128] SLF4J: Class path contains multiple SLF4J bindings.
```

The meanings of different prefixes are as follows:

- `StdoutLogger`: Logs in the standard output stream, corresponding to the content in `fe.out`.
- `StderrLogger`: Logs in the standard error stream, corresponding to the content in `fe.out`.
- `RuntimeLogger`: Logs in `fe.log`.
- `AuditLogger`: Logs in `fe.audit.log`.
- No prefix: Logs in `fe.gc.log`.

Additionally, there is an additional configuration parameter for the container environment:

| Configuration Item | Default Value | Options | Description |
| --- | --- | --- | --- |
| `enable_file_logger` | true | true, false  | Whether to enable file logging. Default is `true`. When starting the FE process with the `--console` command, logs will be output to both the standard output stream and the normal log file. When set to `false`, logs will only be output to the standard output stream and will not generate log files. |
