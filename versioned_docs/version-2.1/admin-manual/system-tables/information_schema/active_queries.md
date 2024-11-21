---
{
    "title": "active_queries",
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

Used to view currently executing queries

## Database


`information_schema`


## Table Information

| Column Name       | Type         | Description                                                  |
| ----------------- | ------------ | ------------------------------------------------------------ |
| QUERY_ID          | varchar(256) | The ID of the query                                          |
| QUERY_START_TIME  | varchar(256) | The start time of the query                                  |
| QUERY_TIME_MS     | bigint       | The execution time of the query                              |
| WORKLOAD_GROUP_ID | bigint       | The ID of the Workload Group to which the query belongs      |
| DATABASE          | varchar(256) | The Database where the query was executed                    |
| FRONTEND_INSTANCE | varchar(256) | The IP address of the Frontend instance that received the query request |
| QUEUE_START_TIME  | varchar(256) | The start time of queuing; empty if not queued               |
| QUEUE_END_TIME    | varchar(256) | The end time of queuing; empty if not queued                 |
| QUERY_STATUS      | varchar(256) | The status of the query                                      |
| SQL               | text         | The text of the query statement                              |