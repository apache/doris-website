---
{
  "title": "Aliyun OSS",
  "language": "en"
}
---

This document describes the parameters required to access Alibaba Cloud OSS, which are applicable to the following scenarios:

- Catalog properties
- Table Valued Function properties
- Broker Load properties
- Export properties
- Outfile properties

## OSS

Doris uses S3 Client to access Alibaba Cloud OSS through S3-compatible protocol.

### Parameter Overview

| Property Name                  | Legacy Name                  | Description                                                  | Default Value |
| ------------------------------ | ---------------------------- | ------------------------------------------------------------ | ------------- |
| oss.endpoint                   | s3.endpoint                  | OSS endpoint, specifies the access endpoint for Alibaba Cloud OSS. Note that OSS and OSS HDFS have different endpoints. | None          |
| oss.access_key                 | s3.access_key                | OSS Access Key for authentication                            | None          |
| oss.secret_key                 | s3.secret_key                | OSS Secret Key, used together with Access Key               | None          |
| oss.region                     | s3.region                    | OSS region, specifies the region of Alibaba Cloud OSS       | None          |
| oss.use_path_style             | s3.use_path_style            | Whether to use path-style access. Recommended to set to true for compatibility with MinIO and other non-AWS S3 services | FALSE         |
| oss.connection.maximum         | s3.connection.maximum        | Maximum number of connections, specifies the maximum number of connections established with OSS service | 50            |
| oss.connection.request.timeout | s3.connection.request.timeout| Request timeout (milliseconds), specifies the request timeout when connecting to OSS service | 3000          |
| oss.connection.timeout         | s3.connection.timeout        | Connection timeout (milliseconds), specifies the timeout when establishing connection with OSS service | 1000          |

> Before version 3.1, use legacy name

## Example Configuration

```properties
"oss.access_key" = "your-access-key",
"oss.secret_key" = "your-secret-key",
"oss.endpoint" = "oss-cn-beijing.aliyuncs.com",
"oss.region" = "cn-beijing"
```

For versions before 3.1:

```
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
"s3.region" = "cn-beijing"
```

### Usage Recommendations

* It is recommended to use the `oss.` prefix for configuration parameters to ensure consistency and clarity with Alibaba Cloud OSS.
* For versions before 3.1, please use the legacy name `s3.` as the prefix.
* Configuring `oss.region` can improve access accuracy and performance, recommended to set.
* Connection pool parameters can be adjusted according to concurrency requirements to avoid connection blocking.

## OSS-HDFS

OSS-HDFS service (JindoFS service) is an Alibaba Cloud native data lake storage functionality. Based on unified metadata management capabilities, it is compatible with HDFS file system interfaces and meets data lake computing scenarios in big data and AI fields.

Accessing data stored on OSS-HDFS is slightly different from directly accessing OSS services. Please refer to this documentation for details.

### Parameter Overview

| Property Name                  | Legacy Name    | Description                                                 | Default Value | Required |
| ------------------------------ |----------------| ----------------------------------------------------------- | ------------- | -------- |
| oss.hdfs.endpoint              | oss.endpoint   | Alibaba Cloud OSS-HDFS service endpoint, e.g., `cn-hangzhou.oss-dls.aliyuncs.com`. | None          | Yes      |
| oss.hdfs.access_key            | oss.access_key | OSS Access Key for authentication                           | None          | Yes      |
| oss.hdfs.secret_key            | oss.secret_key | OSS Secret Key, used together with Access Key              | None          | Yes      |
| oss.hdfs.region                | oss.region     | Region ID where the OSS bucket is located, e.g., `cn-beijing`. | None          | Yes      |
| oss.hdfs.fs.defaultFS          |                | Supported in version 3.1. Specifies the file system access path for OSS, e.g., `oss://my-bucket/`. | None          | No       |
| oss.hdfs.hadoop.config.resources |                | Supported in version 3.1. Specifies the path containing OSS file system configuration. Requires relative path. Default directory is `/plugins/hadoop_conf/` under the (FE/BE) deployment directory (can be changed by modifying hadoop_config_dir in fe.conf/be.conf). All FE and BE nodes need to configure the same relative path. Example: `hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`. | None          | No       |
| fs.oss-hdfs.support              |oss.hdfs.enabled  | Supported in version 3.1. Explicitly declares the enabling of OSS-HDFS functionality. Needs to be set to true | None          | No       |

> For versions before 3.1, please use legacy names.

### Endpoint Configuration

`oss.hdfs.endpoint`: Used to specify the OSS-HDFS service endpoint.

Endpoint is the entry address for accessing Alibaba Cloud OSS, formatted as `<region>.oss-dls.aliyuncs.com`, e.g., `cn-hangzhou.oss-dls.aliyuncs.com`.

We perform strict format validation to ensure the endpoint conforms to the Alibaba Cloud OSS endpoint format.

For backward compatibility, the endpoint configuration allows the inclusion of https:// or http:// prefixes. The system will automatically parse and ignore the protocol part during format validation.

When using legacy names, the system determines whether it's an OSS-HDFS service based on whether the `endpoint` contains `oss-dls`.

### Configuration Files

> Supported in version 3.1

OSS-HDFS supports specifying HDFS-related configuration file directories through the `oss.hdfs.hadoop.config.resources` parameter.

The configuration file directory must contain `hdfs-site.xml` and `core-site.xml` files. The default directory is `/plugins/hadoop_conf/` under the (FE/BE) deployment directory. All FE and BE nodes need to configure the same relative path.

If the configuration files contain the parameters mentioned above in this document, the explicitly configured parameters by the user take precedence. Configuration files can specify multiple files, separated by commas, such as `hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`.

### Example Configuration

```properties
"fs.oss-hdfs.support" = "true",
"oss.hdfs.access_key" = "your-access-key",
"oss.hdfs.secret_key" = "your-secret-key",
"oss.hdfs.endpoint" = "cn-hangzhou.oss-dls.aliyuncs.com",
"oss.hdfs.region" = "cn-hangzhou"
```

For versions before 3.1:

```
"oss.hdfs.enabled" = "true",
"oss.access_key" = "your-access-key",
"oss.secret_key" = "your-secret-key",
"oss.endpoint" = "cn-hangzhou.oss-dls.aliyuncs.com",
"oss.region" = "cn-hangzhou"
```
