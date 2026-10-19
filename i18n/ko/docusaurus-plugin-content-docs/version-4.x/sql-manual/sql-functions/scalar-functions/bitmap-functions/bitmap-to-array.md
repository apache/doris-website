---
{
    "title": "BITMAP_TO_ARRAY",
    "language": "ko",
    "description": "Bitmap을 Array로 변환합니다."
}
---

## 설명 {#description}

Bitmap을 Array로 변환합니다.

## 구문 {#syntax}

```sql
BITMAP_TO_ARRAY(<bitmap>)
```

## 매개변수 {#parameters}

| 매개변수  | 설명                     |
|------------|---------------------------------|
| `<bitmap>` | Bitmap 타입의 열 또는 표현식 |

## 반환값 {#return-value}

Bitmap의 모든 비트 위치를 포함하는 배열을 반환합니다.  
Bitmap이 `NULL`이면 `NULL`을 반환합니다.

## 예제 {#examples}

`NULL`인 Bitmap을 배열로 변환하려면 다음과 같이 실행합니다:

```sql
select bitmap_to_array(null);
```

결과는 다음과 같습니다:

```text
+------------------------+
| bitmap_to_array(NULL)  |
+------------------------+
| NULL                   |
+------------------------+
```

빈 Bitmap을 배열로 변환하려면 다음과 같이 실행합니다:

```sql
select bitmap_to_array(bitmap_empty());
```

결과는 다음과 같습니다:

```text
+---------------------------------+
| bitmap_to_array(bitmap_empty()) |
+---------------------------------+
| []                              |
+---------------------------------+
```

원소가 하나인 Bitmap을 배열로 변환하려면 다음과 같이 실행합니다:

```sql
select bitmap_to_array(to_bitmap(1));
```

결과는 다음과 같습니다:

```text
+-------------------------------+
| bitmap_to_array(to_bitmap(1)) |
+-------------------------------+
| [1]                           |
+-------------------------------+
```

원소가 여러 개인 Bitmap을 배열로 변환하려면 다음과 같이 실행합니다:

```sql
select bitmap_to_array(bitmap_from_string('1,2,3,4,5'));
```

결과는 다음과 같습니다:

```text
+--------------------------------------------------+
| bitmap_to_array(bitmap_from_string('1,2,3,4,5')) |
+--------------------------------------------------+
| [1, 2, 3, 4, 5]                                  |
+--------------------------------------------------+
```
