---
{
    "title": "STRUCT 타입으로 변환",
    "language": "ko",
    "description": "STRUCT 타입은 구조화된 데이터를 저장하고 처리하는 데 사용됩니다. 서로 다른 타입의 필드를 포함할 수 있으며, 각 필드는 이름과 해당 값을 가집니다."
}
---

STRUCT 타입은 구조화된 데이터를 저장하고 처리하는 데 사용됩니다. 서로 다른 타입의 필드를 포함할 수 있으며, 각 필드는 이름과 해당 값을 가집니다. STRUCT는 ARRAY, MAP 또는 다른 STRUCT와 같은 복합 타입을 중첩할 수 있습니다.

## STRUCT로 변환 {#cast-to-struct}

### String에서 변환 {#from-string}

#### 엄격 모드 {#strict-mode}

##### BNF 정의 {#bnf-definition}

```xml
<struct>          ::= "{" <struct-content>? "}" | <empty-struct> 

<empty-struct> ::= "{}"

<struct-content>  ::=  <struct-field-value-content> | <struct-only-value-content>

<struct-field-value-content> ::=  <field-token> <map_key_delimiter> <value-token>
                     (<collection-delim> <field-token> <map_key_delimiter> <value-token>)*
                         
<struct-only-value-content> ::=  <value-token>(<collection-delim> <value-token>)*

<value-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*

<inner-sequence>    ::= .*
<collection-delim>  ::= "," 
<map_key_delimiter> ::= ":"
```

##### 규칙 설명 {#rule-description}

1. STRUCT의 텍스트 표현은 여는 중괄호 `{`로 시작하고 닫는 중괄호 `}`로 끝나야 합니다.
2. 빈 STRUCT는 `{}`로 직접 표현합니다.
3. STRUCT 내부의 필드-값 쌍은 쉼표 `,`로 구분합니다.
4. 각 필드-값 쌍은 선택적 필드 이름, 콜론 `:`, 값으로 구성되며, "fieldname:value" 순서로 작성하거나 "value"만 작성합니다.
5. 필드-값 쌍은 모두 "fieldname:value" 형식을 사용하거나 모두 "value" 형식을 사용해야 합니다.
6. 필드 이름과 값은 서로 짝이 맞는 작은따옴표 (`'`) 또는 큰따옴표 (`"`)로 감쌀 수 있습니다. 따옴표 안의 내용은 하나의 항목으로 처리됩니다.
7. STRUCT 내부 요소의 앞뒤에는 공백을 사용할 수 있습니다.
8. 파싱 중에 `<value-token>`과 일치하는 부분에는 해당 값 타입의 파싱 규칙을 계속 적용합니다. `<field-token>` 부분의 처리 방식은 필드 이름이 제공되었는지에 따라 달라집니다.
   - **필드 이름이 제공된 경우:** 대소문자를 구분하지 않고 **이름으로** 필드를 매칭합니다. 입력 필드의 순서는 STRUCT에 정의된 순서와 일치하지 **않아도 됩니다**. STRUCT에 정의되어 있지만 입력에 없는 필드는 NULL로 채웁니다. 엄격 모드에서는 STRUCT에 존재하지 않는 필드 이름이 입력에 있으면 오류가 발생합니다.
   - **필드 이름이 제공되지 않은 경우:** 위치에 따라 필드를 매칭하며, 값의 수는 STRUCT에 정의된 필드 수와 **정확히 같아야 합니다**.
9. 요소는 "null"을 사용하여 null 값을 나타낼 수 있습니다.

STRUCT 형식이 요구 사항을 충족하지 않으면 오류가 발생합니다. 예를 들면 다음과 같습니다.
1. 필드 이름이 제공되지 않았을 때 값의 수가 STRUCT에 정의된 필드 수와 다른 경우.
2. 필드 이름이 제공되었을 때 입력에 STRUCT에 존재하지 않는 필드 이름이 포함된 경우.
3. 일부 필드-값 쌍에만 필드 이름이 있는 경우(모든 쌍에 필드 이름이 있거나 모든 쌍에 필드 이름이 없어야 합니다).

