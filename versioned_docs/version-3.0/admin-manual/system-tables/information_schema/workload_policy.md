---
{
    "title": "workload_policy",
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

Records the configuration information of Workload Policies.

## Database


`information_schema`


## Table Information

| Column Name    | Type         | Description                                    |
| -------------- | ------------ | ---------------------------------------------- |
| ID             | bigint       | ID of the Workload Policy                      |
| NAME           | varchar(256) | Name of the Workload Policy                    |
| CONDITION      | text         | Condition of the Workload Policy               |
| ACTION         | text         | Action of the Workload Policy                  |
| PRIORITY       | int          | Priority of the Workload Policy                |
| ENABLED        | boolean      | Whether the Workload Policy is enabled         |
| VERSION        | int          | Version of the Workload Policy                 |
| WORKLOAD_GROUP | text         | Name of the Workload Group bound to the Policy |