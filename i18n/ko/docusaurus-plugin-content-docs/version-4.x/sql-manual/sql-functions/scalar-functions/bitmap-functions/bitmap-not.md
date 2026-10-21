---
{
    "title": "BITMAP_NOT",
    "language": "ko",
    "description": "첫 번째 Bitmap과 두 번째 Bitmap의 차집합을 계산하고 결과를 새로운 Bitmap으로 반환합니다."
}
---

## 설명 {#description}

첫 번째 Bitmap과 두 번째 Bitmap의 차집합을 계산하고 결과를 새로운 Bitmap으로 반환합니다.

## 구문 {#syntax}

```sql
BITMAP_NOT(<bitmap1>, <bitmap2>)
```

## 매개변수 {#parameters}

| 매개변수   | 설명          |
|-------------|----------------------|
| `<bitmap1>` | 첫 번째 Bitmap     |
| `<bitmap2>` | 두 번째 Bitmap    |

## 반환 값 {#return-value}

`<bitmap1>`에는 있지만 `<bitmap2>`에는 없는 원소를 나타내는 Bitmap입니다.
- 매개변수 값이 NULL이면 NULL을 반환합니다

## 예제 {#examples}

두 Bitmap의 차집합을 계산하려면 다음과 같이 실행합니다:

```sql
select bitmap_to_string(bitmap_not(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) as res;
```

`<bitmap1>`의 모든 원소가 `<bitmap2>`에도 있으므로 결과는 빈 Bitmap입니다:

```text
+------+
| res  |
+------+
|      |
+------+
```

`<bitmap1>`에 `<bitmap2>`에는 없는 원소가 포함된 경우, 다음과 같이 차집합을 계산합니다:

```sql
select bitmap_to_string(bitmap_not(bitmap_from_string('2,3,5'), bitmap_from_string('1,2,3,4'))) as res;
```

결과는 원소 `5`를 포함하는 Bitmap입니다:

```text
+------+
| res  |
+------+
| 5    |
+------+
```

```sql
select bitmap_to_string(bitmap_not(bitmap_from_string('2,3,5'), NULL)) as res;
```

```text
+------+
| res  |
+------+
| NULL |
+------+
```
