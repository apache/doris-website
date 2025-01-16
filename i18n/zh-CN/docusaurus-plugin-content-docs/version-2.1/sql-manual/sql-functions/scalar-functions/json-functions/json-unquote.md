---
{
    "title": "JSON_UNQUOTE",
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
这个函数将去掉 JSON 值中的引号，并将结果作为 utf8mb4 字符串返回。如果参数为 NULL，则返回 NULL。

在字符串中显示的如下转义序列将被识别，对于所有其他转义序列，反斜杠将被忽略。

| 转义序列 | 序列表示的字符                |
|----------|-------------------------------|
| \"       | 双引号 "                      |
| \b       | 退格字符                      |
| \f       | 换页符                        |
| \n       | 换行符                        |
| \r       | 回车符                        |
| \t       | 制表符                        |
| \\       | 反斜杠 \                      |
| \uxxxx   | Unicode 值 XXXX 的 UTF-8 字节 |


## 语法
```sql
JSON_UNQUOTE(<a>)
```

## 参数
| 参数 | 描述                                                     |
|------|--------------------------------------------------------|
| `<a>` | 要去除引号的元素。 |

## 返回值
返回一个 utf8mb4 字符串。特殊情况如下：
* 如果传入的参数为 NULL，返回 NULL。
* 如果传入的参数不是一个带有双引号的值，则会返回值本身。
* 如果传入的参数不是一个字符串，则会被自动转换为字符串后，返回值本身。

## 举例
```sql
SELECT json_unquote('"doris"');
```

```text
+-------------------------+
| json_unquote('"doris"') |
+-------------------------+
| doris                   |
+-------------------------+
```
```sql
SELECT json_unquote('[1, 2, 3]');
```
```text
+---------------------------+
| json_unquote('[1, 2, 3]') |
+---------------------------+
| [1, 2, 3]                 |
+---------------------------+
```
```sql
SELECT json_unquote(null);
```
```text
+--------------------+
| json_unquote(NULL) |
+--------------------+
| NULL               |
+--------------------+
```
```sql
SELECT json_unquote('"\\ttest"');
```
```text
+--------------------------+
| json_unquote('"\ttest"') |
+--------------------------+
|       test                    |
+--------------------------+
```
```sql
select json_unquote('"doris');
```
```text
+------------------------+
| json_unquote('"doris') |
+------------------------+
| "doris                 |
+------------------------+
```
```sql
select json_unquote('doris');
```
```text
+-----------------------+
| json_unquote('doris') |
+-----------------------+
| doris                 |
+-----------------------+
```
```sql
select json_unquote(1);
```
```text
+-----------------------------------------+
| json_unquote(cast(1 as VARCHAR(65533))) |
+-----------------------------------------+
| 1                                       |
+-----------------------------------------+
```