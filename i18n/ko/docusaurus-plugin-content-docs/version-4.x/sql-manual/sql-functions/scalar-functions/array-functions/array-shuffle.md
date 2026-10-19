---
{
    "title": "ARRAY_SHUFFLE",
    "language": "ko",
    "description": "배열 요소의 순서를 무작위로 섞습니다."
}
---

<a id="function"></a>

## 설명 {#description}

배열의 요소와 요소 수를 유지하면서 요소의 순서를 무작위로 섞습니다. 입력 배열이나 시드가 NULL이면 NULL을 반환합니다. `SHUFFLE`은 이 함수의 별칭입니다.

:::caution 동작 변경 (4.1.5)

Doris 4.1 계열의 4.1.5부터는 `seed`가 상수여야 합니다. 음수를 포함한 모든 BIGINT 값을 허용하며, 64비트를 모두 사용합니다. 상수 배열도 행마다 개별적으로 섞으므로, 동일한 시드라도 이전 버전과 다른 결과가 나올 수 있습니다. 이전 4.1 버전에서는 각 배치의 첫 번째 행에 있는 시드만 사용했으며, 음수 시드와 4294967295보다 큰 시드는 허용하지 않았습니다. 또한 상수 배열의 경우 모든 행에서 동일한 순서의 결과를 반환했습니다.

:::

## 구문 {#syntax}

```sql
ARRAY_SHUFFLE(<arr> [, <seed>])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<arr>` | 순서를 섞을 ARRAY입니다. |
| `<seed>` | 선택 사항인 상수 BIGINT 난수 시드입니다. 상수 표현식을 지원합니다. 생략하면 각 배치에서 새로운 난수 시드를 사용합니다. |

## 반환 값 {#return-value}

입력과 동일한 타입의 배열을 반환하며, 요소의 순서는 무작위로 바뀝니다. 요소 수와 타입은 유지됩니다. 배열이나 시드가 NULL이면 NULL을 반환하고, 입력 배열이 비어 있으면 빈 배열을 반환합니다.

<a id="usage-notes"></a>

행은 배치 단위로 처리됩니다. 시드를 지정하면 각 배치는 해당 시드에서 시작하는 난수 시퀀스를 생성하고, 배치 내의 행은 이 시퀀스를 차례로 사용합니다. 따라서 행의 요소가 섞이는 순서는 배치 경계에 따라 달라질 수 있습니다. 시드를 지정해도 동일한 배열이 항상 동일한 순서로 섞이는 것은 아닙니다. 상수 배열도 행마다 개별적으로 섞습니다.

<a id="examples"></a>

## 예제 {#example}

순서를 섞은 배열을 정렬하면 요소가 유지되는지 확인할 수 있습니다. 음수 시드와 상수 표현식 모두 유효합니다.

```sql
SELECT ARRAY_SORT(ARRAY_SHUFFLE([1, 2, 3, 4], -1)),
       ARRAY_SORT(ARRAY_SHUFFLE([1, 2, 3, 4], 1 + 1));
```

```text
[1, 2, 3, 4]    [1, 2, 3, 4]
```

NULL 및 빈 배열:

```sql
SELECT ARRAY_SHUFFLE(CAST(NULL AS ARRAY<INT>), 1),
       ARRAY_SHUFFLE([1, 2, 3], NULL), ARRAY_SHUFFLE([], 1);
```

```text
NULL    NULL    []
```

열을 시드로 사용하면 다음 내용이 포함된 오류가 발생합니다.

```sql
SELECT ARRAY_SHUFFLE([1, 2, 3], number) FROM numbers("number" = "2");
```

```text
The seed of array_shuffle must be a constant
```
