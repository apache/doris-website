---
{
    "title": "사용자 정의 권한 부여 플러그인",
    "language": "ko",
    "description": "AccessControllerFactory 및 CatalogAccessController SPI를 구현하여 Apache Doris용 서드파티 권한 부여 플러그인을 작성하고, 서비스 파일 또는 외부 플러그인 jar를 통해 등록한 뒤 access_controller 설정으로 연동합니다.",
    "keywords": [
        "Apache Doris 사용자 정의 권한 부여",
        "Doris 접근 컨트롤러",
        "AccessControllerFactory",
        "CatalogAccessController",
        "서드파티 권한 부여 플러그인",
        "access_controller_type",
        "access_controller.class",
        "Doris 권한 부여 SPI",
        "외부 권한 부여 모듈"
    ]
}
---

<!-- Knowledge type: Extension guide / Architecture decision -->
<!-- Applicable scenario: integrate Apache Doris privilege checks with an external authorization system -->

Apache Doris는 [기본 제공 권한 부여](./internal) 모델과 [Apache Ranger](./ranger) 연동 외에도 자체 권한 부여 시스템을 연결할 수 있는 서비스 제공자 인터페이스(SPI)를 제공합니다. 사용자 정의 접근 컨트롤러를 등록하면 Doris는 기본 제공 `GRANT`/`REVOKE` 엔진 대신 사용자 코드로 권한 검사를 전달합니다. 이를 통해 OpenFGA, OPA 또는 사내 권한 관리 서비스와 같은 외부 정책 저장소를 Doris 권한 부여에 사용할 수 있습니다.

이 문서는 구현해야 할 두 인터페이스, Doris가 컨트롤러를 탐색하고 로드하는 방식, 컨트롤러를 선택하는 설정, 구현의 출발점으로 사용할 기본 골격을 설명합니다. Ranger 연동은 참조 구현이므로 이 문서와 함께 코드를 살펴보면 도움이 됩니다.

:::note
이 페이지는 Doris 4.x의 `AccessControllerFactory` / `CatalogAccessController` 인터페이스 규약을 설명합니다. 개발 버전은 새로운 권한 부여 SPI와 다른 패키징 방식을 사용하므로 해당 버전의 예제를 4.x에서 사용하지 마세요. 플러그인은 배포할 Doris의 정확한 릴리스 버전에 맞춰 컴파일하세요.
:::

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 설명 |
| --- | --- |
| 중앙 정책 저장소 | 권한 허용 여부를 외부 시스템(OpenFGA, OPA, 자체 개발 서비스)에서 이미 관리하고 있으며, 별도의 사본을 유지하는 대신 Doris가 해당 시스템에 확인하도록 하려는 경우 |
| 관계 기반 접근 | 기본 제공 RBAC 모델로 직접 표현할 수 없는 세분화된 규칙이나 관계 기반 규칙(Zanzibar / ReBAC 방식)이 필요한 경우 |
| 엔진 간 권한 부여 공유 | 여러 쿼리 엔진이 하나의 정책 소스를 공유하며 Doris도 동일한 결정을 따라야 하는 경우 |
| 사용자 정의 마스킹 또는 행 필터링 | 자체 정책 정의에 따라 열 마스킹이나 행 수준 필터를 적용하려는 경우 |

## 서비스 제공자 인터페이스 {#the-service-provider-interface}

사용자 정의 권한 부여 모듈은 `org.apache.doris.mysql.privilege` 패키지의 두 Java 인터페이스로 구성됩니다.

- `AccessControllerFactory`는 컨트롤러 인스턴스를 생성하고 고정된 식별자를 부여합니다.
- `CatalogAccessController`는 개별 권한 검사를 받습니다.

두 인터페이스를 모두 구현하고 팩토리를 등록한 다음, 설정에서 해당 식별자를 지정합니다.

### CatalogAccessController {#catalogaccesscontroller}

`CatalogAccessController`는 각 권한 허용 여부를 결정하는 곳입니다. Doris는 객체 수준별로 메서드를 호출합니다. `boolean` 반환값이 `true`이면 작업을 허용하고, `false`이면 거부합니다.

