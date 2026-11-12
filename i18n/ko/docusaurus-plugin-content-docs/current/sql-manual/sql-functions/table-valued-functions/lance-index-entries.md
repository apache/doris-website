---
{
    "title": "LANCE_INDEX_ENTRIES",
    "language": "ko",
    "description": "Filesystem Catalog에 있는 Lance 테이블의 최신 스냅샷에 기록된 물리적 인덱스 항목을 나열하는 lance_index_entries 테이블 반환 함수(TVF)."
}
---

## 설명 {#description}

:::note
`lance_index_entries`는 Apache Doris 4.1.5부터 지원됩니다.
:::

`lance_index_entries` 테이블 반환 함수(TVF)는 Lance 테이블의 최신 스냅샷에 기록된 물리적 인덱스 항목을 나열합니다. 물리적 인덱스 항목마다 한 행을 반환하며, 고정된 MySQL 형식의 결과 집합에 논리적 인덱스 정보(인덱스 이름, 인덱싱된 열, 인덱스 유형, 속성)를 표시하는 `SHOW INDEX`를 보완합니다. 물리적 인덱스 항목의 UUID와 데이터셋 버전은 이 고정된 스키마에 들어가지 않으므로 이 TVF를 통해서만 확인할 수 있습니다. 하나의 논리적 인덱스 이름에 서로 다른 UUID를 가진 물리적 항목이 여러 개 있으면 결과에 여러 행으로 나타날 수 있습니다.

이 TVF는 읽기 전용입니다. `Dataset.getIndexes()`를 통해 인덱스 메타데이터만 읽으며, 행 수나 통계는 읽지 않습니다. 일반적인 조건식으로 결과를 필터링할 수 있습니다. 행은 `(IndexName, IndexUuid)` 순서로 정렬됩니다. 읽은 항목은 모두 검증하며, 하나라도 문제가 있으면 결과를 잘라서 반환하는 대신 전체 쿼리가 실패합니다. 이름이 비어 있거나 허용 길이를 초과한 경우, UUID가 누락된 경우, `DatasetVersion`이 양수가 아닌 경우, UUID가 중복된 경우, 또는 원본 항목 수가 16,384개를 초과한 경우가 이에 해당합니다. Lance가 내부적으로 관리하는 예약된 시스템 인덱스인 `__lance_frag_reuse`와 `__lance_mem_wal`은 검증하지만 결과에는 표시하지 않습니다.

이 TVF를 사용하려면 테이블에 대한 `SHOW` 권한이 필요하며, Lance Filesystem Catalog에서만 지원됩니다. REST Catalog에서 사용하면 `lance_index_entries is not supported for Lance REST catalogs` 오류가 발생합니다.

## 문법 {#syntax}

```sql
LANCE_INDEX_ENTRIES(
    "table" = "<table>"
  );
```

## 매개변수 {#parameters}

`lance_index_entries`는 `"key"="value"` 쌍을 정확히 하나만 받습니다.

| 매개변수 | 설명 |
|---|---|
| `<table>` | 조회할 Lance 테이블의 세 부분으로 구성된 정규화된 `catalog.database.table` 이름입니다. 식별자는 백틱으로 감쌀 수 있습니다. 다단계 Lance Namespace가 `.`을 포함하는 데이터베이스 이름에 매핑된 경우에는 데이터베이스 부분을 백틱으로 감싸세요. 예: `` lance_catalog.`doris.analytics`.items ``. |

## 반환값 {#return-value}

이 TVF는 스칼라 NULL 값 대신 결과 집합을 반환합니다. 사용자 인덱스가 없는 테이블에서는 행이 반환되지 않습니다. `table` 인수가 없거나 유효하지 않으면 오류가 발생합니다. `table` 인수는 비어 있지 않은 문자열이어야 하며 SQL NULL은 허용하지 않습니다.

이 TVF는 다음과 같은 고정된 열을 반환합니다.

| 열 | 유형 | 설명 |
|---|---|---|
| `CatalogName` | STRING | Catalog 이름입니다. |
| `DatabaseName` | STRING | 데이터베이스 이름입니다. |
| `TableName` | STRING | 테이블 이름입니다. |
| `IndexName` | STRING | Lance 논리적 인덱스의 이름입니다. |
| `IndexUuid` | STRING | 물리적 인덱스 항목의 UUID입니다. |
| `DatasetVersion` | BIGINT | 물리적 인덱스 항목에 기록된 데이터셋 버전, 즉 해당 항목이 작성된 시점의 데이터셋 버전입니다. 같은 논리적 인덱스에 속한 물리적 항목이라도 데이터셋 버전은 서로 다를 수 있습니다. 값은 항상 `1` 이상입니다. |

## 예제 {#example}

먼저 [Lance Catalog](../../../lakehouse/catalogs/lance-catalog.mdx)에 설명된 대로 Filesystem Catalog를 구성하고, 외부 Lance 도구를 사용하여 데이터셋과 인덱스를 만듭니다. 예제의 이름은 접근할 수 있는 테이블의 이름으로 바꾸세요. 해당 테이블에 대한 `SHOW` 권한이 필요합니다.

- `vs_ivf_pq_f32` 테이블의 물리적 인덱스 항목을 나열합니다(Catalog: `lance_catalog`):

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

    이 출력의 `IndexUuid`와 `DatasetVersion` 값은 예시입니다.

- 일반적인 조건식으로 결과를 필터링합니다.

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

빈 `table` 인수를 전달하면 다음 메시지가 포함된 오류가 발생합니다.

```sql
SELECT * FROM lance_index_entries("table" = "");
```

```text
Missing required lance_index_entries property 'table'
```

## 관련 문서 {#related}

`SHOW INDEX`가 제공하는 논리적 인덱스 정보를 포함하여 Lance 인덱스를 조회하는 방법에 대한 자세한 내용은 [Lance Catalog](../../../lakehouse/catalogs/lance-catalog.mdx#inspect-lance-indexes)를 참조하세요.
