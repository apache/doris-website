---
{
    "title": "Amazon RDS PostgreSQL",
    "language": "ko",
    "description": "Amazon RDS PostgreSQL에서 논리 복제를 활성화하고 동기화 사용자와 Publication을 구성하여 Doris 스트리밍 수집을 위한 사전 준비를 완료합니다.",
    "keywords": [
        "Amazon RDS PostgreSQL",
        "Doris streaming ingestion",
        "Logical Replication",
        "rds.logical_replication",
        "rds_replication",
        "Publication",
        "dbz_publication",
        "publication_name",
        "CDC sync"
    ]
}
---

:::caution 실험적 기능

Doris 스트리밍 수집은 실험적 기능이며 Doris 4.1.5부터 지원됩니다.

:::

<!-- Knowledge type: Procedure / Configuration parameters -->
<!-- Applicable scenario: Pre-deployment check / Environment preparation -->

Doris 스트리밍 수집은 **Amazon RDS PostgreSQL 14 이상**에서 데이터 동기화를 지원합니다. 동기화 작업을 시작하기 전에 RDS 인스턴스에서 **논리 복제(Logical Replication)**를 활성화하고 동기화 사용자, 권한 및 Publication 구성을 완료해야 합니다.

이 문서는 RDS PostgreSQL 인스턴스 관리자를 대상으로 하며 Doris 스트리밍 수집에 필요한 사전 준비 단계를 설명합니다.

### 사전 점검 체크리스트 {#pre-check-checklist}

구성을 시작하기 전에 다음 조건을 확인합니다:

| 점검 항목 | 요구 사항 |
| --- | --- |
| RDS PostgreSQL 버전 | 14 이상 |
| 작업 권한 | 파라미터 그룹을 수정하고 인스턴스를 재시작할 수 있는 AWS 권한 |
| 데이터베이스 권한 | 사용자를 생성하고 권한을 부여하며 Publication을 생성할 수 있는 권한 |
| 유지 관리 창 | 업무 비수기 시간이 계획되어 있음(논리 복제 파라미터를 수정하려면 인스턴스를 재시작해야 함) |

### 구성 흐름 개요 {#configuration-flow-overview}

전체 구성 흐름은 다음과 같습니다:

1. `rds.logical_replication`의 현재 상태 확인
2. 사용자 지정 파라미터 그룹 생성 및 구성(활성화되지 않은 경우)
3. 파라미터 그룹을 인스턴스에 적용하고 재시작
4. Doris 동기화 사용자 생성 및 권한 부여
5. Doris 버전에 따라 Publication 구성

---

## 1단계: 현재 구성 확인 {#step-1-check-the-current-configuration}

<!-- Knowledge type: Procedure -->

**목적**: RDS 인스턴스에서 논리 복제가 현재 활성화되어 있는지 확인하고 파라미터 그룹 수정 필요 여부를 결정합니다.

RDS 인스턴스에 연결한 후 다음 SQL을 실행합니다:

```sql
SHOW rds.logical_replication;
```

결과에 따라 다음 경로를 선택합니다:

