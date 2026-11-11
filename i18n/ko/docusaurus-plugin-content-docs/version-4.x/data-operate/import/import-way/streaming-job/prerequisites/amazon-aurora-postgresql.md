---
{
    "title": "Amazon Aurora PostgreSQL",
    "language": "ko",
    "description": "Doris 스트리밍 데이터 적재의 사전 요구 사항을 충족하기 위해 Amazon Aurora PostgreSQL에서 논리적 복제를 활성화하고 동기화 사용자를 구성하는 방법.",
    "keywords": [
        "Amazon Aurora PostgreSQL",
        "Logical Replication",
        "rds.logical_replication",
        "Doris streaming ingestion",
        "Publication",
        "dbz_publication",
        "CDC prerequisites"
    ]
}
---

:::caution 실험적 기능

Doris 연속 데이터 적재는 실험적 기능이며 Doris 4.1.5부터 지원됩니다.

:::

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Pre-deployment check / Environment preparation -->

Doris 스트리밍 데이터 적재는 **Amazon Aurora PostgreSQL-Compatible Edition 14 이상**에서 데이터 동기화를 지원합니다. 동기화 전에 Aurora 클러스터에서 논리적 복제를 활성화하고 필요한 권한을 부여해야 합니다. 이 문서는 DBA와 데이터 엔지니어를 대상으로 사전 구성 절차 전체를 설명합니다.

### 사전 요구 사항 확인 목록 {#prerequisite-checklist}

구성을 시작하기 전에 다음 사항을 확인하세요.

| 확인 항목 | 요구 사항 |
| --- | --- |
| Aurora PostgreSQL 버전 | 14 이상 |
| 작업 권한 | AWS RDS 콘솔에서 클러스터 파라미터 그룹을 수정할 수 있는 권한 |
| 데이터베이스 권한 | 사용자를 생성하고, 권한을 부여하고, Publication을 생성할 수 있는 권한 |
| 유지 관리 시간 | Aurora 쓰기 인스턴스를 재시작할 수 있는 시간 확보(논리적 복제 파라미터를 수정한 후 재시작 필요) |

### 구성 절차 {#configuration-workflow}

전체 구성 절차는 5단계입니다.

1. 현재 논리적 복제 구성 상태 확인
2. 클러스터 파라미터 그룹 구성
3. 클러스터 파라미터 그룹 적용 및 인스턴스 재시작
4. Doris 동기화 사용자 생성 및 권한 부여
5. Publication 생성

1단계에서 논리적 복제가 이미 활성화된 것으로 확인되면 **4단계**로 바로 이동하여 동기화 사용자를 생성할 수 있습니다.

## 1단계: 현재 구성 확인 {#step-1-check-the-current-configuration}

<!-- Knowledge type: Procedure -->

**목적:** Aurora 클러스터에서 논리적 복제가 활성화되어 있는지 확인하고 파라미터 그룹을 수정해야 하는지 판단합니다.

Aurora 쓰기 인스턴스에 연결하여 다음 SQL을 실행합니다.

```sql
SHOW rds.logical_replication;
```

반환된 값에 따라 다음 작업을 선택합니다.

