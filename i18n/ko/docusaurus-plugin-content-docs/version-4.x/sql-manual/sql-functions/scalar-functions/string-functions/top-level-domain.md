---
{
    "title": "TOP_LEVEL_DOMAIN",
    "language": "ko",
    "description": "TOPLEVELDOMAIN 함수는 URL에서 최상위 도메인을 추출하는 데 사용됩니다. 입력 URL이 유효하지 않으면 빈 문자열을 반환합니다."
}
---

## 설명 {#description}

TOP_LEVEL_DOMAIN 함수는 URL에서 최상위 도메인을 추출하는 데 사용됩니다. 입력 URL이 유효하지 않으면 빈 문자열을 반환합니다.

## 구문 {#syntax}

```sql
TOP_LEVEL_DOMAIN(<url>)
```

## 매개변수 {#parameters}
| 매개변수 | 설명                                                              |
| --------- | ------------------------------------------------------------------------ |
| `<url>` | 최상위 도메인을 추출할 URL 문자열입니다. 타입: VARCHAR |

## 반환값 {#return-value}

추출한 최상위 도메인을 VARCHAR 타입으로 반환합니다.

특수한 경우:
- url이 NULL이면 NULL을 반환합니다
- url이 유효한 URL 형식이 아니면 빈 문자열을 반환합니다
- 다단계 도메인(예: .com.cn)의 경우 마지막 단계의 도메인을 반환합니다

## 예제 {#examples}

1. 기본 도메인 처리
```sql
SELECT top_level_domain('www.baidu.com');
```
```text
+-----------------------------------+
| top_level_domain('www.baidu.com') |
+-----------------------------------+
| com                               |
+-----------------------------------+
```

2. 다단계 도메인 처리
```sql
SELECT top_level_domain('www.google.com.cn');
```
```text
+---------------------------------------+
| top_level_domain('www.google.com.cn') |
+---------------------------------------+
| cn                                    |
+---------------------------------------+
```

3. 유효하지 않은 URL 처리
```sql
SELECT top_level_domain('wwwwwwww');
```
```text
+------------------------------+
| top_level_domain('wwwwwwww') |
+------------------------------+
|                              |
+------------------------------+
```
