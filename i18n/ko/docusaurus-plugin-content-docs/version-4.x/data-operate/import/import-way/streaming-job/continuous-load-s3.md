---
{
    "title": "S3 데이터 적재 개요",
    "sidebar_label": "개요",
    "language": "ko",
    "description": "Doris Streaming Job을 사용한 순서 기반, 알림 기반 또는 일회성 S3 데이터 적재 방식을 선택하고 공통 옵션, 모니터링 및 작업 관리 가이드를 확인하세요.",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "개요"
    ]
}
---

:::caution 실험적 기능

Doris의 지속적 데이터 적재는 실험적 기능이며 Doris 4.1.5부터 지원됩니다.

:::

Doris는 **Streaming Job + S3 TVF**를 사용해 S3 파일을 기존 Doris 테이블에 배치 단위로 적재합니다. 파일이 도착하는 방식과 작업을 계속 실행해야 하는지에 따라 순서 기반, 알림 기반 또는 일회성 데이터 적재를 선택하세요. 알림 기반 및 일회성 데이터 적재는 Doris 4.1.6부터 지원됩니다.

## 데이터 적재 방식 선택 {#choose-an-ingestion-mode}

| 가이드 | 모드 | 사용 시점 | 완료 조건 |
| --- | --- | --- | --- |
| [순서 기반 데이터 적재](./continuous-load-s3-ordered.md) | `ORDERED_LIST`(기본값) | 타임스탬프나 앞자리를 영으로 채운 카운터처럼 키가 사전식 순서로 증가하는 경우 | 계속 실행되며 새 파일을 기다림 |
| [알림 기반 데이터 적재](./continuous-load-s3-notification.md) | `NOTIFICATION` | UUID 키를 사용하거나 파일이 순서 없이 도착하며, AWS S3 이벤트와 전용 SQS 큐를 통해 파일을 발견하는 경우 | 계속 실행되며 메시지를 기다림 |
| [일회성 데이터 적재](./continuous-load-s3-one-time.md) | `ONE_TIME` | 미리 준비된 고정 파일 집합 또는 독립적인 과거 데이터 보충 적재 | 마지막 배치가 커밋된 후 `FINISHED` 상태가 됨 |

알림 기반 데이터 적재는 기존 객체를 소급해서 적재하지 않으며, 알림이 반복되면 데이터가 중복 적재될 수 있습니다. 모든 모드에서 원본 객체는 적재하는 동안 읽을 수 있어야 하고 변경되어서는 안 됩니다. 위의 각 가이드에는 설정 방법, SQL 예제, 매개변수 및 제한 사항이 포함되어 있습니다.

## 관련 문서 {#related-documents}

- [Amazon S3 데이터 적재](../../data-source/amazon-s3.md): S3 Load 및 TVF + INSERT.
- [지속적 데이터 적재 개요](./continuous-load-overview.md): 작업과 태스크 조회, 일시 중지, 재개 및 삭제.
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md): 작업 생성 구문.
- [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md): 작업 수정 구문.
- [S3 TVF](../../../../sql-manual/sql-functions/table-valued-functions/s3.md): 연결, 자격 증명 및 파일 형식 옵션.
