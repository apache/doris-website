---
{
    "title": "TO_IPV6",
    "language": "ko",
    "description": "IPv6 주소의 문자열 표현을 받아 IPv6 타입의 값을 반환합니다."
}
---

## 설명 {#description}
IPv6 주소의 문자열 표현을 받아 IPv6 타입의 값을 반환합니다. 이 값의 이진 표현은 `ipv6_string_to_num` 함수 반환값의 이진 표현과 같습니다.

## 구문 {#syntax}
```sql
TO_IPV6(<ipv6_str>)
```

### 매개변수 {#parameters}
- `<ipv6_str>`: String 타입의 IPv6 주소

### 반환값 {#return-value}
반환 타입: IPv6

반환값의 의미:
- IPv6 타입의 값을 반환합니다.
- 입력값이 NULL이면 예외가 발생합니다.
- IPv6 주소가 유효하지 않거나 입력값이 `NULL`이면 예외가 발생합니다.

### 사용 시 참고 사항 {#usage-notes}
- `to_ipv6` → `IPv6` 타입 변환과 같으며, `IPv6` 컬럼이 있는 테이블을 생성하는 경우에 적합합니다.

## 예제 {#examples}

IPv6 텍스트 `2001:1b70:a1:610::b102:2`를 `IPv6` 타입으로 변환합니다.
```sql
SELECT to_ipv6('2001:1b70:a1:610::b102:2') as v6;
+-------------------------------+
| v6                            |
+-------------------------------+
| 2001:1b70:a1:610::b102:2      |
+-------------------------------+
```

NULL을 입력하면 예외가 발생합니다.
```sql
SELECT to_ipv6(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]The arguments of function to_ipv6 must be String, not NULL
```

유효하지 않은 IPv6 텍스트를 입력하면 예외가 발생합니다.
```sql
SELECT to_ipv6('not-an-ip');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv6 value
```

### 키워드 {#keywords}

TO_IPV6
