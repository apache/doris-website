---
{
    "title": "휴지통에서 복구",
    "language": "ko",
    "description": "Doris 휴지통을 사용하여 DROP으로 실수로 삭제한 데이터베이스, 테이블 또는 파티션을 복구하고 데이터 손실을 방지할 수 있습니다. 이 페이지에서는 조회부터 복구까지 전체 절차를 설명합니다.",
    "keywords": [
        "Doris recycle bin",
        "data recovery",
        "accidental deletion recovery",
        "RECOVER",
        "SHOW CATALOG RECYCLE BIN",
        "DROP DATABASE recovery",
        "DROP TABLE recovery",
        "DROP PARTITION recovery",
        "DROP FORCE",
        "recycle bin",
        "data recovery",
        "database accidental deletion",
        "partition recovery"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Database / table / partition accidental-deletion recovery / disaster recovery -->

Doris는 실수로 인한 데이터 재해를 방지하기 위해 휴지통을 제공합니다. 휴지통에서는 실수로 삭제한 데이터베이스, 테이블, 파티션을 복구할 수 있습니다.

`DROP DATABASE/TABLE/PARTITION`을 `FORCE` 키워드 없이 실행하면 Doris는 데이터를 즉시 물리적으로 삭제하지 않고 해당 데이터베이스, 테이블 또는 파티션을 휴지통으로 이동합니다. 이후 `RECOVER` 명령을 사용하여 객체를 복구하고 다시 표시되도록 할 수 있습니다.

:::warning 참고
`DROP ... FORCE`를 실행하면 데이터가 즉시 물리적으로 삭제되며 휴지통에서 복구할 수 없습니다.
:::

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 복구 가능 여부 | 권장 조치 |
| --- | --- | --- |
| 실수로 `DROP DATABASE example_db` 실행 | 가능 | `RECOVER DATABASE example_db` |
| 실수로 `DROP TABLE example_db.example_tbl` 실행 | 가능 | `RECOVER TABLE example_db.example_tbl` |
| 실수로 `ALTER TABLE ... DROP PARTITION p1` 실행 | 가능 | `RECOVER PARTITION p1 FROM example_tbl` |
| 실수로 `DROP ... FORCE` 실행 | 불가능 | 백업에서 복원 |

## 사전 요구 사항 {#prerequisites}

- 현재 사용자에게 복구할 객체에 대한 `ALTER_PRIV` 등의 필수 권한이 있어야 합니다.
- `DROP` 명령 실행 시 `FORCE`를 사용하지 않았어야 합니다.
- 휴지통의 객체가 수동으로 영구 삭제되지 않았어야 합니다([DROP-CATALOG-RECYCLE-BIN](../../sql-manual/sql-statements/recycle/DROP-CATALOG-RECYCLE-BIN) 참조).

## 복구 절차 개요 {#recovery-workflow-overview}

1. `SHOW CATALOG RECYCLE BIN`을 실행하여 휴지통에서 복구할 수 있는 객체를 조회합니다.
2. 객체 유형(DATABASE / TABLE / PARTITION)에 맞는 `RECOVER` 명령을 선택합니다.
3. 복구 후 객체가 다시 표시되고 데이터가 온전한지 확인합니다.

## 휴지통 조회 {#query-the-recycle-bin}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Confirm that the target object exists in the recycle bin before recovery -->

복구 작업을 실행하기 전에 대상 객체가 아직 휴지통에 있는지 확인합니다.

```sql
SHOW CATALOG RECYCLE BIN [WHERE NAME [= "name" | LIKE "name_matcher"]];
```

매개변수 설명:

| 매개변수 | 설명 |
| --- | --- |
| `NAME = "name"` | 정확히 일치하는 이름으로 휴지통의 객체 필터링 |
| `NAME LIKE "name_matcher"` | 와일드카드 패턴으로 휴지통의 객체 필터링(`%` 및 `_` 지원) |

자세한 구문과 모범 사례는 [SHOW-CATALOG-RECYCLE-BIN](../../sql-manual/sql-statements/recycle/SHOW-CATALOG-RECYCLE-BIN) 명령 매뉴얼을 참조하세요. MySQL 클라이언트의 명령줄에서 `HELP SHOW CATALOG RECYCLE BIN`을 실행하여 추가 도움말을 확인할 수도 있습니다.

## 데이터 복구 수행 {#perform-data-recovery}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Data restoration after database / table / partition accidental deletion -->

복구할 객체의 유형에 따라 다음 명령 중 하나를 선택합니다.

### 데이터베이스 복구 {#recover-a-database}

이름이 `example_db`인 데이터베이스를 복구합니다:

```sql
RECOVER DATABASE example_db;
```

### 테이블 복구 {#recover-a-table}

`example_tbl` 테이블을 `example_db` 데이터베이스에서 복구합니다:

```sql
RECOVER TABLE example_db.example_tbl;
```

### 파티션 복구 {#recover-a-partition}

파티션 `p1`을 `example_tbl` 테이블에서 복구합니다:

```sql
RECOVER PARTITION p1 FROM example_tbl;
```

자세한 `RECOVER` 구문과 모범 사례는 [RECOVER](../../sql-manual/sql-statements/recycle/RECOVER) 명령 매뉴얼을 참조하세요. MySQL 클라이언트의 명령줄에서 `HELP RECOVER`를 실행하여 추가 도움말을 확인할 수도 있습니다.

## 자주 묻는 질문 {#faq}

### 질문: `RECOVER` 실행 시 객체가 없다는 메시지가 표시되면 어떻게 해야 하나요? {#q-what-if-recover-reports-that-the-object-does-not-exist}

객체가 `DROP ... FORCE`로 삭제되어 휴지통으로 이동하지 않았으므로 휴지통에서 복구할 수 없습니다. 백업에서 데이터를 복원하세요.

### 질문: `SHOW CATALOG RECYCLE BIN`의 결과에 대상 객체가 없으면 어떻게 해야 하나요? {#q-what-if-show-catalog-recycle-bin-does-not-return-the-target-object}

객체가 이미 `DROP CATALOG RECYCLE BIN`으로 영구 삭제되어 복구할 수 없습니다. 백업에서 데이터를 복원하세요.

### 질문: 복구 중 권한 오류가 발생하면 어떻게 해야 하나요? {#q-what-if-recovery-reports-a-permission-error}

현재 사용자에게 필요한 권한이 없습니다. 적절한 권한이 있는 사용자에게 권한을 부여하거나 대신 복구를 수행해 달라고 요청하세요.

### 질문: 복구 후 데이터가 조회되지 않으면 어떻게 해야 하나요? {#q-what-if-no-data-is-returned-after-recovery}

같은 이름의 새 객체가 생성되어 복구된 객체를 덮어쓴 상태입니다. 먼저 `RENAME`으로 새 객체의 이름을 변경하거나 새 객체를 삭제한 다음 복구를 다시 실행하세요.
