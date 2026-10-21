---
{
    "title": "백업",
    "language": "ko",
    "description": "Doris의 백업 기능을 사용하면 데이터베이스, 테이블 또는 파티션을 스냅샷으로 만들어 S3, Azure, GCP, OSS, MinIO, HDFS 등의 원격 스토리지에 백업할 수 있습니다. 이 가이드에서는 전체 절차를 설명합니다.",
    "keywords": [
        "Doris backup",
        "BACKUP SNAPSHOT",
        "CREATE REPOSITORY",
        "data backup",
        "full backup",
        "snapshot",
        "Repository",
        "S3 backup",
        "Azure backup",
        "HDFS backup",
        "OSS backup",
        "MinIO backup",
        "GCP backup",
        "partition backup",
        "database backup",
        "show backup",
        "cancel backup"
    ]
}
---

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Data backup / Disaster recovery setup / Cross-cluster migration -->

Doris는 데이터베이스, 테이블 또는 파티션을 스냅샷으로 만들어 원격 스토리지 시스템에 백업하고, 필요할 때 [복원](./restore)할 수 있는 기능을 제공합니다. 이 문서는 정기 백업, 재해 복구 훈련 또는 클러스터 간 데이터 마이그레이션을 수행하는 DBA와 운영 엔지니어를 대상으로 합니다. 백업의 주요 개념, 사전 요구 사항 및 전체 작업 절차를 설명합니다.

## 활용 시나리오 {#applicable-scenarios}

| 시나리오 | 설명 |
| --- | --- |
| 정기 데이터 백업 | 데이터베이스, 테이블 또는 파티션의 전체 백업을 주기적으로 수행하여 실수로 인한 삭제나 하드웨어 장애로 발생하는 데이터 손실을 방지합니다. |
| 재해 복구 | 클러스터 전체에 장애가 발생했을 때 복구할 수 있도록 백업을 외부 원격 스토리지(S3, HDFS 등)에 저장합니다. |
| 클러스터 간 데이터 마이그레이션 | 원본 클러스터에서 백업하고 대상 클러스터에서 복원하여 클러스터 간에 데이터를 마이그레이션합니다. |
| 테스트 환경용 데이터 준비 | 운영 환경의 일부 테이블이나 파티션을 백업하여 테스트 클러스터에 복원합니다. |
| 증분 백업과 유사한 방식 | 새로 추가되거나 변경된 파티션만 백업하여 증분 백업과 유사하게 동작하도록 합니다(Doris는 아직 기본 증분 백업 기능을 지원하지 않습니다). |

## 사전 요구 사항 {#prerequisites}

백업 작업을 수행하기 전에 다음 조건을 충족하는지 확인합니다.

- **권한**: 작업을 수행하는 계정에 **ADMIN** 권한이 있어야 합니다(백업과 복원 모두에 필요).
- **배포 모드**: 현재 클러스터가 컴퓨팅-스토리지 결합 모드여야 합니다(**컴퓨팅-스토리지 분리 모드에서는** 백업/복원을 **지원하지 않습니다**).
- **원격 스토리지**: 접근 가능한 원격 스토리지 시스템(S3, Azure, GCP, OSS, COS, MinIO, HDFS 또는 기타 S3 호환 객체 스토리지)이 준비되어 있고, 해당 접근 자격 증명을 확보해야 합니다.
- **네트워크 연결**: FE와 BE 노드 모두 원격 스토리지 엔드포인트에 접근할 수 있어야 합니다.
- **백업 대상 제한**: 백업할 객체가 다음의 지원되지 않는 유형에 해당하지 않아야 합니다.
    - 비동기 구체화된 뷰(MTMV)
    - [스토리지 정책](../../../table-design/tiered-storage/remote-storage)을 사용하는 테이블

## 주요 개념 {#key-concepts}

