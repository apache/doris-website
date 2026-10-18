---
{
    "title": "사용자 정의 권한 부여 플러그인",
    "language": "ko",
    "description": "개발 버전의 권한 부여 SPI를 사용하여 사용자 정의 권한 부여 소스를 구현하고 패키징 및 구성합니다.",
    "keywords": [
        "Doris 권한 부여",
        "AuthorizationPlugin",
        "AuthorizationPluginFactory"
    ]
}
---

개발 버전은 외부 권한 판단, 열 마스킹 및 행 필터를 위해 `org.apache.doris.authorization.spi.AuthorizationPlugin`과 `AuthorizationPluginFactory`를 제공합니다.

:::note
이 인터페이스는 개발 버전에 해당합니다. Doris 4.x는 `CatalogAccessController` / `AccessControllerFactory`를 사용합니다. [4.x 가이드](https://doris.apache.org/docs/4.x/admin-manual/auth/authorization/custom)를 참조하세요. 두 버전은 서비스 디스크립터와 디렉터리 구조가 다릅니다.
:::

## 사전 요구 사항 {#prerequisites}

배포된 FE와 일치하는 소스 및 JDK를 사용하여 컴파일하고, `fe-authorization-api`와 `fe-authorization-spi`를 provided 의존성으로 지정합니다. 플러그인 JAR에 Doris API 클래스를 포함해서는 안 됩니다. 배포하려면 모든 FE의 플러그인 디렉터리에 대한 쓰기 권한이 필요하며 FE를 재시작해야 합니다. 검증에는 해당 Catalog를 관리할 권한이 있는 계정을 사용합니다.

## 최소 팩터리 구현 {#minimal-factory}

아래의 완전한 팩터리 예제는 기본적으로 모든 권한을 거부하는 플러그인을 생성하므로, 플러그인이 정상적으로 검색되는지 확인할 수 있습니다. 실제로 정책을 적용하는 플러그인은 `checkAction` 또는 `checkPrivilege`를 재정의하여 정책 소스를 조회해야 합니다. `name()`만 구현한 플러그인은 애플리케이션 쿼리를 처리할 수 없습니다.

```java
package com.example.doris.authz;

import java.util.Map;
import org.apache.doris.authorization.spi.AuthorizationContext;
import org.apache.doris.authorization.spi.AuthorizationPlugin;
import org.apache.doris.authorization.spi.AuthorizationPluginFactory;

public final class MyAuthorizationPluginFactory implements AuthorizationPluginFactory {
    @Override
    public String name() { return "my-authz"; }

    @Override
    public AuthorizationPlugin create(Map<String, String> properties,
            AuthorizationContext context) {
        return new AuthorizationPlugin() {
            @Override
            public String name() { return "my-authz"; }
        };
    }
}
```

JAR 내부의 다음 서비스 디스크립터에 팩터리 클래스 이름을 추가합니다.

```text
META-INF/services/org.apache.doris.authorization.spi.AuthorizationPluginFactory
```

```text
com.example.doris.authz.MyAuthorizationPluginFactory
```

## 인터페이스 동작 방식 {#interface-semantics}

- `checkPrivilege(subject, resource, requirement, context)`는 예외 없이 반환하면 접근을 허용하고, `AccessDeniedException`을 던지면 접근을 거부합니다. 기본 구현은 요구 사항에 포함된 작업에 대해 `checkAction`을 호출하며 ALL/ANY 규칙을 적용합니다. 구현하지 않은 검사는 접근을 거부합니다.
- `getRowFilters`는 `List<RowFilterSpec>`을 반환하고, `getDataMasks`는 열 이름을 키로 사용하는 `Map<String, DataMaskSpec>`을 반환합니다. 빈 컬렉션은 적용할 정책이 없음을 뜻하며, 접근을 허용한다는 의미는 아닙니다. NULL을 반환해서는 안 됩니다. 정책을 불러올 수 없으면 예외를 던져 해당 구문이 실패하도록 해야 합니다.
- 각 리소스의 권한은 하나의 권한 부여 소스가 판단합니다. Catalog에 연결된 소스는 해당 Catalog 내부의 객체를 관리하고, 인스턴스 소스는 인스턴스 객체와 Catalog 수준의 권한 부여를 관리합니다. 플러그인은 전역 권한에 따른 검사 면제 여부를 직접 결정하며, `AuthorizationContext.grantedByGlobalScopeAuthority`를 참조할 수 있습니다. 엔진이 모든 플러그인 호출을 사전에 승인하는 것은 아닙니다.
- skipAuth에 따른 엔진의 검사 면제, 외부에서 권한을 관리하는 해당 Catalog의 skip_catalog_priv_check에 따른 검사 면제, 계정명이 정확히 root@'%' 및 admin@'%'인 계정의 행 필터/마스킹 면제는 그대로 유지됩니다.
- 인스턴스는 재사용되며, 구성된 인스턴스가 교체될 때 `close()`가 호출됩니다. 플러그인은 정책 캐싱과 갱신, 동시성 제어 및 리소스 정리를 책임집니다.

## 패키징 및 배포 {#packaging-and-deployment}

JAR MANIFEST에 `Doris-Authorization-Plugin-Api-Version`을 선언하고, 배포된 FE SPI JAR의 `META-INF/doris/authorization-plugin-api-version.properties`에 명시된 버전을 사용합니다. 현재 주 버전은 `1`이며, 예시는 다음과 같습니다.

```text
Doris-Authorization-Plugin-Api-Version: 1.0
```

선언이 없거나 주 버전이 다르면 플러그인이 거부됩니다. 각 플러그인은 `authorization_plugins_dir` 아래의 개별 하위 디렉터리에 설치합니다. 이 설정의 기본값은 `${DORIS_HOME}/plugins/authorization`입니다.

```text
plugins/authorization/my-authz/my-authz.jar
plugins/authorization/my-authz/lib/policy-client.jar
```

모든 FE에 배포하고 재시작합니다. 의존성은 격리된 child-first 클래스 로더를 사용하며, `org.apache.doris.authorization.*`는 항상 FE에서 가져옵니다.

## 구성 및 검증 {#configuration-and-validation}

내부 Catalog의 경우 `access_controller_type = my-authz`를 `fe.conf`에 설정합니다. 속성은 `authorization_config_file_path`로 지정된 파일에서 가져오며, 기본 경로는 `${DORIS_HOME}/conf/authorization.conf`입니다. 기본값인 `default`는 내장 권한 부여를 선택합니다.

외부 Catalog의 경우 먼저 접근 가능한 HMS를 준비하고 예제의 엔드포인트와 자격 증명을 실제 값으로 바꿉니다.

```sql
CREATE CATALOG my_catalog PROPERTIES (
    "type" = "hms",
    "hive.metastore.uris" = "thrift://127.0.0.1:9083",
    "access_controller.class" = "my-authz",
    "access_controller.properties.api_url" = "https://policy.example.com",
    "access_controller.properties.token" = "<token>"
);
```

`access_controller.class`는 팩터리 이름 또는 팩터리 클래스 이름을 선택합니다. Doris는 구성을 팩터리에 전달하기 전에 `access_controller.properties.` 접두사를 제거합니다. 내부 Catalog를 변경하기 전에 테스트 Catalog에서 허용되는 쿼리와 거부되는 쿼리, 정책을 사용할 수 없는 상황, 열 권한, 마스킹 및 행 필터를 검증합니다. 팩터리를 찾을 수 없으면 FE 시작 로그, 서비스 디스크립터, API 버전 선언 및 플러그인 디렉터리 구조를 확인합니다.

## 기존 인터페이스에서 마이그레이션 {#migrating-from-the-legacy-interface}

기존 컨트롤러는 어댑터를 통해 계속 작동하지만 더 이상 사용을 권장하지 않습니다. `hasGlobal` 오버로드는 제거되었으며, 데이터 정책은 이제 `DataMaskSpec` / `RowFilterSpec`을 사용합니다. 정책이 포함된 기존 구현은 다시 컴파일해야 합니다. 이전 Ranger의 싱글턴 동작을 그대로 따르지 말고 새 SPI 수명 주기를 따라야 합니다. 전체 구현 예제는 소스 트리의 `fe/fe-core/src/test/java/org/apache/doris/authorizationexample/`에 있으며, 패키징에 관한 자세한 내용은 `fe/fe-authorization/fe-authorization-spi/README.md`에 있습니다.
