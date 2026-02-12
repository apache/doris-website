---
{
    "title": "快速体验",
    "language": "zh-CN"
}

---

这个简短的指南将告诉你如何下载 Apache Doris 最新稳定版本，在单节点上安装并运行它，包括创建数据库、数据表、导入数据及查询等。

## 环境准备

-   选择一个 x86-64 上的主流 Linux 环境，推荐 CentOS 7.1 或者 Ubuntu 16.04 以上版本。更多运行环境请参考安装部署部分。

-   Java 8 运行环境（非 Oracle JDK 商业授权用户，建议使用免费的 Oracle JDK 8u202，[立即下载](https://www.oracle.com/java/technologies/javase/javase8-archive-downloads.html#license-lightbox)）。

-   建议在 Linux 上新建一个 Doris 用户。请避免使用 Root 用户，以防对操作系统误操作。

## 下载二进制包

从 doris.apache.org 下载相应的 Apache Doris 安装包，并且解压。

```shell
# 下载 Apache Doris 二进制安装包
server1:~ doris$ wget https://download.selectdb.com/apache-doris-2.0.12-bin-x64.tar.gz

# 解压安装包
server1:~ doris$ tar zxf apache-doris-2.0.12-bin-x64.tar.gz

# 目录重命名为更为简单的 apache-doris 
server1:~ doris$ mv apache-doris-2.0.12-bin-x64 apache-doris
```

## 安装 Doris

### 配置 FE

FE 的配置文件为 `apache-doris/fe/conf/fe.conf`。下面是一些需要关注的核心配置。除了 JAVA_HOME, 需要手动增加，并且指向你的 JDK8 运行环境。其它配置，可以使用默认值，即可支持单机快速体验。

```Plain
# 增加 JAVA_HOME 配置，指向 JDK8 的运行环境。假如我们 JDK8 位于 /home/doris/jdk8, 则设置如下
JAVA_HOME=/home/doris/jdk8

# FE 监听 IP 的 CIDR 网段。默认设置为空，有 Apache Doris 启动时自动选择一个可用网段。如有多个网段，需要指定一个网段，可以类似设置 priority_networks=192.168.0.0/24
# priority_networks =

# FE 元数据存放的目录，默认是在 DORIS_HOME 下的 doris-meta 目录。已经创建，可以更改为你的元数据存储路径。
# meta_dir = ${DORIS_HOME}/doris-meta
```

### 启动 FE

在 apache-doris/fe 下，运行下面命令启动 FE。

```shell
# 将 FE 启动成后台运行模式，这样确保退出终端后，进程依旧运行。
server1:apache-doris/fe doris$ ./bin/start_fe.sh --daemon
```

### 配置 BE

BE 的配置文件为 `apache-doris/be/conf/be.conf`。下面是一些需要关注的核心配置。除了 JAVA_HOME, 需要手动增加，并且指向你的 JDK8 运行环境。其它配置，可以使用默认值，即可支持我们的快速体验。

```Plain
# 增加 JAVA_HOME 配置，指向 JDK8 的运行环境。假如我们 JDK8 位于 /home/doris/jdk8, 则设置如下
JAVA_HOME=/home/doris/jdk8

# BE 监听 IP 的 CIDR 网段。默认设置为空，有 Apache Doris 启动时自动选择一个可用网段。如有多个网段，需要指定一个网段，可以类似设置 priority_networks=192.168.0.0/24
# priority_networks =

# BE 数据存放的目录，默认是在 DORIS_HOME 下的 storage 下，默认已经创建，可以更改为你的数据存储路径
# storage_root_path = ${DORIS_HOME}/storage
```

### 启动 BE

在 apache-doris/be 下，运行下面命令启动 BE。

```shell
# 将 BE 启动成后台运行模式，这样确保退出终端后，进程依旧运行。
server1:apache-doris/be doris$ ./bin/start_be.sh --daemon
```

### 连接 Apache Doris FE

通过 MySQL 客户端来连接 Apache Doris FE，下载免安装的 [MySQL 客户端](https://dev.mysql.com/downloads/mysql/)。

解压刚才下载的 MySQL 客户端，在 `bin/` 目录下可以找到 `mysql` 命令行工具。然后执行下面的命令连接 Apache Doris。

```shell
mysql -uroot -P9030 -h127.0.0.1
```

:::caution 注意

-   这里使用的 Root 用户是 Apache Doris 内置的超级管理员用户，具体的用户权限查看 [认证和鉴权](../admin-manual/auth/authentication-and-authorization.md)
-   -P：这里是我们连接 Apache Doris 的查询端口，默认端口是 9030，对应的是 fe.conf 里的 `query_port`
-   -h：这里是我们连接的 FE IP 地址，如果你的客户端和 FE 安装在同一个节点可以使用 127.0.0.1。

:::

### 将 BE 节点添加到集群

在 MySQL 客户端执行类似下面的 SQL，将 BE 添加到集群中

```sql
 ALTER SYSTEM ADD BACKEND "be_host_ip:heartbeat_service_port";
```

:::caution 注意

1.  be_host_ip：要添加 BE 的 IP 地址

2.  heartbeat_service_port：要添加 BE 的心跳上报端口，可以查看 `be.conf` 里的 `heartbeat_service_port`，默认是 `9050`。

3.  通过 show backends 语句可以查看新添加的 BE 节点。

:::

### 修改 Root 用户和 Admin 用户的密码

在 MySQL 客户端，执行类似下面的 SQL，为 Root 用户和 Admin 用户设置新密码

```sql
mysql> SET PASSWORD FOR 'root' = PASSWORD('doris-root-password');                                                                                                                                                                                   
Query OK, 0 rows affected (0.01 sec)                                                                                                                                                                                                       
                                                                                                                                                                                                                                           
mysql> SET PASSWORD FOR 'admin' = PASSWORD('doris-admin-password');                                                                                                                                                                                 
Query OK, 0 rows affected (0.00 sec)        
```

:::tip
Root 用户和 Admin 用户的区别

Root 用户和 Admin 用户都属于 Apache Doris 安装完默认存在的 2 个账户。其中 Root 用户拥有整个集群的超级权限，可以对集群完成各种管理操作，比如添加节点，去除节点。Admin 用户没有管理权限，是集群中的 Superuser，拥有除集群管理相关以外的所有权限。建议只有在需要对集群进行运维管理超级权限时才使用 Root 权限。
:::

## 建库建表

### 连接 Apache Doris

使用 Admin 账户连接 Apache Doris FE。

```shell
mysql -uadmin -P9030 -h127.0.0.1
```

:::tip
如果是在 FE 的同一台机器上的 MySQL 客户端连接 127.0.0.1, 不需要输入密码。
:::

### 创建数据库和数据表

```sql
create database demo;

use demo; 
create table mytable
(
    k1 TINYINT,
    k2 DECIMAL(10, 2) DEFAULT "10.05",    
    k3 CHAR(10) COMMENT "string column",    
    k4 INT NOT NULL DEFAULT "1" COMMENT "int column"
) 
COMMENT "my first table"
DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES ('replication_num' = '1');
```

### 导入数据

将以下示例数据，保存在本地的 data.csv：

```Plaintext
1,0.14,a1,20
2,1.04,b2,21
3,3.14,c3,22
4,4.35,d4,23
```

通过 Stream Load 方式将上面保存到文件中的数据导入到刚才创建的表里。

```shell
curl  --location-trusted -u admin:admin_password -T data.csv -H "column_separator:," http://127.0.0.1:8030/api/demo/mytable/_stream_load
```

-   -T data.csv : 要导入的数据文件名

-   -u admin:admin_password : Admin 账户与密码

-   127.0.0.1:8030 : 分别是 FE 的 IP 和 http_port

执行成功之后我们可以看到下面的返回信息：

```shell
{                                                     
    "TxnId": 30,                                  
    "Label": "a56d2861-303a-4b50-9907-238fea904363",        
    "Comment": "",                                       
    "TwoPhaseCommit": "false",                           
    "Status": "Success",                                 
    "Message": "OK",                                    
    "NumberTotalRows": 4,                                
    "NumberLoadedRows": 4,                               
    "NumberFilteredRows": 0,                             
    "NumberUnselectedRows": 0,                          
    "LoadBytes": 52,                                     
    "LoadTimeMs": 206,                                    
    "BeginTxnTimeMs": 13,                                
    "StreamLoadPutTimeMs": 141,                           
    "ReadDataTimeMs": 0,                                 
    "WriteDataTimeMs": 7,                                
    "CommitAndPublishTimeMs": 42                         
} 
```

-   `NumberLoadedRows`: 表示已经导入的数据记录数

-   `NumberTotalRows`: 表示要导入的总数据量

-   `Status`: Success 表示导入成功

### 查询数据

在 MySQL 客户端中，执行如下 SQL，可以查询到刚才导入的数据：

```sql
mysql> select * from mytable;                                                                                                                                                                                                              
+------+------+------+------+                                                                                                                                                                                                              
| k1   | k2   | k3   | k4   |                                                                                                                                                                                                              
+------+------+------+------+                                                                                                                                                                                                              
|    1 | 0.14 | a1   |   20 |                                                                                                                                                                                                              
|    2 | 1.04 | b2   |   21 |                                                                                                                                                                                                              
|    3 | 3.14 | c3   |   22 |                                                                                                                                                                                                              
|    4 | 4.35 | d4   |   23 |                                                                                                                                                                                                              
+------+------+------+------+                                                                                                                                                                                                              
4 rows in set (0.01 sec)       
```

## 停止 Apache Doris

### 停止 FE

在 apache-doris/fe 下，运行下面命令停止 FE。

```shell
server1:apache-doris/fe doris$ ./bin/stop_fe.sh
```

### 停止 BE

在 apache-doris/be 下，运行下面命令停止 BE。

```shell
server1:apache-doris/be doris$ ./bin/stop_be.sh
```
