---
{
    "title": "Creating Cluster",
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

Creating a Doris cluster in the compute-storage decoupled mode is to create the entire distributed system that contains both FE and BE nodes. Then, in such a cluster, users can create compute clusters. Each compute cluster is a group of computing resources consisting of one or more BE nodes.

A single FoundationDB + Meta Service + Recycler infrastructure can support multiple compute-storage decoupled clusters, where each compute-storage decoupled cluster is considered a data warehouse instance (instance).

In the compute-storage decoupled mode, the registration and changes of nodes in a warehouse is managed by Meta Service. FE, BE, and Meta Service interact for service discovery and authentication.

Creating a Doris cluster in the compute-storage decoupled mode entails interaction with Meta Service. Meta Service provides standard HTTP APIs for resource management operations. For more information, refer to [Meta Service API](./meta-service-api.md).

The compute-storage decoupled mode of Doris adopts a service discovery mechanism. The steps to create a compute-storage separation cluster can be summarized as follows:

1. Register and specify the data warehouse instance and its storage backend.
2. Register and specify the FE and BE nodes that make up the data warehouse instance, including the specific machines and how they form the cluster.
3. Configure and start all the FE and BE nodes.

:::info

- **`127.0.0.1:5000`** **in the examples of this page refers to the address of Meta Service. Please replace it with the actual IP address and bRPC listening port for your own use case.**
- Please modify the configuration items in the following examples as needed.

:::

## Create cluster & storage vault

The first step is to register a data warehouse instance in Meta Service. A single Meta Service can support multiple data warehouse instances (i.e., multiple sets of FE-BE). Specifically, this process includes describing the required storage vault (i.e., the shared storage layer demonstrated in [Overview](./overview.md)) for that data warehouse instance. The options for the storage vault include HDFS and S3 (or object storage that supports the S3 protocol, such as AWS S3, GCS, Azure Blob, MinIO, Ceph, and Alibaba Cloud OSS). Storage vault is the remote shared storage used by Doris in the compute-storage decoupled mode. Users can configure multiple storage vaults for one data warehouse instance, and store different tables on different storage vaults.

This step involves calling the `create_instance` API of Meta Service. The key parameters include:

- `instance_id`: The ID of the data warehouse instance. It is typically a UUID string, such as `6ADDF03D-4C71-4F43-9D84-5FC89B3514F8`. For simplicity in this guide, a regular string is used.
- `name`: The name of the data warehouse instance, which should be filled in according to actual needs. It should follow the format of `[a-zA-Z][0-9a-zA-Z_]+`.
- `user_id`: The ID of the user who creates the data warehouse instance. It should follow the format of `[a-zA-Z][0-9a-zA-Z_]+`.
- `vault`: The storage vault information, such as HDFS properties and S3 Bucket details. Different storage vaults entails different parameters.

For more information, refer to "create_instance" in [Meta Service API](./meta-service-api.md).

Multiple compute-storage decoupled clusters (data warehouse instances/instances) can be created by making multiple calls to the Meta Service `create_instance` interface.

### Create cluster using HDFS as storage vault

To create a Doris cluster in the compute-storage decoupled mode using HDFS as the storage vault, configure the following items accurately and ensure that all nodes (including FE/BE nodes, Meta Service, and Recycler) have the necessary permissions to access the specified HDFS. This includes completing the Kerberos authorization configuration and connectivity checks for the machines (which can be tested using the Hadoop Client on the respective nodes).

| Parameter                                | Description                                                  | Required/Optional | Notes                                                        |
| ---------------------------------------- | ------------------------------------------------------------ | ----------------- | ------------------------------------------------------------ |
| instance_id                              | instance_id                                                  | Required          | Globally and historically unique, normally a UUID string     |
| name                                     | Instance name. It should conform to the format of `[a-zA-Z][0-9a-zA-Z_]+` | Optional          |                                                              |
| user_id                                  | ID of the user who creates the instance. It should conform to the format of `[a-zA-Z][0-9a-zA-Z_]+` | Required          |                                                              |
| vault                                    | Storage vault                                                | Required          |                                                              |
| vault.hdfs_info                          | Information of the HDFS storage vault                        | Required          |                                                              |
| vault.build_conf                         | Build configuration of the HDFS storage vault                | Required          |                                                              |
| vault.build_conf.fs_name                 | HDFS name, normally the connection address                   | Required          |                                                              |
| vault.build_conf.user                    | User to connect to HDFS                                      | Required          |                                                              |
| vault.build_conf.hdfs_kerberos_keytab    | Kerberos Keytab path                                         | Optional          | Required when using Kerberos authentication                  |
| vault.build_conf.hdfs_kerberos_principal | Kerberos Principal                                           | Optional          | Required when using Kerberos authentication                  |
| vault.build_conf.hdfs_confs              | Other configurations of HDFS                                 | Optional          | Can be filled in as needed                                   |
| vault.prefix                             | Prefix for data storage; used for data isolation             | Required          | Normally named after the specific business, such as `big_data` |

**Example**

```Bash
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

### Create cluster using S3 as storage vault

All object storage attributes are required in the creation statement. Specifically:

- When using object storage systems that support the S3 protocol, such as MinIO, make sure to test the connectivity and the correctness of the Access Key (AK) and Secret Access Key (SK). You can refer to [AWS CLI with MinIO Server](https://min.io/docs/minio/linux/integrations/aws-cli-with-minio.html) for further guidance.
- The value of the Bucket field should be the name of the bucket, which does NOT include the schema like `s3://`.
- The `external_endpoint` should be kept the same as the `endpoint` value.
- If you are using a non-cloud provider object storage, you can fill in any values for the region and provider fields.

| Parameter                  | Description                                                  | Required/Optional | Notes                                                        |
| -------------------------- | ------------------------------------------------------------ | ----------------- | ------------------------------------------------------------ |
| instance_id                | ID of the data warehouse instance in the compute-storage decoupled mode, normally a UUID string. It should conform to the format of `[0-9a-zA-Z_-]+`. | Required          | Example: `6ADDF03D-4C71-4F43-9D84-5FC89B3514F8`              |
| name                       | Instance name. It should conform to the format of `[a-zA-Z][0-9a-zA-Z_]+` | Optional          |                                                              |
| user_id                    | ID of the user who creates the instance. It should conform to the format of `[a-zA-Z][0-9a-zA-Z_]+` | Required          |                                                              |
| vault.obj_info             | Object storage configuration                                 | Required          |                                                              |
| vault.obj_info.ak          | Object storage Access Key                                    | Required          |                                                              |
| vault.obj_info.sk          | Object storage Secret Key                                    | Required          |                                                              |
| vault.obj_info.bucket      | Object storage bucket name                                   | Required          |                                                              |
| vault.obj_info.prefix      | Prefix for data storage on object storage                    | Optional          | If this parameter is empty, the default storage location will be in the root directory of the bucket. Example: `big_data` |
| obj_info.endpoint          | Object storage endpoint                                      | Required          | The domain or `ip:port`, not including the scheme prefix such as ` http://.` |
| obj_info.region            | Object storage region                                        | Required          | If using MinIO, this parameter can be filled in with any value. |
| obj_info.external_endpoint | Object storage external endpoint                             | Required          | Normally consistent with the endpoint. Compatible with OSS. Note the difference between external and internal OSS. |
| vault.obj_info.provider    | Object storage provider; options include OSS, S3, COS, OBS, BOS, GCP, and AZURE | Required          | If using MinIO, simply fill in 'S3'.                         |

**Example (AWS S3)**

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
      "endpoint": "s3.amazonaws.com",
      "external_endpoint": "s3.amazonaws.com",
      "region": "us-east1",
      "provider": "AWS"
    }
  }
}'
```

**Example (Tencent Cloud Object Storage)**

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

## Manage storage vault

A warehouse can be configured with one or more storage vaults. Different tables can be stored on different storage vaults.

### Concepts

- `vault name`: The name of each storage vault is globally unique within the data warehouse instance, except for the `built-in vault`. The `vault name` is specified by the user when creating the storage vault.
- `built-in vault`: This is the remote shared storage that stores Doris system tables. It must be configured when creating the data warehouse instance. The name of it is fixed as `built_in_storage_vault`. Only after configuring the `built-in vault` can the data warehouse (FE) be started.
- `default vault`: This is the default storage vault at the data warehouse instance level. Users can specify a storage vault as the default storage vault, including the`built-in vault`. In the compute-storage decoupled mode, data must be stored on a remote shared storage. If the user does not specify the `vault_name` in the `PROPERTIES` section of the table creation statement, data of that table will be stored in the `default vault`. The default vault can be reset, but the storage vault used by tables that have already been created will not change accordingly.

After configuring the `built-in vault`, you can create additional storage vaults as needed. After the FE startup is successful, you can perform storage vault operations through SQL statements, including creating storage vaults, viewing storage vaults, and specifying storage vaults during table creation.

### Create storage vault

**Syntax**

```SQL
CREATE STORAGE VAULT [IF NOT EXISTS] <vault_name>
PROPERTIES
("key" = "value",...)
```

<vault_name> is the user-defined name for the storage vault. It serves as the identifier for storage vault access.

**Example**

**Create HDFS storage vault**

```SQL
CREATE STORAGE VAULT IF NOT EXISTS ssb_hdfs_vault
    PROPERTIES (
        "type"="hdfs",                                     -- required
        "fs.defaultFS"="hdfs://127.0.0.1:8020",            -- required
        "path_prefix"="big/data",                          -- optional,  Normally named after the specifc business
        "hadoop.username"="user"                           -- optional
        "hadoop.security.authentication"="kerberos"        -- optional
        "hadoop.kerberos.principal"="hadoop/127.0.0.1@XXX" -- optional
        "hadoop.kerberos.keytab"="/etc/emr.keytab"         -- optional
    );
