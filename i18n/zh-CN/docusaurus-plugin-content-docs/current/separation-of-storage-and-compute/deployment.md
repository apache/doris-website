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

存算分离Doris部署总共需要 3 个模块：FE BE MS(程序名为 doris_cloud, 存算分离模式新增模块)

存算分离Doris依赖两个额外的开源项目, 开始部署前请将这两个依赖提前安装好
1. foundationdb (fdb), 安装文档参考[FDB 安装文档](../separation-of-storage-and-compute/install-fdb.md)
2. openjdk17, 需要安装到所有的节点上, 从这里获取安装 <https://download.java.net/java/GA/jdk17.0.1/2a2082e5a09d4267845be086888add4f/12/GPL/openjdk-17.0.1_linux-x64_bin.tar.gz>


ms 模块程序启动有两个角色，通过启动参数确定它的角色：
1. Meta-service 元数据管理
2. Recycler 数据回收

## 编译

`--cloud` 是编译存算分离ms模块的参数

```bash
sh build.sh --fe --be --cloud 
```

相比存算一体 `output` 目录下多了一个 `ms` 目录产出.

```bash
output
├── be
├── fe
└── ms
    ├── bin
    ├── conf
    └── lib
```

ms 这个产出目录会提供给meta-service 以及 recycler 使用,
需要注意的是虽然 Recycler 和 Meta-service 是同个程序，但是目前需要拷贝两份二进制文件。
Recycler 和 Meta-service 两个目录完全一样，只是启动参数不同。

使用以下命令拷贝ms得到一个Recycler工作目录`re`, 然后按需更改ms 以及 re目录下conf
里的端口等配置即可.

```shell
cp -r ms re
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

### meta-service 配置

`./conf` 目录下有一个全部采用默认参数的配置文件 doris_cloud.conf (只需要一个配置文件)

一般需要改的是 `brpc_listen_port` 和 `fdb_cluster` 这两个参数

```shell
brpc_listen_port = 5000
fdb_cluster = xxx:yyy@127.0.0.1:4500
```
上述端口`brpc_listen_port` 5000是meta-service的默认端口
其中 `fdb_cluster` 的值是 FDB 集群的连接信息，找部署 FDB 的同学获取，一般可以在部署fdb的机器上 /etc/foundationdb/fdb.cluster 文件找到其内容。

```shell
cat /etc/foundationdb/fdb.cluster

## DO NOT EDIT!
## This file is auto-generated, it is not to be edited by hand
cloud_ssb:A83c8Y1S3ZbqHLL4P4HHNTTw0A83CuHj@127.0.0.1:4500
```

### Recycler 配置

**Recycler 除了端口之外其他默认配置和meta-service均相同, brpc端口和meta-service不相同即可, 一般采用5100.**

`./conf` 目录下有一个全部采用默认参数的配置文件 doris_cloud.conf (只需要一个配置文件)

一般需要改的是 `brpc_listen_port` 和 `fdb_cluster` 这两个参数

```shell
brpc_listen_port = 5100
fdb_cluster = xxx:yyy@127.0.0.1:4500
```
上述端口`brpc_listen_port` 5000是meta-service的默认端口
其中 `fdb_cluster` 的值是 FDB 集群的连接信息，找部署 FDB 的同学获取，一般可以在部署fdb的机器上 /etc/foundationdb/fdb.cluster 文件找到其内容。

```shell
cat /etc/foundationdb/fdb.cluster

## DO NOT EDIT!
## This file is auto-generated, it is not to be edited by hand
cloud_ssb:A83c8Y1S3ZbqHLL4P4HHNTTw0A83CuHj@127.0.0.1:4500
```

### 模块启停

Meta-Service 和 Recycler 依赖JAVA的运行环境, 最好使用jdk-17的版本.
启动前export JAVA_HOME的环境变量.

doris_cloud 在部署的 bin 目录下有启停脚本, 调用对应的启停脚本即可完成启动.

### 启停 meta_service

```shell
export JAVA_HOME=${path_to_jdk_17}
bin/start.sh --meta-service --daemonized

