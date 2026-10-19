---
{
    "title": "ARRAY_RANGE",
    "language": "ko",
    "description": "숫자 또는 날짜 및 시간 값으로 이루어진 등차수열 배열을 생성합니다."
}
---

<a id="function"></a>

## 설명 {#description}

숫자 또는 날짜 및 시간 값으로 이루어진 등차수열 배열을 생성합니다. 결과에는 시작 값이 포함되고 종료 값은 제외됩니다. 인수 중 하나라도 NULL이면 NULL을 반환합니다.

Doris 4.1 시리즈에서는 4.1.5부터 마지막 값과 종료 값 사이의 간격이 지정된 간격보다 짧더라도, 날짜 및 시간 시퀀스에서 종료 값보다 작은 모든 유효한 값을 유지합니다. 이전 버전에서는 이러한 끝부분의 값이 누락될 수 있었습니다.

## 구문 {#syntax}

```sql
ARRAY_RANGE(<end>)
ARRAY_RANGE(<start>, <end> [, <step>])
ARRAY_RANGE(<start_dt>, <end_dt> [, INTERVAL <step> <unit>])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<start>` | 선택 사항인 음이 아닌 INT 시작 값입니다. 기본값은 0입니다. |
| `<end>` | 음이 아닌 INT 종료 값으로, 결과에서 제외됩니다. |
| `<step>` | 선택 사항인 양의 정수 간격입니다. 기본값은 1입니다. |
| `<start_dt>`, `<end_dt>` | DATETIME 시작 값과 종료 값입니다. 종료 값은 제외됩니다. INTERVAL을 지정하지 않으면 간격은 1 DAY입니다. |
| `<unit>` | 날짜 및 시간 간격의 단위입니다. YEAR, QUARTER, MONTH, WEEK, DAY, HOUR, MINUTE 또는 SECOND를 사용할 수 있습니다. |

## 반환 값 {#return-value}

ARRAY를 반환합니다. 숫자 시퀀스는 INT 요소를, 날짜 및 시간 시퀀스는 DATETIME 요소를 포함합니다.

<a id="usage-notes"></a>

- 인수 중 하나라도 NULL이거나 유효하지 않으면 NULL을 반환합니다. 예를 들어 숫자 시작 값이나 종료 값이 음수이거나 간격이 양수가 아닌 경우가 해당합니다.
- 시작 값이 종료 값보다 크거나 같으면 빈 배열 `[]`을 반환합니다.
- 각 후속 값은 이전 값을 기준으로 계산됩니다. 월 단위 연산에서는 날짜가 대상 월의 마지막 날로 조정될 수 있습니다.
- 시퀀스가 배열 크기 제한을 초과하면 오류가 발생합니다. 다음 값이 날짜 타입의 범위를 벗어나면 마지막 유효한 값까지만 생성하고 중단합니다.
- `SEQUENCE`는 `ARRAY_RANGE`의 별칭입니다.

<a id="examples"></a>

## 예제 {#example}

숫자 시퀀스는 종료 값을 포함하지 않습니다:

```sql
SELECT ARRAY_RANGE(5), ARRAY_RANGE(2, 6, 2), ARRAY_RANGE(3, 2);
```

```text
[0, 1, 2, 3, 4]    [2, 4]    []
```

날짜 및 시간 시퀀스의 기본 간격은 하루입니다. 종료 값까지 하루 미만이 남더라도 마지막 값은 유지됩니다:

```sql
SELECT ARRAY_RANGE(
    CAST('2024-01-01 00:00:00.000000' AS DATETIME(6)),
    CAST('2024-01-02 12:00:00.000000' AS DATETIME(6)));
```

```text
["2024-01-01 00:00:00.000000", "2024-01-02 00:00:00.000000"]
```

월 단위 간격은 이전에 생성된 날짜를 기준으로 적용됩니다:

```sql
SELECT ARRAY_RANGE(
    CAST('2020-01-31 00:00:00' AS DATETIME(6)),
    CAST('2020-03-30 00:00:00' AS DATETIME(6)), INTERVAL 1 MONTH);
```

```text
["2020-01-31 00:00:00.000000", "2020-02-29 00:00:00.000000", "2020-03-29 00:00:00.000000"]
```

`SEQUENCE`에도 동일한 규칙이 적용됩니다:

```sql
SELECT SEQUENCE(
    CAST('2024-01-01 00:00:00.000000' AS DATETIME(6)),
    CAST('2024-01-01 00:00:01.500000' AS DATETIME(6)), INTERVAL 1 SECOND);
```

```text
["2024-01-01 00:00:00.000000", "2024-01-01 00:00:01.000000"]
```

NULL 또는 유효하지 않은 인수:

```sql
SELECT ARRAY_RANGE(NULL), ARRAY_RANGE(-1, 3), ARRAY_RANGE(1, 3, 0);
```

```text
NULL    NULL    NULL
```
