---
{
    "title": "IS_IPV6_STRING",
    "language": "ko",
    "description": "입력 문자열이 유효한 IPv6 주소 형식인지 확인합니다. 유효한 IPv6 주소이면 1을 반환하고, 그렇지 않으면 0을 반환합니다."
}
---

## 설명 {#description}
입력 문자열이 유효한 IPv6 주소 형식인지 확인합니다. 유효한 IPv6 주소이면 1을 반환하고, 그렇지 않으면 0을 반환합니다.

## 별칭 {#alias}
- IS_IPV6

## 구문 {#syntax}
```sql
IS_IPV6_STRING(<ipv6_str>)
```

### 매개변수 {#parameters}
- `<ipv6_str>`: 확인할 문자열

### 반환 값 {#return-value}
반환 타입: BOOLEAN

반환 값의 의미:
- 1 반환: 입력이 유효한 IPv6 주소 형식임을 나타냅니다.
- 0 반환: 입력이 유효한 IPv6 주소 형식이 아님을 나타냅니다.
- 입력이 NULL이면 NULL을 반환합니다.

### 사용 시 참고 사항 {#usage-notes}
- 문자열 형식이 IPv6 주소 규격에 맞는지만 확인합니다.
- 실제 IP 주소 변환은 수행하지 않고 형식만 검증합니다.
- NULL 입력을 지원하며 NULL을 반환합니다.

## 예제 {#examples}

유효한 IPv6 주소 형식을 확인합니다.
```sql
SELECT is_ipv6_string('2001:db8::1') as is_valid;
+----------+
| is_valid |
+----------+
| 1        |
+----------+
```

다양한 IPv6 주소 형식을 확인합니다.
```sql
SELECT 
  is_ipv6_string('::1') as localhost,
  is_ipv6_string('2001:db8::1') as standard,
  is_ipv6_string('2001:db8:0:0:0:0:0:1') as expanded;
+-----------+----------+----------+
| localhost | standard | expanded |
+-----------+----------+----------+
| 1         | 1        | 1        |
+-----------+----------+----------+
```

유효하지 않은 IPv6 주소 형식을 확인합니다.
```sql
SELECT 
  is_ipv6_string('2001:db8::1::2') as double_colon,
  is_ipv6_string('2001:db8:1') as too_short,
  is_ipv6_string('2001:db8:1:2:3:4:5:6:7') as too_long,
  is_ipv6_string('not-an-ipv6') as not_ipv6;
+--------------+-----------+----------+----------+
| double_colon | too_short | too_long | not_ipv6 |
+--------------+-----------+----------+----------+
| 0            | 0         | 0        | 0        |
+--------------+-----------+----------+----------+
```

NULL 입력을 확인합니다.
```sql
SELECT is_ipv6_string(NULL) as null_check;
+------------+
| null_check |
+------------+
| NULL       |
+------------+
```

### 키워드 {#keywords}

IS_IPV6_STRING
