---
title: BE 開発環境のセットアップ - Visual Studio Code (VSCode)
language: ja
description: "VSCode を使用した Apache Doris BE 開発環境のセットアップ方法を説明します。コンパイル、GDB/LLDB によるデバッグ、コアダンプ解析を扱います。"
keywords:
    - VSCode
    - Apache Doris BE
    - BE 開発環境
    - GDB デバッグ
    - LLDB デバッグ
    - コアダンプ
    - doris_be
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

# VSCode を使用した BE 開発・デバッグ環境のセットアップ

このドキュメントでは、Ubuntu 20.04 上で VSCode を使用して Apache Doris BE をコンパイル、起動、デバッグする方法を説明します。GDB、LLDB、コアダンプの三つのデバッグ方法を扱います。

> BE のバイナリ名は `doris_be` です。古いバージョンでは `palo_be` という名前でした。

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: IDE configuration / Debugging setup -->

## 1. 前提条件

1. Doris のソースコードをダウンロードします: [GitHub の apache/doris](https://github.com/apache/doris)

2. 基本的なツールチェーンをインストールします: GCC 8.3.1+、Oracle JDK 1.8+、Python 2.7+。`gcc`、`java`、`python` がそれぞれ適切なバージョンを指していることを確認し、環境変数 `JAVA_HOME` を設定します。

3. その他の依存パッケージをインストールします:

    ```bash
    sudo apt install build-essential openjdk-8-jdk maven cmake byacc flex automake libtool-bin bison binutils-dev libiberty-dev zip unzip libncurses5-dev curl git ninja-build python brotli
    sudo add-apt-repository ppa:ubuntu-toolchain-r/ppa
    sudo apt update
    sudo apt install gcc-10 g++-10
    sudo apt-get install autoconf automake libtool autopoint
    ```

4. OpenSSL をインストールします:

    ```bash
    sudo apt install -y openssl libssl-dev
    ```

## 2. コンパイル

以下の手順は `/home/workspace` ディレクトリで実行します。

### 2.1 ソースコードのダウンロード

```bash
git clone https://github.com/apache/doris.git
cd doris
git submodule update --init --recursive
```

### 2.2 サードパーティーの依存ライブラリのコンパイル

```bash
cd /home/workspace/doris/thirdparty
./build-thirdparty.sh
```

### 2.3 Doris のコンパイル

```bash
cd /home/workspace/doris
./build.sh
```

`build.sh` では、以下のコマンドを使用できます:

| コマンド                            | 説明                       |
| ----------------------------------- | -------------------------- |
| `./build.sh`                        | BE と FE の両方をコンパイル |
| `./build.sh --be`                   | BE のみをコンパイル         |
| `./build.sh --fe`                   | FE のみをコンパイル         |
| `./build.sh --fe --be`              | BE と FE の両方をコンパイル |
| `./build.sh --fe --be --clean`      | クリーン後に BE と FE の両方をコンパイル |
| `./build.sh --fe --clean`           | クリーン後に FE をコンパイル |
| `./build.sh --be --clean`           | クリーン後に BE をコンパイル |

ビルド成果物は `/home/workspace/doris/output/` ディレクトリに出力されます。問題が発生した場合は、[Doris の公式ドキュメント](http://doris.apache.org)を参照してください。

:::tip プライベート Maven リポジトリ
FE のコンパイル時にプライベート Maven リポジトリを指定する必要がある場合は、環境変数 `USER_SETTINGS_MVN_REPO` に `settings.xml` のパスを設定します:

```bash
export USER_SETTINGS_MVN_REPO="/xxx/xxx/settings.xml"
```
:::

## 3. デプロイとデバッグ (GDB)

### 3.1 BE バイナリへの実行権限の付与

```bash
chmod +x /home/workspace/doris/output/be/lib/doris_be
```

`/home/workspace/doris/output/be/lib/doris_be` は BE の実行ファイルです。

### 3.2 データ保存ディレクトリの作成

`/home/workspace/doris/output/be/conf/be.conf` を確認します:

```bash
# INFO, WARNING, ERROR, FATAL
sys_log_level = INFO
be_port = 9060
be_rpc_port = 9070
webserver_port = 8040
heartbeat_service_port = 9050
brpc_port = 8060
arrow_flight_sql_port = -1

# Note that there should at most one ip match this list.
# If no ip match this rule, will choose one randomly.
# use CIDR format, e.g. 10.10.10.0/
# Default value is empty.
priority_networks = 192.168.59.0/24 # data root path, separate by ';'
storage_root_path = /soft/be/storage
```

`storage_root_path` に指定したデータディレクトリを作成します:

```bash
mkdir -p /soft/be/storage
```

### 3.3 ソースコードを開いてデバッグ用拡張機能をインストール

1. VSCode で BE のソースコードディレクトリを開きます (この例では `/home/workspace/doris/`)。
2. VSCode のデバッグ用拡張機能 **C/C++** (ms-vscode.cpptools) をインストールします。

    ![](/images/image-20210618104004956.png)

### 3.4 launch.json の作成

<!-- Knowledge type: Configuration parameters -->

`.vscode/launch.json` に Launch モードの設定を作成します:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "(gdb) Launch",
            "type": "cppdbg",
            "request": "launch",
            "program": "/home/workspace/doris/output/be/lib/doris_be",
            "args": [],
            "stopAtEntry": false,
            "cwd": "/home/workspace/doris/",
            "environment": [
                {"name": "DORIS_HOME", "value": "/home/workspace/doris/output/be/"},
                {"name": "UDF_RUNTIME_DIR", "value": "/home/workspace/doris/output/be/lib/udf-runtime"},
                {"name": "LOG_DIR", "value": "/home/workspace/doris/output/be/log"},
                {"name": "PID_DIR", "value": "/home/workspace/doris/output/be/bin"}
            ],
            "externalConsole": true,
            "MIMode": "gdb",
            "miDebuggerPath": "/path/to/gdb",
            "setupCommands": [
                {
                    "description": "Enable pretty-printing for gdb",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                }
            ]
        }
    ]
}
```

`environment` には、`doris_be` の実行時に必要な環境変数を定義します。これらを設定しないと起動に失敗します:

| 環境変数           | 用途                      |
| ------------------ | ------------------------- |
| `DORIS_HOME`       | BE の実行時ルートディレクトリ |
| `UDF_RUNTIME_DIR`  | UDF の実行時ディレクトリ   |
| `LOG_DIR`          | ログディレクトリ          |
| `PID_DIR`          | PID ファイルのディレクトリ |

`miDebuggerPath` にはデバッガーのパス (例: `gdb`) を指定します。指定しない場合は、システムの `PATH` から検索されます。システムに付属する GDB のバージョンが古すぎることがあるため、新しいバージョンへのパスを手動で指定する必要がある場合があります。

### 3.5 Attach モードでのデバッグ

実行中の BE プロセスにアタッチするには、以下の設定を使用します:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "(gdb) Launch",
            "type": "cppdbg",
            "request": "attach",
            "program": "/home/workspace/doris/output/lib/doris_be",
            "processId": "${command:pickProcess}",
            "MIMode": "gdb",
            "miDebuggerPath": "/path/to/gdb",
            "internalConsoleOptions": "openOnSessionStart",
            "setupCommands": [
                {
                    "description": "Enable pretty-printing for gdb",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                }
            ]
        }
    ]
}
```

