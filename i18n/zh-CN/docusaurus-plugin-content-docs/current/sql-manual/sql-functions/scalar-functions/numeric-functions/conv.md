---
{
    "title": "CONV",
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

对输入的数字进行进制转换

## 语法

```sql
CONV(<input>, <from_base>, <to_base>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<input>` | 需要进行进制转换的参数，可为字符串或整数 |
| `<from_base>` | 数字，原始进制，范围应在 `[2,36]` 以内 |
| `<to_base>` | 数字，目标进制，范围应在 `[2,36]` 以内 |

## 返回值

转换后目标进制 `<to_base>` 下的数字，以字符串形式返回。

## 举例

```sql
SELECT CONV(15,10,2);
```

```text
+-----------------+
| conv(15, 10, 2) |
+-----------------+
| 1111            |
+-----------------+
```

```sql
SELECT CONV('ff',16,10);
```

```text
+--------------------+
| conv('ff', 16, 10) |
+--------------------+
| 255                |
+--------------------+
```

```sql
SELECT CONV(230,10,16);
```

```text
+-------------------+
| conv(230, 10, 16) |
+-------------------+
| E6                |
+-------------------+
```
