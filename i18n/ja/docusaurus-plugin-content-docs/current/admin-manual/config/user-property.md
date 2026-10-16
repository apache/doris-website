---
{
    "title": "ユーザープロパティ",
    "language": "ja",
    "description": "このドキュメントでは、ユーザーレベルの設定項目について説明します。"
}
---

# ユーザー設定項目 {#user-configuration-item}

このドキュメントでは、ユーザーレベルの設定項目について説明します。ユーザーレベルの設定は、主に個々のユーザーに適用されます。各ユーザーは自身のプロパティを設定でき、ほかのユーザーの設定には影響しません。

## 設定項目の確認 {#view-configuration-items}

FE の起動後、MySQL クライアントで次のコマンドを使用してユーザーの設定項目を確認します。

`SHOW PROPERTY [FOR user] [LIKE key pattern]`

詳しい構文は、`help show property;` コマンドで確認できます。

## 設定項目の変更 {#set-configuration-items}

FE の起動後、MySQL クライアントで次のコマンドを使用してユーザーの設定項目を変更します。

`SET PROPERTY [FOR'user'] 'key' = 'value' [,'key' ='value']`

詳しい構文は、`help set property;` コマンドで確認できます。

ユーザーレベルの設定項目は、指定したユーザーにのみ適用され、ほかのユーザーの設定には影響しません。

## 使用例 {#application-examples}

1. ユーザー Billie の max_user_connections を変更する

    `SHOW PROPERTY FOR 'Billie' LIKE '%max_user_connections%';` を使用して、Billie の現在の最大接続数が 100 であることを確認します。

    `SET PROPERTY FOR 'Billie' 'max_user_connections' = '200';` を使用して、Billie の最大接続数を 200 に変更します。

## 設定項目一覧 {#configuration-item-list}

### max_user_connections

    The maximum number of user connections, the default value is 100 In general, this parameter does not need to be changed unless the number of concurrent queries exceeds the default value.

### max_query_instances

    The maximum number of instances that the user can use at a certain point in time, The default value is -1, negative number means use default_max_query_instances config.

### resource

### quota

### default_load_cluster

### load_cluster
