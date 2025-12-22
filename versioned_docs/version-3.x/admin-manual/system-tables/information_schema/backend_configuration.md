---
{
    "title": "backend_configuration",
    "language": "en",
    "description": "View the configurations on Backends.(added by doris 3.0.7)"
}
---

## Overview

View the configurations on Backends.(added by doris 3.0.7)

## Database


`information_schema`


## Table Information

| Column Name  | Type         | Description           |
| ------------ | ------------ | --------------------- |
| BE_ID        | bigint       | The ID of the Backend |
| CONFIG_NAME  | varchar(256) | The config name       |
| CONFIG_TYPE  | varchar(256) | The config data type  |
| CONFIG_VALUE | bigint       | The config value      |
| IS_MUTABLE   | bool         | The config is mutable |
