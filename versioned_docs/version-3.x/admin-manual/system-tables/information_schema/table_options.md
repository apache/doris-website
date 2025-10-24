---
{
    "title": "table_options",
    "language": "en"
}
---

## Overview

This table is solely used for compatibility with MySQL behavior. It is always empty.

## Database


`information_schema`


## Table Information

| Column Name     | Type        | Description |
| --------------- | ----------- | ----------- |
| TABLE_CATALOG   | varchar(64) |             |
| TABLE_SCHEMA    | varchar(64) |             |
| TABLE_NAME      | varchar(64) |             |
| TABLE_MODEL     | text        |             |
| TABLE_MODEL_KEY | text        |             |
| DISTRIBUTE_KEY  | text        |             |
| DISTRIBUTE_TYPE | text        |             |
| BUCKETS_NUM     | int         |             |
| PARTITION_NUM   | int         |             |