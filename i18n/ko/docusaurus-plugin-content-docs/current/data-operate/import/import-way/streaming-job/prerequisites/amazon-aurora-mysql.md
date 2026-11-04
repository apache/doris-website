---
{
    "title": "Amazon Aurora MySQL",
    "language": "ko",
    "description": "Doris 스트리밍 적재를 지원하기 위해 Amazon Aurora MySQL에서 Binlog를 활성화하고 동기화 사용자를 구성하는 사전 단계입니다.",
    "keywords": [
        "Amazon Aurora MySQL",
        "Aurora Binlog configuration",
        "Doris streaming ingestion",
        "binlog_format ROW",
        "binlog_row_image FULL",
        "binlog retention hours",
        "RDS Parameter Group",
        "MySQL CDC prerequisites"
    ]
}
---

:::caution 실험적 기능

Doris 지속적 적재는 실험적 기능이며 Doris 4.1.5부터 지원됩니다.

:::

<!-- 지식 유형: 운영 단계 -->
<!-- 적용 시나리오: 배포 전 확인 / 데이터 소스 온보딩 사전 구성 -->

Doris 스트리밍 적재는 Amazon Aurora MySQL-Compatible Edition **5.6, 5.7, 8.0.x** 버전을 지원합니다. Aurora MySQL은 기본적으로 Binlog가 활성화되어 있지 않으므로 데이터를 동기화하기 전에 Aurora 클러스터에서 Binlog 활성화 및 구성, 동기화 사용자 생성, Binlog 보존 기간 설정 등의 사전 작업을 먼저 완료해야 합니다.

이 문서는 Aurora MySQL 데이터를 Doris 스트리밍 적재로 온보딩하려는 사용자를 대상으로 하며, 전체 구성 흐름을 제공합니다.

### 사전 요구 사항 체크리스트 {#prerequisite-checklist}

Doris에 온보딩하기 전에 Aurora 클러스터가 다음 조건을 충족하는지 확인하세요.

| 확인 항목 | 예상 값 | 확인 방법 |
| :--- | :--- | :--- |
| Binlog 활성화 여부 | `log_bin = ON` | `SHOW VARIABLES LIKE 'log_bin';` |
| Binlog 형식 | `binlog_format = ROW` | `SHOW VARIABLES LIKE 'binlog_format';` |
| Binlog 행 이미지 | `binlog_row_image = FULL` | `SHOW VARIABLES LIKE 'binlog_row_image';` |
| 동기화 사용자 | 전용 계정이 존재하고 복제 권한이 부여됨 | `SHOW GRANTS FOR ...;` 실행 |
| Binlog 보존 기간 | 72시간 이상 | `CALL mysql.rds_show_configuration;` |

모든 조건을 충족하면 Doris 스트리밍 적재 구성을 바로 진행할 수 있습니다. 충족되지 않는 항목이 있으면 아래 단계에 따라 구성을 완료하세요.

## 1단계: 현재 Binlog 구성 확인 {#step-1-check-the-current-binlog-configuration}

**Aurora writer instance**에 연결하여 다음 SQL을 실행하고 Binlog 상태를 확인합니다.

```sql
-- Check if binlog is enabled
SHOW VARIABLES LIKE 'log_bin';

-- Check binlog format
SHOW VARIABLES LIKE 'binlog_format';

-- Check binlog row image
SHOW VARIABLES LIKE 'binlog_row_image';
```

결과에 따라 다음 경로를 선택하세요.

