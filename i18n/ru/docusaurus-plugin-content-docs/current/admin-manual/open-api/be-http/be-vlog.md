---
{
    "title": "Изменение VLOG на BE",
    "language": "ru",
    "description": "Эта функция позволяет динамически настраивать журнал VLOG на стороне BE."
}
---

## Запрос {#request}

`POST /api/glog/adjust?module=<module_name>&level=<level_number>`

## Описание {#description}

Эта функция позволяет динамически настраивать журнал VLOG на стороне BE.

## Параметры запроса {#query-parameters}

* `module_name`
    Модуль, для которого настраивается VLOG; соответствует имени файла BE без расширения

* `level_number`
    Уровень VLOG: от 1 до 10. Значение -1 отключает VLOG

## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

    ```json
    {
        msg: "adjust vlog of xxx from -1 to 10 succeed",
        code: 0
    }
    ```

## Примеры {#examples}

    ```bash
    curl -X POST "http://127.0.0.1:8040/api/glog/adjust?module=vrow_distribution&level=-1"
    ```
