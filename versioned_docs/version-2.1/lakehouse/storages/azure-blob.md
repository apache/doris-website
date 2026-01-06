---
{
    "title": "Azure Blob",
    "language": "en",
    "description": "Starting from version 3.1.3, Doris supports accessing Azure Blob storage."
}
---

Starting from version 3.1.3, Doris supports accessing Azure Blob storage.

This document describes the parameters required to access Microsoft Azure Blob storage, which apply to the following scenarios:

- Catalog properties
- Table Valued Function properties
- Broker Load properties
- Export properties
- Outfile properties
- Backup / Restore properties

**Azure Blob Storage currently does not support ARM architectures.**

## Parameter Overview

| Property Name                  | Former Name   | Description                     | Default Value | Required |
|--------------------------------|---------------|---------------------------------|---------------|----------|
| azure.account_name             |               | Azure storage account name (Account Name), which is the storage account name created in the Azure portal. |               | Yes      |
| azure.account_key              |               | Account Key for Azure Blob storage |               | Yes      |
| azure.endpoint                 |               | Access endpoint for Azure Blob storage, typically formatted as https://<account_name>.blob.core.windows.net |               | Yes      |
| fs.azure.support               |               | Whether to enable Azure Blob storage | true          | Yes      |

- Enable Azure Blob Storage

  You must explicitly configure `"provider" = "AZURE"` or `"fs.azure.support" = "true"` to indicate that Azure Blob storage is enabled.

- Get `azure.account_name`

  1. Log in to [Azure Portal](https://portal.azure.com)
  2. Open **Storage Accounts** and select the target account
  3. You can see the **Storage Account Name** on the **Overview** page

  ```properties
  "azure.account_name" = "myblobstorage"
  ```

- Get `azure.account_key`

  1. Log in to [Azure Portal](https://portal.azure.com)
  2. Open **Storage Accounts** and select the target account
  3. Select **Access keys** in the left navigation bar
  4. Click "Show key" in **key1** or **key2**, and copy the **Key value**

  ```properties
  "azure.account_key" = "EXAMPLE_I_A...=="
  ```
