---
title: BE 스레드 스택 트레이스
language: ko
description: BE HTTP API를 통해 Apache Doris BE 프로세스에서 현재 스레드 스택 트레이스를 수집합니다.
keywords:
    - Apache Doris
    - BE 스택 트레이스
    - 스레드 스택
    - 문제 해결
    - 디버깅
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

# BE 스레드 스택 트레이스 {#be-thread-stack-trace}

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Troubleshooting -->

## 용도 {#purpose}

BE 스레드 스택 트레이스 API는 HTTP를 통해 실행 중인 Apache Doris BE 프로세스에서 현재 스레드 스택을 수집합니다. BE가 느리거나, 작업이 차단되거나, 예상치 못한 CPU 사용량을 보일 때 사용하세요. 응답은 일반 텍스트 형식이며 대상 BE의 정보만 반영합니다.

이 API는 Linux BE 프로세스에서 지원됩니다.

## 빠른 시작 {#quick-start}

1. 대상 BE의 HTTP 엔드포인트를 찾습니다:

    ```sql
    SHOW BACKENDS;
    ```

    대상 BE의 `Host` 및 `HttpPort` 필드를 사용합니다.

2. 모든 BE 스레드의 스택을 수집합니다:

    ```bash
    curl -s "http://{be_host}:{be_webport}/api/stack_trace" -o be_stack_trace.txt
    ```

3. 특정 스레드 ID에 해당하는 스택을 수집합니다:

    스레드 ID는 앞서 수집한 전체 스택 응답이나 `top -H -p <be_pid>`와 같은 OS 도구에서 확인할 수 있습니다.

    ```bash
    curl -s "http://{be_host}:{be_webport}/api/stack_trace?thread_id=12345,12346&mode=FAST&timeout_ms=3000" -o be_stack_trace_tid.txt
    ```

4. 인터럽트에 민감한 시스템 호출에서 차단된 스레드에 시그널을 보내지 않으려면 보수적인 모드를 사용합니다:

    ```bash
    curl -s "http://{be_host}:{be_webport}/api/stack_trace?skip_blocking_syscalls=true" -o be_stack_trace_safe.txt
    ```

## 매개변수 {#parameters}

모든 매개변수는 `GET /api/stack_trace`의 선택적 쿼리 매개변수입니다.

| 매개변수 | 기본값 | 설명 |
|-----------|---------|-------------|
| `thread_id` | 없음 | 쉼표로 구분한 Linux 스레드 ID입니다. 생략하면 모든 BE 스레드를 샘플링합니다. |
| `tid` | 없음 | `thread_id`의 이전 버전 별칭입니다. `thread_id`와 함께 사용하지 마세요. |
| `mode` | `FAST` | `dwarf_location_info_mode`의 별칭입니다. 값: `DISABLED`, `FAST`, `FULL`, `FULL_WITH_INLINE`. |
| `dwarf_location_info_mode` | `FAST` | DWARF 심볼 변환의 상세 수준을 제어합니다. `mode`와 이 매개변수를 모두 설정하면 이 매개변수를 사용합니다. |
| `timeout_ms` | `100` | 각 스레드의 제한 시간이며 단위는 밀리초입니다. 유효 범위: `1` ~ `10000`. |
| `skip_blocking_syscalls` | `false` | `read`, `poll`, `select`, `epoll_wait`, `futex`, `nanosleep` 등의 시스템 호출에서 차단된 스레드를 건너뛸지 여부입니다. 값: `true`, `false`, `1`, `0`. |

권장 심볼 변환 모드:

| 모드 | 용도 |
|------|-------|
| `DISABLED` | 가장 빠른 모드입니다. 스레드 이름, 상태, 원시 프레임만 필요할 때 사용하세요. |
| `FAST` | 기본 모드입니다. 대부분의 문제 해결에 적합합니다. |
| `FULL` | 더 자세한 파일 및 줄 정보를 제공합니다. `FAST`로 충분하지 않을 때만 사용하세요. |
| `FULL_WITH_INLINE` | 인라인 프레임 정보를 포함합니다. 가장 많은 리소스를 사용하는 모드입니다. |

## 출력 {#output}

응답은 수집 메타데이터로 시작하며, 이어서 스레드별 섹션과 마지막 요약 줄이 표시됩니다.

예시:

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

일반적인 스레드 상태:

| 상태 | 의미 |
|--------|---------|
| `ok` | 스택을 성공적으로 캡처했습니다. |
| `ok_current_thread` | HTTP 요청을 처리하는 스레드 자체에서 스택을 캡처했습니다. |
| `skipped_blocking_syscall` | `skip_blocking_syscalls=true`이고 스레드가 인터럽트에 민감한 시스템 호출에 있어 해당 스레드를 건너뛰었습니다. |
| `signal_blocked` | 대상 스레드가 진단 시그널을 차단하고 있습니다. |
| `thread_exited` | 지정한 스레드가 샘플링되기 전에 종료되었습니다. |
| `signal_error` | 진단 시그널 전송에 실패했습니다. |
| `timeout` | 스택 캡처가 `timeout_ms` 안에 완료되지 않았습니다. |

## 참고 사항 {#notes}

- 전체 프로세스를 대상으로 하는 기본 요청은 모든 BE 스레드를 샘플링하며 블로킹 시스템 호출을 건너뛰지 않습니다. 따라서 차단된 워커 스택도 보존되며, 이러한 스택은 장애 대응에 유용한 경우가 많습니다.
- 이는 stop-the-world 방식의 스냅샷이 아닙니다. 스레드를 하나씩 샘플링하므로 각 스택의 수집 시점은 서로 가깝지만 정확히 같은 순간은 아닙니다.
- BE 프로세스에서는 한 번에 하나의 스택 트레이스 요청만 실행할 수 있습니다. 동시 요청은 HTTP `409`를 반환합니다.
- 잘못된 매개변수는 HTTP `400`을 반환합니다. Linux가 아닌 환경의 BE 프로세스는 HTTP `501`을 반환합니다.
- 일상적인 진단에는 `thread_id` 필터링과 `mode=FAST` 사용을 권장합니다. 더 자세한 심볼 변환이 필요할 때만 `FULL` 또는 `FULL_WITH_INLINE`을 사용하세요.