bin/stop.sh
```


### 启停 Recycler

```shell
export JAVA_HOME=${path_to_jdk_17}
bin/start.sh --recycler --daemonized

bin/stop.sh
```

## 创建存算分离集群

存算分离架构下，整个数仓的节点构成信息是通过 Meta-service 进行维护的 (注册 + 变更). FE BE 和 Meta-service 交互来进行服务发现和身份验证。

创建存算分离集群主要是和 Meta-service 交互，通过 HTTP 接口，[meta-service 提供了标准的 http 接口进行资源管理操作](../separation-of-storage-and-compute/meta-service-resource-http-api.md).

创建存算分离集群 (以及 Cluster) 的其实就是描述这个存算分离集群里的机器组成，以下步骤只涉创建一个最基础的存算分离集群所需要进行的交互。

主要分为两步: 1. 注册一个仓库(FE) 2. 注册一个或者多个计集群(BE)


注意:
1. **本文后续的示例中127.0.0.1:5000指的是meta-service的地址, 实际操作时替换成真实的meta-serivce 的IP 以及brpc 监听端口**
2. 请勿直接复制粘贴

### 创建存算分离集群FE

#### 存算分离集群及其存储后端

这个步骤主要目的是在meta-service注册一个存算分离模式的Doris数仓(一套meta-service可以支持多个不同的Doris数仓(多套FE-BE)).
主要需要描述一个仓库使用什么样的存储后端([Storage Vault](../separation-of-storage-and-compute/storage-vault.md)), 可以选择S3 或者 HDFS. 

调用meta-servicde的create_instance接口. 主要参数 
1. instance_id: 存算分离模式Doris数仓的id, 每次新建都使用一个新的, 要求历史唯一, 一般使用uuid, 例如6ADDF03D-4C71-4F43-9D84-5FC89B3514F8. **本文档中为了简化使用普通字符串**.
2. name: 数仓名字, 按需填写
3. user_id: 用户id, 是一个字符串, 按需填写
4. vault: HDFS或者S3的存储后端的信息, 比如HDFS的属性, s3 bucket信息等.

更多信息请参考[meta-service API create instance章节](../separation-of-storage-and-compute/meta-service-resource-http-api.md).

##### 创建基于HDFS的存算分离Doris

创建基于HDFS的存算分离Doris, 需要描述正确所有信息以及保证所有的节点(FE BE MS RE)
都能够有权限访问所声明的HDFS, 例如提前给机器做好kerbros授权配置等, 并做好连通性
检查(可以在对应的每个节点上使用hadoop client进行测试).

prefix 字段按需填写, 一般以数仓的服务业务来命名.

示例
```Shell
curl -s "127.0.0.1:5000/MetaService/http/create_instance?token=greedisgood9999" -d \
'{
  "instance_id": "sample_instance_id",
  "name": "sample_instance_name",
  "user_id": "sample_user_id",
  "vault": {
    "hdfs_info" : {
      "build_conf": {
        "fs_name": "hdfs://172.21.0.44:4007",
        "user": "hadoop",
        "hdfs_kerberos_keytab": "/etc/emr.keytab",
        "hdfs_kerberos_principal": "hadoop/172.30.0.178@EMR-XXXYYY",
        "hdfs_confs" : [
          {
            "key": "hadoop.security.authentication",
            "value": "kerberos"
          }
        ]
      },
      "prefix": "sample_prefix"
    }
  }
}'
```

##### 创建基于S3的存算分离Doris

基于对象存储的所有属性均为必填, 其中
* 使用minio等支持S3协议的对象存储时, 需要自行测试连通性以及aksk的正确性.
	具体做法可以参考 [使用aws cli 验证minio是否工作](https://min.io/docs/minio/linux/integrations/aws-cli-with-minio.html)
	这个教程进行检查
* bucket字段的值就是一个bucket的名字, 是不带scheme(例如s3://)的.
* external_endpoint保持和endpoint值相同即可.
* 如果不是云厂商提供的对象存储, region 和 provider 的值可以任意填写

示例(腾讯云的cos)
```Shell
curl -s "127.0.0.1:5000/MetaService/http/create_instance?token=greedisgood9999" -d \
'{
  "instance_id": "sample_instance_id",
  "name": "sample_instance_name",
  "user_id": "sample_user_id",
  "vault": {
    "obj_info": {
      "ak": "ak_xxxxxxxxxxx",
      "sk": "sk_xxxxxxxxxxx",
      "bucket": "sample_bucket_name",
      "prefix": "sample_prefix",
      "endpoint": "cos.ap-beijing.myqcloud.com",
      "external_endpoint": "cos.ap-beijing.myqcloud.com",
      "region": "ap-beijing",
      "provider": "COS"
    }
  }
}'
```

##### 查看存储后端

执行完后续步骤, 启动FE成功后, 可以在FE输入SQL show storage vault
可以看到built_in_storage_vault, 并且这个vault的属性上述的属性值相同.

以下为hdfs的一个示例

```Shell
mysql> show storage vault;
+------------------------+----------------+-------------------------------------------------------------------------------------------------+-----------+
| StorageVaultName       | StorageVaultId | Propeties                                                                                       | IsDefault |
+------------------------+----------------+-------------------------------------------------------------------------------------------------+-----------+
| built_in_storage_vault | 1              | build_conf { fs_name: "hdfs://127.0.0.1:8020" } prefix: "sample_prefix_1CF80628-16CF-0A46-5EE2" | false     |
+------------------------+----------------+-------------------------------------------------------------------------------------------------+-----------+
2 rows in set (0.00 sec)
```

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
    "instance_id":"sample_instance_id",
    "cluster":{
        "type":"SQL",
        "cluster_name":"RESERVED_CLUSTER_NAME_FOR_SQL_SERVER",
        "cluster_id":"RESERVED_CLUSTER_ID_FOR_SQL_SERVER",
        "nodes":[
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_sql_server00",
                "ip":"172.21.16.21",
                "edit_log_port":12103,
                "node_type":"FE_MASTER"
            }
        ]
    }
}'

# 创建成功 get 出来确认一下
curl '127.0.0.1:5000/MetaService/http/get_cluster?token=greedisgood9999' -d '{
    "instance_id":"sample_instance_id",
    "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_sql_server00",
    "cluster_name":"RESERVED_CLUSTER_NAME_FOR_SQL_SERVER",
    "cluster_id":"RESERVED_CLUSTER_ID_FOR_SQL_SERVER"
}'
```

