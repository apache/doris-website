---
{
    "title": "CUT_IPV6",
    "language": "ko",
    "description": "IPv6 주소의 유형(IPv4-mapped 또는 순수 IPv6)에 따라 주소 끝에서 지정된 바이트 수를 잘라냅니다."
}
---

## 설명 {#description}
IPv6 주소의 유형(IPv4-mapped 또는 순수 IPv6)에 따라 주소 끝에서 지정된 바이트 수를 잘라내고, 잘라낸 IPv6 주소 문자열을 반환합니다.

## 구문 {#syntax}
```sql
CUT_IPV6(<ipv6_address>, <bytes_to_cut_for_ipv6>, <bytes_to_cut_for_ipv4>)
```

### 매개변수 {#parameters}
- `<ipv6_address>`: IPv6 타입의 주소
- `<bytes_to_cut_for_ipv6>`: 순수 IPv6 주소에서 잘라낼 바이트 수(TINYINT 타입)
- `<bytes_to_cut_for_ipv4>`: IPv4-mapped 주소에서 잘라낼 바이트 수(TINYINT 타입)

### 반환값 {#return-value}
반환 타입: VARCHAR

반환값의 의미:
- 잘라낸 IPv6 주소 문자열을 반환합니다.
- 입력이 IPv4-mapped 주소이면 `bytes_to_cut_for_ipv4` 매개변수를 사용합니다.
- 입력이 순수 IPv6 주소이면 `bytes_to_cut_for_ipv6` 매개변수를 사용합니다.
- 세 매개변수 `<ipv6_address>`, `<bytes_to_cut_for_ipv6>`, `<bytes_to_cut_for_ipv4>` 중 하나라도 NULL이면 NULL을 반환합니다.

### 사용 시 참고 사항 {#usage-notes}
- IPv6 주소가 IPv4-mapped 주소인지 자동으로 감지합니다(형식: `::ffff:IPv4`).
- 주소 유형에 따라 잘라낼 바이트 수를 선택합니다.
- 잘라내기 작업은 주소 끝에서 시작하며, 지정된 수의 바이트 값을 영으로 설정합니다.
- 매개변수 값은 16(IPv6 주소의 전체 바이트 수)을 초과할 수 없습니다.

## 예제 {#examples}

순수 IPv6 주소의 끝부분에서 바이트를 잘라냅니다.
```sql
SELECT cut_ipv6(to_ipv6('2001:db8::1'), 4, 4) as cut_result;
+------------------+
| cut_result       |
+------------------+
| 2001:db8::       |
+------------------+
```

IPv4-mapped 주소의 끝부분에서 바이트를 잘라냅니다.
```sql
SELECT cut_ipv6(to_ipv6('::ffff:192.168.1.1'), 4, 4) as cut_result;
+----------------+
| cut_result     |
+----------------+
| ::ffff:0.0.0.0 |
+----------------+
```

잘라낼 바이트 수에 서로 다른 매개변수 값을 사용합니다.
```sql
SELECT 
  cut_ipv6(to_ipv6('2001:db8::1'), 8, 4) as ipv6_cut_8,
  cut_ipv6(to_ipv6('::ffff:192.168.1.1'), 4, 8) as ipv4_cut_8;
+------------+------------+
| ipv6_cut_8 | ipv4_cut_8 |
+------------+------------+
| 2001:db8:: | ::         |
+------------+------------+
```

매개변수가 NULL이면 NULL을 반환합니다.
```sql 
select cut_ipv6(NULL, NULL, NULL);
+----------------------------+
| cut_ipv6(NULL, NULL, NULL) |
+----------------------------+
| NULL                       |
+----------------------------+

select cut_ipv6(to_ipv6("::"), NULL, 0);
+----------------------------------+
| cut_ipv6(to_ipv6("::"), NULL, 0) |
+----------------------------------+
| NULL                             |
+----------------------------------+

select cut_ipv6(to_ipv6("::"), 4, NULL);
+----------------------------------+
| cut_ipv6(to_ipv6("::"), 4, NULL) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

매개변수 값이 범위를 벗어나면 예외가 발생합니다.
```sql
SELECT cut_ipv6(to_ipv6('2001:db8::1'), 17, 4);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Illegal value for argument 2 TINYINT of function cut_ipv6

SELECT cut_ipv6(to_ipv6('2001:db8::1'), 4, 122);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Illegal value for argument 3 TINYINT of function cut_ipv6
```

### 키워드 {#keywords}

CUT_IPV6
