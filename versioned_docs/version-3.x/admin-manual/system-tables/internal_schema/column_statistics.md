---
{
    "title": "column_statistics | Internal Schema",
    "language": "en",
    "description": "Column statistics",
    "sidebar_label": "column_statistics"
}
---

# column_statistics

## Overview

Column statistics

## Database


`__internal_schema`


## Table Information

| Column Name        | Type           | Description                                      |
| ------------------ | -------------- | ------------------------------------------------ |
| id                 | varchar(4096)  | Unique ID                                        |
| catalog_id         | varchar(64)    | ID of the Catalog                                |
| db_id              | varchar(64)    | ID of the Database                               |
| tbl_id             | varchar(64)    | ID of the Table                                  |
| idx_id             | varchar(64)    | ID of the Index                                  |
| col_id             | varchar(64)    | ID of the column, currently storing column names |
| part_id            | varchar(64)    | ID of the Partition, always empty                |
| count              | bigint         | Number of rows                                   |
| ndv                | bigint         | Number of distinct values                        |
| null_count         | bigint         | Number of NULLs                                  |
| min                | varchar(65533) | Minimum value                                    |
| max                | varchar(65533) | Maximum value                                    |
| data_size_in_bytes | bigint         | Data size in bytes                               |
| update_time        | datetime       | Update time of current statistics                |
