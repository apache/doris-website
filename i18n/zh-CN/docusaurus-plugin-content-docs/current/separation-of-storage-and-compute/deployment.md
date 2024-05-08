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

这两个进程依赖 FDB, FDB 的部署请参考[FDB 安装文档](../separation-of-storage-and-compute/install-fdb.md)

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

创建存算分离集群主要是和 Meta-service 交互，通过 HTTP 接口，[meta-service 提供了标准的 http 接口进行资源管理操作](../separation-of-storage-and-compute/meta-service-resource-http-api.md).

创建存算分离集群 (以及 Cluster) 的其实就是描述这个存算分离集群里的机器组成，以下步骤只涉创建一个最基础的存算分离集群所需要进行的交互。

主要分为两步: 1. 注册一个仓库(FE) 2. 注册一个或者多个计集群(BE)

### 创建存算分离集群FE

#### 存算分离集群及其存储后端

这个步骤主要目的是在meta-service注册一个存算分离模式的Doris数仓(一套meta-service可以支持多个不同的Doris数仓(多套FE-BE)).
主要需要描述一个仓库使用什么样的存储后端([Storage Vault](../separation-of-storage-and-compute/storage-vault.md)), 可以选择S3 或者 HDFS. 

调用meta-servicde的create_instance接口. 主要参数 
1. instance_id: 存算分离模式Doris数仓的id, 要求历史唯一uuid, 例如6ADDF03D-4C71-4F43-9D84-5FC89B3514F8. **本文档中为了简化使用普通字符串**.
2. name: 数仓名字, 按需填写
3. user_id: 用户id, 是一个字符串, 按需填写
4. vault: HDFS或者S3的存储后端的信息, 比如HDFS的属性, s3 bucket信息等.

更多信息请参考[meta-service API create instance章节](../separation-of-storage-and-compute/meta-service-resource-http-api.md).

##### 创建基于HDFS的存算分离Doris

示例

```Shell
curl -s "${META_SERVICE_ENDPOINT}/MetaService/http/create_instance?token=greedisgood9999" \
                        -d '{
  "instance_id": "doris_master_asan_hdfs_multi_cluster_autoscale",
  "name": "doris_master_asan_hdfs_multi_cluster_autoscale",
  "user_id": "sample-user-id",
  "vault": {
    "hdfs_info" : {
      "build_conf": {
        "fs_name": "hdfs://172.21.0.44:4007",
        "user": "hadoop",
        "hdfs_kerberos_keytab": "/etc/emr.keytab",
        "hdfs_kerberos_principal": "hadoop/172.30.0.178@EMR-D46OBYMH",
        "hdfs_confs" : [
                  {
                    "key": "hadoop.security.authentication",
                    "value": "kerberos"
                  }
                ]
      },
      "prefix": "doris_master_asan_hdfs_multi_cluster_autoscale-0404"
    }
  }
}'
```

##### 创建基于Se的存算分离Doris

示例(腾讯云的cos)

```Shell
curl -s "${META_SERVICE_ENDPOINT}/MetaService/http/create_instance?token=greedisgood9999" \
                        -d '{
  "instance_id": "doris_master_asan_hdfs_multi_cluster_autoscale",
  "name": "doris_master_asan_hdfs_multi_cluster_autoscale",
  "user_id": "sample-user-id",
  "vault": {
    "obj_info": {
      "ak": "${ak}",
      "sk": "${sk}",
      "bucket": "doris-build-1308700295",
      "prefix": "${your_prefix}",
      "endpoint": "cos.ap-beijing.myqcloud.com",
      "external_endpoint": "cos.ap-beijing.myqcloud.com",
      "region": "ap-beijing",
      "provider": "COS"
    }
  }
}'
```

启动后在FE输入show storage vault会看到built_in_storage_vault,并且这个vault的属性就和刚刚传递的属性相同.

```Shell
mysql> show storage vault;
+------------------------+----------------+-------------------------------------------------------------------------------------------------+-----------+
| StorageVaultName       | StorageVaultId | Propeties                                                                                       | IsDefault |
+------------------------+----------------+-------------------------------------------------------------------------------------------------+-----------+
| built_in_storage_vault | 1              | build_conf { fs_name: "hdfs://127.0.0.1:8020" } prefix: "_1CF80628-16CF-0A46-54EE-2C4A54AB1519" | false     |
+------------------------+----------------+-------------------------------------------------------------------------------------------------+-----------+
2 rows in set (0.00 sec)
```

**注意：**

