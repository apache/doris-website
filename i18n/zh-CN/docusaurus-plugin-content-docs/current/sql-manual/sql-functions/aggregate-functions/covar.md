---
{
    "title": "COVAR",
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

计算两个数值型变量之间的协方差

## 别名

- COVAR_POP

## 语法

```sql
COVAR(<expr1>, <expr2>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr1>` | 数值型表达式或列 |
| `<expr2>` | 数值型表达式或列 |

## 返回值

返回 expr1 和 expr2 的协方差值，特殊情况：

- 如果 expr1 或者 expr2 某一列为 NULL 时，该行数据不会被统计到最终结果中。

## 举例

```
select covar(x,y) from baseall;
```

```text
+---------------------+
| covar(x, y)          |
+---------------------+
| 0.89442719099991586 |
+---------------------+
```

