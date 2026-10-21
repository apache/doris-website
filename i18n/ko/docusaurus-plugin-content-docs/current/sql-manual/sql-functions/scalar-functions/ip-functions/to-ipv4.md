---
{
    "title": "TO_IPV4",
    "language": "ko",
    "description": "IPv4 주소의 문자열 표현을 받아 IPv4 타입의 값을 반환합니다."
}
---

## 설명 {#description}
IPv4 주소의 문자열 표현을 받아 IPv4 타입의 값을 반환합니다.

## 구문 {#syntax}
```sql
TO_IPV4(<ipv4_str>)
```

### 매개변수 {#parameters}
- `<ipv4_str>`: String 타입의 IPv4 주소

### 반환값 {#return-value}
반환 타입: IPv4

반환값의 의미:
- IPv4 타입의 값을 반환하며, 이 값의 이진 표현은 `ipv4_string_to_num`의 반환값과 동일합니다.
- 입력이 NULL이면 예외가 발생합니다.
- 유효하지 않은 IPv4 주소 또는 `NULL`이 입력되면 예외가 발생합니다.

### 사용 시 참고 사항 {#usage-notes}
- `to_ipv4` → `IPv4` 타입 변환과 동일하며, `IPv4` 컬럼으로 테이블을 생성하는 경우에 적합합니다.

## 예제 {#examples}

IPv4 텍스트 `255.255.255.255`를 `IPv4` 타입으로 변환합니다.
```sql
SELECT to_ipv4('255.255.255.255') as v4;
+-----------------+
| v4              |
+-----------------+
| 255.255.255.255 |
+-----------------+
```

NULL을 입력하면 예외가 발생합니다.
```sql
SELECT to_ipv4(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]The arguments of function to_ipv4 must be String, not NULL
```

유효하지 않은 IPv4 텍스트를 입력하면 예외가 발생합니다.
```sql
SELECT to_ipv4('256.1.1.1');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv4 value '256.1.1.1'
```

### 키워드 {#keywords}

TO_IPV4
