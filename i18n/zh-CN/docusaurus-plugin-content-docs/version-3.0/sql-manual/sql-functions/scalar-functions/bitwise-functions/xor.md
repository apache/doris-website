---
{
    "title": "XOR",
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
用于对两个 BOOLEAN 值进行按位异或操作。

## 语法
```sql
 <lhs> XOR <rhs>
```

## 参数
| 参数    | 说明           |
|-------|--------------|
| `<lhs>` | 参与运算的第一个 BOOLEAN 值 |
| `<rhs>` | 参与运算的第二个 BOOLEAN 值 |

## 返回值
返回两个 BOOLEAN 值的异或值。

## 示例
```sql
select true XOR false,true XOR true;
```

```text
+------------------+-----------------+
| xor(TRUE, FALSE) | xor(TRUE, TRUE) |
+------------------+-----------------+
|                1 |               0 |
+------------------+-----------------+
```
