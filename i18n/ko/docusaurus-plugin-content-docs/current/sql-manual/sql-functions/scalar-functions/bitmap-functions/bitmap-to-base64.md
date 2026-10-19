---
{
    "title": "BITMAP_TO_BASE64",
    "language": "ko",
    "description": "Bitmap을 Base64로 인코딩된 문자열로 변환합니다."
}
---

## 설명 {#description}

Bitmap을 Base64로 인코딩된 문자열로 변환합니다.

## 구문 {#syntax}

```sql
BITMAP_TO_BASE64(<bitmap>)
```

## 매개변수 {#parameters}

| 매개변수  | 설명                     |
|------------|---------------------------------|
| `<bitmap>` | Bitmap 타입의 컬럼 또는 표현식 |

## 반환값 {#return-value}

Bitmap의 Base64 인코딩 문자열을 반환합니다.  
반환값은 `NULL`이며, 이는 Bitmap이 `NULL`인 경우에 해당합니다.

::: note

BE 설정 옵션 `enable_set_in_bitmap_value`는 메모리 내 bitmap 값의 구체적인 형식을 변경하므로 이 함수의 결과에 영향을 줍니다.  
bitmap 내 요소의 순서는 보장되지 않으므로 내용이 같더라도 생성되는 Base64 문자열이 항상 같지는 않을 수 있습니다. 그러나 `bitmap_from_base64`로 디코딩한 bitmap은 동일합니다.

:::

## 예제 {#examples}

`NULL` Bitmap을 Base64 문자열로 변환하려면 다음과 같이 실행합니다.

```sql
select bitmap_to_base64(null);
```

결과는 다음과 같습니다.

```text
+------------------------+
| bitmap_to_base64(NULL) |
+------------------------+
| NULL                   |
+------------------------+
```

빈 Bitmap을 Base64 문자열로 변환하려면 다음과 같이 실행합니다.

```sql
select bitmap_to_base64(bitmap_empty());
```

결과는 다음과 같습니다.

```text
+----------------------------------+
| bitmap_to_base64(bitmap_empty()) |
+----------------------------------+
| AA==                             |
+----------------------------------+
```

요소가 하나인 Bitmap을 Base64 문자열로 변환하려면 다음과 같이 실행합니다.

```sql
select bitmap_to_base64(to_bitmap(1));
```

결과는 다음과 같습니다.

```text
+--------------------------------+
| bitmap_to_base64(to_bitmap(1)) |
+--------------------------------+
| BQEBAAAAAAAAAA==               |
+--------------------------------+
```

여러 요소가 있는 Bitmap을 Base64 문자열로 변환하려면 다음과 같이 실행합니다.

```sql
select bitmap_to_base64(bitmap_from_string("1,9999999"));
```

결과는 다음과 같습니다.

```text
+---------------------------------------------------------+
| bitmap_to_base64(bitmap_from_string("1,9999999"))       |
+---------------------------------------------------------+
| BQIBAAAAAAAAAH+WmAAAAAAA                          |
+---------------------------------------------------------+
```
