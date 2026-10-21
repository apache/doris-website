---
{
    "title": "Ranger-Hive 권한 부여",
    "description": "Kerberos, 정책, 행 필터링, 마스킹을 포함해 Doris Hive Catalog의 Ranger-Hive 권한 부여를 구성합니다.",
    "keywords": [
        "Apache Doris Ranger Hive",
        "Hive Catalog authorization",
        "ranger-hive",
        "ranger-hive-security.xml",
        "ranger.plugin.hive.service.name",
        "access_controller.class",
        "row filter",
        "data masking",
        "Doris Hive Catalog Ranger authorization",
        "Ranger Admin Kerberos",
        "policy.download.auth.users",
        "ranger-hive-security.xml not found",
        "Ranger Hive policy download failure",
        "Doris Current Ranger Hive"
    ]
}
---

<!-- Knowledge Type: Configuration Guide / Authorization -->
<!-- Use Case: Hive Catalog Authorization / Reusing Ranger Hive Policies -->

Apache Doris는 개별 Hive Catalog에 Ranger-Hive Access Controller를 지정할 수 있습니다. 그러면 Doris는 Apache Ranger에서 이미 관리 중인 Hive 정책을 재사용하여 해당 Catalog의 데이터베이스, 테이블, 컬럼에 대한 권한을 확인합니다. Ranger의 행 수준 필터, 데이터 마스킹, 감사 기능도 지원합니다.

조직에서 이미 Ranger로 Hive 권한을 관리하고 있으며, Doris에서 동일한 데이터를 쿼리할 때도 해당 정책을 따르도록 하려면 이 모드를 사용하세요.

Ranger-Hive는 이 Access Controller가 구성된 Hive Catalog만 제어합니다. Doris 클러스터 수준의 권한 부여를 대체하지 않으며, 기반 HDFS, S3 또는 기타 스토리지 시스템에 Ranger 정책을 적용하지 않습니다.

## 사용 사례 {#use-cases}

| 시나리오 | 지원 여부 | 설명 |
| --- | --- | --- |
| Doris를 통해 쿼리하는 Hive 데이터에 기존 Ranger Hive 정책 재사용 | 예 | 해당 Hive Catalog에 Ranger-Hive Access Controller 구성 |
| Ranger를 통해 전체 Doris 클러스터의 권한을 중앙에서 관리 | 아니요 | Ranger-Doris 사용 |
| 기반 HDFS 또는 S3 스토리지에 대한 액세스 권한 부여 | 아니요 | 스토리지 시스템에서 액세스 제어 및 자격 증명 격리 적용 |
| Hive/HMS 이외의 Catalog에 Ranger 권한 부여 구성 | 아니요 | Ranger-Hive는 Hive/HMS Catalog에만 적용 |

<!-- Knowledge Type: Architecture Decision -->
<!-- Use Case: Choosing Ranger-Doris or Ranger-Hive / Confirming Authorization Boundaries -->

## Ranger-Doris와 Ranger-Hive {#ranger-doris-and-ranger-hive}

Ranger-Doris와 Ranger-Hive는 용도가 다릅니다.

| 항목 | Ranger-Doris | Ranger-Hive |
| --- | --- | --- |
| 주요 용도 | Ranger에서 Doris 클러스터 권한을 중앙에서 관리 | 특정 Hive Catalog에 기존 Ranger Hive 정책 적용 |
| 활성화 방법 | FE 설정 `access_controller_type=ranger-doris` | Catalog 속성 `access_controller.class` |
| Ranger 서비스 유형 | Doris. Doris Ranger 플러그인과 서비스 정의 필요 | Hive. Ranger에 내장된 Hive 서비스 정의 사용 |
| 리소스 계층 | Doris 전역, Catalog, 데이터베이스, 테이블, 컬럼 및 기타 리소스 | Hive 데이터베이스, 테이블, 컬럼 리소스 |
| 적용 범위 | Doris 클러스터의 기본 Access Controller | 해당 컨트롤러를 선언한 외부 Catalog만 해당 |
| 정책 공유 | Doris 정책은 Hive 정책으로 변환되지 않음 | Hive 정책은 Ranger-Doris 정책을 읽지 않음 |

두 방식을 동일한 Doris 클러스터에서 함께 사용할 수 있습니다. 예를 들어 Ranger-Doris를 기본 Access Controller로 사용하면서 `hive_ctl`에는 Ranger-Hive를 사용할 수 있습니다. Hive Catalog에서 Ranger-Hive를 활성화하면 요청은 다음과 같이 처리됩니다. 여기서 "기본 Access Controller"는 Doris 내장 권한 부여 또는 Ranger-Doris일 수 있습니다.

### 권한 부여 범위 {#authorization-boundaries}

| 권한 범위 | 컨트롤러 | 참고 |
| --- | --- | --- |
| 전역 | 기본 Access Controller | Ranger-Hive에는 Doris 전역 리소스가 없음 |
| Catalog | 기본 Access Controller | Ranger Hive에는 Doris Catalog 리소스가 없음 |
| 데이터베이스 | 현재 Catalog의 Ranger-Hive | Ranger 리소스는 Hive 데이터베이스 이름 |
| 테이블 / 뷰 | 현재 Catalog의 Ranger-Hive | Ranger 리소스는 Hive 데이터베이스와 테이블 이름 |
| 컬럼 | 현재 Catalog의 Ranger-Hive | 참조되는 각 컬럼을 개별적으로 확인 |
| 행 수준 필터 | 현재 Catalog의 Ranger-Hive | Doris는 Ranger에서 필터 표현식을 가져옴. 정책은 `root` 또는 `admin`에 적용되지 않음 |
| 데이터 마스킹 | 현재 Catalog의 Ranger-Hive | Doris는 Ranger에서 컬럼 마스킹 규칙을 가져옴. 정책은 `root` 또는 `admin`에 적용되지 않음 |
| 리소스, Storage Vault, Compute Group | 기본 Access Controller | 이 리소스들은 Ranger-Hive 모델의 범위 밖에 있음 |
| HDFS, S3 및 기타 스토리지 | Ranger-Hive에서 확인하지 않음 | Doris는 계속해서 Catalog에 구성된 스토리지 자격 증명으로 데이터를 읽음 |

:::warning
기본 Access Controller가 해당 전역 권한을 부여하면, Ranger-Hive가 리소스에 대한 액세스를 거부하더라도 최종 데이터베이스, 테이블 또는 컬럼 권한 확인은 통과합니다. 거부 정책은 `ADMIN_PRIV`와 전역 `SELECT_PRIV`가 모두 없는 일반 사용자로 테스트하세요. `root` 또는 `admin`을 사용하지 마세요.
:::

## 사전 요구 사항 {#prerequisites}

- Ranger Admin이 배포되어 있고 모든 Doris FE에서 연결할 수 있어야 합니다.
- Ranger에 Hive 서비스가 있어야 합니다. 이 가이드에서는 서비스 이름으로 `hive_prod`를 사용합니다.
- Doris 사용자와 Catalog를 생성할 권한이 있어야 합니다. Ranger는 권한 부여를 수행하며, Doris 사용자를 생성하거나 사용자 비밀번호를 인증하지 않습니다.
- Hive Catalog에 Hive Metastore와 기반 스토리지에 액세스하는 데 필요한 네트워크, 인증, 권한 설정이 이미 구성되어 있어야 합니다.
- 모든 FE에서 Ranger 구성 파일을 읽을 수 있어야 합니다. 로컬 정책 캐시를 구성하는 경우 FE 프로세스 사용자가 캐시 디렉터리를 생성하거나 해당 디렉터리에 쓸 수 있어야 합니다.

## 구성 개요 {#configuration-overview}

다음 절차에서는 Ranger WebUI의 Hive 서비스 `hive_prod`, Doris Catalog `hive_ctl`, 사용자 `alice`를 사용합니다.

1. Ranger WebUI에서 Hive 서비스 `hive_prod`를 확인하거나 생성합니다.
2. 모든 FE에 `ranger-hive-security.xml`과 `ranger-hive-audit.xml`을 배포하고, 정책 캐시 디렉터리를 생성한 후 FE를 재시작합니다.
3. Doris 사용자 `alice`를 생성하고 Ranger-Hive가 활성화된 Hive Catalog `hive_ctl`을 생성합니다.
4. `alice`에 대한 액세스 정책을 Ranger의 `hive_prod` 서비스에 생성합니다.
5. Doris에 `alice`로 로그인하여 액세스 허용과 거부를 모두 확인합니다.

