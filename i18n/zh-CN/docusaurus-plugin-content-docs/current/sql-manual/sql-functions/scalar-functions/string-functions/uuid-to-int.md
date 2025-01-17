---
{
    "title": "UUID_TO_INT",
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

对于输入的 uuid 字符串，返回一个 int128 表示。

## 语法

```sql
UUID_TO_INT( <uuid> )
```
## 必选参数

| 参数 | 描述 |
|------|------|
| `uuid` | 待解码的字符串 |


## 返回值
返回一个 int128 表示

## 示例

```sql
select uuid_to_int("6ce4766f-6783-4b30-b357-bba1c7600348");
```

```sql
+-----------------------------------------------------+
| uuid_to_int('6ce4766f-6783-4b30-b357-bba1c7600348') |
+-----------------------------------------------------+
| 95721955514869408091759290071393952876              |
+-----------------------------------------------------+
```