```

**Create S3 storage vault**

```SQL
CREATE STORAGE VAULT IF NOT EXISTS ssb_s3_vault
    PROPERTIES (
        "type"="S3",                                            -- required
        "s3.endpoint" = "oss-cn-beijing.aliyuncs.com",          -- required
        "s3.external_endpoint" = "oss-cn-beijing.aliyuncs.com", -- required
        "s3.bucket" = "sample_bucket_name",                     -- required
        "s3.region" = "bj",                                     -- required
        "s3.root.path" = "big/data/prefix",                     -- required
        "s3.access_key" = "ak",                                 -- required
        "s3.secret_key" = "sk",                                 -- required
        "provider" = "cos",                                     -- required
    );
```

:::info

Newly created storage vaults may NOT be immediately visible to the BE. This means if you try to import data into tables with a newly created storage vault, you might expect error reports in the short term (< 1 minute) until the storage vault is fully propagated to the BE nodes.

:::

**Properties**

| Parameter                      | Description                                                  | Required/Optional | Example                       |
| ------------------------------ | ------------------------------------------------------------ | ----------------- | ----------------------------- |
| type                           | S3 and HDFS are currently supported.                         | Required          | `s3` or `hdfs`                |
| fs.defaultFS                   | HDFS vault parameter                                         | Required          | `hdfs://127.0.0.1:8020`       |
| path_prefix                    | HDFS vault parameter, the path prefix for data storage, normally configured based on specific business. | Optional          | `big/data/dir`                |
| hadoop.username                | HDFS vault parameter                                         | Optional          | `hadoop`                      |
| hadoop.security.authentication | HDFS vault parameter                                         | Optional          | `kerberos`                    |
| hadoop.kerberos.principal      | HDFS vault parameter                                         | Optional          | `hadoop/127.0.0.1@XXX`        |
| hadoop.kerberos.keytab         | HDFS vault parameter                                         | Optional          | `/etc/emr.keytab`             |
| dfs.client.socket-timeout      | HDFS vault parameter, measured in millisecond                | Optional          | `60000`                       |
| s3.endpiont                    | S3 vault parameter                                           | Required          | `oss-cn-beijing.aliyuncs.com` |
| s3.external_endpoint           | S3 vault parameter                                           | Required          | `oss-cn-beijing.aliyuncs.com` |
| s3.bucket                      | S3 vault parameter                                           | Required          | `sample_bucket_name`          |
| s3.region                      | S3 vault parameter                                           | Required          | `bj`                          |
| s3.root.path                   | S3 vault parameter, path prefix for the actual data storage  | Required          | `/big/data/prefix`            |
| s3.access_key                  | S3 vault parameter                                           | Required          |                               |
| s3.secret_key                  | S3 vault parameter                                           | Required          |                               |
| provider                       | S3 vault parameter. Options include OSS, AWS S3, COS, OBS, BOS, GCP, and Microsoft Azure. If using MinIO, simply fill in 'S3'. | Required          | `cos`                         |

