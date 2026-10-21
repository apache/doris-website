---
{
    "title": "BITMAP_REMOVE",
    "language": "ko",
    "description": "Bitmap 컬럼에서 지정한 값을 제거합니다."
}
---

## 설명 {#description}

Bitmap 컬럼에서 지정한 값을 제거합니다.

## 구문 {#syntax}

```sql
BITMAP_REMOVE(<bitmap>, <value>)
```

## 매개변수 {#parameters}

| 매개변수   | 설명    |
|-------------|----------------|
| `<bitmap>`  | Bitmap 값 |
| `<value>`   | 제거할 값 |

## 반환 값 {#return-value}

지정한 값을 제거한 Bitmap을 반환합니다.

제거할 값이 존재하지 않으면 원래 Bitmap을 반환합니다.  
제거할 값이 `NULL`이면 `NULL`을 반환합니다.

## 예제 {#examples}

Bitmap에서 값을 제거하는 예제:

```sql
select bitmap_to_string(bitmap_remove(bitmap_from_string('1, 2, 3'), 3)) res;
```

결과는 다음과 같습니다:

```text
+------+
| res  |
+------+
| 1,2  |
+------+
```

Bitmap에서 `NULL` 값을 제거하는 예제:

```sql
select bitmap_to_string(bitmap_remove(bitmap_from_string('1, 2, 3'), null)) res;
```

결과는 다음과 같습니다:

```text
+------+
| res  |
+------+
| NULL |
+------+
```
