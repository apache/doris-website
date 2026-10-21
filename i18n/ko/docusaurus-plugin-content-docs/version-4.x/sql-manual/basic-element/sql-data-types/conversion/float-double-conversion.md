---
{
    "title": "FLOAT/DOUBLE로 변환",
    "language": "ko",
    "description": "원본 타입이 nullable이면 nullable 타입을 반환합니다;"
}
---

## string에서 변환 {#from-string}

:::caution 동작 변경
버전 4.0부터 오버플로 결과는 NULL 대신 +/-Infinity입니다.
:::

### 엄격 모드 {#strict-mode}

원본 타입이 nullable이면 nullable 타입을 반환합니다;

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다;

#### BNF 정의 {#bnf-definition}

```xml
<float>       ::= <whitespace>* <value> <whitespace>*

<whitespace>  ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"

<value>       ::= <decimal> | <infinity> | <nan>

<decimal>     ::= <sign>? <significand> <exponent>?

<infinity>    ::= <sign>? <inf_literal>

<nan>         ::= <sign>? <nan_literal>

<sign>        ::= "+" | "-"

<significand> ::= <digits> | <digits> "." <digits> | <digits> "." | "." <digits>

<digits>      ::= <digit>+

<digit>       ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<exponent>    ::= <e_marker> <sign>? <digits>

<e_marker>    ::= "e" | "E"

<inf_literal> ::= <"INF" case-insensitive> | <"INFINITY" case-insensitive>

<nan_literal> ::= <"NAN" case-insensitive>
```

#### 규칙 설명 {#rule-description}

* 십진수 형식의 숫자만 지원합니다;

* 과학적 표기법을 지원합니다;

* 숫자 앞에 양수 또는 음수 부호를 붙일 수 있습니다;

* 문자열 앞뒤에 " ", "\t", "\n", "\r", "\f", "\v" 등의 공백 문자를 임의로 넣을 수 있습니다;

* Infinity와 NaN을 지원합니다;

* 그 외 형식은 오류를 반환합니다;

* 오버플로가 발생하면 +|-Infinity로 변환합니다.

#### 예제 {#examples}

| 문자열                              | float/double | 설명                                  |
| ----------------------------------- | ------------ | ---------------------------------------- |
| "123.456"                           | 123.456      |                                          |
| "123456."                           | 123456       |                                          |
| "123456"                            | 123456       |                                          |
| ".123456"                           | 0.123456     |                                          |
| " \t\r\n\f\v123.456 \t\r\n\f\v"     | 123.456      | 앞뒤에 공백 포함       |
| " \t\r\n\f\v+123.456 \t\r\n\f\v"    | 123.456      | 앞뒤에 공백 및 양수 부호 포함 |
| " \t\r\n\f\v-123.456 \t\r\n\f\v"    | -123.456     | 앞뒤에 공백 및 음수 부호 포함 |
| " \t\r\n\f\v+1.234e5 \t\r\n\f\v"    | 123400       | 과학적 표기법                      |
| " \t\r\n\f\v+1.234e+5 \t\r\n\f\v"   | 123400       | 지수가 양수인 과학적 표기법 |
| " \t\r\n\f\v+1.23456e-1 \t\r\n\f\v" | 0.123456     | 지수가 음수인 과학적 표기법 |
| "Infinity"                          | Infinity     |                                          |
| "NaN"                               | NaN          |                                          |
| "123.456a"                          | Error        | 잘못된 형식                           |
| "1.7e409"                           | Infinity     | 오버플로                                 |
| "-1.7e409"                          | -Infinity    | 오버플로                                 |

### 비엄격 모드 {#non-strict-mode}

항상 nullable 타입을 반환합니다.

#### BNF 정의 {#bnf-definition-1}

```xml
<float>       ::= <whitespace>* <value> <whitespace>*

<whitespace>  ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"

<value>       ::= <decimal> | <infinity> | <nan>

<decimal>     ::= <sign>? <significand> <exponent>?

<infinity>    ::= <sign>? <inf_literal>

<nan>         ::= <sign>? <nan_literal>

<sign>        ::= "+" | "-"

<significand> ::= <digits> | <digits> "." <digits> | <digits> "." | "." <digits>

<digits>      ::= <digit>+

<digit>       ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<exponent>    ::= <e_marker> <sign>? <digits>

<e_marker>    ::= "e" | "E"

<inf_literal> ::= <"INF" case-insensitive> | <"INFINITY" case-insensitive>

<nan_literal> ::= <"NAN" case-insensitive>
```

