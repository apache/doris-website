---
{
    "title": "サービスの自動起動",
    "language": "ja",
    "description": "本番環境でのサービス可用性を確保するため、Systemd または Supervisor を使用して Doris の FE/BE/Broker をホスト起動時に自動起動し、異常終了時に自動再起動する方法を説明します。"
}
---

このドキュメントでは、Apache Doris クラスターのサービスを自動起動する方法を説明します。本番環境でホストが再起動したり、プロセスが予期せず終了したりした際に、FE、BE、Broker のサービスが長時間停止することを防ぐのが目的です。Doris では、一般的な方法として **Systemd** と **Supervisor** を使用できます。運用方針に応じて、どちらか一方を選択してください。

:::caution
自動起動を設定する前に、Doris クラスターのデプロイを完了し、FE と BE を手動で正常に起動できることを確認してください。
:::

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Production operations / High-availability deployment -->

## 適用場面

| 場面 | 推奨する方法 | 備考 |
|------|---------|------|
| ホストの再起動後に Doris のサービスを自動起動する | Systemd | システムの init 機構と緊密に統合され、再起動時に機能する |
| プロセスが予期せず終了した後に自動再起動する | Systemd / Supervisor | どちらも異常終了時の再起動ポリシーをサポートする |
| 複数のプロセス（FE/BE/Broker）を一元管理する | Supervisor | プロセスの一元管理とログの集約をサポートする |
| sudo 権限を最小限に抑える必要がある運用 | Systemd | `visudo` で特定のユーザーに必要な権限だけを付与できる |

## 方法の比較

| 項目 | Systemd | Supervisor |
|------|---------|------------|
| インストール | 標準搭載（主要な Linux ディストリビューション） | `yum` または `pip` でインストール |
| 起動管理 | `systemctl` | `supervisorctl` |
| 設定ファイル | `/usr/lib/systemd/system/*.service` | `/etc/supervisord.d/*.ini` |
| 異常終了時の再起動 | `Restart=on-failure` | `autorestart=true` |
| ログ出力 | journald とアプリケーションログ | Supervisor が stdout/stderr を管理 |
| 適用場面 | 一般的な本番環境 | 複数プロセスの一元管理 |

## 前提条件

- Doris クラスターをデプロイ済みで、FE/BE を手動で正常に起動できること。
- ホストに Java がインストールされ、`JAVA_HOME` のパスが利用可能であること。
- 現在のユーザーに root 権限があるか、sudo 経由で systemctl/supervisord コマンドを実行できること。

---

## 方法 1：Systemd で自動起動を設定する