| 반환값 | 의미 | 다음 작업 |
| --- | --- | --- |
| `on` | 논리적 복제가 활성화됨 | [4단계: 동기화 사용자 생성](#step-4-create-the-sync-user)으로 이동 |
| `off` | 논리적 복제가 활성화되지 않음 | [2단계: 클러스터 파라미터 그룹 구성](#step-2-configure-the-cluster-parameter-group)으로 진행 |

## 2단계: 클러스터 파라미터 그룹 구성 {#step-2-configure-the-cluster-parameter-group}

<!-- Knowledge type: Configuration parameters -->

**목적:** Aurora 클러스터에서 사용할, 논리적 복제가 활성화된 DB Cluster Parameter Group을 생성합니다.

절차:

1. [AWS RDS 콘솔](https://console.aws.amazon.com/rds/)에 로그인합니다.
2. 왼쪽 탐색 창에서 **Parameter groups**를 선택하고 **Create parameter group**을 클릭합니다.
3. 유형을 **DB Cluster Parameter Group**으로 설정하고 해당 Aurora PostgreSQL 버전 계열을 선택합니다.
4. 방금 생성한 클러스터 파라미터 그룹을 편집합니다. `rds.logical_replication`을 검색하고 값을 `1`로 설정합니다.

    ![PostgreSQL WAL 설정](/images/next/data-operate/streaming-job/pgwalsetting.png)

5. **Save Changes**를 클릭하여 저장합니다.

주요 파라미터 설명:

| 파라미터 | 권장값 | 설명 |
| --- | --- | --- |
| `rds.logical_replication` | `1` | 논리적 복제를 활성화합니다. `0`은 비활성화를 의미합니다. |

## 3단계: 클러스터 파라미터 그룹 적용 및 재시작 {#step-3-apply-the-cluster-parameter-group-and-restart}

<!-- Knowledge type: Procedure -->

**목적:** 새로 생성한 파라미터 그룹을 대상 Aurora 클러스터에 연결하고 쓰기 인스턴스를 재시작하여 구성을 적용합니다.

절차:

1. RDS 콘솔에서 대상 Aurora 클러스터를 선택하고 **Modify**를 클릭합니다.
2. **DB cluster parameter group**에서 2단계에 생성한 클러스터 파라미터 그룹을 선택합니다.
3. **Apply immediately**를 선택합니다.
4. 구성이 적용되도록 Aurora 쓰기 인스턴스를 재시작합니다.

:::caution
`rds.logical_replication` 파라미터를 수정한 후 변경 사항을 적용하려면 Aurora 쓰기 인스턴스를 재시작해야 합니다. 업무량이 적은 시간에 이 작업을 수행하세요.
:::

## 4단계: 동기화 사용자 생성 {#step-4-create-the-sync-user}

<!-- Knowledge type: Procedure -->

**목적:** Doris 스트리밍 데이터 적재에 사용할 전용 계정을 생성하고, 데이터 읽기와 복제에 필요한 최소 권한을 부여합니다.

1. 전용 사용자를 생성합니다.

    ```sql
    CREATE USER doris_sync PASSWORD '<password>';
    ```

2. 스키마와 테이블에 대한 읽기 권한을 부여합니다(`public` 스키마를 예로 들었으므로 필요에 따라 변경하세요).

    ```sql
    GRANT USAGE ON SCHEMA "public" TO doris_sync;
    GRANT SELECT ON ALL TABLES IN SCHEMA "public" TO doris_sync;
    ALTER DEFAULT PRIVILEGES IN SCHEMA "public" GRANT SELECT ON TABLES TO doris_sync;
    ```

3. 복제 권한을 부여합니다.

    ```sql
    GRANT rds_replication TO doris_sync;
    ```

권한 설명:

| 권한 | 용도 |
| --- | --- |
| `USAGE ON SCHEMA` | 지정한 스키마에 접근할 수 있습니다. |
| `SELECT ON ALL TABLES` | 스키마에 있는 모든 기존 테이블의 데이터를 읽을 수 있습니다. |
| `ALTER DEFAULT PRIVILEGES ... GRANT SELECT` | 이 스키마에 나중에 생성되는 테이블에 대한 읽기 권한을 자동으로 부여합니다. |
| `rds_replication` | Aurora PostgreSQL에서 논리적 복제를 수행하는 데 필요한 역할입니다. |

## 5단계: Publication 생성 {#step-5-create-the-publication}

<!-- Knowledge type: Procedure -->

**목적:** Doris가 구독할 Publication을 생성합니다.

다음 SQL을 실행합니다.

```sql
CREATE PUBLICATION dbz_publication FOR ALL TABLES;
```

:::caution
현재 Doris는 이름이 `dbz_publication`이고 `FOR ALL TABLES`로 설정된 Publication만 지원합니다. 사용자 지정 Publication 이름이나 일부 테이블만 지정하는 방식은 아직 지원하지 않습니다.
:::

> **참고:** 동기화 사용자에게 슈퍼유저 권한(예: `rds_superuser` 역할)이 있으면 Doris가 Publication을 자동으로 생성하므로 이 단계를 수동으로 수행할 필요가 없습니다.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->

**Q1: `SHOW rds.logical_replication;`의 반환값이 `on`입니다. 추가로 무엇을 해야 하나요?**

클러스터 파라미터 그룹을 수정하거나 인스턴스를 재시작할 필요가 없습니다. [4단계: 동기화 사용자 생성](#step-4-create-the-sync-user)부터 진행하세요.

**Q2: Aurora PostgreSQL 13 이하 버전도 지원하나요?**

아니요. Doris 스트리밍 데이터 적재에는 Aurora PostgreSQL 14 이상이 필요합니다.

**Q3: 사용자 지정 이름의 Publication을 사용할 수 있나요?**

아니요. 현재 Doris는 이름이 `dbz_publication`이고 `FOR ALL TABLES`로 설정된 Publication만 지원합니다.

**Q4: 동기화에 슈퍼유저 계정을 반드시 사용해야 하나요?**

아니요. 일반 사용자 `doris_sync`를 사용하고 이 문서에 설명된 권한을 부여하는 것이 좋습니다. 계정에 슈퍼유저 권한(예: `rds_superuser`)이 있을 때만 Doris가 Publication을 자동으로 생성합니다.

## 문제 해결 {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Pre-sync prerequisite check failure -->

| 증상 | 가능한 원인 | 해결 방법 |
| --- | --- | --- |
| `SHOW rds.logical_replication;`이 여전히 `off`를 반환함 | 새 파라미터 그룹이 클러스터에 연결되지 않았거나 쓰기 인스턴스를 재시작하지 않음 | **DB cluster parameter group**이 새 파라미터 그룹으로 변경되었는지 확인하고 쓰기 인스턴스를 재시작합니다. |
| 사용자 생성 또는 권한 부여에 실패함 | 현재 로그인한 계정의 권한이 부족함 | `rds_superuser` 또는 이에 상응하는 권한이 있는 계정으로 로그인한 후 작업을 수행합니다. |
| `GRANT rds_replication` 실행 시 오류가 발생함 | 현재 Aurora 버전이 너무 낮거나 클러스터가 Aurora PostgreSQL이 아님 | Aurora PostgreSQL 14 이상으로 업그레이드합니다. |
| Publication 생성 시 권한 오류가 발생함 | `doris_sync` 사용자에게 Publication 생성 권한이 없음 | 슈퍼유저 계정으로 `CREATE PUBLICATION`을 수동 실행하거나 동기화 계정에 필요한 권한을 임시로 부여합니다. |
| Doris에서 동기화를 시작할 때 `dbz_publication`을 찾을 수 없다고 보고함 | Publication이 생성되지 않았고 동기화 계정에 슈퍼유저 권한이 없어 자동으로 생성할 수 없음 | 5단계의 `CREATE PUBLICATION dbz_publication FOR ALL TABLES;`를 수동으로 실행합니다. |
