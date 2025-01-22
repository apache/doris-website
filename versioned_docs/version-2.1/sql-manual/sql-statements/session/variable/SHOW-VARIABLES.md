---
{
    "title": "SHOW VARIABLES",
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

This statement is used to display Doris system variables, which can be queried by conditions

## Syntax

```sql
SHOW [<effective_scope>] VARIABLES [<like_pattern> | <where>]
```

## Optional Parameters
**<effective_scope>**
> Effective scope is one of `GLOBAL` or `SESSION`. If there is no effective scope, default value is `SESSION`.

**<like_pattern>**
> Use like statement to match and filter result

**<where>**
> Use where statement to match and filter result

## Access Control Requirements
Users executing this SQL command must have at least the following privileges:

| Privilege  | Object | Notes                                        |
| :--------- | :----- | :------------------------------------------- |
| Any_PRIV | Session  | Any privilege can show variables |


## Return Value
| Variable_name | Value   | Default_Value                    | Changed |
|:--------------|:--------|:---------------------------------|:--------|
| variable name1      | value1 | default value1 |   0/1      |
| variable name2      | value2 | default value2 |   0/1      |


## Usage Notes

- Show variables is mainly used to view the values of system variables.
- Executing the SHOW VARIABLES command does not require any privileges, it only requires being able to connect to the server.
- Use the like statement to match with variable_name.
- The % percent wildcard can be used anywhere in the matching pattern
- The column `Changed` from `Return Value`, 0 means no changed and 1 means changed.


## Example


- The default here is to match the Variable_name, here is the exact match

    ```sql
    show variables like 'max_connections';
    ```


- Matching through the percent sign (%) wildcard can match multiple items

    ```sql
    show variables like '%connec%';
    ```


- Use the Where clause for matching queries

    ```sql
    show variables where variable_name = 'version';
    ```