Ranger Admin에서 Kerberos 또는 HTTPS를 사용하는 경우 먼저 기본 구성을 완료한 다음, 이 가이드의 뒷부분에서 해당 보안 구성을 적용하세요.

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Basic Ranger-Hive Configuration -->

## Ranger 서비스 및 FE 구성 {#configure-the-ranger-service-and-fes}

### Ranger Hive 서비스 확인 {#confirm-the-ranger-hive-service}

Ranger WebUI의 서비스 관리자 페이지에서 Hive 서비스를 확인하거나 생성합니다.

| Ranger WebUI 필드 | 예시 | 설명 |
| --- | --- | --- |
| 서비스 유형 | `Hive` | Ranger의 Hive 서비스 정의 사용. Doris Ranger 플러그인은 필요하지 않음 |
| 서비스 이름 | `hive_prod` | Hive 정책을 저장하는 Ranger 서비스 인스턴스 |

HiveServer2에서 이미 `hive_prod`를 사용하고 있다면 Doris에서도 동일한 정책을 읽을 수 있습니다. Doris만을 위한 별도 서비스를 생성하지 마세요.

### 모든 FE에 구성 파일 준비 {#prepare-the-configuration-files-on-all-fes}

모든 FE의 `fe/conf/` 디렉터리에 다음 파일을 배치합니다.

```text
fe/conf/
├── ranger-hive-security.xml
├── ranger-hive-audit.xml
└── ranger-policymgr-ssl.xml    # Only for custom HTTPS trust or mutual TLS
```

`ranger-hive-security.xml`과 `ranger-hive-audit.xml`을 함께 배포하세요. 감사 기능이 필요하지 않더라도 감사 파일을 유지하고 감사를 명시적으로 비활성화하여 Ranger 2.7이 레거시 감사 구성 대체 경로로 진입하지 않도록 하세요. `ranger-policymgr-ssl.xml`은 Ranger Admin에서 사용자 지정 truststore 또는 클라이언트 인증서를 사용하는 HTTPS를 구성한 경우에만 필요합니다.

#### ranger-hive-security.xml 구성 {#configure-ranger-hive-securityxml}

모든 FE의 `fe/conf/` 아래에 다음 템플릿을 저장하고 서비스 이름, 주소, 경로를 실제 환경에 맞게 변경합니다.

`ranger-hive-security.xml` 예시:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
    <!-- The Hive Service Name in Ranger WebUI -->
    <property>
        <name>ranger.plugin.hive.service.name</name>
        <value>hive_prod</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.source.impl</name>
        <value>org.apache.ranger.admin.client.RangerAdminRESTClient</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.url</name>
        <value>http://ranger-admin.example.com:6080</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.cache.dir</name>
        <value>/var/lib/doris/ranger/hive_prod/policy-cache</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.pollIntervalMs</name>
        <value>30000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.client.connection.timeoutMs</name>
        <value>60000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.client.read.timeoutMs</name>
        <value>60000</value>
    </property>

    <!-- Set an absolute ranger-policymgr-ssl.xml path for HTTPS; otherwise leave empty -->
    <property>
        <name>ranger.plugin.hive.policy.rest.ssl.config.file</name>
        <value></value>
    </property>
</configuration>
```

`ranger-hive-security.xml`의 속성은 다음과 같습니다.

| 속성 | 필수 여부 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `ranger.plugin.hive.service.name` | 예 | 없음 | `<value>`는 Ranger WebUI의 Hive 서비스 이름과 정확히 일치해야 함. 예: `hive_prod` |
| `ranger.plugin.hive.policy.source.impl` | 아니요 | Ranger Admin REST 클라이언트 | 정책을 가져오는 데 사용하는 구현 |
| `ranger.plugin.hive.policy.rest.url` | 예 | 없음 | 정책 API 경로를 제외한 Ranger Admin 루트 URL |
| `ranger.plugin.hive.policy.cache.dir` | 이 가이드의 운영 환경 구성에서는 필수 | 로컬 캐시 없음 | 템플릿에는 예시 경로가 설정되어 있음. 디렉터리를 미리 생성하고 FE 프로세스 사용자에게 쓰기 권한 부여 |
| `ranger.plugin.hive.policy.pollIntervalMs` | 아니요 | `30000`밀리초 | 정책 폴링 간격 |
| `ranger.plugin.hive.policy.rest.client.connection.timeoutMs` | 아니요 | `120000`밀리초 | Ranger Admin 연결 시간 제한. 템플릿에서는 `60000`밀리초로 재정의 |
| `ranger.plugin.hive.policy.rest.client.read.timeoutMs` | 아니요 | `30000`밀리초 | Ranger Admin 응답 읽기 시간 제한. 템플릿에서는 `60000`밀리초로 재정의 |
| `ranger.plugin.hive.policy.rest.ssl.config.file` | 사용자 지정 HTTPS 신뢰 구성에서 필수 | 비어 있음 | `ranger-policymgr-ssl.xml`의 절대 경로 |

#### 정책 캐시 디렉터리 생성 {#create-the-policy-cache-directory}

Ranger-Doris와 Ranger-Hive에는 별도의 `policy.cache.dir` 경로를 사용하세요. 예를 들어 `/var/lib/doris/ranger/doris_prod/policy-cache`와 `/var/lib/doris/ranger/hive_prod/policy-cache`를 사용할 수 있습니다. 동일한 Ranger Hive 서비스를 재사용하는 Catalog는 동일한 Hive 플러그인 구성과 캐시를 읽습니다.

이 예시에서는 `/var/lib/doris/ranger/hive_prod/policy-cache`를 사용합니다. 모든 FE에서 `root`로 다음 명령을 실행하거나 명령에 `sudo`를 추가하세요.

```shell
mkdir -p /var/lib/doris/ranger/hive_prod/policy-cache
chown -R doris:doris /var/lib/doris/ranger/hive_prod
chmod 700 /var/lib/doris/ranger/hive_prod/policy-cache
```

이 명령은 FE가 사용자 및 그룹 `doris:doris`로 실행된다고 가정합니다. 실제 프로세스 사용자와 그룹으로 변경하세요. `sudo -u doris test -w /var/lib/doris/ranger/hive_prod/policy-cache`로 쓰기 권한을 확인하세요. `sudo`를 사용할 수 없다면 FE 프로세스 사용자로 동일한 검사를 수행하세요.

#### ranger-hive-audit.xml 구성 {#configure-ranger-hive-auditxml}

이 가이드에서는 기본적으로 Ranger 감사를 비활성화합니다. 감사를 비활성화하더라도 모든 FE에 다음 `fe/conf/ranger-hive-audit.xml`을 저장하세요.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property>
        <name>xasecure.audit.is.enabled</name>
        <value>false</value>
    </property>
</configuration>
```

`xasecure.audit.is.enabled=false`는 Ranger 권한 부여 감사 출력을 비활성화합니다. 운영 환경에서 감사를 사용하려면 해당 Ranger 버전의 Hive 감사 템플릿을 기반으로 Solr, HDFS, Kafka 등의 중앙 백엔드를 구성하고 이 속성을 `true`로 설정하세요. Log4j는 운영 환경의 감사 대상으로 권장하지 않습니다. 감사 레코드에 FE 로그 로테이션 정책이 함께 적용되어 보관 기간과 총 크기를 독립적으로 제어하기 어렵기 때문입니다.

#### FE 재시작 {#restart-the-fes}

XML 파일과 캐시 디렉터리를 구성한 후 Catalog를 생성하기 전에 모든 FE를 재시작하세요. Ranger 구성은 Access Controller가 초기화될 때 로드되며, 모든 FE에서 동일한 파일과 경로를 사용해야 합니다.

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Creating a Hive Catalog with Ranger-Hive Enabled -->

## 사용자 및 Hive Catalog 생성 {#create-the-user-and-hive-catalog}

### Doris 사용자 생성 {#create-the-doris-user}

Ranger 사용자와 동일한 이름으로 Doris 로그인 사용자를 생성합니다.

```sql
CREATE USER 'alice' IDENTIFIED BY 'R8!mQ2#vL7@k';
```

### Ranger-Hive를 사용하는 Hive Catalog 생성 {#create-a-hive-catalog-with-ranger-hive}

```sql
CREATE CATALOG hive_ctl PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms.example.com:9083',
    'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory',
    'access_controller.properties.ranger.service.name' = 'hive'
);
```

Ranger-Hive는 Doris Catalog 수준의 권한을 관리하지 않습니다. 기본값인 `skip_catalog_priv_check=false`에서는 기본 Access Controller도 사용자가 새로 생성된 `hive_ctl`을 조회하고 사용할 수 있도록 허용해야 합니다. 기본 컨트롤러가 Doris 내장 권한 부여인 경우 다음을 실행하세요.

