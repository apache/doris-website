---
{
    "title": "Lance | File Formats",
    "language": "zh-CN",
    "description": "本文档介绍 Apache Doris 对 Lance 文件格式的读取支持。",
    "sidebar_label": "Lance"
}
---

# Lance

:::note
Lance 支持自 Apache Doris 4.2 版本开始提供。
:::

[Lance](https://docs.lancedb.com/lance) 是面向分析和 AI 场景的列式数据格式。Doris 可以通过 Lance Catalog，或通过 `s3()` 和 `local()` 表值函数（TVF）读取 Lance 数据集。

## 支持的功能

| 功能 | 支持情况 |
|---|---|
| Lance Catalog | 支持 Filesystem Catalog 和 REST Catalog |
| 文件 TVF | 支持 `s3()` 和 `local()` |
| Schema 推断和列裁剪 | 支持 |
| 并行扫描 Fragment | Catalog 查询和 S3 TVF 支持 |
| 谓词下推 | 支持兼容的标量谓词 |
| 向量检索 | 支持通过 `vector_search()` 使用 Lance 向量索引或执行 Flat Search |
| 写入 Lance | 暂不支持 |
| Time Travel | 暂不支持 |
| Full-Text Search / Hybrid Search | 暂不支持 |

Catalog 配置、类型映射、谓词下推和向量检索的详细说明请参见 [Lance Catalog](../catalogs/lance-catalog.mdx)。

## 通过文件 TVF 查询 Lance 数据集

`uri` 或 `file_path` 必须直接指向**单个 Lance 数据集的根目录**，不能指向 `data/*.lance` 等内部数据文件。

下面的示例从 S3 兼容对象存储读取 Lance 数据集：

```sql
SELECT user_id, name
FROM s3(
    "uri" = "s3://my-bucket/lance/user_profiles.lance",
    "s3.endpoint" = "http://127.0.0.1:9000",
    "s3.access_key" = "admin",
    "s3.secret_key" = "password",
    "s3.region" = "us-east-1",
    "use_path_style" = "true",
    "format" = "lance"
)
WHERE user_id > 100;
```

读取本地数据集时，使用 `local()`，通过 `file_path` 指定数据集根目录，并通过 `backend_id` 指定目标 BE。Doris 会将 `file_path` 直接传给 Lance Reader，不会自动拼接 `user_files_secure_path`，也不会对路径执行 Glob 展开；建议使用绝对路径。

## 使用限制

- Lance 当前仅支持读取，不支持创建、写入、更新或删除 Lance 表。
- Lance 格式仅支持 `s3()` 和 `local()`，暂不支持 HDFS、HTTP 等其他文件 TVF。
- 一个 TVF 路径只能表示一个 Lance 数据集，且不支持 `path_partition_keys`。
- 查询读取数据集的当前版本，不支持通过 SQL 指定 Version 或执行 Time Travel。
- Local TVF 的 Schema 发现和执行会分别打开数据集的最新版本，应避免在查询分析和执行期间修改数据集。

## 参考资料

- [Lance Catalog](../catalogs/lance-catalog.mdx)
- [Lance 格式官方文档](https://docs.lancedb.com/lance)
