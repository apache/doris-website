---
{
    "title": "APPEND_TRAILING_CHAR_IF_ABSENT",
    "language": "ko",
    "description": "APPENDTRAILINGCHARIFABSENT 함수는 문자열이 지정된 문자로 끝나도록 합니다."
}
---

## 설명 {#description}

APPEND_TRAILING_CHAR_IF_ABSENT 함수는 문자열이 지정된 문자로 끝나도록 합니다. 문자열 끝에 해당 문자가 없으면 추가하고, 이미 있으면 문자열을 그대로 유지합니다.

## 구문 {#syntax}

```sql
APPEND_TRAILING_CHAR_IF_ABSENT(<str>, <trailing_char>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| ------------------ | ----------------------------------------- |
| `<str>` | 처리할 대상 문자열입니다. 타입: VARCHAR |
| `<trailing_char>` | 문자열 끝에 있어야 하는 문자입니다. 타입: VARCHAR |

## 반환 값 {#return-value}

VARCHAR 타입을 반환합니다.

- `<trailing_char>`가 `<str>`의 끝에 없으면 `<str>`와 `<trailing_char>`를 연결한 문자열을 반환합니다.
- `<trailing_char>`가 `<str>`의 끝에 이미 있으면 원래의 `<str>`를 반환합니다.

특수한 경우:

- 인수 중 하나라도 NULL이면 NULL을 반환합니다.
- `<str>`가 빈 문자열이면 `<trailing_char>`를 반환합니다.

## 예제 {#examples}

1. 기본 사용법: 문자가 없으면 추가
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('a', 'c');
```
```text
+------------------------------------------+
| append_trailing_char_if_absent('a', 'c') |
+------------------------------------------+
| ac                                       |
+------------------------------------------+
```

2. 문자가 이미 있으면 추가하지 않음
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('ac', 'c');
```
```text
+-------------------------------------------+
| append_trailing_char_if_absent('ac', 'c') |
+-------------------------------------------+
| ac                                        |
+-------------------------------------------+
```

3. 빈 문자열 처리
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('', '/');
```
```text
+------------------------------------------+
| append_trailing_char_if_absent('', '/')  |
+------------------------------------------+
| /                                        |
+------------------------------------------+
```

4. NULL 값 처리
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT(NULL, 'c');
```
```text
+-------------------------------------------+
| append_trailing_char_if_absent(NULL, 'c') |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+
```

5. UTF-8 문자
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('acf', 'ṛ');
```
```text
+----------------------------------------------+
| APPEND_TRAILING_CHAR_IF_ABSENT('acf', 'ṛ')   |
+----------------------------------------------+
| acfṛ                                         |
+----------------------------------------------+
```
