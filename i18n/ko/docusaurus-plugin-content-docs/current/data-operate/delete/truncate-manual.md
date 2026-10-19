---
{
    "title": "TRUNCATE 작업",
    "language": "ko",
    "description": "Doris TRUNCATE는 테이블 또는 파티션 데이터를 어떻게 빠르게 비울까요? 이 문서에서는 구문, 매개변수, 적용 시나리오, 사용 제약 사항, 데이터 복구 방법, DELETE와의 비교를 설명합니다.",
    "keywords": [
        "Doris TRUNCATE",
        "테이블 데이터 비우기",
        "파티션 데이터 비우기",
        "TRUNCATE TABLE",
        "TRUNCATE PARTITION",
        "FORCE 비우기",
        "데이터 복구 RECOVER"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Data cleanup / Test environment reset / Partition data rebuild -->

`TRUNCATE`는 지정된 테이블 또는 파티션의 모든 데이터를 한 번의 작업으로 비우고, 테이블 구조와 파티션 정의만 유지합니다. `DELETE`와 달리 삭제 버전을 생성하지 않으므로 이후 쿼리 성능에 영향을 주지 않아 대규모 데이터 정리에 우선적으로 권장됩니다.

## 빠른 탐색 {#quick-navigation}

- [TRUNCATE를 선택해야 하는 경우](#when-to-choose-truncate): 대표적인 적용 시나리오
- [구문 및 매개변수](#syntax-and-parameters): 명령 형식 설명
- [사용 예시](#usage-examples): 일반적인 작업 예시
- [사용 제약 사항](#usage-constraints): 실행 전에 알아야 할 제한 사항
- [데이터 복구](#data-recovery): 실수로 실행한 작업의 복구 방법
- [TRUNCATE와 DELETE 비교](#truncate-vs-delete): 선택을 위한 비교
- [자주 묻는 질문](#faq): 자주 묻는 질문과 답변

## TRUNCATE를 선택해야 하는 경우 {#when-to-choose-truncate}

`TRUNCATE`는 대량의 데이터를 한 번에 비워야 하는 시나리오에 적합합니다.

- **테스트 환경 초기화**: 데이터를 다시 적재할 수 있도록 테스트 데이터를 비웁니다.
- **파티션 데이터 재구축**: 지정된 파티션을 비운 다음 수정된 데이터를 다시 씁니다.
- **대규모 데이터 정리**: `DELETE`와 달리 버전이 누적되지 않으며 쿼리 성능에 영향을 주지 않습니다.
- **과거 데이터 아카이빙 후 정리**: 아카이빙이 완료된 후 원본 테이블 또는 파티션을 비웁니다.

## 구문 및 매개변수 {#syntax-and-parameters}

### 명령 형식 {#command-format}

```sql
TRUNCATE TABLE [db.]tbl [PARTITION(p1, p2, ...)] [FORCE];
```

### 매개변수 설명 {#parameter-description}

| 매개변수        | 필수 여부 | 설명                                                                                 |
| --------------- | -------- | ------------------------------------------------------------------------------------ |
| `db.`           | 아니요   | 데이터베이스 이름입니다. 생략하면 현재 데이터베이스를 사용합니다.                     |
| `tbl`           | 예       | 데이터를 비울 테이블의 이름입니다.                                                   |
| `PARTITION(..)` | 아니요   | 파티션 이름 목록을 지정하며, 해당 파티션만 비웁니다. 생략하면 전체 테이블을 비웁니다. |
| `FORCE`         | 아니요   | 데이터를 즉시 물리적으로 삭제합니다. **RECOVER로 복구할 수 없습니다.** 주의해서 사용하세요. |

## 사용 예시 {#usage-examples}

### 1. 전체 테이블 비우기 {#1-clear-an-entire-table}

`tbl` 테이블(`example_db` 데이터베이스)의 모든 데이터를 비웁니다.

```sql
TRUNCATE TABLE example_db.tbl;
```

### 2. 지정된 파티션 비우기 {#2-clear-specified-partitions}

`p1` 및 `p2` 파티션만 비우며, 대상 테이블은 `tbl`입니다.

```sql
TRUNCATE TABLE tbl PARTITION(p1, p2);
```

### 3. 강제로 비우기(복구 불가) {#3-force-clear-non-recoverable}

휴지통을 거치지 않고 `example_db.tbl`의 데이터를 즉시 물리적으로 삭제합니다.

```sql
TRUNCATE TABLE example_db.tbl FORCE;
```

:::caution
`FORCE`를 사용하면 데이터를 `RECOVER`로 복구할 수 없습니다. 실행 전에 확인하세요.
:::

## 사용 제약 사항 {#usage-constraints}

`TRUNCATE`를 실행하기 전에 다음 조건을 확인하세요.

- **데이터만 비우고 구조는 유지**: 테이블 구조와 파티션 정의는 유지되며, 데이터만 비웁니다.
- **필터 조건 미지원**: 전체 테이블 또는 지정된 파티션만 비울 수 있습니다. `WHERE` 조건을 추가할 수 없습니다.
- **테이블 상태가 NORMAL이어야 함**: `SCHEMA CHANGE`를 수행 중인 테이블에는 TRUNCATE를 실행할 수 없습니다.
- **진행 중인 데이터 적재에 영향**: 실행 중인 데이터 적재 작업이 실패할 수 있습니다. 데이터 적재가 진행되지 않는 시간에 실행하세요.
- **기본적으로 복구 가능**: `FORCE`를 사용하지 않으면 보존 기간 내에 [RECOVER](../../sql-manual/sql-statements/recycle/RECOVER)로 데이터를 복구할 수 있습니다.

## 데이터 복구 {#data-recovery}

`TRUNCATE`를 `FORCE` 없이 실행하면 비워진 데이터가 휴지통으로 이동하며, 보존 기간 내에 복구할 수 있습니다.

```sql
RECOVER TABLE [db_name.]table_name;
```

자세한 내용은 [RECOVER 문 설명](../../sql-manual/sql-statements/recycle/RECOVER)을 참조하세요.

:::tip
휴지통 보존 기간은 FE 설정 항목인 `catalog_trash_expire_second`로 제어합니다. 보존 기간이 지난 데이터는 영구적으로 삭제됩니다.
:::

## TRUNCATE와 DELETE 비교 {#truncate-vs-delete}

둘 다 데이터를 삭제하는 데 사용할 수 있지만, 적합한 시나리오는 크게 다릅니다.

| 비교 항목                    | TRUNCATE                              | DELETE                                                          |
| ---------------------------- | ------------------------------------- | --------------------------------------------------------------- |
| 삭제 단위                    | 전체 테이블 또는 전체 파티션          | 행 단위, 선택적으로 `WHERE` 조건 사용 가능                      |
| 필터링 지원                  | 아니요                                | 예                                                              |
| 쿼리 성능에 미치는 영향      | 없음                                  | 삭제 버전을 생성하여 쿼리 성능에 영향을 줌                      |
| 실행 속도                    | 매우 빠름(메타데이터 수준의 작업)     | 조건에 일치하는 행 수에 따라 달라짐                             |
| 기본 복구 가능 여부          | `RECOVER`로 복구 가능(FORCE 미사용 시) | 직접 복구할 수 없음                                             |
| 대표적인 시나리오            | 대규모 데이터 비우기, 파티션 재구축    | 소량의 데이터를 정확하게 삭제                                   |

**선택 권장 사항**:

- 전체 테이블 또는 전체 파티션을 비우려면 `TRUNCATE`를 우선 사용하세요.
- 조건에 따라 일부 데이터를 삭제하려면 `DELETE`를 사용하세요.

## 자주 묻는 질문 {#faq}

### TRUNCATE는 테이블 구조도 삭제하나요? {#does-truncate-delete-the-table-structure}

아니요. `TRUNCATE`는 데이터만 비웁니다. 테이블 구조, 파티션 정의, 인덱스 및 기타 메타데이터는 모두 유지됩니다.

### TRUNCATE 실행 후 데이터를 복구할 수 있나요? {#can-data-be-recovered-after-truncate}

- **`FORCE` 미사용 시**: 보존 기간 내에 `RECOVER`로 복구할 수 있습니다.
- **`FORCE` 사용 시**: 데이터가 물리적으로 삭제되어 복구할 수 없습니다.

### 테이블에서 SCHEMA CHANGE가 진행 중일 때 TRUNCATE를 실행할 수 있나요? {#can-truncate-be-performed-while-a-table-is-undergoing-schema-change}

아니요. 테이블 상태가 `NORMAL`이어야 하며, 그렇지 않으면 명령 실행 시 오류가 발생합니다. SCHEMA CHANGE가 완료될 때까지 기다린 후 실행하세요.

### TRUNCATE는 진행 중인 데이터 적재 작업에 영향을 주나요? {#does-truncate-affect-ongoing-import-tasks}

진행 중인 데이터 적재 작업이 실패할 수 있습니다. 데이터 적재가 진행되지 않는 시간에 실행하거나, 관련 데이터 적재 작업을 먼저 일시 중지하세요.

### TRUNCATE와 DROP TABLE의 차이는 무엇인가요? {#what-is-the-difference-between-truncate-and-drop-table}

- `TRUNCATE`: 테이블 구조를 유지하고 데이터만 비웁니다.
- `DROP TABLE`: 구조와 데이터를 포함하여 테이블 자체를 삭제합니다.

### 파티션 내 데이터 중 일부만 비울 수 있나요? {#can-only-part-of-the-data-in-a-partition-be-cleared}

아니요. `TRUNCATE`는 전체 테이블 또는 지정된 파티션만 비울 수 있으며, 행 단위 필터링을 지원하지 않습니다. 조건에 따라 삭제하려면 [DELETE](./delete-manual)를 사용하세요.

## 관련 문서 {#related-documents}

- [RECOVER 문](../../sql-manual/sql-statements/recycle/RECOVER): 비워진 데이터를 복구합니다.
- [DELETE 작업](./delete-manual): 조건에 따라 데이터를 삭제합니다.
