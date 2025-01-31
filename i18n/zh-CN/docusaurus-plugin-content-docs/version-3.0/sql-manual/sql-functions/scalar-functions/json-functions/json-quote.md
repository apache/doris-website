---
{
    "title": "JSON_QUOTE",
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
将 json_value 用双引号（"）括起来，跳过其中包含的特殊转义字符。

## 语法
```sql
JSON_QUOTE (<a>)
```

## 参数
| 参数 | 描述                  |
|------|---------------------|
| `<a>` | 要括起来的 json_value 的值 |


## 返回值
返回一个 json_value。特殊情况如下：
* 如果传入的参数为 NULL，返回 NULL。

## 举例

```sql
SELECT json_quote('null'), json_quote('"null"');
```

```text
+--------------------+----------------------+
| json_quote('null') | json_quote('"null"') |
+--------------------+----------------------+
| "null"             | "\"null\""           |
+--------------------+----------------------+
```

```sql
SELECT json_quote('[1, 2, 3]');
```
```text
+-------------------------+
| json_quote('[1, 2, 3]') |
+-------------------------+
| "[1, 2, 3]"             |
+-------------------------+
```
```sql
SELECT json_quote(null);
```
```text
+------------------+
| json_quote(null) |
+------------------+
| NULL             |
+------------------+
```

```sql
select json_quote("\n\b\r\t");
```
```text
+------------------------+
| json_quote('\n\b\r\t') |
+------------------------+
| "\n\b\r\t"             |
+------------------------+
```