STRUCT의 값이 해당 타입의 요구 사항을 충족하지 않으면 오류가 발생합니다.

##### 예시 {#examples}

| 입력 문자열 | 변환 결과 | 설명 |
| --- | --- | --- |
| "{}" | {} | 유효한 빈 STRUCT |
| "  {}" | 오류 | 중괄호로 시작하지 않아 파싱 실패 |
| '{"a":1,"b":1}' | STRUCT\<a:int, b:int\>로 변환: {"a":1, "b":1} | 필드 이름이 있는 유효한 STRUCT |
| '{a:1,"b":3.14}' | STRUCT\<a:int, b:double\>로 변환: {"a":1, "b":3.14} | 필드 이름은 따옴표로 감싸거나 감싸지 않아도 됨 |
| '{1,3.14}' | STRUCT\<a:int, b:double\>로 변환: {"a":1, "b":3.14} | 필드 이름이 제공되지 않아 위치에 따라 매칭 |
| '{b:3.14,a:1}' | STRUCT\<a:int, b:double\>로 변환: {"a":1, "b":3.14} | 필드 이름이 제공되면 이름으로 필드를 매칭하며, 입력 순서는 스키마와 달라도 됨 |
| '{A:1,B:3.14}' | STRUCT\<a:int, b:double\>로 변환: {"a":1, "b":3.14} | 대소문자를 구분하지 않고 필드 이름을 매칭 |
| '{a:1}' | STRUCT\<a:int, b:double\>로 변환: {"a":1, "b":null} | 입력에 없는 필드 b를 NULL로 채움 |
| '{a:1,c:100}' | STRUCT\<a:int, b:double\>로 변환: 오류 | 필드 이름 c가 STRUCT에 존재하지 않아 엄격 모드에서 오류 발생 |
| '{a:1,3.1,c:100}' | 오류 | 필드 이름이 있는 항목과 없는 항목이 혼재 |
| '{1,3.14,100}' | STRUCT\<a:int, b:double\>로 변환: 오류 | 필드 이름이 제공되지 않았으며 값의 수가 정의된 필드 수와 일치하지 않음 |
| '{"a":"abc","b":1}' | STRUCT\<a:int, b:int\>로 변환: 오류 | "abc"를 int 타입으로 변환할 수 없음 |
| '{null,1}' | STRUCT\<a:int, b:int\>로 변환: {"a":null, "b":1} | null 값이 있는 유효한 STRUCT |
| '{"name":"John","age":25}' | STRUCT\<name:string, age:int\>로 변환: {"name":"John", "age":25} | 문자열 값이 있는 STRUCT |
| '{{"x":1,"y":2},3}' | STRUCT\<point:struct<x:int,y:int>, z:int\>로 변환: {"point":{"x":1,"y":2}, "z":3} | 중첩된 STRUCT 구조 |

#### 비엄격 모드 {#non-strict-mode}

##### BNF 정의 {#bnf-definition-1}

```xml
<struct>          ::= "{" <struct-content>? "}" | <empty-struct> 

<empty-struct> ::= "{}"

<struct-content>  ::=  <struct-field-value-content> | <struct-only-value-content>

<struct-field-value-content> ::=  <field-token> <map_key_delimiter> <value-token>
                     (<collection-delim> <field-token> <map_key_delimiter> <value-token>)*
                         
<struct-only-value-content> ::=  <value-token>(<collection-delim> <value-token>)*

<value-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*

<inner-sequence>    ::= .*
<collection-delim>  ::= "," 
<map_key_delimiter> ::= ":"
```

##### 규칙 설명 {#rule-description-1}

