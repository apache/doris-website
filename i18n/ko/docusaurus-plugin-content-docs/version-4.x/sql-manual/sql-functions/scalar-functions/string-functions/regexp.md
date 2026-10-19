---
{
    "title": "REGEXP",
    "language": "ko",
    "description": "~ 문자열 str에 대해 정규 표현식 매칭을 수행하며, 일치하면 true를, 그렇지 않으면 false를 반환합니다."
}
---

## 설명 {#description}

문자열 `<str>`을 정규 표현식과 비교하여 일치하면 true를, 그렇지 않으면 false를 반환합니다. 패턴이 문자열 전체와 일치할 필요는 없습니다. 전체 문자열과 일치하는지 확인하려면 `^`와 `$`를 사용합니다. 인수 중 하나라도 NULL이면 NULL을 반환하고, 패턴이 유효하지 않으면 오류가 발생합니다. 문자열은 UTF-8로 처리됩니다. Unicode 문자 범주와 일치시키려면 `\p{Han}`과 같은 문자 클래스를 사용합니다.

일반 패턴은 [RE2 구문](https://github.com/google/re2/wiki/Syntax)을 참조하십시오.

### 매칭 엔진과 세션 변수 {#matching-engines-and-session-variables}

일반적인 `LIKE` 및 `REGEXP` 매칭에서는 Hyperscan 가속을 사용할 수 있습니다. 다음 세션 변수로 폴백 동작을 제어합니다.

| 세션 변수 | 기본값 | 동작 |
| --- | --- | --- |
| `enable_hyperscan_fallback` | `true` | Doris 4.1 계열에서 4.1.5부터 지원됩니다. 실제로 Hyperscan으로 컴파일하는 경로에서 컴파일에 실패하거나 매칭용 scratch 공간을 할당할 수 없을 때 RE2로 폴백하도록 허용합니다. false이면 해당 오류를 반환합니다. 단순 패턴 최적화와 RE2를 직접 사용하는 경로에는 영향을 주지 않습니다. |
| `enable_extended_regex` | `false` | RE2가 패턴을 거부하면 `REGEXP`가 Boost.Regex를 시도하도록 허용하여 look-around와 같은 확장 구문을 지원합니다. RE2 구문 자체를 확장하거나 `LIKE`, `MATCH_REGEXP`, `MULTI_MATCH_ANY`에 확장 구문을 추가하지는 않습니다. |

Doris 4.1 계열에서는 4.1.5부터 `enable_extended_regex=true`가 상수 패턴과 컬럼에서 읽은 비상수 패턴 모두에 적용됩니다. Hyperscan 경로에서 `enable_hyperscan_fallback=false`를 사용하면 Hyperscan 실패 시 여전히 오류를 반환합니다. `enable_extended_regex`를 활성화해도 이 오류를 우회할 수 없습니다.

[세션 변수 참조](../../../basic-element/session-variables.md#enable_hyperscan_fallback)에서 `enable_hyperscan_fallback`의 값과 적용 범위를 확인할 수 있습니다.

확장 패턴은 [Boost.Regex Perl 구문](https://www.boost.org/doc/libs/latest/libs/regex/doc/html/boost_regex/syntax/perl_syntax.html)을 참조하십시오. Boost.Regex의 매칭 오버헤드는 해당 엔진을 사용할 때만 발생합니다. 복잡한 백트래킹 패턴에서는 `Failed to match regex expression` 오류가 발생할 수도 있습니다.

### 반복 횟수 제한 {#repetition-limit}

Doris 4.1 계열에서는 4.1.5부터 Hyperscan에 전달된 정규 표현식의 `{m}`, `{m,}` 또는 `{m,n}` 형식에 50보다 큰 숫자가 포함되어 있으면 Hyperscan 컴파일을 건너뜁니다. 예를 들어 `a{51}`, `a{51,}`, `a{0,51}`은 이 검사에 걸리지만, `a{50}`과 `a{0,50}`은 걸리지 않습니다. 텍스트를 보수적으로 검사하므로 문자 클래스나 주석 안에 있는 같은 형식도 이 검사에 걸릴 수 있습니다.

| 매칭 경로 | 검사에 걸렸을 때의 동작 |
| --- | --- |
| 일반적인 `LIKE` 또는 `REGEXP`의 Hyperscan 경로 | `enable_hyperscan_fallback=true`이면 폴백을 시도하고, 그렇지 않으면 오류를 반환합니다. 패턴은 폴백 대상 엔진의 구문과 반복 횟수 제한도 충족해야 합니다. |
| `MATCH_REGEXP`의 행 매칭과 역색인 정규 표현식 매칭 | 패턴을 즉시 거부하며, `enable_hyperscan_fallback`을 사용하지 않습니다. |
| `MULTI_MATCH_ANY`의 다중 패턴 매칭 | 패턴을 즉시 거부하며, `enable_hyperscan_fallback`을 사용하지 않습니다. |

검사에 걸리고 폴백하지 않는 경우 오류 메시지에 다음 내용이 포함됩니다.

```text
Skip hyperscan compilation because bounded repetition exceeds 50
```

## 구문 {#syntax}

```sql
REGEXP(<str>, <pattern>)
<str> [NOT] REGEXP <pattern>
<str> [NOT] RLIKE <pattern>
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<str>` | String 타입입니다. 정규 표현식과 비교할 문자열을 나타내며, 테이블의 컬럼 또는 문자열 리터럴일 수 있습니다.|
| `<pattern>` | String 타입입니다. 문자열 `<str>`과 비교하는 데 사용하는 정규 표현식 패턴입니다. 정규 표현식을 사용하면 문자 클래스, 수량자, 앵커 등을 포함하는 복잡한 검색 패턴을 정의할 수 있습니다.|

## 반환 값 {#return-value}

REGEXP 함수는 BOOLEAN 값을 반환합니다. 문자열 `<str>`이 정규 표현식 패턴 `<pattern>`과 일치하면 true(SQL에서 1로 표현)를 반환하고, 일치하지 않으면 false(SQL에서 0으로 표현)를 반환합니다. 인수 중 하나라도 NULL이면 NULL을 반환합니다.

Doris 4.1 계열에서는 4.1.5부터 상수 빈 패턴이 컬럼 패턴과 일관되게 동작합니다. 빈 패턴은 빈 문자열을 포함하여 NULL이 아닌 모든 문자열과 일치합니다.

**기본 동작**:

| 기본 설정                      | 동작                                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| `.`이 줄 바꿈과 일치                  | 기본적으로 `.`은 `\n`(줄 바꿈)과 일치할 수 있습니다.                                                  |
| 대소문자 구분                       | 매칭 시 대소문자를 구분합니다.                                                               |
| `^`/`$`가 문자열 전체의 경계와 일치 | `^`는 문자열의 시작에만, `$`는 문자열의 끝에만 일치하며, 각 줄의 시작/끝에는 일치하지 않습니다. |
| 탐욕적 수량자                   | 기본적으로 `*`, `+` 등은 가능한 한 많이 일치합니다.                                      |
| UTF-8                                | 문자열은 UTF-8로 처리됩니다.                                                           |

**패턴 수정자**:

`pattern` 앞에 `(?flags)`를 붙여 기본 동작을 재정의할 수 있습니다. 여러 수정자를 조합할 수 있습니다(예: `(?im)`). `-` 접두사를 붙이면 해당 옵션이 비활성화됩니다(예: `(?-s)`).

다음 테이블은 일반 Hyperscan/RE2 경로에서 사용하는 수정자를 설명합니다. look-around와 같은 구문으로 인해 패턴이 Boost.Regex로 폴백하면 Boost.Regex 구문에 따라 수정자를 해석해야 합니다. 엔진마다 동작이 완전히 같지는 않습니다.

| 플래그    | 의미                                                                      |
| ------- | ---------------------------------------------------------------------------- |
| `(?i)`  | 대소문자를 구분하지 않는 매칭                                                    |
| `(?-i)` | 대소문자 구분(기본값)                                                     |
| `(?s)`  | `.`이 줄 바꿈과 일치(기본적으로 활성화됨)                                     |
| `(?-s)` | `.`이 줄 바꿈과 일치하지 **않음**                                               |
| `(?m)`  | 여러 줄 모드: `^`는 각 줄의 시작과, `$`는 각 줄의 끝과 일치 |
| `(?-m)` | 한 줄 모드: `^`/`$`가 문자열 전체의 경계와 일치(기본값)             |
| `(?U)`  | 비탐욕적 수량자: `*`, `+` 등이 가능한 한 적게 일치           |
| `(?-U)` | 탐욕적 수량자(기본값): `*`, `+` 등이 가능한 한 많이 일치       |

<a id="examples"></a>

## 예제 {#example}

```sql
CREATE TABLE test ( k1 VARCHAR(255) ) properties("replication_num"="1");

INSERT INTO test (k1) VALUES ('billie eillish'), ('It\'s ok'), ('billie jean'), ('hello world');
```


```sql
--- Find all data in the k1 column starting with 'billie'
SELECT k1 FROM test WHERE k1 REGEXP '^billie' ORDER BY k1;
```

```text
+----------------+
| k1             |
+----------------+
| billie eillish |
| billie jean    |
+----------------+
```

```sql
--- Find data in the k1 column ending with 'ok':
SELECT k1 FROM test WHERE k1 REGEXP 'ok$';
```

```text
+---------+
| k1      |
+---------+
| It's ok |
+---------+
```
중국어 문자 예제

```sql
select regexp('这是一段中文 This is a passage in English 1234567', '\\p{Han}');
```

```text
+-----------------------------------------------------------------------------+
| ('这是一段中文 This is a passage in English 1234567' regexp '\p{Han}')         |
+-----------------------------------------------------------------------------+
|                                                                           1 |
+-----------------------------------------------------------------------------+
```

단순 문자열 매칭을 위한 데이터 삽입 및 테스트

```sql
CREATE TABLE test_regexp (
    id INT,
    name VARCHAR(255)
) PROPERTIES("replication_num"="1");

INSERT INTO test_regexp (id, name) VALUES
    (1, 'Alice'),
    (2, 'Bob'),
    (3, 'Charlie'),
    (4, 'David');

-- Find all names starting with 'A'
SELECT id, name FROM test_regexp WHERE name REGEXP '^A';
```

```text
+------+-------+
| id   | name  |
+------+-------+
|    1 | Alice |
+------+-------+
```

특수 문자 매칭 테스트

```sql
-- Insert names with special characters
INSERT INTO test_regexp (id, name) VALUES
    (5, 'Anna-Maria'),
    (6, 'John_Doe');

-- Find names containing the '-' character
SELECT id, name FROM test_regexp WHERE name REGEXP '-';
```
```text
+------+------------+
| id   | name       |
+------+------------+
|    5 | Anna-Maria |
+------+------------+
```

문자열 끝부분 매칭 테스트
```sql
-- Find names ending with 'e'
SELECT id, name FROM test_regexp WHERE name REGEXP 'e$' ORDER BY id;
```

```text
+------+----------+
| id   | name     |
+------+----------+
|    1 | Alice    |
|    3 | Charlie  |
|    6 | John_Doe |
+------+----------+
```

이모지 테스트

```sql
SELECT 'Hello' REGEXP '😀'; 
```

```text
+-----------------------+
| 'Hello' REGEXP '😀'     |
+-----------------------+
|                     0 |
+-----------------------+
```


빈 패턴은 빈 문자열을 포함하여 NULL이 아닌 모든 문자열과 일치합니다.

```sql
SELECT REGEXP('abc', ''), REGEXP('', ''), REGEXP(NULL, '');
```

```text
1    1    NULL
```

'str'이 NULL이면 NULL을 반환합니다.

```sql
SELECT REGEXP(NULL, '^billie');
```

```text
+-------------------------+
| REGEXP(NULL, '^billie') |
+-------------------------+
|                    NULL |
+-------------------------+
```

'pattern'이 NULL이면 NULL을 반환합니다.

```sql
SELECT REGEXP('billie eillish', NULL);
```

```text
+--------------------------------+
| REGEXP('billie eillish', NULL) |
+--------------------------------+
|                           NULL |
+--------------------------------+
```

모든 매개변수가 NULL이면 NULL을 반환합니다.

```sql
SELECT REGEXP(NULL, NULL);
```

```text
+--------------------+
| REGEXP(NULL, NULL) |
+--------------------+
|               NULL |
+--------------------+
```

`pattern`이 유효한 정규 표현식이 아니면 오류가 발생합니다.

```sql
SELECT REGEXP('Hello, World!', '([a-z');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INTERNAL_ERROR]Invalid regex expression: ([a-z
```

고급 패턴을 사용하려면 확장 구문이 필요합니다. 일반 RE2 폴백은 look-around를 지원하지 않습니다.

```sql
SET enable_hyperscan_fallback = true;
SET enable_extended_regex = true;
SELECT REGEXP('foobar', '(?<=foo)bar');
```

```text
1
```

비상수 패턴도 확장 구문을 지원합니다(Doris 4.1 계열에서 4.1.5부터).

```sql
CREATE TABLE regexp_patterns (
    id INT,
    s VARCHAR(32),
    p VARCHAR(64)
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO regexp_patterns VALUES
    (1, 'foobar', '(?<=foo)bar'),
    (2, 'fobar', '(?<=foo)bar'),
    (3, 'foo123bar', 'foo(?=123)'),
    (4, 'foo124bar', 'foo(?=123)');

SELECT id, REGEXP(s, p) FROM regexp_patterns ORDER BY id;
```

```text
1    1
2    0
3    1
4    0
```

아래의 일반 구문 예제를 실행하기 전에 세션 설정을 원래대로 되돌립니다.

```sql
SET enable_extended_regex = false;
```

패턴 수정자

대소문자를 구분하지 않는 매칭: `(?i)`를 사용하면 대소문자를 구분하지 않습니다

```sql
SELECT REGEXP('Hello World', 'hello') AS case_sensitive, REGEXP('Hello World', '(?i)hello') AS case_insensitive;
```

```text
+----------------+------------------+
| case_sensitive | case_insensitive |
+----------------+------------------+
|              0 |                1 |
+----------------+------------------+
```

`.`은 기본적으로 줄 바꿈과 일치합니다. `(?-s)`를 사용하면 `.`이 줄 바꿈과 일치하지 않습니다

```sql
SELECT REGEXP('foo\nbar', '^.+$') AS dot_match_nl, REGEXP('foo\nbar', '(?-s)^.+$') AS dot_not_match_nl;
```

```text
+--------------+------------------+
| dot_match_nl | dot_not_match_nl |
+--------------+------------------+
|            1 |                0 |
+--------------+------------------+
```

여러 줄 모드: `(?m)`를 사용하면 `^`와 `$`가 각 줄의 시작과 끝에 일치합니다

```sql
SELECT REGEXP('foo\nbar', '^bar') AS single_line, REGEXP('foo\nbar', '(?m)^bar') AS multi_line;
```

```text
+-------------+------------+
| single_line | multi_line |
+-------------+------------+
|           0 |          1 |
+-------------+------------+
```

탐욕적 매칭과 비탐욕적 매칭: `(?U)`를 사용하면 수량자가 가능한 한 적은 문자와 일치합니다

```sql
SELECT REGEXP_EXTRACT('aXbXc', '(a.*X)', 1) AS greedy, REGEXP_EXTRACT('aXbXc', '(?U)(a.*X)', 1) AS non_greedy;
```

```text
+--------+------------+
| greedy | non_greedy |
+--------+------------+
| aXbX   | aX         |
+--------+------------+
```
