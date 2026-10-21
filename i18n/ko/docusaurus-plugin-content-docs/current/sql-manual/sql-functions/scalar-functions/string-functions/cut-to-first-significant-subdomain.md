---
{
    "title": "CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN",
    "language": "ko",
    "description": "CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN 함수는 URL에서 최상위 도메인부터 첫 번째 유의미한 하위 도메인까지 포함하는 유효한 도메인 부분을 추출합니다."
}
---

## 설명 {#description}

CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN 함수는 URL에서 최상위 도메인부터 "첫 번째 유의미한 하위 도메인"까지 포함하는 유효한 도메인 부분을 추출합니다. 입력 URL이 유효하지 않으면 빈 문자열을 반환합니다.

## 구문 {#syntax}

```sql
CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN(<url>)
```

## 매개변수 {#parameters}
| 매개변수 | 설명                                   |
| --------- | --------------------------------------------- |
| `<url>` | 처리할 URL 문자열입니다. 타입: VARCHAR |

## 반환 값 {#return-value}

추출한 도메인 부분을 VARCHAR 타입으로 반환합니다.

특수한 경우:
- url이 NULL이면 NULL을 반환합니다.
- url이 유효한 도메인 형식이 아니면 빈 문자열을 반환합니다.

## 예제 {#examples}

1. 기본 도메인 처리
```sql
SELECT cut_to_first_significant_subdomain('www.baidu.com');
```
```text
+-----------------------------------------------------+
| cut_to_first_significant_subdomain('www.baidu.com') |
+-----------------------------------------------------+
| baidu.com                                           |
+-----------------------------------------------------+
```

2. 다단계 도메인 처리
```sql
SELECT cut_to_first_significant_subdomain('www.google.com.cn');
```
```text
+---------------------------------------------------------+
| cut_to_first_significant_subdomain('www.google.com.cn') |
+---------------------------------------------------------+
| google.com.cn                                           |
+---------------------------------------------------------+
```

3. 유효하지 않은 도메인 처리
```sql
SELECT cut_to_first_significant_subdomain('wwwwwwww');
```
```text
+------------------------------------------------+
| cut_to_first_significant_subdomain('wwwwwwww') |
+------------------------------------------------+
|                                                |
+------------------------------------------------+
```
