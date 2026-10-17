---
{
    "title": "FE のロードバランシング",
    "language": "ja",
    "description": "複数の FE を配置した Doris 環境でのロードバランシング方法。JDBC、Nginx、HAProxy、ProxySQL、NJet、および Proxy Protocol によるクライアント IP の転送を説明します。",
    "keywords": [
        "Doris ロードバランシング",
        "FE 高可用性",
        "MySQL プロトコルプロキシ",
        "JDBC loadbalance",
        "Nginx TCP リバースプロキシ",
        "HAProxy",
        "ProxySQL",
        "NJet",
        "Proxy Protocol",
        "クライアント IP 転送",
        "query_port 9030",
        "Doris 複数 FE アクセス",
        "MySQL ロードバランシング"
    ]
}
---

<!-- Knowledge type: Architecture decision / Operational procedure -->
<!-- Applicable scenario: Multi-FE high availability access / Client IP forwarding -->

ユーザーは MySQL プロトコルを使用し、FE のクエリポート（`query_port`、デフォルトは `9030`）経由で Doris に接続します。複数の FE ノードを配置している場合は、FE の前段にロードバランシング層を設けることで、Doris のクエリへの接続口に高可用性を持たせ、接続を分散できます。

このドキュメントでは、Doris で利用できる五つのロードバランシング方法と、Proxy Protocol を使ってプロキシ層越しに実際のクライアント IP を転送する方法を説明します。

## 適用シナリオ {#applicable-scenarios}

| シナリオ | 推奨する方法 | 説明 |
|------|----------|------|
| アプリケーションが JDBC で Doris に直接接続し、専用プロキシを運用しない | JDBC URL | クライアント側でロードバランシングを行い、追加のコンポーネントは不要 |
| 既存の Nginx 環境があり、TCP 層のリバースプロキシが必要 | Nginx | 汎用の TCP リバースプロキシで、設定が簡単 |
| ヘルスチェックを備えた高性能な TCP プロキシが必要 | HAProxy | 多様なヘルスチェック方式を備えた専用の TCP/HTTP ロードバランサー |
| 接続管理や読み書きの分離など、MySQL プロトコルを認識するプロキシが必要 | ProxySQL | MySQL プロトコル向けに設計されたデータベースプロキシ |
| FE の動的な追加・削除と、SQL を使った能動的なヘルスチェックが必要 | NJet | 管理 API をオプションで利用できる TCP プロキシ |
| ロードバランサーの背後でも実際のクライアント IP を保持する必要がある | Proxy Protocol | Nginx または HAProxy と併用 |

## 前提条件 {#prerequisites}

- FE ノードが少なくとも 2 台配置され、各 FE プロセスが `query_port`（デフォルトは `9030`）で待ち受けていること。
- プロキシサーバーからすべての FE ノードへネットワーク接続できること。
- プロキシサービス用のポートを決めてあること（このドキュメントでは `6030` を例として使用）。
- Proxy Protocol が必要な場合、Doris のバージョンが Proxy Protocol V1 に対応していること（バージョン 2.1.1 以降で利用可能）。

## クラスター構成の例 {#example-cluster-topology}

このドキュメントでは、以下の三つの FE ノードを例に使用します。

```text
192.168.1.101:9030
192.168.1.102:9030
192.168.1.103:9030
```

プロキシサーバーを稼働させるノードは次のとおりです。

```text
192.168.1.100
```

## ロードバランシングの方法 {#load-balancing-options}

### オプション 1: JDBC URL {#option-1-jdbc-url}

<!-- Knowledge type: Configuration parameter -->
<!-- Applicable scenario: Application-side load balancing -->

JDBC URL に組み込まれているロードバランシング機能を使用します。MySQL Connector/J が、クライアント側で FE ノードへの接続分散とフェイルオーバーを行います。

```text
jdbc:mysql:loadbalance://192.168.1.101:9030,192.168.1.102:9030,192.168.1.103:9030/test_db
```

