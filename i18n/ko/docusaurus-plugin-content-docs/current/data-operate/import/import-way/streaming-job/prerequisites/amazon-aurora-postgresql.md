---
{
    "title": "Amazon Aurora PostgreSQL",
    "language": "ko",
    "description": "Amazon Aurora PostgreSQL에서 논리적 복제를 활성화하고 동기화 사용자를 구성하여 Doris 스트리밍 데이터 적재의 사전 요구 사항을 충족하는 방법입니다.",
    "keywords": [
        "Amazon Aurora PostgreSQL",
        "Logical Replication",
        "rds.logical_replication",
        "Doris streaming ingestion",
        "Publication",
        "dbz_publication",
        "publication_name",
        "CDC prerequisites"
    ]
}
---

:::caution 실험적 기능

Doris 스트리밍 데이터 적재는 실험적 기능이며 Doris 4.1.5부터 지원됩니다.

:::

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Pre-deployment check / Environment preparation -->

Doris 스트리밍 데이터 적재는 **Amazon Aurora PostgreSQL-Compatible Edition 14 이상**에서 데이터 동기화를 지원합니다. 동기화하기 전에 Aurora 클러스터 측에서 논리적 복제(Logical Replication)를 활성화하고 관련 권한 부여를 완료해야 합니다. 이 문서는 DBA와 데이터 엔지니어를 대상으로 하며 전체 사전 요구 사항 구성 단계를 제공합니다.

### 사전 요구 사항 체크리스트 {#prerequisite-checklist}

구성을 시작하기 전에 다음 정보를 확인하세요.

| 확인 항목 | 요구 사항 |
| --- | --- |
| Aurora PostgreSQL 버전 | 14 이상 |
| 작업 권한 | AWS RDS 콘솔에서 클러스터 매개변수 그룹을 수정할 수 있는 권한 |
| 데이터베이스 권한 | 사용자 생성, 권한 부여 및 Publication 생성 권한 |
| 유지 관리 시간 | Aurora 쓰기 인스턴스를 재시작해도 됨(논리적 복제 매개변수 수정 후 재시작 필요) |

### 구성 절차 {#configuration-workflow}

전체 구성 절차는 5단계로 구성됩니다.

1. 현재 논리적 복제 구성 상태 확인
2. 클러스터 매개변수 그룹 구성
3. 클러스터 매개변수 그룹 적용 및 인스턴스 재시작
4. Doris 동기화 사용자 생성 및 권한 부여
5. Doris 버전에 따른 Publication 구성

1단계에서 논리적 복제가 이미 활성화된 것으로 확인되면 **4단계**로 바로 이동하여 동기화 사용자를 생성할 수 있습니다.

## 1단계: 현재 구성 확인 {#step-1-check-the-current-configuration}

<!-- Knowledge type: Procedure -->

**목적:** Aurora 클러스터에서 논리적 복제가 활성화되어 있는지 확인하고 매개변수 그룹을 수정해야 하는지 결정합니다.

Aurora 쓰기 인스턴스에 연결하여 다음 SQL을 실행하세요.

```sql
SHOW rds.logical_replication;
```

반환된 값에 따라 다음 작업을 선택하세요.

