---
{
    "title": "NOW",
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
函数用于获取当前系统时间，返回值为日期时间类型（`DATETIME`）。可以选择性地指定精度以调整返回值的小数秒部分的位数。

## 语法

```sql
NOW([<precision>])
```

## 参数

| 参数            | 说明                                                                                                                                  |
|---------------|-------------------------------------------------------------------------------------------------------------------------------------|
| `<precision>` | 可选参数，表示返回值的小数秒部分的精度，取值范围为 0 到 6。默认为 0，即不返回小数秒部分。 <br/>受限于 JDK 实现，如果用户使用 JDK8 构建 FE，则精度最多支持到毫秒（小数点后三位），更大的精度位将全部填充 0。如果用户有更高精度需求，请使用 JDK11。 |

## 返回值
- 返回当前系统时间，类型为 `DATETIME`
- 如果指定的 `<precision>` 超出范围（如为负数或大于 6），函数会返回错误。

## 举例

```sql
select NOW(),NOW(3),NOW(6);
```

```text
+---------------------+-------------------------+----------------------------+
| now()               | now(3)                  | now(6)                     |
+---------------------+-------------------------+----------------------------+
| 2025-01-23 11:08:35 | 2025-01-23 11:08:35.561 | 2025-01-23 11:08:35.562000 |
+---------------------+-------------------------+----------------------------+
```