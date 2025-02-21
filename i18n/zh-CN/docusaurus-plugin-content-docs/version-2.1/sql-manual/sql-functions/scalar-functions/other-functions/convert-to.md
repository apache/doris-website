---
{
    "title": "CONVERT_TO",
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

将指定的 VARCHAR 列的字符编码转换为目标字符集，常用于 ORDER BY 子句中对包含中文的列进行按拼音排序。当前仅支持将 `<character>` 转换为 `'gbk'` 编码。

## 语法

```sql
CONVERT_TO(<column>, <character>)
```

## 参数

| 参数           | 说明                                                  |
|----------------|-------------------------------------------------------|
| `<column>`     | 需要转换字符编码的 VARCHAR 列。                        |
| `<character>`  | 目标字符集，目前仅支持 `'gbk'`。                        |

## 返回值

返回转换编码后的 VARCHAR 值，可用于 ORDER BY 子句中按拼音顺序排序。

## 举例

```sql
SELECT * FROM class_test ORDER BY class_name;
```

```text
+----------+------------+-------------+
| class_id | class_name | student_ids |
+----------+------------+-------------+
|        6 | asd        | [6]         |
|        7 | qwe        | [7]         |
|        8 | z          | [8]         |
|        2 | 哈         | [2]         |
|        3 | 哦         | [3]         |
|        1 | 啊         | [1]         |
|        4 | 张         | [4]         |
|        5 | 我         | [5]         |
+----------+------------+-------------+
```

```sql
SELECT * FROM class_test ORDER BY CONVERT_TO(class_name, 'gbk');
```

```text
+----------+------------+-------------+
| class_id | class_name | student_ids |
+----------+------------+-------------+
|        6 | asd        | [6]         |
|        7 | qwe        | [7]         |
|        8 | z          | [8]         |
|        1 | 啊         | [1]         |
|        2 | 哈         | [2]         |
|        3 | 哦         | [3]         |
|        5 | 我         | [5]         |
|        4 | 张         | [4]         |
+----------+------------+-------------+
```