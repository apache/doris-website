---
{
    "title": "分析 Hugging Face 数据",
    "language": "zh-CN",
    "description": "了解如何使用 Apache Doris 通过 SQL 直接查询和分析 Hugging Face 数据集，支持 CSV、Parquet、JSON 等格式，无需下载即可快速导入机器学习数据。"
}
---

[Hugging Face](https://huggingface.co/) 是一个广受欢迎的中心化平台，用户可以在上面存储、分享并协作构建机器学习模型、数据集以及其他资源。[Hugging Face Dataset](https://huggingface.co/datasets) 根据存储库的类型，可能包含 CSV、Parquet、JSONL 等数据文件。

Doris 通过 [HTTP Table Value Function](../sql-manual/sql-functions/table-valued-functions/http.md) 功能，可以直接使用 SQL 访问和分析 Hugging Face 数据集中的数据。

:::note
该功能自 4.0.2 版本开始支持。
:::

## 功能特性

| 特性 | 说明 |
|------|------|
| 访问协议 | 通过 HTTP 协议访问 Hugging Face Dataset |
| 类型推断 | 支持自动类型推断 |
| 支持的文件格式 | CSV、JSON、Parquet、ORC |
| 数据操作 | 支持 `CREATE TABLE AS SELECT` 和 `INSERT INTO ... SELECT` |

相关参数和 File Table Valued Function 相同。

## URI 语法

访问 Hugging Face 数据集的 URI 格式如下：

```
hf://datasets/<owner>/<repo>[@<branch>]/<path>
```

| 组成部分 | 说明 | 是否必填 |
|----------|------|----------|
| `owner` | 数据集所有者 | 是 |
| `repo` | 数据集仓库名 | 是 |
| `branch` | 分支名称，默认为 `main` | 否 |
| `path` | 文件路径，支持通配符 | 是 |

**通配符说明：**

| 通配符 | 说明 | 示例 |
|--------|------|------|
| `*` | 匹配单层目录中的任意字符 | `*/*.parquet` 匹配一级子目录下的所有 Parquet 文件 |
| `**` | 递归匹配多层目录 | `**/*.parquet` 匹配所有层级的 Parquet 文件 |
| `[...]` | 匹配字符集合中的任意一个字符 | `test-0000[0-9].parquet` 匹配 test-00000 到 test-00009 |

## 使用场景

### 场景一：快速查询数据

直接使用 SQL 查询 Hugging Face 上的公开数据集，无需下载文件。

**示例：** 查询 `fka/awesome-chatgpt-prompts` 仓库中的 CSV 数据：

```sql
SELECT COUNT(*) FROM
HTTP(
    "uri" = "hf://datasets/fka/awesome-chatgpt-prompts/blob/main/prompts.csv",
    "format" = "csv"
);
```

> 对应数据文件：https://huggingface.co/datasets/fka/awesome-chatgpt-prompts/blob/main/prompts.csv

**示例：** 查询 `stanfordnlp/imdb` 仓库中的 Parquet 文件，使用通配符匹配多个文件：

```sql
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/stanfordnlp/imdb@main/*/*.parquet",
    "format" = "parquet"
) ORDER BY text LIMIT 1;
```

> 对应数据文件：https://huggingface.co/datasets/stanfordnlp/imdb/blob/main/plain_text/test-00000-of-00001.parquet

### 场景二：导入数据到本地表

将 Hugging Face 数据集导入到 Doris 表中，便于后续分析。

**方式一：** 使用 `CREATE TABLE AS SELECT` 创建新表并导入数据：

```sql
CREATE TABLE hf_table AS
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/stanfordnlp/imdb@script/dataset_infos.json",
    "format" = "json"
);
```

> 对应数据文件：https://huggingface.co/datasets/stanfordnlp/imdb/blob/script/dataset_infos.json

**方式二：** 使用 `INSERT INTO ... SELECT` 将数据插入到已有表：

```sql
INSERT INTO hf_table
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/stanfordnlp/imdb@main/**/test-00000-of-0000[1].parquet",
    "format" = "parquet"
) ORDER BY text LIMIT 1;
```

> 对应数据文件：https://huggingface.co/datasets/stanfordnlp/imdb/blob/main/plain_text/test-00000-of-00001.parquet

### 场景三：访问私有数据集

对于需要授权访问的数据集，需要在请求中添加 Token 认证。

**操作步骤：**

1. 登录 Hugging Face 账号，获取 Access Token（以 `hf_` 开头）。
2. 在 SQL 中通过 `http.header.Authorization` 属性传递 Token。

**示例：**

```sql
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/gaia-benchmark/GAIA/blob/main/2023/validation/metadata.level1.parquet",
    "format" = "parquet",
    "http.header.Authorization" = "Bearer hf_MWYzOJJoZEymb..."
) LIMIT 1\G
```
