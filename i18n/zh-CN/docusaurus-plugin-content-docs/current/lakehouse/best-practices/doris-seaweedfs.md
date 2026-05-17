---
{
    "title": "集成 SeaweedFS",
    "language": "zh-CN",
    "description": "使用 SeaweedFS 同时承载 Iceberg 表的对象存储和 REST Catalog，凭证、部署、运维三位一体。"
}
---

[SeaweedFS](https://seaweedfs.com/) 是一个分布式存储系统，单个 `weed` 进程即可同时提供 S3 兼容的对象存储接口和 Apache Iceberg REST Catalog。Parquet 数据和 Iceberg 元数据由同一个执行文件对外服务，并使用同一对 S3 凭证完成鉴权。

本文介绍将 SeaweedFS 作为 Doris 的 Iceberg Lakehouse 后端的最小配置。完整的端到端路径已经在 SeaweedFS 仓库的 [`TestDorisIcebergCatalog`](https://github.com/seaweedfs/seaweedfs/tree/master/test/s3tables/catalog_doris) 集成测试中验证：测试会启动 SeaweedFS mini 集群，在 Doris 中注册 Iceberg Catalog，通过 PyIceberg 写入数据，再由 `apache/doris:doris-all-in-one-2.1.0` 容器读回。

## 为什么用 SeaweedFS 搭 Iceberg Lakehouse

当下的 Lakehouse 架构通常需要把三层系统拼起来：

* 对象存储（S3 或兼容实现）
* 独立的 Iceberg Catalog（Hive Metastore、Glue、Polaris、Lakekeeper、Nessie 等）
* 查询引擎（Doris、Spark、Trino 等）

SeaweedFS 把前两层合并到了同一个进程里。同一个 `weed` 执行文件既是：

* 存放 parquet 文件的 S3 兼容对象存储，
* 也是存放表元数据的 Iceberg REST Catalog。

也就是说，Doris 只需要对接一个系统，而不是两个。具体好处：

* **更少的组件。** 不再需要 Hive Metastore、Glue，不需要为 Catalog 单独部署 Postgres，也不需要单独维护 STS 角色。
* **更简单的部署。** 一个执行文件、一份 IAM 配置；Doris 的 Iceberg REST 客户端和 S3 读写器共用同一对 S3 凭证。
* **适合本地与私有化场景。** 整个链路不依赖任何云服务，从笔记本、单台 VM 到 Kubernetes 集群，部署方式一致。
* **元数据路径更低延时。** Catalog 状态保存在同一个 SeaweedFS filer 中，与数据为邻；命名空间和表元数据查询不再跨独立服务。
* **磁盘上是标准 S3。** 表以标准 Iceberg 目录结构存放在 S3 桶中，任何 S3 客户端（rclone、`aws s3`、Spark、Trino、Dremio、RisingWave）都可以与 Doris 一同读取或复制。

架构上：

```text
Doris
  |
  v
Iceberg 表
  |
  v
SeaweedFS  (S3 存储 + REST Catalog)
```

对于小团队和内部数据平台来说，这是一种不依赖独立 Catalog 服务、就能搭起 Lakehouse 的干净方式。

## 1. 启动 SeaweedFS

在 [github.com/seaweedfs/seaweedfs](https://github.com/seaweedfs/seaweedfs) 编译或安装 `weed`。

准备一份 IAM 配置，给一个访问密钥授予 S3 权限。同一个密钥也作为 Iceberg REST 端点的 OAuth2 客户端：

```json
{
  "identities": [
    {
      "name": "doris",
      "credentials": [
        {
          "accessKey": "AKIAIOSFODNN7EXAMPLE",
          "secretKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        }
      ],
      "actions": ["Admin"]
    }
  ]
}
```

启动单进程集群，并在启动时创建用于 Iceberg 的 Table Bucket：

```bash
weed mini \
  -ip $(hostname -I | awk '{print $1}') \
  -dir /var/lib/seaweedfs \
  -s3.config /etc/seaweedfs/iam_config.json \
  -tableBucket iceberg-tables
```

`weed mini` 会在一个进程内同时启动 master、volume、filer、S3 和 Iceberg REST Catalog。默认端口：

| 组件 | 端口 | 修改参数 |
| ---- | ---- | -------- |
| Master HTTP | 9333 | `-master.port` |
| Filer HTTP | 8888 | `-filer.port` |
| S3 | 8333 | `-s3.port` |
| Iceberg REST | 8181 | `-s3.port.iceberg` |

`-tableBucket iceberg-tables` 会在启动时创建一个 S3 Tables 类型的 Bucket，也就是 Doris 后续写入 Iceberg 表所用的 Bucket。

验证 Catalog 端点可用：

```bash
curl -s http://SEAWEED_HOST:8181/v1/config | jq .
```

## 2. 在 Doris 中注册 Iceberg Catalog

```sql
CREATE CATALOG seaweedfs PROPERTIES (
    "type" = "iceberg",
    "iceberg.catalog.type" = "rest",
    "uri" = "http://SEAWEED_HOST:8181",
    "warehouse" = "s3://iceberg-tables",
    "credential" = "AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "s3.endpoint" = "http://SEAWEED_HOST:8333",
    "s3.access_key" = "AKIAIOSFODNN7EXAMPLE",
    "s3.secret_key" = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "s3.region" = "us-west-2",
    "use_path_style" = "true"
);
```

说明：

* `credential = "<access_key>:<secret_key>"` 会被 Doris 的 Iceberg REST 客户端作为 OAuth2 client credentials 发起鉴权。SeaweedFS 用同一份 IAM 配置校验。
* `s3.*` 系列属性给 Doris 本地的 parquet 读写器使用，指向同一个 `weed` 进程，主机和密钥都和上面一致。
* `use_path_style = "true"` 是必需的，SeaweedFS 默认采用 path-style 的 S3 协议。
* 集成测试使用的就是上述属性，可参考 [`createDorisIcebergCatalog`](https://github.com/seaweedfs/seaweedfs/blob/master/test/s3tables/catalog_doris/doris_catalog_test.go)。

如果在注册 Catalog 前已经通过其他客户端（例如 PyIceberg）创建了 Namespace 或表，需要刷新元数据缓存：

```sql
REFRESH CATALOG seaweedfs;
```

## 3. 使用 Catalog

```sql
USE seaweedfs;

CREATE DATABASE IF NOT EXISTS demo;

USE seaweedfs.demo;

CREATE TABLE iceberg_smoke (
  id BIGINT,
  label STRING
);

INSERT INTO iceberg_smoke VALUES (1, 'one'), (2, 'two'), (3, 'three');

SELECT id, label FROM iceberg_smoke ORDER BY id;
```

预期结果：

```text
+----+-------+
| id | label |
+----+-------+
|  1 | one   |
|  2 | two   |
|  3 | three |
+----+-------+
```

这正是 SeaweedFS 集成测试覆盖的路径：通过 Iceberg REST Catalog 创建 Namespace 和表，由 PyIceberg 追加数据，再由 Doris 通过 S3 加 Iceberg 元数据走标准链路读回。

## 生产部署建议

* 生产环境可以把 `weed mini` 拆成 `weed master`、`weed volume`、`weed filer`，再加 `weed s3 -iceberg.port=8181`，也可以使用 SeaweedFS Helm Chart。Doris 这边的配置完全不用改，只需替换主机和端口。
* OAuth2 credential 就是 S3 访问密钥，需要轮换 Doris 的 Catalog 凭证时，按普通 S3 用户的方式轮换 IAM 身份即可。
* Iceberg 表的运维任务（Compaction、Snapshot Expiration、Orphan Removal、Manifest Rewriting）由 SeaweedFS 内置实现，针对同一个 Bucket 运行，详见 [SeaweedFS Iceberg Catalog Wiki](https://github.com/seaweedfs/seaweedfs/wiki/SeaweedFS-Iceberg-Catalog)。

## 相关链接

* [SeaweedFS](https://github.com/seaweedfs/seaweedfs)
* [SeaweedFS 中的 Doris Iceberg 集成测试](https://github.com/seaweedfs/seaweedfs/tree/master/test/s3tables/catalog_doris)
* [Doris Iceberg Catalog 文档](https://doris.apache.org/zh-CN/docs/lakehouse/catalogs/iceberg-catalog)
