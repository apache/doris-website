---
{
  "title": "他のOLAPからのデータ移行",
  "description": "他のOLAPシステムからDorisにデータを移行する場合、いくつかのオプションがあります：",
  "language": "ja"
}
---
他のOLAPシステムからDorisにデータを移行するには、いくつかのオプションがあります：

- Hive/Iceberg/Hudiなどのシステムの場合、Multi-カタログを使用してそれらを外部tableとしてマッピングし、"Insert Into"を使用してデータをロードできます

- OLAPシステムからCSVなどの形式でデータをエクスポートし、これらのデータファイルをDorisにロードできます

- Spark/Flinkなどのシステムを使用し、OLAPシステムのConnectorを利用してデータを読み取り、DorisのConnectorを呼び出してDorisに書き込むことができます

さらに、以下のサードパーティ移行ツールが利用可能です：


:::info NOTE
このリストに追加できる他の移行ツールをご存知の場合は、dev@doris.apache.orgまでご連絡ください
:::
