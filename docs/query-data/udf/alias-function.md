---
{
    "title": "Alias Function",
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

## Introduction

An alias function refers to assigning an alias name to a function. By registering a new signature for a function or expression fragment in the system, it aims to enhance compatibility or increase convenience.

Alias functions, like other custom functions, support two scopes: `LOCAL` and `GLOBAL`.

- `LOCAL`: Alias functions are registered under the current database scope. If the alias function needs to be used under other databases, its fully qualified name should be used, i.e., `<Database Name>.<Function Name>`.

- `GLOBAL`: Alias functions are registered under the global scope. They can be directly accessed by their function names under any database.

## Use Case

### Assigning Aliases to Functions

This scenario is common in system migration. When users have existing queries targeting other database systems, there may be functions in these queries that have the same functionality as a function in Doris but different names. In this case, by defining a new alias function for this function, migration can be completed without users noticing any changes.

### Simplifying Query Statements

This scenario is often seen in complex analyses. When writing complex query statements, there may be a large number of repetitive expression fragments within a statement or across different statements. By creating an alias function for this complex expression fragment, the query statement can be simplified, enhancing writing convenience and maintainability.

## Supported Scope

### Expression Requirements

Currently, alias functions require that the root node of the actual expression they point to must be a function expression.

Legal Examples:

```sql
-- Create an alias function named func with parameters INT, INT, actually pointing to the expression abs(foo + bar);  
CREATE ALIAS FUNCTION func(INT, INT) WITH PARAMETER(foo, bar) AS abs(foo + bar);  
-- Create an alias function named func with parameters DATETIMEV2(3), INT, actually pointing to the expression date_trunc(days_sub(foo, bar), 'day')  
CREATE ALIAS FUNCTION func(DATETIMEV2(3), INT) WITH PARAMETER (foo, bar) AS date_trunc(days_sub(foo, bar), 'day')
```

Illegal Example:

```sql
-- The root expression is not a function  
CREATE ALIAS FUNCTION func(INT, INT) WITH PARAMETER(foo, bar) AS foo + bar;
```

### Parameter Requirements

Currently, alias functions do not support variable-length parameters and must have at least one parameter.

## More Content

Apart from alias functions, Doris supports Java UDF and UDTF functionalities. For detailed information, please refer to the documentation [Java UDF](../../query-data/udf/java-user-defined-function).