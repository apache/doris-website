---
{
    "title": "IPV6_STRING_TO_NUM",
    "language": "ko",
    "description": "IPV6_NUM_TO_STRING의 역함수로, IP 주소 문자열을 받아 IPv6 주소를 바이너리 형식으로 반환합니다."
}
---

## 설명 {#description}
IPV6_NUM_TO_STRING의 역함수로, IP 주소 문자열을 받아 IPv6 주소를 바이너리 형식으로 반환합니다.

## 구문 {#syntax}
```sql
IPV6_STRING_TO_NUM(<ipv6_string>)
```

### 매개변수 {#parameters}
- `<ipv6_string>`: 문자열 타입의 IPv6 주소

### 반환 값 {#return-value}
반환 타입: VARCHAR (16바이트 바이너리)

반환 값의 의미:
- IPv6의 16바이트 바이너리 인코딩을 반환합니다.
- 입력이 NULL이거나 유효하지 않은 IP 주소이면 예외가 발생합니다.
- 입력이 유효한 IPv4 텍스트이면 이에 대응하는 IPv6 주소(`::ffff:<ipv4>`)를 반환합니다.

### 사용 참고 사항 {#usage-notes}
- 표준 IPv6 텍스트를 지원합니다(축약형 및 `::`를 사용한 생략 형식 포함).
- 입력이 유효한 IPv4 텍스트이면 IPv6의 IPv4-Mapped 표현으로 변환하여 반환합니다.
- CIDR, 포트, 대괄호 등의 확장 형식은 지원하지 않습니다.

## 예제 {#examples}

IPv6 텍스트 `1111::ffff`를 16바이트 바이너리로 변환합니다(십육진수로 표시).
```sql
select hex(ipv6_string_to_num('1111::ffff')) as v6;
+----------------------------------+
| v6                               |
+----------------------------------+
| 1111000000000000000000000000FFFF |
+----------------------------------+
```

IPv4 텍스트는 자동으로 IPv6(`::ffff:<ipv4>`)에 매핑된 다음 16바이트 바이너리로 반환됩니다.
```sql
select hex(ipv6_string_to_num('192.168.0.1')) as mapped;
+----------------------------------+
| mapped                           |
+----------------------------------+
| 00000000000000000000FFFFC0A80001 |
+----------------------------------+
```

NULL을 입력하면 예외가 발생합니다.
```sql
select hex(ipv6_string_to_num(NULL));
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Null Input, you may consider convert it to a valid default IPv6 value like '::' first
```

유효하지 않은 값을 입력하면 예외가 발생합니다.
```sql
select hex(ipv6_string_to_num('notaaddress'));
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv6 value
```

### 키워드 {#keywords}

IPV6_STRING_TO_NUM
