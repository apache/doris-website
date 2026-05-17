---
{
    "title": "user",
    "language": "en",
    "description": "View all user information."
}
---

## Overview

View all user information.

## Database


`mysql`


## Table Information

| Column Name                            | Type           | Description                                         |
| -------------------------------------- | -------------- | --------------------------------------------------- |
| host                                   | character(255) | The host from which the user is allowed to connect. |
| user                                   | char(32)       | Username.                                           |
| node_priv                              | char(1)        | Whether the user has Node privileges.               |
| admin_priv                             | char(1)        | Whether the user has Admin privileges.              |
| grant_priv                             | char(1)        | Whether the user has Grant privileges.              |
| select_priv                            | char(1)        | Whether the user has Select privileges.             |
| load_priv                              | char(1)        | Whether the user has Load privileges.               |
| alter_priv                             | char(1)        | Whether the user has Alter privileges.              |
| create_priv                            | char(1)        | Whether the user has Create privileges.             |
| drop_priv                              | char(1)        | Whether the user has Drop privileges.               |
| usage_priv                             | char(1)        | Whether the user has Usage privileges.              |
| show_view_priv                         | char(1)        | Whether the user has Show View privileges.          |
| cluster_usage_priv                     | char(1)        | Whether the user has Cluster usage privileges.      |
| stage_usage_priv                       | char(1)        | Whether the user has Stage usage privileges.        |
| ssl_type                               | char(9)        | Always empty, for MySQL compatibility only.         |
| ssl_cipher                             | varchar(65533) | Always empty, for MySQL compatibility only.         |
| x509_issuer                            | varchar(65533) | Always empty, for MySQL compatibility only.         |
| x509_subject                           | varchar(65533) | Always empty, for MySQL compatibility only.         |
| max_questions                          | bigint         | Always 0, for MySQL compatibility only.             |
| max_updates                            | bigint         | Always 0, for MySQL compatibility only.             |
| max_connections                        | bigint         | Always 0, for MySQL compatibility only.             |
| max_user_connections                   | bigint         | The maximum number of allowed connections.          |
| plugin                                 | char(64)       | Always empty, for MySQL compatibility only.         |
| authentication_string                  | varchar(65533) | Always empty, for MySQL compatibility only.         |
| password_policy.expiration_seconds     | varchar(32)    | Password expiration time.                           |
| password_policy.password_creation_time | varchar(32)    | Password creation time.                             |
| password_policy.history_num            | varchar(32)    | Number of historical passwords.                     |
| password_policy.history_passwords      | varchar(65533) | Historical passwords.                               |
| password_policy.num_failed_login       | varchar(32)    | Allowed number of consecutive login failures.       |
| password_policy.password_lock_seconds  | varchar(32)    | Password lock time after triggering lock.           |
| password_policy.failed_login_counter   | varchar(32)    | Login failure count.                                |
| password_policy.lock_time              | varchar(32)    |                                                     |

