---
{
    "title": "手动部署存算一体集群",
    "sidebar_label": "手动部署存算一体集群",
    "language": "zh-CN",
    "description": "如何在 Linux 环境手动部署 Apache Doris 存算一体集群，包含 FE/BE 节点部署、配置与验证。适用于生产环境集群搭建。",
    "keywords": [
      "部署 Doris",
      "存算一体部署",
      "FE 节点部署",
      "BE 节点部署",
      "Doris 集群搭建",
      "Doris 手动安装"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 集群部署 / 环境验收 -->

部署存算一体集群分为四步：

1. **部署 FE Master 节点**：部署第一个 FE 节点作为 Master 节点；
  
2. **部署 FE 集群（可选）**：部署 FE 集群，添加 Follower 或 Observer FE 节点；
  
3. **部署 BE 节点**：向 FE 集群中注册 BE 节点；

4. **验证集群正确性**：部署完成后连接并验证集群正确性。

在开始部署操作前，可以[下载](https://doris.apache.org/download)对应的 Doris 版本。

## 前置条件

在开始部署前，请确认以下条件已满足：

| 检查项 | 要求 | 相关文档 |
|--------|------|---------|
| 操作系统 | CentOS 7+ / Ubuntu 22.04+ | [操作系统检查](../preparation/os-checking.md) |
| JDK 版本 | JDK 17+ | - |
| 网络 | 节点间互通，端口可访问 | [环境检查](../preparation/env-checking.md) |
| 磁盘空间 | FE 建议 100GB+，BE 建议 500GB+ | [集群规划](../preparation/cluster-planning.md) |

在完成前置检查及规划后，如[环境检查](../preparation/env-checking.md)、[操作系统检查](../preparation/os-checking.md)、[集群规划](../preparation/cluster-planning.md)，可以开始部署集存算一体集群。


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
   | [lower_case_table_names ](../../admin-manual/config/fe-config#lower_case_table_names) | 设置大小写敏感，建议调整为 1，即大小写不敏感。（该参数在集群创建后不能再修改）            |
   | [priority_networks ](../../admin-manual/config/fe-config#priority_networks) | 网络 CIDR，根据网络 IP 地址指定。在 FQDN 环境中可以忽略。 |
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

单 FE 节点可以用于测试验证。生产环境建议至少部署 3 个节点。在部署过 FE Master 节点后，需要再部署两个 FE Follower 节点。

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
   | [priority_networks](../../admin-manual/config/be-config#priority_networks) | 网络 CIDR，根据网络 IP 地址指定。在 FQDN 环境中可以忽略。 |
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
   show frontends;

   -- check be status
   show backends;
   ```

3. **修改 Doris 集群密码**

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

4. **创建测试表并插入数据**

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

---

## 注意事项

- FE 元数据目录建议使用独立的 SSD 硬盘，不建议放在 Doris 安装目录下。
- BE 数据目录可以配置多盘，使用 `storage_root_path` 参数，格式为 `path1,medium:HDD;path2,medium:SSD`。
- 生产环境建议部署 3 个 FE Follower 节点组成高可用模式。
- `lower_case_table_names` 参数在集群创建后不能再修改，请在初始化时确认设置正确。
- `priority_networks` 参数需要根据实际网络配置，确保与节点 IP 所在网段匹配。

## 常见问题

**Q: FE 启动失败如何排查？**

A: 1. 检查 Java 环境：`echo $JAVA_HOME` 确保 JDK 已安装
2. 查看日志：`tail -100 log/fe.log` 查找 `Exception` 或 `ERROR`
3. 常见错误：
   - **端口被占用**：检查 `fe.conf` 中的 `query_port`（默认 9030）是否被占用
   - **元数据目录权限**：确保 `doris-meta` 目录可读写

**Q: BE 无法注册到 FE 集群怎么办？**

A: 1. 确认 FE 集群正常运行：`show frontends` 检查 Alive 状态
2. 检查网络连通性：`telnet <fe_ip> 9030` 测试端口
3. 检查 BE 配置：`be.conf` 中 `priority_networks` 是否与实际 IP 匹配
4. 查看 BE 日志：`tail -100 log/be.log` 查找注册失败原因

**Q: 如何检查集群健康状态？**

A:

```SQL
-- 检查 FE 状态
SHOW FRONTENDS;

-- 检查 BE 状态
SHOW BACKENDS;
-- 确认所有 BE 的 Alive 为 true
```

**Q: 如果忘记 root 密码，如何重置？**

A: 在 FE 节点通过 127.0.0.1 进行连接，可以使用 root 用户免密登录，然后修改密码：

```Bash
mysql -h127.0.0.1 -P9030 -uroot

-- 重置密码
SET PASSWORD = PASSWORD('your_new_password');
```

---

## 故障排查（Troubleshooting）

| 问题现象 | 可能原因 | 解决方案 |
|---------|---------|---------|
| FE 无法启动 | 端口被占用 | 修改 `fe.conf` 中端口或 kill 占用进程 |
| FE 元数据同步失败 | 网络问题或节点失联 | 检查节点间网络，确保 `priority_networks` 配置正确 |
| BE 注册失败 | FE 集群不可用 | 确认 FE 至少有一个节点 Alive |
| BE 显示 Alive 但无 Tablet | 数据均衡未完成 | 等待一段时间，新节点会自动进行数据均衡 |
| 密码修改失败 | 语法错误或权限问题 | 使用 `SET PASSWORD = PASSWORD('new_password')` 语法 |
