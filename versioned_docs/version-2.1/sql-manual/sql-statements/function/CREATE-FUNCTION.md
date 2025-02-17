---
{
    "title": "CREATE FUNCTION",
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

This statement is used to create a custom function.

## Syntax


```sql
CREATE [ GLOBAL ] 
    [{AGGREGATE | TABLES | ALIAS }] FUNCTION <function_name>
    (<arg_type> [, ...])
    [ RETURNS <ret_type> ]
    [ INTERMEDIATE <inter_type> ]
    [ WITH PARAMETER(<param> [,...]) AS <origin_function> ]
    [ PROPERTIES ("<key>" = "<value>" [, ...]) ]
```

## Required Parameters

**1. `<function_name>`**

> If `function_name` includes a database name, such as `db1.my_func`, the custom function will be created in the corresponding database. Otherwise, the function will be created in the database of the current session. The name and parameters of the new function must not be identical to an existing function in the current namespace; otherwise, the creation will fail.

**2. `<arg_type>`**

> The input parameter type of the function. For variable-length parameters, use `, ...` to indicate them. If it is a variable-length type, the type of the variable-length parameters must be consistent with the type of the last non-variable-length parameter.

**3. `<ret_type>`**

> The return parameter type of the function. This is a required parameter for creating a new function. If creating an alias for an existing function, this parameter is not necessary.

## Optional Parameters

**1. `GLOBAL`**

> If specified, the created function is effective globally.

**2. `AGGREGATE`**

> If specified, the created function is an aggregate function.

**3. `TABLES`**

> If specified, the created function is a table function.

**4. `ALIAS`**

> If specified, the created function is an alias function.

> If none of the above parameters representing the function type is selected, it indicates that the created function is a scalar function.

**5. `<inter_type>`**

> Used to indicate the data type during the intermediate stage of an aggregate function.

**6. `<param>`**

> Used to indicate the parameters of an alias function, with at least one parameter required.

**7. `<origin_function>`**

> Used to indicate the original function corresponding to the alias function.

**8. `<properties>`**

> - `file`: Indicates the JAR package containing the user-defined function (UDF). In a multi-machine environment, it can also be downloaded via HTTP. This parameter is mandatory.
> - `symbol`: Indicates the class name containing the UDF class. This parameter is mandatory.
> - `type`: Indicates the UDF call type. The default is Native. Use JAVA_UDF when using a Java UDF.
> - `always_nullable`: Indicates whether the UDF result may contain NULL values. This is an optional parameter with a default value of true.

## Access Control Requirements

To execute this command, the user must have `ADMIN_PRIV` privileges.

## Example

1. Create a custom UDF function. For more details, refer to [JAVA-UDF](../../../query-data/udf/java-user-defined-function).

   

   ```sql
   CREATE FUNCTION java_udf_add_one(int) RETURNS int PROPERTIES (
       "file"="file:///path/to/java-udf-demo-jar-with-dependencies.jar",
       "symbol"="org.apache.doris.udf.AddOne",
       "always_nullable"="true",
       "type"="JAVA_UDF"
   );
   ```

2. Create a custom UDAF function.

   

   ```sql
   CREATE AGGREGATE FUNCTION simple_sum(INT) RETURNS INT PROPERTIES (
       "file"="file:///pathTo/java-udaf.jar",
       "symbol"="org.apache.doris.udf.demo.SimpleDemo",
       "always_nullable"="true",
       "type"="JAVA_UDF"
   );
   ```

3. Create a custom UDTF function.

   

   ```sql
   CREATE TABLES FUNCTION java_udtf(string, string) RETURNS array<string> PROPERTIES (
       "file"="file:///pathTo/java-udaf.jar",
       "symbol"="org.apache.doris.udf.demo.UDTFStringTest",
       "always_nullable"="true",
       "type"="JAVA_UDF"
   );
   ```

4. Create a custom alias function. For more information, refer to [Alias Function](../../../query-data/udf/alias-function).

   

   ```sql
   CREATE ALIAS FUNCTION id_masking(INT) WITH PARAMETER(id) AS CONCAT(LEFT(id, 3), '****', RIGHT(id, 4));
   ```

5. Create a global custom alias function.

   

   ```sql
   CREATE GLOBAL ALIAS FUNCTION id_masking(INT) WITH PARAMETER(id) AS CONCAT(LEFT(id, 3), '****', RIGHT(id, 4));
   ```