---
{
    "title": "阿里云 DLF",
    "language": "zh-CN"
}
---

阿里云 Data Lake Formation(DLF) 是阿里云上的统一元数据管理服务。兼容 Hive Metastore 协议。

> [什么是 Data Lake Formation](https://www.aliyun.com/product/bigdata/dlf)

因此我们也可以和访问 Hive Metastore 一样，连接并访问 DLF。

## 连接 DLF

### 创建 DLF Catalog

```sql
CREATE CATALOG dlf PROPERTIES (
   "type"="hms",
   "hive.metastore.type" = "dlf",
   "dlf.proxy.mode" = "DLF_ONLY",
   "dlf.endpoint" = "datalake-vpc.cn-beijing.aliyuncs.com",
   "dlf.region" = "cn-beijing",
   "dlf.uid" = "uid",
   "dlf.catalog.id" = "catalog_id", //可选
   "dlf.access_key" = "ak",
   "dlf.secret_key" = "sk"
);
```

其中 `type` 固定为 `hms`。如果需要公网访问阿里云对象存储的数据，可以设置 `"dlf.access.public"="true"`

* `dlf.endpoint`：DLF Endpoint，参阅：[DLF Region 和 Endpoint 对照表](https://www.alibabacloud.com/help/zh/data-lake-formation/latest/regions-and-endpoints)
* `dlf.region`：DLF Region，参阅：[DLF Region 和 Endpoint 对照表](https://www.alibabacloud.com/help/zh/data-lake-formation/latest/regions-and-endpoints)
* `dlf.uid`：阿里云账号。即阿里云控制台右上角个人信息的“云账号 ID”。
* `dlf.catalog.id`(可选)：Catalog Id。用于指定数据目录，如果不填，使用默认的 Catalog ID。
* `dlf.access_key`：AccessKey。可以在 [阿里云控制台](https://ram.console.aliyun.com/manage/ak) 中创建和管理。
* `dlf.secret_key`：SecretKey。可以在 [阿里云控制台](https://ram.console.aliyun.com/manage/ak) 中创建和管理。

其他配置项为固定值，无需改动。

之后，可以像正常的 Hive MetaStore 一样，访问 DLF 下的元数据。

同 Hive Catalog 一样，支持访问 DLF 中的 Hive/Iceberg/Hudi 的元数据信息。

### 使用开启了 HDFS 服务的 OSS 存储数据

1. 确认 OSS 开启了 HDFS 服务。[开通并授权访问 OSS-HDFS 服务](https://help.aliyun.com/document_detail/419505.html?spm=a2c4g.2357115.0.i0)。
2. 下载 SDK。[JindoData SDK 下载](https://github.com/aliyun/alibabacloud-jindodata/blob/master/docs/user/6.x/6.7.8/jindodata_download.md)。如果集群上已有 SDK 目录，忽略这一步。
3. 解压下载后的 jindosdk.tar.gz 或者在集群上找到 Jindo SDK 的目录，将其 lib 目录下的`jindo-core.jar、jindo-sdk.jar`放到`${DORIS_HOME}/fe/lib`和`${DORIS_HOME}/be/lib/java_extensions/preload-extensions`目录下。
4. 创建 DLF Catalog，并配置`oss.hdfs.enabled`为`true`：

    ```sql
    CREATE CATALOG dlf_oss_hdfs PROPERTIES (
       "type"="hms",
       "hive.metastore.type" = "dlf",
       "dlf.proxy.mode" = "DLF_ONLY",
       "dlf.endpoint" = "datalake-vpc.cn-beijing.aliyuncs.com",
       "dlf.region" = "cn-beijing",
       "dlf.uid" = "uid",
       "dlf.catalog.id" = "catalog_id", //可选
       "dlf.access_key" = "ak",
       "dlf.secret_key" = "sk",
       "oss.hdfs.enabled" = "true"
    );
    ```

5. 当 Jindo SDK 版本与 EMR 集群上所用的版本不一致时，会出现`Plugin not found`的问题，需更换到对应版本。

### 访问 DLF Iceberg 表

```sql
CREATE CATALOG dlf_iceberg PROPERTIES (
   "type"="iceberg",
   "iceberg.catalog.type" = "dlf",
   "dlf.proxy.mode" = "DLF_ONLY",
   "dlf.endpoint" = "datalake-vpc.cn-beijing.aliyuncs.com",
   "dlf.region" = "cn-beijing",
   "dlf.uid" = "uid",
   "dlf.catalog.id" = "catalog_id", //可选
   "dlf.access_key" = "ak",
   "dlf.secret_key" = "sk"
);
```

## 列类型映射

和 Hive Catalog 一致，可参阅 [Hive Catalog](./hive.md) 中 **列类型映射** 一节。
