---
{
    "title": "TIME",
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
`TIME` 函数可以获取一个`DateTime`值的 `time` 部分.

## 语法

```sql
TIME(<datetime>)
```

## 参数

| 参数           | 描述              |
|----------------|------------------|
| `<datetime>`   | 一个datetime值.   |

## 返回值
返回`TIME`类型的值

## 举例

```sql
SELECT TIME('2025-1-1 12:12:12');
```

```text
mysql> 
+---------------------------+
| time('2025-1-1 12:12:12') |
+---------------------------+
| 12:12:12                  |
+---------------------------+
```
