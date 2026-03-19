---
{
  "title": "ユーザープロパティ",
  "language": "ja",
  "description": "この文書は主にユーザーレベルでの関連する設定項目について紹介します。"
}
---
# User設定項目

このドキュメントでは、主にUserレベルでの関連する設定項目について紹介します。Userレベルの設定は、主に単一ユーザーに対して有効です。各ユーザーは独自のUserプロパティを設定でき、互いに影響しません。

## 設定項目の表示

FEが開始された後、MySQLクライアント上で、以下のコマンドを使用してUser設定項目を表示します：

`SHOW PROPERTY [FOR user] [LIKE key pattern]`

具体的な構文は、以下のコマンドで確認できます：`help show property;`

## 設定項目の設定

FEが開始された後、MySQLクライアント上で、以下のコマンドでUser設定項目を変更します：

`SET PROPERTY [FOR'user'] 'key' = 'value' [,'key' ='value']`

具体的な構文は、以下のコマンドで確認できます：`help set property;`

Userレベル設定項目は指定されたユーザーに対してのみ有効になり、他のユーザーの設定には影響しません。

## 適用例

1. ユーザーBillieのmax_user_connectionsを変更

    `SHOW PROPERTY FOR 'Billie' LIKE '%max_user_connections%';`を使用して、Billieユーザーの現在の最大リンク数が100であることを確認します。

    `SET PROPERTY FOR 'Billie' 'max_user_connections' = '200';`を使用して、Billieユーザーの現在の最大接続数を200に変更します。

## 設定項目一覧

### max_user_connections

    ユーザー接続の最大数、デフォルト値は100です。一般的に、このパラメータは同時クエリ数がデフォルト値を超えない限り変更する必要はありません。

### max_query_instances

    ユーザーが特定の時点で使用できるインスタンスの最大数、デフォルト値は-1、負の数はdefault_max_query_instancesの設定を使用することを意味します。

### resource

### quota

### default_load_cluster

### load_cluster
