---
{
    "title": "collations",
    "language": "en",
    "description": "View all collation methods for character sets. This table is only used for compatibility with MySQL behavior and holds no practical significance."
}
---

## Overview

View all collation methods for character sets. This table is only used for compatibility with MySQL behavior and holds no practical significance. It does not truly reflect the character collation methods used by Doris.

## Database


`information_schema`


## Table Information

| Column Name        | Type         | Description                                              |
| ------------------ | ------------ | -------------------------------------------------------- |
| COLLATION_NAME     | varchar(512) | The name of the character set collation method           |
| CHARACTER_SET_NAME | varchar(64)  | The name of the associated character set                 |
| ID                 | bigint       | The ID of the collation method                           |
| IS_DEFAULT         | varchar(64)  | Indicates if it is the current default collation method. |
| IS_COMPILED        | varchar(64)  | Indicates if it is compiled into the service             |
| SORTLEN            | bigint       | Related to the memory used by this collation algorithm   |