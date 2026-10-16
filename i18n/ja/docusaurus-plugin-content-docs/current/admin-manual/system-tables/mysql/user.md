---
{
    "title": "user",
    "language": "ja",
    "description": "すべてのユーザー情報を表示します。"
}
---

## 概要

すべてのユーザー情報を表示します。

## データベース


`mysql`


## テーブル情報

| カラム名                            | 型           | 説明                                         |
| -------------------------------------- | -------------- | --------------------------------------------------- |
| host                                   | character(255) | ユーザーの接続を許可するホスト。 |
| user                                   | char(32)       | ユーザー名。 |
| node_priv                              | char(1)        | ユーザーに Node 権限があるかどうか。 |
| admin_priv                             | char(1)        | ユーザーに Admin 権限があるかどうか。 |
| grant_priv                             | char(1)        | ユーザーに Grant 権限があるかどうか。 |
| select_priv                            | char(1)        | ユーザーに Select 権限があるかどうか。 |
| load_priv                              | char(1)        | ユーザーに Load 権限があるかどうか。 |
| alter_priv                             | char(1)        | ユーザーに Alter 権限があるかどうか。 |
| create_priv                            | char(1)        | ユーザーに Create 権限があるかどうか。 |
| drop_priv                              | char(1)        | ユーザーに Drop 権限があるかどうか。 |
| usage_priv                             | char(1)        | ユーザーに Usage 権限があるかどうか。 |
| show_view_priv                         | char(1)        | ユーザーに Show View 権限があるかどうか。 |
| cluster_usage_priv                     | char(1)        | ユーザーに Cluster Usage 権限があるかどうか。 |
| stage_usage_priv                       | char(1)        | ユーザーに Stage Usage 権限があるかどうか。 |
| ssl_type                               | char(9)        | 常に空です。MySQL との互換性のためだけに存在します。 |
| ssl_cipher                             | varchar(65533) | 常に空です。MySQL との互換性のためだけに存在します。 |
| x509_issuer                            | varchar(65533) | 常に空です。MySQL との互換性のためだけに存在します。 |
| x509_subject                           | varchar(65533) | 常に空です。MySQL との互換性のためだけに存在します。 |
| max_questions                          | bigint         | 常に 0 です。MySQL との互換性のためだけに存在します。 |
| max_updates                            | bigint         | 常に 0 です。MySQL との互換性のためだけに存在します。 |
| max_connections                        | bigint         | 常に 0 です。MySQL との互換性のためだけに存在します。 |
| max_user_connections                   | bigint         | 許可される最大接続数。 |
| plugin                                 | char(64)       | 常に空です。MySQL との互換性のためだけに存在します。 |
| authentication_string                  | varchar(65533) | 常に空です。MySQL との互換性のためだけに存在します。 |
| password_policy.expiration_seconds     | varchar(32)    | パスワードの有効期限。 |
| password_policy.password_creation_time | varchar(32)    | パスワードの作成時刻。 |
| password_policy.history_num            | varchar(32)    | パスワード履歴の件数。 |
| password_policy.history_passwords      | varchar(65533) | パスワード履歴。 |
| password_policy.num_failed_login       | varchar(32)    | 許可される連続ログイン失敗回数。 |
| password_policy.password_lock_seconds  | varchar(32)    | ロックが発動した後のパスワードのロック時間。 |
| password_policy.failed_login_counter   | varchar(32)    | ログイン失敗回数。 |
| password_policy.lock_time              | varchar(32)    |  |
