---
title: C++ 静的コード解析
language: ja
description: "Apache Doris の C++ 静的コード解析: Clang-Tidy と Clangd の設定（VSCode との連携を含む）。"
keywords:
    - Apache Doris
    - C++ 静的解析
    - Clang-Tidy
    - Clangd
    - VSCode
    - LDB toolchain
    - compile_commands.json
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

# C++ 静的コード解析

<!-- Knowledge type: Code conventions -->
<!-- Applicable scenarios: BE development / Code quality checks -->

Apache Doris では、[Clangd](https://clangd.llvm.org/) と [Clang-Tidy](https://clang.llvm.org/extra/clang-tidy/) を使用して C++ コードを静的に解析できます。どちらも [LDB-toolchain](/community/source-install/compilation-with-ldb-toolchain) に含まれています。自分でインストールまたはビルドすることもできます。

## ツールの比較

| ツール | 用途 | 設定ファイル |
|------|---------|--------------------|
| Clangd | コードナビゲーション、補完、ホバー時のヒントなどの IDE 機能を提供 | `clangd.arguments` で指定 |
| Clang-Tidy | 静的解析とコード品質のチェック（Clangd からも実行可能） | Doris のルートディレクトリにある `.clang-tidy` |

`vscode-cpptools` と比べて、Clangd はより正確なコードナビゲーションを提供し、Clang-Tidy の診断機能とクイックフィックス機能を統合できます。

## Clang-Tidy の設定

Clang-Tidy のチェックルールは、Doris のルートディレクトリにある `.clang-tidy` ファイルで一元管理されています。このファイルを編集すると、個々のチェックを有効または無効にできます。

## VSCode での Clangd の設定

<!-- Knowledge type: Tool usage -->

### 手順

1. `clangd` プラグインをインストールします。
2. 使用する前に `be(RELEASE)` と `be-ut(ASAN)` をそれぞれ一度コンパイルし、対応する `compile_commands.json` ファイルを生成します。
3. `settings.json` を編集するか、設定画面でプラグインの設定を直接変更します。

### 設定例

```json
{
    "clangd.path": "ldb_toolchain/bin/clangd",
    "clangd.arguments": [
        "--background-index",
        "--clang-tidy",
        "--compile-commands-dir=doris/be/build_Release/",
        "--completion-style=detailed",
        "-j=5",
        "--all-scopes-completion",
        "--pch-storage=memory",
        "--pretty",
        "--query-driver=ldb_toolchain/bin/*"
    ],
    "clangd.trace": "output/clangd-server.log"
}
```

### 主なパラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `clangd.path` | Clangd の実行ファイルへのパス |
| `--background-index` | シンボル検索を高速化するため、プロジェクト全体をバックグラウンドでインデックス化します |
| `--clang-tidy` | Clang-Tidy による静的チェックを有効にします |
| `--compile-commands-dir` | `compile_commands.json` を含むディレクトリを指定します |
| `--completion-style=detailed` | 補完時に詳細情報を表示します |
| `-j=5` | Clangd がファイルの解析に使用する並列ジョブ数 |
| `--query-driver` | システムヘッダーファイルの解決に使用するコンパイラーへのパス |

## よくある質問

**Q: `clangd` がヘッダーファイルやシンボルが見つからないと報告する場合、どう調査すればよいですか？**

BE を少なくとも一度コンパイルして `compile_commands.json` を生成したことと、`--compile-commands-dir` が正しいディレクトリを指していることを確認してください。