```java
public interface CatalogAccessController {
    // Global
    boolean checkGlobalPriv(UserIdentity currentUser, PrivPredicate wanted);

    // Catalog
    boolean checkCtlPriv(UserIdentity currentUser, String ctl, PrivPredicate wanted);

    // Database
    boolean checkDbPriv(UserIdentity currentUser, String ctl, String db, PrivPredicate wanted);

    // Table
    boolean checkTblPriv(UserIdentity currentUser, String ctl, String db, String tbl, PrivPredicate wanted);

    // Column (throws when access is denied instead of returning a boolean)
    void checkColsPriv(UserIdentity currentUser, String ctl, String db, String tbl,
            Set<String> cols, PrivPredicate wanted) throws AuthorizationException;

    // Resource
    boolean checkResourcePriv(UserIdentity currentUser, String resourceName, PrivPredicate wanted);

    // Workload Group
    boolean checkWorkloadGroupPriv(UserIdentity currentUser, String workloadGroupName, PrivPredicate wanted);

    // Cloud (compute cluster / stage, addressed by ResourceTypeEnum)
    boolean checkCloudPriv(UserIdentity currentUser, String cloudName, PrivPredicate wanted, ResourceTypeEnum type);

    // Storage Vault
    boolean checkStorageVaultPriv(UserIdentity currentUser, String storageVaultName, PrivPredicate wanted);

    // Column data masking (return an empty Optional for no masking)
    Optional<DataMaskPolicy> evalDataMaskPolicy(UserIdentity currentUser, String ctl, String db, String tbl,
            String col);

    // Row-level filtering (return an empty list for no filtering)
    List<? extends RowFilterPolicy> evalRowFilterPolicies(UserIdentity currentUser, String ctl, String db, String tbl);
}
```

구현하기 전에 알아둘 사항은 다음과 같습니다.

- `wanted` 인수는 `PrivPredicate`로, 작업에 필요한 구체적인 권한(예: `SELECT`, `LOAD`, `ADMIN`)을 묶어서 나타냅니다. 이를 정책 저장소에서 이해하는 형식에 매핑하세요.
- `checkColsPriv`는 다른 메서드와 다릅니다. boolean을 반환하지 않고, 접근이 거부되면 `AuthorizationException`을 발생시킵니다. 따라서 정상적으로 반환되면 해당 열에 대한 접근이 허용되었다는 뜻입니다.
- 이 인터페이스는 `default` 오버로드 형태의 `checkCtlPriv`, `checkDbPriv`, `checkTblPriv`, `checkColsPriv`를 제공하며, 이 오버로드들은 첫 번째 인수로 `boolean hasGlobal`을 받습니다. boolean을 반환하는 메서드는 먼저 해당 범위의 검사를 호출한 다음 그 결과와 `hasGlobal`을 결합하며, 범위별 검사 호출을 생략하지 않습니다. 열 검사 오버로드는 해당 범위의 검사를 호출하고, 발생한 `AuthorizationException`을 `hasGlobal`이 true이면 무시합니다. 일반적으로 여기 제시된 메서드만 구현하고 전역 권한에 따른 단락 처리는 기본 구현에 맡기면 됩니다.
- `evalDataMaskPolicy`와 `evalRowFilterPolicies`는 마스킹과 행 필터링을 위한 메서드입니다. 자체 시스템에서 이를 처리하지 않는다면 `Optional.empty()`와 빈 목록을 반환하세요. 기본 제공 컨트롤러도 이렇게 동작합니다.

### AccessControllerFactory {#accesscontrollerfactory}

`AccessControllerFactory`는 Doris가 탐색하는 진입점입니다. 제공자의 이름을 정의하고 속성 맵을 받아 컨트롤러를 생성합니다.

```java
public interface AccessControllerFactory {
    // Identifier used in configuration, for example "ranger-doris".
    // Defaults to the simple class name if you do not override it.
    default String factoryIdentifier() {
        return this.getClass().getSimpleName();
    }

    CatalogAccessController createAccessController(Map<String, String> prop);
}
```

