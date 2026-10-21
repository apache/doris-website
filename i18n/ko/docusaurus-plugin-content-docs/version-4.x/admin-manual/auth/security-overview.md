---
{
    "title": "보안 개요",
    "language": "ko",
    "description": "Apache Doris의 엔터프라이즈급 보안 개요: 인증, RBAC 및 Ranger 권한 부여, 행 및 열 수준 액세스 제어, 데이터 마스킹, SSL 전송 암호화, 감사 로그, UDF 보안, 서드 파티 패키지 관리."
}
---

<!-- Knowledge type: Concept overview + Architecture selection decision -->
<!-- Applicable scenarios: Security architecture planning / Authentication and authorization solution selection / Security compliance review -->

Apache Doris는 엔터프라이즈급 데이터 플랫폼을 위한 포괄적인 보안 기능을 제공하며, 인증, 권한 부여, 데이터 보호, 전송 암호화, 감사 추적을 지원합니다. 이 문서에서는 보안 적용 시나리오를 바탕으로 Doris의 전반적인 보안 아키텍처, 핵심 개념, 인증 및 권한 부여 프레임워크를 소개합니다. 또한 각 기능의 상세 문서로 안내하여 관리자가 종합적인 보안 계획을 신속하게 수립할 수 있도록 돕습니다.

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 주요 기능 | 참조 문서 |
| --- | --- | --- |
| 중앙 집중식 사용자 관리(기업 LDAP/AD 연동) | LDAP 인증 | [LDAP 기반 인증](./authentication/ldap) |
| 내부 사용자 및 비밀번호 정책 관리 | 기본 제공 인증, 비밀번호 정책, 화이트리스트 | [기본 제공 인증](./authentication/internal) |
| 여러 팀이 공유하는 클러스터, 역할 기반 권한 부여 | RBAC, 역할 | [기본 제공 권한 부여](./authorization/internal) |
| 빅데이터 생태계와의 통합 권한 관리 | Apache Ranger 연동 | [Ranger 기반 권한 부여](./authorization/ranger) |
| 민감한 데이터 보호(행 수준/열 수준, 마스킹) | 데이터 액세스 제어 | [데이터 액세스 제어](./authorization/data) |
| 클라이언트와 FE 간 연결 암호화 | MySQL 프로토콜 SSL, FE HTTPS | [MySQL 프로토콜 SSL](./certificate), [FE HTTPS 구성](./fe-certificate) |
| 감사 및 규정 준수를 위한 추적 | 감사 로그 | [감사 로그](../audit-plugin) |
| 데이터 암호화 및 복호화 | 암호화 함수 | [데이터 암호화 함수](./encryption-function) |
| AWS 배포, IAM 연동 | AWS 인증 및 권한 부여 | [AWS 인증 및 권한 부여](./integrations/aws-authentication-and-authorization) |

## 보안 기능 개요 {#security-capability-overview}

<!-- Knowledge type: Capability list -->

Doris는 다음 메커니즘을 통해 ID, 권한 부여, 데이터, 전송, 감사의 다섯 가지 영역에서 데이터 보안을 관리합니다.

| 보안 영역 | 기능 | 설명 |
| --- | --- | --- |
| 인증 | 기본 제공 인증 | Doris는 사용자 이름/비밀번호 기반 인증을 기본 제공하며, 비밀번호 정책을 사용자 지정할 수 있습니다. |
| 인증 | LDAP 인증 | LDAP 서비스를 통해 사용자 자격 증명을 중앙에서 관리하여 액세스 제어를 간소화하고 시스템 보안을 강화합니다. |
| 권한 부여 | 역할 기반 액세스 제어(RBAC) | 사용자의 역할과 권한에 따라 데이터베이스 리소스에 대한 액세스와 작업을 제한합니다. |
| 권한 부여 | Ranger 권한 부여 | Apache Ranger와 연동하여 세분화된 액세스 제어 정책으로 중앙 집중식 권한 부여를 제공합니다. |
| 데이터 보호 | 데이터 암호화 및 마스킹 | 테이블의 데이터를 암호화하고 마스킹하여 무단 액세스로 인한 민감한 데이터 유출을 방지합니다. |
| 데이터 보호 | 세분화된 액세스 제어 | 규칙에 따라 행 및 열 수준의 액세스 권한을 구성합니다. |
| 전송 보안 | SSL 암호화 프로토콜 | 클라이언트와 Doris 서버 간 데이터 전송을 보호하여 데이터 도난이나 변조를 방지합니다. |
| 감사 추적 | 감사 로그 | 사용자 로그인, 쿼리, 데이터 수정 등 모든 작업을 기록하여 사후 감사와 문제 추적을 지원합니다. |
| 확장 기능 보안 | Java UDF 보안 | root 관리자는 사용자 UDF의 구현을 검토하여 운영 안전성을 확보하고, 데이터 삭제나 시스템 손상과 같은 고위험 작업을 방지해야 합니다. |
| 확장 기능 보안 | 서드 파티 패키지 관리 | JDBC Catalog 및 UDF와 같은 기능을 통해 서드 파티 패키지를 도입할 때 관리자는 출처가 안전하고 신뢰할 수 있는지 확인해야 합니다. 공식 채널이나 신뢰할 수 있는 커뮤니티에서 제공하는 종속성만 사용해야 합니다. |

## 핵심 개념 {#core-concepts}

<!-- Knowledge type: Concept overview -->

Doris의 권한 부여 시스템은 MySQL의 권한 부여 메커니즘을 모델로 설계되었습니다. 행 수준의 세분화된 액세스 제어, 역할 기반 액세스 제어, 화이트리스트 메커니즘을 지원합니다. 다음 네 가지 핵심 개념을 이해하면 Doris의 인증 및 권한 부여 모델을 빠르게 익힐 수 있습니다.

