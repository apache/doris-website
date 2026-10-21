---
{
    "title": "IPV4_STRING_TO_NUM",
    "language": "ko",
    "description": "A.B.C.D 형식(점으로 구분된 십진수)의 IPv4 주소가 포함된 문자열을 받습니다."
}
---

## 설명 {#description}
A.B.C.D 형식(점으로 구분된 십진수)의 IPv4 주소가 포함된 문자열을 받습니다. 해당 IPv4 주소의 숫자 값을 네트워크 바이트 순서(big endian)로 반환합니다.

## 구문 {#syntax}
```sql
IPV4_STRING_TO_NUM(<ipv4_string>)
```

### 매개변수 {#parameters}
- `<ipv4_string>`: IPv4 주소 문자열(A.B.C.D 형식)

### 반환 값 {#return-value}
반환 타입: BIGINT

반환 값의 의미:
- 해당 IPv4 주소의 숫자 값을 네트워크 바이트 순서(big endian)의 정수로 반환합니다.
- 유효하지 않은 IPv4 문자열이나 `NULL`이 입력되면 예외가 발생합니다.

### 사용 시 참고 사항 {#usage-notes}
- 표준 IPv4 텍스트만 지원하며, CIDR(예: `/24`), 포트(예: `:80`) 또는 기타 확장 형식은 지원하지 않습니다.
- 암시적으로 공백을 제거하거나 타입을 변환하지 않으며, 앞뒤에 공백이 있는 문자열은 유효하지 않은 것으로 간주합니다.
- 일반적으로 `inet_ntoa`, `to_ipv4`와 함께 사용하여 상호 변환합니다.

## 예제 {#examples}

IPv4 텍스트 `192.168.0.1`을 해당하는 네트워크 바이트 순서(big endian)의 정숫값으로 변환합니다.
```sql
select ipv4_string_to_num('192.168.0.1');
+-----------------------------------+
| ipv4_string_to_num('192.168.0.1') |
+-----------------------------------+
| 3232235521                        |
+-----------------------------------+
```

IPv4 경곗값(최솟값 및 최댓값)입니다.
```sql
select
  ipv4_string_to_num('0.0.0.0')             as min_v4,
  ipv4_string_to_num('255.255.255.255')     as max_v4;
+--------+-----------+
| min_v4| max_v4    |
+--------+-----------+
| 0      | 4294967295|
+--------+-----------+
```

유효하지 않은 입력에는 예외가 발생합니다(주소 구간 값의 범위 초과/공백 포함/NULL).
```sql
select ipv4_string_to_num('256.0.0.1');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv4 value

select ipv4_string_to_num(' 1.1.1.1 ');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv4 value

select ipv4_string_to_num(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Null Input, you may consider convert it to a valid default IPv4 value like '0.0.0.0' first
```

`inet_ntoa`/`ipv4_num_to_string` 및 `to_ipv4`를 사용한 상호 변환 예제: IPv4 텍스트 → 정수 → IPv4 텍스트 → IPv4 타입.
```sql
-- Step 1: IPv4 text to integer
SELECT ipv4_string_to_num('192.168.1.1') as ipv4_int;
+------------+
| ipv4_int   |
+------------+
| 3232235777 |
+------------+

-- Step 2: Integer back to IPv4 text
SELECT ipv4_num_to_string(ipv4_string_to_num('192.168.1.1')) as back_to_text;
+----------------+
| back_to_text   |
+----------------+
| 192.168.1.1    |
+----------------+

-- Step 3: IPv4 text to IPv4 type
SELECT to_ipv4(ipv4_num_to_string(ipv4_string_to_num('192.168.1.1'))) as ipv4_type;
+-------------+
| ipv4_type   |
+-------------+
| 192.168.1.1 |
+-------------+
```

### 키워드 {#keywords}

IPV4_STRING_TO_NUM
