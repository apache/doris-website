---
{
    "title": "CREATE REPOSITORY",
    "language": "zh-CN",
    "description": "该语句用于创建仓库。仓库用于属于备份或恢复。"
}
---

## 描述

该语句用于创建仓库。仓库用于属于备份或恢复。

## 语法

```sql
CREATE [READ ONLY] REPOSITORY <repo_name>
    WITH [ S3 | HDFS ]
    ON LOCATION <repo_location>
    PROPERTIES (
              -- S3 or HDFS storage property
              <storage_property>
              [ , ... ]
    )
```

## 必选参数
**<repo_name>** 
> 仓库的唯一名称

**<repo_location>**
> 仓库的存储路径

**<storage_property>**
> 仓库的属性。此处需要根据选择的是 S3 存储还是 HDFS 存储介质来选择对应的参数

**<storage_property>** 可选参数如下，并可根据实际环境情况添加

| 参数                      | 说明                                 |
|-------------------------|------------------------------------|
| **s3.endpoint**         | S3 服务端点                            |
| **s3.access_key**       | S3 访问密钥                            |
| **s3.secret_key**       | S3 秘密密钥                            |
| **s3.region**           | S3 区域                              |
| **use_path_style**      | 是否使用路径样式访问 S3（适用于 MinIO）           |
| **fs.defaultFS**        | Hadoop 默认文件系统 URI                  |
| **hadoop.username**     | Hadoop 用户名                         |

**Note:&#x20;**

Doris支持使用`AWS Assume Role`的方式创建位于AWS S3上的Repository，请参考[AWS集成](../../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication).


## 权限控制
| 权限	          | 对象       | 说明                            |
|:-------------|:---------|:------------------------------|
| ADMIN_PRIV   | 整个集群管理权限 | 仅 root 或 superuser 用户可以创建仓库   |


## 注意事项
- 如果是只读仓库，则只能在仓库上进行恢复。如果不是，则可以进行备份和恢复操作。
- 根据 S3、HDFS 的不同类型，PROPERTIES 有所不同，具体见示例。
- ON LOCATION ,如果是 S3 , 这里后面跟的是 S3 的 Bucket Name。
- 在做数据迁移操作时，需要在源集群和目的集群创建完全相同的仓库，以便目的集群可以通过这个仓库，查看到源集群备份的数据快照。
- 任何用户都可以通过 [SHOW REPOSITORIES](./SHOW-REPOSITORIES) 命令查看已经创建的仓库。


## 示例

1. 创建名为 bos_repo 的仓库，依赖 BOS broker "bos_broker"，数据根目录为：bos://palo_backup

创建名为 s3_repo 的仓库

```sql
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://s3-repo"
PROPERTIES
(
    "s3.endpoint" = "http://s3-REGION.amazonaws.com",
    "s3.access_key" = "AWS_ACCESS_KEY",
    "s3.secret_key"="AWS_SECRET_KEY",
    "s3.region" = "REGION"
);
```

**Note:&#x20;**

Doris支持使用`AWS Assume Role`的方式创建位于AWS S3上的Repository，请参考[AWS集成](../../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication).

创建名为 hdfs_repo 的仓库

```sql
CREATE REPOSITORY `hdfs_repo`
WITH hdfs
ON LOCATION "hdfs://hadoop-name-node:54310/path/to/repo/"
PROPERTIES
(
    "fs.defaultFS"="hdfs://hadoop-name-node:54310",
    "hadoop.username"="user"
);
```

创建名为 minio_repo 的仓库。

```sql
CREATE REPOSITORY `minio_repo`
WITH S3
ON LOCATION "s3://minio_repo"
PROPERTIES
(
    "s3.endpoint" = "http://minio.com",
    "s3.access_key" = "MINIO_USER",
    "s3.secret_key"="MINIO_PASSWORD",
    "s3.region" = "REGION"
    "use_path_style" = "true"
);
```

使用临时秘钥创建名为 minio_repo 的仓库

```sql
CREATE REPOSITORY `minio_repo`
WITH S3
ON LOCATION "s3://minio_repo"
PROPERTIES
(
    "s3.endpoint" = "AWS_ENDPOINT",
    "s3.access_key" = "AWS_TEMP_ACCESS_KEY",
    "s3.secret_key" = "AWS_TEMP_SECRET_KEY",
    "s3.session_token" = "AWS_TEMP_TOKEN",
    "s3.region" = "AWS_REGION"
)
```

使用腾讯云 COS 创建仓库

```sql
CREATE REPOSITORY `cos_repo`
WITH S3
ON LOCATION "s3://backet1/"
PROPERTIES
(
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint" = "http://cos.ap-beijing.myqcloud.com",
    "s3.region" = "ap-beijing"
);
```