1. STRUCT의 텍스트 표현은 여는 중괄호 `{`로 시작하고 닫는 중괄호 `}`로 끝나야 합니다.
2. 빈 STRUCT는 `{}`로 직접 표현합니다.
3. STRUCT 내부의 필드-값 쌍은 쉼표 `,`로 구분합니다.
4. 각 필드-값 쌍은 선택적 필드 이름, 콜론 `:`, 값으로 구성되며, "fieldname:value" 순서로 작성하거나 "value"만 작성합니다.
5. 필드-값 쌍은 모두 "fieldname:value" 형식을 사용하거나 모두 "value" 형식을 사용해야 합니다.
6. 필드 이름과 값은 서로 짝이 맞는 작은따옴표 (`'`) 또는 큰따옴표 (`"`)로 감쌀 수 있습니다. 따옴표 안의 내용은 하나의 항목으로 처리됩니다.
7. STRUCT 내부 요소의 앞뒤에는 공백을 사용할 수 있습니다.
8. 파싱 중에 `<value-token>`과 일치하는 부분에는 해당 값 타입의 파싱 규칙을 계속 적용합니다. `<field-token>` 부분의 처리 방식은 필드 이름이 제공되었는지에 따라 달라집니다.
   - **필드 이름이 제공된 경우:** 대소문자를 구분하지 않고 **이름으로** 필드를 매칭합니다. 입력 필드의 순서는 STRUCT에 정의된 순서와 일치하지 **않아도 됩니다**. STRUCT에 정의되어 있지만 입력에 없는 필드는 NULL로 채웁니다. 입력에 있는 필드 이름이 STRUCT에 존재하지 않으면 해당 필드를 무시합니다.
   - **필드 이름이 제공되지 않은 경우:** 위치에 따라 필드를 매칭하며, 값의 수는 STRUCT에 정의된 필드 수와 **정확히 같아야 합니다**.
9. 요소는 "null"을 사용하여 null 값을 나타낼 수 있습니다.

STRUCT 형식이 요구 사항을 충족하지 않으면 NULL을 반환합니다. 예를 들면 다음과 같습니다.
1. 필드 이름이 제공되지 않았을 때 값의 수가 STRUCT에 정의된 필드 수와 다른 경우.
2. 일부 필드-값 쌍에만 필드 이름이 있는 경우(모든 쌍에 필드 이름이 있거나 모든 쌍에 필드 이름이 없어야 합니다).

STRUCT의 값이 해당 타입의 요구 사항을 충족하지 않으면 해당 위치의 값을 null로 설정합니다.

##### 예시 {#examples-1}

| 입력 문자열 | 변환 결과 | 설명 |
| --- | --- | --- |
| "{}" | {} | 유효한 빈 STRUCT |
| "  {}" | NULL | 중괄호로 시작하지 않아 파싱 실패 |
| '{"a":1,"b":1}' | STRUCT\<a:int, b:int\>로 변환: {"a":1, "b":1} | 필드 이름이 있는 유효한 STRUCT |
| '{a:1,"b":3.14}' | STRUCT\<a:int, b:double\>로 변환: {"a":1, "b":3.14} | 필드 이름은 따옴표로 감싸거나 감싸지 않아도 됨 |
| '{1,3.14}' | STRUCT\<a:int, b:double\>로 변환: {"a":1, "b":3.14} | 필드 이름이 제공되지 않아 위치에 따라 매칭 |
| '{b:3.14,a:1}' | STRUCT\<a:int, b:double\>로 변환: {"a":1, "b":3.14} | 필드 이름이 제공되면 이름으로 필드를 매칭하며, 입력 순서는 스키마와 달라도 됨 |
| '{A:1,B:3.14}' | STRUCT\<a:int, b:double\>로 변환: {"a":1, "b":3.14} | 대소문자를 구분하지 않고 필드 이름을 매칭 |
| '{a:1}' | STRUCT\<a:int, b:double\>로 변환: {"a":1, "b":null} | 입력에 없는 필드 b를 NULL로 채움 |
| '{a:1,c:100}' | STRUCT\<a:int, b:double\>로 변환: {"a":1, "b":null} | 알 수 없는 필드 c를 무시하고 누락된 필드 b를 NULL로 채움 |
| '{a:1,3.1,c:100}' | NULL | 필드 이름이 있는 항목과 없는 항목이 혼재 |
| '{1,3.14,100}' | STRUCT\<a:int, b:double\>로 변환: NULL | 필드 이름이 제공되지 않았으며 값의 수가 정의된 필드 수와 일치하지 않음 |
| '{"a":"abc","b":1}' | STRUCT\<a:int, b:int\>로 변환: {"a":null, "b":1} | "abc"를 int 타입으로 변환할 수 없어 해당 위치의 값을 null로 설정 |
| '{null,1}' | STRUCT\<a:int, b:int\>로 변환: {"a":null, "b":1} | null 값이 있는 유효한 STRUCT |
| '{"name":"John","age":"twenty-five"}' | STRUCT\<name:string, age:int\>로 변환: {"name":"John", "age":null} | "twenty-five"를 int 타입으로 변환할 수 없어 해당 위치의 값을 null로 설정 |
| '{{"x":"one","y":2},3}' | STRUCT\<point:struct<x:int,y:int>, z:int\>로 변환: {"point":{"x":null,"y":2}, "z":3} | 중첩된 STRUCT에서 변환에 실패하면 null로 설정 |

