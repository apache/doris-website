---
{
    "title": "backend_configuration",
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

View the configurations on Backends.

## Database


`information_schema`


## Table Information

| Column Name  | Type         | Description           |
| ------------ | ------------ | --------------------- |
| BE_ID        | bigint       | The ID of the Backend |
| CONFIG_NAME  | varchar(256) | The config name       |
| CONFIG_TYPE  | varchar(256) | The config data type  |
| CONFIG_VALUE | bigint       | The config value      |
| IS_MUTABLE   | bool         | The config is mutable |