#### 규칙 설명 {#rule-description-1}

* 엄격 모드에서 유효한 모든 형식을 지원합니다;

* 잘못된 형식은 NULL로 변환합니다;

* 오버플로가 발생하면 +|-Infinity로 변환합니다.

#### 예제 {#examples-1}

| 문자열                              | float/double | 설명                                  |
| ----------------------------------- | ------------ | ---------------------------------------- |
| "123.456"                           | 123.456      |                                          |
| "12345."                            | 12345        |                                          |
| ".123456"                           | 0.123456     |                                          |
| " \t\r\n\f\v123.456 \t\r\n\f\v"     | 123.456      | 앞뒤에 공백 포함       |
| " \t\r\n\f\v+123.456 \t\r\n\f\v"    | 123.456      | 앞뒤에 공백 및 양수 부호 포함 |
| " \t\r\n\f\v-123.456 \t\r\n\f\v"    | -123.456     | 앞뒤에 공백 및 음수 부호 포함 |
| " \t\r\n\f\v+1.234e5 \t\r\n\f\v"    | 123400       | 과학적 표기법                      |
| "Infinity"                          | Infinity     |                                          |
| "NaN"                               | NaN          |                                          |
| "123.456a"                          | NULL         | 잘못된 형식                           |
| "1.7e409"                           | Infinity     | 오버플로                                 |
| "-1.7e409"                          | -Infinity    | 오버플로                                 |

## bool에서 변환 {#from-bool}

true는 1로, false는 0으로 변환합니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

## 정수에서 변환 {#from-integer}

C++ static cast의 의미 체계를 따릅니다. 정밀도가 손실될 수 있습니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

## float에서 double로 변환 {#from-float-to-double}

C++ static cast의 의미 체계를 따릅니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

## double에서 float으로 변환 {#from-double-to-float}

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

### 규칙 설명 {#rule-description-2}

* C++ static cast의 의미 체계를 따릅니다.

* 오버플로가 발생하면 +-Infinity로 변환합니다.

### 예제 {#examples-2}

| double        | float     | 설명 |
| ------------- | --------- | ------- |
| 1.79769e+308  | Infinity  | 오버플로 |
| -1.79769e+308 | -Infinity | 오버플로 |

## decimal에서 float으로 변환 {#from-decimal-to-float}

Decimal 타입을 float으로 캐스팅하면 정밀도가 손실될 수 있습니다.

Doris의 `Decimal(p, s)` 타입은 실제로 메모리에서 정수로 표현되며, 이 정수 값은 `Decimal actual value * 10^s`와 같습니다. 예를 들어, `Decimal(10, 6)` 타입의 값 `1234.56789`는 메모리에서 정수 값 `1234567890`으로 표현됩니다.

Decimal 타입을 float 또는 double 타입으로 변환할 때 Doris는 실제로 다음 연산을 수행합니다: `static_cast<float>(integer value in memory) / (10^scale)`.

### 엄격 모드 {#strict-mode-1}

오버플로가 발생하면 Infinity로 변환합니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

#### 예제 {#examples-3}

| Decimal(76, 6)                                                                | float     | 설명                              |
| ----------------------------------------------------------------------------- | --------- | ------------------------------------ |
| 123456789.012345                                                              | 123456790 | float으로 캐스팅하면 정밀도 손실 발생 |
| 9999999999999999999999999999999999999999999999999999999999999999999999.123456 | Infinity  | 오버플로                             |

### 비엄격 모드 {#non-strict-mode-1}

오버플로가 발생하면 Infinity로 변환합니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

#### 예제 {#examples-4}

| Decimal(76, 6)                                                                | float     | 설명                              |
| ----------------------------------------------------------------------------- | --------- | ------------------------------------ |
| 123456789.012345                                                              | 123456790 | float으로 캐스팅하면 정밀도 손실 발생 |
| 9999999999999999999999999999999999999999999999999999999999999999999999.123456 | Infinity  | 오버플로                             |

## decimal에서 double로 변환 {#from-decimal-to-double}

현재 Decimal 타입의 유효 자릿수는 최대 76자리입니다. double 타입으로 캐스팅할 때는 오버플로 문제가 없으며, 정밀도 손실만 발생할 수 있습니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

