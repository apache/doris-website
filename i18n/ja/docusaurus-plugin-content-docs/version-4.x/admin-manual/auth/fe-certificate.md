---
{
    "title": "HTTP 通信の保護",
    "language": "ja",
    "description": "Doris FE インターフェースの HTTPS/SSL 暗号化を有効にする方法を説明します。証明書のパス、パスワード、種類、エイリアスなどを設定して FE との通信を保護します。",
    "keywords": [
        "Doris HTTPS",
        "Doris SSL",
        "FE 証明書の設定",
        "enable_https",
        "key_store_path",
        "key_store_password",
        "key_store_type",
        "key_store_alias",
        "JKS キーストア",
        "FE の HTTPS 暗号化",
        "自己署名証明書",
        "CA 証明書"
    ]
}
---

<!-- Knowledge type: Procedure / Configuration parameters -->
<!-- Applicable scenarios: Enabling HTTPS encryption for the FE interface / Certificate deployment -->

この記事では、Doris FE インターフェースで HTTPS（SSL）による暗号化通信を有効にする方法を説明します。SSL キーと証明書を設定することで、クライアントと FE 間の通信の機密性と完全性を確保できます。

:::tip

Doris はバージョン 2.0 以降、SSL キーと証明書の設定をサポートしています。

:::

## 適用シナリオ

| シナリオ | 適用可否 |
| --- | --- |
| FE の HTTP インターフェースの暗号化が必要な本番環境 | 適用できます。CA が発行した証明書を推奨します。 |
| HTTPS の動作を確認する社内テスト環境や開発環境 | 適用できます。自己署名証明書を使用できます。 |
| 外部からのアクセスが不要で、クラスタ内部の通信のみを行う環境 | 任意です。 |

## 前提条件

- Doris バージョン >= 2.0
- 利用可能な SSL 証明書（JKS などのキーストア形式）、または自己署名証明書を生成できる環境
- 証明書の配置と `conf/fe.conf` の変更に必要な、FE ノードのファイルシステムへのアクセス権

## 設定手順の概要

1. SSL 証明書を用意します（購入するか、自己署名証明書を生成します）。
2. FE の指定したパスに証明書をコピーします。
3. FE の設定ファイル `conf/fe.conf` を変更して HTTPS を有効にします。
4. 設定を反映するために FE を再起動します。

## 手順

### ステップ 1：SSL 証明書を用意する

SSL 証明書を購入するか、自己署名証明書を生成します。本番環境では、クライアント側で証明書が信頼されていないという警告を避けるため、CA が発行した証明書を推奨します。

### ステップ 2：証明書ファイルを配置する

SSL 証明書を指定したパスにコピーします。デフォルトのパスは `${DORIS_HOME}/conf/ssl/` です。カスタムパスも指定できます。

### ステップ 3：FE の設定を変更する

FE の設定ファイル `conf/fe.conf` を変更します。以下のパラメータは、購入または生成した SSL 証明書と一致させる必要があります。

- HTTPS を有効にするには `enable_https = true` を設定します。デフォルトは `false` です。
- 証明書のパスを `key_store_path` に設定します。デフォルトは `${DORIS_HOME}/conf/ssl/doris_ssl_certificate.keystore` です。
- 証明書のパスワードを `key_store_password` に設定します。デフォルトは空です。
- 証明書の種類を `key_store_type` に設定します。デフォルトは `JKS` です。
- 証明書のエイリアスを `key_store_alias` に設定します。デフォルトは `doris_ssl_certificate` です。

### ステップ 4：FE を再起動する

設定を変更したら、FE ノードを再起動して設定を反映します。

## 設定パラメータ一覧

<!-- Knowledge type: Configuration parameters -->

| パラメータ | デフォルト | 説明 |
| --- | --- | --- |
| `enable_https` | `false` | FE で HTTPS を有効にするかどうかを指定します。有効にするには `true` に設定します。 |
| `key_store_path` | `${DORIS_HOME}/conf/ssl/doris_ssl_certificate.keystore` | SSL 証明書ファイルのパスです。実際の保存場所と一致させる必要があります。 |
| `key_store_password` | 空 | SSL 証明書のパスワードです。証明書の生成時に設定したパスワードと一致させる必要があります。 |
| `key_store_type` | `JKS` | 証明書の種類です。実際の証明書の種類と一致させる必要があります。 |
| `key_store_alias` | `doris_ssl_certificate` | 証明書のエイリアスです。証明書に定義されたエイリアスと一致させる必要があります。 |

## よくある質問

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting HTTPS enablement failures -->

### Q：HTTPS を有効にすると FE が起動しません。

`key_store_path` が指すファイルが存在しないか、そのパスへのアクセス権が不足しています。証明書のパスが正しいこと、および FE プロセスにそのパスへの読み取り権限があることを確認してください。

### Q：起動時に証明書の読み込みに失敗したというエラーが表示されます。

`key_store_password`、`key_store_type`、または `key_store_alias` が証明書の実際の情報と一致していません。証明書の生成時に使用したパスワード、種類、エイリアスを確認し、`fe.conf` の設定と一致させてください。

### Q：ブラウザに証明書が信頼されていないという警告が表示されます。

自己署名証明書を使用しています。本番環境では CA が発行した証明書に切り替えるか、クライアント側でこの証明書を手動で信頼してください。

### Q：設定を変更しても HTTPS が有効になりません。

FE を再起動していないか、一部の FE ノードでしか設定を変更していない可能性があります。すべての FE ノードで設定が一致していることを確認し、各ノードを再起動してください。
