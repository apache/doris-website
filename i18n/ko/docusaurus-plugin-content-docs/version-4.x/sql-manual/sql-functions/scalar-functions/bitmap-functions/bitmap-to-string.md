---
{
    "title": "BITMAP_TO_STRING",
    "language": "ko",
    "description": "Bitmap을 설정된 모든 비트의 위치가 쉼표로 구분된 문자열로 변환합니다."
}
---

## 설명 {#description}

Bitmap을 설정된 모든 비트의 위치가 쉼표로 구분된 문자열로 변환합니다.

## 구문 {#syntax}

```sql
BITMAP_TO_STRING(<bitmap>)
```

## 매개변수 {#parameters}

| 매개변수  | 설명                     |
|------------|---------------------------------|
| `<bitmap>` | Bitmap 타입의 열 또는 표현식 |

## 반환 값 {#return-value}

Bitmap에 설정된 모든 비트의 위치를 쉼표로 구분한 문자열입니다.  
Bitmap이 `NULL`이면 `NULL`을 반환합니다.

## 예제 {#examples}

`NULL` Bitmap을 문자열로 변환하려면 다음과 같이 실행합니다.

```sql
select bitmap_to_string(null);
```

결과는 다음과 같습니다.

```text
+------------------------+
| bitmap_to_string(NULL) |
+------------------------+
| NULL                   |
+------------------------+
```

빈 Bitmap을 문자열로 변환하려면 다음과 같이 실행합니다.

```sql
select bitmap_to_string(bitmap_empty());
```

결과는 다음과 같습니다.

```text
+----------------------------------+
| bitmap_to_string(bitmap_empty()) |
+----------------------------------+
|                                  |
+----------------------------------+
```

원소가 하나인 Bitmap을 문자열로 변환하려면 다음과 같이 실행합니다.

```sql
select bitmap_to_string(to_bitmap(1));
```

결과는 다음과 같습니다.

```text
+--------------------------------+
| bitmap_to_string(to_bitmap(1)) |
+--------------------------------+
| 1                              |
+--------------------------------+
```

원소가 여러 개인 Bitmap을 문자열로 변환하려면 다음과 같이 실행합니다.

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2)));
```

결과는 다음과 같습니다.

```text
+---------------------------------------------------------+
| bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2))) |
+---------------------------------------------------------+
| 1,2                                                     |
+---------------------------------------------------------+
```
