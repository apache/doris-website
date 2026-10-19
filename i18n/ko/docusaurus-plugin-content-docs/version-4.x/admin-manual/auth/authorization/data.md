---
{
    "title": "데이터 접근 제어",
    "language": "ko",
    "description": "Apache Doris에서 행 정책, 컬럼 권한, 데이터 마스킹을 통해 민감한 데이터에 대한 세분화된 접근 제어를 구현합니다. 각 사용자나 역할에 표시되는 행, 컬럼, 필드 내용을 제한합니다.",
    "keywords": [
        "데이터 접근 제어",
        "행 정책",
        "행 정책",
        "컬럼 권한",
        "컬럼 권한",
        "데이터 마스킹",
        "데이터 마스킹",
        "민감한 데이터 보호",
        "Select_priv",
        "Apache Ranger",
        "세분화된 권한",
        "RBAC"
    ]
}
---

<!-- Knowledge type: Feature introduction / Procedure -->
<!-- Applicable scenarios: Sensitive data protection / Data compliance / Fine-grained permission control -->

Apache Doris는 관리자가 행, 컬럼, 필드 내용에 걸쳐 민감한 데이터에 대한 접근을 세밀하게 제어할 수 있도록 **행 정책**, **컬럼 권한**, **데이터 마스킹**이라는 세 가지 메커니즘을 제공합니다. 이 문서에서는 각 메커니즘의 작동 방식, 제한 사항, 대표적인 예제를 설명합니다.

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 권장 메커니즘 | 설명 |
|------|----------|------|
| 사용자마다 테이블의 **일부 행**만 볼 수 있어야 하는 경우(예: 지역, 테넌트, 부서별 격리) | 행 정책 | 쿼리에 필터 조건을 자동으로 추가합니다 |
| 사용자마다 테이블의 **일부 컬럼**에만 접근할 수 있어야 하는 경우(예: 급여나 전화번호 컬럼 숨기기) | 컬럼 권한 | 지정된 컬럼에만 `Select_priv`를 부여합니다 |
| 민감한 필드를 **부분적으로 숨기거나 대체**해야 하는 경우(예: 신분증 번호나 은행 카드 번호를 `***`로 표시) | 데이터 마스킹 | Apache Ranger를 통해 마스킹 정책을 구성합니다 |

## 사전 요구 사항 {#prerequisites}

- 현재 사용자에게 대상 객체에 대한 관리 권한(예: `GRANT` 권한)이 있어야 합니다.
- 데이터 마스킹은 Apache Ranger에 의존합니다. 먼저 Ranger 연동을 완료해야 합니다([Apache Ranger 권한 부여](./ranger) 참조).
- 세 가지 메커니즘 모두 기본 사용자 `root`와 `admin`에게는 적용되지 않습니다.

## 행 정책 {#row-policy}

<!-- Knowledge type: Feature introduction -->
<!-- Applicable scenarios: Multi-tenant isolation / Row-level data filtering -->

Doris의 행 수준 정책을 사용하면 민감한 데이터에 대한 접근을 세밀하게 제어할 수 있습니다. 테이블 수준에서 정의한 보안 정책을 기반으로 테이블의 특정 레코드에 접근할 수 있는 사용자나 역할을 결정할 수 있습니다.

### 작동 방식 {#how-it-works}

행 정책이 설정된 사용자의 경우, Doris는 행 정책에 정의된 조건을 쿼리에 자동으로 추가합니다.

### 제한 사항 {#limitations}

- 기본 사용자 `root`와 `admin`에게는 행 정책을 설정할 수 없습니다.

### 관련 명령어 {#related-commands}

- 행 정책 조회: [SHOW ROW POLICY](../../../sql-manual/sql-statements/data-governance/SHOW-ROW-POLICY)
- 행 정책 생성: [CREATE ROW POLICY](../../../sql-manual/sql-statements/data-governance/CREATE-ROW-POLICY)

