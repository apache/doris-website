---
{
    "title": "PRINTF",
    "language": "cn"
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

使用指定的 [printf](https://pubs.opengroup.org/onlinepubs/009695399/functions/fprintf.html) 格式字符串和参数返回格式化后的字符串。

## 语法

```sql
PRINTF(<format>, [<args>, ...])
```

## 参数  

| 参数 | 说明 |  
| -- | -- |  
| `<format>` | printf 格式字符串。 |  
| `<args>` | 要格式化的参数。 | 

## 返回值  

使用 printf 模式格式化后的字符串。 

## 示例

```sql
select printf("hello world");
```

```text
+-----------------------+
| printf("hello world") |
+-----------------------+
| hello world           |
+-----------------------+
```

```sql
select printf('%d-%s-%.2f', 100, 'test', 3.14);
```

```text
+-----------------------------------------+
| printf('%d-%s-%.2f', 100, 'test', 3.14) |
+-----------------------------------------+
| 100-test-3.14                           |
+-----------------------------------------+
```

```sql
select printf('Int: %d, Str: %s, Float: %.2f, Hex: %x', 255, 'test', 3.14159, 255);
```

```text
+-----------------------------------------------------------------------------+
| printf('Int: %d, Str: %s, Float: %.2f, Hex: %x', 255, 'test', 3.14159, 255) |
+-----------------------------------------------------------------------------+
| Int: 255, Str: test, Float: 3.14, Hex: ff                                   |
+-----------------------------------------------------------------------------+
``` 