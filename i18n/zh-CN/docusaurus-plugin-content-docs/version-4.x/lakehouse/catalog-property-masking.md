---
{
    "title": "Catalog 属性脱敏",
    "language": "zh-CN",
    "description": "了解 Doris 在 SHOW、审计 SQL 和血缘中对 Catalog 凭据、JDBC 连接串、URL、SDK 及 Hadoop 属性的脱敏规则，并区分 4.2.0、5.0 及后续版本的支持范围、动态配置和展示脱敏的边界。",
    "keywords": ["Catalog 属性脱敏", "Catalog 凭据", "SHOW CATALOG", "JDBC URL", "datasource_sensitive_property_pattern"],
    "doc_type": "reference"
}
---

Doris 会在支持的展示和审计入口中对外部 Catalog 的敏感属性进行脱敏，将整个值或 URL 中的敏感参数值替换为 `*XXX`，部分内部属性则直接省略。连接器仍然使用原始值。

:::info 适用版本
本文规则及 `datasource_sensitive_property_pattern` 计划在 Doris 4.2.0、5.0 及后续版本支持。在 4.x 文档中，本功能自 4.2.0 起适用。不能据此推断 4.0、4.1 或 3.x 具备完整规则；旧版本可能仅对部分字段脱敏。
:::

## 快速开始

对于一个已存在且你具有查看权限的 Catalog：

```sql
SHOW CATALOG example_catalog;
SHOW CREATE CATALOG example_catalog;
SELECT `Property`, `Value`
FROM catalogs()
WHERE CatalogName = 'example_catalog'
ORDER BY `Property`;
```

以下映射展示输出规则，无需连接示例端点：

| 属性 | 原始值 | 展示值 |
|---|---|---|
| `mc.session_token` | `example-token` | `*XXX` |
| `ozone.access_key` | `example-key` | `*XXX` |
| `jdbc_url` | `jdbc:mysql://db.example.com:3306/example` | `*XXX` |
| `uri` | `https://api.example.com/catalog` | `https://api.example.com/catalog` |
| `iceberg.rest.uri` | `https://user:pass@api.example.com/catalog?token=example&region=east` | `https://api.example.com/catalog?token=*XXX&region=east` |
| `hosts` | `host1.example.com:9000,host2.example.com:9000` | 保持原值 |
| `endpoint` | `https://api.example.com/?X-Amz-Signature=example` | `*XXX` |

脱敏结果无法还原原始秘密。重建或修改 Catalog 时，应从配置管理或密钥管理系统获取原值。

## 生效入口

| 输出入口 | 行为 |
|---|---|
| `SHOW CATALOG`、`SHOW CREATE CATALOG`、`catalogs()` | 使用统一的属性名和值规则，原有隐藏属性继续省略。 |
| 审计日志中的 CREATE / ALTER CATALOG SQL | 按相同规则替换语句文本中的敏感属性。 |
| 血缘元数据中的 Catalog 属性 | 省略属性名敏感的字段，对保留字段中的连接串和 URL 凭据进行清理。 |

部分 resource、storage vault 和 job SQL 入口也使用开启脱敏的同一属性格式化逻辑。这不表示所有 resource proc 结果、SDK 诊断、HTTP 响应或应用日志都使用这一逻辑。

## 属性名规则

Doris 对以下规则取并集：

1. 内置敏感字段及连接器/文件系统的秘密字段别名。4.2.0 从内置注册表及字段敏感声明中收集；5.0 及后续版本还由已加载的 provider 注册秘密别名及命名空间。
2. 永久的连接串、原生凭据和 Hadoop 凭据名称规则。
3. 下文介绍的可配置补充名称表达式。

精确秘密字段名的比较不区分大小写。敏感名称优先于值解析：即使 `custom.password` 中存放的是普通端点，只要名称匹配规则，其值仍会被遮蔽。属性名本身继续显示。

### Catalog 与 Metastore 凭据

下表列出代表性名称和特殊规则。连接器是否可用取决于 Doris 版本；增加脱敏规则不会增加连接器支持。某个已声明秘密字段接受的别名适用相同保护；这不是“只有这些名称才敏感”的穷举名单。

