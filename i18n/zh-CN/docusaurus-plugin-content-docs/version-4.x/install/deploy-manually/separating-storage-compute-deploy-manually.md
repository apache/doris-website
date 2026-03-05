---
{
    "title": "手动部署存算分离集群",
    "language": "zh-CN",
    "description": "在完成前置检查及规划后，如环境检查、集群规划、操作系统检查后，可以开始部署集群。部署集群分为八步："
}
---

在完成前置检查及规划后，如环境检查、集群规划、操作系统检查后，可以开始部署集群。部署集群分为八步：

1. **准备 FoundationDB 集群**：可以使用已有的 FoundationDB 集群，或新建 FoundationDB 集群；
   
3. **部署 S3 或 HDFS 服务**：可以使用已有的共享存储，或新建共享存储；
   
4. **部署 Meta Service**：为 Doris 集群部署 Meta Service 服务；
   
5. **部署数据回收进程**：为 Doris 集群独立部署数据回收进程，可选操作；
   
6. **启动 FE Master 节点**：启动第一个 FE 节点作为 Master FE 节点；
   
7. **创建 FE Master 集群**：添加 FE Follower/Observer 节点组成 FE 集群；
   
8. **添加 BE 节点**：向集群中添加并注册 BE 节点；
   
9. **添加 Storage Vault**：使用共享存储创建一个或多个 Storage Vault。