```sql
GRANT SELECT_PRIV ON hive_ctl.*.* TO 'alice';
```

이 권한 부여는 Doris Catalog 수준의 확인만 통과시킵니다. `hive_ctl` 내의 데이터베이스, 테이블, 컬럼 액세스는 계속해서 해당 Catalog의 Ranger-Hive Access Controller가 확인합니다.

Current 버전에서는 대신 `skip_catalog_priv_check=true`를 `fe.conf`에 설정하여 사용자 지정 Access Controller가 있는 외부 Catalog의 `SHOW` 및 `SELECT` Catalog 수준 확인을 건너뛸 수 있습니다. 이 설정은 Ranger-Hive의 데이터베이스, 테이블, 컬럼 확인을 건너뛰지 않으며, `CREATE`, `LOAD`, `ALTER` 등의 작업에 대한 Catalog 수준 확인도 건너뛰지 않습니다.

다음 이름들은 혼동하기 쉽습니다.

| 위치 | 예시 | 의미 |
| --- | --- | --- |
| Catalog의 `access_controller.class` | `org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory` | Ranger-Hive Access Controller 팩터리의 전체 클래스 이름. Current 및 4.x에서는 짧은 식별자 `ranger-hive`도 허용함. Ranger 서비스 이름을 입력하지 말 것 |
| Catalog의 `access_controller.properties.ranger.service.name` | `hive` | Ranger 플러그인 구성 접두사 및 서비스 유형. Doris는 `access_controller.properties.`를 제거하고 `ranger.service.name=hive`를 Ranger에 전달함 |
| `ranger.plugin.hive.service.name`(`fe/conf/ranger-hive-security.xml` 내) | `hive_prod` | `<value>`는 Ranger WebUI에서 정책을 저장하는 Hive 서비스 이름 |

:::caution
Catalog 속성을 `'access_controller.properties.ranger.service.name'='hive_prod'`로 설정하지 마세요. 이 표준 구성에서는 반드시 `hive`여야 합니다. 실제 Ranger WebUI 서비스 이름은 `ranger.plugin.hive.service.name`에 지정하며, 이 속성은 `ranger-hive-security.xml` 안에 있습니다. 예: `<value>hive_prod</value>`.
:::

Hive Metastore, HDFS 또는 오브젝트 스토리지 연결은 [Hive Catalog](../../../lakehouse/catalogs/hive-catalog) 문서를 참고하여 구성하세요. Ranger Admin 또는 HMS/HDFS에서 Kerberos를 사용하는 경우 아래 Kerberos 섹션을 참고하세요. 각 연결은 서로 다른 principal, keytab, 구성 위치를 사용합니다.

Catalog가 생성되면 FE는 구성을 검증하기 위해 Access Controller를 인스턴스화합니다. 다른 FE는 해당 Catalog의 요청에 대해 처음으로 권한을 확인할 때 필요에 따라 활성 컨트롤러를 초기화합니다.

<!-- Knowledge Type: Operational Steps -->
<!-- Use Case: Creating and Verifying a Ranger Hive Access Policy -->

## Ranger 정책 구성 및 검증 {#configure-and-verify-ranger-policies}

### Ranger 액세스 정책 생성 {#create-a-ranger-access-policy}

Ranger WebUI에서 Hive 서비스 `hive_prod`를 열고 액세스 정책을 생성합니다.

| 필드 | 예시 |
| --- | --- |
| 정책 이름 | `alice_read_sales_orders` |
| 데이터베이스 | `sales` |
| 테이블 | `orders` |
| 컬럼 | `*` |
| 사용자 선택 | `alice` |
| 권한 | `select` |

정책을 저장하고 폴링 간격만큼 기다리세요. 이 예시에서는 약 30초입니다.

### 권한 부여 검증 {#verify-authorization}

Doris에 `alice`로 로그인한 후 다음을 실행합니다.

```sql
SHOW DATABASES FROM hive_ctl;
SELECT * FROM hive_ctl.sales.orders LIMIT 10;
```

예상 동작:

- `alice`는 `sales`를 볼 수 있고 `orders`를 쿼리할 수 있습니다.
- `hive_ctl.sales.customers`처럼 권한이 없는 테이블을 쿼리하면 권한 오류가 반환됩니다.
- 중앙 집중식 Ranger 감사를 활성화했다면 해당 백엔드에 허용된 요청과 거부된 요청이 모두 기록됩니다.

<!-- Knowledge Type: Permission Mapping / Behavior Reference -->
<!-- Use Case: Ranger Policy Design / Authorization Troubleshooting -->

## 권한 부여 동작 {#authorization-behavior}

### 권한 매핑 {#permission-mapping}

다음 표는 Current 및 4.x의 `RangerHiveAccessController`에 있는 기본 매핑을 보여줍니다. 현재 두 버전의 매핑은 동일하며, 4.x에서는 추가로 사용자, 역할, 데이터베이스 이름에서 Cluster Namespace 접두사를 제거합니다. 매핑이 있다고 해서 모든 SQL 문이 해당 확인을 수행하는 것은 아닙니다. SQL 문 지원 여부는 해당 Doris 버전에 구현된 권한 부여 경로에도 달려 있습니다.

| Doris 권한 조건 | Ranger 액세스 유형 |
| --- | --- |
| `SHOW` | `ANY_ACCESS`. 리소스에 대해 허용된 액세스가 하나라도 있음을 의미 |
| `SELECT` | `select` |
| `LOAD` | `update` |
| `ALTER` | `alter` |
| `CREATE` | `create` |
| `DROP` | `drop` |
| `ADMIN` / `ALL` | `all` |
| 매핑되지 않은 기타 조건 | `none` |

Ranger-Hive 리소스에는 `database`, `table`, `column`만 포함되며 Doris Catalog 이름은 포함되지 않습니다. 두 Doris Catalog가 모두 `hive_prod`를 사용하고 둘 다 `sales.orders`를 포함한다면, 두 Catalog의 해당 리소스에 동일한 Ranger 정책이 매칭됩니다.

### 사용자 및 역할 매칭 {#user-and-role-matching}

- Doris가 사용자를 인증한 후 Ranger 요청에 현재 Doris 사용자 이름을 전송합니다. Ranger 사용자 이름은 Doris 사용자 이름과 정확히 일치해야 합니다.
- Ranger-Hive가 구성된 Catalog에서는 Ranger-Hive만 데이터베이스, 테이블, 컬럼 권한을 결정하며, 해당 범위의 Doris 객체 권한 부여는 이 결정에 함께 반영되지 않습니다. 다만 Doris 전역 권한이 있으면 확인을 조기에 통과할 수 있으며, Catalog 권한은 계속해서 기본 Access Controller가 담당합니다.
- Doris는 현재 Doris 사용자가 보유한 역할 이름을 요청 컨텍스트로 전송합니다. Ranger 정책의 `Roles`는 이 이름과 매칭될 수 있습니다. 이는 Ranger 정책 조건일 뿐이며, Doris 내부 객체 권한 부여가 Ranger-Hive의 결정에 참여하게 하지는 않습니다.
- Doris와 Ranger는 역할을 동기화하지 않습니다. 역할을 기준으로 정책을 작성한 경우에만 Doris 요청의 역할 이름이 Ranger에서 참조하는 역할 이름과 일치해야 합니다. 사용자 또는 그룹 기반 Ranger 정책이 일반적으로 유지 관리하기 더 쉽습니다.
- Ranger UserSync는 Doris 로그인 사용자를 생성하지 않습니다. Ranger에 `alice`가 있더라도 Doris에서 `alice`를 생성하거나 LDAP 또는 다른 구성된 공급자를 통해 사용자를 인증해야 합니다.
- Doris 사용자의 호스트 부분은 로그인 매칭과 감사 클라이언트 IP에 사용되며, Ranger 사용자 이름에는 포함되지 않습니다. 예를 들어 Doris 사용자 `'alice'@'10.%'`는 Ranger 사용자 `alice`에 매핑됩니다.

<!-- Knowledge Type: Configuration Examples -->
<!-- Use Case: Row-Level Access Control / Sensitive Data Masking -->

## 행 필터링 및 데이터 마스킹 {#row-filtering-and-data-masking}

### 행 수준 필터 {#row-level-filter}

`hive_prod`에 행 수준 필터 정책을 생성합니다.

| 필드 | 예시 |
| --- | --- |
| 데이터베이스 | `sales` |
| 테이블 | `orders` |
| 사용자 | `alice` |
| 행 수준 필터 | `region = 'CN'` |

