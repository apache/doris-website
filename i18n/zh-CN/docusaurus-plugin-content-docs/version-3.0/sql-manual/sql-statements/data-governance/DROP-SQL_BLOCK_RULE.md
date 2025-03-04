---
{
    "title": "DROP SQL_BLOCK_RULE",
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

Deletes one or more SQL blocking rules. Multiple rules can be deleted at once by separating them with commas.

## Syntax

```sql
DROP SQL_BLOCK_RULE <rule_name>[, ...]
```

## Required Parameters

<rule_name>
The name of the SQL blocking rule to be deleted. Multiple rule names can be specified, separated by commas. 

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:
| Privilege | Object | Notes                |
| :---------------- | :------------- | :---------------------------- |
| ADMIN        | User or Role   | Only users or roles with the ADMIN privilege can perform the DROP operation. |


## Example

Delete `test_rule1` and `test_rule2` blocking rules

```sql
DROP SQL_BLOCK_RULE test_rule1, test_rule2;
```
