---
{
    "title": "TO_IPV4_OR_NULL",
    "language": "ko",
    "description": "IPv4 주소의 문자열 표현을 받아 IPv4 타입의 값을 반환합니다. 입력이 유효하지 않거나 NULL이면 NULL을 반환합니다."
}
---

## 설명 {#description}
IPv4 주소의 문자열 표현을 받아 IPv4 타입의 값을 반환합니다. 입력이 유효하지 않거나 NULL이면 NULL을 반환합니다.

## 구문 {#syntax}
```sql
TO_IPV4_OR_NULL(<ipv4_str>)
```

### 매개변수 {#parameters}
- `<ipv4_str>`: 문자열 타입의 IPv4 주소

### 반환 값 {#return-value}
반환 타입: IPv4

반환 값의 의미:
- 바이너리 표현이 `ipv4_string_to_num`의 반환 값과 동일한 IPv4 타입의 값을 반환합니다.
- 입력이 NULL이거나 유효하지 않은 IPv4 주소이면 NULL을 반환합니다.

### 사용 시 참고 사항 {#usage-notes}
- `to_ipv4_or_null` → `IPv4` 타입 변환과 동일하며, `IPv4` 컬럼이 있는 테이블을 생성하는 경우에 적합합니다.
- 입력이 유효하지 않으면 예외를 발생시키는 대신 NULL을 반환합니다.

## 예제 {#examples}

IPv4 텍스트 `255.255.255.255`를 `IPv4` 타입으로 변환합니다.
```sql
SELECT to_ipv4_or_null('255.255.255.255') as v4;
+-----------------+
| v4              |
+-----------------+
| 255.255.255.255 |
+-----------------+
```

입력이 NULL이면 NULL을 반환합니다.
```sql
SELECT to_ipv4_or_null(NULL) as v4;
+------+
| v4   |
+------+
| NULL |
+------+
```

유효하지 않은 IPv4 텍스트를 입력하면 NULL을 반환합니다.
```sql
SELECT to_ipv4_or_null('256.1.1.1') as v4;
+------+
| v4   |
+------+
| NULL |
+------+
```

### 키워드 {#keywords}

TO_IPV4_OR_NULL