액세스 정책에서도 `alice`에게 `sales.orders`에 대한 `select` 권한을 부여해야 합니다. 행 필터는 필터 표현식을 추가할 뿐, 기본 액세스 권한 부여를 대체하지 않습니다.

다음을 실행합니다.

```sql
SELECT order_id, region FROM hive_ctl.sales.orders;
```

결과에는 `region = 'CN'`인 행만 포함됩니다.

### 데이터 마스킹 {#data-masking}

`hive_prod`에 마스킹 정책을 생성합니다.

| 필드 | 예시 |
| --- | --- |
| 데이터베이스 | `sales` |
| 테이블 | `customers` |
| 컬럼 | `phone` |
| 사용자 | `alice` |
| 마스킹 옵션 | Ranger 내장 유형 또는 사용자 지정 |
| 사용자 지정 표현식 | `concat(substr({col}, 1, 3), '****')` |

또한 `alice`에게 해당 컬럼의 `select` 권한을 부여하세요. `phone`을 쿼리하면 Doris는 Ranger 표현식의 `{col}`을 실제 컬럼 이름으로 바꾸고 마스킹 표현식을 적용합니다.

:::caution
행 필터 및 마스킹 표현식은 Doris SQL 엔진이 구문 분석합니다. HiveServer2용으로 작성한 표현식에서 Doris가 지원하지 않는 Hive UDF 또는 구문을 사용한다면 표현식을 다시 작성해야 합니다.
:::

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Kerberos-Enabled Ranger Admin / SPNEGO Policy Download -->

## Ranger Admin에서 Kerberos를 사용하는 경우 {#when-ranger-admin-uses-kerberos}

이 섹션에서는 FE의 Ranger-Hive 클라이언트가 HTTP/SPNEGO를 통해 Ranger Admin에 인증하도록 구성합니다. Ranger Admin Kerberos 인증과 Hive/HMS Kerberos 인증은 서로 다른 서비스 인증입니다. 동일한 realm을 사용할 수는 있지만, 각 연결에는 고유한 서비스 principal, 클라이언트 principal, keytab, 구성 위치가 있습니다.

| 연결 | 서버 ID 예시 | Doris 클라이언트 ID 예시 | 용도 및 구성 |
| --- | --- | --- | --- |
| FE에서 Ranger Admin으로 | `HTTP/ranger-admin.example.com@EXAMPLE.COM` | `doris/ranger-client.example.com@EXAMPLE.COM` | 정책 다운로드. 서버 설정은 Ranger Admin에, 클라이언트 설정은 `fe/conf/ranger-hive-security.xml`에 있음 |
| FE에서 HMS로 | `hive/hms.example.com@EXAMPLE.COM` | `doris/hive-client.example.com@EXAMPLE.COM` | 메타데이터 읽기. Hive Catalog의 `hive.metastore.*` 속성으로 구성 |
| FE/BE에서 HDFS로 | NameNode/DataNode 서비스 principal | `doris/hive-client.example.com@EXAMPLE.COM` | 데이터 읽기. Hive Catalog의 `hdfs.authentication.*` 속성으로 구성 |

:::caution 버전 요구 사항
Doris 4.x에서는 **4.0.2 이상**이 필요합니다. Doris 4.0.0 및 4.0.1에는 Ranger 2.4가 포함되어 있으며, 이 버전에는 여기서 사용하는 Ranger 플러그인의 UGI keytab 로그인 기능이 없습니다. Doris 4.0.2에서는 Ranger가 2.7로 업그레이드됩니다. Current에 포함된 Ranger 버전은 이 기능을 지원합니다.
:::

### 1. Ranger Admin 및 FE의 Kerberos ID 확인 {#1-confirm-the-ranger-admin-and-fe-kerberos-identities}

먼저 Ranger Admin 서버 구성을 확인하세요. Apache Ranger는 일반적으로 배포된 웹 애플리케이션의 `WEB-INF/classes/conf/` 디렉터리에서 `core-site.xml`과 `ranger-admin-site.xml`을 로드합니다. 배포판별로 경로가 다를 수 있으므로 Ranger Admin 시작 인수 또는 설치 구조를 기준으로 확인하세요.

| 파일 | 속성 | 의미 |
| --- | --- | --- |
| `core-site.xml` | `hadoop.security.authentication` | Ranger Admin SPNEGO 필터에서 사용하는 Hadoop 인증. 보안 플러그인 다운로드에는 `kerberos` 사용 |
| `ranger-admin-site.xml` | `ranger.service.host` | Ranger Admin 서비스 호스트 이름이자 `_HOST`에 대입되는 값 |
| `ranger-admin-site.xml` | `ranger.spnego.kerberos.principal` | HTTP/SPNEGO 서비스 principal. 예: `HTTP/_HOST@EXAMPLE.COM` |
| `ranger-admin-site.xml` | `ranger.spnego.kerberos.keytab` | Ranger Admin이 읽는 서버 측 SPNEGO keytab 경로 |

`ranger.authentication.method`는 Ranger WebUI 로그인을 제어하며, 이 설정만으로 보안 플러그인 다운로드 엔드포인트에서 SPNEGO를 사용한다고 판단할 수는 없습니다. 실제로 적용된 `ranger-admin-site.xml`과 Ranger Admin 시작 로그를 확인하세요.

Ranger Admin 서버에서 `klist -kt <actual ranger.spnego.kerberos.keytab path>`를 실행하고, keytab에 `_HOST`가 확장된 HTTP principal(예: `HTTP/ranger-admin.example.com@EXAMPLE.COM`)이 포함되어 있는지 확인하세요. `ranger.plugin.hive.policy.rest.url`의 호스트 이름은 이 principal과 일치해야 합니다.

Ranger는 FE 클라이언트 principal이나 keytab을 생성하지 않습니다. Kerberos 관리자가 `doris/ranger-client.example.com@EXAMPLE.COM`과 같은 ID를 생성하고, 이를 `/etc/security/keytabs/doris-ranger.keytab`으로 내보낸 뒤 모든 FE에 배포하여 FE 프로세스 사용자가 읽을 수 있도록 해야 합니다. Ranger Admin의 HTTP principal이나 서버 SPNEGO keytab을 FE에 제공하지 마세요.

이 섹션에서는 다음 값을 사용합니다.

| 항목 | 예시 |
| --- | --- |
| Ranger Hive 서비스 이름 | `hive_prod` |
| Ranger Admin URL | `http://ranger-admin.example.com:6080` |
| Kerberos realm | `EXAMPLE.COM` |
| Ranger Admin HTTP 서비스 principal | `HTTP/ranger-admin.example.com@EXAMPLE.COM` |
| FE 정책 다운로드 principal | `doris/ranger-client.example.com@EXAMPLE.COM` |
| FE 클라이언트 keytab | `/etc/security/keytabs/doris-ranger.keytab` |

HTTP principal은 Ranger Admin의 서버 ID입니다. 이를 FE의 `ugi.keytab.principal`에 지정하지 마세요. 이 속성에는 FE 클라이언트 ID가 들어가야 합니다.

### 2. Kerberos 모드로 Hadoop UGI 초기화 {#2-initialize-hadoop-ugi-in-kerberos-mode}

`ugi.*` 속성을 `ranger-hive-security.xml`에 추가하는 것만으로는 충분하지 않습니다. Ranger는 `UserGroupInformation.loginUserFromKeytab()`을 호출하며, 전역 Hadoop 인증이 `kerberos`로 설정된 경우에만 keytab 로그인으로 Kerberos 자격 증명을 얻을 수 있습니다.

모든 FE의 `fe/conf/`에 `core-site.xml`을 생성합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property>
        <name>hadoop.security.authentication</name>
        <value>kerberos</value>
    </property>
</configuration>
```

`start_fe.sh`는 FE의 `conf` 디렉터리를 Java classpath에 추가하므로 `fe/conf/core-site.xml` 사용을 권장합니다. 대신 공유 Hadoop 구성 디렉터리를 사용하려면 `fe.conf`에 다음을 설정하세요.

```text
HADOOP_CONF_DIR=/etc/hadoop/conf
```

이 경우 모든 FE를 재시작하기 전에 `/etc/hadoop/conf/core-site.xml`이 존재하고 FE 프로세스 사용자가 읽을 수 있어야 합니다.

### 3. krb5.conf 및 Ranger Admin HTTP SPN 구성 {#3-configure-krb5conf-and-the-ranger-admin-http-spn}

모든 FE의 `/etc/krb5.conf`에서 Ranger Admin URL 호스트 이름에 대한 realm, KDC, `domain_realm` 매핑을 구성합니다.

```ini
[libdefaults]
    default_realm = EXAMPLE.COM
    dns_lookup_realm = false
    dns_lookup_kdc = false
    rdns = false

