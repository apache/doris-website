---
{
    "title": "ODBC 外表使用教程（一）：MySQL + Ubuntu",
    "description": "详细介绍如何在 Ubuntu 系统下，使用 ODBC 外表功能连接 MySQL 数据库",
    "date": "2022-01-01",
    "metaTitle": "ODBC 外表使用教程（一）",
    "isArticle": true,
    "language": "zh-CN",
    "author": "张家锋",
    "layout": "Article",
    "sidebar": true,
    "categories": "PracticalCases"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

之前写了在Centos下Apache Doris 外表使用方法及注意实现，但是不少用户是使用ubuntu系统，在这个系统下很多用户遇到ODBC外表导致BE服务宕机的问题，对此我专门在ubuntu 18.04下进行了测试。

[[toc]]

## 1.软件环境

1. 操作系统：ubuntu 18.04
2. Apache Doris ：0.15
3. mysql 数据库：8.0.27-0ubuntu0.20.04.1 for Linux on x86_64
4. UnixODBC：2.3.4
5. Mysql Connector ODBC ：5.3.13、8.0.11

## 2.安装ODBC驱动

首先我们安装unixODBC驱动、这里直接给出驱动的下载地址及安装命令

```shell
$> sudo wget ftp://ftp.unixodbc.org/pub/unixODBC/unixODBC-2.3.4.tar.gz 
$> tar -xvzf unixODBC-2.3.4.tar.gz 
$> cd unixODBC-2.3.4/
$> sudo ./configure --prefix=/usr/local/unixODBC-2.3.7 --includedir=/usr/include --libdir=/usr/lib -bindir=/usr/bin --sysconfdir=/etc
$> make
$> sudo make install
```

安装成功后，unixODBC所需的头文件都被安装到了/usr/inlucde下，编译好的库文件安装到了/usr/lib下，与unixODBC相关的可执行文件安装到了/usr/bin下，配置文件放到了/etc下。

验证安装是否成功

```
$> odbcinst -j
unixODBC 2.3.4
DRIVERS............: /etc/odbcinst.ini
SYSTEM DATA SOURCES: /etc/odbc.ini
FILE DATA SOURCES..: /etc/ODBCDataSources
USER DATA SOURCES..: /root/.odbc.ini
SQLULEN Size.......: 8
SQLLEN Size........: 8
SQLSETPOSIROW Size.: 8
```

## 3.安装Mysql ODBC驱动

**这里我默认你是知道Mysql的安装方法，或者你已经有了Mysql数据库**，对Mysql的安装配置就不在讲了，如果这块不清楚，请自行搜索。

从mysql 站点下载对应的驱动

https://dev.mysql.com/downloads/connector/odbc/

这里我们可以使用 8.0.11 和 5.3.13 版本。本文使用 8.0.11 版本进行说明。（8.0.26 版本有兼容性问题，请勿使用。后面有说明）

`mysql-connector-odbc-8.0.11-linux-glibc2.12-x86-64bit.tar.gz`

下载后解压，我这里为了测试方便，直接将解压后的目录重命名使用了，没有将这个目录下的bin和lib拷贝到/usr/local/目录下，具体的操作命令：

```shell
tar zxvf mysql-connector-odbc-8.0.11-linux-glibc2.12-x86-64bit.tar.gz
mv mysql-connector-odbc-8.0.11-linux-glibc2.12-x86-64bit mysql-odbc-8.0.11
```

注册Mysql驱动

```
myodbc-installer -a -d -n "MySQL ODBC 8.0.11 Unicode Driver" -t "Driver=/root/mysql-odbc-8.0.11/lib/libmyodbc8w.so"
myodbc-installer -a -d -n "MySQL ODBC 8.0.11 ANSI Driver" -t "Driver=/root/mysql-odbc-8.0.11/lib/libmyodbc8a.so"
```

然后查看是否注册成功

使用这个命令：myodbc-installer -d -l

```myodbc-installer -d -l
MySQL ODBC 5.0 Unicode Driver
MySQL ODBC 5.0 ANSI Driver
MySQL ODBC 8.0 Unicode Driver
MySQL ODBC 8.0
MySQL ODBC 8.0.11 Unicode Driver
MySQL ODBC 8.0.11 ANSI Driver
```

这里我安装了上面说的三个版本的驱动，另外两个版本的驱动安装方式一样

## 4.验证通过ODBC访问Mysql

我们去配置ODBC访问Mysql的参数

编辑/etc/odbc.ini文件，加入下面的内容，将信息替换成你自己的

```
[mysql]
Description     = Data source MySQL
Driver          = MySQL ODBC 8.0 Unicode Driver
Server          = localhost
Host            = localhost
Database        = demo
Port            = 3306
User            = root
Password        = zhangfeng
```

然后我们通过：

isql -v mysql

```sql
isql -v mysql
+---------------------------------------+
| Connected!                            |
|                                       |
| sql-statement                         |
| help [tablename]                      |
| quit                                  |
|                                       |
+---------------------------------------+
```

说明我们ODBC配置成功。

## 5.测试Apache Doris ODBC外表

Doris的安装配置参考我的博客：[Apache Doris安装部署](https://mp.weixin.qq.com/s/pnZgya-DcjhaktedIQcBOA)，或者官网的文档。

首先我们在Mysql数据库见了一个demo库及相应的表

```sql
CREATE TABLE `test_cdc` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=91234 DEFAULT CHARSET=utf8mb4;
```

对应的测试数据

```sql
INSERT INTO `test_cdc` VALUES (123, 'this is a update');
INSERT INTO `test_cdc` VALUES (1212, '测试flink CDC');
INSERT INTO `test_cdc` VALUES (1234, '这是测试');
INSERT INTO `test_cdc` VALUES (11233, 'zhangfeng_1');
INSERT INTO `test_cdc` VALUES (21233, 'zhangfeng_2');
INSERT INTO `test_cdc` VALUES (31233, 'zhangfeng_3');
INSERT INTO `test_cdc` VALUES (41233, 'zhangfeng_4');
INSERT INTO `test_cdc` VALUES (51233, 'zhangfeng_5');
INSERT INTO `test_cdc` VALUES (61233, 'zhangfeng_6');
INSERT INTO `test_cdc` VALUES (71233, 'zhangfeng_7');
INSERT INTO `test_cdc` VALUES (81233, 'zhangfeng_8');
INSERT INTO `test_cdc` VALUES (91233, 'zhangfeng_9');
```

下面建Doris的ODBC外表，这里我们是通过ODBC_Resource来创建ODBC外表，这也是推荐的方式，这样ODBC resource是可以复用

首先我们在BE节点的conf/odbcinst.ini，添加我们的刚才注册的8.0.21的ODBC驱动（[MySQL ODBC 8.0.21]）。

注意这里我们使用 `libmyodbc8w.so` 而不是 `libmyodbc8a.so`。因为 Doris 目前仅支持 Unicode Driver，不支持 ANSI Driver。

```
[MySQL ODBC 8.0.11]
Description     = ODBC for MySQL
Driver=/root/mysql-odbc-8.0.11/lib/libmyodbc8w.so
FileUsage       = 1
```

首先我们创建resource

```sql
 CREATE EXTERNAL RESOURCE `mysql_8_0_11`
 PROPERTIES (
"host" = "localhost",
 "port" = "3306",
 "user" = "root",
 "password" = "zhangfeng",
 "database" = "demo",
 "table" = "test_cdc",
 "driver" = "MySQL ODBC 8.0.11",  --注意这里的名称要和我们上面红框标识部分的[]里的名称一致
 "odbc_type" = "mysql",
 "type" = "odbc_catalog"
 );
```

基于这个resource创建ODBC外表

```、sql
CREATE EXTERNAL TABLE `test_odbc_8_0_11` (
  `id` int NOT NULL ,
  `name` varchar(255) null
) ENGINE=ODBC
COMMENT "ODBC"
PROPERTIES (
"odbc_catalog_resource" = "mysql_8_0_11", --这里的名称就是我们上面定义的resource的名称
"database" = "demo",
"table" = "test_cdc"
);
```

执行结果

```sql
mysql> use demo;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed

mysql>  CREATE EXTERNAL RESOURCE `mysql_8_0_11`
    ->  PROPERTIES (
    -> "host" = "localhost",
    ->  "port" = "3306",
    ->  "user" = "root",
    ->  "password" = "zhangfeng",
    ->  "database" = "demo",
    ->  "table" = "test_cdc",
    ->  "driver" = "MySQL ODBC 8.0.11",
    ->  "odbc_type" = "mysql",
    ->  "type" = "odbc_catalog"
    ->  );
Query OK, 0 rows affected (0.01 sec)

mysql>  CREATE EXTERNAL TABLE `test_odbc_8_0_11` (
    ->   `id` int NOT NULL ,
    ->   `name` varchar(255) null
    -> ) ENGINE=ODBC
    -> COMMENT "ODBC"
    -> PROPERTIES (
    -> "odbc_catalog_resource" = "mysql_8_0_11",
    -> "database" = "demo",
    -> "table" = "test_cdc"
    -> );
Query OK, 0 rows affected (0.01 sec)
```

一切显示正常，下面是见证奇迹的时候，我们执行查询外表操作

```sql
select * from test_odbc_8_0_11;
+-------+------------------+
| id    | name             |
+-------+------------------+
|   123 | this is a update |
|  1212 | 测试flink CDC    |
|  1234 | 这是测试         |
| 11233 | zhangfeng_1      |
| 21233 | zhangfeng_2      |
| 31233 | zhangfeng_3      |
| 41233 | zhangfeng_4      |
| 51233 | zhangfeng_5      |
| 61233 | zhangfeng_6      |
| 71233 | zhangfeng_7      |
| 81233 | zhangfeng_8      |
| 91233 | zhangfeng_9      |
+-------+------------------+
12 rows in set (0.01 sec)
```

可以看到，查询正常。至此，完成安装。

同样，我们也可以使用 5.3.13 进行测试。同样可以正常工作。

## 6.不兼容的 Driver 版本

如果我们使用了不兼容的 MySQL Driver，如 8.0.26，则当查询 ODBC 外表时，可能出现以下错误：

```sql
select * from test_odbc_8_0_26;
ERROR 1064 (HY000): errCode = 2, detailMessage = there is no scanNode Backend. [10002: in black list(io.grpc.StatusRuntimeException: UNAVAILABLE: Network closed for unknown reason)]
```

这个时候显示BE节点挂了，我们通过show backends命令去查看也是显示BE节点挂了

```
mysql> show backends\G;
*************************** 1. row ***************************
            BackendId: 10002
              Cluster: default_cluster
                   IP: 172.16.192.81
        HeartbeatPort: 9050
               BePort: 9060
             HttpPort: 8040
             BrpcPort: 8060
        LastStartTime: 2021-12-31 10:43:16
        LastHeartbeat: 2021-12-31 11:03:00
                Alive: false
 SystemDecommissioned: false
ClusterDecommissioned: false
            TabletNum: 0
     DataUsedCapacity: 0.000
        AvailCapacity: 83.224 GB
        TotalCapacity: 98.305 GB
              UsedPct: 15.34 %
       MaxDiskUsedPct: 15.34 %
                  Tag: {"location" : "default"}
               ErrMsg:
              Version: 0.15.1-rc09-Unknown
               Status: {"lastSuccessReportTabletsTime":"2021-12-31 11:02:22","lastStreamLoadTime":-1}
1 row in set (0.00 sec)
```

查看BE的日志（be.out）会发现有如下类似错误堆栈：

```
*** Aborted at 1640918068 (unix time) try "date -d @1640918068" if you are using GNU date ***
PC: @     0x7f8caaf29b7e (unknown)
*** SIGSEGV (@0x0) received by PID 56420 (TID 0x7f8c62370700) from PID 0; stack trace: ***
    @          0x3022682 google::(anonymous namespace)::FailureSignalHandler()
    @     0x7f8cab0f93c0 (unknown)
    @     0x7f8caaf29b7e (unknown)
    @          0x34ef4ac getrn
    @          0x34ef722 lh_insert
    @          0x34abd14 OBJ_NAME_add
    @     0x7f8c09f9d115 ossl_init_ssl_base_ossl_
    @     0x7f8cab0f647f __pthread_once_slow
    @     0x7f8c0a3af194 CRYPTO_THREAD_run_once
    @     0x7f8c09f9cf87 OPENSSL_init_ssl
    @     0x7f8c0a77e504 ssl_start()
    @     0x7f8c0a751f55 mysql_server_init
    @     0x7f8c0a75c425 mysql_init
    @     0x7f8c0a72cbcd DBC::connect()
    @     0x7f8c0a72f403 MySQLDriverConnect()
    @     0x7f8c0a74ea08 SQLDriverConnectW
    @          0x3b060ec SQLDriverConnect
    @          0x1ec046b doris::ODBCConnector::open()
    @          0x1eb9706 doris::OdbcScanNode::open()
    @          0x189e6e9 doris::PlanFragmentExecutor::open_internal()
    @          0x189fb4c doris::PlanFragmentExecutor::open()
    @          0x181b70e doris::FragmentExecState::execute()
    @          0x181f706 doris::FragmentMgr::_exec_actual()
    @          0x1828d4f std::_Function_handler<>::_M_invoke()
    @          0x198a963 doris::ThreadPool::dispatch_thread()
    @          0x1984aac doris::Thread::supervise_thread()
    @     0x7f8cab0ed609 start_thread
    @     0x7f8caaec5293 clone
    @                0x0 (unknown)
```

这是因为驱动版本不兼容导致。所以在 Ubuntu 环境下，建议使用 MySQL Driver 8.0.11 或 5.3.13 这两个版本。