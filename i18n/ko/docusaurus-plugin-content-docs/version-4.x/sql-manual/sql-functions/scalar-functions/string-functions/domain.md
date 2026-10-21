---
{
    "title": "DOMAIN",
    "language": "ko",
    "description": "문자열 URL에서 도메인 이름을 추출합니다"
}
---

## 설명 {#description}

문자열 URL에서 도메인 이름을 추출합니다

## 구문 {#syntax}

```sql
DOMAIN ( <url> )
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|--------------------|
| `<url>`   | 도메인 이름을 추출할 `URL` |

## 반환값 {#return-value}

매개변수 `<url>`의 도메인 이름

## 예제 {#example}

```sql
SELECT DOMAIN("https://doris.apache.org/docs/gettingStarted/what-is-apache-doris")
```

```text
+-----------------------------------------------------------------------------+
| domain('https://doris.apache.org/docs/gettingStarted/what-is-apache-doris') |
+-----------------------------------------------------------------------------+
| doris.apache.org                                                            |
+-----------------------------------------------------------------------------+
```
