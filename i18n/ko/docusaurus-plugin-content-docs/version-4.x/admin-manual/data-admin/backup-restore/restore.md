---
{
    "title": "복원",
    "language": "ko",
    "description": "이 가이드는 Repository의 백업 스냅샷에서 Doris의 데이터베이스, 테이블 또는 파티션을 복원하는 방법을 설명합니다. 스냅샷 조회, 시나리오별 RESTORE 실행, 복원 작업 진행 상황 확인에 필요한 전체 절차를 안내합니다.",
    "keywords": [
        "Doris 복원",
        "RESTORE SNAPSHOT",
        "데이터 복구",
        "백업 및 복원",
        "SHOW SNAPSHOT",
        "SHOW RESTORE",
        "backup_timestamp",
        "데이터베이스 간 복원",
        "파티션 복원",
        "테이블 이름을 변경하여 복원"
    ]
}
---

이 가이드는 Doris의 `RESTORE` 문을 사용하여 기존 Repository의 백업 스냅샷에서 데이터베이스, 테이블 또는 파티션을 복원하고, 복원 작업의 진행 상황을 확인하는 방법을 설명합니다. 데이터 롤백, 새 클러스터로의 마이그레이션, 데이터베이스 간 복제, 테이블 또는 파티션 수준의 데이터 복구 등의 시나리오에 적용할 수 있습니다.

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Data restore / Cross-database migration / Partition-level rollback -->

## 적용 시나리오 {#applicable-scenarios}

