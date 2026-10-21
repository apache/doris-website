---
{
    "title": "URL_DECODE",
    "language": "ko",
    "description": "URL을 디코딩된 문자열로 변환합니다."
}
---

## 설명 {#description}

URL을 디코딩된 문자열로 변환합니다.

## 구문 {#syntax}

```sql
URL_DECODE( <str> )
```

## 필수 매개변수 {#required-parameters}
| 매개변수 | 설명 |
|------|------|
| `<str>` | 디코딩할 문자열입니다. url이 문자열 타입이 아닌 경우. |

##  반환 값 {#return-value}

디코딩된 값

##  예제 {#example}

```sql
select url_decode('https%3A%2F%2Fdoris.apache.org%2Fzh-CN%2Fdocs%2Fsql-manual%2Fsql-functions%2Fstring-functions');
```
```text
+------------------------------------------------+
| url_decode('https%3A%2F%2Fdoris.apache.org%2Fzh-CN%2Fdocs%2Fsql-manual%2Fsql-functions%2Fstring-functions') |
+------------------------------------------------+
| https://doris.apache.org/zh-CN/docs/sql-manual/sql-functions/string-functions                               |
+------------------------------------------------+
```
