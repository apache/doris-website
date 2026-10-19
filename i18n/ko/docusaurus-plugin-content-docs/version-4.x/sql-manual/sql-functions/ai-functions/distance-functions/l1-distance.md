---
{
    "title": "L1_DISTANCE",
    "language": "ko",
    "description": "L1 공간에서 두 점 사이의 거리를 계산합니다(벡터 값은 좌표입니다)"
}
---

## 설명 {#description}

L1 공간에서 두 점 사이의 거리를 계산합니다(벡터 값은 좌표입니다).

## 구문 {#syntax}

```sql
L1_DISTANCE(<array1>, <array2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- |--|
| `<array1>` | 첫 번째 벡터입니다(벡터 값은 좌표입니다). 입력 배열의 하위 타입은 TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE입니다. 요소 개수는 array2와 같아야 합니다. |
| `<array2>` | 두 번째 벡터입니다(벡터 값은 좌표입니다). 입력 배열의 하위 타입으로 TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE을 지원합니다. 요소 개수는 array1과 같아야 합니다. |

## 반환 값 {#return-value}

L1 공간에서 두 점 사이의 거리를 반환합니다(벡터 값은 좌표입니다). 반환 타입은 `FLOAT`입니다.

입력 배열 중 하나라도 `NULL`이거나 `NULL` 요소를 포함하면 함수는 오류를 반환합니다.

## 예제 {#example}

```sql
SELECT L1_DISTANCE([4, 5], [6, 8]),L1_DISTANCE([3, 6], [4, 5]);
```

```text
+-----------------------------+-----------------------------+
| l1_distance([4, 5], [6, 8]) | l1_distance([3, 6], [4, 5]) |
+-----------------------------+-----------------------------+
|                           5 |                           2 |
+-----------------------------+-----------------------------+
```

입력 배열이 `NULL`이면 함수는 오류를 반환합니다:

```sql
SELECT L1_DISTANCE(NULL, [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function l1_distance cannot be null
```

입력 배열에 `NULL` 요소가 포함되어 있으면 함수는 오류를 반환합니다:

```sql
SELECT L1_DISTANCE([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function l1_distance cannot have null
```
