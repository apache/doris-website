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

In the compute-storage decoupled mode, the registration and changes of nodes in a warehouse is managed by Meta Service. FE, BE, and Meta Service interact for service discovery and authentication.

Creating a Doris cluster in the compute-storage decoupled mode entails interaction with Meta Service. Meta Service provides standard HTTP APIs for resource management operations. For more information, refer to [Meta Service API](https://doris.apache.org/docs/dev/separation-of-storage-and-compute/meta-service-resource-http-api). 

The creation process is to describe the machine composition within that cluster, including the following two steps:

1. Register a warehouse (FE)
2. Register one or more compute clusters (BE)

:::info

- **`127.0.0.1:5000`** **in the examples of this page refers to the address of Meta Service. Please replace it with the actual IP address and bRPC listening port for your own use case.**
- Please modify the configuration items in the following examples as needed.

:::

## Cluster & storage vault

The first step is to register a warehouse in Meta Service. A single Meta Service can support multiple warehouses (i.e., multiple sets of FE-BE). Specifically, this process includes describing the required storage vault (i.e., the shared storage layer demonstrated in [Overview](overview.md)) for that warehouse. The options for the storage vault include HDFS and S3 (or object storage that supports the S3 protocol, such as AWS S3, GCS, Azure Blob, MinIO, Ceph, and Alibaba Cloud OSS). Storage vault is the remote shared storage used by Doris in the compute-storage decoupled mode. Users can configure multiple storage vaults for one warehouse, and store different tables on different storage vaults.

This step involves calling the `create_instance` API of Meta Service. The key parameters include:

- `instance_id`: The ID of the warehouse. It should be historically unique and is typically a UUID string, such as "6ADDF03D-4C71-4F43-9D84-5FC89B3514F8". For simplicity in this guide, a regular string is used.
- `name`: The name of the data warehouse, which should be filled in according to actual needs.
- `user_id`: The user ID, a string that should be filled in as required.
- `vault`: The storage vault information, such as HDFS properties and S3 Bucket details.

For more information, refer to [Meta Service API](meta-service-api.md).

### Create cluster using HDFS as storage vault

To create a Doris cluster in the compute-storage decoupled mode using HDFS as the storage vault, configure the following items accurately and ensure that all nodes (including FE/BE nodes, Meta Service, and Recycler) have the necessary permissions to access the specified HDFS. This includes completing the Kerberos authorization configuration and connectivity checks for the machines (which can be tested using the Hadoop Client on the respective nodes).

The `prefix` field should be set based on actual requirements. It is usually named after the business that the data warehouse serves.

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
        "type"="hdfs", -- required
        "fs.defaultFS"="hdfs://127.0.0.1:8020", -- required
        "path_prefix"="prefix", -- optional
        "hadoop.username"="user" -- optional
        "hadoop.security.authentication"="kerberos" -- optional
        "hadoop.kerberos.principal"="hadoop/127.0.0.1@XXX" -- optional
        "hadoop.kerberos.keytab"="/etc/emr.keytab" -- optional
    );
```

**Create S3 storage vault**

```SQL
CREATE STORAGE VAULT IF NOT EXISTS ssb_hdfs_vault
    PROPERTIES (
        "type"="S3", -- required
        "s3.endpoint" = "bj", -- required
        "s3.region" = "bj", -- required
        "s3.root.path" = "/path/to/root", -- required
        "s3.access_key" = "ak", -- required
        "s3.secret_key" = "sk", -- required
        "provider" = "cos", -- required
    );
