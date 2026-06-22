---
title: BE Thread Stack Trace
language: en
description: Collect live thread stack traces from an Apache Doris BE process through the BE HTTP API.
keywords:
    - Apache Doris
    - BE stack trace
    - thread stack
    - troubleshooting
    - debug
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

# BE Thread Stack Trace

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Troubleshooting -->

## Purpose

The BE thread stack trace API collects live thread stacks from a running Apache Doris BE process through HTTP. Use it when a BE is slow, blocked, or consuming unexpected CPU. The response is plain text and only reflects the target BE.

This API is supported on Linux BE processes.

## Quick Start

1. Find the target BE HTTP endpoint:

    ```sql
    SHOW BACKENDS;
    ```

    Use the `Host` and `HttpPort` fields of the target BE.

2. Collect stacks from all BE threads:

    ```bash
    curl -s "http://{be_host}:{be_webport}/api/stack_trace" -o be_stack_trace.txt
    ```

3. Collect stacks from specific thread IDs:

    Thread IDs can be obtained from a previous full-stack response or from OS tools such as `top -H -p <be_pid>`.

    ```bash
    curl -s "http://{be_host}:{be_webport}/api/stack_trace?thread_id=12345,12346&mode=FAST&timeout_ms=3000" -o be_stack_trace_tid.txt
    ```

4. Use conservative mode when you want to avoid signaling threads that are blocked in interrupt-sensitive syscalls:

    ```bash
    curl -s "http://{be_host}:{be_webport}/api/stack_trace?skip_blocking_syscalls=true" -o be_stack_trace_safe.txt
    ```

## Parameters

All parameters are optional query parameters of `GET /api/stack_trace`.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `thread_id` | None | Comma-separated Linux thread IDs. If omitted, all BE threads are sampled. |
| `tid` | None | Legacy alias of `thread_id`. Do not use it together with `thread_id`. |
| `mode` | `FAST` | Alias of `dwarf_location_info_mode`. Values: `DISABLED`, `FAST`, `FULL`, `FULL_WITH_INLINE`. |
| `dwarf_location_info_mode` | `FAST` | Controls DWARF symbolization detail. If both `mode` and this parameter are set, this parameter is used. |
| `timeout_ms` | `100` | Timeout in milliseconds for each thread. Valid range: `1` to `10000`. |
| `skip_blocking_syscalls` | `false` | Whether to skip threads blocked in syscalls such as `read`, `poll`, `select`, `epoll_wait`, `futex`, and `nanosleep`. Values: `true`, `false`, `1`, `0`. |

Recommended symbolization modes:

| Mode | Usage |
|------|-------|
| `DISABLED` | Fastest mode. Use it when you only need thread names, statuses, and raw frames. |
| `FAST` | Default mode. Suitable for most troubleshooting. |
| `FULL` | More complete file and line information. Use only when `FAST` is not enough. |
| `FULL_WITH_INLINE` | Includes inline frame information. This is the most expensive mode. |

## Output

The response starts with collection metadata, followed by one section per thread and a final summary line.

Example:

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

Common thread statuses:

| Status | Meaning |
|--------|---------|
| `ok` | Stack was captured successfully. |
| `ok_current_thread` | Stack was captured from the HTTP handler thread itself. |
| `skipped_blocking_syscall` | The thread was skipped because `skip_blocking_syscalls=true` and the thread was in an interrupt-sensitive syscall. |
| `signal_blocked` | The target thread blocks the diagnostic signal. |
| `thread_exited` | The specified thread exited before it was sampled. |
| `signal_error` | Sending the diagnostic signal failed. |
| `timeout` | Stack capture did not finish within `timeout_ms`. |

## Notes

- The default full-process request samples all BE threads and does not skip blocking syscalls. This preserves blocked worker stacks, which are often useful during incidents.
- This is not a stop-the-world snapshot. Threads are sampled one by one, so their stacks are close in time but not from exactly the same instant.
- Only one stack trace request can run in a BE process at a time. Concurrent requests return HTTP `409`.
- Invalid parameters return HTTP `400`. Non-Linux BE processes return HTTP `501`.
- Prefer `thread_id` filtering and `mode=FAST` for routine diagnosis. Use `FULL` or `FULL_WITH_INLINE` only when more detailed symbolization is needed.
