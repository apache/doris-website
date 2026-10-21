---
{
    "title": "AI_FIXGRAMMAR",
    "language": "ko",
    "description": "텍스트의 문법 오류를 수정하는 데 사용됩니다."
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

텍스트의 문법 오류를 수정하는 데 사용됩니다.

## 구문 {#syntax}

```sql
AI_FIXGRAMMAR([<resource_name>], <text>)
```

## 매개변수 {#parameters}

|    매개변수      | 설명                                 |
| ----------------- | ------------------------------------------- |
| `<resource_name>` | 지정할 리소스 이름(선택 사항)       |
| `<text>`          | 문법을 수정할 텍스트            |

## 반환 값 {#return-value}

문법을 수정한 텍스트 문자열을 반환합니다.

입력값 중 하나라도 NULL이면 NULL을 반환합니다.

결과는 대규모 언어 모델이 생성하므로 출력이 달라질 수 있습니다.

## 예제 {#examples}

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_FIXGRAMMAR('Apache Doris a great system DB') AS Result;
```
```text
+------------------------------------------+
| Result                                   |
+------------------------------------------+
| Apache Doris is a great database system. |
+------------------------------------------+
```

```sql
SELECT AI_FIXGRAMMAR('resource_name', 'I am like to using Doris') AS Result;
```
```text
+--------------------+
| Result             |
+--------------------+
| I like using Doris |
+--------------------+
```
