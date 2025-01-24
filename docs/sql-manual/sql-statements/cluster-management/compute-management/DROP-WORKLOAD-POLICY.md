---
{
"title": "DROP WORKLOAD POLICY",
"language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements. See the NOTICE file
distributed with this work for additional information
regarding copyright ownership. The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the
specific language governing permissions and limitations
under the License.
-->



## Description

Delete a Workload Policy

## Syntax

```sql
DROP WORKLOAD POLICY [ IF EXISTS ] <workload_policy_name>
```
## Required Parameters

**<workload_policy_name>**

The name of the Workload Policy

## Access Control Requirements

Must have at least `ADMIN_PRIV` permissions

## Examples

1. Delete a Workload Policy named cancel_big_query

  ```sql
  drop workload policy if exists cancel_big_query
  ```