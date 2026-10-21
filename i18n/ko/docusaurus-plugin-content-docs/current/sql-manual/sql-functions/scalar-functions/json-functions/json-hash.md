---
{
    "title": "JSON_HASH",
    "language": "ko",
    "description": "JSONHASH는 JSON 객체의 해시 값을 계산합니다. 이 함수는 JSON 타입의 매개변수를 받아 BIGINT 해시 값을 반환합니다."
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

`JSON_HASH`는 JSON 객체의 해시 값을 계산합니다. 이 함수는 JSON 타입의 매개변수를 받아 BIGINT 해시 값을 반환합니다.

JSON 객체의 해시 값을 계산할 때는 먼저 객체의 키를 정렬합니다. 따라서 내용이 같고 키 순서만 다른 JSON 객체는 동일한 해시 값을 생성합니다.

## 구문 {#syntax}

```sql
JSON_HASH(json_value)
```

## 별칭 {#alias}

`JSONB_HASH`

## 매개변수 {#parameters}

**json_value** - 해시 값을 계산할 JSON 값입니다. JSON 타입이어야 합니다.

## 반환 값 {#return-value}

BIGINT 해시 값을 반환합니다.

입력이 NULL이면 NULL을 반환합니다.

## 사용법 {#usage}

JSON 표준에서는 JSON 객체의 키-값 쌍에 순서가 없다고 정의합니다. 따라서 서로 다른 시스템에서도 내용이 같은 JSON 객체를 일관되게 식별할 수 있도록, `JSON_HASH` 함수는 해시 값을 계산하기 전에 키-값 쌍을 정렬합니다. 이는 `SORT_JSON_OBJECT_KEYS` 함수를 호출하는 것과 유사합니다.

또한 Doris는 JSON 객체에 중복 키를 허용하지만, 해시 계산에서는 처음 나타나는 키-값 쌍만 고려합니다. 이러한 동작은 실제 애플리케이션의 사용 상황에 더 잘 맞습니다.

## 예제 {#examples}

1. 기본 해시 계산
```sql
SELECT json_hash(cast('123' as json));
```
```text
+--------------------------------+
| json_hash(cast('123' as json)) |
+--------------------------------+
|            5279066513252500087 |
+--------------------------------+
```

2. 별칭 함수 확인
```sql
SELECT json_hash(cast('123' as json)), jsonb_hash(cast('123' as json));
```
```text
+--------------------------------+---------------------------------+
| json_hash(cast('123' as json)) | jsonb_hash(cast('123' as json)) |
+--------------------------------+---------------------------------+
|            5279066513252500087 |             5279066513252500087 |
+--------------------------------+---------------------------------+
```
위 결과에서 `json_hash`와 `jsonb_hash` 함수는 동일한 입력에 대해 같은 해시 값을 생성합니다. 이를 통해 두 함수가 동일하게 동작하는 별칭 함수임을 확인할 수 있습니다.

3. 키 정렬 확인
```sql
SELECT 
    json_hash(cast('{"a":123, "b":456}' as json)), 
    json_hash(cast('{"b":456, "a":123}' as json));
```
```text
+-----------------------------------------------+-----------------------------------------------+
| json_hash(cast('{"a":123, "b":456}' as json)) | json_hash(cast('{"b":456, "a":123}' as json)) |
+-----------------------------------------------+-----------------------------------------------+
|                             82454694884268544 |                             82454694884268544 |
+-----------------------------------------------+-----------------------------------------------+
```
`json_hash` 함수는 해시 값을 계산하기 전에 키를 정렬하므로 키 순서와 관계없이 동일한 해시 값을 생성합니다.

4. 중복 키 처리
```sql
SELECT 
    json_hash(cast('{"a":123}' as json)), 
    json_hash(cast('{"a":456}' as json)), 
    json_hash(cast('{"a":123, "a":456}' as json));
```
```text
+--------------------------------------+--------------------------------------+-----------------------------------------------+
| json_hash(cast('{"a":123}' as json)) | json_hash(cast('{"a":456}' as json)) | json_hash(cast('{"a":123, "a":456}' as json)) |
+--------------------------------------+--------------------------------------+-----------------------------------------------+
|                 -7416836614234106918 |                 -3126362109586887012 |                          -7416836614234106918 |
+--------------------------------------+--------------------------------------+-----------------------------------------------+
```
JSON 객체에 중복 키(`{"a":123, "a":456}`)가 있으면 `json_hash` 함수는 해시 계산 시 첫 번째 키-값 쌍만 고려합니다. 위 결과처럼 중복 키가 있는 JSON 객체의 해시 값은 첫 번째 키-값 쌍만 포함하는 객체 `{"a":123}`의 해시 값과 같습니다.

5. 서로 다른 숫자 타입 처리
```sql
SELECT 
    json_hash(to_json(cast('123' as int))), 
    json_hash(to_json(cast('123' as tinyint)));
```
```text
+----------------------------------------+--------------------------------------------+
| json_hash(to_json(cast('123' as int))) | json_hash(to_json(cast('123' as tinyint))) |
+----------------------------------------+--------------------------------------------+
|                    7882559133986259892 |                        5279066513252500087 |
+----------------------------------------+--------------------------------------------+
```
같은 숫자 값 123도 JSON에 서로 다른 타입(int와 tinyint)으로 저장되면 해시 값이 달라집니다. Doris의 JSON 구현은 타입 정보를 보존하며, 해시 계산에 이러한 타입 차이를 반영하기 때문입니다.

6. normalize_json_numbers_to_double을 사용한 타입 통일
```sql
SELECT 
    json_hash(normalize_json_numbers_to_double(to_json(cast('123' as int)))), 
    json_hash(normalize_json_numbers_to_double(to_json(cast('123' as tinyint))));
```
```text
+--------------------------------------------------------------------------+------------------------------------------------------------------------------+
| json_hash(normalize_json_numbers_to_double(to_json(cast('123' as int)))) | json_hash(normalize_json_numbers_to_double(to_json(cast('123' as tinyint)))) |
+--------------------------------------------------------------------------+------------------------------------------------------------------------------+
|                                                      4028523408277343359 |                                                          4028523408277343359 |
+--------------------------------------------------------------------------+------------------------------------------------------------------------------+
```
이 예제는 위 문제를 해결하는 방법을 보여 줍니다. `normalize_json_numbers_to_double` 함수를 사용하여 모든 숫자 값을 먼저 배정밀도 부동소수점 타입으로 변환한 다음 해시 값을 계산합니다. 이렇게 하면 원래 숫자 타입과 관계없이 일관된 해시 값을 얻을 수 있습니다.

7. NULL 값 처리
```sql
SELECT json_hash(null);
```
```text
+-----------------+
| json_hash(null) |
+-----------------+
|            NULL |
+-----------------+
```

## 참고 사항 {#notes}

1. `JSON_HASH` 함수의 별칭은 `JSONB_HASH`이며, 두 함수의 기능은 동일합니다.

2. 이 함수는 해시 값을 계산하기 전에 JSON 객체의 키를 정렬합니다. 이는 `SORT_JSON_OBJECT_KEYS` 함수를 호출하는 것과 유사합니다.

3. JSON 객체에 중복 키가 있으면 해시 계산 시 처음 나타나는 키-값 쌍만 고려합니다.

4. Doris의 JSON은 숫자를 다양한 타입(int, tinyint, bigint, float, double, decimal)으로 저장할 수 있으므로, 같은 숫자 값이라도 타입이 다르면 해시 값이 달라질 수 있습니다. 일관된 결과가 필요하면 `NORMALIZE_JSON_NUMBERS_TO_DOUBLE` 함수를 사용하여 모든 숫자 값을 동일한 타입으로 변환한 후 해시 값을 계산할 수 있습니다.

5. 텍스트 파싱으로 JSON 객체를 생성할 때(예: `CAST`를 사용하여 문자열을 JSON으로 변환할 때) Doris는 저장에 적합한 숫자 타입을 자동으로 선택합니다. 따라서 일반적으로 숫자 타입의 불일치를 걱정할 필요가 없습니다.

6. "123"을 `cast/to_json`으로 직접 JSON 객체로 변환하지 않고 텍스트 변환(문자열에서 JSON 객체 파싱)을 사용하면, Doris는 "123"을 tinyint 타입의 JSON 객체로만 저장합니다. 따라서 "123"이 int 타입과 tinyint 타입으로 모두 저장되는 상황은 발생하지 않습니다.