View storage vault

**Syntax**

```Plain
SHOW STORAGE VAULT
```

The returned result contains 4 columns, which are the name of the storage vault, the ID of the storage vault, the properties of the storage vault, and whether it is the default storage vault.

**Example**

```SQL
mysql> show storage vault;
+------------------------+----------------+-------------------------------------------------------------------------------------------------------------+-----------+
| StorageVaultName       | StorageVaultId | Propeties                                                                                                   | IsDefault |
+------------------------+----------------+-------------------------------------------------------------------------------------------------------------+-----------+
| built_in_storage_vault | 1              | build_conf { fs_name: "hdfs://127.0.0.1:8020" } prefix: "_1CF80628-16CF-0A46-54EE-2C4A54AB1519"             | false     |
| hdfs_vault             | 2              | build_conf { fs_name: "hdfs://127.0.0.1:8020" } prefix: "big/data/dir_0717D76E-FF5E-27C8-D9E3-6162BC913D97" | false     |
+------------------------+----------------+-------------------------------------------------------------------------------------------------------------+-----------+
```

### Set default storage vault

**Syntax**

```SQL
SET <vault_name> AS DEFAULT STORAGE VAULT
```

### Specify storage vault for table

In the table creation statement, if you specify the `storage_vault_name` in the `PROPERTIES`, the data will be stored in the storage vault corresponding to the specified `vault name`. After the table is successfully created, the `storage_vault`cannot be modified, which means that the storage vault cannot be changed.

