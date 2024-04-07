
## 接口目录

[TOC]

## API 版本

未来所有的接口都会带上版本号，建议使用时带上版本以区分不同版本。目前已经给所有已有接口都加上 `v1/` 表示版本号。

以 `create_instance` 为例，带 API 版本的接口为：

```
PUT /MetaService/http/v1/create_instance?token=<token> HTTP/1.1
```

为了保证兼容性，之前的接口（即不带 `v1/`）仍然能访问。

## 创建instance

### 接口描述

本接口用于创建一个instance. 这个instance不包含任何节点信息，不能多次创建同一个instance_id的instance

### 请求(Request)

* 请求语法

```
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

| 参数名                        | 描述                     | 是否必须 | 备注                             |
|----------------------------|------------------------|------|--------------------------------|
| instance_id                | instance_id            | 是    | 全局唯一(包括历史上)                    |
| name                       | instance 别名            | 否    |                                |
| user_id                    | 用户id                   | 是    |                                |
| obj_info                   | S3链接配置信息               | 是    |                                |
| obj_info.ak                | S3的access key          | 是    |                                |
| obj_info.sk                | S3的secret key          | 是    |                                |
| obj_info.bucket            | S3的bucket名             | 是    |                                |
| obj_info.prefix            | S3上数据存放位置前缀            | 否    | 不填的话，在bucket的根目录               |
| obj_info.endpoint          | S3的endpoint信息          | 是    |                                |
| obj_info.region            | S3的region信息            | 是    |                                |
| obj_info.external_endpoint | S3的external endpoint信息 | 否    | 兼容oss，oss有external、 internal区别 |
| obj_info.provider          | S3的provider信息 | 是    |          |
| obj_info.user_id           | bucket的user_id  | 否   |   轮转ak sk使用，用于标识哪些obj需更改ak sk        |
| ram_user | ram_user信息，用于外部bucket授权         | 否    |           |
| ram_user.user_id |         | 是    |  |
| ram_user.ak |              | 是    |  |
| ram_user.sk |              | 是    |  |

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
| code | 返回状态码 | 是    | 枚举值，包括OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
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

## 删除instance

### 接口描述

本接口用于删除一个已存在的instance，标记删除，然后recycler会异步回收资源

### 请求(Request)

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
| instance_id                | instance_id            | 是    | 全局唯一(包括历史上)                    |

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
| code | 返回状态码 | 是    | 枚举值，包括OK、INVALID_ARGUMENT、INTERNAL_ERROR |
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

## 查询instance信息

### 接口描述

本接口用于查询instance下的信息（s3信息、cluster信息、stage信息），用于debug

### 请求(Request)

* 请求语法

```
GET /MetaService/http/get_instance?token=greedisgood9999&instance_id={instance_id} HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
```
* 请求参数

| 参数名                        | 描述                     | 是否必须 | 备注                             |
|----------------------------|------------------------|------|--------------------------------|
| instance_id                | instance_id            | 是    | 全局唯一(包括历史上)                    |

* 请求示例

```
GET /MetaService/http/get_instance?token=greedisgood9999&instance_id=test-instance HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
```
* 返回参数

| 参数名                | 描述                       | 是否必须 | 备注                                       |
|--------------------|--------------------------|------|------------------------------------------|
| code               | 返回状态码                    | 是    | 枚举值，包括OK、INVALID_ARGUMENT、INTERNAL_ERROR |
| msg                | 出错原因                     | 是    | 若出错返回错误原因，未出错返回空字符串                      |
| result             | instance下的信息             | 是    |                                          |
| result.user_id     | 创建instance的user id       | 是    |                                          |
| result.instance_id | 创建instance传入的instance_id | 是    |                                          |
| result.name        | 创建instance的user name     | 是    |                                          |
| result.clusters    | instance内的cluster列表      | 是    |                                          |
| result.mtime       | instance的修改时间            | 是    |                                          |
| result.obj_info    | instance下的s3信息列表         | 是    |                                          |
| result.stages      | instance下的stages列表       | 是    |                                          |
| result.status      | instance的状态信息            | 否    | 若instance被drop，则为"DELETED"               |

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
                        "cloud_unique_id": "regression-cloud-unique-id-fe-1",
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
                        "cloud_unique_id": "regression-cloud-unique-id0",
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
                        "cloud_unique_id": "regression-cloud-unique-id0",
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
                        "cloud_unique_id": "regression-cloud-unique-id0",
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

## 创建cluster

### 接口描述

本接口用于创建一个属于instance的cluster. 这个cluster中包含若干（大于等于0个）相同类型节点信息, 此接口不能用同一参数调用

### 请求(Request)

* 请求语法

```
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

