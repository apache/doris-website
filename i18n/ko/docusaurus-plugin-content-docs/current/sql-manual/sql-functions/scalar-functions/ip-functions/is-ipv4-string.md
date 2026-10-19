---
{
    "title": "IS_IPV4_STRING",
    "language": "ko",
    "description": "입력 문자열이 유효한 IPv4 주소 형식인지 확인합니다. 유효한 IPv4 주소이면 1을 반환하고, 그렇지 않으면 0을 반환합니다."
}
---

## 설명 {#description}
입력 문자열이 유효한 IPv4 주소 형식인지 확인합니다. 유효한 IPv4 주소이면 1을 반환하고, 그렇지 않으면 0을 반환합니다.

## 별칭 {#alias}
- IS_IPV4

## 구문 {#syntax}
```sql
IS_IPV4_STRING(<ipv4_str>)
```

### 매개변수 {#parameters}
- `<ipv4_str>`: 확인할 문자열

### 반환 값 {#return-value}
반환 유형: BOOLEAN

반환 값의 의미:
- 1 반환: 입력이 유효한 IPv4 주소 형식임을 나타냅니다
- 0 반환: 입력이 유효한 IPv4 주소 형식이 아님을 나타냅니다
- 입력이 NULL이면 NULL을 반환합니다

### 사용 시 참고 사항 {#usage-notes}
- 문자열 형식이 IPv4 주소 규격(A.B.C.D 형식)에 맞는지만 확인합니다
- 실제 IP 주소 변환은 수행하지 않고 형식만 검증합니다
- NULL 입력을 지원하며 NULL을 반환합니다

## 예제 {#examples}

유효한 IPv4 주소 형식을 확인합니다.
```sql
SELECT is_ipv4_string('192.168.1.1') as is_valid;
+----------+
| is_valid |
+----------+
| 1        |
+----------+
```

경계값에 해당하는 IPv4 주소를 확인합니다.
```sql
SELECT 
  is_ipv4_string('0.0.0.0') as min_ip,
  is_ipv4_string('255.255.255.255') as max_ip;
+--------+--------+
| min_ip | max_ip |
+--------+--------+
| 1      | 1      |
+--------+--------+
```

유효하지 않은 IPv4 주소 형식을 확인합니다.
```sql
SELECT 
  is_ipv4_string('256.1.1.1') as invalid_range,
  is_ipv4_string('192.168.1') as missing_octet,
  is_ipv4_string('192.168.1.1.1') as extra_octet,
  is_ipv4_string('not-an-ip') as not_ip;
+---------------+----------------+--------------+--------+
| invalid_range | missing_octet | extra_octet | not_ip |
+---------------+----------------+--------------+--------+
| 0             | 0              | 0            | 0      |
+---------------+----------------+--------------+--------+
```

NULL 입력을 확인합니다.
```sql
SELECT is_ipv4_string(NULL) as null_check;
+------------+
| null_check |
+------------+
| NULL       |
+------------+
```

### 키워드 {#keywords}

IS_IPV4_STRING