**Example**

```SQL
CREATE TABLE IF NOT EXISTS supplier (
  s_suppkey int(11) NOT NULL COMMENT "",
  s_name varchar(26) NOT NULL COMMENT "",
  s_address varchar(26) NOT NULL COMMENT "",
  s_city varchar(11) NOT NULL COMMENT "",
  s_nation varchar(16) NOT NULL COMMENT "",
  s_region varchar(13) NOT NULL COMMENT "",
  s_phone varchar(16) NOT NULL COMMENT ""
)
UNIQUE KEY (s_suppkey)
DISTRIBUTED BY HASH(s_suppkey) BUCKETS 1
PROPERTIES (
"replication_num" = "1",
"storage_vault_name" = "ssb_hdfs_vault"
);
```

### Built-in storage vault

When creating an instance, users can choose **Vault Mode** or **Non-Vault Mode**. In **Vault Mode**, the passed-in Vault will be set as the `built-in storage vault`, which is used to save internal table information (such as statistics tables). If the `built-in storage vault` is not created, the FE will not be able to start normally.

Users can also choose to store their new tables in the `built-in storage vault`. This can be done by setting the `built-in storage vault` as the `default storage vault` or by setting the `storage_vault_name` of the table to `built-in storage vault` in the table creation statement.

### Modify storage vault

Some of the storage vault configurations are modifiable.

Coming soon

### Delete storage vault

Only non-default storage vaults that are not referenced by any tables can be deleted.

Coming soon

### Storage vault privilege

You can grant privileges of a specific storage vault to a designated MySQL user, so that the user can configure that storage vault for a newly created table or view that storage vault.

**Syntax**

```SQL
GRANT
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    TO { ROLE | USER } {<role> | <user>}
```

Only the Admin user has the privilege to execute the `GRANT` statement, which is used to grant the privileges for a specified storage vault to a User/Role.

Users/Roles with the `USAGE_PRIV` privilege for a specific storage vault can perform the following operations:

- View the information of the storage vault using the `SHOW STORAGE VAULT` statement.
- Specify that storage vault in the `PROPERTIES` when creating a table.

**Example**

```Bash
grant usage_priv on storage vault my_storage_vault to user1
```

Revoke storage vault privileges for a MySQL user.

**Syntax**

```SQL
REVOKE 
    USAGE_PRIV
    ON STORAGE VAULT <vault_name>
    FROM { ROLE | USER } {<role> | <user>}
```

Only the Admin user has the privilege to execute the `REVOKE` statement, which is used to revoke the privileges that a User/Role has on a specific storage vault.

**Example**

```Bash
revoke usage_priv on storage vault my_storage_vault from user1
```

## Add FE 

In the compute-storage decoupled mode, the node management interfaces for FE and BE are the same, with only the parameter configurations differing.

The initial FE and BE nodes can be added through the Meta Service `add_cluster` interface.

The parameter list for the `add_cluster` interface is as follows:

