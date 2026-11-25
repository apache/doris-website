---
{
    "title": "Text/CSV/JSON",
    "language": "ru",
    "description": "В этом документе описывается поддержка чтения и записи текстовых форматов файлов в Doris."
}
---

В этом документе описывается поддержка чтения и записи текстовых форматов файлов в Doris.

## Text/CSV {#textcsv}

* Catalog

  Поддерживается чтение таблиц Hive в формате `org.apache.hadoop.mapred.TextInputFormat`.

  Поддерживаются следующие SerDes:

  - `org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe`
  - `org.apache.hadoop.hive.serde2.OpenCSVSerde` (начиная с версии 2.1.7)
  - `org.apache.hadoop.hive.serde2.MultiDelimitSerDe` (начиная с версии 3.1.0)

* Табличная функция

* Импорт

  Функция импорта поддерживает форматы Text/CSV. Подробнее см. в документации по импорту.

* Экспорт

  Функция экспорта поддерживает форматы Text/CSV. Подробнее см. в документации по экспорту.

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

Запись в таблицы Hive Text поддерживает `plain`, `gzip`, `bzip2`, `zstd`, `lz4` и `snappy`; по умолчанию используется `plain`. При создании таблицы через Doris используйте свойство `compression`, а при записи в существующую таблицу — свойство таблицы Hive `text.compression`.

## JSON {#json}

### Catalog {#catalog}

- `org.apache.hadoop.hive.serde2.JsonSerDe` (начиная с версии 3.0.4)

- `org.apache.hive.hcatalog.data.JsonSerDe` (начиная с версии 3.0.4)

  1. Поддерживаются как примитивные, так и сложные типы.
  2. Свойство SERDEPROPERTIES `timestamp.formats` не поддерживается.

- Таблица Hive с [`org.openx.data.jsonserde.JsonSerDe`](https://github.com/rcongiu/Hive-JSON-Serde) (начиная с версии 3.0.6)

  1. Поддерживаются как примитивные, так и сложные типы.
  2. SERDEPROPERTIES: поддерживается только [`ignore.malformed.json`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#importing-malformed-data), причём оно работает так же, как в этом JsonSerDe. Остальные SERDEPROPERTIES не действуют.
  3. Не поддерживается [`Using Arrays`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#using-arrays) (аналогично формату Text/CSV, где данные всех столбцов помещаются в один массив).
  4. Не поддерживается [`Promoting a Scalar to an Array`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#promoting-a-scalar-to-an-array) (преобразование скалярного значения в массив из одного элемента).
  5. По умолчанию Doris корректно распознаёт схему таблицы. Однако из-за отсутствия поддержки некоторых параметров автоматическое распознавание схемы может завершиться ошибкой. В этом случае можно задать `read_hive_json_in_one_column = true`, чтобы поместить всю строку JSON в первый столбец и обеспечить полное чтение исходных данных. После этого пользователи могут обработать их вручную. Для этой функции тип данных первого столбца должен быть `String`.

### Импорт {#import}

Функция импорта поддерживает форматы JSON. Подробнее см. в документации по импорту.

## Набор символов {#character-set}

В настоящее время Doris поддерживает только кодировку набора символов UTF-8. Однако некоторые данные, например данные таблиц Hive в текстовом формате, могут содержать содержимое в кодировке, отличной от UTF-8, что приводит к ошибке чтения и следующему сообщению:

```text
Only support csv data in utf8 codec
```

В этом случае задайте переменную сеанса следующим образом:

```text
SET enable_text_validate_utf8 = false
```

Это отключит проверку кодировки UTF-8 и позволит прочитать эти данные. Обратите внимание, что этот параметр используется только для пропуска проверки; содержимое в кодировке, отличной от UTF-8, по-прежнему будет отображаться как искажённый текст.

Этот параметр поддерживается начиная с версии 3.0.4.
