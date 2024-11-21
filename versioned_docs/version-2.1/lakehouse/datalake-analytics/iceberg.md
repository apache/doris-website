---
{
    "title": "Iceberg Catalog",
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

[Apache Doris & Iceberg Quick Start](https://doris.apache.org/docs/gettingStarted/tutorials/doris-iceberg)

## Limitations

1. Supports Iceberg V1/V2.
2. Supports Position Delete
3. Supports Equality Delete since 2.1.3
4. Supports Parquet format.
5. Supports ORC format since 2.1.3.

## Create Catalog

### Create Catalog Based on Hive Metastore

It is basically the same as Hive Catalog, and only a simple example is given here. See [Hive Catalog](./hive.md) for other examples.

```sql
CREATE CATALOG iceberg PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.21.0.1:7004',
    'hadoop.username' = 'hive',
    'dfs.nameservices'='your-nameservice',
    'dfs.ha.namenodes.your-nameservice'='nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1'='172.21.0.2:4007',
    'dfs.namenode.rpc-address.your-nameservice.nn2'='172.21.0.3:4007',
    'dfs.client.failover.proxy.provider.your-nameservice'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```

### Create Catalog based on Iceberg API

Use the Iceberg API to access metadata, and support services such as Hadoop File System, Hive, REST, DLF and Glue as Iceberg's Catalog.

#### Hadoop Catalog

> Note: The path of `warehouse` should point to the parent path of `Database` level.
>
> Eg: If you path is like `s3://bucket/path/to/db1/table1`, the `warehouse` should be `s3://bucket/path/to/`

```sql
CREATE CATALOG iceberg_hadoop PROPERTIES (
    'type'='iceberg',
    'iceberg.catalog.type' = 'hadoop',
    'warehouse' = 'hdfs://your-host:8020/dir/key'
);
```

```sql
CREATE CATALOG iceberg_hadoop_ha PROPERTIES (
    'type'='iceberg',
    'iceberg.catalog.type' = 'hadoop',
    'warehouse' = 'hdfs://your-nameservice/dir/key',
    'dfs.nameservices'='your-nameservice',
    'dfs.ha.namenodes.your-nameservice'='nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1'='172.21.0.2:4007',
    'dfs.namenode.rpc-address.your-nameservice.nn2'='172.21.0.3:4007',
    'dfs.client.failover.proxy.provider.your-nameservice'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```

```sql
CREATE CATALOG iceberg_s3 PROPERTIES (
    'type'='iceberg',
    'iceberg.catalog.type' = 'hadoop',
    'warehouse' = 's3://bucket/dir/key',
    's3.endpoint' = 's3.us-east-1.amazonaws.com',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
);
```

#### Hive Metastore

```sql
CREATE CATALOG iceberg PROPERTIES (
    'type'='iceberg',
    'iceberg.catalog.type'='hms',
    'hive.metastore.uris' = 'thrift://172.21.0.1:7004',
    'hadoop.username' = 'hive',
    'dfs.nameservices'='your-nameservice',
    'dfs.ha.namenodes.your-nameservice'='nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1'='172.21.0.2:4007',
    'dfs.namenode.rpc-address.your-nameservice.nn2'='172.21.0.3:4007',
    'dfs.client.failover.proxy.provider.your-nameservice'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```

#### AWS Glue

> When connecting Glue, if it's not on the EC2 environment, need copy the `~/.aws` from the EC2 environment to the current environment. And can also download and configure the [AWS Cli tools](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), which also creates the `.aws` directory under the current user directory.
> Please upgrade to Doris 2.1.7, 3.0.3 or later version to connect to Glue.

```sql
-- Using access key and secret key
CREATE CATALOG glue2 PROPERTIES (
    "type"="iceberg",
    "iceberg.catalog.type" = "glue",
    "glue.endpoint" = "https://glue.us-east-1.amazonaws.com/",
    "client.credentials-provider" = "com.amazonaws.glue.catalog.credentials.ConfigAWSProvider",
    "client.credentials-provider.glue.access_key" = "ak",
    "client.credentials-provider.glue.secret_key" = "sk"
);
```

1. For Iceberg properties, see [Iceberg Glue Catalog](https://iceberg.apache.org/docs/latest/aws/#glue-catalog).

2. If you do not specify `client.credentials-provider`, the default DefaultAWSCredentialsProviderChain will be used, and it will read credentials and the system environment variables or instance profile properties on AWS EC2.

#### Alibaba Cloud DLF

see [Alibaba Cloud DLF Catalog](dlf.md)

#### REST Catalog

This method needs to provide REST services in advance, and users need to implement the REST interface for obtaining Iceberg metadata.

```sql
CREATE CATALOG iceberg PROPERTIES (
    'type'='iceberg',
    'iceberg.catalog.type'='rest',
    'uri' = 'http://172.21.0.1:8181'
);
```

If the data is on HDFS and High Availability (HA) is set up, need to add HA configuration to the Catalog.

```sql
CREATE CATALOG iceberg PROPERTIES (
    'type'='iceberg',
    'iceberg.catalog.type'='rest',
    'uri' = 'http://172.21.0.1:8181',
    'dfs.nameservices'='your-nameservice',
    'dfs.ha.namenodes.your-nameservice'='nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1'='172.21.0.1:8020',
    'dfs.namenode.rpc-address.your-nameservice.nn2'='172.21.0.2:8020',
    'dfs.client.failover.proxy.provider.your-nameservice'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```

#### Google Dataproc Metastore

```sql
CREATE CATALOG iceberg PROPERTIES (
    "type"="iceberg",
    "iceberg.catalog.type"="hms",
    "hive.metastore.uris" = "thrift://172.21.0.1:9083",
    "gs.endpoint" = "https://storage.googleapis.com",
    "gs.region" = "us-east-1",
    "gs.access_key" = "ak",
    "gs.secret_key" = "sk",
    "use_path_style" = "true"
);
```

`hive.metastore.uris`: Dataproc Metastore URI，See in Metastore Services ：[Dataproc Metastore Services](https://console.cloud.google.com/dataproc/metastore).

### Iceberg On Object Storage

If the data is stored on S3, the following parameters can be used in properties:

```
"s3.access_key" = "ak"
"s3.secret_key" = "sk"
"s3.endpoint" = "s3.us-east-1.amazonaws.com"
"s3.region" = "us-east-1"
```

The data is stored on Alibaba Cloud OSS:

```
"oss.access_key" = "ak"
"oss.secret_key" = "sk"
"oss.endpoint" = "oss-cn-beijing-internal.aliyuncs.com"
"oss.region" = "oss-cn-beijing"
```

The data is stored on Tencent Cloud COS:

```
"cos.access_key" = "ak"
"cos.secret_key" = "sk"
"cos.endpoint" = "cos.ap-beijing.myqcloud.com"
"cos.region" = "ap-beijing"
```

The data is stored on Huawei Cloud OBS:

```
"obs.access_key" = "ak"
"obs.secret_key" = "sk"
"obs.endpoint" = "obs.cn-north-4.myhuaweicloud.com"
"obs.region" = "cn-north-4"
```

## Example

```
-- MinIO & Rest Catalog
CREATE CATALOG `iceberg` PROPERTIES (
    "type" = "iceberg",
    "iceberg.catalog.type" = "rest",
    "uri" = "http://10.0.0.1:8181",
    "warehouse" = "s3://bucket",
    "token" = "token123456",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint" = "http://10.0.0.1:9000",
    "s3.region" = "us-east-1"
);
```

## Column type mapping

| Iceberg Type                               | Doris Type   |
|--------------------------------------------|--------------|
| boolean                                    | boolean      |
| int                                        | int          |
| long                                       | bigint       |
| float                                      | float        |
| double                                     | double       |
| decimal(p,s)                               | decimal(p,s) |
| date                                       | date         |
| uuid                                       | string       |
| timestamp (Timestamp without timezone)     | datetime(6)  |
| timestamptz (Timestamp with timezone)      | datetime(6)  |
| string                                     | string       |
| fixed(L)                                   | char(L)      |
| binary                                     | string       |
| struct                                     | struct (since 2.1.3)       |
| map                                        | map (since 2.1.3)         |
| list                                       | array        |
| time                                       | unsupported  |

## Time Travel

Supports reading the snapshot specified by the Iceberg table.

Every write operation to the iceberg table will generate a new snapshot.

By default, read requests will only read the latest version of the snapshot.

You can use the `FOR TIME AS OF` and `FOR VERSION AS OF` statements to read historical versions of data based on the snapshot ID or the time when the snapshot was generated. Examples are as follows:

`SELECT * FROM iceberg_tbl FOR TIME AS OF "2022-10-07 17:20:37";`

`SELECT * FROM iceberg_tbl FOR VERSION AS OF 868895038966572;`

In addition, you can use the [iceberg_meta](../../sql-manual/sql-functions/table-valued-functions/iceberg-meta.md) table function to query the snapshot information of the specified table.
