---
{
    "title": "EXTRACT_URL_PARAMETER",
    "language": "ko",
    "description": "URL에 name 매개변수가 있으면 해당 값을 반환하고, 없으면 빈 문자열을 반환합니다."
}
---

## 설명 {#description}

URL에 `name` 매개변수가 있으면 해당 값을 반환하고, 없으면 빈 문자열을 반환합니다.

같은 이름의 매개변수가 여러 개 있으면 처음 나타나는 매개변수의 값을 반환합니다.

이 함수는 URL에 인코딩된 매개변수 이름이 전달된 매개변수와 정확히 일치한다고 가정하고 동작합니다.

URL의 다른 부분을 가져오려면 [parse_url](parse-url.md)을 사용할 수 있습니다.

## 구문 {#syntax}

```sql
EXTRACT_URL_PARAMETER ( <url> , <name> )
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|------------|---------------|
| `<url>`    | 반환할 매개변수가 포함된 URL 문자열 |
| `<name>`   | 반환할 매개변수의 이름 |

## 반환 값 {#return-value}

매개변수 `<name>`의 값을 `<url>`에서 가져옵니다.

## 예제 {#example}

```sql
SELECT EXTRACT_URL_PARAMETER("http://doris.apache.org?k1=aa&k2=bb&test=cc#999", "k2")
```

```text
+--------------------------------------------------------------------------------+
| extract_url_parameter('http://doris.apache.org?k1=aa&k2=bb&test=cc#999', 'k2') |
+--------------------------------------------------------------------------------+
| bb                                                                             |
+--------------------------------------------------------------------------------+
```