| Catalog 或服务 | 整值遮蔽规则 |
|---|---|
| JDBC | `password`、`jdbc.password`，以及 `jdbc_url` 等明确的 JDBC 连接属性。即使没有嵌入密码，JDBC 连接串也会被隐藏。 |
| MongoDB | `mongodb.uri`、`mongodb.password`。MongoDB URI 始终整值遮蔽，即使其中看不到密码。 |
| MaxCompute | `mc.access_key`、`mc.secret_key`、`mc.session_token`。 |
| Iceberg REST | `iceberg.rest.oauth2.token`、`iceberg.rest.oauth2.credential`、`iceberg.rest.access-key-id`、`iceberg.rest.secret-access-key`、`iceberg.rest.session-token`。REST 服务 URI 使用下文地址规则。 |
| Iceberg JDBC / Paimon JDBC | `iceberg.jdbc.password`、`paimon.jdbc.password`、`jdbc.password`，以及明确的 JDBC URI 属性。共享别名 `uri` 的值以 `jdbc:` 开头时也整值遮蔽。 |
| Paimon REST | `paimon.rest.dlf.access-key-id`、`paimon.rest.dlf.access-key-secret`，以及共享规则识别出的其他凭据名称。 |
| Glue / 保留的 DLF 属性 | Glue 别名，例如 `glue.access_key`、`glue.secret_key`、`aws.glue.access-key`、`aws.glue.secret-key`、`aws.glue.session-token`；保留的 DLF 别名，例如 `dlf.access_key`、`dlf.secret_key`、`dlf.session_token`、`dlf.catalog.accessKeyId`、`dlf.catalog.accessKeySecret`、`dlf.catalog.sessionToken`、`dlf.catalog.securityToken`。保留脱敏规则不表示仍支持创建该 metastore 类型。 |
| Trino | `trino.` 后的名称包含 `key`、`secret`、`password`、`token`、`credential` 任一子串即敏感，例如 `trino.keytab`、`trino.connection-password`。 |
| Elasticsearch | `elasticsearch.password` 等已声明密码别名；端点值使用地址规则。 |
| 其他 Catalog | 根据 metastore、文件系统和凭据属性，使用相同的全局规则。仅凭 Catalog 类型不会把所有属性都视为敏感。 |

4.2.0 中，Trino 的命名空间规则对前缀之后的名称进行不区分大小写的子串匹配。例如，`trino.monkey` 也包含 `key`，因此会被遮蔽。关闭补充表达式后，这一永久规则仍然生效。

### 存储与原生 SDK 凭据

| 属性族 | 敏感字段与代表性别名 |
|---|---|
| S3 | Access Key、Secret Key、Session Token：`s3.access_key`、`s3.secret_key`、`s3.session_token`、`s3.access-key-id`、`s3.secret-access-key`、`s3.session-token`，以及声明的裸名称和 AWS 别名。 |
| GCS | `gs.access_key`、`gs.secret_key`、`gs.session_token`，以及声明的 S3/AWS 别名。 |
| Azure | 账户名/Access Key 别名、Account Key 和 OAuth Client Secret，包括 `azure.account_name`、`azure.access_key`、`azure.account_key`、`azure.secret_key`、`azure.oauth2_client_secret`、`AZURE_ACCOUNT_KEY`、`AZURE_CLIENT_SECRET`。被明确保护的账户标识即使不是密码，也会被隐藏。 |
| OSS / OSS-HDFS | Access Key、Secret Key、Session/Security Token，包括 `oss.access_key`、`oss.secret_key`、`oss.session_token`、`oss.hdfs.access_key`、`oss.hdfs.secret_key`、`oss.hdfs.security_token`、`oss.security_token`，以及 `OSS_ACCESS_KEY`、`OSS_SECRET_KEY`、`OSS_SESSION_TOKEN`、`OSS_TOKEN`。 |
| COS | `cos.access_key`、`cos.secret_key`、`cos.session_token`、`COS_ACCESS_KEY`、`COS_SECRET_KEY`、`COS_SESSION_TOKEN`、`COS_TOKEN`，以及声明的 S3 别名。 |
| OBS | `obs.access_key`、`obs.secret_key`、`obs.session_token`、`OBS_ACCESS_KEY`、`OBS_SECRET_KEY`、`OBS_SESSION_TOKEN`、`OBS_TOKEN`，以及声明的 S3 别名。 |
| MinIO | `minio.access_key`、`minio.secret_key`、`minio.session_token`，以及声明的 S3/AWS 别名。 |
| Ozone | `ozone.access_key`、`ozone.secret_key`、`ozone.session_token`，以及声明的 S3 别名。 |
| 原生 SDK 凭据 | 裸名称 `token`、`credential`、`credentials`，以及以 `.`, `_` 或 `-` 分隔、最终部分为这些名称的属性，始终整值隐藏。这也覆盖保存在 Catalog 中的不带前缀的 SDK 属性。 |
| 其他内置秘密 | `kerberos_keytab_content`、`bos_secret_accesskey`、AI API Key 等名称继续受到保护。 |

