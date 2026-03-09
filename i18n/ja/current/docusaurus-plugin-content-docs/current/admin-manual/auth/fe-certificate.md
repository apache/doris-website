---
{
  "title": "FE SSL証明書",
  "language": "ja",
  "description": "証明書の設定"
}
---
# Certificate Configuration

Certificate Configuration

Doris FEインターフェースでSSL機能を有効にするには、以下のようにキー証明書を設定する必要があります：

1.SSL証明書を購入するか、自己署名証明書を生成してください。本番環境ではCA証明書を使用することを推奨します

2.SSL証明書を指定されたパスにコピーしてください。デフォルトパスは`${DORIS_HOME}/conf/ssl/`で、ユーザーは独自のパスを指定することもできます

3.FE設定ファイル`conf/fe.conf`を変更し、以下のパラメータが購入または生成したSSL証明書と一致していることを確認してください
    https機能を有効にするには`enable_https = true`を設定してください。デフォルトは`false`です
    証明書パス`key_store_path`を設定してください。デフォルトは`${DORIS_HOME}/conf/ssl/doris_ssl_certificate.keystore`です
    証明書パスワード`key_store_password`を設定してください。デフォルトはnullです
    証明書タイプ`key_store_type`を設定してください。デフォルトは`JKS`です
    証明書エイリアス`key_store_alias`を設定してください。デフォルトは`doris_ssl_certificate`です