### [创建计算集群(Compute Cluster -- BE)](id:create_compute_cluster)

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
    "instance_id":"sample_instance_id",
    "cluster":{
        "type":"COMPUTE",
        "cluster_name":"cluster_name0",
        "cluster_id":"cluster_id0",
        "nodes":[
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_compute_node0",
                "ip":"172.21.16.21",
                "heartbeat_port":9455
            }
        ]
    }
}'

# 创建成功 get 出来确认一下
curl '127.0.0.1:5000/MetaService/http/get_cluster?token=greedisgood9999' -d '{
    "instance_id":"sample_instance_id",
    "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_compute_node0",
    "cluster_name":"cluster_name0",
    "cluster_id":"cluster_id0"
}'
```

### FE/BE配置

FE BE 配置相比doris多了一些配置, 其中比较关键的是
* meta_service_endpoint, 这个配置是meta service的地址, FE BE都要填写
* cloud_unique_id, 根据之前创建存算分离集群的时候发往meta-service请求里的实际值填写即可, Doris是通过这个配置是否有值来决定是否工作在存算分离模式


#### fe.conf

```Shell
meta_service_endpoint = 127.0.0.1:5000
cloud_unique_id = 1:sample_instance_id:cloud_unique_id_sql_server00
```

#### be.conf

下述例子中 meta_service_use_load_balancer 和 enable_file_cache 可以照抄, 
其他的配置按照实际值填写.

file_cache_path 是一个json数组(根据实际cache盘的个数配置), 它的各个字段含义
* path, 缓存数据存放的路径, 类似于存算一体的storage_root_path
* total_size, 期望使用的缓存空间上限
* query_limit, 单个query在cache miss时最多能淘汰的缓存数据量 (为了防止大查询把缓存全部冲掉)
cache中存放的是数据, 所以最好使用SSD等高性能的磁盘作为缓存存储.

```Shell
meta_service_endpoint = 127.0.0.1:5000
cloud_unique_id = 1:sample_instance_id:cloud_unique_id_compute_node0
meta_service_use_load_balancer = false
enable_file_cache = true
file_cache_path = [{"path":"/mnt/disk1/doris_cloud/file_cache","total_size":104857600000,"query_limit":10485760000}, {"path":"/mnt/disk2/doris_cloud/file_cache","total_size":104857600000,"query_limit":10485760000}]
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

