---
{
    "title": "FE 부하 분산",
    "language": "ko",
    "description": "다중 FE Doris 배포를 위한 부하 분산 옵션: JDBC, Nginx, HAProxy, ProxySQL, NJet 및 Proxy Protocol을 통한 클라이언트 IP 전달.",
    "keywords": [
        "Doris load balancing",
        "FE high availability",
        "MySQL protocol proxy",
        "JDBC loadbalance",
        "Nginx TCP reverse proxy",
        "HAProxy",
        "ProxySQL",
        "NJet",
        "Proxy Protocol",
        "client IP forwarding",
        "query_port 9030",
        "Doris multi-FE access",
        "MySQL load balancing"
    ]
}
---

<!-- Knowledge type: Architecture decision / Operational procedure -->
<!-- Applicable scenario: Multi-FE high availability access / Client IP forwarding -->

사용자는 FE 쿼리 포트(`query_port`, 기본값 `9030`)를 통해 MySQL 프로토콜로 Doris에 연결합니다. FE 노드를 여러 개 배포한 경우, FE 앞에 부하 분산 계층을 배치하여 Doris 쿼리 진입점의 고가용성을 확보하고 연결을 분산할 수 있습니다.

이 문서에서는 Doris에 사용할 수 있는 다섯 가지 부하 분산 옵션과 Proxy Protocol을 사용하여 프록시 계층을 통해 실제 클라이언트 IP를 전달하는 방법을 설명합니다.

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 권장 옵션 | 설명 |
|------|----------|------|
| 애플리케이션이 JDBC를 통해 Doris에 직접 연결하며, 별도의 프록시를 운영하지 않는 경우 | JDBC URL | 클라이언트 측 부하 분산으로, 추가 구성 요소가 필요하지 않음 |
| 기존 Nginx 인프라가 있으며, TCP 계층 리버스 프록시가 필요한 경우 | Nginx | 구성이 간단한 범용 TCP 리버스 프록시 |
| 상태 확인 기능을 갖춘 고성능 TCP 프록시가 필요한 경우 | HAProxy | 다양한 상태 확인 전략을 제공하는 전용 TCP/HTTP 로드 밸런서 |
| MySQL 프로토콜을 인식하는 프록시가 필요한 경우(연결 관리, 읽기/쓰기 분리 등) | ProxySQL | MySQL 프로토콜용으로 설계된 데이터베이스 프록시 |
| FE 구성원 동적 관리와 능동 SQL 상태 확인이 필요한 경우 | NJet | 선택적으로 관리 API를 사용할 수 있는 TCP 프록시 |
| 로드 밸런서 뒤에서 실제 클라이언트 IP를 유지해야 하는 경우 | Proxy Protocol | Nginx 또는 HAProxy와 함께 사용 |

## 사전 요구 사항 {#prerequisites}

- FE 노드가 최소 2개 배포되어 있고, 각 FE 프로세스가 `query_port`(기본값 `9030`)에서 수신 대기 중이어야 합니다.
- 프록시 서버와 모든 FE 노드 사이에 네트워크 연결이 가능해야 합니다.
- 프록시 서비스에 사용할 포트를 정해야 합니다(이 문서에서는 `6030`을 예로 사용합니다).
- Proxy Protocol이 필요한 경우, Doris 버전이 Proxy Protocol V1을 지원해야 합니다(2.1.1 버전부터 사용 가능).

## 클러스터 토폴로지 예시 {#example-cluster-topology}

이 문서에서는 다음 세 개의 FE 노드를 예로 사용합니다.

```text
192.168.1.101:9030
192.168.1.102:9030
192.168.1.103:9030
```

프록시 서버가 실행되는 노드는 다음과 같습니다.

```text
192.168.1.100
```

## 부하 분산 옵션 {#load-balancing-options}

### 옵션 1: JDBC URL {#option-1-jdbc-url}

<!-- Knowledge type: Configuration parameter -->
<!-- Applicable scenario: Application-side load balancing -->

