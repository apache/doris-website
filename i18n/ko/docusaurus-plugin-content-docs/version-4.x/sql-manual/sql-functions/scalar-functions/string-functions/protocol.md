---
{
    "title": "PROTOCOL",
    "language": "ko",
    "description": "PROTOCOL 함수는 URL 문자열에서 프로토콜 부분을 추출하는 데 주로 사용됩니다."
}
---

## 설명 {#description}

PROTOCOL 함수는 URL 문자열에서 프로토콜 부분을 추출하는 데 주로 사용됩니다.

## 구문 {#syntax}

```sql
PROTOCOL( <url> )
```

## 매개변수 {#parameters}

| 매개변수      | 설명         |
|---------|------------|
| `<url>` | 파싱할 URL |

## 반환 값 {#return-value}

<url>의 프로토콜 부분을 반환합니다. 특수한 경우는 다음과 같습니다.

- 매개변수 중 하나라도 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
SELECT protocol('https://doris.apache.org/');
```

```text
+---------------------------------------+
| protocol('https://doris.apache.org/') |
+---------------------------------------+
| https                                 |
+---------------------------------------+
```

```sql
SELECT protocol(null);
```

```text
+----------------+
| protocol(NULL) |
+----------------+
| NULL           |
+----------------+
```

## 참고 항목 {#see-also}

URL의 다른 부분을 추출하려면 [parse_url](./parse-url.md)을 사용할 수 있습니다.
