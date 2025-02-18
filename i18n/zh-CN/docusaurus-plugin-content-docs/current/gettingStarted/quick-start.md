---
{
    "title": "快速体验 Apache Doris",
    "language": "zh-CN"
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

:::caution 警告：

以下快速部署方法**仅用于本地开发和测试**，**请勿用于生产环境**。原因如下：

1. **数据易丢失：** Docker 部署在容器销毁时会丢失数据；手动部署单副本实例不具备数据冗余备份能力，机器宕机可能导致数据丢失。

2. **单副本配置：** 示例中的建表语句均为单副本，生产环境应使用多副本存储数据，以保证数据可靠性。

:::

## 使用 Docker 快速部署

自 Doris 2.1.8 版本后，可以使用 Docker 进行快速部署。

### 第 1 步：创建 docker-compose.yaml 文件

复制以下内容到 docker-compose.yaml 文件中，并将 DORIS_QUICK_START_VERSION 替换为指定的 Doris 版本，例如 3.0.1。

```text
version: "3"
services:
  fe:
    image: apache/doris.fe-ubuntu:${DORIS_QUICK_START_VERSION}
    hostname: fe
    environment:
     - FE_SERVERS=fe1:127.0.0.1:9010
     - FE_ID=1
    network_mode: host
  be:
    image: apache/doris.be-ubuntu:${DORIS_QUICK_START_VERSION}
    hostname: be
    environment:
     - FE_SERVERS=fe1:127.0.0.1:9010
     - BE_ADDR=127.0.0.1:9050
    depends_on:
      - fe
    network_mode: host
```

### 第 2 步：启动集群

使用 docker-compose 命令启动集群

```shell
docker-compose -f ./docker-compose.yaml up -d
```

### 第 3 步：使用 MySQL 客户端连接集群，并检查集群状态

```sql
## 检查 FE 状态，确定 Join 与 Alive 列均为 true
mysql -uroot -P9030 -h127.0.0.1 -e 'SELECT `host`, `join`, `alive` FROM frontends()'
+-----------+------+-------+
| host      | join | alive |
+-----------+------+-------+
| 127.0.0.1 | true | true  |
+-----------+------+-------+

## 检查 BE 状态，确定 Alive 列为 true
mysql -uroot -P9030 -h127.0.0.1 -e 'SELECT `host`, `alive` FROM backends()'
+-----------+-------+
| host      | alive |
+-----------+-------+
| 127.0.0.1 |     1 |
+-----------+-------+

```



## 本地快速部署

:::info 环境建议：

*   **操作系统：** 推荐使用 CentOS 7.1 或 Ubuntu 16.04 以上版本的 AMD/ARM 主流 Linux 环境。

*   **Java 环境：** 建议使用 Java 8 运行环境。如果是非 Oracle JDK 商业授权用户，请使用免费的 OpenJDK 8u300 以后版本。

*   **用户权限：** 建议在 Linux 上新建一个 Doris 用户，避免使用 root 用户进行操作。

:::

### 第 1 步：下载二进制包

从 Apache Doris 网站 [下载页面](https://doris.apache.org/zh-CN/download) 下载对应的 Doris 二进制安装包，并解压到指定目录。

### 第 2 步：修改环境变量

1. **修改系统最大打开文件句柄数**

   通过以下命令可以调整最大文件句柄数。在调整后，需要重启会话以生效配置：

   ```sql
   vi /etc/security/limits.conf 
   * soft nofile 1000000
   * hard nofile 1000000
   ```

2. **修改虚拟内存区域**

   通过以下命令可以永久修改虚拟内存区域至少为 2000000，并立即生效：

   ```bash
   cat >> /etc/sysctl.conf << EOF
   vm.max_map_count = 2000000
   EOF

   ## Take effect immediately
   sudo sysctl -p
   ```

### 第 3 步：安装 FE

1. **配置 FE**

   编辑 FE 配置文件 apache-doris/fe/conf/fe.conf，修改以下参数：

   ```sql
   ## 指定 Java 环境
   JAVA_HOME=/home/doris/jdk

   # 指定 FE 监听 IP 的 CIDR 网段
   priority_networks=127.0.0.1/32
   ```

2. **启动 FE**

   执行 start_fe.sh 脚本启动 FE 进程：

   ```sql
   apache-doris/fe/bin/start_fe.sh --daemon
   ```

3. **检查 FE 状态**

   使用 MySQL 客户端连接集群，并检查集群状态：

   ```sql
   ## 检查 FE 状态，确定 Join 与 Alive 列均为 true
   mysql -uroot -P9030 -h127.0.0.1 -e "show frontends;"
   +-----------------------------------------+-----------+-------------+----------+-----------+---------+----------+----------+-----------+------+-------+-------------------+---------------------+----------+--------+-------------------------+------------------+
   | Name                                    | Host      | EditLogPort | HttpPort | QueryPort | RpcPort | Role     | IsMaster | ClusterId | Join | Alive | ReplayedJournalId | LastHeartbeat       | IsHelper | ErrMsg | Version                 | CurrentConnected |
   +-----------------------------------------+-----------+-------------+----------+-----------+---------+----------+----------+-----------+------+-------+-------------------+---------------------+----------+--------+-------------------------+------------------+
   | fe_9d0169c5_b01f_478c_96ab_7c4e8602ec57 | 127.0.0.1 | 9010        | 8030     | 9030      | 9020    | FOLLOWER | true     | 656872880 | true | true  | 276               | 2024-07-28 18:07:39 | true     |        | doris-2.0.12-2971efd194 | Yes              |
   +-----------------------------------------+-----------+-------------+----------+-----------+---------+----------+----------+-----------+------+-------+-------------------+---------------------+----------+--------+-------------------------+------------------+
   ```

### 第 4 步：安装 BE

1. **配置 BE**

   修改 BE 配置文件 `apache-doris/be/conf/be.conf` 的以下内容：

   ```sql
   ## 指定 Java 环境
   JAVA_HOME=/home/doris/jdk

   # 指定 FE 监听 IP 的 CIDR 网段
   priority_networks=127.0.0.1/32
   ```

2. **启动 BE**

   通过以下命令启动 BE 进程：

   ```sql
   apache-doris/fe/bin/start_be.sh --daemon
   ```

3. **在集群中注册 BE 节点**

   使用 MySQL 客户端连接 Doris：

   ```sql
   mysql -uroot -P9030 -h127.0.0.1
   ```

   使用 ADD BACKEND 命令注册 BE 节点：

   ```sql
   ALTER SYSTEM ADD BACKEND "127.0.0.1:9050";
   ```

4. **检查 BE 状态**

   使用 MySQL 客户端连接集群，并检查集群状态：

   ```sql
   ## 检查 BE 状态，确定 Alive 列为 true
   mysql -uroot -P9030 -h127.0.0.1 -e "show backends;"
   +-----------+-----------+---------------+--------+----------+----------+---------------------+---------------------+-------+----------------------+-----------+------------------+--------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-------------------------+-------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+
   | BackendId | Host      | HeartbeatPort | BePort | HttpPort | BrpcPort | LastStartTime       | LastHeartbeat       | Alive | SystemDecommissioned | TabletNum | DataUsedCapacity | TrashUsedCapcacity | AvailCapacity | TotalCapacity | UsedPct | MaxDiskUsedPct | RemoteUsedCapacity | Tag                      | ErrMsg | Version                 | Status                                                                                                                        | HeartbeatFailureCounter | NodeRole |
   +-----------+-----------+---------------+--------+----------+----------+---------------------+---------------------+-------+----------------------+-----------+------------------+--------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-------------------------+-------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+
   | 10156     | 127.0.0.1 | 9050          | 9060   | 8040     | 8060     | 2024-07-28 17:59:14 | 2024-07-28 18:08:24 | true  | false                | 14        | 0.000            | 0.000              | 8.342 GB      | 19.560 GB     | 57.35 % | 57.35 %        | 0.000              | {"location" : "default"} |        | doris-2.0.12-2971efd194 | {"lastSuccessReportTabletsTime":"2024-07-28 18:08:14","lastStreamLoadTime":-1,"isQueryDisabled":false,"isLoadDisabled":false} | 0                       | mix      |
   +-----------+-----------+---------------+--------+----------+----------+---------------------+---------------------+-------+----------------------+-----------+------------------+--------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-------------------------+-------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+
   ```

## 运行查询

1. **使用 MySQL 客户端连接集群**

   ```sql
   mysql -uroot -P9030 -h127.0.0.1
   ```

2. **创建数据库与测试表**

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
   DISTRIBUTED BY HASH(k1) BUCKETS 1;
   ```

3. **导入测试数据**

   使用 Insert Into 语句插入测试数据

   ```sql
   insert into mytable values
   (1,0.14,'a1',20),
   (2,1.04,'b2',21),
   (3,3.14,'c3',22),
   (4,4.35,'d4',23);
   ```

4. **在 MySQL 客户端中执行以下 SQL 语句可以查看到已导入的数据：**

   ```sql
   MySQL [demo]> select * from demo.mytable;
   +------+------+------+------+
   | k1   | k2   | k3   | k4   |
   +------+------+------+------+
   |    1 | 0.14 | a1   |   20 |
   |    2 | 1.04 | b2   |   21 |
   |    3 | 3.14 | c3   |   22 |
   |    4 | 4.35 | d4   |   23 |
   +------+------+------+------+
   4 rows in set (0.10 sec)
   ```





