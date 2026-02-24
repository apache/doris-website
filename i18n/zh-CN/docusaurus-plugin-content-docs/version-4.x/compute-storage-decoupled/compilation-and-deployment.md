---
{
    "title": "编译部署",
    "language": "zh-CN",
    "description": "本文档详细介绍了 Doris 存算分离模式下的编译和部署流程，重点说明了与存算一体模式的区别，特别是新增 Meta Service (MS) 模块的编译、配置和管理。"
}
---

## 1. 概述

本文档详细介绍了 Doris 存算分离模式下的编译和部署流程，重点说明了与存算一体模式的区别，特别是新增 Meta Service (MS) 模块的编译、配置和管理。

## 2. 获取二进制

### 2.1 直接下载

已编译好的二进制文件（包含所有 Doris 模块）可从 [Doris 下载页面](https://doris.apache.org/download/) 获取（选择 3.0.2 或更高版本）。

### 2.2 编译产出（可选）

使用代码库自带的 `build.sh` 脚本进行编译。新增的 MS 模块通过 `--cloud` 参数编译。

```shell
sh build.sh --fe --be --cloud 
```

编译完成后，在 `output` 目录下会新增 `ms` 目录：

```
output
├── be
├── fe
└── ms
    ├── bin
    ├── conf
    └── lib
```

## 3. Meta Service 部署

### 3.1 配置

在 `./conf/doris_cloud.conf` 文件中，主要需要修改以下两个参数：

1. `brpc_listen_port`：Meta Service 的监听端口，默认为 5000。
2. `fdb_cluster`：FoundationDB 集群的连接信息，部署 FoundationDB 时可以获取。(如果使用 Doris 提供的 fdb_ctl.sh 部署的话，可在 `$FDB_HOME/conf/fdb.cluster` 文件里获取该值)。

示例配置：

```Shell
brpc_listen_port = 5000
fdb_cluster = xxx:yyy@127.0.0.1:4500
```

注意：`fdb_cluster` 的值应与 FoundationDB 部署机器上的 `/etc/foundationdb/fdb.cluster` 文件内容一致 (如果使用 Doris 提供的 fdb_ctl.sh 部署的话，可在 `$FDB_HOME/conf/fdb.cluster` 文件里获取该值)。

**示例，文件的最后一行就是要填到 doris_cloud.conf 里 fdb_cluster 字段的值**

```shell
cat /etc/foundationdb/fdb.cluster

# DO NOT EDIT!
# This file is auto-generated, it is not to be edited by hand.
cloud_ssb:A83c8Y1S3ZbqHLL4P4HHNTTw0A83CuHj@127.0.0.1:4500
```

### 3.2 启动与停止

*环境要求*

确保已正确设置 `JAVA_HOME` 环境变量，指向 OpenJDK 17，进入 `ms` 目录。

*启动命令*

```Shell
export JAVA_HOME=${path_to_jdk_17}
bin/start.sh --daemon
```

```text
LIBHDFS3_CONF=
starts doris_cloud with args: --meta-service
wait and check doris_cloud start successfully
successfully started brpc listening on port=5000 time_elapsed_ms=11
doris_cloud start successfully
```

启动脚本返回值为 0 表示启动成功，否则启动失败。

:::info
在 3.0.4 中，启动脚本会输出更多信息：
```text
2024-12-26 15:31:53 start with args: --meta-service
wait and check MetaService and Recycler start successfully
process working directory: "/mnt/disk1/doris/ms"
pid=1666015 written to file=./bin/doris_cloud.pid
version:{doris-3.0.4-release} code_version:{commit=fd44740fadabebfedb5da201d7ce427a5dd47c44 time=2025-01-16 18:53:00 +0800} build_info: ...

MetaService has been started successfully
successfully started service listening on port=5000 time_elapsed_ms=19
```
:::

*停止命令*

``` shell
bin/stop.sh
```

生产环境中请确保至少有 3 个 Meta Service 节点。

## 4. 数据回收功能独立部署（可选）

:::info
Meta Service 本身具备了元数据管理和回收功能，这两个功能可以独立部署，如果你想独立部署，可以参考这一节。
:::

*准备工作*

1. 创建新的工作目录（如 `recycler`）。
2. 复制 `ms` 目录内容到新目录：

   ```shell
   cp -r ms recycler
   ```

*配置*

在新目录的配置文件中修改 BRPC 监听端口 `brpc_listen_port` 和 `fdb_cluster` 的值。

*启动数据回收功能*

```Shell
export JAVA_HOME=${path_to_jdk_17}
bin/start.sh --recycler --daemon
```

*启动仅元数据操作功能*

```Shell
export JAVA_HOME=${path_to_jdk_17}
bin/start.sh --meta-service --daemon
```

## 5. FE 和 BE 的启动流程

本节详细说明了在存算分离架构下启动 FE（Frontend）和 BE（Backend）的步骤。

### 5.1 启动顺序

1. 以 MASTER 角色启动实例的第一个 FE
2. 向实例中添加其他 FE 和 BE
3. 添加第一个 Storage Vault

### 5.2 启动 MASTER 角色的 FE

#### 5.2.1 配置 fe.conf

在 `fe.conf` 文件中，需要配置以下关键参数：

1. `deploy_mode`
   - 描述：指定 doris 启动模式
   - 格式：cloud 表示存算分离模式，其它存算一体模式
   - 示例：`cloud`

2. `cluster_id`
   - 描述：存算分离架构下集群的唯一标识符，不同的集群必须设置不同的 cluster_id。
   - 格式：int 类型
   - 示例：可以使用如下 shell 脚本生成一个随机 id 使用。
      ```shell
      echo $(($((RANDOM << 15)) | $RANDOM))
      ```
     :::caution
     **不同的集群必须设置不同的 cluster_id**
     :::

3. `meta_service_endpoint`
   - 描述：Meta Service 的地址和端口
   - 格式：`IP地址:端口号`
   - 示例：`127.0.0.1:5000`, 可以用逗号分割配置多个 meta service。

#### 5.2.2 启动 FE

启动命令示例：

```bash
bin/start_fe.sh --daemon
```

第一个 FE 进程初始化集群并以 FOLLOWER 角色工作。使用 mysql 客户端连接 FE 使用 `show frontends` 确认刚才启动的 FE 是 master。

### 5.3 添加其他 FE 节点

其他节点同样根据上述步骤修改配置文件并启动，使用 mysql 客户端连接 Master 角色的 FE，并用以下 SQL 命令添加额外的 FE 节点：

```sql
ALTER SYSTEM ADD FOLLOWER "host:port";
```

将 `host:port` 替换为 FE 节点的实际地址和编辑日志端口。更多信息请参见 [ADD FOLLOWER](../sql-manual/sql-statements/cluster-management/instance-management/ADD-FOLLOWER) 和 [ADD OBSERVER](../sql-manual/sql-statements/cluster-management/instance-management/ADD-OBSERVER)。

生产环境中，请确保在 FOLLOWER 角色中的前端 (FE) 节点总数，包括第一个 FE，保持为奇数。一般来说，三个 FOLLOWER 就足够了。观察者角色的前端节点可以是任意数量。

### 5.4 添加 BE 节点

要向集群添加 Backend 节点，请对每个 Backend 执行以下步骤：

#### 5.4.1 配置 be.conf

在 `be.conf` 文件中，需要配置以下关键参数：

1. `deploy_mode`
   - 描述：指定 doris 启动模式
   - 格式：cloud 表示存算分离模式，其它存算一体模式
   - 示例：`cloud`

2. `file_cache_path`
   - 描述：用于文件缓存的磁盘路径和其他参数，以数组形式表示，每个磁盘一项。`path` 指定磁盘路径，`total_size` 限制缓存的大小；-1 或 0 将使用整个磁盘空间。
   - 格式：[{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
   - 示例：[{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
   - 默认：[{"path":"${DORIS_HOME}/file_cache"}]

#### 5.4.1 启动和添加 BE

1. 启动 Backend：

   使用以下命令启动 Backend：

   ```bash
   bin/start_be.sh --daemon
   ```

2. 将 Backend 添加到集群：

   使用 MySQL 客户端连接到任意 Frontend，并执行：

   ```sql
   ALTER SYSTEM ADD BACKEND "<ip>:<heartbeat_service_port>" [PROTERTIES propertires];
   ```

   将 `<ip>` 替换为新 Backend 的 IP 地址，将 `<heartbeat_service_port>` 替换为其配置的心跳服务端口（默认为 9050）。

   可以通过 PROPERTIES 设置 BE 所在的 计算组。

   更详细的用法请参考 [ADD BACKEND](../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND) 和 [REMOVE BACKEND](../sql-manual/sql-statements/cluster-management/instance-management/DROP-BACKEND)。

3. 验证 Backend 状态：

   检查 Backend 日志文件（`be.log`）以确保它已成功启动并加入集群。

   您还可以使用以下 SQL 命令检查 Backend 状态：

   ```sql
   SHOW BACKENDS;
   ```

   这将显示集群中所有 Backend 及其当前状态。

## 6. 创建 Storage Vault

 Storage Vault 是 Doris 存算分离架构中的重要组件。它们代表了存储数据的共享存储层。您可以使用 HDFS 或兼容 S3 的对象存储创建一个或多个 Storage Vault。可以将 Storage Vault 设置成为默认 Storage Vault，系统表和未指定 Storage Vault 的表都将存储在这个默认 Storage Vault 中。默认 Storage Vault 不能被删除。以下是为您的 Doris 集群创建 Storage Vault 的方法：

### 6.1 创建 HDFS  Storage Vault 

要使用 SQL 创建 Storage Vault，请使用 MySQL 客户端连接到您的 Doris 集群

```sql
CREATE STORAGE VAULT IF NOT EXISTS hdfs_vault
    PROPERTIES (
    "type"="hdfs",
    "fs.defaultFS"="hdfs://127.0.0.1:8020"
    );
```

### 6.2 创建 S3  Storage Vault 

要使用兼容 S3 的对象存储创建 Storage Vault，请按照以下步骤操作：

1. 使用 MySQL 客户端连接到您的 Doris 集群。

2. 执行以下 SQL 命令来创建 S3  Storage Vault：

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_vault
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

要在其他对象存储上创建 Storage Vault，请参考 [创建 Storage Vault ](../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT)。

### 6.3 设置默认 Storage Vault 

使用如下 SQL 语句设置一个默认 Storage Vault。

```sql
SET <storage_vault_name> AS DEFAULT STORAGE VAULT
```

## 7. 注意事项

- 仅元数据操作功能的 Meta Service 进程应作为 FE 和 BE 的 `meta_service_endpoint` 配置目标。
- 数据回收功能进程不应作为 `meta_service_endpoint` 配置目标。
