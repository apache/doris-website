---
{
    "title": "partition_statistics",
    "language": "en",
    "description": "Partition statistics"
}
---

## Overview

Partition statistics

## Database


`__internal_schema`


## Table Information

| Column Name        | Type           | Description                                      |
| ------------------ | -------------- | ------------------------------------------------ |
| catalog_id         | varchar(64)    | ID of the Catalog                                |
| db_id              | varchar(64)    | ID of the Database                               |
| tbl_id             | varchar(64)    | ID of the Table                                  |
| idx_id             | varchar(64)    | ID of the Index                                  |
| part_name          | varchar(64)    | Name of the Partition                            |
| part_id            | bigint         | ID of the Partition                              |
| col_id             | varchar(64)    | ID of the column, currently storing column names |
| count              | bigint         | Number of rows                                   |
| ndv                | hll            | Number of distinct values                        |
| null_count         | bigint         | Number of NULLs                                  |
| min                | varchar(65533) | Minimum value                                    |
| max                | varchar(65533) | Maximum value                                    |
| data_size_in_bytes | bigint         | Data size in bytes                               |
| update_time        | datetime       | Last update time of current statistics           |