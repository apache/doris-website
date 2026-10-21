---
{
    "title": "MAP 타입으로 변환",
    "language": "ko",
    "description": "MAP 타입은 다양한 기본 타입의 키와 값을 포함할 수 있는 키-값 쌍 데이터를 저장하고 처리하는 데 사용됩니다."
}
---

MAP 타입은 키-값 쌍 데이터를 저장하고 처리하는 데 사용됩니다. 키와 값으로 다양한 기본 타입을 사용할 수 있으며, 다른 복합 타입을 중첩할 수도 있습니다.

## MAP으로 변환 {#cast-to-map}

### String에서 변환 {#from-string}

:::caution 동작 변경
버전 4.0 이전에는 MAP 형식에 맞지 않는 일부 문자열도 정상적으로 변환될 수 있었습니다(예: '{1:1,2}').
버전 4.0부터는 MAP 형식에 맞지 않는 문자열을 변환하면 엄격 모드에서는 오류가 발생하고 비엄격 모드에서는 NULL을 반환합니다.
:::

#### 엄격 모드 {#strict-mode}

##### BNF 정의 {#bnf-definition}

```xml
<map>          ::= "{" <map-content>? "}" | <empty-map> 

<empty-map>    ::= "{}"

<map-content>  ::=  <key-token> <map_key_delimiter> <value-token>
                     (<collection-delim> <key-token> <map_key_delimiter> <value-token>)*

<key-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*
<value-token>  ::= <key-token>

<inner-sequence>    ::= .*
<collection-delim>  ::= "," 
<map_key_delimiter> ::= ":"
```

##### 규칙 설명 {#rule-description}

1. MAP의 텍스트 표현은 여는 중괄호 `{`로 시작하고 닫는 중괄호 `}`로 끝나야 합니다.
2. 빈 MAP은 `{}`로 나타냅니다.
3. MAP 내의 키-값 쌍은 쉼표 `,`로 구분합니다.
4. 각 키-값 쌍은 키, 콜론 `:`, 값으로 구성되며, "key:value" 순서로 작성합니다.
5. 키와 값은 선택적으로 서로 짝이 맞는 작은따옴표(`'`)나 큰따옴표(`"`)로 감쌀 수 있습니다. 따옴표 안의 내용은 하나의 단위로 처리합니다.
6. MAP 내 요소의 앞뒤에는 공백을 사용할 수 있습니다.
7. 파싱 중 `<key-token>`에 일치하는 부분에는 K 타입의 파싱 규칙을 계속 적용하고, `<value-token>`에 일치하는 부분에는 V 타입의 파싱 규칙을 계속 적용합니다. 이때 적용되는 BNF 규칙과 파싱 로직도 현재 MAP<K, V>의 BNF와 파싱 로직의 일부로 간주되며, 이에 따른 오류 처리와 결과도 현재 MAP<K, V>의 동작과 결과에 반영됩니다.
8. 요소에서는 "null"로 null 값을 나타낼 수 있습니다.

MAP 형식에 맞지 않거나 키-값 쌍의 키/값이 해당 타입의 형식에 맞지 않으면 오류가 발생합니다.

##### 예제 {#examples}

| 입력 문자열 | 변환 결과 | 설명 |
| --- | --- | --- |
| "{}" | {} | 유효한 빈 MAP |
| "  {}" | 오류 | 중괄호로 시작하지 않아 파싱 실패 |
| '{123:456}' | MAP\<int,int\>로 변환: {123:456} | 유효한 MAP |
| '{123:null}' | MAP\<int,int\>로 변환: {123:null} | null 값을 포함하는 유효한 MAP |
| '{   123   :   456    }' | MAP\<int,int\>로 변환: {123:456} | 공백을 포함하는 유효한 MAP |
| '{"123":"456"}' | MAP\<int,int\>로 변환: {123:456} | 따옴표를 사용하는 유효한 MAP |
| '{   "123":"abc"  }' | 오류 | "abc"를 int 타입으로 변환할 수 없음 |
| '{ 1:2 ,34, 5:6}' | 오류 | MAP 형식에 맞지 않음 |

#### 비엄격 모드 {#non-strict-mode}

##### BNF 정의 {#bnf-definition-1}

```xml
<map>          ::= "{" <map-content>? "}" | <empty-map> 

<empty-map>    ::= "{}"

<map-content>  ::=  <key-token> <map_key_delimiter> <value-token>
                     (<collection-delim> <key-token> <map_key_delimiter> <value-token>)*

<key-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*
<value-token>  ::= <key-token>

<inner-sequence>    ::= .*
<collection-delim>  ::= "," 
<map_key_delimiter> ::= ":"
```

##### 규칙 설명 {#rule-description-1}

