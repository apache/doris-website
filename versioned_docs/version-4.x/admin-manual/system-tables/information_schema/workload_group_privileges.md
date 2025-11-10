---
{
    "title": "workload_group_privileges",
    "language": "en"
}
---

## Overview

Stores permission information for Workload Groups.

## Database


`information_schema`


## Table Information

| Column Name         | Type         | Description                              |
| ------------------- | ------------ | ---------------------------------------- |
| GRANTEE             | varchar(64)  | The user granted permissions             |
| WORKLOAD_GROUP_NAME | varchar(256) | The name of the Workload Group           |
| PRIVILEGE_TYPE      | varchar(64)  | The type of privilege                    |
| IS_GRANTABLE        | varchar(3)   | Whether it can be granted to other users |