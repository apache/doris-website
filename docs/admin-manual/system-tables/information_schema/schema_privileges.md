---
{
    "title": "schema_privileges",
    "language": "en",
    "description": "View the authorization information of the database."
}
---

## Overview

View the authorization information of the database.

## Database


`information_schema`


## Table Information

| Column Name    | Type         | Description                                         |
| -------------- | ------------ | --------------------------------------------------- |
| GRANTEE        | varchar(81)  | The authorized user                                 |
| TABLE_CATALOG  | varchar(512) | The Catalog name, always 'def'                      |
| TABLE_SCHEMA   | varchar(64)  | The Database name                                   |
| PRIVILEGE_TYPE | varchar(64)  | The type of privilege                               |
| IS_GRANTABLE   | varchar(3)   | Whether authorization can be granted to other users |