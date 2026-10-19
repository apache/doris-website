---
{
    "title": "EVEN",
    "language": "ko",
    "description": "영에서 멀어지는 방향으로 다음 짝수가 되도록 올림하거나 내림합니다."
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

영에서 멀어지는 방향으로 다음 짝수가 되도록 올림하거나 내림합니다.

## 구문 {#syntax}

```sql
EVEN(<a>)
```


## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<a>` | 다음 짝수 정수로 올림하거나 내림할 숫자 표현식 |

## 반환 값 {#return-value}

다음 규칙에 따라 짝수 정수를 반환합니다:

- x > 0이면 가장 가까운 짝수로 올림합니다.
- x < 0이면 가장 가까운 짝수로 내림합니다.
- x가 이미 짝수이면 그대로 반환합니다.
- x가 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
select even(2.9);
```

```text
+-----------+
| even(2.9) |
+-----------+
|         4 |
+-----------+
```

```sql
select even(-2.9);
```

```text
+------------+
| even(-2.9) |
+------------+
|         -4 |
+------------+
```

```sql
select even(4);
```

```text
+---------+
| even(4) |
+---------+
|       4 |
+---------+
```

```sql
select even(NULL);
```

```text
+------------+
| even(NULL) |
+------------+
|       NULL |
+------------+
```
