---
{
    "title": "LDAP",
    "language": "ko",
    "description": "LDAP/LDAPS 통합을 통해 Apache Doris의 통합 인증과 그룹 권한 부여를 구성하는 방법을 설명합니다. 로그인 방법, 권한 매핑, 일반적인 문제를 다룹니다.",
    "keywords": [
        "Doris LDAP",
        "Doris LDAPS",
        "LDAP 인증",
        "LDAP 그룹 권한 부여",
        "통합 인증",
        "ldap.conf 구성",
        "ldap_default_roles",
        "ldap_allow_empty_pass",
        "MysqlClearPasswordPlugin",
        "ldap_admin_password",
        "ldap_use_ssl",
        "SSLHandshakeException",
        "PKIX path building failed",
        "평문 비밀번호 플러그인",
        "평문 플러그인",
        "빈 비밀번호 로그인"
    ]
}
---

Apache Doris는 타사 LDAP 서비스와의 통합을 지원하므로, 기존 기업 계정 시스템을 Doris의 ID 및 권한 정보 소스로 직접 재사용하여 사용자와 비밀번호를 중복으로 관리할 필요가 없습니다. LDAP 통합은 두 가지 핵심 기능을 제공합니다.

- **인증 로그인**: ID 인증에 Doris 비밀번호 대신 LDAP 비밀번호를 사용합니다.
- **그룹 권한 부여**: LDAP `group`을 Doris `role`에 매핑하여 권한을 통합 관리합니다.
- **기본 역할 권한 부여**: 모든 사용자를 하나의 LDAP 그룹에 넣지 않고도 LDAP 인증을 거친 모든 사용자에게 구성된 Doris 역할을 부여합니다.

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenario: Integrating enterprise unified identity / centralized privilege management -->

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 설명 |
| --- | --- |
| 기업 통합 ID 인증 | 기존 LDAP/AD 계정 시스템을 Doris 사용자가 직접 재사용하여 Doris에서 계정을 다시 생성할 필요가 없는 경우 |
| 중앙 집중식 권한 관리 | LDAP 그룹을 통해 역할 구성원을 관리하고, LDAP 그룹 구성원을 변경하여 Doris 권한을 일괄 조정하는 경우 |
| LDAP 사용자의 기본 권한 | LDAP 그룹 권한 부여를 유지하면서 구성을 통해 LDAP 인증을 거친 모든 사용자에게 동일한 Doris 역할을 부여하는 경우 |
| 임시 액세스 | LDAP에만 존재하는 사용자가 LDAP 그룹 권한에 따라 임시 사용자로 Doris에 로그인하는 경우 |
| 암호화된 채널 | Doris FE와 LDAP 서버 간 연결을 암호화해야 하는 경우(LDAPS) |

## 사전 요구 사항 {#prerequisites}

- 액세스할 수 있는 LDAP/AD 서비스가 배포되어 있고, 다음 정보를 알고 있어야 합니다.
    - LDAP 서비스의 `host`와 포트(평문은 `389`, LDAPS는 `636`)
    - 관리자 계정의 `dn`과 비밀번호
    - 사용자 및 그룹의 `basedn`
    - 사용자 필터(`ldap_user_filter`)
- Doris 클러스터의 FE 구성 파일에 대한 읽기/쓰기 권한이 있고 FE를 다시 시작할 수 있어야 합니다.
- LDAP 관리자 비밀번호를 설정할 수 있는 `root` 또는 `admin` 계정이 있어야 합니다.
- LDAPS를 활성화하려면 Doris 버전 **4.0.5** 이상이 필요합니다.

## LDAP 기본 개념 {#ldap-basic-concepts}

LDAP에서는 데이터가 트리 구조로 구성됩니다. 다음은 일반적인 LDAP 디렉터리 트리의 예입니다.

```text
- dc=example,dc=com
    - ou = ou1
        - cn = group1
        - cn = user1
    - ou = ou2
        - cn = group2
            - cn = user2
    - cn = user3
```

### 용어 설명 {#term-explanations}

