---
{
    "title": "STR_TO_MAP",
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

将字符串转换为 `Map<String, String>` 类型。

:::tip
该函数自 3.0.6 版本开始支持.
:::

## 语法

```sql
STR_TO_MAP(<str> [, <pair_delimiter> [, <key_value_delimiter>]])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<str>` | 要转换为 map 的字符串 |
| `<pair_delimiter>` | 字符串中键值对的分割符，默认为 `,` |
| `<key_value_delimiter>` | 字符串中键和值的分割符，默认为 `:` |

## 返回值

返回从字符串构造的 `Map<String, String>`。

## 示例

```sql
select str_to_map('a=1&b=2&c=3', '&', '=') as map1, str_to_map('x:10|y:20|z:30', '|', ':') as map2;
```

```text
+-----------------------------+--------------------------------+
| map1                        | map2                           |
+-----------------------------+--------------------------------+
| {"a":"1", "b":"2", "c":"3"} | {"x":"10", "y":"20", "z":"30"} |
+-----------------------------+--------------------------------+
``` 
