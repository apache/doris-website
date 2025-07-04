---
{
    "title": "Iceberg",
    "language": "zh-CN"
}
---

# Iceberg

## 使用限制

1. 支持 Iceberg V1/V2 表格式。
2. V2 格式仅支持 Position Delete 方式，不支持 Equality Delete。
3. 支持 Parquet 文件格式

<version since="dev">

3. 支持数据存在在 GooseFS(GFS) 上的 iceberg表。需配置环境：
    1. 把goosefs-x.x.x-client.jar 放在 fe/lib/ 和 apache_hdfs_broker/lib/ 下
    2. 创建 catalog 时增加属性：'fs.AbstractFileSystem.gfs.impl' = 'com.qcloud.cos.goosefs.hadoop.GooseFileSystem'， 'fs.gfs.impl' = 'com.qcloud.cos.goosefs.hadoop.FileSystem'

</version>

## 创建 Catalog

### 基于Hive Metastore创建Catalog

和 Hive Catalog 基本一致，这里仅给出简单示例。其他示例可参阅 [Hive Catalog](./hive.md)。

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

### 基于Iceberg API创建Catalog

<version since="dev">

使用Iceberg API访问元数据的方式，支持Hive、REST、Glue等服务作为Iceberg的Catalog。

</version>

#### Hive Metastore作为元数据服务

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

#### Glue Catalog作为元数据服务

```sql
CREATE CATALOG glue PROPERTIES (
"type"="iceberg",
"iceberg.catalog.type" = "glue",
"glue.endpoint" = "https://glue.us-east-1.amazonaws.com",
"warehouse" = "s3://bucket/warehouse",
"AWS_ENDPOINT" = "s3.us-east-1.amazonaws.com",
"AWS_REGION" = "us-east-1",
"AWS_ACCESS_KEY" = "ak",
"AWS_SECRET_KEY" = "sk",
"use_path_style" = "true"
);
```

`glue.endpoint`: Glue Endpoint. 参阅：[AWS Glue endpoints and quotas](https://docs.aws.amazon.com/general/latest/gr/glue.html).

`warehouse`: Glue Warehouse Location. Glue Catalog的根路径，用于指定数据存放位置。

属性详情参见 [Iceberg Glue Catalog](https://iceberg.apache.org/docs/latest/aws/#glue-catalog)

- REST Catalog作为元数据服务

该方式需要预先提供REST服务，用户需实现获取Iceberg元数据的REST接口。

```sql
CREATE CATALOG iceberg PROPERTIES (
    'type'='iceberg',
    'iceberg.catalog.type'='rest',
    'uri' = 'http://172.21.0.1:8181',
);
```

若数据存放在S3上，properties中可以使用以下参数

```
"AWS_ACCESS_KEY" = "ak"
"AWS_SECRET_KEY" = "sk"
"AWS_REGION" = "region-name"
"AWS_ENDPOINT" = "http://endpoint-uri"
"AWS_CREDENTIALS_PROVIDER" = "provider-class-name" // 可选，默认凭证类基于BasicAWSCredentials实现。
```

## 列类型映射

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
| list                                       | array        |
| struct                                     | 不支持        |
| map                                        | 不支持        |
| time                                       | 不支持        |

## Time Travel

<version since="1.2.2">

支持读取 Iceberg 表指定的 Snapshot。

</version>

每一次对iceberg表的写操作都会产生一个新的快照。

默认情况下，读取请求只会读取最新版本的快照。

可以使用 `FOR TIME AS OF` 和 `FOR VERSION AS OF` 语句，根据快照 ID 或者快照产生的时间读取历史版本的数据。示例如下：

`SELECT * FROM iceberg_tbl FOR TIME AS OF "2022-10-07 17:20:37";`

`SELECT * FROM iceberg_tbl FOR VERSION AS OF 868895038966572;`

另外，可以使用 [iceberg_meta](../../sql-manual/sql-functions/table-functions/iceberg-meta.md) 表函数查询指定表的 snapshot 信息。
