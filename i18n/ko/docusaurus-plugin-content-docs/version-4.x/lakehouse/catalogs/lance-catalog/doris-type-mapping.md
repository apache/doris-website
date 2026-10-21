---
{
    "title": "Lance와 Doris 간 데이터 유형 매핑",
    "sidebar_label": "Doris 데이터 유형 매핑",
    "description": "데이터 유형, 정밀도, 중첩 유형, 지원되지 않는 유형을 다루는 Doris 4.2의 Lance 유형 매핑 참고 자료."
}
---

다음 표는 Doris 4.2(`branch-4.2`)의 Lance Catalog와 Lance 파일 TVF에서 데이터를 읽을 때 적용되는 유형 매핑을 설명합니다. Doris는 Lance에 데이터 쓰기를 지원하지 않습니다.

| Lance / Arrow 유형 | Doris 유형 | 설명 |
|---|---|---|
| `null` (NULL을 허용하는 필드) | `NULL` | 모든 값이 SQL NULL이며, NULL을 허용하지 않는 Null 필드는 지원되지 않음 |
| `duration(s/ms/us/ns)` | `BIGINT` | 선언된 단위의 부호 있는 값을 그대로 유지하며, 초 단위로 변환하지 않음 |
| `bool` | `BOOLEAN` | |
| `int8` | `TINYINT` | |
| `uint8` | `SMALLINT` | 정보 손실 없이 확장된 부호 없는 정수 |
| `int16` | `SMALLINT` | |
| `uint16` | `INT` | 정보 손실 없이 확장된 부호 없는 정수 |
| `int32` | `INT` | |
| `uint32` | `BIGINT` | 정보 손실 없이 확장된 부호 없는 정수 |
| `int64` | `BIGINT` | |
| `uint64` | `LARGEINT` | 정보 손실 없이 확장된 부호 없는 정수 |
| `float16` | `FLOAT` | 32비트 부동 소수점 값으로 확장됨 |
| `float32` | `FLOAT` | |
| `float64` | `DOUBLE` | |
| `decimal128(P,S)` | `DECIMAL(P,S)` | 최대 정밀도는 38 |
| `decimal256(P,S)` | `DECIMAL(P,S)` | 최대 정밀도는 76 |
| `utf8`, `large_utf8` | `STRING` | |
| `arrow.json` Extension | `JSON` | 저장 유형이 `utf8` 또는 `large_utf8`이어야 함 |
| `lance.json` Extension | `JSON` | 저장 유형이 `large_binary`여야 하며, 논리적 JSON 유형으로 읽음 |
| `lance.bfloat16` Extension | `FLOAT` | 저장 유형이 `fixed_size_binary(2)`여야 하며, 정밀도 손실 없이 Float32로 확장됨 |
| `binary`, `large_binary` | `VARBINARY(2147483647)` | |
| `fixed_size_binary(N)` | `VARBINARY(N)` | 고정 바이트 너비를 유지함 |
| `date32(day)`, `date64(ms)` | `DATE` | `date64` 값은 온전한 역일을 나타내야 함 |
| `time32(s)` | `TIME(0)` | |
| `time32(ms)` | `TIME(3)` | |
| `time64(us)`, `time64(ns)` | `TIME(6)` | 나노초 정밀도는 마이크로초 단위로 잘림 |
| 시간대 정보가 없는 `timestamp(s)` | `DATETIME(0)` | Session Time Zone에 따라 변환되지 않음 |
| 시간대 정보가 없는 `timestamp(ms)` | `DATETIME(3)` | Session Time Zone에 따라 변환되지 않음 |
| 시간대 정보가 없는 `timestamp(us)`, `timestamp(ns)` | `DATETIME(6)` | 나노초 정밀도는 마이크로초 단위로 잘림 |
| 시간대 정보가 있는 `timestamp` | `TIMESTAMPTZ(P)` | 시점을 유지하고 Doris Session Time Zone에 맞춰 표시함 |
| `struct` | `STRUCT` | 하위 필드의 유형이 재귀적으로 매핑됨 |
| `list`, `large_list`, `fixed_size_list` | `ARRAY` | 요소 유형이 재귀적으로 매핑됨 |
| `map` | `MAP` | 키와 값의 유형이 재귀적으로 매핑됨 |

