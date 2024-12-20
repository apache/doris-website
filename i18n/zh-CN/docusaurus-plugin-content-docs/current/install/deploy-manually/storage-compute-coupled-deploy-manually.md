---
{
    "title": "手动部署存算一体集群",
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
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## 第 1 步：部署 FE Master 节点

1. 创建元数据路径

   在部署 FE 时，建议与 BE 节点数据存储在不同的硬盘上。

   在解压安装包时，会默认附带 doris-meta 目录，建议可以创建独立的元数据目录并创建该目录到 `doris-meta` 的软连接。生产环境强烈建议单独指定目录不要放在 Doris 安装目录下，最好是单独的 SSD 硬盘，测试开发环境可以使用默认配置。

   ```SQL
   ## Use a separate disk for FE metadata
   mkdir -p <doris_meta_created>
      
   ## Create FE metadata directory symlink
   ln -s <doris_meta_original> <doris_meta_created>
   ```

2. 修改 FE 配置文件

   FE 的配置文件在 FE 部署路径下的 conf 目录中，启动 FE 节点前需要修改 `conf/fe.conf`。

    在部署 FE 节点前，建议修改以下参数：

   ```Bash
   ## modify Java Heap
   JAVA_OPTS="-Xmx16384m -XX:+UseMembar -XX:SurvivorRatio=8 -XX:MaxTenuringThreshold=7 -XX:+PrintGCDateStamps -XX:+PrintGCDetails -XX:+UseConcMarkSweepGC -XX:+UseParNewGC -XX:+CMSClassUnloadingEnabled -XX:-CMSParallelRemarkEnabled -XX:CMSInitiatingOccupancyFraction=80 -XX:SoftRefLRUPolicyMSPerMB=0 -Xloggc:$DORIS_HOME/log/fe.gc.log.$DATE"
      
   ## modify case sensitivity
   lower_case_table_names = 1
     
   ## modify network CIDR 
   priority_networks = 10.1.3.0/24
      
   ## modify Java Home
   JAVA_HOME = <your-java-home-path>
   ```
   
   参数解释如下，更多详细参数参考 [FE 配置项](https://doris.apache.org/zh-CN/docs/admin-manual/config/fe-config)：

   | 参数                                                         | 修改建议                                                  |
      | ------------------------------------------------------------ | --------------------------------------------------------- |
      | JAVA_OPTS                                                    | 指定参数 `-Xmx` 调整 Java Heap，生产环境建议 16G 以上。   |
      | [lower_case_table_names ](https://doris.apache.org/zh-CN/docs/admin-manual/config/fe-config#lower_case_table_names) | 设置大小写敏感，建议调整为 1，即大小写不敏感。            |
      | [priority_networks ](https://doris.apache.org/zh-CN/docs/admin-manual/config/fe-config#priority_networks) | 网络 CIDR，更具网络 IP 地址指定。在 FQDN 环境中可以忽略。 |
      | JAVA_HOME                                                    | 建议 Doris 使用独立于操作系统的 JDK 环境。                |
   
3. 启动 FE 进程

   通过以下命令可以启动 FE 进程

   ```Shell
   bin/start_fe.sh --daemon
   ```

   FE 进程启动进入后台执行。日志默认存放在 `log/` 目录下。如启动失败，可以通过查看 `log/fe.log` 或者 log/fe.out 查看错误信息。

4. 检查 FE 启动状态

   通过 MySQL Client 可以链接 Doris 集群。初始化用户为 `root`，密码为空。

   ```SQL
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   ```

   链接到 Doris 集群后，可以通过 `show frontends` 命令查看 FE 的状态，通常要确认以下几项

   - Alive 为 true 表示节点存活；

   - Join 为 true 表示节点加入到集群中，但不代表当前还在集群内（可能已失联）；

   - IsMaster 为 true 表示当前节点为 Master 节点。

## 第 2 步：部署 FE 集群（可选）

在生产集群中，建议至少部署 3 个 Follower 节点。在部署过 FE Master 节点后，需要再部署两个 FE Follower 节点。

1. 创建元数据目录

   参考部署 FE Master 节点，创建 doris-meta 目录

2. 修改 FE Follower 节点配置文件

   参考部署 FE Master 节点，修改 FE 配置文件。通常情况下，可以直接复制 FE Master 节点的配置文件。

3. 在 Doris 集群中注册新的 FE Follower 节点

   在启动新的 FE 节点前，需要先在 FE 集群中注册新的 FE 节点。

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   
   ## registe a new FE follower node
   ALTER SYSTEM ADD FOLLOWER "<fe_ip_address>:<fe_edit_log_port>"
   ```

   如果要添加 observer 节点，可以使用 `ADD OBSERVER` 命令

   ```Bash
   ## register a new FE observer node
   ALTER SYSTEM ADD OBSERVER "<fe_ip_address>:<fe_edit_log_port>"
   ```

   :::caution 注意
   - FE Follower（包括 Master）节点的数量建议为奇数，建议部署 3 个组成高可用模式。

   - 当 FE 处于高可用部署时（1 个 Master，2 个 Follower），我们建议通过增加 Observer FE 来扩展 FE 的读服务能力

   - 通常一个 FE 节点可以应对 10-20 台 BE 节点。建议总的 FE 节点数量在 10 个以下
   :::
4. 启动 FE Follower 节点

   通过以下命令，可以启动 FE Follower 节点，并自动同步元数据。

   ```Shell
   bin/start_fe.sh --helper <helper_fe_ip>:<fe_edit_log_port> --daemon
   ```

   其中，helper_fe_ip 为当前 FE 集群中任一存活的节点。`--helper` 参数只应用于第一次启动 FE 时同步元数据，后续重启 FE 的操作不需要指定。

5. 判断 Follower 节点状态

   与判断 FE Master 节点状态的方式相同，添加注册 FE Follower 节点后需要通过 `show frontends` 命令查看 FE 节点状态。与 Master 状态不同，`IsMaster` 的状态应为 false。

## 第 3 步：部署 BE 节点

1. 创建数据目录

   BE 进程应用于数据的计算与存储。数据目录默认放在 `be/storage` 下。在生产环境中，通常使用独立的硬盘来存储数据，将 BE 数据与 BE 的部署文件置于不同的硬盘中。BE 支持数据分布在多盘上以更好的利用多块硬盘的 I/O 能力。

   ```Bash
   ## Create a BE data storage directory on each data disk
   mkdir -p <be_storage_root_path>
   ```

2. 修改 BE 配置文件

   BE 的配置文件在 BE 部署路径下的 conf 目录中，启动 BE 节点前需要修改 `conf/be.conf`。

   ```Bash
   ## modify storage path for BE node
   
   storage_root_path=/home/disk1/doris,medium:HDD;/home/disk2/doris,medium:SSD
   
   ## modify network CIDR 
   
   priority_networks = 10.1.3.0/24
   
   ## modify Java Home in be/conf/be.conf
   
   JAVA_HOME = <your-java-home-path>
   ```

   参数解释如下：

   | 参数                                                         | 修改建议                                                  |
   | ------------------------------------------------------------ | --------------------------------------------------------- |
   | [priority_networks](https://doris.apache.org/zh-CN/docs/admin-manual/config/be-config#priority_networks) | 网络 CIDR，更具网络 IP 地址指定。在 FQDN 环境中可以忽略。 |
   | JAVA_OPTS                                                    | 指定参数 `-Xmx` 调整 Java Heap，生产环境建议 16G 以上。   |
   | JAVA_HOME                                                    | 建议 Doris 使用独立于操作系统的 JDK 环境。                |

3. 在 Doris 中注册 BE 节点

   在启动新的 BE 节点前，需要先在 FE 集群中注册新的 BE 节点：

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
      
   ## registe BE node
   ALTER SYSTEM ADD BACKEND "<be_ip_address>:<be_heartbeat_service_port>"
   ```

4. 启动 BE 进程

   通过以下命令可以启动 BE 进程：

   ```Bash
   bin/start_be.sh --daemon
   ```

   BE 进程启动进入后台执行。日志默认存放在 `log/` 目录下。如果启动失败，请检查 `log/be.log` 或 `log/be.out` 文件以获取错误信息。

5. 查看 BE 启动状态

   在链接到 Doris 集群后，通过 show backends 命令查看 BE 的状态。

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
      
   ## check BE node status
   show backends;
   ```

   通常情况下需要注意以下几项状态：

   - Alive 为 true 表示节点存活

   - TabletNum 表示该节点上的分片数量，新加入的节点会进行数据均衡，TabletNum 逐渐趋于平均。

## 第 4 步：验证集群正确性

1. 登录数据库

   通过 MySQL Client 登录 Doris 集群。

   ```Bash
   ## connect a alive fe node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   ```

2. 检查 Doris 安装信息

   通过 `show frontends` 与 `show backends` 可以查看数据库各实例的信息。

   ```SQL
   -- check fe status
   show frontends \G  
        
   -- check be status  
   show backends \G
   ```

3. 修改 Doris 集群密码

   在创建 Doris 集群时，系统会自动创建一个名为 `root` 的用户，并默认设置其密码为空。为了安全起见，建议在集群创建后立即为 `root` 用户设置一个新密码。

   ```SQL
   -- check the current user
   select user();  
   +------------------------+  
   | user()                 |  
   +------------------------+  
   | 'root'@'192.168.88.30' |  
   +------------------------+  
        
   -- modify the password for current user
   SET PASSWORD = PASSWORD('doris_new_passwd');
   ```

4. 创建测试表并插入数据

   为了验证集群的正确性，可以在新创建的集群中创建一个测试表，并插入一些数据。

   ```SQL
   -- create a test database
   create database testdb;
    
   -- create a test table
   CREATE TABLE testdb.table_hash
   (
       k1 TINYINT,
       k2 DECIMAL(10, 2) DEFAULT "10.5",
       k3 VARCHAR(10) COMMENT "string column",
       k4 INT NOT NULL DEFAULT "1" COMMENT "int column"
   )
   COMMENT "my first table"
   DISTRIBUTED BY HASH(k1) BUCKETS 32;
   ```

   Doris 兼容 MySQL 协议，可以使用 insert 语句插入数据。

   ```SQL
   -- insert data
   INSERT INTO testdb.table_hash VALUES
   (1, 10.1, 'AAA', 10),
   (2, 10.2, 'BBB', 20),
   (3, 10.3, 'CCC', 30),
   (4, 10.4, 'DDD', 40),
   (5, 10.5, 'EEE', 50);
   
   -- check the data
   SELECT * from testdb.table_hash;
   +------+-------+------+------+
   | k1   | k2    | k3   | k4   |
   +------+-------+------+------+
   |    3 | 10.30 | CCC  |   30 |
   |    4 | 10.40 | DDD  |   40 |
   |    5 | 10.50 | EEE  |   50 |
   |    1 | 10.10 | AAA  |   10 |
   |    2 | 10.20 | BBB  |   20 |
   +------+-------+------+------+
   ```
