---
{
    "title": "TO_JSON",
    "language": "ko",
    "description": "Doris 내부 데이터 타입을 JSONB 타입으로 변환합니다. 이 함수를 사용하면 호환되는 Doris 데이터 타입을 정밀도 손실 없이 JSON 표현으로 변환할 수 있습니다."
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

Doris 내부 데이터 타입을 JSONB 타입으로 변환합니다. 이 함수를 사용하면 호환되는 Doris 데이터 타입을 정밀도 손실 없이 JSON 표현으로 변환할 수 있습니다.

## 구문 {#syntax}

```sql
TO_JSON(value)
```

## 매개변수 {#parameters}

**value** - JSONB 타입으로 변환할 값입니다.

다음 타입은 JSONB 타입에 직접 매핑되므로 바로 변환할 수 있습니다:
- 숫자 타입: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 불리언 타입: BOOLEAN
- 문자열 타입: STRING, VARCHAR, CHAR
- 복합 타입: ARRAY, STRUCT

또한 다음 타입의 변환도 지원합니다:
- 날짜 타입: DATETIME, DATE, TIME
- IP 타입: IPV4, IPV6
- 복합 타입: MAP

대응하는 JSONB 타입이 없는 DATETIME, DATE, TIME, IPV4, IPV6 타입은 STRING 타입으로 변환됩니다.
MAP 타입은 JSONB Object 타입으로 변환됩니다. JSON 표준에서는 Object 키가 문자열이어야 하므로 Map 키는 STRING 타입이어야 합니다.

## 반환값 {#return-value}

JSONB 타입의 값을 반환합니다.

입력 `value`가 SQL NULL이면 함수는 SQL NULL을 반환합니다(JSON null 값이 아님). 배열이나 구조체 내부의 NULL 값은 JSON null 값으로 변환됩니다.

## 예제 {#examples}

### 기본 스칼라 값 {#basic-scalar-values}

```sql
SELECT to_json(1), to_json(3.14), to_json("12345");
```

```text
+------------+---------------+------------------+
| to_json(1) | to_json(3.14) | to_json("12345") |
+------------+---------------+------------------+
| 1          | 3.14          | "12345"          |
+------------+---------------+------------------+
```

### 날짜 타입 {#date-types}

```sql
SELECT 
     to_json(cast('2020-01-01' as date)) , 
     to_json(cast('2020-01-01 12:00:00' as datetime)),
     to_json(cast('2020-01-01 12:00:00.123' as datetime(3))),
     to_json(cast('2020-01-01 12:00:00.123456' as datetime(6))),
     to_json(cast('8:23:45' as time));
```

```text
+-------------------------------------+--------------------------------------------------+---------------------------------------------------------+------------------------------------------------------------+----------------------------------+
| to_json(cast('2020-01-01' as date)) | to_json(cast('2020-01-01 12:00:00' as datetime)) | to_json(cast('2020-01-01 12:00:00.123' as datetime(3))) | to_json(cast('2020-01-01 12:00:00.123456' as datetime(6))) | to_json(cast('8:23:45' as time)) |
+-------------------------------------+--------------------------------------------------+---------------------------------------------------------+------------------------------------------------------------+----------------------------------+
| "2020-01-01"                        | "2020-01-01 12:00:00"                            | "2020-01-01 12:00:00.123"                               | "2020-01-01 12:00:00.123456"                               | "08:23:45"                       |
+-------------------------------------+--------------------------------------------------+---------------------------------------------------------+------------------------------------------------------------+----------------------------------+
```

### IP 타입 {#ip-types}

```sql
SELECT 
     to_json(cast('192.168.0.1' as ipv4)) , 
     to_json(cast('2001:0db8:85a3:0000:0000:8a2e:0370:7334' as ipv6));
```

```text
+--------------------------------------+------------------------------------------------------------------+
| to_json(cast('192.168.0.1' as ipv4)) | to_json(cast('2001:0db8:85a3:0000:0000:8a2e:0370:7334' as ipv6)) |
+--------------------------------------+------------------------------------------------------------------+
| "192.168.0.1"                        | "2001:db8:85a3::8a2e:370:7334"                                   |
+--------------------------------------+------------------------------------------------------------------+
```

### 배열 변환 {#array-conversion}

```sql
SELECT to_json(array(array(1,2,3),array(4,5,6)));
```

```text
+-------------------------------------------+
| to_json(array(array(1,2,3),array(4,5,6))) |
+-------------------------------------------+
| [[1,2,3],[4,5,6]]                         |
+-------------------------------------------+
```

```sql
SELECT to_json(array(12,34,null));
```

```text
+----------------------------+
| to_json(array(12,34,null)) |
+----------------------------+
| [12,34,null]               |
+----------------------------+
```

### 결과 JSON의 배열 요소에 접근하기 {#accessing-array-elements-in-resulting-json}

```sql
SELECT json_extract(to_json(array(array(1,2,3),array(4,5,6))), '$.[1].[2]');
```

```text
+----------------------------------------------------------------------+
| json_extract(to_json(array(array(1,2,3),array(4,5,6))), '$.[1].[2]') |
+----------------------------------------------------------------------+
| 6                                                                    |
+----------------------------------------------------------------------+
```

### 구조체 변환 {#struct-conversion}

```sql
SELECT to_json(struct(123,array(4,5,6),"789"));
```

```text
+------------------------------------------+
| to_json(struct(123,array(4,5,6),"789"))  |
+------------------------------------------+
| {"col1":123,"col2":[4,5,6],"col3":"789"} |
+------------------------------------------+
```

### 결과 JSON의 객체 속성에 접근하기 {#accessing-object-properties-in-resulting-json}

```sql
SELECT json_extract(to_json(struct(123,array(4,5,6),"789")),"$.col2");
```

```text
+----------------------------------------------------------------+
| json_extract(to_json(struct(123,array(4,5,6),"789")),"$.col2") |
+----------------------------------------------------------------+
| [4,5,6]                                                        |
+----------------------------------------------------------------+
```

### MAP 변환 {#map-conversion}

```sql
SELECT to_json(map("1",2,"abc",3));  
```

```text
+-----------------------------+
| to_json(map("1",2,"abc",3)) |
+-----------------------------+
| {"1":2,"abc":3}             |
+-----------------------------+
```

```sql
SELECT to_json(map(1,2));  
```

```text
to_json only support map with string-like key type
```

### NULL 값 처리 {#handling-null-values}

```sql
-- SQL NULL as input returns SQL NULL
SELECT to_json(null);
```

```text
+---------------+
| to_json(null) |
+---------------+
| NULL          |
+---------------+
```

```sql
-- NULL values within arrays become JSON null values
SELECT to_json(array(12,34,null));
```

```text
+----------------------------+
| to_json(array(12,34,null)) |
+----------------------------+
| [12,34,null]               |
+----------------------------+
```

### 지원하지 않는 Doris 타입 {#unsupported-doris-types}

```sql
SELECT to_json(makedate(2025,5));
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(DATE)
```

```sql
-- Convert to string first and then apply to_json
SELECT to_json(cast(makedate(2025,5) as string));
```

```text
+-------------------------------------------+
| to_json(cast(makedate(2025,5) as string)) |
+-------------------------------------------+
| "2025-01-05"                              |
+-------------------------------------------+
```

## 참고 사항 {#notes}

1. 일부 타입(예: DATE)은 JSON과 직접 매핑되지 않습니다. 이러한 타입은 먼저 STRING으로 변환한 다음 `TO_JSON`을 사용해야 합니다.

2. Doris 내부 타입을 JSONB로 변환할 때 `TO_JSON`을 사용하면 텍스트 표현을 거쳐 변환할 때와 달리 정밀도 손실이 발생하지 않습니다.

3. Doris의 JSONB 객체는 기본적으로 크기가 1,048,576바이트(1 MB)로 제한되며, BE 설정 `string_type_length_soft_limit_bytes`를 통해 최대 2,147,483,643바이트(약 2 GB)까지 조정할 수 있습니다.

4. Doris JSON 객체에서 키의 길이는 255바이트를 초과할 수 없습니다.
