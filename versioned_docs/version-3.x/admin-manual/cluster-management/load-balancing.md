---
{
    "title": "Load Balancing",
    "language": "en"
}

---

Users connect to Doris through FE's query port (`query_port`, default 9030) using the MySQL protocol. When deploying multiple FE nodes, users can deploy a load balancing layer on top of multiple FEs to achieve high availability for Doris queries.

This document introduces various load balancing solutions suitable for Doris and explains how to implement client IP passthrough using the Proxy Protocol.

## Load Balancing

This article uses the following three FE nodes as examples for demonstrating the steps:

```text
192.168.1.101:9030
192.168.1.102:9030
192.168.1.103:9030
```

Proxy server node:

```text
192.168.1.100
```

### 01 JDBC URL

Use the built-in load balancing configuration in JDBC URL.

```text
jdbc:mysql:loadbalance://192.168.1.101:9030,192.168.1.102:9030,192.168.1.103:9030/test_db
```

For details, please refer to [MySQL Official Documentation](https://dev.mysql.com/doc/connector-j/en/connector-j-usagenotes-j2ee-concepts-managing-load-balanced-connections.html)

### 02 Nginx

Use [Nginx](https://nginx.org/) TCP reverse proxy to implement Doris load balancing.

#### Install Nginx

Please refer to [Nginx](https://nginx.org/en/docs/install.html) official website to install Nginx correctly. Here we demonstrate the Nginx compilation and installation steps using Ubuntu system with Nginx 1.18.0 version as an example.

1. Install compilation dependencies

    ```shell
    sudo apt-get install build-essential
    sudo apt-get install libpcre3 libpcre3-dev 
    sudo apt-get install zlib1g-dev
    sudo apt-get install openssl libssl-dev
    ```

2. Install Nginx

    ```shell
    sudo wget http://nginx.org/download/nginx-1.18.0.tar.gz
    sudo tar zxvf nginx-1.18.0.tar.gz
    cd nginx-1.18.0
    sudo ./configure --prefix=/usr/local/nginx --with-stream --with-http_ssl_module --with-http_gzip_static_module --with-http_stub_status_module
    sudo make && make install
    ```

#### Configure Reverse Proxy

Create a new configuration file:

```shell
vim /usr/local/nginx/conf/default.conf
```

Content as follows:

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

#### Start Nginx

Start with specified configuration file:

```shell
cd /usr/local/nginx
/usr/local/nginx/sbin/nginx -c conf.d/default.conf
```

#### Verify

Connect using the proxy port:

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

[HAProxy](https://www.haproxy.org/) is a high-performance TCP/HTTP load balancer written in C language.

#### Install HAProxy

1. Download HAProxy

   Download link: https://src.fedoraproject.org/repo/pkgs/haproxy/

2. Extract

   ```shell
   tar -zxvf haproxy-2.6.15.tar.gz -C /opt/
   mv haproxy-2.6.15 haproxy
   cd haproxy
   ```

3. Compile

   ```shell
   yum install gcc gcc-c++ -y
   make TARGET=linux-glibc PREFIX=/usr/local/haproxy
   make install PREFIX=/usr/local/haproxy
   ```

#### Configure HAProxy

1. Configure haproxy.conf file

    Open configuration file:

    ```shell
    vim /etc/rsyslog.d/haproxy.conf
    ```

    Content as follows:

    ```text
    $ModLoad imudp 
    $UDPServerRun 514
    local0.* /usr/local/haproxy/logs/haproxy.log
    &~
    ```

2. Enable remote logging

    ```shell
    vim /etc/sysconfig/rsyslog
    ```

    Add content:

    ```text
    SYSLOGD_OPTIONS="-c 2 -r -m 0"
    ```

    Parameter description:

    - `-c 2`: Use compatibility mode, default is `-c 5`.
    - `-r`: Enable remote logging.
    - `-m 0`: Mark timestamps. In minutes, when 0, indicates this feature is disabled.

    Apply changes:

    `systemctl restart rsyslog`

3. Edit load balancing file

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

#### Start HAProxy

1. Start service

    `/opt/haproxy/haproxy -f /usr/local/haproxy/haproxy.cfg`

2. Check service status

    `netstat -lnatp | grep -i haproxy`

#### Verify

`mysql -h 192.168.1.100 -uroot -P6030 -p`

### 04 ProxySQL

[ProxySQL](https://proxysql.com/) is an open-source MySQL database proxy software written in C language. It can implement connection management, read-write splitting, load balancing, failover, and other functions. It has advantages such as high performance, configurability, and dynamic management, and is commonly used in Web services, big data platforms, cloud databases, and other scenarios.

#### Install ProxySQL

Please refer to the [official documentation](https://proxysql.com/documentation/installing-proxysql/) to install ProxySQL correctly.

#### Configure ProxySQL

ProxySQL includes configuration file `/etc/proxysql.cnf` and configuration database file `/var/lib/proxysql/proxysql.db`.

Special attention should be paid that if there is a "proxysql.db" file in the `/var/lib/proxysql` directory, the ProxySQL service only reads and parses `proxysql.cnf` during the first startup, and subsequent startups will no longer read it.

To make `proxysql.cnf` configuration take effect after restart, you need to delete `/var/lib/proxysql/proxysql.db` before restarting the service, which is equivalent to initialization startup and will generate a new `proxysql.db` file, and the original configuration rules will be cleared.

Here is the main content of the configuration file `proxysql.cnf`:

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

#### Connect to ProxySQL Admin Database

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

#### Configure Backend Doris FE in ProxySQL

Use INSERT statements to add the FE nodes and ports that need to be proxied to the `mysql_servers` table.

Where: `hostgroup_id` of `10` indicates write group, `20` indicates read group. We don't need read-write splitting here, so it can be set arbitrarily.

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

Check results:

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

If you encounter an error during insertion:

```text
ERROR 1045 (#2800): UNIQUE constraint failed: mysql_servers.hostgroup_id, mysql_servers.hostname, mysql_servers.port
```

This indicates that other configurations may have been defined previously. You can empty this table or delete the configuration for the corresponding host:

```sql
ProxySQL > select * from mysql_servers;
ProxySQL > delete from mysql_servers;
Query OK, 6 rows affected (0.000 sec)
```
  
Save information:

```sql
ProxySQL > load mysql servers to runtime;
Query OK, 0 rows affected (0.006 sec)
  
ProxySQL > save mysql servers to disk;
Query OK, 0 rows affected (0.348 sec)
```

#### Configure Monitoring for Doris FE Nodes

After adding Doris FE nodes, these backend nodes need to be monitored.

First, create a user for monitoring in Doris:

```shell
mysql -uroot -P9030 -h192.168.0.101
```

```sql
Doris > create user monitor@'192.168.0.100' identified by 'P@ssword1!';
Query OK, 0 rows affected (0.03 sec)

Doris > grant ADMIN_PRIV on *.* to monitor@'192.168.0.100';
Query OK, 0 rows affected (0.02 sec)
```

Then go back to the mysql-proxy proxy layer node to configure monitoring

```shell
mysql -uadmin -padmin -P6032 -h127.0.0.1
```

```sql
ProxySQL > set mysql-monitor_username='monitor';
Query OK, 1 row affected (0.000 sec)
 
ProxySQL > set mysql-monitor_password='P@ssword1!';
Query OK, 1 row affected (0.000 sec)
```

Save configuration and exit:

```sql
ProxySQL > load mysql servers to runtime;
Query OK, 0 rows affected (0.006 sec)
  
ProxySQL > save mysql servers to disk;
Query OK, 0 rows affected (0.348 sec)
```

Verify monitoring results.

The metrics of the ProxySQL monitoring module are all saved in the `monitor.log` table.

Connection monitoring:

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

Heartbeat monitoring:

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

In most cases, when connecting to the backend Doris service through a proxy service, client IP information will be lost, and the Doris server can only obtain the IP address information of the proxy server.

Starting from version 2.1.1, Doris supports the [Proxy Protocol](https://www.haproxy.org/download/1.8/doc/proxy-protocol.txt) protocol. Using this protocol, client IP passthrough can be implemented, so that after going through load balancing, Doris can still obtain the client's real IP to implement whitelist and other permission controls.

Below we introduce how to enable Proxy Protocol in Nginx and Haproxy respectively.

### Enable Proxy Protocol Support in Doris

Add to `fe.conf` in FE:

```text
enable_proxy_protocol = true
```

:::note

1. Only supports Proxy Protocol V1.

2. Only supports and affects MySQL protocol ports, does not support or affect HTTP, ADBC, and other protocol ports.

3. Before Doris 3.1 version, after enabling, you must use the Proxy Protocol protocol to connect, otherwise the connection will fail. Starting from version 3.1, after enabling Proxy Protocol, you can still connect using the standard MySQL connection protocol.

:::

### 01 Nginx

Add `proxy_protocol on;` to the `server` section in the configuration file:

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

Add `send-proxy` parameter to the `backend` section in `haproxy.cfg`:

```text
backend forward-fe
    mode tcp
    balance roundrobin
    server fe-1 192.168.1.101:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
    server fe-2 192.168.1.102:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
    server fe-3 192.168.1.103:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
```

### Verify IP Passthrough Success

Connect to Doris through proxy:

```sql
mysql -uroot -P6030 -h192.168.1.100
```

Verify

```sql
mysql> show processlist;
+------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
| CurrentConnected | Id   | User | Host              | LoginTime           | Catalog  | Db   | Command | Time | State | QueryId                           | Info             |
+------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
| Yes              |    1 | root | 192.168.1.101:34390 | 2024-03-17 16:32:22 | internal |      | Query   |    0 | OK    | 82edc460d93f4e28-8bbed058a068e259 | show processlist |
+------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
1 row in set (0.00 sec)
```

If you see the real client IP in the `Host` column, the verification is successful. Otherwise, you can only see the IP address of the proxy service.

At the same time, the real client IP will also be recorded in fe.audit.log.