| 용어 | 전체 이름 | 설명 |
| --- | --- | --- |
| `dc` | Domain Component | 조직의 도메인 이름으로, 트리의 루트 노드로 사용됩니다 |
| `dn` | Distinguished Name | 고유한 이름입니다. 예를 들어 user1의 `dn`은 `cn=user1,ou=ou1,dc=example,dc=com`이고, user2의 `dn`은 `cn=user2,cn=group2,ou=ou2,dc=example,dc=com`입니다 |
| `rdn` | Relative Distinguished Name | `dn`의 일부입니다. user1의 네 개 `rdn`은 `cn=user1`, `ou=ou1`, `dc=example`, `dc=com`입니다 |
| `ou` | Organization Unit | 하위 조직입니다. `user`는 `ou` 내부 또는 example.com 도메인 바로 아래에 배치할 수 있습니다 |
| `cn` | Common Name | 이름 |
| `group` | - | 그룹으로, Doris 역할에 해당합니다 |
| `user` | - | 사용자로, Doris 사용자에 해당합니다 |
| `objectClass` | - | 데이터 유형입니다. 노드가 `group`인지 `user`인지 구분하는 데 사용됩니다. `group`에는 `cn`과 `member`(`user` 목록) 속성이 필요하고, `user`에는 `cn`, `password`, `uid` 등의 속성이 필요합니다 |

## 통합 절차 개요 {#integration-process-overview}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: First-time LDAP integration -->

1. **Doris FE 구성**: `fe.conf`에서 인증 방식을 변경하고 `ldap.conf`에 LDAP 서비스 연결 정보를 입력합니다.
2. **LDAP 관리자 비밀번호 설정**: Doris에 로그인한 후 SQL을 통해 `ldap_admin_password`를 설정합니다.
3. **클라이언트 구성**: MySQL 클라이언트 또는 JDBC 클라이언트에서 평문 비밀번호 플러그인을 활성화하여 LDAP 비밀번호를 전송합니다.
4. **(선택 사항) LDAPS 활성화**: FE와 LDAP 간 채널을 암호화합니다.
5. **(선택 사항) 그룹 권한 부여 구성**: Doris에 `role`을 LDAP 그룹과 같은 이름으로 생성하고 권한을 부여합니다.
6. **(선택 사항) 기본 역할 구성**: `ldap_default_roles`를 통해 LDAP 인증을 거친 모든 사용자에게 기본 Doris 역할을 부여합니다.

## 1단계: Doris FE 구성 {#step-1-configure-doris-fe}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: LDAP integration configuration on the FE side -->

### 1.1 인증 방식 변경 {#11-switch-the-authentication-method}

`fe/conf/fe.conf`에서 인증 방식을 설정합니다.

```text
authentication_type=ldap
```

### 1.2 LDAP 연결 정보 구성 {#12-configure-ldap-connection-information}

`fe/conf/ldap.conf`에 LDAP 서비스 연결 정보를 입력합니다.

```text
ldap_authentication_enabled = true
ldap_host = ladp-host
ldap_port = 389
ldap_admin_name = uid=admin,o=emr
ldap_user_basedn = ou=people,o=emr
ldap_user_filter = (&(uid={login}))
ldap_group_basedn = ou=group,o=emr
ldap_default_roles = ldap_readonly,ldap_query_user
```

각 구성 항목은 다음과 같습니다.

