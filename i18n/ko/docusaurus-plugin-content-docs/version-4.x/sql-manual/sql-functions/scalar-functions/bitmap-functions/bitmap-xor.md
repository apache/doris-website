---
{
    "title": "BITMAP_XOR",
    "language": "ko",
    "description": "두 개 이상의 입력 Bitmap의 대칭 차집합(XOR 연산)을 계산하고 새로운 Bitmap을 반환합니다."
}
---

## 설명 {#description}

두 개 이상의 입력 Bitmap의 대칭 차집합(XOR 연산)을 계산하고 새로운 Bitmap을 반환합니다.

## 구문 {#syntax}

```sql
BITMAP_XOR(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## 매개변수 {#parameters}

| 매개변수   | 설명       |
|-------------|-------------------|
| `<bitmap1>` | 첫 번째 Bitmap  |
| `<bitmap2>` | 두 번째 Bitmap |
| ...         | ...               |
| `<bitmapN>` | N번째 Bitmap   |

## 반환 값 {#return-value}

여러 Bitmap의 대칭 차집합을 나타내는 Bitmap입니다.
- 매개변수에 NULL 값이 있으면 NULL을 반환합니다.

## 예제 {#examples}

두 Bitmap의 대칭 차집합을 계산하는 예제:

```sql
select bitmap_count(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) cnt;
```

결과는 다음과 같습니다:

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```

두 Bitmap의 대칭 차집합을 문자열로 변환하는 예제:

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) res;
```

결과는 다음과 같습니다:

```text
+------+
| res  |
+------+
| 1,4  |
+------+
```

세 Bitmap의 대칭 차집합을 계산하는 예제:

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'))) res;
```

결과는 다음과 같습니다:

```text
+-------+
| res   |
+-------+
| 1,3,5 |
+-------+
```

빈 Bitmap을 포함한 여러 Bitmap의 대칭 차집합을 계산하는 예제:

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), bitmap_empty())) res;
```

결과는 다음과 같습니다:

```text
+-------+
| res   |
+-------+
| 1,3,5 |
+-------+
```

여러 Bitmap과 `NULL` 값을 함께 입력하여 대칭 차집합을 계산하는 예제:

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), NULL)) res;
```

결과는 다음과 같습니다:

```text
+------+
| res  |
+------+
| NULL |
+------+
```