主なポイント:

- `"request": "attach"`: デバッグモードをアタッチに設定します。
- `"processId"`: アタッチ先プロセスの PID です。特定の番号、`"${command:pickProcess}"` (起動時に手動で選択)、または以下のコマンドで取得した値を使用できます:

    ```bash
    lsof -i | grep -m 1 doris_be | awk "{print $2}"
    ```

    ![](/images/image-20210618095240216.png)

    上の画像では、`15200` が現在の BE プロセス ID です。

### 3.6 launch.json の完全な例

以下は、**Launch** モードと **Attach** モードの両方を含む完全な設定です:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "(gdb) Attach",
            "type": "cppdbg",
            "request": "attach",
            "program": "/home/workspace/doris/output/be/lib/doris_be",
            "processId": 17016,
            "MIMode": "gdb",
            "miDebuggerPath": "/path/to/gdb",
            "setupCommands": [
                {
                    "description": "Enable pretty-printing for gdb",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                }
            ]
        },
        {
            "name": "(gdb) Launch",
            "type": "cppdbg",
            "request": "launch",
            "program": "/home/workspace/doris/output/be/lib/doris_be",
            "args": [],
            "stopAtEntry": false,
            "cwd": "/home/workspace/doris/output/be",
            "environment": [
                {"name": "DORIS_HOME", "value": "/home/workspace/doris/output/be"},
                {"name": "UDF_RUNTIME_DIR", "value": "/home/workspace/doris/output/be/lib/udf-runtime"},
                {"name": "LOG_DIR", "value": "/home/workspace/doris/output/be/log"},
                {"name": "PID_DIR", "value": "/home/workspace/doris/output/be/bin"}
            ],
            "externalConsole": false,
            "MIMode": "gdb",
            "miDebuggerPath": "/path/to/gdb",
            "setupCommands": [
                {
                    "description": "Enable pretty-printing for gdb",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                }
            ]
        }
    ]
}
```

### 3.7 デバッグの開始

VSCode のデバッグボタンをクリックして Doris BE のデバッグを開始します。

![](/images/image-20210618091006146.png)

## 4. デバッグ (LLDB)

LLDB は GDB より速くアタッチでき、使い方もほぼ同じです。VSCode の拡張機能 `CodeLLDB` をインストールし、launch.json に以下の設定を追加します:

```json
{
    "name": "CodeLLDB attach",
    "type": "lldb",
    "request": "attach",
    "program": "${workspaceFolder}/output/be/lib/doris_be",
    "pid": "${command:pickMyProcess}"
}
```

:::caution glibc のバージョン要件
この方法には、システムの `glibc` バージョン `2.18+` が必要です。要件を満たさない場合は、[CentOS7 で CodeLLDB を動作させる方法](https://gist.github.com/JaySon-Huang/63dcc6c011feb5bd6deb1ef0cf1a9b96)を参照し、新しい glibc をインストールして拡張機能にリンクしてください。
:::

## 5. コアダンプファイルのデバッグ

BE のクラッシュで生成されたコアファイルをデバッグするには、対応する設定エントリに以下を追加します:

```json
"coreDumpPath": "/PATH/TO/CORE/DUMP/FILE"
```

## 6. よく使うデバッグのヒント

### 6.1 関数の実行経路

BE の実行処理に詳しくない場合は、`perf` などのツールで関数呼び出しを追跡し、呼び出しの連鎖を特定します。`perf` の使い方については、[デバッグツール](./debug-tool)を参照してください。

大きなテーブルに対して追跡対象の SQL を実行し、サンプリング頻度を上げます (例: `perf -F 999`)。結果を確認すると、BE におけるその SQL のクリティカルパスをおおまかに把握できます。

### 6.2 CRTP オブジェクトのデバッグ

実行時の効率を高めるため、BE のコードでは基本型に CRTP (Curiously Recurring Template Pattern) を多用しています。そのため、デバッガーからオブジェクトを派生型として調べることができません。GDB では次のように対処できます:

オブジェクト `col` は `IColumn` 型ですが、実際の型が不明な場合を考えます:

```bash
set print object on   # Print objects by derived type
p *col.t              # Use col.t to get the concrete type of col
p col.t->size()       # Use it as the derived type, for example, ColumnString supports size()
```

:::caution
ポリモーフィズムが適用されるのは `COW::t` ポインターであり、`IColumn` クラスのオブジェクトではありません。GDB で派生型のオブジェクトを取得するには、`col` を使用する箇所をすべて `col.t` に置き換える必要があります。
:::

## 7. よくある質問 (FAQ)

<!-- Knowledge type: Troubleshooting -->

### Q1: 起動直後に BE が終了する

環境変数が設定されていないか、パスが存在しません。`DORIS_HOME`、`LOG_DIR`、`PID_DIR`、`UDF_RUNTIME_DIR` がすべて設定され、対応するディレクトリが作成されていることを確認してください。

### Q2: GDB でバージョンが古すぎる、または機能がサポートされていないと報告される

システムに付属する GDB のバージョンが古くなっています。新しい GDB を手動でインストールし、`miDebuggerPath` に指定してください。

### Q3: CodeLLDB を読み込めない

システムの `glibc` バージョンが `2.18` より古い状態です。解決方法についてはセクション 4 のリンクを参照してください。

### Q4: FE のコンパイル中に Maven が外部ネットワークに接続できない

環境変数 `USER_SETTINGS_MVN_REPO` に、プライベート Maven リポジトリ用の `settings.xml` を指定してください。セクション 2.3 のヒントを参照してください。