```

:::info

Newly created storage vaults may NOT be immediately visible to the BE. This means if you try to import data into tables with a newly created storage vault, you might expect error reports in the short term (< 1 minute) until the storage vault is fully propagated to the BE nodes.

:::

**Parameter**

| Parameter                      | Description          | Example                         |
| ------------------------------ | -------------------- | ------------------------------- |
| type                           | S3 or HDFS           | s3 \| hdfs                      |
| fs.defaultFS                   | HDFS vault parameter | hdfs://127.0.0.1:8020           |
| hadoop.username                | HDFS vault parameter | hadoop                          |
| hadoop.security.authentication | HDFS vault parameter | kerberos                        |
| hadoop.kerberos.principal      | HDFS vault parameter | hadoop/127.0.0.1@XXX            |
| hadoop.kerberos.keytab         | HDFS vault parameter | /etc/emr.keytab                 |
| dfs.client.socket-timeout      | HDFS vault parameter | dfs.client.socket-timeout=60000 |

### View storage vault

**Syntax**

```Plain
SHOW STORAGE VAULT
```

The returned result contains 4 columns, which are the name of the storage vault, the ID of the storage vault, the properties of the storage vault, and whether it is the default storage vault.

**Example**

```SQL
mysql> show storage vault;
+------------------------+----------------+-------------------------------------------------------------------------------------------------+-----------+
| StorageVaultName       | StorageVaultId | Propeties                                                                                       | IsDefault |
+------------------------+----------------+-------------------------------------------------------------------------------------------------+-----------+
| built_in_storage_vault | 1              | build_conf { fs_name: "hdfs://127.0.0.1:8020" } prefix: "_1CF80628-16CF-0A46-54EE-2C4A54AB1519" | false     |
| hdfs_vault             | 2              | build_conf { fs_name: "hdfs://127.0.0.1:8020" } prefix: "_0717D76E-FF5E-27C8-D9E3-6162BC913D97" | false     |
+------------------------+----------------+-------------------------------------------------------------------------------------------------+-----------+
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

Comming soon

### Delete storage vault

Only non-default storage vaults that are not referenced by any tables can be deleted.

Comming soon

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

In the compute-storage decoupled mode, both FE and BE are managed in groups. Therefore, operations on FE/BE are performed through interfaces such as `add_cluster`.

Generally, only one FE is needed. If you need to add a new FE, you can follow these steps:

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

# Confirm successful creation using get_cluster
curl '127.0.0.1:5000/MetaService/http/get_cluster?token=greedisgood9999' -d '{
    "instance_id":"sample_instance_id",
    "cloud_unique_id":"1:sample_instance_id:cloud_unique_id_sql_server00",
    "cluster_name":"RESERVED_CLUSTER_NAME_FOR_SQL_SERVER",
    "cluster_id":"RESERVED_CLUSTER_ID_FOR_SQL_SERVER"
}'
cloud_unique_id` is a unique string in the format of `1:<instance_id>:<string>`. `ip` and `edit_log_port` should be consistent with those in `fe.conf`. Note that `cluster_name` and `cluster_id` of FE should always be `"cluster_name":"RESERVED_CLUSTER_NAME_FOR_SQL_SERVER"` and `"cluster_id":"RESERVED_CLUSTER_ID_FOR_SQL_SERVER"
```

## Create compute cluster

Users can create one or more compute clusters, and a compute cluster can consist of any number of BE nodes.

The composition of a compute cluster includes the following information:

- `cloud_unique_id`: a unique string in the format of `1:<instance_id>:<string>`. It should be configured based on your needs and consistent with the `cloud_unique_id` in `be.conf`.
- `cluster_name cluster_id`: This should be filled in based on your case.
- `ip`: This should be filled in based on your case.
- `heartbeat_port`: This is the heartbeat port of BE.

Users can adjust the number of compute clusters and the number of nodes within each cluster based on their needs. Each compute cluster should have a unique `cluster_name` and `cluster_id`.

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

## FE/BE configuration

The compute-storage decoupled mode requires additional configurations for the FE and BE:

- `meta_service_endpoint`: The address of Meta Service, which needs to be filled in both the FE and BE.
- `cloud_unique_id`: This should be filled with the corresponding value from the request sent to Meta Service when creating the cluster. Doris determines whether it is operating in the compute-storage decoupled mode based on this configuration.

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

In the compute-storage decoupled mode of Doris, the startup and shutdown processes for the FE/BE is the same as those in the compute-storage coupled mode.

```Shell
bin/start_be.sh --daemon
bin/stop_be.sh


bin/start_fe.sh --daemon
bin/stop_fe.sh
```

In the compute-storage decoupled mode, the FE will automatically discover the corresponding BE nodes, and there is no need for manual operation such as `alter system add` and `drop backend`.

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

Add an FE Follower.

`node_type = FE_MASTER` indicates that the node can be elected as the Master. If you need to add an FE Observer, you can set `node_type = OBSERVER`.

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
                "node_type":"FE_MASTER"
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

