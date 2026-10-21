---
{
    "title": "REGEXP_REPLACE_ONE",
    "language": "ko",
    "description": "REGEXP_REPLACE_ONE 함수는 주어진 문자열에서 정규 표현식 매칭을 수행하는 강력한 도구입니다."
}
---

## 설명 {#description}

`REGEXP_REPLACE_ONE` 함수는 주어진 문자열에서 정규 표현식 매칭을 수행하는 강력한 도구입니다. 문자열에서 특정 패턴이 처음 나타나는 부분을 찾아 치환할 수 있습니다. 

텍스트 데이터를 다룰 때는 특정 규칙에 따라 문자열을 조작해야 하는 경우가 많습니다. 정규 표현식을 사용하면 이러한 규칙을 유연하고 효율적으로 정의할 수 있습니다. 이 함수는 문자열(`str`), 정규 표현식 패턴(`pattern`), 치환 문자열(`repl`)을 인수로 받습니다. 그런 다음 `str`에서 `pattern`과 일치하는 첫 번째 부분을 찾아 `repl`로 치환합니다.

문자 집합 매칭을 처리할 때는 Utf-8 표준 문자 클래스를 사용해야 합니다. 이를 통해 함수가 다양한 언어의 문자를 올바르게 식별하고 처리할 수 있습니다.

`pattern`이 유효한 정규 표현식이 아니면 오류가 발생합니다.

지원되는 문자 매칭 클래스: https://github.com/google/re2/wiki/Syntax

## 구문 {#syntax}

```sql
REGEXP_REPLACE_ONE(<str>, <pattern>, <repl>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<str>` | 문자열 타입의 매개변수입니다. 정규 표현식 매칭을 수행할 문자열을 나타내며, 수정하려는 대상 문자열입니다.|
| `<pattern>` | 이 매개변수도 문자열 타입이며, 정규 표현식 패턴을 나타냅니다. 함수는 <str> 문자열에서 이 패턴이 처음 나타나는 부분을 찾습니다.|
| `<repl>` | 이 매개변수 역시 문자열 타입입니다. <str>에서 <pattern>과 처음 일치하는 부분을 대체할 문자열을 담습니다.|

## 반환 값 {#return-value}

함수는 치환 작업을 수행한 결과 문자열을 반환합니다. 반환 타입은 Varchar입니다. <str>에서 <pattern>과 일치하는 부분이 없으면 원래 <str>을 반환합니다.

## 예제 {#example}

첫 번째 공백을 하이픈으로 치환
 설명: 이 예제에서 입력 문자열 <str>은 'a b c', 정규 표현식 패턴 <pattern>은 공백 하나인 ' ', 치환 문자열 <repl>은 하이픈 '-'입니다. 함수는 문자열 'a b c'에서 첫 번째 공백을 찾아 하이픈으로 치환합니다. 따라서 출력은 'a-b c'입니다.

```sql
mysql> SELECT regexp_replace_one('a b c', ' ', '-');

+-----------------------------------+
| regexp_replace_one('a b c', ' ', '-') |
+-----------------------------------+
| a-b c                             |
+-----------------------------------+
```

처음 일치하는 그룹을 치환합니다. 여기서 입력 문자열 <str>은 'a b b'이고, 정규 표현식 패턴 <pattern>은 문자 'b'와 일치하는 캡처 그룹인 '(b)'입니다. 치환 문자열 <repl>은 '<\1>'이며, \1은 첫 번째 캡처 그룹(이 경우 일치한 'b')을 가리킵니다. 함수는 문자열 'a b b'에서 처음 나타나는 'b'를 찾아 '<b>'로 치환합니다. 따라서 출력은 'a <b> b'입니다.


```sql
mysql> SELECT regexp_replace_one('a b b', '(b)', '<\\1>');
+----------------------------------------+
| regexp_replace_one('a b b', '(b)', '<\1>') |
+----------------------------------------+
| a <b> b                                |
+----------------------------------------+
```
첫 번째 한자를 치환합니다. 입력 문자열 <str>은 한자와 영어 텍스트가 포함된 긴 문자열입니다. 정규 표현식 패턴 <pattern>은 모든 한자와 일치하는 Unicode 문자 클래스인 '\p{Han}'입니다. 치환 문자열 <repl>은 '123'입니다. 함수는 문자열에서 첫 번째 한자를 찾아 '123'으로 치환합니다. 따라서 출력은 '123是一段中文This is a passage in English 1234567'입니다.

