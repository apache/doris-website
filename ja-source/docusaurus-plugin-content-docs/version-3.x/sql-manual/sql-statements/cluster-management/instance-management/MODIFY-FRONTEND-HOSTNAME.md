---
{
  "title": "FRONTEND HOSTNAME の変更",
  "description": "FRONTEND（以下FEと呼ぶ）のプロパティを変更します。現在、このコマンドはFEのHOSTNAMEのみを変更できます。",
  "language": "ja"
}
---
## 説明

FRONTEND（以下、FEと呼ぶ）のプロパティを変更します。現在、このコマンドはFEのHOSTNAMEのみを変更することができます。クラスター内の特定のFEインスタンスが実行されているホストのホスト名を変更する必要がある場合、このコマンドを使用して、このFEがクラスターに登録されているホスト名を変更し、正常に動作を継続できるようにします。

このコマンドは、DORISクラスターをFQDNデプロイメントに変換する場合にのみ使用されます。FQDNデプロイメントの詳細については、「FQDN」の章を参照してください。

## 構文

```sql
ALTER SYSTEM MODIFY FRONTEND "<frontend_hostname_port>" HOSTNAME "<frontend_new_hostname>"
```
## 必須パラメータ

**<frontend_hostname_port>**

> ホスト名を変更する必要があるFEによって登録されたホスト名とedit logポートです。SHOW FRONTENDSコマンドを使用して、クラスタ内のすべてのFEに関する情報を確認できます。詳細な使用方法については、「SHOW FRONTENDS」の章を参照してください。

**<frontend_new_hostname>**

> FEの新しいホスト名です。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくともNOD_PRIV権限を持っている必要があります。

## 例

クラスタ内のFEインスタンスのホスト名を10.10.10.1から172.22.0.1に変更します：

```sql
ALTER SYSTEM
MODIFY FRONTEND "10.10.10.1:9010"
HOSTNAME "172.22.0.1"
```
