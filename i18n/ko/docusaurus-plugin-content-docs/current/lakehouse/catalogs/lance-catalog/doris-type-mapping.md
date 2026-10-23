---
{
    "title": "Lance에서 Doris로의 데이터 타입 매핑",
    "sidebar_label": "Doris 데이터 타입 매핑",
    "description": "데이터 타입, 정밀도, 중첩 타입, 지원되지 않는 타입을 다루는 Doris 4.2 Lance 타입 매핑 참고 자료입니다."
}
---

다음 표는 Doris 4.2(`branch-4.2`)에서 Lance Catalog와 Lance 파일 TVF를 읽을 때 적용되는 타입 매핑을 설명합니다. Doris는 Lance에 쓰기를 지원하지 않습니다.

| Lance / Arrow 타입 | Doris 타입 | 설명 |
|---|---|---|
| `null` (NULL 허용 필드) | `NULL` | 모든 값이 SQL NULL입니다. NULL을 허용하지 않는 Null 필드는 지원되지 않습니다. |
| `duration(s/ms/us/ns)` | `BIGINT` | 선언된 단위의 부호 있는 값을 그대로 유지하며, 초 단위로 변환하지 않습니다. |
| `bool` | `BOOLEAN` | |
| `int8` | `TINYINT` | |
| `uint8` | `SMALLINT` | 정보 손실 없이 확장된 부호 없는 정수 |
| `int16` | `SMALLINT` | |
| `uint16` | `INT` | 정보 손실 없이 확장된 부호 없는 정수 |
| `int32` | `INT` | |
| `uint32` | `BIGINT` | 정보 손실 없이 확장된 부호 없는 정수 |
| `int64` | `BIGINT` | |
| `uint64` | `LARGEINT` | 정보 손실 없이 확장된 부호 없는 정수 |
| `float16` | `FLOAT` | 32비트 부동 소수점 값으로 확장됩니다. |
| `float32` | `FLOAT` | |
| `float64` | `DOUBLE` | |
| `decimal128(P,S)` | `DECIMAL(P,S)` | 최대 정밀도는 38입니다. |
| `decimal256(P,S)` | `DECIMAL(P,S)` | 최대 정밀도는 76입니다. |
| `utf8`, `large_utf8` | `STRING` | |
| `arrow.json` Extension | `JSON` | 저장 타입이 `utf8` 또는 `large_utf8`이어야 합니다. |
| `lance.json` Extension | `JSON` | 저장 타입이 `large_binary`여야 하며, 논리적 JSON 타입으로 읽습니다. |
| `lance.bfloat16` Extension | `FLOAT` | 저장 타입이 `fixed_size_binary(2)`여야 하며, 정밀도 손실 없이 Float32로 확장됩니다. |
| `binary`, `large_binary` | `VARBINARY(2147483647)` | |
| `fixed_size_binary(N)` | `VARBINARY(N)` | 고정 바이트 길이를 유지합니다. |
| `date32(day)`, `date64(ms)` | `DATE` | `date64` 값은 온전한 역일을 나타내야 합니다. |
| `time32(s)` | `TIME(0)` | |
| `time32(ms)` | `TIME(3)` | |
| `time64(us)`, `time64(ns)` | `TIME(6)` | 나노초 정밀도는 마이크로초 단위로 잘립니다. |
| 시간대 정보가 없는 `timestamp(s)` | `DATETIME(0)` | Session Time Zone에 따라 변환되지 않습니다. |
| 시간대 정보가 없는 `timestamp(ms)` | `DATETIME(3)` | Session Time Zone에 따라 변환되지 않습니다. |
| 시간대 정보가 없는 `timestamp(us)`, `timestamp(ns)` | `DATETIME(6)` | 나노초 정밀도는 마이크로초 단위로 잘립니다. |
| 시간대 정보가 있는 `timestamp` | `TIMESTAMPTZ(P)` | 시점을 유지하고 Doris Session Time Zone에 맞춰 표시합니다. |
| `struct` | `STRUCT` | 자식 필드를 재귀적으로 매핑합니다. |
| `list`, `large_list`, `fixed_size_list` | `ARRAY` | 요소 타입을 재귀적으로 매핑합니다. |
| `map` | `MAP` | 키와 값의 타입을 재귀적으로 매핑합니다. |

