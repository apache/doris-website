---
{
    "title": "DIGITAL_MASKING",
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

`digital_masking` 函数用于对数字进行脱敏处理。根据指定的脱敏规则，将数字的部分字符替换为 * 。别名函数，原始函数为 `concat(left(id,3),'****',right(id,4))`。

## 语法

```sql
DIGITAL_MASKING( <digital_number> )
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<digital_number>` | 需要脱敏的数字字符串 |

## 返回值

返回脱敏后的数字字符串。

## 举例

```sql
select digital_masking(13812345678);
```

```text
+------------------------------+
| digital_masking(13812345678) |
+------------------------------+
| 138****5678                  |
+------------------------------+
```