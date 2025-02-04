---
{
    "title": "schemata",
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

View information related to the database.

## Database


`information_schema`


## Table Information

| Column Name                | Type         | Description                                           |
| -------------------------- | ------------ | ----------------------------------------------------- |
| CATALOG_NAME               | varchar(512) | The name of the Catalog                               |
| SCHEMA_NAME                | varchar(32)  | The name of the Database                              |
| DEFAULT_CHARACTER_SET_NAME | varchar(32)  | For compatibility with MySQL only, no actual function |
| DEFAULT_COLLATION_NAME     | varchar(32)  | For compatibility with MySQL only, no actual function |
| SQL_PATH                   | varchar(512) | For compatibility with MySQL only, no actual function |
| DEFAULT_ENCRYPTION         | varchar(3)   | For compatibility with MySQL only, no actual function |