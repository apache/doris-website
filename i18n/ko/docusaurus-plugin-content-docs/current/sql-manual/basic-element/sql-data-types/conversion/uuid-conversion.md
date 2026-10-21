---
{
    "title": "UUID로 변환",
    "language": "ko",
    "description": "엄격 모드와 비엄격 모드, 허용되는 텍스트 형식, 마이그레이션을 포함한 문자열 및 기타 타입의 UUID 변환 규칙."
}
---

[UUID 타입](../uuid.md)은 128비트 식별자를 16바이트에 저장합니다. 텍스트 표현은 36자의 소문자 정규 형식입니다: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.

`CAST(<value> AS UUID)`를 사용하여 값을 UUID로 변환합니다. 엄격 모드는 `enable_strict_cast`로 제어합니다. [타입 변환 개요](./overview.md)를 참고하세요.

## 문자열에서 변환 {#from-string}

문자열 원본 타입에는 `CHAR`, `VARCHAR`, `STRING`이 포함됩니다.

### 엄격 모드 {#strict-mode}

#### BNF 정의 {#bnf-definition}

```xml
<uuid> ::= <hex8> "-" <hex4> "-" <hex4> "-" <hex4> "-" <hex12>
         | <hex32>

<hex4> ::= <hexdigit> <hexdigit> <hexdigit> <hexdigit>
<hex8> ::= <hex4> <hex4>
<hex12> ::= <hex8> <hex4>
<hex32> ::= <hex8> <hex8> <hex8> <hex8>

<hexdigit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
             | "a" | "b" | "c" | "d" | "e" | "f"
             | "A" | "B" | "C" | "D" | "E" | "F"
```

#### 규칙 설명 {#rule-description}

1. 하이픈이 `8-4-4-4-12` 패턴으로 배치된 36자 정규 형식 또는 하이픈 없이 십육진수 숫자 32개로 구성된 간결한 형식을 허용합니다.
2. 십육진수의 영문자는 대문자(`A–F`) 또는 소문자(`a–f`)일 수 있습니다. 두 입력 형식 모두 소문자 정규 형식의 UUID 텍스트를 생성합니다.
3. 앞뒤 공백, 중괄호, 잘못된 길이, 잘못된 위치의 하이픈, 십육진수가 아닌 문자는 허용하지 않습니다.
4. 모든 비트가 영인 UUID와 모든 비트가 일인 UUID는 유효합니다. 파싱은 텍스트 형식만 검사하며 UUID 버전이나 variant를 제한하지 않습니다.
5. `NULL`을 입력하면 `NULL`을 반환합니다.
6. 유효하지 않은 텍스트는 오류를 발생시키며 쿼리가 실패합니다.

#### 예제 {#examples}

| 입력 문자열 | 파싱 결과 | 설명 |
| --- | --- | --- |
| `"550e8400-e29b-41d4-a716-446655440000"` | 성공 | 하이픈이 있는 표준 형식 |
| `"550E8400E29B41D4A716446655440000"` | 성공 | 대문자 십육진수로 구성된 간결한 형식 |
| `"00000000-0000-0000-0000-000000000000"` | 성공 | 모든 비트가 영인 UUID이며 NULL과 구별됨 |
| `"ffffffff-ffff-ffff-ffff-ffffffffffff"` | 성공 | 모든 비트가 일인 UUID이며 버전과 variant는 검증하지 않음 |
| `""` | 오류 | 빈 문자열 |
| `" 550e8400-e29b-41d4-a716-446655440000 "` | 오류 | 앞뒤 공백 |
| `"{550e8400-e29b-41d4-a716-446655440000}"` | 오류 | 중괄호는 허용하지 않음 |
| `"550e8400-e29b-41d4-a716-44665544000"` | 오류 | 잘못된 길이 |
| `"550e8400e-29b-41d4-a716-446655440000"` | 오류 | 잘못된 하이픈 위치 |
| `"550e8400-e29b-41d4-a716-44665544000g"` | 오류 | 십육진수가 아닌 문자 g |
| `NULL` | `NULL` | SQL NULL은 NULL로 유지됨 |

