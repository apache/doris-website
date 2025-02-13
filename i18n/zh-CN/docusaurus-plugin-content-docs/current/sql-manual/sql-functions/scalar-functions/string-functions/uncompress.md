---
{
    "title": "UNCOMPRESS",
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
UNCOMPRESS 函数用于将二进制数据解压缩成字符串或值，你需要确保二进制数据需要是`COMPRESS`的结果。

## 语法

```sql
UNCOMPRESS(<compressed_str>)
```

## 参数

| 参数                | 说明            |
|--------------------|---------------|
| `<compressed_str>` | 压缩得到的二进制数据, 参数类型是varchar或者string |

## 返回值

返回值与输入的 `compressed_str` 类型一致

特殊情况：
- `compressed_str` 输入不是`COMPRESS`得到的二进制数据时, 返回 NULL.


## 举例

``` sql
select uncompress(compress('abc'));
```
```text 
+-----------------------------+
| uncompress(compress('abc')) |
+-----------------------------+
| abc                         |
+-----------------------------+
```
```sql
select uncompress(compress(''));
```
```text 
+--------------------------+
| uncompress(compress('')) |
+--------------------------+
|                          |
+--------------------------+
```
```sql
select uncompress(compress(abc));
```
```text 
+-------------------+
| uncompress('abc') |
+-------------------+
| NULL              |
+-------------------+
```