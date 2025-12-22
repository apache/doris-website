---
{
    "title": "table_privileges",
    "language": "zh-CN",
    "description": "View the authorization information of the table."
}
---

## Overview

View the authorization information of the table.

## Database


`information_schema`


## Table Information

| Column Name    | Type         | Description                                    |
| -------------- | ------------ | ---------------------------------------------- |
| GRANTEE        | varchar(81)  | The authorized user                            |
| TABLE_CATALOG  | varchar(512) | The name of the Catalog                        |
| TABLE_SCHEMA   | varchar(64)  | The name of the Database                       |
| TABLE_NAME     | varchar(64)  | The name of the Table                          |
| PRIVILEGE_TYPE | varchar(64)  | The type of privilege                          |
| IS_GRANTABLE   | varchar(3)   | Whether the privilege can be granted to others |