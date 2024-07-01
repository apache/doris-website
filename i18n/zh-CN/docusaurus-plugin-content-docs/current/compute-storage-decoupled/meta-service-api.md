---
{
    "title": "Meta Service API 参考",
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

本文介绍 Meta Service 提供的所有 API。

## API 版本

为了兼容和扩展的需要，未来所有接口实现中均附带明确的版本号，使用时建议附带版本号加以区分。目前，所有已有接口均已添加`v1/`作为版本标识。

以 `create_instance` 为例，附带 API 版本的接口为：

```Plain
PUT /MetaService/http/v1/create_instance?token=<token> HTTP/1.1
```

为了保证兼容性，已有的接口不附带 `v1/` 仍能访问。

## 字段值要求

部分字段的取值范围以及格式要求需要特别注意。

| 字段            | 描述                                                         | 备注                                                       |
| --------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| instance_id     | 存算分离架构下数仓的 ID，一般使用 UUID 字符串                | 要求历史上唯一                                             |
| cloud_unique_id | 存算分离架构下 be.conf fe.conf 的一个配置，创建计算集群请求时也需提供，格式为 `1:<instance_id>:<string> ` | 示例 "1:regression_instance0:regression-cloud-unique-id-1" |
| cluster_name    | 存算分离架构下描述一个计算集群时需要传入的字段，格式要求为一个 identifier, 需要匹配模式` [a-zA-Z][0-9a-zA-Z_]+` | 实例 write_cluster 或者 read_cluster0                      |

## 创建存储后端的 Instance

### 接口描述

本接口用于创建一个 Instance，支持使用一个或多个存储后端（包括 HDFS 和 S3）。该 Instance 不包含任何节点信息，不能多次创建同一个 `instance_id` 的 Instance。

### 请求

**基于 HDFS 为存储后端的请求**

- 创建基于 HDFS 为存储后端的请求语法

```Bash
PUT /MetaService/http/create_instance?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
  "instance_id": string,
  "name": string,
  "user_id": string,
  "vault": {
    "hdfs_info" : {
      "build_conf": {
        "fs_name": string,
        "user": string,
        "hdfs_kerberos_keytab": string,
        "hdfs_kerberos_principal": string,
        "hdfs_confs" : [
          {
            "key": string,
            "value": string
          }
        ]
      },
      "prefix": string
    }
  }
}
```

- 创建基于 HDFS 为存储后端的请求参数

| 参数名                                   | 描述                          | 是否必须 | 备注                                             |
| ---------------------------------------- | ----------------------------- | -------- | ------------------------------------------------ |
| instance_id                              | instance_id                   | 是       | 全局唯一（包括历史上），一般使用一个 UUID 字符串 |
| name                                     | Instance 别名                 | 否       |                                                  |
| user_id                                  | 用户 ID                       | 是       |                                                  |
| vault                                    | Storage Vault 的信息          | 是       |                                                  |
| vault.hdfs_info                          | 描述 HDFS 存储后端的信息      | 是       |                                                  |
| vault.build_conf                         | 描述 HDFS 存储后端主要信息    | 是       |                                                  |
| vault.build_conf.fs_name                 | HDFS 的名称，一般为连接的地址 | 是       |                                                  |
| vault.build_conf.user                    | 连接该 HDFS 使用的 User       | 是       |                                                  |
| vault.build_conf.hdfs_kerberos_keytab    | Kerberos Keytab 的路径        | 否       | 使用 Kerberos 鉴权时需要提供                     |
| vault.build_conf.hdfs_kerberos_principal | Kerberos Principal 的信息     | 否       | 使用 Kerberos 鉴权时需要提供                     |
| vault.build_conf.hdfs_confs              | HDFS 的其他描述属性           | 否       | 按需填写                                         |
| vault.prefix                             | 数据存放的前缀                | 是       |                                                  |

- 创建基于 HDFS 为存储后端的请求示例

```Plain
PUT /MetaService/http/create_instance?token=greedisgood9999 HTTP/1.1
Content-Length: 550
Content-Type: text/plain
{
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
}
```

**创建基于对象存储为存储后端的请求**

- 创建基于对象存储为存储后端的请求语法

```Bash
PUT /MetaService/http/create_instance?token=<token HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
  "instance_id": string,
  "name": string,
  "user_id": string,
  "vault": {
    "obj_info": {
      "ak": string,
      "sk": string,
      "bucket": string,
      "prefix": string,
      "endpoint": string,
      "external_endpoint": string,
      "region": string,
      "provider": string
    }
  }
}
```

- 创建基于对象存储为存储后端的请求参数

| 参数名                     | 描述                                                         | 是否必须 | 备注                                                         |
| -------------------------- | ------------------------------------------------------------ | -------- | ------------------------------------------------------------ |
| instance_id                | instance_id                                                  | 是       | 全局唯一（包括历史上），一般使用一个 UUID 字符串             |
| name                       | Instance 名称                                                | 否       |                                                              |
| user_id                    | 创建 Instance 的用户 ID                                      | 是       |                                                              |
| vault.obj_info             | S3 链接配置信息                                              | 是       |                                                              |
| vault.obj_info.ak          | S3 的 Access Key                                             | 是       |                                                              |
| vault.obj_info.sk          | S3 的 Secret Key                                             | 是       |                                                              |
| vault.obj_info.bucket      | S3 的 Bucket 名                                              | 是       |                                                              |
| vault.obj_info.prefix      | S3 上数据存放位置前缀                                        | 否       | 若不填写该参数，则默认存放位置在 Bucket 的根目录             |
| obj_info.endpoint          | S3 的 Endpoint 信息                                          | 是       | 域名或 IP:端口，不包含 `http://` 等 scheme 前缀              |
| obj_info.region            | S3 的 Region 信息                                            | 是       | 若使用 MinIO，该参数可填任意值                               |
| obj_info.external_endpoint | S3 的 External Endpoint 信息                                 | 是       | 一般与 Endpoint 一致即可，兼容 OSS，注意 OSS 有 External 和 Internal 之分 |
| vault.obj_info.provider    | S3 的 Provider 信息，可选值包括：OSS, S3, COS, OBS, BOS, GCP, AZURE | 是       | 若使用 MinIO，直接填 S3 即可                                 |

- 创建基于对象存储为存储后端的请求示例

```Bash
PUT /MetaService/http/create_instance?token=greedisgood9999 HTTP/1.1
Content-Length: 441
Content-Type: text/plain

{
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
}
```

- 返回参数

| 参数名 | 描述       | 是否必须 | 备注                                                         |
| ------ | ---------- | -------- | ------------------------------------------------------------ |
| code   | 返回状态码 | 是       | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg    | 错误原因   | 是       | 若发生错误，则返回错误原因；若未发生错误，则返回空字符串     |

- 成功返回示例

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- 失败返回示例

```Plain
{
 "code": "ALREADY_EXISTED",
 "msg": "instance already existed, instance_id=instance_id_deadbeef"
}
```

## 创建非存储后端的 Instance 

:::tips

历史遗留接口，新版本已弃用，私有化部署请勿使用。

:::

### 接口描述

本接口用于创建一个 Instance，该 Instance 仅使用 S3 作为其存储后端，并且只能使用一个存储后端。该 Instance 不包含任何节点信息，不能多次创建同一个 `instance_id` 的 Instance。

### 请求

- 请求语法

```Bash
PUT /MetaService/http/create_instance?token=<token HTTP/1.1
Content-Length: <ContentLength
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

- 请求参数

| 参数名                     | 描述                                | 是否必须 | 备注                                             |
| -------------------------- | ----------------------------------- | -------- | ------------------------------------------------ |
| instance_id                | instance_id                         | 是       | 全局唯一（包括历史上），一般使用一个 UUID 字符串 |
| name                       | Instance 别名                       | 否       |                                                  |
| user_id                    | 用户 ID                             | 是       |                                                  |
| obj_info                   | S3 链接配置信息                     | 是       |                                                  |
| obj_info.ak                | S3 的 Access Key                    | 是       |                                                  |
| obj_info.sk                | S3 的 Secret Key                    | 是       |                                                  |
| obj_info.bucket            | S3 的 Bucket 名                     | 是       |                                                  |
| obj_info.prefix            | S3 上数据存放位置前缀               | 否       | 若不填写该参数，则默认存放位置在 Bucket 的根目录 |
| obj_info.endpoint          | S3 的 Endpoint 信息                 | 是       | 域名或 IP:端口，不包含 `http://` 等 scheme 前缀  |
| obj_info.region            | S3 的 Region 信息                   | 是       |                                                  |
| obj_info.external_endpoint | S3 的 External Endpoint 信息        | 否       | 兼容 OSS，注意 OSS 有 External 和 Internal 之分  |
| obj_info.provider          | S3 的 Provider 信息                 | 是       |                                                  |
| obj_info.user_id           | Bucket 的 user_id                   | 否       | 用于在轮转 AK/SK 中标识需要更改 AK/SK 的对象     |
| ram_user                   | ram_user 信息，用于外部 Bucket 授权 | 否       |                                                  |
| ram_user.user_id           |                                     | 是       |                                                  |
| ram_user.ak                |                                     | 是       |                                                  |
| ram_user.sk                |                                     | 是       |                                                  |

- 请求示例

```Plain
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

- 返回参数

| 参数名 | 描述       | 是否必须 | 备注                                                         |
| ------ | ---------- | -------- | ------------------------------------------------------------ |
| code   | 返回状态码 | 是       | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg    | 错误原因   | 是       | 若发生错误，则返回错误原因；若未发生错误，则返回空字符串     |

- 成功返回示例

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- 失败返回示例

```Plain
{
 "code": "ALREADY_EXISTED",
 "msg": "instance already existed, instance_id=instance_id_deadbeef"
}
```

## 删除 Instance

### 接口描述

本接口用于删除一个已存在的 Instance，标记删除后，Recycler 会异步回收资源。

### 请求

- 请求语法

```Plain
PUT /MetaService/http/drop_instance?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{
    "instance_id": string
}
```

- 请求参数

| 参数名      | 描述        | 是否必须 | 备注                   |
| ----------- | ----------- | -------- | ---------------------- |
| instance_id | instance_id | 是       | 全局唯一（包括历史上） |

- 请求示例

```Plain
PUT /MetaService/http/drop_instance?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{
    "instance_id": "123456"
}
```

- 返回参数

| 参数名 | 描述       | 是否必须 | 备注                                                     |
| ------ | ---------- | -------- | -------------------------------------------------------- |
| code   | 返回状态码 | 是       | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR        |
| msg    | 错误原因   | 是       | 若发生错误，则返回错误原因；若未发生错误，则返回空字符串 |

- 成功返回示例

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- 失败返回示例

```Plain
{
 "code": "INVALID_ARGUMENT",
 "msg": "failed to drop instance, instance has clusters"
}
```

## 查询 Instance 信息

### 接口描述

本接口用于查询 Instance 下的信息（包括 S3 信息、Cluster 信息、Stage 信息等），可用于 Debug。

### 请求

- 请求语法

```Plain
GET /MetaService/http/get_instance?token=greedisgood9999&instance_id={instance_id} HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
```

- 请求参数

| 参数名      | 描述        | 是否必须 | 备注                   |
| ----------- | ----------- | -------- | ---------------------- |
| instance_id | instance_id | 是       | 全局唯一（包括历史上） |

- 请求示例

```Plain
GET /MetaService/http/get_instance?token=greedisgood9999&instance_id=test-instance HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
```

- 返回参数

| 参数名             | 描述                             | 是否必须 | 备注                                                     |
| ------------------ | -------------------------------- | -------- | -------------------------------------------------------- |
| code               | 返回状态码                       | 是       | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR        |
| msg                | 错误原因                         | 是       | 若发生错误，则返回错误原因；若未发生错误，则返回空字符串 |
| result             | Instance 下的信息                | 是       |                                                          |
| result.user_id     | 创建 Instance 的 User ID         | 是       |                                                          |
| result.instance_id | 创建 Instance 传入的 instance_id | 是       |                                                          |
| result.name        | 创建 Instance 的 User Name       | 是       |                                                          |
| result.clusters    | Instance 内的 Cluster 列表       | 是       |                                                          |
| result.mtime       | Instance 的修改时间              | 是       |                                                          |
| result.obj_info    | Instance 下的 S3 信息列表        | 是       |                                                          |
| result.stages      | Instance 下的 Stages 列表        | 是       |                                                          |
| result.status      | Instance 的状态信息              | 否       | 若 Instance 被 drop，则为"DELETED"                       |

- 成功返回示例

```Plain
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

## 设置 Instance 状态

### 接口描述

本接口用于将某个 Instance 的状态设置为 `NORMAL` 或者 `OVERDUE`。

### 请求

- 请求语法

```Plain
PUT /MetaService/http/set_instance_status?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{
    "instance_id": string
    "op": string
}
```

- 请求参数

| 参数名      | 描述                                        | 是否必须 | 备注 |
| ----------- | ------------------------------------------- | -------- | ---- |
| instance_id |                                             | 是       |      |
| op          | 值需要为"SET_NORMAL", "SET_OVERDUE"中的一个 | 是       |      |

- 请求示例

```Plain
curl '127.0.0.1:5000/MetaService/http/set_instance_status?token=greedisgood9999' -d '{
    "instance_id":"test_instance",
    "op": "SET_OVERDUE"
}'
```

- 返回参数

| 参数名 | 描述       | 是否必须 | 备注 |
| ------ | ---------- | -------- | ---- |
| code   | 返回状态码 | 是       |      |
| msg    | 错误原因   | 是       |      |

- 成功返回示例

```Plain
{
    "code": "OK",
    "msg": ""
}
```

## 获取 Instance 配置的 S3 信息

### 接口描述

本接口用于获取 Instance 配置的 S3 的 AK/SK 信息，此接口可使用相同参数调用多次。

### 请求

- 请求语法

```Plain
PUT /MetaService/http/get_obj_store_info?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{"cloud_unique_id": "<cloud_unique_id>"}
```

- 请求参数

| 参数名          | 描述                   | 是否必须 | 备注                                                         |
| --------------- | ---------------------- | -------- | ------------------------------------------------------------ |
| cloud_unique_id | 节点的 cloud_unique_id | 是       | Instance 下某节点的 unique_id 可用于查询整个 Instance 配置的 S3 信息 |

- 请求示例

```Plain
PUT /MetaService/http/get_obj_store_info?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{"cloud_unique_id": "1:regression_instance0:cloud_unique_id_compute_node1"}
```

- 返回参数

| 参数名 | 描述         | 是否必须 | 备注                                                         |
| ------ | ------------ | -------- | ------------------------------------------------------------ |
| code   | 返回状态码   | 是       | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg    | 错误原因     | 是       | 若发生错误，则返回错误原因；若未发生错误，则返回空字符串     |
| result | 查询结果对象 | 是       |                                                              |

- 成功返回示例

```Plain
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

- 失败返回示例

```Plain
{
 "code": "INVALID_ARGUMENT",
 "msg": "empty instance_id"
}
```

## 更新 Instance 的 AK/SK 信息

### 接口描述

本接口用于更新 Instance 配置的 S3 和 RAM_USER 的 AK/SK 信息，使用 `user_id` 查询修改项，一般用于 AK/SK 轮转，使用相同参数调用此接口会报错。

### 请求

- 请求语法

```Plain
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

- 请求参数

| 参数名                       | 描述                      | 是否必须                             | 备注 |
| ---------------------------- | ------------------------- | ------------------------------------ | ---- |
| instance_id                  | instance_id               | 是                                   |      |
| internal_bucket_user         | 需修改的 bucket_user 列表 | 和 ram_user 至少存在一个             | 数组 |
| internal_bucket_user.user_id | 账号 user_id              | 是                                   |      |
| internal_bucket_user.ak      |                           | 是                                   |      |
| internal_bucket_user.sk      |                           | 是                                   |      |
| ram_user                     | 需修改的 ram_user         | 和 internal_bucket_user 至少存在一个 |      |
| ram_user.user_id             | 账号 user_id              | 是                                   |      |
| ram_user.ak                  |                           | 是                                   |      |
| ram_user.sk                  |                           | 是                                   |      |

- 请求示例

```Plain
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

- 返回参数

| 参数名 | 描述       | 是否必须 | 备注                                                         |
| ------ | ---------- | -------- | ------------------------------------------------------------ |
| code   | 返回状态码 | 是       | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg    | 错误原因   | 是       | 若发生错误，则返回错误原因；若未发生错误，则返回空字符串     |

- 成功返回示例

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- 失败返回示例

```Plain
{
 "code": "INVALID_ARGUMENT",
 "msg": "ak sk eq original, please check it"
}
```

## 更新 Instance 的 AK/SK 信息（历史遗留接口新版本已弃用）

### 接口描述

本接口用于更新 Instance 配置的 S3 的 AK/SK 信息，使用 ID 查询修改项，ID 可由 get_obj_store_info 查询而得。此接口使用相同参数多次调用会报错。

### 请求

- 请求语法

```Plain
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

- 请求参数

| 参数名          | 描述                     | 是否必须 | 备注              |
| --------------- | ------------------------ | -------- | ----------------- |
| cloud_unique_id | 节点的 cloud_unique_id   | 是       |                   |
| obj             | 对象                     | 是       | S3 信息对象       |
| obj.id          | 对象的 ID                | 是       | ID 支持从 1 到 10 |
| obj.ak          | 对象的 Access Key        | 是       |                   |
| obj.sk          | 对象的 Secret Access Key | 是       | 字符串数组        |

- 请求示例

```Plain
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

- 返回参数

| 参数名 | 描述       | 是否必须 | 备注                                                         |
| ------ | ---------- | -------- | ------------------------------------------------------------ |
| code   | 返回状态码 | 是       | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg    | 错误原因   | 是       | 若发生错误，则返回错误原因；若未发生错误，则返回空字符串     |

- 成功返回示例

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- 失败返回示例

```Plain
{
 "code": "INVALID_ARGUMENT",
 "msg": "ak sk eq original, please check it"
}
```

## 添加 Instance 的 S3 信息

### 接口描述

本接口用于添加 Instance 配置的 S3 的信息，最多支持添加 10 条 S3 信息，每条配置最多不超过 1024 字节大小。

### 请求

- 请求语法

```Plain
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

- 请求参数

| 参数名          | 描述                   | 是否必须 | 备注        |
| --------------- | ---------------------- | -------- | ----------- |
| cloud_unique_id | 节点的 cloud_unique_id | 是       |             |
| obj             | obj 对象               | 是       | S3 信息对象 |
| obj.ak          | 将添加 S3 的 ak        | 是       |             |
| obj.sk          | 将添加 S3 的 sk        | 是       |             |
| obj.bucket      | 将添加 S3 的 bucket    | 是       |             |
| obj.prefix      | 将添加 S3 的 prefix    | 是       |             |
| obj.endpoint    | 将添加 S3 的 endpoint  | 是       |             |
| obj.region      | 将添加 S3 的 region    | 是       |             |

- 请求示例

```Plain
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

- 返回参数

| 参数名 | 描述       | 是否必须 | 备注                                                         |
| ------ | ---------- | -------- | ------------------------------------------------------------ |
| code   | 返回状态码 | 是       | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg    | 错误原因   | 是       | 若发生错误，则返回错误原因；若未发生错误，则返回空字符串     |

- 成功返回示例

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- 失败返回示例

```Plain
{
 "code": "INVALID_ARGUMENT",
 "msg": "s3 conf info err, please check it"
}
```

## 创建计算集群

### 接口描述

本接口用于创建一个属于 Instance 的计算集群。该计算集群中包含若干（大于等于 0 个）相同类型节点信息，此接口不能用同一参数调用。

### 请求

- 请求语法

```SQL
PUT /MetaService/http/add_cluster?token=<token HTTP/1.1
Content-Length: <ContentLength
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

- 请求参数

| 参数名                        | 描述                    | 是否必须 | 备注                                                         |
| ----------------------------- | ----------------------- | -------- | ------------------------------------------------------------ |
| instance_id                   | instance_id             | 是       | 全局唯一（包括历史上）                                       |
| cluster                       | Cluster 对象            | 是       |                                                              |
| cluster.cluster_name          | Cluster 名称            | 是       | 其中 FE 的 Cluster 名称特殊，默认为 RESERVED_CLUSTER_NAME_FOR_SQL_SERVER，可在 fe.conf 中配置 cloud_observer_cluster_name 修改 |
| cluster.cluster_id            | Cluster 的 ID           | 是       | 其中 FE 的 Cluster ID 特殊，默认为 RESERVED_CLUSTER_ID_FOR_SQL_SERVER，可在 fe.conf 中配置 cloud_observer_cluster_id 修改 |
| cluster.type                  | Cluster 中节点的类型    | 是       | 支持："SQL","COMPUTE" 两种 Type，"SQL"表示 SQL Service 对应 FE， "COMPUTE"表示计算机节点对应 BE |
| cluster.nodes                 | Cluster 中的节点数组    | 是       |                                                              |
| cluster.nodes.cloud_unique_id | 节点的 cloud_unique_id  | 是       | fe.conf、be.conf 中的 cloud_unique_id 配置项                 |
| cluster.nodes.ip              | 节点的 IP               | 是       | 使用 FQDN 模式部署 FE/BE 时，该字段填写域名                  |
| cluster.nodes.host            | 节点的域名              | 否       | 使用 FQDN 模式部署 FE/BE时，需设置该字段                     |
| cluster.nodes.heartbeat_port  | BE 的 Heartbeat Port    | BE 必填  | be.conf 中的 heartbeat_service_port 配置项                   |
| cluster.nodes.edit_log_port   | FE 节点的 Edit Log Port | FE 必填  | 是 fe.conf 中的 edit_log_port 配置项                         |
| cluster.nodes.node_type       | FE 节点的类型           | 是       | 当 Cluster 的 Type 为 SQL 时，需要填写，分为"FE_MASTER" 和 "FE_OBSERVER"，其中 "FE_MASTER" 表示此节点为 Master， "FE_OBSERVER" 表示此节点为 Observer，注意：一个 Type 为 "SQL" 的 Cluster 的 Nodes 数组中只能有一个 "FE_MASTER" 节点，和若干 "FE_OBSERVER" 节点 |

- 请求示例

```Plain
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

- 返回参数

| 参数名 | 描述       | 是否必须 | 备注                                                         |
| ------ | ---------- | -------- | ------------------------------------------------------------ |
| code   | 返回状态码 | 是       | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg    | 错误原因   | 是       | 若发生错误，则返回错误原因；若未发生错误，则返回空字符串     |

- 成功返回示例

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- 失败返回示例

```Plain
{
 "code": "INTERANAL_ERROR",
 "msg": "cluster is SQL type, must have only one master node, now master count: 0"
}
```

## 获取计算集群

### 接口描述

本接口用于获取一个计算集群的信息，此接口可以多次重复调用。

### 请求

- 请求语法

```Plain
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

- 请求参数

| 参数名          | 描述                           | 是否必须 | 备注                                                         |
| --------------- | ------------------------------ | -------- | ------------------------------------------------------------ |
| cloud_unique_id | cloud_unique_id                | 是       | 通过 cloud_unique_id 查询 instance_id                        |
| cluster_name    | Cluster 名称                   | 否       | 注：cluster_name、cluster_id、mysql_user_name 三者需选填一个，若三者都为空则返回 Instance 下所有 Cluster 信息 |
| cluster_id      | Cluster 的 ID                  | 否       | 注：cluster_name、cluster_id、mysql_user_name 三者需选填一个，若三者都为空则返回 Instance 下所有 Cluster 信息 |
| mysql_user_name | MySQL 用户名配置的可用 Cluster | 否       | 注：cluster_name、cluster_id、mysql_user_name 三者需选填一个，若三者都为空则返回 Instance 下所有 Cluster 信息 |

- 请求示例

```Plain
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

- 返回参数

| 参数名 | 描述         | 是否必须 | 备注                                                         |
| ------ | ------------ | -------- | ------------------------------------------------------------ |
| code   | 返回状态码   | 是       | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg    | 错误原因     | 是       | 若发生错误，则返回错误原因；若未发生错误，则返回空字符串     |
| result | 查询结果对象 | 是       |                                                              |

- 成功返回示例

```Plain
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

- 失败返回示例

```Plain
{
 "code": "NOT_FOUND",
 "msg": "fail to get cluster with instance_id: \"instance_id_deadbeef\" cloud_unique_id: \"1:regression_instance0:xxx_cloud_unique_id_compute_node0\" cluster_name: \"cluster_name\" "
}
```

## 删除计算集群

### 接口描述

本接口用于删除一个 Instance 下的某个计算集群的信息，此接口若多次使用相同参数调用会报错。

### 请求

- 请求语法

```Plain
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

- 请求参数

| 参数名               | 描述                  | 是否必须 | 备注 |
| -------------------- | --------------------- | -------- | ---- |
| instance_id          | instance_id           | 是       |      |
| cluster              | Cluster 对象          | 是       |      |
| cluster.cluster_name | 将删除的 Cluster Name | 是       |      |
| cluster.cluster_id   | 将删除的 Cluster ID   | 是       |      |

- 请求示例

```Plain
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

- 返回参数

| 参数名 | 描述       | 是否必须 | 备注                                                         |
| ------ | ---------- | -------- | ------------------------------------------------------------ |
| code   | 返回状态码 | 是       | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg    | 错误原因   | 是       | 若发生错误，则返回错误原因；若未发生错误，则返回空字符串     |

- 成功返回示例

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- 失败返回示例

```Plain
{
 "code": "INTERANAL_ERROR",
 "msg": "failed to find cluster to drop, instance_id=dx_dnstance_id_deadbeef cluster_id=11111 cluster_name=2222"
}
```

## 计算集群重命名

### 接口描述

本接口用于将 Instance 下的计算集群重命名，依据传入的 `cluster_id` 寻找相应的 `cluster_name` 进行重命名，此接口若多次使用相同参数调用会报错。

### 请求

- 请求语法

```Plain
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

- 请求参数

| 参数名               | 描述                      | 是否必须 | 备注                                                    |
| -------------------- | ------------------------- | -------- | ------------------------------------------------------- |
| instance_id          | instance_id               | 是       |                                                         |
| cluster              | Cluster 对象              | 是       |                                                         |
| cluster.cluster_name | 即将重命名的 Cluster Name | 是       | 新的 cluster_name                                       |
| cluster.cluster_id   | 即将重命名的 Cluster ID   | 是       | 依据此 ID 去寻找相应的 Cluster，然后重命名 cluster_name |

- 请求示例

```Plain
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

- 返回参数

| 参数名 | 描述       | 是否必须 | 备注                                                         |
| ------ | ---------- | -------- | ------------------------------------------------------------ |
| code   | 返回状态码 | 是       | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg    | 错误原因   | 是       | 若发生错误，则返回错误原因；若未发生错误，则返回空字符串     |

- 成功返回示例

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- 失败返回示例

```Plain
{
 "code": "INTERANAL_ERROR",
 "msg": "failed to rename cluster, name eq original name, original cluster is {\"cluster_id\":\"3333333\",\"cluster_name\":\"444444\",\"type\":\"COMPUTE\"}"
}
```

## 计算集群添加节点

### 接口描述

本接口用于将 Instance 下的某计算集群添加若干相同类型的节点，此接口若多次使用相同参数调用会报错。

本接口可用于添加 FE 或者 BE 节点。

### 请求

- 请求语法

```Plain
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

- 请求参数

| 参数名                        | 描述                        | 是否必须 | 备注                                                         |
| ----------------------------- | --------------------------- | -------- | ------------------------------------------------------------ |
| instance_id                   | instance_id                 | 是       |                                                              |
| cluster                       | Cluster 对象                | 是       |                                                              |
| cluster.cluster_name          | 即将添加节点的 Cluster Name | 是       |                                                              |
| cluster.cluster_id            | 即将添加节点的 Cluster ID   | 是       |                                                              |
| cluster.type                  | Cluster 中节点的类型        | 是       | 支持："SQL","COMPUTE" 两种 Type，"SQL"表示 SQL Service 对应 FE， "COMPUTE"表示计算机节点对应 BE |
| cluster.nodes                 | Cluster 中的节点信息        | 是       | 数组                                                         |
| cluster.nodes.cloud_unique_id | 节点的 cloud_unique_id      | 是       | fe.conf、be.conf 中的 cloud_unique_id 配置项                 |
| cluster.nodes.ip              | 节点的 IP                   | 是       | 使用 FQDN 模式部署 FE/BE 时，该字段填写域名                  |
| cluster.nodes.host            | 节点的域名                  | 否       | 使用 FQDN 模式部署 FE/BE时，需设置该字段                     |
| cluster.nodes.heartbeat_port  | BE 的 Heartbeat Port        | BE 必填  | be.conf 中的 heartbeat_service_port 配置项                   |
| cluster.nodes.edit_log_port   | FE 节点的 Edit Log Port     | FE 必填  | 是 fe.conf 中的 edit_log_port 配置项                         |
| cluster.nodes.node_type       | FE 节点的类型               | 是       | 当 Cluster 的 Type 为 SQL 时，需要填写，分为"FE_MASTER" 和 "FE_OBSERVER"，其中 "FE_MASTER" 表示此节点为 Master， "FE_OBSERVER" 表示此节点为 Observer，注意：一个 Type 为 "SQL" 的 Cluster 的 Nodes 数组中只能有一个 "FE_MASTER" 节点，和若干 "FE_OBSERVER" 节点 |

- 请求示例

```Plain
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

- 返回参数

| 参数名 | 描述       | 是否必须 | 备注                                                         |
| ------ | ---------- | -------- | ------------------------------------------------------------ |
| code   | 返回状态码 | 是       | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg    | 错误原因   | 是       | 若发生错误，则返回错误原因；若未发生错误，则返回空字符串     |

- 成功返回示例

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- 失败返回示例

```Plain
{
 "code": "INTERANAL_ERROR",
 "msg": "cloud_unique_id is already occupied by an instance, instance_id=instance_id_deadbeef_1 cluster_name=dx_cluster_name1 cluster_id=cluster_id1 cloud_unique_id=cloud_unique_id_compute_node2"
}
```

## 计算集群减少节点

### 接口描述

本接口用于将 Instance 下的某计算集群减少若干相同类型的节点。

### 请求

- 请求语法

```Plain
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

- 请求参数

| 参数名               | 描述                        | 是否必须 | 备注 |
| -------------------- | --------------------------- | -------- | ---- |
| instance_id          | instance_id                 | 是       |      |
| cluster              | cluster 对象                | 是       |      |
| cluster.cluster_name | 即将减少节点的 Cluster Name | 是       |      |
| cluster.cluster_id   | 即将减少节点的 Cluster ID   | 是       |      |
| cluster.type         | Cluster 类型                | 是       |      |
| cluster.node         | Cluster 中的节点信息        | 是       | 数组 |

- 请求示例

```Plain
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

- 返回参数

| 参数名 | 描述       | 是否必须 | 备注                                                         |
| ------ | ---------- | -------- | ------------------------------------------------------------ |
| code   | 返回状态码 | 是       | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg    | 错误原因   | 是       | 若发生错误，则返回错误原因；若未发生错误，则返回空字符串     |

- 成功返回示例

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- 失败返回示例

```Plain
{
 "code": "INTERANAL_ERROR",
 "msg": "cloud_unique_id can not find to drop node, instance_id=instance_id_deadbeef_1 cluster_name=cluster_name1 cluster_id=cluster_id1 cloud_unique_id=cloud_unique_id_compute_node2"
}
```

## 为计算集群添加默认 user_name

### 接口描述

本接口用于为 Instance 下的某计算集群添加用户名，使相应用户可以使用 MySQL Client 登录系统，使用默认计算集群。

### 请求

- 请求语法

```Plain
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

- 请求参数

| 参数名                  | 描述                                     | 是否必须 | 备注       |
| ----------------------- | ---------------------------------------- | -------- | ---------- |
| instance_id             | instance_id                              | 是       |            |
| cluster                 | Cluster 对象                             | 是       |            |
| cluster.cluster_name    | 即将添加 mysql_user_name 的 Cluster Name | 是       |            |
| cluster.cluster_id      | 即将添加 mysql_user_name 的 Cluster ID   | 是       |            |
| cluster.mysql_user_name | mysql_user_name                          | 是       | 字符串数组 |

- 请求示例

```Plain
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

- 返回参数

| 参数名 | 描述       | 是否必须 | 备注                                                         |
| ------ | ---------- | -------- | ------------------------------------------------------------ |
| code   | 返回状态码 | 是       | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
| msg    | 错误原因   | 是       | 若发生错误，则返回错误原因；若未发生错误，则返回空字符串     |

- 成功返回示例

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- 失败返回示例

```Plain
{
 "code": "INTERANAL_ERROR",
 "msg": "no mysql user name to change"
}
```

## 获取计算集群下的 BE 节点执行情况

### 接口描述

本接口用于获取计算集群下，BE 节点运行 Fragment 的情况。

:::info 备注

此接口是请求 FE 的接口。

:::

### 请求

- 请求语法

```Plain
GET /rest/v2/manager/cluster/cluster_info/cloud_cluster_status HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
```

- 请求参数

| 参数名   | 描述   | 是否必须 | 备注     |
| -------- | ------ | -------- | -------- |
| user     | 用户名 | 是       | 鉴权信息 |
| password | 密码   | 是       | 鉴权信息 |

- 请求示例

```Plain
curl -u root: http://127.0.0.1:12100/rest/v2/manager/cluster/cluster_info/cloud_cluster_status
```

- 返回参数

| 参数名 | 描述                                                    | 是否必须 | 备注 |
| ------ | ------------------------------------------------------- | -------- | ---- |
| code   | 返回状态码                                              | 是       |      |
| msg    | 错误原因                                                | 是       |      |
| data   | 返回的一个 map，其中 key 为 clusterId，value 为 be 列表 |          |      |

- 成功返回示例

```Plain
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

## 开启 Instance 对象数据服务端加密

### 接口描述

本接口用于开启 Instance 对象数据服务端加密。

### 请求

- 请求语法

```Plain
PUT /MetaService/http/enable_instance_sse?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{
    "instance_id": string
}
```

- 请求参数

| 参数名      | 描述        | 是否必须 | 备注                   |
| ----------- | ----------- | -------- | ---------------------- |
| instance_id | instance_id | 是       | 全局唯一（包括历史上） |

- 请求示例

```Plain
PUT /MetaService/http/enable_instance_sse?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{
    "instance_id": "123456"
}
```

- 返回参数

| 参数名 | 描述       | 是否必须 | 备注                                                     |
| ------ | ---------- | -------- | -------------------------------------------------------- |
| code   | 返回状态码 | 是       | 枚举值，包括 OK、INVALID_ARGUMENT、INTERNAL_ERROR        |
| msg    | 错误原因   | 是       | 若发生错误，则返回错误原因；若未发生错误，则返回空字符串 |

- 成功返回示例

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- 失败返回示例

```Plain
{
 "code": "INVALID_ARGUMENT",
 "msg": "failed to enable sse, instance has enabled sse"
}
```

## 获取计算集群的运行状态

### 接口描述

本接口用于获取多个 Instance 下的计算集群运行状态。

### 请求

- 请求语法

```Plain
PUT /MetaService/http/get_cluster_status?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{
    "instance_ids": [string, string],
    "status": string
}
```

- 请求参数

| 参数名           | 描述                 | 是否必须 | 备注                                                     |
| ---------------- | -------------------- | -------- | -------------------------------------------------------- |
| instance_ids     | 多个 Instance 的 ID  | 是       |                                                          |
| cloud_unique_ids | 多个 cloud_unique_id | 否       | 优先选择 instance_ids                                    |
| status           | 查询过滤条件         | 否       | 可有"NORMAL", "STOPPED", "TO_RESUME", 不填返回所有状态的 |

- 请求示例

```Plain
PUT /MetaService/http/get_cluster_status?token=greedisgood9999 HTTP/1.1
Content-Length: 109
Content-Type: text/plain
{
    "instance_ids":["regression_instance-dx-1219", "regression_instance-dx-0128"],
    "status":"NORMAL"
}
```

- 返回参数

| 参数名         | 描述                   | 是否必须 | 备注 |
| -------------- | ---------------------- | -------- | ---- |
| code           | 返回状态码             | 是       |      |
| msg            | 错误原因               | 是       |      |
| result.details | 返回计算集群的状态列表 | 是       |      |

- 成功返回示例

```Plain
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

本接口用于设置某个 Instance 下的计算集群运行状态。

### 请求

- 请求语法

```Plain
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

- 请求参数

| 参数名          | 描述                  | 是否必须 | 备注                                 |
| --------------- | --------------------- | -------- | ------------------------------------ |
| cloud_unique_id |                       | 否       |                                      |
| instance_id     |                       | 是       |                                      |
| cluster_id      | 待操作的 cluster_id   | 是       |                                      |
| cluster_status  | 待操作的 Cluster 状态 | 是       | 可有"NORMAL", "STOPPED", "TO_RESUME" |

- 请求示例

```Plain
PUT /MetaService/http/set_cluster_status?token=greedisgood9999 HTTP/1.1
Content-Length: 128
Content-Type: text/plain
{
    "cloud_unique_id": "1:regression_instance0:regression-cloud-unique-id-fe-0128",
    "cluster": {
        "cluster_id": "test_cluster_1_id1",
        "cluster_status":"STOPPED"
    }
}
```

- 返回参数

| 参数名 | 描述       | 是否必须 | 备注 |
| ------ | ---------- | -------- | ---- |
| code   | 返回状态码 | 是       |      |
| msg    | 错误原因   | 是       |      |

- 成功返回示例

```Plain
{
    "code": "OK",
    "msg": ""
}
```

由于该接口由云管平台与 FE 共同使用，设置状态时，需遵守特定的状态变化限制。只允许以下状态变换：

- `ClusterStatus::UNKNOWN` -> `ClusterStatus::NORMAL`（云管平台创建计算集群时，将初始状态直接置为 `NORMAL`，此操作通常在 `add_cluster` 接口中完成）
- `ClusterStatus::NORMAL` -> `ClusterStatus::SUSPENDED`（云管平台暂停计算集群时设置）
- `ClusterStatus::SUSPENDED` -> `ClusterStatus::TO_RESUME`（FE 唤起计算集群时设置）
- `ClusterStatus::TO_RESUME` -> `ClusterStatus::NORMAL`（云管平台将计算集群状态拉起后设置）

若尝试执行以上未列出的状态变换，系统将返回错误提示：

```Plain
{
    "code": "INVALID_ARGUMENT",
    "msg": "failed to set cluster status, original cluster is NORMAL and want set TO_RESUME"
}
```

## 解码 Meta Service 中的 Key 信息

### 接口描述

本接口用于 `decode` Meta Service Log 中的 Key 信息，用于调试。

### 请求

- 请求语法

```Plain
GET /MetaService/http/decode_key?token=greedisgood9999&key={key} HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
```

- 请求参数

| 参数名  | 描述         | 是否必须 | 备注 |
| ------- | ------------ | -------- | ---- |
| key     | 待解码的 Key | 是       |      |
| unicode | 返回格式调整 | 否       |      |

- 请求示例

```Plain
GET /MetaService/http/decode_key?token=greedisgood9999&key=0110696e7374616e636500011072656772657373696f6e5f696e7374616e6365300001 HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
```

- 成功返回示例

```Plain
┌───────────────────────── 0. key space: 1
│ ┌─────────────────────── 1. instance
│ │                     ┌─ 2. regression_instance0
│ │                     │
▼ ▼                     ▼
0110696e7374616e636500011072656772657373696f6e5f696e7374616e6365300001
```

## 查询 Tablet 状态

### 接口描述

本接口用于查询 Tablet 状态，用于调试。

### 请求

- 请求语法

```Plain
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

- 请求参数

| 参数名                  | 描述                          | 是否必须 | 备注 |
| ----------------------- | ----------------------------- | -------- | ---- |
| cloud_unique_id         | 节点的 cloud_unique_id        | 是       |      |
| tablet_idx              | 待查询 Tablet 列表            | 是       | 数组 |
| tablet_idx.table_id     | 待查询 Tablet 的 table_id     | 是       |      |
| tablet_idx.index_id     | 待查询 Tablet 的 index_id     | 是       |      |
| tablet_idx.partition_id | 待查询 Tablet 的 partition_id | 是       |      |
| tablet_idx.tablet_id    | 待查询 Tablet 的 tablet_id    | 是       |      |

- 请求示例

```Plain
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

- 成功返回示例

```Plain
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

本接口用于 Abort 事务，用于调试。

### 请求

- 请求语法

```Plain
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

- 请求参数

| 参数名          | 描述                    | 是否必须 | 备注 |
| --------------- | ----------------------- | -------- | ---- |
| cloud_unique_id | 节点的 cloud_unique_id  | 是       |      |
| txn_id          | 待 Abort 事务 ID        | 否       |      |
| db_id           | 待 Abort 事务所属 db_id | 否       |      |
| label           | 待 Abort 事务 Label     | 否       |      |

- 请求示例

```Plain
POST /MetaService/http/abort_txn?token=greedisgood9999 HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{
    "cloud_unique_id": "1:regression_instance0:regression-cloud-unique-id0",
    "txn_id": 869414052004864
}
```

- 成功返回示例

```Plain
status {
  code: OK
  msg: ""
}
```

## Abort Tablet Job

### 接口描述

本接口用于 Abort Tablet 上的 Job，当前只支持 Compaction Job，用于调试。

### 请求

- 请求语法

```Plain
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

- 请求参数

| 参数名            | 描述                       | 是否必须 | 备注                      |
| ----------------- | -------------------------- | -------- | ------------------------- |
| cloud_unique_id   | 节点的 cloud_unique_id     | 是       |                           |
| job               | 待 Abort 的 Job 事务       | 是       | 当前只支持 Compaction Job |
| job.idx           | 待 Abort 的 idx            | 是       |                           |
| job.idx.tablet_id | abort.idx 对应的 tablet_id |          |                           |
| job.compaction    | 待 Abort 的 Compaction     |          | 数组                      |
| job.compaction.id | 待 abort.compaction 的 ID  |          |                           |

- 请求示例

```Plain
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

- 成功返回示例

```
status {
  code: OK
  msg: ""
}
```

