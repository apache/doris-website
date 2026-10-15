---
{
    "title": "Azure Blob",
    "language": "ja",
    "description": "Doris はバージョン 3.1.3 以降、Azure Blob ストレージへのアクセスをサポートしています。"
}
---

Doris はバージョン 3.1.3 以降、Azure Blob ストレージへのアクセスをサポートしています。

このドキュメントでは、Microsoft Azure Blob ストレージへのアクセスに必要なパラメータを説明します。これらのパラメータは、次の用途に適用されます。

- Catalog のプロパティ
- テーブル値関数のプロパティ
- Broker Load のプロパティ
- Export のプロパティ
- Outfile のプロパティ
- Backup / Restore のプロパティ

**Azure Blob Storage は現在、ARM アーキテクチャをサポートしていません。**

## HTTPS 接続用の BE CA 証明書の設定

Doris 3.1.5 および 4.0.5 以降、Doris BE が HTTPS 経由で Azure Blob Storage にアクセスする際に、`ca_cert_file_paths` を `be.conf` で明示的に設定できます。

`ca_cert_file_paths` を設定しない場合、Doris はデフォルトでオペレーティングシステムの CA 証明書を使用します。ほとんどの環境では、このパラメータを手動で設定する必要はありません。次の場合に設定してください。

- BE ノードにシステム CA 証明書がないか、インストール済みの CA バンドルが古すぎる場合。
- BE ノードが、`ca-certificates` パッケージを含まない最小構成のコンテナまたはイメージで動作している場合。
- BE ノードのデフォルトの CA ファイルパスが無効な場合、または Doris プロセスに CA ファイルの読み取り権限がない場合。
- 自己署名証明書、プライベート CA、または TLS トラフィックに再署名する企業のプロキシやゲートウェイを使用している場合。
- Azure Blob Storage へのアクセス時に、`Problem with the SSL CA cert` や `curl 77: Problem with the SSL CA cert (path? access rights?)` などのエラーが発生する場合。

> **`ca_cert_file_paths` を使用できないバージョンの場合：** `ca_cert_file_paths` パラメータは Doris 3.1.5 および 4.0.5 以降で使用できます。これより古いバージョンで SSL CA 証明書のエラーが発生する場合は、システム CA 証明書が適切にインストールされ、CA バンドルが `/etc/ssl/certs/ca-certificates.crt` に存在することを確認してください。
>
> - **RHEL / CentOS / RockyLinux:**
>   ```bash
>   yum install -y ca-certificates
>   update-ca-trust
>   ln -s /etc/pki/ca-trust/extracted/openssl/ca-bundle.trust.crt /etc/ssl/certs/ca-certificates.crt
>   ```
> - **Debian / Ubuntu:** `apt-get install -y ca-certificates`
>
> その後、すべての BE ノードを再起動してください。証明書の問題の詳細については、[Lakehouse FAQ - 証明書の問題](../../faq/lakehouse-faq.md#certificate-issues)を参照してください。

設定例：

```properties
# be.conf
ca_cert_file_paths = /etc/ssl/certs/ca-certificates.crt
```

一般的な CA バンドルのパス：

- Debian / Ubuntu: `/etc/ssl/certs/ca-certificates.crt`
- CentOS / RockyLinux: `/etc/pki/ca-trust/extracted/openssl/ca-bundle.trust.crt`

Azure Blob Storage にアクセスする可能性があるすべての BE ノードでこの項目を設定し、証明書ファイルが存在して Doris プロセスから読み取れることを確認してください。`be.conf` を更新した後、変更を適用するために対象の BE ノードを再起動してください。

## パラメータ一覧

| プロパティ名                  | 旧名称   | 説明                     | デフォルト値 | 必須 |
|--------------------------------|---------------|---------------------------------|---------------|----------|
| azure.account_name             |               | Azure ストレージアカウント名（Account Name）。Azure Portal で作成したストレージアカウントの名前です。 |               | はい      |
| azure.account_key              |               | Azure Blob ストレージのアカウントキー（Account Key） |               | はい      |
| azure.endpoint                 |               | Azure Blob ストレージのアクセスエンドポイント。通常は https://<account_name>.blob.core.windows.net の形式です。 |               | はい      |
| fs.azure.support               |               | Azure Blob ストレージを有効にするかどうか | true          | はい      |

- Azure Blob Storage を有効にする

  Azure Blob ストレージが有効であることを示すには、`"provider" = "AZURE"` または `"fs.azure.support" = "true"` を明示的に設定する必要があります。

- `azure.account_name` を取得する

  1. [Azure Portal](https://portal.azure.com) にログインします。
  2. **ストレージ アカウント（Storage Accounts）** を開き、対象のアカウントを選択します。
  3. **概要（Overview）** ページで **ストレージ アカウント名（Storage Account Name）** を確認できます。

  ```properties
  "azure.account_name" = "myblobstorage"
  ```

- `azure.account_key` を取得する

  1. [Azure Portal](https://portal.azure.com) にログインします。
  2. **ストレージ アカウント（Storage Accounts）** を開き、対象のアカウントを選択します。
  3. 左側のナビゲーションバーで **アクセス キー（Access keys）** を選択します。
  4. **key1** または **key2** の「キーの表示（Show key）」をクリックし、**キーの値（Key value）** をコピーします。

  ```properties
  "azure.account_key" = "EXAMPLE_I_A...=="
  ```
