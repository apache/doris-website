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

## Configure BE CA Certificate for HTTPS

Starting from Doris 3.1.5 and 4.0.5, you can explicitly configure `ca_cert_file_paths` in `be.conf` when Doris BE accesses Azure Blob Storage over HTTPS.

By default, if `ca_cert_file_paths` is not configured, Doris uses the operating system's default CA certificates. In most environments, you do not need to set this parameter manually. Configure it in the following cases:

- The BE node is missing system CA certificates, or the installed CA bundle is too old.
- The BE node runs in a minimal container or image that does not include the `ca-certificates` package.
- The default CA file path on the BE node is invalid, or the Doris process does not have read permission on the CA file.
- Your environment uses a self-signed certificate, a private CA, or a corporate proxy or gateway that re-signs TLS traffic.
- You encounter errors such as `Problem with the SSL CA cert` or `curl 77: Problem with the SSL CA cert (path? access rights?)` when accessing Azure Blob Storage.

Example:

```properties
# be.conf
ca_cert_file_paths = /etc/ssl/certs/ca-certificates.crt
```

Common CA bundle paths:

- Debian / Ubuntu: `/etc/ssl/certs/ca-certificates.crt`
- CentOS / RockyLinux: `/etc/pki/ca-trust/extracted/openssl/ca-bundle.trust.crt`

Configure this item on every BE node that may access Azure Blob Storage, and ensure that the certificate file exists and is readable by the Doris process. After updating `be.conf`, restart the affected BE nodes to apply the change.

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
