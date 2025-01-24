---
{
    "title": "ABS",
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

Returns the absolute value of `x`

## Syntax

```sql
ABS(<x>) 
```

## Parameters  

| Parameter | Description |  
| -- | -- |  
| `<x>` | The value for which the absolute value is to be calculated |  

## Return Value  

The absolute value of parameter `x`. 

## Example

```sql
select abs(-2);
```

```text
+---------+
| abs(-2) |
+---------+
|       2 |
+---------+
```

```sql
select abs(3.254655654);
```

```text
+------------------+
| abs(3.254655654) |
+------------------+
|      3.254655654 |
+------------------+
```

```sql
select abs(-3254654236547654354654767);
```

```text
+---------------------------------+
| abs(-3254654236547654354654767) |
+---------------------------------+
| 3254654236547654354654767       |
+---------------------------------+
```
