---
{
    "title": "AI_GENERATE",
    "language": "ko",
    "description": "입력 프롬프트 텍스트를 바탕으로 응답을 생성합니다."
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

입력 프롬프트 텍스트를 바탕으로 응답을 생성합니다.

## 구문 {#syntax}

```sql
AI_GENERATE([<resource_name>], <prompt>)
```

## 매개변수 {#parameters}

|    매개변수      | 설명                                      |
| ----------------- | ------------------------------------------------|
| `<resource_name>` | 사용할 리소스 이름으로, 생략할 수 있습니다            |
| `<prompt>`        | AI의 생성을 유도하는 데 사용할 프롬프트 텍스트 |

## 반환 값 {#return-value}

프롬프트를 바탕으로 생성된 텍스트 내용을 반환합니다.

입력값 중 하나라도 NULL이면 NULL을 반환합니다.

결과는 대규모 언어 모델이 생성하므로 출력이 달라질 수 있습니다.

## 예제 {#examples}

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_GENERATE('Describe Apache Doris in a few words') AS Result;
```
```text
+---------------------------------------------------------+
| Result                                                  |
+---------------------------------------------------------+
| "Apache Doris is a fast, real-time analytics database." |
+---------------------------------------------------------+
```

```sql
SELECT AI_GENERATE('resource_name', 'What is the founding time of Apache Doris? Return only the date.') AS Result;
```
```text
+--------+
| Result |
+--------+
| 2017   |
+--------+
```
