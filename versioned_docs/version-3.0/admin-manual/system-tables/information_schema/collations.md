---
{
    "title": "collations",
    "language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->
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