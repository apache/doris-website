---
{
  "title": "リリース 2.0.7",
  "language": "ja",
  "description": "コミュニティユーザーと開発者のおかげで、Doris 2.0.7バージョンでは約80の改善とバグ修正が行われました。"
}
---
コミュニティのユーザーと開発者のおかげで、Doris 2.0.7 バージョンでは約80の改善とバグ修正が行われました。

**クイックダウンロード:** [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)


## 1 動作の変更

- `round` 関数は MySQL と同様に通常の丸め処理をデフォルトとします。例：round(5/2) は 2 ではなく 3 を返します。
  
  - https://github.com/apache/doris/pull/31583

- MySQL と同様に、文字列リテラルから scale を指定して `round` datetime を処理します。例：round '2023-10-12 14:31:49.666' を '2023-10-12 14:31:50' にします。

  - https://github.com/apache/doris/pull/27965 


## 2 新機能
- outer join を anti join に変換する際に、miss slot を null alias として作成することをサポートし、クエリを高速化

  - https://github.com/apache/doris/pull/31854

- Nginx と HAProxy に対する IP 透過性をサポートする proxy protocol を有効化

  - https://github.com/apache/doris/pull/32338


## 3 改善と最適化

- BI ツールとの互換性向上のため、`information_schema` テーブルに DEFAULT_ENCRYPTION カラムを追加し、`processlist` テーブルを追加

- JDBC カタログ 作成時にデフォルトで接続性を自動テスト

- routine load を安定させるため auto resume を強化

- inverted index の中国語 tokenizer でデフォルトで小文字を使用

- repeat 関数でデフォルト値の最大値を超過した場合のエラーメッセージを追加

- Hive テーブルの隠しファイルとディレクトリをスキップ

- OOM を回避するため、ファイル meta cache サイズを削減し、一部のケースでキャッシュを無効化

- BrokerLoadJob の profiles による jvm heap memory 消費を削減

- `INSERT INTO t1 SELECT * FROM t2 ORDER BY k` のようなクエリを高速化するため、table sink 下の sort を削除

改善とバグ修正の完全なリストは [github](https://github.com/apache/doris/compare/2.0.6...2.0.7) をご覧ください。


## 4 謝辞

このリリースに貢献いただいた皆様に感謝いたします：

924060929,airborne12,amorynan,ByteYue,dataroaring,deardeng,feiniaofeiafei,felixwluo,freemandealer,gavinchou,hello-stephen,HHoflittlefish777,jacktengg,jackwener,jeffreys-cat,Jibing-Li,KassieZ,LiBinfeng-01,luwei16,morningman,mrhhsg,Mryange,nextdreamblue,platoneko,qidaye,rohitrs1983,seawinde,shuke987,starocean999,SWJTU-ZhangLei,w41ter,wsjz,wuwenchi,xiaokang,XieJiann,XuJianxu,yujun777,Yulei-Yang,zhangstar333,zhiqiang-hhhh,zy-kkk,zzzxl1993