| 개념 | 정의 |
| --- | --- |
| 스냅샷 | 특정 시점의 데이터베이스, 테이블 또는 파티션 데이터를 캡처한 것입니다. 스냅샷을 생성할 때는 스냅샷 Label을 지정해야 하며, 스냅샷 생성이 완료되면 타임스탬프가 생성됩니다. 스냅샷은 Repository, 스냅샷 Label, 타임스탬프의 조합으로 고유하게 식별됩니다. |
| Repository | 백업 파일이 저장되는 원격 위치입니다. S3, Azure, GCP, OSS, COS, MinIO, HDFS 및 기타 S3 호환 객체 스토리지를 지원합니다. |
| 백업 작업 | 데이터베이스, 테이블 또는 파티션의 스냅샷을 생성하고, 스냅샷 파일을 원격 Repository에 업로드하며, 백업 관련 메타데이터를 저장합니다. |
| 복원 작업 | 원격 Repository에서 스냅샷을 다운로드하여 Doris 클러스터에 복원합니다. |

## 사용 제한 사항 {#usage-limitations}

| 제한 사항 | 설명 |
| --- | --- |
| 컴퓨팅-스토리지 분리 모드 미지원 | 스토리지와 컴퓨팅이 분리된 배포 모드에서는 백업 및 복원 기능을 사용할 수 없습니다. |
| 비동기 구체화된 뷰(MTMV) 미지원 | 백업 및 복원 작업에는 비동기 구체화된 뷰가 포함되지 않습니다. |
| 스토리지 정책이 적용된 테이블 미지원 | [스토리지 정책](../../../table-design/tiered-storage/remote-storage)을 사용하는 테이블은 백업 및 복원 작업을 지원하지 않습니다. |
| 전체 백업만 지원 | Doris는 현재 전체 백업만 지원합니다. 증분 백업(마지막 백업 이후 변경된 데이터만 저장)은 아직 지원하지 않습니다. 특정 파티션을 백업하면 증분 백업과 유사하게 동작하도록 할 수 있습니다. |
| `colocate_with` 속성 유지 안 됨 | 백업 또는 복원 작업 중에 Doris는 테이블의 `colocate_with` 속성을 유지하지 않습니다. 복원 후 colocate 테이블을 다시 구성해야 할 수 있습니다. |
| 동적 파티셔닝 재활성화 필요 | 테이블을 복원한 후에는 `ALTER TABLE` 명령을 사용하여 동적 파티셔닝 속성을 수동으로 활성화해야 합니다. |
| 동시 실행 제한 | 하나의 데이터베이스에서는 한 번에 하나의 백업 또는 복원 작업만 실행할 수 있습니다. |

## 백업 절차 개요 {#backup-workflow-overview}

전체 백업 절차는 다음 5단계로 구성됩니다.

1. **Repository 생성**: Doris에 원격 스토리지 위치를 등록합니다.
2. **백업 수행**: `BACKUP SNAPSHOT`으로 백업 작업을 시작합니다.
3. **백업 진행 상황 확인**: `SHOW BACKUP`으로 작업 실행 상태를 확인합니다.
4. **Repository에 저장된 스냅샷 확인**: `SHOW SNAPSHOT`으로 사용 가능한 백업 목록을 조회합니다.
5. **(선택 사항) 백업 취소**: 예외가 발생하면 `CANCEL BACKUP`으로 작업을 종료합니다.

다음 절에서는 각 단계를 순서대로 설명합니다.

## 1단계: Repository 생성 {#step-1-create-a-repository}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Remote storage integration / Backup preparation -->

<!--
suites/backup_restore/test_create_and_drop_repository.groovy
-->

사용하는 원격 스토리지 유형에 맞는 Repository 생성문을 선택합니다. 자세한 사용법은 [CREATE REPOSITORY](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY)를 참조하세요.

:::tip
서로 다른 클러스터에서 경로가 같은 Repository를 사용하여 백업하는 경우, 경로 충돌과 데이터 손상을 방지하기 위해 반드시 서로 다른 Label을 사용하세요.
:::

원격 스토리지 유형별 Repository 생성 방법은 다음과 같습니다.

