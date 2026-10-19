---
{
    "title": "ARRAY 타입으로 변환",
    "language": "ko",
    "description": "ARRAY 타입은 정수, 문자열 등 다양한 기본 요소 타입을 포함할 수 있는 배열 데이터를 저장하고 처리하는 데 사용됩니다."
}
---

ARRAY 타입은 정수, 문자열 등 다양한 기본 요소 타입을 포함할 수 있는 배열 데이터를 저장하고 처리하는 데 사용되며, 다른 복합 타입을 중첩할 수도 있습니다.

## ARRAY로 변환 {#cast-to-array}

### String에서 변환 {#from-string}

:::caution 동작 변경
4.0 버전 이전에는 구분자 사이에 빈 문자열이 있으면 파싱에 실패했습니다. 예를 들어 "[,,]"는 NULL을 반환했습니다.
4.0 버전부터는 "[,,]"가 비엄격 모드에서 [null, null, null]을 반환하고, 엄격 모드에서는 오류를 보고합니다.
:::


#### 엄격 모드 {#strict-mode}

##### BNF 정의 {#bnf-definition}

```xml
<array>          ::= "[" <array-content>? "]" | <empty-array> 

<empty-array> ::= "[]"

<array-content>  ::=  <data-token>(<collection-delim> <data-token>)*

<data-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*

<inner-sequence>    ::= .*

<collection-delim>  ::= "," 
```

##### 규칙 설명 {#rule-description}

1. 배열의 텍스트 표현은 여는 대괄호 `[`로 시작하고 닫는 대괄호 `]`로 끝나야 합니다.
2. 빈 배열은 `[]`로 직접 표현합니다.
3. 배열 내 요소는 쉼표로 구분합니다.
4. 배열 내 요소의 앞뒤에 공백을 사용할 수 있습니다.
5. 배열 요소는 짝이 맞는 작은따옴표(`'`) 또는 큰따옴표(`"`)로 감쌀 수 있습니다.
6. 요소에 "null"을 사용하여 null 값을 나타낼 수 있습니다.
7. 파싱 중 `<data-token>`과 일치하는 부분에는 대상 타입 T의 파싱 규칙을 계속 적용합니다.

위 규칙을 충족하지 않거나 요소가 해당 타입의 요구 사항을 충족하지 않으면 오류를 보고합니다.

##### 예제 {#examples}

| 입력 문자열 | 변환 결과 | 설명 |
| --- | --- | --- |
| '[]' | [] | 유효한 빈 배열 |
| '  []' | 오류 | 배열이 대괄호로 시작하지 않아 파싱에 실패함 |
| '[ ]' | 오류 | 배열에 공백으로 이루어진 문자열 요소가 하나 있으며, 이 공백 문자열을 int로 파싱할 수 없음 |
| "[     123,       123]" | Array\<int\>로 변환: [123, 123] | 유효한 배열 |
| '[  "  123  "   ,    "456   "]' | Array\<int\>로 변환: [123, 456] | 유효한 배열 |
| '[    123     ,    "456"   ]' | Array\<int\>로 변환: [123, 456] | 유효한 배열 |
| '[ [] ]' | Array\<Array\<int\>\>로 변환: [[]] | 첫 번째 배열의 내부 요소는 ' [] '이며, 앞뒤 공백을 제거하면 유효한 배열이 됨 |
| '[ null ,123]' | Array\<int\>로 변환: [null, 123] | null을 포함하는 유효한 배열 |
| '[ "null" ,123]' | 오류 | 문자열 "null"은 int 타입으로 변환할 수 없음 |

참고: 쉼표 사이의 요소에 유효한 내용이 있는지 확인하세요. 그렇지 않으면 파싱에 실패합니다.

#### 비엄격 모드 {#non-strict-mode}

##### BNF 정의 {#bnf-definition-1}

```xml
<array>          ::= "[" <array-content>? "]" | <empty-array> 

<empty-array> ::= "[]"

<array-content>  ::=  <data-token>(<collection-delim> <data-token>)*

<data-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*

<inner-sequence>    ::= .*

<collection-delim>  ::= "," 
```

