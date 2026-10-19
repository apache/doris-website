---
{
    "title": "LCM",
    "language": "ko",
    "description": "두 정수의 최소공배수(LCM)를 계산합니다. 결과에 오버플로가 발생할 수 있습니다."
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

두 정수의 최소공배수(LCM)를 계산합니다. 결과에 오버플로가 발생할 수 있습니다.

## 구문 {#syntax}

```sql
LCM(<a>, <b>)
```


## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<a>` | 첫 번째 정수 |
| `<b>` | 두 번째 정수 |

## 반환 값 {#return-value}

`<a>`와 `<b>`의 최소공배수를 반환합니다.
입력값 중 하나라도 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
select lcm(12, 18);
```

```text
+------------+
| lcm(12,18) |
+------------+
|         36 |
+------------+
```

```sql
select lcm(0, 10);
```

```text
+-----------+
| lcm(0,10) |
+-----------+
|         0 |
+-----------+
```

```sql
select lcm(-4, 6);
```

```text
+-----------+
| lcm(-4,6) |
+-----------+
|        12 |
+-----------+
```

```sql
select lcm(-170141183460469231731687303715884105728, 3);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not convert to legacy literal: 510423550381407695195061911147652317184
```

```sql
select lcm(-4, NULL);
```

```text
+---------------+
| lcm(-4, NULL) |
+---------------+
|          NULL |
+---------------+
```