Systemd は主要な Linux ディストリビューションに標準搭載されているサービス管理ツールで、ほとんどの本番環境に適しています。パラメーターの詳細については、[Systemd の公式ドキュメント](https://systemd.io/)を参照してください。

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Production deployment / Boot-time startup configuration -->

### 1. sudo 権限を設定する（任意）

systemd で Doris のサービスを操作するには sudo 権限が必要です。最小権限の原則に従い、root 以外の特定のユーザーに `doris-fe` と `doris-be` の systemctl 操作権限を付与します。`visudo` で次のエントリを追加します。

```text
Cmnd_Alias DORISCTL=/usr/bin/systemctl start doris-fe,/usr/bin/systemctl stop doris-fe,/usr/bin/systemctl start doris-be,/usr/bin/systemctl stop doris-be

## Allow root to run any commands anywhere
root    ALL=(ALL)       ALL
doris   ALL=(ALL)       NOPASSWD:DORISCTL
```

権限を付与すると、`doris` ユーザーは `sudo systemctl start/stop doris-fe|doris-be` でパスワードを入力せずに Doris のサービスを管理できます。

### 2. 設定ファイルで JAVA_HOME を指定する

**目的**：systemd は起動時に `~/.bashrc` などのユーザー環境変数を読み込みません。そのため、`JAVA_HOME` を明示的に指定する必要があります。指定しないと、`systemctl start` でサービスを起動できません。

**コマンド**：

```shell
echo "JAVA_HOME=your_java_home" >> /home/doris/fe/conf/fe.conf
echo "JAVA_HOME=your_java_home" >> /home/doris/be/conf/be.conf
```

**注記**：`your_java_home` は、実際の Java のインストールパス（例：`/usr/local/jdk8`）に置き換えてください。

### 3. FE のサービスファイルを用意する

Doris リポジトリから [doris-fe.service](https://github.com/apache/doris/blob/master/tools/systemd/doris-fe.service) をダウンロードします。内容は次のとおりです。

```text
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

[Unit]
Description=Doris FE
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
User=root
Group=root
LimitCORE=infinity
LimitNOFILE=200000
Restart=on-failure
RestartSec=30
StartLimitInterval=120
StartLimitBurst=3
KillMode=none
ExecStart=/home/doris/fe/bin/start_fe.sh --daemon 
ExecStop=/home/doris/fe/bin/stop_fe.sh

[Install]
WantedBy=multi-user.target
```

:::caution
**注記**

- `ExecStart` と `ExecStop` を実際の FE のデプロイ先パスに合わせて変更してください。
:::

### 4. BE のサービスファイルを用意する

Doris リポジトリから [doris-be.service](https://github.com/apache/doris/blob/master/tools/systemd/doris-be.service) をダウンロードします。内容は次のとおりです。

```shell
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

[Unit]
Description=Doris BE
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
User=root
Group=root
LimitCORE=infinity
LimitNOFILE=200000
Restart=on-failure
RestartSec=30
StartLimitInterval=120
StartLimitBurst=3
KillMode=none
ExecStart=/home/doris/be/bin/start_be.sh --daemon
ExecStop=/home/doris/be/bin/stop_be.sh

[Install]
WantedBy=multi-user.target
```

:::caution
**注記**

- `ExecStart` と `ExecStop` を実際の BE のデプロイ先パスに合わせて変更してください。
:::

### 5. サービスファイルの主なパラメーター

| パラメーター | 役割 |
|------|------|
| `Type=forking` | プロセスをバックグラウンドのデーモンとして実行する |
| `LimitCORE=infinity` | コアダンプのサイズを制限せず、問題の調査に役立てる |
| `LimitNOFILE=200000` | ファイルハンドル数の上限を設定し、`Too many open files` を回避する |
| `Restart=on-failure` | プロセスが予期せず終了した場合に自動再起動する |
| `RestartSec=30` | 予期せず終了した後、再起動まで 30 秒待機する |
| `StartLimitInterval=120` / `StartLimitBurst=3` | 連鎖的な障害を避けるため、120 秒間に最大 3 回まで再起動する |
| `KillMode=none` | 停止時に子プロセスを強制終了せず、スクリプトに処理を任せる |
| `ExecStart` / `ExecStop` | Doris の起動・停止スクリプトへのパス |

### 6. サービスファイルを配置する

`doris-fe.service` と `doris-be.service` を systemd のディレクトリにコピーします。

```shell
cp doris-fe.service doris-be.service /usr/lib/systemd/system/
```

### 7. ホスト起動時の自動起動を有効にする

サービス設定を追加または変更したら、systemd の設定を再読み込みします。

```shell
systemctl daemon-reload
```

ホスト起動時の自動起動を有効にします。これにより、`/etc/systemd/system/multi-user.target.wants/` にサービスファイルへのリンクが作成されます。

```shell
systemctl enable doris-fe
systemctl enable doris-be
```

### 8. サービスを起動する

```shell
systemctl start doris-fe
systemctl start doris-be
```

`systemctl status doris-fe` または `systemctl status doris-be` でサービスの状態を確認します。

---

## 方法 2：Supervisor で自動起動を設定する

Supervisor は Python 製のプロセス管理ツールです。複数のプロセスを一元管理し、ログを集約する必要がある場合に適しています。パラメーターの詳細については、[Supervisor の公式ドキュメント](http://supervisord.org/)を参照してください。

Supervisor は `yum` で直接、または `pip` で手動インストールできます。`pip` によるインストール手順は複雑なため、このドキュメントでは `yum` を使う方法のみを説明します。手動でデプロイする場合は、[Supervisor のインストールドキュメント](http://supervisord.org/installing.html)を参照してください。

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Production deployment / Centralized multi-process management -->

### 1. Supervisor をインストールする

```shell
yum install epel-release
yum install -y supervisor
```

### 2. Supervisor サービスを起動して状態を確認する

```shell
systemctl enable supervisord    # Enable startup at boot
systemctl start supervisord     # Start the supervisord service
systemctl status supervisord    # Check the supervisord service status
ps -ef | grep supervisord       # Check whether a supervisord process exists
```

### 3. BE プロセスの管理を設定する

**目的**：Supervisor が BE プロセスのフォアグラウンド出力を管理できるようにします。BE の起動スクリプトから末尾の `&` を削除します。

**起動スクリプトを変更**：

```shell
vim /path/doris/be/bin/start_be.sh
```

変更前：

```text
nohup $LIMIT ${DORIS_HOME}/lib/palo_be "$@" >> $LOG_DIR/be.out 2>&1 </dev/null &
```

変更後：

```text
nohup $LIMIT ${DORIS_HOME}/lib/palo_be "$@" >> $LOG_DIR/be.out 2>&1 </dev/null
```

**BE の Supervisor 設定ファイルを作成**：`/etc/supervisord.d/doris-be.ini`

```ini
[program:doris_be]
process_name=%(program_name)s
directory=/path/doris/be/be
command=sh /path/doris/be/bin/start_be.sh
autostart=true
autorestart=true
user=root
numprocs=1
startretries=3
stopasgroup=true
killasgroup=true
startsecs=5
#redirect_stderr = true
#stdout_logfile_maxbytes = 20MB
#stdout_logfile_backups = 10
#stdout_logfile=/var/log/supervisor-palo_be.log
```

### 4. FE プロセスの管理を設定する

**目的**：BE と同様に、Supervisor がフォアグラウンドプロセスを管理できるよう、FE の起動スクリプトから末尾の `&` を削除します。

**起動スクリプトを変更**：

```shell
vim /path/doris/fe/bin/start_fe.sh
```

変更前：

```text
nohup $LIMIT $JAVA $final_java_opt org.apache.doris.PaloFe ${HELPER} "$@" >> $LOG_DIR/fe.out 2>&1 </dev/null &
```

変更後：

```text
nohup $LIMIT $JAVA $final_java_opt org.apache.doris.PaloFe ${HELPER} "$@" >> $LOG_DIR/fe.out 2>&1 </dev/null
```

**FE の Supervisor 設定ファイルを作成**：`/etc/supervisord.d/doris-fe.ini`

```ini
[program:PaloFe]
environment = JAVA_HOME="/path/jdk8"
process_name=PaloFe
directory=/path/doris/fe
command=sh /path/doris/fe/bin/start_fe.sh
autostart=true
autorestart=true
user=root
numprocs=1
startretries=3
stopasgroup=true
killasgroup=true
startsecs=10
#redirect_stderr=true
#stdout_logfile_maxbytes=20MB
#stdout_logfile_backups=10
#stdout_logfile=/var/log/supervisor-PaloFe.log
```

### 5. Broker プロセスの管理を設定する（任意）

**目的**：クラスターに Broker をデプロイしている場合は、Supervisor で管理することもできます。これまでと同様に、Broker の起動スクリプトから末尾の `&` を削除します。

**起動スクリプトを変更**：

```shell
vim /path/apache_hdfs_broker/bin/start_broker.sh
```

変更前：

```text
nohup $LIMIT $JAVA $JAVA_OPTS org.apache.doris.broker.hdfs.BrokerBootstrap "$@" >> $BROKER_LOG_DIR/apache_hdfs_broker.out 2>&1 </dev/null &
```

変更後：

```text
nohup $LIMIT $JAVA $JAVA_OPTS org.apache.doris.broker.hdfs.BrokerBootstrap "$@" >> $BROKER_LOG_DIR/apache_hdfs_broker.out 2>&1 </dev/null
```

**Broker の Supervisor 設定ファイルを作成**：`/etc/supervisord.d/doris-broker.ini`

```ini
[program:BrokerBootstrap]
environment = JAVA_HOME="/usr/local/java"
process_name=%(program_name)s
directory=/path/apache_hdfs_broker
command=sh /path/apache_hdfs_broker/bin/start_broker.sh
autostart=true
autorestart=true
user=root
numprocs=1
startretries=3
stopasgroup=true
killasgroup=true
startsecs=5
#redirect_stderr=true
#stdout_logfile_maxbytes=20MB
#stdout_logfile_backups=10
#stdout_logfile=/var/log/supervisor-BrokerBootstrap.log
```

### 6. Supervisor の設定パラメーター

| パラメーター | 役割 |
|------|------|
| `program:<name>` | プロセスの識別子。supervisorctl はこの名前でプロセスを管理する |
| `directory` | プロセスの作業ディレクトリ |
| `command` | 起動コマンド |
| `autostart=true` | supervisord の起動時にプロセスを自動起動する |
| `autorestart=true` | プロセスの終了後に自動再起動する |
| `startretries=3` | 起動に失敗した場合、最大 3 回まで再試行する |
| `startsecs` | 起動成功と見なすまでプロセスが継続して動作する必要がある秒数 |
| `stopasgroup` / `killasgroup` | プロセスグループ全体に停止または強制終了を適用する |
| `environment` | `JAVA_HOME` などの環境変数を渡す |

### 7. 設定を読み込み、サービスを起動する

Doris のサービスが現在停止していることを確認してから、Supervisor に自動起動の管理を引き継がせます。

```shell
supervisorctl reload    # Reload all configuration files in Supervisor
supervisorctl status    # Check process status to confirm that Doris services started normally
```

**その他の一般的なコマンド**：

```shell
supervisorctl start all          # Start all managed processes
supervisorctl stop doris-be      # Stop a specific process
```

---

## FAQ

### Q：`systemctl start` が失敗し、ログに `JAVA_HOME` が見つからないと表示されます。どう対処すればよいですか？

systemd はユーザー環境変数を読み込みません。`JAVA_HOME=...` を `fe.conf` と `be.conf` に明示的に追記してください。

### Q：Supervisor の起動時に `pkg_resources.DistributionNotFound: The 'supervisor==3.4.0' distribution was not found` というエラーが発生します。どう対処すればよいですか？

yum でインストールした Supervisor は Python 2 のみに対応していますが、デフォルトの `/usr/bin/python` が Python 3 を指しています。Python 2 をインストールした状態で、`/usr/bin/supervisord` と `/usr/bin/supervisorctl` の先頭行を `#!/usr/bin/python` から `#!/usr/bin/python2` に変更してください。

### Q：BE のクラッシュ後、`be.out` にエラースタックが記録されません。どう対処すればよいですか？

Supervisor がプロセスの stdout/stderr を管理しているため、エラーメッセージは Supervisor のログに出力されます。Supervisor のログディレクトリ（デフォルトは `/var/log/supervisor/`）で、該当するプロセスのログを確認してください。

### Q：サービスファイルの変更が反映されません。どう対処すればよいですか？

systemd が設定を再読み込みしていません。`systemctl daemon-reload` を実行し、サービスを再度起動してください。

### Q：頻繁に再起動した後、systemd がプロセスの起動を拒否します。どう対処すればよいですか？

`StartLimitBurst` の上限に達しています。根本原因を調査してから、`systemctl reset-failed doris-fe` を実行してカウンターをリセットしてください。
