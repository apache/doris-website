---
{
  "title": "Azure Blob",
  "language": "ja",
  "description": "バージョン3.1.3以降、DorisはAzure Blob storageへのアクセスをサポートしています。"
}
---
バージョン3.1.3から、DorisはAzure Blobストレージへのアクセスをサポートしています。

このドキュメントでは、Microsoft Azure Blobストレージにアクセスするために必要なパラメータについて説明します。これらのパラメータは以下のシナリオに適用されます：

- カタログプロパティ
- table Valued Functionプロパティ
- Broker Loadプロパティ
- Exportプロパティ
- Outfileプロパティ
- Backup / Restoreプロパティ

**Azure Blob StorageはARMアーキテクチャを現在サポートしていません。**

## パラメータ概要

| プロパティ名                   | 旧名          | 説明                            | デフォルト値  | 必須     |
|--------------------------------|---------------|---------------------------------|---------------|----------|
| azure.account_name             |               | Azureストレージアカウント名（Account Name）。これはAzureポータルで作成されたストレージアカウント名です。 |               | Yes      |
| azure.account_key              |               | Azure BlobストレージのAccount Key |               | Yes      |
| azure.endpoint                 |               | Azure Blobストレージのアクセスエンドポイント。通常、https://<account_name>.blob.core.windows.net の形式で記述されます |               | Yes      |
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
  2. **ストレージアカウント**を開き、対象のアカウントを選択する
  3. 左側のナビゲーションバーで**アクセスキー**を選択する
  4. **key1**または**key2**で「キーの表示」をクリックし、**キー値**をコピーする

  ```properties
  "azure.account_key" = "EXAMPLE_I_A...=="
  ```
