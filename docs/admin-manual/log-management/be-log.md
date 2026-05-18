---
{
    "title": "BE Log Management",
    "language": "en",
    "description": "Apache Doris Backend (BE) process log management guide: log categories, log path and rolling policy configuration, how to enable DEBUG logs, and log output configuration in container environments.",
    "keywords": [
        "Doris BE logs",
        "Backend logs",
        "be.INFO",
        "be.WARNING",
        "be.out",
        "jni.log",
        "be.gc.log",
        "sys_log_level",
        "sys_log_roll_mode",
        "sys_log_verbose_modules",
        "DEBUG logs",
        "dynamic log level adjustment",
        "glog adjust",
        "container logs",
        "Kubernetes BE logs",
        "enable_file_logger",
        "Doris log path",
        "BE log configuration"
    ]
}
---

This document describes the logging system of the Apache Doris Backend (BE) process: log file categories, configuration of log paths and rolling policies, how to enable DEBUG logs, and how to send logs to the standard output stream in containerized environments such as Kubernetes.

This document applies to Apache Doris 2.1.4 and later.

<!-- Knowledge type: Configuration parameters / Procedures -->
<!-- Use cases: Daily operations / Troubleshooting / Containerized deployment -->

## Use Cases

| Scenario | Recommended section |
| --- | --- |
| Understand which log files the BE process produces | [Log Categories](#log-categories) |
| Adjust the log storage path, rolling policy, or retention count | [Log Configuration](#log-configuration) |
| Troubleshoot issues that require DEBUG-level logs | [Enable DEBUG Logs](#enable-debug-logs) |
| Deploy BE in a container environment (such as Kubernetes) and send logs to stdout | [Container Environment Log Configuration](#container-environment-log-configuration) |
| Look up the stack trace after a BE crash | Check `be.out` (see [Log Categories](#log-categories)) |

## Log Categories

After starting the BE process with `sh bin/start_be.sh --daemon`, the following log files are generated in the BE log directory:

| File name | Content | Notes |
| --- | --- | --- |
| `be.INFO` | The main runtime log of the BE process. Includes all levels: DEBUG, INFO, WARN, ERROR | A symbolic link that points to the current latest BE runtime log file |
| `be.WARNING` | Runtime logs at WARN level and above only. A subset of `be.INFO` | A symbolic link that points to the current latest BE warning log file. Useful for quickly viewing warnings or errors |
| `be.out` | Logs from the standard output stream (stdout) and standard error stream (stderr), such as `echo` output in the startup script and logs not captured by the glog framework | When BE crashes, this file usually contains the crash stack trace |
| `jni.log` | Logs printed by Java programs when BE invokes them through JNI | TODO: In a future release, this log will be merged into `be.INFO` |
| `be.gc.log` | The GC log of the BE JVM | Controlled by the JVM startup option `JAVA_OPTS` in `be.conf` |

## Log Configuration

<!-- Knowledge type: Configuration parameters -->
<!-- Use cases: Log path adjustment / Rolling policy tuning / Log retention policy management -->

The following configuration items are all located in the `be.conf` file. They control the log storage path, retention time, retention count, per-file size, rolling policy, and so on.

| Configuration item | Default value | Options | Description |
| --- | --- | --- | --- |
| `LOG_DIR` | `ENV(DORIS_HOME)/log` | — | Storage path for all logs. By default, it is the `log/` directory under the BE deployment path. Note that this is an environment variable, so the configuration name must be in uppercase. |
| `sys_log_level` | `INFO` | `INFO`, `WARNING`, `ERROR`, `FATAL` | Log level for `be.INFO`. The default is `INFO`. Changing this is not recommended, because the `INFO` level includes many critical log messages. |
| `sys_log_roll_num` | `10` | — | Maximum number of files for `be.INFO` and `be.WARNING`. The default is 10. When log rolling or splitting causes the number of files to exceed this threshold, older logs are deleted. |
| `sys_log_verbose_modules` | Empty | — | Specifies the source code files for which to enable DEBUG-level logs. See [Enable DEBUG Logs](#enable-debug-logs) for details. |
| `sys_log_verbose_level` | Empty | — | Verbosity level for DEBUG logs. See [Enable DEBUG Logs](#enable-debug-logs) for details. |
| `sys_log_verbose_flags_v` | Empty | — | Corresponds to `FLAGS_v` in glog. Used to globally control the verbosity of DEBUG logs. See [Enable DEBUG Logs](#enable-debug-logs) for details. |
| `sys_log_roll_mode` | `SIZE-MB-1024` | `TIME-DAY`, `TIME-HOUR`, `SIZE-MB-nnn` | Rolling policy for `be.INFO` and `be.WARNING`. The default is `SIZE-MB-1024`, meaning a new file is generated each time the log reaches 1024 MB. Can also be changed to roll by day or by hour. |
| `log_buffer_level` | Empty | Empty or `-1` | BE log output mode. The default is asynchronous flushing to disk. When set to `-1`, logs are flushed in real time, which sacrifices some performance but preserves the latest logs as much as possible when BE crashes. |
| `disable_compaction_trace_log` | `true` | `true`, `false` | Whether to disable tracing logs for Compaction operations. The default is `true`, meaning they are disabled. When set to `false`, Compaction tracing logs are printed to help troubleshoot Compaction-related issues. |
| `aws_log_level` | `0` | `0`–`6` | Controls the log level of the AWS SDK. The default is `0` (disabled). glog already captures and prints AWS SDK logs by default; enable this only when you need to view logs that have not been captured. Level mapping: `Off=0`, `Fatal=1`, `Error=2`, `Warn=3`, `Info=4`, `Debug=5`, `Trace=6`. |
| `s3_file_writer_log_interval_second` | `60` | — | Interval in seconds at which progress is printed during S3 Upload operations. |
| `enable_debug_log_timeout_secs` | `0` | — | When greater than `0`, detailed execution logs of the Pipeline execution engine are printed, for troubleshooting. Disabled by default. |
| `sys_log_enable_custom_date_time_format` | `false` | `true`, `false` | Whether to allow customizing the date format in logs (supported since version 2.1.7). |
| `sys_log_custom_date_time_format` | `%Y-%m-%d %H:%M:%S` | — | Custom date format for logs. Takes effect only when `sys_log_enable_custom_date_time_format` is `true` (supported since version 2.1.7). |
| `sys_log_custom_date_time_ms_format` | `,{:03d}` | — | Custom millisecond precision format for log dates. Takes effect only when `sys_log_enable_custom_date_time_format` is `true` (supported since version 2.1.7). |

## Enable DEBUG Logs

<!-- Knowledge type: Procedures -->
<!-- Use cases: Troubleshooting / Performance issue diagnosis -->

BE supports two ways to enable DEBUG logs:

- **Static configuration**: Configure in `be.conf` and restart BE for the changes to take effect. The configuration is persistent.
- **Dynamic adjustment**: Modify on the fly through a RESTful API without restarting. The configuration is not persistent and is lost after BE restarts.

### Static Configuration

Set `sys_log_verbose_modules` and `sys_log_verbose_level` in `be.conf`:

```text
sys_log_verbose_modules=plan_fragment_executor,olap_scan_node
sys_log_verbose_level=3
```

Parameter descriptions:

| Parameter | Purpose |
| --- | --- |
| `sys_log_verbose_modules` | Specifies the source file names for which to enable DEBUG. Separate multiple files with commas. Supports the wildcard `*`. For example, `sys_log_verbose_modules=*` enables DEBUG logs for all modules. |
| `sys_log_verbose_level` | DEBUG verbosity level. Valid range is `1` to `10`. Higher numbers produce more detailed logs. |
| `sys_log_verbose_flags_v` | Corresponds to `FLAGS_v` in glog and globally controls log verbosity. `VLOG(n)` logs are emitted only when `n <= FLAGS_v`, which allows finer-grained control over output. Its scope is **not** limited by `sys_log_verbose_modules`. |

In most cases, configuring `sys_log_verbose_modules` and `sys_log_verbose_level` is enough. Only set `sys_log_verbose_flags_v` when some debug logs do not appear as expected.

### Dynamic Adjustment

Since Doris 2.1, BE DEBUG logs can be adjusted dynamically through a RESTful API:

```bash
curl -X POST "http://<be_host>:<webport>/api/glog/adjust?module=<module_name>&level=<level_number>"
```

Parameters:

- `<be_host>`: Host address of the BE node.
- `<webport>`: HTTP port of BE. The default is `8040`.
- `<module_name>`: Name of the module to adjust (the source file name). Supports the wildcard `*`.
- `<level_number>`: DEBUG verbosity level. `-1` disables it.

Usage notes:

- **The configuration is not persistent**: Dynamic adjustments are lost after BE restarts. You must set them again after a restart.
- **Wildcards and individual modules are independent**: For example, if you first set the vlog level of `moduleA` to `10` and then run `module=*&level=-1`, the vlog of `moduleA` is **not** turned off.
- **Module names are not validated**: Regardless of the method used, if the module does not exist, glog creates the corresponding log module (with no actual effect) and does not return an error.

## Container Environment Log Configuration

<!-- Knowledge type: Configuration parameters / Procedures -->
<!-- Use cases: Kubernetes / Containerized deployment / stdout log collection -->

When deploying BE in container environments such as Kubernetes, all logs typically need to be sent to the standard output stream rather than to files, so that the container orchestration platform can collect them centrally.

### Startup

Use the `--console` parameter to start the BE process in the foreground and send all logs to the standard output stream:

```shell
sh bin/start_be.sh --console
```

### Log Prefix Description

Because multiple log types are sent to the same standard output stream, BE adds a prefix to each log entry to distinguish them. Example output:

```text
RuntimeLogger W20240624 00:36:46.325274 1460943 olap_server.cpp:710] Have not get FE Master heartbeat yet
RuntimeLogger I20240624 00:36:46.325999 1459644 olap_server.cpp:208] tablet checkpoint tasks producer thread started
RuntimeLogger I20240624 00:36:46.326066 1460954 olap_server.cpp:448] begin to produce tablet meta checkpoint tasks.
RuntimeLogger I20240624 00:36:46.326093 1459644 olap_server.cpp:213] tablet path check thread started
RuntimeLogger I20240624 00:36:46.326190 1459644 olap_server.cpp:219] cache clean thread started
RuntimeLogger I20240624 00:36:46.326336 1459644 olap_server.cpp:231] path gc threads started. number:1
RuntimeLogger I20240624 00:36:46.326643 1460958 olap_server.cpp:424] try to start path gc thread!
```

Meaning of each prefix:

| Prefix | Corresponding log |
| --- | --- |
| `RuntimeLogger` | Logs from `be.log` |

> Support for `jni.log` prefixes will be added in a future release.

### Container-Specific Configuration

| Configuration item | Default value | Options | Description |
| --- | --- | --- | --- |
| `enable_file_logger` | `true` | `true`, `false` | Whether to also enable file logging. The default is `true`, meaning that when BE is started with `--console`, logs are written to both stdout and log files. When set to `false`, logs are written to stdout only, and no log files are generated. |

## FAQ

### Q: BE crashed, but no obvious stack trace appears in `be.INFO`

Check `be.out`. The crash stack trace from a BE abnormal exit is usually written to this file.

### Q: Log configuration does not take effect after editing `be.conf`

Static configuration requires restarting BE to take effect. For immediate changes, use the [Dynamic Adjustment](#dynamic-adjustment) RESTful API.

### Q: A dynamically adjusted vlog level is lost after a restart

Dynamic adjustments are not persisted. Either set them again after the restart, or write them into `be.conf`.

### Q: After enabling DEBUG logs, the log volume is too large and disk space is tight

Lower `sys_log_verbose_level`, narrow the scope of `sys_log_verbose_modules`, or adjust `sys_log_roll_num` to control the retention count.

### Q: No log output appears on stdout in a container environment

Confirm that BE is started with `sh bin/start_be.sh --console`. To disable file logging, set `enable_file_logger` to `false`.

### Q: Troubleshooting AWS SDK issues

Temporarily raise `aws_log_level` (for example to `4` or `5`), then set it back to `0` after troubleshooting to avoid generating too much log output.
