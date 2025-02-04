---
{
    "title": "session_variables",
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