---
title: Docker を使った Doris 開発環境の簡単な構築
language: ja
description: Dockerfile の例と VSCode Remote の設定を含め、Docker で Apache Doris の開発環境をすばやく構築する方法を説明します。
keywords:
    - Apache Doris
    - Docker
    - 開発環境
    - Dockerfile
    - VSCode Remote
    - SYS_PTRACE
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

# Docker を使った Doris 開発環境の簡単な構築

この記事では、Docker を使って Doris の開発用イメージを作成し、FE/BE をコンパイルして起動する方法と、VSCode Remote を組み合わせて開発・デバッグする方法を説明します。

<!-- Knowledge type: Procedure -->
<!-- Use case: IDE configuration / Containerized development environment -->

## 関連する詳細ドキュメント

- [Docker 開発用イメージを使ったコンパイル](/community/source-install/compilation-with-docker)
- [デプロイ](/docs/dev/install/deploy-manually/integrated-storage-compute-deploy-manually)
- [VSCode による BE の開発とデバッグ](./be-vscode-dev)

## 1. 環境の準備

| コンポーネント | 説明 |
| ------------- | ---- |
| Docker | インストール済みで、起動していること |
| VSCode | 最新の安定版 |
| Remote プラグイン | VSCode Remote - Containers / SSH |

## 2. イメージの作成

### 2.1 Dockerfile の作成

作業ディレクトリに `Dockerfile` を作成します。VSCode では Ctrl+D を使って、次のプレースホルダーを置き換えられます。

| プレースホルダー | 意味 |
| --------------- | ---- |
| `<!!! your user !!!>` | コンテナー内に作成するユーザーの名前 |
| `<!!! your user password !!!>` | そのユーザーのパスワード |
| `<!!! root password !!!>` | root ユーザーのパスワード |
| `<!!! your git email !!!>` | git の設定に使用するメールアドレス |
| `<!!! your git username !!!>` | git の設定に使用するユーザー名 |

```dockerfile
FROM apache/incubator-doris:build-env-latest

USER root
WORKDIR /root
RUN echo '<!!! root password !!!>' | passwd root --stdin

RUN yum install -y vim net-tools man wget git mysql lsof bash-completion \
        && cp /var/local/thirdparty/installed/bin/thrift /usr/bin

# For better safety, create a user instead of using root
RUN yum install -y sudo \
        && useradd -ms /bin/bash <!!! your user !!!> && echo <!!! your user password !!!> | passwd <!!! your user !!!> --stdin \
        && usermod -a -G wheel <!!! your user !!!>

USER <!!! your user !!!>
WORKDIR /home/<!!! your user !!!>
RUN git config --global color.ui true \
        && git config --global user.email "<!!! your git email !!!>" \
        && git config --global user.name "<!!! your git username !!!>"

# Optionally install zsh and oh my zsh for easier use; remove if not needed
USER root
RUN yum install -y zsh \
        && chsh -s /bin/zsh <!!! your user !!!>
USER <!!! your user !!!>
RUN wget https://github.com/robbyrussell/oh-my-zsh/raw/master/tools/install.sh -O - | zsh \
        && git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions \
        && git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

### 2.2 イメージのビルド

```shell
docker build -t doris .
```

### 2.3 イメージの実行

<!-- Knowledge type: Configuration parameters -->

マウントのオプションについては、[Docker でのコンパイル時のマウントに関する注意事項](../source-install/compilation-with-docker)を参照してください。ローカルの Doris ソースディレクトリをマウントしてイメージを実行することを推奨します。

:::caution Windows ユーザー向け
Windows では、マウント時にファイルシステム間のアクセスに関する問題が発生します。環境に応じて設定してください。
:::

`--cap-add SYS_PTRACE` パラメーターを指定すると、Docker 内で ptrace を使用できるようになり、ptrace や GDB によるリモートデバッグに役立ちます。

```shell
docker run -it --cap-add SYS_PTRACE doris:latest /bin/bash
```

| パラメーター | 用途 |
| ------------ | ---- |
| `--cap-add SYS_PTRACE` | コンテナー内で ptrace を呼び出せるようにする（GDB に必要） |
| `-it` | 対話型 TTY |
| `-v <local>:<container>` | ローカルのソースディレクトリをマウントする（必要に応じて） |

### 2.4 zsh の設定（任意）

zsh をインストールした場合は、`~/.zshrc` の plugins 行を次のように置き換えます。

```bash
plugins=(git zsh-autosuggestions zsh-syntax-highlighting)
```

### 2.5 Doris ソースコードの取得

```shell
su <your user>
mkdir code && cd code
git clone https://github.com/apache/doris.git
cd doris
git submodule update --init --recursive
```

## 3. コンパイル

:::caution 初回のコンパイル
初回のコンパイルでは、次のコマンドを使ってクリーンビルドを強制します。

```shell
sh build.sh --clean --be --fe --ui
```

`build-env-for-0.15.0` イメージでは thrift が 0.9 から 0.13 にアップグレードされたため、`--clean` を指定して新しいバージョンの thrift でコードファイルを生成する必要があります。指定しないと、互換性のないコードが生成されます。
:::

以降は、通常どおり Doris をコンパイルします。

```shell
sh build.sh
```

## 4. 起動

### 4.1 メタデータディレクトリの準備

メタデータを保存する `meta_dir` ディレクトリを手動で作成します。デフォルト値は `${DORIS_HOME}/doris-meta` です。

```shell
mkdir meta_dir
```

### 4.2 FE の起動

```shell
cd output/fe
sh bin/start_fe.sh --daemon
```

### 4.3 BE の起動

```shell
cd output/be
sh bin/start_be.sh --daemon
```

### 4.4 mysql-client での接続

```shell
mysql -h 127.0.0.1 -P 9030 -u root
```

## 5. FAQ

<!-- Knowledge type: Troubleshooting -->

### Q1: GDB で `ptrace: Operation not permitted` と表示される

コンテナーの起動時に `--cap-add SYS_PTRACE` が指定されていません。このパラメーターを追加してコンテナーを再起動してください。

### Q2: コンパイル時に thrift のバージョン不一致が報告される

初回のコンパイルで `--clean` が指定されていません。クリーンアップしてから、セクション 3 のコマンドで再コンパイルしてください。

### Q3: FE / BE が起動直後に終了する

`meta_dir` と `storage_root_path` が作成されているか、ポートが使用中でないか、`priority_networks` にコンテナーの IP が含まれているかを確認してください。

### Q4: VSCode Remote コンテナーでデバッグ対象のプロセスにアタッチできない

`SYS_PTRACE` ケイパビリティが追加されていないか、VSCode C/C++ プラグインで適切な `miDebuggerPath` が指定されていません。
