---
{
    "title": "BITMAP_CONTAINS",
    "language": "ko",
    "description": "입력 값이 BITMAP에 포함되어 있는지 확인하고 불리언 값을 반환합니다."
}
---

## 설명 {#description}

입력 값이 BITMAP에 포함되어 있는지 확인하고 불리언 값을 반환합니다.

## 구문 {#syntax}

```sql
BITMAP_CONTAINS(<bitmap>, <bigint>)
```

## 매개변수 {#parameters}

| 매개변수   | 설명                                    |
|------------|-----------------------------------------|
| `<bitmap>` | BITMAP 컬렉션                           |
| `<bitint>` | 존재 여부를 확인할 정수                  |

## 반환값 {#return-value}

불리언 값을 반환합니다.
- 매개변수가 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
select bitmap_contains(to_bitmap(1),2) cnt1, bitmap_contains(to_bitmap(1),1) cnt2;
```

```text
+------+------+
| cnt1 | cnt2 |
+------+------+
|    0 |    1 |
+------+------+
```

```sql
select bitmap_contains(NULL,2) cnt1, bitmap_contains(to_bitmap(1),NULL) cnt2;
```

```text
+------+------+
| cnt1 | cnt2 |
+------+------+
| NULL | NULL |
+------+------+
```
