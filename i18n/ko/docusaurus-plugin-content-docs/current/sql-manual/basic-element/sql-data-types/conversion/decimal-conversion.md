---
{
    "title": "DECIMAL 타입으로 변환",
    "language": "ko",
    "description": "원본 타입이 nullable이면 nullable 타입을 반환합니다;"
}
---

## string에서 변환 {#from-string}

### 엄격 모드 {#strict-mode}

원본 타입이 nullable이면 nullable 타입을 반환합니다;

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다;

#### BNF 정의 {#bnf-definition}

```xml
<decimal>     ::= <whitespace>* <value> <whitespace>*

<whitespace>  ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"

<value>       ::= <sign>? <significand> <exponent>?

<sign>        ::= "+" | "-"

<significand> ::= <digits> "." <digits> | <digits> | <digits> "." | "." <digits>

<digits>      ::= <digit>+

<digit>       ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<exponent>    ::= <e_marker> <sign>? <digits>

<e_marker>    ::= "e" | "E"
```

#### 규칙 설명 {#rule-description}

* 십진 숫자만 지원합니다;

* 과학적 표기법을 지원합니다;

* 반올림을 지원합니다;

* 문자열의 앞뒤에 임의의 공백 문자를 허용합니다. 허용되는 문자는 " ", "\t", "\n", "\r", "\f", "\v"입니다.

* 정수부에서 오버플로가 발생하면 오류를 반환합니다;

* 형식이 올바르지 않으면 오류를 반환합니다.

#### 예제 {#examples}

| 문자열                            | Decimal(18, 6) | 설명                                  |
| --------------------------------- | -------------- | ---------------------------------------- |
| "123.1234567"                     | 123.123457     | 반올림                                 |
| "12345."                          | 12345.000000   |                                          |
| "12345"                           | 12345.000000   |                                          |
| ".123456"                         | 0.123456       |                                          |
| " \t\r\n\f\v123.456 \t\r\n\f\v"   | 123.456000     | 앞뒤 공백 포함       |
| " \t\r\n\f\v+123.456 \t\r\n\f\v"  | 123.456000     | 앞뒤 공백 및 양수 부호 포함 |
| " \t\r\n\f\v-123.456 \t\r\n\f\v"  | -123.456000    | 앞뒤 공백 및 음수 부호 포함 |
| " \t\r\n\f\v+1.234e5 \t\r\n\f\v"  | 123400.000000  | 과학적 표기법                      |
| " \t\r\n\f\v+1.234e+5 \t\r\n\f\v" | 123400.000000  | 양의 지수를 사용한 과학적 표기법 |
| " \t\r\n\f\v+1.234e-1 \t\r\n\f\v" | 0.123400       | 음의 지수를 사용한 과학적 표기법 |
| "123.456a"                        | Error          | 잘못된 형식                           |
| "1234567890123.123456"            | Error          | 오버플로                                 |

### 비엄격 모드 {#non-strict-mode}

항상 nullable 타입을 반환합니다;

#### BNF 정의 {#bnf-definition-1}

```xml
<decimal>     ::= <whitespace>* <value> <whitespace>*

<whitespace>  ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"

<value>       ::= <sign>? <significand> <exponent>

<sign>        ::= "+" | "-"

<significand> ::= <digits> | <digits> "." <digits> | <digits> "." | "." <digits>

<digits>      ::= <digit>+

<digit>       ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<exponent>    ::= <e_marker> <sign>? <digits>

<e_marker>    ::= "e" | "E"
```

#### 규칙 설명 {#rule-description-1}

* 엄격 모드에서 유효한 모든 형식을 지원합니다;

* 오버플로가 발생하면 NULL로 변환합니다;

* 형식이 올바르지 않으면 NULL로 변환합니다.

#### 예제 {#examples-1}

| 문자열                            | Decimal(18, 6) | 설명                                  |
| --------------------------------- | -------------- | ---------------------------------------- |
| "123.1234567"                     | 123.123457     | 반올림                                 |
| "12345."                          | 12345.000000   |                                          |
| "12345"                           | 12345.000000   |                                          |
| ".123456"                         | 0.123456       |                                          |
| " \t\r\n\f\v123.456 \t\r\n\f\v"   | 123.456000     | 앞뒤 공백 포함       |
| " \t\r\n\f\v+123.456 \t\r\n\f\v"  | 123.456000     | 앞뒤 공백 및 양수 부호 포함 |
| " \t\r\n\f\v-123.456 \t\r\n\f\v"  | -123.456000    | 앞뒤 공백 및 음수 부호 포함 |
| " \t\r\n\f\v+1.234e5 \t\r\n\f\v"  | 123400.000000  | 과학적 표기법                      |
| " \t\r\n\f\v+1.234e+5 \t\r\n\f\v" | 123400.000000  | 양의 지수를 사용한 과학적 표기법 |
| " \t\r\n\f\v+1.234e-1 \t\r\n\f\v" | 0.123400       | 음의 지수를 사용한 과학적 표기법 |
| "123.456a"                        | NULL           | 잘못된 형식                           |
| "1234567890123.123456"            | NULL           | 오버플로                                 |

