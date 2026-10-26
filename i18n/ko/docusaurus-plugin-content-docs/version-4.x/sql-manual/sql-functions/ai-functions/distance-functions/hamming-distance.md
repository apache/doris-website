---
{
    "title": "HAMMING_DISTANCE",
    "language": "ko",
    "description": "두 바이트 벡터의 해밍 거리를 계산합니다. 비트 단위 XOR 연산 후 값이 다른 비트의 개수입니다. 배열이나 요소가 NULL이면 오류가 발생합니다."
}
---

## 설명 {#description}

두 바이트 벡터의 해밍 거리를 계산합니다. 비트 단위 XOR 연산 후 값이 다른 비트의 개수입니다. 배열이나 요소가 NULL이면 오류가 발생합니다.

이 함수가 포함된 Doris 4.2 빌드에서 사용할 수 있습니다. 항상 정확한 스칼라 연산을 수행하며 ANN 검색으로 자동 대체되지 않습니다.

## 구문 {#syntax}

```sql
HAMMING_DISTANCE(<array1>, <array2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|---|---|
| `<array1>` | TINYINT, SMALLINT, INT 또는 BIGINT로 구성된 정수 배열이며 ARRAY<BIGINT>로 변환됩니다. 모든 요소는 `[0,255]` 범위에 있어야 합니다. 부동 소수점형, DECIMAL형, LARGEINT형 배열은 허용되지 않습니다. |
| `<array2>` | TINYINT, SMALLINT, INT 또는 BIGINT로 구성된 정수 배열이며 ARRAY<BIGINT>로 변환됩니다. 모든 요소는 `[0,255]` 범위에 있어야 합니다. 부동 소수점형, DECIMAL형, LARGEINT형 배열은 허용되지 않습니다. 두 배열의 길이는 같아야 합니다. |

## 반환 값 {#return-value}

FLOAT를 반환하며, 값이 작을수록 두 벡터가 더 가깝습니다. 두 배열이 모두 비어 있으면 0을 반환합니다. N바이트 벡터의 최대 거리는 8N입니다. 배열의 길이가 다르거나 배열 또는 요소가 NULL이면 NULL을 반환하는 대신 오류가 발생합니다. 범위를 벗어난 요소가 있어도 오류가 발생합니다.

## 예제 {#example}

```sql
SELECT HAMMING_DISTANCE([0,255,170], [255,0,85]) AS value;
```

```text
value
24
```

```sql
SELECT HAMMING_DISTANCE([], []) AS value;
```

```text
value
0
```

```sql
SELECT HAMMING_DISTANCE(NULL, [0,1]);
```

```text
ERROR: First argument for function hamming_distance cannot be null
```

```sql
SELECT HAMMING_DISTANCE([0,NULL], [0,1]);
```

```text
ERROR: First argument for function hamming_distance cannot have null
```

```sql
SELECT HAMMING_DISTANCE([256], [0]);
```

```text
ERROR: Hamming vector elements must be integers in [0, 255]
```
