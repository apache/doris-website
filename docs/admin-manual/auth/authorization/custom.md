---
{
    "title": "Custom Authorization Plugin",
    "language": "en",
    "description": "Write a third-party authorization plugin for Apache Doris by implementing the AccessControllerFactory and CatalogAccessController SPI, register it through the service file or an external plugin jar, and wire it up with the access_controller configuration.",
    "keywords": [
        "Apache Doris custom authorization",
        "Doris access controller",
        "AccessControllerFactory",
        "CatalogAccessController",
        "third-party authorization plugin",
        "access_controller_type",
        "access_controller.class",
        "Doris authorization SPI",
        "external authorizer"
    ]
}
---

<!-- Knowledge type: Extension guide / Architecture decision -->
<!-- Applicable scenario: integrate Apache Doris privilege checks with an external authorization system -->

Besides the [built-in authorization](./internal) model and the [Apache Ranger](./ranger) integration, Apache Doris exposes a service provider interface (SPI) so you can plug in your own authorization system. When a custom access controller is registered, Doris routes its privilege checks to your code instead of the built-in `GRANT`/`REVOKE` engine, which lets you back Doris authorization with an external policy store such as OpenFGA, OPA, or an in-house entitlement service.

This document explains the two interfaces you implement, how Doris discovers and loads a controller, the configuration that selects one, and a skeleton you can start from. The Ranger integration is the reference implementation and is a good file to read alongside this page.

## Applicable Scenarios

| Scenario | Description |
| --- | --- |
| Central policy store | Authorization decisions already live in an external system (OpenFGA, OPA, a homegrown service) and you want Doris to consult it instead of maintaining a separate copy |
| Relationship-based access | You need fine-grained or relationship-based rules (Zanzibar / ReBAC style) that the built-in RBAC model does not express directly |
| Shared authorization across engines | Several query engines share one policy source and Doris needs to honor the same decisions |
| Custom masking or row filtering | You want to drive column masking or row-level filters from your own policy definitions |

## The service provider interface

A custom authorizer is two Java interfaces in the package `org.apache.doris.mysql.privilege`:

- `AccessControllerFactory` builds a controller instance and gives it a stable identifier.
- `CatalogAccessController` receives the individual privilege checks.

You implement both, register the factory, and point the configuration at its identifier.

### CatalogAccessController

`CatalogAccessController` is where each authorization decision lands. Doris calls one method per object level. A `boolean` return of `true` means the operation is allowed; `false` means denied.

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

A few points worth knowing before you implement it:

- The `wanted` argument is a `PrivPredicate`, which groups the concrete privileges an operation needs (for example `SELECT`, `LOAD`, `ADMIN`). Map it onto whatever your policy store understands.
- `checkColsPriv` is the odd one out. It does not return a boolean; it throws `AuthorizationException` when access is denied, so a normal return means the columns are allowed.
- The interface provides `default` overloads of `checkCtlPriv`, `checkDbPriv`, `checkTblPriv`, and `checkColsPriv` that take a leading `boolean hasGlobal`. When `hasGlobal` is `true` they short-circuit to allow, otherwise they delegate to the single-argument method above. You usually only implement the methods shown here and let the defaults handle the global short-circuit.
- `evalDataMaskPolicy` and `evalRowFilterPolicies` are for masking and row filtering. If your system does not drive those, return `Optional.empty()` and an empty list. The built-in controller does exactly that.

### AccessControllerFactory

`AccessControllerFactory` is the entry point Doris discovers. It names the provider and builds a controller from a property map.

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

The `prop` map is the configuration passed to your controller (endpoint, credentials, store id, and so on). Where it comes from depends on whether the controller is used for the internal catalog or an external catalog, described under [Configuration](#configuration) below.

## Registering the plugin

Doris discovers factories in two ways, both wired up in `AccessControllerManager`.

**Classpath service file.** Add the fully qualified class name of your factory to the Java `ServiceLoader` file:

```
fe/fe-core/src/main/resources/META-INF/services/org.apache.doris.mysql.privilege.AccessControllerFactory
```

One class name per line. The Ranger factories are already listed there. This path means the plugin is compiled into the FE, so it fits a contribution that lives in the Doris tree.

**External plugin directory.** Doris also loads factories from an external plugin directory at startup, so you can ship a controller as a standalone jar and drop it in without rebuilding the FE. Package the jar with its own `META-INF/services/org.apache.doris.mysql.privilege.AccessControllerFactory` entry and place it in the plugin directory. This is the lower-friction option when your controller pulls in an SDK you would rather not add to the FE build.

## Configuration

How you select a controller depends on which catalog it governs.

### Internal catalog

Set the controller for the internal catalog with the FE configuration `access_controller_type` (in `fe.conf`). The default is `default`, which uses the built-in authorizer. `ranger-doris` selects the Ranger controller. Set it to your factory identifier to make a custom controller the authorizer for the internal catalog:

```
access_controller_type = your-controller-id
```

Properties for the internal-catalog controller are read from the file named by `authorization_config_file_path` (default `conf/authorization.conf`, and it must sit under `DORIS_HOME`). The contents are handed to your factory as the `prop` map.

### External catalog

An external catalog carries its own authorizer as catalog properties, so different catalogs can use different controllers. Set two properties when you create or alter the catalog:

- `access_controller.class` is the factory identifier (or the factory class name).
- `access_controller.properties.*` carries the controller configuration. Doris strips the `access_controller.properties.` prefix and passes the rest as the `prop` map.

For example:

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

Here the controller receives `{"api_url": "...", "store_id": "...", "token": "..."}` in `createAccessController`.

## A minimal skeleton

The following outline implements the two interfaces with an external policy call stubbed out. Masking and row filtering return empty, which is the right default when your system does relationship or role checks rather than field masking.

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

## Reference implementation: Ranger

The Ranger integration is the worked example to read. `RangerDorisAccessControllerFactory` uses the identifier `ranger-doris` and `RangerDorisAccessController` implements every check method by building a resource for the target object, mapping each Doris privilege onto a Ranger access type, and asking the Ranger plugin whether the access is allowed. It also implements masking and row filtering on top of Ranger policies. If you are mapping Doris checks onto an external policy engine, its structure translates directly.

## Keep background work per JVM, not per call

If your controller owns background work such as a policy refresh thread or a client connection pool, return a shared instance from the factory rather than a new object on every `createAccessController` call. The Ranger factory does this on purpose: each controller starts its own Ranger policy refresher, so `RangerDorisAccessControllerFactory` returns a single shared controller for all catalogs (see [apache/doris#65570](https://github.com/apache/doris/pull/65570)). A factory that returns a fresh controller per catalog would leak one refresher thread per catalog. Make the same choice whenever your controller holds resources that should exist once per FE process.