`prop` 맵은 컨트롤러에 전달되는 설정(엔드포인트, 자격 증명, 저장소 ID 등)입니다. 이 설정의 출처는 컨트롤러를 내부 Catalog에 사용하는지 외부 Catalog에 사용하는지에 따라 달라지며, 아래 [설정](#configuration)에서 설명합니다.

## 플러그인 등록 {#registering-the-plugin}

Doris는 두 가지 방식으로 팩토리를 탐색하며, 두 방식 모두 `AccessControllerManager`에 구현되어 있습니다.

**Classpath 서비스 파일.** Java `ServiceLoader` 파일에 팩토리의 정규화된 전체 클래스 이름을 추가합니다.

```
fe/fe-core/src/main/resources/META-INF/services/org.apache.doris.mysql.privilege.AccessControllerFactory
```

한 줄에 하나의 클래스 이름을 작성합니다. Ranger 팩토리는 이 파일에 이미 등록되어 있습니다. 이 방식은 플러그인을 FE에 포함하여 컴파일하므로 Doris 소스 트리에 포함되는 기여 코드에 적합합니다.

**외부 플러그인 디렉터리.** Doris는 시작할 때 외부 플러그인 디렉터리에서도 팩토리를 로드합니다. 따라서 컨트롤러를 독립적인 jar로 배포하고 FE를 다시 빌드하지 않고도 설치할 수 있습니다. jar에 자체 `META-INF/services/org.apache.doris.mysql.privilege.AccessControllerFactory` 항목을 포함하고, JAR을 `authorization_plugins_dir`(기본값: `${DORIS_HOME}/plugins/authorization`) 바로 아래에 배치합니다. 이 로더는 플러그인별 하위 디렉터리가 아닌 최상위 디렉터리의 JAR 파일을 검색합니다. 필요한 의존성을 해당 JAR에 함께 패키징하여 모든 FE에 배포한 뒤 FE를 다시 시작합니다. 컨트롤러에서 사용하는 SDK를 FE 빌드에 추가하고 싶지 않다면 이 방식이 더 간편합니다.

## 설정 {#configuration}

컨트롤러를 선택하는 방법은 해당 컨트롤러가 관리하는 Catalog에 따라 달라집니다.

### 내부 Catalog {#internal-catalog}

FE 설정 `access_controller_type`을 `fe.conf`에 지정하여 내부 Catalog의 컨트롤러를 설정합니다. 기본값은 `default`이며, 기본 제공 권한 부여 모듈을 사용합니다. `ranger-doris`를 지정하면 Ranger 컨트롤러가 선택됩니다. 사용자 정의 컨트롤러를 내부 Catalog의 권한 부여 모듈로 사용하려면 팩토리 식별자를 지정하세요.

```
access_controller_type = your-controller-id
```

내부 Catalog 컨트롤러의 속성은 `authorization_config_file_path`에 지정된 파일에서 읽습니다(기본값: `conf/authorization.conf`, 파일은 반드시 `DORIS_HOME` 아래에 있어야 함). 파일 내용은 `prop` 맵으로 팩토리에 전달됩니다.

### 외부 Catalog {#external-catalog}

외부 Catalog는 자체 권한 부여 모듈을 Catalog 속성으로 지정하므로 Catalog마다 서로 다른 컨트롤러를 사용할 수 있습니다. Catalog를 생성하거나 변경할 때 다음 두 속성을 설정합니다.

- `access_controller.class`는 팩토리 식별자(또는 팩토리 클래스 이름)입니다.
- `access_controller.properties.*`는 컨트롤러 설정을 담습니다. Doris는 `access_controller.properties.` 접두사를 제거한 나머지를 `prop` 맵으로 전달합니다.

예를 들면 다음과 같습니다.

```sql
CREATE CATALOG my_catalog PROPERTIES (
    "type" = "hms",
    "hive.metastore.uris" = "thrift://127.0.0.1:9083",
    "access_controller.class" = "your-controller-id",
    "access_controller.properties.api_url" = "http://127.0.0.1:8080",
    "access_controller.properties.store_id" = "01H...",
    "access_controller.properties.token" = "..."
);
```

이 경우 컨트롤러는 `{"api_url": "...", "store_id": "...", "token": "..."}`를 `createAccessController`에서 받습니다.

## 최소 구현 골격 {#a-minimal-skeleton}

다음은 독립적으로 사용할 수 있는 Java 소스 파일이 아닌 구현 골격입니다. 각 public 클래스를 별도 파일에 작성하고, 참조하는 Doris 및 Java 타입을 가져오고, 생략된 모든 메서드를 구현하고, `MyPolicyClient`를 제공해야 합니다. 컴파일 의존성으로 배포 버전과 일치하는 릴리스 소스를 사용하세요.

다음 골격은 두 인터페이스를 구현하며, 외부 정책 호출은 스텁으로 남겨 두었습니다. 마스킹과 행 필터링은 빈 결과를 반환하도록 되어 있습니다. 이는 시스템이 필드 마스킹 대신 관계나 역할 검사를 수행할 때 적절한 기본 동작입니다.

```java
package com.example.doris.authz;

public class MyAccessControllerFactory implements AccessControllerFactory {
    @Override
    public String factoryIdentifier() {
        return "my-authz";
    }

    @Override
    public CatalogAccessController createAccessController(Map<String, String> prop) {
        return new MyAccessController(prop);
    }
}

public class MyAccessController implements CatalogAccessController {
    private final MyPolicyClient client;

    public MyAccessController(Map<String, String> prop) {
        this.client = new MyPolicyClient(prop.get("api_url"), prop.get("token"));
    }

    @Override
    public boolean checkGlobalPriv(UserIdentity currentUser, PrivPredicate wanted) {
        return client.isAllowed(currentUser, "global", null, wanted);
    }

    @Override
    public boolean checkTblPriv(UserIdentity currentUser, String ctl, String db, String tbl, PrivPredicate wanted) {
        return client.isAllowed(currentUser, "table", ctl + "." + db + "." + tbl, wanted);
    }

    // checkCtlPriv, checkDbPriv, checkResourcePriv, checkWorkloadGroupPriv,
    // checkCloudPriv, checkStorageVaultPriv: same shape as above.

    @Override
    public void checkColsPriv(UserIdentity currentUser, String ctl, String db, String tbl,
            Set<String> cols, PrivPredicate wanted) throws AuthorizationException {
        for (String col : cols) {
            if (!client.isAllowed(currentUser, "column", ctl + "." + db + "." + tbl + "." + col, wanted)) {
                throw new AuthorizationException("Access denied on column " + col);
            }
        }
    }

    @Override
    public Optional<DataMaskPolicy> evalDataMaskPolicy(UserIdentity currentUser, String ctl, String db, String tbl,
            String col) {
        return Optional.empty();
    }

    @Override
    public List<? extends RowFilterPolicy> evalRowFilterPolicies(UserIdentity currentUser, String ctl, String db,
            String tbl) {
        return Collections.emptyList();
    }
}
```

## 참조 구현: Ranger {#reference-implementation-ranger}

Ranger 연동은 실제 구현 예제로 살펴보기 좋습니다. `RangerDorisAccessControllerFactory`는 식별자 `ranger-doris`를 사용하며, `RangerDorisAccessController`는 대상 객체의 리소스를 구성하고, 각 Doris 권한을 Ranger 접근 유형에 매핑한 뒤, Ranger 플러그인에 접근 허용 여부를 확인하는 방식으로 모든 검사 메서드를 구현합니다. 또한 Ranger 정책을 기반으로 마스킹과 행 필터링을 구현합니다. Doris 검사를 외부 정책 엔진에 매핑하려는 경우 이 구조를 그대로 적용할 수 있습니다.

## 수명 주기 및 검증 {#lifecycle-and-verification}

컨트롤러 속성과 정책 범위가 호환되는 경우에만 백그라운드 리소스를 재사용하세요. 자격 증명이나 정책 서비스가 서로 다른 Catalog 간에 변경 가능한 컨트롤러 하나를 공유하지 마세요. 팩토리가 인스턴스를 공유한다면 동시 접근이 안전하도록 구현하세요. Ranger 팩토리는 의도적으로 인스턴스를 공유합니다. 각 컨트롤러가 자체 Ranger 정책 갱신기를 시작하므로 `RangerDorisAccessControllerFactory`는 모든 Catalog가 공유하는 단일 컨트롤러를 반환합니다([apache/doris#65570](https://github.com/apache/doris/pull/65570) 참조). 팩토리가 Catalog마다 새 컨트롤러를 반환하면 Catalog별로 갱신 스레드가 하나씩 누수됩니다. 컨트롤러가 FE 프로세스당 하나만 존재해야 하는 리소스를 보유한다면 같은 방식을 선택하세요.


JAR을 설치한 뒤에는 먼저 테스트용 외부 Catalog를 설정하세요. 권한이 있는 사용자는 테이블을 쿼리할 수 있고, 권한이 거부된 사용자는 접근 오류를 받는지 확인하세요. 내부 Catalog에 사용할 플러그인으로 선택하기 전에 열 접근 거부, 정책 서비스 중단 상황, 마스킹, 행 필터를 테스트하세요. 팩토리나 서비스 설명자가 누락되면 선택한 컨트롤러를 생성할 수 없으므로 FE 시작 로그와 배포 경로를 확인하세요. 플러그인 검증이 완료될 때까지 기본 제공 컨트롤러를 계속 사용하세요.
