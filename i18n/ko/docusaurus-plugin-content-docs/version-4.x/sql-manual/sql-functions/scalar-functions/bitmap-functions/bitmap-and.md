---
{
    "title": "BITMAP_AND",
    "language": "ko",
    "description": "두 개 이상의 입력 BITMAP의 교집합을 계산하고 새 BITMAP을 반환합니다."
}
---

## 설명 {#description}

두 개 이상의 입력 BITMAP의 교집합을 계산하고 새 BITMAP을 반환합니다.

## 구문 {#syntax}

```sql
BITMAP_AND(<bitmap>, <bitmap>,[, <bitmap>...])
```

## 매개변수 {#parameters}

| 매개변수  | 설명                                                    |
|------------|----------------------------------------------------------------|
| `<bitmap>` | 교집합을 구할 원본 BITMAP 중 하나 |

## 반환값 {#return-value}

BITMAP을 반환합니다.
- 매개변수에 NULL 값이 있으면 NULL을 반환합니다.

## 예제 {#examples}

```sql
select bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'))) as res;
```

```text
+------+
| res  |
+------+
| 1,2  |
+------+
```

```sql
select bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'),bitmap_empty())) as res;
```

```text
+------+
| res  |
+------+
|      |
+------+
```

```sql
select bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'),NULL)) as res;
```

```text
+------+
| res  |
+------+
| NULL |
+------+
```
