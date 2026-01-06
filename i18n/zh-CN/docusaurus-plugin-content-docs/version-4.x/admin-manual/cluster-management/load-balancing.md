---
{
    "title": "负载均衡",
    "language": "zh-CN",
    "description": "用户通过 FE 的查询端口（queryport，默认 9030）使用 MySQL 协议连接 Doris。当部署多个 FE 节点时，用户可以在多个 FE 之上部署负载均衡层来实现 Doris 查询的高可用。"
}
---

用户通过 FE 的查询端口（`query_port`，默认 9030）使用 MySQL 协议连接 Doris。当部署多个 FE 节点时，用户可以在多个 FE 之上部署负载均衡层来实现 Doris 查询的高可用。

本文档介绍多种适用于 Doris 的负载均衡方案，并介绍如何通过 Proxy Protocol 实现客户端 IP 透传。

## 负载均衡

本文使用以下三个 FE 节点作为示例进行步骤演示：

```text
192.168.1.101:9030
192.168.1.102:9030
192.168.1.103:9030
```

代理服务器所在节点：

```text
192.168.1.100
```

### 01 JDBC URL

使用 JDBC URL 中自带的负载均衡配置。

```text
jdbc:mysql:loadbalance://192.168.1.101:9030,192.168.1.102:9030,192.168.1.103:9030/test_db
```

