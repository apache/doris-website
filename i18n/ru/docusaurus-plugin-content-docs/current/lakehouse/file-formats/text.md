---
{
    "title": "Text/CSV/JSON",
    "language": "ru",
    "description": "В этом документе описана поддержка чтения и записи текстовых форматов файлов в Doris."
}
---

В этом документе описана поддержка чтения и записи текстовых форматов файлов в Doris.

## Text/CSV {#textcsv}

* Catalog

  Поддерживается чтение таблиц Hive в формате `org.apache.hadoop.mapred.TextInputFormat`.

  Поддерживаются следующие SerDe:

  - `org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe`
  - `org.apache.hadoop.hive.serde2.OpenCSVSerde` (начиная с версии 2.1.7)
  - `org.apache.hadoop.hive.serde2.MultiDelimitSerDe` (начиная с версии 3.1.0)

* Табличная функция

* Импорт

  Функция импорта поддерживает форматы Text/CSV. Подробности см. в документации по импорту.

* Экспорт

  Функция экспорта поддерживает форматы Text/CSV. Подробности см. в документации по экспорту.

### Поддерживаемые форматы сжатия {#supported-compression-formats}

При чтении существующих файлов поддерживаются следующие кодеки.

* uncompressed
* gzip
* deflate
* bzip2
* zstd
* lz4
* snappy
* lzo

При записи в таблицы Hive Text поддерживаются `plain`, `gzip`, `bzip2`, `zstd`, `lz4` и `snappy`. По умолчанию используется `plain`. При создании таблицы через Doris задайте свойство `compression`, а при записи в существующую таблицу — свойство таблицы Hive `text.compression`.

## JSON {#json}

### Catalog {#catalog}

- `org.apache.hadoop.hive.serde2.JsonSerDe` (начиная с версии 3.0.4)

- `org.apache.hive.hcatalog.data.JsonSerDe` (начиная с версии 3.0.4)

  1. Поддерживаются как простые, так и сложные типы.
  2. Параметр `timestamp.formats` в SERDEPROPERTIES не поддерживается.

- Таблица Hive с [`org.openx.data.jsonserde.JsonSerDe`](https://github.com/rcongiu/Hive-JSON-Serde) (начиная с версии 3.0.6)

  1. Поддерживаются как простые, так и сложные типы.
  2. Из SERDEPROPERTIES поддерживается только [`ignore.malformed.json`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#importing-malformed-data); он работает так же, как в этом JsonSerDe. Остальные SERDEPROPERTIES не действуют.
  3. Возможность [`Using Arrays`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#using-arrays) не поддерживается (как и в формате Text/CSV, где данные всех столбцов помещаются в один массив).
  4. Возможность [`Promoting a Scalar to an Array`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#promoting-a-scalar-to-an-array) не поддерживается (преобразование скалярного значения в массив из одного элемента).
  5. По умолчанию Doris корректно распознаёт схему таблицы. Однако из-за отсутствия поддержки некоторых параметров автоматическое распознавание схемы может завершиться неудачей. В этом случае можно задать `read_hive_json_in_one_column = true`, чтобы поместить всю строку JSON в первый столбец и полностью прочитать исходные данные. Затем их можно обработать вручную. Для этого тип данных первого столбца должен быть `String`.

### Импорт {#import}

Функция импорта поддерживает формат JSON. Подробности см. в документации по импорту.

## Кодировка символов {#character-set}

В настоящее время Doris поддерживает только кодировку UTF-8. Однако некоторые данные, например данные в таблицах Hive формата Text, могут содержать текст в кодировке, отличной от UTF-8. Это приведёт к ошибке чтения со следующим сообщением:

```text
Only support csv data in utf8 codec
```

В таком случае можно задать переменную сеанса следующим образом:

```text
SET enable_text_validate_utf8 = false
```

Это отключит проверку кодировки UTF-8 и позволит прочитать такие данные. Обратите внимание: параметр лишь пропускает проверку, поэтому текст в кодировке, отличной от UTF-8, по-прежнему будет отображаться некорректно.

Этот параметр поддерживается начиная с версии 3.0.4.
