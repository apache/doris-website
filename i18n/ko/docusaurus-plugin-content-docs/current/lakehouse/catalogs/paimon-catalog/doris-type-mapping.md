---
{
    "title": "Paimon에서 Doris로의 데이터 유형 매핑",
    "sidebar_label": "Doris 데이터 유형 매핑",
    "description": "데이터 유형, 정밀도, 중첩 유형 및 지원되지 않는 유형을 다루는 Doris 4.2의 Paimon 유형 매핑 참고 자료입니다."
}
---

다음 표는 Doris 4.2 (`branch-4.2`)가 읽기 작업에서 Paimon 외부 테이블의 스키마를 매핑하는 방식을 설명합니다. 쓰기 작업은 대상 스키마와 지원되는 쓰기 작업에도 영향을 받으므로, 읽기 매핑을 쓰기 매핑의 자동 역변환으로 간주해서는 안 됩니다.

| Paimon 유형 | Doris 유형 | 설명 |
| ---------------------------------- | ------------- | ----------------------------------------------------------------------- |
| boolean                            | boolean       |                                                                         |
| tinyint                            | tinyint       |                                                                         |
| smallint                           | smallint      |                                                                         |
| integer                            | int           |                                                                         |
| bigint                             | bigint        |                                                                         |
| float                              | float         |                                                                         |
| double                             | double        |                                                                         |
| decimal(P, S)                      | decimal(P, S) |                                                                         |
| varchar(N) | VARCHAR(N) / STRING | `VARCHAR(N)`은 `N <= 65533`일 때 사용하고, 그 외에는 `STRING`을 사용합니다. |
| char(N) | CHAR(N) / STRING | `CHAR(N)`은 `N <= 255`일 때 사용하고, 그 외에는 `STRING`을 사용합니다. |
| binary(N), varbinary(N) | VARBINARY(N) | 선언된 바이트 길이를 유지합니다. |
| date                               | date          |                                                                         |
| timestamp_without_time_zone(P) | DATETIME(P) / TIMESTAMP_NS | `DATETIME(P)`은 `P <= 6`일 때 사용합니다. 4.2에서는 `P > 6`이면 `TIMESTAMP_NS`로 매핑하여 마이크로초 미만의 정밀도를 유지합니다. |
| timestamp\_with\_local\_time\_zone | TIMESTAMPTZ(N) | 4.1.5부터 이 유형은 항상 `TIMESTAMPTZ(N)`으로 매핑됩니다. 정밀도가 6으로 제한되므로 더 높은 정밀도는 손실됩니다. |
| array                              | array         |                                                                         |
| map                                | map           |                                                                         |
| row                                | struct        |                                                                         |
| variant | VARIANT | 읽으려면 FE 설정 `enable_variant_v2=true`가 필요합니다. |
| time_without_time_zone | UNSUPPORTED | |
| other                              | UNSUPPORTED   |                                                                         |

## 사용 시 참고 사항 {#usage-notes}

복합 유형의 하위 필드에도 동일한 매핑이 재귀적으로 적용됩니다. `TIMESTAMPTZ`는 세션 `time_zone`에 따라 표시되는 특정 시점을 나타냅니다.

시간대가 없는 타임스탬프와 로컬 시간대가 적용된 타임스탬프는 정밀도 처리 방식이 다릅니다. 4.2는 전자의 나노초 정밀도를 유지할 수 있지만, 후자는 소수점 이하 여섯 자리로 제한됩니다. `TIMESTAMP_NS`의 범위는 `1677-09-21 00:12:43.145224192`부터 `2262-04-11 23:47:16.854775807`까지입니다.

`DESCRIBE table_name`에서 Extra 열의 `WITH_TIMEZONE`은 원본 필드에 시간대 정보가 있음을 나타냅니다.

구현 참고 자료: [PaimonUtil.java](https://github.com/apache/doris/blob/bcaaa5f293674f1adba0dfa52c8f8f57fb5e9549/fe/fe-core/src/main/java/org/apache/doris/datasource/paimon/PaimonUtil.java) (`branch-4.2`).