### 사용자 ID(User Identity) {#user-identity}

권한 부여 시스템에서는 사용자를 User Identity로 식별합니다. User Identity는 `username`과 `host`의 두 부분으로 구성됩니다.

- `username`: 영문 대문자와 소문자로 구성된 사용자 이름입니다.
- `host`: 사용자가 접속하는 IP 주소입니다.

User Identity는 `username@'host'`로 표시하며, 사용자 이름이 `username`이고 접속 호스트가 `host`임을 의미합니다.

User Identity는 `username@['domain']` 형식으로도 표시할 수 있습니다. 여기서 `domain`은 DNS를 통해 IP 주소 집합으로 해석할 수 있는 도메인 이름이며, 최종적으로 `username@'host'`의 집합으로 표현됩니다. 다음 절에서는 `username@'host'` 형식으로 통일하여 설명합니다.

### 권한 {#privilege}

권한은 노드, 데이터 Catalog, 데이터베이스 또는 테이블에 적용됩니다. 각 권한은 서로 다른 작업의 허용 여부를 나타냅니다.

### 역할 {#role}

Doris에서는 원하는 이름으로 역할을 생성할 수 있습니다. 역할은 권한의 집합으로 볼 수 있습니다. 새로 생성한 사용자에게 역할을 할당하면 해당 역할의 권한이 자동으로 부여됩니다. 이후 역할의 권한이 변경되면 해당 역할에 속한 모든 사용자의 권한에도 반영됩니다.

### 사용자 속성 {#user-property}

사용자 속성은 User Identity가 아니라 사용자에게 직접 연결됩니다. 즉, `user@'192.%'`와 `user@['domain']`은 동일한 사용자 속성을 공유합니다. 이 속성은 사용자 `user`에 속하며, `user@'192.%'`나 `user@['domain']`에 속하는 것이 아닙니다.

사용자 속성에는 사용자의 최대 연결 수와 데이터 적재 클러스터 구성 등이 포함됩니다.

## 인증 및 권한 부여 프레임워크 {#authentication-and-authorization-framework}

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenarios: Authentication and authorization solution selection -->

Apache Doris에 로그인하는 과정은 **인증**과 **권한 부여**의 두 부분으로 구성됩니다.

- **인증**: 사용자가 제공한 자격 증명(사용자 이름, 클라이언트 IP, 비밀번호 등)을 바탕으로 사용자의 신원을 확인합니다. 검증을 통과하면 해당 사용자가 시스템의 User Identity에 매핑됩니다.
- **권한 부여**: 확인된 User Identity와 해당 권한을 바탕으로 사용자가 요청한 작업을 수행할 권한이 있는지 검사합니다.

Doris는 인증 방식으로 **기본 제공 인증**과 **LDAP 인증**을 지원합니다. 권한 부여 방식으로는 **RBAC 기반의 기본 제공 권한 부여**와 **Apache Ranger 기반의 외부 권한 부여**를 지원합니다. 인증 방식과 권한 부여 방식은 자유롭게 조합할 수 있습니다. 예를 들어 인증에는 LDAP를 사용하고 권한 부여에는 Ranger를 사용할 수 있습니다.

다음 표는 일반적인 조합과 각 조합의 적용 시나리오를 보여 줍니다.

| 인증 방식 | 권한 부여 방식 | 적용 시나리오 |
| --- | --- | --- |
| 기본 제공 인증 | 기본 제공 RBAC | 중소 규모 클러스터, 독립형 배포, 외부 종속성이 없는 환경. |
| LDAP 인증 | 기본 제공 RBAC | 기업 LDAP/AD와 연동하면서 권한 부여 모델은 Doris에서 관리하는 환경. |
| 기본 제공 인증 | Apache Ranger | 기존 Ranger 시스템이 있으며, 빅데이터 생태계와 통합된 권한 관리가 필요한 환경. |
| LDAP 인증 | Apache Ranger | 엔터프라이즈 환경의 권장 구성: 통합 ID 관리, 중앙 집중식 권한 부여, 감사 추적 지원. |

## 관련 문서 {#section-navigation}

<!-- Knowledge type: Document index -->

Doris 보안 기능에 대한 자세한 내용은 주제별로 다음 문서를 참조하세요.

| 주제 | 문서 |
| --- | --- |
| 기본 제공 인증(비밀번호 정책, 화이트리스트, 비밀번호 분실 시 처리) | [기본 제공 인증](./authentication/internal) |
| LDAP 인증 | [LDAP 기반 인증](./authentication/ldap) |
| 기본 제공 RBAC 권한 부여(권한 항목, 권한 계층, 역할) | [기본 제공 권한 부여](./authorization/internal) |
| 행 및 열 수준 권한과 데이터 마스킹 | [데이터 액세스 제어](./authorization/data) |
| Apache Ranger를 통한 중앙 집중식 권한 부여 | [Ranger 기반 권한 부여](./authorization/ranger) |
| 감사 로그 | [감사 로그](../audit-plugin) |
| MySQL 프로토콜 SSL 전송 암호화 | [MySQL 프로토콜 SSL](./certificate) |
| FE HTTP/HTTPS 전송 암호화 | [FE HTTPS 구성](./fe-certificate) |
| 암호화 함수 | [데이터 암호화 함수](./encryption-function) |
| 클라우드 공급업체(AWS) 연동 | [AWS 인증 및 권한 부여](./integrations/aws-authentication-and-authorization) |
