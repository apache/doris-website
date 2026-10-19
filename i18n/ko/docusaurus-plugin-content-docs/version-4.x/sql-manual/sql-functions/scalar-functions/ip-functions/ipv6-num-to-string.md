---
{
    "title": "IPV6_NUM_TO_STRING | IP 함수",
    "language": "ko",
    "description": "String 타입의 바이너리 형식 IPv6 주소를 입력받습니다. 이 주소를 텍스트 형식의 문자열로 반환합니다.",
    "sidebar_label": "IPV6_NUM_TO_STRING"
}
---

# IPV6_NUM_TO_STRING {#ipv6_num_to_string}

## 설명 {#description}
String 타입의 바이너리 형식 IPv6 주소를 입력받습니다. 이 주소를 텍스트 형식의 문자열로 반환합니다.
- IPv6에 매핑된 IPv4 주소는 ::ffff:111.222.33.44로 시작합니다.

## 별칭 {#alias}
- INET6_NTOA

## 구문 {#syntax}
```sql
IPV6_NUM_TO_STRING(<ipv6_num>)
```

## 매개변수 {#parameters}
| 매개변수 | 설명                                      |
|-----------|--------------------------------------------------|
| `<ipv6_num>`      | String 타입의 바이너리 형식 IPv6 주소  |

## 반환값 {#return-value}
ipv6 주소를 텍스트 형식의 문자열로 반환합니다.
- 입력 문자열이 유효한 IPv6 주소의 바이너리 인코딩이 아니면 `NULL`을 반환합니다.


## 예제 {#example}
```sql
select ipv6_num_to_string(unhex('2A0206B8000000000000000000000011')) as addr, ipv6_num_to_string("-23vno12i34nlfwlsj");
```
```text
+--------------+------------------------------------------+
| addr         | ipv6_num_to_string('-23vno12i34nlfwlsj') |
+--------------+------------------------------------------+
| 2a02:6b8::11 | NULL                                     |
+--------------+------------------------------------------+
```
