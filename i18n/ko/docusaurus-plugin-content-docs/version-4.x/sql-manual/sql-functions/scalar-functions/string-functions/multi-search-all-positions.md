---
{
    "title": "MULTI_SEARCH_ALL_POSITIONS",
    "language": "ko",
    "description": "MULTISEARCHALLPOSITIONS 함수는 문자열에서 여러 부분 문자열을 일괄 검색합니다."
}
---

## 설명 {#description}

MULTI_SEARCH_ALL_POSITIONS 함수는 문자열에서 여러 부분 문자열을 일괄 검색합니다. 각 부분 문자열이 처음 나타나는 위치를 담은 배열을 반환합니다. 검색은 대소문자를 구분합니다.

## 구문 {#syntax}

```sql
MULTI_SEARCH_ALL_POSITIONS(<haystack>, <needles>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| ------------ | ----------------------------------------- |
| `<haystack>` | 검색 대상 문자열입니다. 타입: VARCHAR |
| `<needles>` | 검색할 여러 부분 문자열을 담은 배열입니다. 타입: ARRAY<VARCHAR> |

## 반환 값 {#return-value}

ARRAY<INT> 타입을 반환하며, 배열의 i번째 요소는 `<needles>`의 i번째 부분 문자열이 `<haystack>`에서 처음 나타나는 위치를 나타냅니다.

특수한 경우:
- 위치는 1부터 셉니다
- 부분 문자열을 찾지 못하면 해당 위치에 0을 반환합니다
- 검색은 대소문자를 구분합니다
- `<haystack>`이 NULL이면 `<needles>`와 길이가 같고 모든 요소가 영인 배열을 반환합니다
- `<needles>`가 NULL이면 두 매개변수가 모두 NULL인 경우를 포함하여 빈 배열 `[]`을 반환합니다
- n번째 문자 위치가 아닌 바이트 위치를 반환합니다

## 예제 {#examples}

1. 기본 사용법: 여러 부분 문자열 검색
```sql
SELECT multi_search_all_positions('Hello, World!', ['Hello', 'World']);
```
```text
+----------------------------------------------------------+
| multi_search_all_positions('Hello, World!', ['Hello', 'World']) |
+----------------------------------------------------------+
| [1, 8]                                                   |
+----------------------------------------------------------+
```

2. 대소문자 구분: 소문자 문자열을 찾지 못하는 경우
```sql
SELECT multi_search_all_positions('Hello, World!', ['hello', '!', 'world']);
```
```text
+----------------------------------------------------------------------+
| multi_search_all_positions('Hello, World!', ['hello', '!', 'world']) |
+----------------------------------------------------------------------+
| [0, 13, 0]                                                           |
+----------------------------------------------------------------------+
```

3. 혼합 검색: 일부만 찾는 경우
```sql
SELECT multi_search_all_positions('Hello, World!', ['Hello', '!', 'xyz']);
```
```text
+--------------------------------------------------------------------+
| multi_search_all_positions('Hello, World!', ['Hello', '!', 'xyz']) |
+--------------------------------------------------------------------+
| [1, 13, 0]                                                         |
+--------------------------------------------------------------------+
```

4. 빈 배열
```sql
SELECT multi_search_all_positions('Hello', []);
```
```text
+------------------------------------------+
| multi_search_all_positions('Hello', [])  |
+------------------------------------------+
| []                                       |
+------------------------------------------+
```

5. UTF-8 특수 문자 지원
```sql
SELECT multi_search_all_positions('ṭṛì ḍḍumai Hello', ['ṭṛì', 'Hello', 'test']);
```
```text
+----------------------------------------------------------------------------------------+
| multi_search_all_positions('ṭṛì ḍḍumai Hello', ['ṭṛì', 'Hello', 'test'])               |
+----------------------------------------------------------------------------------------+
| [1, 21, 0]                                                                             |
+----------------------------------------------------------------------------------------+
```

NULL 입력:

```sql
SELECT multi_search_all_positions(NULL, ['a', 'b']) AS null_haystack,
       multi_search_all_positions('a', NULL) AS null_needles,
       multi_search_all_positions(NULL, NULL) AS both_null;
```
```text
+---------------+--------------+-----------+
| null_haystack | null_needles | both_null |
+---------------+--------------+-----------+
| [0, 0]        | []           | []        |
+---------------+--------------+-----------+
```

### 키워드 {#keywords}

    MULTI_SEARCH,SEARCH,POSITIONS
