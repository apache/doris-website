---
{
    "title": "SEC_TO_TIME",
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
`SEC_TO_TIME` 函数将一个以秒为单位的值转换为 `TIME` 类型，返回格式为 `HH:MM:SS`。输入的秒数表示从一天的起点时间（`00:00:00`）开始计算的时间。
## 语法

```sql
SEC_TO_TIME(<seconds>)
```

## 参数

| 参数            | 说明                                                |
|---------------|---------------------------------------------------|
| `<seconds>` | 必填，输入的秒数，表示从一天起点时间（00:00:00）开始计算的秒数，支持正整数或负整数类型。 |

## 返回值
- 返回一个 TIME 类型值，格式为 `HH:MM:SS`，表示从起点时间（00:00:00）开始计算的时间。
- 如果输入的 `<seconds>` 为 NULL，函数返回 NULL。

## 举例
```sql
SELECT SEC_TO_TIME(59738);
```
```text
+--------------------+
| sec_to_time(59738) |
+--------------------+
| 16:35:38           |
+--------------------+
```