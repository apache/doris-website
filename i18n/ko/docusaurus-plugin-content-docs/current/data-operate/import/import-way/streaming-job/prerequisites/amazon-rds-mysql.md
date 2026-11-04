---
{
    "title": "Amazon RDS MySQL",
    "language": "ko",
    "description": "Amazon RDS MySQL에서 Binlog를 활성화하고 파라미터 그룹을 구성하며 동기화 사용자를 생성하여 Doris 스트리밍 수집의 사전 요구 사항을 충족하는 방법을 설명합니다.",
    "keywords": [
        "Amazon RDS MySQL",
        "Doris 스트리밍 수집",
        "MySQL Binlog",
        "binlog_format ROW",
        "binlog_row_image FULL",
        "RDS 파라미터 그룹",
        "binlog retention hours",
        "CDC 동기화"
    ]
}
---

:::caution 실험적 기능

Doris 지속적 데이터 적재는 실험적 기능이며 Doris 4.1.5부터 지원됩니다.

:::

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Pre-deployment check / Environment configuration -->

Doris 스트리밍 수집은 Amazon RDS MySQL의 데이터 동기화를 지원합니다. 호환되는 버전은 **MySQL 5.6, 5.7, 8.0.x**입니다. 동기화 작업을 시작하기 전에 RDS 인스턴스에서 Binlog가 활성화되어 있고 변경 로그가 올바른 형식으로 기록되는지 확인해야 합니다.

이 문서는 Amazon RDS MySQL의 데이터를 스트리밍 수집(CDC)을 통해 Doris로 동기화해야 하는 사용자를 대상으로 하며, 시나리오 순서에 따라 모든 사전 구성을 안내합니다.

## 사전 요구 사항 체크리스트 {#prerequisite-checklist}

시작하기 전에 다음 조건을 확인하세요.

| 점검 항목 | 예상 값 | 설명 |
| --- | --- | --- |
| `log_bin` | `ON` | Binlog가 활성화됨 |
| `binlog_format` | `ROW` | 행 모드로 변경 사항이 기록됨 |
| `binlog_row_image` | `FULL` | 전체 행 이미지가 기록됨 |
| 동기화 사용자 | 생성됨 | `SELECT`, `REPLICATION SLAVE`, `REPLICATION CLIENT` 권한을 보유함 |
| Binlog 보존 기간 | 최소 72시간 | 동기화를 중단시킬 수 있는 로그 조기 정리를 방지함 |

위 항목 중 하나라도 충족되지 않으면 아래 단계에 따라 하나씩 구성하세요.

## 1단계: 현재 Binlog 구성 확인 {#step-1-check-the-current-binlog-configuration}

**목적**: RDS 인스턴스의 현재 Binlog 상태를 확인하고 파라미터 그룹을 수정해야 하는지 결정합니다.

RDS 인스턴스에 연결한 후 다음 SQL을 실행합니다.

```sql
-- Check if binlog is enabled
SHOW VARIABLES LIKE 'log_bin';

-- Check binlog format
SHOW VARIABLES LIKE 'binlog_format';

-- Check binlog row image
SHOW VARIABLES LIKE 'binlog_row_image';
```

**결과 해석 방법**:

