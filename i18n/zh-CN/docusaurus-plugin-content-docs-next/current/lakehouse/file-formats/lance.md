---
{
    "title": "Lance | File Formats",
    "language": "zh-CN",
    "description": "本文档用于介绍 Doris 的 Lance 文件格式的读取支持情况。",
    "sidebar_label": "Lance"
}
---

# Lance

:::tip
Lance 格式支持为 **实验性功能**，自 Apache Doris **5.0.0** 版本起提供。
:::

[Lance](https://lancedb.github.io/lance/) 是一种面向 AI/ML 场景设计的现代列式数据格式，原生支持向量检索、多模态数据（图像、Embedding）以及高效的随机访问。

Doris 通过 Table Valued Function（TVF）支持读取 Lance 格式文件。

## 支持的功能

| 功能 | 支持情况 |
|------|----------|
| 通过 Table Valued Function（`s3`、`local`）读取数据 | 支持 |
| 自动 Schema 推断 | 支持 |
| 列裁剪 | 支持 |
| `WHERE` 过滤、`LIMIT`、`COUNT(*)`、聚合 | 支持 |
| 多 Fragment 数据集 | 支持 |
| Catalog 读取 | 暂不支持 |
| 数据写入（Outfile / Export / INSERT INTO TVF） | 暂不支持 |
| 向量 ANN 检索 / 全文检索下推 | 暂不支持 |
| Doris Data Cache 集成 | 暂不支持 |

## 数据集结构

Lance 数据集是一个**目录**，典型结构如下：

```
my_dataset.lance/
├── _transactions/
├── _versions/
└── data/
    ├── fragment-0.lance
    ├── fragment-1.lance
    └── ...
```

通过 TVF 查询时，`uri` / `file_path` 应当匹配数据集目录下 `data/` 子目录中的一个或多个 `.lance` 数据文件。每个 Scan Range 会精确读取一个 Fragment，Doris 会自动从匹配到的路径中解析出数据集根目录。若要读取整个多 Fragment 数据集，请使用类似 `data/*.lance` 的通配符，使每个 Fragment 文件都被分配到独立的 Scan Range 上。由于真实 Lance 数据集的 Fragment 文件通常以 UUID 命名，使用通配符也是最自然的引用方式。

## 使用示例

### 从 S3 读取

```sql
SELECT * FROM s3(
    "uri" = "s3://bucket/path/to/my_dataset.lance/data/*.lance",
    "format" = "lance",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.region" = "us-east-1",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com"
) ORDER BY id LIMIT 10;
```

### 从本地磁盘读取

```sql
-- 可通过 SHOW BACKENDS; 获取 backend_id
SELECT * FROM local(
    "file_path" = "data/my_dataset.lance/data/*.lance",
    "backend_id" = "<backend_id>",
    "format" = "lance"
) ORDER BY id LIMIT 10;
```

### 多 Fragment 数据集上的聚合查询

```sql
SELECT count(*), min(id), max(id) FROM s3(
    "uri" = "s3://bucket/path/to/large.lance/data/*.lance",
    "format" = "lance",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.region" = "us-east-1",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com"
);
```

## 使用限制

- **仅支持 TVF 方式**：当前仅支持通过 `s3` 和 `local` TVF 读取，尚不支持 `CREATE CATALOG`。
- **不支持 Data Cache**：Lance 读取不会经过 Doris `BlockFileCache`，S3 数据不会缓存到本地磁盘。
- **不支持谓词 / 向量下推**：`WHERE` 过滤、向量检索、全文检索等条件不会下推到 Lance Reader。
- **只读**：暂不支持通过 `OUTFILE`、`EXPORT` 或 `INSERT INTO` TVF 写入 Lance 文件。

## 参考资料

- [Lance 格式官方文档](https://lancedb.github.io/lance/)
