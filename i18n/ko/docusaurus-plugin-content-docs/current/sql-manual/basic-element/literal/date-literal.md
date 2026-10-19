---
{
    "title": "날짜 타입 리터럴",
    "language": "ko",
    "description": "표준 SQL과 마찬가지로, Doris에서는 날짜 리터럴을 지정할 때 타입 키워드와 문자열을 사용해야 합니다."
}
---

## 설명 {#description}

표준 SQL과 마찬가지로, Doris에서는 날짜 리터럴을 지정할 때 타입 키워드와 문자열을 사용해야 합니다. 키워드와 문자열 사이의 공백은 생략할 수 있습니다. 예를 들면 다음과 같습니다.

```sql
DATE '2008-08-08'
TIMESTAMP '2008-08-08 20:08:08'
```

## 날짜 형식 {#date-formats}

### DATE 리터럴 {#date-literal}

- `-`로 구분된 `'YYYY-MM-DD'` 또는 `'YY-MM-DD'` 형식의 문자열을 사용합니다. Doris는 MySQL의 비표준 구분자 형식도 지원하지만, 사용을 권장하지 않습니다.
- 구분자가 없는 문자열은 `'YYYYMMDD'` 또는 `'YYMMDD'` 형식을 사용합니다. 단, 문자열이 유효한 날짜를 나타내야 합니다.

### DATETIME, TIMESTAMP_NS 및 TIMESTAMPTZ 리터럴 {#datetime-timestamp_ns-and-timestamptz-literal}

- `-`로 구분된 `'YYYY-MM-DD hh:mm:ss'` 또는 `'YY-MM-DD hh:mm:ss'` 형식의 문자열을 사용합니다. Doris는 MySQL의 비표준 구분자 형식도 지원하지만, 사용을 권장하지 않습니다. 날짜와 시간 사이의 구분자로는 공백(` `) 또는 `T`를 사용할 수 있습니다. **MySQL 8.4 및 이전 버전과 달리, Doris는 시간과 날짜 사이에 다른 구분자를 지원하지 않습니다.**
- 구분자가 없는 문자열은 `'YYYYMMDDhhmmss'` 또는 `'YYMMDDhhmmss'` 형식을 사용합니다. 단, 문자열이 유효한 날짜를 나타내야 합니다.

날짜 및 시간 리터럴에는 소수 초 부분을 포함할 수 있습니다. `DATETIME`과 `TIMESTAMPTZ`는 최대 여섯 자리(마이크로초)를 유지하고, `TIMESTAMP_NS`는 아홉 자리(나노초)를 유지합니다. 이를 초과하는 자릿수는 대상 타입의 정밀도에 맞춰 반올림됩니다. 소수 부분은 점(`.`)으로 나머지 시간 부분과 구분해야 하며, 다른 소수 초 구분자는 인식되지 않습니다.

### 두 자리 연도 {#two-digit-years}

두 자리 연도 값이 포함된 날짜는 세기를 알 수 없어 모호합니다. Doris는 다음 규칙에 따라 두 자리 연도 값을 해석합니다.

- 70-99 범위의 연도 값은 1970-1999년으로 해석합니다.
- 00-69 범위의 연도 값은 2000-2069년으로 해석합니다.

### 시간대 {#time-zones}

DATE, DATETIME, TIMESTAMP_NS 및 TIMESTAMPTZ 리터럴에는 시간대 접미사를 사용할 수 있습니다. 시간대를 사용할 때는 앞의 날짜 또는 시간 부분에 공백 없이 바로 붙여야 합니다. 예를 들면 다음과 같습니다.

```sql
TIMESTAMP '2008-08-08 20:08:08+08:00'
```

Doris가 지원하는 시간대 형식은 다음과 같습니다.

- 시간대 오프셋: 형식은 `{+ | -}hh:mm`입니다. 예를 들어 UTC+8은 `+08:00`으로 표기합니다.
- 시간대 이름: 예를 들어 상하이 시간대는 `Asia/Shanghai`입니다.

### 잘못된 값 처리 {#handling-of-invalid-values}

유효한 날짜 리터럴로 파싱할 수 없는 값이 있으면 Doris는 즉시 오류를 반환합니다. 예를 들면 다음과 같습니다.

```sql
SELECT date '071332'
```

다음 오류가 발생합니다.

```sql
date/datetime literal [071332] is invalid
```
