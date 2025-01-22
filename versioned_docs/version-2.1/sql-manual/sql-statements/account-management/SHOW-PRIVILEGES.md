---
{
    "title": "SHOW PRIVILEGES",
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

`SHOW PRIVILEGES` statement is used to display the list of currently available privileges in the database system. It helps users understand the types of privileges supported by the system and the details of each privilege.

## Syntax

```sql
SHOW PRIVILEGES
```

## Return Value

  | Column | Description |
  | -- | -- |
  | Privilege | Privilege name |
  | Context | Applicable range |
  | Comment | Description |

## Access Control Requirements

The user executing this SQL command does not need to have specific privileges.

## Examples

View all privileges

```sql
SHOW PRIVILEGES
```
  
```text
+-------------+-------------------------------------------------------+-----------------------------------------------+
| Privilege   | Context                                               | Comment                                       |
+-------------+-------------------------------------------------------+-----------------------------------------------+
| Node_priv   | GLOBAL                                                | Privilege for cluster node operations         |
| Admin_priv  | GLOBAL                                                | Privilege for admin user                      |
| Grant_priv  | GLOBAL,CATALOG,DATABASE,TABLE,RESOURCE,WORKLOAD GROUP | Privilege for granting privilege              |
| Select_priv | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for select data in tables           |
| Load_priv   | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for loading data into tables        |
| Alter_priv  | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for alter database or table         |
| Create_priv | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for creating database or table      |
| Drop_priv   | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for dropping database or table      |
| Usage_priv  | RESOURCE,WORKLOAD GROUP                               | Privilege for using resource or workloadGroup |
+-------------+-------------------------------------------------------+-----------------------------------------------+
```
