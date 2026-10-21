---
{
    "title": "PARSE_URL",
    "language": "ko",
    "description": "PARSE_URL 함수는 주로 URL 문자열을 파싱하여 프로토콜, 호스트, 경로, 쿼리 매개변수와 같은 다양한 구성 요소를 추출하는 데 사용됩니다."
}
---

## 설명 {#description}

PARSE_URL 함수는 주로 URL 문자열을 파싱하여 프로토콜, 호스트, 경로, 쿼리 매개변수 등 다양한 구성 요소를 추출하는 데 사용됩니다.

## 구문 {#syntax}

```sql
PARSE_URL( <url>, <name> )
```

## 매개변수 {#parameters}

| 매개변수       | 설명                                                                                      |
|----------|--------------------------------------------------------------------------------------------------|
| `<url>`  | 파싱할 URL                                                                       |
| `<name>` | 추출할 구성 요소입니다. 지정할 수 있는 값은 `PROTOCOL`, `HOST`, `PATH`, `REF`, `AUTHORITY`, `FILE`, `USERINFO`, `PORT`, `QUERY`이며, 대소문자를 구분하지 않습니다. |

## 반환값 {#return-value}

`<url>`에서 지정한 구성 요소를 반환합니다. 특수한 경우는 다음과 같습니다.

- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.
- `<name>`에 허용된 값 이외의 유효하지 않은 값을 전달하면 오류가 발생합니다.

## 예제 {#examples}

```sql
SELECT parse_url ('https://doris.apache.org/', 'HOST');
```

```text
+------------------------------------------------+
| parse_url('https://doris.apache.org/', 'HOST') |
+------------------------------------------------+
| doris.apache.org                               |
+------------------------------------------------+
```

```sql
SELECT parse_url ('https://doris.apache.org/', null);
```

```text
+----------------------------------------------+
| parse_url('https://doris.apache.org/', NULL) |
+----------------------------------------------+
| NULL                                         |
+----------------------------------------------+
```

## 관련 항목 {#see-also}

QUERY에서 특정 매개변수를 추출하려면 [extract_url_parameter](./extract-url-parameter.md)를 사용하세요.
