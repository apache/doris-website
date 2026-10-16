---
{
    "title": "自定义授权插件",
    "language": "zh-CN",
    "description": "开发版本授权 SPI 的接口、兼容性、部署和配置。",
    "keywords": [
        "Doris authorization",
        "AuthorizationPlugin",
        "AuthorizationPluginFactory"
    ]
}
---

开发版本通过 `org.apache.doris.authorization.spi.AuthorizationPlugin` 和 `AuthorizationPluginFactory` 扩展授权，适用于由外部系统管理权限、列脱敏和行过滤的部署。

:::note
本接口属于开发版本。4.x 使用旧的 `CatalogAccessController` / `AccessControllerFactory` 接口，详见[4.x 自定义授权插件](https://doris.apache.org/zh-CN/docs/4.x/admin-manual/auth/authorization/custom)。两个版本的服务描述文件和目录布局不能混用。
:::

## 前置条件

使用与部署 FE 匹配的源码及 JDK 编译插件，依赖 `fe-authorization-api` 和 `fe-authorization-spi`，将这些 Doris API 依赖标为 provided，不能重复打进插件 JAR。部署账号需要写入每个 FE 的插件目录并重启 FE；测试账号需具有相应的 Catalog 管理权限。

## 最小工厂

以下完整工厂创建一个默认拒绝所有权限的插件，用于验证加载流程。实际插件应覆盖 `checkAction` 或 `checkPrivilege`，查询策略系统后允许或拒绝。只有 `name()` 的插件不能供业务使用。

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

将工厂完整类名写入 JAR 内的服务描述文件：

```text
META-INF/services/org.apache.doris.authorization.spi.AuthorizationPluginFactory
```

```text
com.example.doris.authz.MyAuthorizationPluginFactory
```

## 接口语义

- `checkPrivilege(subject, resource, requirement, context)` 正常返回表示允许，拒绝时抛出 `AccessDeniedException`。默认实现把权限集合拆成 `checkAction` 调用，遵循 ALL/ANY 组合规则；未覆盖的检查默认拒绝。
- `getRowFilters` 返回 `List<RowFilterSpec>`；`getDataMasks` 返回按列名索引的 `Map<String, DataMaskSpec>`。默认空集合表示没有该策略，不表示允许访问。不能返回 NULL。策略无法加载时应抛出异常，使语句失败。
- 每个资源只交给一个授权源：Catalog 内对象使用绑定源，实例级对象和 Catalog 级授权使用实例授权源。全局权限豁免由插件决定，可使用 `AuthorizationContext.grantedByGlobalScopeAuthority`；引擎不事先替所有插件放行。
- 引擎保留 skipAuth、特定 Catalog 的 skip_catalog_priv_check，以及 root@'%'/admin@'%' 的行过滤和列脱敏豁免。
- 插件实例会被复用，配置变化时旧实例会 `close()`。缓存及策略刷新由插件负责，保持线程安全并释放资源。

## 打包和部署

JAR 的 MANIFEST 必须声明 `Doris-Authorization-Plugin-Api-Version`。使用部署 FE 的 SPI JAR 中 `META-INF/doris/authorization-plugin-api-version.properties` 记录的版本；当前主版本为 `1`，例如：

```text
Doris-Authorization-Plugin-Api-Version: 1.0
```

缺失声明或主版本不匹配时会拒绝加载。每个插件放在 `authorization_plugins_dir` 的独立子目录，默认根目录为 `${DORIS_HOME}/plugins/authorization`：

```text
plugins/authorization/my-authz/my-authz.jar
plugins/authorization/my-authz/lib/policy-client.jar
```

在所有 FE 部署并重启。依赖使用子优先类加载器隔离，`org.apache.doris.authorization.*` 始终由 FE 加载。

## 配置和验证

内部 Catalog 在 `fe.conf` 设置 `access_controller_type = my-authz`，属性从 `authorization_config_file_path` 读取，默认实际路径为 `${DORIS_HOME}/conf/authorization.conf`。`default` 保留内置授权。

外部 Catalog 使用以下属性；先准备可访问的 HMS，替换端点和凭据：

```sql
CREATE CATALOG my_catalog PROPERTIES (
    "type" = "hms",
    "hive.metastore.uris" = "thrift://127.0.0.1:9083",
    "access_controller.class" = "my-authz",
    "access_controller.properties.api_url" = "https://policy.example.com",
    "access_controller.properties.token" = "<token>"
);
```

`access_controller.class` 选择工厂名称或工厂类名；`access_controller.properties.` 前缀去除后传入工厂。先通过测试 Catalog 验证已授权查询成功、拒绝查询报权限错误，并覆盖策略服务不可用、列权限、脱敏和行过滤，再切换内部 Catalog。找不到工厂时检查 FE 启动日志、服务文件、API 版本声明和目录。

## 从旧接口迁移

旧接口仍通过适配器支持，但已弃用。`hasGlobal` 重载已删除；数据策略改用 `DataMaskSpec` / `RowFilterSpec`，旧实现需要重新编译。不要用旧版本 Ranger 工厂共享实例的做法替代新 SPI 的生命周期管理。完整实现可参考源码中的 `fe/fe-core/src/test/java/org/apache/doris/authorizationexample/`，以及 `fe/fe-authorization/fe-authorization-spi/README.md`。
