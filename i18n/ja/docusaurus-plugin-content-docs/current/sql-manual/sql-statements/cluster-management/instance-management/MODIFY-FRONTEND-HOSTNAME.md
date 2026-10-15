---
{
    "title": "MODIFY FRONTEND HOSTNAME",
    "language": "ja",
    "description": "FRONTEND（以下、FE）のプロパティを変更します。現在、このコマンドで変更できるのは FE の HOSTNAME のみです。"
}
---

## 説明

FRONTEND（以下、FE）のプロパティを変更します。現在、このコマンドで変更できるのは FE の HOSTNAME のみです。クラスター内の FE インスタンスが稼働するホストのホスト名を変更する必要がある場合、このコマンドでクラスターに登録されている FE のホスト名を変更し、FE が引き続き正常に動作できるようにします。

このコマンドは、DORIS クラスターを FQDN を使用するデプロイメントに切り替える場合にのみ使用します。FQDN デプロイメントの詳細は、「FQDN」の章を参照してください。

## 構文

```sql
ALTER SYSTEM MODIFY FRONTEND "<frontend_hostname_port>" HOSTNAME "<frontend_new_hostname>"
```
## 必須パラメータ

**<frontend_hostname_port>**

> ホスト名を変更する FE について、クラスターに登録されているホスト名と編集ログ用ポート。SHOW FRONTENDS コマンドを使用すると、クラスター内のすべての FE の情報を確認できます。詳しい使い方は「SHOW FRONTENDS」の章を参照してください。

**<frontend_new_hostname>**

> FE の新しいホスト名。

## アクセス制御要件

この SQL コマンドを実行するユーザーには、少なくとも NODE_PRIV 権限が必要です。

## 例

クラスター内の FE インスタンスのホスト名を 10.10.10.1 から 172.22.0.1 に変更します。

```sql
ALTER SYSTEM
MODIFY FRONTEND "10.10.10.1:9010"
HOSTNAME "172.22.0.1"
```
