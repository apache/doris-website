---
{
    "title": "TRIM_ARRAY 함수",
    "language": "ko",
    "description": "TRIM_ARRAY는 배열 끝에서 지정된 수의 요소를 제거하며, 나머지 요소의 순서와 타입을 유지합니다."
}
---

## trim_array {#trim_array}

<version since="dev">

</version>

## 설명 {#description}

`<size>`개의 요소를 `<arr>`의 끝에서 제거하며, 나머지 요소의 순서를 유지합니다.

## 구문 {#syntax}

```sql
TRIM_ARRAY(<arr>, <size>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<arr>` | 입력 `ARRAY<T>`입니다. `T`는 숫자, 불리언, 문자열, 날짜/시간, IP 또는 복합 타입일 수 있습니다. |
| `<size>` | 끝에서 제거할 요소 수를 지정하는 음이 아닌 `BIGINT`입니다. `<arr>`의 요소 수를 초과할 수 없습니다. |

## 반환 값 {#return-value}

`ARRAY<T>`를 반환합니다. 이 배열은 처음 `cardinality(<arr>) - <size>`개의 요소를 `<arr>`에서 가져와 구성한 것입니다.

- `<size>`가 `0`이면 입력 배열을 그대로 반환합니다.
- `<size>`가 배열의 요소 수와 같으면 빈 배열을 반환합니다.
- 인수 중 하나라도 `NULL`이면 `NULL`을 반환합니다.
- `NULL` 요소는 배열 안에 그대로 유지됩니다.
- `<size>`가 음수이거나 배열의 요소 수를 초과하면 오류를 반환합니다.

## 예제 {#examples}

끝에서 요소 두 개를 제거합니다:

```sql
SELECT trim_array([1, 2, 3, 4], 2);
```

```text
[1, 2]
```

제거할 요소 수가 영이면 배열이 그대로 유지됩니다:

```sql
SELECT trim_array(['a', 'b', 'c'], 0);
```

```text
["a", "b", "c"]
```

모든 요소를 제거합니다:

```sql
SELECT trim_array([1, 2, 3], 3);
```

```text
[]
```

`NULL` 요소와 중첩 배열을 지원합니다:

```sql
SELECT trim_array([[1, NULL], [2, 3], [4, 5]], 1);
```

```text
[[1, null], [2, 3]]
```

인수가 `NULL`이면 `NULL`을 반환합니다:

```sql
SELECT trim_array(CAST(NULL AS ARRAY<INT>), 0);
```

```text
NULL
```

제거할 요소 수가 배열의 요소 수보다 크면 오류가 발생합니다:

```sql
SELECT trim_array([1, 2, 3], 4);
```

```text
ERROR 1105 (HY000): size must not exceed array cardinality 3: 4
```

### 키워드 {#keywords}

ARRAY, TRIM, TRIM_ARRAY
