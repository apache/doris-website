---
{
    "title": "REGEXP_REPLACE",
    "language": "ko",
    "description": "STR 문자열에 정규 표현식 매칭을 수행하고, 패턴과 일치하는 부분을 새 문자열로 바꿉니다."
}
---

## 설명 {#description}

STR 문자열에 정규 표현식 매칭을 수행하고, 패턴과 일치하는 부분을 새 문자열로 바꿉니다.

문자 집합을 매칭할 때는 Utf-8 표준 문자 클래스를 사용해야 합니다. 이렇게 하면 함수가 여러 언어의 다양한 문자를 올바르게 인식하고 처리할 수 있습니다.

`pattern`이 유효한 정규 표현식이 아니면 오류가 발생합니다.

지원되는 문자 클래스: https://github.com/google/re2/wiki/Syntax

## 구문 {#syntax}

```sql
REGEXP_REPLACE(<str>, <pattern>, <repl>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<str>` | Varchar 타입의 매개변수입니다. 정규 표현식 매칭을 수행할 문자열을 나타냅니다. 문자열 리터럴이나 문자열 값이 들어 있는 테이블의 열을 사용할 수 있습니다.|
| `<pattern>` | Varchar 타입의 매개변수입니다. 문자열을 매칭하는 데 사용할 정규 표현식 패턴입니다. 다양한 정규 표현식 메타문자와 구문을 포함하여 복잡한 매칭 규칙을 정의할 수 있습니다.|
| `<repl>` | Varchar 타입의 매개변수입니다. <str>에서 <pattern>과 일치하는 부분을 대체할 문자열입니다. 패턴의 캡처 그룹을 참조하려면 \1, \2 등의 역참조를 사용할 수 있습니다. 여기서 \1은 첫 번째 캡처 그룹을, \2는 두 번째 캡처 그룹을 가리키며, 이후 그룹도 같은 방식으로 참조합니다.|

## 반환 값 {#return-value}

치환 작업을 수행한 결과 문자열을 반환합니다. 반환 값은 Varchar 타입입니다. <str>에서 <pattern>과 일치하는 부분이 없으면 원래 <str>을 반환합니다.

## 예제 {#example}

기본 치환 예제입니다. 이 예제에서는 문자열 'a b c'의 모든 공백을 하이픈으로 바꿉니다.

```sql
mysql> SELECT regexp_replace('a b c', ' ', '-');
+-----------------------------------+
| regexp_replace('a b c', ' ', '-') |
+-----------------------------------+
| a-b-c                             |
+-----------------------------------+
```
캡처 그룹을 사용하는 예제입니다. 여기서는 패턴의 그룹 (b)가 문자 'b'를 캡처한 다음, 대체 문자열의 역참조 \1을 사용하여 <b>로 바꿉니다.

```sql
mysql> SELECT regexp_replace('a b c', '(b)', '<\\1>');
+----------------------------------------+
| regexp_replace('a b c', '(b)', '<\1>') |
+----------------------------------------+
| a <b> c                                |
+----------------------------------------+
```

중국어 문자를 매칭하는 예제입니다. 이 예제에서는 문자열에서 연속된 중국어 문자를 모두 '123'으로 바꿉니다.

```sql
mysql> select regexp_replace('这是一段中文 This is a passage in English 1234567', '\\p{Han}+', '123');
+---------------------------------------------------------------------------------------------+
| regexp_replace('这是一段中文 This is a passage in English 1234567', '\p{Han}+', '123')       |
+---------------------------------------------------------------------------------------------+
| 123This is a passage in English 1234567                                                     |
+---------------------------------------------------------------------------------------------+
```

데이터 삽입 및 테스트 사례입니다. 이 테스트에서는 원본 문자열, 패턴, 대체 문자열을 저장할 테이블을 생성합니다. 그런 다음 다양한 테스트 데이터를 삽입하고, 각 원본 문자열에 해당 패턴과 대체 문자열을 사용하여 REGEXP_REPLACE 연산을 수행합니다. 마지막으로 치환된 문자열을 조회하여 표시합니다.

```sql
-- Create a table to store test data
CREATE TABLE test_table_for_regexp_replace (
        id INT,
        original_text VARCHAR(500),
        pattern VARCHAR(100),
        replacement VARCHAR(100)
    ) PROPERTIES ("replication_num"="1");

-- Insert test data
INSERT INTO test_table_for_regexp_replace VALUES
    (1, 'Hello, World!', ',', '-'),    
    (2, 'apple123', '[0-9]', '*'),    
    (3, 'aabbcc', '(aa|bb|cc)', 'XX'),         
    (4, '123-456-7890', '-', ' '), 
    (5, 'test,data', ',', ';'),              
    (6, 'a1b2c3', '[0-9]', '#'),         
    (7, 'book keeper', 'oo|ee', '**'),        
    (8, 'ababab', '(ab)', 'XY'),       
    (9, 'aabbcc', '(aa|bb|cc)', 'ZZ'),         
    (10, 'apple,banana', ',', ' - ');

-- Perform replacement operations on the inserted data
SELECT id, regexp_replace(original_text, pattern, replacement) as replaced_text FROM test_table_for_regexp_replace ORDER BY id;
```

```text
+------+------------------+
| id   | replaced_text    |
+------+------------------+
|    1 | Hello- World!    |
|    2 | apple***         |
|    3 | XXXXYY           |
|    4 | 123 456 7890     |
|    5 | test;data        |
|    6 | a#b#c#           |
|    7 | b**k k**per      |
|    8 | XYXYXY           |
|    9 | ZZZZYY           |
|   10 | apple - banana   |
+------+------------------+
```

이모지 치환

```sql
SELECT regexp_replace('🌍 Earth 🍔 Food', '🌍|🍔', '*');
```

```text
+----------------------------------------------------------+
| regexp_replace('🌍 Earth 🍔 Food', '🌍|🍔', '*')                 |
+----------------------------------------------------------+
| * Earth * Food                                           |
+----------------------------------------------------------+
```

'str'이 NULL이면 NULL을 반환합니다.

```sql
mysql> SELECT REGEXP_REPLACE(NULL, ' ', '-');
+--------------------------------+
| REGEXP_REPLACE(NULL, ' ', '-') |
+--------------------------------+
| NULL                           |
+--------------------------------+
```

'pattern'이 NULL이면 NULL을 반환합니다.

```sql
mysql> SELECT REGEXP_REPLACE('Hello World', NULL, '-');
+------------------------------------------+
| REGEXP_REPLACE('Hello World', NULL, '-') |
+------------------------------------------+
| NULL                                     |
+------------------------------------------+
```

'repl'이 NULL이면 NULL을 반환합니다.

```sql
mysql> SELECT REGEXP_REPLACE('Hello World', ' ', NULL);
+------------------------------------------+
| REGEXP_REPLACE('Hello World', ' ', NULL) |
+------------------------------------------+
| NULL                                     |
+------------------------------------------+
```

모든 매개변수가 NULL이면 NULL을 반환합니다.

```sql
mysql> SELECT REGEXP_REPLACE(NULL, NULL, NULL);
+----------------------------------+
| REGEXP_REPLACE(NULL, NULL, NULL) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

`pattern`이 유효한 정규 표현식이 아니면 오류가 발생합니다.

```sql
SELECT regexp_replace('a b c', '(b', '<\\1>');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INVALID_ARGUMENT]Could not compile regexp pattern: (b
Error: missing ): (b

```
