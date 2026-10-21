---
{
    "title": "PARSE_DATA_SIZE",
    "language": "ko",
    "description": "PARSE_DATA_SIZE 함수는 저장 단위가 포함된 문자열(예: \"1.5GB\")을 파싱하여 바이트 단위의 숫자 값으로 변환합니다."
}
---

## 설명 {#description}

PARSE_DATA_SIZE 함수는 저장 단위가 포함된 문자열(예: "1.5GB")을 파싱하여 바이트 단위의 숫자 값으로 변환합니다.

## 구문 {#syntax}

```sql
PARSE_DATA_SIZE(<str>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -------- | ----------------------------------------- |
| `<str>` | 단위가 포함된 데이터 크기 문자열(예: "100MB", "2.5GB"). 타입: VARCHAR |

## 반환값 {#return-value}

바이트 단위로 변환된 숫자 값을 LARGEINT 타입으로 반환합니다.

특수한 경우:
- 지원 단위(대소문자를 구분하며, 다음 표기를 정확히 사용해야 함): B, kB, MB, GB, TB, PB, EB, ZB, YB
- 단위는 1024를 기준으로 합니다(예: 1kB = 1024B)
- 소수를 지원합니다(예: "2.5MB")
- 매개변수 형식이 유효하지 않으면 오류를 반환합니다
- 매개변수가 NULL이면 NULL을 반환합니다. Doris 4.1 계열에서는 4.1.5부터 nullable 컬럼의 NULL 행을 문자열 파싱 전에 건너뜁니다

**지원 단위 테이블:**

| 단위 | 이름 | 바이트 |
|------|------|-------|
| B    | 바이트      | 1          |
| kB   | 킬로바이트  | 1024       |
| MB   | 메가바이트  | 1024²      |
| GB   | 기가바이트  | 1024³      |
| TB   | 테라바이트  | 1024⁴      |
| PB   | 페타바이트  | 1024⁵      |
| EB   | 엑사바이트   | 1024⁶      |

<a id="examples"></a>

## 예제 {#example}

1. 기본 사용법: 바이트 파싱
```sql
SELECT parse_data_size('1024B');
```
```text
+--------------------------+
| parse_data_size('1024B') |
+--------------------------+
| 1024                     |
+--------------------------+
```

2. 킬로바이트 파싱
```sql
SELECT parse_data_size('1kB');
```
```text
+------------------------+
| parse_data_size('1kB') |
+------------------------+
| 1024                   |
+------------------------+
```

3. 소수가 포함된 메가바이트 파싱
```sql
SELECT parse_data_size('2.5MB');
```
```text
+--------------------------+
| parse_data_size('2.5MB') |
+--------------------------+
| 2621440                  |
+--------------------------+
```

4. 기가바이트 파싱
```sql
SELECT parse_data_size('1GB');
```
```text
+------------------------+
| parse_data_size('1GB') |
+------------------------+
| 1073741824             |
+------------------------+
```

5. 테라바이트 파싱
```sql
SELECT parse_data_size('1TB');
```
```text
+------------------------+
| parse_data_size('1TB') |
+------------------------+
| 1099511627776          |
+------------------------+
```

6. 지원하지 않는 단위로 인한 오류
```sql
SELECT parse_data_size('1iB');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Invalid Input argument "1iB" of function parse_data_size
```

7. NULL 입력
```sql
SELECT parse_data_size(NULL);
```
```text
+-----------------------+
| parse_data_size(NULL) |
+-----------------------+
| NULL                  |
+-----------------------+
```

### 키워드 {#keywords}

    PARSE_DATA_SIZE
