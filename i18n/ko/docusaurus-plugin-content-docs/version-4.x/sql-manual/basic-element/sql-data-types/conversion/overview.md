---
{
    "title": "타입 변환",
    "language": "ko",
    "description": "Doris에서는 모든 표현식에 타입이 있습니다. 예를 들어 1, col1, fromunixtime(col2)는 select 1, col1, fromunixtime(col2) from table1 표현식에 포함되며 각각 타입을 가집니다."
}
---

Doris에서는 모든 표현식에 타입이 있습니다. 예를 들어 `1`, `col1`, `from_unixtime(col2)`는 `select 1, col1, from_unixtime(col2) from table1` 표현식에 포함되며 각각 타입을 가집니다. 표현식을 한 타입에서 다른 타입으로 변환하는 과정을 "타입 변환"이라고 합니다.

타입 변환은 명시적 변환과 암시적 변환의 두 가지 경우에 발생합니다.

모든 타입 변환은 정해진 규칙을 따릅니다. 관련 규칙은 변환의 **대상 타입**을 기준으로 설명합니다. 예를 들어 `INT`에서 `DOUBLE`로의 변환과 `STRING`에서 `DOUBLE`로의 변환은 모두 [FLOAT/DOUBLE로 변환](./float-double-conversion) 문서에서 설명합니다.

변환 가능 여부와 변환 결과가 Nullable 타입인지 여부는 엄격 모드(세션 변수 `enable_strict_cast`)의 활성화 여부에 따라 달라집니다. 일반적으로 엄격 모드가 활성화되어 있으면 변환에 실패하는 데이터는 즉시 오류를 일으켜 SQL 실행이 실패합니다. 엄격 모드가 비활성화되어 있으면 변환에 실패한 데이터 행의 결과는 `NULL`이 됩니다.

## 명시적 변환 {#explicit-conversion}

명시적 변환은 `CAST` 함수를 통해 수행합니다. 예를 들면 다음과 같습니다:

`CAST(1.23 as INT)`는 숫자 1.23을 INT 타입으로 변환합니다.

`CAST(colA as DATETIME(6))`는 열/표현식 colA를 DATETIME(6) 타입(즉, 마이크로초 정밀도의 DATETIME 타입)으로 변환합니다.

다음은 엄격 모드(`enable_strict_cast = true`)와 비엄격 모드(`enable_strict_cast = false`)에서 서로 다른 타입 간의 변환 관계를 설명하며, 아래 네 가지 경우를 포함합니다:

|기호|의미|
|-|-|
|x|변환할 수 없음|
|P|입력 인자가 이미 Nullable 타입인 경우에만 반환 타입이 Nullable이 됩니다. 즉, 변환 시 Null이 아닌 값을 Null로 **바꾸지 않습니다**|
|A|반환 타입은 항상 Nullable입니다. 변환 시 **Null이 아닌 값이 Null로 바뀔 수 있습니다**|
|O|입력 타입에서 출력 타입으로 변환할 때 **오버플로가 발생할 수 있으면** 반환 타입이 Nullable이 됩니다. Null이 아닌 입력 값을 변환하는 과정에서 실제로 오버플로가 발생하면 변환 결과가 Null이 될 수 있습니다|

구체적인 타입 변환 규칙과 Nullable 속성은 현재 디렉터리의 타입 변환 문서를 참조하세요.

### 엄격 모드 {#strict-mode}

