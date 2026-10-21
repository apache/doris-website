---
{
    "title": "S3 수집 개요",
    "sidebar_label": "개요",
    "language": "ko",
    "description": "Doris Streaming Job을 사용한 순차 수집, 알림 기반 수집 또는 일회성 S3 수집 중에서 선택하세요. 공통 옵션, 모니터링 및 작업 관리 가이드도 제공합니다.",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "개요"
    ]
}
---

Doris는 **Streaming Job + S3 TVF**를 사용하여 S3 파일을 기존 Doris 테이블에 배치 단위로 수집합니다. 파일이 도착하는 방식과 작업을 계속 실행할지 여부에 따라 순차 수집, 알림 기반 수집 또는 일회성 수집을 선택하세요.

## 수집 모드 선택 {#choose-an-ingestion-mode}

| 가이드 | 모드 | 사용 시점 | 완료 동작 |
| --- | --- | --- | --- |
| [순차 수집](./continuous-load-s3-ordered.md) | `ORDERED_LIST` (기본값) | 타임스탬프나 앞자리를 영으로 채운 카운터처럼 키가 사전식 순서로 증가하는 경우 | 계속 실행되며 새 파일을 기다림 |
| [알림 기반 수집](./continuous-load-s3-notification.md) | `NOTIFICATION` | UUID 키를 사용하거나 파일이 임의의 순서로 도착하며, AWS S3 이벤트와 전용 SQS 큐를 통해 파일을 발견하는 경우 | 계속 실행되며 메시지를 기다림 |
| [일회성 수집](./continuous-load-s3-one-time.md) | `ONE_TIME` | 미리 준비된 정적 파일 집합을 수집하거나 별도로 백필을 수행하는 경우 | 마지막 배치가 커밋되면 `FINISHED` 상태로 전환 |

알림 기반 수집은 기존 객체를 백필하지 않으며, 알림이 반복되면 중복 수집이 발생할 수 있습니다. 모든 모드에서 수집 중에는 원본 객체를 계속 읽을 수 있어야 하며 객체가 변경되어서는 안 됩니다. 위의 각 가이드에는 설정, SQL 예제, 매개변수 및 제한 사항이 포함되어 있습니다.

## 관련 문서 {#related-documents}

- [Amazon S3 수집](../../data-source/amazon-s3.md): S3 Load 및 TVF + INSERT.
- [Continuous Load 개요](./continuous-load-overview.md): 작업 및 태스크 조회, 일시 중지, 재개 및 삭제.
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md): 작업 생성 구문.
- [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md): 작업 수정 구문.
- [S3 TVF](../../../../sql-manual/sql-functions/table-valued-functions/s3.md): 연결, 인증 정보 및 파일 형식 옵션.
