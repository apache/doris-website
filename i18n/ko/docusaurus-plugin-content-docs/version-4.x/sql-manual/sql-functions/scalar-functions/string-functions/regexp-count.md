---
{
    "title": "REGEXP_COUNT",
    "language": "ko",
    "description": "문자열에서 지정된 정규식 패턴과 일치하는 문자의 개수를 세는 함수입니다."
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## 설명 {#description}
문자열에서 지정된 정규식 패턴과 일치하는 문자의 개수를 세는 함수입니다. 사용자가 제공한 문자열과 정규식 패턴을 입력으로 받습니다. 반환값 n은 일치하는 문자의 총 개수이며, 일치하는 항목이 없으면 0을 반환합니다.

'str' 매개변수는 'string' 타입이며, 사용자가 정규식으로 일치 여부를 확인하려는 문자열입니다.

'pattern' 매개변수는 'string' 타입이며, 문자열과 대조할 정규식 패턴을 나타내는 문자열입니다.

문자 집합을 일치시킬 때는 Utf-8 표준 문자 클래스를 사용해야 합니다. 이렇게 하면 함수가 다양한 언어의 문자를 올바르게 식별하고 처리할 수 있습니다.

지원되는 문자 일치 클래스: https://github.com/google/re2/wiki/Syntax

## 구문 {#syntax}

```sql
REGEXP_COUNT(<str>, <pattern>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<str>` | 'string' 타입의 매개변수로, 정규식으로 일치 여부를 확인할 대상 값입니다. |
| `<pattern>` | 'string' 타입의 매개변수로, 문자열에서 패턴의 규칙과 일치하는 부분을 찾는 데 사용하는 정규식입니다. |
## 반환값 {#return-value}

- 문자열 'str'에서 정규식 'pattern'과 일치하는 항목의 개수를 'int' 타입으로 반환합니다. 일치하는 문자가 없으면 0을 반환합니다.
pattern이 NULL이거나 str이 NULL이거나 둘 다 NULL이면 NULL을 반환합니다.
pattern이 유효한 정규식이 아니면 오류가 발생하며, 이는 잘못된 사용에 해당합니다.

## 예제 {#examples}

이스케이프 문자가 포함된 정규식과 일치하는 문자열의 부분을 찾아 결과를 반환합니다.

```sql
SELECT regexp_count('a.b:c;d', '[\\\\.:;]');
```

```text
+--------------------------------------+
| regexp_count('a.b:c;d', '[\\\\.:;]') |
+--------------------------------------+
|                                    3 |
+--------------------------------------+
```

일반 문자 ':'를 정규식으로 사용하여 문자열에서 일치하는 항목을 찾은 결과입니다.

```sql
SELECT regexp_count('a.b:c;d', ':');
```

```text
+------------------------------+
| regexp_count('a.b:c;d', ':') |
+------------------------------+
|                            1 |
+------------------------------+
```
대괄호가 두 겹으로 포함된 정규식과 문자열을 대조한 결과입니다.

```sql
SELECT regexp_count('Hello, World!', '[[:punct:]]');
```

```text
+----------------------------------------------+
| regexp_count('Hello, World!', '[[:punct:]]') |
+----------------------------------------------+
|                                            2 |
+----------------------------------------------+
```


Pattern이 NULL인 경우

```sql
SELECT regexp_count("abc",NULL);
```
```text
+------------------------+
| regexp_count("abc",NULL) |
+------------------------+
|                   NULL |
+------------------------+
```


Str이 NULL인 경우

```sql
SELECT regexp_count(NULL,"abc");
```
```text
+------------------------+
| regexp_count(NULL,"abc") |
+------------------------+
|                   NULL |
+------------------------+
```

둘 다 NULL인 경우


```sql
SELECT regexp_count(NULL,NULL);
```
```text
+------------------------+
| regexp_count(NULL,NULL) |
+------------------------+
|                   NULL |
+------------------------+
```

특정 변수 값을 삽입한 다음, 저장된 행에서 변수를 가져와 일치 여부를 확인한 결과입니다.

```sql

CREATE TABLE test_table_for_regexp_count (
        id INT,
        text_data VARCHAR(500),
        pattern VARCHAR(100)
    ) PROPERTIES ("replication_num"="1");

INSERT INTO test_table_for_regexp_count VALUES
    (1, 'HelloWorld', '[A-Z][a-z]+'),    
    (2, 'apple123', '[a-z]{5}[0-9]'),    
    (3, 'aabbcc', '(aa|bb|cc)'),         
    (4, '123-456-7890', '[0-9][0-9][0-9]'), 
    (5, 'test,data', ','),              
    (6, 'a1b2c3', '[a-z][0-9]'),         
    (7, 'book keeper', 'oo|ee'),        
    (8, 'ababab', '(ab)(ab)(ab)'),       
    (9, 'aabbcc', '(aa|bb|cc)'),         
    (10, 'apple,banana', '[aeiou][a-z]+');

SELECT id, regexp_count(text_data, pattern) as count_result FROM test_table_for_regexp_count ORDER BY id;

```

```text
+------+--------------+
| id   | count_result |
+------+--------------+
|    1 |            2 |
|    2 |            1 |
|    3 |            3 |
|    4 |            3 |
|    5 |            1 |
|    6 |            3 |
|    7 |            2 |
|    8 |            1 |
|    9 |            3 |
|   10 |            2 |
+------+--------------+

```
특정 변수 값을 삽입한 다음, 저장된 행에서 변수를 가져와 상수인 정규식과 일치하는 항목을 찾은 결과입니다.

```sql
CREATE TABLE test_table_for_regexp_count (
        id INT,
        text_data VARCHAR(500),
        pattern VARCHAR(100)
    ) PROPERTIES ("replication_num"="1");

INSERT INTO test_table_for_regexp_count VALUES
    (1, 'HelloWorld', '[A-Z][a-z]+'),    
    (2, 'apple123', '[a-z]{5}[0-9]'),    
    (3, 'aabbcc', '(aa|bb|cc)'),         
    (4, '123-456-7890', '[0-9][0-9][0-9]'), 
    (5, 'test,data', ','),              
    (6, 'a1b2c3', '[a-z][0-9]'),         
    (7, 'book keeper', 'oo|ee'),        
    (8, 'ababab', '(ab)(ab)(ab)'),       
    (9, 'aabbcc', '(aa|bb|cc)'),         
    (10, 'apple,banana', '[aeiou][a-z]+');

SELECT id, regexp_count(text_data, 'e') as count_e FROM test_table_for_regexp_count WHERE text_data IS NOT NULL ORDER BY id;
```

```text
+------+---------+
| id   | count_e |
+------+---------+
|    1 |       1 |
|    2 |       1 |
|    3 |       0 |
|    4 |       0 |
|    5 |       1 |
|    6 |       0 |
|    7 |       3 |
|    8 |       0 |
|    9 |       0 |
|   10 |       1 |
+------+---------+
```

이모지의 정규식 일치 횟수

```sql
SELECT regexp_count('🍔🍟🍕🌍', '🍔|🍟|🍕');
```

```text
+----------------------------------------------------+
| regexp_count('🍔🍟🍕🌍', '🍔|🍟|🍕')                             |
+----------------------------------------------------+
|                                                  3 |
+----------------------------------------------------+
```

'pattern'이 유효하지 않은 정규식이면 오류가 발생합니다.

```sql

SELECT regexp_count('Hello, World!', '[[:punct:');
```

```text

ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INVALID_ARGUMENT]Could not compile regexp pattern: [[:punct:
Error: missing ]: [[:punct:
```
