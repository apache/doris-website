---
{
    "title": "Amazon Aurora MySQL",
    "language": "ko",
    "description": "Doris 스트리밍 수집을 지원하기 위해 Amazon Aurora MySQL에서 Binlog를 활성화하고 동기화 사용자를 구성하는 사전 준비 단계입니다.",
    "keywords": [
        "Amazon Aurora MySQL",
        "Aurora Binlog 구성",
        "Doris 스트리밍 수집",
        "binlog_format ROW",
        "binlog_row_image FULL",
        "binlog retention hours",
        "RDS Parameter Group",
        "MySQL CDC 사전 요구 사항"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Pre-deployment check / Data source onboarding prerequisite configuration -->

Doris 스트리밍 수집은 Amazon Aurora MySQL-Compatible Edition **5.6, 5.7, 8.0.x** 버전을 지원합니다. Aurora MySQL은 기본적으로 Binlog를 활성화하지 않으므로, 데이터를 동기화하기 전에 Aurora 클러스터에서 사전 준비를 완료해야 합니다. Binlog를 활성화하고 구성한 다음, 동기화 사용자를 생성하고 Binlog 보존 기간을 설정해야 합니다.

이 문서는 Aurora MySQL 데이터를 Doris 스트리밍 수집에 연동하려는 사용자를 대상으로 전체 구성 절차를 안내합니다.

### 사전 점검 목록 {#prerequisite-checklist}

Doris에 연동하기 전에 Aurora 클러스터가 다음 조건을 충족하는지 확인하세요.

| 점검 항목 | 예상 값 | 확인 방법 |
| :--- | :--- | :--- |
| Binlog 활성화 여부 | `log_bin = ON` | `SHOW VARIABLES LIKE 'log_bin';` |
| Binlog 형식 | `binlog_format = ROW` | `SHOW VARIABLES LIKE 'binlog_format';` |
| Binlog 행 이미지 | `binlog_row_image = FULL` | `SHOW VARIABLES LIKE 'binlog_row_image';` |
| 동기화 사용자 | 복제 권한이 있는 전용 계정이 존재함 | `SHOW GRANTS FOR ...;` 실행 |
| Binlog 보존 기간 | 최소 72시간 | `CALL mysql.rds_show_configuration;` |

모든 조건을 충족하면 Doris 스트리밍 수집 구성으로 바로 진행할 수 있습니다. 충족하지 못한 항목이 있다면 아래 단계에 따라 구성을 완료하세요.

## 1단계: 현재 Binlog 구성 확인 {#step-1-check-the-current-binlog-configuration}

**Aurora 쓰기 인스턴스**에 연결하고 다음 SQL을 실행하여 Binlog 상태를 확인하세요.

```sql
-- Check if binlog is enabled
SHOW VARIABLES LIKE 'log_bin';

-- Check binlog format
SHOW VARIABLES LIKE 'binlog_format';

-- Check binlog row image
SHOW VARIABLES LIKE 'binlog_row_image';
```

결과에 따라 다음에 수행할 단계를 선택하세요.

- 세 가지 조건(`log_bin = ON`, `binlog_format = ROW`, `binlog_row_image = FULL`)을 모두 충족하면 [4단계: 동기화 사용자 생성](#step-4-create-a-sync-user)으로 **바로 건너뛸 수 있습니다**.
- 그렇지 않으면 [2단계](#step-2-configure-the-cluster-parameter-group)로 진행하여 클러스터 파라미터 그룹을 통해 Binlog를 활성화하세요.

## 2단계: 클러스터 파라미터 그룹 구성 {#step-2-configure-the-cluster-parameter-group}

Aurora MySQL에서는 런타임 파라미터를 직접 수정할 수 없습니다. **DB Cluster Parameter Group**을 통해 수정해야 합니다.

절차:

1. [AWS RDS 콘솔](https://console.aws.amazon.com/rds/)에 로그인합니다.
2. 왼쪽 탐색 창에서 **파라미터 그룹**을 선택하고 **파라미터 그룹 생성**을 클릭합니다.
3. 유형으로 **DB Cluster Parameter Group**을 선택하고 대상 클러스터와 일치하는 Aurora MySQL 버전 계열을 선택합니다.
4. 새로 생성한 클러스터 파라미터 그룹을 편집하고, `binlog_format`을 검색한 다음 값을 `ROW`로 설정합니다.

    ![MySQL Binlog 형식 설정](/images/next/data-operate/streaming-job/mysql-binlog-setting.png)

5. `binlog_row_image`를 검색하고 값을 `FULL`로 설정합니다.
6. **변경 사항 저장**을 클릭하여 저장합니다.

수정해야 하는 주요 파라미터는 다음과 같습니다.

| 파라미터 | 권장 값 | 설명 |
| :--- | :--- | :--- |
| `binlog_format` | `ROW` | CDC 동기화에는 행 단위 로깅이 필요함 |
| `binlog_row_image` | `FULL` | Binlog에 모든 컬럼의 전체 이미지가 포함되도록 함 |

## 3단계: 클러스터 파라미터 그룹 적용 및 재시작 {#step-3-apply-the-cluster-parameter-group-and-restart}

새로 생성한 파라미터 그룹을 대상 클러스터에 연결하고 쓰기 인스턴스를 재시작해야 변경 사항이 적용됩니다.

1. RDS 콘솔에서 대상 Aurora 클러스터를 선택하고 **수정**을 클릭합니다.
2. **DB 클러스터 파라미터 그룹**에서 [2단계](#step-2-configure-the-cluster-parameter-group)에서 생성한 클러스터 파라미터 그룹을 선택합니다.
3. **즉시 적용**을 선택하여 변경 사항을 즉시 적용합니다.
4. 구성이 적용되도록 Aurora **쓰기 인스턴스**를 재시작합니다.

:::caution
`binlog_format` 파라미터를 수정한 후에는 Aurora 쓰기 인스턴스를 재시작해야 변경 사항이 적용됩니다. 사용량이 적은 시간대에 이 작업을 수행하세요.
:::

재시작 후 [1단계](#step-1-check-the-current-binlog-configuration)의 SQL을 다시 실행하여 확인하세요. 세 파라미터 모두 예상 값과 일치해야 합니다.

## 4단계: 동기화 사용자 생성 {#step-4-create-a-sync-user}

권한 관리와 감사를 용이하게 하려면 Doris 스트리밍 수집용 전용 계정을 생성하세요.

1. 사용자를 생성합니다.

    ```sql
    CREATE USER 'doris_sync'@'%' IDENTIFIED BY '<password>';
    ```

2. 동기화에 필요한 권한을 부여합니다.

    ```sql
    GRANT SELECT, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'doris_sync'@'%';
    ```

필요한 권한에 대한 설명은 다음과 같습니다.

| 권한 | 용도 |
| :--- | :--- |
| `SELECT` | 전체 데이터 적재 단계에서 업무 테이블 데이터 읽기 |
| `REPLICATION SLAVE` | 복제 클라이언트로서 Binlog 스트림 읽기 |
| `REPLICATION CLIENT` | Binlog 파일 위치 등의 메타데이터 쿼리 |

## 5단계: Binlog 보존 기간 구성 {#step-5-configure-the-binlog-retention-period}

Aurora는 기본적으로 Binlog를 비교적 빠르게 회수하므로, 중단 후 복제를 재개하지 못할 수 있습니다. 장애가 발생해도 바이너리 로그를 사용할 수 있도록 Binlog 보존 기간을 **최소 72시간**으로 설정하는 것이 좋습니다.

`mysql.rds_set_configuration` 저장 프로시저를 사용하여 설정하세요.

```sql
CALL mysql.rds_set_configuration('binlog retention hours', 72);
```

다음 SQL로 현재 구성을 확인할 수 있습니다.

```sql
CALL mysql.rds_show_configuration;
```

:::caution
이 구성 항목을 설정하지 않거나 보존 기간을 너무 짧게 설정하면 바이너리 로그에 누락 구간이 생겨 Doris의 복제 재개에 영향을 줄 수 있습니다.
:::

## 자주 묻는 질문 {#faq}

**질문1: 값이 여전히 `ROW`가 아닙니다. `binlog_format`을 변경했는데도 왜 적용되지 않나요?**

답변: Aurora MySQL에서는 런타임 파라미터를 직접 수정할 수 없습니다. [2단계](#step-2-configure-the-cluster-parameter-group)에 설명된 대로 **DB Cluster Parameter Group**을 생성하여 연결한 다음, **쓰기 인스턴스**를 재시작해야 변경 사항이 적용됩니다. 기본 파라미터 그룹을 수정하는 것으로는 적용되지 않습니다.

**질문2: 점검과 구성은 반드시 쓰기 인스턴스에서 수행해야 하나요?**

답변: 예. Binlog는 Aurora 쓰기 인스턴스에서만 생성되므로, 모든 SQL 점검과 동기화 사용자 생성은 쓰기 인스턴스에서 수행해야 합니다.

**질문3: `binlog retention hours`를 너무 높게 설정하면 어떤 영향이 있나요?**

답변: 저장 공간을 더 많이 사용합니다. 실제 장애 복구에 필요한 시간을 기준으로 하되, 최소 72시간으로 설정하는 것이 좋습니다.

## 문제 해결 {#troubleshooting}

| 증상 | 가능한 원인 | 해결 방법 |
| :--- | :--- | :--- |
| `log_bin`이 여전히 `OFF`임 | 사용자 지정 클러스터 파라미터 그룹이 연결되지 않았거나 쓰기 인스턴스가 재시작되지 않음 | [3단계](#step-3-apply-the-cluster-parameter-group-and-restart)에 따라 파라미터 그룹을 연결하고 쓰기 인스턴스를 재시작함 |
| `binlog_format`이 `ROW`가 아님 | 클러스터 파라미터 그룹 대신 인스턴스 파라미터 그룹을 수정함 | **DB Cluster Parameter Group**에서 `binlog_format = ROW`로 설정함 |
| Doris 동기화 중 Binlog 파일을 찾을 수 없다는 오류가 발생함 | `binlog retention hours`가 너무 작아 Binlog가 회수됨 | `mysql.rds_set_configuration`을 사용하여 보존 기간을 최소 72시간으로 늘림 |
| 동기화 사용자 인증 실패 | 사용자에 대한 호스트 제한 또는 권한 부족 | 사용자 호스트가 `'%'` 또는 Doris BE의 송신 IP인지, `REPLICATION SLAVE, REPLICATION CLIENT` 권한이 부여되었는지 확인함 |
