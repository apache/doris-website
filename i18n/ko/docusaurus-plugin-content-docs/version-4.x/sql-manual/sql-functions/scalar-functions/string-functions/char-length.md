---
{
    "title": "CHAR_LENGTH",
    "language": "ko",
    "description": "CHAR_LENGTH 함수는 문자열의 바이트 수가 아닌 문자 수를 계산합니다. 멀티바이트 문자(예: 한자)의 경우 문자 수를 반환합니다."
}
---

## 설명 {#description}

CHAR_LENGTH 함수는 문자열의 바이트 수가 아닌 문자 수를 계산합니다. 멀티바이트 문자(예: 한자)의 경우 문자 수를 반환합니다.

현재 UTF-8 인코딩만 지원합니다.

## 별칭 {#alias}

- CHARACTER_LENGTH

## 구문 {#syntax}

```sql 
CHAR_LENGTH(<str>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| ------- | ----------------------------------------- |
| `<str>` | 문자 수를 계산할 문자열입니다. 타입: VARCHAR |

## 반환 값 {#return-value}

문자열의 문자 수를 나타내는 INT 타입 값을 반환합니다.

특수한 경우:
- 매개변수가 NULL이면 NULL을 반환합니다
- 빈 문자열은 0을 반환합니다
- 멀티바이트 UTF-8 문자는 각각 1개의 문자로 계산합니다

## 예제 {#examples}

1. 영문자
```sql
SELECT CHAR_LENGTH('hello');
```
```text
+----------------------+
| char_length('hello') |
+----------------------+
|                    5 |
+----------------------+
```

2. 한자(각 한자는 한 문자로 계산됨)
```sql
SELECT CHAR_LENGTH('中国');
```
```text
+----------------------+
| char_length('中国')  |
+----------------------+
|                    2 |
+----------------------+
```

3. NULL 값 처리
```sql
SELECT CHAR_LENGTH(NULL);
```
```text
+--------------------+
| char_length(NULL)  |
+--------------------+
|               NULL |
+--------------------+
```

4. LENGTH 함수와 비교(LENGTH는 바이트 수를 반환)
```sql
SELECT CHAR_LENGTH('中国') AS char_len, LENGTH('中国') AS byte_len;
```
```text
+----------+----------+
| char_len | byte_len |
+----------+----------+
|        2 |        6 |
+----------+----------+
```
