---
{
    "title": "backend_configuration",
    "language": "en"
}
---

## Overview

View the configurations on Backends.

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
