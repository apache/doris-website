---
title: C++ コードフォーマット規約
language: ja
description: "Apache Doris の C++ コードフォーマット：コマンドラインと IDE での clang-format の設定と使用方法。"
keywords:
    - Apache Doris
    - C++ コードフォーマット
    - clang-format
    - LDB ツールチェーン
    - CLion
    - VS Code
    - BE 開発
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

# C++ コードフォーマット規約

<!-- Knowledge type: Code specification -->
<!-- Applicable scenario: BE development / Pull Request submission -->

Apache Doris では、C++ コードの整形に `clang-format` を使用します。開発者がコードを提出する前に書式を統一できるよう、`build-support` ディレクトリにラッパースクリプトを用意しています。

## ラッパースクリプト

| スクリプト | 用途 |
|------|------|
| `build-support/clang-format.sh` | `be/src` と `be/test` の C/C++ コードを整形します |
| `build-support/check-format.sh` | `be/src` と `be/test` のコードの書式を確認し、ファイルを変更せずに差分を表示します |

## コードスタイルのカスタマイズ

- Apache Doris のコードスタイルは Google Style を基に、少しカスタマイズを加えたものです。設定ファイル `.clang-format` は Doris のルートディレクトリにあります。
- `.clang-format` は `clang-format-16.0.0` 以降と互換性があります。
- `.clang-format-ignore` ファイルには、整形対象から除外するコードが列挙されています。通常は、元のスタイルを維持する必要があるサードパーティーのライブラリが対象です。

## 環境のセットアップ

`clang-format` をインストールするか、IDE またはエディターが提供する `clang-format` プラグインを使用してください。Doris では現在、コードの整形に `clang-format 16` を使用しています（`clang-format` のバージョンによって結果が異なる場合があります）。

### clang-format のインストール

| システム | 推奨方法 |
|------|---------|
| Linux | [LDB ツールチェーン](/community/source-install/compilation-with-ldb-toolchain)（対応するバージョンが含まれています）を使用するか、バイナリを自分でビルドまたはインストールします |
| macOS | `brew install clang-format@16` |

LDB ツールチェーンについて：最新バージョン（>= v0.18）には、ビルド済みの `clang-format 16.0.0` バイナリが含まれています。ダウンロードについては、[ldb_toolchain_gen Releases](https://github.com/amosbird/ldb_toolchain_gen/releases) を参照してください。

### IDE プラグインの使用

| IDE | プラグイン | 備考 |
|-----|------|---------|
| CLion | `ClangFormat`（`File -> Setting -> Plugins` から検索してダウンロード） | `clang-format` のバージョンが 16 であることを確認してください |
| VS Code | `Clang-Format` 拡張機能 | `clang-format` 実行ファイルのパスを手動で指定する必要があります |

## 使用方法

### コマンドラインから実行する

1. Doris のルートディレクトリに移動します。

    ```bash
    cd ${DORIS_HOME}
    ```

2. 整形スクリプトを実行します。

    ```bash
    build-support/clang-format.sh
    ```

> 注：`clang-format.sh` スクリプトを使用するには、マシンに Python 3 がインストールされている必要があります。

### CLion で clang-format を使用する

`ClangFormat` プラグインをインストールした後、`Reformat Code` をクリックすると、現在のファイルを整形できます。

### VS Code で clang-format を使用する

1. `Clang-Format` 拡張機能をインストールします。
2. VS Code の設定画面を開いて `clang_format` を検索し、次のように設定します。

    ```json
    {
        "clang_format_path": "$clang-format path$",
        "clang_format_style": "file"
    }
    ```

3. 右クリックして `Format Document` を選択すると、ファイルを整形できます。

## よくある質問

**Q: `clang-format` のバージョンが異なると、整形結果に違いが生じますか？**

はい。必ず `clang-format 16` 系を使用してください。それ以外のバージョンでは、プロジェクトが期待する書式と一致せず、CI が失敗する可能性があります。

**Q: サードパーティーのコードも整形されますか？**

いいえ。`.clang-format-ignore` に列挙されたディレクトリはスキップされるため、サードパーティーの依存ライブラリは元のコードスタイルを維持できます。
