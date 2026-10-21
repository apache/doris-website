---
{
    "title": "COMPRESS",
    "language": "ko",
    "description": "COMPRESS 함수는 zlib 압축 알고리즘을 사용하여 문자열을 바이너리 데이터로 압축합니다."
}
---

## 설명 {#description}

COMPRESS 함수는 zlib 압축 알고리즘을 사용하여 문자열을 바이너리 데이터로 압축합니다. 압축된 데이터는 UNCOMPRESS 함수를 사용하여 원래 문자열로 복원할 수 있습니다.

## 구문 {#syntax}

```sql
COMPRESS(<str>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -------- | ----------------------------------------- |
| `<str>` | 압축할 문자열입니다. 타입: VARCHAR |

## 반환값 {#return-value}

압축된 바이너리 데이터를 VARCHAR 타입으로 반환합니다(사람이 읽을 수 없는 형식).

특수한 경우:
- 매개변수가 NULL이면 NULL을 반환합니다.
- 입력이 빈 문자열 `''`이면 빈 문자열 `''`을 반환합니다.

## 예제 {#examples}

1. 기본 사용법: 압축 및 압축 해제
```sql
SELECT uncompress(compress('hello'));
```
```text 
+-------------------------------+
| uncompress(compress('hello')) |
+-------------------------------+
| hello                         |
+-------------------------------+
```

2. 빈 문자열 처리
```sql
SELECT compress('');
```
```text 
+--------------+
| compress('') |
+--------------+
|              |
+--------------+
```

3. NULL 값 처리
```sql
SELECT compress(NULL);
```
```text 
+----------------+
| compress(NULL) |
+----------------+
| NULL           |
+----------------+
```

4. UTF-8 문자 테스트
```sql
SELECT uncompress(compress('ṭṛì'));
```
```text
+----------------------------------+
| uncompress(compress('ṭṛì'))      |
+----------------------------------+
| ṭṛì                              |
+----------------------------------+
```