| 반환 값 | 의미 | 다음 단계 |
| --- | --- | --- |
| `on` | 논리 복제가 활성화됨 | [4단계: 동기화 사용자 생성](#step-4-create-the-sync-user)으로 이동 |
| `off` | 논리 복제가 활성화되지 않음 | [2단계](#step-2-configure-the-parameter-group) 계속 진행 |

---

## 2단계: 파라미터 그룹 구성 {#step-2-configure-the-parameter-group}

<!-- Knowledge type: Procedure / Configuration parameters -->

**목적**: 사용자 지정 파라미터 그룹을 생성하고 `rds.logical_replication`을 활성화됨으로 설정합니다.

단계:

1. [AWS RDS 콘솔](https://console.aws.amazon.com/rds/)에 로그인합니다.
2. 왼쪽 탐색 창에서 **파라미터 그룹(Parameter groups)**을 선택하고 **파라미터 그룹 생성(Create parameter group)**을 클릭합니다.
3. 대상 인스턴스와 일치하는 PostgreSQL 버전 계열을 선택하고 새 파라미터 그룹을 생성합니다.
4. 파라미터 그룹을 편집하고 `rds.logical_replication`을 검색한 후 값을 `1`로 설정합니다:

    ![PostgreSQL WAL 설정](/images/next/data-operate/streaming-job/pgwalsetting.png)

5. **변경 사항 저장(Save Changes)**을 클릭하여 저장합니다.

주요 파라미터 설명:

| 파라미터 | 값 | 설명 |
| --- | --- | --- |
| `rds.logical_replication` | `1` | 논리 복제를 활성화합니다. `wal_level`을 `logical`로 설정하는 것과 동일합니다 |

---

## 3단계: 파라미터 그룹 적용 및 재시작 {#step-3-apply-the-parameter-group-and-restart}

<!-- Knowledge type: Procedure -->

**목적**: 새 파라미터 그룹을 RDS 인스턴스에 연결하고 재시작하여 구성을 적용합니다.

단계:

1. RDS 콘솔에서 대상 인스턴스를 선택하고 **수정(Modify)**을 클릭합니다.
2. **DB 파라미터 그룹(DB parameter group)**에서 [2단계](#step-2-configure-the-parameter-group)에서 생성한 파라미터 그룹을 선택합니다.
3. **즉시 적용(Apply immediately)**을 선택하여 변경 사항을 즉시 적용합니다.
4. 구성을 적용하려면 RDS 인스턴스를 재시작합니다.

:::caution
`rds.logical_replication` 파라미터를 수정하면 적용을 위해 RDS 인스턴스를 재시작해야 합니다. 업무 비수기 시간에 이 작업을 수행합니다.
:::

---

## 4단계: 동기화 사용자 생성 {#step-4-create-the-sync-user}

<!-- Knowledge type: Procedure / Configuration parameters -->

**목적**: Doris 스트리밍 수집 전용 데이터베이스 계정을 생성하고 필요한 읽기 및 복제 권한을 부여합니다.

### 1. 사용자 생성 {#1-create-the-user}

```sql
CREATE USER doris_sync PASSWORD '<password>';
```

### 2. Schema 액세스 권한 부여 {#2-grant-schema-access-privileges}

다음 예에서는 `public` Schema를 사용합니다. 필요에 따라 대상 Schema로 바꿉니다:

```sql
GRANT USAGE ON SCHEMA "public" TO doris_sync;
GRANT SELECT ON ALL TABLES IN SCHEMA "public" TO doris_sync;
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" GRANT SELECT ON TABLES TO doris_sync;
```

### 3. 복제 권한 부여 {#3-grant-replication-privileges}

```sql
GRANT rds_replication TO doris_sync;
```

:::tip
Amazon RDS PostgreSQL은 표준 PostgreSQL의 `REPLICATION` 속성 대신 `rds_replication` 역할을 사용하여 복제 권한을 부여합니다.
:::

권한 개요:

| 권한 | 목적 |
| --- | --- |
| `USAGE ON SCHEMA` | 지정된 Schema에 액세스할 수 있도록 합니다 |
| `SELECT ON ALL TABLES` | Schema의 기존 모든 테이블을 읽을 수 있도록 합니다 |
| `ALTER DEFAULT PRIVILEGES ... SELECT` | 향후 추가되는 테이블에 `SELECT` 권한을 자동으로 부여합니다 |
| `rds_replication` | RDS에서 논리 복제를 수행하는 데 필요한 역할 |

---

## 5단계: Publication 구성 {#step-5-configure-the-publication}

<!-- Knowledge type: Procedure / Configuration parameters -->

기본적으로 Publication을 수동으로 생성할 필요는 없습니다. `publication_name`을 설정하지 않으면 Doris가 동기화 계정을 사용하여 `doris_pub_<job_id>`라는 Publication을 생성하고 작업이 삭제될 때 정리합니다. 따라서 동기화 계정에 Publication 생성 권한이 필요합니다.

Streaming Job을 생성할 때 `publication_name`을 명시적으로 설정한 경우에는 같은 이름의 Publication을 미리 생성합니다. 사용자 지정 Publication에는 작업에서 동기화하는 모든 원본 테이블이 포함되어야 하며, 유지 관리와 정리는 사용자가 담당합니다. 예:

```sql
CREATE PUBLICATION doris_pub_custom
FOR TABLE public.orders, public.customers;
```

작업을 생성할 때 `"publication_name" = "doris_pub_custom"`으로 설정합니다. 이름에는 소문자, 숫자 및 밑줄만 사용할 수 있고 숫자로 시작할 수 없으며 최대 63자입니다.

---

## FAQ {#faq}

<!-- Knowledge type: FAQ -->

**Q1: `SHOW rds.logical_replication;`이 `on`을 반환하면 인스턴스를 다시 시작해야 하나요?**

아니요. `on`은 논리 복제가 이미 적용 중임을 의미하므로 [4단계: 동기화 사용자 생성](#step-4-create-the-sync-user)으로 바로 이동할 수 있습니다.

**Q2: 다른 이름의 Publication을 사용할 수 있나요?**

`publication_name`을 통해 사용자 지정 이름을 지정할 수 있지만, 작업을 생성하기 전에 Publication을 생성하고 모든 동기화 테이블이 포함되도록 해야 합니다.

**Q3: `rds_replication` 역할을 반드시 사용해야 하나요?**

예. RDS PostgreSQL은 보안상의 이유로 표준 PostgreSQL `REPLICATION` 속성 사용을 허용하지 않습니다. `GRANT rds_replication`을 통해 권한을 부여해야 합니다.

**Q4: Publication을 반드시 수동으로 생성해야 하나요?**

`publication_name`을 생략하면 Doris가 기본 Publication을 자동으로 생성하고 관리합니다. 사용자 지정 Publication을 사용하는 경우에만 미리 생성해야 합니다. 자세한 내용은 [5단계](#step-5-configure-the-publication)를 참조하세요.

---

## 문제 해결 {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->

| 증상 | 가능한 원인 | 해결 방법 |
| --- | --- | --- |
| `SHOW rds.logical_replication;`이 계속 `off`를 반환함 | 파라미터 그룹이 인스턴스에 연결되지 않았거나 인스턴스가 재시작되지 않음 | 인스턴스가 새 파라미터 그룹을 사용하는지 확인하고 재시작합니다 |
| 사용자 생성 시 권한 오류 발생 | 현재 계정에 충분한 권한이 없음 | 사용자 생성 권한이 있는 관리자 계정을 사용합니다 |
| `GRANT rds_replication` 실행 시 오류 발생 | 현재 계정에 이 역할을 부여할 권한이 없음 | `rds_superuser` 계정 또는 권한 부여 권한이 있는 다른 계정을 사용합니다 |
| 기본 Publication을 생성할 수 없음 | 동기화 계정에 Publication 생성 권한이 없음 | 동기화 계정에 필요한 권한을 부여하거나 관리자가 사용자 지정 Publication을 미리 생성하고 `publication_name`을 구성합니다 |
| 사용자 지정 Publication이 존재하지 않음 | `publication_name`이 구성되었지만 같은 이름의 Publication이 생성되지 않음 | [5단계](#step-5-configure-the-publication)에 설명된 대로 Publication을 생성하거나 `publication_name`을 제거하여 Doris가 관리하는 기본 Publication을 사용합니다 |
| 파라미터 변경 사항이 적용되지 않음 | **즉시 적용(Apply immediately)**을 선택하지 않았거나 인스턴스를 재시작하지 않음 | [3단계](#step-3-apply-the-parameter-group-and-restart)를 다시 실행합니다 |
