---
{
    "title": "COSINE_DISTANCE",
    "language": "ko",
    "description": "두 벡터 사이의 코사인 거리를 계산합니다(벡터 값은 좌표입니다)"
}
---

## 설명 {#description}

두 벡터 사이의 코사인 거리를 계산합니다(벡터 값은 좌표입니다).

## 구문 {#syntax}

```sql
COSINE_DISTANCE(<array1>, <array2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|---|--|
| `<array1>` | 첫 번째 벡터입니다(벡터 값은 좌표입니다). 입력 배열의 하위 타입으로는 TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE을 지원합니다. 요소 수는 array2와 같아야 합니다. |
| `<array2>` | 두 번째 벡터입니다(벡터 값은 좌표입니다). 입력 배열의 하위 타입으로는 TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE을 지원하며, 요소 수는 array1과 같아야 합니다. |

## 반환 값 {#return-value}

두 벡터 사이의 코사인 거리를 반환합니다(벡터 값은 좌표입니다). 반환 타입은 `FLOAT`입니다.

입력 배열 중 하나라도 `NULL`이거나 `NULL` 요소를 포함하면 함수에서 오류가 발생합니다.

## 예제 {#example}

```sql
SELECT COSINE_DISTANCE([1, 2], [2, 3]),COSINE_DISTANCE([3, 6], [4, 7]);
```

```text
+---------------------------------+---------------------------------+
| cosine_distance([1, 2], [2, 3]) | cosine_distance([3, 6], [4, 7]) |
+---------------------------------+---------------------------------+
|                     0.007722139 |                     0.001539648 |
+---------------------------------+---------------------------------+
```

입력 배열이 `NULL`이면 함수에서 오류가 발생합니다.

```sql
SELECT COSINE_DISTANCE(NULL, [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function cosine_distance cannot be null
```

입력 배열에 `NULL` 요소가 포함되어 있으면 함수에서 오류가 발생합니다.

```sql
SELECT COSINE_DISTANCE([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function cosine_distance cannot have null
```
