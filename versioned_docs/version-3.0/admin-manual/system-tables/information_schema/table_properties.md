---
{
    "title": "table_properties",
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

Used to view attribute information of tables (including internal and external tables).

## Database


`information_schema`


## Table Information

| Column Name    | Type        | Description                             |
| -------------- | ----------- | --------------------------------------- |
| TABLE_CATALOG  | varchar(64) | The Catalog to which the table belongs  |
| TABLE_SCHEMA   | varchar(64) | The Database to which the table belongs |
| TABLE_NAME     | varchar(64) | The name of the table                   |
| PROPERTY_NAME  | string      | The name of the property                |
| PROPERTY_VALUE | string      | The value of the property               |