---
{
    "title": "SET VARIABLE",
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

This statement is mainly used to modify Doris system variables. These system variables can be modified at the global and session level, and some can also be modified dynamically. You can also view these system variables with `SHOW VARIABLE`.

## Syntax

```sql
SET variable_assignment [, variable_assignment] [ ... ]
```

Where:
```sql
variable_assignment
  : <user_var_name> = <expr>
  | [ <effective_scope> ] <system_var_name> = <expr>
```

## Required Parameters
**<1. user_var_name>**
> Specifies the variable of user level, for example : @@your_variable_name, variable name starts with `@@`

**<2. system_var_name>**
> Specifies the variable of system level, for example : exec_mem_limit and so on

## Optional Parameters
**<1. effective_scope>**

> Effective scope is one of `GLOBAL` or `SESSION` or `LOCAL`. If there is no effective scope, default value is `SESSION`. `LOCAL` is an alias of `SESSION`.

## Access Control Requirements
Users executing this SQL command must have at least the following privileges:

| Privilege  | Object | Notes                                        |
| :--------- | :----- | :------------------------------------------- |
| ADMIN_PRIV | Session  | set global variables need admin privilege |


## Usage Notes

- Only ADMIN users can set variables to take effect globally
- The globally effective variable affects the current session and new sessions thereafter, but does not affect other sessions that currently exist.

## Example

- Set the time zone to East Eighth District

   ```
   SET time_zone = "Asia/Shanghai";
   ```


- Set the global execution memory size

   ```
   SET GLOBAL exec_mem_limit = 137438953472
   ```
- Set a user variable

   ```
   SET @@your_variable_name = your_variable_value;
   ```


