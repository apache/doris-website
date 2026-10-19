---
{
    "title": "재해 복구 개요",
    "language": "ko",
    "description": "Doris의 재해 복구는 백업 및 복원과 휴지통을 결합하여 하드웨어 장애와 사용자 실수로 인한 데이터 손실 위험에 대응합니다.",
    "keywords": [
        "Doris disaster recovery",
        "disaster recovery management",
        "backup and restore",
        "Backup Restore",
        "recycle bin",
        "Recycle Bin",
        "data high availability",
        "accidental deletion recovery",
        "regional disaster recovery",
        "data snapshot"
    ]
}
---

<!-- Knowledge type: Capability overview / Architecture selection decision -->
<!-- Applicable scenarios: Disaster recovery planning / Data protection selection -->

Doris는 **하드웨어 장애, 소프트웨어 오류, 사용자 조작 실수**로 인한 데이터 손실 위험에 대응할 수 있도록 포괄적인 재해 복구 기능을 제공합니다. **백업 및 복원**과 **휴지통 복구**를 함께 사용하면 다양한 범위의 장애에 대비하여 데이터의 고가용성과 신뢰성을 확보할 수 있습니다.

## 적용 시나리오 {#applicable-scenarios}

재해 복구 기능마다 대응할 수 있는 장애 시나리오가 다릅니다. 비즈니스 요구 사항에 맞게 다음 기능을 조합하여 사용하세요.

| 기능 | 적용 시나리오 | 복구 단위 | 복구 속도 | 대표적인 사용 사례 |
| --- | --- | --- | --- | --- |
| 백업 및 복원 | 데이터 손상, 장기 보관, 마이그레이션 | 데이터베이스, 테이블, 파티션 | 수분에서 수시간(데이터 양에 따라 다름) | 주기적인 스냅샷 생성, 클러스터 간 마이그레이션, 규정 준수를 위한 보관 |
| 휴지통 복구 | 실수로 테이블이나 데이터베이스를 삭제하는 등 단기간 내에 발생한 사용자 실수 | 테이블, 데이터베이스 | 수초 | 실수로 삭제한 데이터 복구, 단기 보관 |

## 기능 비교 {#capability-comparison}

두 기능은 데이터 보호 수준, 운영 비용, 의존성 측면에서 다음과 같은 차이가 있습니다.

| 비교 항목 | 백업 및 복원 | 휴지통 복구 |
| --- | --- | --- |
| 데이터 기준 시점 | 주기적으로 생성한 스냅샷 | 삭제 시점의 데이터 보관 |
| 외부 의존성 | 객체 스토리지 또는 HDFS 등의 원격 스토리지 필요 | 없음(클러스터 내부에 로컬로 보관) |
| 보관 기간 | 백업 정책에 따라 보관 | 보관 기간 설정 가능, 만료 시 자동 정리 |
| 운영 비용 | 중간(주기적인 작업 + 스토리지 비용) | 낮음(기본적으로 활성화됨) |

## 1. 백업 및 복원 {#1-backup-and-restore}

Doris는 데이터 스냅샷을 주기적으로 저장하여 예기치 않은 상황으로 인한 데이터 손실을 방지하고, 데이터 마이그레이션과 장기 보관을 지원하는 백업 및 복원 기능을 제공합니다.

<!-- Knowledge type: Feature capability definition -->
<!-- Applicable scenarios: Periodic data protection / Cross-cluster migration / Compliance archiving -->

### 주요 기능 {#key-features}

- **백업**: 지정한 데이터베이스, 테이블 또는 파티션의 전체 백업을 지원하여 완전한 데이터 스냅샷을 저장합니다.
- **복원**: 스냅샷에서 데이터베이스, 테이블 또는 파티션을 복원할 수 있습니다.

### 시나리오 예시 {#example-scenario}

한 회사가 데이터를 주기적으로 백업하고 백업 파일을 객체 스토리지 서비스(예: Amazon S3)에 저장합니다. 중요한 테이블이 실수로 삭제되면 백업 기능을 통해 손실된 데이터를 신속하게 복원하여 비즈니스를 정상적으로 운영할 수 있습니다.

자세한 사용 방법은 [데이터 백업](./backup-restore/backup) 및 [데이터 복원](./backup-restore/restore)을 참조하세요.

## 2. 휴지통 복구 {#2-recycle-bin-recovery}

Doris는 최근에 삭제한 데이터를 빠르게 복구하고 조작 실수로 인한 영향을 줄일 수 있도록 휴지통 기능을 제공합니다.

<!-- Knowledge type: Feature capability definition -->
<!-- Applicable scenarios: Accidental deletion recovery / Short-term data retention -->

### 주요 기능 {#key-features-1}

- **임시 삭제**: 삭제한 테이블이나 데이터베이스는 즉시 영구 삭제되지 않고 먼저 휴지통으로 이동합니다.
- **보관 기간**: 삭제한 데이터는 설정된 기간 동안 휴지통에 보관되며, 이 기간 내에 복원할 수 있습니다.
- **빠른 복구**: 전체 백업 및 복원 절차를 거치지 않고도 휴지통에서 실수로 삭제한 데이터를 간편하게 복구할 수 있습니다.
- **데이터 안전성**: 복구할 필요가 없는 경우 휴지통의 데이터는 보관 기간이 지나면 자동으로 정리됩니다.

### 시나리오 예시 {#example-scenario-1}

한 팀이 일상적인 작업 중 실수로 중요한 테이블을 삭제했습니다. 휴지통 기능을 사용하면 복잡한 백업 및 복원 절차를 거치지 않고 삭제한 데이터를 빠르게 복구하여 비즈니스를 계속 운영할 수 있습니다.

자세한 사용 방법은 [휴지통](./recyclebin)을 참조하세요.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenarios: Disaster recovery solution selection / Data recovery operations -->

### 질문: 실수로 테이블을 삭제했습니다. 어떤 기능으로 복구해야 하나요? {#q-i-accidentally-dropped-a-table-which-feature-should-i-use-to-recover-it}

먼저 **휴지통 복구**를 사용하세요. 수초 내에 완료되며 외부 스토리지에 의존하지 않습니다. 보관 기간이 지났다면 **백업 및 복원**을 사용하여 가장 최근 스냅샷에서 복구하세요.

### 질문: 휴지통의 데이터는 영구적으로 보관되나요? {#q-does-data-in-the-recycle-bin-stay-there-forever}

아니요. 삭제한 데이터는 설정된 보관 기간 동안만 유지되며, 기간이 만료되면 자동으로 정리됩니다. 장기 보관이 필요하다면 백업 및 복원을 사용하세요.

### 질문: 백업 파일은 어디에 저장할 수 있나요? {#q-where-can-backup-files-be-stored}

백업 파일은 객체 스토리지(예: Amazon S3) 및 HDFS 등의 원격 스토리지에 저장할 수 있으므로, 원본 클러스터와 단일 장애 지점을 공유하는 문제를 피할 수 있습니다.
