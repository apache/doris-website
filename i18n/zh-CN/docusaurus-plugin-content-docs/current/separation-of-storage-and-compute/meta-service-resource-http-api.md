---
{
    "title": "存算分离资源管理接口 API 参考",
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


本文档描述 Meta-service 的资源管理接口，术语介绍：

* Instance 存算分离数仓实例，类似于一个存算一体的 Doris 的集群

* Cluster 数仓实例中的计算集群，一个数仓可以包含多个 Cluster

## 接口目录

[TOC]

## API 版本

未来所有的接口都会带上版本号，建议使用时带上版本以区分不同版本。目前已经给所有已有接口都加上 `v1/` 表示版本号。

以 `create_instance` 为例，带 API 版本的接口为：

```
PUT /MetaService/http/v1/create_instance?token=<token> HTTP/1.1
```

为了保证兼容性，之前的接口（即不带 `v1/`）仍然能访问。

## 字段值要求

本文档中会出现一些字段值需要特别关注其值以及格式要求.

字段 | 描述 | 备注
------| ------| ------
instance_id | 存算分离架构下数仓的id, 一般使用uuid字符串 | 要求历史上唯一
cloud_unique_id | 存算分离架构下be.conf fe.conf的一个配置, 创建计算集群请求时也需要提供, 格式为 `1:<instance_id>:<string>` | 示例 "1:regression_instance0:regression-cloud-unique-id-1"
cluster_name | 存算分离架构下描述一个计算集群时需要传入的字段, 格式要求是一个 identifier, 需要匹配模式`[a-zA-Z][0-9a-zA-Z_]+` | 实例 write_cluster 或者 read_cluster0


## 创建 Instance

### 接口描述

本接口用于创建一个 Instance. 这个 Instance 不包含任何节点信息，不能多次创建同一个 `instance_id` 的 Instance

### 请求 (Request)

* 请求语法

```bash
PUT /MetaService/http/create_instance?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id": string,
    "name": string,
    "user_id": string,
    "obj_info": {
        "ak": string,
        "sk": string,
        "bucket": string,
        "prefix": string,
        "endpoint": string,
        "region": string,
        "external_endpoint": string,
        "provider": string
        "user_id": string
    },
    "ram_user": {
        "user_id": string,
        "ak": string,
        "sk": string
    }
}
```
* 请求参数

| 参数名                     | 描述                                | 是否必须 | 备注                                            |
|----------------------------|------------------------             |------    |--------------------------------                 |
| instance_id                | instance_id                         | 是       | 全局唯一 (包括历史上), 一般是使用一个uuid 字符串|
| name                       | instance 别名                       | 否       |                                                 |
| user_id                    | 用户 id                             | 是       |                                                 |
| obj_info                   | S3 链接配置信息                     | 是       |                                                 |
| obj_info.ak                | S3 的 access key                    | 是       |                                                 |
| obj_info.sk                | S3 的 secret key                    | 是       |                                                 |
| obj_info.bucket            | S3 的 bucket 名                     | 是       |                                                 |
| obj_info.prefix            | S3 上数据存放位置前缀               | 否       | 不填的话，在 bucket 的根目录                    |
| obj_info.endpoint          | S3 的 endpoint 信息                 | 是       | 是个域名或者IP:端口, 不带http://这种scheme 前缀 |
| obj_info.region            | S3 的 region 信息                   | 是       |                                                 |
| obj_info.external_endpoint | S3 的 external endpoint 信息        | 否       | 兼容 oss，oss 有 external、internal 区别        |
| obj_info.provider          | S3 的 provider 信息                 | 是       |                                                 |
| obj_info.user_id           | bucket 的 user_id                   | 否       | 轮转 ak sk 使用，用于标识哪些 obj 需更改 ak sk  |
| ram_user                   | ram_user 信息，用于外部 bucket 授权 | 否       |                                                 |
| ram_user.user_id           |                                     | 是       |                                                 |
| ram_user.ak                |                                     | 是       |                                                 |
| ram_user.sk                |                                     | 是       |                                                 |

* 请求示例

```
PUT /MetaService/http/create_instance?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id": "123456",
    "name": "name",
    "user_id": "abcdef",
    "obj_info": {
        "ak": "test-ak1",
        "sk": "test-sk1",
        "bucket": "test-bucket",
        "prefix": "test-prefix",
        "endpoint": "test-endpoint",
        "region": "test-region",
        "provider": "OBS",
        "user_id": "xxx"
    }
    "ram_user": {
        "user_id": string,
        "ak": string,
        "sk": string
    }
}
```
* 返回参数

| 参数名  | 描述    | 是否必须 | 备注                                                       |
|------|-------|------|----------------------------------------------------------|
| code | 返回状态码 | 是    | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg  | 出错原因  | 是    | 若出错返回错误原因，未出错返回空字符串                                      |

* 成功返回示例

```
{
 "code": "OK",
 "msg": ""
}
```

* 失败返回示例
```
{
 "code": "ALREADY_EXISTED",
 "msg": "instance already existed, instance_id=instance_id_deadbeef"
}
```

## 删除 Instance

### 接口描述

本接口用于删除一个已存在的 Instance，标记删除，然后 Recycler 会异步回收资源

### 请求 (Request)

* 请求语法

```
PUT /MetaService/http/drop_instance?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id": string
}
```
* 请求参数

| 参数名                        | 描述                     | 是否必须 | 备注                             |
|----------------------------|------------------------|------|--------------------------------|
| instance_id                | instance_id            | 是    | 全局唯一 (包括历史上)                    |

* 请求示例

```
PUT /MetaService/http/drop_instance?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id": "123456"
}
```
* 返回参数

| 参数名  | 描述    | 是否必须 | 备注                                       |
|------|-------|------|------------------------------------------|
| code | 返回状态码 | 是    | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR |
| msg  | 出错原因  | 是    | 若出错返回错误原因，未出错返回空字符串                      |

* 成功返回示例

```
{
 "code": "OK",
 "msg": ""
}
```

* 失败返回示例
```
{
 "code": "INVALID_ARGUMENT",
 "msg": "failed to drop instance, instance has clusters"
}
```

## 查询 Instance 信息

### 接口描述

本接口用于查询 Instance 下的信息（S3 信息、Cluster 信息、Stage 信息），用于 Debug

### 请求 (Request)

* 请求语法

```
GET /MetaService/http/get_instance?token=greedisgood9999&instance_id={instance_id} HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
```
* 请求参数

| 参数名                        | 描述                     | 是否必须 | 备注                             |
|----------------------------|------------------------|------|--------------------------------|
| instance_id                | instance_id            | 是    | 全局唯一 (包括历史上)                    |

* 请求示例

```
GET /MetaService/http/get_instance?token=greedisgood9999&instance_id=test-instance HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
```
* 返回参数

| 参数名                | 描述                       | 是否必须 | 备注                                       |
|--------------------|--------------------------|------|------------------------------------------|
| code               | 返回状态码                    | 是    | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR |
| msg                | 出错原因                     | 是    | 若出错返回错误原因，未出错返回空字符串                      |
| result             | instance 下的信息             | 是    |                                          |
| result.user_id     | 创建 instance 的 user id       | 是    |                                          |
| result.instance_id | 创建 instance 传入的 instance_id | 是    |                                          |
| result.name        | 创建 instance 的 user name     | 是    |                                          |
| result.clusters    | instance 内的 cluster 列表      | 是    |                                          |
| result.mtime       | instance 的修改时间            | 是    |                                          |
| result.obj_info    | instance 下的 s3 信息列表         | 是    |                                          |
| result.stages      | instance 下的 stages 列表       | 是    |                                          |
| result.status      | instance 的状态信息            | 否    | 若 instance 被 drop，则为"DELETED"               |

* 成功返回示例

```
{
    "code": "OK",
    "msg": "",
    "result": {
        "user_id": "gavin-user-id",
        "instance_id": "regression_instance0",
        "name": "test-instance",
        "clusters": [
            {
                "cluster_id": "RESERVED_CLUSTER_ID_FOR_SQL_SERVER",
                "cluster_name": "RESERVED_CLUSTER_NAME_FOR_SQL_SERVER",
                "type": "SQL",
                "nodes": [
                    {
                        "cloud_unique_id": "1:regression_instance0:regression-cloud-unique-id-fe-1",
                        "ip": "127.0.0.1",
                        "ctime": "1669260437",
                        "mtime": "1669260437",
                        "edit_log_port": 12103,
                        "node_type": "FE_MASTER"
                    }
                ]
            },
            {
                "cluster_id": "regression_test_cluster_id0",
                "cluster_name": "regression_test_cluster_name0",
                "type": "COMPUTE",
                "nodes": [
                    {
                        "cloud_unique_id": "1:regression_instance0:regression-cloud-unique-id0",
                        "ip": "127.0.0.1",
                        "ctime": "1669260437",
                        "mtime": "1669260437",
                        "heartbeat_port": 11102
                    }
                ],
                "mysql_user_name": [
                    "root"
                ]
            },
            {
                "cluster_id": "regression_test_cluster_id1",
                "cluster_name": "regression_test_cluster_name1",
                "type": "COMPUTE",
                "nodes": [
                    {
                        "cloud_unique_id": "1:regression_instance0:regression-cloud-unique-id0",
                        "ip": "127.0.0.1",
                        "ctime": "1669260437",
                        "mtime": "1669260437",
                        "heartbeat_port": 14102
                    }
                ],
                "mysql_user_name": [
                    "jack",
                    "lx"
                ]
            },
            {
                "cluster_id": "regression_test_cluster_id2",
                "cluster_name": "regression_test_cluster_name2",
                "type": "COMPUTE",
                "nodes": [
                    {
                        "cloud_unique_id": "1:regression_instance0:regression-cloud-unique-id0",
                        "ip": "127.0.0.1",
                        "ctime": "1669260437",
                        "mtime": "1669260437",
                        "heartbeat_port": 16102
                    }
                ]
            }
        ],
        "obj_info": [
            {
                "ctime": "1669260437",
                "mtime": "1669260437",
                "id": "1",
                "ak": "akak",
                "sk": "sksk",
                "bucket": "justtmp-bj-1308700295",
                "prefix": "dx-test",
                "endpoint": "cos.ap-beijing.myqcloud.com",
                "region": "ap-beijing",
                "provider": "COS",
                "external_endpoint": ""
            }
        ],
        "stages": [
            {
                "mysql_user_name": [
                    "admin"
                ],
                "obj_info": {
                    "id": "1",
                    "prefix": "dx-test/stage/admin/admin"
                },
                "stage_id": "c56f5d01-0ae2-4719-8be2-8b52b3144f60",
                "mysql_user_id": [
                    "admin"
                ]
            },
            {
                "type": "EXTERNAL",
                "name": "smoke_test_tpch",
                "obj_info": {
                    "ak": "akak",
                    "sk": "sksk",
                    "bucket": "gavin-test-bj",
                    "prefix": "smoke-test",
                    "endpoint": "oss-cn-beijing.aliyuncs.com",
                    "region": "cn-beijing",
                    "provider": "OSS"
                },
                "stage_id": "261c3565-7ac3-4cb5-9c82-a9bc38cff8e8",
                "properties": {
                    "default.file.column_separator": "|"
                }
            }
        ]
    }
}
```

## 创建 cluster

### 接口描述

本接口用于创建一个属于 instance 的 cluster. 这个 cluster 中包含若干（大于等于 0 个）相同类型节点信息，此接口不能用同一参数调用

### 请求 (Request)

* 请求语法

```sql
PUT /MetaService/http/add_cluster?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id": string,
    "cluster": object {
        "cluster_name": string,
        "cluster_id": string,
        "type": enum,
        "nodes": [
            {
                "cloud_unique_id": string,
                "ip": string,
                "heartbeat_port": int
            }
        ]
    }
}
```
* 请求参数

| 参数名                        | 描述                    | 是否必须 | 备注                                                                                                                                                                                                                                                    |
|-------------------------------|--------------------     |------    |--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------                                                                   |
| instance_id                   | instance_id             | 是       | 全局唯一 (包括历史上)                                                                                                                                                                                                                                   |
| cluster                       | cluster 对象信息        | 是       |                                                                                                                                                                                                                                                         |
| cluster.cluster_name          | cluster 的名字          | 是       | 其中 fe 的 cluster 名字特殊，默认 RESERVED_CLUSTER_NAME_FOR_SQL_SERVER，可在 fe.conf 中配置 cloud_observer_cluster_name 修改                                                                                                                            |
| cluster.cluster_id            | cluster 的 id           | 是       | 其中 fe 的 cluster id 特殊，默认 RESERVED_CLUSTER_ID_FOR_SQL_SERVER，可在 fe.conf 中配置 cloud_observer_cluster_id 修改                                                                                                                                 |
| cluster.type                  | cluster 中节点的类型    | 是       | 支持："SQL","COMPUTE"两种 type，"SQL"表示 sql service 对应 fe， "COMPUTE"表示计算机节点对应 be                                                                                                                                                          |
| cluster.nodes                 | cluster 中的节点数组    | 是       |                                                                                                                                                                                                                                                         |
| cluster.nodes.cloud_unique_id | 节点的 cloud_unique_id  | 是       | 是 fe.conf、be.conf 中的 cloud_unique_id 配置项                                                                                                                                                                                                         |
| cluster.nodes.ip              | 节点的 ip               | 是       | 使用FQDN模式部署FE BE时这个字段 填成域名  |
| cluster.nodes.host            | 节点的域名              | 否       | 使用FQDN模式部署FE BE时需要设置这个字段                                                                                                                                                                                                                 |
| cluster.nodes.heartbeat_port  | BE 的 heartbeat port    | BE必填   | 是 be.conf 中的 heartbeat_service_port 配置项                                                                                                                                                                                                           |
| cluster.nodes.edit_log_port   | FE 节点的 edit log port | FE必填   | 是 fe.conf 中的 edit_log_port 配置项                                                                                                                                                                                                                    |
| cluster.nodes.node_type       | FE 节点的类型           | 是       | 当 cluster 的 type 为 SQL 时，需要填写，分为"FE_MASTER" 和 "FE_OBSERVER", 其中"FE_MASTER" 表示此节点为 master， "FE_OBSERVER"表示此节点为 observer，注意：一个 type 为"SQL"的 cluster 的 nodes 数组中只能有一个"FE_MASTER"节点，和若干"FE_OBSERVER"节点 |

* 请求示例

```
PUT /MetaService/http/add_cluster?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id": "123456",
    "cluster": {
        "cluster_name": "cluster_name1",
        "cluster_id": "cluster_id1",
        "type": "COMPUTE",
        "nodes": [
            {
                "cloud_unique_id": "1:regression_instance0:cloud_unique_id_compute_node1",
                "ip": "172.21.0.5",
                "heartbeat_port": 9050
            }
        ]
    }
}
```

* 返回参数

| 参数名  | 描述    | 是否必须 | 备注                                                       |
|------|-------|------|----------------------------------------------------------|
| code | 返回状态码 | 是    | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg  | 出错原因  | 是    | 若出错返回错误原因，未出错返回空字符串                                      |

* 成功返回示例

```
{
 "code": "OK",
 "msg": ""
}
```

* 失败返回示例
```
{
 "code": "INTERANAL_ERROR",
 "msg": "cluster is SQL type, must have only one master node, now master count: 0"
}
```

## 获取 Cluster

### 接口描述

本接口用于获取一个 Cluster 的信息，此接口可以多次重复调用

### 请求 (Request)

* 请求语法

```
PUT /MetaService/http/get_cluster?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id":string,
    "cloud_unique_id":string,
    "cluster_name":string,
    "cluster_id":string
}
```
* 请求参数

| 参数名             | 描述                   | 是否必须 | 备注                                                                          |
|-----------------|----------------------|------|-----------------------------------------------------------------------------|
| cloud_unique_id | cloud_unique_id      | 是    | 通过 cloud_unique_id 去查询 instance_id                                             |
| cluster_name    | cluster 的名字           | 否    | 注：cluster_name、cluster_id、mysql_user_name 三选一，若三个都不填则返回 instance 下所有 cluster 信息  |
| cluster_id      | cluster 的 id           | 否    | 注：cluster_name、cluster_id、mysql_user_name 三选一，若三个都不填则返回 instance 下所有 cluster 信息 |
| mysql_user_name | mysql 用户名配置的可用 cluster | 否    | 注：cluster_name、cluster_id、mysql_user_name 三选一，若三个都不填则返回 instance 下所有 cluster 信息  |

* 请求示例

```
PUT /MetaService/http/get_cluster?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id":"regression_instance0",
    "cloud_unique_id":"1:regression_instance0:regression-cloud-unique-id-fe-1",
    "cluster_name":"RESERVED_CLUSTER_NAME_FOR_SQL_SERVER",
    "cluster_id":"RESERVED_CLUSTER_ID_FOR_SQL_SERVER"
}
```

* 返回参数

| 参数名    | 描述     | 是否必须 | 备注                                                       |
|--------|--------|------|----------------------------------------------------------|
| code   | 返回状态码  | 是    | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg    | 出错原因   | 是    | 若出错返回错误原因，未出错返回空字符串                                      |
| result | 查询结果对象 | 是    |                                                          |

* 成功返回示例

```
{
    "code": "OK",
    "msg": "",
    "result": {
        "cluster_id": "cluster_id1",
        "cluster_name": "cluster_name1",
        "type": "COMPUTE",
        "nodes": [
            {
                "cloud_unique_id": "1:regression_instance0:cloud_unique_id_compute_node0",
                "ip": "172.21.16.42",
                "ctime": "1662695469",
                "mtime": "1662695469",
                "heartbeat_port": 9050
            }
        ]
    }
}
```

* 失败返回示例
```
{
 "code": "NOT_FOUND",
 "msg": "fail to get cluster with instance_id: \"instance_id_deadbeef\" cloud_unique_id: \"1:regression_instance0:xxx_cloud_unique_id_compute_node0\" cluster_name: \"cluster_name\" "
}
```


## 删除 Cluster

### 接口描述

本接口用于删除一个 Instance 下的某个 Cluster 信息，多次用相同参数删除失败报错

### 请求 (Request)

* 请求语法

```
PUT /MetaService/http/drop_cluster?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id":string,
    "cluster": {
        "cluster_name": string,
        "cluster_id": string,
    }
}
```
* 请求参数

| 参数名                  | 描述               | 是否必须 | 备注  |
|----------------------|------------------|------|-----|
| instance_id          | instance_id      | 是    |     |
| cluster              | cluster 对象        | 是    |     |
| cluster.cluster_name | 将删除的 cluster name | 是    |     |
| cluster.cluster_id   | 将删除的 cluster id   | 是    |     |

* 请求示例

```
PUT /MetaService/http/drop_cluster?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id":"regression_instance0",
    "cluster": {
        "cluster_name": "cluster_name1",
        "cluster_id": "cluster_id1",
    }
}
```

* 返回参数

| 参数名  | 描述    | 是否必须 | 备注                                                       |
|------|-------|------|----------------------------------------------------------|
| code | 返回状态码 | 是    | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg  | 出错原因  | 是    | 若出错返回错误原因，未出错返回空字符串                                      |

* 成功返回示例

```
{
 "code": "OK",
 "msg": ""
}
```

* 失败返回示例
```
{
 "code": "INTERANAL_ERROR",
 "msg": "failed to find cluster to drop, instance_id=dx_dnstance_id_deadbeef cluster_id=11111 cluster_name=2222"
}
```


## Cluster 改名

### 接口描述

本接口用于将 Instance 下的某 Cluster 改名，依据传入的 cluster_id 寻找 cluster_name 去 Rename，此接口多次相同参数调用报错

### 请求 (Request)

* 请求语法

```
PUT /MetaService/http/rename_cluster?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id":string,
    "cluster": {
        "cluster_name": string,
        "cluster_id": string,
    }
}
```
* 请求参数

| 参数名                  | 描述               | 是否必须 | 备注                                    |
|----------------------|------------------|------|---------------------------------------|
| instance_id          | instance_id      | 是    |                                       |
| cluster              | cluster 对象        | 是    |                                       |
| cluster.cluster_name | 将改名的 cluster name | 是    | 新的 cluster_name                        |
| cluster.cluster_id   | 将改名的 cluster id   | 是    | 依据此 id 去寻找 cluster，然后 rename cluster_name |

* 请求示例

```
PUT /MetaService/http/rename_cluster?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id":"regression_instance0",
    "cluster": {
        "cluster_name": "cluster_name2",
        "cluster_id": "cluster_id1",
    }
}
```

* 返回参数

| 参数名  | 描述    | 是否必须 | 备注                                                       |
|------|-------|------|----------------------------------------------------------|
| code | 返回状态码 | 是    | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg  | 出错原因  | 是    | 若出错返回错误原因，未出错返回空字符串                                      |

* 成功返回示例

```
{
 "code": "OK",
 "msg": ""
}
```

* 失败返回示例
```
{
 "code": "INTERANAL_ERROR",
 "msg": "failed to rename cluster, name eq original name, original cluster is {\"cluster_id\":\"3333333\",\"cluster_name\":\"444444\",\"type\":\"COMPUTE\"}"
}
```

## Cluster 添加节点

### 接口描述

本接口用于将 Instance 下的某 Cluster 添加若干相同类型的节点，此接口多次相同参数调用报错
可以用于添加FE 或者 BE的节点


### 请求 (Request)

* 请求语法

```
PUT /MetaService/http/add_node?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id": string,
    "cluster": {
        "cluster_name": string,
        "cluster_id": string,
        "type": enum,
        "nodes": [
            {
                "cloud_unique_id": string,
                "ip": string,
                "heartbeat_port": int
            },
            {
                "cloud_unique_id": string,
                "ip": string,
                "heartbeat_port": int
            }
        ]
    }
}
```
* 请求参数

| 参数名                  | 描述                   | 是否必须 | 备注                    |
|----------------------|---------------------------------|------|-----------------------|
| instance_id          | instance_id                     | 是    |                       |
| cluster              | cluster 对象                       | 是    |                       |
| cluster.cluster_name | 将添加 mysql user name 的 cluster name | 是    |                       |
| cluster.cluster_id   | 将添加 mysql user name 的 cluster id   | 是    |                       |
| cluster.type         | cluster 的类型，与上文中 add_cluster 处解释一致 |      |                       |
| cluster.nodes        | cluster 中的节点数组                   | 是    | 与上文 add_cluster 处字段解释一致 |
| cluster.nodes.cloud_unique_id | 节点的 cloud_unique_id  | 是       | 是 fe.conf、be.conf 中的 cloud_unique_id 配置项                                                                                                                                                                                                         |
| cluster.nodes.ip              | 节点的 ip               | 是       | 使用FQDN模式部署FE BE时这个字段 填成域名  |
| cluster.nodes.host            | 节点的域名              | 否       | 使用FQDN模式部署FE BE时需要设置这个字段                                                                                                                                                                                                                 |
| cluster.nodes.heartbeat_port  | BE 的 heartbeat port    | BE必填   | 是 be.conf 中的 heartbeat_service_port 配置项                                                                                                                                                                                                           |
| cluster.nodes.edit_log_port   | FE 节点的 edit log port | FE必填   | 是 fe.conf 中的 edit_log_port 配置项                                                                                                                                                                                                                    |
| cluster.nodes.node_type       | FE 节点的类型           | 是       | 当 cluster 的 type 为 SQL 时，需要填写，分为"FE_MASTER" 和 "FE_OBSERVER", 其中"FE_MASTER" 表示此节点为 master， "FE_OBSERVER"表示此节点为 observer，注意：一个 type 为"SQL"的 cluster 的 nodes 数组中只能有一个"FE_MASTER"节点，和若干"FE_OBSERVER"节点 |

* 请求示例

```
PUT /MetaService/http/add_node?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id": "instance_id_deadbeef_1",
    "cluster": {
        "cluster_name": "cluster_name1",
        "cluster_id": "cluster_id1",
        "type": "COMPUTE",
        "nodes": [
            {
                "cloud_unique_id": "1:regression_instance0:cloud_unique_id_compute_node2",
                "ip": "172.21.0.50",
                "heartbeat_port": 9051
            },
            {
                "cloud_unique_id": "1:regression_instance0:cloud_unique_id_compute_node3",
                "ip": "172.21.0.52",
                "heartbeat_port": 9052
            }
        ]
    }
}
```

* 返回参数

| 参数名  | 描述    | 是否必须 | 备注                                                       |
|------|-------|------|----------------------------------------------------------|
| code | 返回状态码 | 是    | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg  | 出错原因  | 是    | 若出错返回错误原因，未出错返回空字符串                                      |

* 成功返回示例

```
{
 "code": "OK",
 "msg": ""
}
```

* 失败返回示例
```
{
 "code": "INTERANAL_ERROR",
 "msg": "cloud_unique_id is already occupied by an instance, instance_id=instance_id_deadbeef_1 cluster_name=dx_cluster_name1 cluster_id=cluster_id1 cloud_unique_id=cloud_unique_id_compute_node2"
}
```


## Cluster 减少节点

### 接口描述

本接口用于将 Instance 下的某 Cluster 减少若干相同类型的节点

### 请求 (Request)

* 请求语法

```
PUT /MetaService/http/drop_node?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id": string,
    "cluster": {
        "cluster_name": string,
        "cluster_id": string,
        "type": enum,
        "nodes": [
            {
                "cloud_unique_id": string,
                "ip": string,
                "heartbeat_port": int
            },
            {
                "cloud_unique_id": string,
                "ip": string,
                "heartbeat_port": int
            }
        ]
    }
}
```
* 请求参数

| 参数名                  | 描述                              | 是否必须 | 备注  |
|----------------------|---------------------------------|------|-----|
| instance_id          | instance_id                     | 是    |     |
| cluster              | cluster 对象                       | 是    |     |
| cluster.cluster_name | 将添加 mysql user name 的 cluster name | 是    |     |
| cluster.cluster_id   | 将添加 mysql user name 的 cluster id   | 是    |     |
| cluster.type         | cluster 类型                       | 是    |     |
| cluster.node         | cluster 中节点信息                    | 是    | 数组  |

* 请求示例

```
PUT /MetaService/http/drop_node?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id": "instance_id_deadbeef_1",
    "cluster": {
        "cluster_name": "cluster_name1",
        "cluster_id": "cluster_id1",
        "type": "COMPUTE",
        "nodes": [
            {
                "cloud_unique_id": "1:instance_id_deadbeef_1:cloud_unique_id_compute_node2",
                "ip": "172.21.0.50",
                "heartbeat_port": 9051
            },
            {
                "cloud_unique_id": "1:instance_id_deadbeef_1:cloud_unique_id_compute_node3",
                "ip": "172.21.0.52",
                "heartbeat_port": 9052
            }
        ]
    }
}
```


* 返回参数

| 参数名  | 描述    | 是否必须 | 备注                                                       |
|------|-------|------|----------------------------------------------------------|
| code | 返回状态码 | 是    | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg  | 出错原因  | 是    | 若出错返回错误原因，未出错返回空字符串                                      |

* 成功返回示例

```
{
 "code": "OK",
 "msg": ""
}
```

* 失败返回示例
```
{
 "code": "INTERANAL_ERROR",
 "msg": "cloud_unique_id can not find to drop node, instance_id=instance_id_deadbeef_1 cluster_name=cluster_name1 cluster_id=cluster_id1 cloud_unique_id=cloud_unique_id_compute_node2"
}
```

## 为 Cluster 添加默认 user_name

### 接口描述

本接口用于将 instance 下的某 cluster 添加一些用户名，这些用户使用 mysql client 登录进系统，可以使用默认 cluster

### 请求 (Request)

* 请求语法

```
PUT /MetaService/http/update_cluster_mysql_user_name?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id": string,
    "cluster": {
        "cluster_name": "string",
        "cluster_id": "string",
        "mysql_user_name": [
            string
        ]
    }
}
```
* 请求参数

| 参数名                     | 描述                              | 是否必须 | 备注    |
|-------------------------|---------------------------------|------|-------|
| instance_id             | instance_id                     | 是    |       |
| cluster                 | cluster 对象                       | 是    |       |
| cluster.cluster_name    | 将添加 mysql user name 的 cluster name | 是    |       |
| cluster.cluster_id      | 将添加 mysql user name 的 cluster id   | 是    |       |
| cluster.mysql_user_name | mysql user name                 | 是    | 字符串数组 |

* 请求示例

```
PUT /MetaService/http/update_cluster_mysql_user_name?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id": "instance_id_deadbeef",
    "cluster": {
        "cluster_name": "cluster_name2",
        "cluster_id": "cluster_id1",
        "mysql_user_name": [
            "jack",
            "root"
        ]
    }
}
```

* 返回参数

| 参数名  | 描述    | 是否必须 | 备注                                                       |
|------|-------|------|----------------------------------------------------------|
| code | 返回状态码 | 是    | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg  | 出错原因  | 是    | 若出错返回错误原因，未出错返回空字符串                                      |

* 成功返回示例

```
{
 "code": "OK",
 "msg": ""
}
```

* 失败返回示例
```
{
 "code": "INTERANAL_ERROR",
 "msg": "no mysql user name to change"
}
```


## 获取 Cluster 配置的 S3 信息

### 接口描述

本接口用于获取 Instance 配置的 S3 的 ak、sk 信息，可相同参数调用多次

### 请求 (Request)

* 请求语法

```
PUT /MetaService/http/get_obj_store_info?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{"cloud_unique_id": "<cloud_unique_id>"}
```
* 请求参数

| 参数名             | 描述                 | 是否必须 | 备注                                        |
|-----------------|--------------------|------|-------------------------------------------|
| cloud_unique_id | 节点的 cloud_unique_id | 是    | instance 下某节点的 unique_id 查询整个 instance 配置的 S3 信息 |

* 请求示例

```
PUT /MetaService/http/get_obj_store_info?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{"cloud_unique_id": "1:regression_instance0:cloud_unique_id_compute_node1"}
```

* 返回参数

| 参数名    | 描述     | 是否必须 | 备注                                                       |
|--------|--------|------|----------------------------------------------------------|
| code   | 返回状态码  | 是    | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg    | 出错原因   | 是    | 若出错返回错误原因，未出错返回空字符串                                      |
| result | 查询结果对象 | 是    |                                                          |

* 成功返回示例

```
{
    "code": "OK",
    "msg": "",
    "result": {
        "obj_info": [
            {
                "ctime": "1662543056",
                "mtime": "1662543056",
                "id": "1",
                "ak": "xxxx",
                "sk": "xxxxx",
                "bucket": "doris-xxx-1308700295",
                "prefix": "selectdb-xxxx-regression-prefix",
                "endpoint": "cos.ap-yyy.xxxx.com",
                "region": "ap-xxx"
            }
        ]
    }
}
```

* 失败返回示例
```
{
 "code": "INVALID_ARGUMENT",
 "msg": "empty instance_id"
}
```


## 更新 Instance 的 ak、sk 信息

### 接口描述

本接口用于更新 Instance 配置的 S3 和 RAM_USER 的 ak、sk 信息，使用 user_id 去查询修改项，一般用于 ak、sk 轮转，使用相同参数调用此接口会报错

### 请求 (Request)

* 请求语法

```
PUT /MetaService/http/update_ak_sk?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id": string,
    "internal_bucket_user":[
    	{
	        "user_id": string,
	    	"ak": string,
	    	"sk": string
    	},
    	{
    		"user_id": string,
    		"ak": string,
    		"sk": string
    	}
    ],
    "ram_user": {
    	"user_id": string,
    	"ak": string,
    	"sk": string
    }
}
```
* 请求参数

| 参数名             | 描述                              | 是否必须 | 备注        |
|-----------------|---------------------------------|------|-----------|
| instance_id     | instance_id                     | 是    |           |
| internal_bucket_user  | 需修改的 bucket_user 列表     | 和 ram_user 至少存在一个   | 数组 |
| internal_bucket_user.user_id  | 账号 user_id        | 是    | |
| internal_bucket_user.ak  |                        | 是    |           |
| internal_bucket_user.sk  |                        | 是    |     |
| ram_user              | 需修改的 ram_user   | 和 internal_bucket_user 至少存在一个   |     |
| ram_user.user_id  |  账号 user_id                   | 是    |     |
| ram_user.ak  |                                    | 是    |     |
| ram_user.sk  |                                    | 是    |     |

* 请求示例

```
PUT /MetaService/http/update_ak_sk?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id":"test",
    "internal_bucket_user":[
    	{
	    	"user_id": "bucket_user_id_1",
	    	"ak": "xxxx",
	    	"sk": "xxxx"
    	},
    	{
    		"user_id": "bucket_user_id_2",
    		"ak": "xxxx",
    		"sk": "xxxx"
    	}
    ],
    "ram_user": {
    	"user_id": "ram_user_id",
    	"ak": "xxxx",
    	"sk": "xxxx"
    }
}
```

* 返回参数

| 参数名  | 描述    | 是否必须 | 备注                                                       |
|------|-------|------|----------------------------------------------------------|
| code | 返回状态码 | 是    | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg  | 出错原因  | 是    | 若出错返回错误原因，未出错返回空字符串                                      |

* 成功返回示例

```
{
 "code": "OK",
 "msg": ""
}
```

* 失败返回示例
```
{
 "code": "INVALID_ARGUMENT",
 "msg": "ak sk eq original, please check it"
}
```

## 更新 Instance 的 ak、sk 信息 (2.3 版本之前的方法)

### 接口描述

本接口用于更新 Instance 配置的 S3 的 ak、sk 信息，使用 ID 去查询修改项，ID 可以用 get_obj_store_info 查询得到，多次相同参数调用此接口会报错

### 请求 (Request)

* 请求语法

```
PUT /MetaService/http/legacy_update_ak_sk?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "cloud_unique_id": string,
    "obj": {
        "id": string,
        "ak": string,
        "sk": string,
    }
}
```
* 请求参数

| 参数名             | 描述                              | 是否必须 | 备注        |
|-----------------|---------------------------------|------|-----------|
| cloud_unique_id | 节点的 cloud_unique_id              | 是    |           |
| obj             | obj 对象                           | 是    | S3 信息对象    |
| obj.id          | 将添加 mysql user name 的 cluster name | 是    | id 支持从 1 到 10 |
| obj.ak          | 将添加 mysql user name 的 cluster id   | 是    |           |
| obj.sk          | mysql user name                 | 是    | 字符串数组     |

* 请求示例

```
PUT /MetaService/http/legacy_update_ak_sk?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "cloud_unique_id": "1:regression_instance0:cloud_unique_id_compute_node1",
    "obj": {
        "id": "1",
        "ak": "test-ak",
        "sk": "test-sk",
    }
}
```

* 返回参数

| 参数名  | 描述    | 是否必须 | 备注                                                       |
|------|-------|------|----------------------------------------------------------|
| code | 返回状态码 | 是    | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg  | 出错原因  | 是    | 若出错返回错误原因，未出错返回空字符串                                      |

* 成功返回示例

```
{
 "code": "OK",
 "msg": ""
}
```

* 失败返回示例
```
{
 "code": "INVALID_ARGUMENT",
 "msg": "ak sk eq original, please check it"
}
```


## 添加 Instance 的 S3 信息

### 接口描述

本接口用于添加 Instance 配置的 S3 的信息，最多支持添加 10 条 S3 信息，每条配置最多不超过 1024 字节大小

### 请求 (Request)

* 请求语法

```
PUT /MetaService/http/add_obj_info?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "cloud_unique_id": string,
    "obj": {
        "ak": string,
        "sk": string,
        "bucket": string,
        "prefix": string,
        "endpoint": string,
        "region": string
    }
}
```
* 请求参数

| 参数名             | 描述                 | 是否必须 | 备注     |
|-----------------|--------------------|------|--------|
| cloud_unique_id | 节点的 cloud_unique_id | 是    |        |
| obj             | obj 对象              | 是    | S3 信息对象 |
| obj.ak          | 将添加 S3 的 ak           | 是    |        |
| obj.sk          | 将添加 S3 的 sk           | 是    |        |
| obj.bucket      | 将添加 S3 的 bucket       | 是    |        |
| obj.prefix      | 将添加 S3 的 prefix       | 是    |        |
| obj.endpoint    | 将添加 S3 的 endpoint     | 是    |        |
| obj.region      | 将添加 S3 的 region       | 是    |        |

* 请求示例

```
PUT /MetaService/http/add_obj_info?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "cloud_unique_id": "1:regression_instance0:cloud_unique_id_compute_node1",
    "obj": {
        "ak": "test-ak91",
        "sk": "test-sk1",
        "bucket": "test-bucket",
        "prefix": "test-prefix",
        "endpoint": "test-endpoint",
        "region": "test-region"
    }
}
```

* 返回参数

| 参数名  | 描述    | 是否必须 | 备注                                                       |
|------|-------|------|----------------------------------------------------------|
| code | 返回状态码 | 是    | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg  | 出错原因  | 是    | 若出错返回错误原因，未出错返回空字符串                                      |

* 成功返回示例

```
{
 "code": "OK",
 "msg": ""
}
```

* 失败返回示例
```
{
 "code": "INVALID_ARGUMENT",
 "msg": "s3 conf info err, please check it"
}
```

## 解码 Meta Service 中 Key 的信息

### 接口描述

本接口用于 `decode` Meta Service Log 中的 Key 的信息，调试用

### 请求 (Request)

* 请求语法

```
GET /MetaService/http/decode_key?token=greedisgood9999&key={key} HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
```
* 请求参数

| 参数名     | 描述          | 是否必须 | 备注  |
|---------|-------------|------|-----|
| key     | 待 decode 的 key | 是    |     |
| unicode | 返回格式调整      | 否    |     |

* 请求示例

```
GET /MetaService/http/decode_key?token=greedisgood9999&key=0110696e7374616e636500011072656772657373696f6e5f696e7374616e6365300001 HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
```

* 成功返回示例

```
┌───────────────────────── 0. key space: 1
│ ┌─────────────────────── 1. instance
│ │                     ┌─ 2. regression_instance0
│ │                     │
▼ ▼                     ▼
0110696e7374616e636500011072656772657373696f6e5f696e7374616e6365300001
```

## 查询 Tablet 状态

### 接口描述

本接口用于查询 Tablet 状态，调试用

### 请求 (Request)

* 请求语法

```
POST /MetaService/http/get_tablet_stats?token=greedisgood9999 HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "cloud_unique_id": string,
    "tablet_idx": [{
        "table_id": int64,
        "index_id": int64,
        "partition_id": int64,
        "tablet_id": int64
    }]
}
```
* 请求参数

| 参数名                     | 描述                     | 是否必须 | 备注  |
|-------------------------|------------------------|------|-----|
| cloud_unique_id         | 节点的 cloud_unique_id     | 是    |     |
| tablet_idx              | 待查询 tablet 列表（数组）        | 是    |     |
| tablet_idx.table_id     | 待查询 tablet 的 table_id     | 是    |     |
| tablet_idx.index_id     | 待查询 tablet 的 index_id     | 是    |     |
| tablet_idx.partition_id | 待查询 tablet 的 partition_id | 是    |     |
| tablet_idx.tablet_id    | 待查询 tablet 的 tablet_id    | 是    |     |

* 请求示例

```
POST /MetaService/http/get_tablet_stats?token=greedisgood9999 HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "cloud_unique_id":"1:regression_instance0:regression-cloud-unique-id0",
    "tablet_idx": [{
        "table_id":113973,
        "index_id":113974,
        "partition_id":113966,
        "tablet_id":114739
    }]
}
```

* 成功返回示例

```
status {
  code: OK
  msg: ""
}
tablet_stats {
  idx {
    table_id: 113973
    index_id: 113974
    partition_id: 113966
    tablet_id: 114739
  }
  data_size: 0
  num_rows: 0
  num_rowsets: 2
  num_segments: 0
  base_compaction_cnt: 0
  cumulative_compaction_cnt: 0
  cumulative_point: 2
}
```

## Abort 事务

### 接口描述

本接口用于 Abort 事务，调试用

### 请求 (Request)

* 请求语法

```
POST /MetaService/http/abort_txn?token=greedisgood9999 HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "cloud_unique_id": string,
    "txn_id": int64
}
or
{
    "cloud_unique_id": string,
    "db_id": int64,
    "label": string
}
```
* 请求参数

| 参数名               | 描述                   | 是否必须 | 备注                  |
|-------------------|----------------------|------|---------------------|
| cloud_unique_id   | 节点的 cloud_unique_id   | 是    |                     |
| txn_id            | 待 abort 事务 id           | 否    |                     |
| db_id             | 待 abort 事务所属 db_id      | 否    |                     |
| label             | 待 abort 事务 label        | 否    |                     |

* 请求示例

```
POST /MetaService/http/abort_txn?token=greedisgood9999 HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "cloud_unique_id": "1:regression_instance0:regression-cloud-unique-id0",
    "txn_id": 869414052004864
}

```

* 成功返回示例

```
status {
  code: OK
  msg: ""
}
```

## Abort Tablet Job

### 接口描述

本接口用于 Abort Tablet 上的 Job，当前只支持 Compaction Job，调试用

### 请求 (Request)

* 请求语法

```
POST /MetaService/http/abort_tablet_job?token=greedisgood9999 HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "cloud_unique_id": string,
    "job" : {
        "idx": {"tablet_id": int64},
        "compaction": [{"id": string}]
    }
}
```
* 请求参数

| 参数名               | 描述                   | 是否必须 | 备注                  |
|-------------------|----------------------|------|---------------------|
| cloud_unique_id   | 节点的 cloud_unique_id   | 是    |                     |
| job               | 待 abort 的 job 事务         | 是    | 当前只支持 compaction job |
| job.idx           | 待 abort 的 idx           | 是    |                     |
| job.idx.tablet_id | 待 abort.idx 的 tablet_id |      |                     |
| job.compaction    | 待 abort 的 compaction    |      | 数组                  |
| job.compaction.id | 待 abort.compaction 的 id |      |                     |

* 请求示例

```
POST /MetaService/http/abort_tablet_job?token=greedisgood9999 HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "cloud_unique_id": "1:regression_instance0:regression-cloud-unique-id0",
    "job" : {
        "idx": {"tablet_id": 113973},
        "compaction": [{"id": 113974}]
    }
}

```

* 成功返回示例

```
status {
  code: OK
  msg: ""
}
```


## 获取 Cluster 下的 BE 节点执行情况

### 接口描述

本接口用于获取 Cluster 下，BE 节点运行 Fragment 的情况，注意此接口是请求 FE 的接口

### 请求 (Request)

* 请求语法

```
GET /rest/v2/manager/cluster/cluster_info/cloud_cluster_status HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain


```
* 请求参数

| 参数名             | 描述                              | 是否必须 | 备注        |
|-----------------|---------------------------------|------|-----------|
| user     |        用户名                     | 是    |        鉴权信息   |
| password  |       密码                              | 是    |      鉴权信息     |


* 请求示例

```
curl -u root: http://127.0.0.1:12100/rest/v2/manager/cluster/cluster_info/cloud_cluster_status
```

* 返回参数

| 参数名  | 描述    | 是否必须 | 备注                                                       |
|------|-------|------|----------------------------------------------------------|
| code | 返回状态码 | 是    ||
| msg  | 出错原因  | 是    |                                  |
|data | 返回的一个 map，key 为 clusterId, value 为 be 列表 | |

* 成功返回示例

```
{
    "msg": "success",
    "code": 0,
    "data": {
        "regression_cluster_id2": [
            {
                "host": "127.0.0.1",
                "heartbeatPort": 14102,
                "bePort": -1,
                "httpPort": -1,
                "brpcPort": -1,
                "currentFragmentNum": 0,
                "lastFragmentUpdateTime": 0
            }
        ],
        "regression_test_cluster_id0": [
            {
                "host": "127.0.0.1",
                "heartbeatPort": 11102,
                "bePort": 11100,
                "httpPort": 11101,
                "brpcPort": 11103,
                "currentFragmentNum": 3,
                "lastFragmentUpdateTime": 1684152350291
            }
        ]
    },
    "count": 0
}
```

## Instance 开启对象数据服务端加密

### 接口描述

本接口用于开启 Instance 对象数据服务端加密

### 请求 (Request)

* 请求语法

```
PUT /MetaService/http/enable_instance_sse?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id": string
}
```
* 请求参数

| 参数名                        | 描述                     | 是否必须 | 备注                             |
|----------------------------|------------------------|------|--------------------------------|
| instance_id                | instance_id            | 是    | 全局唯一 (包括历史上)                    |

* 请求示例

```
PUT /MetaService/http/enable_instance_sse?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id": "123456"
}
```
* 返回参数

| 参数名  | 描述    | 是否必须 | 备注                                       |
|------|-------|------|------------------------------------------|
| code | 返回状态码 | 是    | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR |
| msg  | 出错原因  | 是    | 若出错返回错误原因，未出错返回空字符串                      |

* 成功返回示例

```
{
 "code": "OK",
 "msg": ""
}
```

* 失败返回示例
```
{
 "code": "INVALID_ARGUMENT",
 "msg": "failed to enable sse, instance has enabled sse"
}
```

## 获取计算集群的运行状态

### 接口描述

本接口用于获取多个 Warehouse 下，获取 Cluster 的运行状态

### 请求 (Request)

* 请求语法

```
PUT /MetaService/http/get_cluster_status?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{
    "instance_ids": [string, string],
    "status": string
}
```
* 请求参数

| 参数名              | 描述                | 是否必须 | 备注                                              |
|------------------|-------------------|------|-------------------------------------------------|
| instance_ids     | 多个 warehouse 的 id    | 是    |                                                 |
| cloud_unique_ids | 多个 cloud_unique_id | 否    | 优先选择 instance_ids                                |
| status           | 查询过滤条件 | 否    | 可有"NORMAL", "STOPPED", "TO_RESUME",   不填返回所有状态的 |


* 请求示例

```
curl '127.0.0.1:5008/MetaService/http/get_cluster_status?token=greedisgood9999' -d '{
    "instance_ids":["regression_instance-dx-1219", "regression_instance-dx-0128"],
    "status":"NORMAL"
}
```

* 返回参数

| 参数名            | 描述              | 是否必须 | 备注                                                       |
|----------------|-----------------|------|----------------------------------------------------------|
| code           | 返回状态码           | 是    ||
| msg            | 出错原因            | 是    |                                  |
| result.details | 返回 clusters 的状态列表 | 是    |

* 成功返回示例

```
{
    "code": "OK",
    "msg": "",
    "result": {
        "details": [
            {
                "instance_id": "regression_instance-dx-1219",
                "clusters": [
                    {
                        "cluster_id": "regression_cluster_id2",
                        "cluster_name": "regression_cluster_name2-changed-again",
                        "cluster_status": "NORMAL"
                    },
                    {
                        "cluster_id": "regression_cluster_id3",
                        "cluster_name": "regression_cluster_name3",
                        "cluster_status": "NORMAL"
                    },
                    {
                        "cluster_id": "regression_test_cluster_id0",
                        "cluster_name": "regression_test_cluster_name0",
                        "cluster_status": "NORMAL"
                    }
                ]
            }
        ]
    }
}
```

## 设置计算集群的运行状态

### 接口描述

本接口用于设置某个 Warehouse 下计算节点的 Cluster 的运行状态

### 请求 (Request)

* 请求语法

```
PUT /MetaService/http/set_cluster_status?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{
    "cloud_unique_id": string,
    "cluster": {
        "cluster_id": string,
        "cluster_status":string
    }
}
```
* 请求参数


| 参数名            | 描述              | 是否必须 | 备注                                                       |
|----------------|-----------------|------|----------------------------------------------------------|
| cloud_unique_id           |            | 否    ||
| instance_id            |             | 是    |                                  |
| cluster_id | 待操作的 cluster_id | 是    ||
| cluster_status | 待操作的 cluster 状态 | 是    |可有"NORMAL", "STOPPED", "TO_RESUME"|

* 请求示例

```
curl '127.0.0.1:5008/MetaService/http/set_cluster_status?token=greedisgood9999' -d '{
    "cloud_unique_id": "1:regression_instance0:regression-cloud-unique-id-fe-0128",
    "cluster": {
        "cluster_id": "test_cluster_1_id1",
        "cluster_status":"STOPPED"
    }
}'
```

* 返回参数

| 参数名            | 描述              | 是否必须 | 备注                                                       |
|----------------|-----------------|------|----------------------------------------------------------|
| code           | 返回状态码           | 是    ||
| msg            | 出错原因            | 是    |                                  |

* 成功返回示例

```
{
    "code": "OK",
    "msg": ""
}
```

* 注意，由于这个接口是云管、FE 都会用到的，在设置状态的时候会有个状态变化的限制。

只允许以下状态变换：

1. ClusterStatus::UNKNOWN -> ClusterStatus::NORMAL（云管创建 cluster 的时候，将初始状态直接置为 NORMAL，add_cluster 接口中）

2. ClusterStatus::NORMAL -> ClusterStatus::SUSPENDED（云管暂停 cluster 时候设置）

3. ClusterStatus::SUSPENDED -> ClusterStatus::TO_RESUME（fe 唤起 cluster 时候设置）

4. ClusterStatus::TO_RESUME -> ClusterStatus::NORMAL（云管将 cluster 状态拉起后设置）

若不在上面的状态变化中的修改状态会报错：
```
{
    "code": "INVALID_ARGUMENT",
    "msg": "failed to set cluster status, original cluster is NORMAL and want set TO_RESUME"
}
```

## 设置 Instance 状态

### 接口描述

本接口用于设置某个 Warehouse 的状态为 NORMAL 或者 OVERDUE

### 请求 (Request)

* 请求语法

```
PUT /MetaService/http/set_instance_status?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{
    "instance_id": string
    "op": string
}
```

* 请求参数

| 参数名            | 描述              | 是否必须 | 备注                                                       |
|----------------|-----------------|------|----------------------------------------------------------|
| instance_id            |             | 是    |                                  |
| op | 值需要为"SET_NORMAL", "SET_OVERDUE"中的一个 | 是 | 

* 请求示例

```
curl '127.0.0.1:5000/MetaService/http/set_instance_status?token=greedisgood9999' -d '{
    "instance_id":"test_instance",
    "op": "SET_OVERDUE"
}'
```

* 返回参数

| 参数名            | 描述              | 是否必须 | 备注                                                       |
|----------------|-----------------|------|----------------------------------------------------------|
| code           | 返回状态码           | 是    ||
| msg            | 出错原因            | 是    |                                  |

* 成功返回示例

```
{
    "code": "OK",
    "msg": ""
}
```

--------------------------------------------------------------------------------
<!--
vim: nowrap:
-->
