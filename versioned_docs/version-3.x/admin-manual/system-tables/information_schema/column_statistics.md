---
{
    "title": "column_statistics | Information Schema",
    "language": "en",
    "description": "This table is solely used for compatibility with MySQL behavior and is always empty."
}
---

## Overview

This table is solely used for compatibility with MySQL behavior and is always empty. It does not truly reflect the statistical information of the data within Doris. To view the statistical information collected by Doris, please refer to the [Statistics](../../../query-acceleration/optimization-technology-principle/statistics#viewing-statistics) section.

## Database


`information_schema`


## Table Information

| Column Name | Type        | Description |
| ----------- | ----------- | ----------- |
| SCHEMA_NAME | varchar(64) |             |
| TABLE_NAME  | varchar(64) |             |
| COLUMN_NAME | varchar(64) |             |
| HISTOGRAM   | json        |             |
