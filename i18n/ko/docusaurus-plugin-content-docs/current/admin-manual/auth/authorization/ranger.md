---
{
    "title": "Ranger-Doris 권한 부여",
    "language": "ko",
    "description": "Apache Doris 권한 관리를 Apache Ranger로 이전하는 방법: 플러그인 설치, Catalog/데이터베이스/테이블/열/행 수준 및 마스킹 정책, Kerberos 통합, 일반적인 문제를 다룹니다.",
    "keywords": [
        "Apache Doris Ranger",
        "Doris Ranger authorization",
        "Ranger plugin installation",
        "ranger-doris-plugin",
        "ranger-doris-security.xml",
        "Doris permission management",
        "Doris column permissions",
        "Row Level Filter",
        "data masking",
        "Ranger Kerberos",
        "access_controller_type",
        "ranger-doris"
    ]
}
---

<!-- Knowledge type: configuration guide / permission management -->
<!-- Applicable scenario: use Apache Ranger to manage Apache Doris database, table, column, row-level, and masking permissions in one place -->

Apache Ranger는 Hadoop 플랫폼에서 모니터링, 서비스 활성화, 데이터 보안 접근 관리를 위한 보안 프레임워크입니다. Apache Doris에서 Ranger를 활성화하면 Doris 내부의 `GRANT` 문 대신 Ranger의 중앙 집중식 설정으로 권한을 관리하게 되어, Hive, HDFS 및 기타 구성 요소와 동일한 권한 체계를 편리하게 공유할 수 있습니다.

이 문서에서는 Doris용 Ranger 플러그인을 설치하고 설정하는 방법과 Ranger에서 전역, Catalog, 데이터베이스, 테이블, 열, 행 수준 및 마스킹 정책을 정의하는 방법을 설명합니다.

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 설명 |
| --- | --- |
| 통합 권한 제어 | 이미 Ranger로 Hive/HDFS를 관리하고 있으며, Doris에서도 동일한 권한 정책을 사용하려는 경우 |
| 세분화된 권한 부여 | 열, 행 수준 데이터 및 민감한 필드에 대해 세분화된 권한 부여와 마스킹이 필요한 경우 |
| Kerberos 환경 | Ranger Admin에 Kerberos가 활성화되어 있어 Doris가 Kerberos ID로 정책을 가져와야 하는 경우 |
| 내부 권한 부여 대체 | Doris 내부의 `GRANT/REVOKE` 사용을 중단하고 Ranger에서 권한 부여를 중앙 관리하려는 경우 |

## 사전 요구 사항 {#prerequisites}

- Apache Ranger Admin 서비스가 배포되어 있고(2.x 이상 버전 권장), HTTP/HTTPS로 접근할 수 있어야 합니다.
- Apache Doris 클러스터가 배포되어 있고, FE/BE 노드에서 Ranger Admin 서비스에 접근할 수 있어야 합니다.
- 서비스 정의와 정책을 생성할 수 있는 Ranger WebUI 관리자 계정이 있어야 합니다.
- 행 수준 필터링과 데이터 마스킹은 Doris **2.1.3** 이상이 필요하며, Compute Group 및 Storage Vault 권한은 Doris **3.0.6** 이상이 필요합니다.

## 설정 절차 개요 {#configuration-flow-overview}

1. Ranger 서버에 Doris 플러그인을 설치합니다(Jar 및 서비스 정의 JSON 업로드).
2. Ranger WebUI에서 Doris 서비스를 생성하고 연결 정보를 입력합니다.
3. Doris FE 측에 `access_controller_type=ranger-doris`를 설정하고 `ranger-doris-security.xml`을 배치합니다.
4. (선택 사항) Ranger Admin에 Kerberos가 활성화되어 있으면 `krb5.conf`를 병합하고 설정에 UGI 매개변수를 추가합니다.
5. Doris 클러스터를 재시작하고, Ranger에서 사용자 정책을 설정한 뒤 Doris에서 검증합니다.

## Doris Ranger 플러그인 설치 및 설정 {#install-and-configure-the-doris-ranger-plugin}

### 플러그인 설치 {#install-the-plugin}

