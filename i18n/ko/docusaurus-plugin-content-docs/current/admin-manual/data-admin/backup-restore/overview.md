---
{
    "title": "백업 및 복원 개요",
    "language": "ko",
    "description": "Doris의 백업 및 복원 기능을 사용하면 데이터베이스, 테이블 또는 파티션을 스냅샷으로 S3나 HDFS 등의 원격 스토리지에 저장하고, 필요할 때 원하는 Doris 클러스터에 복원할 수 있습니다.",
    "keywords": [
        "Doris backup and restore",
        "database backup",
        "snapshot",
        "Repository",
        "data migration",
        "disaster recovery",
        "BACKUP SNAPSHOT",
        "RESTORE"
    ]
}
---

<!-- Knowledge type: Feature overview -->
<!-- Applicable scenarios: Disaster recovery / Accidental deletion recovery / Cross-cluster migration / Test data preparation -->

Doris는 데이터베이스, 테이블 또는 파티션의 백업 및 복원을 지원합니다. 데이터를 스냅샷으로 원격 스토리지(S3, Azure, GCP, OSS, HDFS 등)에 저장하고, 필요할 때 원하는 Doris 클러스터에 복원할 수 있습니다.

## 활용 시나리오 {#applicable-scenarios}

| 시나리오 | 설명 | 권장 작업 |
| --- | --- | --- |
| 실수로 삭제한 데이터 복구 | 실수로 삭제한 테이블이나 파티션을 특정 시점의 상태로 복원해야 하는 경우 | [특정 테이블 또는 파티션 복원](./restore) |
| 재해 복구를 위한 정기 백업 | 클러스터 장애나 하드웨어 손상에 대비해 데이터베이스 전체를 정기적으로 백업하는 경우 | [데이터베이스 전체 백업](./backup) |
| 클러스터 간 데이터 마이그레이션 | 원본 클러스터에서 대상 클러스터로 데이터를 마이그레이션하는 경우 | [백업](./backup) 후 [복원](./restore) |
| 테스트 환경의 데이터 준비 | 운영 환경의 특정 테이블이나 파티션을 테스트 클러스터에 복원하는 경우 | [특정 테이블 백업](./backup) 후 [복원](./restore) |
| 증분 백업과 유사한 백업 | 새로 추가되거나 변경된 파티션만 백업하여 증분 백업과 유사한 효과를 얻는 경우 | [특정 파티션 백업](./backup) |

## 핵심 개념 {#core-concepts}

<!-- Knowledge type: Concept definition -->

| 개념 | 정의 |
| --- | --- |
| 스냅샷 | 데이터베이스, 테이블 또는 파티션의 특정 시점 데이터를 캡처한 것입니다. 생성 시 스냅샷 레이블을 지정해야 하며, 완료 시 타임스탬프가 생성됩니다. 스냅샷은 Repository, 레이블, 타임스탬프의 조합으로 고유하게 식별됩니다. |
| Repository | 백업 파일이 저장되는 원격 위치입니다. S3, Azure, GCP, OSS, COS, MinIO, HDFS 및 기타 S3 호환 스토리지를 지원합니다. |
| 백업 작업 | 대상 객체의 스냅샷을 생성하고, 스냅샷 파일을 Repository에 업로드한 뒤 관련 메타데이터를 저장합니다. |
| 복원 작업 | Repository에서 스냅샷을 다운로드하여 대상 Doris 클러스터에 복원합니다. |

## 사전 요구 사항 {#prerequisites}

- **권한**: 작업을 실행하는 계정에 **ADMIN** 권한이 있어야 합니다.
- **배포 모드**: 스토리지와 컴퓨팅이 통합된 모드만 지원합니다. 백업 및 복원은 **스토리지와 컴퓨팅이 분리된 모드에서 지원되지 않습니다**.

## 제한 사항 {#limitations}

| 제한 사항 | 설명 |
| --- | --- |
| 스토리지와 컴퓨팅이 분리된 모드 미지원 | 스토리지와 컴퓨팅이 분리된 배포 모드에서는 백업 및 복원을 사용할 수 없습니다. |
| 비동기 구체화된 뷰(MTMV) 미지원 | 비동기 구체화된 뷰는 백업에 포함되지 않으며, 복원 후 수동으로 다시 생성해야 합니다. |
| 스토리지 정책을 사용하는 테이블 미지원 | [스토리지 정책](../../../table-design/tiered-storage/remote-storage)을 사용하는 테이블은 백업 및 복원을 지원하지 않습니다. |
| 전체 백업만 지원 | 현재 증분 백업은 지원하지 않습니다. 특정 파티션을 백업하여 증분 백업과 유사한 효과를 얻을 수 있습니다. |
| `colocate_with` 속성이 유지되지 않음 | 복원 후에는 함께 배치된 테이블의 `colocate_with` 속성을 다시 설정해야 합니다. |
| 동적 파티션을 수동으로 활성화해야 함 | 복원 후 `ALTER TABLE`을 사용하여 동적 파티션 속성을 수동으로 활성화해야 합니다. |
| 동시 실행 작업 수 제한 | 동일한 데이터베이스에서는 한 번에 하나의 백업 또는 복원 작업만 실행할 수 있습니다. |

## 작업 가이드 {#operation-guides}

- [백업](./backup): Repository를 생성하고 데이터베이스, 테이블 또는 파티션의 전체 백업을 수행합니다.
- [복원](./restore): Repository의 스냅샷에서 데이터베이스, 테이블 또는 파티션을 대상 클러스터에 복원합니다.
