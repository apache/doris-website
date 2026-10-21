---
{
    "title": "ICEBERG_META",
    "language": "ko",
    "description": "iceberg_meta 테이블 반환 함수(tvf)는 Iceberg 테이블의 다양한 메타데이터를 읽는 데 사용됩니다. 이 테이블 함수는 4.1.4에서 제거되었습니다. 대신 Iceberg 시스템 테이블을 사용하세요."
}
---

:::caution 동작 변경 (4.1.4)

`iceberg_meta()` 테이블 함수는 **4.1.4**에서 제거되었습니다. 실행하면 다음 오류가 발생합니다:

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Could not find table function iceberg_meta
```

대신 Iceberg 시스템 테이블을 통해 동일한 메타데이터를 쿼리하세요. 시스템 테이블은 3.1.0부터 지원되며, 모든 `query_type`에 대해 `iceberg_meta()`가 제공하는 메타데이터를 조회할 수 있고 더 많은 유형의 메타데이터도 제공합니다. [Iceberg Catalog 시스템 테이블](../../../lakehouse/catalogs/iceberg-catalog.mdx#system-tables)을 참조하세요.

4.1.4 이전 버전에서는 여전히 `iceberg_meta()`를 사용할 수 있으므로, 참고할 수 있도록 이 문서에 사용법을 남겨 두었습니다.

:::

## 설명 {#description}

iceberg_meta 테이블 반환 함수(tvf)는 Iceberg 메타데이터, 작업 이력, 테이블 스냅샷, 파일 메타데이터 등을 읽는 데 사용됩니다.

## 대체 방법: Iceberg 시스템 테이블 {#replacement-iceberg-system-tables}

테이블 이름 뒤에 `$`와 시스템 테이블 이름을 붙여 시스템 테이블에 접근합니다:

```sql
SELECT * FROM <catalog>.<database>.<table>$<system_table_name>;
```

각 `query_type`에 대해 `iceberg_meta()`와 동일한 결과를 제공하는 시스템 테이블은 다음과 같습니다:

| `query_type` 값 (`iceberg_meta()`) | 대응하는 시스템 테이블   |
|----------------------------------|---------------------------|
| `snapshots`                      | `<table>$snapshots`       |
| `manifests`                      | `<table>$manifests`       |
| `all_manifests`                  | `<table>$all_manifests`   |
| `files`                          | `<table>$files`           |
| `data_files`                     | `<table>$data_files`      |
| `delete_files`                   | `<table>$delete_files`    |
| `partitions`                     | `<table>$partitions`      |
| `refs`                           | `<table>$refs`            |
| `history`                        | `<table>$history`         |
| `metadata_log_entries`           | `<table>$metadata_log_entries` |

쿼리 변경 예시:

```sql
-- Before 4.1.4
SELECT * FROM iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "snapshots");

-- 4.1.4 and later
SELECT * FROM iceberg_ctl.test_db.test_tbl$snapshots;
```

```sql
-- Before 4.1.4: filtered by the snapshot_id column
SELECT * FROM iceberg_meta("table" = "iceberg_ctl.test_db.test_tbl", "query_type" = "snapshots")
WHERE snapshot_id = 98865735822;

-- 4.1.4 and later
SELECT * FROM iceberg_ctl.test_db.test_tbl$snapshots WHERE snapshot_id = 98865735822;
```

## 구문 (4.1.4 이전) {#syntax-before-414}

```sql
ICEBERG_META(
    "table" = "<table>", 
    "query_type" = "<query_type>"
  );
```

## 필수 매개변수 (4.1.4 이전) {#required-parameters-before-414}

`iceberg_meta` 테이블 함수(tvf)의 각 매개변수는 `"key"="value"` 쌍입니다.

| 필드          | 설명                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<table>`      | 조회할 Iceberg 테이블의 전체 이름으로, `database_name.table_name` 형식으로 지정해야 합니다.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `<query_type>` | 조회할 메타데이터 유형입니다. 지원되는 유형은 다음과 같습니다:<br/>`snapshots`: 스냅샷 정보<br/>`manifests`: 현재 스냅샷의 Manifest 파일<br/>`all_manifests`: 유효한 모든 스냅샷의 Manifest 파일(버전 4.0.4부터 지원)<br/>`files`: 현재 스냅샷의 파일 정보<br/>`data_files`: 현재 스냅샷의 데이터 파일<br/>`delete_files`: 현재 스냅샷의 삭제 파일<br/>`partitions`: 파티션 정보<br/>`refs`: 참조 정보(브랜치 및 태그)<br/>`history`: 이력 기록<br/>`metadata_log_entries`: 메타데이터 로그 항목 |

## 예시 {#examples}

- Iceberg 테이블의 스냅샷 메타데이터를 읽고 조회합니다.

    ```sql
    select * from iceberg_ctl.db.tbl$snapshots;
    ```

- Iceberg 테이블의 스냅샷을 확인합니다:

    ```sql
    select * from iceberg_ctl.test_db.test_tbl$snapshots;
    ```
    ```text
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    |      committed_at      |  snapshot_id   |   parent_id   | operation |   manifest_list   |            summary           |
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    |  2022-09-20 11:14:29   |  64123452344   |       -1      |  append   | hdfs:/path/to/m1  | {"flink.job-id":"xxm1", ...} |
    |  2022-09-21 10:36:35   |  98865735822   |  64123452344  | overwrite | hdfs:/path/to/m2  | {"flink.job-id":"xxm2", ...} |
    |  2022-09-21 21:44:11   |  51232845315   |  98865735822  | overwrite | hdfs:/path/to/m3  | {"flink.job-id":"xxm3", ...} |
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    ```

- snapshot_id로 필터링합니다:

    ```sql
    select * from iceberg_ctl.test_db.test_tbl$snapshots where snapshot_id = 98865735822;
    ```
    ```text
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    |      committed_at      |  snapshot_id   |   parent_id   | operation |   manifest_list   |            summary           |
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    |  2022-09-21 10:36:35   |  98865735822   |  64123452344  | overwrite | hdfs:/path/to/m2  | {"flink.job-id":"xxm2", ...} |
    +------------------------+----------------+---------------+-----------+-------------------+------------------------------+
    ```

- Iceberg 테이블의 다른 메타데이터를 조회합니다

    ```sql
    select * from iceberg_ctl.test_db.test_tbl$manifests;
    select * from iceberg_ctl.test_db.test_tbl$all_manifests;
    select * from iceberg_ctl.test_db.test_tbl$files;
    select * from iceberg_ctl.test_db.test_tbl$data_files;
    select * from iceberg_ctl.test_db.test_tbl$delete_files;
    select * from iceberg_ctl.test_db.test_tbl$partitions;
    select * from iceberg_ctl.test_db.test_tbl$refs;
    select * from iceberg_ctl.test_db.test_tbl$history;
    select * from iceberg_ctl.test_db.test_tbl$metadata_log_entries;
    ```

## 관련 항목 {#related}

Iceberg 시스템 테이블에 대한 자세한 내용은 [Iceberg Catalog 시스템 테이블](../../../lakehouse/catalogs/iceberg-catalog.mdx#system-tables)을 참조하세요.
