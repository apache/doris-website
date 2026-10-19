---
{
    "title": "HAMMING_DISTANCE",
    "language": "ko",
    "description": "HAMMING_DISTANCE 함수는 길이가 같은 두 문자열에서 문자가 서로 다른 위치의 개수를 반환합니다."
}
---

## 설명 {#description}
`HAMMING_DISTANCE` 함수는 길이가 같은 두 문자열에서 문자가 서로 다른 위치의 개수를 반환합니다.

이 함수는 UTF-8 문자를 기준으로 개수를 셉니다.

## 구문 {#syntax}
```sql
HAMMING_DISTANCE(<str1>, <str2>)
```

## 매개변수 {#parameters}
| 매개변수 | 설명 |
| -- | -- |
| `<str1>` | 첫 번째 문자열 |
| `<str2>` | 두 번째 문자열 |

## 반환값 {#return-value}
BIGINT 값을 반환합니다.

## 예제 {#examples}
```sql
SELECT hamming_distance('karolin', 'kathrin'); -- 3
SELECT hamming_distance('数据库', '数据仓');   -- 1
```

## 참고 사항 {#notes}
- 두 문자열의 길이는 같아야 합니다. 그렇지 않으면 오류를 반환합니다.
- UTF-8 문자를 지원합니다.
- NULL을 입력하면 NULL을 반환합니다.
