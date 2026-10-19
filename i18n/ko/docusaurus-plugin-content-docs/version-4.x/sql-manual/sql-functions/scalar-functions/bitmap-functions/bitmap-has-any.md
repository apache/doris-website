---
{
    "title": "BITMAP_HAS_ANY",
    "language": "ko",
    "description": "두 Bitmap에 공통 요소가 있는지 확인합니다."
}
---

## 설명 {#description}

두 Bitmap에 공통 요소가 있는지 확인합니다.

## 구문 {#syntax}

```sql
BITMAP_HAS_ANY(<bitmap1>, <bitmap2>)
```

## 매개변수 {#parameters}

| 매개변수   | 설명          |
|-------------|----------------------|
| `<bitmap1>` | 첫 번째 Bitmap     |
| `<bitmap2>` | 두 번째 Bitmap    |

## 반환 값 {#return-value}

두 Bitmap에 공통 요소가 있으면 true를 반환합니다.
두 Bitmap에 공통 요소가 없으면 false를 반환합니다.
- 매개변수 값이 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
select bitmap_has_any(to_bitmap(1), to_bitmap(2)) res;
```

```text
+------+
| res  |
+------+
|    0 |
+------+
```

```sql
select bitmap_has_any(bitmap_from_string('1,2,3'), to_bitmap(1)) res;
```

```text
+------+
| res  |
+------+
|    1 |
+------+
```

```sql
select bitmap_has_any(bitmap_from_string('1,2,3'), NULL) as res;
```

```text
+------+
| res  |
+------+
| NULL |
+------+
```
