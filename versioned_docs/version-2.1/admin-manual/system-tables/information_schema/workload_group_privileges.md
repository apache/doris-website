---
{
    "title": "workload_group_privileges",
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

Stores permission information for Workload Groups.

## Database


`information_schema`


## Table Information

| Column Name         | Type         | Description                              |
| ------------------- | ------------ | ---------------------------------------- |
| GRANTEE             | varchar(64)  | The user granted permissions             |
| WORKLOAD_GROUP_NAME | varchar(256) | The name of the Workload Group           |
| PRIVILEGE_TYPE      | varchar(64)  | The type of privilege                    |
| IS_GRANTABLE        | varchar(3)   | Whether it can be granted to other users |