---
{
    "title": "INT 타입으로 변환",
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
<integer>       ::= <whitespace>* <sign>? <decimal_digit>+ <whitespace>*

<sign>          ::= "+" | "-"

<decimal_digit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<whitespace>    ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"
```

#### 규칙 설명 {#rule-description}

* 십진수 형식의 숫자만 지원합니다;

* 숫자 앞에 양수 또는 음수 부호를 붙일 수 있습니다;

* 문자열 앞뒤에 임의의 공백 문자를 허용합니다. 허용되는 문자는 ' ', '\t', '\n', '\r', '\f', '\v'입니다;

* 과학적 표기법은 지원하지 않습니다;

* 그 외 형식은 오류를 반환합니다;

* 오버플로가 발생하면 오류를 반환합니다.

#### 예시 {#examples}

| 문자열                              | int 변환 결과 | 설명                                  |
| ----------------------------------- | ------------------ | ---------------------------------------- |
| "2147483647"                        | 2147483647         |                                          |
| "-2147483648"                       | -2147483648        |                                          |
| " \t\r\n\f\v2147483647 \t\r\n\f\v"  | 2147483647         | 앞뒤에 공백 포함       |
| " \t\r\n\f\v+2147483647 \t\r\n\f\v" | 2147483647         | 앞뒤에 공백 및 양수 부호 포함 |
| " \t\r\n\f\v-2147483648 \t\r\n\f\v" | -2147483648        | 앞뒤에 공백 및 음수 부호 포함 |
| 'abc'                               | Error              | 잘못된 형식                           |
| '123.456'                           | Error              | 소수 형식은 지원하지 않음             |
| '1.23456e5'                         | Error              | 과학적 표기법은 지원하지 않음        |
| '2147483648'                        | Error              | 오버플로                                 |
| '-2147483649'                       | Error              | 오버플로                                 |

### 비엄격 모드 {#non-strict-mode}

항상 nullable 타입을 반환합니다.

#### BNF 정의 {#bnf-definition-1}

```xml
<integer_non_strict> ::= <whitespace_char>* <sign>? <number> <whitespace_char>*

<sign>               ::= "+" | "-"

<number>             ::= <decimal_number> | <decimal_number> "." <decimal_number> | <decimal_number> "." | "." <decimal_number>

<decimal_number>     ::= <decimal_digit>+

<decimal_digit>      ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

<whitespace_char>    ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"
```

#### 규칙 설명 {#rule-description-1}

* 엄격 모드에서 유효한 모든 형식을 지원합니다;

* 엄격 모드 형식 뒤에 소수 부분이 붙은 형식을 지원하며, 변환 시 소수 부분을 그대로 버립니다;

* 과학적 표기법 형식은 NULL로 변환합니다;

* 그 외 모든 형식은 NULL로 변환합니다;

* 오버플로가 발생하면 NULL로 변환합니다.

#### 예시 {#examples-1}

| 문자열                              | int 변환 결과 | 설명                                  |
| ----------------------------------- | ------------------ | ---------------------------------------- |
| "2147483647"                        | 2147483647         |                                          |
| "-2147483648"                       | -2147483648        |                                          |
| " \t\r\n\f\v2147483647 \t\r\n\f\v"  | 2147483647         | 앞뒤에 공백 포함       |
| " \t\r\n\f\v+2147483647 \t\r\n\f\v" | 2147483647         | 앞뒤에 공백 및 양수 부호 포함 |
| " \t\r\n\f\v-2147483648 \t\r\n\f\v" | -2147483648        | 앞뒤에 공백 및 음수 부호 포함 |
| '123.456'                           | 123                |                                          |
| '1.23456e5'                         | NULL               | 과학적 표기법                      |
| 'abc'                               | NULL               | 잘못된 형식                           |
| '2147483648'                        | NULL               | 오버플로                                 |
| '-2147483649'                       | NULL               | 오버플로                                 |

## bool에서 변환 {#from-bool}

true는 1로, false는 0으로 변환됩니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

## integer에서 integer로 변환 {#from-integer-to-integer}

모든 정수 타입 간의 변환을 지원합니다.

### 엄격 모드 {#strict-mode-1}

오버플로가 발생하면 오류를 반환합니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

#### 예시 {#examples-2}

| Bigint      | int        | 설명 |
| ----------- | ---------- | ------- |
| 2147483647  | 2147483647 |         |
| 2147483648  | Error      | 오버플로 |
| -2147483649 | Error      | 오버플로 |

### 비엄격 모드 {#non-strict-mode-1}

:::caution 동작 변경
버전 4.0부터 오버플로 발생 시 결과는 정의되지 않은 값 대신 NULL이 됩니다.
:::

오버플로가 발생하면 NULL을 반환합니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable인 경우:

* 오버플로가 발생할 수 있으면(예: `cast bigint as int`) nullable 타입을 반환합니다;

* 그 외에는 non-nullable 타입을 반환합니다(예: `cast int as bigint`).

#### 예시 {#examples-3}

| Bigint      | int        | 설명 |
| ----------- | ---------- | ------- |
| 2147483647  | 2147483647 |         |
| 2147483648  | NULL       | 오버플로 |
| -2147483649 | NULL       | 오버플로 |

## date에서 변환 {#from-date}

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

### 규칙 설명 {#rule-description-2}

:::caution 동작 변경
버전 4.0부터 date를 tinyint 및 smallint로 변환하는 기능을 더 이상 지원하지 않습니다.
:::

* 오버플로가 반드시 발생하므로 tinyint 및 smallint로의 변환은 지원하지 않습니다.

* int, bigint 및 largeint로의 변환을 지원합니다. 날짜의 연도, 월, 일을 순서대로 이어 붙여 정수를 만듭니다. 월과 일은 두 자리로 처리하며, 10 미만이면 앞에 0을 붙입니다.

### 예시 {#examples-4}

| date       | int      |
| ---------- | -------- |
| 2025-03-14 | 20250314 |

## datetime에서 변환 {#from-datetime}

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

### 규칙 설명 {#rule-description-3}

:::caution 동작 변경
버전 4.0부터 datetime을 tinyint, smallint 및 int로 변환하는 기능을 더 이상 지원하지 않습니다.
:::

* 오버플로가 반드시 발생하므로 tinyint, smallint, int로의 변환은 지원하지 않습니다;

* bigint, largeint로의 변환을 지원합니다. datetime의 마이크로초 부분을 버린 다음 연도, 월, 일, 시, 분, 초를 순서대로 이어 붙여 정수를 만듭니다. 월, 일, 시, 분, 초는 두 자리로 처리하며, 10 미만이면 앞에 0을 붙입니다.

### 예시 {#examples-5}

| datetime                   | int            |
| -------------------------- | -------------- |
| 2025-03-14 17:00:01.123456 | 20250314170001 |
| 9999-12-31 23:59:59.999999 | 99991231235959 |

## float/double에서 변환 {#from-floatdouble}

반올림은 지원하지 않습니다.

### 엄격 모드 {#strict-mode-2}

#### 규칙 설명 {#rule-description-4}

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

* 오버플로가 발생하면 오류를 반환합니다;

* Infinity 및 NaN 값은 오류를 반환합니다.

#### 예시 {#examples-6}

| float/double | int로 변환 | 설명 |
| ------------ | ----------- | ------- |
| 1.5          | 1           | 소수 부분 버림 |
| 1.79769E308  | Error       | 오버플로 |
| Infinity     | Error       |         |
| NaN          | Error       |         |

### 비엄격 모드 {#non-strict-mode-2}

항상 nullable 타입을 반환합니다.

#### 규칙 설명 {#rule-description-5}

:::caution 동작 변경
버전 4.0부터 오버플로 발생 시 결과는 정의되지 않은 값 대신 NULL이 됩니다.
:::

* 오버플로가 발생하면 NULL로 변환합니다;

* Infinity는 NULL로 변환합니다;

* NaN은 NULL로 변환합니다.

#### 예시 {#examples-7}

| float/double | int로 변환 | 설명 |
| ------------ | ----------- | ------- |
| 1.5          | 1           | 소수 부분 버림 |
| 1.79769E308  | NULL        | 오버플로 |
| Infinity     | NULL        |         |
| -Infinity    | NULL        |         |
| NaN          | NULL        |         |

## decimal에서 변환 {#from-decimal}

반올림은 지원하지 않습니다.

### 엄격 모드 {#strict-mode-3}

오버플로가 발생하면 오류를 반환합니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

#### 예시 {#examples-8}

| Decimal(18, 6)  | int   | 설명    |
| --------------- | ----- | ---------- |
| 1.654321        | 1     | 소수 부분 버림 |
| 12345678901.123 | Error | 오버플로   |

### 비엄격 모드 {#non-strict-mode-3}

오버플로가 발생하면 NULL로 변환합니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable인 경우:

* 오버플로가 발생할 수 있으면(예: `cast decimal(18, 0) as int`) nullable 타입을 반환합니다;

* 그 외에는 non-nullable 타입을 반환합니다(예: `cast decimal(9, 0) as bigint`).

#### 예시 {#examples-9}

| Decimal(18, 6)  | int  | 설명    |
| --------------- | ---- | ---------- |
| 1.654321        | 1    | 소수 부분 버림 |
| 12345678901.123 | NULL | 오버플로   |

## time에서 변환 {#from-time}

마이크로초 단위로 변환합니다.

### 엄격 모드 {#strict-mode-4}

오버플로가 발생하면 오류를 반환합니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable이면 non-nullable 타입을 반환합니다.

#### 예시 {#examples-10}

| Time      | int     | 설명 |
| --------- | ------- | ------- |
| 00:00:01  | 1000000 |         |
| 838:59:58 | Error   | 오버플로 |

### 비엄격 모드 {#non-strict-mode-4}

:::caution 동작 변경
버전 4.0부터 오버플로 발생 시 결과는 정의되지 않은 값 대신 NULL이 됩니다.
:::

오버플로가 발생하면 NULL로 변환합니다.

원본 타입이 nullable이면 nullable 타입을 반환합니다.

원본 타입이 non-nullable인 경우:

* 오버플로가 발생할 수 있으면(예: `cast time as tinyint`) nullable 타입을 반환합니다;

* 그 외에는 non-nullable 타입을 반환합니다(예: `cast time as bigint`).

#### 예시 {#examples-11}

| Time      | int     | 설명 |
| --------- | ------- | ------- |
| 00:00:01  | 1000000 |         |
| 838:59:58 | NULL    | 오버플로 |

## 기타 타입 {#other-types}

지원하지 않습니다
