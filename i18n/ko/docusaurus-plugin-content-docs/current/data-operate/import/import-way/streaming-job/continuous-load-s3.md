---
{
    "title": "S3 데이터 적재 개요",
    "sidebar_label": "개요",
    "language": "ko",
    "description": "Doris Streaming Job으로 순서 기반, 알림 기반 또는 일회성 S3 데이터 적재를 선택하고, 공통 옵션, 모니터링 및 작업 관리 가이드를 제공합니다.",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "개요"
    ]
}
---

:::caution 실험적 기능

Doris 연속 데이터 적재는 실험적 기능이며 Doris 4.1.5부터 지원됩니다.

:::

Doris는 **Streaming Job + S3 TVF**를 사용하여 S3 파일을 기존 Doris 테이블에 배치 단위로 적재합니다. 파일 도착 방식과 작업을 계속 실행할지 여부에 따라 순서 기반, 알림 기반 또는 일회성 데이터 적재를 선택합니다. 알림 기반 및 일회성 데이터 적재는 Doris 4.1.6부터 지원됩니다.

## 데이터 적재 모드 선택 {#choose-an-ingestion-mode}

| 가이드 | 모드 | 사용 시점 | 완료 조건 |
| --- | --- | --- | --- |
| [순서 기반 데이터 적재](./continuous-load-s3-ordered.md) | `ORDERED_LIST` (기본값) | 키가 사전순으로 증가하는 경우(예: 타임스탬프 또는 앞자리를 채운 카운터) | 지속적으로 실행되며 새 파일을 기다립니다 |
| [알림 기반 데이터 적재](./continuous-load-s3-notification.md) | `NOTIFICATION` | UUID 키를 사용하거나 임의의 순서로 도착하는 파일을 AWS S3 이벤트와 전용 SQS 대기열을 통해 발견하는 경우 | 지속적으로 실행되며 메시지를 기다립니다 |
| [일회성 데이터 적재](./continuous-load-s3-one-time.md) | `ONE_TIME` | 미리 준비된 정적 파일 집합 또는 독립적인 백필 | 최종 배치가 커밋된 후 `FINISHED` 상태로 전환됩니다 |

알림 기반 데이터 적재는 과거 객체를 백필하지 않으며, 알림이 반복되면 데이터가 중복 적재될 수 있습니다. 모든 모드에서는 데이터 적재 중 소스 객체를 읽을 수 있고 변경되지 않은 상태로 유지해야 합니다. 위 각 가이드에는 설정, SQL 예시, 매개변수 및 제한 사항이 포함되어 있습니다.

## 관련 문서 {#related-documents}

- [Amazon S3 데이터 적재](../../data-source/amazon-s3.md): S3 Load 및 TVF + INSERT.
- [연속 데이터 적재 개요](./continuous-load-overview.md): 작업 및 Task 조회, 일시 중지, 재개 및 삭제.
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md): 작업 생성 구문.
- [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md): 작업 수정 구문.
- [S3 TVF](../../../../sql-manual/sql-functions/table-valued-functions/s3.md): 연결, 자격 증명 및 파일 형식 옵션.
