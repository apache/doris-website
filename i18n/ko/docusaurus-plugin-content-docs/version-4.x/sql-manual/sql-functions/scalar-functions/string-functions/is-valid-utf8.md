---
{
    "title": "IS_VALID_UTF8",
    "language": "ko",
    "description": "IS_VALID_UTF8 함수는 문자열이 유효한 UTF-8 인코딩 데이터인지 확인합니다. 문자열이 유효한 UTF-8이면 true를 반환하고, 그렇지 않으면 false를 반환합니다."
}
---

## 설명 {#description}

IS_VALID_UTF8 함수는 문자열이 유효한 UTF-8 인코딩 데이터인지 확인합니다. 입력의 모든 바이트 시퀀스를 검사하여 모든 시퀀스가 UTF-8 인코딩 표준을 준수하면 `true`를 반환하고, 유효하지 않은 바이트 시퀀스가 하나라도 발견되면 `false`를 반환합니다.

이 함수는 바이너리 데이터나 잘못 인코딩된 내용이 포함될 수 있는 외부 소스(파일, 네트워크 스트림 등)에서 가져온 데이터를 다룰 때, 문자열 연산을 수행하기 전에 데이터 무결성을 확인하는 데 유용합니다.

## 별칭 {#alias}

- `ISVALIDUTF8()`

## 구문 {#syntax}

```sql
IS_VALID_UTF8(<str>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|-------------|
| `<str>` | 검사할 문자열입니다. 타입: VARCHAR 또는 STRING |

## 반환 값 {#return-value}

BOOLEAN 타입을 반환합니다.

- 문자열이 유효한 UTF-8 인코딩 데이터이면 `true`를 반환합니다.
- 문자열에 유효하지 않은 UTF-8 바이트 시퀀스가 하나라도 포함되어 있으면 `false`를 반환합니다.

특수한 경우:
- 매개변수가 NULL이면 NULL을 반환합니다.
- 빈 문자열은 유효한 UTF-8로 간주하며, `true`를 반환합니다.

## 예제 {#examples}

1. 유효한 ASCII 문자열

```sql
SELECT IS_VALID_UTF8('hello');
```

```text
+------------------------+
| is_valid_utf8('hello') |
+------------------------+
|                      1 |
+------------------------+
```

2. 유효한 멀티바이트 UTF-8 문자(중국어)

```sql
SELECT IS_VALID_UTF8('Hello, 世界');
```

```text
+-----------------------------+
| is_valid_utf8('Hello, 世界') |
+-----------------------------+
|                           1 |
+-----------------------------+
```

3. 빈 문자열

```sql
SELECT IS_VALID_UTF8('');
```

```text
+--------------------+
| is_valid_utf8('')  |
+--------------------+
|                  1 |
+--------------------+
```

4. 유효하지 않은 UTF-8 바이트(UNHEX로 생성)

```sql
SELECT IS_VALID_UTF8(UNHEX('C0AF'));
```

```text
+------------------------------+
| is_valid_utf8(unhex('C0AF')) |
+------------------------------+
|                            0 |
+------------------------------+
```

5. NULL 값 처리

```sql
SELECT IS_VALID_UTF8(NULL);
```

```text
+---------------------+
| is_valid_utf8(NULL) |
+---------------------+
|                NULL |
+---------------------+
```

6. 테이블 데이터에 사용

```sql
CREATE TABLE test_utf8 (
    id INT,
    val VARCHAR(200)
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO test_utf8 VALUES
(1, 'hello'),
(2, ''),
(3, 'Hello, 世界'),
(4, NULL);

INSERT INTO test_utf8 VALUES (5, UNHEX('C0AF'));
INSERT INTO test_utf8 VALUES (6, UNHEX('FF'));

SELECT id, IS_VALID_UTF8(val) FROM test_utf8 ORDER BY id;
```

```text
+------+--------------------+
| id   | is_valid_utf8(val) |
+------+--------------------+
|    1 |                  1 |
|    2 |                  1 |
|    3 |                  1 |
|    4 |               NULL |
|    5 |                  0 |
|    6 |                  0 |
+------+--------------------+
```