| 参数名                           | 描述                 | 是否必须 | 备注                                                                                                                                                                                   |
|-------------------------------|--------------------|------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| instance_id                   | instance_id        | 是    | 全局唯一(包括历史上)                                                                                                                                                                          |
| cluster                       | cluster对象信息        | 是    |                                                                                                                                                                                      |
| cluster.cluster_name          | cluster的名字         | 是    | 其中fe的cluster名字特殊，默认RESERVED_CLUSTER_NAME_FOR_SQL_SERVER，可在fe.conf中配置cloud_observer_cluster_name修改                                                                                    |
| cluster.cluster_id            | cluster的id         | 是    | 其中fe的cluster id特殊，默认RESERVED_CLUSTER_ID_FOR_SQL_SERVER，可在fe.conf中配置cloud_observer_cluster_id修改                                                                                       |
| cluster.type                  | cluster中节点的类型      | 是    | 支持："SQL","COMPUTE"两种type，"SQL"表示sql service对应fe， "COMPUTE"表示计算机节点对应be                                                                                                                |
| cluster.nodes                 | cluster中的节点数组      | 是    |                                                                                                                                                                                      |
| cluster.nodes.cloud_unique_id | 节点的cloud_unique_id | 是    | 是fe.conf、be.conf中的cloud_unique_id配置项                                                                                                                                                 |
| cluster.nodes.ip              | 节点的ip              | 是    |                                                                                                                                                                                      |
| cluster.nodes.heartbeat_port  | be的heartbeat port  | 是    | 是be.conf中的heartbeat_service_port配置项                                                                                                                                                  |
| cluster.nodes.edit_log_port   | fe节点的edit log port | 是    | 是fe.conf中的edit_log_port配置项                                                                                                                                                           |
| cluster.nodes.node_type       | fe节点的类型            | 是    | 当cluster的type为SQL时，需要填写，分为"FE_MASTER" 和 "FE_OBSERVER", 其中"FE_MASTER" 表示此节点为master， "FE_OBSERVER"表示此节点为observer，注意：一个type为"SQL"的cluster的nodes数组中只能有一个"FE_MASTER"节点，和若干"FE_OBSERVER"节点 |

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
                "cloud_unique_id": "cloud_unique_id_compute_node1",
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
| code | 返回状态码 | 是    | 枚举值，包括OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
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

## 获取cluster

### 接口描述

本接口用于获取一个cluster的信息，此接口可以多次重复调用

### 请求(Request)

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
| cloud_unique_id | cloud_unique_id      | 是    | 通过cloud_unique_id去查询instance_id                                             |
| cluster_name    | cluster的名字           | 否    | 注：cluster_name、cluster_id、mysql_user_name三选一，若三个都不填则返回instance下所有cluster信息  |
| cluster_id      | cluster的id           | 否    | 注：cluster_name、cluster_id、mysql_user_name三选一 ，若三个都不填则返回instance下所有cluster信息 |
| mysql_user_name | mysql用户名配置的可用cluster | 否    | 注：cluster_name、cluster_id、mysql_user_name三选一，若三个都不填则返回instance下所有cluster信息  |

* 请求示例

```
PUT /MetaService/http/get_cluster?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "instance_id":"regression_instance0",
    "cloud_unique_id":"regression-cloud-unique-id-fe-1",
    "cluster_name":"RESERVED_CLUSTER_NAME_FOR_SQL_SERVER",
    "cluster_id":"RESERVED_CLUSTER_ID_FOR_SQL_SERVER"
}
```

* 返回参数

