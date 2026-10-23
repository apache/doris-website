---
{
    "title": "Инструмент управления метаданными tablet",
    "language": "ru",
    "description": "В последней версии кода мы внедрили RocksDB в BE для хранения метаданных tablet,"
}
---

# Инструмент управления метаданными tablet {#tablet-metadata-management-tool}

## Общие сведения {#background}

В последней версии кода мы внедрили RocksDB в BE для хранения метаданных tablet, чтобы решить различные проблемы с функциональностью и производительностью, возникавшие при хранении метаданных в файлах заголовков. Сейчас каждому каталогу данных (корневому пути) соответствует отдельный экземпляр RocksDB, в котором все tablet из этого каталога хранятся в виде пар «ключ-значение».

Для удобства обслуживания этих метаданных мы предоставляем HTTP-интерфейс для работы онлайн и инструмент meta tool для работы офлайн.

HTTP-интерфейс предназначен только для просмотра метаданных tablet онлайн и доступен при запущенном процессе BE.

Инструмент meta tool предназначен только для управления метаданными офлайн. Перед его использованием необходимо остановить BE.

Инструмент meta tool находится в каталоге Lib / в BE.

## Операции {#operation}

### Просмотр Tablet Meta {#view-tablet-meta}

Просматривать сведения Tablet Meta можно онлайн и офлайн.

#### Онлайн {#online}

Обратитесь к HTTP-интерфейсу BE, чтобы получить соответствующие сведения Tablet Meta:

API:

`http://{host}:{port}/api/meta/header/{tablet_id}/{schema_hash}`


> Host: имя хоста be
>
> port: HTTP-порт BE
>
> tablet id: идентификатор tablet
>
> schema hash: хеш схемы tablet

Пример:

`http://be_host:8040/api/meta/header/14156/2458238340`

Если запрос выполнен успешно, Tablet Meta возвращается в формате JSON.

#### Офлайн {#offline}

Получите Tablet Meta с диска с помощью инструмента meta\ tool.

Команда:

```
./lib/meta_tool --root_path=/path/to/root_path --operation=get_meta --tablet_id=xxx --schema_hash=xxx
```

> root_path: соответствующий путь root_path, настроенный в be.conf.

Результат также представляет собой Tablet Meta в формате JSON.

### Загрузка заголовка {#load-header}

Загрузка заголовка позволяет вручную переносить tablet. Эта функция использует Tablet Meta в формате JSON, поэтому при необходимости поле shard и сведения о версиях можно изменить непосредственно в JSON-содержимом Tablet Meta. Затем выполните загрузку следующей командой.

Команда:

```
./lib/meta_tool --operation=load_meta --root_path=/path/to/root_path --json_meta_path=path
```

### Удаление заголовка {#delete-header}

Эта операция позволяет удалить метаданные tablet с диска BE. Поддерживается удаление по одному и пакетное удаление.

Удаление одного tablet:

```
./lib/meta_tool --operation=delete_meta --root_path=/path/to/root_path --tablet_id=xxx --schema_hash=xxx`
```

Пакетное удаление:

```
./lib/meta_tool --operation=batch_delete_meta --tablet_file=/path/to/tablet_file.txt
```

Каждая строка в `tablet_file.txt` содержит сведения об одном tablet. Формат:

`root_path,tablet_id,schema_hash`

Столбцы разделяются запятыми.

Пример `tablet_file`:

```
/output/be/data/,14217,352781111
/output/be/data/,14219,352781111
/output/be/data/,14223,352781111
/output/be/data/,14227,352781111
/output/be/data/,14233,352781111
/output/be/data/,14239,352781111
```

При пакетном удалении строки с некорректным форматом сведений о tablet в `tablet_file` пропускаются. По завершении выводится количество успешных удалений и ошибок.

### TabletMeta в формате Pb {#tabletmeta-in-pb-format}

Эта команда позволяет просмотреть Tablet Meta в формате PB, который использовался в прежней системе управления на основе файлов, и вывести Tablet Meta в формате JSON.

Команда:

```
./lib/meta_tool --operation=show_meta --root_path=/path/to/root_path --pb_header_path=path
```

### Метаданные сегмента в формате Pb {#segment-meta-in-pb-format}

Эта команда позволяет просмотреть метаданные сегмента в формате PB и вывести их в формате JSON.

Команда:

```
./meta_tool --operation=show_segment_footer --file=/path/to/segment/file
```
