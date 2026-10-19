---
{
    "title": "AI_EXTRACT",
    "language": "ko",
    "description": "텍스트에서 특정 레이블에 해당하는 정보를 추출하는 데 사용합니다."
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

텍스트에서 특정 레이블에 해당하는 정보를 추출하는 데 사용합니다.

## 구문 {#syntax}

```sql
AI_EXTRACT([<resource_name>], <text>, <labels>)
```

## 매개변수 {#parameters}

|    매개변수      | 설명                                  |
| ----------------- | -------------------------------------------- |
| `<resource_name>` | 지정할 리소스 이름. 선택 사항입니다.        |
| `<text>`          | 정보를 추출할 텍스트   |
| `<labels>`        | 추출할 레이블의 배열                   |

## 반환값 {#return-value}

추출한 모든 레이블과 해당 값을 포함하는 문자열을 반환합니다.

입력값 중 하나라도 NULL이면 NULL을 반환합니다.

결과는 대규모 언어 모델이 생성하므로 출력이 달라질 수 있습니다.

## 예제 {#examples}

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_EXTRACT('Apache Doris is an MPP-based real-time data warehouse known for its high query speed.', 
                  ['product_name', 'architecture', 'key_feature']) AS Result;
```
```text
+---------------------------------------------------------------------------------------+
| Result                                                                                |
+---------------------------------------------------------------------------------------+
| product_name="Apache Doris", architecture="MPP-based", key_feature="high query speed" |
+---------------------------------------------------------------------------------------+
```

```sql
SELECT AI_EXTRACT('resource_name', 'Apache Doris began in 2008 as an internal project named Palo.',
                  ['original name', 'founding time']) AS Result;
```
```text
+----------------------------------------+
| Result                                 |
+----------------------------------------+
| original name=Palo, founding time=2008 |
+----------------------------------------+
```