### STRUCT\<다른 타입\>에서 변환 {#from-structother-type}

원본 데이터가 STRUCT 타입이고 대상도 STRUCT 타입인 경우 다음 조건을 충족해야 합니다.

1. 원본 STRUCT와 대상 STRUCT의 요소(필드) 수가 같아야 합니다
2. 원본 STRUCT의 각 요소는 순서대로 대상 STRUCT의 해당 요소 타입으로 변환됩니다

요소 수가 일치하지 않는 등 위 조건을 충족하지 않으면 변환할 수 없습니다.

#### 엄격 모드 {#strict-mode-1}

##### 규칙 설명 {#rule-description-2}

STRUCT의 각 요소에 대해 다른 타입에서 대상 타입으로 형 변환을 수행합니다. 이 형 변환에도 엄격 모드를 적용합니다.

##### 예시 {#examples-2}

```sql
-- Create a simple STRUCT type variable
mysql> SELECT named_struct('a', 123, 'b', 'abc') AS original_struct;
+----------------------+
| original_struct      |
+----------------------+
| {"a":123, "b":"abc"} |
+----------------------+
-- Result: {"a":123,"b":"abc"} Type: struct<a:tinyint,b:varchar(3)>

-- Normal CAST
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint, d:string>) AS renamed_struct;
+----------------------+
| renamed_struct       |
+----------------------+
| {"c":123, "d":"abc"} |
+----------------------+

-- Fields count doesn't match
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint, d:string,e:char>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

-- Element in STRUCT doesn't have a corresponding CAST
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:Array<int>, a:int>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

-- CAST is based on the defined order, not field names
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
+------------------------+
| renamed_struct         |
+------------------------+
| {"b":"123", "a":"abc"} |
+------------------------+

-- Element CAST fails, the whole CAST reports an error
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]parse number fail, string: 'abc'
```

#### 비엄격 모드 {#non-strict-mode-1}

##### 규칙 설명 {#rule-description-3}

STRUCT의 각 요소에 대해 다른 타입에서 대상 타입으로 형 변환을 수행합니다. 이 형 변환에도 비엄격 모드를 적용합니다.

##### 예시 {#examples-3}

```sql
-- Create a simple STRUCT type variable
mysql> SELECT named_struct('a', 123, 'b', 'abc') AS original_struct;
+----------------------+
| original_struct      |
+----------------------+
| {"a":123, "b":"abc"} |
+----------------------+
-- Result: {"a":123,"b":"abc"} Type: struct<a:tinyint,b:varchar(3)>

-- Normal CAST
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint, d:string>) AS renamed_struct;
+----------------------+
| renamed_struct       |
+----------------------+
| {"c":123, "d":"abc"} |
+----------------------+

-- Fields count doesn't match
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint, d:string,e:char>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

-- Element in STRUCT doesn't have a corresponding CAST
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:Array<int>, a:int>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

-- CAST is based on the defined order, not field names
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
+------------------------+
| renamed_struct         |
+------------------------+
| {"b":"123", "a":"abc"} |
+------------------------+

-- Element CAST fails, the corresponding element is set to null
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
+-----------------------+
| renamed_struct        |
+-----------------------+
| {"b":"123", "a":null} |
+-----------------------+
```
