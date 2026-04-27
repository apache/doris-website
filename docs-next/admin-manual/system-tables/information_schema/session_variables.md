---
{
    "title": "session_variables",
    "language": "en",
    "description": "View session variable information."
}
---

## Overview

View session variable information.

## Database


`information_schema`


## Table Information

| Column Name    | Type          | Description                                              |
| -------------- | ------------- | -------------------------------------------------------- |
| VARIABLE_NAME  | varchar(64)   | The name of the variable                                 |
| VARIABLE_VALUE | varchar(1024) | The current value                                        |
| DEFAULT_VALUE  | varchar(1024) | The default value                                        |
| CHANGED        | varchar(4)    | Whether the current value differs from the default value |