---
{
  "title": "Azure Blob",
  "language": "ja",
  "description": "バージョン3.1.3以降、DorisはAzure Blob storageへのアクセスをサポートしています。"
}
---
バージョン3.1.3から、DorisはAzure Blob storageへのアクセスをサポートしています。

この文書では、Microsoft Azure Blob storageにアクセスするために必要なパラメータについて説明します。これらのパラメータは以下のシナリオに適用されます：

- Catalogプロパティ
- Table Valued Functionプロパティ
- Broker Loadプロパティ
- Exportプロパティ
- Outfileプロパティ
- Backup / Restoreプロパティ

**Azure Blob StorageはARMアーキテクチャを現在サポートしていません。**

## パラメータ概要

| プロパティ名                     | 旧名称        | 説明                           | デフォルト値   | 必須     |
|--------------------------------|---------------|---------------------------------|---------------|----------|
| azure.account_name             |               | Azure storageアカウント名（Account Name）。これはAzureポータルで作成されたストレージアカウント名です。 |               | Yes      |
| azure.account_key              |               | Azure Blob storageのAccount Key |               | Yes      |
| azure.endpoint                 |               | Azure Blob storageのアクセスエンドポイント。通常はhttps://<account_name>.blob.core.windows.netの形式です |               | Yes      |
| fs.azure.support               |               | Azure Blob storageを有効にするかどうか | true          | Yes      |

- Azure Blob Storageの有効化

  Azure Blob storageが有効であることを示すために、`"provider" = "AZURE"`または`"fs.azure.support" = "true"`を明示的に設定する必要があります。

- `azure.account_name`の取得

  1. [Azure Portal](https://portal.azure.com)にログインします
  2. **Storage Accounts**を開き、対象のアカウントを選択します
  3. **Overview**ページで**Storage Account Name**を確認できます

  ```properties
  "azure.account_name" = "myblobstorage"
  ```
- `azure.account_key`を取得する

  1. [Azure Portal](https://portal.azure.com)にログインします
  2. **ストレージアカウント**を開き、対象のアカウントを選択します
  3. 左側のナビゲーションバーで**アクセスキー**を選択します
  4. **key1**または**key2**の「キーの表示」をクリックし、**キー値**をコピーします

  ```properties
  "azure.account_key" = "EXAMPLE_I_A...=="
  ```
