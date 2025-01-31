---
{
    "title": "SHOW CREATE FUNCTION",
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

This statement is used to show the creation statement of a user-defined function

## Syntax

```sql
SHOW CREATE [ GLOBAL ] FUNCTION <function_name>( <arg_type> ) [ FROM <db_name> ];
```

## Required Parameters

**1. `<function_name>`**

> The name of the custom function that you want to query for the creation statement.

**2. `<arg_type>`**

> The parameter list of the custom function that needs to be queried for the creation statement.
>
> Parameter list location you need to enter the data type of the location parameter

## Optional Parameters

**1.`GLOBAL`**

> GLOBAL is an optional parameter.
>
> If GLOBAL is set, the function is searched for globally and deleted.
>
> If GLOABL is not entered, the function is searched for in the current database and deleted.

**2.`<db_name>`**

> FROM db_name indicates that the custom function is queried from the specified database

## Return Value

| Column          | Description          |
|-----------------|-------------|
| SYMBOL          | Function package name        |
| FILE            | jar package path     |
| ALWAYS_NULLABLE | Whether the result can be NULL |
| TYPE            | Function type        |

## Access Control Requirements

The user who executes this SQL command must have at least the following permissions:

| Privilege | Object   | Notes       |
|:----------|:---------|:--------------|
| SHOW_PRIV | Function | You need to have the show permission on this function |

## Examples

```sql
SHOW CREATE FUNCTION add_one(INT)
```

```text
| Function Signature | Create Function
+--------------------+-------------------------------------------------------
| add_one(INT)       | CREATE FUNCTION add_one(INT) RETURNS INT PROPERTIES (
  "SYMBOL"="org.apache.doris.udf.AddOne",
  "FILE"="file:///xxx.jar",
  "ALWAYS_NULLABLE"="true",
  "TYPE"="JAVA_UDF"
  ); |
+--------------------+-------------------------------------------------------
```
