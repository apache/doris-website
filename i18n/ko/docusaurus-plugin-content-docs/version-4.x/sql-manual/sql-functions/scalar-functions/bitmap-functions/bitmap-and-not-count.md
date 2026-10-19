---
{
    "title": "BITMAP_AND_NOT_COUNT,BITMAP_ANDNOT_COUNT",
    "language": "ko",
    "description": "두 BITMAP에 NOT 연산을 수행하고 결과 집합의 요소 수를 반환합니다."
}
---

## 설명 {#description}

두 BITMAP에 NOT 연산을 수행하고 결과 집합의 요소 수를 반환합니다. 첫 번째 입력 매개변수는 `base BITMAP`, 두 번째 입력 매개변수는 `exclusion BITMAP`이라고 합니다.

## 별칭 {#alias}

- BITMAP_ANDNOT_COUNT

## 구문 {#syntax}

```sql
BITMAP_AND_NOT_COUNT(<bitmap1>, <bitmap2>)
```

## 매개변수 {#parameters}

| 매개변수   | 설명                      |
|-------------|----------------------------------|
| `<bitmap1>` | NOT 연산을 적용할 `Base BITMAP`      |
| `<bitmap2>` | NOT 연산을 적용할 `Exclusion BITMAP` |

## 반환 값 {#return-value}

정수를 반환합니다.
- 매개변수 값이 NULL이면 0을 반환합니다.

## 예제 {#examples}

```sql
select bitmap_and_not_count(NULL, bitmap_from_string('1,2,3')) banc1, bitmap_and_not_count(bitmap_from_string('1,2,3'), NULL) banc2;
```

```text
+-------+-------+
| banc1 | banc2 |
+-------+-------+
|     0 |     0 |
+-------+-------+
```

```sql
select bitmap_and_not_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5')) banc;
```

```text
+------+
| banc |
+------+
|    2 |
+------+
```
