---
{
    "title": "FORMAT_ROUND",
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

将数字格式化为类似于“#,###,###.##”的格式，四舍五入到指定位小数，并将结果作为字符串返回。

:::tip
提示
该函数自 3.0.6 版本开始支持.
:::

## 语法

```sql
FORMAT_ROUND(<number>, <D>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<number>` | 需要被格式化的数字 |
| `<D>` | 小数位数 |

## 返回值

返回格式化后的字符串。特殊情况：

- 当参数为 NULL 时，返回 NULL
- 如果 D 为 0，结果将没有小数点或小数部分。

## 举例

```sql
mysql> select format_round(17014116, 2);
+---------------------------+
| format_round(17014116, 2) |
+---------------------------+
| 17,014,116.00             |
+---------------------------+
```

```sql
mysql> select format_round(1123.456, 2);
+---------------------------+
| format_round(1123.456, 2) |
+---------------------------+
| 1,123.46                  |
+---------------------------+
```

```sql
mysql> select format_round(1123.4, 2);
+-------------------------+
| format_round(1123.4, 2) |
+-------------------------+
| 1,123.40                |
+-------------------------+
```



```sql
mysql> select format_round(123456, 0);
+-------------------------+
| format_round(123456, 0) |
+-------------------------+
| 123,456                 |
+-------------------------+
```

```sql
mysql> select format_round(123456, 3);
+-------------------------+
| format_round(123456, 3) |
+-------------------------+
| 123,456.000             |
+-------------------------+
```


```sql
mysql> select format_round(123456.123456, 0);
+--------------------------------+
| format_round(123456.123456, 0) |
+--------------------------------+
| 123,456                        |
+--------------------------------+
```

```sql
mysql> select format_round(123456.123456, 3);
+--------------------------------+
| format_round(123456.123456, 3) |
+--------------------------------+
| 123,456.123                    |
+--------------------------------+
```

```sql
mysql> select format_round(123456.123456, 6);
+--------------------------------+
| format_round(123456.123456, 6) |
+--------------------------------+
| 123,456.123456                 |
+--------------------------------+
```
