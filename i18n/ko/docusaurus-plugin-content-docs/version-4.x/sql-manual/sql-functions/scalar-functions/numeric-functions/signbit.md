---
{
    "title": "SIGNBIT",
    "language": "ko",
    "description": "주어진 부동 소수점 수의 부호 비트가 설정되어 있는지 확인합니다."
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

## 설명 {#description}

주어진 부동 소수점 수의 부호 비트가 설정되어 있는지 확인합니다.

## 구문 {#syntax}

```sql
SIGNBIT(<a>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<a>` | 부호 비트를 확인할 부동 소수점 수 |

## 반환 값 {#return-value}

`<a>`의 부호 비트가 설정되어 있으면(즉, `<a>`가 음수이면) true를 반환하고, 그렇지 않으면 false를 반환합니다.
특히 부동 소수점 수에서 양의 영과 음의 영도 구분할 수 있습니다.

## 예제 {#examples}

```sql
select signbit(-1.0);
```

```text
+---------------+
| signbit(-1.0) |
+---------------+
|             1 |
+---------------+
```

```sql
select signbit(0.0);
```

```text
+--------------+
| signbit(0.0) |
+--------------+
|            0 |
+--------------+
```

```sql
select signbit(1.0);
```

```text
+--------------+
| signbit(1.0) |
+--------------+
|            0 |
+--------------+
```

```sql
select signbit(cast('+0.0' as double)) , signbit(cast('-0.0' as double));
```

```text
+---------------------------------+---------------------------------+
| signbit(cast('+0.0' as double)) | signbit(cast('-0.0' as double)) |
+---------------------------------+---------------------------------+
|                               0 |                               1 |
+---------------------------------+---------------------------------+
```
