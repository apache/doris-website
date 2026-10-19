---
{
    "title": "Amazon Aurora PostgreSQL",
    "language": "ko",
    "description": "Doris 스트리밍 수집의 사전 요구 사항을 충족하도록 Amazon Aurora PostgreSQL에서 논리적 복제를 활성화하고 동기화 사용자를 설정하는 방법입니다.",
    "keywords": [
        "Amazon Aurora PostgreSQL",
        "논리적 복제",
        "rds.logical_replication",
        "Doris 스트리밍 수집",
        "Publication",
        "dbz_publication",
        "CDC 사전 요구 사항"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Pre-deployment check / Environment preparation -->

Doris 스트리밍 수집은 **Amazon Aurora PostgreSQL-Compatible Edition 14 이상**에서 데이터 동기화를 지원합니다. 동기화를 시작하기 전에 Aurora 클러스터에서 논리적 복제를 활성화하고 관련 권한을 부여해야 합니다. 이 문서는 DBA와 데이터 엔지니어를 대상으로 하며, 사전 요구 사항을 충족하기 위한 전체 설정 절차를 안내합니다.

### 사전 요구 사항 체크리스트 {#prerequisite-checklist}

설정을 시작하기 전에 다음 사항을 확인하세요.

| 확인 항목 | 요구 사항 |
| --- | --- |
| Aurora PostgreSQL 버전 | 14 이상 |
| 작업 권한 | AWS RDS 콘솔에서 클러스터 파라미터 그룹을 수정할 수 있는 권한 |
| 데이터베이스 권한 | 사용자 생성, 권한 부여 및 Publication 생성 권한 |
| 유지보수 시간대 | Aurora writer 인스턴스를 재시작할 수 있어야 함(논리적 복제 파라미터를 수정한 후 재시작 필요) |

### 설정 흐름 {#configuration-workflow}

전체 설정 과정은 5단계로 구성됩니다.

1. 현재 논리적 복제 설정 상태 확인
2. 클러스터 파라미터 그룹 설정
3. 클러스터 파라미터 그룹 적용 및 인스턴스 재시작
4. Doris 동기화 사용자 생성 및 권한 부여
5. Publication 생성

1단계에서 논리적 복제가 이미 활성화된 것으로 확인되면 바로 **4단계**로 이동하여 동기화 사용자를 생성할 수 있습니다.

## 1단계: 현재 설정 확인 {#step-1-check-the-current-configuration}

<!-- Knowledge type: Procedure -->

**목적:** Aurora 클러스터에서 논리적 복제가 활성화되어 있는지 확인하고, 파라미터 그룹을 수정해야 하는지 판단합니다.

Aurora writer 인스턴스에 연결하고 다음 SQL을 실행하세요.

```sql
SHOW rds.logical_replication;
```

반환된 값에 따라 다음 작업을 선택하세요.

| 반환 값 | 의미 | 다음 작업 |
| --- | --- | --- |
| `on` | 논리적 복제가 활성화되어 있음 | [4단계: 동기화 사용자 생성](#step-4-create-the-sync-user)으로 이동 |
| `off` | 논리적 복제가 활성화되어 있지 않음 | [2단계: 클러스터 파라미터 그룹 설정](#step-2-configure-the-cluster-parameter-group)으로 진행 |

## 2단계: 클러스터 파라미터 그룹 설정 {#step-2-configure-the-cluster-parameter-group}

<!-- Knowledge type: Configuration parameters -->

**목적:** Aurora 클러스터에서 사용할 수 있도록 논리적 복제가 활성화된 DB 클러스터 파라미터 그룹을 생성합니다.

절차:

1. [AWS RDS 콘솔](https://console.aws.amazon.com/rds/)에 로그인합니다.
2. 왼쪽 탐색 창에서 **파라미터 그룹**을 선택하고 **파라미터 그룹 생성**을 클릭합니다.
3. 유형을 **DB 클러스터 파라미터 그룹**으로 설정하고, 해당 Aurora PostgreSQL 버전의 패밀리를 선택합니다.
4. 방금 생성한 클러스터 파라미터 그룹을 편집하고, `rds.logical_replication`을 검색하여 값을 `1`로 설정합니다.

    ![PostgreSQL WAL 설정](/images/next/data-operate/streaming-job/pgwalsetting.png)

5. **변경 사항 저장**을 클릭하여 저장합니다.

주요 파라미터 설명:

| 파라미터 | 권장 값 | 설명 |
| --- | --- | --- |
| `rds.logical_replication` | `1` | 논리적 복제 활성화. `0`은 비활성화를 의미함 |

## 3단계: 클러스터 파라미터 그룹 적용 및 재시작 {#step-3-apply-the-cluster-parameter-group-and-restart}

<!-- Knowledge type: Procedure -->

**목적:** 새로 생성한 파라미터 그룹을 대상 Aurora 클러스터에 연결하고, writer 인스턴스를 재시작하여 설정을 적용합니다.

절차:

1. RDS 콘솔에서 대상 Aurora 클러스터를 선택하고 **수정**을 클릭합니다.
2. **DB 클러스터 파라미터 그룹**에서 2단계에서 생성한 클러스터 파라미터 그룹을 선택합니다.
3. **즉시 적용**을 선택합니다.
4. Aurora writer 인스턴스를 재시작하여 설정을 적용합니다.

:::caution
`rds.logical_replication` 파라미터를 수정한 후에는 Aurora writer 인스턴스를 재시작해야 변경 사항이 적용됩니다. 이 작업은 서비스 사용량이 적은 시간대에 수행하세요.
:::

## 4단계: 동기화 사용자 생성 {#step-4-create-the-sync-user}

<!-- Knowledge type: Procedure -->

**목적:** Doris 스트리밍 수집 전용 계정을 생성하고, 데이터 읽기와 복제 수행에 필요한 최소한의 권한을 부여합니다.

1. 전용 사용자를 생성합니다.

    ```sql
    CREATE USER doris_sync PASSWORD '<password>';
    ```

2. 스키마와 테이블에 대한 읽기 권한을 부여합니다(아래 예시는 `public` 스키마를 사용하며, 필요에 따라 변경하세요).

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
| `USAGE ON SCHEMA` | 지정된 스키마에 대한 접근 허용 |
| `SELECT ON ALL TABLES` | 스키마에 이미 존재하는 모든 테이블의 데이터 읽기 허용 |
| `ALTER DEFAULT PRIVILEGES ... GRANT SELECT` | 이후 이 스키마에 생성되는 테이블에 대한 읽기 권한 자동 부여 |
| `rds_replication` | Aurora PostgreSQL에서 논리적 복제를 수행하는 데 필요한 역할 |

## 5단계: Publication 생성 {#step-5-create-the-publication}

<!-- Knowledge type: Procedure -->

**목적:** Doris가 구독할 Publication을 생성합니다.

다음 SQL을 실행하세요.

```sql
CREATE PUBLICATION dbz_publication FOR ALL TABLES;
```

:::caution
현재 Doris는 이름이 `dbz_publication`인 Publication만 지원하며, 반드시 `FOR ALL TABLES`로 설정해야 합니다. 사용자 지정 Publication 이름이나 일부 테이블만 지정하는 방식은 아직 지원되지 않습니다.
:::

> **참고:** 동기화 사용자에게 슈퍼유저 권한(예: `rds_superuser` 역할)이 있으면 Doris가 Publication을 자동으로 생성하므로 이 단계를 수동으로 수행할 필요가 없습니다.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->

**Q1: `SHOW rds.logical_replication;`이 `on`을 반환합니다. 추가로 어떤 작업을 해야 하나요?**

클러스터 파라미터 그룹을 수정하거나 인스턴스를 재시작할 필요가 없습니다. [4단계: 동기화 사용자 생성](#step-4-create-the-sync-user)부터 바로 시작하세요.

**Q2: Aurora PostgreSQL 13 이하 버전도 지원되나요?**

아니요. Doris 스트리밍 수집에는 Aurora PostgreSQL 14 이상이 필요합니다.

**Q3: 사용자 지정 이름의 Publication을 사용할 수 있나요?**

아니요. 현재 Doris는 이름이 `dbz_publication`이고 `FOR ALL TABLES`로 설정된 Publication만 지원합니다.

**Q4: 동기화에 반드시 슈퍼유저 계정을 사용해야 하나요?**

아니요. 일반 사용자 `doris_sync`를 사용하고 이 문서에 설명된 대로 권한을 부여하는 것을 권장합니다. 계정에 슈퍼유저 권한(예: `rds_superuser`)이 있는 경우에만 Doris가 Publication을 자동으로 생성합니다.

## 문제 해결 {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Pre-sync prerequisite check failure -->

| 증상 | 가능한 원인 | 해결 방법 |
| --- | --- | --- |
| `SHOW rds.logical_replication;`이 여전히 `off`를 반환함 | 새 파라미터 그룹이 클러스터에 연결되지 않았거나 writer 인스턴스가 재시작되지 않음 | **DB 클러스터 파라미터 그룹**이 새 파라미터 그룹으로 변경되었는지 확인하고 writer 인스턴스를 재시작 |
| 사용자 생성 또는 권한 부여 실패 | 현재 로그인한 계정의 권한이 부족함 | `rds_superuser` 또는 이에 준하는 권한이 있는 계정으로 로그인한 후 작업 수행 |
| `GRANT rds_replication`이 오류를 반환함 | 현재 Aurora 버전이 너무 낮거나 클러스터가 Aurora PostgreSQL이 아님 | Aurora PostgreSQL 14 이상으로 업그레이드 |
| Publication 생성 시 권한 오류 발생 | `doris_sync` 사용자에게 Publication 생성 권한이 없음 | 슈퍼유저 계정으로 `CREATE PUBLICATION`을 수동 실행하거나 동기화 계정에 필요한 권한을 일시적으로 부여 |
| 동기화 시작 시 Doris가 `dbz_publication`을 찾을 수 없다고 보고함 | Publication이 생성되지 않았고 동기화 계정에 슈퍼유저 권한이 없어 자동으로 생성할 수 없음 | 5단계의 `CREATE PUBLICATION dbz_publication FOR ALL TABLES;`를 수동으로 실행 |