| 방법 | 원격 스토리지 | 참고 사항 |
| --- | --- | --- |
| 방법 1 | S3 | AWS S3 또는 S3 호환 객체 스토리지 |
| 방법 2 | Azure Blob Storage | Doris 3.1.3부터 지원 |
| 방법 3 | GCP (Google Cloud Storage) | 더미 `s3.region`을 지정해야 함 |
| 방법 4 | OSS (Alibaba Cloud Object Storage) | 없음 |
| 방법 5 | MinIO | Virtual Host-style을 활성화하지 않은 경우 `use_path_style=true` 필요 |
| 방법 6 | HDFS | 없음 |

### 방법 1: S3에 Repository 생성 {#method-1-create-a-repository-on-s3}

AWS S3에 Repository를 생성합니다.

```sql
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://bucket_name/s3_repo"
PROPERTIES
(
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk"
);
```

참고 사항:

- `bucket_name`을 S3 버킷 이름으로 바꿉니다.
- S3 설정에 맞는 `endpoint`, `access key`, `secret key`, `region`을 입력합니다.

### 방법 2: Azure에 Repository 생성 {#method-2-create-a-repository-on-azure}

**Doris 3.1.3부터 지원합니다.**

Azure Blob Storage에 Repository를 생성합니다.

```sql
CREATE REPOSITORY `azure_repo`
WITH S3
ON LOCATION "s3://<container_name>/azure_repo"
PROPERTIES
(
    "azure.endpoint" = "https://<account_name>.blob.core.windows.net",
    "azure.account_name" = "<account_name>",
    "azure.account_key" = "<account_key>",
    "provider" = "AZURE"
);
```

참고 사항:

- `<container_name>`을 Azure 컨테이너 이름으로 바꿉니다.
- 인증에 사용할 Azure 스토리지 계정과 키를 입력합니다.
- `provider`는 반드시 `AZURE`여야 합니다.

### 방법 3: GCP에 Repository 생성 {#method-3-create-a-repository-on-gcp}

Google Cloud Platform (GCP) 스토리지에 Repository를 생성합니다.

```sql
CREATE REPOSITORY `gcp_repo`
WITH S3
ON LOCATION "s3://bucket_name/backup/gcp_repo"
PROPERTIES
(
    "s3.endpoint" = "storage.googleapis.com",
    "s3.region" = "US-WEST2",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk"
);
```

참고 사항:

- `bucket_name`을 GCP 버킷 이름으로 바꿉니다.
- GCP의 `endpoint`, `access key`, `secret key`를 입력합니다.
- `s3.region`은 더미 리전입니다. 어떤 값이든 사용할 수 있지만 반드시 지정해야 합니다.

### 방법 4: OSS (Alibaba Cloud Object Storage Service)에 Repository 생성 {#method-4-create-a-repository-on-oss-alibaba-cloud-object-storage-service}

OSS에 Repository를 생성합니다.

```sql
CREATE REPOSITORY `oss_repo`
WITH S3
ON LOCATION "s3://bucket_name/oss_repo"
PROPERTIES
(
    "s3.endpoint" = "oss.aliyuncs.com",
    "s3.region" = "cn-hangzhou",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk"
);
```

참고 사항:

- `bucket_name`을 OSS 버킷 이름으로 바꿉니다.
- OSS의 `endpoint`, `region`, `access key`, `secret key`를 입력합니다.

### 방법 5: MinIO에 Repository 생성 {#method-5-create-a-repository-on-minio}

MinIO 스토리지에 Repository를 생성합니다.

```sql
CREATE REPOSITORY `minio_repo`
WITH S3
ON LOCATION "s3://bucket_name/minio_repo"
PROPERTIES
(
    "s3.endpoint" = "yourminio.com",
    "s3.region" = "dummy-region",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "use_path_style" = "true"
);
```

참고 사항:

- `bucket_name`을 MinIO 버킷 이름으로 바꿉니다.
- MinIO의 `endpoint`, `access key`, `secret key`를 입력합니다.
- `s3.region`은 더미 리전입니다. 어떤 값이든 사용할 수 있지만 반드시 지정해야 합니다.
- Virtual Host-style을 활성화하지 않은 경우 `use_path_style`을 반드시 `true`로 설정해야 합니다.

