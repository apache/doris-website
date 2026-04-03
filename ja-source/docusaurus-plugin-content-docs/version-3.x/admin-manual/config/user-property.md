---
{
  "title": "ユーザープロパティ",
  "language": "ja",
  "description": "この文書では主にUserレベルの関連設定項目について紹介します。"
}
---
# ユーザー設定項目

この文書では、主にユーザーレベルでの関連設定項目について説明します。ユーザーレベルの設定は主に単一ユーザーに対して有効です。各ユーザーは独自のユーザープロパティを設定できます。互いに影響し合うことはありません。

## 設定項目の表示

FEが開始された後、MySQLクライアントで次のコマンドを使用してユーザー設定項目を表示します：

`SHOW PROPERTY [FOR user] [LIKE key pattern]`

具体的な構文は、コマンド `help show property;` で確認できます。

## 設定項目の設定

FEが開始された後、MySQLクライアントで次のコマンドを使用してユーザー設定項目を変更します：

`SET PROPERTY [FOR'user'] 'key' = 'value' [,'key' ='value']`

具体的な構文は、コマンド `help set property;` で確認できます。

ユーザーレベルの設定項目は、指定されたユーザーに対してのみ有効になり、他のユーザーの設定には影響しません。

## 適用例

1. ユーザーBillieのmax_user_connectionsを変更する

    `SHOW PROPERTY FOR 'Billie' LIKE '%max_user_connections%';` を使用して、Billieユーザーの現在の最大リンク数が100であることを確認します。

    `SET PROPERTY FOR 'Billie' 'max_user_connections' = '200';` を使用して、Billieユーザーの現在の最大接続数を200に変更します。

## 設定項目一覧

### max_user_connections

    ユーザー接続の最大数、デフォルト値は100です。通常、この パラメータは、同時クエリ数がデフォルト値を超える場合を除いて変更する必要はありません。

### max_query_instances

    ユーザーが特定の時点で使用できるインスタンスの最大数、デフォルト値は-1です。負の数はdefault_max_query_instances設定を使用することを意味します。

### resource

### quota

### default_load_cluster

### load_cluster
