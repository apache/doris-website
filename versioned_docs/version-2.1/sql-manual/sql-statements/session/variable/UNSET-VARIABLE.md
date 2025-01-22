---
{
    "title": "UNSET VARIABLE",
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

This statement is used to restore Doris system variables. These system variables can be modified at global or session level.

## Syntax

```sql
UNSET [<effective_scope>] VARIABLE (<variable_name>)
```

## Required Parameters
**<variable_name>**
> Specifies the variable name, or if you want to unset all variables, this parameter you can give a keyword `ALL`.

## Optional Parameters
**<effective_scope>**
> Effective scope is one of `GLOBAL` or `SESSION`. If there is no effective scope, default value is `SESSION`.

## Access Control Requirements
Users executing this SQL command must have at least the following privileges:

| Privilege  | Object | Notes                                        |
| :--------- | :----- | :------------------------------------------- |
| ADMIN_PRIV | Session  | unset global variables need admin privilege |

## Usage Notes

- Only ADMIN users can unset variables to take effect globally
- When restore a variable with `GLOBAL`,  it only affects your current using session and new open sessions. It does not affect other current open sessions.



## Example

- Restore value of the time zone

   ```
   UNSET VARIABLE time_zone;
   ```


- Restore the global execution memory size

   ```
   UNSET GLOBAL VARIABLE exec_mem_limit;
   ```


- Restore all variables globally

   ```
   UNSET GLOBAL VARIABLE ALL;
   ```