### 방법 6: HDFS에 Repository 생성 {#method-6-create-a-repository-on-hdfs}

HDFS에 Repository를 생성합니다.

```sql
CREATE REPOSITORY `hdfs_repo`
WITH hdfs
ON LOCATION "hdfs://127.0.0.1:9000/prefix_path/hdfs_repo"
PROPERTIES
(
    "fs.defaultFS" = "hdfs://127.0.0.1:9000",
    "hadoop.username" = "doris-test"
)
```

참고 사항:

- `prefix_path`를 실제 경로로 바꿉니다.
- HDFS의 `endpoint`와 사용자 이름을 입력합니다.

## 2단계: 백업 수행 {#step-2-perform-the-backup}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Database/table/partition backup -->

`BACKUP SNAPSHOT`으로 백업 작업을 시작합니다. 자세한 사용법은 [BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP)을 참조하세요.

:::tip
나중에 백업을 쉽게 식별하고 관리할 수 있도록, 백업에 포함된 데이터베이스와 테이블 이름을 넣는 등 의미 있는 Label 이름을 사용하는 것이 좋습니다.
:::

백업 대상에 따라 다음과 같은 방식을 선택할 수 있습니다.

| 방법 | 백업 대상 | 활용 시나리오 |
| --- | --- | --- |
| 방법 1 | 현재 데이터베이스 | 현재 `USE`로 선택한 데이터베이스 전체 백업 |
| 방법 2 | 지정한 데이터베이스 | 데이터베이스 이름을 명시적으로 지정하여 데이터베이스 전체 백업 |
| 방법 3 | 지정한 테이블 | 특정 테이블만 백업 |
| 방법 4 | 지정한 파티션 | 테이블의 특정 파티션을 백업하며, 전체 테이블과 함께 지정 가능 |
| 방법 5 | 특정 테이블 제외 | 지정한 테이블을 제외하고 데이터베이스 전체 백업 |

### 방법 1: 현재 데이터베이스 백업 {#method-1-back-up-the-current-database}

다음 SQL 문은 현재 데이터베이스를 `example_repo`라는 Repository에 백업하며, 스냅샷 Label로 `exampledb_20241225`를 사용합니다.

```sql
BACKUP SNAPSHOT exampledb_20241225
TO example_repo;
```

### 방법 2: 지정한 데이터베이스 백업 {#method-2-back-up-a-specified-database}

다음 SQL 문은 `destdb`라는 데이터베이스를 `example_repo`라는 Repository에 백업하며, 스냅샷 Label로 `destdb_20241225`를 사용합니다.

```sql
BACKUP SNAPSHOT destdb.`destdb_20241225`
TO example_repo;
```

### 방법 3: 지정한 테이블 백업 {#method-3-back-up-specified-tables}

다음 SQL 문은 두 테이블을 `example_repo`라는 Repository에 백업하며, 스냅샷 Label로 `exampledb_tbl_tbl1_20241225`를 사용합니다.

```sql
BACKUP SNAPSHOT exampledb_tbl_tbl1_20241225
TO example_repo
ON (example_tbl, example_tbl1);
```

### 방법 4: 지정한 파티션 백업 {#method-4-back-up-specified-partitions}

다음 SQL 문은 `example_tbl2` 테이블과 `p1`, `p2` 파티션(`example_tbl` 테이블에 속함)을 `example_repo`라는 Repository에 백업하며, 스냅샷 Label로 `example_tbl_p1_p2_tbl1_20241225`를 사용합니다.

```sql
BACKUP SNAPSHOT example_tbl_p1_p2_tbl1_20241225
TO example_repo
ON
(
      example_tbl PARTITION (p1,p2),
      example_tbl2
);
```

### 방법 5: 특정 테이블을 제외하고 현재 데이터베이스 백업 {#method-5-back-up-the-current-database-excluding-certain-tables}

다음 SQL 문은 현재 데이터베이스를 `example_repo`라는 Repository에 백업하며, 스냅샷 Label로 `exampledb_20241225`를 사용하고 `example_tbl`과 `example_tbl1`이라는 두 테이블은 제외합니다.

