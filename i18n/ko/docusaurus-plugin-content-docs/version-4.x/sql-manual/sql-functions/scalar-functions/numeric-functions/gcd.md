---
{
    "title": "GCD",
    "language": "ko",
    "description": "두 정수의 최대공약수(GCD)를 계산합니다."
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

두 정수의 최대공약수(GCD)를 계산합니다.

## 구문 {#syntax}

```sql
GCD(<a>, <b>)
```


## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<a>` | 첫 번째 정수 |
| `<b>` | 두 번째 정수 |

## 반환 값 {#return-value}

`<a>`와 `<b>`의 최대공약수를 반환합니다.
입력값 중 하나라도 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
select gcd(54, 24);
```

```text
+------------+
| gcd(54,24) |
+------------+
|          6 |
+------------+
```

```sql
select gcd(-17, 31);
```

```text
+--------------+
| gcd(-17,31)  |
+--------------+
|            1 |
+--------------+
```

```sql
select gcd(0, 10);
```

```text
+-----------+
| gcd(0,10) |
+-----------+
|        10 |
+-----------+
```

```sql
select gcd(54, NULL);
```

```text
+---------------+
| gcd(54, NULL) |
+---------------+
|          NULL |
+---------------+
```
