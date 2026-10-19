---
{
    "title": "LANCE_INDEX_ENTRIES",
    "language": "ko",
    "description": "lance_index_entries 테이블 값 함수(TVF). Filesystem Catalog에 있는 Lance 테이블의 최신 스냅샷에 기록된 물리 인덱스 항목을 나열합니다."
}
---

## 설명 {#description}

:::note
`lance_index_entries`는 Apache Doris 4.1.5부터 지원됩니다.
:::

`lance_index_entries` 테이블 값 함수(TVF)는 Lance 테이블의 최신 스냅샷에 기록된 물리 인덱스 항목을 나열합니다. 물리 인덱스 항목마다 한 행을 반환하며, 고정된 MySQL 스타일 결과 집합으로 논리 인덱스 정보(인덱스 이름, 인덱싱된 컬럼, 인덱스 유형, 속성)를 표시하는 `SHOW INDEX`를 보완합니다. 물리 인덱스 항목의 UUID와 데이터셋 버전은 이 고정 스키마에 담을 수 없으므로 이 TVF를 통해서만 제공됩니다. 하나의 논리 인덱스에 UUID가 서로 다른 물리 항목이 여러 개 있으면 동일한 논리 인덱스 이름이 여러 행에 나타날 수 있습니다.

이 TVF는 읽기 전용입니다. `Dataset.getIndexes()`를 통해 인덱스 메타데이터만 읽으며, 행 수나 통계는 읽지 않습니다. 일반 조건식으로 결과를 필터링할 수 있습니다. 행은 `(IndexName, IndexUuid)`를 기준으로 정렬됩니다. 읽기 시 모든 항목을 검증하며, 오류가 있으면 전체 읽기가 실패합니다. 이름이 비어 있거나 너무 긴 경우, UUID가 누락된 경우, `DatasetVersion`이 양수가 아닌 경우, UUID가 중복된 경우 또는 원시 항목 수가 16,384를 초과하는 경우에는 결과를 잘라 반환하지 않고 전체 쿼리가 실패합니다. Lance가 내부적으로 관리하는 예약 시스템 인덱스인 `__lance_frag_reuse`와 `__lance_mem_wal`은 검증하지만 결과에 표시하지 않습니다.

이 TVF를 사용하려면 테이블에 대한 `SHOW` 권한이 필요하며, Lance Filesystem Catalog에서만 지원됩니다. REST Catalog에서는 `lance_index_entries is not supported for Lance REST catalogs` 오류와 함께 실행이 거부됩니다.

## 구문 {#syntax}

```sql
LANCE_INDEX_ENTRIES(
    "table" = "<table>"
  );
```

## 매개변수 {#parameters}

`lance_index_entries`는 `"key"="value"` 쌍을 정확히 하나 받습니다.

| 매개변수 | 설명 |
|---|---|
| `<table>` | 검사할 Lance 테이블의 정규화된 이름으로, `catalog.database.table` 형식의 세 부분으로 구성됩니다. 식별자는 백틱으로 묶을 수 있습니다. 다단계 Lance Namespace가 `.`을 포함하는 데이터베이스 이름에 매핑되는 경우, 데이터베이스 부분을 백틱으로 묶습니다. 예: `` lance_catalog.`doris.analytics`.items ``. |

## 반환값 {#return-value}

이 TVF는 스칼라 NULL 대신 결과 집합을 반환합니다. 사용자 인덱스가 없는 테이블은 행을 반환하지 않습니다. `table` 인수가 누락되거나 유효하지 않으면 오류가 발생합니다. `table` 인수는 비어 있지 않은 문자열이어야 하며 SQL NULL은 허용되지 않습니다.

이 TVF는 다음과 같은 고정 컬럼을 반환합니다.

| 컬럼 | 유형 | 설명 |
|---|---|---|
| `CatalogName` | STRING | Catalog 이름. |
| `DatabaseName` | STRING | 데이터베이스 이름. |
| `TableName` | STRING | 테이블 이름. |
| `IndexName` | STRING | Lance 논리 인덱스의 이름. |
| `IndexUuid` | STRING | 물리 인덱스 항목의 UUID. |
| `DatasetVersion` | BIGINT | 물리 인덱스 항목에 기록된 데이터셋 버전, 즉 해당 항목이 작성된 시점의 데이터셋 버전입니다. 동일한 논리 인덱스에 속한 물리 항목도 서로 다른 데이터셋 버전을 가질 수 있습니다. 항상 `1` 이상입니다. |

## 예제 {#example}

먼저 [Lance Catalog](../../../lakehouse/catalogs/lance-catalog.mdx)의 설명에 따라 Filesystem Catalog를 구성하고, 외부 Lance 도구를 사용하여 데이터셋과 인덱스를 생성합니다. 예제의 이름은 접근할 수 있는 테이블의 이름으로 바꿉니다. 해당 테이블에 대한 `SHOW` 권한이 필요합니다.

- 테이블 `vs_ivf_pq_f32`의 물리 인덱스 항목을 Catalog `lance_catalog`에서 조회합니다.

    ```sql
    select * from lance_index_entries("table" = "lance_catalog.default.vs_ivf_pq_f32");
    ```
    ```text
    +---------------+--------------+---------------+----------------------+--------------------------------------+----------------+
    | CatalogName   | DatabaseName | TableName     | IndexName            | IndexUuid                            | DatasetVersion |
    +---------------+--------------+---------------+----------------------+--------------------------------------+----------------+
    | lance_catalog | default      | vs_ivf_pq_f32 | embedding_ivf_pq_f32 | 3f9c2a1e-7b4d-4e6f-9a1c-2d5e8f0b3a47 | 12             |
    +---------------+--------------+---------------+----------------------+--------------------------------------+----------------+
    ```

    이 출력의 `IndexUuid`와 `DatasetVersion`은 예시 값입니다.

- 일반 조건식으로 결과를 필터링합니다.

    ```sql
    select IndexName, IndexUuid
    from lance_index_entries("table" = "lance_catalog.default.vs_ivf_pq_f32")
    where DatasetVersion >= 12
    order by IndexName, IndexUuid;
    ```

    ```text
    IndexName             IndexUuid
    embedding_ivf_pq_f32  3f9c2a1e-7b4d-4e6f-9a1c-2d5e8f0b3a47
    ```

`table` 인수가 비어 있으면 다음 메시지를 포함한 오류가 발생합니다.

```sql
SELECT * FROM lance_index_entries("table" = "");
```

```text
Missing required lance_index_entries property 'table'
```

## 관련 문서 {#related}

`SHOW INDEX`가 제공하는 논리 인덱스 정보를 비롯하여 Lance 인덱스 검사에 대한 자세한 내용은 [Lance Catalog](../../../lakehouse/catalogs/lance-catalog.mdx#inspect-lance-indexes)를 참조하세요.