## bool에서 변환 {#from-bool}

true는 1로, false는 0으로 변환됩니다.

### 엄격 모드 {#strict-mode-1}

오버플로가 발생하면 오류를 반환합니다(예: `cast bool as decimal(1, 1)`).

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

### 비엄격 모드 {#non-strict-mode-1}

오버플로가 발생하면 NULL로 변환합니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable인 경우:

* 오버플로가 발생할 수 있으면(예: `cast bool as decimal(1, 1)`) nullable 타입을 반환합니다;

* 그 외에는 non-nullable 타입을 반환합니다.

## integer에서 변환 {#from-integer}

### 엄격 모드 {#strict-mode-2}

오버플로가 발생하면 오류를 반환합니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

#### 예제 {#examples-2}

| int        | Decimal(18, 9) | 설명 |
| ---------- | -------------- | ------- |
| 123        | 123.00000000   |         |
| 2147483647 | Error          | 오버플로 |

### 비엄격 모드 {#non-strict-mode-2}

오버플로가 발생하면 NULL로 변환합니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable인 경우:

* 오버플로가 발생할 수 있으면(예: `cast int as decimal(1, 0)`) nullable 타입을 반환합니다;

* 그 외에는 non-nullable 타입을 반환합니다(예: `cast int as decimal(18, 0)`).

#### 예제 {#examples-3}

| int        | Decimal(18, 9) | 설명 |
| ---------- | -------------- | ------- |
| 123        | 123.00000000   |         |
| 2147483647 | NULL           | 오버플로 |

## float/double에서 변환 {#from-floatdouble}

반올림을 지원합니다.

### 엄격 모드 {#strict-mode-3}

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

* Infinity와 NaN은 오류를 발생시킵니다.

* 오버플로가 발생하면 오류를 반환합니다.

#### 예제 {#examples-4}

| float/double | Decimal(18, 3) | 설명 |
| ------------ | -------------- | ------- |
| 1.1239       | 1.124          | 반올림 |
| 3.40282e+38  | Error          | 오버플로 |
| Infinity     | Error          |         |
| NaN          | Error          |         |

### 비엄격 모드 {#non-strict-mode-3}

항상 nullable 타입을 반환합니다.

* +/-Inf는 NULL로 변환됩니다;

* NaN은 NULL로 변환됩니다;

* 오버플로가 발생하면 NULL로 변환합니다.

#### 예제 {#examples-5}

| float/double | Decimal(18, 6) | 설명 |
| ------------ | -------------- | ------- |
| 1.123456     | 1.123456       |         |
| 3.40282e+38  | NULL           | 오버플로 |
| Infinity     | NULL           |         |
| NaN          | NULL           |         |

## decimal 간 변환 {#cast-between-decimals}

반올림을 지원합니다.

### 엄격 모드 {#strict-mode-4}

오버플로가 발생하면 오류를 반환합니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

#### 예제 {#examples-6}

| Decimal(18, 8) | Decimal(10, 6) | 설명 |
| -------------- | -------------- | ------- |
| 1234.12345678  | 1234.123457    | 반올림 |
| 12345.12345678 | Error          | 정수부 오버플로 |

### 비엄격 모드 {#non-strict-mode-4}

오버플로가 발생하면 NULL로 변환합니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable인 경우:

* 오버플로가 발생할 수 있으면(예: `cast decimal(18, 0) as decimal(9, 0)`) nullable 타입을 반환합니다;

* 그 외에는 non-nullable 타입을 반환합니다(예: `cast decimal(9, 0) as decimal(18, 0)`).

#### 예제 {#examples-7}

| Decimal(18, 8) | Decimal(10, 6) | 설명 |
| -------------- | -------------- | ------- |
| 1234.12345678  | 1234.123457    | 반올림 |
| 12345.12345678 | NULL           | 정수부 오버플로 |

## date에서 변환 {#from-date}

지원하지 않습니다.

## datetime에서 변환 {#from-datetime}

지원하지 않습니다.

## TIMESTAMP_NS에서 변환 {#from-timestamp_ns}

지원하지 않습니다.

## time에서 변환 {#from-time}

지원하지 않습니다.

## 다른 타입에서 변환 {#from-other-types}

지원하지 않습니다
