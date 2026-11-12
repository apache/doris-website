---
{
    "title": "Балансировка нагрузки FE",
    "language": "ru",
    "description": "Варианты балансировки нагрузки для развёртываний Doris с несколькими FE: JDBC, Nginx, HAProxy, ProxySQL, NJet, а также передача IP-адреса клиента с помощью Proxy Protocol.",
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

Пользователи подключаются к Doris по протоколу MySQL через порт запросов FE (`query_port`, по умолчанию `9030`). Если развёрнуто несколько узлов FE, перед ними можно разместить слой балансировки нагрузки, чтобы обеспечить высокую доступность точки входа для запросов к Doris и распределять подключения.

В этом документе описаны пять вариантов балансировки нагрузки для Doris и объясняется, как передавать реальный IP-адрес клиента через прокси с помощью Proxy Protocol.

## Сценарии применения {#applicable-scenarios}

| Сценарий | Рекомендуемый вариант | Описание |
|------|----------|------|
| Приложения подключаются к Doris напрямую через JDBC, без отдельного прокси, требующего обслуживания | JDBC URL | Балансировка нагрузки на стороне клиента без дополнительных компонентов |
| Уже используется инфраструктура Nginx и требуется обратное проксирование на уровне TCP | Nginx | Универсальный обратный TCP-прокси с простой настройкой |
| Требуется высокопроизводительный TCP-прокси с проверками работоспособности | HAProxy | Специализированный балансировщик нагрузки TCP/HTTP с широким набором стратегий проверки работоспособности |
| Требуется прокси с поддержкой протокола MySQL (управление подключениями, разделение чтения и записи и т. д.) | ProxySQL | Прокси базы данных, разработанный для протокола MySQL |
| Требуются динамическое управление составом узлов FE и активные проверки работоспособности с помощью SQL | NJet | TCP-прокси с дополнительными API управления |
| Необходимо сохранить реальный IP-адрес клиента за балансировщиком нагрузки | Proxy Protocol | Используется совместно с Nginx или HAProxy |

## Предварительные требования {#prerequisites}

- Развёрнуто не менее 2 узлов FE, и каждый процесс FE прослушивает `query_port` (по умолчанию `9030`).
- Прокси-сервер имеет сетевой доступ ко всем узлам FE.
- Выбран порт для прокси-службы (в этом документе в качестве примера используется `6030`).
- Если требуется Proxy Protocol, версия Doris должна поддерживать Proxy Protocol V1 (доступен начиная с версии 2.1.1).

## Пример топологии кластера {#example-cluster-topology}

В этом документе для демонстрации используются следующие три узла FE:

```text
192.168.1.101:9030
192.168.1.102:9030
192.168.1.103:9030
```

Узел, на котором работает прокси-сервер:

```text
192.168.1.100
```

## Варианты балансировки нагрузки {#load-balancing-options}

### Вариант 1: JDBC URL {#option-1-jdbc-url}

<!-- Knowledge type: Configuration parameter -->
<!-- Applicable scenario: Application-side load balancing -->

Используйте встроенную в JDBC URL возможность балансировки нагрузки. MySQL Connector/J распределяет подключения между узлами FE и переключает их при сбоях на стороне клиента.

```text
jdbc:mysql:loadbalance://192.168.1.101:9030,192.168.1.102:9030,192.168.1.103:9030/test_db
```

Подробные сведения о настройке см. в [официальной документации MySQL](https://dev.mysql.com/doc/connector-j/en/connector-j-usagenotes-j2ee-concepts-managing-load-balanced-connections.html).

### Вариант 2: Nginx {#option-2-nginx}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenario: General-purpose TCP reverse proxy -->

Используйте возможности обратного TCP-проксирования [Nginx](https://nginx.org/) (модуль `stream`) для балансировки нагрузки Doris.

#### Установка Nginx {#install-nginx}

Выполните установку, следуя [официальной документации Nginx по установке](https://nginx.org/en/docs/install.html). В следующем примере показано, как скомпилировать и установить Nginx 1.18.0 в Ubuntu:

1. Установите зависимости для сборки:

    ```shell
    sudo apt-get install build-essential
    sudo apt-get install libpcre3 libpcre3-dev
    sudo apt-get install zlib1g-dev
    sudo apt-get install openssl libssl-dev
    ```

2. Скачайте и скомпилируйте Nginx:

    ```shell
    sudo wget http://nginx.org/download/nginx-1.18.0.tar.gz
    sudo tar zxvf nginx-1.18.0.tar.gz
    cd nginx-1.18.0
    sudo ./configure --prefix=/usr/local/nginx --with-stream --with-http_ssl_module --with-http_gzip_static_module --with-http_stub_status_module
    sudo make && make install
    ```

    :::tip

    Обязательно укажите `--with-stream` при компиляции; иначе Nginx не будет поддерживать обратное TCP-проксирование.

    :::

#### Настройка обратного прокси {#configure-the-reverse-proxy}

1. Создайте новый файл конфигурации:

    ```shell
    vim /usr/local/nginx/conf/default.conf
    ```

2. Добавьте следующее содержимое:

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

    Основные параметры конфигурации:

    | Параметр | Описание |
    |--------|------|
    | `stream` | Контекст обратного TCP-прокси; требуется модуль stream для Nginx |
    | `upstream mysqld` | Пул серверных узлов FE. `hash $remote_addr consistent` выполняет согласованное хеширование по IP-адресу клиента |
    | `weight` | Вес узла; узел с большим весом получает больше подключений |
    | `max_fails` / `fail_timeout` | Параметры проверки работоспособности. Если число сбоев за период `fail_timeout` превышает `max_fails`, узел помечается как недоступный |
    | `listen 6030` | Порт, прослушиваемый прокси-службой |
    | `proxy_connect_timeout` / `proxy_timeout` | Тайм-ауты подключения и сеанса |

#### Запуск Nginx {#start-nginx}

Запустите Nginx с указанным файлом конфигурации:

```shell
cd /usr/local/nginx
/usr/local/nginx/sbin/nginx -c conf.d/default.conf
```

#### Проверка {#verify}

Подключитесь через порт прокси:

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

### Вариант 3: HAProxy {#option-3-haproxy}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenario: High-performance TCP load balancing -->

[HAProxy](https://www.haproxy.org/) — высокопроизводительный балансировщик нагрузки TCP/HTTP, написанный на C.

#### Установка HAProxy {#install-haproxy}

1. Скачайте HAProxy (адрес для скачивания: <https://src.fedoraproject.org/repo/pkgs/haproxy/>).

2. Распакуйте архив:

    ```shell
    tar -zxvf haproxy-2.6.15.tar.gz -C /opt/
    mv haproxy-2.6.15 haproxy
    cd haproxy
    ```

3. Скомпилируйте и установите:

    ```shell
    yum install gcc gcc-c++ -y
    make TARGET=linux-glibc PREFIX=/usr/local/haproxy
    make install PREFIX=/usr/local/haproxy
    ```

#### Настройка HAProxy {#configure-haproxy}

1. Настройте правила журналирования syslog.

    Откройте файл конфигурации:

    ```shell
    vim /etc/rsyslog.d/haproxy.conf
    ```

    Содержимое:

    ```text
    $ModLoad imudp
    $UDPServerRun 514
    local0.* /usr/local/haproxy/logs/haproxy.log
    &~
    ```

2. Включите удалённое журналирование:

    ```shell
    vim /etc/sysconfig/rsyslog
    ```

    Добавьте следующее содержимое:

    ```text
    SYSLOGD_OPTIONS="-c 2 -r -m 0"
    ```

    Описание параметров:

    | Параметр | Описание |
    |------|------|
    | `-c 2` | Использовать режим совместимости; значение по умолчанию — `-c 5` |
    | `-r` | Включить удалённое журналирование |
    | `-m 0` | Интервал временных отметок в минутах; `0` отключает эту функцию |

    Примените изменения:

    ```shell
    systemctl restart rsyslog
    ```

3. Отредактируйте файл конфигурации балансировки нагрузки:

    ```shell
    vim /usr/local/haproxy/haproxy.cfg
    ```

    Содержимое:

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

    Основные параметры конфигурации:

    | Параметр | Описание |
    |--------|------|
    | `frontend agent-front` | Точка входа, привязанная к порту `6030` и работающая в режиме TCP |
    | `backend forward-fe` | Пул серверных узлов FE с циклическим алгоритмом распределения (`roundrobin`) |
    | `check inter 3000 rise 2 fall 3` | Проверка работоспособности выполняется каждые `3000ms`; после `2` успешных проверок подряд узел помечается как доступный, после `3` неудачных проверок подряд — как недоступный |

#### Запуск HAProxy {#start-haproxy}

1. Запустите службу:

    ```shell
    /opt/haproxy/haproxy -f /usr/local/haproxy/haproxy.cfg
    ```

2. Проверьте состояние службы:

    ```shell
    netstat -lnatp | grep -i haproxy
    ```

#### Проверка {#verify-1}

```shell
mysql -h 192.168.1.100 -uroot -P6030 -p
```

### Вариант 4: ProxySQL {#option-4-proxysql}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenario: MySQL protocol-aware proxy -->

[ProxySQL](https://proxysql.com/) — прокси для баз данных MySQL с открытым исходным кодом, написанный на C. Он обеспечивает управление подключениями, разделение чтения и записи, балансировку нагрузки и переключение при сбоях, отличается высокой производительностью, гибкостью настройки и возможностями динамического управления. Его часто используют в веб-сервисах, платформах больших данных и облачных базах данных.

#### Установка ProxySQL {#install-proxysql}

Выполните установку, следуя [официальной документации ProxySQL](https://proxysql.com/documentation/installing-proxysql/).

#### Настройка ProxySQL {#configure-proxysql}

В состав ProxySQL входят файл конфигурации `/etc/proxysql.cnf` и файл базы данных конфигурации `/var/lib/proxysql/proxysql.db`.

:::caution

Если файл `proxysql.db` существует в каталоге `/var/lib/proxysql`, служба ProxySQL читает и разбирает `proxysql.cnf` только при первом запуске; при последующих запусках этот файл не читается.

Чтобы изменения в `proxysql.cnf` вступили в силу после перезапуска, сначала необходимо удалить `/var/lib/proxysql/proxysql.db`, а затем перезапустить службу. Это равнозначно запуску с инициализацией: создаётся новый файл `proxysql.db`, а исходные правила конфигурации удаляются.

:::

Основное содержимое `proxysql.cnf` приведено ниже:

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

#### Подключение к административной базе данных ProxySQL {#connect-to-the-proxysql-admin-database}

Подключитесь к ProxySQL через административный порт (`6032`):

```shell
mysql -uadmin -padmin -P6032 -hdoris01
```

Просмотрите встроенные базы данных и таблицы:

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

#### Настройка серверных узлов Doris FE {#configure-the-backend-doris-fe}

С помощью операторов `INSERT` добавьте узлы FE и порты, к которым будет обращаться прокси, в таблицу `mysql_servers`.

:::note

Значение `hostgroup_id`, равное `10`, обозначает группу записи, а `20` — группу чтения. Здесь разделение чтения и записи не требуется, поэтому значение можно задать произвольно.

:::

1. Подключитесь к административному порту:

    ```shell
    mysql -uadmin -padmin -P6032 -h127.0.0.1
    ```

2. Добавьте узлы FE:

    ```sql
    ProxySQL > insert into mysql_servers(hostgroup_id,hostname,port) values(10,'192.168.0.101',9030);
    Query OK, 1 row affected (0.000 sec)

    ProxySQL > insert into mysql_servers(hostgroup_id,hostname,port) values(10,'192.168.0.102',9030);
    Query OK, 1 row affected (0.000 sec)

    ProxySQL > insert into mysql_servers(hostgroup_id,hostname,port) values(10,'192.168.0.103',9030);
    Query OK, 1 row affected (0.000 sec)
    ```

3. Проверьте добавленные строки:

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

4. Если при вставке возникает ошибка нарушения ограничения уникальности:

    ```text
    ERROR 1045 (#2800): UNIQUE constraint failed: mysql_servers.hostgroup_id, mysql_servers.hostname, mysql_servers.port
    ```

    Такая конфигурация уже была задана. Можно очистить таблицу или удалить существующую запись для этого узла:

    ```sql
    ProxySQL > select * from mysql_servers;
    ProxySQL > delete from mysql_servers;
    Query OK, 6 rows affected (0.000 sec)
    ```

5. Примените конфигурацию в рабочей среде и сохраните её на диск:

    ```sql
    ProxySQL > load mysql servers to runtime;
    Query OK, 0 rows affected (0.006 sec)

    ProxySQL > save mysql servers to disk;
    Query OK, 0 rows affected (0.348 sec)
    ```

#### Настройка мониторинга узлов Doris FE {#configure-monitoring-for-doris-fe-nodes}

После добавления узлов Doris FE необходимо также настроить мониторинг этих серверных узлов.

1. Создайте пользователя для мониторинга в Doris:

    ```shell
    mysql -uroot -P9030 -h192.168.0.101
    ```

    ```sql
    Doris > create user monitor@'192.168.0.100' identified by 'P@ssword1!';
    Query OK, 0 rows affected (0.03 sec)

    Doris > grant ADMIN_PRIV on *.* to monitor@'192.168.0.100';
    Query OK, 0 rows affected (0.02 sec)
    ```

2. Вернитесь на узел прокси ProxySQL и настройте мониторинг:

    ```shell
    mysql -uadmin -padmin -P6032 -h127.0.0.1
    ```

    ```sql
    ProxySQL > set mysql-monitor_username='monitor';
    Query OK, 1 row affected (0.000 sec)

    ProxySQL > set mysql-monitor_password='P@ssword1!';
    Query OK, 1 row affected (0.000 sec)
    ```

3. Сохраните конфигурацию:

    ```sql
    ProxySQL > load mysql servers to runtime;
    Query OK, 0 rows affected (0.006 sec)

    ProxySQL > save mysql servers to disk;
    Query OK, 0 rows affected (0.348 sec)
    ```

#### Проверка результатов мониторинга {#verify-monitoring-results}

Метрики мониторинга ProxySQL хранятся в базе данных `monitor`.

Просмотрите журнал мониторинга подключений:

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

Просмотрите журнал мониторинга heartbeat:

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

### Вариант 5: NJet {#option-5-njet}

[OpenNJet](https://github.com/OpenNJet/OpenNJet) обеспечивает TCP-проксирование, динамическое управление upstream и дополнительные активные проверки работоспособности MySQL. В следующем примере используются те же адреса прокси и узлов FE, что и в предыдущих разделах.

Прокси распределяет **подключения**. Установленный сеанс MySQL остаётся на одном узле FE; прокси не распределяет отдельные операторы SQL и не выполняет повторно прерванные запросы. Эти настройки относятся к порту MySQL узлов FE. Stream Load использует конечную точку HTTP и может перенаправлять запросы на BE; клиент должен иметь доступ к адресу, возвращаемому при таком перенаправлении.

#### Подготовка NJet и файлов конфигурации {#prepare-njet-and-the-configuration-files}

В примере используется официальный образ `tmlake/njet:4.0.2.0` с префиксом установки `/usr/local/njet`. Этот образ предназначен для Linux/AMD64; на хостах ARM используйте подходящий образ или настройте эмуляцию. Для установки без контейнера см. [краткое руководство по OpenNJet](https://njet.org.cn/docs/quickstart/) и скорректируйте пути к модулям и файлам конфигурации в соответствии с вашей установкой.

Сохраните следующие два файла в одном каталоге. Адреса FE должны быть доступны из контейнера.

**`njet.conf` (плоскость данных):**

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

Блок `http` инициализирует модули плоскости данных, используемые API управления, хотя трафик Doris передаётся через `stream`. Вспомогательный процесс использует `conf/njet_ctrl.conf`; отдельные файлы `conf/ctrl.conf` или `conf/mqtt.conf` в этом примере не используются.

**`njet_ctrl.conf` (плоскость управления):**

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

Модуль проверки работоспособности MySQL необходимо загрузить явно. API управления прослушивает loopback-адрес внутри контейнера; в примерах доступ к нему осуществляется через `docker exec`.

#### Запуск и проверка {#start-and-verify}

Выполните команду из каталога, содержащего оба файла конфигурации:

```shell
docker run -d --name doris-njet \
  --platform linux/amd64 \
  --cap-add=NET_ADMIN --cap-add=DAC_READ_SEARCH \
  -p 6030:6030 \
  -v "$PWD/njet.conf:/usr/local/njet/conf/njet.conf:ro" \
  -v "$PWD/njet_ctrl.conf:/usr/local/njet/conf/njet_ctrl.conf:ro" \
  tmlake/njet:4.0.2.0
```

Проверьте оба файла и просмотрите список серверных узлов:

```shell
docker exec doris-njet njet -t
docker exec doris-njet curl --max-time 10 -sS \
  http://127.0.0.1:8081/api/v1/upstream_api/stream/upstreams/mysqld/servers/
```

Команда `njet -t` сообщает об успешной проверке обоих файлов конфигурации. API возвращает HTTP 200 и массив JSON с тремя настроенными узлами FE. Подключитесь через прокси, заменив `doris_user` на существующую учётную запись Doris:

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

Основные настройки:

| Настройка | Пример | Действие |
| --- | --- | --- |
| `zone` | `mysqld 128k` | Общее состояние, необходимое для динамического управления upstream. |
| `hash` | `$remote_addr consistent` | Распределяет новые подключения с помощью согласованного хеширования IP-адреса клиента. Клиенты с одним исходным IP-адресом могут попадать на один и тот же узел FE. |
| `max_fails` / `fail_timeout` | `2` / `60s` | Пассивное обнаружение сбоев подключений к серверным узлам. Эта настройка не включает активные проверки с помощью SQL. |
| `listen` | `6030` | Порт прокси для протокола MySQL. Docker публикует его с помощью `-p 6030:6030`. |
| `proxy_connect_timeout` / `proxy_timeout` | `5s` / `300s` | Тайм-аут подключения к серверному узлу и тайм-аут бездействия прокси. Подберите значения с учётом требований к запросам и сеансам. |

#### Динамическое добавление и удаление FE {#dynamically-add-and-remove-an-fe}

Чтобы добавить FE, отправьте запрос:

```shell
docker exec doris-njet curl --max-time 10 -i \
  -H 'Content-Type: application/json' \
  -d '{"server":"192.168.1.104:9030","weight":2,"max_fails":1,"fail_timeout":"5s"}' \
  http://127.0.0.1:8081/api/v1/upstream_api/stream/upstreams/mysqld/servers/
```

API возвращает HTTP 201 и сведения о новом участнике, включая присвоенный ему `id`. Для исходной конфигурации из трёх участников первый новый участник получает ID 3. При удалении используйте фактически возвращённый ID:

```shell
docker exec doris-njet curl --max-time 10 -i -X DELETE \
  http://127.0.0.1:8081/api/v1/upstream_api/stream/upstreams/mysqld/servers/3
```

Удаление возвращает HTTP 200; последующий запрос GET больше не содержит этого участника в списке. Перед повторным созданием контейнера приведите файлы конфигурации в соответствие с нужным составом узлов.

#### Настройка активных проверок работоспособности MySQL {#configure-active-mysql-health-checks}

Для активных проверок с помощью SQL необходимо явно задать конфигурацию через API и иметь рабочую учётную запись и базу данных Doris. Выполните следующие команды от имени администратора Doris, заменив пароль:

```sql
CREATE DATABASE IF NOT EXISTS health_check_db;
CREATE USER IF NOT EXISTS 'njet_health'@'%' IDENTIFIED BY '<replace-with-password>';
GRANT SELECT_PRIV ON health_check_db.* TO 'njet_health'@'%';
```

Используйте тот же пароль в запросе ниже. Для порта FE без TLS параметр `useSsl` имеет значение `false`; задавайте `true` только в том случае, если на прослушиваемом порту FE настроен TLS.

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

При успешной настройке возвращается HTTP 200 с `{"code":0,"msg":"success"}`. При последующих проверках выполняются аутентификация, выбор настроенной базы данных и запрос `select 1` к каждому узлу FE.

| Поле | Обязательность / значение по умолчанию | Описание |
| --- | --- | --- |
| `interval`, `jitter`, `timeout` | В этом примере задаются явно | Интервал проверок, случайное смещение таймера и тайм-аут, заданные как длительности. |
| `passes`, `fails` | В этом примере задаются явно | Число успешных или неудачных проверок подряд, необходимое для изменения состояния работоспособности. |
| `port` | Необязательное; порт сервера upstream | Переопределяет порт, используемый для проверок. |
| `sql.select` | Задаётся явно | Оператор SQL для проверки FE. |
| `sql.useSsl` | Необязательное; в NJet по умолчанию `true` | Должно соответствовать настройке TLS на прослушиваемом порту FE. |
| `sql.user`, `sql.password` | Задаются для учётной записи Doris | Учётные данные, используемые механизмом проверки работоспособности. |
| `sql.db` | Обязательное, непустое | Существующая база данных, выбираемая при проверке. |

Если время ожидания ответа API истекает, проверьте пути вспомогательного процесса и блок `http` плоскости данных. Если проверка работоспособности завершается неудачно, проверьте базу данных, учётные данные, сетевую доступность и настройку TLS; сам по себе успешный ответ на запрос настройки не подтверждает работоспособность FE. Дополнительные сведения см. в [исходном коде и документации OpenNJet](https://github.com/OpenNJet/OpenNJet) и описании [формата конфигурации JSON](https://njet.org.cn/cases/njet_support_json/).

## Передача IP-адреса клиента (Proxy Protocol) {#client-ip-forwarding-proxy-protocol}

<!-- Knowledge type: Configuration parameter / Operational procedure -->
<!-- Applicable scenario: Allow lists / Audit / Access control -->

В большинстве случаев при подключении клиента к Doris через прокси-службу сведения об IP-адресе клиента теряются, и сервер Doris может получить только IP-адрес прокси-сервера.

Начиная с версии 2.1.1, Doris поддерживает [Proxy Protocol](https://www.haproxy.org/download/1.8/doc/proxy-protocol.txt). Благодаря этому протоколу Doris может получать реальный IP-адрес клиента и после балансировки нагрузки, что позволяет управлять доступом на основе IP-адресов клиентов, в том числе использовать списки разрешённых адресов и аудит.

В следующих разделах описано, как включить Proxy Protocol в Doris, Nginx и HAProxy.

### Включение Proxy Protocol в Doris {#enable-proxy-protocol-in-doris}

Добавьте в файл `fe.conf` узла FE следующее:

```text
enable_proxy_protocol = true
```

:::note

1. Поддерживается только Proxy Protocol V1.
2. Эта функция применяется только к порту протокола MySQL; она не поддерживает другие протокольные порты, например HTTP и ADBC, и не влияет на них.
3. В версиях Doris до 3.1 после включения этой функции все подключения должны использовать Proxy Protocol, иначе подключение завершается ошибкой. Начиная с версии 3.1, после включения Proxy Protocol по-прежнему можно использовать стандартный протокол подключения MySQL.

:::

### Включение Proxy Protocol в Nginx {#enable-proxy-protocol-in-nginx}

Добавьте `proxy_protocol on;` в раздел `server` файла конфигурации:

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

### Включение Proxy Protocol в HAProxy {#enable-proxy-protocol-in-haproxy}

В разделе `backend` файла `haproxy.cfg` добавьте параметр `send-proxy` в каждую строку `server`:

```text
backend forward-fe
    mode tcp
    balance roundrobin
    server fe-1 192.168.1.101:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
    server fe-2 192.168.1.102:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
    server fe-3 192.168.1.103:9030 weight 1 check inter 3000 rise 2 fall 3 send-proxy
```

### Проверка передачи IP-адреса {#verify-ip-forwarding}

1. Подключитесь к Doris через прокси:

    ```sql
    mysql -uroot -P6030 -h192.168.1.100
    ```

2. Выполните `show processlist` и проверьте столбец `Host`:

    ```sql
    mysql> show processlist;
    +------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
    | CurrentConnected | Id   | User | Host              | LoginTime           | Catalog  | Db   | Command | Time | State | QueryId                           | Info             |
    +------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
    | Yes              |    1 | root | 192.168.1.101:34390 | 2024-03-17 16:32:22 | internal |      | Query   |    0 | OK    | 82edc460d93f4e28-8bbed058a068e259 | show processlist |
    +------------------+------+------+-------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+
    1 row in set (0.00 sec)
    ```

3. Если в столбце `Host` отображается реальный IP-адрес клиента, проверка прошла успешно; в противном случае виден только IP-адрес прокси-службы.

    Реальный IP-адрес клиента также записывается в `fe.audit.log`.

## Часто задаваемые вопросы {#faq}

### Вопрос: при подключении через порт прокси возникает ошибка `Connection refused`? {#q-connecting-through-the-proxy-port-reports-connection-refused}

Прокси-служба не запущена или прослушиваемый порт не соответствует конфигурации. Проверьте, что процесс прокси работает, и с помощью `netstat -lnatp` убедитесь, что он прослушивает нужный порт.

### Вопрос: подключения устанавливаются, но иногда завершаются по тайм-ауту? {#q-connections-succeed-but-occasionally-time-out}

Один из серверных узлов FE неработоспособен или задан слишком короткий тайм-аут прокси. Проверьте настройки `proxy_timeout` / `timeout server` и состояние серверных узлов в журнале проверок работоспособности.

### Вопрос: Nginx не запускается и сообщает об ошибке `unknown directive "stream"`? {#q-nginx-fails-to-start-with-unknown-directive-stream}

Модуль stream не был включён при компиляции. Повторно скомпилируйте Nginx с параметром `--with-stream`.

### Вопрос: изменения в файле `proxysql.cnf` для ProxySQL не вступают в силу после перезапуска? {#q-proxysql-changes-to-proxysqlcnf-do-not-take-effect-after-restart}

Файл `proxysql.db` уже существует, а файл конфигурации читается только при первом запуске. Удалите `/var/lib/proxysql/proxysql.db`, затем перезапустите службу.

### Вопрос: при вставке в `mysql_servers` в ProxySQL возникает ошибка `UNIQUE constraint failed`? {#q-inserting-into-mysql_servers-in-proxysql-reports-unique-constraint-failed}

В таблице уже существует запись с таким сочетанием `hostgroup_id` + `hostname` + `port`. Очистите таблицу или удалите существующую запись перед вставкой.

### Вопрос: клиенты не могут подключиться после включения Proxy Protocol (версии до 3.1)? {#q-clients-fail-to-connect-after-enabling-proxy-protocol-versions-before-31}

Эта версия Doris требует использования Proxy Protocol для каждого подключения, а стандартные клиенты MySQL с ним несовместимы. Обновитесь до версии 3.1 или более поздней либо всегда подключайтесь через прокси, поддерживающий Proxy Protocol.

### Вопрос: `show processlist` по-прежнему показывает IP-адрес прокси? {#q-show-processlist-still-shows-the-proxy-ip}

В Doris не включён параметр `enable_proxy_protocol` или на стороне прокси не настроены `proxy_protocol on` / `send-proxy`. Проверьте конфигурацию FE и включение Proxy Protocol на стороне прокси.
