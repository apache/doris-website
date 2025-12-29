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
