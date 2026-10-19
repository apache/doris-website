---
{
    "title": "BOOLEAN 타입으로 변환",
    "language": "ko",
    "description": "BOOLEAN 타입은 참 또는 거짓 값을 나타내며, 참과 거짓 두 가지 상태만 가질 수 있습니다."
}
---

BOOLEAN 타입은 참 또는 거짓 값을 나타내며, 참과 거짓 두 가지 상태만 가질 수 있습니다.

## 문자열에서 변환 {#from-string}

:::caution 동작 변경
이전에는 '1.11'과 같은 문자열을 boolean 타입의 'true'로 변환할 수 있었지만, 4.0부터는 null로 변환되거나(비엄격 모드) 오류가 발생합니다(엄격 모드).
이전에는 'on', 'off', 'yes', 'no'와 같은 값이 null로 변환되었지만, 4.0부터는 각각에 해당하는 boolean 값으로 변환할 수 있습니다.
:::

### 엄격 모드 {#strict-mode}

#### BNF 정의 {#bnf-definition}

```xml
<boolean> ::= <whitespace>* <bool_like> <whitespace>*

<bool_like> ::= "0" | "1" | "t" | "T" | "f" | "F" | <yes> | <no> | <on> | <off> | <true> | <false>

<yes> ::= ("y" | "Y") ("e" | "E") ("s" | "S")

<no> ::= ("n" | "N") ("o" | "O")

<on> ::= ("o" | "O") ("n" | "N")

<off> ::= ("o" | "O") ("f" | "F") ("f" | "F")

<true> ::= ("t" | "T") ("r" | "R") ("u" | "U") ("e" | "E")

<false> ::= ("f" | "F") ("a" | "A") ("l" | "L") ("s" | "S") ("e" | "E")

<whitespace> ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"
```

#### 규칙 설명 {#rule-description}

Boolean 값은 0, 1, yes, no, on, off, true, false 형태로 표현할 수 있으며, 대소문자를 구분하지 않습니다. 또한 Boolean 값 앞뒤에는 개수에 제한 없이 공백 문자(스페이스, 탭, 줄바꿈 등)를 넣을 수 있습니다.

형식에 맞지 않으면 오류가 발생합니다.

#### 예제 {#examples}

| 문자열 | bool 변환 결과 | 설명 |
| --- | --- | --- |
| "true" | true | |
| "false" | false | |
| " \t\r\n\f\v true \t\r\n\f\v" | true | 앞뒤에 공백 문자 포함 |
| "1.1" | Error | 잘못된 형식 |
| "YeS" | true | 대소문자를 구분하지 않음 |
| '+0' | Error | 잘못된 형식 |

### 비엄격 모드 {#non-strict-mode}

#### BNF 정의 {#bnf-definition-1}

```xml
<boolean> ::= <whitespace>* <bool_like> <whitespace>*

<bool_like> ::= "0" | "1" | "t" | "T" | "f" | "F" | <yes> | <no> | <on> | <off> | <true> | <false>

<yes> ::= ("y" | "Y") ("e" | "E") ("s" | "S")

<no> ::= ("n" | "N") ("o" | "O")

<on> ::= ("o" | "O") ("n" | "N")

<off> ::= ("o" | "O") ("f" | "F") ("f" | "F")

<true> ::= ("t" | "T") ("r" | "R") ("u" | "U") ("e" | "E")

<false> ::= ("f" | "F") ("a" | "A") ("l" | "L") ("s" | "S") ("e" | "E")

<whitespace> ::= " " | "\t" | "\n" | "\r" | "\f" | "\v"
```

#### 규칙 설명 {#rule-description-1}

Boolean 값은 0, 1, yes, no, on, off, true, false 형태로 표현할 수 있으며, 대소문자를 구분하지 않습니다. 또한 Boolean 값 앞뒤에는 개수에 제한 없이 공백 문자(스페이스, 탭, 줄바꿈 등)를 넣을 수 있습니다.

형식에 맞지 않으면 null을 반환합니다.

#### 예제 {#examples-1}

| 문자열 | bool 변환 결과 | 설명 |
| --- | --- | --- |
| "true" | true | |
| "false" | false | |
| " \t\r\n\f\v true \t\r\n\f\v" | true | 앞뒤에 공백 문자 포함 |
| "1.1" | null | 잘못된 형식 |
| "YeS" | true | 대소문자를 구분하지 않음 |
| '+0' | null | 잘못된 형식 |

## 숫자 타입에서 변환 {#from-numeric}

:::caution 동작 변경
이전에는 date/datetime과 같은 숫자가 아닌 타입도 boolean 타입으로 변환할 수 있었지만, 4.0부터는 지원하지 않습니다.
:::

### 엄격 모드 {#strict-mode-1}

#### 규칙 설명 {#rule-description-2}

숫자 타입(int/double/decimal)에서는 영이 아닌 값을 true로 간주합니다.

부동 소수점 수의 양의 영과 음의 영은 false로 변환됩니다.

#### 예제 {#examples-2}

| 숫자 타입 | bool 변환 결과 | 설명 |
| --- | --- | --- |
| 121231 | true | |
| 0 | false | |
| +0.0 | false | 부동 소수점 수의 양의 영 |
| -0.0 | false | 부동 소수점 수의 음의 영 |
| -1 | true | |
| 1 | true | |

### 비엄격 모드 {#non-strict-mode-1}

#### 규칙 설명 {#rule-description-3}

숫자 타입(int/double/decimal)에서는 영이 아닌 값을 true로 간주합니다.

부동 소수점 수의 양의 영과 음의 영은 false로 변환됩니다.

#### 예제 {#examples-3}

| 숫자 타입 | bool 변환 결과 | 설명 |
| --- | --- | --- |
| 121231 | true | |
| 0 | false | |
| +0.0 | false | 부동 소수점 수의 양의 영 |
| -0.0 | false | 부동 소수점 수의 음의 영 |
| -1 | true | |
| 1 | true | |