启动后观察日志, 如果上述缓解配置都是正确的, 则进入正常工作模式, 可以通过MySQL客户端连上FE进行访问.

### 计算集群操作

#### 加减FE/BE节点
加减节点的操作和上述新建存算分离Doris时创建计算集群的步骤类似, 向meta-service 声
明需要增加哪些节点, 然后启动对应的节点即可(新增节点的要配置正确),
**不需要使用alter system add/drop语句进行额外操作**.

存算分离模式可以同时增加/减少若干个节点, 但是建议实际操作时每次只操作操作一个节点.

示例, 给计算集群cluster_name0增加两个BE节点
```
curl '127.0.0.1:5000/MetaService/http/add_node?token=greedisgood9999' -d '{
    "instance_id":"sample_instance_id",
    "cluster":{
        "type":"COMPUTE",
        "cluster_name":"cluster_name0",
        "cluster_id":"cluster_id0",
        "nodes":[
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_compute_node1",
                "ip":"172.21.16.22",
                "heartbeat_port":9455
            },
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_compute_node2",
                "ip":"172.21.16.23",
                "heartbeat_port":9455
            }
        ]
    }
}'
```

示例, 给计算集群cluster_name0减少两个BE节点
```
curl '127.0.0.1:5000/MetaService/http/drop_node?token=greedisgood9999' -d '{
    "instance_id":"sample_instance_id",
    "cluster":{
        "type":"COMPUTE",
        "cluster_name":"cluster_name0",
        "cluster_id":"cluster_id0",
        "nodes":[
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_compute_node1",
                "ip":"172.21.16.22",
                "heartbeat_port":9455
            },
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_compute_node2",
                "ip":"172.21.16.23",
                "heartbeat_port":9455
            }
        ]
    }
}'
```

示例, 添加一个FE follower, 以下node_type为FE_MASTER表示这个节点可以选为master,
**如果需要增加一个OBSERVER, 将node_type 设置为OBSERVER即可.**
```
curl '127.0.0.1:5000/MetaService/http/add_node?token=greedisgood9999' -d '{
    "instance_id":"sample_instance_id",
    "cluster":{
        "type":"SQL",
        "cluster_name":"RESERVED_CLUSTER_NAME_FOR_SQL_SERVER",
        "cluster_id":"RESERVED_CLUSTER_ID_FOR_SQL_SERVER",
        "nodes":[
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_sql_server00",
                "ip":"172.21.16.22",
                "edit_log_port":12103,
                "node_type":"FE_MASTER"
            }
        ]
    }
}'
```

