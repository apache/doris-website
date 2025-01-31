---
{
    "title": "BITMAP_FROM_ARRAY",
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

将一个 TINYINT/SMALLINT/INT/BIGINT 类型的数组转化为一个 BITMAP，当输入字段不合法时，结果返回 NULL

## 语法

```sql
BITMAP_FROM_ARRAY(<arr>)
```

## 参数

| 参数      | 说明   |
|---------|------|
| `<arr>` | 整形数组 |

## 返回值

返回一个 BITMAP
- 当输入字段不合法时，结果返回 NULL

## 举例

```sql
SELECT bitmap_to_string(bitmap_from_array(array(1, 0, 1, 1, 0, 1, 0))) AS bs;
```

```text
+------+
| bs   |
+------+
| 0,1  |
+------+
```

