---
{
    "title": "BITMAP_COUNT",
    "language": "ko",
    "description": "입력 BITMAP의 요소 개수를 셉니다"
}
---

## 설명 {#description}

입력 BITMAP의 요소 개수를 셉니다

## 구문 {#syntax}

```sql
BITMAP_COUNT(<bitmap>)
```

## 매개변수 {#parameters}

| 매개변수  | 설명 |
|------------|-------------|
| `<bitmap>` | BITMAP 값    |

## 반환값 {#return-value}

정수를 반환합니다

## 예제 {#examples}

```sql
select bitmap_count(to_bitmap(1)) cnt;
```

```text
+------+
| cnt  |
+------+
|    1 |
+------+
```

```sql
select bitmap_count(bitmap_empty()) cnt;
```

```text
+------+
| cnt  |
+------+
|    0 |
+------+
```
