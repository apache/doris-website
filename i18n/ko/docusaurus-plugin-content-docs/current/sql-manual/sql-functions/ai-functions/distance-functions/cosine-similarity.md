---
{
    "title": "COSINE_SIMILARITY",
    "language": "ko",
    "description": "두 벡터 간의 코사인 유사도를 계산합니다."
}
---

## 설명 {#description}

두 벡터 간의 코사인 유사도를 계산합니다.
유사도는 내적과 벡터 노름을 사용해 계산하며, 결과는 `[-1, 1]` 범위에 속합니다.

## 구문 {#syntax}

```sql
COSINE_SIMILARITY(<array1>, <array2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|---|--|
| `<array1>` | 첫 번째 벡터입니다. 입력 타입은 `ARRAY<FLOAT>`여야 합니다. |
| `<array2>` | 두 번째 벡터입니다. 입력 타입은 `ARRAY<FLOAT>`여야 하며, 요소 수는 `<array1>`과 같아야 합니다. |

## 반환값 {#return-value}

두 벡터 간의 코사인 유사도를 FLOAT 타입으로 반환합니다.
입력 배열이 `NULL`이거나 배열의 요소 중 하나라도 `NULL`이면 오류를 반환합니다.
두 배열의 요소 수가 다르면 오류를 반환합니다.
배열이 비어 있거나 두 벡터 중 하나라도 영벡터이면 `0.0`을 반환합니다.

## 예제 {#example}

```sql
-- Two identical vectors have similarity 1
SELECT COSINE_SIMILARITY([1, 2, 3], [1, 2, 3]);
```

```text
+-----------------------------------------+
| COSINE_SIMILARITY([1, 2, 3], [1, 2, 3]) |
+-----------------------------------------+
|                                       1 |
+-----------------------------------------+
```

`[1, 2, 3]`과 `[1, 2, 3]`은 같은 방향을 가리키므로 유사도는 `1`입니다.

```sql
-- Orthogonal vectors have similarity 0
SELECT COSINE_SIMILARITY([1, 0], [0, 1]);
```

```text
+-----------------------------------+
| COSINE_SIMILARITY([1, 0], [0, 1]) |
+-----------------------------------+
|                                 0 |
+-----------------------------------+
```

두 벡터가 서로 직교하므로 내적은 `0`이고 유사도는 `0`입니다.

```sql
-- A zero vector returns 0
SELECT COSINE_SIMILARITY([0, 0, 0], [1, 2, 3]);
```

```text
+-----------------------------------------+
| COSINE_SIMILARITY([0, 0, 0], [1, 2, 3]) |
+-----------------------------------------+
|                                       0 |
+-----------------------------------------+
```

영벡터는 방향이 정의되지 않으므로 결과는 `0`입니다.

```sql
-- An empty array returns 0
SELECT COSINE_SIMILARITY([], []);
```

```text
+---------------------------+
| COSINE_SIMILARITY([], []) |
+---------------------------+
|                         0 |
+---------------------------+
```

```sql
-- NULL inside the input array raises an error
SELECT COSINE_SIMILARITY([1, NULL, 3], [1, 2, 3]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function cosine_similarity cannot have null
```
