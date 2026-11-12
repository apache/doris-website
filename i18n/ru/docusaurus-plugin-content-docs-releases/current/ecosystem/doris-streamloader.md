---
{
    "title": "Doris Streamloader",
    "language": "ru",
    "description": "Примечания к выпускам Doris Streamloader."
}
---

# Doris Streamloader {#doris-streamloader}

В этом документе перечислены примечания к выпускам Doris Streamloader в обратном хронологическом порядке.

## 1.0.3 {#103}

Источник: [Примечания к выпуску 1.0.3](https://github.com/apache/doris-streamloader/issues/29)

### Возможности и улучшения {#features-and-improvements}

- Добавлена поддержка пользовательских символов перевода строки. [#27](https://github.com/apache/doris-streamloader/pull/27)

### Исправления ошибок {#bug-fixes}

- Исправлена ошибка, из-за которой Streamloader не работал, если параметр `workers` не был задан. [#24](https://github.com/apache/doris-streamloader/pull/24)
- Устранены конфликты меток при их указании в заголовках. [#25](https://github.com/apache/doris-streamloader/pull/25)
