---
{
  "title": "リリース 2.0.7",
  "language": "ja",
  "description": "コミュニティユーザーと開発者の皆様のおかげで、Doris 2.0.7バージョンでは約80の改善とバグ修正が行われました。"
}
---
コミュニティユーザーと開発者のおかげで、Doris 2.0.7 バージョンでは約80の改善とバグ修正が行われました。

**クイックダウンロード:** [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)


## 1 動作変更

- `round` 関数はデフォルトでMySQLと同様に通常の丸め処理を行います。例：round(5/2) は 2 の代わりに 3 を返します。
  
  - https://github.com/apache/doris/pull/31583

- 文字列リテラルからのスケールを持つ `round` datetime をMySQLと同様に処理します。例：round '2023-10-12 14:31:49.666' を '2023-10-12 14:31:50' に。

  - https://github.com/apache/doris/pull/27965 


## 2 新機能
- クエリを高速化するために、outer join を anti join に変換する際に miss slot を null alias として作成することをサポート

  - https://github.com/apache/doris/pull/31854

- Nginx と HAProxy の IP 透過性をサポートする proxy protocol を有効化。

  - https://github.com/apache/doris/pull/32338


## 3 改善と最適化

- BIツールとの互換性向上のために `information_schema` テーブルに DEFAULT_ENCRYPTION カラムを追加し、`processlist` テーブルを追加

- JDBC Catalog 作成時にデフォルトで接続性を自動テスト。

- routine load を安定させるために auto resume を強化

- 転置インデックスの中国語トークナイザーでデフォルトで小文字を使用

- repeat 関数で最大デフォルト値を超過した場合のエラーメッセージを追加

- Hive テーブルの隠しファイルとディレクトリをスキップ

- OOM を回避するためにファイルメタキャッシュサイズを削減し、一部のケースでキャッシュを無効化

- BrokerLoadJob のプロファイルが消費する jvm ヒープメモリを削減

- `INSERT INTO t1 SELECT * FROM t2 ORDER BY k` のようなクエリを高速化するために、table sink 配下のソートを削除。

改善とバグ修正の完全なリストは [github](https://github.com/apache/doris/compare/2.0.6...2.0.7) をご覧ください。


## 4 クレジット

このリリースに貢献していただいたすべての方に感謝します：

924060929,airborne12,amorynan,ByteYue,dataroaring,deardeng,feiniaofeiafei,felixwluo,freemandealer,gavinchou,hello-stephen,HHoflittlefish777,jacktengg,jackwener,jeffreys-cat,Jibing-Li,KassieZ,LiBinfeng-01,luwei16,morningman,mrhhsg,Mryange,nextdreamblue,platoneko,qidaye,rohitrs1983,seawinde,shuke987,starocean999,SWJTU-ZhangLei,w41ter,wsjz,wuwenchi,xiaokang,XieJiann,XuJianxu,yujun777,Yulei-Yang,zhangstar333,zhiqiang-hhhh,zy-kkk,zzzxl1993
