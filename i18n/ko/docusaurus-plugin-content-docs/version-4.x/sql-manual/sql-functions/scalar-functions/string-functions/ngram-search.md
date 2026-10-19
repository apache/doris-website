---
{
    "title": "NGRAM_SEARCH",
    "language": "ko",
    "description": "NGRAM_SEARCH 함수는 두 문자열 사이의 N-gram 유사도를 계산합니다. 유사도는 0에서 1 사이의 값이며, 값이 클수록 문자열이 더 유사함을 나타냅니다."
}
---

## 설명 {#description}

NGRAM_SEARCH 함수는 두 문자열 사이의 N-gram 유사도를 계산합니다. 유사도는 0에서 1 사이의 값이며, 값이 클수록 문자열이 더 유사함을 나타냅니다.

N-gram은 문자열을 연속된 N개의 문자로 이루어진 단위로 나누어 집합을 만듭니다. 유사도 계산 공식은 다음과 같습니다: `2 * |intersection| / (|set1| + |set2|)`

ASCII 문자만 지원합니다.

## 구문 {#syntax}

```sql
NGRAM_SEARCH(<text>, <pattern>, <gram_num>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| ------------ | ----------------------------------------- |
| `<text>` | 비교할 텍스트 문자열입니다. 타입: VARCHAR |
| `<pattern>` | 패턴 문자열입니다(상수여야 함). 타입: VARCHAR |
| `<gram_num>` | N-gram의 N 값입니다. 양의 정수 상수여야 합니다. 타입: INT. |

## 반환 값 {#return-value}

두 문자열 사이의 N-gram 유사도(0에서 1 사이)를 DOUBLE 타입으로 반환합니다.

특수한 경우:
- `<text>` 또는 `<pattern>`이 NULL이면 NULL을 반환합니다. `<gram_num>`은 양의 정수 상수여야 하며 NULL일 수 없습니다
- 문자열 길이가 `<gram_num>`보다 작으면 0을 반환합니다
- `<pattern>`과 `<gram_num>`은 상수여야 합니다. Doris 4.1 계열에서는 4.1.5부터 `<gram_num>`에 0, 음수 또는 정수가 아닌 상수 등 유효하지 않은 값을 지정하면 명시적으로 오류를 보고합니다
- 유사도가 1이라고 해서 문자열이 완전히 동일한 것은 아닙니다

<a id="examples"></a>

## 예시 {#example}

1. 기본 사용법: 유사도 계산
```sql
SELECT ngram_search('123456789', '12345', 3);
```
```text
+---------------------------------------+
| ngram_search('123456789', '12345', 3) |
+---------------------------------------+
|                                   0.6 |
+---------------------------------------+
```

2. 유사도가 높은 예시
```sql
SELECT ngram_search('abababab', 'babababa', 2);
```
```text
+-----------------------------------------+
| ngram_search('abababab', 'babababa', 2) |
+-----------------------------------------+
|                                       1 |
+-----------------------------------------+
```

3. 문자열이 너무 짧으면 0 반환
```sql
SELECT ngram_search('ab', 'abc', 3);
```
```text
+----------------------------------+
| ngram_search('ab', 'abc', 3)     |
+----------------------------------+
|                                0 |
+----------------------------------+
```

4. NULL 값 처리
```sql
SELECT ngram_search(NULL, 'test', 2);
```
```text
+--------------------------------+
| ngram_search(NULL, 'test', 2)  |
+--------------------------------+
| NULL                           |
+--------------------------------+
```

gram_num이 유효하지 않으면 오류를 보고합니다:

```sql
SELECT NGRAM_SEARCH('abc', 'abc', 0);
```

```text
ngram_search(text,pattern,gram_num): gram_num must be a positive constant.
```

### 키워드 {#keywords}

    NGRAM_SEARCH,NGRAM,SEARCH
