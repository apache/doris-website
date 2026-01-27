---
{
    "title": "Analyzing Hugging Face Data",
    "language": "en",
    "description": "Hugging Face is a popular centralized platform where users can store, share, and collaborate on building machine learning models, datasets,"
}
---

[Hugging Face](https://huggingface.co/) is a popular centralized platform where users can store, share, and collaborate on building machine learning models, datasets, and other resources.

[Hugging Face Dataset](https://huggingface.co/datasets) may contain data files such as CSV, Parquet, JSONL, etc., depending on the repository type.

Through the [HTTP Table Value Function](../sql-manual/sql-functions/table-valued-functions/http.md) feature, Doris can directly access data on Hugging Face datasets via SQL.

:::note
This feature is supported since version 4.0.2
:::

## Usage Instructions

Doris accesses data in Hugging Face Dataset through HTTP protocol.

Supports automatic type inference. Supports `CREATE TABLE AS SELECT` and `INSERT INTO ... SELECT` methods for data processing.

Supports CSV, Json, Parquet, ORC and other file types, with parameters same as File Table Valued Function.

## Basic Examples

1. Access CSV data from the `fka/awesome-chatgpt-prompts` repository

    ```sql
    SELECT COUNT(*) FROM
    HTTP(
        "uri" = "hf://datasets/fka/awesome-chatgpt-prompts/blob/main/prompts.csv",
        "format" = "csv"
    );
    ```

    Corresponding data file: https://huggingface.co/datasets/fka/awesome-chatgpt-prompts/blob/main/prompts.csv

2. Create table, access JSON data from the `stanfordnlp/imdb` repository with the `script` branch specified. Then import data into the table.

    ```sql
    CREATE TABLE hf_table AS
    SELECT * FROM
    HTTP(
        "uri" = "hf://datasets/stanfordnlp/imdb@script/dataset_infos.json",
        "format" = "json"
    );
    ```

    Corresponding data file: https://huggingface.co/datasets/stanfordnlp/imdb/blob/script/dataset_infos.json

3. Access Parquet files from the `stanfordnlp/imdb` repository with the `main` branch specified. Also, use wildcards to match multiple paths.

    ```sql
    SELECT * FROM
    HTTP(
        "uri" = "hf://datasets/stanfordnlp/imdb@main/*/*.parquet",
        "format" = "parquet"
    ) ORDER BY text LIMIT 1;
    ```

    Corresponding data file: https://huggingface.co/datasets/stanfordnlp/imdb/blob/main/plain_text/test-00000-of-00001.parquet

4. Access Parquet files from the `stanfordnlp/imdb` repository with the `main` branch specified. Also, use wildcards to match multiple recursive files. Then insert into the specified table.

    ```sql
    INSERT INTO hf_table
    SELECT * FROM
    HTTP(
        "uri" = "hf://datasets/stanfordnlp/imdb@main/**/test-00000-of-0000[1].parquet",
        "format" = "parquet"
    ) ORDER BY text LIMIT 1;
    ```

    Corresponding data file: https://huggingface.co/datasets/stanfordnlp/imdb/blob/main/plain_text/test-00000-of-00001.parquet

5. Analyze files that require authorization

    Get a Token from your Hugging Face account (starting with `hf_`), then add it to the `http.header.Authorization` property.

    ```sql
    SELECT * FROM
    HTTP(
        "uri" = "hf://datasets/gaia-benchmark/GAIA/blob/main/2023/validation/metadata.level1.parquet",
        "format" = "parquet",
        "http.header.Authorization" = "Bearer hf_MWYzOJJoZEymb..."
    ) LIMIT 1\G
    ```