| Parameter                     | Description                                                  | Required/Optional | Notes                                                        |
| ----------------------------- | ------------------------------------------------------------ | ----------------- | ------------------------------------------------------------ |
| instance_id                   | ID of the data warehouse instance in the compute-storage decoupled mode, normally a UUID string. It should conform to the format of `[0-9a-zA-Z_-]+`. | Required          | Globally and historically unique, normally a UUID string. Users should use a different `instance_id` each time they call this interface. |
| cluster                       | Cluster object                                               | Required          |                                                              |
| cluster.cluster_name          | Cluster name. It should conform to the format of `[a-zA-Z][0-9a-zA-Z_]+`. | Required          | The FE cluster name is special. The default value of it is `RESERVED_CLUSTER_NAME_FOR_SQL_SERVER`. This can be modified by configuring `cloud_observer_cluster_name` in the `fe.conf` file. |
| cluster.cluster_id            | Cluster ID                                                   | Required          | The FE cluster ID is special. The default value of it is `RESERVED_CLUSTER_ID_FOR_SQL_SERVER`. This can be modified by configuring `cloud_observer_cluster_id` in the `fe.conf` file. |
| cluster.type                  | Cluster node type                                            | Required          | Two types are supported: `SQL` and `COMPUTE`. `SQL` represents the SQL Service corresponding to FE, while `COMPUTE` means that the compute nodes are corresponding to BE. |
| cluster.nodes                 | Nodes in the cluster                                         | Required          | Array                                                        |
| cluster.nodes.cloud_unique_id | `cloud_unique_id `of nodes. It should conform to the format of  `1:<instance_id>:<string>`, in which the `string ` should conform to the format of `[0-9a-zA-Z_-]+` . The value for each node should be different. | Required          | `cloud_unique_id` in `fe.conf` and `be.conf`                 |
| cluster.nodes.ip              | Node IP                                                      | Required          | When deploying FE/BE in FQDN mode, this field should be the domain name. |
| cluster.nodes.host            | Node domain name                                             | Optional          | This field is required when deploying FE/BE in FQDN mode.    |
| cluster.nodes.heartbeat_port  | Heartbeat port of BE                                         | Required for BE   | `heartbeat_service_port` in `be.conf`                        |
| cluster.nodes.edit_log_port   | Edit log port of FE                                          | Required for FE   | `edit_log_port` in `fe.conf`                                 |
| cluster.nodes.node_type       | FE node type                                                 | Required          | This field is required when the cluster type is `SQL`. It can be either `FE_MASTER` or `FE_OBSERVER`. `FE_MASTER` indicates that the node is of Master role, and `FE_OBSERVER` indicates that the node is an Observer. Note that in an `SQL` type cluster, the nodes array can only have one `FE_MASTER` node, but it can include multiple `FE_OBSERVER` nodes. |

This is an example of adding one FE:

```Bash
# Add FE
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

# Confirm successful creation based on the returned result of the get_cluster command.
curl '127.0.0.1:5000/MetaService/http/get_cluster?token=greedisgood9999' -d '{
    "instance_id":"sample_instance_id",
    "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_sql_server00",
    "cluster_name":"RESERVED_CLUSTER_NAME_FOR_SQL_SERVER",
    "cluster_id":"RESERVED_CLUSTER_ID_FOR_SQL_SERVER"
}'
```

If you need to add 2 FE nodes during the initial operation using the interface mentioned above, you can add configurations for the additional node in the `nodes` array.

This is an example of adding an `observer` node:

```
...
        "nodes":[
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_sql_server00",
                "ip":"172.21.16.21",
                "edit_log_port":12103,
                "node_type":"FE_MASTER"
            },
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_sql_server00",
                "ip":"172.21.16.22",
                "edit_log_port":12103,
                "node_type":"FE_OBSERVER"
            }
        ]
...
```

If you need to add or drop FE nodes, you may refer to the "Manage compute cluster" section on this page.

## Create compute cluster

Users can create one or more compute clusters, and a compute cluster can consist of any number of BE nodes. This is also performed via the Meta Service `add_cluster` interface.

See the "Add FE" section above for more information of the interface.

Users can adjust the number of compute clusters and the number of nodes within each cluster based on their needs. Each compute cluster should have a unique `cluster_name` and `cluster_id`.

This is an example of adding a compute cluster that consists of 1 BE node.

```Bash
# 172.19.0.11
# Add BE
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

# Confirm successful creation using get_cluster
curl '127.0.0.1:5000/MetaService/http/get_cluster?token=greedisgood9999' -d '{
    "instance_id":"sample_instance_id",
    "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_compute_node0",
    "cluster_name":"cluster_name0",
    "cluster_id":"cluster_id0"
}'
```

