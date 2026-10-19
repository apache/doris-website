---
{
    "title": "Amazon RDS PostgreSQL",
    "language": "ko",
    "description": "Doris 스트리밍 수집을 준비하기 위해 Amazon RDS PostgreSQL에서 논리적 복제를 활성화하고 동기화 사용자와 Publication을 설정합니다.",
    "keywords": [
        "Amazon RDS PostgreSQL",
        "Doris 스트리밍 수집",
        "Logical Replication",
        "rds.logical_replication",
        "rds_replication",
        "Publication",
        "dbz_publication",
        "publication_name",
        "CDC 동기화"
    ]
}
---

<!-- Knowledge type: Procedure / Configuration parameters -->
<!-- Applicable scenario: Pre-deployment check / Environment preparation -->

Doris 스트리밍 수집은 **Amazon RDS PostgreSQL 14 이상**의 데이터 동기화를 지원합니다. 동기화 작업을 시작하기 전에 RDS 인스턴스에서 **Logical Replication**을 활성화하고 동기화 사용자, 권한, Publication 설정을 완료해야 합니다.

이 문서는 RDS PostgreSQL 인스턴스 관리자를 대상으로 하며, Doris 스트리밍 수집에 필요한 사전 준비 절차를 설명합니다.

### 사전 점검 체크리스트 {#pre-check-checklist}

설정을 시작하기 전에 다음 조건을 확인하세요.

| 점검 항목 | 요구 사항 |
| --- | --- |
| RDS PostgreSQL 버전 | 14 이상 |
| 작업 권한 | 파라미터 그룹을 수정하고 인스턴스를 재시작할 수 있는 AWS 권한 |
| 데이터베이스 권한 | 사용자 생성, 권한 부여, Publication 생성 권한 |
| 유지보수 시간대 | 사용량이 적은 시간대로 계획되어 있어야 함(논리적 복제 파라미터를 수정하면 인스턴스를 재시작해야 함) |

### 설정 절차 개요 {#configuration-flow-overview}

전체 설정 절차는 다음과 같습니다.

1. `rds.logical_replication`의 현재 상태 확인
2. 사용자 지정 파라미터 그룹 생성 및 설정(활성화되지 않은 경우)
3. 인스턴스에 파라미터 그룹 적용 후 재시작
4. Doris 동기화 사용자 생성 및 권한 부여
5. Doris 버전에 따른 Publication 설정

---

## 1단계: 현재 설정 확인 {#step-1-check-the-current-configuration}

<!-- Knowledge type: Procedure -->

**목적**: RDS 인스턴스에서 현재 논리적 복제가 활성화되어 있는지 확인하고, 파라미터 그룹을 수정해야 하는지 판단합니다.

RDS 인스턴스에 연결한 후 다음 SQL을 실행합니다.

```sql
SHOW rds.logical_replication;
```

결과에 따라 다음 단계를 선택합니다.

