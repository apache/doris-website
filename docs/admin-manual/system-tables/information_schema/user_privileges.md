---
{
    "title": "user_privileges",
    "language": "en"
}
---

## Overview

View user authorization information.

## Database


`information_schema`


## Table Information

| Column Name    | Type         | Description                                    |
| -------------- | ------------ | ---------------------------------------------- |
| GRANTEE        | varchar(81)  | The user who is granted the privilege          |
| TABLE_CATALOG  | varchar(512) | Always 'def'                                   |
| PRIVILEGE_TYPE | varchar(64)  | Type of privilege                              |
| IS_GRANTABLE   | varchar(3)   | Whether the privilege can be granted to others |