##### 규칙 설명 {#rule-description-1}

1. 배열의 텍스트 표현은 여는 대괄호 `[`로 시작하고 닫는 대괄호 `]`로 끝나야 합니다.
2. 빈 배열은 `[]`로 직접 표현합니다.
3. 배열 내 요소는 쉼표로 구분합니다.
4. 배열 내 요소의 앞뒤에 공백을 사용할 수 있습니다.
5. 배열 요소는 짝이 맞는 작은따옴표(`'`) 또는 큰따옴표(`"`)로 감쌀 수 있습니다.
6. 요소에 "null"을 사용하여 null 값을 나타낼 수 있습니다.
7. 파싱 중 `<data-token>`과 일치하는 부분에는 대상 타입 T의 파싱 규칙을 계속 적용합니다.

배열 형식이 위의 BNF 형식을 따르지 않으면 NULL을 반환합니다.
요소가 해당 타입의 요구 사항을 충족하지 않으면 해당 요소의 위치를 null로 설정합니다.

##### 예제 {#examples-1}

| 입력 문자열 | 변환 결과 | 설명 |
| --- | --- | --- |
| '[]' | [] | 유효한 빈 배열 |
| '  []' | NULL | 배열이 대괄호로 시작하지 않아 파싱에 실패함 |
| '[ ]' | [null] | 배열에 공백으로 이루어진 문자열 요소가 하나 있으며, 이 공백 문자열을 int로 파싱할 수 없음 |
| "[     123,       123]" | Array\<int\>로 변환: [123, 123] | 유효한 배열 |
| '[  "  123  "   ,    "456   "]' | Array\<int\>로 변환: [123, 456] | 유효한 배열 |
| '[    123     ,    "456"   ]' | Array\<int\>로 변환: [123, 456] | 유효한 배열 |
| '[ [] ]' | Array\<Array\<int\>\>로 변환: [[]] | 첫 번째 배열의 내부 요소는 ' [] '이며, 앞뒤 공백을 제거하면 유효한 배열이 됨 |
| '[ null ,123]' | Array\<int\>로 변환: [null, 123] | null을 포함하는 유효한 배열 |
| '[ "null" ,123]' | Array\<int\>로 변환: [null, 123] | 문자열 "null"은 int 타입으로 변환할 수 없어 null로 변환됨 |

### Array\<Other Type\>에서 변환 {#from-arrayother-type}

#### 엄격 모드 {#strict-mode-1}

##### 규칙 설명 {#rule-description-2}

Array의 각 요소를 Other Type에서 Type으로 형 변환합니다. 이 형 변환도 엄격 모드로 수행됩니다.

##### 예제 {#examples-2}

| 입력 배열 | 변환 결과 | 설명 |
| --- | --- | --- |
| ["123", "456"] | Array\<int\>로 변환: [123, 456] | "123"과 "456"은 Int로 변환할 수 있음 |
| ["abc", "123"] | 오류 | "abc"는 Int로 변환할 수 없음 |
| [null, "123"] | Array\<int\>로 변환: [null, 123] | null의 형 변환 결과는 그대로 null임 |

#### 비엄격 모드 {#non-strict-mode-1}

##### 규칙 설명 {#rule-description-3}

Array의 각 요소를 Other Type에서 Type으로 형 변환합니다. 이 형 변환도 비엄격 모드로 수행됩니다.

##### 예제 {#examples-3}

| 입력 배열 | 변환 결과 | 설명 |
| --- | --- | --- |
| ["123", "456"] | Array\<int\>로 변환: [123, 456] | "123"과 "456"은 Int로 변환할 수 있음 |
| ["abc", "123"] | Array\<int\>로 변환: [null, 123] | "abc"는 Int로 변환할 수 없어 null로 변환됨 |
| [null, "123"] | Array\<int\>로 변환: [null, 123] | null의 형 변환 결과는 그대로 null임 |
