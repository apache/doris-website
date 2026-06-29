---
title: BE 线程堆栈
language: zh-CN
description: 通过 Apache Doris BE HTTP API 采集运行中 BE 进程的实时线程堆栈。
keywords:
    - Apache Doris
    - BE 线程堆栈
    - BE 打栈
    - 故障排查
    - 调试
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

# BE 线程堆栈

<!-- 知识类型: 工具使用 -->
<!-- 适用场景: 故障排查 -->

## 用途

BE 线程堆栈 API 用于通过 HTTP 采集运行中 Apache Doris BE 进程的实时线程堆栈。BE 出现响应慢、线程阻塞或 CPU 异常消耗时，可使用该接口辅助定位问题。接口返回纯文本结果，且只采集目标 BE。

该 API 仅支持 Linux BE 进程。

## 快速使用

1. 查询目标 BE 的 HTTP 入口：

    ```sql
    SHOW BACKENDS;
    ```

    使用目标 BE 的 `Host` 与 `HttpPort` 字段。

2. 采集所有 BE 线程堆栈：

    ```bash
    curl -s "http://{be_host}:{be_webport}/api/stack_trace" -o be_stack_trace.txt
    ```

3. 采集指定线程 ID 的堆栈：

    线程 ID 可从一次全量打栈结果中获取，也可通过 `top -H -p <be_pid>` 等系统工具查看。

    ```bash
    curl -s "http://{be_host}:{be_webport}/api/stack_trace?thread_id=12345,12346&mode=FAST&timeout_ms=3000" -o be_stack_trace_tid.txt
    ```

4. 如需避免向处于易被中断系统调用中的线程发送信号，可使用保守模式：

    ```bash
    curl -s "http://{be_host}:{be_webport}/api/stack_trace?skip_blocking_syscalls=true" -o be_stack_trace_safe.txt
    ```

## 参数说明

所有参数都是 `GET /api/stack_trace` 的可选查询参数。

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `thread_id` | 无 | Linux 线程 ID，多个 ID 用英文逗号分隔。不指定时采集所有 BE 线程。 |
| `tid` | 无 | `thread_id` 的兼容别名，不能与 `thread_id` 同时使用。 |
| `mode` | `FAST` | `dwarf_location_info_mode` 的别名。可选值：`DISABLED`、`FAST`、`FULL`、`FULL_WITH_INLINE`。 |
| `dwarf_location_info_mode` | `FAST` | 控制 DWARF 符号化详情。如果同时设置 `mode` 与该参数，以该参数为准。 |
| `timeout_ms` | `100` | 单个线程的采集超时时间，单位为毫秒。有效范围：`1` 到 `10000`。 |
| `skip_blocking_syscalls` | `false` | 是否跳过处于 `read`、`poll`、`select`、`epoll_wait`、`futex`、`nanosleep` 等系统调用中的线程。可选值：`true`、`false`、`1`、`0`。 |

符号化模式建议：

| 模式 | 使用场景 |
|------|----------|
| `DISABLED` | 最快模式。只需要线程名、状态与原始栈帧时使用。 |
| `FAST` | 默认模式，适合大多数排查场景。 |
| `FULL` | 输出更完整的文件与行号信息，仅在 `FAST` 信息不足时使用。 |
| `FULL_WITH_INLINE` | 包含 inline frame 信息，开销最大。 |

## 输出说明

接口返回内容包含采集元信息、每个线程的堆栈段，以及最后的汇总行。

示例：

```text
BE thread stack traces
pid: 96543
service_signal: 40
thread_count: 1168
timeout_ms_per_thread: 100
dwarf_location_info_mode: fast
skip_blocking_syscalls: false
signal_handler_unwinder: frame_pointer_with_coordinator_signal_context_libunwind_fallback

----- thread ... (p_normal_simple) status=ok capture_method=frame_pointer frames=29 fp_status=end_of_chain ... -----
    0#  doris::md5_hex_batch(...)
    1#  doris::FunctionStringDigestMulti<doris::MD5Sum>::vector_execute_single_md5(...)
    ...
    20# doris::AggSinkLocalState::_execute_without_key(doris::Block*)
    21# doris::AggSinkLocalState::Executor<true, false>::execute(...)
    22# doris::AggSinkOperatorX::sink_impl(...)
    23# doris::DataSinkOperatorXBase::sink(...)
    24# doris::PipelineTask::execute(bool*)
    25# doris::TaskScheduler::_do_work(int)

summary: captured=1160 skipped=4 timed_out=0 remote_signal_attempts=1164
```

常见线程状态：

| 状态 | 含义 |
|------|------|
| `ok` | 成功采集堆栈。 |
| `ok_current_thread` | 采集的是 HTTP 处理线程自身的堆栈。 |
| `skipped_blocking_syscall` | 设置了 `skip_blocking_syscalls=true`，且线程处于易被中断的系统调用中，因此被跳过。 |
| `signal_blocked` | 目标线程屏蔽了诊断信号。 |
| `thread_exited` | 指定线程在采集前已退出。 |
| `signal_error` | 发送诊断信号失败。 |
| `timeout` | 在 `timeout_ms` 内未完成堆栈采集。 |

## 注意事项

- 默认全量采集会采集所有 BE 线程，且不会跳过阻塞系统调用。这样可以保留事故排查中常见的阻塞工作线程堆栈。
- 该接口不是 stop-the-world 快照。线程会被逐个采样，因此堆栈时间接近，但不保证来自同一瞬间。
- 单个 BE 进程同一时间只允许一个打栈请求。并发请求会返回 HTTP `409`。
- 参数非法时返回 HTTP `400`。非 Linux BE 进程会返回 HTTP `501`。
- 日常排查优先使用 `thread_id` 缩小范围，并使用 `mode=FAST`。仅在需要更多符号化信息时使用 `FULL` 或 `FULL_WITH_INLINE`。