示例, 删除一个FE节点
```
curl '127.0.0.1:5000/MetaService/http/drop_node?token=greedisgood9999' -d '{
    "instance_id":"sample_instance_id",
    "cluster":{
        "type":"SQL",
        "cluster_name":"RESERVED_CLUSTER_NAME_FOR_SQL_SERVER",
        "cluster_id":"RESERVED_CLUSTER_ID_FOR_SQL_SERVER",
        "nodes":[
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_sql_server00",
                "ip":"172.21.16.22",
                "edit_log_port":12103,
                "node_type":"FE_MASTER"
            }
        ]
    }
}'
```

#### 加减计算集群(Compute Cluster)

新增一个计算集群参考前文[创建计算集群章节](#create_compute_cluster)即可.

删除一个计算集群调用meta-service 接口之后 关停响应节点即可.

示例, 删除名为cluster_name0的计算集群(以下所有参数都必须填)
```
curl '127.0.0.1:5000/MetaService/http/add_cluster?token=greedisgood9999' -d '{
    "instance_id":"sample_instance_id",
    "cluster":{
        "type":"COMPUTE",
        "cluster_name":"cluster_name0",
        "cluster_id":"cluster_id0"
     }
}'
```

## 清理集群(**正式环境请勿使用**)

有时候我们需要创建一些测试用的存算分离Doris, 其中有一些步骤弄错了, 或者想完全重
新搭建. 则需要清除环境, 重新执行上述创建存算分离的Doris的步骤.
和存算一体的Doris 手动清除集群方式类似主要分为两步: 清除元数据以及清除数据

1. 手动强制清除元数据: 删掉FE的meta目录以及fdb里的元数据, 删除fdb里的数据需要使
	 用到fdb的命令行工具fdbcli. 以下命令都要执行, 其中`${instance_id}`需要替成实际
	 的值
	```
	fdbcli --exec "writemode on;clearrange \x01\x10instance\x00\x01\x10${instance_id}\x00\x01 \x01\x10instance\x00\x01\x10${instance_id}\x00\xff\x00\x01"
	fdbcli --exec "writemode on;clearrange \x01\x10meta\x00\x01\x10${instance_id}\x00\x01 \x01\x10meta\x00\x01\x10${instance_id}\x00\xff\x00\x01"
	fdbcli --exec "writemode on;clearrange \x01\x10txn\x00\x01\x10${instance_id}\x00\x01 \x01\x10txn\x00\x01\x10${instance_id}\x00\xff\x00\x01"
	fdbcli --exec "writemode on;clearrange \x01\x10version\x00\x01\x10${instance_id}\x00\x01 \x01\x10version\x00\x01\x10${instance_id}\x00\xff\x00\x01"
	fdbcli --exec "writemode on;clearrange \x01\x10stats\x00\x01\x10${instance_id}\x00\x01 \x01\x10stats\x00\x01\x10${instance_id}\x00\xff\x00\x01"
	fdbcli --exec "writemode on;clearrange \x01\x10recycle\x00\x01\x10${instance_id}\x00\x01 \x01\x10recycle\x00\x01\x10${instance_id}\x00\xff\x00\x01"
	fdbcli --exec "writemode on;clearrange \x01\x10job\x00\x01\x10${instance_id}\x00\x01 \x01\x10job\x00\x01\x10${instance_id}\x00\xff\x00\x01"
	fdbcli --exec "writemode on;clearrange \x01\x10copy\x00\x01\x10${instance_id}\x00\x01 \x01\x10copy\x00\x01\x10${instance_id}\x00\xff\x00\x01"
	fdbcli --exec "writemode on;clearrange \x01\x10storage_vault\x00\x01\x10${instance_id}\x00\x01 \x01\x10storage_vault\x00\x01\x10${instance_id}\x00\xff\x00\x01"
	```
2. 手动强制删除BE的缓存目录(主要是file_cache_path这个配置对应的几个目录)
3. 重启meta-service 以及 recycler

## 常见问题