| **변환 전**\\**변환 후** | bool | tinyint | smallint | int | bigint | largeint | float | double | decimal | date | datetime | time | IPv4 | IPv6 | char | varchar | string | bitmap | hll | json | array | map | struct | variant |
| ---------------- | ---- | ------- | -------- | --- | ------ | -------- | ----- | ------ | ------- | ---- | -------- | ---- | ---- | ---- | ---- | ------- | ------ | ------ | --- | ---- | ----- | --- | ------ | ------- |
| bool             | P    | P       | P        | P   | P      | P        | P     | P      | O       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| tinyint          | P    | P       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| smallint         | P    | A       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| int              | P    | A       | A        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| bigint           | P    | A       | A        | A   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| largeint         | P    | A       | A        | A   | A      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| float            | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| double           | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| decimal          | P    | O       | O        | O   | O      | O        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| date             | x    | x       | x        | P   | P      | P        | x     | x      | x       | P    | P        | x    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| datetime         | x    | x       | x        | x   | P      | P        | x     | x      | x       | P    | A        | P    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| time             | x    | A       | A        | A   | P      | P        | x     | x      | x       | P    | P        | A    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| IPv4             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | P    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| IPv6             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| char             | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| varchar          | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| string           | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| bitmap           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    | x    | x       | x      | P      | x   | x    | x     | x   | x      |         |
| hll              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    | x    | x       | x      | x      | P   | x    | x     | x   | x      |         |
| json             | A    | A       | A        | A   | A      | A        | A     | A      | A       | x    | x        | x    | x    | x    | A    | A       | A      | x      | x   | P    | A     | x   | A      |         |
| array            | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | P     | x   | x      |         |
| map              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | x    | x     | P   | x      |         |
| struct           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | P      |         |
| variant          |      |         |          |     |        |          |       |        |         |      |          |      |      |      |      |         |        |        |     |      |       |     |        |         |

### 비엄격 모드 {#non-strict-mode}

| **변환 전**\\**변환 후** | bool | tinyint | smallint | int | bigint | largeint | float | double | decimal | date | datetime | time | IPv4 | IPv6 | char | varchar | string | bitmap | hll | json | array | map | struct | variant |
| ---------------- | ---- | ------- | -------- | --- | ------ | -------- | ----- | ------ | ------- | ---- | -------- | ---- | ---- | ---- | ---- | ------- | ------ | ------ | --- | ---- | ----- | --- | ------ | ------- |
| bool             | P    | P       | P        | P   | P      | P        | P     | P      | O       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| tinyint          | P    | P       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| smallint         | P    | A       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| int              | P    | A       | A        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| bigint           | P    | A       | A        | A   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| largeint         | P    | A       | A        | A   | A      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| float            | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| double           | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| decimal          | P    | O       | O        | O   | O      | O        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| date             | x    | x       | x        | P   | P      | P        | P     | P      | x       | P    | P        | x    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| datetime         | x    | x       | x        | x   | P      | P        | P     | P      | x       | P    | A        | P    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| time             | x    | A       | A        | A   | P      | P        | P     | P      | x       | P    | P        | A    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| IPv4             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | P    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| IPv6             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| char             | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| varchar          | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| string           | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| bitmap           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    | x    | x       | x      | P      | x   | x    | x     | x   | x      |         |
| hll              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    | x    | x       | x      | x      | P   | x    | x     | x   | x      |         |
| json             | A    | A       | A        | A   | A      | A        | A     | A      | A       | x    | x        | x    | x    | x    | A    | A       | A      | x      | x   | P    | A     | x   | A      |         |
| array            | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | P     | x   | x      |         |
| map              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | x    | x     | P   | x      |         |
| struct           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | P      |         |
| variant          |      |         |          |     |        |          |       |        |         |      |          |      |      |      |      |         |        |        |     |      |       |     |        |         |

## 암시적 변환 {#implicit-conversion}

암시적 변환은 입력 SQL에 명시되어 있지 않아도 Doris가 자동으로 CAST 표현식을 계획하는 경우에 발생합니다. 주로 다음과 같은 상황에서 발생합니다:

1. 함수 호출 시 실제 인자의 타입이 함수 시그니처의 타입과 일치하지 않는 경우.

2. 수학 표현식 양쪽의 타입이 일치하지 않는 경우.

등이 있습니다.

### 변환 행렬 {#conversion-matrix}

TODO

### 공통 타입 {#common-type}

피연산자가 수학 연산에 사용되어 암시적 변환이 필요한 경우, 먼저 공통 타입을 결정합니다. 양쪽 피연산자의 타입이 공통 타입과 일치하지 않으면 각각에 대해 공통 타입으로 변환하는 CAST 표현식을 계획합니다.
