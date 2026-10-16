---
{"title":"自定义授权插件","language":"zh-CN","description":"介绍 Doris 4.x 的 AccessControllerFactory 和 CatalogAccessController 授权扩展接口、部署方式及配置。","keywords":["Doris 授权插件","AccessControllerFactory","CatalogAccessController"]}
---

Doris 除了[内置授权](./internal)和 [Apache Ranger](./ranger)，还支持使用自定义授权插件连接外部策略系统。插件接收权限检查请求，并决定是否允许访问。适用于集中策略管理、关系型权限控制以及自定义列脱敏和行过滤。

:::note
本文介绍 Doris 4.x 的 `AccessControllerFactory` / `CatalogAccessController` 接口。开发版本采用新的授权 SPI，打包方式也不同，不能直接将开发版本示例用于 4.x。插件必须按实际部署的 Doris 版本编译。
:::

## 接口

两个接口都位于 `org.apache.doris.mysql.privilege`：

- `AccessControllerFactory` 提供唯一的 `factoryIdentifier()`，并通过 `createAccessController(Map<String, String> prop)` 创建控制器。
- `CatalogAccessController` 检查全局、Catalog、数据库、表、列、Resource、Workload Group、Cloud 和 Storage Vault 权限。布尔返回值 `true` 表示允许，`false` 表示拒绝。

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

`wanted` 是 `PrivPredicate`，包含所需权限集合及其组合方式。`checkColsPriv` 在拒绝访问时抛出 `AuthorizationException`，正常返回表示允许。

`checkCtlPriv`、`checkDbPriv`、`checkTblPriv` 和 `checkColsPriv` 存在带 `boolean hasGlobal` 的默认重载。布尔方法先调用对应范围的检查，再与 `hasGlobal` 合并，并不会跳过范围检查。列检查重载先调用列检查，在 `hasGlobal=true` 时抑制 `AuthorizationException`。

不提供脱敏或行过滤时，分别返回 `Optional.empty()` 和空列表。返回空策略表示没有限制；策略服务不可用时应使语句失败，不能用空策略代替失败。

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

## 注册和部署

在插件 JAR 内添加服务文件 `META-INF/services/org.apache.doris.mysql.privilege.AccessControllerFactory`，每行填写一个工厂类的完整类名。内置插件也可以在 FE classpath 上通过同一服务文件发现。

将独立 JAR **直接放到** `authorization_plugins_dir` 下，默认路径是 `${DORIS_HOME}/plugins/authorization`。4.x 加载器扫描该目录根层的 JAR，不使用每插件子目录。将依赖打包进 JAR，在所有 FE 上部署相同文件并重启 FE。新开发版本的 `plugin/lib` 布局不适用于此加载通道。

## 配置

### 内部 Catalog

在 `fe.conf` 中配置：

```text
access_controller_type = my-authz
```

默认值 `default` 使用内置授权。`ranger-doris` 使用 Ranger，其他值使用对应工厂标识。控制器属性从 `authorization_config_file_path` 指定文件读取，默认实际路径为 `${DORIS_HOME}/conf/authorization.conf`；文件内容以属性 Map 传入工厂。

### 外部 Catalog

`access_controller.class` 使用工厂标识或工厂完整类名。`access_controller.properties.*` 中的前缀会被去除，剩余键值传给工厂。下例要求已部署可访问的 HMS，执行账号具有创建 Catalog 权限：

```sql
CREATE CATALOG my_catalog PROPERTIES (
    "type" = "hms",
    "hive.metastore.uris" = "thrift://127.0.0.1:9083",
    "access_controller.class" = "my-authz",
    "access_controller.properties.api_url" = "https://policy.example.com",
    "access_controller.properties.token" = "<token>"
);
```

工厂收到 `api_url` 和 `token` 属性。将示例端点和凭据替换为实际值。

## 实现示意

以下是代码轮廓：每个 public 类应单独存放，需添加相应 Doris/Java import、实现省略的方法并提供 `MyPolicyClient`。按部署版本源码编译，不能将此代码段直接当作完整项目。

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

## 生命周期和验证

Ranger 控制器是参考实现。仅在策略范围和属性兼容时共享后台资源；不同 Catalog 的凭据或策略服务不同，不能共用一个可变控制器。共享对象必须支持并发访问。注意工厂可能在校验和不同 Catalog 初始化时被多次调用，避免重复启动无法释放的后台任务。

安装后先使用测试外部 Catalog，确认授权账号可以查询、拒绝账号收到权限错误，并覆盖列级拒绝、策略服务不可用、列脱敏和行过滤。验证完成后再考虑替换内部 Catalog 的授权器。工厂未发现或服务文件有误时，检查 FE 启动日志、类名和部署路径。
