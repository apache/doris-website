---
{
    "title": "character_sets",
    "language": "en"
}
---

## Overview

View the supported character sets. This table is only used for compatibility with MySQL behavior and does not truly reflect the character sets used by Doris.

## Database


`information_schema`


## Table Information

| Column Name          | Type         | Description                                                  |
| -------------------- | ------------ | ------------------------------------------------------------ |
| CHARACTER_SET_NAME   | varchar(512) | The name of the character set                                |
| DEFAULT_COLLATE_NAME | varchar(64)  | The default collation name                                   |
| DESCRIPTION          | varchar(64)  | A detailed description of the character set                  |
| MAXLEN               | bigint       | The maximum number of bytes occupied by a single character in the character set |