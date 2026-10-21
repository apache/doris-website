---
{
    "title": "AI_SIMILARITY",
    "language": "ko",
    "description": "두 텍스트 간의 의미적 유사도를 판단합니다."
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

두 텍스트 간의 의미적 유사도를 판단합니다.

## 구문 {#syntax}

```sql
AI_SIMILARITY([<resource_name>], <text_1>, <text_2>)
```

## 매개변수 {#parameters}

| 매개변수         | 설명                |
|-------------------|---------------------------|
| `<resource_name>` | 지정한 리소스 이름 |
| `<text_1>`        | 텍스트                      |
| `<text_2>`        | 텍스트                      |

## 반환 값 {#return-value}

0에서 10 사이의 부동 소수점 수를 반환합니다. 0은 유사성이 없음을, 10은 유사성이 높음을 의미합니다.

입력값 중 하나라도 NULL이면 NULL을 반환합니다.

결과는 대규모 언어 모델이 생성하므로 출력이 일정하지 않을 수 있습니다.

## 예제 {#example}

택배 회사가 받은 고객 의견을 나타내는 다음 테이블이 있다고 가정해 보겠습니다:
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

고객의 감정에 따라 의견의 순위를 매기려면 다음과 같이 사용할 수 있습니다:
```sql
SELECT comment,
    AI_SIMILARITY('resource_name', 'I am extremely dissatisfied with their service.', comment) AS score
FROM user_comments ORDER BY score DESC LIMIT 5;
```

쿼리 결과는 다음과 같을 수 있습니다:
```text
+-------------------------------------------------+-------+
| comment                                         | score |
+-------------------------------------------------+-------+
| It arrived broken and I am really disappointed. |   7.5 |
| Delivery was very slow and frustrating.         |   6.5 |
| Not bad, but the packaging could be better.     |   3.5 |
| It is fine, nothing special to mention.         |     3 |
| Absolutely fantastic, highly recommend it.      |     1 |
+-------------------------------------------------+-------+
```