If you need to add 2 BE nodes during the initial operation using the interface mentioned above, you can add the configurations for the additional node in the `nodes` array.

This is an example of specifying a compute cluster with 2 BE nodes:

```
...
        "nodes":[
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_compute_node0",
                "ip":"172.21.16.21",
                "heartbeat_port":9455
            },
            {
                "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_compute_node0",
                "ip":"172.21.16.22",
                "heartbeat_port":9455
            }
        ]
...
```

For instructions on adding or dropping BE nodes, refer to the "Manage compute cluster" section on this page. 

If you need to continue adding more compute clusters, you can simply repeat the operations described in this section.

## FE/BE configuration

Compared to the [compute-storage coupled mode](../cluster-deployment/standard-deployment.md), the compute-storage decoupled mode requires additional configurations for the FE and BE:

- `meta_service_endpoint`: The address of Meta Service, which needs to be filled in both the FE and BE.
- `cloud_unique_id`: This should be filled with the corresponding value from the `add_cluster` request sent to Meta Service when creating the cluster. Doris determines whether it is operating in the compute-storage decoupled mode based on this configuration.

### fe.conf

```Shell
meta_service_endpoint = 127.0.0.1:5000
cloud_unique_id = 1:sample_instance_id:cloud_unique_id_sql_server00
```

### be.conf

In the following example, `meta_service_use_load_balancer` and `enable_file_cache` can be copied for your use case. However, you might need to modify the other configuration items.

The `file_cache_path` is a JSON array (configured according to the actual number of cache disks), and the definition of each field is as follows:

- `path`: The path to store the cached data, similar to the `storage_root_path` in the compute-storage coupled mode. 
- `total_size`: The expected upper limit of the cache space to be used.
- `query_limit`: The maximum amount of cache data that can be evicted when a single query misses the cache (to prevent large queries from evicting all the cache). Since the cache needs to store data, it is best to use high-performance disks such as SSDs as the cache storage medium.

```Shell
meta_service_endpoint = 127.0.0.1:5000
cloud_unique_id = 1:sample_instance_id:cloud_unique_id_compute_node0
meta_service_use_load_balancer = false
enable_file_cache = true
file_cache_path = [{"path":"/mnt/disk1/doris_cloud/file_cache","total_size":104857600000,"query_limit":10485760000}, {"path":"/mnt/disk2/doris_cloud/file_cache","total_size":104857600000,"query_limit":10485760000}]
```

## Start/stop FE/BE

In the compute-storage decoupled mode of Doris, the startup and shutdown processes for the FE/BE is the same as those in the [compute-storage coupled mode](../cluster-deployment/standard-deployment.md).

In the compute-storage decoupled mode, which follows a service discovery model, there is no need to use commands like `alter system add/drop frontend/backend` to manage the nodes.

```Shell
bin/start_be.sh --daemon
bin/stop_be.sh


bin/start_fe.sh --daemon
bin/stop_fe.sh
```

After startup, if the above configuration items are all correct in the logs, it indicates that the system has started to function normally, and you can connect to the FE through a MySQL client for access.

## Manage compute cluster

### Add/drop FE/BE node

These steps are similar to those in creating a compute cluster. Specify the new nodes in Meta Service, and then start the corresponding nodes (ensure correct configuration of the new nodes). There is no need to use the `alter system add/drop` statements for additional operations.

In the compute-storage decoupled mode, you can increase/decrease multiple nodes at a time. However, it is recommended to add or drop the nodes one by one.

**Example**

Add two BE nodes to compute cluster `cluster_name0`.

```Plain
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

Remove two BE nodes from compute cluster `cluster_name0`.

```Plain
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

Add an FE Follower. In the following example, `node_type = FE_OBSERVER`.

**Currently, Doris does not support adding FE Follower in the compute-storage decoupled mode.**

```Plain
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
                "node_type":"FE_OBSERVER"
            }
        ]
    }
}'
```

Remove an FE node.

```Plain
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

### Add/drop compute cluster

To add a new compute cluster, you can refer to the “Create compute cluster” section on this page.

To drop a compute cluster, you can call the Meta Service API and shut down the corresponding nodes.

**Example**

Drop the compute cluster `cluster_name0`. (All parameters below are required.)

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

