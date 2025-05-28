---
{
    "title": "ISNULL",
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

Returns `bool` if the expression is `NULL`.

:::info 备注
从 Apache Doris 3.0.6 开始支持该函数
:::

## Syntax

```sql
ISNULL(<expr>)
```

## Parameters

| Parameter | Description                         |
| --------- | ----------------------------------- |
| `<expr>`  | The expression to check for `NULL`. |
|           |                                     |

## Return Value

- Returns `bool` if the expression is `NULL`.  

## Examples

```sql
SELECT ISNULL(NULL);
```

```text
+--------------+
| ISNULL(NULL) |
+--------------+
|            1 |
+--------------+
```
