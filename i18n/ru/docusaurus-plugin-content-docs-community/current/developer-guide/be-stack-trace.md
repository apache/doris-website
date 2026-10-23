---
title: Трассировка стеков потоков BE
language: ru
description: Получение текущих трассировок стеков потоков процесса Apache Doris BE через HTTP API BE.
keywords:
    - Apache Doris
    - трассировка стека BE
    - стек потока
    - диагностика неполадок
    - отладка
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

# Трассировка стеков потоков BE {#be-thread-stack-trace}

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Troubleshooting -->

## Назначение {#purpose}

API трассировки стеков потоков BE позволяет получать по HTTP текущие стеки потоков работающего процесса Apache Doris BE. Используйте его, если BE работает медленно, заблокирован или неожиданно нагружает CPU. Ответ представляет собой обычный текст и отражает состояние только целевого BE.

Этот API поддерживается для процессов BE в Linux.

## Быстрый старт {#quick-start}

1. Определите HTTP-адрес целевого BE:

    ```sql
    SHOW BACKENDS;
    ```

    Используйте поля `Host` и `HttpPort` целевого BE.

2. Получите стеки всех потоков BE:

    ```bash
    curl -s "http://{be_host}:{be_webport}/api/stack_trace" -o be_stack_trace.txt
    ```

3. Получите стеки потоков с указанными идентификаторами:

    Идентификаторы потоков можно получить из предыдущего ответа со стеками всех потоков или с помощью инструментов ОС, таких как `top -H -p <be_pid>`.

    ```bash
    curl -s "http://{be_host}:{be_webport}/api/stack_trace?thread_id=12345,12346&mode=FAST&timeout_ms=3000" -o be_stack_trace_tid.txt
    ```

4. Используйте консервативный режим, если нужно избежать отправки сигналов потокам, заблокированным в системных вызовах, чувствительных к прерываниям:

    ```bash
    curl -s "http://{be_host}:{be_webport}/api/stack_trace?skip_blocking_syscalls=true" -o be_stack_trace_safe.txt
    ```

## Параметры {#parameters}

Все параметры необязательны и передаются в строке запроса `GET /api/stack_trace`.

| Параметр | По умолчанию | Описание |
|-----------|---------|-------------|
| `thread_id` | Нет | Идентификаторы потоков Linux, разделённые запятыми. Если параметр не указан, снимаются стеки всех потоков BE. |
| `tid` | Нет | Устаревший псевдоним `thread_id`. Не используйте его вместе с `thread_id`. |
| `mode` | `FAST` | Псевдоним параметра `dwarf_location_info_mode`. Значения: `DISABLED`, `FAST`, `FULL`, `FULL_WITH_INLINE`. |
| `dwarf_location_info_mode` | `FAST` | Определяет степень детализации символизации DWARF. Если заданы и `mode`, и этот параметр, используется этот параметр. |
| `timeout_ms` | `100` | Тайм-аут для каждого потока в миллисекундах. Допустимый диапазон: от `1` до `10000`. |
| `skip_blocking_syscalls` | `false` | Определяет, следует ли пропускать потоки, заблокированные в системных вызовах, таких как `read`, `poll`, `select`, `epoll_wait`, `futex` и `nanosleep`. Значения: `true`, `false`, `1`, `0`. |

Рекомендуемые режимы символизации:

| Режим | Применение |
|------|-------|
| `DISABLED` | Самый быстрый режим. Используйте его, если нужны только имена и состояния потоков, а также необработанные кадры стека. |
| `FAST` | Режим по умолчанию. Подходит для диагностики большинства неполадок. |
| `FULL` | Более полные сведения о файлах и строках. Используйте, только если `FAST` недостаточно. |
| `FULL_WITH_INLINE` | Включает сведения о кадрах встроенных функций. Это самый ресурсоёмкий режим. |

## Вывод {#output}

Ответ начинается с метаданных сбора стеков, за которыми следуют отдельные разделы для каждого потока и завершающая строка сводки.

Пример:

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

Распространённые состояния потоков:

| Состояние | Значение |
|--------|---------|
| `ok` | Стек успешно снят. |
| `ok_current_thread` | Снят стек самого потока обработчика HTTP. |
| `skipped_blocking_syscall` | Поток пропущен, поскольку задано `skip_blocking_syscalls=true` и поток находился в системном вызове, чувствительном к прерываниям. |
| `signal_blocked` | Целевой поток блокирует диагностический сигнал. |
| `thread_exited` | Указанный поток завершился до снятия его стека. |
| `signal_error` | Не удалось отправить диагностический сигнал. |
| `timeout` | Снятие стека не завершилось за время `timeout_ms`. |

## Примечания {#notes}

- По умолчанию запрос для всего процесса снимает стеки всех потоков BE и не пропускает блокирующие системные вызовы. Это позволяет сохранить стеки заблокированных рабочих потоков, которые часто полезны при разборе инцидентов.
- Снимок не предполагает одновременной остановки всех потоков (stop-the-world). Стеки потоков снимаются по очереди, поэтому они отражают близкие, но не строго совпадающие моменты времени.
- В процессе BE одновременно может выполняться только один запрос трассировки стеков. Параллельные запросы возвращают HTTP `409`.
- При недопустимых параметрах возвращается HTTP `400`. Процессы BE в системах, отличных от Linux, возвращают HTTP `501`.
- Для повседневной диагностики предпочитайте фильтрацию по `thread_id` и `mode=FAST`. Используйте `FULL` или `FULL_WITH_INLINE`, только если требуется более подробная символизация.
