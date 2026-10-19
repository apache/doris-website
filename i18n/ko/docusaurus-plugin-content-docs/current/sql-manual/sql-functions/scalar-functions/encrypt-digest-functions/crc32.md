---
{
    "title": "CRC32",
    "language": "ko",
    "description": "CRC32를 사용하여 결과를 계산합니다."
}
---

## 설명 {#description}

CRC32를 사용하여 결과를 계산합니다.

## 구문 {#syntax}
```sql
CRC32( <str> )
```
## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<str>` | CRC 계산에 사용할 값 |

## 반환 값 {#return-value}

이 문자열의 순환 중복 검사(Cyclic Redundancy Check) 값을 반환합니다.

## 예제 {#examples}

```sql
select crc32("abc"),crc32("中国");
```
```text
+--------------+-----------------+
| crc32('abc') | crc32('中国')   |
+--------------+-----------------+
|    891568578 |       737014929 |
+--------------+-----------------+
```
