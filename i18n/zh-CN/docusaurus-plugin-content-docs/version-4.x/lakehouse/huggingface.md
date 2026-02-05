---
{
    "title": "分析 Hugging Face 数据",
    "language": "zh-CN",
    "description": "Hugging Face 是一个广受欢迎的中心化平台，用户可以在上面存储、分享并协作构建机器学习模型、数据集以及其他资源。"
}
---

[Hugging Face](https://huggingface.co/) 是一个广受欢迎的中心化平台，用户可以在上面存储、分享并协作构建机器学习模型、数据集以及其他资源。

[Hugging Face Dataset](https://huggingface.co/datasets) 根据存储库的类型，可能包含 CSV、Parquet、JSONL 等数据文件。

通过 [HTTP Table Value Function](../sql-manual/sql-functions/table-valued-functions/http.md) 功能，Doris 可以直接通过 SQL 访问 Hugging Face 数据集上的数据。

:::note
该功能自 4.0.2 版本支持
:::

## 使用说明

Doris 通过 HTTP 协议访问 Hugging Face Dataset 中的数据。

支持自动类型推断。支持 `CREATE TABLE AS SELECT` 以及 `INSERT INTO ... SELECT` 等方式处理数据。

支持 CSV、Json、Parquet、ORC 等文件类型，相关参数和 File Table Valued Fuction 相同。

## 基础示例

1. 访问 `fka/awesome-chatgpt-prompts` 仓库下的 csv 数据

    ```sql
    SELECT COUNT(*) FROM
    HTTP(
        "uri" = "hf://datasets/fka/awesome-chatgpt-prompts/blob/main/prompts.csv",
        "format" = "csv"
    );
    ```

    对应数据文件：https://huggingface.co/datasets/fka/awesome-chatgpt-prompts/blob/main/prompts.csv

2. 创建表，访问 `stanfordnlp/imdb` 仓库下的 json 数据，并指定 `script` 分支。然后将数据导入到表中。

    ```sql
    CREATE TABLE hf_table AS
    SELECT * FROM
    HTTP(
        "uri" = "hf://datasets/stanfordnlp/imdb@script/dataset_infos.json",
        "format" = "json"
    );
    ```

    对应数据文件：https://huggingface.co/datasets/stanfordnlp/imdb/blob/script/dataset_infos.json

3. 访问 `stanfordnlp/imdb` 仓库下的 parquet 文件，并指定 `main` 分支。同时，通过通配符匹配多路径。

    ```sql
    SELECT * FROM
    HTTP(
        "uri" = "hf://datasets/stanfordnlp/imdb@main/*/*.parquet",
        "format" = "parquet"
    ) ORDER BY text LIMIT 1;
    ```

    对应数据文件：https://huggingface.co/datasets/stanfordnlp/imdb/blob/main/plain_text/test-00000-of-00001.parquet

4. 访问 `stanfordnlp/imdb` 仓库下的 parquet 文件，并指定 `main` 分支。同时，通过通配符匹配多层递归文件。然后插入到指定表

    ```sql
    INSERT INTO hf_tbale
    SELECT * FROM
    HTTP(
        "uri" = "hf://datasets/stanfordnlp/imdb@main/**/test-00000-of-0000[1].parquet",
        "format" = "parquet"
    ) ORDER BY text LIMIT 1;
    ```

    对应数据文件：https://huggingface.co/datasets/stanfordnlp/imdb/blob/main/plain_text/test-00000-of-00001.parquet

5. 分析需授权访问的文件

    从 Hugging Face 账号中获取 Token（`hf_` 开头），然后添加到 `http.header.Authorization` 属性中。

    ```sql
    SELECT * FROM
    HTTP(
        "uri" = "hf://datasets/gaia-benchmark/GAIA/blob/main/2023/validation/metadata.level1.parquet",
        "format" = "parquet",
        "http.header.Authorization" = "Bearer hf_MWYzOJJoZEymb..."
    ) LIMIT 1\G
    ```
