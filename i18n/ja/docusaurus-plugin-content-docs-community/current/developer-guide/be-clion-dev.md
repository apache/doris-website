---
title: BE 開発環境の構築 - CLion
language: ja
description: リモート開発または macOS でのローカル開発を利用して、CLion で Apache Doris BE の開発環境を構築する方法を説明します。
keywords:
    - CLion
    - Apache Doris BE
    - BE 開発環境
    - リモート開発
    - macOS での BE デバッグ
    - CMake
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

# CLion を使用した BE 開発環境の構築

このドキュメントでは、BE（Backend）の開発で一般的な CLion の利用方法を二通り説明します。

- **方法 1: リモート開発**（推奨）。ローカルの CLion から SSH/SFTP でリモートの Linux サーバーに接続し、コードをリモートマシンに同期してコンパイルと実行を行います。BE には完全な Linux ツールチェーンが必要なため、Doris BE の開発では最も一般的な構成です。
- **方法 2: macOS でのローカル開発**。リモートサーバーを使用せず、macOS 上で直接 BE をコンパイルしてデバッグします。

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: IDE configuration / Debug setup -->

## 方法 1: リモート開発（Linux）

### 1. リモートサーバーでコードをダウンロードしてコンパイルする

リモートの Linux サーバーで Doris をダウンロードしてコンパイルします。

```bash
git clone https://github.com/apache/doris.git
cd doris
```

`env.sh` を編集し、冒頭に `DORIS_HOME` の設定を追加します。例:

```bash
DORIS_HOME=/mnt/datadisk0/chenqi/doris
```

ビルドを実行します。詳しい手順については、[LDB ツールチェーンを使用したコンパイル](../source-install/compilation-with-ldb-toolchain)を参照してください。

```bash
./build.sh
```

### 2. ローカルの CLion でリモート開発環境を設定する

1. ローカルに CLion をダウンロードしてインストールし、Doris BE のコードをインポートします。

2. CLion で **Preferences → Build, Execution, Deployment → Deployment** を開き、**SFTP** を使用してリモート開発サーバーのログイン情報を追加します。**Mappings** のパスを設定します。例:
    - Local Path: `/User/kaka/Programs/doris/be`
    - Deployment Path: `/mnt/datadisk0/chenqi/clion/doris/be`

    ![デプロイ設定画面 1](/images/clion-deployment1.png)

    ![デプロイ設定画面 2](/images/clion-deployment2.png)

3. コンパイル時にリモートサーバー上で生成された `gensrc` ディレクトリを、**Deployment Path** の親ディレクトリにコピーします。

    ```bash
    cp -R /mnt/datadisk0/chenqi/doris/gensrc /mnt/datadisk0/chenqi/clion/doris/gensrc
    ```

4. **Preferences → Build, Execution, Deployment → Toolchains** を開き、リモート環境のツールチェーン（CMake、GCC、G++、GDB など）を追加します。

    :::caution 重要
    **Environment file** フィールドには、リモートサーバー上の Doris コードにある `env.sh` のパスを入力します。
    :::

    ![ツールチェーン設定画面](/images/clion-toolchains.png)

5. **Preferences → Build, Execution, Deployment → CMake** を開き、CMake オプションに以下を追加します。

    ```bash
    -DDORIS_JAVA_HOME=/path/to/remote/JAVA_HOME
    ```

    リモートサーバー上の `JAVA_HOME` のパスを指定します。指定しないと `jni.h` が見つかりません。

6. CLion で右クリックし、**Load CMake Project** を選択します。これにより、コードがリモートサーバーに同期され、CMake のビルドファイルが生成されます。

### 3. ローカルの CLion からリモートの BE を実行・デバッグする

1. **Preferences → Build, Execution, Deployment → CMake** で CMake を設定します。Debug や Release などのターゲットを設定し、**ToolChain** には先ほど設定したリモートのツールチェーンを指定します。

    ユニットテストを実行・デバッグする場合は、CMake オプションに `-DMAKE_TEST=ON` を追加します（デフォルトでは無効です）。

2. リモートサーバー上で `output` ディレクトリを別のパスにコピーします。

    ```bash
    cp -R /mnt/datadisk0/chenqi/doris/output /mnt/datadisk0/chenqi/clion/doris/doris_be
    ```

    ![出力ディレクトリの構成](/images/doris-dist-output-tree.png)

3. CLion で `doris_be` ターゲット（Debug または Release）を選択して設定します。`be/bin/start_be.sh` でエクスポートされる環境変数を参考に、各変数にリモートサーバー上の対応するパスを指定します。

    ![実行・デバッグ設定画面 1](/images/clion-run-debug-conf1.png)
    ![実行・デバッグ設定画面 2](/images/clion-run-debug-conf2.png)

