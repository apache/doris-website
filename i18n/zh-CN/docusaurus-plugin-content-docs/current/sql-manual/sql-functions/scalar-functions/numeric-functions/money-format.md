---
{
    "title": "MONEY_FORMAT",
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

将数字按照货币格式输出，整数部分每隔 3 位用逗号分隔，小数部分保留 2 位

## 语法

```sql
MONEY_FORMAT(<number>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<number>` | 需要被格式化的数字 |

## 返回值

返回货币格式的字符串。特殊情况：

- 当参数为 NULL 时，返回 NULL

## 举例

```sql
select money_format(17014116);
```

```text
+------------------------+
| money_format(17014116) |
+------------------------+
| 17,014,116.00          |
+------------------------+
```

```sql
select money_format(1123.456);
```

```text
+------------------------+
| money_format(1123.456) |
+------------------------+
| 1,123.46               |
+------------------------+
```

```sql
select money_format(1123.4);
```

```text
+----------------------+
| money_format(1123.4) |
+----------------------+
| 1,123.40             |
+----------------------+
```