## 사용 참고 사항 {#usage-notes}

타임스탬프 정밀도 `P`는 초 단위일 때 0, 밀리초 단위일 때 3, 마이크로초 또는 나노초 단위일 때 6입니다. Iceberg/Paimon의 나노초 매핑과 달리, Lance의 나노초 타임스탬프는 여전히 `DATETIME(6)` 또는 `TIMESTAMPTZ(6)`으로 매핑되며 마이크로초 단위로 잘립니다. Decimal에는 `1 <= P <= 76` 및 `0 <= S <= P` 조건이 적용되며, 음수 스케일은 지원되지 않습니다.

Doris는 `ARROW:extension:name` 메타데이터를 통해 이러한 Extension을 인식하고 저장 유형을 검증합니다. JSON Extension은 Doris의 `JSON`(내부적으로는 `JSONB`)으로 매핑됩니다. JSON 텍스트가 들어 있는 일반 `utf8`/`large_utf8` 컬럼은 여전히 `STRING`으로 매핑되며, 내용에 따라 유형이 자동으로 바뀌지 않습니다. JSON 읽기 지원이 임의의 JSON 경로 표현식에 대한 푸시다운까지 의미하지는 않습니다. 지원 범위는 [조건자 푸시다운](../lance-catalog.mdx#predicate-pushdown)을 참조하세요.

JSON, Duration, Null, BFloat16을 읽으려면 FE와 쿼리를 처리하는 BE 모두에서 해당 유형을 지원해야 합니다. 이전 빌드에서는 이러한 유형이 지원되지 않는다고 보고할 수 있으므로, 업그레이드할 때 스키마 검색과 실제 데이터 읽기를 확인하세요.

현재 다음 유형은 지원되지 않습니다.

- NULL을 허용하지 않는 Arrow `null` 필드.
- 지원 유형으로 나열되지 않은 Arrow/Lance Extension 유형(예: Lance Blob v2). 저장 유형이 호환되지 않는 알려진 Extension도 지원되지 않습니다.
- 하위 유형을 재귀적으로 매핑할 수 없는 복합 유형.
- Dictionary 마커가 유지된 Arrow Dictionary 유형.

지원되지 않는 최상위 컬럼의 경우, Catalog 테이블에 대한 `DESC`와 Lance 파일 TVF에 대한 `DESC FUNCTION`은 모두 해당 컬럼을 유지하고 `unknown type: UNSUPPORTED_TYPE`으로 표시합니다. 복합 유형의 하위 유형 중 하나라도 매핑할 수 없으면 최상위 복합 컬럼 전체가 지원되지 않는 것으로 표시됩니다. 이 경우에도 쿼리에서 지원되는 컬럼만 선택할 수 있습니다. SQL에서 지원되지 않는 컬럼을 선택하면 Doris는 분석 단계에서 오류를 보고합니다. 예를 들면 다음과 같습니다.

```sql
SELECT * EXCEPT(blob_col)
FROM lance_catalog.default.all_types;
```

:::note
일부 Lance Java SDK 버전에서는 Schema를 읽을 때 Dictionary 마커가 사라져 Dictionary 컬럼을 물리적 인덱스 유형으로 노출할 수 있습니다. 이 동작이 Doris가 논리적 Dictionary 값을 지원한다는 뜻은 아니므로, 이에 의존해서는 안 됩니다.
:::

구현 참고 자료: [LanceTypeConverter.java](https://github.com/apache/doris/blob/bcaaa5f293674f1adba0dfa52c8f8f57fb5e9549/fe/fe-core/src/main/java/org/apache/doris/datasource/lance/metadata/LanceTypeConverter.java) (`branch-4.2`).