4. **Run** をクリックすると BE がコンパイルされて起動します。**Debug** をクリックすると BE がコンパイルされ、デバッグが始まります。

## 方法 2: macOS でのローカル開発

macOS では、リモートサーバーを使用せずに BE をローカルでコンパイルしてデバッグできます。始める前に、[macOS でのコンパイル](../source-install/compilation-mac)に記載されている依存関係のインストールとコードのチェックアウトを完了してください。

### 1. Doris のソースコードのルートディレクトリを開く

![Doris のソースコードを開く画面](/images/mac-clion-deployment1.png)

### 2. CLion を設定する

**ツールチェーンを設定する**: 以下の図に従って設定します。すべての検出項目に合格する必要があります。

![ツールチェーン設定画面](/images/mac-clion-deployment2.png)

**CMake を設定する**: 以下の図に従って設定します。

![CMake 設定画面](/images/mac-clion-deployment3.png)

設定を確認すると、CLion は初回に CMake ファイルを自動的に読み込みます。自動的に読み込まれない場合は、`$DORIS_HOME/be/CMakeLists.txt` を右クリックして Load を選択します。

### 3. BE のデバッグを設定する

Edit Configurations を選択します。

![実行・デバッグ構成の編集画面](/images/mac-clion-deployment4.png)

<!-- Knowledge type: Configuration parameters -->

`doris_be` の環境変数を追加します。`be/bin/start_be.sh` でエクスポートされる環境変数を参考にしてください。環境変数に設定する Doris のディレクトリは、コピーしておいた実行時ディレクトリを指すようにします。環境変数の例:

| 環境変数 | 値の例                                                                                                                                              | 説明                    |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `JAVA_OPTS`          | `-Xmx1024m -DlogPath=$DORIS_HOME/log/jni.log -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -DJDBC_MIN_POOL=1 -DJDBC_MAX_POOL=100 -DJDBC_MAX_IDLE_TIME=300000` | JVM の起動引数 |
| `LOG_DIR`            | `~/DorisDev/doris-run/be/log`                                                                                                                       | BE のログディレクトリ |
| `NLS_LANG`           | `AMERICAN_AMERICA.AL32UTF8`                                                                                                                         | Oracle JDBC のエンコーディング |
| `ODBCSYSINI`         | `~/DorisDev/doris-run/be/conf`                                                                                                                      | ODBC の設定ディレクトリ |
| `PID_DIR`            | `~/DorisDev/doris-run/be/log`                                                                                                                       | PID ファイルのディレクトリ |
| `UDF_RUNTIME_DIR`    | `~/DorisDev/doris-run/be/lib/udf-runtime`                                                                                                           | UDF の実行時ディレクトリ |
| `DORIS_HOME`         | `~/DorisDev/doris-run/be`                                                                                                                           | BE の実行時ディレクトリ |

```bash
JAVA_OPTS=-Xmx1024m -DlogPath=$DORIS_HOME/log/jni.log -Dsun.java.command=DorisBE -XX:-CriticalJNINatives -DJDBC_MIN_POOL=1 -DJDBC_MAX_POOL=100 -DJDBC_MAX_IDLE_TIME=300000
LOG_DIR=~/DorisDev/doris-run/be/log
NLS_LANG=AMERICAN_AMERICA.AL32UTF8
ODBCSYSINI=~/DorisDev/doris-run/be/conf
PID_DIR=~/DorisDev/doris-run/be/log
UDF_RUNTIME_DIR=~/DorisDev/doris-run/be/lib/udf-runtime
DORIS_HOME=~/DorisDev/doris-run/be
```

![環境変数の設定画面](/images/mac-clion-deployment5.png)
![BE のデバッグ設定画面](/images/mac-clion-deployment6.png)

### 4. デバッグを開始する

**Run** または **Debug** をクリックします。CLion がコンパイルを開始し、完了後に BE が起動します。

![デバッグ中の画面](/images/mac-clion-deployment7.png)

## よくある質問（FAQ）

<!-- Knowledge type: Troubleshooting -->

### Q1: リモートでのコンパイル時に `jni.h not found` と表示される

CMake オプションの `-DDORIS_JAVA_HOME` に、リモートサーバー上の `JAVA_HOME` が正しく設定されていません。方法 1 のセクション 2、手順 5 を参照してください。

### Q2: CLion でシンボルが見つからない、または赤い下線が大量に表示される

`gensrc` ディレクトリが Deployment Path の親ディレクトリにコピーされていないか、**Load CMake Project** をクリックして再読み込みしていません。

### Q3: BE が起動直後に終了する

環境変数 `DORIS_HOME`、`PID_DIR`、`LOG_DIR` が設定されていないか、指定したパスが存在しません。上記の環境変数の表を確認してください。すべてのパスを事前に作成しておく必要があります。
