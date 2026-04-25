---
{
    "title": "user",
    "language": "zh-CN",
    "description": "查看所有用户信息"
}
---

## 概述

查看所有用户信息

## 所属数据库


`mysql`


## 表信息

| 列名                                   | 类型           | 说明                       |
| :------------------------------------- | :------------- | :------------------------- |
| host                                   | character(255) | 用户允许连接的 Host        |
| user                                   | char(32)       | 用户名                     |
| node_priv                              | char(1)        | 是否有 Node 权限           |
| admin_priv                             | char(1)        | 是否有 Admin 权限          |
| grant_priv                             | char(1)        | 是否有 Grant 权限          |
| select_priv                            | char(1)        | 是否有 Select 权限         |
| load_priv                              | char(1)        | 是否有用 Load 权限         |
| alter_priv                             | char(1)        | 是否有 Alter 权限          |
| create_priv                            | char(1)        | 是否有 Create 权限         |
| drop_priv                              | char(1)        | 是否有 Drop 权限           |
| usage_priv                             | char(1)        | 是否有 Usage 权限          |
| show_view_priv                         | char(1)        | 是否有 Show View 权限      |
| cluster_usage_priv                     | char(1)        | 是否有 Cluster 使用权限    |
| stage_usage_priv                       | char(1)        | 是否有 Stage 使用权限      |
| ssl_type                               | char(9)        | 永远为空，仅用于兼容 MySQL |
| ssl_cipher                             | varchar(65533) | 永远为空，仅用于兼容 MySQL |
| x509_issuer                            | varchar(65533) | 永远为空，仅用于兼容 MySQL |
| x509_subject                           | varchar(65533) | 永远为空，仅用于兼容 MySQL |
| max_questions                          | bigint         | 永远为 0，仅用于兼容 MySQL |
| max_updates                            | bigint         | 永远为 0，仅用于兼容 MySQL |
| max_connections                        | bigint         | 永远为 0，仅用于兼容 MySQL |
| max_user_connections                   | bigint         | 允许的最大连接数量         |
| plugin                                 | char(64)       | 永远为空，仅用于兼容 MySQL |
| authentication_string                  | varchar(65533) | 永远为空，仅用于兼容 MySQL |
| password_policy.expiration_seconds     | varchar(32)    | 密码过期时间               |
| password_policy.password_creation_time | varchar(32)    | 密码创建时间               |
| password_policy.history_num            | varchar(32)    | 历史密码数量               |
| password_policy.history_passwords      | varchar(65533) | 历史密码                   |
| password_policy.num_failed_login       | varchar(32)    | 允许连续登录失败次数       |
| password_policy.password_lock_seconds  | varchar(32)    | 触发锁定后的密码锁定时间   |
| password_policy.failed_login_counter   | varchar(32)    | 登录失败计数               |
| password_policy.lock_time              | varchar(32)    | 当前已锁定时间             |