1. MAP의 텍스트 표현은 여는 중괄호 `{`로 시작하고 닫는 중괄호 `}`로 끝나야 합니다.
2. 빈 MAP은 `{}`로 나타냅니다.
3. MAP 내의 키-값 쌍은 쉼표 `,`로 구분합니다.
4. 각 키-값 쌍은 키, 콜론 `:`, 값으로 구성되며, "key:value" 순서로 작성합니다.
5. 키와 값은 선택적으로 서로 짝이 맞는 작은따옴표(`'`)나 큰따옴표(`"`)로 감쌀 수 있습니다. 따옴표 안의 내용은 하나의 단위로 처리합니다.
6. MAP 내 요소의 앞뒤에는 공백을 사용할 수 있습니다.
7. 파싱 중 `<key-token>`에 일치하는 부분에는 K 타입의 파싱 규칙을 계속 적용하고, `<value-token>`에 일치하는 부분에는 V 타입의 파싱 규칙을 계속 적용합니다. 이때 적용되는 BNF 규칙과 파싱 로직도 현재 MAP<K, V>의 BNF와 파싱 로직의 일부로 간주되며, 이에 따른 오류 처리와 결과도 현재 MAP<K, V>의 동작과 결과에 반영됩니다.
8. 요소에서는 "null"로 null 값을 나타낼 수 있습니다.

MAP 형식이 위의 BNF 형식에 맞지 않으면 NULL을 반환합니다.
키-값 쌍의 키/값이 해당 타입의 형식에 맞지 않으면 해당 위치를 null로 설정합니다.

##### 예제 {#examples-1}

| 입력 문자열 | 변환 결과 | 설명 |
| --- | --- | --- |
| "{}" | {} | 유효한 빈 MAP |
| "  {}" | NULL | 중괄호로 시작하지 않아 파싱 실패 |
| '{123:456}' | MAP\<int,int\>로 변환: {123:456} | 유효한 MAP |
| '{123:null}' | MAP\<int,int\>로 변환: {123:null} | null 값을 포함하는 유효한 MAP |
| '{   123   :   456    }' | MAP\<int,int\>로 변환: {123:456} | 공백을 포함하는 유효한 MAP |
| '{"123":"456"}' | MAP\<int,int\>로 변환: {123:456} | 따옴표를 사용하는 유효한 MAP |
| '{   "123":"abc"  }' | MAP\<int,int\>로 변환: {123:null} | "abc"를 int 타입으로 변환할 수 없어 null로 변환 |
| '{ 1:2 ,34, 5:6}' | NULL | MAP 형식에 맞지 않음 |

#### 중첩된 MAP의 중복 키 {#duplicate-keys-in-nested-maps}

문자열을 `MAP`, `ARRAY` 또는 `STRUCT`로 변환하면 Doris는 변환 결과의 모든 `MAP`에서 중복 키를 제거합니다. 여기에는 `ARRAY`, `STRUCT` 또는 MAP 값 안에 중첩된 MAP도 포함됩니다. 같은 키가 여러 번 나타나면 마지막 값을 유지합니다.

```sql
SELECT CAST('{"outer":[{"a":1,"a":2}]}' AS MAP<STRING, ARRAY<MAP<STRING, INT>>>);
SELECT CAST('[{"a":1,"a":2}]' AS ARRAY<MAP<STRING, INT>>);
SELECT CAST('{"m":{"a":1,"a":2}}' AS STRUCT<m:MAP<STRING, INT>>);
```

```text
{"outer":[{"a":2}]}
[{"a":2}]
{"m":{"a":2}}
```

### MAP\<다른 타입\>에서 변환 {#from-mapother-type}

#### 엄격 모드 {#strict-mode-1}

##### 규칙 설명 {#rule-description-2}

MAP의 각 요소에 대해 다른 타입에서 대상 타입으로 변환합니다. 이 변환에도 엄격 모드가 적용됩니다.

##### 예제 {#examples-2}

| 입력 MAP | 변환 결과 | 설명 |
| --- | --- | --- |
| {"123":"456"} | MAP\<int,int\>로 변환: {123:456} | "123"과 "456"을 Int로 변환할 수 있음 |
| {"abc":"123"} | 오류 | "abc"를 Int로 변환할 수 없음 |
| {"123":null} | MAP\<int,int\>로 변환: {123:null} | null을 변환한 결과도 null |

#### 비엄격 모드 {#non-strict-mode-1}

##### 규칙 설명 {#rule-description-3}

MAP의 각 요소에 대해 다른 타입에서 대상 타입으로 변환합니다. 이 변환에도 비엄격 모드가 적용됩니다.

##### 예제 {#examples-3}

| 입력 MAP | 변환 결과 | 설명 |
| --- | --- | --- |
| {"123":"456"} | MAP\<int,int\>로 변환: {123:456} | "123"과 "456"을 Int로 변환할 수 있음 |
| {"abc":"123"} | MAP\<int,int\>로 변환: {null:123} | "abc"를 Int로 변환할 수 없어 null로 변환 |
| {"123":null} | MAP\<int,int\>로 변환: {123:null} | null을 변환한 결과도 null |
