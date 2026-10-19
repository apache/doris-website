---
{
    "title": "INNER_PRODUCT",
    "language": "ko",
    "description": "두 밀집 벡터 또는 희소 벡터의 스칼라곱을 계산합니다"
}
---

## 설명 {#description}

배열로 표현된 두 밀집 벡터 또는 맵으로 표현된 두 희소 벡터의 스칼라곱을 계산합니다. 희소 벡터에서는 각 맵의 키가 차원을 식별하고, 해당 값이 좌표가 됩니다. 두 맵에 공통으로 존재하는 차원만 결과에 반영됩니다.

## 구문 {#syntax}

```sql
INNER_PRODUCT(<array1>, <array2>)
INNER_PRODUCT(<map1>, <map2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|---|---|
| `<array1>` | 첫 번째 밀집 벡터입니다. 지원되는 요소 타입은 TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE입니다. 요소 수는 `<array2>`의 요소 수와 같아야 합니다. |
| `<array2>` | 두 번째 밀집 벡터입니다. 지원되는 요소 타입은 TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE입니다. 요소 수는 `<array1>`의 요소 수와 같아야 합니다. |
| `<map1>` | 첫 번째 희소 벡터입니다. 타입은 `MAP<K, FLOAT>`여야 하며, 여기서 `K`는 정수 타입(TINYINT, SMALLINT, INT, BIGINT 또는 LARGEINT) 또는 문자열 타입(CHAR, VARCHAR 또는 STRING)입니다. 키 타입은 `<map2>`의 키 타입과 같은 타입 계열에 속해야 합니다. |
| `<map2>` | 두 번째 희소 벡터입니다. `<map1>`과 동일한 타입 제약 조건이 적용됩니다. 두 맵의 항목 수는 서로 달라도 됩니다. |

## 반환값 {#return-value}

스칼라곱을 `FLOAT`로 반환합니다.

배열 입력의 경우, 대응하는 요소를 곱한 뒤 합산합니다. 어느 한 배열이 `NULL`이거나, `NULL` 요소를 포함하거나, 두 배열의 길이가 다르면 함수는 오류를 반환합니다.

맵 입력의 경우, 키가 같은 값을 곱한 뒤 합산합니다. 한쪽 맵에만 존재하는 키는 결과에 영향을 주지 않으며, 이는 누락된 좌표를 영으로 처리하는 것과 같습니다. `NULL` 키는 다른 `NULL` 키와 일치하는 것으로 처리됩니다. 같은 키가 여러 번 나타나면 마지막 값을 사용합니다. 어느 한 맵이 `NULL`이거나, 어떤 키에 대해 최종적으로 유지되는 값이 `NULL`이면 함수는 오류를 반환합니다.

## 예제 {#example}

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

다음 예제는 두 희소 벡터의 내적을 계산합니다. 두 맵에 공통으로 존재하는 키는 `a`와 `b`뿐이므로 결과는 `2 * 5 + 3 * 4 = 22`입니다:

```sql
SELECT INNER_PRODUCT(
    MAP('a', CAST(2 AS FLOAT), 'b', CAST(3 AS FLOAT)),
    MAP('b', CAST(4 AS FLOAT), 'c', CAST(100 AS FLOAT), 'a', CAST(5 AS FLOAT))
) AS result;
```

```text
+--------+
| result |
+--------+
|     22 |
+--------+
```

입력 배열이 `NULL`이면 함수는 오류를 반환합니다:

```sql
SELECT INNER_PRODUCT(NULL, [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product cannot be null
```

입력 배열에 `NULL` 요소가 포함되어 있으면 함수는 오류를 반환합니다:

```sql
SELECT INNER_PRODUCT([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product cannot have null
```

맵의 값이 `NULL`이면 함수는 오류를 반환합니다:

```sql
SELECT INNER_PRODUCT(
    MAP(1, CAST(NULL AS FLOAT)),
    MAP(1, CAST(2 AS FLOAT))
);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product cannot have null
```