```sql
SET enable_strict_cast = true;
SELECT CAST('550E8400E29B41D4A716446655440000' AS UUID) AS parsed,
       CAST(CAST('550E8400E29B41D4A716446655440000' AS UUID) AS STRING) AS text_value,
       CAST(NULL AS UUID) AS null_value;
```

```text
+--------------------------------------+--------------------------------------+------------+
| parsed                               | text_value                           | null_value |
+--------------------------------------+--------------------------------------+------------+
| 550e8400-e29b-41d4-a716-446655440000 | 550e8400-e29b-41d4-a716-446655440000 | NULL       |
+--------------------------------------+--------------------------------------+------------+
```

### 비엄격 모드 {#non-strict-mode}

#### BNF 정의 {#bnf-definition-1}

```xml
<uuid> ::= <hex8> "-" <hex4> "-" <hex4> "-" <hex4> "-" <hex12>
         | <hex32>

<hex4> ::= <hexdigit> <hexdigit> <hexdigit> <hexdigit>
<hex8> ::= <hex4> <hex4>
<hex12> ::= <hex8> <hex4>
<hex32> ::= <hex8> <hex8> <hex8> <hex8>

<hexdigit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
             | "a" | "b" | "c" | "d" | "e" | "f"
             | "A" | "B" | "C" | "D" | "E" | "F"
```

#### 규칙 설명 {#rule-description-1}

1. 하이픈이 `8-4-4-4-12` 패턴으로 배치된 36자 정규 형식 또는 하이픈 없이 십육진수 숫자 32개로 구성된 간결한 형식을 허용합니다.
2. 십육진수의 영문자는 대문자(`A–F`) 또는 소문자(`a–f`)일 수 있습니다. 두 입력 형식 모두 소문자 정규 형식의 UUID 텍스트를 생성합니다.
3. 앞뒤 공백, 중괄호, 잘못된 길이, 잘못된 위치의 하이픈, 십육진수가 아닌 문자는 허용하지 않습니다.
4. 모든 비트가 영인 UUID와 모든 비트가 일인 UUID는 유효합니다. 파싱은 텍스트 형식만 검사하며 UUID 버전이나 variant를 제한하지 않습니다.
5. `NULL`을 입력하면 `NULL`을 반환합니다.
6. 유효하지 않은 텍스트는 오류를 발생시키는 대신 `NULL`을 반환합니다.

#### 예제 {#examples-1}

| 입력 문자열 | 파싱 결과 | 설명 |
| --- | --- | --- |
| `"550e8400-e29b-41d4-a716-446655440000"` | 성공 | 하이픈이 있는 표준 형식 |
| `"550E8400E29B41D4A716446655440000"` | 성공 | 대문자 십육진수로 구성된 간결한 형식 |
| `"00000000-0000-0000-0000-000000000000"` | 성공 | 모든 비트가 영인 UUID이며 NULL과 구별됨 |
| `"ffffffff-ffff-ffff-ffff-ffffffffffff"` | 성공 | 모든 비트가 일인 UUID이며 버전과 variant는 검증하지 않음 |
| `""` | `NULL` | 빈 문자열 |
| `" 550e8400-e29b-41d4-a716-446655440000 "` | `NULL` | 앞뒤 공백 |
| `"{550e8400-e29b-41d4-a716-446655440000}"` | `NULL` | 중괄호는 허용하지 않음 |
| `"550e8400-e29b-41d4-a716-44665544000"` | `NULL` | 잘못된 길이 |
| `"550e8400e-29b-41d4-a716-446655440000"` | `NULL` | 잘못된 하이픈 위치 |
| `"550e8400-e29b-41d4-a716-44665544000g"` | `NULL` | 십육진수가 아닌 문자 g |
| `NULL` | `NULL` | SQL NULL은 NULL로 유지됨 |

```sql
SET enable_strict_cast = false;
SELECT CAST('bad' AS UUID) AS invalid_cast,
       TRY_CAST('{550e8400-e29b-41d4-a716-446655440000}' AS UUID) AS braces;
```

```text
+--------------+--------+
| invalid_cast | braces |
+--------------+--------+
| NULL         | NULL   |
+--------------+--------+
```

## UUID에서 변환 {#from-uuid}