-   `log_bin = ON`, `binlog_format = ROW`, `binlog_row_image = FULL`이면 추가 구성이 필요 없으므로 [4단계: 동기화 사용자 생성](#step-4-create-a-sync-user)으로 바로 건너뛸 수 있습니다.
-   이 중 하나라도 충족되지 않으면 2단계와 3단계를 계속 진행하세요.

## 2단계: 파라미터 그룹 생성 및 구성 {#step-2-create-and-configure-a-parameter-group}

**목적**: AWS 콘솔에서 사용자 지정 파라미터 그룹을 생성하고 Binlog 관련 파라미터를 Doris 스트리밍 수집에 필요한 값으로 조정합니다.

단계는 다음과 같습니다.

1.  [AWS RDS 콘솔](https://console.aws.amazon.com/rds/)에 로그인합니다.
2.  왼쪽 탐색 창에서 **Parameter groups**를 선택하고 **Create parameter group**을 클릭합니다.
3.  해당 MySQL 버전 패밀리를 선택하고 새 파라미터 그룹을 생성합니다.
4.  파라미터 그룹을 편집하고 `binlog_format`을 검색한 다음 값을 `ROW`로 설정합니다.

    ![MySQL Binlog 형식 설정](/images/next/data-operate/streaming-job/mysql-binlog-setting.png)

5.  같은 방법으로 `binlog_row_image`를 검색하고 값을 `FULL`로 설정합니다.
6.  **Save Changes**를 클릭하여 저장합니다.

수정해야 하는 파라미터는 다음과 같습니다.

| 파라미터 | 목표 값 | 목적 |
| --- | --- | --- |
| `binlog_format` | `ROW` | 데이터를 행 수준으로 기록하며 CDC 동기화에 필요함 |
| `binlog_row_image` | `FULL` | 각 변경 전후의 전체 행 데이터를 기록함 |

## 3단계: 파라미터 그룹 적용 및 인스턴스 재시작 {#step-3-apply-the-parameter-group-and-restart-the-instance}

**목적**: 새 파라미터 그룹을 대상 RDS 인스턴스에 연결하고 재시작하여 구성을 적용합니다.

단계는 다음과 같습니다.

1.  RDS 콘솔에서 대상 인스턴스를 선택하고 **Modify**를 클릭합니다.
2.  **DB parameter group**에서 새로 생성한 파라미터 그룹을 선택합니다.
3.  **Apply immediately**를 선택하여 변경 사항을 즉시 적용합니다.
4.  RDS 인스턴스를 재시작하여 구성을 적용합니다.

:::caution
`binlog_format` 파라미터를 수정하면 변경 사항을 적용하기 위해 RDS 인스턴스를 재시작해야 합니다. 트래픽이 적은 시간대에 이 작업을 수행하세요.
:::

## 4단계: 동기화 사용자 생성 {#step-4-create-a-sync-user}

**목적**: 최소 권한 원칙에 따라 Doris 스트리밍 수집에서 사용할 전용 계정을 생성합니다.

1.  전용 사용자를 생성합니다.

    ```sql
    CREATE USER 'doris_sync'@'%' IDENTIFIED BY '<password>';
    ```

2.  동기화에 필요한 권한을 부여합니다.

    ```sql
    GRANT SELECT, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'doris_sync'@'%';
    ```

필요한 권한은 다음과 같습니다.

| 권한 | 목적 |
| --- | --- |
| `SELECT` | 기존 데이터 읽기(전체 데이터 적재 단계) |
| `REPLICATION SLAVE` | 복제본으로 Binlog 가져오기 |
| `REPLICATION CLIENT` | 기본 서버의 Binlog 상태 조회 |

## 5단계: Binlog 보존 기간 구성 {#step-5-configure-binlog-retention}

**목적**: 기본적으로 Amazon RDS MySQL은 바이너리 로그를 가능한 한 빨리 삭제합니다. 장애 상황에서 복제에 사용되는 Binlog 파일을 계속 사용할 수 있도록 Binlog 보존 기간을 최소 **72시간**으로 설정하는 것이 좋습니다.

`mysql.rds_set_configuration` 저장 프로시저를 사용하여 보존 시간을 설정합니다.

```sql
CALL mysql.rds_set_configuration('binlog retention hours', 72);
```

:::caution
이 구성 항목을 설정하지 않거나 너무 짧은 간격으로 설정하면 바이너리 로그에 공백이 생길 수 있으며, Doris가 복제를 재개하는 기능에 영향을 줄 수 있습니다.
:::

## 자주 묻는 질문(FAQ) {#frequently-asked-questions-faq}

**Q1: `binlog_format`을 수정한 후 인스턴스를 반드시 재시작해야 하나요?**

예. `binlog_format`은 정적 파라미터이므로 적용하려면 RDS 인스턴스를 재시작해야 합니다. 트래픽이 적은 시간대에 이 작업을 수행하세요.

**Q2: `binlog_row_image`를 `FULL`로 설정해야 하는 이유는 무엇인가요?**

Doris 스트리밍 수집은 `UPDATE` 및 `DELETE` 작업을 정확히 재구성하기 위해 각 변경 전후의 전체 행 데이터를 필요로 합니다. `MINIMAL` 또는 `NOBLOB`으로 설정하면 동기화 오류나 불완전한 데이터가 발생합니다.

**Q3: 여러 RDS 인스턴스에서 동일한 파라미터 그룹을 재사용할 수 있나요?**

예. 동일한 버전 패밀리에 속한 여러 RDS 인스턴스는 모두 동일한 Binlog 구성을 필요로 하는 경우 하나의 파라미터 그룹을 공유할 수 있습니다.

**Q4: Binlog 보존 시간을 더 길게 설정할 수 있나요?**

예. `binlog retention hours`는 1~168시간(최대 7일)을 지원합니다. 보존 기간이 길수록 복구할 수 있는 시간이 늘어나지만 더 많은 저장 공간을 사용합니다.

## 문제 해결(Troubleshooting) {#troubleshooting}

| 증상 | 가능한 원인 | 해결 방법 |
| --- | --- | --- |
| `SHOW VARIABLES LIKE 'log_bin'`이 `OFF`를 반환함 | 인스턴스에서 자동 백업이 활성화되지 않아 Binlog가 활성화되지 않음 | RDS 콘솔에서 인스턴스의 자동 백업을 활성화합니다. 그러면 Binlog가 자동으로 활성화됩니다 |
| 수정 후에도 `binlog_format`이 `MIXED` 또는 `STATEMENT`로 유지됨 | 인스턴스를 재시작하지 않았거나 연결된 파라미터 그룹이 올바르지 않음 | 새 파라미터 그룹이 연결되었는지 확인한 다음 인스턴스를 재시작합니다 |
| Doris 동기화에서 `binary log not found` 오류가 보고됨 | Binlog가 삭제됨 | `binlog retention hours`를 늘리고 Doris 동기화 작업을 재시작합니다 |
| 동기화 사용자가 연결할 수 없음 | 호스트 허용 목록 또는 비밀번호가 잘못됨 | `'doris_sync'@'%'`의 호스트 한정자가 Doris 노드의 송신 IP와 일치하는지 확인합니다 |
| 권한 부족 오류 | `REPLICATION SLAVE` 등의 권한이 누락됨 | 4단계의 `GRANT` 문을 다시 실행합니다 |
