---
{
    "title": "table_properties",
    "language": "en",
    "description": "Used to view attribute information of tables (including internal and external tables)."
}
---

## Overview

Used to view attribute information of tables (including internal and external tables).

## Database


`information_schema`


## Table Information

| Column Name    | Type        | Description                             |
| -------------- | ----------- | --------------------------------------- |
| TABLE_CATALOG  | varchar(64) | The Catalog to which the table belongs  |
| TABLE_SCHEMA   | varchar(64) | The Database to which the table belongs |
| TABLE_NAME     | varchar(64) | The name of the table                   |
| PROPERTY_NAME  | string      | The name of the property                |
| PROPERTY_VALUE | string      | The value of the property               |