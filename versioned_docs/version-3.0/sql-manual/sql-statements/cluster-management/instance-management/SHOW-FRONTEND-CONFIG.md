---
{
   "title": "SHOW FRONTEND CONFIG",
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

This statement is used to display the configuration of the current cluster (currently only the configuration items of FE are supported)

## Syntax

```sql
SHOW FRONTEND CONFIG [LIKE "<pattern>"];
```

## Optional Parameters
**`<pattern>`**
> A string that can contain ordinary characters and wildcards.


## Return Values
| Column name | Describe                                            |
|-------------|-----------------------------------------------------|
| Value       | Configuration item value                            |
| Type        | Configuration item type                             |
| IsMutable   | Whether it can be set by `ADMIN SET CONFIG` command |
| MasterOnly  | Is it only applicable to Master FE                  |
| Comment     | Configuration item description                      |


## Example

1. View the configuration of the current FE node

   ```sql
   SHOW FRONTEND CONFIG;
   ```

2. Use the like predicate to search the configuration of the current Fe node

   ```sql
    SHOW FRONTEND CONFIG LIKE '%check_java_version%';
    ```
    ```text
    +--------------------+-------+---------+-----------+------------+---------+
    | Key                | Value | Type    | IsMutable | MasterOnly | Comment |
    +--------------------+-------+---------+-----------+------------+---------+
    | check_java_version | true  | boolean | false     | false      |         |
    +--------------------+-------+---------+-----------+------------+---------+
    ```