Storage Vault模式和非Vault模式是不能同时创建的，如果用户同时指定了obj_info和vault，那么只会创建非vault模式的集群。Vault模式必须在创建instance的时候就传递vault信息，否则会默认为非vault模式.

只有Vault模式才支持对应的vault stmt.

#### 添加FE

存算分离模式FE的管理方式和BE 是类似的都是分了组, 所以也是通过add_cluster等接口来进行操作.

一般来说只需要建一个FE即可, 如果需要多加几个FE, 

cloud_unique_id是一个唯一字符串, 格式为 `1:<instance_id>:<string>`, 根据自己喜好选一个.
ip edit_log_port 按照fe.conf里实际填写.
注意, FE集群的cluster_name cluster_id是固定, 恒定为
"cluster_name":"RESERVED_CLUSTER_NAME_FOR_SQL_SERVER"
"cluster_id":"RESERVED_CLUSTER_ID_FOR_SQL_SERVER"

```Shell
# 添加FE
curl '127.0.0.1:5000/MetaService/http/add_cluster?token=greedisgood9999' -d '{
    "instance_id":"cloud_instance0",
    "cluster":{
        "type":"SQL",
        "cluster_name":"RESERVED_CLUSTER_NAME_FOR_SQL_SERVER",
        "cluster_id":"RESERVED_CLUSTER_ID_FOR_SQL_SERVER",
        "nodes":[
            {
                "cloud_unique_id":"1:cloud_instance0:cloud_unique_id_sql_server00",
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
    "cloud_unique_id":"1:cloud_instance0:regression-cloud-unique-id-fe-1",
    "cluster_name":"RESERVED_CLUSTER_NAME_FOR_SQL_SERVER",
    "cluster_id":"RESERVED_CLUSTER_ID_FOR_SQL_SERVER"
}'
```

### 创建compute cluster (BE)

用户可以创建一个或者多个计算集群, 一个计算机群由任意多个计算阶段组成.

一个计算集群组成有多个几个关键信息:

1. cloud_unique_id是一个唯一字符串, 格式为 `1:<instance_id>:<string>`, 根据自己喜好选一个. 这个值需要和be.conf的cloud_unique_id配置值相同.
2. cluster_name cluster_id 按照自己的实际情况偏好填写
3. ip根据实际情况填写, heartbeat_port 是BE的心跳端口.

BE cluster的数量以及 节点数量 根据自己需求调整, 不固定, 不同cluster需要使用不同的 cluster_name 和 cluster_id.

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
                "cloud_unique_id":"1:cloud_instance0:cloud_unique_id_compute_node0",
                "ip":"172.21.16.21",
                "heartbeat_port":9455
            }
        ]
    }
}'

# 创建成功 get 出来确认一下
curl '127.0.0.1:5000/MetaService/http/get_cluster?token=greedisgood9999' -d '{
    "instance_id":"cloud_instance0",
    "cloud_unique_id":"1:cloud_instance0:regression-cloud-unique-id0",
    "cluster_name":"regression_test_cluster_name0",
    "cluster_id":"regression_test_cluster_id0"
}'
```

### 计算集群操作

TBD

加减节点: FE BE 

Drop cluster 

### FE/BE配置

FE BE 配置相比doris多了一些配置, 一个是meta service 的地址另外一个是 cloud_unique_id (根据之前创建存算分离集群 的时候实际值填写)

fe.conf

```Shell
# cloud HTTP data api port
cloud_http_port = 8904
meta_service_endpoint = 127.0.0.1:5000
cloud_unique_id = 1:cloud_instance0:cloud_unique_id_sql_server00
```

be.conf

```Shell
meta_service_endpoint = 127.0.0.1:5000
cloud_unique_id = 1:cloud_instance0:cloud_unique_id_compute_node0
meta_service_use_load_balancer = false
enable_file_cache = true
file_cache_path = [{"path":"/mnt/disk3/doris_cloud/file_cache","total_size":104857600,"query_limit":104857600}]
tmp_file_dirs = [{"path":"/mnt/disk3/doris_cloud/tmp","max_cache_bytes":104857600,"max_upload_bytes":104857600}]
```

### 启停FE/BE

FE BE启停和doris存算一体启停方式保持一致, 

```Shell
bin/start_be.sh --daemon
bin/stop_be.sh


bin/start_fe.sh --daemon
bin/stop_fe.sh
```

Doris **cloud模式****FE****会自动发现对应的BE, 不需通过 alter system add 或者drop backend 操作节点.**

启动后观察日志.

