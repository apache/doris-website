---
{
  "title": "タブレットメタデータ管理ツール",
  "language": "ja",
  "description": "コードの最新バージョンでは、タブレットのメタ情報を格納するためにBEにRocksDBを導入しました、"
}
---
# Tablet メタデータ管理ツール

## 背景

コードの最新バージョンでは、header fileを通じてメタ情報を保存することによって引き起こされる様々な機能的およびパフォーマンス上の問題を解決するために、tabletのメタ情報を保存するためにBEにRocksDBを導入しました。現在、各data directory（root path）には対応するRocksDBインスタンスがあり、対応するroot path上のすべてのtabletがkey-value形式で保存されています。

これらのメタデータのメンテナンスを容易にするため、オンラインHTTPインターフェースとオフラインmeta toolを提供して、関連する管理操作を完了できるようにしています。

HTTPインターフェースはオンラインでtabletメタデータを表示するためにのみ使用され、BEプロセスが実行されている際に使用できます。

しかし、meta toolはオフラインメタデータ管理操作にのみ使用されます。使用する前にBEを停止する必要があります。

meta tool toolはBEのLib/ディレクトリに保存されています。

## 操作

### Tablet Metaの表示

Tablet Meta情報の表示は、オンラインとオフラインの方法に分けることができます

#### オンライン

BEのHTTPインターフェースにアクセスして、対応するTablet Meta情報を取得します：

api:

`http://{host}:{port}/api/meta/header/{tablet_id}/{schema_hash}`

> Host: beホスト名
>
> port: BEのHTTPポート
>
> tablet id: tablet id
>
> schema hash: tablet schema hash

例を示します：

`http://be_host:8040/api/meta/header/14156/2458238340`

最終的にクエリが成功した場合、Tablet MetaがJSONとして返されます。

#### オフライン

meta\ tool toolに基づいて、ディスク上のTablet Metaを取得します。

コマンド：

```
./lib/meta_tool --root_path=/path/to/root_path --operation=get_meta --tablet_id=xxx --schema_hash=xxx
```
> root_path: be.confで設定された対応するroot_pathパスパス。

結果もJSON形式でのTablet Metaの表示です。

### Load header

Load headerの機能は、tabletの手動移行を実現するために提供されています。この機能はJSON形式のTablet Metaに基づいているため、シャードフィールドやバージョン情報の変更が含まれる場合は、Tablet MetaのJSONコンテンツで直接変更できます。その後、以下のコマンドを使用してロードします。

Command:

```
./lib/meta_tool --operation=load_meta --root_path=/path/to/root_path --json_meta_path=path
```
### Delete header

BEのディスクからタブレットメタを削除する機能を実現するため。単一削除とバッチ削除をサポートします。

Single delete:

```
./lib/meta_tool --operation=delete_meta --root_path=/path/to/root_path --tablet_id=xxx --schema_hash=xxx`
```
バッチ削除:

```
./lib/meta_tool --operation=batch_delete_meta --tablet_file=/path/to/tablet_file.txt
```
`tablet_file.txt`の各行はタブレットの情報を表します。形式は以下の通りです：

`root_path,tablet_id,schema_hash`

各列はカンマで区切られています。

`tablet_file`の例：

```
/output/be/data/,14217,352781111
/output/be/data/,14219,352781111
/output/be/data/,14223,352781111
/output/be/data/,14227,352781111
/output/be/data/,14233,352781111
/output/be/data/,14239,352781111
```
バッチ削除は、`tablet_file`内の不正なタブレット情報形式の行をスキップします。実行完了後、成功した削除数とエラー数が表示されます。

### Pb形式のTabletMeta

このコマンドは、古いファイルベース管理のPB形式Tablet Metaを表示し、Tablet MetaをJSON形式で表示するためのものです。

Command:

```
./lib/meta_tool --operation=show_meta --root_path=/path/to/root_path --pb_header_path=path
```
### Pb形式のセグメントメタ

このコマンドはPB形式のセグメントメタを表示し、セグメントメタをJSON形式で表示します。

Command:

```
./meta_tool --operation=show_segment_footer --file=/path/to/segment/file
```
