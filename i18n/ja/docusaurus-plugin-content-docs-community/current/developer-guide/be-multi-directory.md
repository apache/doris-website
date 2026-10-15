---
title: BE の複数ディレクトリ間での共有キャッシュ
language: ja
description: Apache Doris BE の開発で、複数のディレクトリ（worktree）間で ccache のキャッシュを共有するための設定方法とデバッグ方法。
keywords:
    - Apache Doris BE
    - ccache
    - git worktree
    - 複数ディレクトリでの開発
    - CCACHE_BASEDIR
    - ffile-prefix-map
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

# BE の複数ディレクトリ間での共有キャッシュ

AI エージェントと Doris BE を開発する際は、`git worktree` などを使い、異なるディレクトリで複数の開発ブランチを並行して扱うことがあります。ccache のキャッシュはフルパスの影響を受けるため、cpp ファイルの内容がほぼ同じでも、ディレクトリが異なるとキャッシュがヒットしません。その結果、worktree ディレクトリごとに最初からコンパイルする必要があり、開発速度が大幅に低下します。この問題を解決するための独自の最適化が適用されています。以下の手順で設定してください。

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Multi-worktree parallel development / Build acceleration -->

## 1. ディレクトリの要件

Doris は環境設定ファイルで `CCACHE_BASEDIR` と `-ffile-prefix-map` をすでに設定しており、コンパイルオプションの大部分を同じパスにマッピングすることで、キャッシュをヒットさせられます。**前提条件は、すべての Doris 開発ディレクトリが同じ親ディレクトリを共有していることです。** つまり、すべての Doris 開発ディレクトリを次のように同じ階層に配置する必要があります。

```bash
xxx/doris_main
xxx/doris1
xxx/doris2
```

## 2. 環境設定

<!-- Knowledge type: Operation steps -->

### 2.1 UBSAN_IGNORELIST の固定パスを設定する

上記の自動設定に加えて、固定パスを手動で調整する必要があります。worktree ディレクトリの `custom_env.sh` に、メインリポジトリの UBSAN IGNORELIST を指定します。

```bash
export UBSAN_IGNORELIST=${DORIS_MAIN_REPO}/conf/ubsan_ignorelist.txt
```

ここで、`DORIS_MAIN_REPO` はメインリポジトリのパスです。推奨される方法は次のとおりです。

1. メインリポジトリの `custom_env.sh` で、この値を直接設定します。
2. `hooks/setup_worktree.sh` と `AGENTS.md` を連携させ、AI を使ったワークフローでその設定をすべての worktree ディレクトリに自動的に反映します。

### 2.2 ccache のキャッシュ容量を増やす

十分なキャッシュ領域を確保するため、ccache のキャッシュ容量を手動で増やします。

```bash
ccache --set-config=max_size=50G
```

| 設定項目 | 推奨値 | 説明 |
| ------- | ------ | ---- |
| `max_size` | `50G` | 複数の worktree を並行して使用する場合に推奨される最小容量 |

## 3. デバッグ方法

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Troubleshooting / Cache miss diagnosis -->

### 3.1 キャッシュの統計情報を確認する

`ccache -s` を実行してキャッシュの統計情報を表示し、キャッシュが機能しているか確認します。`cache hit rate` フィールドに注目してください。値が低すぎる場合は、キャッシュが正しくヒットしていません。正確な結果を得るため、確認のたびに事前に `ccache -z` を実行して統計情報をリセットしてください。

| コマンド | 用途 |
| -------- | ---- |
| `ccache -s` | キャッシュヒットの統計情報を表示する |
| `ccache -z` | 統計情報をリセットする（キャッシュは削除しない） |
| `ccache -C` | キャッシュを削除する（慎重に使用する） |

### 3.2 ccache のデバッグログを有効にする

キャッシュヒットに問題があることを確認したら、ccache のデバッグログを有効にします。

```bash
export CCACHE_LOGFILE=/path/to/xxx
export CCACHE_DEBUG=1
```

| 環境変数 | 効果 |
| -------- | ---- |
| `CCACHE_LOGFILE` | キャッシュのヒットまたはミスの理由を調べるための詳細ログの出力先ファイル |
| `CCACHE_DEBUG=1` | コンパイル単位ごとに入力内容を記録した `*.ccache-input-text` ファイルを生成する |

### 3.3 キャッシュミスの原因を特定する

`CCACHE_DEBUG=1` を有効にすると、コンパイル単位ごとに `*.ccache-input-text` ファイルが生成されます。このファイルには、ソースファイルのパスやコンパイルオプションなど、そのコンパイル単位の入力内容が記録されます。

理論上、異なる二つのディレクトリにある同じファイルで ccache のキャッシュをヒットさせるには、**それぞれの `ccache-input-text` ファイルの内容が完全に一致している必要があります。** キャッシュミスが発生したファイルについて、両方の `ccache-input-text` ファイルを比較し、原因を特定してください。

## 4. よくある質問（FAQ）

<!-- Knowledge type: Troubleshooting -->

### Q1: キャッシュヒット率が常に 0 になる

すべての worktree が同じ親ディレクトリの下にあるか確認してください。そうでない場合、`CCACHE_BASEDIR` と `-ffile-prefix-map` でパスを同じ値にマッピングできず、キャッシュはヒットしません。

### Q2: キャッシュが頻繁に削除される

セクション 2.2 の説明に従って `max_size` を増やしてください。複数の worktree を並行して使用する場合は、少なくとも 50 GB を推奨します。

### Q3: UBSAN_IGNORELIST のパスでエラーが発生する

worktree ディレクトリの `custom_env.sh` で、メインリポジトリの ignorelist ファイルを指すように設定されていません。設定方法はセクション 2.1 を参照してください。