[realms]
    EXAMPLE.COM = {
        kdc = kdc.example.com:88
        admin_server = kdc.example.com
    }

[domain_realm]
    ranger-admin.example.com = EXAMPLE.COM
    .example.com = EXAMPLE.COM
```

`ranger.plugin.hive.policy.rest.url`의 호스트 이름은 Ranger Admin HTTP/SPNEGO keytab의 SPN과 일치해야 합니다. URL 호스트가 `ranger-admin.example.com`이라면 서버 keytab에 다음 항목이 포함되어 있어야 합니다.

```text
HTTP/ranger-admin.example.com@EXAMPLE.COM
```

짧은 호스트 이름, FQDN, CNAME, VIP, IP를 혼용하지 마세요. URL에서 `http://ranger-admin:6080`과 같은 짧은 호스트 이름을 사용한다면 도메인 매핑 외에 정확한 이름 매핑도 추가하세요.

```ini
[domain_realm]
    ranger-admin = EXAMPLE.COM
    ranger-admin.example.com = EXAMPLE.COM
    .example.com = EXAMPLE.COM
```

`kinit`, `klist`, `kdestroy`, `kvno`를 제공하는 Kerberos 클라이언트 도구를 설치하세요. 다음 명령은 FE 프로세스 사용자로 실행하세요. 별도의 티켓 캐시를 사용하므로 기존 자격 증명은 삭제하지 않습니다. 실행 전에 principal, keytab, 호스트 이름을 실제 값으로 변경하세요.

```shell
export KRB5CCNAME=FILE:/tmp/krb5cc_doris_ranger_test_$$
kdestroy 2>/dev/null || true
klist -kt /etc/security/keytabs/doris-ranger.keytab
kinit -kt /etc/security/keytabs/doris-ranger.keytab \
    doris/ranger-client.example.com@EXAMPLE.COM
kvno HTTP/ranger-admin.example.com@EXAMPLE.COM
klist
kdestroy
```

`klist -kt` 결과에는 FE 클라이언트 principal이 표시되어야 합니다. `kinit`이 성공하면 보통 아무것도 출력되지 않습니다. `kvno`가 성공한 뒤 `klist`에 `krbtgt/...`와 Ranger Admin HTTP 티켓이 모두 표시되면 클라이언트 keytab, realm 매핑, HTTP SPN이 올바른 것입니다. 마지막 `kdestroy`는 이 확인에 사용한 임시 캐시만 제거합니다.

### 4. 전체 ranger-hive-security.xml 구성 {#4-configure-the-complete-ranger-hive-securityxml}

모든 FE의 `fe/conf/ranger-hive-security.xml`에서 정책 액세스와 UGI 로그인을 함께 구성합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
    <property>
        <name>ranger.plugin.hive.service.name</name>
        <value>hive_prod</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.source.impl</name>
        <value>org.apache.ranger.admin.client.RangerAdminRESTClient</value>
    </property>

    <!-- The hostname must match the Ranger Admin HTTP SPN -->
    <property>
        <name>ranger.plugin.hive.policy.rest.url</name>
        <value>http://ranger-admin.example.com:6080</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.cache.dir</name>
        <value>/var/lib/doris/ranger/hive_prod/policy-cache</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.pollIntervalMs</name>
        <value>30000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.client.connection.timeoutMs</name>
        <value>60000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.client.read.timeoutMs</name>
        <value>60000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.ugi.initialize</name>
        <value>true</value>
    </property>

    <property>
        <name>ranger.plugin.hive.ugi.login.type</name>
        <value>keytab</value>
    </property>

    <property>
        <name>ranger.plugin.hive.ugi.keytab.principal</name>
        <value>doris/ranger-client.example.com@EXAMPLE.COM</value>
    </property>

    <property>
        <name>ranger.plugin.hive.ugi.keytab.file</name>
        <value>/etc/security/keytabs/doris-ranger.keytab</value>
    </property>
</configuration>
```

Kerberos 관련 속성:

| 속성 | 설명 |
| --- | --- |
| `ranger.plugin.hive.ugi.initialize` | Ranger-Hive 플러그인이 초기화될 때 Hadoop UGI 로그인 수행 |
| `ranger.plugin.hive.ugi.login.type` | keytab 로그인에는 `keytab`으로 설정 |
| `ranger.plugin.hive.ugi.keytab.principal` | FE가 Ranger 정책을 다운로드할 때 사용하는 클라이언트 principal. keytab에 존재해야 함 |
| `ranger.plugin.hive.ugi.keytab.file` | 클라이언트 keytab의 절대 경로. 모든 FE에서 동일해야 하며 FE 프로세스 사용자가 읽을 수 있어야 함 |

`ranger.plugin.hive.policy.rest.secure=true`가 Kerberos 다운로드 경로를 선택하는 것은 아닙니다. Ranger 클라이언트는 Hadoop UGI가 보안 모드인지, 로그인 사용자에게 Kerberos 자격 증명이 있는지 확인합니다. 선택된 모드는 FE 로그의 `secureMode`로 확인하세요.

### 5. FE 서비스 ID에 hive_prod 정책 다운로드 허용 {#5-allow-the-fe-service-identity-to-download-hive_prod-policies}

이 단계에서는 **FE가 정책을 다운로드하는 데 사용하는 서비스 계정**에 권한을 부여합니다. 이 계정은 Doris 쿼리 사용자 `alice`와 다르며, 이 단계에서 해당 계정에 Hive 데이터 액세스 권한을 부여하지는 않습니다.

Ranger Admin에서 Kerberos를 활성화하면 정책 다운로드 시 두 가지 확인을 거칩니다.

1. Ranger Admin이 SPNEGO를 통해 FE keytab principal을 인증합니다.
2. Ranger Admin이 인증된 로그인 ID에 `hive_prod`의 데이터를 다운로드할 권한이 있는지 확인합니다.

이 예시의 ID 변환 과정은 다음과 같습니다.

| 단계 | 예시 | 용도 |
| --- | --- | --- |
| FE keytab의 principal | `doris/ranger-client.example.com@EXAMPLE.COM` | SPNEGO 인증 |
| Ranger Admin 로그인 ID | `doris` | `auth_to_local`로 principal을 변환한 후의 계정 |
| 권장 Hive 서비스 구성 | `policy.download.auth.users=doris` | 이 FE 계정에 정책 및 역할 데이터 다운로드 허용 |

일반 FE 서비스 계정에는 Hive 서비스의 `policy.download.auth.users`를 사용하여 다운로드에 필요한 최소 권한을 부여하세요. Ranger WebUI에서 Hive 서비스 `hive_prod`를 편집하고 구성에 다음이 포함되어 있는지 확인하세요.

```text
policy.download.auth.users=doris
```

여기서 `doris`는 Doris 쿼리 사용자가 아니라 인증된 Ranger Admin 세션의 로그인 ID입니다. Ranger Admin SPNEGO 필터는 해당 서버의 `core-site.xml`에 있는 `hadoop.security.auth_to_local`을 적용합니다. 이 규칙이 예시 principal을 `doris`로 매핑할 때만 `doris`를 사용하세요. 전체 principal이나 고정된 짧은 이름을 가정하지 말고 Ranger Admin 인증 로그에서 실제 로그인 ID를 확인하세요.

Apache Ranger 2.7은 `policy.download.auth.users`를 쉼표로 분리하고 각 항목을 로그인 ID와 비교할 때 대소문자를 구분하지 않는 정확한 일치를 사용합니다. 여러 계정에는 `doris,hive`와 같이 공백 없이 쉼표로 구분한 목록을 사용하세요. Ranger 관리자와 `policy.grantrevoke.auth.users`에 나열된 사용자도 다운로드 권한 확인을 통과할 수 있습니다. 그러나 FE에는 다운로드 권한만 필요하므로, 이를 위해 더 넓은 권한 부여/회수 권한을 부여해서는 안 됩니다.

### 6. FE 재시작 및 보안 정책 다운로드 검증 {#6-restart-the-fes-and-verify-secure-policy-download}

모든 FE를 재시작하고 먼저 FE 로그에서 다음과 같은 메시지를 확인하세요.

```text
secureMode=true, user=doris/ranger-client.example.com@EXAMPLE.COM (auth:KERBEROS)
```

그런 다음 FE 프로세스 사용자로 동일한 keytab을 사용하여 보안 정책 엔드포인트를 호출하세요. 실행 전에 `curl --version` 결과에 GSS-API, Kerberos 또는 SPNEGO 지원이 표시되는지 확인하세요.

```shell
export KRB5CCNAME=FILE:/tmp/krb5cc_doris_ranger_download_test_$$
kdestroy 2>/dev/null || true
kinit -kt /etc/security/keytabs/doris-ranger.keytab \
    doris/ranger-client.example.com@EXAMPLE.COM

