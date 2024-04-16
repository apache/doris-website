---
{
    "title": "存算分离 Doris 部署",
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

## 写在前面

开始部署前请先阅读[Doris 存算分离架构说明文档](../separation-of-storage-and-compute/overview.md).

Doris 存算分离部署总共需要 3 个模块：FE BE MS(程序名为 doris_cloud, 存算分离新引入的模块)

ms 模块程序启动有两个角色，通过启动参数确定它的角色：

1. meta-service 元数据管理

2. Recycler 数据回

## 编译

```bash
sh build.sh --fe --be --cloud 
```

相比存算一体 `output` 目录下多了一个 `ms` 目录产出

```bash
output
├── be
├── fe
└── ms
    ├── bin
    ├── conf
    └── lib
```

## 版本信息

doris_cloud 检查版本有两个方式 一个是 `bin/start.sh --version`

一个是 `lib/doris_cloud --version`, (如果其中一个方法报错，使用另外一个即可)

```bash
$ lib/doris_cloud --version
version:{doris_cloud-0.0.0-debug} code_version:{commit=b9c1d057f07dd874ad32501ff43701247179adcb time=2024-03-24 20:44:50 +0800} build_info:{initiator=gavinchou@VM-10-7-centos build_at=2024-03-24 20:44:50 +0800 build_on=NAME="TencentOS Server" VERSION="3.1 (Final)" }
```

## Meta-service 以及 Recycler 部署

Recycler 和 Meta-service 是同个程序的不同进程，通过启动参数来确定运行的 Recycler 或者是 Meta-service.

这两个进程依赖 FDB, FDB 的部署请参考[FDB 安装章节](#FDB安装)

### 配置

`./conf` 目录下有一个全部采用默认参数的配置文件 doris_cloud.conf (只需要一个配置文件)

一般需要改的是 `brpc_listen_port` 和 `fdb_cluster` 这两个参数

```shell
brpc_listen_port = 5000
fdb_cluster = xxx:yyy@127.0.0.1:4500
```

其中 fdb_cluster 的值是 FDB 集群的连接信息，找部署 FDB 的同学获取，一般可以在 /etc/foundationdb/FDB.cluster 文件找到其内容。(只需要标红高亮那那行), 如果开发机没有 FDB 的话就摇人要一个。

```shell
cat /etc/foundationdb/fdb.cluster

## DO NOT EDIT!
## This file is auto-generated, it is not to be edited by hand
cloud_ssb:A83c8Y1S3ZbqHLL4P4HHNTTw0A83CuHj@127.0.0.1:4500
```

### 模块启停

doris_cloud 在部署的 bin 目录下也有启停脚本

### 启停 meta_service

```shell
bin/start.sh --meta-service --daemonized

bin/stop.sh
```

### 启停 Recycler

```shell
bin/start.sh --recycler --daemonized

bin/stop.sh
```

需要注意的是虽然 Recycler 和 Meta-service 是同个程序，但是目前需要拷贝两份二进制文件。Recycler 和 Meta-service 两个目录完全一样，只是启动参数不同。

## 创建存算分离集群

存算分离架构下，整个数仓的节点构成信息是通过 Meta-service 进行维护的 (注册 + 变更). FE BE 和 Meta-service 交互来进行服务发现和身份验证。

创建存算分离集群主要是和 Meta-service 交互，通过 HTTP 接口，[meta-service 提供了标准的 http 接口进行资源管理操作](../separation-of-storage-and-compute/meta_service_resource_http_api.md).

创建存算分离集群 (以及 Cluster) 的其实就是描述这个存算分离集群里的机器组成，以下步骤只涉创建一个最基础的存算分离集群所需要进行的交互。

### 创建存算分离集群

一个存算分离集群需要有计算和存储的基础资源，所以创建这个集群需要在 Meta-service 里注册这些资源。

**1. 对象信息，obj_info 的 Bucket 信息 按照机器所在 Region 实际填写，Prefix 使用自己比较有针对性的前缀，比如加个业务的名字**

**2. 再添加 FE 机器信息，一般来说只需要建一个 FE 即可，信息主要包括**

- 节点的 cloud_unique_id 是一个唯一字符串，是每个节点的唯一 ID 以及身份标识，根据自己喜好选一个，这个值需要和 fe.conf 的 cloud_unique_id 配置值相同。

- ip edit_log_port 按照 fe.conf 里实际填写，FE 集群的 cluster_name cluster_id 是固定的 (RESERVED_CLUSTER_NAME_FOR_SQL_SERVER, RESERVED_CLUSTER_ID_FOR_SQL_SERVER) 不能改动

```Shell
# create 存算分离集群
# 注意配置S3信息
curl '127.0.0.1:5000/MetaService/http/create_instance?token=greedisgood9999' -d '{"instance_id":"cloud_instance0","name":"cloud_instance0","user_id":"user-id",
"obj_info": {
        "ak": "${ak}",
        "sk": "${sk}",
        "bucket": "sample-bucket",
        "prefix": "${your_prefix}",
        "endpoint": "cos.ap-beijing.myqcloud.com",
        "external_endpoint": "cos.ap-beijing.myqcloud.com",
        "region": "ap-beijing",
        "provider": "COS"
}}'

# 添加FE
curl '127.0.0.1:5000/MetaService/http/add_cluster?token=greedisgood9999' -d '{
    "instance_id":"cloud_instance0",
    "cluster":{
        "type":"SQL",
        "cluster_name":"RESERVED_CLUSTER_NAME_FOR_SQL_SERVER",
        "cluster_id":"RESERVED_CLUSTER_ID_FOR_SQL_SERVER",
        "nodes":[
            {
                "cloud_unique_id":"cloud_unique_id_sql_server00",
                "ip":"172.21.16.21",
                "edit_log_port":12103,
                "node_type":"FE_MASTER"
            }
        ]
    }
}'

# 创建成功 get 出来确认一下
curl '127.0.0.1:5000/MetaService/http/get_cluster?token=greedisgood9999' -d '{
    "instance_id":"cloud_instance0",
    "cloud_unique_id":"regression-cloud-unique-id-fe-1",
    "cluster_name":"RESERVED_CLUSTER_NAME_FOR_SQL_SERVER",
    "cluster_id":"RESERVED_CLUSTER_ID_FOR_SQL_SERVER"
}'
```

### 创建 Compute Cluster (BE Cluster)

一个计算集群由多个计算节点组成，主要包含以下关键信息：

1. 计算集群的 cluster_name cluster_id 按照自己的实际情况偏好填写，需要确保唯一。

2. 节点的 cloud_unique_id 是一个唯一字符串，是每个节点的唯一 ID 以及身份标识，根据自己喜好选一个，这个值需要和 be.conf 的 cloud_unique_id 配置值相同。

3. IP 根据实际情况填写，heartbeat_port 是 BE 的心跳端口。

BE cluster 的数量以及 节点数量 根据自己需求调整，不固定，不同 cluster 需要使用不同的 cluster_name 和 cluster_id.

通过调用[Meta-service 的资源管控 API 进行操作](../separation-of-storage-and-compute/meta_service_resource_http_api.md)

```Shell
# 172.19.0.11
# 添加BE
curl '127.0.0.1:5000/MetaService/http/add_cluster?token=greedisgood9999' -d '{
    "instance_id":"cloud_instance0",
    "cluster":{
        "type":"COMPUTE",
        "cluster_name":"cluster_name0",
        "cluster_id":"cluster_id0",
        "nodes":[
            {
                "cloud_unique_id":"cloud_unique_id_compute_node0",
                "ip":"172.21.16.21",
                "heartbeat_port":9455
            }
        ]
    }
}'

# 创建成功 get 出来确认一下
curl '127.0.0.1:5000/MetaService/http/get_cluster?token=greedisgood9999' -d '{
    "instance_id":"cloud_instance0",
    "cloud_unique_id":"regression-cloud-unique-id0",
    "cluster_name":"regression_test_cluster_name0",
    "cluster_id":"regression_test_cluster_id0"
}'
```

### FE/BE 配置

FE/BE 配置相比 Doris 多了一些配置，一个是 Meta-service 的地址另外一个是 cloud_unique_id (根据之前创建存算分离集群 的时候实际值填写)

fe.conf

```Shell
# cloud HTTP data api port
cloud_http_port = 8904
meta_service_endpoint = 127.0.0.1:5000
cloud_unique_id = cloud_unique_id_sql_server00
```

be.conf

```Shell
meta_service_endpoint = 127.0.0.1:5000
cloud_unique_id = cloud_unique_id_compute_node0
meta_service_use_load_balancer = false
enable_file_cache = true
file_cache_path = [{"path":"/mnt/disk3/doris_cloud/file_cache","total_size":104857600,"query_limit":104857600}]
tmp_file_dirs = [{"path":"/mnt/disk3/doris_cloud/tmp","max_cache_bytes":104857600,"max_upload_bytes":104857600}]
```

### 启停 FE/BE

FE/BE 启停和 Doris 保持一致，

```Shell
bin/start_be.sh --daemon
bin/stop_be.sh


bin/start_fe.sh --daemon
bin/stop_fe.sh
```
:::caution 注意
**Doris Cloud 模式 FE 会自动发现对应的 BE, 千万不要用 ALTER SYSTEM ADD 或者 DROP BACKEND**
:::

## FDB 安装

请使用 7.1.x 的版本

### ubuntu 安装

```Plain
apt-get install foundationdb
```

默认安装的相关路径信息

配置文件

/etc/foundationdb/fdb.cluster

/etc/foundationdb/foundationdb.conf

日志路径 (会自动滚动，但是要关注/的使用率)

/var/log/foundationdb/

### 使用 rpm 包安装

安装&使用参考

https://apple.github.io/foundationdb/getting-started-linux.html

https://github.com/apple/foundationdb/tags

### FDB 注意事项

如果默认 FDB 使用 Memory 作为存储引擎，该引擎适合小数据量存储，要是做压力测试或者存大量数据，需切换 FDB 的存储引擎为 SSD（一般使用 SSD 盘），步骤如下：

1. 新建存放目录 Data 和 Log，并使其有 `foundationdb` 用户的访问权限：

    ```Shell
    $ chown -R foundationdb:foundationdb /mnt/disk1/foundationdb/data/ /mnt/disk1/foundationdb/log
    ```

2. 修改 `/etc/foundationdb/foundationdb.conf` 中 datadir 和 logdir 路径：

    ```Shell
    ## Default parameters for individual fdbserver processes
    [fdbserver]
    logdir = /mnt/disk1/foundationdb/log
    datadir = /mnt/disk1/foundationdb/data/$ID


    [backup_agent]
    command = /usr/lib/foundationdb/backup_agent/backup_agent
    logdir = /mnt/disk1/foundationdb/log

    [backup_agent.1]
    ```

3. 调用 `fdbcli` 生成一个以 SSD 为存储引擎的数据库：

    ```Shell
    user@host$ fdbcli
    Using cluster file `/etc/foundationdb/fdb.cluster'.

    The database is unavailable; type `status' for more information.

    Welcome to the fdbcli. For help, type `help'.
    fdb> configure new single ssd
    Database created
    ```

## 测试数据清理 (清理所有数据，仅适用于调试环境)

### 清理集群

正常删掉 doris-meta 和 Storage 信息

清空 FDB 信息 `${instance_id}` 需要用实际的值替代

1. 清理 instance 的信息 (包括 instance 和 cluster 的信息)

2. 清理 meta 信息

3. 清理 Version 信息

4. 清理 txn 信息

5. 清理 stats

6. 清理 job 信息

```shell
fdbcli --exec "writemode on;clearrange \x01\x10instance\x00\x01\x10${instance_id}\x00\x01 \x01\x10instance\x00\x01\x10${instance_id}\x00\xff\x00\x01"
fdbcli --exec "writemode on;clearrange \x01\x10meta\x00\x01\x10${instance_id}\x00\x01 \x01\x10meta\x00\x01\x10${instance_id}\x00\xff\x00\x01"
fdbcli --exec "writemode on;clearrange \x01\x10txn\x00\x01\x10${instance_id}\x00\x01 \x01\x10txn\x00\x01\x10${instance_id}\x00\xff\x00\x01"
fdbcli --exec "writemode on;clearrange \x01\x10version\x00\x01\x10${instance_id}\x00\x01 \x01\x10version\x00\x01\x10${instance_id}\x00\xff\x00\x01"
fdbcli --exec "writemode on;clearrange \x01\x10stats\x00\x01\x10${instance_id}\x00\x01 \x01\x10stats\x00\x01\x10${instance_id}\x00\xff\x00\x01"
fdbcli --exec "writemode on;clearrange \x01\x10recycle\x00\x01\x10${instance_id}\x00\x01 \x01\x10recycle\x00\x01\x10${instance_id}\x00\xff\x00\x01"
fdbcli --exec "writemode on;clearrange \x01\x10job\x00\x01\x10${instance_id}\x00\x01 \x01\x10job\x00\x01\x10${instance_id}\x00\xff\x00\x01"
fdbcli --exec "writemode on;clearrange \x01\x10copy\x00\x01\x10${instance_id}\x00\x01 \x01\x10copy\x00\x01\x10${instance_id}\x00\xff\x00\x01"
```

### 清理集群 (清理除 KV 外的数据)

请按照实际配置的对象存储或者 HDFS 存储的前缀或者目录，直接调用对应存储系统的接口进行前缀或者目录删除。