1. 다음 파일을 다운로드합니다.

    - [ranger-doris-plugin-3.0.0-SNAPSHOT.jar](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/release/ranger/dev/ranger-doris-plugin-3.0.0-SNAPSHOT.jar)
    - [mysql-connector-java-8.0.25.jar](https://selectdb-doris-1308700295.cos.ap-beijing.myqcloud.com/release/jdbc_driver/mysql-connector-java-8.0.25.jar)

    :::caution 참고
    해당 브랜치에 맞는 `ranger-doris-plugin-3.0.0-SNAPSHOT.jar`를 다운로드해야 합니다. 그렇지 않으면 작동하지 않습니다.
    :::

2. 다운로드한 파일을 Ranger 서비스의 `ranger-plugins/doris` 디렉터리에 배치합니다. 예를 들면 다음과 같습니다.

    ```text
    /usr/local/service/ranger/ews/webapp/WEB-INF/classes/ranger-plugins/doris/ranger-doris-plugin-3.0.0-SNAPSHOT.jar
    /usr/local/service/ranger/ews/webapp/WEB-INF/classes/ranger-plugins/doris/mysql-connector-java-8.0.25.jar
    ```

3. Ranger 서비스를 재시작합니다.

4. [ranger-servicedef-doris.json](https://github.com/morningman/ranger/blob/doris-plugin/agents-common/src/main/resources/service-defs/ranger-servicedef-doris.json)을 다운로드합니다.

    :::caution 참고
    해당 브랜치에 맞는 `ranger-servicedef-doris.json`을 다운로드해야 합니다. 그렇지 않으면 작동하지 않습니다.
    :::

5. 다음 명령을 실행하여 서비스 정의 파일을 Ranger 서비스에 업로드하고 Apache Doris 플러그인 정의를 등록합니다.

    ```shell
    curl -u user:password -X POST \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        http://172.21.0.32:6080/service/plugins/definitions \
        -d@ranger-servicedef-doris.json
    ```

    각 항목은 다음과 같습니다.

    - 사용자 이름과 비밀번호는 Ranger WebUI에 로그인할 때 사용하는 자격 증명입니다.
    - 서비스 주소와 포트는 `ranger.service.http.port` 항목에서 확인할 수 있으며, 이 항목은 `ranger-admin-site.xml` 설정 파일에 있습니다.

    명령이 성공하면 서비스 정의가 JSON 형식으로 반환됩니다. 예를 들면 다음과 같습니다.

    ```json
    {
      "id": 207,
      "guid": "d3ff9e41-f9dd-4217-bb5f-3fa9996454b6",
      "isEnabled": true,
      "createdBy": "Admin",
      "updatedBy": "Admin",
      "createTime": 1705817398112,
      "updateTime": 1705817398112,
      "version": 1,
      "name": "doris",
      "displayName": "Apache Doris",
      "implClass": "org.apache.ranger.services.doris.RangerServiceDoris",
      "label": "Doris",
      "description": "Apache Doris",
      "options": {
        "enableDenyAndExceptionsInPolicies": "true"
      },
      ...
    }
    ```

    정의를 다시 생성하려면 다음 명령으로 삭제한 뒤 다시 업로드합니다(여기서 `207`은 정의를 생성할 때 반환된 `id`입니다).

    ```shell
    curl -v -u user:password -X DELETE \
        http://172.21.0.32:6080/service/plugins/definitions/207
    ```

    삭제하기 전에 Ranger WebUI에서 이미 생성한 Doris 서비스를 제거해야 합니다. 다음 명령으로 현재 등록된 서비스 정의를 나열하여 `id`를 확인할 수도 있습니다.

    ```shell
    curl -v -u user:password -X GET \
        http://172.21.0.32:6080/service/plugins/definitions/
    ```

### 플러그인 설정 {#configure-the-plugin}

설치 후 Ranger WebUI를 엽니다. 서비스 관리자 페이지에 Apache Doris 플러그인이 표시됩니다.

![Ranger](/images/ranger/ranger1.png)

플러그인 옆의 `+` 버튼을 클릭하여 Doris 서비스를 추가합니다.

![Ranger 서비스 추가](/images/ranger/ranger2.png)

설정 속성 영역의 매개변수는 다음과 같습니다.

| 매개변수 | 설명 |
| --- | --- |
| `Service Name` | 서비스 이름입니다. Doris는 이 이름을 기준으로 정책을 가져오므로, `ranger.plugin.doris.service.name`의 값과 일치해야 합니다. 이 항목은 `ranger-doris-security.xml`에 있습니다. `doris`를 권장합니다. 이름이 일치하지 않으면 Doris가 정책을 가져오지 못해 인증이 실패합니다 |
| `Username` / `Password` | Doris 클러스터의 사용자 이름과 비밀번호입니다. Admin 사용자를 권장합니다 |
| `jdbc.driver_class` | Doris에 연결할 때 사용하는 JDBC 드라이버입니다. 예: `com.mysql.cj.jdbc.Driver` |
| `jdbc.url` | Doris 클러스터의 JDBC URL입니다. 예: `jdbc:mysql://172.21.0.101:9030?useSSL=false` |
| `resource.lookup.timeout.value.in.ms` | 메타데이터를 가져올 때의 제한 시간을 지정하는 추가 매개변수입니다. `10000`(즉, 10초)을 권장합니다 |

`Test Connection`을 클릭하여 연결 상태를 확인할 수 있습니다.

:::info 참고
Doris가 이미 시작되어 있고 `fe.conf`에 `access_controller_type=ranger-doris`가 설정되어 있으면, `Test Connection`을 클릭할 때 `fail`이 반환됩니다. Ranger 인증 서비스가 아직 생성되지 않아 Doris가 정책을 가져올 수 없기 때문입니다. 이는 정상적인 현상이므로 서비스 생성을 계속 진행하면 됩니다.
:::

그런 다음 `Add`를 클릭하여 서비스를 추가합니다. 새로 생성된 서비스는 서비스 관리자 페이지의 Apache Doris 플러그인 아래에 표시됩니다. 서비스를 클릭하여 Ranger 정책 설정을 시작합니다.

## Doris 측에서 Ranger 활성화 {#enable-ranger-on-the-doris-side}

### Doris 설정 변경 {#change-the-doris-configuration}

1. `fe/conf/fe.conf` 파일에서 인증 방식을 Ranger로 설정합니다.

    ```text
    access_controller_type=ranger-doris
    ```

2. 다음 내용을 담은 `ranger-doris-security.xml` 파일을 모든 FE 노드의 `conf` 디렉터리에 생성합니다.

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
    <configuration>
        <property>
            <name>ranger.plugin.doris.policy.cache.dir</name>
            <value>/path/to/ranger/cache/</value>
        </property>
        <property>
            <name>ranger.plugin.doris.policy.pollIntervalMs</name>
            <value>30000</value>
        </property>
        <property>
            <name>ranger.plugin.doris.policy.rest.client.connection.timeoutMs</name>
            <value>60000</value>
        </property>
        <property>
            <name>ranger.plugin.doris.policy.rest.client.read.timeoutMs</name>
            <value>60000</value>
        </property>
        <property>
            <name>ranger.plugin.doris.policy.rest.url</name>
            <value>http://172.21.0.32:6080</value>
        </property>
        <property>
            <name>ranger.plugin.doris.policy.source.impl</name>
            <value>org.apache.ranger.admin.client.RangerAdminRESTClient</value>
        </property>
        <property>
            <name>ranger.plugin.doris.service.name</name>
            <value>doris</value>
        </property>
    </configuration>
    ```

    수정해야 할 주요 설정 항목은 다음과 같습니다.

    | 설정 항목 | 설명 |
    | --- | --- |
    | `ranger.plugin.doris.policy.cache.dir` | Ranger Server에서 가져온 권한 캐시 파일을 저장합니다. **이 디렉터리는 수동으로 생성해야 하며**, 반드시 존재해야 합니다 |
    | `ranger.plugin.doris.policy.rest.url` | Ranger Admin 서비스의 주소입니다. 실제 주소로 바꿉니다 |
    | `ranger.plugin.doris.service.name` | Ranger WebUI에서 생성한 서비스 이름과 일치해야 합니다. 기본값은 `doris`입니다 |
    | `ranger.plugin.doris.policy.pollIntervalMs` | 정책을 가져오는 폴링 간격이며, 단위는 밀리초입니다 |

3. 클러스터를 시작합니다.

### Ranger Server에 Kerberos가 활성화된 경우의 설정 {#configuration-when-ranger-server-has-kerberos-enabled}

<!-- Knowledge type: configuration parameters -->
<!-- Applicable scenario: Ranger Admin has Kerberos enabled / cross-realm authentication -->

Ranger Admin 서비스 자체에 Kerberos 인증이 활성화되어 있으면, Doris의 Ranger Client는 정책을 가져올 때 Kerberos ID를 사용하여 Ranger Admin에 인증해야 합니다. 그렇지 않으면 정책을 가져오지 못하고 인증이 적용되지 않습니다. 아래의 두 가지 추가 설정을 완료해야 합니다.

#### 1. krb5.conf 병합 {#1-merge-krb5conf}

Doris Ranger Client는 Kerberos 로그인 시 내부적으로 JVM의 `Krb5LoginModule`을 사용하며, **각 FE/BE 노드의 `/etc/krb5.conf`**에서 KDC 주소를 읽습니다. 환경에 여러 Kerberos realm이 함께 존재하는 경우(예: HDFS 클러스터의 realm과 Ranger Admin이 실행되는 클러스터의 realm이 다른 경우), 모든 realm의 KDC 정보를 하나의 `/etc/krb5.conf` 파일로 **병합**하고 이 파일을 모든 FE 및 BE 노드에 배포해야 합니다.

병합된 `krb5.conf`의 예시는 다음과 같습니다.

```ini
[libdefaults]
    default_realm = HADOOP.EXAMPLE.COM
    dns_lookup_realm = true
    dns_lookup_kdc = true

[realms]
    # Realm of the HDFS / Hive cluster
    HADOOP.EXAMPLE.COM = {
        kdc = hadoop-kdc.example.com:88
        admin_server = hadoop-kdc.example.com
    }
    # Realm of the cluster where Ranger Admin runs (merge it in if it differs from the one above)
    RANGER.EXAMPLE.COM = {
        kdc = ranger-kdc.example.com:88
        admin_server = ranger-kdc.example.com
    }

[domain_realm]
    hadoop-kdc.example.com = HADOOP.EXAMPLE.COM
    ranger-admin.example.com = RANGER.EXAMPLE.COM
```

:::caution 참고
`/etc/krb5.conf`를 수정하거나 추가한 후에는 설정을 적용하기 위해 모든 FE 및 BE 노드를 재시작해야 합니다.
:::

#### 2. ranger-hive-security.xml(또는 ranger-doris-security.xml)에서 Kerberos UGI 설정 {#2-configure-kerberos-ugi-in-ranger-hive-securityxml-or-ranger-doris-securityxml}

각 FE 노드의 `fe/conf/` 디렉터리에서 `ranger-hive-security.xml`(Hive Ranger 인증을 사용하는 경우) 또는 `ranger-doris-security.xml`(Doris Ranger 인증을 사용하는 경우)을 찾거나 생성하고, `<configuration>` 내부에 다음 4개 설정 항목을 추가합니다.

```xml
<!-- Enable UGI Kerberos login -->
<property>
    <name>ranger.plugin.hive.ugi.initialize</name>
    <value>true</value>
</property>
<!-- Login method: keytab -->
<property>
    <name>ranger.plugin.hive.ugi.login.type</name>
    <value>keytab</value>
</property>
<!-- Principal in the keytab file -->
<property>
    <name>ranger.plugin.hive.ugi.keytab.principal</name>
    <value>hive/hostname@RANGER.EXAMPLE.COM</value>
</property>
<!-- Path to the keytab file (must be deployed to every FE node) -->
<property>
    <name>ranger.plugin.hive.ugi.keytab.file</name>
    <value>/etc/security/keytabs/hive.keytab</value>
</property>
```

각 설정 항목의 의미는 다음과 같습니다.

| 설정 항목 | 설명 |
| --- | --- |
| `ranger.plugin.hive.ugi.initialize` | 플러그인을 로드할 때 UGI Kerberos 로그인을 초기화할지 여부입니다 |
| `ranger.plugin.hive.ugi.login.type` | 로그인 방식입니다. `keytab`으로 고정합니다 |
| `ranger.plugin.hive.ugi.keytab.principal` | keytab 파일에 실제로 존재하는 principal입니다. 예: `hive/your-host@YOUR-REALM.COM`. `klist -kt /path/to/hive.keytab`으로 확인할 수 있습니다 |
| `ranger.plugin.hive.ugi.keytab.file` | keytab 파일의 절대 경로입니다. Doris FE 프로세스를 실행하는 사용자에게 이 파일의 읽기 권한이 있는지 확인합니다(`chmod 400` 권장) |

:::tip 참고
- **Doris Ranger 인증**(`ranger-doris-security.xml`)을 사용하는 경우, 위 설정의 `hive`를 `doris`로 바꿉니다. 예: `ranger.plugin.doris.ugi.initialize`.
- 설정을 완료한 후에는 **FE를 재시작**해야 적용됩니다.
:::

:::warning 알려진 제약 사항: 여러 Catalog에서 전역 UGI를 덮어쓰는 문제
Doris에 내장된 Ranger Plugin은 현재 Kerberos 로그인에 Hadoop의 `UserGroupInformation`(UGI)을 사용합니다. JVM 프로세스는 일반적으로 하나의 전역 로그인 사용자 상태를 공유하므로, Doris에서 **Kerberos가 활성화된 여러 Ranger Catalog**에 서로 다른 principal을 설정하면 UGI가 서로 덮어써집니다.

**구체적인 동작**:

1. Catalog A가 초기화되고 `keytab_A`로 로그인하면 전역 UGI는 `Principal_A`가 됩니다.
2. 이후 Catalog B가 초기화되고 `keytab_B`로 로그인하면 전역 UGI가 `Principal_B`로 덮어써집니다.
3. 그 뒤 Catalog A의 Ranger 플러그인 백그라운드 스레드가 Ranger Admin에서 권한 정책을 가져올 때, 잘못된 `Principal_B`의 티켓을 사용하여 인증 실패와 정책 가져오기 오류가 발생합니다.

**현재 권장 사항**: 동일한 Doris 클러스터에서 Ranger가 활성화된 모든 Kerberos 데이터 소스는 **통합적으로 계획하고 동일한 Kerberos principal과 동일한 keytab 파일을 사용**하여, 서로 덮어쓰면서 발생하는 인증 실패를 방지하세요.
:::

## 권한 설정 예제 {#permission-examples}

<!-- Knowledge type: procedural steps -->
<!-- Applicable scenario: configure permissions at various levels for Doris users in Ranger -->

다음 단계에 따라 Doris 사용자에게 권한을 부여합니다.

1. Doris에서 `user1`을 생성합니다.
2. Doris에서 먼저 `admin` 사용자를 사용하여 Catalog `hive`를 생성합니다.
3. Ranger에서 `user1`을 생성합니다. 현재 Ranger는 Doris의 사용자를 자동으로 동기화할 수 없고, Doris도 Ranger의 사용자를 동기화할 수 없으므로 사용자를 수동으로 생성해야 합니다. **이름만 Doris와 동일하게 지정하면 됩니다**. Ranger에서 사용자를 생성하는 단계는 Ranger 공식 문서를 참조하세요. `Settings -> Users`에서 사용자를 생성합니다.

Ranger에서 Doris에 대해 설정할 수 있는 권한 범위는 다음 표와 같습니다.

| 권한 범위 | 동등한 Doris GRANT 문 | 선택 방법 |
| --- | --- | --- |
| 전역 권한 | `grant select_priv on *.*.* to user1` | Catalog와 같은 수준의 드롭다운에서 `global`을 선택합니다. 입력 상자에는 `*`만 입력할 수 있습니다 |
| Catalog 권한 | `grant select_priv on hive.*.* to user1` | Catalog 드롭다운에서 대상 Catalog를 선택합니다 |
| 데이터베이스 권한 | `grant select_priv on hive.tpch.* to user1` | Catalog와 데이터베이스를 지정합니다 |
| 테이블 권한 | `grant select_priv on hive.tpch.user to user1` | Catalog, 데이터베이스, 테이블을 지정합니다 |
| 열 권한 | `grant select_priv(name,age) on hive.tpch.user to user1` | 테이블 권한을 설정한 뒤 열을 선택합니다 |
| 리소스 권한 | `grant usage_priv on resource 'resource1' to user1` | Catalog와 같은 수준의 드롭다운에서 `resource`를 선택합니다 |
| Workload Group 권한 | `grant usage_priv on workload group 'group1' to user1` | Catalog와 같은 수준의 드롭다운에서 `workload group`을 선택합니다 |
| Compute Group 권한(3.0.6+) | `grant usage_priv on compute group 'group1' to user1` | Catalog와 같은 수준의 드롭다운에서 `compute group`을 선택합니다 |
| Storage Vault 권한(3.0.6+) | `grant usage_priv on storage vault 'vault1' to user1` | Catalog와 같은 수준의 드롭다운에서 `storage vault`를 선택합니다 |

각 권한 범위에 대한 Ranger 설정 예제는 다음과 같습니다.

### 전역 권한 {#global-permission}

Doris 내부 권한 부여 문인 `grant select_priv on *.*.* to user1`과 동등합니다.

- Catalog와 같은 수준의 드롭다운에서 `global` 옵션을 선택할 수 있습니다.
- 입력 상자에는 `*`만 입력할 수 있습니다.

![전역 권한](/images/ranger/global.png)

### Catalog 권한 {#catalog-permission}

Doris 내부 권한 부여 문인 `grant select_priv on hive.*.* to user1`과 동등합니다.

![Catalog 권한](/images/ranger/catalog.png)

### 데이터베이스 권한 {#database-permission}

Doris 내부 권한 부여 문인 `grant select_priv on hive.tpch.* to user1`과 동등합니다.

![데이터베이스 권한](/images/ranger/database.png)

### 테이블 권한 {#table-permission}

> 여기서 테이블은 테이블, 뷰, 비동기 구체화된 뷰를 통칭합니다.

Doris 내부 권한 부여 문인 `grant select_priv on hive.tpch.user to user1`과 동등합니다.

![테이블 권한](/images/ranger/table.png)

### 열 권한 {#column-permission}

Doris 내부 권한 부여 문인 `grant select_priv(name,age) on hive.tpch.user to user1`과 동등합니다.

![열 권한](/images/ranger/column.png)

### 리소스 권한 {#resource-permission}

Doris 내부 권한 부여 문인 `grant usage_priv on resource 'resource1' to user1`과 동등합니다.

- Catalog와 같은 수준의 드롭다운에서 `resource` 옵션을 선택할 수 있습니다.

![리소스 권한](/images/ranger/resource.png)

### Workload Group 권한 {#workload-group-permission}

Doris 내부 권한 부여 문인 `grant usage_priv on workload group 'group1' to user1`과 동등합니다.

- Catalog와 같은 수준의 드롭다운에서 `workload group` 옵션을 선택할 수 있습니다.

![Workload Group 권한](/images/ranger/group1.png)

### Compute Group 권한 {#compute-group-permission}

> 3.0.6 버전부터 지원됩니다.

Doris 내부 권한 부여 문인 `grant usage_priv on compute group 'group1' to user1`과 동등합니다.

- Catalog와 같은 수준의 드롭다운에서 `compute group` 옵션을 선택할 수 있습니다.

![Compute Group 권한](/images/ranger/compute-group.png)

### Storage Vault 권한 {#storage-vault-permission}

> 3.0.6 버전부터 지원됩니다.

Doris 내부 권한 부여 문인 `grant usage_priv on storage vault 'vault1' to user1`과 동등합니다.

- Catalog와 같은 수준의 드롭다운에서 `storage vault` 옵션을 선택할 수 있습니다.

![Storage Vault 권한](/images/ranger/storage-vault.png)

## 행 수준 권한 예제 {#row-permission-example}

> 2.1.3 버전부터 지원됩니다.

1. [권한 설정 예제](#permission-examples)에 따라 `user1`에게 `select` 권한을 부여합니다. 대상은 `internal.db1.user` 테이블입니다.
2. Ranger에서 Row Level Filter 정책을 추가합니다.

    ![행 정책 예제](/images/ranger/ranger-row-policy.jpeg)

3. `user1`로 Doris에 로그인합니다. `select * from internal.db1.user`를 실행하면 `id > 3`과 `age = 2`를 만족하는 행만 볼 수 있습니다.

## 데이터 마스킹 예제 {#data-masking-example}

> 2.1.3 버전부터 지원됩니다.

1. [권한 설정 예제](#permission-examples)에 따라 `user1`에게 `select` 권한을 부여합니다. 대상은 `internal.db1.user` 테이블입니다.
2. Ranger에서 Masking 정책을 추가합니다.

    ![데이터 마스킹 예제](/images/ranger/ranger-data-mask.png)

3. `user1`로 Doris에 로그인합니다. `select * from internal.db1.user`를 실행하면 `phone` 필드가 지정한 규칙에 따라 마스킹되어 표시됩니다.

## 일반적인 문제 {#common-issues}

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenario: Ranger authentication failures / policy pull exceptions / log inspection -->

### Q: Ranger 접근이 실패합니다. 로그는 어떻게 확인하나요? {#q-ranger-access-fails-how-can-i-view-the-logs}

`log4j.properties` 파일을 모든 FE의 `conf` 디렉터리에 생성하고 다음 내용을 작성합니다.

```text
log4j.rootLogger = warn,stdout,D

log4j.appender.stdout = org.apache.log4j.ConsoleAppender
log4j.appender.stdout.Target = System.out
log4j.appender.stdout.layout = org.apache.log4j.PatternLayout
log4j.appender.stdout.layout.ConversionPattern = [%-5p] %d{yyyy-MM-dd HH:mm:ss,SSS} method:%l%n%m%n

log4j.appender.D = org.apache.log4j.DailyRollingFileAppender
log4j.appender.D.File = /path/to/fe/log/ranger.log
log4j.appender.D.Append = true
log4j.appender.D.Threshold = INFO
log4j.appender.D.layout = org.apache.log4j.PatternLayout
log4j.appender.D.layout.ConversionPattern = %-d{yyyy-MM-dd HH:mm:ss}  [ %t:%r ] - [ %p ]  %m%n
```

각 항목은 다음과 같습니다.

- `log4j.appender.D.File`을 실제 경로로 변경합니다. 이 경로는 Ranger 플러그인 로그를 저장하는 데 사용됩니다.
- 필요에 따라 `log4j.rootLogger`의 로그 수준을 조정합니다(예: `debug` 또는 `info`). 단, `debug`는 디버깅 전용이며 프로덕션 환경에서 사용하면 안 됩니다. 로그 양이 매우 많아지고 인증 성능이 저하되기 때문입니다.

### Q: Row Level Filter 정책을 설정했는데 사용자가 쿼리할 때 권한 오류가 발생합니다. 이유가 무엇인가요? {#q-a-row-level-filter-policy-is-configured-but-the-user-gets-a-permission-error-when-querying-why}

Row Level Filter 정책은 사용자가 테이블에서 접근할 수 있는 행만 제한합니다. **사용자에게 ACCESS POLICY를 통한 권한도 부여해야 합니다**.

### Q: 서비스를 생성하면 기본적으로 `admin` 사용자에게만 권한이 있고 `root` 사용자에게는 권한이 없습니다. 어떻게 해결하나요? {#q-after-a-service-is-created-only-the-admin-user-has-permissions-by-default-and-the-root-user-does-not-how-do-i-fix-it}

그림과 같이 서비스 생성 시 `default.policy.users` 설정을 추가합니다. 여러 사용자에게 전체 권한을 부여하려면 사용자를 `,`로 구분합니다.

![기본 정책](/images/ranger/default-policy.png)

### Q: Ranger 인증을 활성화한 후에도 Doris 내부 권한 부여가 작동하나요? {#q-after-ranger-authentication-is-enabled-does-doris-internal-authorization-still-work}

아니요. 역할을 생성하거나 삭제할 수도 없습니다. 모든 권한은 Ranger에서 설정해야 합니다.