curl --negotiate -u : -sS -i \
    'http://ranger-admin.example.com:6080/service/plugins/secure/policies/download/hive_prod?lastKnownVersion=-1&lastActivationTime=0'

kdestroy
```

완전한 정책 JSON 응답과 함께 HTTP 200이 반환되어야 전체 경로가 정상적으로 동작하는 것입니다. `kinit`, `kvno` 성공 또는 `secureMode=true`는 경로의 일부만 검증하므로 다운로드 결과를 대신할 수 없습니다.

정책이 로드되면 예시 캐시 디렉터리에 다음 파일이 있어야 합니다.

```text
/var/lib/doris/ranger/hive_prod/policy-cache/hive_hive_prod.json
/var/lib/doris/ranger/hive_prod/policy-cache/hive_hive_prod_roles.json
```

### 7. Ranger Admin, HMS, HDFS가 모두 Kerberos를 사용하는 경우 {#7-when-ranger-admin-hms-and-hdfs-all-use-kerberos}

Hive Metastore와 HDFS에서도 Kerberos를 사용한다면 빠른 시작의 `CREATE CATALOG hive_ctl` 문 **대신** 다음 Catalog 정의를 사용하세요. 동일한 Catalog를 두 번 생성하지 마세요. 여기서 `doris-ranger.keytab`은 FE 정책 다운로드 전용이며, `doris-hive.keytab`은 HMS 및 HDFS 액세스용입니다.

```sql
CREATE CATALOG hive_ctl PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms.example.com:9083',
    'hive.metastore.authentication.type' = 'kerberos',
    'hive.metastore.client.principal' = 'doris/hive-client.example.com@EXAMPLE.COM',
    'hive.metastore.client.keytab' = '/etc/security/keytabs/doris-hive.keytab',
    'hive.metastore.service.principal' = 'hive/hms.example.com@EXAMPLE.COM',
    'hdfs.authentication.type' = 'kerberos',
    'hdfs.authentication.kerberos.principal' = 'doris/hive-client.example.com@EXAMPLE.COM',
    'hdfs.authentication.kerberos.keytab' = '/etc/security/keytabs/doris-hive.keytab',
    'fs.defaultFS' = 'hdfs://nameservice1',
    'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory',
    'access_controller.properties.ranger.service.name' = 'hive'
);
```

두 클라이언트 ID의 용도는 서로 다릅니다.

- `doris-ranger.keytab`은 FE가 SPNEGO를 통해 Ranger Admin에서 정책을 다운로드할 수 있게 하며, FE에만 배포하면 됩니다.
- `doris-hive.keytab`은 HMS와 HDFS에 액세스합니다. HMS 클라이언트 keytab은 모든 FE에 배포하세요. HDFS 클라이언트 keytab은 HDFS에 액세스하는 모든 FE와 BE에서 읽을 수 있도록 동일한 절대 경로에 배포하세요. 해당 속성을 개별적으로 설정하면 HMS와 HDFS에 서로 다른 클라이언트 ID를 사용할 수 있습니다.

HMS 서버 principal은 Hive Metastore Kerberos 구성에서 확인하세요. 예시의 `hive/hms.example.com@EXAMPLE.COM`은 Ranger Admin HTTP principal과 다릅니다. 각 연결은 동일한 realm을 사용할 수 있지만 principal과 keytab을 서로 바꿔 사용할 수는 없습니다.

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Ranger Admin over HTTPS / Custom CA / Mutual TLS -->

## Ranger Admin에서 HTTPS를 사용하는 경우 {#when-ranger-admin-uses-https}

모든 FE의 `fe/conf/ranger-hive-security.xml`에서 Ranger Admin URL을 HTTPS로 변경하고 `ranger.plugin.hive.policy.rest.ssl.config.file`이 SSL 구성 파일을 가리키도록 설정합니다.

```xml
<property>
    <name>ranger.plugin.hive.policy.rest.url</name>
    <value>https://ranger-admin.example.com:6182</value>
</property>
<property>
    <name>ranger.plugin.hive.policy.rest.ssl.config.file</name>
    <value>/opt/apache-doris/fe/conf/ranger-policymgr-ssl.xml</value>
</property>
```

다음 예시에서는 Ranger Admin CA 인증서 `/tmp/ranger-admin-ca.pem`과 FE 프로세스 ID `doris:doris`를 사용합니다. 모든 FE에 truststore와 JCEKS 자격 증명 공급자를 준비하세요. 이 명령에는 JDK의 `keytool`과 Hadoop의 `hadoop credential`이 필요합니다.

```shell
sudo install -d -o doris -g doris -m 700 /etc/security/ranger
sudo -u doris keytool -importcert -noprompt \
    -alias ranger-admin-ca \
    -file /tmp/ranger-admin-ca.pem \
    -storetype JKS \
    -keystore /etc/security/ranger/ranger-truststore.jks
sudo -u doris hadoop credential create sslTrustStore \
    -provider jceks://file/etc/security/ranger/ranger-ssl.jceks
sudo chmod 600 /etc/security/ranger/ranger-truststore.jks \
    /etc/security/ranger/ranger-ssl.jceks
```

`keytool`은 truststore 비밀번호를 입력하라는 메시지를 표시하고, `hadoop credential`은 `sslTrustStore` 값을 입력하라는 메시지를 표시합니다. 두 곳에 동일한 비밀번호를 입력하세요. 임시 CA 경로를 해당 배포 환경의 인증서 관리 경로로 변경하고 FE 프로세스 사용자가 두 파일을 모두 읽을 수 있는지 확인하세요.

`ranger-policymgr-ssl.xml` 예시:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property>
        <name>xasecure.policymgr.clientssl.truststore</name>
        <value>/etc/security/ranger/ranger-truststore.jks</value>
    </property>
    <property>
        <name>xasecure.policymgr.clientssl.truststore.type</name>
        <value>JKS</value>
    </property>
    <property>
        <name>xasecure.policymgr.clientssl.truststore.credential.file</name>
        <value>jceks://file/etc/security/ranger/ranger-ssl.jceks</value>
    </property>
</configuration>
```

Ranger 클라이언트는 고정된 `sslTrustStore` 별칭에서 truststore 비밀번호를 읽습니다. 상호 TLS에는 추가로 `xasecure.policymgr.clientssl.keystore`와 JCEKS의 `sslKeyStore` 별칭이 필요합니다. truststore 또는 keystore 비밀번호를 XML에 평문으로 넣지 마세요.

<!-- Knowledge Type: Architecture Constraints / Best Practices -->
<!-- Use Case: Multiple Hive Catalogs / Ranger-Doris and Ranger-Hive Coexistence -->

## 여러 Catalog 및 런타임 제약 사항 {#multiple-catalogs-and-runtime-constraints}

### 여러 Catalog에서 하나의 Hive 정책 서비스 재사용 {#reuse-one-hive-policy-service-across-catalogs}

`hive_prod`에 해당하는 여러 Catalog는 동일한 컨트롤러 구성을 사용할 수 있습니다.

```sql
CREATE CATALOG hive_prod_a PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-a.example.com:9083',
    'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory',
    'access_controller.properties.ranger.service.name' = 'hive'
);

CREATE CATALOG hive_prod_b PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-b.example.com:9083',
    'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory',
    'access_controller.properties.ranger.service.name' = 'hive'
);
```

Ranger Hive 리소스에는 Catalog 차원이 없으므로 데이터베이스, 테이블, 컬럼 이름이 같으면 동일한 정책이 매칭됩니다. 두 Metastore가 의도적으로 리소스 이름과 권한 부여 범위를 공유하는 경우에만 서비스를 재사용하세요.

### 서로 다른 Ranger Hive 서비스 인스턴스 {#different-ranger-hive-service-instances}

표준 `hive` 접두사는 하나의 `ranger-hive-security.xml`에 대응하므로 동일한 FE에 있는 모든 Ranger-Hive Catalog는 동일한 `ranger.plugin.hive.service.name`을 읽습니다. 현재 Catalog 인터페이스에서는 Catalog별로 서로 다른 Ranger Hive 서비스 이름을 선택할 수 없습니다. `hive_prod_a`와 같은 WebUI 서비스 이름을 Catalog의 `ranger.service.name`에 지정하지 마세요. 그렇게 하면 Ranger는 `ranger-hive_prod_a-security.xml`과 `ranger.plugin.hive_prod_a.*`를 찾게 되며, 이는 여기서 설명하는 표준 Hive 구성의 범위 밖입니다. 독립적인 Ranger Hive 서비스를 격리하려면 별도의 Doris 클러스터를 사용하거나 Catalog가 하나의 Ranger Hive 정책 서비스를 공유하도록 하세요.

