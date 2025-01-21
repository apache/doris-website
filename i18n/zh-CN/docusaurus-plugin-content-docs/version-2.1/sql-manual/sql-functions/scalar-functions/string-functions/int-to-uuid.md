---
{
    "title": "INT_TO_UUID",
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

对于输入的已编码 LARGEINT，转译为原始的 uuid 字符串。

## 语法

```sql
INT_TO_UUID ( <int128> )
```

## 参数

| 参数         | 说明              |
|------------|-----------------|
| `<int128>` | 已编码的 LARGEINT 值 |

## 返回值

参数 `<int128>` 原始的 uuid 字符串。

## 举例

```sql
SELECT INT_TO_UUID(95721955514869408091759290071393952876)
```

```text
+-----------------------------------------------------+
| int_to_uuid(95721955514869408091759290071393952876) |
+-----------------------------------------------------+
| 6ce4766f-6783-4b30-b357-bba1c7600348                |
+-----------------------------------------------------+
```
