---
title: BE スレッドのスタックトレース
language: ja
description: BE HTTP API を使用して、実行中の Apache Doris BE プロセスからスレッドのスタックトレースを収集します。
keywords:
    - Apache Doris
    - BE スタックトレース
    - スレッドスタック
    - トラブルシューティング
    - デバッグ
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

# BE スレッドのスタックトレース

<!-- Knowledge type: Tool usage -->
<!-- Applicable scenarios: Troubleshooting -->

## 目的

BE スレッドのスタックトレース API は、実行中の Apache Doris BE プロセスから HTTP 経由で各スレッドの現在のスタックを収集します。BE の動作が遅い、処理が停止している、または予期しない CPU 使用率が見られる場合に使用します。レスポンスはプレーンテキストで、指定した BE の状態のみを示します。

この API は Linux 上の BE プロセスでサポートされています。

## クイックスタート

1. 対象 BE の HTTP エンドポイントを確認します。

    ```sql
    SHOW BACKENDS;
    ```

    対象 BE の `Host` フィールドと `HttpPort` フィールドを使用します。

2. BE のすべてのスレッドからスタックを収集します。

    ```bash
    curl -s "http://{be_host}:{be_webport}/api/stack_trace" -o be_stack_trace.txt
    ```

3. 指定したスレッド ID からスタックを収集します。

    スレッド ID は、以前に取得した全スレッドのレスポンス、または `top -H -p <be_pid>` などの OS ツールで確認できます。

    ```bash
    curl -s "http://{be_host}:{be_webport}/api/stack_trace?thread_id=12345,12346&mode=FAST&timeout_ms=3000" -o be_stack_trace_tid.txt
    ```

4. 割り込みに影響されやすいシステムコールでブロックされているスレッドへのシグナル送信を避けたい場合は、保守的なモードを使用します。

    ```bash
    curl -s "http://{be_host}:{be_webport}/api/stack_trace?skip_blocking_syscalls=true" -o be_stack_trace_safe.txt
    ```

## パラメーター

すべてのパラメーターは、`GET /api/stack_trace` の省略可能なクエリパラメーターです。

| パラメーター | デフォルト | 説明 |
|-----------|---------|-------------|
| `thread_id` | なし | カンマ区切りの Linux スレッド ID。省略すると、BE のすべてのスレッドがサンプリングされます。 |
| `tid` | なし | `thread_id` の旧エイリアス。`thread_id` と併用しないでください。 |
| `mode` | `FAST` | `dwarf_location_info_mode` のエイリアス。指定できる値: `DISABLED`、`FAST`、`FULL`、`FULL_WITH_INLINE`。 |
| `dwarf_location_info_mode` | `FAST` | DWARF を使ったシンボル情報の詳細度を制御します。`mode` とこのパラメーターを両方指定した場合は、このパラメーターが使用されます。 |
| `timeout_ms` | `100` | 各スレッドのタイムアウト（ミリ秒）。有効範囲: `1` から `10000`。 |
| `skip_blocking_syscalls` | `false` | `read`、`poll`、`select`、`epoll_wait`、`futex`、`nanosleep` などのシステムコールでブロックされているスレッドをスキップするかどうか。指定できる値: `true`、`false`、`1`、`0`。 |

推奨されるシンボル情報の取得モード:

| モード | 用途 |
|------|-------|
| `DISABLED` | 最も高速なモード。スレッド名、状態、生のスタックフレームだけが必要な場合に使用します。 |
| `FAST` | デフォルトのモード。ほとんどのトラブルシューティングに適しています。 |
| `FULL` | ファイル名と行番号について、より詳細な情報を取得します。`FAST` では不十分な場合にのみ使用します。 |
| `FULL_WITH_INLINE` | インライン化されたフレームの情報を含みます。最も負荷の高いモードです。 |

## 出力

レスポンスの先頭には収集に関するメタデータがあり、その後にスレッドごとのセクションと最後の集計行が続きます。

例:

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

主なスレッドの状態:

| 状態 | 意味 |
|--------|---------|
| `ok` | スタックを正常に取得しました。 |
| `ok_current_thread` | HTTP ハンドラーのスレッド自体からスタックを取得しました。 |
| `skipped_blocking_syscall` | `skip_blocking_syscalls=true` が指定され、スレッドが割り込みに影響されやすいシステムコールを実行していたため、スキップしました。 |
| `signal_blocked` | 対象スレッドが診断用シグナルをブロックしています。 |
| `thread_exited` | 指定したスレッドはサンプリング前に終了しました。 |
| `signal_error` | 診断用シグナルの送信に失敗しました。 |
| `timeout` | `timeout_ms` 以内にスタックの取得が完了しませんでした。 |

## 注意事項

- プロセス全体を対象とするデフォルトのリクエストは、BE のすべてのスレッドをサンプリングし、ブロックされているシステムコールはスキップしません。これにより、障害調査で役立つことが多い、ブロックされたワーカースレッドのスタックも取得できます。
- これは全スレッドを同時に停止して取得するスナップショットではありません。スレッドは順番にサンプリングされるため、スタックを取得する時刻は近いものの、完全には一致しません。
- 各 BE プロセスで同時に実行できるスタックトレースのリクエストは一件だけです。同時に送られたリクエストには HTTP `409` が返されます。
- 無効なパラメーターには HTTP `400` が返されます。Linux 以外の BE プロセスには HTTP `501` が返されます。
- 通常の診断では `thread_id` による絞り込みと `mode=FAST` を優先してください。`FULL` または `FULL_WITH_INLINE` は、より詳細なシンボル情報が必要な場合にのみ使用してください。
