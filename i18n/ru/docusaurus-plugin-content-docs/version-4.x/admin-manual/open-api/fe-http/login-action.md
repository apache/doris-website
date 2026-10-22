---
{
    "title": "Вход в систему",
    "language": "ru",
    "description": "Используется для входа в сервис."
}
---

# Вход в систему {#login-action}

## Запрос {#request}

`POST /rest/v1/login`

## Описание {#description}

Используется для входа в сервис.

## Параметры пути {#path-parameters}

Отсутствуют

## Параметры запроса {#query-parameters}

Отсутствуют

## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

* Успешный вход

    ```
    {
    	"msg": "Login success!",
    	"code": 200
    }
    ```

* Ошибка входа

    ```
    {
    	"msg": "Error msg...",
    	"code": xxx,
    	"data": "Error data...",
    	"count": 0
    }
    ```
