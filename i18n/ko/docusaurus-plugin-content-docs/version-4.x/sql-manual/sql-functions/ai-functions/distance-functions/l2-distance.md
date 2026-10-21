---
{
    "title": "L2_DISTANCE",
    "language": "ko",
    "description": "유클리드 공간에서 두 점(벡터 값을 좌표로 사용) 사이의 거리를 계산합니다"
}
---

## 설명 {#description}

유클리드 공간에서 두 점(벡터 값을 좌표로 사용) 사이의 거리를 계산합니다.

## 구문 {#syntax}

```sql
L2_DISTANCE(<array1>, <array2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- |--|
| `<array1>` | 첫 번째 벡터(벡터 값을 좌표로 사용)입니다. 입력 배열의 하위 타입으로 TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE을 지원합니다. 요소 수는 array2와 같아야 합니다. |
| `<array2>` | 두 번째 벡터(벡터 값을 좌표로 사용)입니다. 입력 배열의 하위 타입으로 TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE을 지원합니다. 요소 수는 array1과 같아야 합니다. |

## 반환 값 {#return-value}

유클리드 공간에서 두 점(벡터 값을 좌표로 사용) 사이의 거리를 반환합니다. 반환 타입은 `FLOAT`입니다.

입력 배열 중 하나라도 `NULL`이거나 `NULL` 요소를 포함하면 함수가 오류를 반환합니다.

## 예제 {#example}

```sql
SELECT L2_DISTANCE([4, 5], [6, 8]),L2_DISTANCE([3, 6], [4, 5]);
```

```text
+-----------------------------+-----------------------------+
| l2_distance([4, 5], [6, 8]) | l2_distance([3, 6], [4, 5]) |
+-----------------------------+-----------------------------+
|                    3.605551 |                    1.414214 |
+-----------------------------+-----------------------------+
```

입력 배열이 `NULL`이면 함수가 오류를 반환합니다.

```sql
SELECT L2_DISTANCE(NULL, [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function l2_distance cannot be null
```

입력 배열에 `NULL` 요소가 포함되어 있으면 함수가 오류를 반환합니다.

```sql
SELECT L2_DISTANCE([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function l2_distance cannot have null
```
