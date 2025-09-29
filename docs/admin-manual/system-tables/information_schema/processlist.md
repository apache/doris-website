---
{
    "title": "processlist",
    "language": "en"
}
---

## Overview

View All Current Connections

## Database


`information_schema`


## Table Information

| Column Name       | Type           | Description                          |
| ----------------- | -------------- | ------------------------------------ |
| CURRENT_CONNECTED | varchar(16)    | Deprecated, always No                |
| ID                | largeint       | Connection ID                        |
| USER              | varchar(32)    | Connected user                       |
| HOST              | varchar(261)   | Connection address                   |
| LOGIN_TIME        | datetime       | Login time                           |
| CATALOG           | varchar(64)    | Current Catalog                      |
| DB                | varchar(64)    | Current Database                     |
| COMMAND           | varchar(16)    | Type of MySQL Command currently sent |
| TIME              | int            | Execution time of the last query     |
| STATE             | varchar(64)    | Status of the last query             |
| QUERY_ID          | varchar(256)   | ID of the last query                 |
| INFO              | varchar(65533) | Query statement of the last query    |
| FE                | varchar(64)    | Connected Front-End (FE)             |
| COMPUTE_GROUP     | varchar(64)    | Name of the Cloud Cluster being used |
