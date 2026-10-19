---
{
    "title": "LEVENSHTEIN",
    "language": "ko",
    "description": "LEVENSHTEIN 함수는 두 문자열 사이의 Levenshtein 편집 거리를 계산합니다."
}
---

## 설명 {#description}

`LEVENSHTEIN` 함수는 두 문자열 사이의 [Levenshtein 편집 거리](https://en.wikipedia.org/wiki/Edit_distance)를 계산합니다.

Levenshtein 편집 거리는 한 문자열을 다른 문자열로 변환하는 데 필요한 단일 문자 편집의 최소 횟수입니다. 지원하는 편집 연산은 다음과 같습니다.

- 문자 하나 삽입
- 문자 하나 삭제
- 문자 하나 치환

이 함수는 바이트가 아닌 UTF-8 문자 단위로 거리를 계산합니다. 따라서 중국어 문자와 같은 멀티바이트 문자도 하나의 문자로 처리합니다.

:::note
4.2.0부터 지원
:::

## 별칭 {#alias}

- `LEVENSHTEIN_DISTANCE`
- `EDIT_DISTANCE`

## 구문 {#syntax}

```sql
LEVENSHTEIN(<str1>, <str2>)
LEVENSHTEIN_DISTANCE(<str1>, <str2>)
EDIT_DISTANCE(<str1>, <str2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<str1>` | 첫 번째 문자열. 타입: VARCHAR |
| `<str2>` | 두 번째 문자열. 타입: VARCHAR |

## 반환 값 {#return-value}

두 문자열 사이의 Levenshtein 편집 거리를 나타내는 INT 값을 반환합니다.

특수한 경우의 동작:

- 인수 중 하나라도 NULL이면 NULL을 반환합니다.
- 두 문자열이 동일하면 0을 반환합니다.
- 한 문자열이 비어 있으면 다른 문자열의 문자 수를 반환합니다.
- 이 함수는 교환 법칙이 성립하므로 `LEVENSHTEIN(a, b)`와 `LEVENSHTEIN(b, a)`는 같은 결과를 반환합니다.

## 예제 {#examples}

1. 기본 사용법

```sql
SELECT levenshtein('kitten', 'sitting');
```

```text
+----------------------------------+
| levenshtein('kitten', 'sitting') |
+----------------------------------+
|                                3 |
+----------------------------------+
```

`kitten`을 `sitting`으로 변환하려면 3번의 편집이 필요합니다. `k`를 `s`로 치환하고, `e`를 `i`로 치환한 다음, 끝에 `g`를 삽입합니다.

2. 동일한 문자열

```sql
SELECT levenshtein('abc', 'abc');
```

```text
+---------------------------+
| levenshtein('abc', 'abc') |
+---------------------------+
|                         0 |
+---------------------------+
```

3. 빈 문자열

```sql
SELECT levenshtein('', 'abc'), levenshtein('数据库', '');
```

```text
+------------------------+------------------------------+
| levenshtein('', 'abc') | levenshtein('数据库', '')    |
+------------------------+------------------------------+
|                      3 |                            3 |
+------------------------+------------------------------+
```

4. UTF-8 문자

```sql
SELECT levenshtein('你好世界', '你好世间');
```

```text
+---------------------------------------------+
| levenshtein('你好世界', '你好世间')         |
+---------------------------------------------+
|                                           1 |
+---------------------------------------------+
```

`界`를 `间`으로 치환하려면 1번의 편집이 필요합니다.

5. 인접한 문자의 순서 교환은 두 번의 편집으로 계산

```sql
SELECT levenshtein('abcd', 'abdc');
```

```text
+-----------------------------+
| levenshtein('abcd', 'abdc') |
+-----------------------------+
|                           2 |
+-----------------------------+
```

Levenshtein 거리는 인접한 문자의 순서 교환을 단일 연산으로 처리하지 않으므로, `abcd`와 `abdc` 사이의 거리는 2입니다.

6. 별칭 사용

```sql
SELECT levenshtein_distance('abcd', 'abdc'), edit_distance('kitten', 'sitting');
```

```text
+--------------------------------------+------------------------------------+
| levenshtein_distance('abcd', 'abdc') | edit_distance('kitten', 'sitting') |
+--------------------------------------+------------------------------------+
|                                    2 |                                  3 |
+--------------------------------------+------------------------------------+
```

7. NULL 인수

```sql
SELECT levenshtein(NULL, 'abc'), levenshtein('abc', NULL);
```

```text
+--------------------------+--------------------------+
| levenshtein(NULL, 'abc') | levenshtein('abc', NULL) |
+--------------------------+--------------------------+
|                     NULL |                     NULL |
+--------------------------+--------------------------+
```
