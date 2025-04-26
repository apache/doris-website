---
{
    "title": "Assignment Operators",
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

The function of the assignment operator is to assign the expression on the right-hand side of the operator to the expression on the left-hand side. In Doris, the assignment operator can only be used in the SET part of the UPDATE statement and in the SET statement. For details, please refer to the [UPDATE](../../sql-statements/data-modification/DML/UPDATE.md) statement and the [SET](../../sql-statements/session/variable/SET-VARIABLE.md) statement.

## Operators

| Operator | Purpose | Example |
|----------|---------|---------|
| <x> = <y> | Assign the result of <y> to <x>. | `SET enable_profile = true` |