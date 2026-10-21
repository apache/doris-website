---
{
    "title": "Iceberg에서 Doris로의 데이터 타입 매핑",
    "sidebar_label": "Doris 데이터 타입 매핑",
    "description": "데이터 타입, 정밀도, 중첩 타입, 지원되지 않는 타입을 다루는 Doris 4.2 Iceberg 타입 매핑 참고 자료."
}
---

다음 표는 Doris 4.2(`branch-4.2`)에서 Iceberg 외부 테이블 스키마를 읽을 때 적용하는 타입 매핑을 설명합니다. 쓰기는 대상 스키마와 지원되는 쓰기 작업의 영향도 받으므로, 읽기 매핑을 쓰기에 자동으로 역적용할 수는 없습니다.

| Iceberg 타입                           | Doris 타입           | 설명                                 |
| -------------------------------------- | -------------------- | --------------------------------------- |
| boolean                                | boolean              |                                         |
| integer                                | int                  |                                         |
| long                                   | bigint               |                                         |
| float                                  | float                |                                         |
| double                                 | double               |                                         |
| decimal(P, S)                          | decimal(P, S)        |                                         |
| date                                   | date                 |                                         |
| timestamp (시간대 정보 없음) | datetime(6)          | 정밀도가 6인 datetime으로 매핑됩니다.     |
| timestamptz (시간대 정보 있음) | TIMESTAMPTZ(6) | 4.1.5부터 이 타입은 항상 `TIMESTAMPTZ(6)`으로 매핑됩니다. 정밀도가 6으로 제한되므로 그보다 높은 정밀도는 손실됩니다. |
| fixed(N) | VARBINARY(N) | 4.1.5부터 고정 바이너리 길이가 유지됩니다. |
| string                                 | string               |                                         |
| binary | VARBINARY | 4.1.5부터 이 타입은 항상 `VARBINARY`로 매핑됩니다. |
| uuid | UUID | 4.2에서는 네이티브 `UUID`로 매핑됩니다. Doris 4.1.5에서는 `VARBINARY(16)`으로 매핑됩니다. |
| struct                                 | struct (버전 2.1.3부터 지원) |                                         |
| map                                    | map (버전 2.1.3부터 지원)    |                                         |
| list                                   | array                |                                         |
| timestamp_ns (시간대 정보 없음) | TIMESTAMP_NS | 세션 시간대 변환 없이 나노초 정밀도를 유지합니다. |
| timestamptz_ns (시간대 정보 있음) | UNSUPPORTED | 시간대 정보를 포함하는 나노초 정밀도 타임스탬프는 지원되지 않습니다. |
| time | UNSUPPORTED | Doris의 `TIME`으로 매핑되지 않습니다. |
| variant | VARIANT | Iceberg V3 Variant입니다. 관련 BE가 Variant 읽기를 지원해야 합니다. |
| other                                  | UNSUPPORTED          |                                         |

## 사용 시 참고 사항 {#usage-notes}

복합 타입의 하위 필드에도 동일한 매핑이 재귀적으로 적용됩니다. `TIMESTAMPTZ`는 세션의 `time_zone`에 따라 표시되는 특정 시점을 나타냅니다.

`timestamp`와 `timestamptz`는 마이크로초 정밀도를 사용합니다. 시간대 정보가 없는 `timestamp_ns`만 `TIMESTAMP_NS`로 매핑됩니다. 표현 가능한 범위는 `1677-09-21 00:12:43.145224192`부터 `2262-04-11 23:47:16.854775807`까지이며, 이 범위를 벗어나는 값은 표현할 수 없습니다.

`DESCRIBE table_name`에서 Extra 열의 `WITH_TIMEZONE`은 원본 필드에 시간대 정보가 있음을 나타냅니다.

Iceberg UUID 필드에 Parquet 형식으로 쓸 때 중첩 필드를 포함한 모든 UUID 필드의 UUID 논리적 어노테이션이 유지됩니다.

구현 참고 자료: [IcebergUtils.java](https://github.com/apache/doris/blob/bcaaa5f293674f1adba0dfa52c8f8f57fb5e9549/fe/fe-core/src/main/java/org/apache/doris/datasource/iceberg/IcebergUtils.java) (`branch-4.2`).
