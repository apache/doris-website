---
{
    "title": "BITMAP_AND_COUNT",
    "language": "ko",
    "description": "두 개 이상의 입력 BITMAP의 교집합을 계산하고 교집합에 포함된 원소 수를 반환합니다."
}
---

## 설명 {#description}

두 개 이상의 입력 BITMAP의 교집합을 계산하고 교집합에 포함된 원소 수를 반환합니다.

## 구문 {#syntax}

```sql
BITMAP_AND_COUNT(<bitmap>, <bitmap>,[, <bitmap>...])
```

## 매개변수 {#parameters}

| 매개변수  | 설명                                                    |
|------------|----------------------------------------------------------------|
| `<bitmap>` | 교집합을 구할 원본 BITMAP 중 하나 |

## 반환 값 {#return-value}

정수를 반환합니다.
- 매개변수 값이 NULL이면 0을 반환합니다.

## 예제 {#examples}

```sql
select bitmap_and_count(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5')) as res;
```

```text
+------+
| res  |
+------+
|    1 |
+------+
```

```sql
select bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5')) as res;
```

```text
+------+
| res  |
+------+
|    2 |
+------+
```

```sql
select bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'),bitmap_empty()) as res;
```

```text
+------+
| res  |
+------+
|    0 |
+------+
```

```sql
select bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'), NULL) as res;
```

```text
+------+
| res  |
+------+
|    0 |
+------+
```
