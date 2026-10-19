---
{
    "title": "AI_CLASSIFY",
    "language": "ko",
    "description": "텍스트를 지정된 레이블 집합으로 분류하는 데 사용됩니다."
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

텍스트를 지정된 레이블 집합으로 분류하는 데 사용됩니다.

## 구문 {#syntax}

```sql
AI_CLASSIFY([<resource_name>], <text>, <labels>)
```

## 매개변수 {#parameters}

|    매개변수      | 설명                                 |
| ----------------- | ------------------------------------------- |
| `<resource_name>` | 사용할 리소스 이름, 선택 사항       |
| `<text>`          | 분류할 텍스트                   |
| `<labels>`        | 분류 레이블 배열              |

## 반환값 {#return-value}

텍스트에 가장 잘 맞는 레이블 하나를 반환합니다.

입력값 중 하나라도 NULL이면 NULL을 반환합니다.

결과는 대규모 언어 모델로 생성되므로 출력이 달라질 수 있습니다.

## 예제 {#examples}

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_CLASSIFY('Apache Doris is a databases system.', ['usage', 'introduce']) AS Result;
```
```text
+-----------+
| Result    |
+-----------+
| introduce |
+-----------+
```

```sql
SELECT AI_CLASSIFY('resource_name', 'Apache Doris is developing rapidly.', ['science', 'sport']) AS Result;
```
```text
+---------+
| Result  |
+---------+
| science |
+---------+
```
