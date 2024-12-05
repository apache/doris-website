---
{
"title": "ALTER WORKLOAD POLICY",
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

Modify the properties of a Workload Group. Currently, only property modifications are supported; modifications to actions and conditions are not supported.


## Syntax

```sql
ALTER WORKLOAD POLICY <workload_policy_name> PROPERTIES( <properties> )
```

## Required Parameters

`<workload_policy_name>` 

Workload Policy's Name


`<properties>`

1. enabled: Can be true or false, with a default value of true, indicating that the current policy is enabled. false indicates that the current policy is disabled.
2. priority: A positive integer ranging from 0 to 100, with a default value of 0. This represents the priority of the policy. The higher the value, the higher the priority. The main role of this property is to select the policy with the highest priority when multiple policies match.
3. workload_group: Currently, a policy can be bound to one workload group, which means that this policy is only effective for a specific workload group. The default is empty, which means it is effective for all queries.

## Access Control Requirements

You must have at least ADMIN_PRIV permissions.

## Examples

1. Disable a Workload Policy

```Java
alter workload policy cancel_big_query properties('enabled'='false')
```