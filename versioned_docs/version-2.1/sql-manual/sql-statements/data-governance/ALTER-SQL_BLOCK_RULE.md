---
{
    "title": "ALTER SQL_BLOCK_RULE",
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

This statement is used to modify an SQL block rule.

## Syntax


```sql
ALTER SQL_BLOCK_RULE <rule_name>
PROPERTIES (
          -- property
          <property>
          -- Additional properties
          [ , ... ]
          ) 
```

## Required Parameters

**1. `<rule_name>`**

> The name of the rule.

**2. `<property>`**

See the introduction of [CREATE SQL_BLOCK_RULE](../data-governance/CREATE-SQL_BLOCK_RULE.md) for details.

## Access Control Requirements

The user executing this SQL command must have at least the following permissions:

| Privilege   | Object | Notes |
| ------------ | ------ | ----------- |
| ADMIN_PRIV | Global |             |

## Example

1. Modify the SQL and enable the rule


  ```sql
  ALTER SQL_BLOCK_RULE test_rule PROPERTIES("sql"="select \\* from test_table","enable"="true")
  ```