---
{
    "title": "DAMERAU_LEVENSHTEIN_DISTANCE",
    "language": "ko",
    "description": "DAMERAU_LEVENSHTEIN_DISTANCE 함수는 두 문자열 간의 Damerau-Levenshtein 편집 거리를 계산합니다."
}
---

## 설명 {#description}

`DAMERAU_LEVENSHTEIN_DISTANCE` 함수는 두 문자열 간의 [Damerau-Levenshtein 편집 거리](https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance)를 계산합니다.

Damerau-Levenshtein 편집 거리는 하나의 문자열을 다른 문자열로 변환하는 데 필요한 단일 문자 편집 연산의 최소 횟수입니다. 지원하는 편집 연산은 다음과 같습니다.

- 문자 삽입
- 문자 삭제
- 문자 치환
- 인접한 두 문자의 위치 교환

`LEVENSHTEIN`과 비교하면 `DAMERAU_LEVENSHTEIN_DISTANCE`는 인접한 문자의 위치 교환을 단일 편집 연산으로 처리하므로, 문자 순서가 뒤바뀌어 발생한 입력 오류를 처리하는 데 더 적합합니다. 예를 들어 `abcd`와 `abdc`는 인접한 `c`와 `d`의 위치만 교환하면 되므로 Damerau-Levenshtein 거리는 1이고, Levenshtein 거리는 2입니다.

이 함수는 바이트가 아닌 UTF-8 문자 단위로 거리를 계산합니다. 따라서 한자와 같은 멀티바이트 문자도 하나의 문자로 처리됩니다.

:::note
4.2.0부터 지원
:::

## 구문 {#syntax}

```sql
DAMERAU_LEVENSHTEIN_DISTANCE(<str1>, <str2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<str1>` | 첫 번째 문자열. 타입: VARCHAR |
| `<str2>` | 두 번째 문자열. 타입: VARCHAR |

## 반환 값 {#return-value}

두 문자열 간의 Damerau-Levenshtein 편집 거리를 나타내는 INT 값을 반환합니다.

특수한 경우:

- 인수 중 하나라도 NULL이면 NULL을 반환합니다.
- 두 문자열이 같으면 0을 반환합니다.
- 한 문자열이 비어 있으면 다른 문자열의 문자 수를 반환합니다.
- 이 함수는 교환 법칙이 성립하므로 `DAMERAU_LEVENSHTEIN_DISTANCE(a, b)`와 `DAMERAU_LEVENSHTEIN_DISTANCE(b, a)`는 같은 결과를 반환합니다.
- 입력이 너무 커서 내부 거리 행렬이 제한을 초과하면 오류를 반환합니다.

## 예제 {#examples}

1. 기본 사용법

```sql
SELECT damerau_levenshtein_distance('kitten', 'sitting');
```

```text
+---------------------------------------------------+
| damerau_levenshtein_distance('kitten', 'sitting') |
+---------------------------------------------------+
|                                                 3 |
+---------------------------------------------------+
```

2. 인접한 문자의 위치 교환

```sql
SELECT damerau_levenshtein_distance('abcd', 'abdc');
```

```text
+----------------------------------------------+
| damerau_levenshtein_distance('abcd', 'abdc') |
+----------------------------------------------+
|                                            1 |
+----------------------------------------------+
```

`abcd`를 `abdc`로 변환하려면 인접한 `c`와 `d`의 위치를 교환하면 되므로 거리는 1입니다.

3. `LEVENSHTEIN`과의 차이

```sql
SELECT levenshtein('abcd', 'abdc'), damerau_levenshtein_distance('abcd', 'abdc');
```

```text
+-----------------------------+----------------------------------------------+
| levenshtein('abcd', 'abdc') | damerau_levenshtein_distance('abcd', 'abdc') |
+-----------------------------+----------------------------------------------+
|                           2 |                                            1 |
+-----------------------------+----------------------------------------------+
```

`LEVENSHTEIN`은 위치 교환을 지원하지 않으므로 2회의 편집이 필요합니다. `DAMERAU_LEVENSHTEIN_DISTANCE`는 인접한 문자의 위치 교환을 지원하므로 1회의 편집만 필요합니다.

4. UTF-8 문자

```sql
SELECT damerau_levenshtein_distance('你好', '好你');
```

```text
+--------------------------------------------------+
| damerau_levenshtein_distance('你好', '好你')     |
+--------------------------------------------------+
|                                                1 |
+--------------------------------------------------+
```

`你`와 `好`는 두 개의 UTF-8 문자이며, 인접한 문자의 위치를 교환하는 데는 1회의 편집이 필요합니다.

5. 삽입, 삭제 및 치환

```sql
SELECT
    damerau_levenshtein_distance('', 'abc'),
    damerau_levenshtein_distance('数据库', '数据'),
    damerau_levenshtein_distance('flaw', 'lawn');
```

```text
+-----------------------------------------+-----------------------------------------------------+----------------------------------------------+
| damerau_levenshtein_distance('', 'abc') | damerau_levenshtein_distance('数据库', '数据')      | damerau_levenshtein_distance('flaw', 'lawn') |
+-----------------------------------------+-----------------------------------------------------+----------------------------------------------+
|                                       3 |                                                   1 |                                            2 |
+-----------------------------------------+-----------------------------------------------------+----------------------------------------------+
```

6. 완전한 Damerau-Levenshtein 거리 예제

```sql
SELECT damerau_levenshtein_distance('CA', 'ABC');
```

```text
+-------------------------------------------+
| damerau_levenshtein_distance('CA', 'ABC') |
+-------------------------------------------+
|                                         2 |
+-------------------------------------------+
```

이 함수는 완전한 Damerau-Levenshtein 거리를 계산합니다. `CA`와 `ABC`의 최소 편집 거리는 2입니다.

7. NULL 인수

```sql
SELECT damerau_levenshtein_distance(NULL, 'abc'), damerau_levenshtein_distance('abc', NULL);
```

```text
+-------------------------------------------+-------------------------------------------+
| damerau_levenshtein_distance(NULL, 'abc') | damerau_levenshtein_distance('abc', NULL) |
+-------------------------------------------+-------------------------------------------+
|                                      NULL |                                      NULL |
+-------------------------------------------+-------------------------------------------+
```

8. 입력이 너무 큰 경우

```sql
SELECT damerau_levenshtein_distance(repeat('a', 4096), repeat('b', 4096));
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]damerau_levenshtein_distance distance matrix is too large: 16793604 cells exceeds limit 16777216
```
