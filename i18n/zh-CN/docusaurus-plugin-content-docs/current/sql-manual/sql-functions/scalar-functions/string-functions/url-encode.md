---
{
    "title": "URL_ENCODE",
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

使用 UTF-8 编码完成所提供文本的 URL 编码。通常用于对作为 URL 的一部分传递的参数信息进行编码

## 语法

```sql
URL_ENCODE(  <str>  ) 
```

## 必选参数

| 参数 | 描述 |
|------|------|
| `<str>` | 待编码的字符串 |

## 返回值

UTF-8 编码完成所提供文本的 URL 编码

## 示例

```sql
select  URL_ENCODE('Doris Q&A');
```

```sql
+-------------------------+
| url_encode('Doris Q&A') |
+-------------------------+
| Doris+Q%26A             |
+-------------------------+

```