| 시나리오                                              | 권장 방법                                                | 설명                                                                                |
|-------------------------------------------------------|---------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| 전체 스냅샷을 현재 데이터베이스로 복원    | [스냅샷을 현재 데이터베이스로 복원](#option-1-restore-a-snapshot-to-the-current-database)    | 가장 일반적인 경우입니다. 스냅샷의 모든 객체를 `USE`로 현재 선택한 데이터베이스에 복원합니다. |
| 전체 스냅샷을 다른 데이터베이스로 복원        | [스냅샷을 지정한 데이터베이스로 복원](#option-2-restore-a-snapshot-to-a-specified-database)    | 데이터베이스 간 마이그레이션을 수행하거나 다른 데이터베이스에 데이터 사본을 보관할 때 사용합니다. |
| 스냅샷에서 특정 테이블만 복원       | [스냅샷에서 단일 테이블 복원](#option-3-restore-a-single-table-from-a-snapshot)            | 특정 테이블 하나만 롤백하거나 마이그레이션해야 할 때 사용합니다.                        |
| 지정한 파티션을 복원하거나 복원 시 테이블 이름 변경 | [스냅샷에서 파티션 및 테이블 복원](#option-4-restore-partitions-and-tables-from-a-snapshot) | 일부 파티션만 복원할 수 있으며, 복원 시 `AS`로 테이블 이름을 변경하여 기존 객체를 덮어쓰지 않도록 할 수 있습니다. |

## 사전 요구 사항 {#prerequisites}

- 복원 작업을 수행하려면 **관리자** 권한이 있어야 합니다.
- 사용 가능한 백업 스냅샷이 있어야 합니다. 백업 작업에 대한 자세한 내용은 [백업](./backup)을 참조하세요.
- 백업이 저장된 Repository의 이름을 알고 있어야 합니다. 예제에서는 `example_repo`를 사용합니다.

## 복원 절차 개요 {#restore-workflow-overview}

1. 대상 Repository에서 사용 가능한 스냅샷을 조회하여 스냅샷 이름과 백업 타임스탬프를 확인합니다.
2. 필요에 따라 데이터베이스 전체, 다른 데이터베이스, 단일 테이블 또는 파티션을 복원하는 `RESTORE` 문을 선택하여 실행합니다.
3. `SHOW RESTORE`를 사용하여 복원 작업의 상태와 진행 상황을 확인하고, 복원이 완료되었는지 확인합니다.

## 1. 스냅샷의 백업 타임스탬프 확인 {#1-get-the-backup-timestamp-of-a-snapshot}

복원을 실행하기 전에 스냅샷 이름(Label)과 백업 완료 시 생성된 타임스탬프를 확인해야 합니다. 다음 SQL은 `example_repo`라는 Repository에 있는 기존 백업을 나열합니다:

```sql
mysql> SHOW SNAPSHOT ON example_repo;
+--------------------+---------------------+--------+
| Snapshot           | Timestamp           | Status |
+--------------------+---------------------+--------+
| exampledb_20241225 | 2022-04-08-15-52-29 | OK     |
+--------------------+---------------------+--------+
1 row in set (0.15 sec)
```

출력 열:

| 열    | 설명                                                                                              |
|-----------|----------------------------------------------------------------------------------------------------------|
| Snapshot  | 백업 생성 시 지정한 스냅샷의 Label입니다.                                        |
| Timestamp | 스냅샷 완료 시 생성된 타임스탬프로, `backup_timestamp` 인수로 `RESTORE` 문에 전달합니다. |
| Status    | Repository에 저장된 스냅샷의 상태입니다. `OK`는 스냅샷을 사용할 수 있음을 의미합니다.                         |

## 2. 스냅샷에서 복원 {#2-restore-from-a-snapshot}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Full-database restore / Cross-database restore / Single-table restore / Partition restore -->

복원할 객체의 범위와 대상 위치에 따라 다음 네 가지 옵션 중 하나를 선택합니다.

### 옵션 1: 스냅샷을 현재 데이터베이스로 복원 {#option-1-restore-a-snapshot-to-the-current-database}

Label이 `restore_label1`이고 타임스탬프가 `2022-04-08-15-52-29`인 스냅샷을 `example_repo`라는 Repository에서 현재 데이터베이스로 복원합니다:

```sql
RESTORE SNAPSHOT `restore_label1`
FROM `example_repo`
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```

### 옵션 2: 스냅샷을 지정한 데이터베이스로 복원 {#option-2-restore-a-snapshot-to-a-specified-database}

동일한 스냅샷을 `destdb`라는 데이터베이스로 복원합니다. 데이터베이스 간 마이그레이션을 수행하거나 다른 데이터베이스에 데이터 사본을 보관할 때 사용할 수 있습니다:

```sql
RESTORE SNAPSHOT destdb.`restore_label1`
FROM `example_repo`
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```

### 옵션 3: 스냅샷에서 단일 테이블 복원 {#option-3-restore-a-single-table-from-a-snapshot}

`example_repo`에 저장된 스냅샷 중 Label이 `restore_label1`이고 타임스탬프가 `2022-04-08-15-52-29`인 스냅샷에서 `backup_tbl` 테이블만 현재 데이터베이스로 복원합니다:

```sql
RESTORE SNAPSHOT `restore_label1`
FROM `example_repo`
ON ( `backup_tbl` )
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-52-29"
);
```

### 옵션 4: 스냅샷에서 파티션 및 테이블 복원 {#option-4-restore-partitions-and-tables-from-a-snapshot}

백업 스냅샷 `snapshot_2`가 저장된 `example_repo`에서 파티션 `p1`과 `p2`(테이블: `backup_tbl`), 그리고 테이블 `backup_tbl2`를 현재 데이터베이스 `example_db1`로 복원하고, `backup_tbl2`의 이름을 `new_tbl`로 변경합니다. 스냅샷 타임스탬프는 `2018-05-04-17-11-01`입니다:

```sql
RESTORE SNAPSHOT `restore_label1`
FROM `example_repo`
ON
(
    `backup_tbl` PARTITION (`p1`, `p2`),
    `backup_tbl2` AS `new_tbl`
)
PROPERTIES
(
    "backup_timestamp"="2022-04-08-15-55-43"
);
```

### 주요 매개변수 {#key-parameters}

| 매개변수                            | 설명                                                                                                                                  |
|--------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `SNAPSHOT <label>`                   | 이 복원 작업의 Label로, `SHOW RESTORE`에서 작업을 식별하는 데 사용합니다.                                                                        |
| `FROM <repo>`                        | 백업이 저장된 Repository의 이름입니다.                                                                                       |
| `ON ( ... )`                         | 선택 사항입니다. 복원할 객체를 지정합니다. 테이블 이름, `PARTITION (...)` 절, 이름을 변경하는 `AS <new_name>` 절을 포함할 수 있습니다. 생략하면 스냅샷의 모든 객체를 복원합니다. |
| `PROPERTIES("backup_timestamp"=...)` | 필수 항목입니다. 복원할 스냅샷의 타임스탬프이며, `Timestamp` 열의 값에 해당합니다. 이 열은 `SHOW SNAPSHOT` 출력에서 확인할 수 있습니다.                |

## 3. 복원 작업의 진행 상황 확인 {#3-check-the-progress-of-a-restore-job}

`SHOW RESTORE`를 사용하여 현재 데이터베이스의 복원 작업 상태와 각 단계에 소요된 시간을 확인합니다:

```sql
    mysql> SHOW RESTORE\G;
    *************************** 1. row ***************************
                  JobId: 17891851
                  Label: snapshot_label1
              Timestamp: 2022-04-08-15-52-29
                  DbName: default_cluster:example_db1
                  State: FINISHED
              AllowLoad: false
          ReplicationNum: 3
            RestoreObjs: {
      "name": "snapshot_label1",
      "database": "example_db",
      "backup_time": 1649404349050,
      "content": "ALL",
      "olap_table_list": [
        {
          "name": "backup_tbl",
          "partition_names": [
            "p1",
            "p2"
          ]
        }
      ],
      "view_list": [],
      "odbc_table_list": [],
      "odbc_resource_list": []
    }
              CreateTime: 2022-04-08 15:59:01
        MetaPreparedTime: 2022-04-08 15:59:02
    SnapshotFinishedTime: 2022-04-08 15:59:05
    DownloadFinishedTime: 2022-04-08 15:59:12
            FinishedTime: 2022-04-08 15:59:18
        UnfinishedTasks:
                Progress:
              TaskErrMsg:
                  Status: [OK]
                Timeout: 86400
    1 row in set (0.01 sec)
```

주요 필드:

| 필드                              | 설명                                                                                                                              |
|------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| `JobId`                            | 복원 작업의 내부 ID입니다.                                                                                                      |
| `Label` / `Timestamp`              | 이 복원에 사용된 스냅샷의 Label과 백업 타임스탬프입니다.                                                                |
| `DbName`                           | 대상 데이터베이스입니다.                                                                                                                     |
| `State`                            | 작업의 현재 상태입니다. `FINISHED`는 복원이 성공했음을 의미합니다.                                                                    |
| `RestoreObjs`                      | 이 복원에 포함된 객체로, 테이블 이름, 파티션 목록, 뷰, 외부 테이블 등이 포함됩니다.                                  |
| `CreateTime` 및 기타 시간 필드 | 작업 생성, 메타데이터 준비, 스냅샷 가져오기, 다운로드 및 최종 완료 시점의 타임스탬프입니다. 병목 구간을 진단하는 데 사용합니다. |
| `Status`                           | 오류 상태입니다. `[OK]`는 오류가 없음을 의미합니다. 그 외의 경우 `TaskErrMsg`를 확인하여 원인을 진단합니다.                                                   |
| `Timeout`                          | 작업의 제한 시간으로, 단위는 초입니다.                                                                                                             |
