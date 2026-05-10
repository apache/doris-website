---
{
    "title": "Azure Blob",
    "language": "zh-CN",
    "description": "自 3.1.3 版本起，Doris 支持访问 Azure Blob 存储。"
}
---

自 3.1.3 版本起，Doris 支持访问 Azure Blob 存储。

本文档介绍访问 Microsoft Azure Blob 存储所需的参数，这些参数适用于以下场景：

- Catalog 属性
- Table Valued Function 属性
- Broker Load 属性
- Export 属性
- Outfile 属性
- Backup / Restore 属性

**Azure Blob 存储目前不支持 ARM 架构。**

## 配置 BE 端 HTTPS CA 证书

自 Doris 3.1.5 和 4.0.5 起，当 Doris BE 通过 HTTPS 访问 Azure Blob Storage 时，可以在 `be.conf` 中显式配置 `ca_cert_file_paths`。

默认情况下，如果未配置 `ca_cert_file_paths`，Doris 会使用操作系统默认的 CA 证书。在大多数环境中，不需要手动设置该参数。建议在以下场景中显式配置：

- BE 节点未安装系统 CA 证书，或系统 CA 证书包版本过旧。
- BE 节点运行在精简容器或镜像中，未包含 `ca-certificates` 包。
- BE 节点上的默认 CA 文件路径无效，或 Doris 进程没有该 CA 文件的读取权限。
- 环境中使用了自签名证书、私有 CA，或者会重签 TLS 流量的企业代理或网关。
- 访问 Azure Blob Storage 时出现 `Problem with the SSL CA cert` 或 `curl 77: Problem with the SSL CA cert (path? access rights?)` 等错误。

示例：

```properties
# be.conf
ca_cert_file_paths = /etc/ssl/certs/ca-certificates.crt
```

常见的系统 CA 文件路径包括：

- Debian / Ubuntu：`/etc/ssl/certs/ca-certificates.crt`
- CentOS / RockyLinux：`/etc/pki/ca-trust/extracted/openssl/ca-bundle.trust.crt`

需要在所有可能访问 Azure Blob Storage 的 BE 节点上配置该参数，并确保 Doris 进程对证书文件有读取权限。修改 `be.conf` 后，需要重启对应的 BE 节点使配置生效。

## 参数总览

| 属性名称                           | 曾用名           | 描述                          | 默认值       | 是否必须   |
|--------------------------------|---------------|-----------------------------|-----------|--------|
| azure.account_name             |  | Azure 存储账户名称（Account Name），即在 Azure 门户中创建的存储账户名称。 |           | 是      |
| azure.account_key              |  | Azure Blob 存储的 Account Key  |           | 是      |
| azure.endpoint                 |   | Azure Blob 存储的访问端点，格式通常为 https://<account_name>.blob.core.windows.net |           | 是    |
| fs.azure.support | | 是否启用 Azure Blob 存储 | true | 是 |

- 启用 Azure Blob 存储

  必须显示的配置 `"provider" = "AZURE"` 或 `"fs.azure.support" = "true"` 以表明启用 Azure Blob 存储。

- 获取 `azure.account_name`

  1. 登录 [Azure 门户](https://portal.azure.com)
  2. 打开 **存储帐户 (Storage Accounts)**，选择目标账户
  3. 在 **概述 (Overview)** 页面可看到 **存储帐户名称 (Account Name)**

  ```properties
  "azure.account_name" = "myblobstorage"
  ```

- 获取 `azure.account_key`

  1. 登录 [Azure 门户](https://portal.azure.com)
  2. 打开 **存储帐户 (Storage Accounts)**，选择目标账户
  3. 在左侧导航栏选择 **访问密钥 (Access keys)**
  4. 在 **key1** 或 **key2** 中点击「显示密钥」，复制 **Key 值**

  ```properties
  "azure.account_key" = "EXAMPLE_I_A...=="
  ```
