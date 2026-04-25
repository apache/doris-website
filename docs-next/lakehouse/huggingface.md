---
{
    "title": "Analyzing Hugging Face Data",
    "language": "en",
    "description": "Learn how to use Apache Doris to query and analyze Hugging Face datasets directly with SQL. Supports CSV, Parquet, JSON formats without downloading, enabling fast import of machine learning data."
}
---

[Hugging Face](https://huggingface.co/) is a popular centralized platform where users can store, share, and collaborate on building machine learning models, datasets, and other resources. [Hugging Face Dataset](https://huggingface.co/datasets) repositories may contain data files in various formats such as CSV, Parquet, and JSONL.

Doris can directly access and analyze data from Hugging Face datasets using SQL through the [HTTP Table Valued Function](../sql-manual/sql-functions/table-valued-functions/http.md).

:::note
This feature is supported starting from version 4.0.2.
:::

## Features

| Feature | Description |
|---------|-------------|
| Access Protocol | Access Hugging Face Dataset via HTTP protocol |
| Type Inference | Supports automatic type inference |
| Supported File Formats | CSV, JSON, Parquet, ORC |
| Data Operations | Supports `CREATE TABLE AS SELECT` and `INSERT INTO ... SELECT` |

The parameters are the same as File Table Valued Function.

## URI Syntax

The URI format for accessing Hugging Face datasets is as follows:

```
hf://datasets/<owner>/<repo>[@<branch>]/<path>
```

| Component | Description | Required |
|-----------|-------------|----------|
| `owner` | Dataset owner | Yes |
| `repo` | Dataset repository name | Yes |
| `branch` | Branch name, defaults to `main` | No |
| `path` | File path, supports wildcards | Yes |

**Wildcard Description:**

| Wildcard | Description | Example |
|----------|-------------|---------|
| `*` | Matches any characters in a single directory level | `*/*.parquet` matches all Parquet files in first-level subdirectories |
| `**` | Recursively matches multiple directory levels | `**/*.parquet` matches Parquet files at all levels |
| `[...]` | Matches any single character in the character set | `test-0000[0-9].parquet` matches test-00000 to test-00009 |

## Use Cases

### Case 1: Quick Data Query

Query public datasets on Hugging Face directly using SQL without downloading files.

**Example:** Query CSV data from the `fka/awesome-chatgpt-prompts` repository:

```sql
SELECT COUNT(*) FROM
HTTP(
    "uri" = "hf://datasets/fka/awesome-chatgpt-prompts/blob/main/prompts.csv",
    "format" = "csv"
);
```

> Corresponding data file: https://huggingface.co/datasets/fka/awesome-chatgpt-prompts/blob/main/prompts.csv

**Example:** Query Parquet files from the `stanfordnlp/imdb` repository using wildcards to match multiple files:

```sql
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/stanfordnlp/imdb@main/*/*.parquet",
    "format" = "parquet"
) ORDER BY text LIMIT 1;
```

> Corresponding data file: https://huggingface.co/datasets/stanfordnlp/imdb/blob/main/plain_text/test-00000-of-00001.parquet

### Case 2: Import Data to Local Tables

Import Hugging Face datasets into Doris tables for subsequent analysis.

**Method 1:** Use `CREATE TABLE AS SELECT` to create a new table and import data:

```sql
CREATE TABLE hf_table AS
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/stanfordnlp/imdb@script/dataset_infos.json",
    "format" = "json"
);
```

> Corresponding data file: https://huggingface.co/datasets/stanfordnlp/imdb/blob/script/dataset_infos.json

**Method 2:** Use `INSERT INTO ... SELECT` to insert data into an existing table:

```sql
INSERT INTO hf_table
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/stanfordnlp/imdb@main/**/test-00000-of-0000[1].parquet",
    "format" = "parquet"
) ORDER BY text LIMIT 1;
```

> Corresponding data file: https://huggingface.co/datasets/stanfordnlp/imdb/blob/main/plain_text/test-00000-of-00001.parquet

### Case 3: Access Private Datasets

For datasets that require authorization, you need to add Token authentication in the request.

**Steps:**

1. Log in to your Hugging Face account and obtain an Access Token (starts with `hf_`).
2. Pass the Token through the `http.header.Authorization` property in SQL.

**Example:**

```sql
SELECT * FROM
HTTP(
    "uri" = "hf://datasets/gaia-benchmark/GAIA/blob/main/2023/validation/metadata.level1.parquet",
    "format" = "parquet",
    "http.header.Authorization" = "Bearer hf_MWYzOJJoZEymb..."
) LIMIT 1\G
```
