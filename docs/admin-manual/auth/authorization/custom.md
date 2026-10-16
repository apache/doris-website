---
{
    "title": "Custom Authorization Plugin",
    "language": "en",
    "description": "Implement, package and configure a custom authorization source with the development authorization SPI.",
    "keywords": [
        "Doris authorization",
        "AuthorizationPlugin",
        "AuthorizationPluginFactory"
    ]
}
---

The development version exposes `org.apache.doris.authorization.spi.AuthorizationPlugin` and `AuthorizationPluginFactory` for external privilege decisions, column masking and row filters.

:::note
This interface belongs to the development version. Doris 4.x uses `CatalogAccessController` / `AccessControllerFactory`; see [the 4.x guide](https://doris.apache.org/docs/4.x/admin-manual/auth/authorization/custom). Service descriptors and directory layouts differ between these versions.
:::

## Prerequisites

Compile against the source and JDK matching the deployed FE, using `fe-authorization-api` and `fe-authorization-spi` as provided dependencies. Do not bundle Doris API classes in the plugin JAR. Deployment requires write access to every FE plugin directory and an FE restart. Use an account with the relevant catalog administration privileges for validation.

## Minimal Factory

This complete factory creates a plugin that denies every privilege by default, allowing you to verify discovery. A working policy plugin must override `checkAction` or `checkPrivilege` to consult its policy source. A plugin implementing only `name()` cannot serve application queries.

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

Add the factory class name to the following service descriptor inside the JAR:

```text
META-INF/services/org.apache.doris.authorization.spi.AuthorizationPluginFactory
```

```text
com.example.doris.authz.MyAuthorizationPluginFactory
```

## Interface Semantics

- `checkPrivilege(subject, resource, requirement, context)` allows by returning and denies by throwing `AccessDeniedException`. Its default implementation calls `checkAction` for the requirement actions using ALL/ANY semantics. Unimplemented checks deny access.
- `getRowFilters` returns `List<RowFilterSpec>`; `getDataMasks` returns a column-name-keyed `Map<String, DataMaskSpec>`. Empty collections mean no policy, rather than granting access. Never return NULL. If policies cannot be loaded, throw an exception so the statement fails.
- One authorization source decides each resource: catalog-bound sources govern objects inside the catalog; the instance source governs instance objects and catalog-level grants. A plugin decides its global-privilege exemption and can consult `AuthorizationContext.grantedByGlobalScopeAuthority`. The engine does not pre-authorize every plugin call.
- Engine exemptions remain for skipAuth, skip_catalog_priv_check on the relevant externally governed catalog, and row-filter/masking exemptions for the literal root@'%' and admin@'%' accounts.
- Instances are reused, with `close()` called when a configured instance is replaced. The plugin owns policy caching and refresh, concurrency control and resource cleanup.

## Packaging and Deployment

Declare `Doris-Authorization-Plugin-Api-Version` in the JAR MANIFEST, using the version in `META-INF/doris/authorization-plugin-api-version.properties` from the deployed FE SPI JAR. The current major version is `1`, for example:

```text
Doris-Authorization-Plugin-Api-Version: 1.0
```

A missing declaration or different major version causes rejection. Install each plugin in its own subdirectory of `authorization_plugins_dir`, whose default is `${DORIS_HOME}/plugins/authorization`:

```text
plugins/authorization/my-authz/my-authz.jar
plugins/authorization/my-authz/lib/policy-client.jar
```

Deploy on every FE and restart. Dependencies use an isolated child-first classloader; `org.apache.doris.authorization.*` always comes from the FE.

## Configuration and Validation

For the internal catalog, set `access_controller_type = my-authz` in `fe.conf`. Properties come from `authorization_config_file_path`, resolving by default to `${DORIS_HOME}/conf/authorization.conf`. The default `default` selects built-in authorization.

For an external catalog, first prepare an accessible HMS and replace the example endpoints and credentials:

```sql
CREATE CATALOG my_catalog PROPERTIES (
    "type" = "hms",
    "hive.metastore.uris" = "thrift://127.0.0.1:9083",
    "access_controller.class" = "my-authz",
    "access_controller.properties.api_url" = "https://policy.example.com",
    "access_controller.properties.token" = "<token>"
);
```

`access_controller.class` selects a factory name or factory class name. Doris strips `access_controller.properties.` before passing configuration to the factory. Validate allowed and denied queries on a test catalog, plus unavailable policies, column privileges, masking and row filters, before changing the internal catalog. If a factory is missing, inspect FE startup logs, the service descriptor, API version declaration and plugin layout.

## Migrating from the Legacy Interface

Legacy controllers still work through an adapter but are deprecated. The `hasGlobal` overloads have been removed, and data policies now use `DataMaskSpec` / `RowFilterSpec`; old implementations with policies must be recompiled. Follow the new SPI lifecycle rather than copying older Ranger singleton behavior. A complete implementation is in `fe/fe-core/src/test/java/org/apache/doris/authorizationexample/`; packaging details are in `fe/fe-authorization/fe-authorization-spi/README.md` in the source tree.
