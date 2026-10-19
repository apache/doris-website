---
{
    "title": "BITMAP_AND_NOT,BITMAP_ANDNOT",
    "language": "ko",
    "description": "두 BITMAP에 NOT 연산을 수행하고 결과를 반환합니다. 첫 번째 입력 매개변수를 base BITMAP, 두 번째 입력 매개변수를 exclude BITMAP이라고 합니다."
}
---

## 설명 {#description}

두 BITMAP에 NOT 연산을 수행하고 결과를 반환합니다. 첫 번째 입력 매개변수를 `base BITMAP`, 두 번째 입력 매개변수를 `exclude BITMAP`이라고 합니다.

## 별칭 {#alias}

- BITMAP_ANDNOT

## 구문 {#syntax}

```sql
BITMAP_AND_NOT(<bitmap1>, <bitmap2>)
```

## 매개변수 {#parameters}

| 매개변수   | 설명                      |
|-------------|----------------------------------|
| `<bitmap1>` | NOT 연산을 적용할 `Base BITMAP`      |
| `<bitmap2>` | NOT 연산을 적용할 `Exclusion BITMAP` |

## 반환 값 {#return-value}

BITMAP을 반환합니다.
- 매개변수의 값이 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

```sql
select bitmap_count(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5'))) cnt;
```

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5'))) as cnt;
```

```text
+------+
| cnt  |
+------+
| 1,2  |
+------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_empty())) cnt;
```

```text
+-------+
| cnt   |
+-------+
| 1,2,3 |
+-------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),NULL)) as res;
```

```text
+------+
| res  |
+------+
| NULL |
+------+
```
