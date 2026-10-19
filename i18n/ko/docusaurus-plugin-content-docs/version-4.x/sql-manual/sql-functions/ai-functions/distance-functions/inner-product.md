---
{
    "title": "INNER_PRODUCT",
    "language": "ko",
    "description": "크기가 같은 두 벡터의 내적을 계산합니다"
}
---

## 설명 {#description}

크기가 같은 두 벡터의 내적을 계산합니다.

## 구문 {#syntax}

```sql
INNER_PRODUCT(<array1>, <array2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- |--|
| `<array1>` | 첫 번째 벡터입니다. 입력 배열의 원소 타입으로 TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE을 지원하며, 원소 수는 array2와 같아야 합니다. |
| `<array2>` | 두 번째 벡터입니다. 입력 배열의 원소 타입으로 TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE을 지원하며, 원소 수는 array1과 같아야 합니다. |

## 반환 값 {#return-value}

크기가 같은 두 벡터의 내적을 반환합니다. 반환 타입은 `FLOAT`입니다.

입력 배열 중 하나라도 `NULL`이거나 `NULL` 원소를 포함하면 함수가 오류를 반환합니다.

## 예제 {#examples}

```sql
SELECT INNER_PRODUCT([1, 2], [2, 3]),INNER_PRODUCT([3, 6], [4, 7]);
```

```text
+-------------------------------+-------------------------------+
| inner_product([1, 2], [2, 3]) | inner_product([3, 6], [4, 7]) |
+-------------------------------+-------------------------------+
|                             8 |                            54 |
+-------------------------------+-------------------------------+
```

입력 배열이 `NULL`이면 함수가 오류를 반환합니다:

```sql
SELECT INNER_PRODUCT(NULL, [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product cannot be null
```

입력 배열에 `NULL` 원소가 포함되어 있으면 함수가 오류를 반환합니다:

```sql
SELECT INNER_PRODUCT([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product cannot have null
```
