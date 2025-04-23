---
{
    "title": "ATANH",
    "language": "zh-CN"
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

## 描述

返回`x`的反双曲正切值。如果`x`不在`-1`到`1`之间(不包括`-1`和`1`)，则返回`NULL`。


## 语法

```sql
ATANH(<x>)
```

## 参数

| 参数 | 描述 |  
| -- | -- |  
| `<x>` | 需要计算反双曲正切值的数值 |  

## 返回值

参数`x`的反双曲正切值。

## 示例

```sql
select atanh(1.0);
```

```sql
+------------+
| atanh(1.0) |
+------------+
|       NULL |
+------------+
```

```sql
select atanh(1.0);
```

```sql
+-------------+
| atanh(-1.0) |
+-------------+
|        NULL |
+-------------+
```

```sql
select atanh(1.0);
```

```sql
+------------+
| atanh(0.0) |
+------------+
|          0 |
+------------+
```

```sql
select atanh(1.0);
```

```sql
+--------------------+
| atanh(0.5)         |
+--------------------+
| 0.5493061443340548 |
+--------------------+
```
