---
{
    "title": "DOMAIN_WITHOUT_WWW",
    "language": "ko",
    "description": "URL 문자열에서 www 접두사를 제외한 도메인 이름을 추출합니다."
}
---

## 설명 {#description}

URL 문자열에서 www 접두사를 제외한 도메인 이름을 추출합니다.

## 구문 {#syntax}

```sql
DOMAIN_WITHOUT_WWW ( <url> )
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|----------------------|
| `<url>`   | www 접두사를 제외한 도메인 이름을 추출할 `URL` |

## 반환값 {#return-value}

매개변수 `<url>`에서 www 접두사를 제외한 도메인 이름을 반환합니다.

```sql
SELECT DOMAIN_WITHOUT_WWW("https://www.apache.org/docs/gettingStarted/what-is-apache-doris")
```

```text
+---------------------------------------------------------------------------------------+
| domain_without_www('https://www.apache.org/docs/gettingStarted/what-is-apache-doris') |
+---------------------------------------------------------------------------------------+
| apache.org                                                                            |
+---------------------------------------------------------------------------------------+
```