在开始部署操作前，可以[下载](https://doris.apache.org/download)相应的 Doris 版本。

## 第 1 步：准备 FoundationDB

本节提供了脚本 `fdb_vars.sh` 和 `fdb_ctl.sh` 配置、部署和启动 FDB（FoundationDB）服务的分步指南。您可以下载 [doris tools](http://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-3.0.2-tools.tar.gz) 并从 `fdb` 目录获取 `fdb_vars.sh` 和 `fdb_ctl.sh`。

:::tip
Doris 默认依赖的 FDB 版本为 7.1.x 系列。若已提前安装 FDB，请确认其版本属于 7.1.x 系列，否则 Meta Service 将启动失败。
:::

1. 机器要求

   通常，至少需要三台配备 SSD 的机器来组成具有双副本、单机故障容忍的 FoundationDB 集群。如果是测试/开发环境，单台机器也能搭建 FoundationDB。

2. 配置 `fdb_vars.sh` 脚本

   在配置 `fdb_vars.sh` 脚本时，必须指定以下配置：

   | 参数             | 描述                             | 类型                           | 示例                                                         | 注意事项                                                     |
   | ---------------- | -------------------------------- | ------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
   | DATA_DIRS        | 指定 FoundationDB 存储的数据目录 | 以逗号分隔的绝对路径列表       | /mnt/foundationdb/data1,/mnt/foundationdb/data2,/mnt/foundationdb/data3 | 运行脚本前确保目录已创建，确保目录已创建，生产环境建议使用 SSD 和独立目录  |
   | FDB_CLUSTER_IPS  | 定义集群 IP                      | 字符串（以逗号分隔的 IP 地址） | 172.200.0.2,172.200.0.3,172.200.0.4                          | 生产集群至少应有 3 个 IP 地址，第一个 IP 地址将用作协调器 - 为高可用性，将机器放置在不同机架上 |
   | FDB_HOME         | 定义 FoundationDB 主目录         | 绝对路径                       | /fdbhome                                                     | 默认路径为 /fdbhome，确保此路径是绝对路径                  |
   | FDB_CLUSTER_ID   | 定义集群 ID                      | 字符串                         | SAQESzbh                                                     | 每个集群的 ID 必须唯一，可使用 mktemp -u XXXXXXXX 生成     |
   | FDB_CLUSTER_DESC | 定义 FDB 集群的描述              | 字符串                         | dorisfdb                                                     | 建议更改为对部署有意义的内容                               |


   可以选择指定以下自定义配置：

   | 参数            | 描述                               | 类型 | 示例               | 注意事项                                         |
   | --------------- | ---------------------------------- | ---- | ------------------ | ------------------------------------------------ |
   | MEMORY_LIMIT_GB | 定义 FDB 进程的内存限制，单位为 GB | 整数 | MEMORY_LIMIT_GB=16 | 根据可用内存资源和 FDB 进程的要求调整此值        |
   | CPU_CORES_LIMIT | 定义 FDB 进程的 CPU 核心限制       | 整数 | CPU_CORES_LIMIT=8  | 根据可用的 CPU 核心数量和 FDB 进程的要求设置此值 |

3. 部署 FDB 集群

   使用 `fdb_vars.sh` 配置环境后，您可以在每个节点上使用 `fdb_ctl.sh` 脚本部署 FDB 集群。

   ```bash
   ./fdb_ctl.sh deploy
   ```

4. 启动 FDB 服务

   FDB 集群部署完成后，您可以使用 `fdb_ctl.sh` 脚本启动 FDB 服务。

   ```bash
   ./fdb_ctl.sh start
   ```
   
   以上命令启动 FDB 服务，使集群工作并获取 FDB 集群连接字符串，后续可以用于配置 MetaService。

   :::caution 注意
   fdb_ctl.sh 脚本中的 clean 命令会清除所有 fdb 元数据信息，可能导致数据丢失，严禁在生产环境中使用！
   :::

## 第 2 步：安装 S3 或 HDFS 服务（可选）

Doris 的存算分离模式依赖于 S3 或 HDFS 服务来存储数据，如果您已经有相关服务，直接使用即可。
如果没有，本文档提供 MinIO 的简单部署教程：

1. 在 MinIO 的[下载页面](https://min.io/download?license=agpl&platform=linux)选择合适的版本以及操作系统，下载对应的 Server 以及 Client 的二进制包或安装包。
2. 启动 MinIO Server

   ```bash
   export MINIO_REGION_NAME=us-east-1
   export MINIO_ROOT_USER=minio # 在较老版本中，该配置为 MINIO_ACCESS_KEY=minio
   export MINIO_ROOT_PASSWORD=minioadmin # 在较老版本中，该配置为 MINIO_SECRET_KEY=minioadmin
   nohup ./minio server /mnt/data 2>&1 &
   ```

3. 配置 MinIO Client

   ```bash
   # 如果你使用的是安装包安装的客户端，那么客户端名为 mcli，直接下载客户端二进制包，则其名为 mc
   ./mc config host add myminio http://127.0.0.1:9000 minio minioadmin
   ```

4. 创建一个桶

   ```bash
   ./mc mb myminio/doris
   ```

5. 验证是否正常工作

   ```bash
   # 上传一个文件
   ./mc mv test_file myminio/doris
   # 查看这个文件
   ./mc ls myminio/doris
   ```

## 第 3 步：Meta Service 部署

1. 配置

   在 `./conf/doris_cloud.conf` 文件中，主要需要修改以下两个参数：

   - `brpc_listen_port`：Meta Service 的监听端口，默认为 5000。
   - `fdb_cluster`：FoundationDB 集群的连接信息，部署 FoundationDB 时可以获取。（如果使用 Doris 提供的 fdb_ctl.sh 部署的话，可在 `$FDB_HOME/conf/fdb.cluster` 文件里获取该值）。

   示例配置：

   ```shell
   brpc_listen_port = 5000
   fdb_cluster = xxx:yyy@127.0.0.1:4500
   ```

   注意：`fdb_cluster` 的值应与 FoundationDB 部署机器上的 `/etc/foundationdb/fdb.cluster` 文件内容一致（如果使用 Doris 提供的 fdb_ctl.sh 部署的话，可在 `$FDB_HOME/conf/fdb.cluster` 文件里获取该值）。

   示例，文件的最后一行就是要填到 doris_cloud.conf 里 fdb_cluster 字段的值：

   ```shell
   cat /etc/foundationdb/fdb.cluster
   
   DO NOT EDIT!
   This file is auto-generated, it is not to be edited by hand.
   cloud_ssb:A83c8Y1S3ZbqHLL4P4HHNTTw0A83CuHj@127.0.0.1:4500
   ```

2. 启动与停止

   在启动前，需要确保已正确设置 `JAVA_HOME` 环境变量，指向 OpenJDK 17，进入 `ms` 目录。

   启动命令如下：

   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --daemon
   ```

   启动脚本返回值为 0 表示启动成功，否则启动失败。启动成功同时标准输出的最后一行文本信息为 "doris_cloud start successfully"。

   停止命令如下：

   ```shell
   bin/stop.sh
   ```

   生产环境中请确保至少有 3 个 Meta Service 节点。



## 第 4 步：数据回收功能独立部署（可选）

::info 信息

Meta Service 本身具备了元数据管理和回收功能，这两个功能可以独立部署，如果需要独立部署数据回收功能，可参考以下步骤。

:::

1. 创建新的工作目录（如 `recycler`），并复制 `ms` 目录内容到新目录：

   ```shell
   cp -r ms recycler
   ```

2. 在新目录的配置文件中修改 BRPC 监听端口 `brpc_listen_port` 和 `fdb_cluster` 的值。

   启动数据回收功能
   
   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --recycler --daemon
   ```

   启动仅元数据操作功能

   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --meta-service --daemon
   ```

## 第 5 步：启动 FE Master 节点

1. 配置 fe.conf 文件

   在 `fe.conf` 文件中，需要配置以下关键参数：

   - `deploy_mode`
     - 描述：指定 doris 启动模式
     - 格式：cloud 表示存算分离模式，其它存算一体模式
     - 示例：`cloud`
   - `cluster_id`
     - 描述：存算分离架构下集群的唯一标识符，不同的集群必须设置不同的 cluster_id。
     - 格式：int 类型
     - 示例：可以使用如下 shell 脚本 `echo $(($((RANDOM << 15)) | $RANDOM))` 生成一个随机 id 使用。
     - 注意：不同的集群必须设置不同的 cluster_id
   - `meta_service_endpoint`
     - 描述：Meta Service 的地址和端口
     - 格式：`IP地址:端口号`
     - 示例：`127.0.0.1:5000`，可以用逗号分割配置多个 meta service。

2. 启动 FE Master 节点

   启动命令：

   ```bash
   bin/start_fe.sh --daemon
   ```

   第一个 FE 进程初始化集群并以 FOLLOWER 角色工作。使用 mysql 客户端连接 FE 使用 `show frontends` 确认刚才启动的 FE 是 master。

## 第 6 步：注册 FE Follower/Observer 节点

其他节点同样根据上述步骤修改配置文件并启动，使用 mysql 客户端连接 Master 角色的 FE，并用以下 SQL 命令添加额外的 FE 节点：

```sql
ALTER SYSTEM ADD FOLLOWER "host:port";
```


将 `host:port` 替换为 FE 节点的实际地址和编辑日志端口。更多信息请参见 [ADD FOLLOWER](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-FOLLOWER) 和 [ADD OBSERVER](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-OBSERVER)。

生产环境中，请确保在 FOLLOWER 角色中的前端（FE）节点总数，包括第一个 FE，保持为奇数。一般来说，三个 FOLLOWER 就足够了。观察者角色的前端节点可以是任意数量。

## 第 7 步：添加 BE 节点

要向集群添加 Backend 节点，请对每个 Backend 执行以下步骤：

1. 配置 be.conf

   在 `be.conf` 文件中，需要配置以下关键参数：
    - deploy_mode
      - 描述：指定 doris 启动模式
      - 格式：cloud 表示存算分离模式，其它存算一体模式
      - 示例：cloud
    - file_cache_path
      - 描述：用于文件缓存的磁盘路径和其他参数，以数组形式表示，每个磁盘一项。path 指定磁盘路径，total_size 限制缓存的大小；-1 或 0 将使用整个磁盘空间。
      - 格式： [{"path":"/path/to/file_cache"，"total_size":21474836480}，{"path":"/path/to/file_cache2"，"total_size":21474836480}]
      - 示例： [{"path":"/path/to/file_cache"，"total_size":21474836480}，{"path":"/path/to/file_cache2"，"total_size":21474836480}]
      - 默认： [{"path":"${DORIS_HOME}/file_cache"}]

3. 启动 BE 进程

   使用以下命令启动 Backend：

   ```bash
   bin/start_be.sh --daemon
   ```

4. 将 BE 添加到集群：

   使用 MySQL 客户端连接到任意 FE 节点：

   ```sql
   ALTER SYSTEM ADD BACKEND "<ip>:<heartbeat_service_port>" [PROTERTIES propertires];
   ```

   将 `<ip>` 替换为新 Backend 的 IP 地址，将 `<heartbeat_service_port>` 替换为其配置的心跳服务端口（默认为 9050）。

   可以通过 PROPERTIES 设置 BE 所在的 计算组。

   更详细的用法请参考 [ADD BACKEND](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND) 和 [REMOVE BACKEND](../../sql-manual/sql-statements/cluster-management/instance-management/DROP-BACKEND)。

5. 验证 BE 状态

   检查 Backend 日志文件（`be.log`）以确保它已成功启动并加入集群。

   您还可以使用以下 SQL 命令检查 Backend 状态：

   ```sql
   SHOW BACKENDS;
   ```

   这将显示集群中所有 Backend 及其当前状态。

## 第 8 步：添加 Storage Vault

Storage Vault 是 Doris 存算分离架构中的重要组件。它们代表了存储数据的共享存储层。您可以使用 HDFS 或兼容 S3 的对象存储创建一个或多个 Storage Vault。可以将一个 Storage Vault 设置为默认 Storage Vault，系统表和未指定 Storage Vault 的表都将存储在这个默认 Storage Vault 中。默认 Storage Vault 不能被删除。以下是为您的 Doris 集群创建 Storage Vault 的方法：

1. 创建 HDFS Storage Vault

   要使用 SQL 创建 Storage Vault，请使用 MySQL 客户端连接到您的 Doris 集群

   ```sql
   CREATE STORAGE VAULT IF_NOT_EXISTS hdfs_vault
       PROPERTIES (
       "type"="hdfs",
       "fs.defaultFS"="hdfs://127.0.0.1:8020"
   );
   ```

2. 创建 S3 Storage Vault

   要使用兼容 S3 的对象存储创建 Storage Vault，请按照以下步骤操作：

   - 使用 MySQL 客户端连接到您的 Doris 集群。
   - 执行以下 SQL 命令来创建 S3 Storage Vault：

   ```sql
   CREATE STORAGE VAULT IF_NOT_EXISTS s3_vault
       PROPERTIES (
       "type"="S3",
       "s3.endpoint"="s3.us-east-1.amazonaws.com",
       "s3.access_key" = "ak",
       "s3.secret_key" = "sk",
       "s3.region" = "us-east-1",
       "s3.root.path" = "ssb_sf1_p2_s3",
       "s3.bucket" = "doris-build-1308700295",
       "provider" = "S3"
   );
   ```

   要在其他对象存储上创建 Storage Vault，请参考 [创建 Storage Vault ](../../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT)。

3. 设置默认 Storage Vault

   使用如下 SQL 语句设置一个默认 Storage Vault。

   ```sql
   SET <storage_vault_name> AS DEFAULT STORAGE VAULT
   ```

## 注意事项

- 仅元数据操作功能的 Meta Service 进程应作为 FE 和 BE 的 `meta_service_endpoint` 配置目标。
- 数据回收功能进程不应作为 `meta_service_endpoint` 配置目标。
