---
{
    "title": "AI_MASK",
    "language": "ko",
    "description": "텍스트에서 지정된 레이블에 해당하는 민감한 정보를 마스킹하는 데 사용됩니다."
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

텍스트에서 지정된 레이블에 해당하는 민감한 정보를 마스킹하는 데 사용됩니다.

## 구문 {#syntax}

```sql
AI_MASK([<resource_name>], <text>, <labels>)
```

## 매개변수 {#parameters}

|    매개변수      | 설명                                                      |
| ----------------- | ---------------------------------------------------------------- |
| `<resource_name>` | 지정된 리소스 이름                                      |
| `<text>`          | 민감한 정보가 포함될 수 있는 텍스트                  |
| `<labels>`        | 마스킹할 레이블의 배열. 예: `ARRAY('name', 'phone', 'email')` |

## 반환값 {#return-value}

민감한 정보를 마스킹한 텍스트를 반환합니다. 마스킹된 부분은 "[MASKED]"로 대체됩니다.

입력값 중 하나라도 NULL이면 NULL을 반환합니다.

결과는 대규모 언어 모델이 생성하므로 출력이 달라질 수 있습니다.

## 예제 {#examples}

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_MASK('Wccccat is a 20-year-old Doris community contributor.', ['name', 'age']) AS Result;
```
```text
+-----------------------------------------------------+
| Result                                              |
+-----------------------------------------------------+
| [MASKED] is a [MASKED] Doris community contributor. |
+-----------------------------------------------------+
```

```sql
SELECT AI_MASK('resource_name', 'My email is rarity@example.com and my phone is 123-456-7890',
                ['email', 'phone_num']) AS RESULT;
```

```text
+-----------------------------------------------+
| RESULT                                        |
+-----------------------------------------------+
| My email is [MASKED] and my phone is [MASKED] |
+-----------------------------------------------+
```
