---
{
    "title": "手动部署存算一体集群",
    "language": "zh-CN",
    "description": "在完成前置检查及规划后，如环境检查、操作系统检查、集群规划，可以开始部署集存算一体集群。"
}
---

在完成前置检查及规划后，如[环境检查](../preparation/env-checking.md)、[操作系统检查](../preparation/os-checking.md)、[集群规划](../preparation/cluster-planning.md)，可以开始部署集存算一体集群。

存算一体集群架构如下，部署存算一体集群分为四步：

![存算一体架构](/images/getting-started/apache-doris-technical-overview.png)

1. **部署 FE Master 节点**：部署第一个 FE 节点作为 Master 节点；
  
2. **部署 FE 集群**：部署 FE 集群，添加 Follower 或 Observer FE 节点；
  
3. **部署 BE 节点**：向 FE 集群中注册 BE 节点；

4. **验证集群正确性**：部署完成后连接并验证集群正确性。

在开始部署操作前，可以[下载](https://doris.apache.org/download)对应的 Doris 版本。

## 第 1 步：部署 FE Master 节点

1. **创建元数据路径**

   在部署 FE 时，建议与 BE 节点数据存储在不同的硬盘上。

   在解压安装包时，会默认附带 doris-meta 目录，建议为元数据创建独立目录，并将其软连接到默认的 `doris-meta` 目录。生产环境应使用单独的 SSD 硬盘，不建议将其放在 Doris 安装目录下；开发和测试环境可以使用默认配置。

   ```SQL
   ## Use a separate disk for FE metadata
   mkdir -p <doris_meta_created>
      
   ## Create FE metadata directory symlink
   ln -s <doris_meta_created> <doris_meta_original>
   ```

2. **修改 FE 配置文件**

   FE 的配置文件在 FE 部署路径下的 conf 目录中，启动 FE 节点前需要修改 `conf/fe.conf`。

    在部署 FE 节点之前，建议调整以下配置：

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

   参数解释如下，更多详细配置项请参考 [FE 配置项](../../admin-manual/config/fe-config)：

   | 参数                                                         | 修改建议                                                  |
      | ------------------------------------------------------------ | --------------------------------------------------------- |
      | JAVA_OPTS                                                    | 指定参数 `-Xmx` 调整 Java Heap，生产环境建议 16G 以上。   |
      | [lower_case_table_names ](../../admin-manual/config/fe-config#lower_case_table_names) | 设置大小写敏感，建议调整为 1，即大小写不敏感。            |
      | [priority_networks ](../../admin-manual/config/fe-config#priority_networks) | 网络 CIDR，更具网络 IP 地址指定。在 FQDN 环境中可以忽略。 |
      | JAVA_HOME                                                    | 建议 Doris 使用独立于操作系统的 JDK 环境。                |
   
3. **启动 FE 进程**

   通过以下命令可以启动 FE 进程

   ```Shell
   bin/start_fe.sh --daemon
   ```

   FE 进程将在后台启动，日志默认保存在 `log/` 目录。如果启动失败，可通过查看 `log/fe.log` 或 `log/fe.out` 文件获取错误信息。

4. **检查 FE 启动状态**

   通过 MySQL 客户端连接 Doris 集群，初始化用户为 `root`，默认密码为空。

   ```SQL

   mysql -uroot -P<fe_query_port> -h<fe_ip_address>

   ```

   链接到 Doris 集群后，可以通过 `show frontends` 命令查看 FE 的状态，通常要确认以下几项

   - Alive 为 `true` 表示节点存活；

   - Join 为 `true` 表示节点加入到集群中，但不代表当前还在集群内（可能已失联）；

   - IsMaster 为 true 表示当前节点为 Master 节点。

## 第 2 步：部署 FE 集群（可选）

生产环境建议至少部署 3 个节点。在部署过 FE Master 节点后，需要再部署两个 FE Follower 节点。

1. **创建元数据目录**

   参考部署 FE Master 节点，创建 doris-meta 目录

2. **修改 FE Follower 节点配置文件**

   参考部署 FE Master 节点，修改 FE Follower 节点配置文件。通常情况下，可以直接复制 FE Master 节点的配置文件。

3. **在 Doris 集群中注册新的 FE Follower 节点**

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
   :::
4. **启动 FE Follower 节点**

   通过以下命令，可以启动 FE Follower 节点，并自动同步元数据。

   ```Shell
   bin/start_fe.sh --helper <helper_fe_ip>:<fe_edit_log_port> --daemon
   ```

   其中，helper_fe_ip 是 FE 集群中任何存活节点的 IP 地址。`--helper` 参数仅在第一次启动 FE 时需要，之后重启无需指定。

5. **判断 Follower 节点状态**

   与 FE Master 节点状态判断相同，添加 Follower 节点后，可通过 `show frontends` 命令查看节点状态，IsMaster 应为 false。

## 第 3 步：部署 BE 节点

1. **创建数据目录**

   BE 进程应用于数据的计算与存储。数据目录默认放在 `be/storage` 下。生产环境通常将 BE 数据与 BE 部署文件分别存储在不同的硬盘上。BE 支持数据分布在多盘上以更好的利用多块硬盘的 I/O 能力。

   ```Bash
   ## Create a BE data storage directory on each data disk
   mkdir -p <be_storage_root_path>
   ```

2. **修改 BE 配置文件**

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
   | [priority_networks](../../admin-manual/config/be-config#priority_networks) | 网络 CIDR，更具网络 IP 地址指定。在 FQDN 环境中可以忽略。 |
   | JAVA_OPTS                                                    | 指定参数 `-Xmx` 调整 Java Heap，生产环境建议 2G 以上。   |
   | JAVA_HOME                                                    | 建议 Doris 使用独立于操作系统的 JDK 环境。                |

3. **在 Doris 中注册 BE 节点**

   在启动 BE 节点前，需要先在 FE 集群中注册该节点：

   ```Bash
   ## connect a alive FE node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
      
   ## registe BE node
   ALTER SYSTEM ADD BACKEND "<be_ip_address>:<be_heartbeat_service_port>"
   ```

4. **启动 BE 进程**

   通过以下命令可以启动 BE 进程：

   ```Bash
   bin/start_be.sh --daemon
   ```

   BE 进程在后台启动，日志默认保存在 `log/` 目录。如果启动失败，请检查 `log/be.log` 或 `log/be.out` 文件以获取错误信息。

5. **查看 BE 启动状态**

   连接 Doris 集群后，可通过 `show backends` 命令查看 BE 节点的状态。

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

1. **登录数据库**

   使用 MySQL 客户端登录 Doris 集群。

   ```Bash
   ## connect a alive fe node
   mysql -uroot -P<fe_query_port> -h<fe_ip_address>
   ```

2. **检查 Doris 安装信息**

   通过 `show frontends` 与 `show backends` 可以查看数据库各实例的信息。
   
   ```SQL
   -- check fe status
   show frontends \G

   -- check be status
   show backends \G
   ```

4. **修改 Doris 集群密码**

   在创建 Doris 集群时，系统会自动创建一个名为 `root` 的用户，并默认设置其密码为空。为了提高安全性，建议在集群创建后立即为 `root` 用户设置一个新密码。

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

5. **创建测试表并插入数据**

   为了验证集群的正确性，可以在新创建的集群中创建一个测试表，并插入测试数据。

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

   Doris 兼容 MySQL 协议，可以使用 `INSERT` 语句插入数据。

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
