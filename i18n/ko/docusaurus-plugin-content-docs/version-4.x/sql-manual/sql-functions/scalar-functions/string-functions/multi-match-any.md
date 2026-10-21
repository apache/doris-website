---
{
    "title": "MULTI_MATCH_ANY",
    "language": "ko",
    "description": "문자열이 배열에 있는 정규 표현식 중 하나와 일치하는지 확인합니다."
}
---

<a id="multi_match_any"></a>

## 설명 {#description}

`<haystack>`이 `<patterns>`에 있는 정규 표현식 중 하나와 일치하는지 확인합니다. 기본적으로 대소문자를 구분합니다. `0`을 `NULL` 대신 반환하는 것은 인수 중 하나라도 `NULL`인 경우입니다.

## 구문 {#syntax}

```sql
MULTI_MATCH_ANY(<haystack>, <patterns>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<haystack>` | 입력 문자열. 타입은 `STRING`입니다. |
| `<patterns>` | 정규 표현식. 타입은 `ARRAY<STRING>`입니다. 패턴 요소는 NULL이 아닌 문자열이어야 합니다. |

## 반환 값 {#return-value}

`TINYINT`를 반환합니다. 정규 표현식 중 하나라도 일치하면 `1`, 그렇지 않으면 `0`을 반환합니다. 빈 패턴 배열에 대해서는 `0`을 반환하며, 인수 중 하나라도 `NULL`인 경우에도 같은 값을 반환합니다.

이 함수는 Hyperscan/VectorScan 정규 표현식 엔진을 사용합니다. 유효하지 않거나 지원되지 않는 패턴은 오류를 발생시킵니다. 상수 입력 문자열과 비상수 패턴 배열 컬럼을 함께 사용할 수 없으며, 이 조합을 사용하면 인수 오류가 발생합니다.

## 예제 {#example}

```sql
SELECT multi_match_any('Hello, World!', ['hello', '!', 'world']) AS matched;
```

```text
1
```

```sql
SELECT multi_match_any('abc', ['A', 'bcd']) AS matched;
```

```text
0
```

정규 표현식은 리터럴 부분 문자열 검색이 아닌 패턴 매칭을 수행합니다.

```sql
SELECT multi_match_any('abc123', ['[0-9]+', '^xyz']) AS matched;
```

```text
1
```

```sql
SELECT multi_match_any('abc', CAST([] AS ARRAY<STRING>)) AS empty_patterns,
       multi_match_any(CAST(NULL AS STRING), ['a']) AS null_text,
       multi_match_any('abc', CAST(NULL AS ARRAY<STRING>)) AS null_patterns;
```

```text
0    0    0
```

## 키워드 {#keywords}

MULTI_MATCH, MATCH, ANY