### 런타임 제약 사항 및 권장 사항 {#runtime-constraints-and-best-practices}

- Ranger-Hive는 Hive/HMS Catalog에만 사용하세요. 모든 외부 Catalog에 사용할 수 있는 범용 Ranger 컨트롤러가 아닙니다.
- Ranger-Hive와 Ranger-Doris 정책은 동기화되지 않습니다. 구성 파일과 정책 캐시 디렉터리를 분리하세요.
- Ranger 감사 공급자는 FE 프로세스 내에서 전역으로 공유됩니다. 처음 초기화된 Ranger 플러그인이 감사 활성화 여부와 대상을 결정합니다. Ranger-Doris와 Ranger-Hive를 함께 활성화할 때는 두 감사 XML 파일의 활성화 설정과 중앙 감사 대상을 동일하게 유지하여 초기화 순서에 따라 결과가 달라지지 않도록 하세요.
- Hadoop UGI 로그인 상태는 FE JVM 내에서 전역으로 적용됩니다. Ranger-Doris와 Ranger-Hive를 함께 사용하거나 Kerberos가 활성화된 여러 Ranger Catalog를 함께 사용하는 경우 동일한 Ranger 클라이언트 principal과 keytab을 사용하세요. 나중에 다른 ID로 로그인하면 프로세스의 로그인이 바뀌어 정책 다운로드가 불안정해질 수 있습니다.
- Ranger-Hive는 Ranger의 HDFS, S3 또는 오브젝트 스토리지 정책을 확인하지 않습니다. 스토리지 액세스에는 계속해서 Doris Catalog에 구성된 자격 증명을 사용합니다.
- Ranger Hive 리소스에는 Doris Catalog 차원이 없습니다. 여러 Metastore에 걸쳐 이름이 같은 데이터베이스와 테이블의 충돌 가능성을 검토하세요.
- Doris와 Ranger는 사용자나 역할을 동기화하지 않습니다. 일관된 명명 규칙을 정하고 일반 계정으로 허용된 요청과 거부된 요청을 모두 테스트하세요.
- 최초 정책 다운로드에 실패하면 플러그인은 로컬 캐시를 사용할 수 있습니다. 오래된 정책이 사용되는 상황을 놓치지 않도록 캐시의 최신 상태와 Ranger 감사를 모니터링하세요.
- Access Controller를 초기화하는 각 FE는 정책을 독립적으로 다운로드하고 캐시합니다. 모든 FE에서 구성 파일, keytab, truststore, 디렉터리 권한을 일관되게 유지하세요.
- 정책 변경은 즉시 반영되지 않습니다. 최대 지연 시간은 일반적으로 `policy.pollIntervalMs`에 Ranger Admin 및 네트워크 지연 시간을 더한 값에 가깝습니다.

<!-- Knowledge Type: FAQ / Troubleshooting -->
<!-- Use Case: Configuration Loading Failure / Policy Download Failure / Authorization Failure -->

## 문제 해결 {#troubleshooting}

증상 표에서 먼저 확인할 항목을 찾은 다음, 해당 섹션에서 원인과 전체 절차를 확인하세요.

| 증상 | 먼저 확인할 항목 |
| --- | --- |
| Catalog 생성 시 Access Controller를 찾을 수 없음 | `access_controller.class`가 전체 팩터리 클래스 이름 또는 `ranger-hive`인지 확인 |
| 로그에서 `ranger-hive-security.xml`을 찾을 수 없다고 표시됨 | Catalog 접두사가 `hive`로 고정되어 있고 모든 FE의 `fe/conf/` 아래에 파일이 있는지 확인 |
| 감사를 비활성화하면 보안 XML이 적용되지 않음 | `ranger-hive-audit.xml`을 배포하고 감사를 명시적으로 비활성화 |
| Ranger Admin에 연결할 수 있지만 정책이 로드되지 않음 | 서비스 이름, REST URL, 네트워크 액세스, 캐시 디렉터리, 정책 상태 확인 |
| Kerberos 활성화 후 정책 다운로드 실패 | UGI 보안 모드, HTTP SPN, 다운로드 권한, HTTP 상태, 정책 캐시 확인 |
| Ranger에서 사용자를 허용하지만 Catalog가 보이지 않음 | 기본 Access Controller의 Catalog 수준 권한 확인 |
| Ranger 거부 정책이 적용되지 않음 | 전역 권한을 확인하고 `root` 또는 `admin`으로 테스트하지 말 것 |
| HiveServer2에서는 정책이 동작하지만 Doris에서는 동작하지 않음 | 서비스 이름, 사용자 및 역할 이름, 표현식 호환성 확인 |
| 사용자가 HDFS 또는 S3를 직접 읽을 수 있음 | Ranger-Hive는 기반 스토리지의 액세스 제어를 적용하지 않음 |

### Catalog 생성 시 Access Controller를 찾을 수 없다는 오류 {#catalog-creation-reports-that-the-access-controller-cannot-be-found}

현재 팩터리 클래스 이름을 사용하세요.

```sql
'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory'
```

Current 및 4.x에서는 짧은 식별자도 지원합니다.

```sql
'access_controller.class' = 'ranger-hive'
```

`hive`, `hive_prod` 또는 이전 클래스 이름인 `org.apache.doris.catalog.authorizer.RangerHiveAccessControllerFactory`를 사용하지 마세요. 모든 FE가 동일한 Doris 버전을 실행하는지 확인하고 FE 로그에서 `Access Controller Plugin Factory`를 검색하세요.

### 로그에 ranger-hive-security.xml을 찾을 수 없다고 표시됨 {#the-log-says-ranger-hive-securityxml-cannot-be-found}

다음 두 설정은 혼동하기 쉽습니다.

- Catalog의 `'access_controller.properties.ranger.service.name' = 'hive'`는 Ranger Hive 플러그인을 선택하며 반드시 `hive`로 유지해야 합니다. Doris는 이 설정으로 `ranger-hive-security.xml`을 찾아 `ranger.plugin.hive.*` 설정을 읽습니다.
- `ranger.plugin.hive.service.name`은 `ranger-hive-security.xml` 내부의 속성으로, `hive_prod`와 같은 실제 Ranger WebUI의 Hive 서비스 이름을 지정합니다.

Catalog에 `hive_prod`를 잘못 입력하면 Ranger는 `ranger-hive_prod-security.xml`을 찾습니다. 모든 FE의 `fe/conf/` 아래에 `ranger-hive-security.xml`이 있는지 확인하고, 수정 후 모든 FE를 재시작하세요.

### 감사를 비활성화해도 ranger-hive-audit.xml이 필요한 이유 {#why-ranger-hive-auditxml-is-required-when-audit-is-disabled}

Ranger 2.7이 `ranger-hive-audit.xml`을 찾지 못하면 레거시 대체 경로로 진입하여 `hive-site.xml`, `hbase-site.xml` 또는 `hdfs-site.xml`을 찾은 다음, 동일한 디렉터리에서 `xasecure-audit.xml`을 로드하려고 시도합니다. 해당 파일이 없으면 이후의 `ranger-hive-security.xml`도 적용되지 않을 수 있습니다. 항상 `ranger-hive-security.xml`과 `ranger-hive-audit.xml`을 함께 배포하세요. 감사가 필요하지 않으면 `xasecure.audit.is.enabled=false`로 설정하세요. `core-site.xml`은 이 레거시 감사 파일 검색 목록에 포함되지 않으며, 직접적인 트리거도 아닙니다.

### Ranger Admin에 연결할 수 있지만 정책이 다운로드되지 않음 {#ranger-admin-is-reachable-but-no-policy-is-downloaded}

다음 순서대로 확인하세요.

1. `ranger.plugin.hive.service.name`이 WebUI 서비스 이름 `hive_prod`와 정확히 일치하는지 확인합니다.
2. `ranger.plugin.hive.policy.rest.url`이 Ranger Admin 루트 URL인지 확인합니다.
3. FE에서 Ranger Admin에 대한 네트워크, DNS, HTTPS truststore 액세스가 정상적으로 동작하는지 확인합니다.
4. 캐시 디렉터리가 존재하고 FE 프로세스 사용자가 쓸 수 있는지 확인합니다.
5. Ranger 서비스가 활성화되어 있고 정책이 저장되어 있는지 확인합니다.