详细可以参考 [MySQL 官网文档](https://dev.mysql.com/doc/connector-j/en/connector-j-usagenotes-j2ee-concepts-managing-load-balanced-connections.html)

### 02 Nginx

使用 [Nginx](https://nginx.org/) TCP 反向代理实现 Doris 的负载均衡。

#### 安装 Nginx

请参看 [Nginx](https://nginx.org/en/docs/install.html) 官网正确安装 Nginx，这里以 Ubuntu 系统中安装 Nginx 1.18.0 版本为例展示 Nginx 的编译安装步骤。

1. 安装编译依赖

    ```shell
    sudo apt-get install build-essential
    sudo apt-get install libpcre3 libpcre3-dev 
    sudo apt-get install zlib1g-dev
    sudo apt-get install openssl libssl-dev
    ```

2. 安装 Nginx

    ```shell
    sudo wget http://nginx.org/download/nginx-1.18.0.tar.gz
    sudo tar zxvf nginx-1.18.0.tar.gz
    cd nginx-1.18.0
    sudo ./configure --prefix=/usr/local/nginx --with-stream --with-http_ssl_module --with-http_gzip_static_module --with-http_stub_status_module
    sudo make && make install
    ```

#### 配置反向代理

新建配置文件：

```shell
vim /usr/local/nginx/conf/default.conf
```

内容如下：

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

#### 启动 Nginx

指定配置文件启动：

```shell
cd /usr/local/nginx
/usr/local/nginx/sbin/nginx -c conf.d/default.conf
```

#### 验证

使用代理端口进行连接：

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

[HAProxy](https://www.haproxy.org/) 是一个使用 C 语言编写高性能 TCP/HTTP 负载均衡器。

#### 安装 HAProxy

1. 下载 HAProxy

   下载地址：https://src.fedoraproject.org/repo/pkgs/haproxy/

2. 解压

   ```shell
   tar -zxvf haproxy-2.6.15.tar.gz -C /opt/
   mv haproxy-2.6.15 haproxy
   cd haproxy
   ```

3. 编译

   ```shell
   yum install gcc gcc-c++ -y
   make TARGET=linux-glibc PREFIX=/usr/local/haproxy
   make install PREFIX=/usr/local/haproxy
   ```

#### 配置 HAProxy

1. 配置 haproxy.conf 文件

    打开配置文件：

    ```shell
    vim /etc/rsyslog.d/haproxy.conf
    ```

    内容如下：

    ```text
    $ModLoad imudp 
    $UDPServerRun 514
    local0.* /usr/local/haproxy/logs/haproxy.log
    &~
    ```

2. 开启远程日志

    ```shell
    vim /etc/sysconfig/rsyslog
    ```

    添加内容：

    ```text
    SYSLOGD_OPTIONS="-c 2 -r -m 0"
    ```

    参数说明：

    - `-c 2`：使用兼容模式，默认是 `-c 5`。
    - `-r`：开启远程日志。
    - ·-m 0`：标记时间戳。单位是分钟，为 0 时，表示禁用该功能。

    使修改生效：

    `systemctl restart rsyslog`

3. 编辑负载均衡文件

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

#### 启动 HAProxy

1. 启动服务

    `/opt/haproxy/haproxy -f /usr/local/haproxy/haproxy.cfg`

2. 查看服务状态

    `netstat -lnatp | grep -i haproxy`

#### 验证

`mysql -h 192.168.1.100 -uroot -P6030 -p`

### 04 ProxySQL

[ProxySQL](https://proxysql.com/) 是基于 MySQL 的开源数据库代理软件，用 C 语言编写。能实现连接管理、读写分离、负载均衡、故障切换等功能，具有高性能、可配置、动态管理等优势，常用于 Web 服务、大数据平台、云数据库等场景。

#### 安装 ProxySQL

请参考 [官方文档](https://proxysql.com/documentation/installing-proxysql/) 正确安装 ProxySQL。

#### 配置 ProxySQL

ProxySQL 包含配置文件 `/etc/proxysql.cnf` 与配置数据库文件 `/var/lib/proxysql/proxysql.db`。

需特别注意，若 `/var/lib/proxysql` 目录下存在 `"proxysql.db"` 文件，ProxySQL 服务仅在首次启动时读取并解析 `proxysql.cnf`，后续启动不再读取。

若要使 `proxysql.cnf` 配置在重启后生效，需先删除 `/var/lib/proxysql/proxysql.db` 再重启服务，这相当于初始化启动，会生成新的 `proxysql.db` 文件，原配置规则将被清除。 

以下是配置文件 `proxysql.cnf` 的主要内容：

```text
datadir="/var/lib/proxysql"         #数据目录
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

#### 连接 ProxySQL 管理数据库

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

#### ProxySQL 配置后端 Doris FE

使用 INSERT 语句将需要被代理的 FE 节点和端口添加到 `mysql_servers` 表中。

其中：`hostgroup_id` 为 `10` 表示写组，为 `20` 表示读组。我们这里不需要读写分离，所以可以任意设置。

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

查看结果：

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

如果在插入过程中，出现报错：

```text
ERROR 1045 (#2800): UNIQUE constraint failed: mysql_servers.hostgroup_id, mysql_servers.hostname, mysql_servers.port
```

说明可能之前就已经定义了其他配置，可以清空这张表，或者删除对应 host 的配置：

```sql
ProxySQL > select * from mysql_servers;
ProxySQL > delete from mysql_servers;
Query OK, 6 rows affected (0.000 sec)
```
  
保存信息：

```sql
ProxySQL > load mysql servers to runtime;
Query OK, 0 rows affected (0.006 sec)
  
ProxySQL > save mysql servers to disk;
Query OK, 0 rows affected (0.348 sec)
```

#### 监控 Doris FE 节点配置

添加 Doris FE 节点之后，还需要监控这些后端节点。

首先在 Doris 中创建一个用于监控的用户名：

```shell
mysql -uroot -P9030 -h192.168.0.101
```

```sql
Doris > create user monitor@'192.168.0.100' identified by 'P@ssword1!';
Query OK, 0 rows affected (0.03 sec)

Doris > grant ADMIN_PRIV on *.* to monitor@'192.168.0.100';
Query OK, 0 rows affected (0.02 sec)
```

然后回到 ProxySQL 代理层节点上配置监控


```shell
mysql -uadmin -padmin -P6032 -h127.0.0.1
```

```sql
ProxySQL > set mysql-monitor_username='monitor';
Query OK, 1 row affected (0.000 sec)
 
ProxySQL > set mysql-monitor_password='P@ssword1!';
Query OK, 1 row affected (0.000 sec)
```

保存配置并退出：

```sql
ProxySQL > load mysql servers to runtime;
Query OK, 0 rows affected (0.006 sec)
  
ProxySQL > save mysql servers to disk;
Query OK, 0 rows affected (0.348 sec)
```

验证监控结果。

ProxySQL 监控模块的指标都保存在 `monitor.log` 表中。

连接监控：

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

心跳监控：

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

## 客户端 IP 透传

多数情况下，通过代理服务连接到后端 Doris 服务后，客户端 IP 信息会丢失，Doris 服务端只能获取到代理服务器的 IP 地址信息。

自 2.1.1 版本开始，Doris 支持 [Proxy Protocol](https://www.haproxy.org/download/1.8/doc/proxy-protocol.txt) 协议。利用这个协议，可以是实现客户端 IP 透传，从而在经过负载均衡后，Doris 依然可以获取客户端的真实 IP，实现白名单等权限控制。

下面分别介绍如何在 Nginx 和 Haproxy 中开启 Proxy Protocol。

### Doris 开启 Proxy Protocol 支持

在 FE 的 `fe.conf` 中添加：

```text
enable_proxy_protocol = true
```

:::note

1. 仅支持 Proxy Protocol V1。

2. 仅支持并作用于 MySQL 协议端口，不支持和影响 HTTP、ADBC 等其他协议端口。

3. 在 Doris 3.1 版本之前，开启后，必须使用 Proxy Protocol 协议进行连接，否则连接失败。3.1 版本开始，开启 Proxy Protocol 后，依然可以使用标准的 MySQL 连接协议进行连接。

:::

### 01 Nginx

在配置文件的 `server` 部分新增：`proxy_protocol on;`：

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

在 `haproxy.cfg` 的 `backend` 部分新增 `send-proxy` 参数：

```text
backend forward-fe
    mode tcp
    balance roundrobin
    server fe-1 192.168.1.101:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
    server fe-2 192.168.1.102:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
    server fe-3 192.168.1.103:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
```

### 验证 IP 透传是否成功

通过代理连接 Doris：

```sql
mysql -uroot -P6030 -h192.168.1.100
```

验证

```sql
mysql> show processlist;
+------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
| CurrentConnected | Id   | User | Host              | LoginTime           | Catalog  | Db   | Command | Time | State | QueryId                           | Info             |
+------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
| Yes              |    1 | root | 192.168.1.101:34390 | 2024-03-17 16:32:22 | internal |      | Query   |    0 | OK    | 82edc460d93f4e28-8bbed058a068e259 | show processlist |
+------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
1 row in set (0.00 sec)
```

如果在 `Host` 列看到的真实的客户端 IP，则说明验证成功。否则，只能看到代理服务的 IP 地址。

同时，在 fe.audit.log 中也会记录真实的客户端 IP。
