---
{
    "title": "Aliyun OSS",
    "language": "zh-CN",
    "description": "本文档介绍访问阿里云 OSS 所需的参数，这些参数适用于以下场景："
}
---

本文档介绍访问阿里云 OSS 所需的参数，这些参数适用于以下场景：

- Catalog 属性
- Table Valued Function 属性
- Broker Load 属性
- Export 属性
- Outfile 属性

## OSS

Doris 使用 S3 Client，通过 S3 兼容协议访问阿里云 OSS。

### 参数总览

| 属性名称                       | 曾用名                       | 描述                                                         | 默认值 |
| ------------------------------ | ---------------------------- | ------------------------------------------------------------ | ------ |
| oss.endpoint                   | s3.endpoint                  | OSS endpoint，指定阿里云 OSS 的访问端点。注意，OSS 和 OSS HDFS 的 endpoint 不相同。 | 无     |
| oss.access_key                 | s3.access_key                | OSS Access Key，用于身份验证                                 | 无     |
| oss.secret_key                 | s3.secret_key                | OSS Secret Key，与 Access Key 配合使用                       | 无     |
| oss.region                     | s3.region                    | OSS region，指定阿里云 OSS 的区域                             | 无     |
| oss.use_path_style             | s3.use_path_style            | 是否使用 path-style（路径风格）访问。兼容 MinIO 等非 AWS S3 服务建议设置为 true | FALSE  |
| oss.connection.maximum         | s3.connection.maximum        | 最大连接数，指定与 OSS 服务建立的最大连接数                  | 50     |
| oss.connection.request.timeout | s3.connection.request.timeout| 请求超时时间（毫秒），指定连接 OSS 服务时的请求超时时间       | 3000   |
| oss.connection.timeout         | s3.connection.timeout        | 连接超时时间（毫秒），指定与 OSS 服务建立连接时的超时时间     | 1000   |

> 3.1 版本之前，请使用曾用名。

### 示例配置

```properties
"oss.access_key" = "your-access-key",
"oss.secret_key" = "your-secret-key",
"oss.endpoint" = "oss-cn-beijing.aliyuncs.com",
"oss.region" = "cn-beijing"
```

3.1 之前的版：

```
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
"s3.region" = "cn-beijing"
```

### 使用建议

* 推荐使用 `oss.` 前缀配置参数，保证与阿里云 OSS 的一致性和清晰度。
* 3.1 之前的版本，请使用曾用名 `s3.` 作为前缀。
* 配置 `oss.region` 能提升访问的准确性和性能，建议设置。
* 连接池参数可根据并发需求调整，避免连接阻塞。

## OSS-HDFS

OSS-HDFS 服务（JindoFS 服务）是一个阿里云云原生数据湖存储功能。基于统一的元数据管理能力，兼容 HDFS 文件系统接口，满足大数据和 AI 等领域的数据湖计算场景。

访问 OSS-HDFS 上存储的数据，和直接访问 OSS 服务稍有区别，详见本文档。 

### 参数总览

| 属性名称                             | 曾用名           | 描述                                                         | 默认值 |是否必须 | 
|----------------------------------|---------------| ------------------------------------------------------------ | ------ | --- |
| oss.hdfs.endpoint                | oss.endpoint  | 阿里云 OSS-HDFS 服务的 Endpoint，例如 `cn-hangzhou.oss-dls.aliyuncs.com`。  | 无     | 是 |
| oss.hdfs.access_key              | oss.access_key | OSS Access Key，用于身份验证                                 | 无     | 是 |
| oss.hdfs.secret_key              | oss.secret_key | OSS Secret Key，与 Access Key 配合使用                       | 无     | 是 |
| oss.hdfs.region                  | oss.region     | OSS bucket 所在的地域 ID，例如 `cn-beijing`。                            | 无     | 是 |
| oss.hdfs.fs.defaultFS            |               | 3.1 版本支持。指定 OSS 的文件系统访问路径，例如 `oss://my-bucket/`。 | 无  | 否 |
| oss.hdfs.hadoop.config.resources |               | 3.1 版本支持。指定包含 OSS 文件系统配置的路径，需使用相对路径，默认目录为（FE/BE）部署目录下的 /plugins/hadoop_conf/（可修改 fe.conf/be.conf 中的 hadoop_config_dir 来更改默认路径）。所有 FE 和 BE 节点需配置相同相对路径。示例：`hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`。                 | 无    | 否 |
| fs.oss-hdfs.support              |oss.hdfs.enabled | 3.1 版本支持。显示声明启用 OSS-HDFS 功能。需要设置为 true | 无  | 否 |

> 3.1 版本之前，请使用曾用名。

### Endpoint 配置

`oss.hdfs.endpoint`: 用于指定 OSS-HDFS 服务的 Endpoint。

Endpoint 是访问阿里云 OSS 的入口地址，格式为 `<region>.oss-dls.aliyuncs.com`，例如 `cn-hangzhou.oss-dls.aliyuncs.com`。

我们会对格式进行强校验，确保 Endpoint 符合阿里云 OSS Endpoint 格式。

为保证向后兼容，Endpoint 配置项允许包含 https:// 或 http:// 前缀，系统在格式校验时会自动解析并忽略协议部分。

如使用曾用名，则系统会根据 `endpoint` 中是否包含 `oss-dls` 判断是否是 OSS-HDFS 服务。

### 配置文件

> 3.1 版本支持

OSS-HDFS 支持通过 `oss.hdfs.hadoop.config.resources` 参数来指定 HDFS 相关配置文件目录。

配置文件目录需包含 `hdfs-site.xml` 和 `core-site.xml` 文件，默认目录为（FE/BE）部署目录下的 `/plugins/hadoop_conf/`。所有 FE
和 BE 节点需配置相同的相对路径。

如果配置文件包含文档上述参数，则优先使用用户显示配置的参数。配置文件可以指定多个文件，多个文件以逗号分隔。如 `hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`。

### 示例配置

```properties
"fs.oss-hdfs.support" = "true",
"oss.hdfs.access_key" = "your-access-key",
"oss.hdfs.secret_key" = "your-secret-key",
"oss.hdfs.endpoint" = "cn-hangzhou.oss-dls.aliyuncs.com",
"oss.hdfs.region" = "cn-hangzhou"
```

3.1 之前的版本：

```
"oss.hdfs.enabled" = "true",
"oss.access_key" = "your-access-key",
"oss.secret_key" = "your-secret-key",
"oss.endpoint" = "cn-hangzhou.oss-dls.aliyuncs.com",
"oss.region" = "cn-hangzhou"
```