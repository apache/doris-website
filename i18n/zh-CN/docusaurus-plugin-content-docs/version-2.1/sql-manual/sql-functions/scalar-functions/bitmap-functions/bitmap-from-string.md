---
{
    "title": "BITMAP_FROM_STRING",
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

将一个字符串转化为一个 BITMAP，字符串是由逗号分隔的一组 unsigned bigint 数字组成。(数字取值在:0 ~ 18446744073709551615)
比如"0, 1, 2"字符串会转化为一个 Bitmap，其中的第 0, 1, 2 位被设置。当输入字段不合法时，返回 NULL

## 语法

```sql
 BITMAP_FROM_STRING(<str>)
```

## 参数

| 参数      | 说明                                                |
|---------|---------------------------------------------------|
| `<str>` | 数组字符串，比如"0, 1, 2"字符串会转化为一个 Bitmap，其中的第 0, 1, 2 位被设置  |  

## 返回值

返回一个 BITMAP
- 当输入字段不合法时，结果返回 NULL

## 举例

```sql
select bitmap_to_string(bitmap_from_string("0, 1, 2")) bts;
```

```text
+-------+
| bts   |
+-------+
| 0,1,2 |
+-------+
```

```sql
select bitmap_from_string("-1, 0, 1, 2") bfs;
```

```text
+------+
| bfs  |
+------+
| NULL |
+------+
```

```sql
select bitmap_to_string(bitmap_from_string("0, 1, 18446744073709551615")) bts;
```

```text
+--------------------------+
| bts                      |
+--------------------------+
| 0,1,18446744073709551615 |
+--------------------------+
```

