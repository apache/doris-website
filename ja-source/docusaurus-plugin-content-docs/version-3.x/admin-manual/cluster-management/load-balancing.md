---
{
  "title": "ロードバランシング",
  "language": "ja",
  "description": "ユーザーはMySQLプロトコルを使用してFEのクエリポート（queryport、デフォルト9030）を通じてDorisに接続します。複数のFEノードをデプロイする場合、"
}
---
ユーザーはMySQLプロトコルを使用してFEのクエリポート（`query_port`、デフォルト9030）を通じてDorisに接続します。複数のFEノードをデプロイする場合、ユーザーは複数のFEの上位に負荷分散層をデプロイして、Dorisクエリの高可用性を実現できます。

このドキュメントでは、Dorisに適したさまざまな負荷分散ソリューションを紹介し、Proxy Protocolを使用してクライアントIPパススルーを実装する方法について説明します。

## 負荷分散

この記事では、手順を説明するために以下の3つのFEノードを例として使用します：

```text
192.168.1.101:9030
192.168.1.102:9030
192.168.1.103:9030
```
Proxyサーバーノード:

```text
192.168.1.100
```
### 01 JDBC URL

JDBC URLの組み込みロードバランシング設定を使用します。

```text
jdbc:mysql:loadbalance://192.168.1.101:9030,192.168.1.102:9030,192.168.1.103:9030/test_db
```
詳細については、[MySQL Official Documentation](https://dev.mysql.com/doc/connector-j/en/connector-j-usagenotes-j2ee-concepts-managing-load-balanced-connections.html)を参照してください。

### 02 Nginx

[Nginx](https://nginx.org/) TCP リバースプロキシを使用してDorisの負荷分散を実装します。

#### Nginxのインストール

Nginxを正しくインストールするには、[Nginx](https://nginx.org/en/docs/install.html)の公式サイトを参照してください。ここでは、Ubuntu システムでNginx 1.18.0 バージョンを例として、Nginxのコンパイルとインストール手順を説明します。

1. コンパイル依存関係のインストール

    ```shell
    sudo apt-get install build-essential
    sudo apt-get install libpcre3 libpcre3-dev 
    sudo apt-get install zlib1g-dev
    sudo apt-get install openssl libssl-dev
    ```
2. Nginxをインストールする

    ```shell
    sudo wget http://nginx.org/download/nginx-1.18.0.tar.gz
    sudo tar zxvf nginx-1.18.0.tar.gz
    cd nginx-1.18.0
    sudo ./configure --prefix=/usr/local/nginx --with-stream --with-http_ssl_module --with-http_gzip_static_module --with-http_stub_status_module
    sudo make && make install
    ```
#### リバースプロキシの設定

新しい設定ファイルを作成します：

```shell
vim /usr/local/nginx/conf/default.conf
```
```text
events {
worker_connections 1024;
}
stream {
  upstream mysqld {
      hash $remote_addr consistent;
      server 192.168.1.101:9030 weight=1 max_fails=2 fail_timeout=60s;
      server 192.168.1.102:9030 weight=1 max_fails=2 fail_timeout=60s;
      server 192.168.1.103:9030 weight=1 max_fails=2 fail_timeout=60s;
  }
  server {
   # Proxy port
      listen 6030;
      proxy_connect_timeout 300s;
      proxy_timeout 300s;
      proxy_pass mysqld;
  }
}
```
#### Nginx の開始

指定された設定ファイルで開始する：

```shell
cd /usr/local/nginx
/usr/local/nginx/sbin/nginx -c conf.d/default.conf
```
#### 検証

プロキシポートを使用して接続します：

```shell
mysql -uroot -P6030 -h192.168.1.100

mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| test               |
+--------------------+
2 rows in set (0.00 sec)
```
### 03 HAProxy

[HAProxy](https://www.haproxy.org/)は、C言語で書かれた高性能なTCP/HTTPロードバランサーです。

#### HAProxyのインストール

1. HAProxyをダウンロード

   ダウンロードリンク: https://src.fedoraproject.org/repo/pkgs/haproxy/

2. 展開

   ```shell
   tar -zxvf haproxy-2.6.15.tar.gz -C /opt/
   mv haproxy-2.6.15 haproxy
   cd haproxy
   ```
3. コンパイル

   ```shell
   yum install gcc gcc-c++ -y
   make TARGET=linux-glibc PREFIX=/usr/local/haproxy
   make install PREFIX=/usr/local/haproxy
   ```
#### HAProxyの設定

1. haproxy.confファイルを設定する

    設定ファイルを開く:

    ```shell
    vim /etc/rsyslog.d/haproxy.conf
    ```
コンテンツは以下の通りです：

    ```text
    $ModLoad imudp 
    $UDPServerRun 514
    local0.* /usr/local/haproxy/logs/haproxy.log
    &~
    ```
2. リモートログを有効化する

    ```shell
    vim /etc/sysconfig/rsyslog
    ```
コンテンツを追加:

    ```text
    SYSLOGD_OPTIONS="-c 2 -r -m 0"
    ```
パラメータの説明:

    - `-c 2`: 互換モードを使用します。デフォルトは `-c 5` です。
    - `-r`: リモートログを有効にします。
    - `-m 0`: タイムスタンプをマークします。分単位で、0の場合はこの機能が無効であることを示します。

    変更を適用:

    `systemctl restart rsyslog`

3. ロードバランシングファイルを編集

    ```shell
    vim /usr/local/haproxy/haproxy.cfg
    ```
    ```text
    global
        maxconn         2000
        ulimit-n        40075
        log             127.0.0.1 local0 info
        uid             200
        gid             200
        chroot          /var/empty
        daemon
        group           haproxy
        user            haproxy

    defaults
        log global
        mode http
        retries 3
        option redispatch

        timeout connect 5000
        timeout client 5000
        timeout server 5000
        timeout check 2000

    frontend agent-front
        bind *:6030
        mode tcp
        default_backend forward-fe

    backend forward-fe
        mode tcp
        balance roundrobin
        server fe-1 192.168.1.101:9030 weight 1 check inter 3000 rise 2 fall 3
        server fe-2 192.168.1.102:9030 weight 1 check inter 3000 rise 2 fall 3
        server fe-3 192.168.1.103:9030 weight 1 check inter 3000 rise 2 fall 3
    ```
#### HAProxyの開始

1. サービスの開始

    `/opt/haproxy/haproxy -f /usr/local/haproxy/haproxy.cfg`

2. サービスステータスの確認

    `netstat -lnatp | grep -i haproxy`

#### 検証

`mysql -h 192.168.1.100 -uroot -P6030 -p`

### 04 ProxySQL

[ProxySQL](https://proxysql.com/)は、C言語で書かれたオープンソースのMySQLデータベースプロキシソフトウェアです。接続管理、読み書き分離、負荷分散、フェイルオーバーなどの機能を実装できます。高性能、設定可能性、動的管理などの利点があり、Webサービス、ビッグデータプラットフォーム、クラウドデータベースなどのシナリオで一般的に使用されています。

#### ProxySQLのインストール

ProxySQLを正しくインストールするには、[公式ドキュメント](https://proxysql.com/documentation/installing-proxysql/)を参照してください。

#### ProxySQLの設定

ProxySQLには設定ファイル`/etc/proxysql.cnf`と設定データベースファイル`/var/lib/proxysql/proxysql.db`が含まれています。

特に注意すべき点として、`/var/lib/proxysql`ディレクトリに"proxysql.db"ファイルが存在する場合、ProxySQLサービスは最初の起動時のみ`proxysql.cnf`を読み取り解析し、その後の起動では読み取らなくなります。

再起動後に`proxysql.cnf`設定を有効にするには、サービスを再起動する前に`/var/lib/proxysql/proxysql.db`を削除する必要があります。これは初期化起動と同等であり、新しい`proxysql.db`ファイルが生成され、元の設定ルールはクリアされます。

以下は設定ファイル`proxysql.cnf`の主な内容です：

```text
datadir="/var/lib/proxysql"         #Data directory
admin_variables=
{
    admin_credentials="admin:admin"  # Admin databse username and password.
    mysql_ifaces="0.0.0.0:6032"    # Admin database port, used for connecting admin database of ProxySQL
}
mysql_variables=
{
    threads=4
    max_connections=2048
    default_query_delay=0
    default_query_timeout=36000000
    have_compress=true
    poll_timeout=2000
    interfaces="0.0.0.0:6030"
    default_schema="information_schema"
    stacksize=1048576
    server_version="5.7.99"
    connect_timeout_server=3000
    monitor_username="monitor"
    monitor_password="monitor"
    monitor_history=600000
    monitor_connect_interval=60000
    monitor_ping_interval=10000
    monitor_read_only_interval=1500
    monitor_read_only_timeout=500
    ping_interval_server_msec=120000
    ping_timeout_server=500
    commands_stats=true
    sessions_sort=true
    connect_retries_on_failure=10
}
mysql_servers =
(
)
mysql_users:
(
)
mysql_query_rules:
(
)
scheduler=
(
)
mysql_replication_hostgroups=
(
)
```
#### ProxySQL Admin データベースへの接続

```shell
mysql -uadmin -padmin -P6032 -hdoris01
```
```sql
ProxySQL > show databases;
+-----+---------------+-------------------------------------+
| seq | name          | file                                |
+-----+---------------+-------------------------------------+
| 0   | main          |                                     |
| 2   | disk          | /var/lib/proxysql/proxysql.db       |
| 3   | stats         |                                     |
| 4   | monitor       |                                     |
| 5   | stats_history | /var/lib/proxysql/proxysql_stats.db |
+-----+---------------+-------------------------------------+
5 rows in set (0.000 sec)
ProxySQL > use main;

ProxySQL > show tables;
+--------------------------------------------+
| tables                                     |
+--------------------------------------------+
| global_variables                           |
| mysql_collations                           |
| mysql_group_replication_hostgroups         |
| mysql_query_rules                          |
| mysql_query_rules_fast_routing             |
| mysql_replication_hostgroups               |
| mysql_servers                              |
| mysql_users                                |
| proxysql_servers                           |
| runtime_checksums_values                   |
| runtime_global_variables                   |
| runtime_mysql_group_replication_hostgroups |
| runtime_mysql_query_rules                  |
| runtime_mysql_query_rules_fast_routing     |
| runtime_mysql_replication_hostgroups       |
| runtime_mysql_servers                      |
| runtime_mysql_users                        |
| runtime_proxysql_servers                   |
| runtime_scheduler                          |
| scheduler                                  |
+--------------------------------------------+
20 rows in set (0.000 sec)
```
#### ProxySQLでBackend Doris FEを設定する

INSERT文を使用して、プロキシする必要があるFEノードとポートを`mysql_servers`テーブルに追加します。

ここで：`hostgroup_id`の`10`は書き込みグループを示し、`20`は読み取りグループを示します。ここでは読み書き分離は必要ないため、任意に設定できます。

```shell
mysql -uadmin -padmin -P6032 -h127.0.0.1
```
```sql
ProxySQL > insert into mysql_servers(hostgroup_id,hostname,port) values(10,'192.168.0.101',9030);
Query OK, 1 row affected (0.000 sec)
  
ProxySQL > insert into mysql_servers(hostgroup_id,hostname,port) values(10,'192.168.0.102',9030);
Query OK, 1 row affected (0.000 sec)
  
ProxySQL > insert into mysql_servers(hostgroup_id,hostname,port) values(10,'192.168.0.103',9030);
Query OK, 1 row affected (0.000 sec)
```
結果を確認:

```sql
ProxySQL > select hostgroup_id,hostname,port,status,weight from mysql_servers;
+--------------+---------------+------+--------+--------+
| hostgroup_id | hostname      | port | status | weight |
+--------------+---------------+------+--------+--------+
| 10           | 192.168.0.101 | 9030 | ONLINE | 1      |
| 20           | 192.168.0.102 | 9030 | ONLINE | 1      |
| 20           | 192.168.0.103 | 9030 | ONLINE | 1      |
+--------------+---------------+------+--------+--------+
3 rows in set (0.000 sec)
```
挿入中にエラーが発生した場合：

```text
ERROR 1045 (#2800): UNIQUE constraint failed: mysql_servers.hostgroup_id, mysql_servers.hostname, mysql_servers.port
```
これは、他の設定が以前に定義されている可能性があることを示しています。このテーブルを空にするか、対応するホストの設定を削除することができます：

```sql
ProxySQL > select * from mysql_servers;
ProxySQL > delete from mysql_servers;
Query OK, 6 rows affected (0.000 sec)
```
情報を保存:

```sql
ProxySQL > load mysql servers to runtime;
Query OK, 0 rows affected (0.006 sec)
  
ProxySQL > save mysql servers to disk;
Query OK, 0 rows affected (0.348 sec)
```
#### Doris FEノードの監視設定

Doris FEノードを追加した後、これらのバックエンドノードを監視する必要があります。

まず、Dorisで監視用のユーザーを作成します：

```shell
mysql -uroot -P9030 -h192.168.0.101
```
```sql
Doris > create user monitor@'192.168.0.100' identified by 'P@ssword1!';
Query OK, 0 rows affected (0.03 sec)

Doris > grant ADMIN_PRIV on *.* to monitor@'192.168.0.100';
Query OK, 0 rows affected (0.02 sec)
```
その後、mysql-proxyプロキシ層ノードに戻って監視を設定する

```shell
mysql -uadmin -padmin -P6032 -h127.0.0.1
```
```sql
ProxySQL > set mysql-monitor_username='monitor';
Query OK, 1 row affected (0.000 sec)
 
ProxySQL > set mysql-monitor_password='P@ssword1!';
Query OK, 1 row affected (0.000 sec)
```
設定を保存して終了:

```sql
ProxySQL > load mysql servers to runtime;
Query OK, 0 rows affected (0.006 sec)
  
ProxySQL > save mysql servers to disk;
Query OK, 0 rows affected (0.348 sec)
```
監視結果を確認します。

ProxySQL監視モジュールのメトリクスはすべて`monitor.log`テーブルに保存されます。

接続監視：

```sql
ProxySQL > select * from mysql_server_connect_log;
+---------------+------+------------------+-------------------------+---------------+
| hostname      | port | time_start_us    | connect_success_time_us | connect_error |
+---------------+------+------------------+-------------------------+---------------+
| 192.168.0.101 | 9030 | 1548665195883957 | 762                     | NULL          |
| 192.168.0.102 | 9030 | 1548665195894099 | 399                     | NULL          |
| 192.168.0.103 | 9030 | 1548665195904266 | 483                     | NULL          |
| 192.168.0.101 | 9030 | 1548665255883715 | 824                     | NULL          |
| 192.168.0.102 | 9030 | 1548665255893942 | 656                     | NULL          |
| 192.168.0.101 | 9030 | 1548665495884125 | 615                     | NULL          |
| 192.168.0.102 | 9030 | 1548665495894254 | 441                     | NULL          |
| 192.168.0.103 | 9030 | 1548665495904479 | 638                     | NULL          |
| 192.168.0.101 | 9030 | 1548665512917846 | 487                     | NULL          |
| 192.168.0.102 | 9030 | 1548665512928071 | 994                     | NULL          |
| 192.168.0.103 | 9030 | 1548665512938268 | 613                     | NULL          |
+---------------+------+------------------+-------------------------+---------------+
20 rows in set (0.000 sec)
```
ハートビート監視:

```sql
ProxySQL > select * from mysql_server_ping_log;
+---------------+------+------------------+----------------------+------------+
| hostname      | port | time_start_us    | ping_success_time_us | ping_error |
+---------------+------+------------------+----------------------+------------+
| 192.168.0.101 | 9030 | 1548665195883407 | 98                   | NULL       |
| 192.168.0.102 | 9030 | 1548665195885128 | 119                  | NULL       |
...........
| 192.168.0.102 | 9030 | 1548665415889362 | 106                  | NULL       |
| 192.168.0.103 | 9030 | 1548665562898295 | 97                   | NULL       |
+---------------+------+------------------+----------------------+------------+
110 rows in set (0.001 sec)
```
## Client IP Passthrough

ほとんどの場合、プロキシサービスを通じてバックエンドのDorisサービスに接続する際、クライアントIP情報が失われ、DorisサーバーはプロキシサーバーのIPアドレス情報のみを取得できます。

バージョン2.1.1以降、Dorisは[Proxy Protocol](https://www.haproxy.org/download/1.8/doc/proxy-protocol.txt)プロトコルをサポートしています。このプロトコルを使用することで、クライアントIPパススルーを実装でき、ロードバランシングを経由した後でも、Dorisはクライアントの実際のIPを取得してホワイトリストやその他の権限制御を実装できます。

以下では、NginxとHaproxyでそれぞれProxy Protocolを有効にする方法を紹介します。

### DorisでProxy Protocolサポートを有効にする

FEの`fe.conf`に追加：

```text
enable_proxy_protocol = true
```
:::note

1. Proxy Protocol V1のみをサポートします。

2. MySQLプロトコルポートのみをサポートし、影響を与えます。HTTP、ADBC、その他のプロトコルポートはサポートせず、影響を与えません。

3. Doris 3.1バージョン以前では、有効にした後、Proxy Protocolプロトコルを使用して接続する必要があり、そうでなければ接続は失敗します。バージョン3.1以降では、Proxy Protocolを有効にした後でも、標準のMySQL接続プロトコルを使用して接続できます。

:::

### 01 Nginx

設定ファイルの`server`セクションに`proxy_protocol on;`を追加します：

```text
events {
worker_connections 1024;
}
stream {
  upstream mysqld {
      hash $remote_addr consistent;
      server 192.168.1.101:9030 weight=1 max_fails=2 fail_timeout=60s;
      server 192.168.1.102:9030 weight=1 max_fails=2 fail_timeout=60s;
      server 192.168.1.103:9030 weight=1 max_fails=2 fail_timeout=60s;
  }
  server {
   # Proxy port
      listen 6030;
      proxy_connect_timeout 300s;
      proxy_timeout 300s;
      proxy_pass mysqld;
      # Enable Proxy Protocol to the upstream server
      proxy_protocol on;
  }
}
```
### 02 HAProxy

`haproxy.cfg`の`backend`セクションに`send-proxy`パラメータを追加します：

```text
backend forward-fe
    mode tcp
    balance roundrobin
    server fe-1 192.168.1.101:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
    server fe-2 192.168.1.102:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
    server fe-3 192.168.1.103:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
```
### IP Passthrough成功の確認

プロキシ経由でDorisに接続：

```sql
mysql -uroot -P6030 -h192.168.1.100
```
検証

```sql
mysql> show processlist;
+------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
| CurrentConnected | Id   | User | Host              | LoginTime           | Catalog  | Db   | Command | Time | State | QueryId                           | Info             |
+------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
| Yes              |    1 | root | 192.168.1.101:34390 | 2024-03-17 16:32:22 | internal |      | Query   |    0 | OK    | 82edc460d93f4e28-8bbed058a068e259 | show processlist |
+------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
1 row in set (0.00 sec)
```
`Host`列に実際のクライアントIPが表示される場合、検証は成功です。そうでない場合は、プロキシサービスのIPアドレスのみが表示されます。

同時に、実際のクライアントIPはfe.audit.logにも記録されます。
