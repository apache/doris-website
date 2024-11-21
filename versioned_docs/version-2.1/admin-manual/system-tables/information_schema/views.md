---
{
    "title": "views",
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

Stores all view information.

## Database


`information_schema`


## Table Information

| Column Name          | Type          | Description                                       |
| -------------------- | ------------- | ------------------------------------------------- |
| TABLE_CATALOG        | varchar(512)  | Catalog name                                      |
| TABLE_SCHEMA         | varchar(64)   | Database name                                     |
| TABLE_NAME           | varchar(64)   | View name                                         |
| VIEW_DEFINITION      | varchar(8096) | View definition statement                         |
| CHECK_OPTION         | varchar(8)    | No practical effect, only for MySQL compatibility |
| IS_UPDATABLE         | varchar(3)    | No practical effect, only for MySQL compatibility |
| DEFINER              | varchar(77)   | No practical effect, only for MySQL compatibility |
| SECURITY_TYPE        | varchar(7)    | No practical effect, only for MySQL compatibility |
| CHARACTER_SET_CLIENT | varchar(32)   | No practical effect, only for MySQL compatibility |
| COLLATION_CONNECTION | varchar(32)   | No practical effect, only for MySQL compatibility |