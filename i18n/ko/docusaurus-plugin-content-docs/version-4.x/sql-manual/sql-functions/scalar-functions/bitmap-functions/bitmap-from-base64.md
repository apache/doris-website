---
{
    "title": "BITMAP_FROM_BASE64",
    "language": "ko",
    "description": "base64 문자열(bitmaptobase64 함수로 변환할 수 있는 문자열)을 BITMAP으로 변환합니다. 입력 문자열이 유효하지 않으면 NULL을 반환합니다."
}
---

## 설명 {#description}

base64 문자열(`bitmap_to_base64` 함수로 변환할 수 있는 문자열)을 BITMAP으로 변환합니다. 입력 문자열이 유효하지 않으면 NULL을 반환합니다.

## 구문 {#syntax}

```sql
 BITMAP_FROM_BASE64(<base64_str>)
```

## 매개변수 {#parameters}

| 매개변수      | 설명                                                     |
|----------------|-----------------------------------------------------------------|
| `<base64_str>` | base64 문자열(`bitmap_to_base64` 함수로 변환할 수 있음) |

## 반환 값 {#return-value}

BITMAP을 반환합니다.
- 입력 필드가 유효하지 않으면 결과는 NULL입니다.

## 예제 {#examples}


```sql
select bitmap_to_string(bitmap_from_base64("invalid")) bts;
```

```text
+------+
| bts  |
+------+
| NULL |
+------+
```

```sql
select bitmap_to_string(bitmap_from_base64("AA==")) bts;
```

```text
+------+
| bts  |
+------+
|      |
+------+
```

```sql
select bitmap_to_string(bitmap_from_base64("AQEAAAA=")) bts;
```

```text
+------+
| bts  |
+------+
| 1    |
+------+
```

```sql
select bitmap_to_string(bitmap_from_base64("AjowAAACAAAAAAAAAJgAAAAYAAAAGgAAAAEAf5Y=")) bts;
```

```text
+-----------+
| bts       |
+-----------+
| 1,9999999 |
+-----------+
```