部分生成的存储别名，例如精确大写的 `AWS_ACCESS_KEY`、`AWS_SECRET_KEY`、`AWS_TOKEN`，会从属性展示中省略，而不是返回掩码。不要依赖 SHOW 输出枚举或备份全部存储属性。

### Hadoop 凭据

以下永久规则不区分大小写，也识别 `fs.` 前的命名空间，例如 `hadoop.fs.s3a.secret.key`：

| 属性族 | 整值遮蔽规则 |
|---|---|
| `fs.s3.*`、`fs.s3a.*` | `access.key`、`secret.key`、`session.token`、`encryption.key`、`server-side-encryption.key`、`proxy.password`；也支持 `bucket.<bucket>.` 作用域，包括带点的 bucket 名。 |
| `fs.azure.*` | `account.key`、`sas`、`sas.fixed.token`、`account.oauth2.client.secret`、`account.oauth2.refresh.token`、`encryption.encoded.client-provided.key`，包括账户/容器后缀。 |
| `fs.adl.oauth2.*` | `credential`、`refresh.token`。 |
| `fs.oss.*` | `accessKeyId`、`accessKeySecret`、`securityToken`。 |
| `fs.cosn.*` | `secretId`、`secretKey`，包括 `userInfo.` 作用域。 |
| `fs.obs.*` | `access.key`、`secret.key`、`session.token`、`security.token`。 |

用于指定凭据文件的路径并不是文件内容。这些名称规则不会读取或扫描所引用的文件。

## JDBC 连接串与地址值

### 完整连接串

名称以分隔的 JDBC URL/URI 部分结尾时整值遮蔽，例如 `jdbc_url`、`jdbc.jdbc_url`、`iceberg.jdbc.uri`、`paimon.jdbc.uri`。`connectionString`、`connection_string`、`connection-string`、`connection.string` 后缀也整值遮蔽。

去掉首尾空白后，任何以 `jdbc:` 开头的值均整值遮蔽，与属性名和大小写无关。这包括放在 `uri` 中的 Oracle 等不透明驱动连接语法。

### Host 与 URL

Doris 会检查以分隔的 `uri`、`url`、`host`、`endpoint`、`address` 结尾的名称，包括复数形式。其他属性中符合层级 URI 形态的值也会被检查，例如 `warehouse`。

| 值 | 处理结果 |
|---|---|
| 普通 host 或 host:port、方括号 IPv6、逗号分隔的纯 host 列表 | 格式和数字端口合法时可见。端口范围为 0–65535。 |
| 支持的 URL 中含普通认证 userinfo | 移除 userinfo，保留安全的主机、端口和路径。 |
| 秘密查询参数 | 先解码参数名，再分类；遮蔽每个匹配值，包括重复参数。 |
| URL fragment | 移除。 |
| 授权签名 | 参数名包含 `signature`，或分隔的 `sig` / `sas` 时，整个 URL 隐藏。 |
| 未知协议、不透明格式、非法 authority/端口/转义/参数名、URL 列表或含逗号的 URL、歧义 matrix 路径或嵌套连接串 | 整值隐藏，解析失败时不会回退到原值输出。 |

支持的协议为 `http`、`https`、`thrift`、`hdfs`、`viewfs`、`file`、`s3`、`s3a`、`s3n`、`oss`、`cos`、`cosn`、`obs`、`gs`、`abfs`、`abfss`、`wasb`、`wasbs`。

查询参数名既使用上述名称规则，也识别 password/passwd/pwd、secret/token/credential、access/API/account/private/auth/application key 的常见拼写，以及 `authorization`、裸 `auth` 和裸 `key`。普通 URL 的查询参数分隔符统一为 `&`。非秘密名称下嵌套 URL/JDBC 值，或不可靠的重复编码，都会导致整个地址隐藏。

