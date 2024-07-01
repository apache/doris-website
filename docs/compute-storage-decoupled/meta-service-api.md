---
{
    "title": "Meta Service API",
    "language": "en"
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

The page introduces all APIs provided by the Meta Service.

## API version

For the purpose of compatibility and extension, all future APIs will include a version number in implementation. It is recommended to include the version number when using the APIs. Currently, all existing APIs have been added `v1/` as the version identifier.

For example, this is `create_instance` with its API version identifier:

```Plain
PUT /MetaService/http/v1/create_instance?token=<token> HTTP/1.1
```

To ensure compatibility, existing APIs can still be accessed without `v1/`.

## Field values

For certain fields, special attention should be paid to their allowed value ranges and formats.

| Field           | Description                                                  | Notes                                                        |
| --------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| instance_id     | ID of the instance in the compute-storage decoupled mode,  normally a UUID string | Historically unique                                          |
| cloud_unique_id | A configuration in be.conf fe.conf in the compute-storage decoupled mode; should be provided in a create_cluster request; the format of it is `1:<instance_id>:<string>` | Example: `1:regression_instance0:regression-cloud-unique-id-1` |
| cluster_name    | In the compute-storage decoupled mode, this field is required when describing a compute cluster. It must be a unique identifier and its format should match the pattern` [a-zA-Z][0-9a-zA-Z_]+` | Example: write_cluster, read_cluster0                        |

## create_instance (multiple storage vaults)

### Description

This API is used to create an instance, which supports one or more storage vaults (including HDFS and S3). This instance does not contain any node information. The same `instance_id` cannot be created multiple times.

### Request

**Use HDFS as the storage vault**

- Syntax for a `create_instance` request using HDFS as the storage vault

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

- Parameters for a `create_instance` request using HDFS as the storage vault

| Parameter                                | Description                                   | Required/Optional | Notes                                                    |
| ---------------------------------------- | --------------------------------------------- | ----------------- | -------------------------------------------------------- |
| instance_id                              | instance_id                                   | Required          | Globally and historically unique, normally a UUID string |
| name                                     | Instance name                                 | Optional          |                                                          |
| user_id                                  | User ID                                       | Required          |                                                          |
| vault                                    | Storage vault                                 | Required          |                                                          |
| vault.hdfs_info                          | Information of the HDFS storage vault         | Required          |                                                          |
| vault.build_conf                         | Build configuration of the HDFS storage vault | Required          |                                                          |
| vault.build_conf.fs_name                 | HDFS name, normally the connection address    | Required          |                                                          |
| vault.build_conf.user                    | User to connect to HDFS                       | Required          |                                                          |
| vault.build_conf.hdfs_kerberos_keytab    | Kerberos Keytab path                          | Optional          | Required when using Kerberos authentication              |
| vault.build_conf.hdfs_kerberos_principal | Kerberos Principal                            | Optional          | Required when using Kerberos authentication              |
| vault.build_conf.hdfs_confs              | Other configurations of HDFS                  | Optional          | Can be filled in as needed                               |
| vault.prefix                             | Prefix for data storage                       | Required          |                                                          |

- Example of a `create_instance` request using HDFS as the storage vault

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

**Use object storage as the storage vault**

- Syntax for a `create_instance` request using object storage as the storage vault

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

- Parameters for a `create_instance` request using object storage as the storage vault

| Parameter                  | Description                                                  | Required/Optional | Notes                                                        |
| -------------------------- | ------------------------------------------------------------ | ----------------- | ------------------------------------------------------------ |
| instance_id                | instance_id                                                  | Required          | Globally and historically unique, normally a UUID string     |
| name                       | Instance name                                                | Optional          |                                                              |
| user_id                    | User ID to create the instance                               | Required          |                                                              |
| vault.obj_info             | S3 link configuration                                        | Required          |                                                              |
| vault.obj_info.ak          | S3 Access Key                                                | Required          |                                                              |
| vault.obj_info.sk          | S3 Secret Key                                                | Required          |                                                              |
| vault.obj_info.bucket      | S3 bucket name                                               | Required          |                                                              |
| vault.obj_info.prefix      | Prefix for data storage on S3                                | Optional          | If this parameter is empty, the default storage location will be in the root directory of the bucket. |
| obj_info.endpoint          | S3 endpoint                                                  | Required          | The domain or IP:port, not including the scheme prefix such as` http://.` |
| obj_info.region            | S3 region                                                    | Required          | If using MinIO, this parameter can be filled in with any value. |
| obj_info.external_endpoint | S3 external endpoint                                         | Required          | Normally consistent with the endpoint. Compatible with OSS. Note the difference between external and internal OSS. |
| vault.obj_info.provider    | S3 provider; options include OSS, S3, COS, OBS, BOS, GCP, and AZURE | Required          | If using MinIO, simply fill in 'S3'.                         |

- Example of a `create_instance` request using object storage as the storage vault

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

- Returned parameter

| Parameter | Description          | Required/Optional | Notes                                                        |
| --------- | -------------------- | ----------------- | ------------------------------------------------------------ |
| code      | Response status code | Required          | Enumerated values, including OK, INVALID_ARGUMENT, INTERNAL_ERROR, and ALREADY_EXISTED |
| msg       | Error message        | Required          | If an error occurs, an error message will be returned; if no error occurs, an empty string will be returned. |

- Successful response

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- Example of unsuccessful response

```Plain
{
 "code": "ALREADY_EXISTED",
 "msg": "instance already existed, instance_id=instance_id_deadbeef"
}
```

## create_instance (one storage vault)

:::caution

This is a legacy interface and is deprecated in newer versions. It should not be used in private deployment. 

:::

### Description

This API is used to create an instance, which only supports one storage vault (must be S3). This instance does not contain any node information. The same `instance_id` cannot be created multiple times.

### Request

- Syntax

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

- Parameter

| Parameter                  | Description                                      | Required/Optional | Notes                                                        |
| -------------------------- | ------------------------------------------------ | ----------------- | ------------------------------------------------------------ |
| instance_id                | instance_id                                      | Required          | Globally and historically unique, normally a UUID string     |
| name                       | Instance name                                    | Optional          |                                                              |
| user_id                    | User ID                                          | Required          |                                                              |
| obj_info                   | S3 link configuration                            | Required          |                                                              |
| obj_info.ak                | S3 Access Key                                    | Required          |                                                              |
| obj_info.sk                | S3 Secret Key                                    | Required          |                                                              |
| obj_info.bucket            | S3 bucket name                                   | Required          |                                                              |
| obj_info.prefix            | Prefix for data storage on S3                    | Optional          | If this parameter is empty, the default storage location will be in the root directory of the bucket. |
| obj_info.endpoint          | S3 endpoint                                      | Required          | The domain or IP:port, not including the scheme prefix such as `http://. ` |
| obj_info.region            | S3 region                                        | Required          |                                                              |
| obj_info.external_endpoint | S3 external endpoint                             | Optional          | Compatible with OSS. Note the difference between external and internal OSS. |
| obj_info.provider          | S3 provider                                      | Required          |                                                              |
| obj_info.user_id           | user_id for bucket                               | Optional          | Used to identify the object that needs to have its AK/SK changed during AK/SK rotation. |
| ram_user                   | ram_user, used for external bucket authorization | Optional          |                                                              |
| ram_user.user_id           |                                                  | Required          |                                                              |
| ram_user.ak                |                                                  | Required          |                                                              |
| ram_user.sk                |                                                  | Required          |                                                              |

- Example

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

- Returned parameter

| Parameter | Description          | Required/Optional | Notes                                                        |
| --------- | -------------------- | ----------------- | ------------------------------------------------------------ |
| code      | Response status code | Required          | Enumerated values, including OK, INVALID_ARGUMENT, INTERNAL_ERROR, and ALREADY_EXISTED |
| msg       | Error message        | Required          | If an error occurs, an error message will be returned; if no error occurs, an empty string will be returned. |

- Successful response

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- Example of unsuccessful response

```Plain
{
 "code": "ALREADY_EXISTED",
 "msg": "instance already existed, instance_id=instance_id_deadbeef"
}
```

## drop_instance

### Description

This API is used to delete an existing instance. After marking it for deletion, the Recycler will asynchronously reclaim the resources.

### Request

- Syntax

```Plain
PUT /MetaService/http/drop_instance?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{
    "instance_id": string
}
```

- Parameter

| Parameter   | Description | Required/Optional | Notes                            |
| ----------- | ----------- | ----------------- | -------------------------------- |
| instance_id | instance_id | Required          | Globally and historically unique |

- Example

```Plain
PUT /MetaService/http/drop_instance?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{
    "instance_id": "123456"
}
```

- Returned parameter

| Parameter | Description          | Required/Optional | Notes                                                        |
| --------- | -------------------- | ----------------- | ------------------------------------------------------------ |
| code      | Response status code | Required          | Enumerated values, including OK, INVALID_ARGUMENT, INTERNAL_ERROR, and ALREADY_EXISTED |
| msg       | Error message        | Required          | If an error occurs, an error message will be returned; if no error occurs, an empty string will be returned. |

- Successful response

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- Example of unsuccessful response

```Plain
{
 "code": "INVALID_ARGUMENT",
 "msg": "failed to drop instance, instance has clusters"
}
```

## get_instance

### Description

This API is used to query the details of an instance, including information of S3, compute clusters, and stages. It can be used for debugging purposes.

### Request

- Syntax

```Plain
GET /MetaService/http/get_instance?token=greedisgood9999&instance_id={instance_id} HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
```

- Parameter

| Parameter   | Description | Required/Optional | Notes                            |
| ----------- | ----------- | ----------------- | -------------------------------- |
| instance_id | instance_id | Required          | Globally and historically unique |

- Example

```Plain
GET /MetaService/http/get_instance?token=greedisgood9999&instance_id=test-instance HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
```

- Returned parameter

| Parameter          | Description                                      | Required/Optional | Notes                                                        |
| ------------------ | ------------------------------------------------ | ----------------- | ------------------------------------------------------------ |
| code               | Response status code                             | Required          | Enumerated values, including OK, INVALID_ARGUMENT, INTERNAL_ERROR, and ALREADY_EXISTED |
| msg                | Error message                                    | Required          | If an error occurs, an error message will be returned; if no error occurs, an empty string will be returned. |
| result             | Details of the instance                          | Required          |                                                              |
| result.user_id     | User ID used to create the instance              | Required          |                                                              |
| result.instance_id | instance_id passed in when creating the instance | Required          |                                                              |
| result.name        | User name used to create the instance            | Required          |                                                              |
| result.clusters    | List of compute clusters within the instance     | Required          |                                                              |
| result.mtime       | Modification time of the instance                | Required          |                                                              |
| result.obj_info    | S3 information list associated with the instance | Required          |                                                              |
| result.stages      | List of stages associated with the instance      | Required          |                                                              |
| result.status      | Instance status                                  | Optional          | If an instance is dropped, its status will turn into "DELETED". |

- Successful response

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

## set_instance_status

### Description

This API is used to set the status of an instance to either `NORMAL` or `OVERDUE`.

### Request

- Syntax

```Plain
PUT /MetaService/http/set_instance_status?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{
    "instance_id": string
    "op": string
}
```

- Parameter

| Parameter   | Description                                        | Required/Optional | Notes |
| ----------- | -------------------------------------------------- | ----------------- | ----- |
| instance_id |                                                    | Required          |       |
| op          | It should be either "SET_NORMAL" or "SET_OVERDUE". | Required          |       |

- Request example

```Plain
curl '127.0.0.1:5000/MetaService/http/set_instance_status?token=greedisgood9999' -d '{
    "instance_id":"test_instance",
    "op": "SET_OVERDUE"
}'
```

- Returned parameter

| Parameter | Description          | Required/Optional | Notes |
| --------- | -------------------- | ----------------- | ----- |
| code      | Response status code | Required          |       |
| msg       | Error message        | Required          |       |

- Successful response

```Plain
{
    "code": "OK",
    "msg": ""
}
```

## get_obj_store_info

### Description

This API is used to retrieve the S3 Access Key (AK) and Secret Key (SK) configured for a given instance. This API can be called multiple times using the same parameters.

### Request

- Syntax

```Plain
PUT /MetaService/http/get_obj_store_info?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{"cloud_unique_id": "<cloud_unique_id>"}
```

- Parameter

| Parameter       | Description             | Required/Optional | Notes                                                        |
| --------------- | ----------------------- | ----------------- | ------------------------------------------------------------ |
| cloud_unique_id | cloud_unique_id of node | Required          | The unique_id of a node under an instance can be used to retrieve the S3 information configured for the entire instance. |

- Example

```Plain
PUT /MetaService/http/get_obj_store_info?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{"cloud_unique_id": "1:regression_instance0:cloud_unique_id_compute_node1"}
```

- Returned parameter

| Parameter | Description          | Required/Optional | Notes                                                        |
| --------- | -------------------- | ----------------- | ------------------------------------------------------------ |
| code      | Response status code | Required          | Enumerated values, including OK, INVALID_ARGUMENT, INTERNAL_ERROR, and ALREADY_EXISTED |
| msg       | Error message        | Required          | If an error occurs, an error message will be returned; if no error occurs, an empty string will be returned. |
| result    | Result objects       | Required          |                                                              |

- Successful response

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

- Example of unsuccessful response

```Plain
{
 "code": "INVALID_ARGUMENT",
 "msg": "empty instance_id"
}
```

## update_ak_sk

### Description

This API is used to update the S3 and RAM_USER Access Key (AK) and Secret Key (SK) information configured for a given instance. It uses `user_id` to identify the item to be modified. This API is typically used for AK/SK rotation, and calling it with the same parameters will result in an error.

### Request

- Syntax

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

- Parameter

| Parameter                    | Description                     | Required/Optional                               | Notes |
| ---------------------------- | ------------------------------- | ----------------------------------------------- | ----- |
| instance_id                  | instance_id                     | Required                                        |       |
| internal_bucket_user         | bucket_user list to be modified | Either fill in internal_bucket_user or ram_user | Array |
| internal_bucket_user.user_id | The relevant user_id            | Required                                        |       |
| internal_bucket_user.ak      |                                 | Required                                        |       |
| internal_bucket_user.sk      |                                 | Required                                        |       |
| ram_user                     | ram_user to be modified         | Either fill in internal_bucket_user or ram_user |       |
| ram_user.user_id             | The relevant user_id            | Required                                        |       |
| ram_user.ak                  |                                 | Required                                        |       |
| ram_user.sk                  |                                 | Required                                        |       |

- Example

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

- Returned parameter

| Parameter | Description          | Required/Optional | Notes                                                        |
| --------- | -------------------- | ----------------- | ------------------------------------------------------------ |
| code      | Response status code | Required          | Enumerated values, including OK, INVALID_ARGUMENT, INTERNAL_ERROR, and ALREADY_EXISTED |
| msg       | Error message        | Required          | If an error occurs, an error message will be returned; if no error occurs, an empty string will be returned. |

- Successful response

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- Example of unsuccessful response

```Plain
{
 "code": "INVALID_ARGUMENT",
 "msg": "ak sk eq original, please check it"
}
```

## legacy_update_ak_sk

:::caution

This is a legacy interface and is deprecated in newer versions.

:::

### Description

This API is used to update the S3 Access Key (AK) and Secret Key (SK) configured for an instance. It uses `ID` to identify the item to be modified. The `ID` can be obtained by calling `get_obj_store_info`. Calling this API multiple times with the same parameters will result in an error.

### Request

- Syntax

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

- Parameter

| Parameter       | Description             | Required/Optional | Notes                  |
| --------------- | ----------------------- | ----------------- | ---------------------- |
| cloud_unique_id | cloud_unique_id of node | Required          |                        |
| obj             | Object                  | Required          | S3 information object  |
| obj.id          | Object ID               | Required          | ID ranges from 1 to 10 |
| obj.ak          | Object Access Key       | Required          |                        |
| obj.sk          | Object Secret Key       | Required          | String array           |

- Example

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

- Returned parameter

| Parameter | Description          | Required/Optional | Notes                                                        |
| --------- | -------------------- | ----------------- | ------------------------------------------------------------ |
| code      | Response status code | Required          | Enumerated values, including OK, INVALID_ARGUMENT, INTERNAL_ERROR, and ALREADY_EXISTED |
| msg       | Error message        | Required          | If an error occurs, an error message will be returned; if no error occurs, an empty string will be returned. |

- Successful response

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- Example of unsuccessful response

```Plain
{
 "code": "INVALID_ARGUMENT",
 "msg": "ak sk eq original, please check it"
}
```

## add_obj_info

### Description

This API is used to add S3 configurations for an instance. It supports a maximum of 10 S3 configurations, and each configuration must not exceed 1024 bytes in size.

### Request

- Syntax

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

- Parameter

| Parameter       | Description               | Required/Optional | Notes     |
| --------------- | ------------------------- | ----------------- | --------- |
| cloud_unique_id | cloud_unique_id of node   | Required          |           |
| obj             | Object                    | Required          | S3 object |
| obj.ak          | S3 Access Key to be added | Required          |           |
| obj.sk          | S3 Secret Key to be added | Required          |           |
| obj.bucket      | S3 bucket to be added     | Required          |           |
| obj.prefix      | S3 prefix to be added     | Required          |           |
| obj.endpoint    | S3 endpoint to be added   | Required          |           |
| obj.region      | S3 region to be added     | Required          |           |

- Example

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

- Returned parameter

| Parameter | Description          | Required/Optional | Notes                                                        |
| --------- | -------------------- | ----------------- | ------------------------------------------------------------ |
| code      | Response status code | Required          | Enumerated values, including OK, INVALID_ARGUMENT, INTERNAL_ERROR, and ALREADY_EXISTED |
| msg       | Error message        | Required          | If an error occurs, an error message will be returned; if no error occurs, an empty string will be returned. |

- Successful response

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- Example of unsuccessful response

```Plain
{
 "code": "INVALID_ARGUMENT",
 "msg": "s3 conf info err, please check it"
}
```

## add_cluster

### Description

This API is used to create a compute cluster that belongs to an instance. The compute cluster contains information about a number (greater than or equal to 0) of nodes of the same type. This API cannot be called with the same parameters.

### Request

- Syntax

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

- Parameter

| Parameter                     | Description              | Required/Optional | Notes                                                        |
| ----------------------------- | ------------------------ | ----------------- | ------------------------------------------------------------ |
| instance_id                   | instance_id              | Required          | Globally and historically unique, normally a UUID string     |
| cluster                       | Cluster object           | Required          |                                                              |
| cluster.cluster_name          | Cluster name             | Required          | The FE cluster name is special. The default value of it is RESERVED_CLUSTER_NAME_FOR_SQL_SERVER. This can be modified by configuring cloud_observer_cluster_name in the fe.conf file. |
| cluster.cluster_id            | Cluster ID               | Required          | The FE cluster ID is special. The default value of it is RESERVED_CLUSTER_ID_FOR_SQL_SERVER. This can be modified by configuring cloud_observer_cluster_id in the fe.conf file. |
| cluster.type                  | Cluster node type        | Required          | Two types are supported: "SQL" and "COMPUTE". "SQL" represents the SQL Service corresponding to FE, while "COMPUTE" means that the compute nodes are corresponding to BE. |
| cluster.nodes                 | Nodes in the cluster     | Required          | Array                                                        |
| cluster.nodes.cloud_unique_id | cloud_unique_id of nodes | Required          | cloud_unique_id in fe.conf and be.conf                       |
| cluster.nodes.ip              | Node IP                  | Required          | When deploying FE/BE in FQDN mode, this field should be the domain name. |
| cluster.nodes.host            | Node domain name         | Optional          | This field is required when deploying FE/BE in FQDN mode.    |
| cluster.nodes.heartbeat_port  | Heartbeat port of BE     | Required for BE   | heartbeat_service_port in be.conf                            |
| cluster.nodes.edit_log_port   | Edit log port of FE      | Required for FE   | edit_log_port in fe.conf                                     |
| cluster.nodes.node_type       | FE node type             | Required          | This field is required when the cluster type is "SQL". It can be either "FE_MASTER" or "FE_OBSERVER". "FE_MASTER" indicates that the node is of Master role, and "FE_OBSERVER" indicates that the node is an Observer. Note that in an "SQL" type cluster, the nodes array can only have one "FE_MASTER" node, but it can include multiple "FE_OBSERVER" nodes. |

- Example

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

- Returned parameter

| Parameter | Description          | Required/Optional | Notes                                                        |
| --------- | -------------------- | ----------------- | ------------------------------------------------------------ |
| code      | Response status code | Required          | Enumerated values, including OK, INVALID_ARGUMENT, INTERNAL_ERROR, and ALREADY_EXISTED |
| msg       | Error message        | Required          | If an error occurs, an error message will be returned; if no error occurs, an empty string will be returned. |

- Successful response

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- Example of unsuccessful response

```Plain
{
 "code": "INTERANAL_ERROR",
 "msg": "cluster is SQL type, must have only one master node, now master count: 0"
}
```

## get_cluster

### Description

This API is used to retrieve the information of a compute cluster. It can be called repeatedly.

### Request

- Syntax

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

- Parameter

| Parameter       | Description                                     | Required/Optional | Notes                                                        |
| --------------- | ----------------------------------------------- | ----------------- | ------------------------------------------------------------ |
| cloud_unique_id | cloud_unique_id                                 | Required          | It can be used to retrieve the relevant instance_id          |
| cluster_name    | Cluster name                                    | Optional          | Note: One of the three parameters (cluster_name, cluster_id, and mysql_user_name) must be provided. If all three are empty, the API will return the information of all clusters under the instance. |
| cluster_id      | Cluster ID                                      | Optional          | Note: One of the three parameters (cluster_name, cluster_id, and mysql_user_name) must be provided. If all three are empty, the API will return the information of all clusters under the instance. |
| mysql_user_name | Available cluster configured by mysql_user_name | Optional          | Note: One of the three parameters (cluster_name, cluster_id, and mysql_user_name) must be provided. If all three are empty, the API will return the information of all clusters under the instance. |

- Example

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

- Returned parameter

| Parameter | Description          | Required/Optional | Notes                                                        |
| --------- | -------------------- | ----------------- | ------------------------------------------------------------ |
| code      | Response status code | Required          | Enumerated values, including OK, INVALID_ARGUMENT, INTERNAL_ERROR, and ALREADY_EXISTED |
| msg       | Error message        | Required          | If an error occurs, an error message will be returned; if no error occurs, an empty string will be returned. |
| result    | Result objects       | Required          |                                                              |

- Successful response

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

- Example of unsuccessful response

```Plain
{
 "code": "NOT_FOUND",
 "msg": "fail to get cluster with instance_id: \"instance_id_deadbeef\" cloud_unique_id: \"1:regression_instance0:xxx_cloud_unique_id_compute_node0\" cluster_name: \"cluster_name\" "
}
```

## drop_cluster

### Description

This API is used to delete the information of a compute cluster under an instance. Calling this API multiple times with the same parameters will result in an error.

### Request

- Syntax

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

- Parameter

| Parameter            | Description                       | Required/Optional | Notes |
| -------------------- | --------------------------------- | ----------------- | ----- |
| instance_id          | instance_id                       | Required          |       |
| cluster              | Cluster object                    | Required          |       |
| cluster.cluster_name | Name of the cluster to be deleted | Required          |       |
| cluster.cluster_id   | ID of the cluster to be deleted   | Required          |       |

- Example

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

- Returned parameter

| Parameter | Description          | Required/Optional | Notes                                                        |
| --------- | -------------------- | ----------------- | ------------------------------------------------------------ |
| code      | Response status code | Required          | Enumerated values, including OK, INVALID_ARGUMENT, INTERNAL_ERROR, and ALREADY_EXISTED |
| msg       | Error message        | Required          | If an error occurs, an error message will be returned; if no error occurs, an empty string will be returned. |

- Successful response

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- Example of unsuccessful response

```Plain
{
 "code": "INTERANAL_ERROR",
 "msg": "failed to find cluster to drop, instance_id=dx_dnstance_id_deadbeef cluster_id=11111 cluster_name=2222"
}
```

## rename_cluster

### Description

This API is used to rename a compute cluster under an instance. It searches for the corresponding cluster based on the provided `cluster_id` and renames it accordingly. Calling this API multiple times with the same parameters will result in an error.

### Request

- Syntax

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

- Parameter

| Parameter            | Description                     | Required/Optional | Notes                                                        |
| -------------------- | ------------------------------- | ----------------- | ------------------------------------------------------------ |
| instance_id          | instance_id                     | Required          |                                                              |
| cluster              | Cluster object                  | Required          |                                                              |
| cluster.cluster_name | New cluster name                | Required          |                                                              |
| cluster.cluster_id   | ID of the cluster to be renamed | Required          | Based on this, the system retrieves the corresponding cluster, and renames it accordingly. |

- Example

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

- Returned parameter

| Parameter | Description          | Required/Optional | Notes                                                        |
| --------- | -------------------- | ----------------- | ------------------------------------------------------------ |
| code      | Response status code | Required          | Enumerated values, including OK, INVALID_ARGUMENT, INTERNAL_ERROR, and ALREADY_EXISTED |
| msg       | Error message        | Required          | If an error occurs, an error message will be returned; if no error occurs, an empty string will be returned. |

- Successful response

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- Example of unsuccessful response

```Plain
{
 "code": "INTERANAL_ERROR",
 "msg": "failed to rename cluster, name eq original name, original cluster is {\"cluster_id\":\"3333333\",\"cluster_name\":\"444444\",\"type\":\"COMPUTE\"}"
}
```

## add_node

### Description

This API is used to add nodes of the same type to a specific compute cluster under an instance. Calling this API multiple times with the same parameters will result in an error.

This API can be used to add either FE or BE nodes.

### Request

- Syntax

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

- Parameter

| Parameter                     | Description                | Required/Optional | Notes                                                        |
| ----------------------------- | -------------------------- | ----------------- | ------------------------------------------------------------ |
| instance_id                   | instance_id                | Required          |                                                              |
| cluster                       | Cluster object             | Required          |                                                              |
| cluster.cluster_name          | Name of the target cluster | Required          |                                                              |
| cluster.cluster_id            | ID of the target cluster   | Required          |                                                              |
| cluster.type                  | Cluster node type          | Required          | Two types are supported: "SQL" and "COMPUTE". "SQL" represents the SQL Service corresponding to FE, while "COMPUTE" means that the compute nodes are corresponding to BE. |
| cluster.nodes                 | Nodes in the cluster       | Required          | Array                                                        |
| cluster.nodes.cloud_unique_id | cloud_unique_id of nodes   | Required          | cloud_unique_id in fe.conf and be.conf                       |
| cluster.nodes.ip              | Node IP                    | Required          | When deploying FE/BE in FQDN mode, this field should be the domain name. |
| cluster.nodes.host            | Node domain name           | Optional          | This field is required when deploying FE/BE in FQDN mode.    |
| cluster.nodes.heartbeat_port  | Heartbeat port of BE       | Required for BE   | heartbeat_service_port in be.conf                            |
| cluster.nodes.edit_log_port   | Edit log port of FE        | Required for FE   | edit_log_port in fe.conf                                     |
| cluster.nodes.node_type       | FE node type               | Required          | This field is required when the cluster type is "SQL". It can be either "FE_MASTER" or "FE_OBSERVER". "FE_MASTER" indicates that the node is of Master role, and "FE_OBSERVER" indicates that the node is an Observer. Note that in an "SQL" type cluster, the nodes array can only have one "FE_MASTER" node, but it can include multiple "FE_OBSERVER" nodes. |

- Example

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

- Returned parameter

| Parameter | Description          | Required/Optional | Notes                                                        |
| --------- | -------------------- | ----------------- | ------------------------------------------------------------ |
| code      | Response status code | Required          | Enumerated values, including OK, INVALID_ARGUMENT, INTERNAL_ERROR, and ALREADY_EXISTED |
| msg       | Error message        | Required          | If an error occurs, an error message will be returned; if no error occurs, an empty string will be returned. |

- Successful response

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- Example of unsuccessful response

```Plain
{
 "code": "INTERANAL_ERROR",
 "msg": "cloud_unique_id is already occupied by an instance, instance_id=instance_id_deadbeef_1 cluster_name=dx_cluster_name1 cluster_id=cluster_id1 cloud_unique_id=cloud_unique_id_compute_node2"
}
```

## drop_node

### Description

This API is used to reduce nodes of the same type for a specific compute cluster under an instance. 

### Request

- Syntax

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

- Parameter

| Parameter            | Description                | Required/Optional | Notes |
| -------------------- | -------------------------- | ----------------- | ----- |
| instance_id          | instance_id                | Required          |       |
| cluster              | Cluster object             | Required          |       |
| cluster.cluster_name | Name of the target cluster | Required          |       |
| cluster.cluster_id   | ID of the target cluster   | Required          |       |
| cluster.type         | Cluster node type          | Required          |       |
| cluster.node         | Nodes in the cluster       | Required          | Array |

- Example

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

- Returned parameter

| Parameter | Description          | Required/Optional | Notes                                                        |
| --------- | -------------------- | ----------------- | ------------------------------------------------------------ |
| code      | Response status code | Required          | Enumerated values, including OK, INVALID_ARGUMENT, INTERNAL_ERROR, and ALREADY_EXISTED |
| msg       | Error message        | Required          | If an error occurs, an error message will be returned; if no error occurs, an empty string will be returned. |

- Successful response

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- Example of unsuccessful response

```Plain
{
 "code": "INTERANAL_ERROR",
 "msg": "cloud_unique_id can not find to drop node, instance_id=instance_id_deadbeef_1 cluster_name=cluster_name1 cluster_id=cluster_id1 cloud_unique_id=cloud_unique_id_compute_node2"
}
```

## update_cluster_mysql_user_name

### Description

This API is used to add a user to a specific compute cluster under an instance, allowing that user to log in to the system using a MySQL Client and access the default compute cluster.

### Request

- Syntax

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

- Parameter

| Parameter               | Description                | Required/Optional | Notes        |
| ----------------------- | -------------------------- | ----------------- | ------------ |
| instance_id             | instance_id                | Required          |              |
| cluster                 | Cluster object             | Required          |              |
| cluster.cluster_name    | Name of the target cluster | Required          |              |
| cluster.cluster_id      | ID of the target cluster   | Required          |              |
| cluster.mysql_user_name | mysql_user_name            | Required          | String array |

- Example

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

- Returned parameter

| Parameter | Description          | Required/Optional | Notes                                                        |
| --------- | -------------------- | ----------------- | ------------------------------------------------------------ |
| code      | Response status code | Required          | Enumerated values, including OK, INVALID_ARGUMENT, INTERNAL_ERROR, and ALREADY_EXISTED |
| msg       | Error message        | Required          | If an error occurs, an error message will be returned; if no error occurs, an empty string will be returned. |

- Successful response

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- Example of unsuccessful response

```Plain
{
 "code": "INTERANAL_ERROR",
 "msg": "no mysql user name to change"
}
```

## cloud_cluster_status

### Description

This API is used to retrieve the status of Fragments running on BE nodes within the compute cluster.

:::tip

This API is a request to the FE.

:::

### Request

- Syntax

```Plain
GET /rest/v2/manager/cluster/cluster_info/cloud_cluster_status HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
```

- Parameter

| Parameter | Description | Required/Optional | Notes                      |
| --------- | ----------- | ----------------- | -------------------------- |
| user      | Username    | Required          | Authentication information |
| password  | Password    | Required          | Authentication information |

- Example

```Plain
curl -u root: http://127.0.0.1:12100/rest/v2/manager/cluster/cluster_info/cloud_cluster_status
```

- Returned parameter

| Parameter | Description                                                  | Required/Optional | Notes |
| --------- | ------------------------------------------------------------ | ----------------- | ----- |
| code      | Response status code                                         | Required          |       |
| msg       | Error message                                                | Required          |       |
| data      | Map returned. The Key is Cluster ID and the Value is a BE list. |                   |       |

- Successful response

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

## enable_instance_sse

### Description

This API is used to enable server-side encryption for the instance object data.

### Request

- Syntax

```Plain
PUT /MetaService/http/enable_instance_sse?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{
    "instance_id": string
}
```

- Parameter

| Parameter   | Description | Required/Optional | Notes                            |
| ----------- | ----------- | ----------------- | -------------------------------- |
| instance_id | instance_id | Required          | Globally and historically unique |

- Example

```Plain
PUT /MetaService/http/enable_instance_sse?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{
    "instance_id": "123456"
}
```

- Returned parameter

| Parameter | Description          | Required/Optional | Notes                                                        |
| --------- | -------------------- | ----------------- | ------------------------------------------------------------ |
| code      | Response status code | Required          | Enumerated values, including OK, INVALID_ARGUMENT, INTERNAL_ERROR, and ALREADY_EXISTED |
| msg       | Error message        | Required          | If an error occurs, an error message will be returned; if no error occurs, an empty string will be returned. |

- Successful response

```Plain
{
 "code": "OK",
 "msg": ""
}
```

- Example of unsuccessful response

```Plain
{
 "code": "INVALID_ARGUMENT",
 "msg": "failed to enable sse, instance has enabled sse"
}
```

## get_cluster_status

### Description

This API is used to retrieve the runtime status of the compute clusters across multiple instances.

### Request

- Syntax

```Plain
PUT /MetaService/http/get_cluster_status?token=<token> HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{
    "instance_ids": [string, string],
    "status": string
}
```

- Parameter

| Parameter        | Description          | Required/Optional | Notes                                                        |
| ---------------- | -------------------- | ----------------- | ------------------------------------------------------------ |
| instance_ids     | IDs of the instances | Required          |                                                              |
| cloud_unique_ids | cloud_unique_ids     | Optional          | instance_ids is required while cloud_unique_ids is optional  |
| status           | Filtering condition  | Optional          | Possible status includes "NORMAL", "STOPPED", and "TO_RESUME". If this parameter is not filled in, the systen will return the status of all clusters. |

- Example

```Plain
PUT /MetaService/http/get_cluster_status?token=greedisgood9999 HTTP/1.1
Content-Length: 109
Content-Type: text/plain
{
    "instance_ids":["regression_instance-dx-1219", "regression_instance-dx-0128"],
    "status":"NORMAL"
}
```

- Returned parameter

| Parameter      | Description                                  | Required/Optional | Notes |
| -------------- | -------------------------------------------- | ----------------- | ----- |
| code           | Response status code                         | Required          |       |
| msg            | Error message                                | Required          |       |
| result.details | Returned status list of all compute clusters | Required          |       |

- Successful response

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

## set_cluster_status

### Description

This API is used to set the runtime status of compute clusters.

### Request

- Syntax

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

- Parameter

| Parameter       | Description                  | Required/Optional | Notes                                                        |
| --------------- | ---------------------------- | ----------------- | ------------------------------------------------------------ |
| cloud_unique_id |                              | Optional          |                                                              |
| instance_id     |                              | Required          |                                                              |
| cluster_id      | ID of the target cluster     | Required          |                                                              |
| cluster_status  | Status of the target cluster | Required          | Possible status includes "NORMAL", "STOPPED", and "TO_RESUME". |

- Example

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

- Returned parameter

| Parameter | Description          | Required/Optional | Notes |
| --------- | -------------------- | ----------------- | ----- |
| code      | Response status code | Required          |       |
| msg       | Error message        | Required          |       |

- Successful response

```Plain
{
    "code": "OK",
    "msg": ""
}
```

Since this API is used by both the cloud management platform and the FE, certain rules needs to be followed. Only the following status transitions are allowed:

- `ClusterStatus::UNKNOWN` -> `ClusterStatus::NORMAL` (When a compute cluster is created using the cloud management platform, the initial status of the cluster is directly set to `NORMAL`. This operation is usually completed via the `add_cluster` interface.)
- `ClusterStatus::NORMAL` -> `ClusterStatus::SUSPENDED` (Set when the cloud management platform suspends the compute cluster)
- `ClusterStatus::SUSPENDED` -> `ClusterStatus::TO_RESUME` (Set when the FE wakes up the compute cluster)
- `ClusterStatus::TO_RESUME` -> `ClusterStatus::NORMAL` (Set when the cloud management platform resumes the status of the compute cluster)

Attempts to execute status transitions other than those listed above will incur errors.

```Plain
{
    "code": "INVALID_ARGUMENT",
    "msg": "failed to set cluster status, original cluster is NORMAL and want set TO_RESUME"
}
```

## decode_key

### Description

This API is used to decode the Key from the Meta Service Log for debugging purposes.

### Request

- Syntax

```Plain
GET /MetaService/http/decode_key?token=greedisgood9999&key={key} HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
```

- Parameter

| Parameter | Description       | Required/Optional | Notes |
| --------- | ----------------- | ----------------- | ----- |
| key       | Key to be decoded | Required          |       |
| unicode   | Response format   | Optional          |       |

- Example

```Plain
GET /MetaService/http/decode_key?token=greedisgood9999&key=0110696e7374616e636500011072656772657373696f6e5f696e7374616e6365300001 HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
```

- Successful response

```Plain
┌───────────────────────── 0. key space: 1
│ ┌─────────────────────── 1. instance
│ │                     ┌─ 2. regression_instance0
│ │                     │
▼ ▼                     ▼
0110696e7374616e636500011072656772657373696f6e5f696e7374616e6365300001
```

## get_tablet_stats

### Description

This API is used to query the status of a tablet for debugging purposes.

### Request

- Syntax

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

- Parameter

| Parameter               | Description                         | Required/Optional | Notes |
| ----------------------- | ----------------------------------- | ----------------- | ----- |
| cloud_unique_id         | cloud_unique_id of node             | Required          |       |
| tablet_idx              | Tablet list to query                | Required          | Array |
| tablet_idx.table_id     | table_id of the tablet to query     | Required          |       |
| tablet_idx.index_id     | index_id of the tablet to query     | Required          |       |
| tablet_idx.partition_id | partition_id of the tablet to query | Required          |       |
| tablet_idx.tablet_id    | tablet_id of the tablet to query    | Required          |       |

- Example

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

- Successful response

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

## abort_txn

### Description

This API is used to abort a transaction during debugging.

### Request

- Syntax

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

- Parameter

| Parameter       | Description                       | Required/Optional | Notes |
| --------------- | --------------------------------- | ----------------- | ----- |
| cloud_unique_id | cloud_unique_id of node           | Required          |       |
| txn_id          | ID of the transaction to abort    | Optional          |       |
| db_id           | db_id of the transaction to abort | Optional          |       |
| label           | Label of the transaction to abort | Optional          |       |

- Example

```Plain
POST /MetaService/http/abort_txn?token=greedisgood9999 HTTP/1.1
Content-Length: <ContentLength>
Content-Type: text/plain
{
    "cloud_unique_id": "1:regression_instance0:regression-cloud-unique-id0",
    "txn_id": 869414052004864
}
```

- Successful response

```Plain
status {
  code: OK
  msg: ""
}
```

## abort_tablet_job

### Description

This API is used to abort a job running on a tablet. Currently, it only supports compaction jobs. It is used for debugging purposes.

### Request

- Syntax

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

- Parameter

| Parameter         | Description                              | Required/Optional | Notes                                   |
| ----------------- | ---------------------------------------- | ----------------- | --------------------------------------- |
| cloud_unique_id   | cloud_unique_id of node                  | Required          |                                         |
| job               | Job to abort                             | Required          | Currently only supports compaction jobs |
| job.idx           | Index to abort                           | Required          |                                         |
| job.idx.tablet_id | The corresponding tablet_id to abort.idx |                   |                                         |
| job.compaction    | The compaction to abort                  |                   | Array                                   |
| job.compaction.id | ID of the compaction to abort            |                   |                                         |

- Example

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

- Successful response

```
status {
  code: OK
  msg: ""
}
```

