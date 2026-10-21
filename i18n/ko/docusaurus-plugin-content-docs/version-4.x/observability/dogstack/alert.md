---
{
    "title": "경고 및 알림",
    "sidebar_label": "경고",
    "language": "ko",
    "description": "Apache Doris SQL을 기반으로 DOG Stack에서 경고를 만드는 방법을 알아봅니다. 이 문서에서는 Grafana Alerting 규칙 생성, 경고 조건, 레이블, 연락 지점, 경고 관리를 다룹니다.",
    "keywords": [
        "Grafana Alerting",
        "Doris 경고",
        "경고 규칙",
        "경고 알림",
        "경고 조건",
        "Webhook",
        "Slack 경고",
        "이메일 경고"
    ]
}
---

<!-- Knowledge type: operational steps -->
<!-- Applicable scenario: observability platform / alert rule configuration and management -->

DOG Stack에는 Grafana가 통합되어 있으므로 Grafana에서 직접 경고를 만들고 관리할 수 있습니다. 이 문서에서는 가장 일반적인 경고 관련 작업을 소개합니다. 고급 기능은 [Grafana Alerting 문서](https://grafana.com/docs/grafana/latest/alerting/)를 참고하세요.

그림에 나와 있듯이 Grafana Alert의 핵심 작동 방식은 다음과 같습니다.

1. 사용자가 기반 쿼리와 트리거 조건을 포함한 경고 규칙을 정의합니다.
2. 시스템이 규칙의 쿼리를 주기적으로 실행하고 트리거 조건을 평가합니다.
3. 트리거 조건이 충족되면 경고 인스턴스가 생성됩니다.
4. 경고가 연락 지점으로 직접 전송되거나 알림 정책에 따라 유연하게 라우팅됩니다.

![경고 개요](https://cdnd.selectdb.com/images/upload/dogstack/alert_overview.png)



일반적인 경고 규칙 생성 및 관리 절차는 다음과 같습니다.

**1. Grafana의 경고 → 경고 규칙으로 이동한 후 "경고 만들기"를 클릭합니다**

![경고 생성](https://cdnd.selectdb.com/images/upload/dogstack/alert_create.png)



**2. 쿼리와 트리거 조건을 정의합니다**

먼저 Doris와 같은 데이터 소스를 선택합니다. **빌더** 모드에서는 시각적 인터페이스를 클릭하여 간단한 쿼리를 구성할 수 있고, **코드** 모드에서는 SQL을 작성하여 더 복잡한 쿼리를 만들 수 있습니다. 이 예제에서는 **코드** 모드를 사용하여 최근 10분 동안 `otel.otel_logs`에서 `body` 필드가 키워드 `error`와 일치하는 행 수를 쿼리합니다.

다음으로 **표현식** 섹션에서 쿼리 결과를 추가로 집계하는 방식(선택 사항)을 선택하고 경고를 트리거할 임계값을 설정합니다. 이 예제에서는 임계값을 "result > 10"으로 설정하고 추가 집계는 적용하지 않습니다.

마지막으로 **미리 보기**를 클릭하여 쿼리 결과와 경고 발생 여부를 미리 확인합니다. 여기서는 쿼리가 반환한 값이 882로, 임계값인 10을 초과하므로 상태가 **1개 발생 중**으로 표시됩니다.

자세한 내용은 [Grafana 문서](https://grafana.com/docs/grafana/latest/alerting/alerting-rules/create-grafana-managed-rule/)를 참고하세요.

![경고 조건](https://cdnd.selectdb.com/images/upload/dogstack/alert_condition.png)



**3. 평가 주기와 경고 정리 방식을 구성합니다**

먼저 경고를 정리할 폴더를 선택한 다음 경고의 평가 주기를 설정하고 마지막으로 대기 시간을 선택합니다. 이 예제에서는 매분 실행되는 평가 그룹을 만들고 대기 시간을 없음으로 선택합니다. 즉, 조건이 일정 시간(예: 1분) 동안 유지될 때까지 기다리지 않고 조건이 충족되는 즉시 경고가 **발생 중** 상태로 전환됩니다.

자세한 내용은 [Grafana 문서](https://grafana.com/docs/grafana/latest/alerting/fundamentals/alert-rule-evaluation/)를 참고하세요.

![경고 평가](https://cdnd.selectdb.com/images/upload/dogstack/alert_evaluation.png)



**4. 알림 채널을 구성합니다**

Grafana는 이메일, Slack, Discord, PagerDuty, Webhook 등 다양한 알림 채널을 지원합니다. 기존 연락 지점을 선택하거나 직접 만들 수 있으며, 레이블에 따라 경고를 라우팅하는 유연한 알림 정책도 구성할 수 있습니다.

자세한 내용은 [Grafana 문서](https://grafana.com/docs/grafana/latest/alerting/fundamentals/notifications/)를 참고하세요.

![경고 레이블](https://cdnd.selectdb.com/images/upload/dogstack/alert_lable.png)

![경고 연락 지점](https://cdnd.selectdb.com/images/upload/dogstack/alert_contact.png)



**5. 알림 메시지를 구성합니다**

수신자가 상황을 더 빠르게 파악할 수 있도록 요약, 설명, 대응 방법을 안내하는 런북 URL 등 알림 내용을 사용자 지정할 수 있습니다.

![경고 메시지](https://cdnd.selectdb.com/images/upload/dogstack/alert_message.png)



**6. 경고 관리**

경고 규칙을 만든 후에는 경고 일시 중지, 일정 시간 동안 알림 음소거, 규칙 수정, 알림 채널 변경 등 다양한 관리 작업을 수행할 수 있습니다.

자세한 내용은 [Grafana 문서](https://grafana.com/docs/grafana/latest/alerting/monitor-status/)를 참고하세요.

![경고 관리](https://cdnd.selectdb.com/images/upload/dogstack/alert_management.png)