### 예제 {#examples-5}

| Decimal(76, 6)                                                                | double             | 설명                                                      |
| ----------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------ |
| 123456789.012345                                                              | 123456789.012345   | 유효 자릿수가 15자리이므로 double로 캐스팅해도 정밀도 손실 없음 |
| 12345678901.012345                                                            | 12345678901.012344 | 유효 자릿수가 17자리이므로 double로 캐스팅하면 정밀도 손실 발생 |
| 9999999999999999999999999999999999999999999999999999999999999999999999.123456 | 1e+70              | 정밀도 손실 발생                                          |

## date에서 float으로 변환 {#from-date-to-float}

### 엄격 모드 {#strict-mode-2}

오류를 반환합니다.

### 비엄격 모드 {#non-strict-mode-2}

날짜의 연, 월, 일을 순서대로 이어 붙여 정수를 만듭니다. 월과 일은 두 자리로 처리하며, 10보다 작으면 앞에 0을 붙입니다. 그런 다음 이 정수를 float으로 static_cast하며, 이 과정에서 정밀도가 손실될 수 있습니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

#### 예제 {#examples-6}

| date       | float    | 설명        |
| ---------- | -------- | -------------- |
| 2025-04-21 | 20250420 | 정밀도 손실 |

## date에서 double로 변환 {#from-date-to-double}

### 엄격 모드 {#strict-mode-3}

오류를 반환합니다.

### 비엄격 모드 {#non-strict-mode-3}

날짜의 연, 월, 일을 순서대로 이어 붙여 정수를 만듭니다. 월과 일은 두 자리로 처리하며, 10보다 작으면 앞에 0을 붙입니다. 그런 다음 이 정수를 double로 static_cast합니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

#### 예제 {#examples-7}

| date       | double   | 설명                               |
| ---------- | -------- | ------------------------------------- |
| 2025-04-21 | 20250421 | 유효 자릿수가 8자리이므로 정밀도 손실 없음 |

## datetime에서 float으로 변환 {#from-datetime-to-float}

### 엄격 모드 {#strict-mode-4}

오류를 반환합니다.

### 비엄격 모드 {#non-strict-mode-4}

datetime의 마이크로초 부분을 버린 다음, 연, 월, 일, 시, 분, 초를 순서대로 이어 붙여 정수를 만듭니다. 월, 일, 시, 분, 초는 두 자리로 처리하며, 10보다 작으면 앞에 0을 붙입니다. 그런 다음 이 정수를 float으로 static_cast하며, 이 과정에서 정밀도가 손실될 수 있습니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

#### 예제 {#examples-8}

| datetime                   | float          | 설명        |
| -------------------------- | -------------- | -------------- |
| 2025-03-14 17:00:01.123456 | 20250314170001 | 정밀도 손실 |
| 9999-12-31 23:59:59.999999 | 99991231235959 | 정밀도 손실 |

## datetime에서 double로 변환 {#from-datetime-to-double}

### 엄격 모드 {#strict-mode-5}

오류를 반환합니다.

### 비엄격 모드 {#non-strict-mode-5}

datetime의 마이크로초 부분을 버린 다음, 연, 월, 일, 시, 분, 초를 순서대로 이어 붙여 정수를 만듭니다. 월, 일, 시, 분, 초는 두 자리로 처리하며, 10보다 작으면 앞에 0을 붙입니다. 그런 다음 이 정수를 double로 static_cast합니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

#### 예제 {#examples-9}

| datetime                   | double          | 설명                                         |
| -------------------------- | --------------- | ----------------------------------------------- |
| 2025-03-14 17:00:01.123456 |  20250314170001 | 유효 자릿수가 14자리이므로 정밀도 손실 없음        |
| 9999-12-31 23:59:59.999999 |  99991231235959 |                                                 |

## time에서 변환 {#from-time}

### 엄격 모드 {#strict-mode-6}

오류를 반환합니다.

### 비엄격 모드 {#non-strict-mode-6}

마이크로초 단위의 float/double 숫자로 변환합니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

#### 예제 {#examples-10}

| Time             | float         | 설명 |
| ---------------- | ------------- | ------- |
| 00:00:01         | 1000000       |         |
| 838:59:58        | 3020398000000 |         |
| 838:59:58.123456 | 3020398123456 |         |

## 기타 타입에서 변환 {#from-other-types}

지원하지 않습니다.
