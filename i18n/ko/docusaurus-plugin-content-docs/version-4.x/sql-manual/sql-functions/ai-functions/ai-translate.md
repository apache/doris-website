---
{
    "title": "AI_TRANSLATE",
    "language": "ko",
    "description": "텍스트를 지정한 언어로 번역합니다."
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

텍스트를 지정한 언어로 번역합니다.

## 구문 {#syntax}

```sql
AI_TRANSLATE([<resource_name>], <text>, <target_language>)
```

## 매개변수 {#parameters}

|    매개변수      | 설명             |
| ----------------- | ---------------------- |
| `<resource_name>` | 지정한 리소스 이름 |
| `<text>`          | 번역할 텍스트  |
| `<target_language>` | 번역 대상 언어   |

## 반환값 {#return-value}

번역된 텍스트 문자열을 반환합니다.

입력값 중 하나라도 NULL이면 NULL을 반환합니다.

결과는 대규모 언어 모델이 생성하므로 출력이 달라질 수 있습니다.

## 예제 {#examples}

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_TRANSLATE('In my mind, doris is the best databases management system.', 'zh-CN') AS Result;
```
```text
+----------------------------------------------------------------+
| Result                                                         |
+----------------------------------------------------------------+
| 在我心目中，Doris是最优秀的数据库管理系统。                    |
+----------------------------------------------------------------+
```

```sql
SELECT AI_Translate('resource_name', 'This is an example', 'French') AS Result;
```
```text
+------------------+
| Result           |
+------------------+
| Voici un exemple |
+------------------+
```
