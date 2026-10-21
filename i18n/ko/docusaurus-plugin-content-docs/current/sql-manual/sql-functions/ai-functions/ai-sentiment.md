---
{
    "title": "AI_SENTIMENT",
    "language": "ko",
    "description": "텍스트의 감정을 분석하는 데 사용됩니다."
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

텍스트의 감정을 분석하는 데 사용됩니다.

## 구문 {#syntax}

```sql
AI_SENTIMENT([<resource_name>], <text>)
```

## 매개변수 {#parameters}

|    매개변수      | 설명                |
| ----------------- | ------------------------- |
| `<resource_name>` | 지정한 리소스 이름|
| `<text>`          | 감정을 분석할 텍스트 |

## 반환 값 {#return-value}

감정 분석 결과를 반환합니다. 가능한 값은 다음과 같습니다:
- positive
- negative
- neutral
- mixed

입력값 중 하나라도 NULL이면 NULL을 반환합니다.

결과는 대규모 언어 모델이 생성하므로 출력이 달라질 수 있습니다.

## 예제 {#examples}

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_SENTIMENT('Apache Doris is a great DB system.') AS Result;
```
```text
+----------+
| Result   |
+----------+
| positive |
+----------+
```

```sql
SELECT AI_SENTIMENT('resource_name', 'I hate sunny days.') AS Result;
```
```text
+----------+
| Result   |
+----------+
| negative |
+----------+
```
