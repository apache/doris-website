---
{
    "title": "BITMAP_OR_COUNT",
    "language": "ko",
    "description": "둘 이상의 입력 Bitmap의 합집합을 계산하고 합집합의 원소 수를 반환합니다."
}
---

## 설명 {#description}

둘 이상의 입력 Bitmap의 합집합을 계산하고 합집합의 원소 수를 반환합니다.

## 구문 {#syntax}

```sql
BITMAP_OR_COUNT(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## 매개변수 {#parameters}

| 매개변수   | 설명    |
|-------------|----------------|
| `<bitmap1>` | 첫 번째 Bitmap   |
| `<bitmap2>` | 두 번째 Bitmap  |
| ...         | ...            |
| `<bitmapN>` | N번째 Bitmap   |

## 반환 값 {#return-value}

여러 Bitmap의 합집합에 포함된 원소 수입니다.

## 예시 {#examples}

비어 있지 않은 Bitmap과 빈 Bitmap의 합집합에 포함된 원소 수를 계산하려면 다음과 같이 실행합니다:

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_empty()) res;
```

결과는 다음과 같습니다:

```text
+------+
| res  |
+------+
|    3 |
+------+
```

동일한 두 Bitmap의 합집합에 포함된 원소 수를 계산하려면 다음과 같이 실행합니다:

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2,3')) res;
```

결과는 다음과 같습니다:

```text
+------+
| res  |
+------+
|    3 |
+------+
```

서로 다른 두 Bitmap의 합집합에 포함된 원소 수를 계산하려면 다음과 같이 실행합니다:

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5')) res;
```

결과는 다음과 같습니다:

```text
+------+
| res  |
+------+
|    5 |
+------+
```

빈 Bitmap을 포함한 여러 Bitmap의 합집합에 포함된 원소 수를 계산하려면 다음과 같이 실행합니다:

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'), to_bitmap(100), bitmap_empty()) res;
```

결과는 다음과 같습니다:

```text
+------+
| res  |
+------+
|    6 |
+------+
```

`NULL` 값을 포함한 여러 Bitmap의 합집합에 포함된 원소 수를 계산하려면 다음과 같이 실행합니다:

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'), to_bitmap(100), NULL) res;
```

결과는 다음과 같습니다:

```text
+------+
| res  |
+------+
|    6 |
+------+
```
