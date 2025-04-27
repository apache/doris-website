---
{
    "title": "DEGREES",
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

输入一个 double 类型的浮点数，由弧度转换为角度。

- 当参数为 NUL 时，返回 NULL

## 语法

```sql
DEGREES(<a>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<a>` | 需要由弧度转换为角度的值 |

## 返回值

参数 a 的角度

- 当参数为 NUL 时，返回 NULL

## 举例

```sql
select degrees(3.14),degrees(1),degrees(-1),degrees(NULL)
```

```text
+-------------------------------+----------------------------+-----------------------------+---------------+
| degrees(cast(3.14 as DOUBLE)) | degrees(cast(1 as DOUBLE)) | degrees(cast(-1 as DOUBLE)) | degrees(NULL) |
+-------------------------------+----------------------------+-----------------------------+---------------+
|             179.9087476710785 |          57.29577951308232 |          -57.29577951308232 |          NULL |
+-------------------------------+----------------------------+-----------------------------+---------------+
```