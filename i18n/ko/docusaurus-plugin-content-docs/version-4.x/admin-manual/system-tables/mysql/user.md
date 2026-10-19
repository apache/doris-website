---
{
    "title": "user",
    "language": "ko",
    "description": "모든 사용자 정보를 조회합니다."
}
---

## 개요 {#overview}

모든 사용자 정보를 조회합니다.

## 데이터베이스 {#database}


`mysql`


## 테이블 정보 {#table-information}

| 컬럼 이름                              | 타입           | 설명                                                |
| -------------------------------------- | -------------- | --------------------------------------------------- |
| host                                   | character(255) | 사용자의 접속이 허용된 호스트.                       |
| user                                   | char(32)       | 사용자 이름.                                        |
| node_priv                              | char(1)        | 사용자의 Node 권한 보유 여부.                        |
| admin_priv                             | char(1)        | 사용자의 Admin 권한 보유 여부.                       |
| grant_priv                             | char(1)        | 사용자의 Grant 권한 보유 여부.                       |
| select_priv                            | char(1)        | 사용자의 Select 권한 보유 여부.                      |
| load_priv                              | char(1)        | 사용자의 Load 권한 보유 여부.                        |
| alter_priv                             | char(1)        | 사용자의 Alter 권한 보유 여부.                       |
| create_priv                            | char(1)        | 사용자의 Create 권한 보유 여부.                      |
| drop_priv                              | char(1)        | 사용자의 Drop 권한 보유 여부.                        |
| usage_priv                             | char(1)        | 사용자의 Usage 권한 보유 여부.                       |
| show_view_priv                         | char(1)        | 사용자의 Show View 권한 보유 여부.                   |
| cluster_usage_priv                     | char(1)        | 사용자의 Cluster usage 권한 보유 여부.               |
| stage_usage_priv                       | char(1)        | 사용자의 Stage usage 권한 보유 여부.                 |
| ssl_type                               | char(9)        | 항상 비어 있으며, MySQL 호환성만을 위해 제공됩니다.  |
| ssl_cipher                             | varchar(65533) | 항상 비어 있으며, MySQL 호환성만을 위해 제공됩니다.  |
| x509_issuer                            | varchar(65533) | 항상 비어 있으며, MySQL 호환성만을 위해 제공됩니다.  |
| x509_subject                           | varchar(65533) | 항상 비어 있으며, MySQL 호환성만을 위해 제공됩니다.  |
| max_questions                          | bigint         | 항상 0이며, MySQL 호환성만을 위해 제공됩니다.        |
| max_updates                            | bigint         | 항상 0이며, MySQL 호환성만을 위해 제공됩니다.        |
| max_connections                        | bigint         | 항상 0이며, MySQL 호환성만을 위해 제공됩니다.        |
| max_user_connections                   | bigint         | 허용되는 최대 연결 수.                              |
| plugin                                 | char(64)       | 항상 비어 있으며, MySQL 호환성만을 위해 제공됩니다.  |
| authentication_string                  | varchar(65533) | 항상 비어 있으며, MySQL 호환성만을 위해 제공됩니다.  |
| password_policy.expiration_seconds     | varchar(32)    | 비밀번호 만료 시간.                                 |
| password_policy.password_creation_time | varchar(32)    | 비밀번호 생성 시간.                                 |
| password_policy.history_num            | varchar(32)    | 이전 비밀번호 수.                                   |
| password_policy.history_passwords      | varchar(65533) | 이전 비밀번호.                                      |
| password_policy.num_failed_login       | varchar(32)    | 허용되는 연속 로그인 실패 횟수.                     |
| password_policy.password_lock_seconds  | varchar(32)    | 잠금이 발생한 후 비밀번호가 잠겨 있는 시간.          |
| password_policy.failed_login_counter   | varchar(32)    | 로그인 실패 횟수.                                   |
| password_policy.lock_time              | varchar(32)    |                                                     |