| 구성 항목 | 설명 |
| --- | --- |
| `ldap_authentication_enabled` | LDAP 인증 활성화 여부입니다. 반드시 `true`여야 합니다 |
| `ldap_host` | LDAP 서버 주소 |
| `ldap_port` | LDAP 서비스 포트입니다. 기본값은 평문 LDAP의 경우 `389`, LDAPS의 경우 `636`입니다 |
| `ldap_admin_name` | LDAP 관리자의 `dn`입니다. Doris는 이 계정을 사용하여 사용자 및 그룹 정보를 쿼리합니다 |
| `ldap_user_basedn` | 사용자 검색의 기준이 되는 `dn` |
| `ldap_user_filter` | 사용자 일치 필터입니다. `{login}`은 로그인 사용자 이름으로 대체됩니다 |
| `ldap_group_basedn` | 그룹 검색의 기준이 되는 `dn`으로, 그룹 권한 부여에 사용됩니다 |
| `ldap_default_roles` | 선택 사항입니다. LDAP 인증을 거친 모든 사용자에게 부여할 Doris 역할을 쉼표로 구분하여 지정합니다. 이 역할들은 LDAP 그룹 역할에 추가로 부여됩니다(버전 4.0.7 및 4.1.3부터 지원) |
| `ldap_allow_empty_pass` | 선택 사항입니다. LDAP에 존재하는 사용자가 빈 비밀번호로 로그인할 수 있는지 여부입니다. 기본값은 `false`이며, Doris가 빈 비밀번호 로그인을 즉시 거부합니다. 변경하려면 FE를 다시 시작해야 합니다. [빈 비밀번호 로그인](#empty-password-login)을 참조하세요(버전 4.1.5부터 지원) |

:::tip
LDAPS(LDAP 서버와의 암호화된 연결)를 활성화하려면 아래의 [LDAPS(암호화된 연결)](#ldaps-encrypted-connection) 섹션을 참조하세요.
:::

### 1.3 LDAP 관리자 비밀번호 설정 {#13-set-the-ldap-administrator-password}

FE를 시작한 후 `root` 또는 `admin` 계정으로 Doris에 로그인하여 LDAP 관리자 비밀번호를 설정합니다.

```sql
set ldap_admin_password = password('<ldap_admin_password>');
```

이 비밀번호는 `ldap_admin_name`에 해당하는 계정의 비밀번호입니다. Doris는 이 비밀번호를 사용하여 LDAP 서비스를 쿼리합니다.

## 2단계: 클라이언트 연결 {#step-2-client-connection}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Enabling the cleartext password plugin on the client -->

LDAP 인증을 사용하려면 클라이언트가 비밀번호를 평문으로 전송해야 하므로 평문 인증 플러그인을 활성화해야 합니다.

### 2.1 MySQL 클라이언트 {#21-mysql-client}

다음 방법 중 하나로 평문 인증 플러그인을 활성화할 수 있습니다.

- **방법 1**: 환경 변수 설정(영구 적용)

    ```shell
    echo "export LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1" >> ~/.bash_profile && source ~/.bash_profile
    ```

- **방법 2**: 로그인할 때 매개변수 추가(일회성)

    ```shell
    mysql -hDORIS_HOST -PDORIS_PORT -u user -p --enable-cleartext-plugin
    ```

### 2.2 JDBC 클라이언트 {#22-jdbc-client}

JDBC에서는 기본적으로 SSL을 사용하는 연결에서만 평문 비밀번호 플러그인을 사용할 수 있습니다. SSL 활성화 여부에 따라 JDBC URL 작성 방법이 달라집니다.

#### 시나리오 A: Doris에서 SSL이 비활성화된 경우 {#scenario-a-ssl-is-not-enabled-in-doris}

SSL 제한을 우회하려면 사용자 정의 인증 플러그인이 필요합니다.

1. `MysqlClearPasswordPlugin`을 상속하고 `requiresConfidentiality()` 메서드를 재정의하는 사용자 정의 플러그인 클래스를 생성합니다.

    ```java
    public class MysqlClearPasswordPluginWithoutSSL extends MysqlClearPasswordPlugin {
        @Override
        public boolean requiresConfidentiality() {
            return false;
        }
    }
    ```

2. JDBC 연결 URL에 사용자 정의 플러그인을 구성합니다(`xxx`를 실제 패키지 이름으로 바꾸세요).

    ```sql
    jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?authenticationPlugins=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&defaultAuthenticationPlugin=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&disabledAuthenticationPlugins=com.mysql.jdbc.authentication.MysqlClearPasswordPlugin";
    ```

    구성해야 하는 세 가지 속성은 다음과 같습니다.

    | 속성 | 설명 |
    | --- | --- |
    | `authenticationPlugins` | 사용자 정의 평문 인증 플러그인을 등록합니다 |
    | `defaultAuthenticationPlugin` | 사용자 정의 플러그인을 기본 인증 플러그인으로 설정합니다 |
    | `disabledAuthenticationPlugins` | SSL 사용을 강제하는 기존 평문 인증 플러그인을 비활성화합니다 |

:::tip
[이 코드 저장소](https://github.com/morningman/doris-debug-tools/tree/main/jdbc-test)의 관련 예제를 참조할 수 있습니다. `build-auth-plugin.sh`를 직접 실행하면 위에서 설명한 플러그인 jar가 생성되며, 이를 클라이언트의 지정된 위치에 배치하면 됩니다.
:::

#### 시나리오 B: Doris에서 SSL이 활성화된 경우 {#scenario-b-ssl-is-enabled-in-doris}

`enable_ssl=true`를 `fe.conf`에 추가하면 JDBC URL에서 MySQL 기본 평문 비밀번호 플러그인을 직접 사용할 수 있습니다.

```sql
jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?useSSL=true&sslMode=REQUIRED
```

## 인증 로그인 {#authentication-login}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenario: Understanding user authentication priority -->

LDAP 인증 로그인은 LDAP 서비스를 통해 비밀번호를 검증하여 Doris 자체 인증 메커니즘을 보완하는 방식입니다. 비밀번호 검증 우선순위는 다음과 같습니다.

1. Doris는 먼저 LDAP를 사용하여 사용자 비밀번호를 검증합니다.
2. 사용자가 LDAP에 존재하지 않으면 Doris 로컬 비밀번호 검증으로 전환합니다.
3. LDAP 비밀번호가 올바르지만 Doris에 해당 계정이 없으면 로그인할 수 있도록 임시 사용자를 생성합니다.

### 로그인 동작 개요 {#login-behavior-overview}

LDAP를 활성화한 후 사용자 상태별 로그인 동작은 다음과 같습니다.

| LDAP 사용자 | Doris 사용자 | 사용한 비밀번호 | 로그인 결과 | 로그인 ID |
| --------- | ---------- | -------------- | ------------ | -------------- |
| 존재함 | 존재함 | LDAP 비밀번호 | 성공 | Doris 사용자 |
| 존재함 | 존재함 | Doris 비밀번호 | 실패 | - |
| 존재하지 않음 | 존재함 | Doris 비밀번호 | 성공 | Doris 사용자 |
| 존재함 | 존재하지 않음 | LDAP 비밀번호 | 성공 | LDAP 임시 사용자 |
| 존재함 | 무관 | 빈 비밀번호 | 기본적으로 실패(`ldap_allow_empty_pass = false`) | - |

:::info 임시 사용자 안내

- 임시 계정은 현재 연결에서만 유효하며, 연결이 종료되면 자동으로 삭제됩니다.
- Doris는 임시 사용자에 대한 영구 사용자 메타데이터를 생성하지 않습니다.
- 임시 사용자의 권한은 LDAP 그룹 권한 부여와 `ldap_default_roles`에 따라 결정됩니다(아래의 "그룹 권한 부여" 및 "LDAP 사용자의 기본 역할" 섹션 참조).
- 임시 사용자에게 해당하는 그룹 권한이나 구성된 기본 역할이 없으면 기본적으로 `select_priv` 권한이 `information_schema`에 부여됩니다.

:::

### 빈 비밀번호 로그인 {#empty-password-login}

:::info 버전 4.1.5부터 지원
:::

기본 설정(`ldap_allow_empty_pass = false`)에서는 LDAP에 존재하는 사용자가 빈 비밀번호로 로그인을 시도하면 Doris가 액세스 거부 오류와 함께 로그인을 즉시 거부하며, 해당 비밀번호로 LDAP 서버에 바인드를 시도하지 않습니다. FE는 `Rejected LDAP login with empty password, user=jack`과 같은 경고를 `fe.log`에 기록합니다.

이렇게 기본 설정된 이유는 LDAP 프로토콜이 `dn`은 포함하지만 비밀번호가 비어 있는 바인드 요청을 *unauthenticated bind*로 처리하며, 일부 디렉터리 서버(예: Active Directory)는 이러한 바인드를 허용하고 성공을 반환하기 때문입니다. Doris가 빈 비밀번호를 그대로 전달하면 유효한 LDAP 사용자 이름을 아는 누구나 비밀번호 없이 Doris에 로그인할 수 있습니다. 4.1.5 이전 버전에서는 Doris가 항상 빈 비밀번호를 LDAP 서버에 전달했으므로, 이러한 로그인의 성공 여부는 전적으로 LDAP 서버 구성에 따라 결정되었습니다.

이전 동작을 유지해야 한다면 `fe/conf/ldap.conf`에 다음을 설정하고 FE를 다시 시작합니다.

```text
ldap_allow_empty_pass = true
```

이후 Doris는 자체적으로 빈 비밀번호를 확인하지 않고 바인드 요청을 LDAP 서버에 전달합니다. 이때 로그인 성공 여부는 LDAP 서버가 비인증 바인드를 허용하는지에 따라 결정됩니다.

:::caution

- `ldap_allow_empty_pass`를 활성화하면 위에서 설명한 보안 위험이 다시 발생합니다. 운영 환경에서는 기본값인 `false`를 유지하세요.
- `ldap_allow_empty_pass`는 `ADMIN SET FRONTEND CONFIG`로 온라인 변경할 수 없습니다. 변경하려면 FE를 다시 시작해야 합니다.
- 이 구성은 LDAP에 존재하는 사용자에게만 영향을 줍니다. Doris에만 존재하는 사용자는 계속 Doris 로컬 비밀번호로 검증됩니다.

:::

### 로그인 예제 {#login-examples}

다음 예제에서는 LDAP 인증이 활성화되어 있고, `ldap_user_filter = (&(uid={login}))`가 구성되어 있으며, 클라이언트에 `LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1`이 설정되어 있다고 가정합니다.

**시나리오 1: 계정이 Doris와 LDAP에 모두 존재하는 경우**

- Doris 계정: `jack@'172.10.1.10'`, 비밀번호: `123456`
- LDAP 사용자 속성: `uid: jack`, 비밀번호: `abcdef`

LDAP 비밀번호로 로그인하면 성공합니다.

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
```

Doris 비밀번호로 로그인하면 실패합니다(LDAP가 활성화되면 LDAP 사용자는 반드시 LDAP 비밀번호를 사용해야 합니다).

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
```

**시나리오 2: 사용자가 LDAP에만 존재하는 경우**

- LDAP 사용자 속성: `uid: jack`, 비밀번호: `abcdef`

LDAP 비밀번호로 로그인합니다. Doris는 임시 사용자 `jack@'%'`를 자동으로 생성하여 로그인합니다. 임시 사용자에게는 해당하는 LDAP 그룹 역할과 구성된 기본 역할이 있으면 그 역할이 부여됩니다. 일치하는 역할이 없으면 기본 권한인 `DatabasePrivs`: `Select_priv`가 부여되며, 연결이 종료되면 자동으로 삭제됩니다.

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
```

**시나리오 3: 계정이 Doris에만 존재하는 경우**

- Doris 계정: `jack@'172.10.1.10'`, 비밀번호: `123456`

사용자가 LDAP에 존재하지 않으므로 Doris 로컬 인증으로 전환합니다. Doris 비밀번호로 로그인하면 성공합니다.

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
```

**시나리오 4: LDAP 사용자가 빈 비밀번호로 로그인하는 경우**

- LDAP 사용자 속성: `uid: jack`, 비밀번호: `abcdef`

비밀번호를 입력하지 않고 로그인합니다. 기본 설정인 `ldap_allow_empty_pass = false`에서는 Doris가 로그인을 즉시 거부합니다([빈 비밀번호 로그인](#empty-password-login) 참조).

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack
```

## 그룹 권한 부여 {#group-authorization}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenario: Mapping LDAP groups to Doris roles -->

LDAP 그룹 권한 부여는 LDAP `group`을 Doris `role`에 매핑하여 중앙 집중식 권한 관리를 제공합니다. 핵심 동작 방식은 다음과 같습니다.

- LDAP 사용자의 `dn`이 LDAP 그룹 노드의 `member` 속성에 포함되어 있으면 Doris는 해당 사용자가 그 그룹에 속한다고 판단합니다.
- 사용자가 로그인하면 Doris는 사용자가 속한 LDAP 그룹에 해당하는 `role` 권한을 자동으로 부여합니다.
- `ldap_default_roles`가 구성되어 있으면 Doris는 해당 기본 역할도 사용자에게 부여합니다.
- 사용자가 로그아웃하면 Doris는 이러한 `role` 권한을 자동으로 회수합니다.

:::caution 사전 요구 사항
LDAP 그룹 권한 부여를 사용하려면 먼저 Doris에 `role`을 LDAP `group`과 같은 이름으로 생성하고, 해당 `role`에 권한을 부여해야 합니다.
:::

### 권한 병합 규칙 {#privilege-merge-rules}

로그인한 사용자의 최종 권한은 LDAP와 Doris에서의 사용자 상태에 따라 달라집니다.

| LDAP 사용자 | Doris 사용자 | 최종 권한 |
| --------- | ---------- | ---------------- |
| 존재함 | 존재함 | LDAP 그룹 권한 + 구성된 기본 역할 + Doris 사용자 권한 |
| 존재하지 않음 | 존재함 | Doris 사용자 권한 |
| 존재함 | 존재하지 않음 | LDAP 그룹 권한 + 구성된 기본 역할 |

### 그룹 이름 매핑 규칙 {#group-name-mapping-rules}

Doris는 LDAP 그룹의 첫 번째 `Rdn`을 그룹 `dn`에서 추출하여 그룹 이름으로 사용하고, 이를 Doris에서 이름이 같은 `role`에 매핑합니다.

예를 들어 사용자의 `dn`이 `uid=jack,ou=aidp,dc=domain,dc=com`이고 그룹 정보가 다음과 같다고 가정합니다.

```text
dn: cn=doris_rd,ou=group,dc=domain,dc=com  
objectClass: groupOfNames  
member: uid=jack,ou=aidp,dc=domain,dc=com  
```

그룹의 첫 번째 `Rdn`은 해당 `dn`에서 `cn=doris_rd`이므로, 그룹 이름은 `doris_rd`이며 Doris의 `role`인 `doris_rd`에 해당합니다.

### 그룹 권한 부여 예제 {#group-authorization-example}

사용자 jack이 LDAP 그룹 `doris_rd`, `doris_qa`, `doris_pm`에 속하고, Doris에 같은 이름의 `role`인 `doris_rd`, `doris_qa`, `doris_pm`이 있다고 가정합니다. jack은 로그인한 후 Doris 계정의 기존 권한과 함께 이 세 `role`의 권한도 얻습니다.

:::note 참고

- 어떤 `group`에 `user`가 속하는지는 LDAP 트리의 조직 구조와 관계가 없습니다. 위 예시에서 `user2`가 반드시 `group2`에 속하는 것은 아닙니다.
- `user2`를 `group2`에 속하게 하려면, `user2`를 `member` 속성에 명시적으로 추가하여 `group2`의 구성원으로 지정해야 합니다.

:::

## LDAP 사용자의 기본 역할 {#default-roles-for-ldap-users}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Granting baseline Doris privileges to all LDAP-authenticated users -->

:::info 버전 4.0.7 및 4.1.3부터 지원
:::

`ldap_default_roles`는 LDAP 인증을 거친 모든 사용자에게 기본 Doris 역할을 부여하는 데 사용됩니다. 모든 LDAP 사용자에게 동일한 기본 권한이 필요하지만, 모든 LDAP 사용자를 포함하는 전용 LDAP 그룹을 유지하기 어려운 경우에 유용합니다.

`ldap_default_roles`는 LDAP 그룹 권한 부여를 대체하지 않습니다. LDAP 사용자가 로그인하면 Doris는 다음 권한을 모두 병합합니다.

- 사용자의 LDAP 그룹에서 매핑된 Doris 역할.
- `ldap_default_roles`에 구성된 Doris 역할.
- 동일한 계정이 Doris에도 존재하는 경우, 해당 Doris 사용자의 기존 권한.
- 기본 제공 역할인 `ldapDefaultRole`. 이 역할은 `select_priv` 권한을 `information_schema`에 제공합니다.

:::caution 사전 요구 사항
`ldap_default_roles`에 나열된 역할은 Doris에 이미 존재해야 합니다. 구성된 역할이 존재하지 않으면 Doris는 해당 역할을 무시하고 경고를 기록합니다.
:::

### 기본 역할 구성 {#configure-default-roles}

역할을 생성하고 권한을 부여합니다.

```sql
CREATE ROLE ldap_readonly;
CREATE ROLE ldap_query_user;

GRANT SELECT_PRIV ON internal.example_db.* TO ROLE 'ldap_readonly';
GRANT SELECT_PRIV ON internal.example_db.example_table TO ROLE 'ldap_query_user';
```

`fe/conf/ldap.conf`에 역할을 구성합니다.

```text
ldap_default_roles = ldap_readonly,ldap_query_user
```

값을 온라인으로 업데이트할 수도 있습니다.

```sql
ADMIN SET FRONTEND CONFIG ("ldap_default_roles" = "ldap_readonly,ldap_query_user");
```

`ldap_default_roles`를 온라인으로 업데이트하면 Doris가 LDAP 사용자 캐시를 자동으로 갱신하므로, 이후 LDAP 로그인에서 새 기본 역할을 사용할 수 있습니다.

## LDAPS(암호화된 연결) {#ldaps-encrypted-connection}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Encrypting the channel between FE and the LDAP server -->

:::info 버전 4.0.5부터 지원
:::

기본적으로 Doris는 평문 LDAP 프로토콜을 통해 LDAP 서버와 통신합니다. 버전 4.0.5부터 Doris는 LDAPS(LDAP over SSL/TLS)를 지원하여 Doris FE와 LDAP 서버 간 연결을 암호화할 수 있습니다.

### LDAPS 활성화 {#enable-ldaps}

`fe/conf/ldap.conf`에서 포트를 LDAPS 포트(일반적으로 `636`)로 변경하고 SSL을 활성화합니다.

```text
ldap_host = ldap-host
ldap_port = 636
ldap_use_ssl = true
```

`ldap_use_ssl`을 `true`로 설정하면 Doris는 `ldaps://` 프로토콜을 사용하여 LDAP 서버에 연결합니다.

### 인증서 신뢰 구성 {#configure-certificate-trust}

LDAPS를 사용할 때는 Doris FE의 JVM이 LDAP 서버의 SSL 인증서를 신뢰해야 합니다.

- LDAP 서버에서 사용하는 인증서가 널리 알려진 공인 CA에서 발급된 경우 추가 구성이 필요하지 않습니다.
- 사용자 정의 CA 또는 자체 서명 CA를 사용하는 경우 CA 인증서를 Java trustStore로 가져오고, JVM이 이 trustStore를 사용하도록 구성해야 합니다.

trustStore 매개변수를 `JAVA_OPTS`에 추가합니다. 이 항목은 `fe/conf/fe.conf`에 있습니다. 예:

```text
# JDK 17 example
JAVA_OPTS_FOR_JDK_17 = "-Djavax.net.ssl.trustStore=/path/to/your/cacerts -Djavax.net.ssl.trustStorePassword=changeit ..."
```

자체 서명 CA 인증서를 가져오는 전체 절차는 다음과 같습니다.

1. CA 인증서 파일(예: `ca.crt`)을 준비합니다.
2. `keytool`을 사용하여 Java trustStore로 가져옵니다.

    ```shell
    keytool -importcert -alias ldap-ca -keystore /path/to/your/cacerts -file /path/to/ca.crt -storepass changeit -noprompt
    ```

3. 위에서 설명한 대로 `JAVA_OPTS`에 trustStore 경로를 구성합니다.
4. 구성을 적용하려면 Doris FE를 다시 시작합니다.

## 캐시 관리 {#cache-management}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Forcing a refresh after LDAP information changes -->

LDAP 서비스에 자주 액세스하지 않도록 Doris는 LDAP 정보를 메모리에 캐시합니다.

| 구성 항목 | 설명 | 기본값 |
| --- | --- | --- |
| `ldap_user_cache_timeout_s` | LDAP 사용자 정보의 캐시 유지 시간(초) | 43200(12시간) |

다음 상황에서는 변경 사항을 즉시 적용하기 위해 캐시를 수동으로 갱신해야 할 수 있습니다.

- LDAP 서비스의 사용자 또는 그룹 정보가 변경된 경우.
- Doris에서 LDAP 사용자 그룹에 해당하는 `Role` 권한이 변경된 경우.

`ldap_default_roles`를 온라인으로 업데이트하면 LDAP 사용자 캐시가 자동으로 갱신됩니다. 이 구성만 변경했다면 `refresh ldap`를 실행할 필요가 없습니다.

`refresh ldap` 문으로 캐시를 갱신할 수 있습니다. 자세한 내용은 [REFRESH-LDAP](../../../sql-manual/sql-statements/account-management/REFRESH-LDAP)를 참조하세요.

## 알려진 제한 사항 {#known-limitations}

- Doris의 LDAP 기능은 클라이언트에서 FE로 연결되는 채널에서 평문 비밀번호 검증만 지원합니다. 즉, 사용자가 로그인할 때 비밀번호는 `client`와 `fe` 사이에서 평문으로 전송됩니다. 클라이언트와 Doris FE 간 SSL/TLS 암호화는 별도로 구성해야 합니다([클라이언트 연결](#step-2-client-connection) 참조).
- FE에서 LDAP 서버로 연결되는 채널은 기본적으로 평문 전송을 사용합니다(`ldap_use_ssl = false`). 이 채널을 암호화하려면 `ldap_use_ssl = true`를 설정하여 LDAPS를 활성화합니다([LDAPS(암호화된 연결)](#ldaps-encrypted-connection) 참조).

## 자주 묻는 질문 {#frequently-asked-questions}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Login failure / empty-password login rejected / missing roles / LDAPS handshake failure -->

### Q: LDAP 사용자가 Doris에서 어떤 역할을 가지고 있는지 어떻게 확인하나요? {#q-how-do-i-view-which-roles-an-ldap-user-has-in-doris}

LDAP 사용자로 Doris에 로그인한 후 `show grants;`를 실행하면 현재 사용자의 모든 역할을 확인할 수 있습니다. 이 중 `ldapDefaultRole`은 모든 LDAP 사용자에게 부여되는 기본 역할입니다.

`ldapDefaultRole`은 기본 제공 임시 역할로, `select_priv` 권한을 `information_schema`에 제공합니다. 이 역할은 `ldap_default_roles`에 구성된 역할과 다릅니다.

### Q: LDAP 사용자가 Doris에서 예상보다 적은 역할을 가지고 있습니다. 어떻게 해결하나요? {#q-an-ldap-user-has-fewer-roles-in-doris-than-expected-how-do-i-troubleshoot}

다음 항목을 차례로 확인합니다.

1. `show roles;`를 실행하여 예상한 역할이 Doris에 존재하는지 확인합니다. 존재하지 않으면 `CREATE ROLE role_name;`로 생성합니다.
2. 예상한 `group`이 `ldap_group_basedn`에 해당하는 조직 구조 아래에 있는지 확인합니다.
3. 예상한 `group`에 `member` 속성이 있는지 확인합니다.
4. `member` 속성이 예상한 `group`에서 현재 사용자의 `dn`을 포함하는지 확인합니다.
5. 누락된 역할이 `ldap_default_roles`에 구성되어 있으면 역할 이름의 철자가 올바른지, 해당 역할이 Doris에 존재하는지 확인합니다.

### Q: 이전에는 LDAP 사용자가 빈 비밀번호로 로그인할 수 있었는데, 업그레이드 후에는 로그인이 실패합니다. 이유가 무엇인가요? {#q-an-ldap-user-could-log-in-with-an-empty-password-before-but-the-login-fails-after-upgrading-why}

버전 4.1.5부터 Doris는 기본적으로 LDAP에 존재하는 사용자의 빈 비밀번호 로그인을 거부합니다(`ldap_allow_empty_pass = false`). 일부 LDAP 서버가 빈 비밀번호를 사용한 바인드를 성공한 비인증 바인드로 처리하기 때문입니다. 이러한 시도는 `fe.log`에 `Rejected LDAP login with empty password`로 기록됩니다.

사용자에게 LDAP 비밀번호로 로그인하도록 안내하세요. 이전 동작을 유지해야 한다면 `ldap_allow_empty_pass = true`를 `fe/conf/ldap.conf`에 설정하고 FE를 다시 시작합니다. 운영 환경에서는 권장하지 않습니다. 자세한 내용은 [빈 비밀번호 로그인](#empty-password-login)을 참조하세요.

### Q: LDAPS 연결이 실패합니다. 어떻게 해결하나요? {#q-ldaps-connection-fails-how-do-i-troubleshoot}

다음 항목을 차례로 확인합니다.

1. `ldap_use_ssl = true`가 `fe/conf/ldap.conf`에 설정되어 있는지 확인합니다.
2. `ldap_port`가 올바른 LDAPS 포트(일반적으로 `636`)로 설정되어 있는지 확인합니다.
3. JVM이 LDAP 서버의 SSL 인증서를 신뢰하는지 확인합니다. `fe.log`에서 `SSLHandshakeException` 또는 `PKIX path building failed`와 같은 SSL 핸드셰이크 오류를 확인합니다.
4. 자체 서명 CA를 사용하는 경우 CA 인증서를 trustStore로 가져왔는지, `JAVA_OPTS`에 trustStore 경로가 올바르게 구성되어 있는지 확인합니다.
