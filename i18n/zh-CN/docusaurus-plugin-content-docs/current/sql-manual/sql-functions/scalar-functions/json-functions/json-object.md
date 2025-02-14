---
{
    "title": "JSON_OBJECT",
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

生成一个或者多个包含指定 Key-Value 对的 json object, 当 Key 值为 NULL 或者传入参数为奇数个时，返回异常错误。

## 语法

```sql
JSON_OBJECT (<key>, <value>[,<key>, <value>, ...])
```

## 参数

| 参数      | 描述                                       |
|---------|------------------------------------------|
| `<key>`   | 指定生成的 json object 的 Key-Value 中的 Key 值   |
| `<value>` | 指定生成的 json object 的 Key-Value 中的 Value 值 |

## 注意事项

- 按照惯例，参数列表由交替的键和值组成。
- Key 按照JSON 定义强制转换为文本。
- Value 参数按照可以转换为 json 的方式进行转换，现在我们支持 array/struct/map/json 作为值

## 返回值

返回一个 json object。特殊情况如下：
* 如果没有传入参数，返回一个空的 json object。
* 如果传入的参数个数为奇数个，返回异常错误。
* 如果传入的 Key 为 NULL，返回异常错误。
* 如果传入的 Value 为 NULL，返回的 json object 中该 Key-Value 对的 Value 值为 NULL。

## 示例

```sql
select json_object();
```
```text
+---------------+
| json_object() |
+---------------+
| {}            |
+---------------+
```
```sql
select json_object('time',curtime());
```
```text
+--------------------------------+
| json_object('time', curtime()) |
+--------------------------------+
| {"time": "10:49:18"}           |
+--------------------------------+
```
```sql
SELECT json_object('id', 87, 'name', 'carrot');
```
```text
+-----------------------------------------+
| json_object('id', 87, 'name', 'carrot') |
+-----------------------------------------+
| {"id": 87, "name": "carrot"}            |
+-----------------------------------------+
```
```sql
select json_object('username',null);
```
```text
+---------------------------------+
| json_object('username', 'NULL') |
+---------------------------------+
| {"username": NULL}              |
+---------------------------------+
```
```sql
select json_object(null,null);
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = json_object key can't be NULL: json_object(NULL)
```
```sql
-- support array as object value
SELECT json_object('id', 1, 'level', array('"aaa"','"bbb"'));
```
```text
+------------------------------------------------------------------------------------------------------+
| json_object('id', cast(1 as VARCHAR(65533)), 'level', cast(array('"aaa"', '"bbb"') as JSON), '6267') |
+------------------------------------------------------------------------------------------------------+
| {"id":1,"level":["\"aaa\"","\"bbb\""]}                                                               |
+------------------------------------------------------------------------------------------------------+
```
```sql
-- support map as object value
SELECT json_object('id', 1, 'level', map('a', 'b', 'c', 'd'));
```
```text
+------------------------------------------------------------------------------------------------------+
| json_object('id', cast(1 as VARCHAR(65533)), 'level', cast(map('a', 'b', 'c', 'd') as JSON), '6267') |
+------------------------------------------------------------------------------------------------------+
| {"id":1,"level":{"a":"b","c":"d"}}                                                                   |
+------------------------------------------------------------------------------------------------------+
```
```sql
-- support struct as object value
SELECT json_object('id', 1, 'level', named_struct('name', 'a', 'age', 1));
```
```text
+------------------------------------------------------------------------------------------------------------------+
| json_object('id', cast(1 as VARCHAR(65533)), 'level', cast(named_struct('name', 'a', 'age', 1) as JSON), '6267') |
+------------------------------------------------------------------------------------------------------------------+
| {"id":1,"level":{"name":"a","age":1}}                                                                            |
+------------------------------------------------------------------------------------------------------------------+
```
```sql
-- support json as object value
SELECT json_object('id', 1, 'level', cast('{\"a\":\"b\"}' as JSON));
```
```text
+------------------------------------------------------------------------------------------+
| json_object('id', cast(1 as VARCHAR(65533)), 'level', cast('{"a":"b"}' as JSON), '6267') |
+------------------------------------------------------------------------------------------+
| {"id":1,"level":{"a":"b"}}                                                               |
+------------------------------------------------------------------------------------------+
```