| 参数名    | 描述     | 是否必须 | 备注                                                       |
|--------|--------|------|----------------------------------------------------------|
| code   | 返回状态码  | 是    | 枚举值，包括OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
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
                "cloud_unique_id": "cloud_unique_id_compute_node0",
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
 "msg": "fail to get cluster with instance_id: \"instance_id_deadbeef\" cloud_unique_id: \"dengxin_cloud_unique_id_compute_node0\" cluster_name: \"cluster_name\" "
}
```


## 删除cluster

### 接口描述

本接口用于删除一个instance下的某个cluster信息， 多次用相同参数删除失败报错

### 请求(Request)

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
| cluster              | cluster对象        | 是    |     |
| cluster.cluster_name | 将删除的cluster name | 是    |     |
| cluster.cluster_id   | 将删除的cluster id   | 是    |     |

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
| code | 返回状态码 | 是    | 枚举值，包括OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
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


## cluster改名

### 接口描述

本接口用于将instance下的某cluster改名，依据传入的cluster_id寻找cluster_name去rename，此接口多次相同参数调用报错

### 请求(Request)

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
| cluster              | cluster对象        | 是    |                                       |
| cluster.cluster_name | 将改名的cluster name | 是    | 新的cluster_name                        |
| cluster.cluster_id   | 将改名的cluster id   | 是    | 依据此id去寻找cluster，然后rename cluster_name |

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
| code | 返回状态码 | 是    | 枚举值，包括OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
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

## cluster添加节点

### 接口描述

本接口用于将instance下的某cluster添加若干相同类型的节点，此接口多次相同参数调用报错


### 请求(Request)

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

| 参数名                  | 描述                              | 是否必须 | 备注                    |
|----------------------|---------------------------------|------|-----------------------|
| instance_id          | instance_id                     | 是    |                       |
| cluster              | cluster对象                       | 是    |                       |
| cluster.cluster_name | 将添加mysql user name的cluster name | 是    |                       |
| cluster.cluster_id   | 将添加mysql user name的cluster id   | 是    |                       |
| cluster.type         | cluster的类型，与上文中add_cluster处解释一致 |      |                       |
| cluster.nodes        | cluster中的节点数组                   | 是    | 与上文add_cluster处字段解释一致 |

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
                "cloud_unique_id": "cloud_unique_id_compute_node2",
                "ip": "172.21.0.50",
                "heartbeat_port": 9051
            },
            {
                "cloud_unique_id": "cloud_unique_id_compute_node3",
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
| code | 返回状态码 | 是    | 枚举值，包括OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
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


## cluster减少节点

### 接口描述

本接口用于将instance下的某cluster减少若干相同类型的节点

### 请求(Request)

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
| cluster              | cluster对象                       | 是    |     |
| cluster.cluster_name | 将添加mysql user name的cluster name | 是    |     |
| cluster.cluster_id   | 将添加mysql user name的cluster id   | 是    |     |
| cluster.type         | cluster类型                       | 是    |     |
| cluster.node         | cluster中节点信息                    | 是    | 数组  |

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
                "cloud_unique_id": "cloud_unique_id_compute_node2",
                "ip": "172.21.0.50",
                "heartbeat_port": 9051
            },
            {
                "cloud_unique_id": "cloud_unique_id_compute_node3",
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
| code | 返回状态码 | 是    | 枚举值，包括OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
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

## 为cluster添加默认user name

### 接口描述

本接口用于将instance下的某cluster添加一些用户名，这些用户使用mysql client登录进系统，可以使用默认cluster

### 请求(Request)

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
| cluster                 | cluster对象                       | 是    |       |
| cluster.cluster_name    | 将添加mysql user name的cluster name | 是    |       |
| cluster.cluster_id      | 将添加mysql user name的cluster id   | 是    |       |
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
| code | 返回状态码 | 是    | 枚举值，包括OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
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


## 获取cluster配置的S3信息

### 接口描述

本接口用于获取instance配置的S3的ak、sk信息，可相同参数调用多次

### 请求(Request)

* 请求语法

```
PUT /MetaService/http/get_obj_store_info?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{"cloud_unique_id": "cloud_unique_id_compute_node1"}
```
* 请求参数

| 参数名             | 描述                 | 是否必须 | 备注                                        |
|-----------------|--------------------|------|-------------------------------------------|
| cloud_unique_id | 节点的cloud_unique_id | 是    | instance下某节点的unique_id查询整个instance配置的S3信息 |

* 请求示例

```
PUT /MetaService/http/get_obj_store_info?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{"cloud_unique_id": "cloud_unique_id_compute_node1"}
```

* 返回参数

| 参数名    | 描述     | 是否必须 | 备注                                                       |
|--------|--------|------|----------------------------------------------------------|
| code   | 返回状态码  | 是    | 枚举值，包括OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
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


## 更新instance的ak、sk信息

### 接口描述

本接口用于更新instance配置的S3和RAM_USER的ak、sk信息，使用user_id去查询修改项，一般用于aksk轮转，使用相同参数调用此接口会报错

### 请求(Request)

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
| internal_bucket_user  | 需修改的bucket_user列表     | 和ram_user至少存在一个   | 数组 |
| internal_bucket_user.user_id  | 账号user_id        | 是    | |
| internal_bucket_user.ak  |                        | 是    |           |
| internal_bucket_user.sk  |                        | 是    |     |
| ram_user              | 需修改的ram_user   | 和internal_bucket_user至少存在一个   |     |
| ram_user.user_id  |  账号user_id                   | 是    |     |
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
| code | 返回状态码 | 是    | 枚举值，包括OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
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

## 更新instance的ak、sk信息(2.3版本之前的方法)

### 接口描述

本接口用于更新instance配置的S3的ak、sk信息，使用id去查询修改项，id可以用get_obj_store_info查询得到，多次相同参数调用此接口会报错

### 请求(Request)

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
| cloud_unique_id | 节点的cloud_unique_id              | 是    |           |
| obj             | obj对象                           | 是    | S3信息对象    |
| obj.id          | 将添加mysql user name的cluster name | 是    | id支持从1到10 |
| obj.ak          | 将添加mysql user name的cluster id   | 是    |           |
| obj.sk          | mysql user name                 | 是    | 字符串数组     |

* 请求示例

```
PUT /MetaService/http/legacy_update_ak_sk?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "cloud_unique_id": "cloud_unique_id_compute_node1",
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
| code | 返回状态码 | 是    | 枚举值，包括OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
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


