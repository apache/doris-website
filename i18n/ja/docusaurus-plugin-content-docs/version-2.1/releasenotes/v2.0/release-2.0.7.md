---
{
  "title": "リリース 2.0.7",
  "language": "ja",
  "description": "コミュニティユーザーと開発者のおかげで、Doris 2.0.7バージョンでは約80の改善とバグ修正が行われました。"
}
---
コミュニティのユーザーと開発者の皆様のおかげで、Doris 2.0.7バージョンでは約80の改善とバグ修正が行われました。

**クイックダウンロード:** [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)


## 1 動作変更

- `round`関数はデフォルトでMySQLと同様に通常の四捨五入を行います。例：round(5/2)は2ではなく3を返します。
  
  - https://github.com/apache/doris/pull/31583

- 文字列リテラルからスケールを持つ`round` datetimeをMySQLと同様に処理します。例：'2023-10-12 14:31:49.666'を'2023-10-12 14:31:50'に丸めます。

  - https://github.com/apache/doris/pull/27965 


## 2 新機能
- クエリを高速化するためにouter joinをanti joinに変換する際、欠損スロットをnullエイリアスとして作成することをサポート

  - https://github.com/apache/doris/pull/31854

- NginxとHAProxyのIP透過性をサポートするproxy protocolを有効化

  - https://github.com/apache/doris/pull/32338


## 3 改善と最適化

- BIツールとの互換性向上のため、`information_schema`テーブルにDEFAULT_ENCRYPTION列を追加し、`processlist`テーブルを追加

- JDBC カタログを作成する際、デフォルトで接続性を自動的にテスト

- routine loadを安定させるためのauto resumeを強化

- 転置インデックスの中国語トークナイザーでデフォルトで小文字を使用

- repeat関数で最大デフォルト値を超えた場合のエラーメッセージを追加

- Hiveテーブルで隠しファイルとディレクトリをスキップ

- OOMを回避するためファイルメタキャッシュサイズを削減し、一部のケースでキャッシュを無効化

- BrokerLoadJobのプロファイルによって消費されるJVMヒープメモリを削減

- `INSERT INTO t1 SELECT * FROM t2 ORDER BY k`のようなクエリを高速化するため、table sinkの下にあるソートを除去

改善とバグ修正の完全なリストは[github](https://github.com/apache/doris/compare/2.0.6...2.0.7)をご覧ください。


## 4 謝辞

このリリースに貢献してくださった皆様に感謝いたします：

924060929,airborne12,amorynan,ByteYue,dataroaring,deardeng,feiniaofeiafei,felixwluo,freemandealer,gavinchou,hello-stephen,HHoflittlefish777,jacktengg,jackwener,jeffreys-cat,Jibing-Li,KassieZ,LiBinfeng-01,luwei16,morningman,mrhhsg,Mryange,nextdreamblue,platoneko,qidaye,rohitrs1983,seawinde,shuke987,starocean999,SWJTU-ZhangLei,w41ter,wsjz,wuwenchi,xiaokang,XieJiann,XuJianxu,yujun777,Yulei-Yang,zhangstar333,zhiqiang-hhhh,zy-kkk,zzzxl1993
