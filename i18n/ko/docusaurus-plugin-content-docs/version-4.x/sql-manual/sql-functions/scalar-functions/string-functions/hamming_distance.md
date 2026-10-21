---
{
    "title": "HAMMING_DISTANCE",
    "language": "ko",
    "description": "HAMMING_DISTANCE 함수는 길이가 같은 두 문자열에서 문자가 서로 다른 위치의 수를 반환합니다."
}
---

::: note
4.1.2부터 지원
:::

## 설명 {#description}

`HAMMING_DISTANCE` 함수는 두 문자열에서 문자가 서로 다른 위치의 수를 반환합니다.

이 함수는 바이트가 아닌 UTF-8 문자 단위로 문자열을 비교합니다. 두 입력 문자열의 UTF-8 문자 수는 같아야 합니다. 비교 시 대소문자를 구분합니다.

## 구문 {#syntax}

```sql
HAMMING_DISTANCE(<str1>, <str2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<str1>` | 비교할 첫 번째 문자열입니다. |
| `<str2>` | 비교할 두 번째 문자열입니다. |

## 반환값 {#return-value}

문자가 서로 다른 위치의 수를 나타내는 BIGINT 값을 반환합니다.

특수한 경우:

- 인수 중 하나라도 NULL이면 NULL을 반환합니다.
- 두 인수가 모두 빈 문자열이면 0을 반환합니다.
- 두 문자열의 UTF-8 문자 수가 다르면 오류를 반환합니다.

## 예제 {#examples}

1. 길이가 같은 두 ASCII 문자열을 비교합니다.

```sql
SELECT hamming_distance('karolin', 'kathrin') AS distance;
```

```text
+----------+
| distance |
+----------+
|        3 |
+----------+
```

2. 두 UTF-8 문자열을 비교합니다. 두 문자열의 문자 수는 같으며, 한 문자만 다릅니다.

```sql
SELECT hamming_distance('数据库', '数据仓') AS distance;
```

```text
+----------+
| distance |
+----------+
|        1 |
+----------+
```

3. 대소문자만 다른 문자열을 비교합니다.

```sql
SELECT hamming_distance('Doris', 'doris') AS distance;
```

```text
+----------+
| distance |
+----------+
|        1 |
+----------+
```

4. 입력이 NULL이면 NULL을 반환합니다.

```sql
SELECT hamming_distance(NULL, 'abc') AS distance;
```

```text
+----------+
| distance |
+----------+
|     NULL |
+----------+
```
