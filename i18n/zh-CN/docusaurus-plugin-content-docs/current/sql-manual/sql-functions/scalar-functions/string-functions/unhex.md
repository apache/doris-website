---
{
    "title": "UNHEX",
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

`unhex` 函数用于将十六进制字符串转换为原始字符串。将每两个十六进制字符转换为一个字节。当传入的参数是无效值时，将返回空字符串。
`unhex_null` 函数与`unhex`函数作用一致。但是当传入的参数是无效值时，将返回`NULL`。

:::tip
该函数自 3.0.6 版本开始支持.
:::

## 语法

```sql
UNHEX(<str>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<str>` | 16 进制字符字符串 |

## 返回值

输入字符串，如果字符串长度为 0 或者为奇数，`unhex`函数返回空串，`unhex_null`函数返回`NULL`；
如果字符串中包含`[0-9]、[a-f]、[A-F]`之外的字符，`unhex`函数返回空串，`unhex_null`函数返回`NULL`；
其他情况每两个字符为一组转化为 16 进制后的字符，然后拼接成字符串输出。

## 举例

```sql
select unhex('@');
```

```text
+------------+
| unhex('@') |
+------------+
|            |
+------------+
```

```sql
select unhex_null('@');
```

```text
+-----------------+
| unhex_null('@') |
+-----------------+
| NULL            |
+-----------------+
```

```sql
select unhex('41');
```

```text
+-------------+
| unhex('41') |
+-------------+
| A           |
+-------------+
```

```sql
select unhex('4142');
```

```text
+---------------+
| unhex('4142') |
+---------------+
| AB            |
+---------------+
```