JDBC URL에 내장된 부하 분산 기능을 사용합니다. MySQL Connector/J가 클라이언트 측에서 FE 노드 간 연결 분산과 장애 조치를 수행합니다.

```text
jdbc:mysql:loadbalance://192.168.1.101:9030,192.168.1.102:9030,192.168.1.103:9030/test_db
```

자세한 구성 방법은 [MySQL 공식 문서](https://dev.mysql.com/doc/connector-j/en/connector-j-usagenotes-j2ee-concepts-managing-load-balanced-connections.html)를 참조하세요.

### 옵션 2: Nginx {#option-2-nginx}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenario: General-purpose TCP reverse proxy -->

[Nginx](https://nginx.org/)의 TCP 리버스 프록시 기능(`stream` 모듈)을 사용하여 Doris의 부하를 분산합니다.

#### Nginx 설치 {#install-nginx}

[Nginx 공식 설치 문서](https://nginx.org/en/docs/install.html)를 참조하여 설치를 완료하세요. 다음 예시는 Ubuntu에서 Nginx 1.18.0을 컴파일하고 설치하는 방법입니다.

1. 빌드 의존성을 설치합니다.

    ```shell
    sudo apt-get install build-essential
    sudo apt-get install libpcre3 libpcre3-dev
    sudo apt-get install zlib1g-dev
    sudo apt-get install openssl libssl-dev
    ```

2. Nginx를 다운로드하고 컴파일합니다.

    ```shell
    sudo wget http://nginx.org/download/nginx-1.18.0.tar.gz
    sudo tar zxvf nginx-1.18.0.tar.gz
    cd nginx-1.18.0
    sudo ./configure --prefix=/usr/local/nginx --with-stream --with-http_ssl_module --with-http_gzip_static_module --with-http_stub_status_module
    sudo make && make install
    ```

    :::tip

    컴파일 시 반드시 `--with-stream`을 포함해야 합니다. 그렇지 않으면 Nginx에서 TCP 리버스 프록시를 지원하지 않습니다.

    :::

#### 리버스 프록시 구성 {#configure-the-reverse-proxy}

1. 새 구성 파일을 만듭니다.

    ```shell
    vim /usr/local/nginx/conf/default.conf
    ```

2. 다음 내용을 작성합니다.

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

    주요 구성 항목:

    | 항목 | 설명 |
    |--------|------|
    | `stream` | TCP 리버스 프록시 컨텍스트. Nginx stream 모듈 필요 |
    | `upstream mysqld` | 백엔드 FE 노드 풀. `hash $remote_addr consistent`는 클라이언트 IP를 기준으로 일관된 해싱을 수행 |
    | `weight` | 노드 가중치. 가중치가 높을수록 더 많은 연결을 수신 |
    | `max_fails` / `fail_timeout` | 상태 확인 매개변수. `fail_timeout` 내의 실패 횟수가 `max_fails`를 초과하면 해당 노드를 사용 불가로 표시 |
    | `listen 6030` | 프록시 서비스의 수신 대기 포트 |
    | `proxy_connect_timeout` / `proxy_timeout` | 연결 및 세션 시간 초과 |

#### Nginx 시작 {#start-nginx}

지정한 구성 파일로 시작합니다.

```shell
cd /usr/local/nginx
/usr/local/nginx/sbin/nginx -c conf.d/default.conf
```

#### 확인 {#verify}

프록시 포트를 통해 연결합니다.

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

### 옵션 3: HAProxy {#option-3-haproxy}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenario: High-performance TCP load balancing -->

[HAProxy](https://www.haproxy.org/)는 C로 작성된 고성능 TCP/HTTP 로드 밸런서입니다.

#### HAProxy 설치 {#install-haproxy}

1. HAProxy를 다운로드합니다(다운로드 주소: <https://src.fedoraproject.org/repo/pkgs/haproxy/>).

2. 압축을 풉니다.

    ```shell
    tar -zxvf haproxy-2.6.15.tar.gz -C /opt/
    mv haproxy-2.6.15 haproxy
    cd haproxy
    ```

3. 컴파일하고 설치합니다.

    ```shell
    yum install gcc gcc-c++ -y
    make TARGET=linux-glibc PREFIX=/usr/local/haproxy
    make install PREFIX=/usr/local/haproxy
    ```

#### HAProxy 구성 {#configure-haproxy}

1. syslog 로깅 규칙을 구성합니다.

    구성 파일을 엽니다.

    ```shell
    vim /etc/rsyslog.d/haproxy.conf
    ```

    내용:

    ```text
    $ModLoad imudp
    $UDPServerRun 514
    local0.* /usr/local/haproxy/logs/haproxy.log
    &~
    ```

2. 원격 로깅을 활성화합니다.

    ```shell
    vim /etc/sysconfig/rsyslog
    ```

    다음 내용을 추가합니다.

    ```text
    SYSLOGD_OPTIONS="-c 2 -r -m 0"
    ```

    매개변수 설명:

    | 매개변수 | 설명 |
    |------|------|
    | `-c 2` | 호환 모드 사용. 기본값은 `-c 5` |
    | `-r` | 원격 로깅 활성화 |
    | `-m 0` | 타임스탬프 마크의 분 단위 간격. `0`은 이 기능을 비활성화 |

    변경 사항을 적용합니다.

    ```shell
    systemctl restart rsyslog
    ```

3. 부하 분산 구성 파일을 편집합니다.

    ```shell
    vim /usr/local/haproxy/haproxy.cfg
    ```

    내용:

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

    주요 구성 항목:

    | 항목 | 설명 |
    |--------|------|
    | `frontend agent-front` | TCP 모드를 사용하며 포트 `6030`에 바인딩된 프런트엔드 진입점 |
    | `backend forward-fe` | 라운드 로빈(`roundrobin`) 알고리즘을 사용하는 백엔드 FE 노드 풀 |
    | `check inter 3000 rise 2 fall 3` | `3000ms`마다 상태 확인 수행. `2`회 연속 성공하면 노드를 정상으로, `3`회 연속 실패하면 비정상으로 표시 |

#### HAProxy 시작 {#start-haproxy}

1. 서비스를 시작합니다.

    ```shell
    /opt/haproxy/haproxy -f /usr/local/haproxy/haproxy.cfg
    ```

2. 서비스 상태를 확인합니다.

    ```shell
    netstat -lnatp | grep -i haproxy
    ```

#### 확인 {#verify-1}

```shell
mysql -h 192.168.1.100 -uroot -P6030 -p
```

### 옵션 4: ProxySQL {#option-4-proxysql}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenario: MySQL protocol-aware proxy -->

[ProxySQL](https://proxysql.com/)은 C로 작성된 오픈 소스 MySQL 데이터베이스 프록시입니다. 연결 관리, 읽기/쓰기 분리, 부하 분산, 장애 조치를 제공하며, 성능이 높고 구성이 유연하며 동적 관리가 가능합니다. 웹 서비스, 빅 데이터 플랫폼, 클라우드 데이터베이스 환경에서 널리 사용됩니다.

#### ProxySQL 설치 {#install-proxysql}

[ProxySQL 공식 문서](https://proxysql.com/documentation/installing-proxysql/)를 참조하여 설치를 완료하세요.

#### ProxySQL 구성 {#configure-proxysql}

ProxySQL에는 구성 파일 `/etc/proxysql.cnf`와 구성 데이터베이스 파일 `/var/lib/proxysql/proxysql.db`가 포함되어 있습니다.

:::caution

`proxysql.db` 파일이 `/var/lib/proxysql`에 있으면, ProxySQL 서비스는 최초 시작 시에만 `proxysql.cnf`를 읽고 구문을 분석합니다. 이후 시작 시에는 이 파일을 읽지 않습니다.

`proxysql.cnf`의 변경 사항을 재시작 후 적용하려면, 먼저 `/var/lib/proxysql/proxysql.db`를 삭제한 다음 서비스를 재시작해야 합니다. 이는 초기화 시작과 같으므로, 새 `proxysql.db`가 생성되고 기존 구성 규칙은 지워집니다.

:::

`proxysql.cnf`의 주요 내용은 다음과 같습니다.

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

#### ProxySQL 관리 데이터베이스에 연결 {#connect-to-the-proxysql-admin-database}

관리 포트(`6032`)를 통해 ProxySQL에 연결합니다.

```shell
mysql -uadmin -padmin -P6032 -hdoris01
```

내장 데이터베이스와 테이블을 조회합니다.

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

#### 백엔드 Doris FE 구성 {#configure-the-backend-doris-fe}

`INSERT` 문을 사용하여 프록시할 FE 노드와 포트를 `mysql_servers` 테이블에 추가합니다.

:::note

`hostgroup_id`를 `10`으로 설정하면 쓰기 그룹을, `20`으로 설정하면 읽기 그룹을 나타냅니다. 여기서는 읽기/쓰기 분리가 필요하지 않으므로 값을 임의로 설정할 수 있습니다.

:::

1. 관리 포트에 연결합니다.

    ```shell
    mysql -uadmin -padmin -P6032 -h127.0.0.1
    ```

2. FE 노드를 삽입합니다.

    ```sql
    ProxySQL > insert into mysql_servers(hostgroup_id,hostname,port) values(10,'192.168.0.101',9030);
    Query OK, 1 row affected (0.000 sec)

    ProxySQL > insert into mysql_servers(hostgroup_id,hostname,port) values(10,'192.168.0.102',9030);
    Query OK, 1 row affected (0.000 sec)

    ProxySQL > insert into mysql_servers(hostgroup_id,hostname,port) values(10,'192.168.0.103',9030);
    Query OK, 1 row affected (0.000 sec)
    ```

3. 삽입된 행을 확인합니다.

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

4. 삽입 시 고유 제약 조건 오류가 발생하는 경우:

    ```text
    ERROR 1045 (#2800): UNIQUE constraint failed: mysql_servers.hostgroup_id, mysql_servers.hostname, mysql_servers.port
    ```

    동일한 구성이 이미 정의되어 있다는 뜻입니다. 테이블을 비우거나 해당 호스트의 기존 항목을 삭제할 수 있습니다.

    ```sql
    ProxySQL > select * from mysql_servers;
    ProxySQL > delete from mysql_servers;
    Query OK, 6 rows affected (0.000 sec)
    ```

5. 구성을 런타임과 디스크에 저장합니다.

    ```sql
    ProxySQL > load mysql servers to runtime;
    Query OK, 0 rows affected (0.006 sec)

    ProxySQL > save mysql servers to disk;
    Query OK, 0 rows affected (0.348 sec)
    ```

#### Doris FE 노드 모니터링 구성 {#configure-monitoring-for-doris-fe-nodes}

Doris FE 노드를 추가한 후에는 이러한 백엔드 노드에 대한 모니터링도 구성해야 합니다.

1. Doris에서 모니터링 사용자를 생성합니다.

    ```shell
    mysql -uroot -P9030 -h192.168.0.101
    ```

    ```sql
    Doris > create user monitor@'192.168.0.100' identified by 'P@ssword1!';
    Query OK, 0 rows affected (0.03 sec)

    Doris > grant ADMIN_PRIV on *.* to monitor@'192.168.0.100';
    Query OK, 0 rows affected (0.02 sec)
    ```

2. ProxySQL 프록시 노드로 돌아가 모니터링을 구성합니다.

    ```shell
    mysql -uadmin -padmin -P6032 -h127.0.0.1
    ```

    ```sql
    ProxySQL > set mysql-monitor_username='monitor';
    Query OK, 1 row affected (0.000 sec)

    ProxySQL > set mysql-monitor_password='P@ssword1!';
    Query OK, 1 row affected (0.000 sec)
    ```

3. 구성을 저장합니다.

    ```sql
    ProxySQL > load mysql servers to runtime;
    Query OK, 0 rows affected (0.006 sec)

    ProxySQL > save mysql servers to disk;
    Query OK, 0 rows affected (0.348 sec)
    ```

#### 모니터링 결과 확인 {#verify-monitoring-results}

ProxySQL 모니터링 지표는 `monitor` 데이터베이스에 저장됩니다.

연결 모니터링 로그를 조회합니다.

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

하트비트 모니터링 로그를 조회합니다.

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

### 옵션 5: NJet {#option-5-njet}

[OpenNJet](https://github.com/OpenNJet/OpenNJet)은 TCP 프록시, 동적 업스트림 관리, 선택적 능동 MySQL 상태 확인 기능을 제공합니다. 다음 예시에서는 앞선 섹션과 동일한 프록시 및 FE 주소를 사용합니다.

프록시는 **연결**을 분산합니다. 이미 설정된 MySQL 세션은 하나의 FE에 유지되며, 각 SQL 문을 분산하거나 중단된 쿼리를 재실행하지 않습니다. 이 설정은 FE의 MySQL 포트에 적용됩니다. Stream Load는 HTTP 엔드포인트를 사용하며 BE로 리디렉션될 수 있으므로, 클라이언트는 해당 리디렉션에서 반환된 주소에 접근할 수 있어야 합니다.

#### NJet 및 구성 파일 준비 {#prepare-njet-and-the-configuration-files}

이 예시에서는 공식 `tmlake/njet:4.0.2.0` 이미지와 해당 이미지의 설치 접두 경로인 `/usr/local/njet`을 사용합니다. 이 이미지는 Linux/AMD64용입니다. ARM 호스트에서는 호환되는 이미지를 사용하거나 에뮬레이션을 구성하세요. 네이티브 설치는 [OpenNJet 빠른 시작](https://njet.org.cn/docs/quickstart/)을 참조하고, 설치 환경에 맞게 모듈 및 구성 경로를 조정하세요.

다음 두 파일을 같은 디렉터리에 저장합니다. 컨테이너에서 FE 주소에 접근할 수 있어야 합니다.

**`njet.conf`(데이터 플레인):**

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

`http` 블록은 Doris 트래픽이 `stream`을 통해 전달되는 경우에도 관리 API에서 사용하는 데이터 플레인 모듈을 초기화합니다. 헬퍼는 `conf/njet_ctrl.conf`를 사용합니다. 이 예시에서는 별도의 `conf/ctrl.conf` 또는 `conf/mqtt.conf`를 사용하지 않습니다.

**`njet_ctrl.conf`(컨트롤 플레인):**

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

MySQL 상태 확인 모듈은 명시적으로 로드해야 합니다. 관리 API는 컨테이너 내부의 루프백 주소에서 수신 대기하며, 예시에서는 `docker exec`로 접근합니다.

#### 시작 및 확인 {#start-and-verify}

두 구성 파일이 있는 디렉터리에서 실행합니다.

```shell
docker run -d --name doris-njet \
  --platform linux/amd64 \
  --cap-add=NET_ADMIN --cap-add=DAC_READ_SEARCH \
  -p 6030:6030 \
  -v "$PWD/njet.conf:/usr/local/njet/conf/njet.conf:ro" \
  -v "$PWD/njet_ctrl.conf:/usr/local/njet/conf/njet_ctrl.conf:ro" \
  tmlake/njet:4.0.2.0
```

두 파일의 유효성을 검사하고 백엔드 목록을 확인합니다.

```shell
docker exec doris-njet njet -t
docker exec doris-njet curl --max-time 10 -sS \
  http://127.0.0.1:8081/api/v1/upstream_api/stream/upstreams/mysqld/servers/
```

`njet -t`는 두 구성 파일 모두 유효성 검사를 통과했다고 보고합니다. API는 HTTP 200과 구성된 세 개의 FE가 포함된 JSON 배열을 반환합니다. `doris_user`를 기존 Doris 계정으로 바꾸어 프록시를 통해 연결합니다.

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

주요 설정:

| 설정 | 예시 | 효과 |
| --- | --- | --- |
| `zone` | `mysqld 128k` | 동적 업스트림 관리에 필요한 공유 상태입니다. |
| `hash` | `$remote_addr consistent` | 클라이언트 IP의 일관된 해시를 사용하여 새 연결을 할당합니다. 하나의 소스 IP를 공유하는 클라이언트는 동일한 FE에 연결될 수 있습니다. |
| `max_fails` / `fail_timeout` | `2` / `60s` | 백엔드 연결에 대한 수동적 장애 감지입니다. 능동 SQL 상태 확인을 구성하는 설정은 아닙니다. |
| `listen` | `6030` | 프록시의 MySQL 프로토콜 포트입니다. Docker는 `-p 6030:6030`으로 이 포트를 노출합니다. |
| `proxy_connect_timeout` / `proxy_timeout` | `5s` / `300s` | 백엔드 연결 시간 초과 및 프록시 비활성 시간 초과입니다. 쿼리/세션 요구 사항에 맞게 조정하세요. |

#### FE 동적 추가 및 제거 {#dynamically-add-and-remove-an-fe}

FE를 추가하려면 다음 요청을 보냅니다.

```shell
docker exec doris-njet curl --max-time 10 -i \
  -H 'Content-Type: application/json' \
  -d '{"server":"192.168.1.104:9030","weight":2,"max_fails":1,"fail_timeout":"5s"}' \
  http://127.0.0.1:8081/api/v1/upstream_api/stream/upstreams/mysqld/servers/
```

API는 HTTP 201과 할당된 `id`를 포함한 새 구성원을 반환합니다. 초기 구성이 세 개의 구성원으로 이루어진 경우, 처음 추가되는 구성원의 ID는 3입니다. 삭제할 때는 실제로 반환된 ID를 사용하세요.

```shell
docker exec doris-njet curl --max-time 10 -i -X DELETE \
  http://127.0.0.1:8081/api/v1/upstream_api/stream/upstreams/mysqld/servers/3
```

삭제 시 HTTP 200이 반환되며, 이후 GET 요청의 목록에는 해당 구성원이 더 이상 표시되지 않습니다. 컨테이너를 다시 생성하기 전에 구성 파일이 원하는 구성원 목록과 일치하도록 유지하세요.

#### 능동 MySQL 상태 확인 구성 {#configure-active-mysql-health-checks}

능동 SQL 상태 확인에는 명시적인 API 구성과 사용 가능한 Doris 계정/데이터베이스가 필요합니다. 비밀번호를 바꾼 후 Doris 관리자로 다음을 실행합니다.

```sql
CREATE DATABASE IF NOT EXISTS health_check_db;
CREATE USER IF NOT EXISTS 'njet_health'@'%' IDENTIFIED BY '<replace-with-password>';
GRANT SELECT_PRIV ON health_check_db.* TO 'njet_health'@'%';
```

아래 요청에도 동일한 비밀번호를 사용합니다. `useSsl`은 TLS를 사용하지 않는 FE 리스너에서는 `false`로 설정합니다. FE 리스너에 TLS가 구성된 경우에만 `true`로 설정하세요.

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

구성에 성공하면 HTTP 200과 `{"code":0,"msg":"success"}`가 반환됩니다. 이후 상태 확인에서는 각 FE에 인증하고 구성된 데이터베이스를 선택한 다음 `select 1`을 실행합니다.

| 필드 | 필수 여부 / 기본값 | 설명 |
| --- | --- | --- |
| `interval`, `jitter`, `timeout` | 이 예시에서는 명시적으로 설정 | 기간으로 표현하는 상태 확인 간격, 타이머 지터, 시간 초과입니다. |
| `passes`, `fails` | 이 예시에서는 명시적으로 설정 | 상태를 변경하는 데 필요한 연속 성공/실패 횟수입니다. |
| `port` | 선택 사항. 기본값은 업스트림 서버 포트 | 상태 확인에 사용할 포트를 재정의합니다. |
| `sql.select` | 명시적으로 설정 | FE를 검증하는 데 사용할 SQL 문입니다. |
| `sql.useSsl` | 선택 사항. NJet 기본값은 `true` | FE 리스너의 TLS 설정과 일치해야 합니다. |
| `sql.user`, `sql.password` | Doris 계정에 맞게 설정 | 상태 확인에 사용할 자격 증명입니다. |
| `sql.db` | 필수, 비어 있지 않아야 함 | 상태 확인 시 선택할 기존 데이터베이스입니다. |

API 요청이 시간 초과되면 헬퍼 경로와 데이터 플레인의 `http` 블록을 확인하세요. 상태 확인이 실패하면 데이터베이스, 자격 증명, 네트워크 접근 가능 여부, TLS 설정을 확인하세요. 구성 성공 응답만으로는 FE가 정상임을 확인할 수 없습니다. 자세한 내용은 [OpenNJet 소스 및 문서](https://github.com/OpenNJet/OpenNJet)와 [JSON 구성 형식](https://njet.org.cn/cases/njet_support_json/)을 참조하세요.

## 클라이언트 IP 전달(Proxy Protocol) {#client-ip-forwarding-proxy-protocol}

<!-- Knowledge type: Configuration parameter / Operational procedure -->
<!-- Applicable scenario: Allow lists / Audit / Access control -->

대부분의 경우, 클라이언트가 프록시 서비스를 통해 백엔드 Doris에 연결하면 클라이언트 IP 정보가 손실되어 Doris 서버는 프록시 서버의 IP 주소만 가져올 수 있습니다.

Doris는 2.1.1 버전부터 [Proxy Protocol](https://www.haproxy.org/download/1.8/doc/proxy-protocol.txt)을 지원합니다. 이 프로토콜을 사용하면 부하 분산 후에도 Doris가 실제 클라이언트 IP를 가져올 수 있어, 허용 목록 및 감사와 같은 클라이언트 IP 기반 접근 제어가 가능합니다.

다음 섹션에서는 Doris, Nginx, HAProxy에서 Proxy Protocol을 활성화하는 방법을 설명합니다.

### Doris에서 Proxy Protocol 활성화 {#enable-proxy-protocol-in-doris}

FE의 `fe.conf`에 다음을 추가합니다.

```text
enable_proxy_protocol = true
```

:::note

1. Proxy Protocol V1만 지원합니다.
2. 이 기능은 MySQL 프로토콜 포트에만 적용됩니다. HTTP 및 ADBC와 같은 다른 프로토콜 포트는 지원하지 않으며, 해당 포트에 영향을 주지도 않습니다.
3. Doris 3.1 이전 버전에서는 이 기능을 활성화하면 모든 연결이 Proxy Protocol을 사용해야 하며, 그렇지 않으면 연결이 실패합니다. 3.1 버전부터는 Proxy Protocol을 활성화한 후에도 표준 MySQL 연결 프로토콜을 사용할 수 있습니다.

:::

### Nginx에서 Proxy Protocol 활성화 {#enable-proxy-protocol-in-nginx}

`proxy_protocol on;`을 구성 파일의 `server` 섹션에 추가합니다.

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

### HAProxy에서 Proxy Protocol 활성화 {#enable-proxy-protocol-in-haproxy}

`backend` 섹션을 `haproxy.cfg`에서 찾아 `send-proxy` 매개변수를 각 `server` 줄에 추가합니다.

```text
backend forward-fe
    mode tcp
    balance roundrobin
    server fe-1 192.168.1.101:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
    server fe-2 192.168.1.102:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
    server fe-3 192.168.1.103:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
```

### IP 전달 확인 {#verify-ip-forwarding}

1. 프록시를 통해 Doris에 연결합니다.

    ```sql
    mysql -uroot -P6030 -h192.168.1.100
    ```

2. `show processlist`를 실행하고 `Host` 열을 확인합니다.

    ```sql
    mysql> show processlist;
    +------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
    | CurrentConnected | Id   | User | Host              | LoginTime           | Catalog  | Db   | Command | Time | State | QueryId                           | Info             |
    +------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
    | Yes              |    1 | root | 192.168.1.101:34390 | 2024-03-17 16:32:22 | internal |      | Query   |    0 | OK    | 82edc460d93f4e28-8bbed058a068e259 | show processlist |
    +------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
    1 row in set (0.00 sec)
    ```

3. `Host` 열에 실제 클라이언트 IP가 표시되면 확인에 성공한 것입니다. 그렇지 않으면 프록시 서비스의 IP만 표시됩니다.

    실제 클라이언트 IP는 `fe.audit.log`에도 기록됩니다.

## 자주 묻는 질문 {#faq}

### 질문: 프록시 포트를 통해 연결할 때 `Connection refused`가 표시되나요? {#q-connecting-through-the-proxy-port-reports-connection-refused}

프록시 서비스가 시작되지 않았거나, 수신 대기 포트가 구성과 일치하지 않는 경우입니다. 프록시 프로세스가 실행 중인지 확인하고, `netstat -lnatp`를 사용하여 수신 대기 포트를 확인하세요.

### 질문: 연결에는 성공하지만 간헐적으로 시간 초과가 발생하나요? {#q-connections-succeed-but-occasionally-time-out}

백엔드 FE 노드가 비정상이거나, 프록시 시간 초과가 너무 짧게 설정된 경우입니다. `proxy_timeout` / `timeout server` 구성을 확인하고, 상태 확인 로그를 통해 백엔드 노드의 상태를 확인하세요.

### 질문: Nginx가 `unknown directive "stream"` 오류로 시작되지 않나요? {#q-nginx-fails-to-start-with-unknown-directive-stream}

컴파일 시 stream 모듈이 활성화되지 않은 경우입니다. `--with-stream` 옵션을 사용하여 Nginx를 다시 컴파일하세요.

### 질문: ProxySQL에서 `proxysql.cnf`를 변경해도 재시작 후 적용되지 않나요? {#q-proxysql-changes-to-proxysqlcnf-do-not-take-effect-after-restart}

`proxysql.db`가 이미 존재하며, 구성 파일은 최초 시작 시에만 읽습니다. `/var/lib/proxysql/proxysql.db`를 삭제한 다음 서비스를 재시작하세요.

### 질문: ProxySQL의 `mysql_servers`에 삽입할 때 `UNIQUE constraint failed`가 표시되나요? {#q-inserting-into-mysql_servers-in-proxysql-reports-unique-constraint-failed}

동일한 `hostgroup_id` + `hostname` + `port`를 가진 레코드가 테이블에 이미 존재하는 경우입니다. 테이블을 비우거나 기존 레코드를 삭제한 다음 삽입하세요.

### 질문: Proxy Protocol을 활성화한 후 클라이언트가 연결되지 않나요(3.1 이전 버전)? {#q-clients-fail-to-connect-after-enabling-proxy-protocol-versions-before-31}

해당 Doris 버전에서는 모든 연결에 Proxy Protocol을 사용해야 하므로 표준 MySQL 클라이언트와 호환되지 않습니다. 3.1 이상 버전으로 업그레이드하거나, 항상 Proxy Protocol을 지원하는 프록시를 통해 연결하세요.

### 질문: `show processlist`에 여전히 프록시 IP가 표시되나요? {#q-show-processlist-still-shows-the-proxy-ip}

Doris에서 `enable_proxy_protocol`이 활성화되지 않았거나, 프록시 측에 `proxy_protocol on` / `send-proxy`가 구성되지 않은 경우입니다. FE 구성과 프록시 측의 Proxy Protocol 활성화 설정을 확인하세요.
