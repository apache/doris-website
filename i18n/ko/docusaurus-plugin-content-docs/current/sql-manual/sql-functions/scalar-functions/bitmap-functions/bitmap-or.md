---
{
    "title": "BITMAP_OR",
    "language": "ko",
    "description": "둘 이상의 Bitmap의 합집합을 계산하고 새로운 Bitmap을 반환합니다."
}
---

## 설명 {#description}

둘 이상의 Bitmap의 합집합을 계산하고 새로운 Bitmap을 반환합니다.

## 구문 {#syntax}

```sql
BITMAP_OR(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## 매개변수 {#parameters}

| 매개변수   | 설명    |
|-------------|----------------|
| `<bitmap1>` | 첫 번째 Bitmap   |
| `<bitmap2>` | 두 번째 Bitmap  |
| ...         | ...            |
| `<bitmapN>` | N번째 Bitmap   |

## 반환값 {#return-value}

여러 Bitmap의 합집합을 나타내는 Bitmap입니다.

## 예제 {#examples}

동일한 두 Bitmap의 합집합을 계산하려면 다음과 같이 실행합니다:

```sql
select bitmap_count(bitmap_or(to_bitmap(1), to_bitmap(1))) cnt;
```

결과는 다음과 같습니다:

```text
+------+
| cnt  |
+------+
|    1 |
+------+
```

동일한 두 Bitmap의 합집합을 문자열로 변환하려면 다음과 같이 실행합니다:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(1))) as res;
```

결과는 다음과 같습니다:

```text
+------+
| res  |
+------+
| 1    |
+------+
```

서로 다른 두 Bitmap의 합집합을 계산하려면 다음과 같이 실행합니다:

```sql
select bitmap_count(bitmap_or(to_bitmap(1), to_bitmap(2))) cnt;
```

결과는 다음과 같습니다:

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```

서로 다른 두 Bitmap의 합집합을 문자열로 변환하려면 다음과 같이 실행합니다:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2))) res;
```

결과는 다음과 같습니다:

```text
+------+
| res  |
+------+
| 1,2  |
+------+
```

`NULL` 값을 포함하는 여러 Bitmap의 합집합을 계산하려면 다음과 같이 실행합니다:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2), to_bitmap(10), to_bitmap(0), NULL)) res;
```

결과는 다음과 같습니다:

```text
+----------+
| res      |
+----------+
| 0,1,2,10 |
+----------+
```

빈 Bitmap을 포함하는 여러 Bitmap의 합집합을 계산하려면 다음과 같이 실행합니다:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2), to_bitmap(10), to_bitmap(0), bitmap_empty())) res;
```

결과는 다음과 같습니다:

```text
+----------+
| res      |
+----------+
| 0,1,2,10 |
+----------+
```

문자열과 개별 값으로 생성한 Bitmap의 합집합을 계산하려면 다음과 같이 실행합니다:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(10), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'))) res;
```

결과는 다음과 같습니다:

```text
+--------------+
| res          |
+--------------+
| 1,2,3,4,5,10 |
+--------------+
```