```sql
mysql> select regexp_replace_one('这是一段中文 This is a passage in English 1234567', '\\p{Han}', '123');
+------------------------------------------------------------------------------------------------+
| regexp_replace_one('这是一段中文 This is a passage in English 1234567', '\p{Han}', '123')       |
+------------------------------------------------------------------------------------------------+
| 123是一段中文This is a passage in English 1234567                                              |
+------------------------------------------------------------------------------------------------+
```

테이블에 데이터를 삽입하고 치환을 수행합니다. 먼저 test_table_for_regexp_replace_one이라는 이름의 테이블을 생성합니다. 이 테이블에는 id(정수), text_data(치환을 수행할 문자열), pattern(매칭에 사용할 정규 표현식 패턴), repl(치환 문자열)의 네 열이 있습니다. 그런 다음 각 열에 서로 다른 값을 담은 데이터 열 행을 테이블에 삽입합니다. 마지막으로 SELECT 문으로 테이블을 쿼리합니다. 각 행에서 해당 pattern과 repl 값을 사용하여 text_data 열에 REGEXP_REPLACE_ONE 함수를 적용합니다. 치환 결과에는 replaced_result라는 별칭을 지정합니다. 행은 id 열을 기준으로 정렬합니다.

```sql
CREATE TABLE test_table_for_regexp_replace_one (
        id INT,
        text_data VARCHAR(500),
        pattern VARCHAR(100),
        repl VARCHAR(100)
    ) PROPERTIES ("replication_num"="1");

INSERT INTO test_table_for_regexp_replace_one VALUES
    (1, 'Hello World', ' ', '-'),    
    (2, 'apple123', '[0-9]', 'X'),    
    (3, 'aabbcc', '(aa)', 'AA'),         
    (4, '123-456-7890', '[0-9][0-9][0-9]', 'XXX'), 
    (5, 'test,data', ',', ';'),              
    (6, 'a1b2c3', '[a-z][0-9]', 'X'),         
    (7, 'book keeper', 'oo', 'OO'),        
    (8, 'ababab', '(ab)', 'AB'),       
    (9, 'aabbcc', '(bb)', 'BB'),         
    (10, 'apple,banana', '[aeiou]', 'X');

SELECT id, regexp_replace_one(text_data, pattern, repl) as replaced_result FROM test_table_for_regexp_replace_one ORDER BY id;
```

```text
+------+-----------------+
| id   | replaced_result |
+------+-----------------+
|    1 | Hello-World     |
|    2 | appleX23        |
|    3 | AAbbcc          |
|    4 | XXX-456-7890    |
|    5 | test;data       |
|    6 | Xb2c3           |
|    7 | BOOk keeper     |
|    8 | ABabab          |
|    9 | aaBBcc          |
|   10 | Xpple,banana    |
+------+-----------------+
```

이모지 하나를 치환하는 예제

```sql 
SELECT regexp_replace_one('😀😊😀', '😀|😊', '[SMILE]');
```

```text
+------------------------------------------------------------+
| regexp_replace_one('😀😊😀', '😀|😊', '[SMILE]')                     |
+------------------------------------------------------------+
| [SMILE]😊😀                                                    |
+------------------------------------------------------------+
```


'str'이 NULL이면 NULL을 반환합니다.
```sql
mysql> SELECT REGEXP_REPLACE_ONE(NULL, ' ', '-');
+------------------------------------+
| REGEXP_REPLACE_ONE(NULL, ' ', '-') |
+------------------------------------+
| NULL                               |
+------------------------------------+
```

'pattern'이 NULL이면 NULL을 반환합니다.

```sql
mysql> SELECT REGEXP_REPLACE_ONE('Hello World', NULL, '-');
+----------------------------------------------+
| REGEXP_REPLACE_ONE('Hello World', NULL, '-') |
+----------------------------------------------+
| NULL                                         |
+----------------------------------------------+
```
'repl'이 NULL이면 NULL을 반환합니다.

```sql
mysql> SELECT REGEXP_REPLACE_ONE('Hello World', ' ', NULL);
+----------------------------------------------+
| REGEXP_REPLACE_ONE('Hello World', ' ', NULL) |
+----------------------------------------------+
| NULL                                         |
+----------------------------------------------+
```

모든 매개변수가 NULL이면 NULL을 반환합니다.

```sql
mysql> SELECT REGEXP_REPLACE_ONE(NULL, NULL, NULL);
+--------------------------------------+
| REGEXP_REPLACE_ONE(NULL, NULL, NULL) |
+--------------------------------------+
| NULL                                 |
+--------------------------------------+
```

`pattern`이 유효한 정규 표현식이 아니면 오류가 발생합니다.

```sql
SELECT regexp_replace_one('a b b', '(b', '<\\1>');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INVALID_ARGUMENT]Could not compile regexp pattern: (b
Error: missing ): (b

```
