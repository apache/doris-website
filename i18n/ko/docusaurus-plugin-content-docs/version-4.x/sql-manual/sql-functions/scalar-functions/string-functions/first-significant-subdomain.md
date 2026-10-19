---
{
    "title": "FIRST_SIGNIFICANT_SUBDOMAIN",
    "language": "ko",
    "description": "URL에서 \"첫 번째 유효한 하위 도메인\"을 추출하여 반환합니다. 유효하지 않은 경우 빈 문자열을 반환합니다."
}
---

## 설명 {#description}

URL에서 "첫 번째 유효한 하위 도메인"을 추출하여 반환합니다. 유효하지 않은 경우 빈 문자열을 반환합니다.

## 구문 {#syntax}

```sql
FIRST_SIGNIFICANT_SUBDOMAIN ( <url> )
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|----------------------|
| `<url>`   | "첫 번째 유효한 하위 도메인"을 추출할 URL |

## 반환 값 {#return-value}

`<url>`의 첫 번째 유효한 하위 도메인입니다.

## 예제 {#example}

```sql
SELECT FIRST_SIGNIFICANT_SUBDOMAIN("www.baidu.com"),FIRST_SIGNIFICANT_SUBDOMAIN("www.google.com.cn"),FIRST_SIGNIFICANT_SUBDOMAIN("wwwwwwww")
```

```text
+----------------------------------------------+--------------------------------------------------+-----------------------------------------+
| first_significant_subdomain('www.baidu.com') | first_significant_subdomain('www.google.com.cn') | first_significant_subdomain('wwwwwwww') |
+----------------------------------------------+--------------------------------------------------+-----------------------------------------+
| baidu                                        | google                                           |                                         |
+----------------------------------------------+--------------------------------------------------+-----------------------------------------+
```
