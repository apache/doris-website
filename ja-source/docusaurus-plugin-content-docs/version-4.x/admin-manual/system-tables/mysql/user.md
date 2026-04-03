---
{
  "title": "ユーザー",
  "language": "ja",
  "description": "すべてのユーザー情報を表示します。"
}
---
## 概要

全てのユーザー情報を表示します。

## Database

`mysql`

## table Information

| Column Name                            | タイプ           | 詳細                                         |
| -------------------------------------- | -------------- | --------------------------------------------------- |
| host                                   | character(255) | ユーザーが接続を許可されているホスト。                           |
| user                                   | char(32)       | ユーザー名。                                            |
| node_priv                              | char(1)        | ユーザーがNode権限を持っているかどうか。                        |
| admin_priv                             | char(1)        | ユーザーがAdmin権限を持っているかどうか。                       |
| grant_priv                             | char(1)        | ユーザーがGrant権限を持っているかどうか。                       |
| select_priv                            | char(1)        | ユーザーがSelect権限を持っているかどうか。                      |
| load_priv                              | char(1)        | ユーザーがLoad権限を持っているかどうか。                        |
| alter_priv                             | char(1)        | ユーザーがAlter権限を持っているかどうか。                       |
| create_priv                            | char(1)        | ユーザーがCreate権限を持っているかどうか。                      |
| drop_priv                              | char(1)        | ユーザーがDrop権限を持っているかどうか。                        |
| usage_priv                             | char(1)        | ユーザーがUsage権限を持っているかどうか。                       |
| show_view_priv                         | char(1)        | ユーザーがShow View権限を持っているかどうか。                   |
| cluster_usage_priv                     | char(1)        | ユーザーがクラスター usage権限を持っているかどうか。               |
| stage_usage_priv                       | char(1)        | ユーザーがStage usage権限を持っているかどうか。                 |
| ssl_type                               | char(9)        | 常に空、MySQL互換性のためのみ。                              |
| ssl_cipher                             | varchar(65533) | 常に空、MySQL互換性のためのみ。                              |
| x509_issuer                            | varchar(65533) | 常に空、MySQL互換性のためのみ。                              |
| x509_subject                           | varchar(65533) | 常に空、MySQL互換性のためのみ。                              |
| max_questions                          | bigint         | 常に0、MySQL互換性のためのみ。                               |
| max_updates                            | bigint         | 常に0、MySQL互換性のためのみ。                               |
| max_connections                        | bigint         | 常に0、MySQL互換性のためのみ。                               |
| max_user_connections                   | bigint         | 許可される接続数の最大値。                                   |
| plugin                                 | char(64)       | 常に空、MySQL互換性のためのみ。                              |
| authentication_string                  | varchar(65533) | 常に空、MySQL互換性のためのみ。                              |
| password_policy.expiration_seconds     | varchar(32)    | パスワード有効期限。                                      |
| password_policy.password_creation_time | varchar(32)    | パスワード作成時刻。                                      |
| password_policy.history_num            | varchar(32)    | 履歴パスワード数。                                       |
| password_policy.history_passwords      | varchar(65533) | 履歴パスワード。                                        |
| password_policy.num_failed_login       | varchar(32)    | 許可される連続ログイン失敗回数。                              |
| password_policy.password_lock_seconds  | varchar(32)    | ロック発動後のパスワードロック時間。                            |
| password_policy.failed_login_counter   | varchar(32)    | ログイン失敗回数。                                       |
| password_policy.lock_time              | varchar(32)    |                                                     |
