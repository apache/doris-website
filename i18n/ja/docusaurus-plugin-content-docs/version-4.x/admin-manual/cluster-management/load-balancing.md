---
{
    "title": "FE の負荷分散",
    "language": "ja",
    "description": "複数 FE 構成の Doris で利用できる JDBC、Nginx、HAProxy、ProxySQL による負荷分散と、Proxy Protocol によるクライアント IP の転送について説明します。",
    "keywords": [
        "Doris の負荷分散",
        "FE の高可用性",
        "MySQL プロトコルのプロキシ",
        "JDBC 負荷分散",
        "Nginx TCP リバースプロキシ",
        "HAProxy",
        "ProxySQL",
        "Proxy Protocol",
        "クライアント IP の転送",
        "query_port 9030",
        "Doris の複数 FE への接続",
        "MySQL の負荷分散"
    ]
}
---

<!-- Knowledge type: Architecture decision / Operational procedure -->
<!-- Applicable scenario: Multi-FE high availability access / Client IP forwarding -->

ユーザーは MySQL プロトコルを使用し、FE のクエリポート（`query_port`、デフォルトは `9030`）を通じて Doris に接続します。複数の FE ノードを配置する場合、FE の前段に負荷分散レイヤーを設けることで、Doris のクエリエントリーポイントの高可用性と接続の分散を実現できます。

このドキュメントでは、Doris で使用できる四つの負荷分散方法と、Proxy Protocol を使用してプロキシレイヤー経由で実際のクライアント IP を転送する方法を説明します。

## 適用場面

| 場面 | 推奨方法 | 説明 |
|------|----------|------|
| アプリケーションが JDBC を使用して Doris に直接接続し、専用プロキシを運用しない場合 | JDBC URL | クライアント側で負荷を分散し、追加のコンポーネントは不要 |
| 既存の Nginx 環境があり、TCP レイヤーのリバースプロキシが必要な場合 | Nginx | 汎用の TCP リバースプロキシで、設定が簡単 |
| ヘルスチェックを備えた高性能な TCP プロキシが必要な場合 | HAProxy | 多様なヘルスチェック方式を備えた専用の TCP/HTTP ロードバランサー |
| 接続管理や読み書きの分離など、MySQL プロトコルを理解するプロキシが必要な場合 | ProxySQL | MySQL プロトコル向けに設計されたデータベースプロキシ |
| ロードバランサーの背後でも実際のクライアント IP を保持する必要がある場合 | Proxy Protocol | Nginx または HAProxy と併用 |

## 前提条件

- FE ノードを 2 台以上配置し、各 FE プロセスが `query_port`（デフォルトは `9030`）で待ち受けていること。
- プロキシサーバーとすべての FE ノード間でネットワーク通信が可能であること。
- プロキシサービス用のポートが決まっていること（このドキュメントでは `6030` を例として使用します）。
- Proxy Protocol が必要な場合は、Proxy Protocol V1 に対応する Doris バージョン（バージョン 2.1.1 以降）を使用すること。

## クラスター構成例

このドキュメントでは、次の三台の FE ノードを例として使用します。

```text
192.168.1.101:9030
192.168.1.102:9030
192.168.1.103:9030
```

プロキシサーバーを実行するノードは次のとおりです。

```text
192.168.1.100
```

## 負荷分散の方法

### 方法 1: JDBC URL

<!-- Knowledge type: Configuration parameter -->
<!-- Applicable scenario: Application-side load balancing -->

JDBC URL に組み込まれた負荷分散機能を使用します。MySQL Connector/J がクライアント側で FE ノード間の接続分散とフェイルオーバーを行います。

```text
jdbc:mysql:loadbalance://192.168.1.101:9030,192.168.1.102:9030,192.168.1.103:9030/test_db
```

