---
{
    "title": "TO_IPV6_OR_DEFAULT",
    "language": "ko",
    "description": "문자열 형태의 IPv6 주소를 받아 IPv6 타입의 값을 반환합니다. 입력이 유효하지 않거나 NULL이면 기본값 ::를 반환합니다."
}
---

## 설명 {#description}
문자열 형태의 IPv6 주소를 받아 IPv6 타입의 값을 반환합니다. 입력이 유효하지 않거나 NULL이면 기본값 `::`를 반환합니다.

## 구문 {#syntax}
```sql
TO_IPV6_OR_DEFAULT(<ipv6_str>)
```

### 매개변수 {#parameters}
- `<ipv6_str>`: 문자열 타입의 IPv6 주소

### 반환 값 {#return-value}
반환 타입: IPv6

반환 값의 의미:
- IPv6 타입의 값을 반환하며, 이 값의 이진 표현은 `ipv6_string_to_num` 함수 반환 값의 이진 표현과 같습니다.
- 입력이 NULL이거나 유효하지 않은 IPv6 주소이면 `::`를 반환합니다.

### 사용 시 참고 사항 {#usage-notes}
- `to_ipv6_or_default` → `IPv6` 타입 변환과 동일하며, `IPv6` 열이 있는 테이블을 생성하는 경우에 적합합니다.
- 유효하지 않은 입력에 대해 예외를 발생시키지 않고 기본값 `::`를 반환합니다.

## 예제 {#examples}

IPv6 텍스트 `2001:1b70:a1:610::b102:2`를 `IPv6` 타입으로 변환합니다.
```sql
SELECT to_ipv6_or_default('2001:1b70:a1:610::b102:2') as v6;
+-------------------------------+
| v6                            |
+-------------------------------+
| 2001:1b70:a1:610::b102:2      |
+-------------------------------+
```

NULL을 입력하면 기본값 `::`를 반환합니다.
```sql
SELECT to_ipv6_or_default(NULL) as v6;
+----+
| v6 |
+----+
| :: |
+----+
```

유효하지 않은 IPv6 텍스트를 입력하면 기본값 `::`를 반환합니다.
```sql
SELECT to_ipv6_or_default('not-an-ip') as v6;
+----+
| v6 |
+----+
| :: |
+----+
```

### 키워드 {#keywords}

TO_IPV6_OR_DEFAULT