## 添加instance的S3信息

### 接口描述

本接口用于添加instance配置的S3的信息，最多支持添加10条s3信息，每条配置最多不超过1024字节大小

### 请求(Request)

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
| cloud_unique_id | 节点的cloud_unique_id | 是    |        |
| obj             | obj对象              | 是    | S3信息对象 |
| obj.ak          | 将添加S3的ak           | 是    |        |
| obj.sk          | 将添加S3的sk           | 是    |        |
| obj.bucket      | 将添加S3的bucket       | 是    |        |
| obj.prefix      | 将添加S3的prefix       | 是    |        |
| obj.endpoint    | 将添加S3的endpoint     | 是    |        |
| obj.region      | 将添加S3的region       | 是    |        |

* 请求示例

```
PUT /MetaService/http/add_obj_info?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "cloud_unique_id": "cloud_unique_id_compute_node1",
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
| code | 返回状态码 | 是    | 枚举值，包括OK、INVALID_ARGUMENT、INTERNAL_ERROR、ALREADY_EXISTED |
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

## 解码meta service中key的信息

### 接口描述

本接口用于decode meta service log中的key的信息，调试用

### 请求(Request)

* 请求语法

```
GET /MetaService/http/decode_key?token=greedisgood9999&key={key} HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
```
* 请求参数

| 参数名     | 描述          | 是否必须 | 备注  |
|---------|-------------|------|-----|
| key     | 待decode的key | 是    |     |
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

## 查询tablet状态

### 接口描述

本接口用于查询tablet状态，调试用

### 请求(Request)

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
| cloud_unique_id         | 节点的cloud_unique_id     | 是    |     |
| tablet_idx              | 待查询tablet列表（数组）        | 是    |     |
| tablet_idx.table_id     | 待查询tablet的table_id     | 是    |     |
| tablet_idx.index_id     | 待查询tablet的index_id     | 是    |     |
| tablet_idx.partition_id | 待查询tablet的partition_id | 是    |     |
| tablet_idx.tablet_id    | 待查询tablet的tablet_id    | 是    |     |

* 请求示例

```
POST /MetaService/http/get_tablet_stats?token=greedisgood9999 HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "cloud_unique_id":"regression-cloud-unique-id0",
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

