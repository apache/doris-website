---
{
  "title": "Azure Blob",
  "description": "バージョン3.1.3以降、DorisはAzure Blob storageへのアクセスをサポートしています。",
  "language": "ja"
}
---
バージョン3.1.3以降、DorisはAzure Blobストレージへのアクセスをサポートしています。

この文書では、Microsoft Azure Blobストレージにアクセスするために必要なパラメータについて説明します。これらは以下のシナリオに適用されます：

- カタログプロパティ
- table Valued Functionプロパティ
- Broker Loadプロパティ
- Exportプロパティ
- Outfileプロパティ
- Backup / Restoreプロパティ

**Azure Blob Storageは現在ARMアーキテクチャをサポートしていません。**

## パラメータ概要

| Property Name                  | 旧称   | デスクリプション                     | デフォルト値 | Required |
|--------------------------------|---------------|---------------------------------|---------------|----------|
| azure.account_name             |               | Azureストレージアカウント名（Account Name）。Azureポータルで作成されたストレージアカウント名です。 |               | Yes      |
| azure.account_key              |               | Azure BlobストレージのAccount Key |               | Yes      |
| azure.endpoint                 |               | Azure Blobストレージのアクセスエンドポイント。通常はhttps://<account_name>.blob.core.windows.netの形式です |               | Yes      |
| fs.azure.support               |               | Azure Blobストレージを有効にするかどうか | true          | Yes      |

- Azure Blob Storageを有効にする

  Azure Blobストレージが有効であることを示すために、`"provider" = "AZURE"`または`"fs.azure.support" = "true"`を明示的に設定する必要があります。

- `azure.account_name`を取得する

  1. [Azure Portal](https://portal.azure.com)にログインします
  2. **Storage Accounts**を開き、対象のアカウントを選択します
  3. **概要**ページで**Storage Account Name**を確認できます

  ```properties
  "azure.account_name" = "myblobstorage"
  ```
- `azure.account_key`を取得する

  1. [Azure Portal](https://portal.azure.com)にログインする
  2. **Storage Accounts**を開き、対象のアカウントを選択する
  3. 左側のナビゲーションバーで**Access keys**を選択する
  4. **key1**または**key2**の「Show key」をクリックし、**Key value**をコピーする

  ```properties
  "azure.account_key" = "EXAMPLE_I_A...=="
  ```
