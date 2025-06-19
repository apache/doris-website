---
{
    "title": "JSON_OBJECT",
    "language": "en"
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

## Description
Generate a json object containing the specified Key-Value,
an exception error is returned when Key is NULL or the number of parameters are odd.

## Syntax
```sql
JSON_OBJECT (<key>, <value>[,<key>, <value>, ...])
```

## Parameters

| Parameter      | Description                                       |
|---------|------------------------------------------|
| `<key>`   | The Key value in the Key-Value of the generated json object.   |
| `<value>` | The Value value in the Key-Value of the generated json object. |                                                                                                  |

## Usage Notes

- By convention, the argument list consists of alternating keys and values. 
- Key arguments are coerced to text.
- Value arguments are converted as per can convert to json, now we support array/struct/map/json as value.

## Return Values
Return a json object. Special cases are as follows:
* If no parameters are passed, return an empty json object.
* If the number of parameters passed is odd, return an exception error.
* If the passed Key is NULL, return an exception error.
* If the passed Value is NULL, the Value value of the Key-Value pair in the returned json object is NULL.

## Examples

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

