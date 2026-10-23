---
{
    "title": "Hive에서 Doris로의 데이터 타입 매핑",
    "sidebar_label": "Doris 데이터 타입 매핑",
    "description": "데이터 타입, 정밀도, 중첩 타입 및 지원되지 않는 타입을 다루는 Doris 4.2 Hive 타입 매핑 참고 자료."
}
---

다음 표는 Doris 4.2(`branch-4.2`)가 Hive 외부 테이블 스키마를 읽을 때 타입을 매핑하는 방식을 설명합니다. 쓰기 동작은 대상 스키마와 지원되는 쓰기 작업에도 영향을 받으므로, 읽기 매핑을 반대로 적용한다고 해서 쓰기 매핑이 자동으로 결정되지는 않습니다.

| Hive 유형     | Doris 유형    | 설명                                        |
| ------------- | ------------- | ---------------------------------------------- |
| boolean       | boolean       |                                                |
| tinyint       | tinyint       |                                                |
| smallint      | smallint      |                                                |
| int           | int           |                                                |
| bigint        | bigint        |                                                |
| date          | date          |                                                |
| timestamp     | datetime(6)   | 정밀도가 6인 datetime으로 매핑됩니다.            |
| float         | float         |                                                |
| double        | double        |                                                |
| decimal(P, S) | decimal(P, S) | 정밀도를 지정하지 않으면 기본값인 decimal(9, 0)이 적용됩니다. |
| char(N)       | char(N)       |                                                |
| varchar(N)    | varchar(N)    |                                                |
| string        | string        |                                                |
| binary | VARBINARY | 4.1.5부터 이 타입은 항상 `VARBINARY`로 매핑됩니다. |
| timestamp with local time zone | TIMESTAMPTZ(6) | 4.1.5부터 이 타입은 항상 `TIMESTAMPTZ(6)`으로 매핑됩니다. 정밀도는 최대 6으로 제한되므로 그보다 높은 정밀도는 손실됩니다. |
| array         | array         |                                                |
| map           | map           |                                                |
| struct        | struct        |                                                |
| other         | unsupported   |                                                |

## 사용 시 참고 사항 {#usage-notes}

복합 타입의 하위 필드에도 동일한 매핑이 재귀적으로 적용됩니다. `TIMESTAMPTZ`는 세션의 `time_zone`에 따라 표시되는 특정 시점을 나타냅니다.

Hive Catalog는 Hive Metastore의 타입 문자열에서 스키마를 가져옵니다. `timestamp`는 `DATETIME(6)`으로 매핑되며, 기반 파일에 나노초 단위 데이터가 있어도 매핑이 자동으로 `TIMESTAMP_NS`로 바뀌지는 않습니다. `uniontype`을 비롯해 지원되는 타입으로 나열되지 않은 타입은 지원되지 않습니다.

구현 참고 자료: [HiveMetaStoreClientHelper.java](https://github.com/apache/doris/blob/bcaaa5f293674f1adba0dfa52c8f8f57fb5e9549/fe/fe-core/src/main/java/org/apache/doris/datasource/hive/HiveMetaStoreClientHelper.java) (`branch-4.2`).