```sql
BACKUP SNAPSHOT exampledb_20241225
TO example_repo
EXCLUDE
(
      example_tbl,
      example_tbl1
);
```

## 3단계: 최근 백업 작업의 실행 상태 확인 {#step-3-view-the-execution-status-of-recent-backup-jobs}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Backup progress tracking / Troubleshooting -->

다음 SQL로 최근 백업 작업의 실행 상태를 확인합니다.

```sql
mysql> show BACKUP\G;
*************************** 1. row ***************************
                  JobId: 17891847
           SnapshotName: exampledb_20241225
                 DbName: example_db
                  State: FINISHED
             BackupObjs: [example_db.example_tbl]
             CreateTime: 2022-04-08 15:52:29
   SnapshotFinishedTime: 2022-04-08 15:52:32
     UploadFinishedTime: 2022-04-08 15:52:38
           FinishedTime: 2022-04-08 15:52:44
        UnfinishedTasks:
               Progress:
             TaskErrMsg:
                 Status: [OK]
                Timeout: 86400
   1 row in set (0.01 sec)
```

주요 필드 설명:

| 필드 | 의미 |
| --- | --- |
| `JobId` | 백업 작업 ID입니다. |
| `SnapshotName` | 스냅샷 Label로, `BACKUP SNAPSHOT`에서 지정한 이름에 해당합니다. |
| `DbName` | 백업이 속한 데이터베이스입니다. |
| `State` | 작업 상태입니다. 예를 들어 `FINISHED`는 완료를 나타냅니다. |
| `BackupObjs` | 실제로 백업한 객체 목록입니다. |
| `CreateTime` / `SnapshotFinishedTime` / `UploadFinishedTime` / `FinishedTime` | 각각 작업 생성, 스냅샷 생성 완료, 업로드 완료, 전체 작업 완료 시점의 타임스탬프입니다. |
| `Status` | 작업 결과 상태입니다. `[OK]`는 성공을 나타내며, 그 외의 경우에는 오류 정보가 포함됩니다. |
| `Timeout` | 작업 제한 시간입니다(초 단위). |

## 4단계: Repository에 저장된 백업 확인 {#step-4-view-existing-backups-in-the-repository}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Backup inventory / Pre-restore verification -->

다음 SQL로 `example_repo`라는 Repository에 저장된 백업을 확인합니다. `Snapshot` 열은 스냅샷 Label이고, `Timestamp`는 타임스탬프입니다.

```sql
mysql> SHOW SNAPSHOT ON example_repo;
+-----------------+---------------------+--------+
| Snapshot        | Timestamp           | Status |
+-----------------+---------------------+--------+
| exampledb_20241225 | 2022-04-08-15-52-29 | OK     |
+-----------------+---------------------+--------+
1 row in set (0.15 sec)
```

[복원](./restore) 작업을 수행할 때는 `Snapshot`과 `Timestamp`를 조합하여 백업 버전을 고유하게 식별해야 합니다.

## 5단계: 백업 취소(필요한 경우) {#step-5-cancel-a-backup-if-needed}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Abnormal termination / Rolling back accidental operations -->

백업 작업에서 예외가 발생하거나 작업을 중단해야 하는 경우, 다음 SQL로 해당 데이터베이스에서 실행 중인 백업 작업을 취소합니다.

```sql
CANCEL BACKUP FROM db_name;
```

자세한 사용법은 [CANCEL BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-BACKUP)을 참조하세요.

## 자주 묻는 질문 {#faq}

### 질문: Repository 생성에 실패하면 어떻게 해야 하나요? {#q-what-should-i-do-if-creating-a-repository-fails}

일반적으로 원격 스토리지 자격 증명이 잘못되었거나, Endpoint에 접근할 수 없거나, Bucket/컨테이너가 존재하지 않을 때 발생합니다. `endpoint`, `access key`, `secret key`, Bucket 이름이 올바른지 확인하고, FE/BE 노드에서 원격 스토리지에 접근할 수 있는지 확인하세요.

