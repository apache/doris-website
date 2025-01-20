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
SHOW CREATE [<GLOBAL>] FUNCTION <function_name>(<arg_type>) [FROM db_name]];
```

## Parameters

| Parameters | Instructions |
| -- | -- |
| `<function_name>` | The name of the function to delete |
| `<arg_type>` | To delete the argument list of the function |

## Return Value

A custom function constructor clause

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
