---
{
    "title": "SHOW-FUNCTIONS",
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

View all custom (system-provided) functions in the database.

You need to have a 'SHOW' permission on this database

## Syntax

```sql
SHOW [<FULL>] [<BUILTIN>] FUNCTIONS IN|FROM <db> [LIKE '<function_pattern>']
```

## Parameters

| Parameters | Instructions |
| -- | -- |
| `<FULL>` | indicates that detailed information about the function is displayed |
| `<BUILTIN>` | Indicates a function provided by the display system |
| `<db>` | Name of the database to be queried |
| `<function_pattern>` | Parameters used to filter function names |

## Return Value

Specifies the result of a function that matches the function name filter under the database

## Examples

```sql
show full functions in testDb
```

```text
*************************** 1. row ***************************
Signature: my_add(INT,INT)
Return Type: INT
Function Type: Scalar
Intermediate Type: NULL
Properties: {"symbol":"_ZN9doris_udf6AddUdfEPNS_15FunctionContextERKNS_6IntValES4_","object_file":"http://host:port/libudfsample.so","md5":"cfe7a362d10f3aaf6c49974ee0f1f878"}
*************************** 2. row ***************************
Signature: my_count(BIGINT)
Return Type: BIGINT
Function Type: Aggregate
Intermediate Type: NULL
Properties: {"object_file":"http://host:port/libudasample.so","finalize_fn":"_ZN9doris_udf13CountFinalizeEPNS_15FunctionContextERKNS_9BigIntValE","init_fn":"_ZN9doris_udf9CountInitEPNS_15FunctionContextEPNS_9BigIntValE","merge_fn":"_ZN9doris_udf10CountMergeEPNS_15FunctionContextERKNS_9BigIntValEPS2_","md5":"37d185f80f95569e2676da3d5b5b9d2f","update_fn":"_ZN9doris_udf11CountUpdateEPNS_15FunctionContextERKNS_6IntValEPNS_9BigIntValE"}
*************************** 3. row ***************************
Signature: id_masking(BIGINT)
Return Type: VARCHAR
Function Type: Alias
Intermediate Type: NULL
Properties: {"parameter":"id","origin_function":"concat(left(`id`, 3), `****`, right(`id`, 4))"}
```

```sql
show builtin functions in testDb like 'year%';
```

```text
+---------------+
| Function Name |
+---------------+
| year          |
| years_add     |
| years_diff    |
| years_sub     |
+---------------+
```


## Syntax

```sql
SHOW GLOBAL [<FULL>] FUNCTIONS [LIKE '<function_pattern>']
```

## Parameters

| Parameters | Instructions |
| -- | -- |
| `<FULL>` | Displays detailed information about the function |
| `<function_pattern>` | Parameters used to filter function names |


## Return Value

Query the result of the function that matches the function name filtering in the database where the current session resides

## Examples

```sql
show global full functions
```

```text
*************************** 1. row ***************************
        Signature: decimal(ALL, INT, INT)
      Return Type: VARCHAR
    Function Type: Alias
Intermediate Type: NULL
       Properties: {"parameter":"col, precision, scale","origin_function":"CAST(`col` AS decimal(`precision`, `scale`))"}
*************************** 2. row ***************************
        Signature: id_masking(BIGINT)
      Return Type: VARCHAR
    Function Type: Alias
Intermediate Type: NULL
       Properties: {"parameter":"id","origin_function":"concat(left(`id`, 3), `****`, right(`id`, 4))"}
```

```sql
show global functions
```

```text
+---------------+
| Function Name |
+---------------+
| decimal       |
| id_masking    |
+---------------+
```
