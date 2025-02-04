---
{
    "title": "workload_group_resource_usage",
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

Stores usage information for Workload Group resources.

## Database


`information_schema`


## Table Information

| Column Name                  | Type   | Description                               |
| ---------------------------- | ------ | ----------------------------------------- |
| BE_ID                        | bigint | The ID of the Backend                     |
| WORKLOAD_GROUP_ID            | bigint | The ID of the Workload Group              |
| MEMORY_USAGE_BYTES           | bigint | Memory usage in bytes                     |
| CPU_USAGE_PERCENT            | double | CPU usage percentage                      |
| LOCAL_SCAN_BYTES_PER_SECOND  | bigint | Local scan data rate in bytes per second  |
| REMOTE_SCAN_BYTES_PER_SECOND | bigint | Remote scan data rate in bytes per second |