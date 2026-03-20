---
{
  "title": "他のOLAPからのデータ移行",
  "description": "他のOLAPシステムからDorisにデータを移行するには、いくつかのオプションがあります：",
  "language": "ja"
}
---
他のOLAPシステムからDorisにデータを移行するには、いくつかのオプションがあります：

- Hive/Iceberg/Hudiのようなシステムの場合、Multi-カタログを使用してそれらを外部tableとしてマッピングし、その後"Insert Into"を使用してデータをロードできます

- OLAPシステムからCSVなどの形式でデータをエクスポートし、これらのデータファイルをDorisにロードできます

- Spark/Flinkのようなシステムを使用し、OLAPシステムのConnectorを利用してデータを読み取り、その後DorisConnectorを呼び出してDorisに書き込むことができます


:::info NOTE
このリストに追加できる他の移行ツールをご存知の場合は、dev@doris.apache.orgまでご連絡ください
:::
