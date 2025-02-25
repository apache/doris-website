---
{
"title": "ALTER STORAGE POLICY",
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



## Description

This statement is used to modify an existing hot-cold tiered migration policy. Only root or admin users can modify resources.

## Syntax
```sql
ALTER STORAGE POLICY  '<policy_name>' PROPERTIE ("<key>"="<value>"[, ... ]);
```

## Required Parameters


1.`<policy_name>`  
> The name of the storage policy. This is the unique identifier of the storage policy you want to modify, and an existing policy name must be specified. 

## Optional Parameters
`PROPERTIE ("<key>"="<value>"[, ... ])` 

1.`retention_days`  
> Data retention period. Defines the duration for which the data is kept in storage. Data exceeding this period will be automatically deleted. 

2.`redundancy_level`
> Redundancy level. Defines the number of data replicas to ensure high availability and fault tolerance. For example, a value of 2 means each data block has two replicas. 

3.`storage_type`   
> Storage type. Specifies the storage medium used, such as SSD, HDD, or hybrid storage. This affects performance and cost. 

4.`cooloff_time`    
> Cool-off time. The time interval between when data is marked for deletion and when it is actually deleted. This helps prevent data loss due to accidental operations. 

5.`location_policy` 
> Geographical location policy. Defines the geographical placement of data, such as cross-region replication for disaster recovery. 

## Examples

1. Modify the cooldown_datetime for hot-cold tiered data migration:
```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES("cooldown_datetime" = "2023-06-08 00:00:00");
```
2. Modify the cooldown_ttl for hot-cold tiered data migration countdown:

```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "10000");
```
```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "1h");
```
```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "3d");
```