- 세 조건(`log_bin = ON`, `binlog_format = ROW`, `binlog_row_image = FULL`)을 모두 충족하면 [4단계: 동기화 사용자 생성](#step-4-create-a-sync-user)으로 **바로 건너뛸 수 있습니다**.
- 그렇지 않으면 [2단계](#step-2-configure-the-cluster-parameter-group)로 계속 진행하여 클러스터 파라미터 그룹을 통해 Binlog를 활성화합니다.

## 2단계: 클러스터 파라미터 그룹 구성 {#step-2-configure-the-cluster-parameter-group}

Aurora MySQL에서는 런타임 파라미터를 직접 수정할 수 없으므로 **DB Cluster Parameter Group**을 통해 수정해야 합니다.

단계:

1. [AWS RDS 콘솔](https://console.aws.amazon.com/rds/)에 로그인합니다.
2. 왼쪽 탐색 창에서 **Parameter groups**를 선택하고 **Create parameter group**을 클릭합니다.
3. 유형으로 **DB Cluster Parameter Group**을 선택하고 대상 클러스터와 일치하는 Aurora MySQL 버전 제품군을 선택합니다.
4. 새로 만든 클러스터 파라미터 그룹을 편집하고 `binlog_format`을 검색한 후 값을 `ROW`로 설정합니다.

    ![MySQL Binlog 형식 설정](/images/next/data-operate/streaming-job/mysql-binlog-setting.png)

5. `binlog_row_image`를 검색하고 값을 `FULL`로 설정합니다.
6. **Save Changes**를 클릭하여 저장합니다.

수정해야 하는 주요 파라미터는 다음과 같습니다.

| 파라미터 | 권장 값 | 설명 |
| :--- | :--- | :--- |
| `binlog_format` | `ROW` | CDC 동기화에는 행 수준 로깅이 필요합니다 |
| `binlog_row_image` | `FULL` | Binlog에 모든 열의 전체 이미지가 포함되도록 합니다 |

## 3단계: 클러스터 파라미터 그룹 적용 및 재시작 {#step-3-apply-the-cluster-parameter-group-and-restart}

새로 만든 파라미터 그룹을 대상 클러스터에 연결하고 writer instance를 재시작해야 변경 사항이 적용됩니다.

1. RDS 콘솔에서 대상 Aurora 클러스터를 선택하고 **Modify**를 클릭합니다.
2. **DB cluster parameter group**에서 [2단계](#step-2-configure-the-cluster-parameter-group)에서 만든 클러스터 파라미터 그룹을 선택합니다.
3. **Apply immediately**를 선택하여 변경 사항을 즉시 적용합니다.
4. 구성이 적용되도록 Aurora **writer instance**를 재시작합니다.

:::caution
`binlog_format` 파라미터를 수정하려면 Aurora writer instance를 재시작해야 적용됩니다. 업무가 적은 시간대에 이 작업을 수행하세요.
:::

재시작 후 [1단계](#step-1-check-the-current-binlog-configuration)의 SQL을 다시 실행하여 확인합니다. 세 파라미터 모두 예상 값과 일치해야 합니다.

## 4단계: 동기화 사용자 생성 {#step-4-create-a-sync-user}

권한 관리와 감사를 용이하게 하기 위해 Doris 스트리밍 적재 전용 계정을 만듭니다.

1. 사용자를 생성합니다.

    ```sql
    CREATE USER 'doris_sync'@'%' IDENTIFIED BY '<password>';
    ```

2. 동기화에 필요한 권한을 부여합니다.

    ```sql
    GRANT SELECT, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'doris_sync'@'%';
    ```

필요한 권한은 다음과 같습니다.

| 권한 | 용도 |
| :--- | :--- |
| `SELECT` | 전체 적재 단계에서 업무 테이블 데이터를 읽습니다 |
| `REPLICATION SLAVE` | 복제 클라이언트로 Binlog 스트림을 읽습니다 |
| `REPLICATION CLIENT` | Binlog 파일 위치 등의 메타데이터를 조회합니다 |

## 5단계: Binlog 보존 기간 구성 {#step-5-configure-the-binlog-retention-period}

Aurora는 기본적으로 Binlog를 비교적 빠르게 회수하므로 중단 후 복제를 재개하지 못할 수 있습니다. 장애 상황에서도 바이너리 로그를 사용할 수 있도록 Binlog 보존 기간을 **최소 72시간**으로 설정하는 것이 좋습니다.

`mysql.rds_set_configuration` 저장 프로시저를 사용하여 설정합니다.

```sql
CALL mysql.rds_set_configuration('binlog retention hours', 72);
```

다음 SQL을 사용하여 현재 구성을 확인할 수 있습니다.

```sql
CALL mysql.rds_show_configuration;
```

:::caution
이 구성 항목을 설정하지 않거나 너무 짧은 간격으로 설정하면 바이너리 로그에 공백이 생겨 Doris가 복제를 재개하는 데 영향을 줄 수 있습니다.
:::

## FAQ {#faq}

**Q1: `binlog_format`을 변경했는데도 값이 `ROW`가 아닌 이유는 무엇인가요?**

A: Aurora MySQL에서는 런타임 파라미터를 직접 수정할 수 없습니다. [2단계](#step-2-configure-the-cluster-parameter-group)에 설명된 대로 **DB Cluster Parameter Group**을 생성하고 연결한 다음 **writer instance**를 재시작해야 변경 사항이 적용됩니다. 기본 파라미터 그룹을 수정해도 적용되지 않습니다.

**Q2: writer instance에서 확인과 구성을 수행해야 하나요?**

A: 예. Binlog는 Aurora writer instance에서만 생성되므로 모든 SQL 확인과 동기화 사용자 생성은 writer instance에서 수행해야 합니다.

**Q3: `binlog retention hours`를 너무 높게 설정하면 어떤 영향이 있나요?**

A: 더 많은 저장 공간을 사용합니다. 실제 장애 복구 시간 창을 기준으로 값을 설정하되, 최소 72시간으로 설정하는 것이 좋습니다.

## 문제 해결 {#troubleshooting}

| 증상 | 가능한 원인 | 해결 방법 |
| :--- | :--- | :--- |
| `log_bin`이 여전히 `OFF`임 | 사용자 지정 클러스터 파라미터 그룹이 연결되지 않았거나 writer instance가 재시작되지 않음 | [3단계](#step-3-apply-the-cluster-parameter-group-and-restart)에 따라 파라미터 그룹을 연결하고 writer instance를 재시작합니다 |
| `binlog_format`이 `ROW`가 아님 | 클러스터 파라미터 그룹이 아닌 인스턴스 파라미터 그룹을 수정함 | **DB Cluster Parameter Group**에서 `binlog_format = ROW`로 설정합니다 |
| Doris 동기화에서 Binlog 파일을 찾을 수 없다고 보고함 | `binlog retention hours`가 너무 작아 Binlog가 회수됨 | `mysql.rds_set_configuration`을 사용하여 보존 기간을 최소 72시간으로 늘립니다 |
| 동기화 사용자 인증 실패 | 사용자 호스트 제한 또는 권한 부족 | 사용자 호스트가 `'%'` 또는 Doris BE 송신 IP인지 확인하고 `REPLICATION SLAVE, REPLICATION CLIENT` 권한이 부여되었는지 확인합니다 |
