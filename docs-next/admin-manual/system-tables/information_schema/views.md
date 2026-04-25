---
{
    "title": "views",
    "language": "en",
    "description": "Stores all view information."
}
---

## Overview

Stores all view information.

## Database


`information_schema`


## Table Information

| Column Name          | Type          | Description                                       |
| -------------------- | ------------- | ------------------------------------------------- |
| TABLE_CATALOG        | varchar(512)  | Catalog name                                      |
| TABLE_SCHEMA         | varchar(64)   | Database name                                     |
| TABLE_NAME           | varchar(64)   | View name                                         |
| VIEW_DEFINITION      | varchar(8096) | View definition statement                         |
| CHECK_OPTION         | varchar(8)    | No practical effect, only for MySQL compatibility |
| IS_UPDATABLE         | varchar(3)    | No practical effect, only for MySQL compatibility |
| DEFINER              | varchar(77)   | No practical effect, only for MySQL compatibility |
| SECURITY_TYPE        | varchar(7)    | No practical effect, only for MySQL compatibility |
| CHARACTER_SET_CLIENT | varchar(32)   | No practical effect, only for MySQL compatibility |
| COLLATION_CONNECTION | varchar(32)   | No practical effect, only for MySQL compatibility |