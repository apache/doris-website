---
{
    "title": "Amazon RDS MySQL",
    "language": "ko",
    "description": "Doris 스트리밍 수집에 필요한 사전 준비로 Amazon RDS MySQL에서 Binlog를 활성화하고, 파라미터 그룹을 구성하고, 동기화 사용자를 생성하는 방법을 설명합니다.",
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

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Pre-deployment check / Environment configuration -->

Doris 스트리밍 수집은 Amazon RDS MySQL의 데이터 동기화를 지원합니다. 호환되는 버전은 **MySQL 5.6, 5.7 및 8.0.x**입니다. 동기화 작업을 시작하기 전에 RDS 인스턴스에서 Binlog가 활성화되어 있고 변경 로그가 올바른 형식으로 기록되는지 확인해야 합니다.

이 문서는 스트리밍 수집(CDC)을 통해 Amazon RDS MySQL의 데이터를 Doris로 동기화해야 하는 사용자를 위한 문서입니다. 시나리오의 진행 순서에 따라 필요한 모든 사전 설정을 안내합니다.

## 사전 확인 목록 {#prerequisite-checklist}

시작하기 전에 다음 조건을 확인하세요.

| 확인 항목 | 예상 값 | 설명 |
| --- | --- | --- |
| `log_bin` | `ON` | Binlog 활성화됨 |
| `binlog_format` | `ROW` | 변경 사항을 행 모드로 기록 |
| `binlog_row_image` | `FULL` | 전체 행 이미지 기록 |
| 동기화 사용자 | 생성됨 | `SELECT`, `REPLICATION SLAVE`, `REPLICATION CLIENT` 권한 보유 |
| Binlog 보존 기간 | 최소 72시간 | 로그가 너무 일찍 정리되어 동기화가 중단되는 상황 방지 |

위 조건 중 충족되지 않은 항목이 있으면 아래 단계에 따라 하나씩 설정하세요.

## 1단계: 현재 Binlog 설정 확인 {#step-1-check-the-current-binlog-configuration}

**목적**: RDS 인스턴스의 현재 Binlog 상태를 확인하고 파라미터 그룹을 수정해야 하는지 판단합니다.

RDS 인스턴스에 연결한 후 다음 SQL을 실행하세요.

```sql
-- Check if binlog is enabled
SHOW VARIABLES LIKE 'log_bin';

-- Check binlog format
SHOW VARIABLES LIKE 'binlog_format';

-- Check binlog row image
SHOW VARIABLES LIKE 'binlog_row_image';
```

**결과 해석 방법**:

-   `log_bin = ON`, `binlog_format = ROW`, `binlog_row_image = FULL`이면 추가 설정이 필요하지 않습니다. [4단계: 동기화 사용자 생성](#step-4-create-a-sync-user)으로 바로 건너뛸 수 있습니다.
-   이 중 충족되지 않은 조건이 있으면 2단계와 3단계를 진행하세요.

## 2단계: 파라미터 그룹 생성 및 설정 {#step-2-create-and-configure-a-parameter-group}

**목적**: AWS 콘솔에서 사용자 지정 파라미터 그룹을 생성하고 Binlog 관련 파라미터를 Doris 스트리밍 수집에 필요한 값으로 설정합니다.

절차는 다음과 같습니다.

1.  [AWS RDS 콘솔](https://console.aws.amazon.com/rds/)에 로그인합니다.
2.  왼쪽 탐색 창에서 **파라미터 그룹**을 선택하고 **파라미터 그룹 생성**을 클릭합니다.
3.  일치하는 MySQL 버전 패밀리를 선택하고 새 파라미터 그룹을 생성합니다.
4.  파라미터 그룹을 편집하고 `binlog_format`을 검색하여 값을 `ROW`로 설정합니다.

    ![MySQL Binlog 형식 설정](/images/next/data-operate/streaming-job/mysql-binlog-setting.png)

5.  마찬가지로 `binlog_row_image`를 검색하여 값을 `FULL`로 설정합니다.
6.  **변경 사항 저장**을 클릭하여 저장합니다.

수정해야 하는 파라미터는 다음과 같습니다.

| 파라미터 | 목표 값 | 용도 |
| --- | --- | --- |
| `binlog_format` | `ROW` | CDC 동기화에 필요한 행 단위 데이터 변경 사항 기록 |
| `binlog_row_image` | `FULL` | 각 변경 전후의 전체 행 데이터 기록 |

## 3단계: 파라미터 그룹 적용 및 인스턴스 재시작 {#step-3-apply-the-parameter-group-and-restart-the-instance}

**목적**: 새 파라미터 그룹을 대상 RDS 인스턴스에 연결하고 인스턴스를 재시작하여 설정을 적용합니다.

절차는 다음과 같습니다.

1.  RDS 콘솔에서 대상 인스턴스를 선택하고 **수정**을 클릭합니다.
2.  **DB 파라미터 그룹**에서 새로 생성한 파라미터 그룹을 선택합니다.
3.  **즉시 적용**을 선택하여 변경 사항을 즉시 적용합니다.
4.  RDS 인스턴스를 재시작하여 설정을 적용합니다.

:::caution
`binlog_format` 파라미터의 변경 사항을 적용하려면 RDS 인스턴스를 재시작해야 합니다. 사용량이 적은 시간대에 이 작업을 수행하세요.
:::

## 4단계: 동기화 사용자 생성 {#step-4-create-a-sync-user}

**목적**: 최소 권한 원칙에 따라 Doris 스트리밍 수집에 사용할 전용 계정을 생성합니다.

1.  전용 사용자를 생성합니다.

    ```sql
    CREATE USER 'doris_sync'@'%' IDENTIFIED BY '<password>';
    ```

2.  동기화에 필요한 권한을 부여합니다.

    ```sql
    GRANT SELECT, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'doris_sync'@'%';
    ```

필요한 권한에 대한 설명은 다음과 같습니다.

| 권한 | 용도 |
| --- | --- |
| `SELECT` | 기존 데이터 읽기(전체 데이터 적재 단계) |
| `REPLICATION SLAVE` | 복제본으로서 Binlog 가져오기 |
| `REPLICATION CLIENT` | 프라이머리의 Binlog 상태 쿼리 |

## 5단계: Binlog 보존 기간 설정 {#step-5-configure-binlog-retention}

**목적**: 기본적으로 Amazon RDS MySQL은 바이너리 로그를 가능한 한 빨리 삭제합니다. 장애가 발생해도 복제에 사용되는 Binlog 파일을 계속 사용할 수 있도록 Binlog 보존 기간을 최소 **72시간**으로 설정하는 것이 좋습니다.

`mysql.rds_set_configuration` 저장 프로시저를 사용하여 보존 기간을 설정하세요.

```sql
CALL mysql.rds_set_configuration('binlog retention hours', 72);
```

:::caution
이 설정 항목을 지정하지 않거나 보존 기간을 너무 짧게 설정하면 바이너리 로그에 누락 구간이 생겨 Doris의 복제 재개 기능에 영향을 줄 수 있습니다.
:::

## 자주 묻는 질문(FAQ) {#frequently-asked-questions-faq}

**Q1: `binlog_format` 수정 후 인스턴스를 반드시 재시작해야 하나요?**

예. `binlog_format`은 정적 파라미터이므로 변경 사항을 적용하려면 RDS 인스턴스를 재시작해야 합니다. 사용량이 적은 시간대에 작업하세요.

**Q2: `binlog_row_image`를 `FULL`로 설정해야 하는 이유는 무엇인가요?**

Doris 스트리밍 수집에서 `UPDATE` 및 `DELETE` 작업을 올바르게 재구성하려면 각 변경 전후의 전체 행 데이터가 필요합니다. `MINIMAL` 또는 `NOBLOB`으로 설정하면 동기화 오류가 발생하거나 데이터가 불완전해집니다.

**Q3: 여러 RDS 인스턴스에서 동일한 파라미터 그룹을 재사용할 수 있나요?**

예. 동일한 버전 패밀리에 속하는 여러 RDS 인스턴스는 모두 같은 Binlog 설정이 필요하다면 하나의 파라미터 그룹을 공유할 수 있습니다.

**Q4: Binlog 보존 기간을 더 길게 설정할 수 있나요?**

예. `binlog retention hours`는 1시간부터 168시간까지(최대 7일) 설정할 수 있습니다. 보존 기간이 길수록 복구 가능한 기간이 늘어나지만 저장 공간을 더 많이 사용합니다.

## 문제 해결 {#troubleshooting}

| 증상 | 가능한 원인 | 해결 방법 |
| --- | --- | --- |
| `SHOW VARIABLES LIKE 'log_bin'`의 결과가 `OFF`임 | 인스턴스의 자동 백업이 활성화되어 있지 않아 Binlog가 활성화되지 않음 | RDS 콘솔에서 인스턴스의 자동 백업을 활성화하면 Binlog가 자동으로 활성화됨 |
| 수정 후에도 `binlog_format`이 `MIXED` 또는 `STATEMENT`로 유지됨 | 인스턴스를 재시작하지 않았거나 올바른 파라미터 그룹이 연결되지 않음 | 새 파라미터 그룹이 연결되어 있는지 확인한 후 인스턴스를 재시작 |
| Doris 동기화에서 `binary log not found` 오류 발생 | Binlog가 삭제됨 | `binlog retention hours`를 늘리고 Doris 동기화 작업을 재시작 |
| 동기화 사용자가 연결할 수 없음 | 호스트 허용 목록이나 비밀번호가 올바르지 않음 | `'doris_sync'@'%'`의 호스트 지정자가 Doris 노드의 아웃바운드 IP와 일치하는지 확인 |
| 권한 부족 오류 발생 | `REPLICATION SLAVE` 등의 권한 누락 | 4단계의 `GRANT` 문을 다시 실행 |
