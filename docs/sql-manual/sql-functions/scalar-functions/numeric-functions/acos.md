---
{
    "title": "ACOS",
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

## description

Returns the arc cosine of `x`, or `NULL` if `x` is not in the range `-1` to `1`.

## Syntax

```sql
ACOS(<x>)
```

## Parameters  

| Parameter | Description |  
| -- | -- |  
| x | The value for which the acos value is to be calculated |  

## Return Value  

The acos value of parameter `x`. 

### example

```sql
select acos(1);
```

```text
+-----------+
| acos(1.0) |
+-----------+
|         0 |
+-----------+
```

```sql
select acos(0);
```

```text
+--------------------+
| acos(0.0)          |
+--------------------+
| 1.5707963267948966 |
+--------------------+
```

```sql
select acos(-2);
```

```text
+------------+
| acos(-2.0) |
+------------+
|        nan |
+------------+
```
