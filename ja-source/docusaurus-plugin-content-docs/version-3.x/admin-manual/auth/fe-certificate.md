---
{
  "title": "FE SSL証明書",
  "language": "ja",
  "description": "証明書設定"
}
---
# Certificate 設定

Certificate 設定

Doris FEインターフェースでSSL機能を有効にするには、以下のようにキー証明書を設定する必要があります：

1.SSL証明書を購入するか、自己署名SSL証明書を生成します。本番環境ではCA証明書の使用を推奨します

2.SSL証明書を指定されたパスにコピーします。デフォルトパスは`${DORIS_HOME}/conf/ssl/`で、ユーザーは独自のパスを指定することもできます

3.FE設定ファイル`conf/fe.conf`を変更し、以下のパラメータが購入または生成したSSL証明書と一致していることを確認してください
    `enable_https = true`を設定してhttps機能を有効にします。デフォルトは`false`です
    証明書パス`key_store_path`を設定します。デフォルトは`${DORIS_HOME}/conf/ssl/doris_ssl_certificate.keystore`です
    証明書パスワード`key_store_password`を設定します。デフォルトはnullです
    証明書タイプ`key_store_type`を設定します。デフォルトは`JKS`です
    証明書エイリアス`key_store_alias`を設定します。デフォルトは`doris_ssl_certificate`です
