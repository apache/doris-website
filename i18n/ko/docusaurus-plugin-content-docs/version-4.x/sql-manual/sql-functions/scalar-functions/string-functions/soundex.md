---
{
    "title": "SOUNDEX",
    "language": "ko",
    "description": "SOUNDEX 함수는 문자열의 Soundex 인코딩을 계산합니다."
}
---

## 설명 {#description}

SOUNDEX 함수는 문자열의 [Soundex 인코딩](https://en.wikipedia.org/wiki/Soundex)을 계산합니다. Soundex는 영어 단어를 발음을 나타내는 코드로 인코딩하는 발음 기반 알고리즘으로, 발음이 비슷한 단어는 동일한 인코딩을 갖습니다.

인코딩 규칙: 대문자 한 글자 뒤에 숫자 세 자리가 오는 4자리 코드를 반환합니다(예: S530).

## 구문 {#syntax}

```sql
SOUNDEX(<expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -------- | ----------------------------------------- |
| `<expr>` | Soundex 인코딩을 계산할 문자열입니다(ASCII 문자만 지원). 타입: VARCHAR |

## 반환 값 {#return-value}

문자열의 Soundex 인코딩을 나타내는 VARCHAR(4) 타입을 반환합니다.

특수한 경우:
- 인수가 NULL이면 NULL을 반환합니다
- 문자열이 비어 있거나 영문자가 없으면 빈 문자열을 반환합니다
- ASCII 영문자만 처리하며 다른 문자는 무시합니다
- ASCII가 아닌 문자가 있으면 함수에서 오류가 발생합니다

## 예제 {#examples}

1. 기본 사용법: 단어 인코딩
```sql
SELECT soundex('Doris');
```
```text
+------------------+
| soundex('Doris') |
+------------------+
| D620             |
+------------------+
```

2. 발음이 비슷한 단어는 동일한 인코딩을 가짐
```sql
SELECT soundex('Smith'), soundex('Smyth');
```
```text
+------------------+------------------+
| soundex('Smith') | soundex('Smyth') |
+------------------+------------------+
| S530             | S530             |
+------------------+------------------+
```

3. 빈 문자열 처리
```sql
SELECT soundex('');
```
```text
+-------------+
| soundex('') |
+-------------+
|             |
+-------------+
```

4. NULL 값 처리

```sql
SELECT soundex(NULL);
```

```text
+---------------+
| soundex(NULL) |
+---------------+
| NULL          |
+---------------+
```

5. 빈 문자열을 입력하면 빈 문자열 반환

```sql
SELECT soundex('');
```

```text
+-------------+
| soundex('') |
+-------------+
|             |
+-------------+
```

6. 영문자 이외의 문자만 있으면 빈 문자열 반환

```sql
SELECT soundex('123@*%');
```

```text
+-------------------+
| soundex('123@*%') |
+-------------------+
|                   |
+-------------------+
```

7. 영문자 이외의 문자 무시

```sql
SELECT soundex('R@b-e123rt'), soundex('Robert');
```

```text
+-----------------------+-------------------+
| soundex('R@b-e123rt') | soundex('Robert') |
+-----------------------+-------------------+
| R163                  | R163              |
+-----------------------+-------------------+
```

9. ASCII 이외의 문자만 포함된 경우의 오류 예제

```sql
SELECT soundex('你好');  
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Not Supported: Not Supported: soundex only supports ASCII, but got: 你
```

```sql
SELECT soundex('Apache Doris 你好');
```

```text
+--------------------------------+
| soundex('Apache Doris 你好')   |
+--------------------------------+
| A123                           |
+--------------------------------+
```

### 키워드 {#keywords}

    SOUNDEX