### 原生存储与本地路径

- ABFS/WASB URI 中合法的 `container@host` 表示存储身份，而非登录信息。保留 container；拒绝缺失、编码、非法或夹带密码的 container 形式。
- 保留合法的含下划线 GCS bucket authority、使用默认 authority 的 HDFS/ViewFS 绝对位置，以及 ViewFS 逻辑 mount 名。
- 保留无歧义的绝对 POSIX 本地 `driver_url` 路径及绝对 `file:/...` / `file:///...` 位置；有歧义的语法仍隐藏。这是展示规则，不改变驱动加载限制。
- 仅对内部流式 S3 审计，Doris 按审计事件发出时生效的规则，先对每个已选文件脱敏，再组装转义后的批次 glob。保留用于区分对象 key 的字面 `#`、百分号拼写、`+`、空格及非秘密查询形态后缀分隔符。含签名或不安全的已选位置使整个批次隐藏。普通 Catalog URI 或用户传入的 URI 列表不能启用此内部模式。

## 配置补充名称规则

`datasource_sensitive_property_pattern` 是 FE 本地、可动态修改的字符串配置，默认值为：

```text
password|passwd|secret|token|credential|access[._-]?key|api[._-]?key
```

共享属性格式化逻辑用此正则对整个属性名进行不区分大小写的查找，也用于 URL 查询参数名。此表达式可覆盖 `custom.password`、`clientSecret`、`custom.api-key` 等名称；名称含有这些词的非秘密操作设置也可能被隐藏。

| 值 | 效果 |
|---|---|
| 默认表达式 | 在所有永久规则之外，增加常见凭据名称匹配。 |
| 自定义表达式 | 仅替换补充表达式，内置及已注册秘密规则继续生效。 |
| `(?!)` | 只关闭补充名称匹配。 |
| 空表达式 | 匹配所有名称，可能使全部展示属性隐藏，或从血缘中省略。 |
| 非法表达式 | 在启动、custom 配置加载或运行时更新时拒绝该配置，不回退到原值输出。 |

管理员可以先检查部署构建是否暴露此配置：

```sql
SHOW FRONTEND CONFIG LIKE 'datasource_sensitive_property_pattern';
```

例如，关闭补充表达式后，`custom.password` 不再仅因这个名称而隐藏；内置的 `password`、原生 `token` 及明确 JDBC/Hadoop 规则仍然生效。

如果没有匹配的配置行，该构建不提供此补充正则。不要仅根据版本大类推断是否具备完整规则。

在保留默认匹配的基础上，为所有当前 FE 增加 `custom.pin`：

```sql
ADMIN SET ALL FRONTENDS CONFIG (
    "datasource_sensitive_property_pattern" = "password|passwd|secret|token|credential|access[._-]?key|api[._-]?key|custom[.]pin"
);
```

之后 `custom.pin` 显示为 `*XXX`。运行时 SQL 修改不会在重启后保留，应在每个 FE 的 `fe.conf` 中配置同一表达式，或使用文档中的持久化配置机制；新加入的 FE 也需要相同配置。其他提供查询服务的 FE 使用不同表达式时，输出可能不同。

参数说明见 [FE 配置](../admin-manual/config/fe-config.md#datasource_sensitive_property_pattern)。示例用 `[.]` 匹配字面点，避免 SQL 反斜线转义歧义。

## 限制与最佳实践

- 脱敏作用于支持的输出副本，不会加密 Catalog 元数据存储，也不会改变客户端使用的凭据。
- SHOW 中隐藏的秘密无法从掩码中读回。轮换凭据时，应通过 ALTER CATALOG 设置真实的新值。
- URL 的普通路径段和未识别的查询参数不会按秘密内容进行扫描；秘密放在其中时，可能保持原样。应避免把秘密放入路径，或将整个属性名加入补充规则以整值隐藏。
- Catalog 注释和其他自由文本不会被通用秘密扫描。未知 SDK 容器或不相关属性名下的任意值，不保证能够识别。应使用明确的凭据属性，并按需配置补充名称。
- 以文档列出的输出入口为范围；自定义插件、外部 SDK 日志及其他 API 的输出应独立检查，再判断能否分享。
- 所有提供查询服务的 FE 使用同一配置。升级或更换连接器后，用合成凭据核对 SHOW 及有代表性的审计/血缘输出。