## 사용 시 참고 사항 {#usage-notes}

타임스탬프 정밀도 `P`는 초 단위일 때 0, 밀리초 단위일 때 3, 마이크로초 또는 나노초 단위일 때 6입니다. Iceberg/Paimon의 나노초 매핑과 달리 Lance의 나노초 타임스탬프는 여전히 `DATETIME(6)` 또는 `TIMESTAMPTZ(6)`에 매핑되며, 마이크로초 단위로 잘립니다. Decimal 타입은 `1 <= P <= 76` 및 `0 <= S <= P`를 충족해야 하며, 음수 스케일은 지원되지 않습니다.

Doris는 `ARROW:extension:name` 메타데이터를 통해 이러한 Extension을 인식하고 저장 타입을 검증합니다. JSON Extension은 Doris의 `JSON`(내부적으로 `JSONB`)에 매핑됩니다. JSON 텍스트가 들어 있는 일반 `utf8`/`large_utf8` 컬럼도 `STRING`에 매핑되며, 내용에 따라 타입이 자동으로 바뀌지는 않습니다. JSON 읽기를 지원한다고 해서 임의의 JSON 경로 표현식이 푸시다운되는 것은 아닙니다. 지원되는 조건자 형태는 별도로 확인해야 합니다.

JSON, Duration, Null, BFloat16을 읽으려면 FE와 해당 쿼리를 처리하는 BE 모두에서 각 타입을 지원해야 합니다. 이전 빌드에서는 이러한 타입이 지원되지 않는다고 보고될 수 있으므로, 업그레이드할 때 스키마 탐지와 실제 읽기 동작을 확인하세요.

다음 타입은 현재 지원되지 않습니다.

- NULL을 허용하지 않는 Arrow `null` 필드.
- 지원 목록에 없는 Arrow/Lance Extension 타입(예: Lance Blob v2). 알려진 Extension이라도 저장 타입이 호환되지 않으면 지원되지 않습니다.
- 자식 타입을 재귀적으로 매핑할 수 없는 복합 타입.
- Dictionary 마커를 유지하는 Arrow Dictionary 타입.

지원되지 않는 최상위 컬럼의 경우, Catalog 테이블에 대한 `DESC`와 Lance 파일 TVF에 대한 `DESC FUNCTION` 모두 해당 컬럼을 유지하고 `unknown type: UNSUPPORTED_TYPE`을 표시합니다. 복합 타입의 자식 중 하나라도 매핑할 수 없으면 최상위 복합 컬럼 전체가 지원되지 않는 것으로 표시됩니다. 쿼리에서는 지원되는 컬럼만 선택해 조회할 수 있습니다. SQL에서 지원되지 않는 컬럼을 선택하면 Doris는 분석 단계에서 오류를 보고합니다. 예를 들면 다음과 같습니다.

```sql
SELECT * EXCEPT(blob_col)
FROM lance_catalog.default.all_types;
```

:::note
일부 Lance Java SDK 버전은 Schema를 읽을 때 Dictionary 마커를 잃고 Dictionary 컬럼을 물리적 인덱스 타입으로 노출할 수 있습니다. 이 동작이 Doris가 논리적 Dictionary 값을 지원한다는 뜻은 아니며, 이 동작에 의존해서는 안 됩니다.
:::

구현 참고 자료: [LanceTypeConverter.java](https://github.com/apache/doris/blob/bcaaa5f293674f1adba0dfa52c8f8f57fb5e9549/fe/fe-core/src/main/java/org/apache/doris/datasource/lance/metadata/LanceTypeConverter.java) (`branch-4.2`).
