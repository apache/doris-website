---
{
    "title": "FE Load Balancing",
    "language": "en",
    "description": "Load balancing options for multi-FE Doris deployments: JDBC, Nginx, HAProxy, ProxySQL, plus client IP forwarding via Proxy Protocol.",
    "keywords": [
        "Doris load balancing",
        "FE high availability",
        "MySQL protocol proxy",
        "JDBC loadbalance",
        "Nginx TCP reverse proxy",
        "HAProxy",
        "ProxySQL",
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

Users connect to Doris over the MySQL protocol through the FE query port (`query_port`, default `9030`). When multiple FE nodes are deployed, you can place a load balancing layer in front of the FEs to provide high availability and connection distribution for the Doris query entry point.

This document describes five load balancing options for Doris and explains how to forward the real client IP through the proxy layer using Proxy Protocol.

## Applicable Scenarios

| Scenario | Recommended option | Description |
|------|----------|------|
| Applications connect to Doris directly through JDBC, with no dedicated proxy to operate | JDBC URL | Client-side load balancing, no extra component required |
| Existing Nginx infrastructure, TCP-layer reverse proxy required | Nginx | General-purpose TCP reverse proxy, simple configuration |
| High-performance TCP proxy with health checks required | HAProxy | Dedicated TCP/HTTP load balancer with a rich set of health-check strategies |
| MySQL protocol-aware proxy required (connection management, read/write splitting, etc.) | ProxySQL | Database proxy designed for the MySQL protocol |
| Dynamic FE membership and active SQL health checks required | NJet | TCP proxy with optional management APIs |
| Need to preserve the real client IP behind the load balancer | Proxy Protocol | Used together with Nginx or HAProxy |

## Prerequisites

- At least 2 FE nodes are deployed, and each FE process is listening on `query_port` (default `9030`).
- Network connectivity exists between the proxy server and all FE nodes.
- A port for the proxy service has been planned (this document uses `6030` as an example).
- If Proxy Protocol is required, the Doris version must support Proxy Protocol V1 (available since version 2.1.1).

## Example Cluster Topology

This document uses the following three FE nodes for demonstration:

```text
192.168.1.101:9030
192.168.1.102:9030
192.168.1.103:9030
```

The node where the proxy server runs:

```text
192.168.1.100
```

## Load Balancing Options

### Option 1: JDBC URL

<!-- Knowledge type: Configuration parameter -->
<!-- Applicable scenario: Application-side load balancing -->

Use the load balancing capability built into the JDBC URL. MySQL Connector/J performs connection distribution and failover across FE nodes on the client side.

```text
jdbc:mysql:loadbalance://192.168.1.101:9030,192.168.1.102:9030,192.168.1.103:9030/test_db
```

For detailed configuration, see the [MySQL official documentation](https://dev.mysql.com/doc/connector-j/en/connector-j-usagenotes-j2ee-concepts-managing-load-balanced-connections.html).

### Option 2: Nginx

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenario: General-purpose TCP reverse proxy -->

Use the TCP reverse proxy capability of [Nginx](https://nginx.org/) (the `stream` module) to load-balance Doris.

#### Install Nginx

See the [Nginx official installation documentation](https://nginx.org/en/docs/install.html) to complete the installation. The following example shows how to compile and install Nginx 1.18.0 on Ubuntu:

1. Install build dependencies:

    ```shell
    sudo apt-get install build-essential
    sudo apt-get install libpcre3 libpcre3-dev
    sudo apt-get install zlib1g-dev
    sudo apt-get install openssl libssl-dev
    ```

2. Download and compile Nginx:

    ```shell
    sudo wget http://nginx.org/download/nginx-1.18.0.tar.gz
    sudo tar zxvf nginx-1.18.0.tar.gz
    cd nginx-1.18.0
    sudo ./configure --prefix=/usr/local/nginx --with-stream --with-http_ssl_module --with-http_gzip_static_module --with-http_stub_status_module
    sudo make && make install
    ```

    :::tip

    Make sure to include `--with-stream` at compile time; otherwise Nginx does not support TCP reverse proxy.

    :::

#### Configure the Reverse Proxy

1. Create a new configuration file:

    ```shell
    vim /usr/local/nginx/conf/default.conf
    ```

2. Write the following content:

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

    Key configuration items:

    | Item | Description |
    |--------|------|
    | `stream` | TCP reverse proxy context; requires the Nginx stream module |
    | `upstream mysqld` | Backend FE node pool. `hash $remote_addr consistent` performs consistent hashing by client IP |
    | `weight` | Node weight; higher weight receives more connections |
    | `max_fails` / `fail_timeout` | Health check parameters. If failures within `fail_timeout` exceed `max_fails`, the node is marked unavailable |
    | `listen 6030` | Listening port of the proxy service |
    | `proxy_connect_timeout` / `proxy_timeout` | Connection and session timeouts |

#### Start Nginx

Start with the specified configuration file:

```shell
cd /usr/local/nginx
/usr/local/nginx/sbin/nginx -c conf.d/default.conf
```

#### Verify

Connect through the proxy port:

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

### Option 3: HAProxy

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenario: High-performance TCP load balancing -->

[HAProxy](https://www.haproxy.org/) is a high-performance TCP/HTTP load balancer written in C.

#### Install HAProxy

1. Download HAProxy (download address: <https://src.fedoraproject.org/repo/pkgs/haproxy/>).

2. Extract:

    ```shell
    tar -zxvf haproxy-2.6.15.tar.gz -C /opt/
    mv haproxy-2.6.15 haproxy
    cd haproxy
    ```

3. Compile and install:

    ```shell
    yum install gcc gcc-c++ -y
    make TARGET=linux-glibc PREFIX=/usr/local/haproxy
    make install PREFIX=/usr/local/haproxy
    ```

#### Configure HAProxy

1. Configure syslog logging rules.

    Open the configuration file:

    ```shell
    vim /etc/rsyslog.d/haproxy.conf
    ```

    Content:

    ```text
    $ModLoad imudp
    $UDPServerRun 514
    local0.* /usr/local/haproxy/logs/haproxy.log
    &~
    ```

2. Enable remote logging:

    ```shell
    vim /etc/sysconfig/rsyslog
    ```

    Add the following content:

    ```text
    SYSLOGD_OPTIONS="-c 2 -r -m 0"
    ```

    Parameter descriptions:

    | Parameter | Description |
    |------|------|
    | `-c 2` | Use compatibility mode; the default is `-c 5` |
    | `-r` | Enable remote logging |
    | `-m 0` | Time-stamp mark in minutes; `0` disables this feature |

    Apply the changes:

    ```shell
    systemctl restart rsyslog
    ```

3. Edit the load balancing configuration file:

    ```shell
    vim /usr/local/haproxy/haproxy.cfg
    ```

    Content:

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

    Key configuration items:

    | Item | Description |
    |--------|------|
    | `frontend agent-front` | Frontend entry point, bound to port `6030`, using TCP mode |
    | `backend forward-fe` | Backend FE node pool, using the round-robin (`roundrobin`) algorithm |
    | `check inter 3000 rise 2 fall 3` | Run a health check every `3000ms`; `2` consecutive successes mark the node up, `3` consecutive failures mark it down |

#### Start HAProxy

1. Start the service:

    ```shell
    /opt/haproxy/haproxy -f /usr/local/haproxy/haproxy.cfg
    ```

2. Check the service status:

    ```shell
    netstat -lnatp | grep -i haproxy
    ```

#### Verify

```shell
mysql -h 192.168.1.100 -uroot -P6030 -p
```

### Option 4: ProxySQL

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenario: MySQL protocol-aware proxy -->

[ProxySQL](https://proxysql.com/) is an open-source MySQL database proxy written in C. It provides connection management, read/write splitting, load balancing, and failover, with high performance, configurability, and dynamic management. It is commonly used in web services, big data platforms, and cloud database scenarios.

#### Install ProxySQL

See the [ProxySQL official documentation](https://proxysql.com/documentation/installing-proxysql/) to complete the installation.

#### Configure ProxySQL

ProxySQL ships with a configuration file `/etc/proxysql.cnf` and a configuration database file `/var/lib/proxysql/proxysql.db`.

:::caution

If `proxysql.db` exists under `/var/lib/proxysql`, the ProxySQL service reads and parses `proxysql.cnf` only on the first startup; subsequent startups do not read it.

To make changes in `proxysql.cnf` take effect after a restart, you must first delete `/var/lib/proxysql/proxysql.db` and then restart the service. This is equivalent to an initialization startup: a new `proxysql.db` is generated and the original configuration rules are cleared.

:::

The main content of `proxysql.cnf` is shown below:

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

#### Connect to the ProxySQL Admin Database

Connect to ProxySQL through the admin port (`6032`):

```shell
mysql -uadmin -padmin -P6032 -hdoris01
```

View the built-in databases and tables:

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

#### Configure the Backend Doris FE

Use `INSERT` statements to add the FE nodes and ports to be proxied into the `mysql_servers` table.

:::note

`hostgroup_id` set to `10` represents a write group, and `20` represents a read group. Read/write splitting is not required here, so the value can be set arbitrarily.

:::

1. Connect to the admin port:

    ```shell
    mysql -uadmin -padmin -P6032 -h127.0.0.1
    ```

2. Insert the FE nodes:

    ```sql
    ProxySQL > insert into mysql_servers(hostgroup_id,hostname,port) values(10,'192.168.0.101',9030);
    Query OK, 1 row affected (0.000 sec)

    ProxySQL > insert into mysql_servers(hostgroup_id,hostname,port) values(10,'192.168.0.102',9030);
    Query OK, 1 row affected (0.000 sec)

    ProxySQL > insert into mysql_servers(hostgroup_id,hostname,port) values(10,'192.168.0.103',9030);
    Query OK, 1 row affected (0.000 sec)
    ```

3. Check the inserted rows:

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

4. If you hit a unique-constraint error on insert:

    ```text
    ERROR 1045 (#2800): UNIQUE constraint failed: mysql_servers.hostgroup_id, mysql_servers.hostname, mysql_servers.port
    ```

    The same configuration has been defined before. You can clear the table or delete the existing entry for that host:

    ```sql
    ProxySQL > select * from mysql_servers;
    ProxySQL > delete from mysql_servers;
    Query OK, 6 rows affected (0.000 sec)
    ```

5. Save the configuration to runtime and disk:

    ```sql
    ProxySQL > load mysql servers to runtime;
    Query OK, 0 rows affected (0.006 sec)

    ProxySQL > save mysql servers to disk;
    Query OK, 0 rows affected (0.348 sec)
    ```

#### Configure Monitoring for Doris FE Nodes

After adding the Doris FE nodes, you also need to monitor these backend nodes.

1. Create a monitoring user in Doris:

    ```shell
    mysql -uroot -P9030 -h192.168.0.101
    ```

    ```sql
    Doris > create user monitor@'192.168.0.100' identified by 'P@ssword1!';
    Query OK, 0 rows affected (0.03 sec)

    Doris > grant ADMIN_PRIV on *.* to monitor@'192.168.0.100';
    Query OK, 0 rows affected (0.02 sec)
    ```

2. Go back to the ProxySQL proxy node and configure monitoring:

    ```shell
    mysql -uadmin -padmin -P6032 -h127.0.0.1
    ```

    ```sql
    ProxySQL > set mysql-monitor_username='monitor';
    Query OK, 1 row affected (0.000 sec)

    ProxySQL > set mysql-monitor_password='P@ssword1!';
    Query OK, 1 row affected (0.000 sec)
    ```

3. Save the configuration:

    ```sql
    ProxySQL > load mysql servers to runtime;
    Query OK, 0 rows affected (0.006 sec)

    ProxySQL > save mysql servers to disk;
    Query OK, 0 rows affected (0.348 sec)
    ```

#### Verify Monitoring Results

ProxySQL monitoring metrics are stored in the `monitor` database.

View the connection monitoring log:

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

View the heartbeat monitoring log:

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

### Option 5: NJet

[OpenNJet](https://github.com/OpenNJet/OpenNJet) provides TCP proxying, dynamic upstream management, and optional active MySQL health checks. The following example uses the same proxy and FE addresses as the preceding sections.

The proxy distributes **connections**. An established MySQL session remains on one FE; it does not distribute each SQL statement or replay an interrupted query. These settings cover the FE MySQL port. Stream Load uses the HTTP endpoint and can redirect to a BE; the client must be able to reach the address returned by that redirect.

#### Prepare NJet and the Configuration Files

The example uses the official `tmlake/njet:4.0.2.0` image and its `/usr/local/njet` installation prefix. This image is Linux/AMD64; use a matching image or configure emulation on ARM hosts. For native installation, see the [OpenNJet quick start](https://njet.org.cn/docs/quickstart/), and adjust module/configuration paths to your installation.

Save the following two files in the same directory. The FE addresses must be reachable from the container.

**`njet.conf` (data plane):**

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

The `http` block initializes the data-plane modules used by the management APIs, even though Doris traffic is forwarded by `stream`. The helper uses `conf/njet_ctrl.conf`; it does not use a separate `conf/ctrl.conf` or `conf/mqtt.conf` in this example.

**`njet_ctrl.conf` (control plane):**

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

The MySQL health-check module must be loaded explicitly. The management API listens on loopback inside the container; the examples access it with `docker exec`.

#### Start and Verify

Run from the directory containing both configuration files:

```shell
docker run -d --name doris-njet \
  --platform linux/amd64 \
  --cap-add=NET_ADMIN --cap-add=DAC_READ_SEARCH \
  -p 6030:6030 \
  -v "$PWD/njet.conf:/usr/local/njet/conf/njet.conf:ro" \
  -v "$PWD/njet_ctrl.conf:/usr/local/njet/conf/njet_ctrl.conf:ro" \
  tmlake/njet:4.0.2.0
```

Validate both files and inspect the backend list:

```shell
docker exec doris-njet njet -t
docker exec doris-njet curl --max-time 10 -sS \
  http://127.0.0.1:8081/api/v1/upstream_api/stream/upstreams/mysqld/servers/
```

`njet -t` reports successful validation for both configuration files. The API returns HTTP 200 and a JSON array containing the three configured FEs. Connect through the proxy:

```shell
mysql -h192.168.1.100 -P6030 -u<doris_user> -p -e 'SELECT 1 AS connection_test;'
```

```text
+-----------------+
| connection_test |
+-----------------+
|               1 |
+-----------------+
```

Key settings:

| Setting | Example | Effect |
| --- | --- | --- |
| `zone` | `mysqld 128k` | Shared state required for dynamic upstream management. |
| `hash` | `$remote_addr consistent` | Assigns new connections using a consistent hash of client IP. Clients sharing one source IP may reach the same FE. |
| `max_fails` / `fail_timeout` | `2` / `60s` | Passive failure detection for backend connections. This does not configure active SQL checks. |
| `listen` | `6030` | Proxy's MySQL-protocol port. Docker publishes it with `-p 6030:6030`. |
| `proxy_connect_timeout` / `proxy_timeout` | `5s` / `300s` | Backend connection timeout and proxy inactivity timeout. Adapt these to your query/session requirements. |

#### Dynamically Add and Remove an FE

To add an FE, send:

```shell
docker exec doris-njet curl --max-time 10 -i \
  -H 'Content-Type: application/json' \
  -d '{"server":"192.168.1.104:9030","weight":2,"max_fails":1,"fail_timeout":"5s"}' \
  http://127.0.0.1:8081/api/v1/upstream_api/stream/upstreams/mysqld/servers/
```

The API returns HTTP 201 and the new member, including its assigned `id`. For the initial three-member configuration, the first new member has ID 3. Use the actual returned ID when deleting it:

```shell
docker exec doris-njet curl --max-time 10 -i -X DELETE \
  http://127.0.0.1:8081/api/v1/upstream_api/stream/upstreams/mysqld/servers/3
```

Deletion returns HTTP 200; a subsequent GET no longer lists that member. Keep the configuration files consistent with your intended membership before recreating the container.

#### Configure Active MySQL Health Checks

Active SQL checks require an explicit API configuration and a working Doris account/database. Run the following as a Doris administrator, replacing the password:

```sql
CREATE DATABASE IF NOT EXISTS health_check_db;
CREATE USER IF NOT EXISTS 'njet_health'@'%' IDENTIFIED BY '<replace-with-password>';
GRANT SELECT_PRIV ON health_check_db.* TO 'njet_health'@'%';
```

Use the same password in the request below. `useSsl` is `false` for a non-TLS FE listener; set it to `true` only when the FE listener is configured for TLS.

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

A successful configuration returns HTTP 200 with `{"code":0,"msg":"success"}`. Subsequent checks authenticate, select the configured database, and execute `select 1` against each FE.

| Field | Required / Default | Description |
| --- | --- | --- |
| `interval`, `jitter`, `timeout` | Set explicitly in this example | Check interval, timer jitter, and timeout, expressed as durations. |
| `passes`, `fails` | Set explicitly in this example | Consecutive successes/failures required to change health state. |
| `port` | Optional; upstream server port | Override the port used for checks. |
| `sql.select` | Set explicitly | SQL statement used to validate the FE. |
| `sql.useSsl` | Optional; NJet defaults to `true` | Must match the FE listener's TLS setting. |
| `sql.user`, `sql.password` | Set for the Doris account | Credentials used by the health checker. |
| `sql.db` | Required, nonempty | Existing database selected by the checker. |

If the API times out, verify the helper paths and the data-plane `http` block. If a health check fails, verify the database, credentials, network reachability, and TLS setting; a successful configuration response alone does not prove the FE is healthy. For more details, see the [OpenNJet source and documentation](https://github.com/OpenNJet/OpenNJet) and [JSON configuration format](https://njet.org.cn/cases/njet_support_json/).

## Client IP Forwarding (Proxy Protocol)

<!-- Knowledge type: Configuration parameter / Operational procedure -->
<!-- Applicable scenario: Allow lists / Audit / Access control -->

In most cases, when a client connects to backend Doris through a proxy service, the client IP information is lost, and the Doris server can only obtain the IP address of the proxy server.

Starting from version 2.1.1, Doris supports the [Proxy Protocol](https://www.haproxy.org/download/1.8/doc/proxy-protocol.txt). With this protocol, Doris can still obtain the real client IP after load balancing, which enables client-IP-based access control such as allow lists and auditing.

The following sections describe how to enable Proxy Protocol in Doris, Nginx, and HAProxy.

### Enable Proxy Protocol in Doris

Add the following to FE `fe.conf`:

```text
enable_proxy_protocol = true
```

:::note

1. Only Proxy Protocol V1 is supported.
2. The feature applies only to the MySQL protocol port; it does not support and does not affect other protocol ports such as HTTP and ADBC.
3. Before Doris 3.1, once enabled, all connections must use Proxy Protocol, otherwise the connection fails. Starting from version 3.1, after Proxy Protocol is enabled, standard MySQL connection protocol can still be used.

:::

### Enable Proxy Protocol in Nginx

Add `proxy_protocol on;` to the `server` section of the configuration file:

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

### Enable Proxy Protocol in HAProxy

In the `backend` section of `haproxy.cfg`, add the `send-proxy` parameter to each `server` line:

```text
backend forward-fe
    mode tcp
    balance roundrobin
    server fe-1 192.168.1.101:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
    server fe-2 192.168.1.102:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
    server fe-3 192.168.1.103:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
```

### Verify IP Forwarding

1. Connect to Doris through the proxy:

    ```sql
    mysql -uroot -P6030 -h192.168.1.100
    ```

2. Run `show processlist` and check the `Host` column:

    ```sql
    mysql> show processlist;
    +------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
    | CurrentConnected | Id   | User | Host              | LoginTime           | Catalog  | Db   | Command | Time | State | QueryId                           | Info             |
    +------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
    | Yes              |    1 | root | 192.168.1.101:34390 | 2024-03-17 16:32:22 | internal |      | Query   |    0 | OK    | 82edc460d93f4e28-8bbed058a068e259 | show processlist |
    +------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
    1 row in set (0.00 sec)
    ```

3. If the `Host` column shows the real client IP, verification has succeeded; otherwise only the proxy service IP is visible.

    The real client IP is also recorded in `fe.audit.log`.

## FAQ

### Q: Connecting through the proxy port reports `Connection refused`?

The proxy service is not started, or the listening port does not match the configuration. Check that the proxy process is running, and use `netstat -lnatp` to confirm the listening port.

### Q: Connections succeed but occasionally time out?

A backend FE node is unhealthy, or the proxy timeout is set too short. Check the `proxy_timeout` / `timeout server` configuration, and use the health check log to confirm the status of backend nodes.

### Q: Nginx fails to start with `unknown directive "stream"`?

The stream module was not enabled at compile time. Recompile Nginx with the `--with-stream` option.

### Q: ProxySQL changes to `proxysql.cnf` do not take effect after restart?

`proxysql.db` already exists, and the configuration file is read only on the first startup. Delete `/var/lib/proxysql/proxysql.db` and then restart the service.

### Q: Inserting into `mysql_servers` in ProxySQL reports `UNIQUE constraint failed`?

A record with the same `hostgroup_id` + `hostname` + `port` already exists in the table. Clear the table, or delete the existing record before inserting.

### Q: Clients fail to connect after enabling Proxy Protocol (versions before 3.1)?

The Doris version requires every connection to use Proxy Protocol, and standard MySQL clients are not compatible. Upgrade to version 3.1 or later, or always connect through a proxy that supports Proxy Protocol.

### Q: `show processlist` still shows the proxy IP?

Doris does not have `enable_proxy_protocol` enabled, or the proxy side is not configured with `proxy_protocol on` / `send-proxy`. Check the FE configuration and the Proxy Protocol switch on the proxy side.