### 질문: MinIO 백업에 실패하면 어떻게 해야 하나요? {#q-what-should-i-do-if-backups-to-minio-fail}

일반적으로 Virtual Host-style을 활성화하지 않은 상태에서 `use_path_style` 매개변수를 누락하면 발생합니다. `"use_path_style" = "true"`를 `PROPERTIES`에 추가하세요.

### 질문: GCP/MinIO에서 리전이 누락되었다는 오류가 발생하면 어떻게 해야 하나요? {#q-what-should-i-do-if-gcpminio-reports-a-missing-region-error}

`s3.region`은 반드시 지정해야 하며, `dummy-region`과 같은 임의의 값을 사용해도 됩니다.

### 질문: Azure Repository 생성에 실패하면 어떻게 해야 하나요? {#q-what-should-i-do-if-creating-an-azure-repository-fails}

Doris 3.1.3 이전 버전에서는 Azure Blob Storage를 지원하지 않습니다. Doris 3.1.3 이상으로 업그레이드하고, `provider = AZURE`인지 확인하세요.

### 질문: 같은 데이터베이스 내에서 백업/복원 충돌이 발생하면 어떻게 해야 하나요? {#q-what-should-i-do-if-a-backuprestore-conflict-is-reported-within-the-same-database}

하나의 데이터베이스에서는 한 번에 하나의 백업 또는 복원 작업만 실행할 수 있습니다. 기존 작업이 완료될 때까지 기다리거나, `CANCEL BACKUP FROM db_name;`으로 취소한 후 새 작업을 시작하세요.

### 질문: 컴퓨팅-스토리지 분리 클러스터에서 백업을 수행할 수 없으면 어떻게 해야 하나요? {#q-what-should-i-do-if-a-compute-storage-decoupled-cluster-cannot-perform-backups}

컴퓨팅-스토리지 분리 모드에서는 백업/복원을 지원하지 않습니다. 컴퓨팅-스토리지 결합 모드로 전환하거나 다른 데이터 내보내기 방식을 사용하세요.

### 질문: 구체화된 뷰가 백업되지 않은 이유는 무엇인가요? {#q-why-was-the-materialized-view-not-backed-up}

비동기 구체화된 뷰(MTMV)는 백업 대상에 포함되지 않습니다. 복원 후 대상 클러스터에서 해당 구체화된 뷰를 다시 생성해야 합니다.

### 질문: 서로 다른 클러스터가 같은 경로에 백업할 때 발생하는 데이터 손상을 어떻게 해결하나요? {#q-how-do-i-resolve-data-corruption-when-different-clusters-back-up-to-the-same-path}

같은 스냅샷 Label을 사용하면 경로가 충돌하여 데이터 손상이 발생합니다. 서로 다른 클러스터에서 같은 Repository 경로에 백업할 때는 서로 다른 Label을 사용하세요.

### 질문: 복원 후 동적 파티셔닝이 적용되지 않는 이유는 무엇인가요? {#q-why-is-dynamic-partitioning-not-effective-after-restoration}

백업/복원은 동적 파티셔닝을 자동으로 활성화하지 않습니다. 복원 후 `ALTER TABLE`을 사용하여 동적 파티셔닝 속성을 수동으로 활성화하세요.

### 질문: 복원 후 colocate 테이블이 비정상적으로 동작하면 어떻게 해야 하나요? {#q-what-should-i-do-if-colocate-tables-behave-abnormally-after-restoration}

백업/복원은 `colocate_with` 속성을 유지하지 않습니다. 복원 후 colocate 테이블의 `colocate_with` 속성을 다시 구성하세요.

## 관련 문서 {#related-documents}

- [복원](./restore)
- [CREATE REPOSITORY](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY)
- [BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP)
- [CANCEL BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-BACKUP)
- [SHOW SNAPSHOT](../../../sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-SNAPSHOT)
- [SHOW REPOSITORIES](../../../sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-REPOSITORIES)
- [스토리지 정책](../../../table-design/tiered-storage/remote-storage)