### 행 정책 예제 {#row-policy-examples}

1. 사용자 `test`가 `table1`에서 `c1='a'`인 행만 쿼리하도록 제한합니다:

    ```sql
    CREATE ROW POLICY test_row_policy_1 ON test.table1 
    AS RESTRICTIVE TO test USING (c1 = 'a');
    ```

## 컬럼 권한 {#column-permission}

<!-- Knowledge type: Feature introduction -->
<!-- Applicable scenarios: Column-level data isolation / Sensitive field hiding -->

Doris의 컬럼 권한을 사용하면 테이블에 대한 접근을 세밀하게 제어할 수 있습니다. 테이블의 특정 컬럼에만 권한을 부여하여 해당 컬럼에 접근할 수 있는 사용자나 역할을 결정할 수 있습니다.

현재 컬럼 권한은 `Select_priv`만 지원합니다.

### 관련 명령어 {#related-commands-1}

- 권한 부여: [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO)
- 권한 회수: [REVOKE](../../../sql-manual/sql-statements/account-management/REVOKE-FROM)

### 컬럼 권한 예제 {#column-permission-examples}

1. `user1`에게 `col1` 및 `col2` 컬럼을 쿼리할 수 있는 권한을 부여합니다(대상 테이블: `tbl`):

    ```sql
    GRANT Select_priv(col1,col2) ON ctl.db.tbl TO user1
    ```

## 데이터 마스킹 {#data-masking}

<!-- Knowledge type: Feature introduction -->
<!-- Applicable scenarios: Sensitive field protection / Data compliance -->

데이터 마스킹은 민감한 데이터를 보호하는 방법입니다. 원본 데이터를 수정하거나 대체하거나 숨겨, 마스킹된 데이터가 일정한 형식과 특성을 유지하면서도 민감한 정보는 포함하지 않도록 합니다.

예를 들어 관리자는 신용카드 번호나 신분증 번호와 같은 민감한 필드의 숫자 일부 또는 전체를 별표 `*`나 다른 문자로 바꾸거나, 실제 이름을 가명으로 대체할 수 있습니다.

Doris는 버전 2.1.2부터 Apache Ranger Data Masking을 통해 컬럼에 마스킹 정책을 설정하는 기능을 지원합니다. 현재 지원되는 유일한 설정 방법이며, [Apache Ranger](./ranger)를 통해 사용할 수 있습니다.

> 데이터 마스킹은 `admin` 또는 `root` 사용자에게 적용되지 않습니다.

## 자주 묻는 질문 {#faq}

### 질문: 행 정책이나 데이터 마스킹을 `root` 또는 `admin` 사용자에게 설정했지만 적용되지 않습니다. {#q-row-policy-or-data-masking-was-configured-for-the-root-or-admin-user-but-it-did-not-take-effect}

세 가지 메커니즘 모두 기본 슈퍼유저인 `root`와 `admin`에게는 적용되지 않습니다. 일반 업무용 사용자로 검증하세요.

### 질문: 컬럼 권한을 부여한 후에도 쿼리에서 권한이 부족하다는 오류가 발생합니다. {#q-after-granting-column-permissions-queries-still-report-insufficient-privileges}

현재 컬럼 권한은 `Select_priv`만 지원합니다. 권한 부여 구문에서 이 권한을 사용하는지, 권한 부여 대상이 의도한 Catalog, 데이터베이스 또는 테이블인지 확인하세요.

### 질문: 데이터 마스킹 정책이 적용되지 않습니다. {#q-the-data-masking-policy-did-not-take-effect}

데이터 마스킹은 Apache Ranger를 통해 설정해야 하며, Doris 버전 2.1.2 이상이 필요합니다. Ranger 연동이 완료되었는지, 정책이 활성화되어 있는지, 현재 사용자가 `root` 또는 `admin`이 아닌지 확인하세요.
