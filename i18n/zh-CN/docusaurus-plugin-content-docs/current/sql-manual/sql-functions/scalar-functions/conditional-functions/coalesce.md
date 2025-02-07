---
{
    "title": "COALESCE",
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

返回参数列表中从左到右第一个非空表达式。如果所有参数都为 NULL，则返回 NULL。

## 语法

```sql
COALESCE(<expr> [, ...])
```

## 参数

| 参数          | 说明                                                         |
| ------------- | ------------------------------------------------------------ |
| `<expr>` | 需要逐个检查的表达式序列，所有表达式必须具有兼容的数据类型。 |

## 返回值

参数列表中第一个非空表达式。如果所有参数都为 NULL，则返回 NULL。

## 示例

```sql
SELECT COALESCE(NULL, '1111', '0000');
```

```text
+--------------------------------+
| coalesce(NULL, '1111', '0000') |
+--------------------------------+
| 1111                           |
+--------------------------------+
```