Ranger Admin에서 Kerberos를 사용한다면 다음 문제 해결 항목으로 진행하세요.

### Ranger Admin에서 Kerberos 활성화 후 정책 다운로드 실패 {#policy-download-fails-after-ranger-admin-enables-kerberos}

다운로드 경로를 다음 순서대로 확인하세요.

1. **Kerberos 모드를 확인합니다.** FE 로그에 `secureMode=true`와 `(auth:KERBEROS)`가 포함되어야 합니다. `secureMode=false` 또는 `(auth:SIMPLE)`이 표시되면 `hadoop.security.authentication=kerberos`가 `core-site.xml`에 설정되어 있는지 확인하고, 파일을 `fe/conf/` 또는 `HADOOP_CONF_DIR`을 통해 classpath에 포함되는 디렉터리에 배치한 뒤 모든 FE를 재시작하세요. 기본 `hadoop_config_dir`인 `plugins/hadoop_conf/` 아래 디렉터리에만 의존하지 마세요. 이 디렉터리는 주로 Catalog/Hadoop 연결에 사용되며, Ranger 플러그인이 전역 UGI를 초기화할 때 참조할 수 있다고 보장되지 않습니다. 4.x에서는 4.0.2 이상을 사용하고 `ranger.plugin.hive.forceNonKerberos=true`가 실수로 설정되지 않았는지 확인하세요.
2. **HTTP 서비스 티켓을 확인합니다.** FE 프로세스 사용자로 본문의 Kerberos 절차에 있는 `kinit` 및 `kvno HTTP/ranger-admin.example.com@EXAMPLE.COM` 확인을 수행하세요. `Server not found in Kerberos database`, `No service creds` 또는 잘못된 `krbtgt/<REALM>`에 대한 요청이 발생하면 URL 호스트 이름, Ranger Admin HTTP SPN, DNS, `/etc/krb5.conf` 매핑을 비교하세요. URL과 SPN은 정확히 동일한 호스트 이름을 사용해야 합니다.
3. **다운로드 권한을 확인합니다.** SPNEGO 인증 후 Ranger Admin 로그에서 실제 로그인 ID를 찾으세요. 여기서 사용하는 일반 FE 계정의 경우 해당 ID를 `hive_prod` 서비스의 `policy.download.auth.users`에 넣으세요. Apache Ranger 2.7은 Ranger 관리자와 `policy.grantrevoke.auth.users`의 계정에도 다운로드를 허용하지만, FE 다운로드만을 위해 더 넓은 권한 부여/회수 권한을 부여하지 마세요. WebUI에 `policy.download.auth.users`가 표시되지 않으면 배포판의 Ranger 플러그인 설치 구성 또는 Ranger Service REST API를 통해 확인하거나 업데이트하세요. REST로 업데이트할 때는 기존 서비스 구성을 모두 보존하세요.
4. **보안 엔드포인트 상태를 확인합니다.** Kerberos 단계 6의 `curl --negotiate` 명령을 다시 실행하고 응답 본문을 보관하세요. 기본 Apache Ranger 2.7에서 HTTP 401은 SPNEGO 인증 실패를 의미합니다. 403은 로그인 ID가 인증되었지만 관리자도 아니고 두 승인 사용자 목록 어디에도 없다는 의미입니다. 404는 보통 XML의 서비스 이름이 Ranger WebUI와 일치하지 않는다는 의미입니다. 완전한 정책 JSON과 함께 200이 반환된 경우에만 성공으로 판단할 수 있습니다. 공급업체 배포판에서는 상태 처리 방식이 다를 수 있으므로 Ranger Admin 로그도 확인하세요. `kinit` 성공은 클라이언트 TGT를 얻었다는 사실만 확인해 줍니다.
5. **정책 캐시를 확인합니다.** 다운로드가 성공하면 `hive_hive_prod.json`과 `hive_hive_prod_roles.json`이 모두 생성됩니다. 작은 역할 파일만 있다면 기본 정책은 여전히 로드되지 않은 것입니다. `getServicePoliciesIfUpdated` 응답과 FE 로그의 `policy engine initialization failed` 같은 메시지 또는 캐시 쓰기 오류를 확인하세요.

### Ranger에서 사용자를 허용하지만 SHOW CATALOGS에 Catalog가 표시되지 않음 {#ranger-allows-the-user-but-show-catalogs-does-not-show-the-catalog}

Catalog 수준 확인은 기본 Access Controller가 담당합니다. Doris 내장 권한 부여를 사용하는 경우 Catalog에 대한 권한을 부여하세요.

```sql
GRANT SELECT_PRIV ON hive_ctl.*.* TO 'alice';
```

Current에서는 `skip_catalog_priv_check=true`를 사용하는 것도 검토할 수 있습니다. 이 설정은 사용자 지정 Access Controller가 있는 외부 Catalog의 `SHOW` 및 `SELECT` Catalog 수준 확인에만 영향을 줍니다.

### Ranger 거부 정책이 적용되지 않음 {#a-ranger-deny-policy-does-not-take-effect}

사용자에게 Doris 전역 권한이 있는지 확인하세요. 기본 Access Controller에서 부여한 해당 전역 권한이 있으면 Ranger-Hive가 데이터베이스, 테이블 또는 컬럼을 허용하지 않았더라도 최종 확인을 통과할 수 있습니다. `ADMIN_PRIV`와 전역 `SELECT_PRIV`가 모두 없는 일반 사용자로 테스트하세요.

### HiveServer2에서는 정책이 동작하지만 Doris에서는 동작하지 않음 {#a-policy-works-in-hiveserver2-but-not-in-doris}

Doris와 HiveServer2가 동일한 Ranger Hive 서비스 이름을 읽는지, 정책 표현식이 Doris에서 지원하는 SQL 구문을 사용하는지 확인하세요. 또한 Doris 요청의 사용자 이름과 역할 이름이 Ranger 정책에서 참조하는 이름과 정확히 일치하는지 확인하세요.

### Ranger-Hive가 HDFS 또는 S3에 대한 직접 액세스를 차단하나요? {#does-ranger-hive-prevent-direct-hdfs-or-s3-access}

아니요. Ranger-Hive는 Doris SQL 계층에서 Hive 데이터베이스, 테이블, 컬럼 요청에 대한 권한만 확인합니다. HDFS, S3 및 기타 스토리지 액세스에는 Catalog의 스토리지 인증 설정이 사용되며, 별도의 스토리지 측 액세스 제어와 자격 증명 격리가 필요합니다.

<!-- Knowledge Type: Production Checklist -->
<!-- Use Case: Production Deployment Acceptance -->

## 운영 환경 체크리스트 {#production-checklist}

- Ranger WebUI의 서비스 유형이 Hive이고 서비스 이름이 XML 값과 정확히 일치합니다.
- 모든 FE에 구문 분석 가능한 `ranger-hive-security.xml`과 `ranger-hive-audit.xml`이 있으며, 감사가 필요하지 않은 경우 감사 XML에서 감사를 명시적으로 비활성화했습니다.
- Ranger-Doris와 Ranger-Hive가 별도의 정책 캐시 디렉터리를 사용하며 FE 프로세스 사용자가 해당 디렉터리에 쓸 수 있습니다.
- Catalog의 `access_controller.class`가 전체 Ranger-Hive 팩터리 클래스 이름 또는 지원되는 `ranger-hive` 식별자를 사용하고, 구성 접두사 값이 `hive`입니다.
- 일반 Doris 사용자의 이름이 Ranger 사용자 이름과 일치합니다. Ranger 정책에서 Doris 역할을 사용하는 경우 참조하는 역할 이름이 일치합니다.
- 액세스 허용, 액세스 거부, 컬럼 권한, 행 필터링, 데이터 마스킹을 각각 테스트했습니다.
- Catalog 수준 권한은 기본 Access Controller가 부여하며, 테스트 사용자에게 의도한 Ranger-Hive 확인을 우회하는 전역 권한이 없습니다.
- Ranger Admin에서 Kerberos 또는 HTTPS를 사용하는 경우 모든 FE의 keytab, truststore, `krb5.conf`, 절대 경로가 일관되게 구성되어 있습니다.
- 의도하지 않은 정책 적용 범위 확장을 방지하기 위해 여러 Catalog에서 이름이 같은 데이터베이스와 테이블을 검토했습니다.
- 감사를 활성화한 경우 구성된 대상에 Doris의 허용 및 거부 레코드가 기록됩니다. Ranger WebUI에서 감사를 조회하려면 Solr과 같은 해당 중앙 백엔드도 필요합니다.