## abort 事务

### 接口描述

本接口用于abort事务，调试用

### 请求(Request)

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
| cloud_unique_id   | 节点的cloud_unique_id   | 是    |                     |
| txn_id            | 待abort事务id           | 否    |                     |
| db_id             | 待abort事务所属db_id      | 否    |                     |
| label             | 待abort事务label        | 否    |                     |

* 请求示例

```
POST /MetaService/http/abort_txn?token=greedisgood9999 HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "cloud_unique_id": "regression-cloud-unique-id0",
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

## abort tablet job

### 接口描述

本接口用于abort tablet上的job，当前只支持compaction job，调试用

### 请求(Request)

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
| cloud_unique_id   | 节点的cloud_unique_id   | 是    |                     |
| job               | 待abort的job事务         | 是    | 当前只支持compaction job |
| job.idx           | 待abort的idx           | 是    |                     |
| job.idx.tablet_id | 待abort.idx的tablet_id |      |                     |
| job.compaction    | 待abort的compaction    |      | 数组                  |
| job.compaction.id | 待abort.compaction的id |      |                     |

* 请求示例

```
POST /MetaService/http/abort_tablet_job?token=greedisgood9999 HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain

{
    "cloud_unique_id": "regression-cloud-unique-id0",
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


## 获取cluster下的be节点执行情况

### 接口描述

本接口用于获取cluster下，be节点运行fragment的情况，注意此接口是请求fe的接口

### 请求(Request)

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
|data | 返回的一个map，key为clusterId, value为be列表| |

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

## instance开启对象数据服务端加密

### 接口描述

本接口用于开启instance对象数据服务端加密

### 请求(Request)

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
| instance_id                | instance_id            | 是    | 全局唯一(包括历史上)                    |

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
| code | 返回状态码 | 是    | 枚举值，包括OK、INVALID_ARGUMENT、INTERNAL_ERROR |
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

本接口用于获取多个warehouse下，获取cluster的运行状态

### 请求(Request)

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
| instance_ids     | 多个warehouse的id    | 是    |                                                 |
| cloud_unique_ids | 多个cloud_unique_id | 否    | 优先选择instance_ids                                |
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
| result.details | 返回clusters的状态列表 | 是    |

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

本接口用于设置某个warehouse下计算节点的cluster的运行状态

### 请求(Request)

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
| cluster_id | 待操作的cluster_id | 是    ||
| cluster_status | 待操作的cluster状态 | 是    |可有"NORMAL", "STOPPED", "TO_RESUME"|

* 请求示例

```
curl '127.0.0.1:5008/MetaService/http/set_cluster_status?token=greedisgood9999' -d '{
    "cloud_unique_id": "regression-cloud-unique-id-fe-0128",
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

* 注意，由于这个接口是云管、fe都会用到的，在设置状态的时候会有个状态变化的限制。

只允许以下状态变换：
1. ClusterStatus::UNKNOWN -> ClusterStatus::NORMAL （云管创建cluster的时候，将初始状态直接置为NORMAL， add_cluster接口中）
2. ClusterStatus::NORMAL -> ClusterStatus::SUSPENDED （云管暂停cluster时候设置）
3. ClusterStatus::SUSPENDED -> ClusterStatus::TO_RESUME （fe唤起cluster时候设置）
4. ClusterStatus::TO_RESUME -> ClusterStatus::NORMAL （云管将cluster状态拉起后设置）

若不在上面的状态变化中的修改状态会报错：
```
{
    "code": "INVALID_ARGUMENT",
    "msg": "failed to set cluster status, original cluster is NORMAL and want set TO_RESUME"
}
```

## 设置instance状态

### 接口描述

本接口用于设置某个warehouse的状态为NORMAL或者OVERDUE

### 请求(Request)

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
