---
{
    "title": "NORMALIZE_JSON_NUMBERS_TO_DOUBLE",
    "language": "ko",
    "description": "NORMALIZEJSONNUMBERSTODOUBLE 함수는 JSON의 모든 숫자 값을 배정밀도 부동소수점 타입으로 변환합니다."
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

`NORMALIZE_JSON_NUMBERS_TO_DOUBLE` 함수는 JSON의 모든 숫자 값을 배정밀도 부동소수점 타입으로 변환합니다. 이 함수는 JSON 값을 입력받아 모든 숫자 타입을 배정밀도 값으로 변환한 새 JSON 값을 반환합니다.

## 구문 {#syntax}

```sql
NORMALIZE_JSON_NUMBERS_TO_DOUBLE(json_value)
```

## 별칭 {#alias}

`NORMALIZE_JSONB_NUMBERS_TO_DOUBLE`

## 매개변수 {#parameters}

**json_value** - 처리할 JSON 값입니다. JSON 타입이어야 합니다.

## 반환 값 {#return-value}

모든 숫자 타입을 배정밀도 부동소수점(double) 타입으로 변환한 새 JSON 값을 반환합니다.

입력이 NULL이면 함수는 NULL을 반환합니다.

## 용도 {#purpose}

JSON 표준은 Number의 내부 타입을 지정하지 않으므로, 대부분의 시스템은 IEEE 754-2008 표준의 64비트 이진(배정밀도) 부동소수점 수를 기반으로 Number 타입을 구현합니다(C++의 double 타입 등).
데이터의 정확성을 보장하기 위해 Doris는 Number 타입을 더 세분화하여 Int128 및 DECIMAL과 같이 정밀도가 더 높은 타입을 지원합니다.
하지만 이로 인해 다른 시스템과 결과가 달라질 수 있습니다.

예를 들어 다음 JSON 문자열이 있다고 가정합니다:
```text
'{"abc": 18446744073709551616}'
```

MySQL과 같이 JSON Number의 내부 타입으로 Double을 사용하는 시스템에서는 다음 결과를 얻습니다:
```text
+-----------------------------------------------+
| cast('{"abc": 18446744073709551616}' as json) |
+-----------------------------------------------+
| {"abc": 1.8446744073709552e19}                |
+-----------------------------------------------+
```

하지만 Doris의 JSON Number는 정밀도가 더 높은 타입을 지원하므로 다음 결과를 반환합니다:
```text
+-----------------------------------------------+
| cast('{"abc": 18446744073709551616}' as json) |
+-----------------------------------------------+
| {"abc":18446744073709551616}                  |
+-----------------------------------------------+
```

다른 시스템과의 호환성을 확보하려면 `NORMALIZE_JSON_NUMBERS_TO_DOUBLE`을 사용할 수 있습니다:
```text
+---------------------------------------------------------------------------------+
| normalize_json_numbers_to_double(cast('{"abc": 18446744073709551616}' as json)) |
+---------------------------------------------------------------------------------+
| {"abc":1.8446744073709552e+19}                                                  |
+---------------------------------------------------------------------------------+
```

## 예제 {#examples}

### 기본 숫자 변환 {#basic-number-conversion}

```sql
SELECT normalize_json_numbers_to_double(cast('{"b":1234567890123456789,"b":456,"a":789}' as json));
```

```text
+---------------------------------------------------------------------------------------------+
| normalize_json_numbers_to_double(cast('{"b":1234567890123456789,"b":456,"a":789}' as json)) |
+---------------------------------------------------------------------------------------------+
| {"b":1.2345678901234568e+18,"b":456,"a":789}                                                |
+---------------------------------------------------------------------------------------------+
```

### 중첩된 JSON 처리 {#processing-nested-json}

```sql
SELECT normalize_json_numbers_to_double(cast('{"object":{"int":123,"bigint":1234567890123456789},"array":[123,456,789]}' as json));
```

```text
+-----------------------------------------------------------------------------------------------------------------------------+
| normalize_json_numbers_to_double(cast('{"object":{"int":123,"bigint":1234567890123456789},"array":[123,456,789]}' as json)) |
+-----------------------------------------------------------------------------------------------------------------------------+
| {"object":{"int":123,"bigint":1.2345678901234568e+18},"array":[123,456,789]}                                                |
+-----------------------------------------------------------------------------------------------------------------------------+
```

### NULL 값 처리 {#processing-null-values}

```sql
SELECT normalize_json_numbers_to_double(null);
```

```text
+----------------------------------------+
| normalize_json_numbers_to_double(null) |
+----------------------------------------+
| NULL                                   |
+----------------------------------------+
```

## 참고 사항 {#notes}

1. `NORMALIZE_JSON_NUMBERS_TO_DOUBLE` 함수에는 `NORMALIZE_JSONB_NUMBERS_TO_DOUBLE`이라는 별칭이 있으며, 두 함수의 기능은 동일합니다.

2. 이 함수는 JSON의 모든 숫자 타입(정수, 부동소수점 수, DECIMAL 포함)을 배정밀도 부동소수점 표현으로 변환합니다.

3. 특히 큰 정수를 배정밀도 부동소수점으로 변환하면 정밀도가 손실될 수 있습니다. 예제에서 1234567890123456789가 1.2345678901234568e+18로 변환되는 경우가 이에 해당합니다.

4. 이 함수는 JSON의 구조를 변경하지 않으며, 내부의 숫자 표현만 수정합니다.
