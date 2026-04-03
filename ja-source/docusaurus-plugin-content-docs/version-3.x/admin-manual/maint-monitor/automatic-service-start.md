---
{
  "title": "自動サービス起動",
  "language": "ja",
  "description": "この文書では、サービスの後にサービスが適時にプルアップされないことを確実にするために、Dorisクラスターの自動プルアップを設定する方法について説明します。"
}
---
# 自動サービス開始

本ドキュメントでは、本番環境で特別な状況によりサービスが故障した後、サービスが適時に起動されないことを防ぐため、Dorisクラスタの自動起動を設定する方法について説明します。

FEとBEの自動起動サービスは、Dorisクラスタが完全にセットアップされた後に設定する必要があります。

## SystemdによるDorisサービスの設定

systemdの使用方法とパラメータ解析の詳細については、[こちら](https://systemd.io/)を参照してください

### sudo権限制御

systemdを使用してdorisサービスを制御するにはsudo権限が必要です。sudo権限付与の最小粒度を保証するため、doris-feとdoris-beサービスのsystemd制御権限を指定された非rootユーザーに割り当てることができます。visudoでdoris-feとdoris-beのsystemctl管理権限を設定します。

```
Cmnd_Alias DORISCTL=/usr/bin/systemctl start doris-fe,/usr/bin/systemctl stop doris-fe,/usr/bin/systemctl start doris-be,/usr/bin/systemctl stop doris-be

## Allow root to run any commands anywhere
root    ALL=(ALL)       ALL
doris   ALL=(ALL)       NOPASSWD:DORISCTL
```
### 設定手順

1. config ファイル（fe.conf と be.conf の両方）で "JAVA_HOME" 変数を設定する必要があります。設定しないと "systemctl start" コマンドを使用して doris を起動することができません

   ```
   echo "JAVA_HOME=your_java_home" >> /home/doris/fe/conf/fe.conf
   echo "JAVA_HOME=your_java_home" >> /home/doris/be/conf/be.conf
   ```
2. doris-fe.serviceファイルをダウンロードします：[doris-fe.service](https://github.com/apache/doris/blob/master/tools/systemd/doris-fe.service)

3. doris-fe.serviceの詳細は以下の通りです：

    ```
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
#### 注意事項

- ExecStartとExecStopは実際のfeパスに基づいて設定されます

4. doris-be.serviceファイルをダウンロードします : [doris-be.service](https://github.com/apache/doris/blob/master/tools/systemd/doris-be.service)

5. doris-be.serviceの詳細は以下の通りです:

    ```
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
#### 注意事項

- ExecStartとExecStopは実際のbeパスに基づいて設定されます

6. サービス設定

   doris-fe.serviceとdoris-be.serviceを/usr/lib/systemd/systemディレクトリに配置します

7. 自動起動の設定

    設定ファイルを追加または変更した後、リロードする必要があります

    ```
    systemctl daemon-reload
    ```
起動を設定します。要点は /etc/systemd/system/multi-user.target.wants/ にサービスファイルのリンクを追加することです

    ```
    systemctl enable doris-fe
    systemctl enable doris-be
    ```
8. サービス開始

    ```
    systemctl start doris-fe
    systemctl start doris-be
    ```
## SupervisorによるDorisサービスの設定

Supervisorの具体的な使用方法とパラメータ分析については[こちら](http://supervisord.org/)を参照してください

Supervisor設定は自動的にsupervisor設定を取得します。yumコマンドを使用してsupervisorを直接インストールするか、pipを使用して手動でインストールできます。pipによる手動インストールプロセスは複雑なため、yumデプロイメントモードのみを示します。手動デプロイメントについては、インストールデプロイメントの[こちら](http://supervisord.org/installing.html)を参照してください。

### 設定手順

1. yumでsupervisorをインストール

    ```
    yum install epel-release
    yum install -y supervisor
    ```
2. サービスを開始してステータスを確認する

    ```
    systemctl enable supervisord # bootstrap
    systemctl start supervisord # Start the supervisord service
    systemctl status supervisord # Check the supervisord service status
    ps -ef|grep supervisord # Check whether the supervisord process exists
    ```
3. BEプロセス管理を設定する

    ```
    Modify the start_be.sh script remove the last symbol &

    vim /path/doris/be/bin/start_be.sh
    Take this code : nohup $LIMIT ${DORIS_HOME}/lib/palo_be "$@" >> $LOG_DIR/be.out 2>&1 </dev/null &
    Be changed to : nohup $LIMIT ${DORIS_HOME}/lib/palo_be "$@" >> $LOG_DIR/be.out 2>&1 </dev/null
    ```
BEのスーパーバイザープロセス管理設定ファイルを作成する

    ```
    vim /etc/supervisord.d/doris-be.ini

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
4. FEプロセス管理を設定する

    ```
    Modify the start_fe.sh script remove the last symbol &

    vim /path/doris/fe/bin/start_fe.sh 
    Take this code : nohup $LIMIT $JAVA $final_java_opt org.apache.doris.PaloFe ${HELPER} "$@" >> $LOG_DIR/fe.out 2>&1 </dev/null &
    Be changed to : nohup $LIMIT $JAVA $final_java_opt org.apache.doris.PaloFe ${HELPER} "$@" >> $LOG_DIR/fe.out 2>&1 </dev/null
    ```
FE用のスーパーバイザープロセス管理設定ファイルを作成する

    ```
    vim /etc/supervisord.d/doris-fe.ini

    [program:PaloFe]
    environment = JAVA_HOME="/usr/local/java"
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
5. Brokerプロセス管理の設定

    ```
    Modify the start_broker.sh script remove the last symbol &

    vim /path/apache_hdfs_broker/bin/start_broker.sh
    Take this code : nohup $LIMIT $JAVA $JAVA_OPTS org.apache.doris.broker.hdfs.BrokerBootstrap "$@" >> $BROKER_LOG_DIR/apache_hdfs_broker.out 2>&1 </dev/null &
    Be changed to : nohup $LIMIT $JAVA $JAVA_OPTS org.apache.doris.broker.hdfs.BrokerBootstrap "$@" >> $BROKER_LOG_DIR/apache_hdfs_broker.out 2>&1 </dev/null
    ```
Brokerのスーパーバイザープロセス管理プロファイルを作成する

    ```
    vim /etc/supervisord.d/doris-broker.ini

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
6. まずDorisサービスが停止しているかどうかを確認し、次にsupervisorを使用してDorisを自動的に起動し、その後プロセスが正常に開始されるかどうかを確認します

    ```
    supervisorctl reload # Reload all the Supervisor configuration files
    supervisorctl status # Check the supervisor status and verify that the Doris service process starts normally

    其他命令 : 
    supervisorctl start all # supervisorctl start It is capable of opening processes
    supervisorctl stop doris-be # The process is supervisorctl stop
    ```
#### 注意事項：

- yumを使用してインストールしたsupervisorが起動する場合、エラーが発生します：pkg_resources.DistributionNotFound: The 'supervisor==3.4.0' distribution was not found

```
supervisor installed directly using the yum command only supports python2,Therefore, the file contents in /usr/bin/supervisorctl and /usr/bin/supervisorctl should be changed at the beginning Change #! /usr/bin/python to #! /usr/bin/python2, python2 must be installed
```
- supervisorがDorisプロセスを自動的に起動するよう設定されている場合、DorisでBEノードが異常な要因により故障すると、be.outに出力されるべきエラースタック情報がsupervisorによって傍受されます。詳細な分析のためには、supervisorのログを確認する必要があります。
