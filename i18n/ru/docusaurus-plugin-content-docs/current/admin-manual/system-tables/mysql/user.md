---
{
    "title": "user",
    "language": "ru",
    "description": "Просмотр информации обо всех пользователях."
}
---

## Обзор {#overview}

Просмотр информации обо всех пользователях.

## База данных {#database}


`mysql`


## Информация о таблице {#table-information}

| Имя столбца                            | Тип            | Описание                                            |
| -------------------------------------- | -------------- | --------------------------------------------------- |
| host                                   | character(255) | Хост, с которого пользователю разрешено подключаться. |
| user                                   | char(32)       | Имя пользователя.                                   |
| node_priv                              | char(1)        | Наличие у пользователя привилегии Node.              |
| admin_priv                             | char(1)        | Наличие у пользователя привилегии Admin.             |
| grant_priv                             | char(1)        | Наличие у пользователя привилегии Grant.             |
| select_priv                            | char(1)        | Наличие у пользователя привилегии Select.            |
| load_priv                              | char(1)        | Наличие у пользователя привилегии Load.              |
| alter_priv                             | char(1)        | Наличие у пользователя привилегии Alter.             |
| create_priv                            | char(1)        | Наличие у пользователя привилегии Create.            |
| drop_priv                              | char(1)        | Наличие у пользователя привилегии Drop.              |
| usage_priv                             | char(1)        | Наличие у пользователя привилегии Usage.             |
| show_view_priv                         | char(1)        | Наличие у пользователя привилегии Show View.         |
| cluster_usage_priv                     | char(1)        | Наличие у пользователя привилегии Cluster usage.     |
| stage_usage_priv                       | char(1)        | Наличие у пользователя привилегии Stage usage.       |
| ssl_type                               | char(9)        | Всегда пустое значение, только для совместимости с MySQL. |
| ssl_cipher                             | varchar(65533) | Всегда пустое значение, только для совместимости с MySQL. |
| x509_issuer                            | varchar(65533) | Всегда пустое значение, только для совместимости с MySQL. |
| x509_subject                           | varchar(65533) | Всегда пустое значение, только для совместимости с MySQL. |
| max_questions                          | bigint         | Всегда 0, только для совместимости с MySQL.          |
| max_updates                            | bigint         | Всегда 0, только для совместимости с MySQL.          |
| max_connections                        | bigint         | Всегда 0, только для совместимости с MySQL.          |
| max_user_connections                   | bigint         | Максимальное количество разрешённых подключений.    |
| plugin                                 | char(64)       | Всегда пустое значение, только для совместимости с MySQL. |
| authentication_string                  | varchar(65533) | Всегда пустое значение, только для совместимости с MySQL. |
| password_policy.expiration_seconds     | varchar(32)    | Время истечения срока действия пароля.              |
| password_policy.password_creation_time | varchar(32)    | Время создания пароля.                              |
| password_policy.history_num            | varchar(32)    | Количество предыдущих паролей.                      |
| password_policy.history_passwords      | varchar(65533) | Предыдущие пароли.                                  |
| password_policy.num_failed_login       | varchar(32)    | Допустимое количество неудачных попыток входа подряд. |
| password_policy.password_lock_seconds  | varchar(32)    | Длительность блокировки пароля после её срабатывания. |
| password_policy.failed_login_counter   | varchar(32)    | Количество неудачных попыток входа.                 |
| password_policy.lock_time              | varchar(32)    |                                                     |
