---
{
    "title": "AI_FILTER",
    "language": "ko",
    "description": "주어진 조건에 따라 텍스트를 필터링합니다."
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

주어진 조건에 따라 텍스트를 필터링합니다.

## 구문 {#syntax}

```sql
AI_FILTER([<resource_name>], <text>)
```

## 매개변수 {#parameters}

| 매개변수         | 설명                       |
|-------------------|-----------------------------------|
| `<resource_name>` | 지정할 리소스 이름(선택 사항) |
| `<text>`          | 평가할 정보   |

## 반환값 {#return-value}

불리언 값을 반환합니다.

입력 중 하나라도 NULL이면 NULL을 반환합니다.

결과는 대규모 언어 모델이 생성하므로 출력이 일정하지 않을 수 있습니다.

## 예제 {#example}

택배 회사가 받은 의견을 저장한 다음 테이블이 있다고 가정해 보겠습니다:
```sql
CREATE TABLE user_comments (
    id      INT,
    comment VARCHAR(500)
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "replication_num" = "1"
);
```

긍정적인 의견을 쿼리하려면 다음과 같이 사용할 수 있습니다:
```sql
SELECT id, comment FROM user_comments
WHERE AI_FILTER('resource_name', CONCAT('This is a positive comment: ', comment));
```

결과는 다음과 같을 수 있습니다:
```text
+------+--------------------------------------------+
| id   | comment                                    |
+------+--------------------------------------------+
|    1 | Absolutely fantastic, highly recommend it. |
|    3 | This product is amazing and I love it.     |
+------+--------------------------------------------+
```
