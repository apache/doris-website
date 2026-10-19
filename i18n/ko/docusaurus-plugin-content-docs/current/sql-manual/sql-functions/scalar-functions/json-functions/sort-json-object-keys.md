---
{
    "title": "SORT_JSON_OBJECT_KEYS",
    "language": "ko",
    "description": "SORTJSONOBJECTKEYS는 JSON 객체의 키를 정렬합니다. 이 함수는 JSON 객체를 입력받아 키가 정렬된 새 JSON 객체를 반환합니다."
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

`SORT_JSON_OBJECT_KEYS`는 JSON 객체의 키를 정렬합니다. 이 함수는 JSON 객체를 입력받아 키가 사전순으로 정렬된 새 JSON 객체를 반환합니다.

JSON 표준에 따르면 JSON 객체는 순서가 없는 컬렉션입니다. 하지만 두 JSON 객체의 내용이 동일한지 비교하는 경우처럼 키 순서의 일관성을 보장해야 할 때 이 함수가 유용합니다.

## 구문 {#syntax}

```sql
SORT_JSON_OBJECT_KEYS(json_value)
```

## 별칭 {#alias}

SORT_JSONB_OBJECT_KEYS

## 매개변수 {#parameters}

**json_value** - 키를 정렬할 JSON 값입니다. JSON 타입이어야 합니다.

## 반환 값 {#return-value}

키가 사전순으로 정렬된 새 JSON 객체를 반환합니다. 반환 타입은 입력 JSON 타입과 같습니다.

입력이 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

### 기본적인 키 정렬 {#basic-key-sorting}

```sql
SELECT sort_json_object_keys(cast('{"b":123,"b":456,"a":789}' as json));
```

```text
+------------------------------------------------------------------+
| sort_json_object_keys(cast('{"b":123,"b":456,"a":789}' as json)) |
+------------------------------------------------------------------+
| {"a":789,"b":123}                                                |
+------------------------------------------------------------------+
```

### 중첩된 JSON 배열 처리 {#handling-nested-json-arrays}

```sql
SELECT sort_json_object_keys(cast('[{"b":123,"b":456,"a":789},{"b":123},{"b":456},{"a":789}]' as json));
```

```text
+----------------------------------------------------------------------------------------------------+
| sort_json_object_keys(cast('[{"b":123,"b":456,"a":789} ,{"b":123},{"b":456},{"a":789} ]' as json)) |
+----------------------------------------------------------------------------------------------------+
| [{"a":789,"b":123},{"b":123},{"b":456},{"a":789}]                                                  |
+----------------------------------------------------------------------------------------------------+
```

### NULL 값 처리 {#handling-null-values}

```sql
SELECT sort_json_object_keys(null);
```

```text
+-----------------------------+
| sort_json_object_keys(null) |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

## 참고 사항 {#notes}

1. `SORT_JSON_OBJECT_KEYS` 함수에는 `SORT_JSONB_OBJECT_KEYS`라는 별칭이 있으며, 두 함수의 기능은 동일합니다.

2. 이 함수는 객체의 키만 정렬하며, 각 키에 연결된 값은 변경하지 않습니다.

3. 표준에서 배열은 순서가 있는 컬렉션으로 정의하므로, 이 함수는 객체만 정렬하고 배열은 정렬하지 않습니다.

4. JSON 객체의 중복 키는 Doris JSON 타입으로 변환될 때 병합되며, 첫 번째 키-값 쌍만 유지됩니다.

5. Doris JSON 타입은 기본적으로 키 순서를 보장하지 않으므로, 이 함수는 주로 비교나 디버깅을 위해 JSON 객체의 키를 일관된 순서로 표시하는 데 사용됩니다.
