---
{
    "title": "column_privileges",
    "language": "en"
}
---

## Overview

This table is solely used for compatibility with MySQL behavior and is always empty. It does not truly reflect the column permission information of Doris.

## Database

```
information_schema
```

## Table Information

| Column Name    | Type         | Description |
| -------------- | ------------ | ----------- |
| GRANTEE        | varchar(128) |             |
| TABLE_CATALOG  | varchar(512) |             |
| TABLE_SCHEMA   | varchar(64)  |             |
| TABLE_NAME     | varchar(64)  |             |
| COLUMN_NAME    | varchar(64)  |             |
| PRIVILEGE_TYPE | varchar(64)  |             |
| IS_GRANTABLE   | varchar(3)   |             |