---
{
  "title": "他のOLAPからのデータ移行",
  "language": "ja",
  "description": "他のOLAPシステムからDorisにデータを移行するには、いくつかのオプションがあります："
}
---
他のOLAPシステムからDorisにデータを移行するには、いくつかのオプションがあります：

- Hive/Iceberg/Hudiなどのシステムの場合、Multi-Catalogを使用してそれらを外部テーブルとしてマップし、その後「Insert Into」を使用してデータを読み込むことができます

- OLAPシステムからCSVなどの形式にデータをエクスポートし、これらのデータファイルをDorisに読み込むことができます

- Spark/Flinkなどのシステムを使用し、OLAPシステムのConnectorを活用してデータを読み取り、その後DorisConnectorを呼び出してDorisに書き込むことができます

:::info NOTE
このリストに追加できる他の移行ツールをご存知の場合は、dev@doris.apache.orgまでご連絡ください
:::