設定の詳細については、[MySQL の公式ドキュメント](https://dev.mysql.com/doc/connector-j/en/connector-j-usagenotes-j2ee-concepts-managing-load-balanced-connections.html)を参照してください。

### 方法 2: Nginx

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenario: General-purpose TCP reverse proxy -->

[Nginx](https://nginx.org/) の TCP リバースプロキシ機能（`stream` モジュール）を使用して Doris の負荷を分散します。

#### Nginx のインストール

[Nginx の公式インストールドキュメント](https://nginx.org/en/docs/install.html)を参照してインストールしてください。次の例では、Ubuntu で Nginx 1.18.0 をコンパイルしてインストールします。

1. ビルドに必要な依存パッケージをインストールします。

    ```shell
    sudo apt-get install build-essential
    sudo apt-get install libpcre3 libpcre3-dev
    sudo apt-get install zlib1g-dev
    sudo apt-get install openssl libssl-dev
    ```

2. Nginx をダウンロードしてコンパイルします。

    ```shell
    sudo wget http://nginx.org/download/nginx-1.18.0.tar.gz
    sudo tar zxvf nginx-1.18.0.tar.gz
    cd nginx-1.18.0
    sudo ./configure --prefix=/usr/local/nginx --with-stream --with-http_ssl_module --with-http_gzip_static_module --with-http_stub_status_module
    sudo make && make install
    ```

    :::tip

    コンパイル時に必ず `--with-stream` を指定してください。指定しないと、Nginx は TCP リバースプロキシをサポートしません。

    :::

#### リバースプロキシの設定

1. 新しい設定ファイルを作成します。

    ```shell
    vim /usr/local/nginx/conf/default.conf
    ```

2. 次の内容を記述します。

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

    主な設定項目は次のとおりです。

    | 項目 | 説明 |
    |--------|------|
    | `stream` | TCP リバースプロキシのコンテキスト。Nginx の stream モジュールが必要 |
    | `upstream mysqld` | バックエンド FE ノードのプール。`hash $remote_addr consistent` はクライアント IP に基づいて一貫性ハッシュを行う |
    | `weight` | ノードの重み。値が大きいほど多くの接続を受け取る |
    | `max_fails` / `fail_timeout` | ヘルスチェックのパラメーター。`fail_timeout` 内の失敗回数が `max_fails` を超えると、ノードは利用不可と判定される |
    | `listen 6030` | プロキシサービスの待ち受けポート |
    | `proxy_connect_timeout` / `proxy_timeout` | 接続とセッションのタイムアウト |

#### Nginx の起動

指定した設定ファイルで起動します。

```shell
cd /usr/local/nginx
/usr/local/nginx/sbin/nginx -c conf.d/default.conf
```

#### 動作確認

プロキシのポートを通じて接続します。

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

### 方法 3: HAProxy

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenario: High-performance TCP load balancing -->

[HAProxy](https://www.haproxy.org/) は C 言語で書かれた高性能な TCP/HTTP ロードバランサーです。

#### HAProxy のインストール

1. HAProxy をダウンロードします（ダウンロード先: <https://src.fedoraproject.org/repo/pkgs/haproxy/>）。

2. アーカイブを展開します。

    ```shell
    tar -zxvf haproxy-2.6.15.tar.gz -C /opt/
    mv haproxy-2.6.15 haproxy
    cd haproxy
    ```

3. コンパイルしてインストールします。

    ```shell
    yum install gcc gcc-c++ -y
    make TARGET=linux-glibc PREFIX=/usr/local/haproxy
    make install PREFIX=/usr/local/haproxy
    ```

#### HAProxy の設定

1. syslog のログ記録ルールを設定します。

    設定ファイルを開きます。

    ```shell
    vim /etc/rsyslog.d/haproxy.conf
    ```

    内容は次のとおりです。

    ```text
    $ModLoad imudp
    $UDPServerRun 514
    local0.* /usr/local/haproxy/logs/haproxy.log
    &~
    ```

2. リモートログ記録を有効にします。

    ```shell
    vim /etc/sysconfig/rsyslog
    ```

    次の内容を追加します。

    ```text
    SYSLOGD_OPTIONS="-c 2 -r -m 0"
    ```

    パラメーターの説明は次のとおりです。

    | パラメーター | 説明 |
    |------|------|
    | `-c 2` | 互換モードを使用する。デフォルトは `-c 5` |
    | `-r` | リモートログ記録を有効にする |
    | `-m 0` | タイムスタンプマークの間隔（分）。`0` はこの機能を無効にする |

    変更を適用します。

    ```shell
    systemctl restart rsyslog
    ```

3. 負荷分散の設定ファイルを編集します。

    ```shell
    vim /usr/local/haproxy/haproxy.cfg
    ```

    内容は次のとおりです。

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

    主な設定項目は次のとおりです。

    | 項目 | 説明 |
    |--------|------|
    | `frontend agent-front` | ポート `6030` で待ち受ける TCP モードのフロントエンドエントリーポイント |
    | `backend forward-fe` | ラウンドロビン（`roundrobin`）アルゴリズムを使用するバックエンド FE ノードのプール |
    | `check inter 3000 rise 2 fall 3` | `3000ms` ごとにヘルスチェックを実行する。`2` 回連続で成功すると稼働中、`3` 回連続で失敗すると停止中と判定する |

#### HAProxy の起動

1. サービスを起動します。

    ```shell
    /opt/haproxy/haproxy -f /usr/local/haproxy/haproxy.cfg
    ```

2. サービスの状態を確認します。

    ```shell
    netstat -lnatp | grep -i haproxy
    ```

#### 動作確認

```shell
mysql -h 192.168.1.100 -uroot -P6030 -p
```

### 方法 4: ProxySQL

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenario: MySQL protocol-aware proxy -->

[ProxySQL](https://proxysql.com/) は C 言語で書かれたオープンソースの MySQL データベースプロキシです。接続管理、読み書きの分離、負荷分散、フェイルオーバーを提供し、高い性能、設定の柔軟性、動的な管理機能を備えています。Web サービス、ビッグデータプラットフォーム、クラウドデータベースなどで一般的に使用されます。

#### ProxySQL のインストール

[ProxySQL の公式ドキュメント](https://proxysql.com/documentation/installing-proxysql/)を参照してインストールしてください。

#### ProxySQL の設定

ProxySQL には、設定ファイル `/etc/proxysql.cnf` と設定データベースファイル `/var/lib/proxysql/proxysql.db` が付属しています。

:::caution

`proxysql.db` が `/var/lib/proxysql` に存在する場合、ProxySQL サービスが `proxysql.cnf` を読み込んで解析するのは初回起動時だけです。それ以降の起動時には読み込みません。

`proxysql.cnf` の変更を再起動後に反映するには、先に `/var/lib/proxysql/proxysql.db` を削除してからサービスを再起動する必要があります。これは初期化を伴う起動と同じで、新しい `proxysql.db` が生成され、元の設定ルールは消去されます。

:::

`proxysql.cnf` の主な内容を以下に示します。

```text
datadir="/var/lib/proxysql"         # Data directory
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

#### ProxySQL の管理データベースへの接続

管理ポート（`6032`）を通じて ProxySQL に接続します。

```shell
mysql -uadmin -padmin -P6032 -hdoris01
```

組み込みのデータベースとテーブルを確認します。

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

#### バックエンドの Doris FE の設定

`INSERT` 文を使用して、プロキシ対象の FE ノードとポートを `mysql_servers` テーブルに追加します。

:::note

`hostgroup_id` の `10` は書き込みグループ、`20` は読み取りグループを表します。ここでは読み書きの分離は不要なので、値は任意に設定できます。

:::

1. 管理ポートに接続します。

    ```shell
    mysql -uadmin -padmin -P6032 -h127.0.0.1
    ```

2. FE ノードを追加します。

    ```sql
    ProxySQL > insert into mysql_servers(hostgroup_id,hostname,port) values(10,'192.168.0.101',9030);
    Query OK, 1 row affected (0.000 sec)

    ProxySQL > insert into mysql_servers(hostgroup_id,hostname,port) values(10,'192.168.0.102',9030);
    Query OK, 1 row affected (0.000 sec)

    ProxySQL > insert into mysql_servers(hostgroup_id,hostname,port) values(10,'192.168.0.103',9030);
    Query OK, 1 row affected (0.000 sec)
    ```

3. 追加した行を確認します。

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

4. 追加時に一意制約エラーが発生した場合は、次のように表示されます。

    ```text
    ERROR 1045 (#2800): UNIQUE constraint failed: mysql_servers.hostgroup_id, mysql_servers.hostname, mysql_servers.port
    ```

    同じ設定がすでに定義されています。テーブルを空にするか、そのホストの既存のエントリを削除できます。

    ```sql
    ProxySQL > select * from mysql_servers;
    ProxySQL > delete from mysql_servers;
    Query OK, 6 rows affected (0.000 sec)
    ```

5. 設定を実行時環境とディスクに保存します。

    ```sql
    ProxySQL > load mysql servers to runtime;
    Query OK, 0 rows affected (0.006 sec)

    ProxySQL > save mysql servers to disk;
    Query OK, 0 rows affected (0.348 sec)
    ```

#### Doris FE ノードの監視設定

Doris FE ノードを追加した後は、これらのバックエンドノードの監視も設定する必要があります。

1. Doris に監視用ユーザーを作成します。

    ```shell
    mysql -uroot -P9030 -h192.168.0.101
    ```

    ```sql
    Doris > create user monitor@'192.168.0.100' identified by 'P@ssword1!';
    Query OK, 0 rows affected (0.03 sec)

    Doris > grant ADMIN_PRIV on *.* to monitor@'192.168.0.100';
    Query OK, 0 rows affected (0.02 sec)
    ```

2. ProxySQL のプロキシノードに戻り、監視を設定します。

    ```shell
    mysql -uadmin -padmin -P6032 -h127.0.0.1
    ```

    ```sql
    ProxySQL > set mysql-monitor_username='monitor';
    Query OK, 1 row affected (0.000 sec)

    ProxySQL > set mysql-monitor_password='P@ssword1!';
    Query OK, 1 row affected (0.000 sec)
    ```

3. 設定を保存します。

    ```sql
    ProxySQL > load mysql servers to runtime;
    Query OK, 0 rows affected (0.006 sec)

    ProxySQL > save mysql servers to disk;
    Query OK, 0 rows affected (0.348 sec)
    ```

#### 監視結果の確認

ProxySQL の監視メトリクスは `monitor` データベースに保存されます。

接続監視ログを確認します。

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

ハートビート監視ログを確認します。

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

## クライアント IP の転送（Proxy Protocol）

<!-- Knowledge type: Configuration parameter / Operational procedure -->
<!-- Applicable scenario: Allow lists / Audit / Access control -->

通常、クライアントがプロキシサービス経由でバックエンドの Doris に接続すると、クライアントの IP 情報が失われ、Doris サーバーはプロキシサーバーの IP アドレスしか取得できません。

Doris はバージョン 2.1.1 以降、[Proxy Protocol](https://www.haproxy.org/download/1.8/doc/proxy-protocol.txt) をサポートしています。このプロトコルにより、負荷分散を経由した後でも Doris は実際のクライアント IP を取得でき、許可リストや監査など、クライアント IP に基づくアクセス制御が可能になります。

以下では、Doris、Nginx、HAProxy で Proxy Protocol を有効にする方法を説明します。

### Doris で Proxy Protocol を有効にする

FE の `fe.conf` に次の設定を追加します。

```text
enable_proxy_protocol = true
```

:::note

1. Proxy Protocol V1 のみをサポートします。
2. この機能が適用されるのは MySQL プロトコルのポートだけです。HTTP や ADBC など、ほかのプロトコルのポートには対応せず、影響も与えません。
3. Doris 3.1 より前では、この機能を有効にするとすべての接続で Proxy Protocol を使用する必要があり、使用しない接続は失敗します。バージョン 3.1 以降では、Proxy Protocol を有効にした後も標準の MySQL 接続プロトコルを使用できます。

:::

### Nginx で Proxy Protocol を有効にする

`proxy_protocol on;` を設定ファイルの `server` セクションに追加します。

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

### HAProxy で Proxy Protocol を有効にする

`backend` セクション（`haproxy.cfg` 内）で、`send-proxy` パラメーターを各 `server` 行に追加します。

```text
backend forward-fe
    mode tcp
    balance roundrobin
    server fe-1 192.168.1.101:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
    server fe-2 192.168.1.102:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
    server fe-3 192.168.1.103:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
```

### IP 転送の確認

1. プロキシ経由で Doris に接続します。

    ```sql
    mysql -uroot -P6030 -h192.168.1.100
    ```

2. `show processlist` を実行し、`Host` 列を確認します。

    ```sql
    mysql> show processlist;
    +------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
    | CurrentConnected | Id   | User | Host              | LoginTime           | Catalog  | Db   | Command | Time | State | QueryId                           | Info             |
    +------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
    | Yes              |    1 | root | 192.168.1.101:34390 | 2024-03-17 16:32:22 | internal |      | Query   |    0 | OK    | 82edc460d93f4e28-8bbed058a068e259 | show processlist |
    +------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
    1 row in set (0.00 sec)
    ```

3. `Host` 列に実際のクライアント IP が表示されれば、転送は成功しています。表示されない場合は、プロキシサービスの IP だけが見えます。

    実際のクライアント IP は `fe.audit.log` にも記録されます。

## よくある質問（FAQ）

### Q: プロキシのポートへの接続時に `Connection refused` と表示される場合は？

プロキシサービスが起動していないか、待ち受けポートが設定と一致していません。プロキシプロセスが動作していることを確認し、`netstat -lnatp` で待ち受けポートを確認してください。

### Q: 接続は成功するものの、ときどきタイムアウトする場合は？

バックエンド FE ノードに異常があるか、プロキシのタイムアウトが短すぎる可能性があります。`proxy_timeout` / `timeout server` の設定を確認し、ヘルスチェックログでバックエンドノードの状態を確認してください。

### Q: Nginx の起動時に `unknown directive "stream"` と表示される場合は？

コンパイル時に stream モジュールが有効になっていません。`--with-stream` オプションを指定して Nginx を再コンパイルしてください。

### Q: 再起動後も ProxySQL の `proxysql.cnf` の変更が反映されない場合は？

`proxysql.db` がすでに存在しており、設定ファイルは初回起動時にしか読み込まれません。`/var/lib/proxysql/proxysql.db` を削除してからサービスを再起動してください。

### Q: ProxySQL の `mysql_servers` に追加すると `UNIQUE constraint failed` と表示される場合は？

同じ `hostgroup_id` + `hostname` + `port` のレコードがテーブルにすでに存在します。テーブルを空にするか、既存のレコードを削除してから追加してください。

### Q: Proxy Protocol を有効にするとクライアントが接続できなくなる場合は（バージョン 3.1 より前）？

この Doris バージョンではすべての接続に Proxy Protocol が必要で、標準の MySQL クライアントはそのままでは接続できません。バージョン 3.1 以降にアップグレードするか、必ず Proxy Protocol 対応のプロキシ経由で接続してください。

### Q: `show processlist` にプロキシの IP が表示され続ける場合は？

Doris で `enable_proxy_protocol` が有効になっていないか、プロキシ側で `proxy_protocol on` / `send-proxy` が設定されていません。FE の設定と、プロキシ側の Proxy Protocol の設定を確認してください。