詳細な設定については、[MySQL の公式ドキュメント](https://dev.mysql.com/doc/connector-j/en/connector-j-usagenotes-j2ee-concepts-managing-load-balanced-connections.html)を参照してください。

### オプション 2: Nginx {#option-2-nginx}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenario: General-purpose TCP reverse proxy -->

[Nginx](https://nginx.org/) の TCP リバースプロキシ機能（`stream` モジュール）を使用して、Doris への接続を分散します。

#### Nginx のインストール {#install-nginx}

インストール方法については、[Nginx の公式インストールドキュメント](https://nginx.org/en/docs/install.html)を参照してください。次の例では、Ubuntu 上で Nginx 1.18.0 をコンパイルしてインストールします。

1. ビルドに必要なパッケージをインストールします。

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

    コンパイル時に必ず `--with-stream` を指定してください。指定しない場合、Nginx は TCP リバースプロキシに対応しません。

    :::

#### リバースプロキシの設定 {#configure-the-reverse-proxy}

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
    | `upstream mysqld` | バックエンドの FE ノード群。`hash $remote_addr consistent` はクライアント IP に基づいてコンシステントハッシュを行う |
    | `weight` | ノードの重み。値が大きいほど多くの接続を受け取る |
    | `max_fails` / `fail_timeout` | ヘルスチェックのパラメータ。`fail_timeout` の期間内の失敗回数が `max_fails` を超えると、そのノードを利用不可と判定する |
    | `listen 6030` | プロキシサービスの待ち受けポート |
    | `proxy_connect_timeout` / `proxy_timeout` | 接続とセッションのタイムアウト |

#### Nginx の起動 {#start-nginx}

指定した設定ファイルで起動します。

```shell
cd /usr/local/nginx
/usr/local/nginx/sbin/nginx -c conf.d/default.conf
```

#### 動作確認 {#verify}

プロキシポート経由で接続します。

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

### オプション 3: HAProxy {#option-3-haproxy}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenario: High-performance TCP load balancing -->

[HAProxy](https://www.haproxy.org/) は、C で記述された高性能な TCP/HTTP ロードバランサーです。

#### HAProxy のインストール {#install-haproxy}

1. HAProxy をダウンロードします（ダウンロード先: <https://src.fedoraproject.org/repo/pkgs/haproxy/>）。

2. 展開します。

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

#### HAProxy の設定 {#configure-haproxy}

1. syslog のログ出力ルールを設定します。

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

2. リモートログ出力を有効にします。

    ```shell
    vim /etc/sysconfig/rsyslog
    ```

    次の内容を追加します。

    ```text
    SYSLOGD_OPTIONS="-c 2 -r -m 0"
    ```

    パラメータの説明は次のとおりです。

    | パラメータ | 説明 |
    |------|------|
    | `-c 2` | 互換モードを使用する。デフォルトは `-c 5` |
    | `-r` | リモートログ出力を有効にする |
    | `-m 0` | タイムスタンプのマーク間隔（分）。`0` はこの機能を無効にする |

    変更を適用します。

    ```shell
    systemctl restart rsyslog
    ```

3. ロードバランシングの設定ファイルを編集します。

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
    | `frontend agent-front` | TCP モードを使用し、ポート `6030` にバインドするフロントエンドの接続口 |
    | `backend forward-fe` | ラウンドロビン（`roundrobin`）アルゴリズムを使用するバックエンドの FE ノード群 |
    | `check inter 3000 rise 2 fall 3` | `3000ms` ごとにヘルスチェックを実行する。連続 `2` 回成功するとノードを稼働状態、連続 `3` 回失敗すると停止状態と判定する |

#### HAProxy の起動 {#start-haproxy}

1. サービスを起動します。

    ```shell
    /opt/haproxy/haproxy -f /usr/local/haproxy/haproxy.cfg
    ```

2. サービスの状態を確認します。

    ```shell
    netstat -lnatp | grep -i haproxy
    ```

#### 動作確認 {#verify-1}

```shell
mysql -h 192.168.1.100 -uroot -P6030 -p
```

### オプション 4: ProxySQL {#option-4-proxysql}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenario: MySQL protocol-aware proxy -->

[ProxySQL](https://proxysql.com/) は、C で記述されたオープンソースの MySQL データベースプロキシです。接続管理、読み書きの分離、ロードバランシング、フェイルオーバーの機能を備え、高性能で柔軟な設定と動的な管理が可能です。Web サービス、ビッグデータプラットフォーム、クラウドデータベースなどで広く利用されています。

#### ProxySQL のインストール {#install-proxysql}

インストール方法については、[ProxySQL の公式ドキュメント](https://proxysql.com/documentation/installing-proxysql/)を参照してください。

#### ProxySQL の設定 {#configure-proxysql}

ProxySQL には、設定ファイル `/etc/proxysql.cnf` と設定データベースファイル `/var/lib/proxysql/proxysql.db` が付属しています。

:::caution

`proxysql.db` が `/var/lib/proxysql` に存在する場合、ProxySQL サービスが `proxysql.cnf` を読み込んで解析するのは初回起動時だけです。以降の起動では読み込みません。

再起動後に `proxysql.cnf` の変更を反映するには、先に `/var/lib/proxysql/proxysql.db` を削除してからサービスを再起動する必要があります。これは初期化を伴う起動と同じで、新しい `proxysql.db` が生成され、元の設定ルールは消去されます。

:::

`proxysql.cnf` の主な内容は次のとおりです。

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

#### ProxySQL の管理データベースへの接続 {#connect-to-the-proxysql-admin-database}

管理ポート（`6032`）経由で ProxySQL に接続します。

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

#### バックエンドの Doris FE の設定 {#configure-the-backend-doris-fe}

`INSERT` 文を使用して、プロキシ対象の FE ノードとポートを `mysql_servers` テーブルに追加します。

:::note

`hostgroup_id` に `10` を設定すると書き込みグループ、`20` を設定すると読み取りグループを表します。ここでは読み書きの分離は不要なので、任意の値を設定できます。

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

    同じ設定がすでに存在します。テーブルを空にするか、そのホストの既存のエントリを削除できます。

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

#### Doris FE ノードの監視設定 {#configure-monitoring-for-doris-fe-nodes}

Doris FE ノードを追加したら、これらのバックエンドノードの監視も設定します。

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

#### 監視結果の確認 {#verify-monitoring-results}

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

ハートビートの監視ログを確認します。

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

### オプション 5: NJet {#option-5-njet}

[OpenNJet](https://github.com/OpenNJet/OpenNJet) は、TCP プロキシ、動的なアップストリーム管理、およびオプションの能動的な MySQL ヘルスチェックを提供します。以下の例では、前のセクションと同じプロキシおよび FE のアドレスを使用します。

プロキシが分散するのは**接続**です。確立した MySQL セッションは一つの FE に留まり、SQL 文ごとの分散や中断したクエリの再実行は行いません。これらの設定は FE の MySQL ポートを対象とします。Stream Load は HTTP エンドポイントを使用し、BE にリダイレクトされることがあります。クライアントは、リダイレクト先として返されたアドレスに到達できる必要があります。

#### NJet と設定ファイルの準備 {#prepare-njet-and-the-configuration-files}

この例では、公式イメージ `tmlake/njet:4.0.2.0` と、そのインストール先プレフィックス `/usr/local/njet` を使用します。このイメージは Linux/AMD64 用です。ARM ホストでは、対応するイメージを使用するか、エミュレーションを設定してください。ネイティブインストールについては、[OpenNJet クイックスタート](https://njet.org.cn/docs/quickstart/)を参照し、モジュールと設定ファイルのパスをインストール環境に合わせて調整してください。

以下の二つのファイルを同じディレクトリに保存します。FE のアドレスには、コンテナから到達できる必要があります。

**`njet.conf`（データプレーン）:**

```text
worker_processes 1;
cluster_name njet;
node_name node1;

helper ctrl modules/njt_helper_ctrl_module.so conf/njet_ctrl.conf;
helper broker modules/njt_helper_broker_module.so;
load_module modules/njt_http_upstream_member_module.so;

events {
    worker_connections 1024;
}
stream {
    upstream mysqld {
        zone mysqld 128k;
        hash $remote_addr consistent;
        server 192.168.1.101:9030 weight=1 max_fails=2 fail_timeout=60s;
        server 192.168.1.102:9030 weight=1 max_fails=2 fail_timeout=60s;
        server 192.168.1.103:9030 weight=1 max_fails=2 fail_timeout=60s;
    }
    server {
        listen 6030;
        proxy_connect_timeout 5s;
        proxy_timeout 300s;
        proxy_pass mysqld;
    }
}
http {
    dyn_kv_conf conf/iot-work.conf;
}
```

`http` ブロックは、Doris へのトラフィックを `stream` で転送する場合でも、管理 API が使用するデータプレーンのモジュールを初期化します。この例でヘルパーが使用するのは `conf/njet_ctrl.conf` であり、別の `conf/ctrl.conf` や `conf/mqtt.conf` は使用しません。

**`njet_ctrl.conf`（コントロールプレーン）:**

```text
load_module modules/njt_http_sendmsg_module.so;
load_module modules/njt_http_upstream_api_module.so;
load_module modules/njt_helper_health_check_module.so;
load_module modules/njt_health_check_mysql_module.so;

events {
    worker_connections 1024;
}
http {
    server {
        listen 127.0.0.1:8081;
        location /api {
            dyn_module_api;
        }
    }
}
```

MySQL ヘルスチェックモジュールは明示的に読み込む必要があります。管理 API はコンテナ内のループバックアドレスで待ち受けます。以下の例では `docker exec` でアクセスします。

#### 起動と動作確認 {#start-and-verify}

両方の設定ファイルがあるディレクトリで次を実行します。

```shell
docker run -d --name doris-njet \
  --platform linux/amd64 \
  --cap-add=NET_ADMIN --cap-add=DAC_READ_SEARCH \
  -p 6030:6030 \
  -v "$PWD/njet.conf:/usr/local/njet/conf/njet.conf:ro" \
  -v "$PWD/njet_ctrl.conf:/usr/local/njet/conf/njet_ctrl.conf:ro" \
  tmlake/njet:4.0.2.0
```

両方のファイルを検証し、バックエンドの一覧を確認します。

```shell
docker exec doris-njet njet -t
docker exec doris-njet curl --max-time 10 -sS \
  http://127.0.0.1:8081/api/v1/upstream_api/stream/upstreams/mysqld/servers/
```

`njet -t` は両方の設定ファイルについて検証成功を報告します。API は HTTP 200 と、設定された三つの FE を含む JSON 配列を返します。`doris_user` を既存の Doris アカウントに置き換えて、プロキシ経由で接続します。

```shell
mysql -h192.168.1.100 -P6030 -u doris_user -p -e 'SELECT 1 AS connection_test;'
```

```text
+-----------------+
| connection_test |
+-----------------+
|               1 |
+-----------------+
```

主な設定は次のとおりです。

| 設定 | 例 | 効果 |
| --- | --- | --- |
| `zone` | `mysqld 128k` | 動的なアップストリーム管理に必要な共有状態。 |
| `hash` | `$remote_addr consistent` | クライアント IP のコンシステントハッシュを使用して新規接続の接続先を決める。同じ送信元 IP を共有するクライアントは、同じ FE に接続される場合がある。 |
| `max_fails` / `fail_timeout` | `2` / `60s` | バックエンド接続の失敗を受動的に検出する。この設定では能動的な SQL チェックは行わない。 |
| `listen` | `6030` | プロキシの MySQL プロトコル用ポート。Docker は `-p 6030:6030` で公開する。 |
| `proxy_connect_timeout` / `proxy_timeout` | `5s` / `300s` | バックエンドへの接続タイムアウトとプロキシの非アクティブ時のタイムアウト。クエリやセッションの要件に合わせて調整する。 |

#### FE の動的な追加と削除 {#dynamically-add-and-remove-an-fe}

FE を追加するには、次のリクエストを送信します。

```shell
docker exec doris-njet curl --max-time 10 -i \
  -H 'Content-Type: application/json' \
  -d '{"server":"192.168.1.104:9030","weight":2,"max_fails":1,"fail_timeout":"5s"}' \
  http://127.0.0.1:8081/api/v1/upstream_api/stream/upstreams/mysqld/servers/
```

API は HTTP 201 と、割り当てられた `id` を含む新しいメンバーを返します。当初の三つのメンバーからなる構成では、最初に追加するメンバーの ID は 3 です。削除時には、実際に返された ID を使用します。

```shell
docker exec doris-njet curl --max-time 10 -i -X DELETE \
  http://127.0.0.1:8081/api/v1/upstream_api/stream/upstreams/mysqld/servers/3
```

削除すると HTTP 200 が返され、その後の GET ではそのメンバーが一覧に表示されなくなります。コンテナを再作成する前に、設定ファイルの内容を意図したメンバー構成と一致させてください。

#### 能動的な MySQL ヘルスチェックの設定 {#configure-active-mysql-health-checks}

能動的な SQL チェックには、明示的な API 設定と、使用可能な Doris アカウントおよびデータベースが必要です。パスワードを置き換え、Doris 管理者として次を実行します。

```sql
CREATE DATABASE IF NOT EXISTS health_check_db;
CREATE USER IF NOT EXISTS 'njet_health'@'%' IDENTIFIED BY '<replace-with-password>';
GRANT SELECT_PRIV ON health_check_db.* TO 'njet_health'@'%';
```

以下のリクエストでも同じパスワードを使用します。TLS を使用しない FE の待ち受けポートでは `useSsl` を `false` にします。FE の待ち受けポートで TLS が設定されている場合にのみ `true` にしてください。

```shell
docker exec doris-njet curl --max-time 10 -i \
  -H 'Content-Type: application/json' \
  -d '{
    "interval":"5s",
    "jitter":"1s",
    "timeout":"5s",
    "passes":1,
    "fails":1,
    "sql":{
      "select":"select 1",
      "useSsl":false,
      "user":"njet_health",
      "password":"<replace-with-password>",
      "db":"health_check_db"
    }
  }' \
  http://127.0.0.1:8081/api/v1/hc/smysql/mysqld
```

設定に成功すると、HTTP 200 と `{"code":0,"msg":"success"}` が返されます。その後のチェックでは、各 FE に対して認証を行い、設定したデータベースを選択して `select 1` を実行します。

| フィールド | 必須条件 / デフォルト | 説明 |
| --- | --- | --- |
| `interval`, `jitter`, `timeout` | この例では明示的に設定 | チェック間隔、タイマーのジッター、タイムアウト。期間として指定する。 |
| `passes`, `fails` | この例では明示的に設定 | ヘルス状態を変更するために必要な連続成功回数と連続失敗回数。 |
| `port` | 省略可能。デフォルトはアップストリームサーバーのポート | チェックに使用するポートを上書きする。 |
| `sql.select` | 明示的に設定 | FE の検証に使用する SQL 文。 |
| `sql.useSsl` | 省略可能。NJet のデフォルトは `true` | FE の待ち受けポートの TLS 設定と一致させる必要がある。 |
| `sql.user`, `sql.password` | Doris アカウント用に設定 | ヘルスチェッカーが使用する認証情報。 |
| `sql.db` | 必須。空文字列は不可 | ヘルスチェッカーが選択する既存のデータベース。 |

API がタイムアウトする場合は、ヘルパーのパスとデータプレーンの `http` ブロックを確認してください。ヘルスチェックが失敗する場合は、データベース、認証情報、ネットワーク接続、TLS 設定を確認してください。設定リクエストが成功しただけでは、FE が正常であることは確認できません。詳細については、[OpenNJet のソースコードとドキュメント](https://github.com/OpenNJet/OpenNJet)および[JSON 設定形式](https://njet.org.cn/cases/njet_support_json/)を参照してください。

## クライアント IP の転送（Proxy Protocol） {#client-ip-forwarding-proxy-protocol}

<!-- Knowledge type: Configuration parameter / Operational procedure -->
<!-- Applicable scenario: Allow lists / Audit / Access control -->

多くの場合、クライアントがプロキシサービス経由でバックエンドの Doris に接続すると、クライアント IP の情報が失われ、Doris サーバーからはプロキシサーバーの IP アドレスしか取得できません。

Doris はバージョン 2.1.1 以降、[Proxy Protocol](https://www.haproxy.org/download/1.8/doc/proxy-protocol.txt) に対応しています。このプロトコルを使うと、ロードバランシングを行った後でも Doris が実際のクライアント IP を取得できるため、許可リストや監査など、クライアント IP に基づくアクセス制御が可能になります。

以下のセクションでは、Doris、Nginx、HAProxy で Proxy Protocol を有効にする方法を説明します。

### Doris で Proxy Protocol を有効にする {#enable-proxy-protocol-in-doris}

FE の `fe.conf` に次の設定を追加します。

```text
enable_proxy_protocol = true
```

:::note

1. 対応しているのは Proxy Protocol V1 のみです。
2. この機能が適用されるのは MySQL プロトコルのポートのみです。HTTP や ADBC など、ほかのプロトコルのポートには対応せず、影響も与えません。
3. Doris 3.1 より前のバージョンでは、有効にするとすべての接続で Proxy Protocol を使用する必要があり、使用しない接続は失敗します。バージョン 3.1 以降は、Proxy Protocol を有効にしても標準の MySQL 接続プロトコルを使用できます。

:::

### Nginx で Proxy Protocol を有効にする {#enable-proxy-protocol-in-nginx}

設定ファイルの `server` セクションに `proxy_protocol on;` を追加します。

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

### HAProxy で Proxy Protocol を有効にする {#enable-proxy-protocol-in-haproxy}

`haproxy.cfg` の `backend` セクションで、各 `server` 行に `send-proxy` パラメータを追加します。

```text
backend forward-fe
    mode tcp
    balance roundrobin
    server fe-1 192.168.1.101:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
    server fe-2 192.168.1.102:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
    server fe-3 192.168.1.103:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
```

### IP 転送の確認 {#verify-ip-forwarding}

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

3. `Host` 列に実際のクライアント IP が表示されていれば、確認は成功です。そうでなければ、プロキシサービスの IP しか見えていません。

    実際のクライアント IP は `fe.audit.log` にも記録されます。

## よくある質問 {#faq}

### Q: プロキシポート経由で接続すると `Connection refused` と表示されるのはなぜですか？ {#q-connecting-through-the-proxy-port-reports-connection-refused}

プロキシサービスが起動していないか、待ち受けポートが設定と一致していません。プロキシプロセスが稼働していることを確認し、`netstat -lnatp` を使って待ち受けポートを確認してください。

### Q: 接続は成功するものの、ときどきタイムアウトするのはなぜですか？ {#q-connections-succeed-but-occasionally-time-out}

バックエンドの FE ノードに問題があるか、プロキシのタイムアウトが短すぎます。`proxy_timeout` / `timeout server` の設定を確認し、ヘルスチェックログでバックエンドノードの状態を確認してください。

### Q: Nginx が `unknown directive "stream"` というエラーで起動しないのはなぜですか？ {#q-nginx-fails-to-start-with-unknown-directive-stream}

コンパイル時に stream モジュールが有効になっていません。`--with-stream` オプションを指定して Nginx を再コンパイルしてください。

### Q: ProxySQL の `proxysql.cnf` を変更して再起動しても反映されないのはなぜですか？ {#q-proxysql-changes-to-proxysqlcnf-do-not-take-effect-after-restart}

`proxysql.db` がすでに存在し、設定ファイルは初回起動時にしか読み込まれません。`/var/lib/proxysql/proxysql.db` を削除してから、サービスを再起動してください。

### Q: ProxySQL の `mysql_servers` への追加時に `UNIQUE constraint failed` と表示されるのはなぜですか？ {#q-inserting-into-mysql_servers-in-proxysql-reports-unique-constraint-failed}

同じ `hostgroup_id` + `hostname` + `port` を持つレコードがテーブルにすでに存在します。テーブルを空にするか、既存のレコードを削除してから追加してください。

### Q: Proxy Protocol を有効にした後、クライアントが接続できないのはなぜですか（3.1 より前のバージョン）？ {#q-clients-fail-to-connect-after-enabling-proxy-protocol-versions-before-31}

この Doris バージョンでは、すべての接続で Proxy Protocol を使用する必要があり、標準の MySQL クライアントは対応していません。バージョン 3.1 以降にアップグレードするか、常に Proxy Protocol に対応したプロキシ経由で接続してください。

### Q: `show processlist` に引き続きプロキシの IP が表示されるのはなぜですか？ {#q-show-processlist-still-shows-the-proxy-ip}

Doris で `enable_proxy_protocol` が有効になっていないか、プロキシ側に `proxy_protocol on` / `send-proxy` が設定されていません。FE の設定と、プロキシ側の Proxy Protocol の有効化設定を確認してください。