UUID를 UUID로 변환하면 값과 `NULL`이 유지됩니다. 엄격 모드와 비엄격 모드는 동일하게 동작합니다.

## VARIANT에서 변환 {#from-variant}

VARIANT 값에 변환 가능한 스칼라가 포함되어 있으면 VARIANT에서 UUID로 변환할 수 있습니다. 변환 동작은 스칼라 값과 엄격 모드 설정에 따라 달라집니다.

## 기타 타입에서 변환 {#from-other-types}

숫자, 날짜/시간, IP, VARBINARY 또는 JSON 타입에서 UUID로의 직접적인 스칼라 형 변환은 엄격 모드와 비엄격 모드 모두에서 지원하지 않습니다. `TRY_CAST`를 사용해도 지원하지 않는 변환이 가능해지지는 않습니다.

## 오류 허용 변환 {#tolerant-conversion}

`TRY_CAST(<string> AS UUID)`는 유효하지 않은 텍스트나 `NULL` 입력에 대해 두 모드 모두 `NULL`을 반환합니다. 예를 들어 엄격 모드가 활성화되어 있어도 유효하지 않은 텍스트는 `NULL`을 반환합니다:

```sql
SET enable_strict_cast = true;
SELECT TRY_CAST('bad' AS UUID) AS invalid_try_cast;
```

```text
+------------------+
| invalid_try_cast |
+------------------+
| NULL             |
+------------------+
```

이 모드에서 `SELECT CAST('bad' AS UUID);`를 실행하면 오류가 발생하고 쿼리가 실패합니다.

[TO_UUID_OR_NULL](../../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-null.md), [TO_UUID_OR_ZERO](../../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-zero.md) 또는 [TO_UUID_OR_DEFAULT](../../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-default.md)를 사용하면 `enable_strict_cast`와 관계없이 파싱 실패 시의 동작을 명시적으로 선택할 수 있습니다. `TO_UUID_OR_ZERO(NULL)`은 NULL을 반환하지만, `TO_UUID_OR_DEFAULT(NULL)`은 모든 비트가 영인 UUID를 반환한다는 점에 유의하세요.

## 관련 변환 및 마이그레이션 {#related-conversions-and-migration}

UUID는 `CHAR`, `VARCHAR` 또는 `STRING`으로 변환할 수 있으며, 두 모드 모두 소문자 정규 형식의 텍스트를 생성하고 `NULL`을 유지합니다. [문자열로 변환](./cast-to-string.md#uuid)을 참고하세요. UUID는 VARIANT로도 변환할 수 있습니다. UUID에서 숫자, 날짜/시간, IP, VARBINARY 또는 JSON 타입으로의 직접적인 변환은 지원하지 않습니다.

문자열과 UUID 피연산자는 비교와 공통 타입 추론을 위해 UUID로 강제 변환됩니다. 문자열 파싱은 위의 규칙을 따릅니다. 명시적 형 변환을 사용하면 의도를 명확히 할 수 있습니다.

기존 `INT_TO_UUID` 인코딩의 경우 먼저 텍스트로 변환합니다: `CAST(INT_TO_UUID(encoded_value) AS UUID)`. UUID와 LARGEINT 간의 직접적인 변환은 지원하지 않으며, `toUInt128` 함수도 없습니다. 정규 빅 엔디언 순서의 16바이트 VARBINARY에는 `HEX`를 적용한 다음 `CAST(HEX(binary_value) AS UUID)`를 사용합니다. 임의의 16바이트 문자열은 정규 UUID 텍스트가 아닙니다.

복합 타입의 문자열 요소는 UUID로 재귀적으로 변환할 수 있습니다. 예를 들어 `CAST(ARRAY('550e8400-e29b-41d4-a716-446655440000') AS ARRAY<UUID>)`를 사용할 수 있습니다. JSON에서 UUID 텍스트를 읽을 때는 변환 전에 문자열로 추출하세요. JSON과 UUID 간의 직접적인 스칼라 형 변환은 지원하지 않습니다. 스키마 변경으로는 기존 문자열 컬럼을 UUID로 직접 변경할 수 없습니다. 변환 표현식으로 새 컬럼이나 테이블에 데이터를 채우고 마이그레이션 전에 변환에 실패한 값을 확인하세요.
