---
{
    "title": "BITMAP_XOR_COUNT",
    "language": "ko",
    "description": "두 개 이상의 Bitmap 집합의 대칭 차집합(XOR 연산)을 계산하고 결과 집합의 원소 수를 반환합니다."
}
---

## 설명 {#description}

두 개 이상의 Bitmap 집합의 대칭 차집합(XOR 연산)을 계산하고 결과 집합의 원소 수를 반환합니다.

## 구문 {#syntax}

```sql
BITMAP_XOR_COUNT(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## 매개변수 {#parameters}

| 매개변수    | 설명              |
|-------------|-------------------|
| `<bitmap1>` | 첫 번째 Bitmap    |
| `<bitmap2>` | 두 번째 Bitmap    |
| ...         | ...               |
| `<bitmapN>` | N번째 Bitmap      |

## 반환값 {#return-value}

여러 Bitmap의 XOR 연산 결과인 Bitmap의 원소 수를 반환합니다.  
입력 Bitmap 매개변수 중 하나라도 `NULL`이면 0을 반환합니다.

## 예제 {#examples}

두 Bitmap의 대칭 차집합에 포함된 원소 수를 계산하는 예제입니다:

```sql
select bitmap_xor_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5')) res;
```

결과는 다음과 같습니다:

```text
+------+
| res  |
+------+
|    4 |
+------+
```

동일한 두 Bitmap의 대칭 차집합에 포함된 원소 수를 계산하는 예제입니다:

```sql
select bitmap_xor_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2,3')) res;
```

결과는 다음과 같습니다:

```text
+------+
| res  |
+------+
|    0 |
+------+
```

서로 다른 두 Bitmap의 대칭 차집합에 포함된 원소 수를 계산하는 예제입니다:

```sql
select bitmap_xor_count(bitmap_from_string('1,2,3'), bitmap_from_string('4,5,6')) res;
```

결과는 다음과 같습니다:

```text
+------+
| res  |
+------+
|    6 |
+------+
```

세 Bitmap의 대칭 차집합에 포함된 원소 수를 계산하는 예제입니다:

```sql
select bitmap_xor_count(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5')) res;
```

결과는 다음과 같습니다:

```text
+------+
| res  |
+------+
|    3 |
+------+
```

빈 Bitmap을 포함한 여러 Bitmap의 대칭 차집합에 포함된 원소 수를 계산하는 예제입니다:

```sql
select bitmap_xor_count(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), bitmap_empty());
```

결과는 다음과 같습니다:

```text
+------+
| res  |
+------+
|    3 |
+------+
```

여러 Bitmap과 `NULL` 값을 입력하여 대칭 차집합에 포함된 원소 수를 계산하는 예제입니다:

```sql
select bitmap_xor_count(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), NULL) res;
```

결과는 다음과 같습니다:

```text
+------+
| res  |
+------+
|    0 |
+------+
```
