---
{
    "title": "CREATE USER",
    "language": "ru",
    "description": "Оператор CREATE USER используется для создания пользователя Doris."
}
---

## Описание {#description}

Оператор `CREATE USER` используется для создания пользователя Doris.

## Синтаксис {#syntax}

```sql
CREATE USER [IF EXISTS] <user_identity> [IDENTIFIED BY <password>]
[DEFAULT ROLE <role_name>]
[<password_policy>]
[<comment>]  

password_policy:
    1. PASSWORD_HISTORY { <n> | DEFAULT }
    2. PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}
    3. FAILED_LOGIN_ATTEMPTS <n>
    4. PASSWORD_LOCK_TIME { UNBOUNDED | <n> { DAY | HOUR | SECOND }}
```
## Обязательные параметры {#required-parameters}

**1. `<user_identity>`**

> Идентификатор user_identity однозначно определяет пользователя. Синтаксис: 'user_name'@'host'.
> `user_identity` состоит из двух частей: user_name и host, где username обозначает имя пользователя. Часть host определяет адрес хоста, с которого подключается клиент. В части host можно использовать % для сопоставления по шаблону. Если host не указан, по умолчанию используется '%', что позволяет пользователю подключаться к Doris с любого хоста.
> Часть host также можно указать в виде домена. Синтаксис: 'user_name'@['domain']. Если значение заключено в квадратные скобки, Doris считает его доменом и пытается определить его IP-адрес. 


## Необязательные параметры {#optional-parameters}

**1. `<password>`**

> Указывает пароль пользователя. 

**2. `<role_name>`**

> Указывает роль пользователя.
> Если указана роль (ROLE), вновь созданному пользователю автоматически предоставляются права этой роли. Если роль не указана, по умолчанию у пользователя нет прав. Указанная ROLE должна уже существовать.

**3. `<password_policy>`**

> `password_policy` задаёт политики, связанные с аутентификацией по паролю при входе. В настоящее время поддерживаются следующие политики:
>
> `PASSWORD_HISTORY { <n> | DEFAULT }`
>
> Определяет, разрешено ли текущему пользователю повторно использовать прежние пароли при смене пароля. Например, `PASSWORD_HISTORY 10` запрещает использовать в качестве нового пароля любой из паролей, заданных при последних 10 сменах. Если задано `PASSWORD_HISTORY DEFAULT`, используется значение глобальной переменной `password_history`. Значение `0` отключает эту функцию. По умолчанию: 0.
>
> `PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}`
>
> Задаёт срок действия пароля текущего пользователя. Например, `PASSWORD_EXPIRE INTERVAL 10 DAY` означает, что срок действия пароля истечёт через 10 дней. `PASSWORD_EXPIRE NEVER` означает, что срок действия пароля не ограничен. Если задано `PASSWORD_EXPIRE DEFAULT`, используется значение глобальной переменной `default_password_lifetime`. По умолчанию: NEVER (или 0), то есть срок действия пароля не ограничен.
>
> `FAILED_LOGIN_ATTEMPTS <n>` 
>
> Если при входе текущий пользователь n раз введёт неверный пароль, его учётная запись будет заблокирована. Например, `FAILED_LOGIN_ATTEMPTS 3` означает, что после 3 неудачных попыток входа учётная запись будет заблокирована.
>   
> `PASSWORD_LOCK_TIME { UNBOUNDED | <n> { DAY | HOUR | SECOND }}`
>
> Задаёт срок, на который блокируется учётная запись. Например, `PASSWORD_LOCK_TIME 1 DAY` означает, что учётная запись будет заблокирована на один день.

**4. `<comment`>**

> Указывает комментарий к пользователю.

## Требования к управлению доступом {#access-control-requirements}

Пользователь, выполняющий эту команду SQL, должен иметь как минимум следующие привилегии:

| Привилегия     | Объект    | Примечания |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER или ROLE    | Эту операцию могут выполнять только пользователи или роли с привилегией ADMIN_PRIV  |

## Примеры {#example}

- Создать пользователя без пароля (если host не указан, это эквивалентно jack@'%')

```sql
CREATE USER 'jack';
```

- Создать пользователя с паролем, разрешив вход с '172.10.1.10'

```sql
CREATE USER jack@'172.10.1.10' IDENTIFIED BY '123456';
```

- Чтобы избежать передачи пароля в открытом виде, пользователя из примера 2 можно создать следующим образом

```sql
CREATE USER jack@'172.10.1.10' IDENTIFIED BY PASSWORD '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9';
The encrypted content can be obtained through PASSWORD(), for example:
SELECT PASSWORD('123456');
```

- Создать пользователя, которому разрешён вход из подсети '192.168', и назначить ему роль example_role

```sql
CREATE USER 'jack'@'192.168.%' DEFAULT ROLE 'example_role';
```

- Создать пользователя, которому разрешён вход из домена 'example_domain'

```sql
CREATE USER 'jack'@['example_domain'] IDENTIFIED BY '12345';
```

- Создать пользователя и назначить ему роль

```sql
CREATE USER 'jack'@'%' IDENTIFIED BY '12345' DEFAULT ROLE 'my_role';
```

- Создать пользователя, задать срок действия пароля 10 дней и блокировку учётной записи на один день после 3 неудачных попыток входа.

```sql
CREATE USER 'jack' IDENTIFIED BY '12345' PASSWORD_EXPIRE INTERVAL 10 DAY FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY;
```

- Создать пользователя и запретить повторное использование последних 8 паролей.

```sql
CREATE USER 'jack' IDENTIFIED BY '12345' PASSWORD_HISTORY 8;
```

- Создать пользователя с комментарием

```sql
CREATE USER 'jack' COMMENT "this is my first user";
```
