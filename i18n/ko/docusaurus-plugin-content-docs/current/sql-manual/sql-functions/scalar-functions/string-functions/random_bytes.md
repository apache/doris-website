---
{
    "title": "RANDOM_BYTES",
    "language": "ko",
    "description": "RANDOMBYTES 함수는 지정된 길이의 무작위 바이트 시퀀스를 생성합니다. 반환되는 바이트 시퀀스는 십육진수 문자열로 표현됩니다."
}
---

## 설명 {#description}

RANDOM_BYTES 함수는 지정된 길이의 무작위 바이트 시퀀스를 생성합니다. 반환되는 바이트 시퀀스는 십육진수 문자열로 표현됩니다.

## 구문 {#syntax}

```sql
RANDOM_BYTES(<len>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -------- | ----------------------------------------- |
| `<len>` | 생성할 무작위 바이트 수입니다. 타입: INT |

## 반환 값 {#return-value}

십육진수로 인코딩된 무작위 바이트 시퀀스를 VARCHAR 타입으로 반환합니다(`0x` 접두사 포함).

특수한 경우:
- `<len>`은 0보다 커야 하며, 그렇지 않으면 오류를 반환합니다.
- 매개변수가 NULL이면 NULL을 반환합니다.
- 호출할 때마다 무작위 결과를 생성합니다.

## 예제 {#examples}

1. 기본 사용법: 8바이트 무작위 시퀀스 생성
```sql
SELECT random_bytes(8);
```
```text
+--------------------+
| random_bytes(8)    |
+--------------------+
| 0x1a2b3c4d5e6f7089 |
+--------------------+
```

2. 짧은 시퀀스 생성
```sql
SELECT random_bytes(4);
```
```text
+----------------+
| random_bytes(4) |
+----------------+
| 0xab12cd34     |
+----------------+
```

3. 잘못된 매개변수: 음수
```sql
SELECT random_bytes(-1);
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]argument -1 of function random_bytes at row 0 was invalid.
```

4. NULL 값 처리
```sql
SELECT random_bytes(NULL);
```
```text
+--------------------+
| random_bytes(NULL) |
+--------------------+
| NULL               |
+--------------------+
```

5. 더 긴 시퀀스 생성(16바이트)
```sql
SELECT random_bytes(16);
```
```text
+------------------------------------+
| random_bytes(16)                   |
+------------------------------------+
| 0x1a2b3c4d5e6f708192a3b4c5d6e7f809 |
+------------------------------------+
```

### 키워드 {#keywords}

    RANDOM_BYTES