| 반환 값 | 의미 | 다음 단계 |
| --- | --- | --- |
| `on` | 논리적 복제가 활성화되어 있음 | [4단계: 동기화 사용자 생성](#step-4-create-the-sync-user)으로 이동 |
| `off` | 논리적 복제가 활성화되어 있지 않음 | [2단계](#step-2-configure-the-parameter-group) 진행 |

---

## 2단계: 파라미터 그룹 설정 {#step-2-configure-the-parameter-group}

<!-- Knowledge type: Procedure / Configuration parameters -->

**목적**: 사용자 지정 파라미터 그룹을 생성하고 `rds.logical_replication`을 활성화합니다.

절차:

1. [AWS RDS 콘솔](https://console.aws.amazon.com/rds/)에 로그인합니다.
2. 왼쪽 탐색 창에서 **파라미터 그룹**을 선택하고 **파라미터 그룹 생성**을 클릭합니다.
3. 대상 인스턴스와 일치하는 PostgreSQL 버전 계열을 선택하고 새 파라미터 그룹을 생성합니다.
4. 파라미터 그룹을 편집하고 `rds.logical_replication`을 검색한 다음, 값을 `1`로 설정합니다.

    ![PostgreSQL WAL 설정](/images/next/data-operate/streaming-job/pgwalsetting.png)

5. **변경 사항 저장**을 클릭하여 저장합니다.

주요 파라미터 설명:

| 파라미터 | 값 | 설명 |
| --- | --- | --- |
| `rds.logical_replication` | `1` | 논리적 복제를 활성화하며, `wal_level`을 `logical`로 설정하는 것과 같음 |

---

## 3단계: 파라미터 그룹 적용 및 재시작 {#step-3-apply-the-parameter-group-and-restart}

<!-- Knowledge type: Procedure -->

**목적**: 새 파라미터 그룹을 RDS 인스턴스에 연결하고 재시작하여 설정을 적용합니다.

절차:

1. RDS 콘솔에서 대상 인스턴스를 선택하고 **수정**을 클릭합니다.
2. **DB 파라미터 그룹**에서 [2단계](#step-2-configure-the-parameter-group)에서 생성한 파라미터 그룹을 선택합니다.
3. **즉시 적용**을 선택하여 변경 사항을 즉시 적용합니다.
4. RDS 인스턴스를 재시작하여 설정을 적용합니다.

:::caution
`rds.logical_replication` 파라미터를 수정한 후에는 RDS 인스턴스를 재시작해야 변경 사항이 적용됩니다. 사용량이 적은 시간대에 이 작업을 수행하세요.
:::

---

## 4단계: 동기화 사용자 생성 {#step-4-create-the-sync-user}

<!-- Knowledge type: Procedure / Configuration parameters -->

**목적**: Doris 스트리밍 수집 전용 데이터베이스 계정을 생성하고 필요한 읽기 및 복제 권한을 부여합니다.

### 1. 사용자 생성 {#1-create-the-user}

```sql
CREATE USER doris_sync PASSWORD '<password>';
```

### 2. 스키마 접근 권한 부여 {#2-grant-schema-access-privileges}

다음은 `public` 스키마를 사용한 예시입니다. 필요에 따라 대상 스키마로 바꾸세요.

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
Amazon RDS PostgreSQL은 표준 PostgreSQL의 `rds_replication` 역할을 사용하여 복제 권한을 부여하며, `REPLICATION` 속성은 사용하지 않습니다.
:::

권한 개요:

| 권한 | 용도 |
| --- | --- |
| `USAGE ON SCHEMA` | 지정된 스키마에 대한 접근 허용 |
| `SELECT ON ALL TABLES` | 스키마 내 기존의 모든 테이블 읽기 허용 |
| `ALTER DEFAULT PRIVILEGES ... SELECT` | 향후 추가되는 테이블에 대한 `SELECT` 권한 자동 부여 |
| `rds_replication` | RDS에서 논리적 복제를 수행하는 데 필요한 역할 |

---

## 5단계: Publication 설정 {#step-5-configure-the-publication}

<!-- Knowledge type: Procedure / Configuration parameters -->

### Doris 4.0 {#doris-40}

이름이 `dbz_publication`인 Publication을 `FOR ALL TABLES`로 미리 생성해야 합니다.

```sql
CREATE PUBLICATION dbz_publication FOR ALL TABLES;
```

동기화 사용자에게 `rds_superuser` 역할과 같은 슈퍼유저 권한이 있으면, 작업이 시작될 때 Doris가 `dbz_publication`을 자동으로 생성할 수 있으므로 이 구문을 수동으로 실행할 필요가 없습니다. Doris 4.0은 사용자 지정 Publication 이름이나 일부 테이블만 포함하는 Publication을 지원하지 않습니다.

### Doris 4.1.0 이상 {#doris-410-and-later}

기본적으로 Publication을 수동으로 생성할 필요가 없습니다. `publication_name`이 설정되지 않으면 Doris는 동기화 계정을 사용하여 이름이 `doris_pub_<job_id>`인 Publication을 생성하고, 작업이 삭제되면 이를 정리합니다. 따라서 동기화 계정에는 Publication 생성 권한이 필요합니다.

Streaming Job을 생성할 때 `publication_name`을 명시적으로 설정하는 경우, 같은 이름의 Publication을 미리 생성하세요. 사용자 지정 Publication에는 해당 작업이 동기화하는 모든 소스 테이블이 포함되어야 하며, 사용자가 직접 유지 관리하고 정리해야 합니다. 예를 들면 다음과 같습니다.

```sql
CREATE PUBLICATION doris_pub_custom
FOR TABLE public.orders, public.customers;
```

작업을 생성할 때 `"publication_name" = "doris_pub_custom"`을 설정합니다. 이름에는 영문 소문자, 숫자, 밑줄만 사용할 수 있으며, 숫자로 시작할 수 없고 길이는 63자로 제한됩니다.

---

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->

**Q1: `SHOW rds.logical_replication;`이 `on`을 반환해도 인스턴스를 재시작해야 하나요?**

아니요. `on`은 논리적 복제가 이미 적용되어 있다는 뜻이므로 [4단계: 동기화 사용자 생성](#step-4-create-the-sync-user)으로 바로 이동할 수 있습니다.

**Q2: 다른 이름의 Publication을 사용할 수 있나요?**

Doris 4.0은 사용자 지정 이름을 지원하지 않으며, `dbz_publication FOR ALL TABLES`만 지원합니다. 4.1.0 버전부터는 `publication_name`으로 사용자 지정 이름을 지정할 수 있지만, 작업을 생성하기 전에 Publication을 생성하고 동기화할 모든 테이블이 포함되어 있는지 확인해야 합니다.

**Q3: 반드시 `rds_replication` 역할을 사용해야 하나요?**

네. 보안상의 이유로 RDS PostgreSQL에서는 표준 PostgreSQL의 `REPLICATION` 속성을 사용할 수 없습니다. 반드시 `GRANT rds_replication`을 통해 권한을 부여해야 합니다.

**Q4: Publication을 반드시 수동으로 생성해야 하나요?**

Doris 4.0에서는 일반 동기화 사용자가 `dbz_publication`을 수동으로 생성해야 하며, 사용자에게 슈퍼유저 권한이 있으면 Doris가 자동으로 생성할 수 있습니다. 4.1.0 버전부터는 `publication_name`을 생략하면 Doris가 기본 Publication을 자동으로 생성하고 관리합니다. 사용자 지정 Publication만 미리 생성하면 됩니다. 자세한 내용은 [5단계](#step-5-configure-the-publication)를 참고하세요.

---

## 문제 해결 {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->

| 증상 | 가능한 원인 | 해결 방법 |
| --- | --- | --- |
| `SHOW rds.logical_replication;`이 여전히 `off`를 반환함 | 파라미터 그룹이 인스턴스에 연결되지 않았거나 인스턴스를 재시작하지 않음 | 인스턴스가 새 파라미터 그룹을 사용하는지 확인하고 재시작 |
| 사용자 생성 시 권한 오류 발생 | 현재 계정의 권한이 부족함 | 사용자 생성 권한이 있는 관리자 계정 사용 |
| `GRANT rds_replication` 실행 시 오류 발생 | 현재 계정에 이 역할을 부여할 권한이 없음 | `rds_superuser` 계정 또는 역할 부여 권한이 있는 다른 계정 사용 |
| Doris 4.0에서 `dbz_publication`이 존재하지 않는다는 오류 발생 | `dbz_publication`이 생성되지 않았고 동기화 계정에 슈퍼유저 권한이 없음 | `CREATE PUBLICATION dbz_publication FOR ALL TABLES;` 실행 또는 필요한 권한이 있는 계정 사용 |
| Doris 4.1.0 이상에서 기본 Publication 생성 실패 | 동기화 계정에 Publication 생성 권한이 없음 | 동기화 계정에 필요한 권한을 부여하거나, 관리자가 사용자 지정 Publication을 미리 생성한 후 `publication_name` 설정 |
| Doris 4.1.0 이상에서 사용자 지정 Publication이 존재하지 않는다는 오류 발생 | `publication_name`이 설정되어 있지만 같은 이름의 Publication이 생성되지 않음 | [5단계](#step-5-configure-the-publication)에 따라 Publication을 생성하거나, `publication_name`을 제거하여 Doris가 관리하는 기본 Publication 사용 |
| 파라미터 변경 사항이 적용되지 않음 | **즉시 적용**을 선택하지 않았거나 인스턴스를 재시작하지 않음 | [3단계](#step-3-apply-the-parameter-group-and-restart) 다시 수행 |
