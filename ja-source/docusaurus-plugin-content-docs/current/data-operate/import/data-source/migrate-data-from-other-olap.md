---
{
  "title": "他のOLAPからのデータ移行",
  "language": "ja",
  "description": "他のOLAPシステムからDorisにデータを移行するには、いくつかのオプションがあります："
}
---
他のOLAPシステムからDorisにデータを移行するには、いくつかのオプションがあります：

- Hive/Iceberg/Hudiのようなシステムの場合、Multi-カタログを使用してそれらを外部テーブルとしてマップし、その後「Insert Into」を使用してデータをロードできます

- OLAPシステムからCSVなどの形式にデータをエクスポートし、これらのデータファイルをDorisにロードできます

- Spark/Flinkのようなシステムを使用して、OLAPシステムのConnectorを利用してデータを読み取り、その後DorisのConnectorを呼び出してDorisに書き込むことができます

さらに、以下のサードパーティ移行ツールが利用可能です：


:::info NOTE
このリストに追加できる他の移行ツールをご存知の場合は、dev@doris.apache.orgまでご連絡ください
:::