| 반환 값 | 의미 | 다음 작업 |
| --- | --- | --- |
| `on` | 논리적 복제가 활성화됨 | [4단계: 동기화 사용자 생성](#step-4-create-the-sync-user)으로 이동 |
| `off` | 논리적 복제가 활성화되지 않음 | [2단계: 클러스터 매개변수 그룹 구성](#step-2-configure-the-cluster-parameter-group) 계속 진행 |

## 2단계: 클러스터 매개변수 그룹 구성 {#step-2-configure-the-cluster-parameter-group}

<!-- Knowledge type: Configuration parameters -->

**목적:** 논리적 복제가 활성화된 DB Cluster Parameter Group을 생성하여 Aurora 클러스터에서 사용합니다.

단계:

1. [AWS RDS 콘솔](https://console.aws.amazon.com/rds/)에 로그인합니다.
2. 왼쪽 탐색 창에서 **Parameter groups**를 선택하고 **Create parameter group**을 클릭합니다.
3. 유형을 **DB Cluster Parameter Group**으로 설정하고 해당 Aurora PostgreSQL 버전 계열을 선택합니다.
4. 방금 만든 클러스터 매개변수 그룹을 편집하고 `rds.logical_replication`을 검색한 다음 값을 `1`로 설정합니다.

    ![PostgreSQL WAL Setting](/images/next/data-operate/streaming-job/pgwalsetting.png)

5. 저장하려면 **Save Changes**를 클릭합니다.

주요 매개변수 설명:

| 매개변수 | 권장 값 | 설명 |
| --- | --- | --- |
| `rds.logical_replication` | `1` | 논리적 복제를 활성화합니다. `0`은 비활성화를 의미합니다. |

## 3단계: 클러스터 매개변수 그룹 적용 및 재시작 {#step-3-apply-the-cluster-parameter-group-and-restart}

<!-- Knowledge type: Procedure -->

**목적:** 새로 만든 매개변수 그룹을 대상 Aurora 클러스터에 연결하고 쓰기 인스턴스를 재시작하여 구성을 적용합니다.

단계:

1. RDS 콘솔에서 대상 Aurora 클러스터를 선택하고 **Modify**를 클릭합니다.
2. **DB cluster parameter group**에서 2단계에서 만든 클러스터 매개변수 그룹을 선택합니다.
3. **Apply immediately**를 선택합니다.
4. 구성을 적용하려면 Aurora 쓰기 인스턴스를 재시작합니다.

:::caution
`rds.logical_replication` 매개변수를 수정하면 적용을 위해 Aurora 쓰기 인스턴스를 재시작해야 합니다. 업무가 한산한 시간대에 이 작업을 수행하세요.
:::

## 4단계: 동기화 사용자 생성 {#step-4-create-the-sync-user}

<!-- Knowledge type: Procedure -->

**목적:** Doris 스트리밍 데이터 적재를 위한 전용 계정을 생성하고 데이터를 읽고 복제를 수행하는 데 필요한 최소 권한을 부여합니다.

1. 전용 사용자를 생성합니다.

    ```sql
    CREATE USER doris_sync PASSWORD '<password>';
    ```

2. 스키마와 테이블에 대한 읽기 권한을 부여합니다(`public` 스키마를 예로 들며 필요에 따라 바꾸세요).

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

| 권한 | 목적 |
| --- | --- |
| `USAGE ON SCHEMA` | 지정된 스키마에 액세스할 수 있습니다. |
| `SELECT ON ALL TABLES` | 스키마에 있는 기존 모든 테이블의 데이터를 읽을 수 있습니다. |
| `ALTER DEFAULT PRIVILEGES ... GRANT SELECT` | 이 스키마에서 이후 생성되는 테이블에 읽기 권한을 자동으로 부여합니다. |
| `rds_replication` | Aurora PostgreSQL에서 논리적 복제를 수행하는 데 필요한 역할입니다. |

## 5단계: Publication 구성 {#step-5-configure-the-publication}

<!-- Knowledge type: Procedure -->

기본적으로 Publication을 수동으로 생성할 필요는 없습니다. `publication_name`을 설정하지 않으면 Doris는 동기화 계정을 사용하여 `doris_pub_<job_id>`라는 Publication을 생성하고 작업이 삭제될 때 이를 정리합니다. 따라서 동기화 계정에는 Publication 생성 권한이 필요합니다.

Streaming Job을 만들 때 `publication_name`을 명시적으로 설정하는 경우에는 먼저 같은 이름의 Publication을 생성해야 합니다. 사용자 지정 Publication에는 작업에서 동기화하는 모든 소스 테이블이 포함되어야 하며, 유지 관리와 정리는 사용자가 담당해야 합니다. 예:

```sql
CREATE PUBLICATION doris_pub_custom
FOR TABLE public.orders, public.customers;
```

작업을 만들 때 `"publication_name" = "doris_pub_custom"`으로 설정합니다. 이름에는 소문자, 숫자 및 밑줄만 포함할 수 있고 숫자로 시작할 수 없으며 최대 63자입니다.

## FAQ {#faq}

<!-- Knowledge type: FAQ -->

**Q1: `SHOW rds.logical_replication;`의 결과가 `on`입니다. 그 밖에 무엇을 해야 하나요?**

클러스터 매개변수 그룹을 수정하거나 인스턴스를 재시작할 필요가 없습니다. [4단계: 동기화 사용자 생성](#step-4-create-the-sync-user)에서 바로 시작하면 됩니다.

**Q2: Aurora PostgreSQL 13 이하 버전도 지원되나요?**

아니요. Doris 스트리밍 데이터 적재에는 Aurora PostgreSQL 14 이상이 필요합니다.

**Q3: 사용자 지정 이름의 Publication을 사용할 수 있나요?**

`publication_name`을 통해 사용자 지정 이름을 지정할 수 있지만, 작업을 만들기 전에 Publication을 생성하고 모든 동기화 테이블이 포함되어 있는지 확인해야 합니다.

**Q4: 동기화할 때 superuser 계정을 사용해야 하나요?**

아니요. `publication_name`을 생략하면 Doris가 기본 Publication을 자동으로 생성하고 관리합니다. 사용자 지정 Publication을 사용하는 경우에만 미리 생성해야 합니다.

## 문제 해결 {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Pre-sync prerequisite check failure -->

| 문제 현상 | 가능한 원인 | 해결 방법 |
| --- | --- | --- |
| `SHOW rds.logical_replication;`이 계속 `off`를 반환함 | 새 매개변수 그룹이 클러스터에 연결되지 않았거나 쓰기 인스턴스가 재시작되지 않음 | **DB cluster parameter group**이 새 매개변수 그룹으로 전환되었는지 확인하고 쓰기 인스턴스를 재시작합니다. |
| 사용자 생성 또는 권한 부여 실패 | 현재 로그인 계정의 권한이 부족함 | `rds_superuser` 또는 동등한 권한을 가진 계정으로 로그인한 후 작업합니다. |
| `GRANT rds_replication`에서 오류 반환 | 현재 Aurora 버전이 너무 낮거나 클러스터가 Aurora PostgreSQL이 아님 | Aurora PostgreSQL 14 이상으로 업그레이드합니다. |
| 기본 Publication을 생성할 수 없음 | 동기화 계정에 Publication 생성 권한이 없음 | 동기화 계정에 필요한 권한을 부여하거나 관리자가 미리 사용자 지정 Publication을 생성하고 `publication_name`을 구성하도록 합니다. |
| 사용자 지정 Publication이 존재하지 않음 | `publication_name`이 구성되었지만 같은 이름의 Publication이 미리 생성되지 않음 | [5단계](#step-5-configure-the-publication)에 설명된 대로 Publication을 생성하거나 `publication_name` 구성을 제거합니다. |
