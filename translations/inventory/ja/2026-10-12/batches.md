# Japanese document batches

Source commit: `2b158c2eff9a3cc12c872ac673698b007223a3ce`.

Each TODO batch is one independent PR, after T03 and T04 merge. No model calls are needed for manual batches.
Counts below describe the source snapshot. Fallback routes and unmerged candidates do not count as coverage.
Dev and 4.x use their own source files and hashes. Keep each PR at most 20 pages; split a batch further when needed.

| Group | Required | Merged/current | Untranslated | Needs update | Pending | Batches |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| DEV | 1639 | 2 | 1637 | 0 | 1637 | 82 |
| 4X | 1596 | 1 | 1595 | 0 | 1595 | 80 |
| COMMUNITY | 51 | 1 | 50 | 0 | 50 | 3 |

Start with DEV-001, then 4X-001 and COMMUNITY-001. Follow the numbered batches within each group.
The native sidebar determines priority; documents outside a sidebar follow in source-path order.
Exact target paths, routes, source hashes and exceptions are in the adjacent group JSON files and their entry shards.
The four merged PoC translations have machine review status. They still need Japanese proofreading before public delivery.

These initial IDs remain the audit baseline. Record PRs and proofreading in this ledger after each batch; regenerate a new snapshot separately rather than overwriting active assignments.

## T09-DEV-001

Status: IN_PROGRESS. Sub-batch `T09-DEV-001a`: [PR #4213](https://github.com/apache/doris-website/pull/4213) merged as `0bdb4cf482` and covers `getting-started/quick-start` (1 merged). Sub-batch `T09-DEV-001b`: [PR #4214](https://github.com/apache/doris-website/pull/4214) merged as `68e98770b3` and covers `features-architecture/intro` and `install/intro` (2 merged). Sub-batch `T09-DEV-001c`: [PR #4215](https://github.com/apache/doris-website/pull/4215) proposes 6 installation preparation and deployment pages. The other 11 assigned pages remain TODO; `install/choosing-deployment-mode`, `install/preparation/cluster-planning`, and `install/deploy-on-kubernetes/doris-operator/doris-operator-overview` need their inherited broken source links fixed before translation. All translated pages retain machine review status until Japanese proofreading is recorded. These splits do not close or renumber T09-DEV-001.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1617.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| getting-started/quick-start | docs/getting-started/quick-start.mdx | `c1f1c82c39f02f2368e4f214b72a7be258983de46fcb04615078a1dd8d35a60b` |
| getting-started/before-you-start-the-poc | docs/getting-started/before-you-start-the-poc.md | `e717192eda8e5ae3eee2bd55c779fe74a854223daed3821541e2dc94d8611d36` |
| features-architecture/intro | docs/features-architecture/intro.mdx | `9cbb22571e0ccf8dbe9d59eb1026785bae2c3e77cb85085506ae7a1a69814c2a` |
| features-architecture/system-architecture | docs/features-architecture/system-architecture.md | `c9fa2e126f1410ed74133eef9d43e164a2c7ee19a4501204dbebe070e0023c46` |
| features-architecture/product-concepts | docs/features-architecture/product-concepts.md | `ee18de809dc6f273c127439c5a7e6ca77e51fec9b1b9a61c4a0c66f97f676305` |
| install/intro | docs/install/intro.mdx | `94cf9e5ac5dfa295b24073bf9111a052c5b5f7b20409fd905622ddaa279f99e8` |
| install/choosing-deployment-mode | docs/install/choosing-deployment-mode.md | `5ee2a41996bd2bdc24951d57f1c7ca9ae51c0f429e4c775fc53ba255ab2aef4e` |
| install/preparation/env-checking | docs/install/preparation/env-checking.md | `4e8bf0b7821d5579f66027b6a1993c369c00cce660eddef8353c4fc789746329` |
| install/preparation/cluster-planning | docs/install/preparation/cluster-planning.md | `98cc6623a4232da72425eefe614f4fa16cee18d420e8681ae5133f821856004a` |
| install/preparation/os-checking | docs/install/preparation/os-checking.md | `9fca792023c144bedbfba0cf91d1c802c0ae34a02180657d9807f6336d0f8493` |
| install/deploy-manually/intro | docs/install/deploy-manually/intro.mdx | `bc44fa25459baa31abb32da893fbdd3333827925746514c597c67485bf07d65b` |
| install/deploy-manually/integrated-storage-compute-deploy-manually | docs/install/deploy-manually/integrated-storage-compute-deploy-manually.md | `249905350a4e4b80ef3f85a974222867979aadf8abf2618dadc4cb185c4fc377` |
| install/deploy-manually/separating-storage-compute-deploy-manually | docs/install/deploy-manually/separating-storage-compute-deploy-manually.md | `c6aa94409756fa57e2cfbad37f1d3dffa1f8d35893672ab96276c51071e6734b` |
| install/deploy-on-kubernetes/intro | docs/install/deploy-on-kubernetes/intro.mdx | `981dc82e6bc7d141bd3021d323996f804ad46260680e13c23565b5bce65b86fa` |
| install/deploy-on-kubernetes/doris-operator/intro | docs/install/deploy-on-kubernetes/doris-operator/intro.mdx | `67ee131943040669472126c9c0a281e477039b0b1b00270ca64de21e67b325e3` |
| install/deploy-on-kubernetes/doris-operator/doris-operator-overview | docs/install/deploy-on-kubernetes/doris-operator/doris-operator-overview.md | `6d5d9a2899036320c33448e453b7776b7587affbf1ef82b6f22f13c96fcccd7c` |
| install/deploy-on-kubernetes/doris-operator/architecture | docs/install/deploy-on-kubernetes/doris-operator/architecture.md | `9148843b2ba08a27887d6877061b1fb5356968f92468706902e7d5f314523486` |
| install/deploy-on-kubernetes/doris-operator/resource-model | docs/install/deploy-on-kubernetes/doris-operator/resource-model.md | `81eddd53bf894a3a5f34890c2d2b3460b1183583eafcab446b1f10972c312caf` |
| install/deploy-on-kubernetes/doris-operator/lifecycle | docs/install/deploy-on-kubernetes/doris-operator/lifecycle.md | `f363eeaef7db75223e49266f9c38843e528efb15f2683ef4aee25cf4b0e2fb21` |
| install/deploy-on-kubernetes/doris-operator/status-and-troubleshooting | docs/install/deploy-on-kubernetes/doris-operator/status-and-troubleshooting.md | `da5974b7499a537b8ade5a8d65a92d98abedfec4e00fce656db4c2b770720096` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-002

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1597.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| install/deploy-on-kubernetes/doris-operator/preparation | docs/install/deploy-on-kubernetes/doris-operator/preparation.mdx | `1ffb8bce4ee7adad70f7c492ac27733efad6bd29d12dcccf4268a076c3c623b2` |
| install/deploy-on-kubernetes/doris-operator/on-alibaba | docs/install/deploy-on-kubernetes/doris-operator/on-alibaba.md | `796f9a87d92ed7f872f0d9acb6195bd881f1c099af6dec2a76518c570c41d608` |
| install/deploy-on-kubernetes/doris-operator/on-aws | docs/install/deploy-on-kubernetes/doris-operator/on-aws.md | `13aa32656161461b924d436bc24a705dddfc9e4cf06d6f7b462f439a85ad13b4` |
| install/deploy-on-kubernetes/integrated-storage-compute/intro | docs/install/deploy-on-kubernetes/integrated-storage-compute/intro.mdx | `b1d5ba5805581c58b64404811d1b749b637e33214d3096b8bf5671c97a58619a` |
| install/deploy-on-kubernetes/integrated-storage-compute/install-doris-operator | docs/install/deploy-on-kubernetes/integrated-storage-compute/install-doris-operator.md | `0827643ef46dcc6264232b3ec5d204b25b27c0ad73b6ad078ac8ff0f37fb1cd8` |
| install/deploy-on-kubernetes/integrated-storage-compute/install-config-cluster | docs/install/deploy-on-kubernetes/integrated-storage-compute/install-config-cluster.md | `cd22ab94ec5012929caff1e0ca2e9d916563b24cc1ec33898e689a0241aed77d` |
| install/deploy-on-kubernetes/integrated-storage-compute/install-doris-cluster | docs/install/deploy-on-kubernetes/integrated-storage-compute/install-doris-cluster.md | `56821822efd43ad6dd59023a87e095a887da3886e07ad1410beb4097ac4acb19` |
| install/deploy-on-kubernetes/integrated-storage-compute/access-cluster | docs/install/deploy-on-kubernetes/integrated-storage-compute/access-cluster.md | `790c3171d1814b4a393b1d064572f7402f9e984c99b1bef26a9d94ae3005e266` |
| install/deploy-on-kubernetes/integrated-storage-compute/cluster-operation | docs/install/deploy-on-kubernetes/integrated-storage-compute/cluster-operation.md | `e90fea7fb163dd85ebd94d0a952cb455a41ed6b926645b10f8d80603b52de951` |
| install/deploy-on-kubernetes/separating-storage-compute/install-doris-cluster | docs/install/deploy-on-kubernetes/separating-storage-compute/install-doris-cluster.md | `13b63a635c68f4d7c368dd59829160b11cf1ba481960c3068da5dcac61022e14` |
| install/deploy-on-kubernetes/separating-storage-compute/install-fdb | docs/install/deploy-on-kubernetes/separating-storage-compute/install-fdb.md | `5e1c2edefcbc11390a7aa9cb2f8c86c8c7e09ff026151069676421cfb8077b06` |
| install/deploy-on-kubernetes/separating-storage-compute/config-ms | docs/install/deploy-on-kubernetes/separating-storage-compute/config-ms.md | `a7b4343fc33c36c4f488f8a65088e166ad1acc2680d77227755adb440737d064` |
| install/deploy-on-kubernetes/separating-storage-compute/config-fe | docs/install/deploy-on-kubernetes/separating-storage-compute/config-fe.md | `af1474677fc59b708718449fb10fdc133836c4217644277c0755f61a4f3abf92` |
| install/deploy-on-kubernetes/separating-storage-compute/config-cg | docs/install/deploy-on-kubernetes/separating-storage-compute/config-cg.md | `8caac48161b3e51a6e61dfd7e04f5d57886c5526d4ae8f212e2b5f8ec5ab2f95` |
| install/deploy-on-kubernetes/separating-storage-compute/config-cluster | docs/install/deploy-on-kubernetes/separating-storage-compute/config-cluster.md | `12e35bb31b75712c10032544126ec066a25aff379b194126108cbd9fc5519611` |
| install/deploy-on-kubernetes/separating-storage-compute/install-prometheus-and-grafana | docs/install/deploy-on-kubernetes/separating-storage-compute/install-prometheus-and-grafana.md | `de8870e8ac513d424d04205d9e915344c7cc6479e419ca1ca849767f69268815` |
| install/deploy-on-cloud/doris-on-aws | docs/install/deploy-on-cloud/doris-on-aws.md | `402ccffe67666655d93a38689119f4311238afa675278575cedd5b986e64a8d4` |
| compute-storage-decoupled/intro | docs/compute-storage-decoupled/intro.mdx | `c2af015e291bbdf0266078bae9ea342d6142079a5c4aec867d24832fb1d8ee76` |
| compute-storage-decoupled/managing-compute-cluster | docs/compute-storage-decoupled/managing-compute-cluster.md | `910dadae3c18aa62978bd05054ff1f7c7ebf2e5b3adf5695106f7fb34dcb9f2c` |
| compute-storage-decoupled/managing-storage-vault | docs/compute-storage-decoupled/managing-storage-vault.md | `3a8a92c5477c428c3adca52963bc51cc9ae564d2b7d17d833997a7dcae05444d` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-003

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1577.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| compute-storage-decoupled/recycler | docs/compute-storage-decoupled/recycler.md | `c0d64589777c333a4051a55010a1f86287fbaff5a666c193fabc678271a5470e` |
| compute-storage-decoupled/upgrade | docs/compute-storage-decoupled/upgrade.md | `27aec86be3acfb3221a0d68fb2690a7fec2a7e6fca256e606a32c4d2d05e3714` |
| compute-storage-decoupled/file-cache/file-cache | docs/compute-storage-decoupled/file-cache/file-cache.md | `321e4b12913ce25199f5c49dbf3c57e9395b89fc059a7fadf9d87b1fc0ac67dc` |
| compute-storage-decoupled/file-cache/file-cache-internals | docs/compute-storage-decoupled/file-cache/file-cache-internals.md | `166732dfa9685d680b1e8b8c6c165d702941ad92f788a9e5d6a10e926bdf5286` |
| compute-storage-decoupled/file-cache/file-cache-peer-read | docs/compute-storage-decoupled/file-cache/file-cache-peer-read.md | `7ef9dd79f8350236e36b3d53467720fc956a28fd4d28bf99081b9fd0337cd2ba` |
| compute-storage-decoupled/rw/read-write-separation | docs/compute-storage-decoupled/rw/read-write-separation.md | `6c1aa1c02d5c678b0766994591e116cf59fedc6197c8acb9b126d8fde770254f` |
| compute-storage-decoupled/rw/file-cache-rw-compute-group-best-practice | docs/compute-storage-decoupled/rw/file-cache-rw-compute-group-best-practice.md | `b70ec0bbb73279e0b6d3d2a24380f9f048bfb327fe662ea136753d804e3d4f64` |
| connection-integration/mysql-proto | docs/connection-integration/mysql-proto.mdx | `975c5cfb3026f413dc6fb2e2060cdb583c6297c7c1d92a2f405963d73f2b8aac` |
| connection-integration/arrow-flight-sql | docs/connection-integration/arrow-flight-sql.md | `f9bd173d613fc8d03491c7adb68f779737c056ea16dd3de1f3289f95ed177960` |
| connection-integration/data-integration/intro | docs/connection-integration/data-integration/intro.mdx | `d247bebd44f524011e427bebfea41ee7a648b2a9e0e32f41d617166ff2f09f7a` |
| connection-integration/data-integration/automq | docs/connection-integration/data-integration/automq.md | `207136b159139d1dcf415500385704de4d083dc079fce2b65ef25e4c6bebfb98` |
| connection-integration/data-integration/beats | docs/connection-integration/data-integration/beats.md | `f41d01f52d1af989fe576c94f14c3e8f0845c7fc453a24e3af5b4bbe12a6b650` |
| connection-integration/data-integration/cloudcanal | docs/connection-integration/data-integration/cloudcanal.md | `f91cfd860165a66dc453303c16e4c2e2dc8679c038257da0fde9c3a1c3f50877` |
| connection-integration/data-integration/clouddm | docs/connection-integration/data-integration/clouddm.md | `06d1bc592dab17e7d5aa98d258e72477b2dcdf6a0479c15036703a02510db72e` |
| connection-integration/data-integration/datagrip | docs/connection-integration/data-integration/datagrip.md | `29365b8903f7ef2bee35f5a564ae1f3f76ed8369cac58cbc38f17490749e81f8` |
| connection-integration/data-integration/datax | docs/connection-integration/data-integration/datax.md | `5526c552e5c5c39127af83f1331ee95bc8b6d836917810ee82cfe58fb682cb7a` |
| connection-integration/data-integration/dbeaver | docs/connection-integration/data-integration/dbeaver.md | `24783e79e90a3548ac7b75c304682fcfd61fdaf3e2d74d515b541d770536005f` |
| connection-integration/data-integration/dbt-doris-adapter | docs/connection-integration/data-integration/dbt-doris-adapter.md | `edfd31e1e6b7cf84ec59a2a8c715dc078c52cb892af7c7193e8af477ec0394d8` |
| connection-integration/data-integration/doris-kafka-connector | docs/connection-integration/data-integration/doris-kafka-connector.md | `82a388700a960309e4ed2e27b35e2c2b72adb142c60451055931e1f2e1593698` |
| connection-integration/data-integration/doris-streamloader | docs/connection-integration/data-integration/doris-streamloader.md | `7acc01b42a31a5bfce304c0b2d3358723f846feb2e507c09456d4c021b7d4223` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-004

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1557.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| connection-integration/data-integration/finebi | docs/connection-integration/data-integration/finebi.md | `4c1df0ff4ffb02654abefc0a69c8291acd3f2218d649df6468d027595cbe028c` |
| connection-integration/data-integration/flink-doris-connector/overview | docs/connection-integration/data-integration/flink-doris-connector/overview.md | `fe58aa90a42bef398174b5844d97890e465a2323649bed2b936c9b5bd5820a77` |
| connection-integration/data-integration/flink-doris-connector/quick-start | docs/connection-integration/data-integration/flink-doris-connector/quick-start.md | `76718fb7044bd68cf3d954762f2e44064ab77b8d4a320df226fbe7dc4de07fd6` |
| connection-integration/data-integration/flink-doris-connector/read | docs/connection-integration/data-integration/flink-doris-connector/read.md | `c07228dabfe1df026978a47fcbc0bfa96219fb951bec8754d4b20099633c488c` |
| connection-integration/data-integration/flink-doris-connector/incremental-read | docs/connection-integration/data-integration/flink-doris-connector/incremental-read.md | `0d43b7cc31a9c2dc98fba628e8fadf5d8d7d584f94c71933fa89e41c6ec5e6ce` |
| connection-integration/data-integration/flink-doris-connector/write | docs/connection-integration/data-integration/flink-doris-connector/write.md | `42fbef6b385af4fd2596adcfded89bd138b726c76a8d6b166a53d87867ac9aaf` |
| connection-integration/data-integration/flink-doris-connector/lookup-join | docs/connection-integration/data-integration/flink-doris-connector/lookup-join.md | `60713f831ece50b43f30ceb4a0a643c013334e16dd1ec5ade5c63e7baea6f233` |
| connection-integration/data-integration/flink-doris-connector/cdc-sync | docs/connection-integration/data-integration/flink-doris-connector/cdc-sync.md | `019dbfd8803946b5bf610e9236b24f83e8b8953e95f0ad88758c3d65e9c67e26` |
| connection-integration/data-integration/flink-doris-connector/datastream-api | docs/connection-integration/data-integration/flink-doris-connector/datastream-api.md | `dc80c9d674d216afcd4ab19a3b906d65bc2f0da1ed5be29937b28a9f110f52a5` |
| connection-integration/data-integration/flink-doris-connector/connection | docs/connection-integration/data-integration/flink-doris-connector/connection.md | `3ea1434584b50c97f3c22aec773d1bb77070521b1f5df4915795404cc5b5f1c3` |
| connection-integration/data-integration/flink-doris-connector/data-type-mapping | docs/connection-integration/data-integration/flink-doris-connector/data-type-mapping.md | `c49fec81c83416f14142fc31cd990d32738a3205b3bcc072f87b1162ee0b8fdc` |
| connection-integration/data-integration/flink-doris-connector/faq | docs/connection-integration/data-integration/flink-doris-connector/faq.md | `141e4df33b402c84b52cd1d9657d39d354a8ca519123a7146a37ca1765110946` |
| connection-integration/data-integration/fluentbit | docs/connection-integration/data-integration/fluentbit.md | `d7fa148a018866009993c570b7d03e3e9f1c1df4e7ebc17fd7258e0747d4a345` |
| connection-integration/data-integration/hive-udf | docs/connection-integration/data-integration/hive-udf.md | `a86c53fcd1c1bdf051e88634800903b14474b9a0a43aeb03c73093b9f9005e2d` |
| connection-integration/data-integration/kettle | docs/connection-integration/data-integration/kettle.md | `43e3bf09f826041e41e2594502df8d97ae6a947dc70ffa804cf21af66f3ce387` |
| connection-integration/data-integration/kyuubi | docs/connection-integration/data-integration/kyuubi.md | `28e0e05b62c03c49891584d9daafc21a96fd5e162e9cacb20517cab2ae53abc8` |
| connection-integration/data-integration/langfuse | docs/connection-integration/data-integration/langfuse.md | `7925a7536000561de9559970b7d16d329ec1ba14bb0ad18a6583a627efc06c29` |
| connection-integration/data-integration/logstash | docs/connection-integration/data-integration/logstash.md | `654e71f6af77a96f17a37bfbfbdc56ee7a26c36f6ea6e06f2cbc90e887cd8f75` |
| connection-integration/data-integration/loongcollector | docs/connection-integration/data-integration/loongcollector.md | `00ed20c11ebc6e12395f9964da71dc5327084134c41154f1e591d3c564176bad` |
| connection-integration/data-integration/metabase | docs/connection-integration/data-integration/metabase.md | `ab451bf871a5f6c785845009a5bef7c96bdffa54f5f476d9ca1258403e25aae0` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-005

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1537.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| connection-integration/data-integration/opentelemetry | docs/connection-integration/data-integration/opentelemetry.md | `e2758b6238934e3ca0f05ddb690ef4729d2774af1bc1528a05ff05eeb2bfb4e3` |
| connection-integration/data-integration/powerbi | docs/connection-integration/data-integration/powerbi.md | `1c2866875301b91f7cddca42d59267f5332022fba5163dd5ef78a9e1555bdaba` |
| connection-integration/data-integration/quickbi | docs/connection-integration/data-integration/quickbi.md | `c70b6db8bfbba37940923e08b0953d502980a2075f97034059b75dbc8cd65dcd` |
| connection-integration/data-integration/quicksight | docs/connection-integration/data-integration/quicksight.md | `2020228ce200a69554b5e197cd262b6acfa43347630c401cb20aa360727ca57d` |
| connection-integration/data-integration/seatunnel | docs/connection-integration/data-integration/seatunnel.md | `4e06235afb88b4e81a795e22def4f6824fed7f877318222616d631d89556adf9` |
| connection-integration/data-integration/smartbi | docs/connection-integration/data-integration/smartbi.md | `7eaba64470f171a47e11b0d1b7ca02e566bd84b3e902eef039ae275cb8bdb0d9` |
| connection-integration/data-integration/spark-doris-connector | docs/connection-integration/data-integration/spark-doris-connector.md | `a7a624ffab56f4df95501979dc41adb30092bc9b1304c17d3549ed38eda7f38e` |
| connection-integration/data-integration/superset | docs/connection-integration/data-integration/superset.md | `b572431f679029c1c47e43cb9ca6ce98c2c8b610cfff905f2b88b5355ce30050` |
| connection-integration/data-integration/tableau | docs/connection-integration/data-integration/tableau.md | `7712fe8c0436809309f66b9c4902e0a8a56ed678472e562d957026fee28f5b34` |
| connection-integration/data-integration/vector | docs/connection-integration/data-integration/vector.md | `9f3695100683dc063f1a0f51792423f192eefd1b3de5d30f7555d173d925d91c` |
| table-design/overview | docs/table-design/overview.mdx | `a3829328bf1256221daa326dfe4c23a0eab9a704c50c393e0e2e73ab3f00d3b9` |
| table-design/data-model/intro | docs/table-design/data-model/intro.mdx | `4f8f54e0df79cc3467e00add7c3e7966e108516de78820d7258a79cac28dc98c` |
| table-design/data-model/duplicate | docs/table-design/data-model/duplicate.md | `bf6283b4e2b10542ef36767454bf1031f0eb8deb6df59747230942a81ad3e49e` |
| table-design/data-model/unique | docs/table-design/data-model/unique.md | `6b378116d758ffa7290561a48d29761a4857c82013f04e7c136523a33fa381e7` |
| table-design/data-model/merge-on-write | docs/table-design/data-model/merge-on-write.md | `72da37504f19e0ff307b2458afef79e01e515cd7bd6ef54da86fa8aa7476a5fc` |
| table-design/data-model/aggregate | docs/table-design/data-model/aggregate.md | `f68f9b11fdb49cbea6ee654a219ccda04211f0364729e68fc1f3a6e631d8297a` |
| table-design/data-model/tips | docs/table-design/data-model/tips.md | `e5657529db80fb24c64bbd9f142e535d5c714966cd05ae5b38980d171d263fbc` |
| table-design/data-type | docs/table-design/data-type.md | `77e21d10815fbda447d869e6c94f0a6cfaa7a9e7d69936d6d8c83a1885c4d93d` |
| table-design/data-partitioning/basic-concepts | docs/table-design/data-partitioning/basic-concepts.mdx | `e143245e07d5ad1a7afd8af3d4ca5764b84b15afec692159be3e05031591cc9c` |
| table-design/data-partitioning/manual-partitioning | docs/table-design/data-partitioning/manual-partitioning.md | `7baecebb7ab7f955c783d80920d8f4eff155d622d9e0a9767aafb8186c8429b2` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-006

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1517.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| table-design/data-partitioning/dynamic-partitioning | docs/table-design/data-partitioning/dynamic-partitioning.md | `c4e8d163833d8edb857a13bffd7d7df2dfa1f793646b8809ec21fde6f5e31418` |
| table-design/data-partitioning/auto-partitioning | docs/table-design/data-partitioning/auto-partitioning.md | `6c9723b151709fe9da4eb99f40a35158b60dcffc541e5ed9e7a61998d49ae08e` |
| table-design/data-partitioning/data-bucketing | docs/table-design/data-partitioning/data-bucketing.md | `58291839133e329fa9f5cf8a7f786078ec5e2976ab5cf3e8fba62a7624943a05` |
| table-design/data-partitioning/common-issues | docs/table-design/data-partitioning/common-issues.md | `cc11224d7babb79a62defcae69405d9cc252e8d08497df7132443832705e0057` |
| table-design/index/index-overview | docs/table-design/index/index-overview.md | `7e31322e1b7bda720eba44c4bd32143124ec70649d6b2fa0a4a25097fbb24c65` |
| table-design/index/prefix-index | docs/table-design/index/prefix-index.md | `7d0debad8cd2125c59effeb809cdf9681365df6f7b6253b4221b13460f16c1b8` |
| table-design/index/bloomfilter | docs/table-design/index/bloomfilter.md | `e6417f22674a837f9c0618e7567bacfb8ce65f6460300ee6cf7c6c5b61d61dea` |
| table-design/index/ngram-bloomfilter-index | docs/table-design/index/ngram-bloomfilter-index.md | `02238d2ae99d46939d108e17e8a3199ab266a159a8bce6337a74057d790106e9` |
| table-design/index/inverted-index/overview | docs/table-design/index/inverted-index/overview.md | `c7e176281e3ad58909bc65d3e25bf12c5f776738891378cebf9de3dbf2124963` |
| table-design/index/inverted-index/custom-analyzer | docs/table-design/index/inverted-index/custom-analyzer.md | `61532386bb644b88a6e4d61e684396605e9e750f2040ef048cacc1cde602bca0` |
| table-design/index/inverted-index/custom-normalizer | docs/table-design/index/inverted-index/custom-normalizer.md | `4b3e12c6de2c7d3a496c03b911567da67e65cf01100b1546846f207afd6b260b` |
| table-design/index/inverted-index/search-operators | docs/table-design/index/inverted-index/search-operators.md | `ed2911734ed12b19dda81a7ffab09b65762a003b711300bf5368426efb3b5f8a` |
| table-design/index/inverted-index/search-function | docs/table-design/index/inverted-index/search-function.md | `9bba18ad86f25fa602eddd3ff8e2e4ca7bf4dcad678baa8fe6339501da90b811` |
| table-design/index/inverted-index/scoring | docs/table-design/index/inverted-index/scoring.md | `7f7d49bee863793e694103d36856ff0bb4af3e31f5f779e14d5e0b70b782e5a8` |
| table-design/index/vector-index/overview | docs/table-design/index/vector-index/overview.md | `c01fde75791fd51c1b7b99a107de9d2dcb579addf19113326910d16e606f60fc` |
| table-design/index/vector-index/practical-guide | docs/table-design/index/vector-index/practical-guide.md | `2b35afccd21be8e8eb7e5cb705d8b4db19a687c9805ef88b67dbd03623c0b468` |
| table-design/index/vector-index/hnsw | docs/table-design/index/vector-index/hnsw.md | `a2526ad820a5b5bd4764c054b5dd7d9cb1e6b75881dcec4ea2651a2e8e02bd97` |
| table-design/index/vector-index/ivf | docs/table-design/index/vector-index/ivf.md | `8d7110283bc5ca00a42f6ecdfef16850d0afbd50c65a43e2faff5a49f4e3ec38` |
| table-design/index/vector-index/ivf-on-disk | docs/table-design/index/vector-index/ivf-on-disk.md | `e3d2bfde910e7c6a80f9b460d7ea4cf2549849a734b5a93daf321db9a81bb395` |
| table-design/index/vector-index/index-management | docs/table-design/index/vector-index/index-management.md | `6cf433510d3358a9671ea4958843fb8db02d07bb772d19d66ef510bc0fd66354` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-007

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1497.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| table-design/index/vector-index/resource-estimation | docs/table-design/index/vector-index/resource-estimation.md | `454078c114baa06e0e6d3c6b1591f9f749058f83fbfd02432dbe3175121685b5` |
| table-design/index/vector-index/quantization-survey | docs/table-design/index/vector-index/quantization-survey.md | `06364abeab7e4969077ba9c86e371cbc52572da6e8af06971ee2c1080161b709` |
| table-design/index/vector-index/performance | docs/table-design/index/vector-index/performance.md | `698d0345b867ccb4921d0b5d45eef70ab17e67a1dd4cf90622bc48322d7ce3da` |
| table-design/index/vector-index/performance-large-scale | docs/table-design/index/vector-index/performance-large-scale.md | `8361f4d44a0d0462bead8c32631348cf3a1a1d3f940c9fc10c3bc08619b947f1` |
| table-design/index/vector-index/behind-index | docs/table-design/index/vector-index/behind-index.md | `658711171d5b3eb3143ff02d3b1d77a44cbffb9be882a5f93f7f4692b301e02f` |
| table-design/storage-layout-overview | docs/table-design/storage-layout-overview.mdx | `a865e8eb896abae382c28b34244c0d212b5170ae6e6acd0a8f3a37be8715d803` |
| table-design/column-compression | docs/table-design/column-compression.md | `6049a098a9edde869604aedae7ca396c2b9447f002e273efbaaa31d5fc773715` |
| table-design/row-store | docs/table-design/row-store.md | `f01324f733d705f896a468e500a59a3e0ee66c820cbb041e9d570ba6c7790790` |
| table-design/tiered-storage/overview | docs/table-design/tiered-storage/overview.md | `6ec25a936c0503f9b1d1e835460d87d7972bd6e5aa948bbb6c8fd5d303d3ff7c` |
| table-design/tiered-storage/tiered-ssd-hdd | docs/table-design/tiered-storage/tiered-ssd-hdd.md | `5573c48352a5f014208b6cd5d202a66076ca0a47df52ebf2f6bb3a601b7534ac` |
| table-design/tiered-storage/remote-storage | docs/table-design/tiered-storage/remote-storage.md | `1f31a324b0dbd6cfe2a95612a9425d762606e55f999e411e4cd700ad0f5c8f00` |
| table-design/storage-format | docs/table-design/storage-format.md | `b7f86b8b9a197f7cf8ff2fe1f2c90aa98adab2e17438cc5a28110b7b56d2bf17` |
| table-design/schema-change | docs/table-design/schema-change.md | `fc124c632c83b650f53ddb81211275542cebd192a61a796287cf65b9f958d716` |
| table-design/auto-increment | docs/table-design/auto-increment.md | `f0742191b4a2d9f2b0c4e8deb595d3d6595a0d64b31bfbe0871ee0fcf0ac79ae` |
| data-operate/import/load-manual | docs/data-operate/import/load-manual.md | `e0cebc30aef775fb1bd06d3ec949d5c1d0f5a99ffaa11eff5d1b6d8ff29f492e` |
| data-operate/import/data-source/local-file | docs/data-operate/import/data-source/local-file.md | `3f011b79fad8df7fd2102589a89d5ddfa9aa240c829144a3cada733f4df150b0` |
| data-operate/import/data-source/kafka | docs/data-operate/import/data-source/kafka.md | `27019d66b8780ecfe2b3922f4886a9cbd2bb89992c3ec77dc1859a09433d0c85` |
| data-operate/import/data-source/aws-msk | docs/data-operate/import/data-source/aws-msk.md | `534acfea1668d3ea8891aade8e8a9c1b43014ef245a65140f15476797b6db323` |
| data-operate/import/data-source/flink | docs/data-operate/import/data-source/flink.md | `0c14658b966d0d071e0df3c030992e36a5ddc78f53f88c21a378a4601dfafb57` |
| data-operate/import/data-source/hdfs | docs/data-operate/import/data-source/hdfs.md | `cfd9711925f5f963a8cbe255a9c8c2d7e8190b46b36332aeed89f14b044ac021` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-008

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1477.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| data-operate/import/data-source/amazon-s3 | docs/data-operate/import/data-source/amazon-s3.md | `ca94f799c99260becf89bd1419e5abb4db3fa11137043d53a616a9176523d8f4` |
| data-operate/import/data-source/google-cloud-storage | docs/data-operate/import/data-source/google-cloud-storage.md | `b9e69e4038bdab0b313343414b46fc777f26321137ad700689fbca132d9c9d19` |
| data-operate/import/data-source/azure-storage | docs/data-operate/import/data-source/azure-storage.md | `215614aa3636568b042e71678e6890b2bd4b7402a9e796699a013a78468d7e36` |
| data-operate/import/data-source/aliyun-oss | docs/data-operate/import/data-source/aliyun-oss.md | `4d983d9d7b138aab64193319f32189ae898a28294d9a888b15c8dddddd28d42e` |
| data-operate/import/data-source/huawei-obs | docs/data-operate/import/data-source/huawei-obs.md | `7877cd099e94c6c79d957432d5447f89e615e82b4e1be810b7b817e9cf1fa9cc` |
| data-operate/import/data-source/tencent-cos | docs/data-operate/import/data-source/tencent-cos.md | `ef59f346e2b29daf6c3e8fcd340bb972614102b50d0f6249f0576bcf2733c77d` |
| data-operate/import/data-source/minio | docs/data-operate/import/data-source/minio.md | `6918ee7a82b81a97087cfe4cadbe31eb40f7085ac9b747dc0b3cae1263f36241` |
| data-operate/import/data-source/s3-compatible | docs/data-operate/import/data-source/s3-compatible.md | `0b356484fc0606c54522d8694d1c3ccb99dbddb58ed2b624c75b07c7871b5043` |
| data-operate/import/data-source/snowflake | docs/data-operate/import/data-source/snowflake.md | `fd4d3a2788660f4466b5e724ba224f41a12392824044925924e1a01dcf7b26fb` |
| data-operate/import/data-source/bigquery | docs/data-operate/import/data-source/bigquery.md | `f6802e8f9d67405d55cea0380028398a6cf51eb12c707c85596f2eb7041dec05` |
| data-operate/import/data-source/redshift | docs/data-operate/import/data-source/redshift.md | `afa37e93022c6340dbcc2493a247d16a003ddee3cd194ee2298ed04e1e6cc5f3` |
| data-operate/import/data-source/mysql | docs/data-operate/import/data-source/mysql.md | `a358a5bb5d452cd364d00d0a0fb330e98760fc0826a4431dbcb893516f08d4e9` |
| data-operate/import/data-source/postgresql | docs/data-operate/import/data-source/postgresql.md | `e8387946d226975a14121576f95e02d32534e3fdcc40084bc0207e7980c33e81` |
| data-operate/import/data-source/migrate-data-from-other-olap | docs/data-operate/import/data-source/migrate-data-from-other-olap.md | `c8ac2f1bbef43f68c42ecf21a65f3c55ddb8b6096b5bc37e7131c99e9e306fce` |
| data-operate/import/data-source/migrate-data-from-other-oltp | docs/data-operate/import/data-source/migrate-data-from-other-oltp.md | `b5d6888dcd9b597791232d5fe342f589d3d7dfbea4c7e3e5d73ea7668174a0ac` |
| data-operate/import/import-way/stream-load-manual | docs/data-operate/import/import-way/stream-load-manual.md | `cff2d420abd71efab12e2f44969c5f285adce517211bfb3a60ca57e20b89d06c` |
| data-operate/import/import-way/broker-load-manual | docs/data-operate/import/import-way/broker-load-manual.md | `897a1ab20b043ecdd36d8494bc3b403d023f2cd2ade37a64500089aaf2a90de4` |
| data-operate/import/import-way/routine-load-manual | docs/data-operate/import/import-way/routine-load-manual.md | `40970d21904a268c338e733243f38a76976bd40def51e6227587b59b4bcfdd09` |
| data-operate/import/import-way/insert-into-manual | docs/data-operate/import/import-way/insert-into-manual.md | `961c22142059b06ed9afed00c63ca7eeda1e8c9f746cb40ff64ba55438f55bba` |
| data-operate/import/import-way/insert-into-values-manual | docs/data-operate/import/import-way/insert-into-values-manual.md | `1f9b2dc29ddada32e9ee16d24f1f7874eb7012a6a68c41d88ef58a7330958191` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-009

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1457.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| data-operate/import/import-way/mysql-load-manual | docs/data-operate/import/import-way/mysql-load-manual.md | `4c22bfffd8598bdff898febaf78fd8d7f4db7f031aef73651635c8d8c0b6cddd` |
| data-operate/import/import-way/spark-load | docs/data-operate/import/import-way/spark-load.md | `cef55ca65c1d4739e73259e8b1a8b69080ed8acccf0f336e519b01c557aab703` |
| data-operate/import/import-way/streaming-job/continuous-load-overview | docs/data-operate/import/import-way/streaming-job/continuous-load-overview.md | `47e567c3b97c5e464352f9b48218c8aa2d7a0c02fabef1e2f75ee697a1901071` |
| data-operate/import/import-way/streaming-job/continuous-load-mysql-table | docs/data-operate/import/import-way/streaming-job/continuous-load-mysql-table.md | `d62005014c4520682968b5c33223d0747eeac92585562e8c3a4e0de5a704ce9e` |
| data-operate/import/import-way/streaming-job/continuous-load-mysql-database | docs/data-operate/import/import-way/streaming-job/continuous-load-mysql-database.md | `66bee885adb290d442046fb17cd623af1b4f825fe06b85446326d0ec16cd2570` |
| data-operate/import/import-way/streaming-job/schema-change-mysql | docs/data-operate/import/import-way/streaming-job/schema-change-mysql.md | `114e51a4a15ae74358e7887d18bef7f472c715a884b413b73d2a2aaa642e73e3` |
| data-operate/import/import-way/streaming-job/data-type-mapping-mysql | docs/data-operate/import/import-way/streaming-job/data-type-mapping-mysql.md | `1fa11c2e4608bb7b8c229643df07d87ef4b229bbf869d11a2e58b103ce17b925` |
| data-operate/import/import-way/streaming-job/prerequisites/amazon-rds-mysql | docs/data-operate/import/import-way/streaming-job/prerequisites/amazon-rds-mysql.md | `3c863f744dd4c9850eaa0cd8b6257415c40b3c036d7fe41df5ce6e53880d4fa2` |
| data-operate/import/import-way/streaming-job/prerequisites/amazon-aurora-mysql | docs/data-operate/import/import-way/streaming-job/prerequisites/amazon-aurora-mysql.md | `a26ae88ea722583e332f686cbee7f436f3808fbb79bfff389a5cf092a88c10ba` |
| data-operate/import/import-way/streaming-job/continuous-load-postgresql-table | docs/data-operate/import/import-way/streaming-job/continuous-load-postgresql-table.md | `3d7cd8411f1c3367254819687d23b825a41bd4b94ecb18ebaf6912b9c85c9593` |
| data-operate/import/import-way/streaming-job/continuous-load-postgresql-database | docs/data-operate/import/import-way/streaming-job/continuous-load-postgresql-database.md | `6d8f38683a371b7c59904778add526b8f2173b16ce1b1950d7fb7c07730a8a39` |
| data-operate/import/import-way/streaming-job/schema-change-postgresql | docs/data-operate/import/import-way/streaming-job/schema-change-postgresql.md | `601a0937496024527f980bf3cf41f4b5c1ea8766ec89ad342c25c760f722068f` |
| data-operate/import/import-way/streaming-job/data-type-mapping-postgresql | docs/data-operate/import/import-way/streaming-job/data-type-mapping-postgresql.md | `515c7a1fe9b5fd5877fca42918610bf16a892f812b592ee8dd73393939cb99ad` |
| data-operate/import/import-way/streaming-job/prerequisites/amazon-rds-postgresql | docs/data-operate/import/import-way/streaming-job/prerequisites/amazon-rds-postgresql.md | `508b25fe6077b4957db06934598de484c2746b09c3bf30c18258bb32cba30563` |
| data-operate/import/import-way/streaming-job/prerequisites/amazon-aurora-postgresql | docs/data-operate/import/import-way/streaming-job/prerequisites/amazon-aurora-postgresql.md | `92909cda0a07e03538cf90ed2e399bc8a96e75907dcf05245d5a22d1c67c089c` |
| data-operate/import/import-way/streaming-job/continuous-load-oceanbase-database | docs/data-operate/import/import-way/streaming-job/continuous-load-oceanbase-database.md | `790ee17a3c1a22b2602225f3359df603f0aadde04f65e378c8e71cce93af7fae` |
| data-operate/import/import-way/streaming-job/schema-change-oceanbase | docs/data-operate/import/import-way/streaming-job/schema-change-oceanbase.md | `d534b172591f2127a5706380ab06f01aa210bda12a8da17950fe8a3910763735` |
| data-operate/import/import-way/streaming-job/data-type-mapping-oceanbase | docs/data-operate/import/import-way/streaming-job/data-type-mapping-oceanbase.md | `6e929513742565e816506c13ca9f31d0c056a4ab4b9f1c70aff0ef26a384bcac` |
| data-operate/import/import-way/streaming-job/continuous-load-s3 | docs/data-operate/import/import-way/streaming-job/continuous-load-s3.md | `9cbdf58b5e569f684dd432b8c29b1e87e063365b8f90da161bf2a7ac630125c8` |
| data-operate/import/file-format/csv | docs/data-operate/import/file-format/csv.md | `6297168b241c1ee49008b191d5b7554a8a8288187d382cdcccbec6f50b3d0cd5` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-010

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1437.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| data-operate/import/file-format/json | docs/data-operate/import/file-format/json.md | `46efd94f39c4060074f7669b90e84a6e6efb2174d67a9a34ed1f59f737dcf2bc` |
| data-operate/import/file-format/parquet | docs/data-operate/import/file-format/parquet.md | `6217a7cc62dd9025ce582ae01c87cfcb5c3b08aa1a728537cfd7028a4a270310` |
| data-operate/import/file-format/orc | docs/data-operate/import/file-format/orc.md | `dc24d17af311b9a5c4d528b6ce53930a81c5648ee288d701af2f2d317de479a8` |
| data-operate/import/complex-types/array | docs/data-operate/import/complex-types/array.md | `023a43cacfe9a14fa5dadc52d990becb98dd9f8d05e491280b06447cd312d0d1` |
| data-operate/import/complex-types/map | docs/data-operate/import/complex-types/map.md | `8b90cff640875e8ee1f923fa8a90ef69cce41d2bb0606795e3325cf2a3cda28c` |
| data-operate/import/complex-types/struct | docs/data-operate/import/complex-types/struct.md | `e5fa7d4c3e7a547069bf94ee244062ff4500d27a36e68c77d7c519d2ebab50b8` |
| data-operate/import/complex-types/json | docs/data-operate/import/complex-types/json.md | `1e1d0aeda96b9cee77a9456f765dac6a3cac36b17bd7a7a365fa4693520d6365` |
| data-operate/import/complex-types/bitmap | docs/data-operate/import/complex-types/bitmap.md | `fa118828337fc4e1767005c286f1b26ba9a467350b0f20f45bcfec41e8d577a2` |
| data-operate/import/complex-types/hll | docs/data-operate/import/complex-types/hll.md | `b4fba5973bc58d67e4ff65cc6863951597fc25fd7b1cb1d5ea35412b926f9111` |
| data-operate/import/complex-types/variant | docs/data-operate/import/complex-types/variant.md | `f58d7e4b406c1196e3d45a3872936362204fe03d668051b30c535d5dbdf026d7` |
| data-operate/import/handling-messy-data | docs/data-operate/import/handling-messy-data.md | `80cbb07b9ab95b025b6258c4592a30ab88e4199f1e583635f60d16dc8acb618e` |
| data-operate/import/load-data-convert | docs/data-operate/import/load-data-convert.md | `e67c9e8efa977beab8966343ae50f07db3c456d6577ce1bb6ef4d6349968c768` |
| data-operate/import/load-best-practices/load-best-practices | docs/data-operate/import/load-best-practices/load-best-practices.md | `aed04cc419bba6cfd58dd1dbfbfb4b33cf83e45875bceb94832259700662d6cd` |
| data-operate/import/load-best-practices/load-high-availability | docs/data-operate/import/load-best-practices/load-high-availability.md | `b0d89ac3f3ea80ddc86931d91bafc85ab2d365cf188e04897d5aafb7c616f1e7` |
| data-operate/import/load-best-practices/group-commit-manual | docs/data-operate/import/load-best-practices/group-commit-manual.md | `c368e4c4dd13a61a2dd3f365f7388576de352cdf6513601fb4e9d6349ea49ad3` |
| data-operate/import/load-best-practices/routine-load-best-practices | docs/data-operate/import/load-best-practices/routine-load-best-practices.md | `d800a94209c540553531c1b0ff9c819a7537597ee21cd622052d863461732097` |
| data-operate/import/load-best-practices/stream-load-in-complex-network | docs/data-operate/import/load-best-practices/stream-load-in-complex-network.md | `336c549ee94e144a890160a95ba77789a7c410697ba026a794254ba3c07fdd9f` |
| data-operate/update-and-delete | docs/data-operate/update-and-delete.mdx | `f643e194681b938e17919bc8cf0299e2d4c8c11c2456a656cf199a5f60474ee9` |
| data-operate/update/update-overview | docs/data-operate/update/update-overview.md | `a5fdc425fd27bf3f3d58f5456ce952907d5fb5f9fab885e445fbb0aff029f9b5` |
| data-operate/update/unique-update-sql | docs/data-operate/update/unique-update-sql.md | `067995b388e1731e955bf4a0fe84bd81575c6f8ba9529814413c2b7dee1681ab` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-011

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1417.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| data-operate/update/update-of-unique-model | docs/data-operate/update/update-of-unique-model.md | `fd0f02a03a596f241e33ca3d66fe42bb03be608cf0c6891dd65ea6defbc39694` |
| data-operate/update/update-of-aggregate-model | docs/data-operate/update/update-of-aggregate-model.md | `9032ca31680810fc4869c081537a51ed37b382420500ebc7bd592f01c54b0fc2` |
| data-operate/update/partial-column-update | docs/data-operate/update/partial-column-update.md | `f42a7d61acaedb816f04c45f4584d1f553f2ba6bea551c0696ca3d3bf764d6e4` |
| data-operate/update/unique-update-concurrent-control | docs/data-operate/update/unique-update-concurrent-control.md | `ea7889a6d9289e2c92a51b6bb86e562bfaaacbe6ad27dfad943ace121524b92c` |
| data-operate/update/multi-stream-update-for-unique-model | docs/data-operate/update/multi-stream-update-for-unique-model.md | `61e815e35704500b57de7ddb8cd66f28d31973180eeb558f8cd383f6d6bb8234` |
| data-operate/delete/delete-overview | docs/data-operate/delete/delete-overview.md | `42d157bb2c27a6e2274ab53fd4d6dbc02891971a08ceb13f641191adb5db7186` |
| data-operate/delete/delete-manual | docs/data-operate/delete/delete-manual.md | `bf74f15a48270c90f0517e7e390b2a2de8642bfdb11ef2bc4d75882e1c53e5b1` |
| data-operate/delete/batch-delete-manual | docs/data-operate/delete/batch-delete-manual.md | `c713aa523f5fe8bed0f6334a527fa7cee14cc8fc57f9dcb6c86ccdb5e36a24c2` |
| data-operate/delete/truncate-manual | docs/data-operate/delete/truncate-manual.md | `0020dfdaf4a83a51ee65621905229ed64d32f1df7eeb3ffc7a0688156727325d` |
| data-operate/delete/atomicity-replace | docs/data-operate/delete/atomicity-replace.md | `04ab7515a3f6076a106d99e3eb6f2c56f3d702e3117e251e16e4c08aa02e1c1d` |
| data-operate/delete/table-temp-partition | docs/data-operate/delete/table-temp-partition.md | `503636e4d6487d6df488baac0750823056d55385131bb2d6f3a69aade332f590` |
| data-operate/transaction | docs/data-operate/transaction.md | `9430bff38572db96b769a04713ac19cbc1477776bc00a39695be9a33691afbb7` |
| data-operate/incremental/overview | docs/data-operate/incremental/overview.md | `df1f7e70c9f4d746cfec7229a129026bfc5cd4f93ce5280a4c7bf7a06870b4ba` |
| data-operate/incremental/quick-start | docs/data-operate/incremental/quick-start.md | `84c6fd2c6738bfc28b3e903e349b21f1d320c16e51c1cdefa24cda75e44d1217` |
| data-operate/incremental/row-binlog | docs/data-operate/incremental/row-binlog.md | `fc51417da6ce259215fb5bea9dc5904a46221b738a0f3987ec783fb8d2631e3d` |
| data-operate/incremental/incremental-query | docs/data-operate/incremental/incremental-query.md | `7f1640381216d68ee6d387cd83a1d78b74180d1dc8fcc41fbeca29c52ac6905c` |
| data-operate/incremental/table-stream | docs/data-operate/incremental/table-stream.md | `ff945cba7f91a8a1a435bfef8af3aac3f21c33881d8d2169b773398caec984aa` |
| data-operate/incremental/table-stream-advanced | docs/data-operate/incremental/table-stream-advanced.md | `3459fb316236b230ecf32175c8b9261af8c2b81ea679f13d52f2ee74434b062f` |
| data-operate/export/export-overview | docs/data-operate/export/export-overview.md | `730d8f2006fc230876e02034207fb738a9eeec48c884b6ed44501f0fc0891a52` |
| data-operate/export/export-manual | docs/data-operate/export/export-manual.md | `36d2a74bd445bc86dc9794d08ae0d9c1ed2c455b30cfcbe4c8be830407bfc388` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-012

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1397.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| data-operate/export/outfile | docs/data-operate/export/outfile.md | `4077bdabd00d4dc50ba6d9730817110ee7cf0746067efacda8911f43eaf59e96` |
| data-operate/export/export-with-mysql-dump | docs/data-operate/export/export-with-mysql-dump.md | `41a6ac45c4790d26a50c12b875863554d34484dca2144ed04876250c21db16a2` |
| data-operate/export/export-best-practice | docs/data-operate/export/export-best-practice.md | `a72f91ce9191972d14dbd35b6601b12088ce0873571f433ef64352b1181b8096` |
| query-data/querying-overview | docs/query-data/querying-overview.mdx | `176f779a3d629daec2b16697c178045ef542a06d4a98223ddae1996d930854df` |
| query-data/mysql-compatibility | docs/query-data/mysql-compatibility.md | `1eaea4a967b6b8054af5d019bb93dfc9a360e88962602f56c1554fef29634d55` |
| query-data/join | docs/query-data/join.md | `b515f4e5ddefeb903d15edbd3083455a71b2a89631d9700b23980627f3de4341` |
| query-data/asof-join | docs/query-data/asof-join.md | `9419e9adfa3b9ea03b54d9273e9d0b0b60fafabbe504bd691430963d125cf3e5` |
| query-data/subquery | docs/query-data/subquery.md | `58356bf430fff67a1acd608cd8caad75c8e8f99e1f565e0ca8dcb6c408b34f09` |
| query-data/multi-dimensional-analytics | docs/query-data/multi-dimensional-analytics.md | `e8c9fd2da35dbb32f63ad32d4efcbd0d298b3d4b28764d1cd81303ace1dd0eee` |
| query-data/window-function | docs/query-data/window-function.md | `8b1cb2ca215046ac1ba23ac5574bc3c446cfa24bb2c18f77dd74cf41437391d4` |
| query-data/cte | docs/query-data/cte.md | `928875f4a7adac1f5216eb9af9ea96d5d39d87068163cc96d9aa7f39062aca38` |
| query-data/udf/alias-function | docs/query-data/udf/alias-function.md | `8e18de8457fea3a9dbd10487d8e6794d38bdb1edc5629697e9067725a2aa9c7f` |
| query-data/udf/java-user-defined-function | docs/query-data/udf/java-user-defined-function.md | `f1ef19251b05b208cde860b8ab85883b28ca50d3ec0fbacaeaea1add629ed3cb` |
| query-data/udf/python-user-defined-function | docs/query-data/udf/python-user-defined-function.md | `effdab69b9c0dfc89be414b767516e80a3cdff17a53f0b9dd15709064596d6f5` |
| query-data/complex-type | docs/query-data/complex-type.md | `98a1f39f95547db68a2ef351ea6e210d75ff57a8545eecb432a865bdf1dd6c9f` |
| query-data/lateral-view | docs/query-data/lateral-view.md | `d075331112ffc2bde21d685b94d295c96496a212a638daf01d1cf28e2dc362c6` |
| query-acceleration/materialized-view/intro | docs/query-acceleration/materialized-view/intro.mdx | `7d25674dcd4aa2f9386c6b9dbc57ac0b5f08f9147c060702ea21268d1d6eb21f` |
| query-acceleration/materialized-view/overview | docs/query-acceleration/materialized-view/overview.md | `8da4beae745471b9a011763f4f994f4334bf5f37831ae8cb8925dbc8149631a3` |
| query-acceleration/materialized-view/sync-materialized-view | docs/query-acceleration/materialized-view/sync-materialized-view.md | `44622e5d7d8a6d9f131f44f9ae4a388007da705a660bdc509ca10568cffde98b` |
| query-acceleration/tuning/tuning-plan/transparent-rewriting-with-sync-mv | docs/query-acceleration/tuning/tuning-plan/transparent-rewriting-with-sync-mv.md | `a271ff0827914190054d693c8251fabe10db2de706f099d6a0fb4ca3ed07e91c` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-013

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1377.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| query-acceleration/materialized-view/async-materialized-view/overview | docs/query-acceleration/materialized-view/async-materialized-view/overview.md | `c6b8befb97032ee09b0daf7b9241d591a7992170afbb33090abf430c4f7cb026` |
| query-acceleration/materialized-view/async-materialized-view/functions-and-demands | docs/query-acceleration/materialized-view/async-materialized-view/functions-and-demands.md | `670d06ee3c9e795b8091006310dbb3ac3a77d8c464fd1cd370f15300bfdb9fdc` |
| query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view | docs/query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view.mdx | `06e545dd0344967ec128e9289d032a2da119f6c6fcfe7bfac0560cb0cf02f52d` |
| query-acceleration/materialized-view/async-materialized-view/use-guide | docs/query-acceleration/materialized-view/async-materialized-view/use-guide.md | `3378217a9c830f7bed6a8fc235d40a9a8d4d92a68a8851d27573726fa0308ea3` |
| query-acceleration/tuning/tuning-plan/transparent-rewriting-with-async-mv | docs/query-acceleration/tuning/tuning-plan/transparent-rewriting-with-async-mv.md | `92e43ba2e38ced23186fcaad3e3011bc7ecc63aa2d3c0662a67e471551a99047` |
| query-acceleration/materialized-view/async-materialized-view/faq | docs/query-acceleration/materialized-view/async-materialized-view/faq.md | `2c05c52f415811ab8e1ecab8e1c4c524e5a898b41eaccc96f9b469f4c3e3492d` |
| query-acceleration/performance-tuning-intro | docs/query-acceleration/performance-tuning-intro.mdx | `09bd7e1c963e30c0fa148b57dee95fbfbe92e53072175467c6bcfda7ecafaef6` |
| query-acceleration/performance-tuning-overview/tuning-overview | docs/query-acceleration/performance-tuning-overview/tuning-overview.md | `837f255823ff7f826c6e268c17a59039401bfbd7f5eb62e19e6af3eafbbde811` |
| query-acceleration/performance-tuning-overview/diagnostic-tools | docs/query-acceleration/performance-tuning-overview/diagnostic-tools.md | `c7c6eb568bb95618afbc315b09c81e1c7c2af446d4d079a5f6404c80264088b1` |
| query-acceleration/performance-tuning-overview/analysis-tools | docs/query-acceleration/performance-tuning-overview/analysis-tools.md | `46435172727e10414dd4414fa28ef91ae56ddb67a30fdb2178941cb010b1ebd2` |
| query-acceleration/performance-tuning-overview/tuning-process | docs/query-acceleration/performance-tuning-overview/tuning-process.md | `e565c6f8f0859ed810a626a3a91e32e9d43df976ff590cfd88178c7eb084f6e7` |
| query-acceleration/tuning/tuning-plan/schema-and-index-optimization | docs/query-acceleration/tuning/tuning-plan/schema-and-index-optimization.mdx | `3b8e8dfb05437d761256cc9900e7957cd20044d054363674bda82fe287f6e090` |
| query-acceleration/tuning/tuning-plan/optimizing-table-schema | docs/query-acceleration/tuning/tuning-plan/optimizing-table-schema.md | `ff8d9ebe258cb3fa73a7dc65637864a9de986cfb85a18550c31413a0e9972ff3` |
| query-acceleration/tuning/tuning-plan/optimizing-table-index | docs/query-acceleration/tuning/tuning-plan/optimizing-table-index.md | `e2645b3c98f0a872aeb1e1306247097d44b07c7da82313dc22c97153c40789b0` |
| query-acceleration/tuning/tuning-plan/optimizing-table-scanning | docs/query-acceleration/tuning/tuning-plan/optimizing-table-scanning.md | `4ad9cfd21122082f64b84972891a12ad031b65e4ba42a65926256626b1cf6b00` |
| query-acceleration/materialized-view/intro-link | docs/query-acceleration/materialized-view/intro-link.mdx | `73d1497a03f54536e539d6bc486073f15a6fad1710da0df760715b3eb21082fc` |
| query-acceleration/join-optimization-intro | docs/query-acceleration/join-optimization-intro.mdx | `8a58110213d8343fff8b037092b8d48134020ee2d6fb9b1681620ed38f13f917` |
| query-acceleration/colocation-join | docs/query-acceleration/colocation-join.md | `134c5f3373e0a1c44b862a5bbab7e3027449287b982f8ed663b2f06bc3527311` |
| query-acceleration/tuning/tuning-plan/adjusting-join-shuffle | docs/query-acceleration/tuning/tuning-plan/adjusting-join-shuffle.md | `4cd3c4b1c0898008e2ed6127c5fd9836fa5d05a5e4e3731b7f9954b078fecbe3` |
| query-acceleration/tuning/tuning-plan/reordering-join-with-leading-hint | docs/query-acceleration/tuning/tuning-plan/reordering-join-with-leading-hint.md | `ff1419cbde6af2dc569afe11d57f82358b0949c72dd72450786696955ef8efa0` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-014

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1357.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| query-acceleration/caching-intro | docs/query-acceleration/caching-intro.mdx | `0f0868d39a9e9e3a3e675930d0d00d095136e3aef983c61ed88315bdf0f7ef64` |
| query-acceleration/sql-cache-manual | docs/query-acceleration/sql-cache-manual.md | `59f514c081dc12477ef6a0bca9daa8a192dab71f0f4bb5cf45cfdf005cebe2a7` |
| query-acceleration/condition-cache | docs/query-acceleration/condition-cache.md | `f1e69642757fcee2fdbdafe2869625bda7fab97a8e38850460129f9e5f5f8c39` |
| query-acceleration/tuning/tuning-execution/intro | docs/query-acceleration/tuning/tuning-execution/intro.mdx | `41f5292ddd4b683851d1d43f29bf5538c972fb71fc774287c389a7fa93824c1b` |
| query-acceleration/tuning/tuning-execution/parallelism-tuning | docs/query-acceleration/tuning/tuning-execution/parallelism-tuning.md | `e4c18daa8db17510c98fb8c270e64410aa32a8e12cf2922546097d911f76aab9` |
| query-acceleration/tuning/tuning-execution/adjustment-of-runtimefilter-wait-time | docs/query-acceleration/tuning/tuning-execution/adjustment-of-runtimefilter-wait-time.md | `5d6e5315724171c3d5e8f0156b9d48259d78adacc3435c987bfe86abf397dc66` |
| query-acceleration/tuning/tuning-execution/data-skew-handling | docs/query-acceleration/tuning/tuning-execution/data-skew-handling.md | `30637ac337f83998e28465426aeb899f67fe04430a12bd89698f12df44e12a48` |
| query-acceleration/tuning/tuning-plan/controlling-hints-with-cbo-rule | docs/query-acceleration/tuning/tuning-plan/controlling-hints-with-cbo-rule.md | `223d57211fd9494299651b2060c08ba89d7b208a40c7437e864f8c3e858c3c5d` |
| query-acceleration/high-concurrency-intro | docs/query-acceleration/high-concurrency-intro.mdx | `048d474cbd44da8902877b055ca7c13b1b767875807c92193641776737af86a1` |
| query-acceleration/high-concurrent-point-query | docs/query-acceleration/high-concurrent-point-query.md | `6c5f067467b59a9c16f8555eeee08e509f3a36facfcce0177eea6583978e069e` |
| query-acceleration/dictionary | docs/query-acceleration/dictionary.md | `6df3023c9ca855bd36f445ad68a8e78238d17106ff0b0912d46bb63a04d4cffa` |
| query-acceleration/distinct-counts/intro | docs/query-acceleration/distinct-counts/intro.mdx | `96893486f34c42d91a3509dc06b84dbd82eb646c2a2486f35209464bebd4b064` |
| query-acceleration/distinct-counts/bitmap-precise-deduplication | docs/query-acceleration/distinct-counts/bitmap-precise-deduplication.md | `1a5c4473d3ec05390e8bf9743ffb9adfe98525f4cf36bce2b3cedc7e24ade3da` |
| query-acceleration/distinct-counts/hll-approximate-deduplication | docs/query-acceleration/distinct-counts/hll-approximate-deduplication.md | `42b68d52f29bbafd32e07be01c9a914e8a22607403db80f96f1afb329abbdd70` |
| query-acceleration/query-profile | docs/query-acceleration/query-profile.md | `ac9f6b79f13dda7eb98e1c5478bcb51dbf210b430333372d453099b30d5eef8e` |
| query-acceleration/tuning/tuning-plan/dml-tuning-plan | docs/query-acceleration/tuning/tuning-plan/dml-tuning-plan.md | `fc0179ae9a93f5f69c86b7c2f1aae2a80a6c91689a56a7dc83aad2d2cef8dc90` |
| query-acceleration/optimization-technology-principle/query-optimizer | docs/query-acceleration/optimization-technology-principle/query-optimizer.md | `c6debc8b4b29f3ae2f9847524a2a53328944edff58dd387654c03d7c14ae18b4` |
| query-acceleration/optimization-technology-principle/pipeline-execution-engine | docs/query-acceleration/optimization-technology-principle/pipeline-execution-engine.md | `264eee7ae0c5d6b13dfe88d3d4ac54119ea226f4eaa13096623d184724b78d76` |
| query-acceleration/optimization-technology-principle/runtime-filter | docs/query-acceleration/optimization-technology-principle/runtime-filter.md | `22fdcd322fec302531c17e7e37b4184f8990b3110e542ae9162540fe84fd98da` |
| query-acceleration/optimization-technology-principle/topn-optimization | docs/query-acceleration/optimization-technology-principle/topn-optimization.md | `42b95df505229d91bdf1c66b3e324485566602e3aab688eee22cf30b3041488f` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-015

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1337.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| query-acceleration/optimization-technology-principle/statistics | docs/query-acceleration/optimization-technology-principle/statistics.md | `11973b6dafce9a87c784ff2a7f3d4f57af5608de6e85af716c3a19517059a9af` |
| lakehouse/lakehouse-overview | docs/lakehouse/lakehouse-overview.md | `7e4410bd769bf4a40ac694878a09f46e24717cfeed8e74ac30ead935d67dbb92` |
| lakehouse/catalog-overview | docs/lakehouse/catalog-overview.md | `b90d0f3f62af7606c96e3e0e39c2ca10887b39f9c28daebd546b603a6204f00b` |
| lakehouse/catalogs/hive-catalog | docs/lakehouse/catalogs/hive-catalog.mdx | `2ae47f5269dddbfdcdace451156a22b131002928aea486417e4bece229b5cebd` |
| lakehouse/catalogs/iceberg-catalog | docs/lakehouse/catalogs/iceberg-catalog.mdx | `75469cd92d68e6c20f5430303d65b1edc450e01190c14804fd7f98a33e5d9a47` |
| lakehouse/best-practices/doris-iceberg-capability-matrix | docs/lakehouse/best-practices/doris-iceberg-capability-matrix.mdx | `c8ba4835ddcdadb92b7c3ce9f6dcd8fa18fb8912f649e299cf7955de0aae216d` |
| lakehouse/best-practices/doris-iceberg | docs/lakehouse/best-practices/doris-iceberg.md | `25332d82eb124649b01b6ef4f670da32a40b59f60191ce1def3470439cd74775` |
| lakehouse/best-practices/doris-aws-s3tables | docs/lakehouse/best-practices/doris-aws-s3tables.md | `ff9b6a19eeadf33f02b9a3f616e5d1b6f2117dbe50a726990c47cfd56895c7b7` |
| lakehouse/best-practices/doris-aliyun-oss-tables | docs/lakehouse/best-practices/doris-aliyun-oss-tables.md | `08958fcd9817950cc557f8fe88afc52a87276434a702729df3555052a429f9f9` |
| lakehouse/best-practices/doris-polaris | docs/lakehouse/best-practices/doris-polaris.md | `9d209d465a3f19b2a3bb7a547587533daec8edb1847202a3f0fafa8e17f207f4` |
| lakehouse/best-practices/doris-gravitino | docs/lakehouse/best-practices/doris-gravitino.md | `bfd12a3768a39511e5facfc1b39b1bb7c3e90f65dd522da4c6b0a2d6b2691e4a` |
| lakehouse/best-practices/doris-onelake | docs/lakehouse/best-practices/doris-onelake.md | `a35da61d3f732b24b8a839f1d65cefe77b261040819e5615d8f2d9c99cbb3b36` |
| lakehouse/best-practices/doris-unity-catalog | docs/lakehouse/best-practices/doris-unity-catalog.md | `1dc3d6523046cd239467676140efc79d246f2ad354faa33fcec7993ab5fba1cf` |
| lakehouse/best-practices/doris-snowflake-catalog | docs/lakehouse/best-practices/doris-snowflake-catalog.md | `7347ecf695e1e8ba3bb26418d59f49d9ab8379ad657cd2b0bc1882334930fa3b` |
| lakehouse/best-practices/doris-lakekeeper | docs/lakehouse/best-practices/doris-lakekeeper.md | `1ef0478fe87619aa9e32194b1c9f9b6e922f4eb398edbacc1cdf61ac5d9c3a6d` |
| lakehouse/best-practices/doris-seaweedfs | docs/lakehouse/best-practices/doris-seaweedfs.md | `de2445d11d476bce769a818eb61b388463361b835199d4d4fdcb26e7eb0b465c` |
| lakehouse/best-practices/doris-nessie | docs/lakehouse/best-practices/doris-nessie.md | `ea0ca2b7fd780eeea6eefa749ba4e62f5e25d281eb7dc2fa42a9c0c85bb181d7` |
| lakehouse/best-practices/doris-dlf-iceberg | docs/lakehouse/best-practices/doris-dlf-iceberg.md | `fed4821ef70d0e5f9021f5c91207a2451268e06dfede2656400f0a87e743704e` |
| lakehouse/catalogs/paimon-catalog | docs/lakehouse/catalogs/paimon-catalog.mdx | `40715cc0e35cf2337dc34d212f7eba5955c703398abefdf09dc1a4110591c49e` |
| lakehouse/best-practices/doris-paimon-capability-matrix | docs/lakehouse/best-practices/doris-paimon-capability-matrix.mdx | `7463753a5d3c6796fc73e073f7282464e85a24e381ec15a210fc2f4b0d77b6c2` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-016

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1317.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| lakehouse/best-practices/doris-paimon | docs/lakehouse/best-practices/doris-paimon.md | `12f87ffc4be2ee4d9c1b3dfd14214fcd6d9f19ed1e9529867de08dd65da04142` |
| lakehouse/best-practices/doris-dlf-paimon | docs/lakehouse/best-practices/doris-dlf-paimon.md | `07fccf98ed655cbdeea3d065c9b6e63f428bc610019eda64346890fca3657736` |
| lakehouse/catalogs/fluss-catalog | docs/lakehouse/catalogs/fluss-catalog.md | `2141b755e5ac67a3f0734304a7a5171867883847940a3d30e64a3bc9145d9a39` |
| lakehouse/catalogs/hudi-catalog | docs/lakehouse/catalogs/hudi-catalog.md | `f4e364ac067539c80a723612c253b2f4c33268ca75ab5527d797708e93a5f483` |
| lakehouse/best-practices/doris-hudi | docs/lakehouse/best-practices/doris-hudi.md | `8880a294e357497d667a5eddc6e8e6ecc251a4a4436de28060ded6970f383449` |
| lakehouse/catalogs/maxcompute-catalog | docs/lakehouse/catalogs/maxcompute-catalog.md | `ac74cb94b9865efa28ebf597993af374364e320e44cb0ce63b05896b922477e8` |
| lakehouse/best-practices/doris-maxcompute | docs/lakehouse/best-practices/doris-maxcompute.md | `fc10288f13cfb3584d96da1e727032497995d7c2c5bbd47c3efe4b5d7ed7a687` |
| lakehouse/catalogs/delta-lake-catalog | docs/lakehouse/catalogs/delta-lake-catalog.md | `ef36159a43b8afe8e22234f85cbb4c72d09037236b54caf0a78756e4d913af12` |
| lakehouse/catalogs/bigquery-catalog | docs/lakehouse/catalogs/bigquery-catalog.md | `1335118b58ba841b70db9e30cc29f78dd403bf9836da1381a692feeafb8ce848` |
| lakehouse/catalogs/kudu-catalog | docs/lakehouse/catalogs/kudu-catalog.md | `5a6925159b62ef92b7029c8ea6740a8c627f23f68e3b24aa72ea8aa749248390` |
| lakehouse/catalogs/kafka-catalog | docs/lakehouse/catalogs/kafka-catalog.md | `6d2e02d9d0849d016e7ec0f7cbb75200a060e118ecd405d28e63a3c7a13319ae` |
| lakehouse/catalogs/es-catalog | docs/lakehouse/catalogs/es-catalog.md | `75b3ff0fc8ed8bfc79c972598022a4449beb323cd75336e74eff18951336e189` |
| lakehouse/catalogs/doris-catalog | docs/lakehouse/catalogs/doris-catalog.mdx | `fa8649cc26d1a79f193a79d02d1d107efd14c0dd2564f764833637cf8a3bc577` |
| lakehouse/catalogs/adbc-catalog | docs/lakehouse/catalogs/adbc-catalog.md | `a38a7e443169fc1f69a25255151a9ea9a6f484c7fbdbb5900ecd8099a574c63f` |
| lakehouse/catalogs/jdbc-catalog-overview | docs/lakehouse/catalogs/jdbc-catalog-overview.md | `1067d4e4060e5203cf362fbbd0a8dbba9e471500db9facfb854afaadffe98e51` |
| lakehouse/catalogs/jdbc-mysql-catalog | docs/lakehouse/catalogs/jdbc-mysql-catalog.md | `2e953ecf983aefbf0958e5cd372daa0948d50134c54968a32131d5a185e017a1` |
| lakehouse/catalogs/jdbc-pg-catalog | docs/lakehouse/catalogs/jdbc-pg-catalog.md | `4aeaaac0be3b07633a2d3ba18dc8568873b98bef994ad93a8d70259f63e0e5d0` |
| lakehouse/catalogs/jdbc-oracle-catalog | docs/lakehouse/catalogs/jdbc-oracle-catalog.md | `8fe00fede5978e5c6d2da8129bc7e14fd362066adbb57d32c121d5edb522cade` |
| lakehouse/catalogs/jdbc-sqlserver-catalog | docs/lakehouse/catalogs/jdbc-sqlserver-catalog.md | `e4f2c79061892cd0d5cc98abe1cb7bcf1f0151d7e5b5db1d54fe888e6434367a` |
| lakehouse/catalogs/jdbc-ibmdb2-catalog | docs/lakehouse/catalogs/jdbc-ibmdb2-catalog.md | `7b5b77e1670474399eff58ff75558f48e09361e4f96ced6972915a278fd6e514` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-017

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1297.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| lakehouse/catalogs/jdbc-clickhouse-catalog | docs/lakehouse/catalogs/jdbc-clickhouse-catalog.md | `2dd308ba61ffa5e1d4f7d4af0e8264a894f30a39abdf2942068cf1ffc42ce543` |
| lakehouse/catalogs/jdbc-saphana-catalog | docs/lakehouse/catalogs/jdbc-saphana-catalog.md | `6b220ebb17d2cab83644d4937c3591457886cc10a3c854cdb034ff5e9d585a7f` |
| lakehouse/catalogs/jdbc-oceanbase-catalog | docs/lakehouse/catalogs/jdbc-oceanbase-catalog.md | `de6f8fbc51673e5154e5d489571df1bd2a8ea81bd91dd162fc859d8bd0d1b99f` |
| lakehouse/file-analysis | docs/lakehouse/file-analysis.md | `f67473b866003cd63bd136bd7e7373035f8e135b35e73e9cc632f1d827a7ce63` |
| lakehouse/huggingface | docs/lakehouse/huggingface.md | `cf59a85bfb12b0cb975ebbe065d0f53b3c5298398c2088188b643b9d4c6d0391` |
| lakehouse/metastores/hive-metastore | docs/lakehouse/metastores/hive-metastore.md | `a88df59c31f7e5b71b00c36eb4d54830ad477322c65f0422bcd06ad0ee80d07f` |
| lakehouse/metastores/aws-glue | docs/lakehouse/metastores/aws-glue.md | `9d924ec1171547e0004bd14b429b35ec48ff95f014bf5b0fd26a0fa2366c2f3a` |
| lakehouse/metastores/google-dataproc-metastore | docs/lakehouse/metastores/google-dataproc-metastore.md | `0da7ef56ce473752b70a177c38c3890b8ec23f6ccce1976fa742a3196698e4f0` |
| lakehouse/metastores/aliyun-dlf | docs/lakehouse/metastores/aliyun-dlf.md | `6f6310aa02ff8eaea187abd55173551fdd296c2eb80b3d44bf51c7307e47b48f` |
| lakehouse/metastores/iceberg-rest | docs/lakehouse/metastores/iceberg-rest.md | `3157eeb1d90e5511d8fed90b75354f54a1eeb674c008347052778117872fc6cb` |
| lakehouse/metastores/iceberg-jdbc | docs/lakehouse/metastores/iceberg-jdbc.md | `8c2b202a71f6a4e91b1eddf872606abdbe650770a9e7fb624729e72429b6078e` |
| lakehouse/metastores/paimon-jdbc | docs/lakehouse/metastores/paimon-jdbc.md | `ad904b9ffc2e3cd3a0582d20bba881e67c293a7e9d1cdcd7137f3e2507c82f6c` |
| lakehouse/metastores/filesystem | docs/lakehouse/metastores/filesystem.md | `cc498b604120a5086b7e067000848c936017431aca39479f02f14693426152ce` |
| lakehouse/storages/hdfs | docs/lakehouse/storages/hdfs.md | `49fc36f58407bbe35fdf2ea00b5b5edd32411ffcc8999043457298ecc7f09e02` |
| lakehouse/storages/s3 | docs/lakehouse/storages/s3.md | `d17d29d2a613259b00b747ec721158240cb6c6ea90d0d67c3a971d99988dbb6a` |
| lakehouse/storages/azure-blob | docs/lakehouse/storages/azure-blob.md | `2dda2db8a8809e66901a8793d3d7b02b43d7319b2f661cbe4e517b6085e36356` |
| lakehouse/storages/gcs | docs/lakehouse/storages/gcs.md | `1fa09b9f5d79e8a5655418ea930e234032aec031399fd1250c4e6d5049496699` |
| lakehouse/storages/aliyun-oss | docs/lakehouse/storages/aliyun-oss.md | `149d9afba2be5de5f69f6d53531cb522bc15651691d9d7a04dfb2f8bba456327` |
| lakehouse/storages/tencent-cos | docs/lakehouse/storages/tencent-cos.md | `e3fdb0333784205ce12a4103c1c5e89a43f6cfff45c92f7b0eb536e63c0f4fb7` |
| lakehouse/storages/huawei-obs | docs/lakehouse/storages/huawei-obs.md | `e425f6f43b19c06fdd53521cda8c75a064384ac4602aa6d888711c2c97c78930` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-018

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1277.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| lakehouse/storages/baidu-bos | docs/lakehouse/storages/baidu-bos.md | `62b940936921555629f51521a168ab2a914abe30d8d89b6820e74657c0651fe7` |
| lakehouse/storages/seaweedfs | docs/lakehouse/storages/seaweedfs.md | `98efaa96c8000e100762f99bd87e15fd8419ef85dc46166f0c34518468e1b868` |
| lakehouse/storages/minio | docs/lakehouse/storages/minio.md | `a786a8f80095dd2871cc6eb70f16360f44302f58386cc164c4ab3efef6a85be5` |
| lakehouse/storages/juicefs | docs/lakehouse/storages/juicefs.md | `fb2c69dc58ea2fa8814ecdf996502fa6b5bc345329d98b7e7835ee2bae8880a3` |
| lakehouse/storages/ozone | docs/lakehouse/storages/ozone.md | `b39d091c3635b5ca793809a46f4472a510f07aad8e519cec94e394addcac5bd3` |
| lakehouse/file-formats/parquet | docs/lakehouse/file-formats/parquet.md | `dae7cf8a946832d7bf44a19fce30a3bdbf8995224b516aa3351f2121e32485da` |
| lakehouse/file-formats/orc | docs/lakehouse/file-formats/orc.md | `0ceb1cf3a7e7588f03e5efdb6b1762e0d2cf1ecaba79eca39976f70fce7ed349` |
| lakehouse/file-formats/text | docs/lakehouse/file-formats/text.md | `fb9dd260afbd0ab5f28f1e3f13504818b297b25296fed743c0f87b7a06d9f9b3` |
| lakehouse/file-formats/lance | docs/lakehouse/file-formats/lance.md | `82cbc465d87e877327c56f28493068253b286724a7379cb0423f95b1c0109543` |
| lakehouse/data-cache | docs/lakehouse/data-cache.md | `88f16654885ff4f70746f99dc25255dadeba02752d74bdc4325c10414b16d88f` |
| lakehouse/meta-cache | docs/lakehouse/meta-cache.md | `fdfc40c1edcb7dbcc110e3e111039be1a4bd85224264a0b0bf8313f4f47baedc` |
| lakehouse/external-meta-cache-memory-management | docs/lakehouse/external-meta-cache-memory-management.md | `6346492aa66c52ff363203753c77978409bba884c5d3f9c3ec73426e5c06e48d` |
| lakehouse/compute-node | docs/lakehouse/compute-node.md | `4bd3ea41d63132bf7d7f2199682cc80bf2675dfb7847e1b0d9b1883a60949e79` |
| lakehouse/statistics | docs/lakehouse/statistics.md | `ec30c737a92c9263279a76c9f919b39ff23fd569cb5e370e1a5a2750f2e84fd1` |
| lakehouse/best-practices/optimization | docs/lakehouse/best-practices/optimization.md | `8eaedfe6ce44fb05eb1fe15c21a899a6734f8a98acec9495d4631b8bfdd3a9da` |
| lakehouse/best-practices/kerberos | docs/lakehouse/best-practices/kerberos.md | `3cf272cc91a73588ffe34998c9de5c37d78637b5659e1e343faea38c78ff432b` |
| lakehouse/best-practices/tpch | docs/lakehouse/best-practices/tpch.md | `01f110c83b5757a16d095ff711d4edacbbfc57d88f7437ee95711c113b34e8cf` |
| lakehouse/best-practices/tpcds | docs/lakehouse/best-practices/tpcds.md | `905fcfe2d3ddd755a336e3eb52a6f5827a954be0f5ce9956a29f6a6ba7adda0a` |
| data-governance/data-lineage | docs/data-governance/data-lineage.md | `fa038e09dedc923e6604aa0c07d29ce3e9c3ff3ff93c43746d4b16b762f87af9` |
| ai/ai-overview | docs/ai/ai-overview.md | `4d23ee7a42bd450ef6c46f0a8f91f0905e513909c5a7145020ea8082d4d6f360` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-019

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1257.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| ai/ai-function-overview | docs/ai/ai-function-overview.md | `5cbcf71720c2c5ae0b4502f3a3fb3e99e1d40a044838470024cb3149cce6e100` |
| observability/intro | docs/observability/intro.mdx | `5333aa7bff9666ff1a7f23bf6bc310342f5ea9f9f378986eb0b61654d2188b7a` |
| observability/dogstack/overview | docs/observability/dogstack/overview.md | `6f12cd64cd1350beceda5c063800a13d340b43efcc7579fddc1261d2aa7cf3bf` |
| observability/dogstack/quickstart | docs/observability/dogstack/quickstart.md | `9ce961037a59a9e026b015fdde260d6c7a54c7041f6f429750f09baf2d99d3e0` |
| observability/dogstack/deployment | docs/observability/dogstack/deployment.md | `7c72b8b674facd0f761c66a021af0cc037f56043f20cf2fc42bac9021aca0dd8` |
| observability/dogstack/search | docs/observability/dogstack/search.md | `8ec1a30970ab94883c55836aff861cbd338f234b3ab22e77c601c0525b4ceb7f` |
| observability/dogstack/trace | docs/observability/dogstack/trace.md | `354c103f8cd1bdbacee303972cab04f2453369957f3713f30663b4271e31883b` |
| observability/dogstack/dashboard | docs/observability/dogstack/dashboard.md | `6be236221c87fc5cbd27d5d6c1b7128fa3ea085c42dedbe3d5ee47d0e83a8bbf` |
| observability/dogstack/alert | docs/observability/dogstack/alert.md | `9dc4f3b9f999bd9c97a8d7452f2e8355bde83c32a49d2ced4367138874ff59c5` |
| observability/overview | docs/observability/overview.mdx | `008cf7014ce6cfa03e1225a11ed2a2d546958472085a17611fd67f0303a41aab` |
| observability/log | docs/observability/log.md | `141d516841ffcee3592075571422b13e41bee0ae6544ffeefd5fde67b734c738` |
| observability/trace | docs/observability/trace.md | `faa116c4dc9343bf4a4dc81df1806cb510a9759e5aaa82c6604077c0384b9a1f` |
| admin-manual/cluster-management/intro | docs/admin-manual/cluster-management/intro.mdx | `d0d82e16cab529bd2bc4c60fe18470405354c662e900ce5f90177ccecd8885db` |
| admin-manual/cluster-management/upgrade | docs/admin-manual/cluster-management/upgrade.md | `5845e418396f6ca7bef074896a0f4a1738ca46b6c96f2fadaa7774ed0f6f2c9c` |
| admin-manual/cluster-management/elastic-expansion | docs/admin-manual/cluster-management/elastic-expansion.md | `4ee93bb676416316b0f5e9a627f3f1d8b1643206f29f078480dfa5ac4ffbc93e` |
| admin-manual/cluster-management/load-balancing | docs/admin-manual/cluster-management/load-balancing.md | `486f80a5da5e2d73ab7d357dcd8113ec8c0ef12f971aefe41d4ec0a281d9bbb4` |
| admin-manual/cluster-management/fqdn | docs/admin-manual/cluster-management/fqdn.md | `7d4ab23543024ceac15b7899c1ef5c029560cd05e4c0c740fe9c56ae49e13c1b` |
| admin-manual/maint-monitor/automatic-service-start | docs/admin-manual/maint-monitor/automatic-service-start.md | `6fc335287cad909f2b65a7b0b4e1792ef06df9d5507975af1c39198c6eefea36` |
| admin-manual/maint-monitor/tablet-repair-and-balance | docs/admin-manual/maint-monitor/tablet-repair-and-balance.md | `de3e9de84ba9a5fce923ab808e38a755ac32091da4ec9d0ff3d1d35eb25780e7` |
| admin-manual/config/config-dir | docs/admin-manual/config/config-dir.md | `25fe24acdc2ad518e53ce80d853c693b370640634244fb6bf0e6f5e61656462a` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-020

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1237.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| admin-manual/config/fe-config | docs/admin-manual/config/fe-config.md | `a1b5eff67d0c1d18951fa4366fdfb25a3c6fbad945475b70e895d38a28b4aed8` |
| admin-manual/config/be-config | docs/admin-manual/config/be-config.md | `1f0abe557c8688a7f12205614e2a3926958e545ca12830e5469365a790683b09` |
| admin-manual/config/user-property | docs/admin-manual/config/user-property.md | `caf59cf1e334c6b0a965a6f16f7a2eca4f4570441f14c32aec888f227b3bc0b4` |
| admin-manual/cluster-management/time-zone | docs/admin-manual/cluster-management/time-zone.md | `d080164bb61bde378af1b632c0a2178f37540b9918840b230fe460fc4177e614` |
| admin-manual/auth/security-overview | docs/admin-manual/auth/security-overview.md | `53f866ba350869eec3d9e85ebc4d03cdfe3b16a50455ecffe63a448bb82c332a` |
| admin-manual/auth/authentication/internal | docs/admin-manual/auth/authentication/internal.md | `3121dc26e0f59386c7bfacbfa7149e54def6ebc38047c72ff8972e68da5f4c40` |
| admin-manual/auth/authentication/ldap | docs/admin-manual/auth/authentication/ldap.md | `a21febd795c9269f97523e47da3618890e3329a1c44c996685be8f5f0deb0b92` |
| admin-manual/auth/authorization/internal | docs/admin-manual/auth/authorization/internal.md | `016913a97a1ff76324524542eba9c1286dd0acc3cb8165094cf6807de13ae12c` |
| admin-manual/auth/authorization/ranger | docs/admin-manual/auth/authorization/ranger.md | `edc920bd4a6a15e8575f2f3f40efd5e2771dd50caff194ec908ce13da35e210a` |
| admin-manual/auth/authorization/ranger-hive | docs/admin-manual/auth/authorization/ranger-hive.md | `712f0c25161e59144c7e42e534b25f34114291ada4d60229070e434968b0a779` |
| admin-manual/auth/authorization/data | docs/admin-manual/auth/authorization/data.md | `448714b09c24123c8fb8cfbc617ed2f11da970b272c67643ce4903741a552dfa` |
| admin-manual/audit-plugin | docs/admin-manual/audit-plugin.md | `074ae9416f22a99ff602305ddbf4c4bb3f22be34088918377e43b4f035cce6ee` |
| admin-manual/auth/certificate | docs/admin-manual/auth/certificate.md | `efbfc5df855603b3fb9c93c65fa16dfab974c63a71d763c4f755a0b143532e59` |
| admin-manual/auth/fe-certificate | docs/admin-manual/auth/fe-certificate.md | `d5bf68e5f09c16df7c00dc8ec94e31fdfc42726f32249bca2ad61e6f0bcfc41d` |
| admin-manual/auth/encryption-function | docs/admin-manual/auth/encryption-function.md | `bc2c2bc281b0eee3fbfbc307e7e04eac10e9d11961577300eb567fad40f7697a` |
| admin-manual/auth/integrations/aws-authentication-and-authorization | docs/admin-manual/auth/integrations/aws-authentication-and-authorization.md | `c8164e0662b9952b58da4a78af3acd7ba8b33163cb42eb71a19ddb3ed5d4125e` |
| admin-manual/auth/integrations/aws-iam-role | docs/admin-manual/auth/integrations/aws-iam-role.md | `5fa2e37e21fc665b36e342c9eb1b7f4483f9d0b7e37df9af5d372e32cbea3bc8` |
| admin-manual/workload-management/workload-management-summary | docs/admin-manual/workload-management/workload-management-summary.md | `953bef6c894202a558838e55f42dc8986482294f1579778c6e679afdea9091da` |
| admin-manual/workload-management/resource-isolation-intro | docs/admin-manual/workload-management/resource-isolation-intro.mdx | `65184792d602bf40261062ffe8f01b108e2e6738d0a895235b6125bca502fcee` |
| admin-manual/workload-management/resource-group | docs/admin-manual/workload-management/resource-group.md | `996562bcf5094fa091ec1d1865d6ed6c2a829ff32991913cc80a82f64d2a3246` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-021

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1217.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| admin-manual/workload-management/compute-group | docs/admin-manual/workload-management/compute-group.md | `4e4b8edb0ebc33a6db9734a33deb0319b5c6a0d6a3e0ca4f1a5b03922884e6ae` |
| admin-manual/workload-management/workload-group | docs/admin-manual/workload-management/workload-group.md | `9e20883d8e25f43f3a374f5abf59a7e4874f9f2bd23895f87e6f480e45c2be94` |
| admin-manual/workload-management/workload-group-bind-compute-group | docs/admin-manual/workload-management/workload-group-bind-compute-group.md | `0259a3550cd29d03bfd37912b27268d7d04383f1b216cfe9628b87a28b793734` |
| admin-manual/workload-management/concurrency-control-and-queuing | docs/admin-manual/workload-management/concurrency-control-and-queuing.md | `927cc4f64a4058e980bcaaa029a4914f2344180eac27c7d548512709f2cd16e0` |
| admin-manual/workload-management/spill-disk | docs/admin-manual/workload-management/spill-disk.md | `0421aca6f76dd39a7c3fa6164bccd308c27a6d6d5c147b5f74dbddc443fba593` |
| admin-manual/workload-management/sql-blocking | docs/admin-manual/workload-management/sql-blocking.md | `ff072dec64191262fbc2cf6f059ba7dfd74344ee2216184e4d9525a8e717b652` |
| admin-manual/workload-management/kill-query | docs/admin-manual/workload-management/kill-query.md | `b6b3b1a9aff6fb27f6e269cb59f1041b7347209da608c9c9cb2bf570086eca23` |
| admin-manual/workload-management/query-progress-monitor | docs/admin-manual/workload-management/query-progress-monitor.md | `8a0481f9b2988c16a8e3730b309fc76e82cabc1bbfdf66c0ee477548cc264563` |
| admin-manual/workload-management/analysis-diagnosis | docs/admin-manual/workload-management/analysis-diagnosis.md | `592e609505451698c8040d3d946e5bb4b2ae215d2a56572bfb99f20401ebe0db` |
| admin-manual/workload-management/job-scheduler | docs/admin-manual/workload-management/job-scheduler.md | `3b700dc993a19acbdf63305103a049b2ee51f9279a42a192f39cc99273db44d9` |
| admin-manual/data-admin/overview | docs/admin-manual/data-admin/overview.md | `b578f5d0182d44fd20dc455d8f81de30c3c877138cc70df5b760e65037cef40b` |
| admin-manual/data-admin/backup-restore/overview | docs/admin-manual/data-admin/backup-restore/overview.md | `049f27035b6899b9af38a16d3e29e83f24670e5c85b3f229453217d80efb136d` |
| admin-manual/data-admin/backup-restore/backup | docs/admin-manual/data-admin/backup-restore/backup.md | `965e9af739e135d45b5a82b375265f04685519410cf1d381b10a3eb283ad30e2` |
| admin-manual/data-admin/backup-restore/restore | docs/admin-manual/data-admin/backup-restore/restore.md | `b67b5cd8429b5203d07cafa23accccfeeada32b24d666e4e5ddd6206e3a3825c` |
| admin-manual/data-admin/recyclebin | docs/admin-manual/data-admin/recyclebin.md | `0912f1bf0757783bef17805c35315d4ac4358e1b75909229a4c5862e0f35a857` |
| admin-manual/maint-monitor/monitor-alert | docs/admin-manual/maint-monitor/monitor-alert.md | `7ab6f3c72465c8b364418a5388b4873d2dccf817daf265142d14777c71491ac3` |
| admin-manual/maint-monitor/metrics | docs/admin-manual/maint-monitor/metrics.md | `b98bce4c2099e4c60ab37fb3326da083488394ddac018f3efd54f8a3691ee668` |
| admin-manual/maint-monitor/disk-capacity | docs/admin-manual/maint-monitor/disk-capacity.md | `1c87f65dd60bd8b53f73b5c7a7cc8a834c186490bba8891cb1740226a57b7081` |
| admin-manual/log-management/intro | docs/admin-manual/log-management/intro.mdx | `9ea46af7a5ae4c57f302126815e88ac6d735d3cf013d5965b9bded6d6385f329` |
| admin-manual/log-management/fe-log | docs/admin-manual/log-management/fe-log.md | `644da2ff342ed74713935a54f2521fd99a96e77acedb586f5adf892eae84d7e8` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-022

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1197.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| admin-manual/log-management/be-log | docs/admin-manual/log-management/be-log.md | `b9608fc81b4da8d5e843a0b8523057f0ad6df1aca6c3578266d284e35e5e44fc` |
| admin-manual/system-tables/overview | docs/admin-manual/system-tables/overview.md | `98173d751fb746af9a9a50f900eec54041c8321b88f847d9cf03ab84653f791a` |
| admin-manual/system-tables/information_schema/active_queries | docs/admin-manual/system-tables/information_schema/active_queries.md | `300618949cfd3b6a0f9b1c99d9add1549d683f6951ade0a5bf3bf96394334ccb` |
| admin-manual/system-tables/information_schema/backend_active_tasks | docs/admin-manual/system-tables/information_schema/backend_active_tasks.md | `7a3af538b3dd6b4e4fded87b5afd39c4eab42a1393a4808a0babc745a32616db` |
| admin-manual/system-tables/information_schema/backend_configuration | docs/admin-manual/system-tables/information_schema/backend_configuration.md | `766e3eaa2ab507935f41ec4938476f53944a47b739b933844f87a7405261cdbe` |
| admin-manual/system-tables/information_schema/backend_tablets | docs/admin-manual/system-tables/information_schema/backend_tablets.md | `1b28d6c2e020ac13887ab386936513e90bf867379230cda9b4447bee26bb7055` |
| admin-manual/system-tables/information_schema/catalog_meta_cache_statistics | docs/admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md | `5f0aab1d329fff4e1c14fbaed6c27bbb1bf9cbb67819bf191a8326af9a98bc0d` |
| admin-manual/system-tables/information_schema/character_sets | docs/admin-manual/system-tables/information_schema/character_sets.md | `e711baf27dcbec7d103bf7d70b50ec22cf4d0dd7e548354bbf6354ff29976358` |
| admin-manual/system-tables/information_schema/collations | docs/admin-manual/system-tables/information_schema/collations.md | `7fe75479ba4baa368ca95eab1036a0f34c23da8836f442673090d165a62cf613` |
| admin-manual/system-tables/information_schema/column_privileges | docs/admin-manual/system-tables/information_schema/column_privileges.md | `4cbb194470bade032177c97b515fd8f77757a506aec37ace3fb29c4a5f61decc` |
| admin-manual/system-tables/information_schema/column_statistics | docs/admin-manual/system-tables/information_schema/column_statistics.md | `e733707b4cdc11fe7fd1115aa1ba8841cf5354134bdb88a1d9aab87d6f05ad53` |
| admin-manual/system-tables/information_schema/columns | docs/admin-manual/system-tables/information_schema/columns.md | `a992603739ba4f15d1fbaf58a68ab7e8057a16b213af7917a53675ffe440ee74` |
| admin-manual/system-tables/information_schema/engines | docs/admin-manual/system-tables/information_schema/engines.md | `a9eb75da7619acf1ad059d43054167de1bf1f8b66ac6b726ee62799a82a0e738` |
| admin-manual/system-tables/information_schema/events | docs/admin-manual/system-tables/information_schema/events.md | `10a4ce643564e582d84937aa2edc61a9b47811505569dbb9b68b85747b1bc76b` |
| admin-manual/system-tables/information_schema/file_cache_info | docs/admin-manual/system-tables/information_schema/file_cache_info.md | `5da6b1aeb0c62eba993bec6b3d5c00aa145debffcd22a69ce6b6044d58aa3df7` |
| admin-manual/system-tables/information_schema/file_cache_statistics | docs/admin-manual/system-tables/information_schema/file_cache_statistics.md | `9147f2c8b8c57d62a0b7ce91c9424b23c390d64e891b47e840de9d5d8881f8bb` |
| admin-manual/system-tables/information_schema/files | docs/admin-manual/system-tables/information_schema/files.md | `ba0597b43d351919e907feca08f4b6aeeca6361d12d60a69a037997cda13736e` |
| admin-manual/system-tables/information_schema/global_variables | docs/admin-manual/system-tables/information_schema/global_variables.md | `a7b0a0231a90b197603d663b4b5f88bc211b62023e98bab5f87d28f313af611b` |
| admin-manual/system-tables/information_schema/key_column_usage | docs/admin-manual/system-tables/information_schema/key_column_usage.md | `374049816a5bea26244d582206a2bd65d992c7f3a54c5f820e118f8e627f56ab` |
| admin-manual/system-tables/information_schema/metadata_name_ids | docs/admin-manual/system-tables/information_schema/metadata_name_ids.md | `82b4472a984fe9abe8eff6e4f33bf107df41f4701059117a77e6b436b2e9dace` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-023

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1177.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| admin-manual/system-tables/information_schema/parameters | docs/admin-manual/system-tables/information_schema/parameters.md | `7d9c55d6563551b302c3358bca3c20012826d1ddade82f4432ac0cc6ecd78e7d` |
| admin-manual/system-tables/information_schema/partitions | docs/admin-manual/system-tables/information_schema/partitions.md | `5606cf9ee8db088beae428cf913c717d8ad21612a90c039b594298242e5bbe93` |
| admin-manual/system-tables/information_schema/processlist | docs/admin-manual/system-tables/information_schema/processlist.md | `5e8fe61b2a336af9dc90facdecfe3fa4c4124243b57e859236a4a2b0d2615cee` |
| admin-manual/system-tables/information_schema/profiling | docs/admin-manual/system-tables/information_schema/profiling.md | `8392f48b13cdfc8c87f37711ea73cf5050e4cf4621d742b04b67e850e04ada61` |
| admin-manual/system-tables/information_schema/referential_constraints | docs/admin-manual/system-tables/information_schema/referential_constraints.md | `a44ff39cf267e07b28187f5675f6772581820448a6938a7289d690e7ef0184fb` |
| admin-manual/system-tables/information_schema/routines | docs/admin-manual/system-tables/information_schema/routines.md | `84d4e47f17d401a03553caa68801ac7c31de1662a940760d86050638434258be` |
| admin-manual/system-tables/information_schema/routine_load_job | docs/admin-manual/system-tables/information_schema/routine_load_job.md | `11614db21ede2b1b17bc6109e0b1727786b195fe111fdbca136cb8736e87df72` |
| admin-manual/system-tables/information_schema/rowsets | docs/admin-manual/system-tables/information_schema/rowsets.md | `c192f32120aebff19386de4e80cbea2eab8da83a5a511213910ac0a47eed0e6d` |
| admin-manual/system-tables/information_schema/schema_privileges | docs/admin-manual/system-tables/information_schema/schema_privileges.md | `f6f631e59af54760c73ab29958517ab3dc420805abeadac85de6b5fbe3621fae` |
| admin-manual/system-tables/information_schema/schemata | docs/admin-manual/system-tables/information_schema/schemata.md | `9d16b4ee2036ca78bfff400e9d2acc8b95f518b671cbaedaf2bc3eaca2d48b8e` |
| admin-manual/system-tables/information_schema/session_variables | docs/admin-manual/system-tables/information_schema/session_variables.md | `be01f743edd85ba8d914f3d96773d85d7ec43c5508ddba3448cdc95e445bd895` |
| admin-manual/system-tables/information_schema/statistics | docs/admin-manual/system-tables/information_schema/statistics.md | `c9e78d2f5b5f2c8097d35686f7f73d10a7f7f23b822316947dd45f57d723e888` |
| admin-manual/system-tables/information_schema/table_constraints | docs/admin-manual/system-tables/information_schema/table_constraints.md | `506c02bc053ccf85b9a7358d7f0638d2f8afd7263511d0da03a65a124f85a618` |
| admin-manual/system-tables/information_schema/table_options | docs/admin-manual/system-tables/information_schema/table_options.md | `98ec6a2e09a131710cd659890dffe1cfd1066bb0752707474714cbd9fe2d30ed` |
| admin-manual/system-tables/information_schema/table_privileges | docs/admin-manual/system-tables/information_schema/table_privileges.md | `e63cabda83de46ef945edf8a887ebf6b8289c6be6d0101621e9685e4256de5de` |
| admin-manual/system-tables/information_schema/table_properties | docs/admin-manual/system-tables/information_schema/table_properties.md | `3a1336aaf3e8b7223336621284b0f56ec73e718b0ea234d24ec1db911797dc96` |
| admin-manual/system-tables/information_schema/table_stream_consumption | docs/admin-manual/system-tables/information_schema/table_stream_consumption.md | `f0ea19e43edcbd4c2ad6e91f364ae4742f193824b58c1eb5529c1703398f3496` |
| admin-manual/system-tables/information_schema/table_streams | docs/admin-manual/system-tables/information_schema/table_streams.md | `93cbb59b1a20fbbae6218a55d5f26297c5a2cc63a2063625e149edba364732a3` |
| admin-manual/system-tables/information_schema/tables | docs/admin-manual/system-tables/information_schema/tables.md | `d1cae8b064259c0e29453408dcdd6241480dca80ae7d8fa486bebafddadc8417` |
| admin-manual/system-tables/information_schema/triggers | docs/admin-manual/system-tables/information_schema/triggers.md | `8c869c939c63d9ea1f43f1b990fe4fd5a62addc648bc6ef9816098cdb905f3a0` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-024

Status: IN_PROGRESS. [PR #4216](https://github.com/apache/doris-website/pull/4216) proposes all 20 Dev Japanese targets from master `74a08a2d8a`. Each target has an independent machine-review state record. Dev and 4.x source identities and content hashes match; 4.x targets remain for their own batch. Japanese proofreading is not recorded.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1157.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| admin-manual/system-tables/information_schema/user_privileges | docs/admin-manual/system-tables/information_schema/user_privileges.md | `d565993e94b1b47546cc7ea9f8b08dd2b62b6e2e00f5c685d6d9d6d9cd1dfa87` |
| admin-manual/system-tables/information_schema/views | docs/admin-manual/system-tables/information_schema/views.md | `9661be2edcd4ae6de9473d3c9192c698f5054fd1aa142bb4a50f2e4d450e2b3b` |
| admin-manual/system-tables/information_schema/workload_group_privileges | docs/admin-manual/system-tables/information_schema/workload_group_privileges.md | `3798073ea3f1fceeed95ab1bf24695de95d4d854e28832ad3808ac47fc3c75b8` |
| admin-manual/system-tables/information_schema/workload_group_resource_usage | docs/admin-manual/system-tables/information_schema/workload_group_resource_usage.md | `ee7f38f17c86931071bed53c54f9fb114701388eec6a47c51b71a3fffb778528` |
| admin-manual/system-tables/information_schema/workload_groups | docs/admin-manual/system-tables/information_schema/workload_groups.md | `ccdaaca957c7171570744b5b569c5b7316888ef6584bbe645485afa7e94864d9` |
| admin-manual/system-tables/information_schema/workload_policy | docs/admin-manual/system-tables/information_schema/workload_policy.md | `fa6d2c060bfdd35f1ef43c768e7b7e5e4d7ff4e9e8c865fd4e67aba2ca1ca153` |
| admin-manual/system-tables/mysql/procs_priv | docs/admin-manual/system-tables/mysql/procs_priv.md | `4443bce311ed5ef1e3f45d86dd6b3d5228b7b2f787ec1b49c647b983ef70bd3a` |
| admin-manual/system-tables/mysql/user | docs/admin-manual/system-tables/mysql/user.md | `e744e2475984e42df15465fe1eae9d6f1a48de03b8027fce828d0ef4ab369318` |
| admin-manual/system-tables/internal_schema/audit_log | docs/admin-manual/system-tables/internal_schema/audit_log.md | `a53600b95177379c8974e9843d596dfe7de91daf69cc1c3685a262699d801263` |
| admin-manual/system-tables/internal_schema/column_statistics | docs/admin-manual/system-tables/internal_schema/column_statistics.md | `62ca51bf03fe0e3e7caffa4917c9fa5aaaa67b8fa33f3fc63538ec6ff5d07b45` |
| admin-manual/system-tables/internal_schema/partition_statistics | docs/admin-manual/system-tables/internal_schema/partition_statistics.md | `89684a9b8d4ce6287d6f1b3dbc659781dbe6a94c68e496ff321f7650c547a180` |
| admin-manual/open-api/overview | docs/admin-manual/open-api/overview.md | `102362eb7fe64fed44d7b14d5e960d332b4bd3a182f254968b972b269fd48fdd` |
| admin-manual/open-api/fe-http/config-action | docs/admin-manual/open-api/fe-http/config-action.md | `00def175ba2f0a273431bf42cb88f8821880834b3283b9c259424cfba24ede6a` |
| admin-manual/open-api/fe-http/ha-action | docs/admin-manual/open-api/fe-http/ha-action.md | `585172568679ae87462c3b26b85b1d1f8dc253efda0e92ceaa716a581d615803` |
| admin-manual/open-api/fe-http/hardware-info-action | docs/admin-manual/open-api/fe-http/hardware-info-action.md | `cc928a0a35b04a4d9927dc0dc6fb748fa609d45224117862a5599d6bd62d3259` |
| admin-manual/open-api/fe-http/help-action | docs/admin-manual/open-api/fe-http/help-action.md | `449635540217f2e22e0f49a4fcab34ffbd5b08f1df11ba62d86004a3e1075bab` |
| admin-manual/open-api/fe-http/log-action | docs/admin-manual/open-api/fe-http/log-action.md | `92f17b3f23ff7cc2a3cb119b6254f651831fbdaf3fd2e4ec81b47089c8cc9718` |
| admin-manual/open-api/fe-http/login-action | docs/admin-manual/open-api/fe-http/login-action.md | `bf27f443eb274c8c92aa9344f2e037ebbf501494a37fb31938bc844f50afc968` |
| admin-manual/open-api/fe-http/logout-action | docs/admin-manual/open-api/fe-http/logout-action.md | `06f6a59cdd5e86fa9a856d1c91edf82a4922249f4dd1f98c64fa4ca0f1d88de9` |
| admin-manual/open-api/fe-http/query-profile-action-controller | docs/admin-manual/open-api/fe-http/query-profile-action-controller.md | `cea497eb478e5430de0c668c875278a23d59e68ff8678bcf7db6076f0f9a5f21` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-025

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1137.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| admin-manual/open-api/fe-http/session-action | docs/admin-manual/open-api/fe-http/session-action.md | `47a561a605f18ae94382733814487d004f2c3159bb806396427d3dadfe598064` |
| admin-manual/open-api/fe-http/system-action | docs/admin-manual/open-api/fe-http/system-action.md | `8101cd8bffb67822659643b97e510278262ef77a0fdb31d21702f81fa34a5310` |
| admin-manual/open-api/fe-http/colocate-meta-action | docs/admin-manual/open-api/fe-http/colocate-meta-action.md | `3d75d81cdd7ab6986aeba7ca2ff042e350ab77ded43fb3be09a51d86e2fa1318` |
| admin-manual/open-api/fe-http/meta-action | docs/admin-manual/open-api/fe-http/meta-action.md | `e86d9923c179c3b4514f24d1d0cbfe1d75131b8d874c20c1f2d5b83412658764` |
| admin-manual/open-api/fe-http/meta-backup-action | docs/admin-manual/open-api/fe-http/meta-backup-action.md | `8cd709db351987933046dd45c2e948639637ca00c3725bc99081b5bc54b98d87` |
| admin-manual/open-api/fe-http/cluster-action | docs/admin-manual/open-api/fe-http/cluster-action.md | `096b661d0712fa892aa9efe659a8fc6c1ea01d78283b7793cb0d4ca210ac61ca` |
| admin-manual/open-api/fe-http/node-action | docs/admin-manual/open-api/fe-http/node-action.md | `8dd23530da2e17d4ca2068689b37b3885b616a8290baea7f1b81ff9e19ea8f27` |
| admin-manual/open-api/fe-http/query-profile-action | docs/admin-manual/open-api/fe-http/query-profile-action.md | `cf36c17328c439fd427ef3b521d00d24cd959f02181ea22460158a200f50ceaf` |
| admin-manual/open-api/fe-http/backends-action | docs/admin-manual/open-api/fe-http/backends-action.md | `2def1fc6b6f1d5a46d19893dc639d2736df5bb6cabc35d9b0f14672a8aeaf9dd` |
| admin-manual/open-api/fe-http/bootstrap-action | docs/admin-manual/open-api/fe-http/bootstrap-action.md | `fa0ec3dbd6d21135db54408bf5813c77d358ea9be66b7f7a621b75a11d750be8` |
| admin-manual/open-api/fe-http/cancel-load-action | docs/admin-manual/open-api/fe-http/cancel-load-action.md | `263f8d577ea88c3f6c71c1659cffb27f295ca91fe4776cc6d3d108b7e5489864` |
| admin-manual/open-api/fe-http/check-decommission-action | docs/admin-manual/open-api/fe-http/check-decommission-action.md | `6d77a8665473233a8614c8564a1e5f434919931e58b0378350c33267874a9a14` |
| admin-manual/open-api/fe-http/check-storage-type-action | docs/admin-manual/open-api/fe-http/check-storage-type-action.md | `a154d493e60a583e075f178b4f1d35b9fe7242a13117955338c93b4e7daa00d4` |
| admin-manual/open-api/fe-http/connection-action | docs/admin-manual/open-api/fe-http/connection-action.md | `c6a42cd93536ad377f6aa680a0c0f91dc7be14a32f4443f964300d7938b9d860` |
| admin-manual/open-api/fe-http/extra-basepath-action | docs/admin-manual/open-api/fe-http/extra-basepath-action.md | `94f307289ee8eeb51db3433c8c18aca5502625dc76b117a4224d63ba32ebae17` |
| admin-manual/open-api/fe-http/fe-version-info-action | docs/admin-manual/open-api/fe-http/fe-version-info-action.md | `5791839869d87602b3f964d9cbc9815a97d746aa73c48319edd754875bdf2dc7` |
| admin-manual/open-api/fe-http/get-ddl-stmt-action | docs/admin-manual/open-api/fe-http/get-ddl-stmt-action.md | `7f1f2d8b79fc975304ec6fe48810e4371bb0baaa087353ce99fa2ef9d38844af` |
| admin-manual/open-api/fe-http/get-load-info-action | docs/admin-manual/open-api/fe-http/get-load-info-action.md | `d6c5a3b2ed6766b1fd97cf1bbe01afbee77c8a50812473b939077d227cd1eaaf` |
| admin-manual/open-api/fe-http/get-load-state | docs/admin-manual/open-api/fe-http/get-load-state.md | `6f7c785ab8c48e082c7d4330898c06ab0cdb1a78f16a7a5d698622e7bf495678` |
| admin-manual/open-api/fe-http/get-log-file-action | docs/admin-manual/open-api/fe-http/get-log-file-action.md | `38599dde35e55b93b7dec102c78bd02c464ea11a286e22eb13325ca0cf82cada` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-026

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1117.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| admin-manual/open-api/fe-http/get-small-file | docs/admin-manual/open-api/fe-http/get-small-file.md | `5bb4a13dab907944b129d4aed9e5afd906f8fa8e0eb4851d72c09f2b4e68c725` |
| admin-manual/open-api/fe-http/get-wal-size-action | docs/admin-manual/open-api/fe-http/get-wal-size-action.md | `d89ed4cf7b21b2346ce8290ca91ac484ed2be554e240e0a49bf84c9573026a5f` |
| admin-manual/open-api/fe-http/health-action | docs/admin-manual/open-api/fe-http/health-action.md | `ab3b3cb61ac3043c4fcc33097022b0f7d002c78e1ff7fa4c234f14924ff788ee` |
| admin-manual/open-api/fe-http/meta-info-action | docs/admin-manual/open-api/fe-http/meta-info-action.md | `1b2630a48a9a4c7846eeb8245351100416186d0658d918cc9f4eb6a0a69b9fd6` |
| admin-manual/open-api/fe-http/meta-replay-state-action | docs/admin-manual/open-api/fe-http/meta-replay-state-action.md | `73d5e9664ac765d7141e4b274195534d2ea67ddbf973dbfa6cde78283212a2d6` |
| admin-manual/open-api/fe-http/metrics-action | docs/admin-manual/open-api/fe-http/metrics-action.md | `22e0ce8401cb8db72b605dd849404e25a48367231e2f9597dc9cfc813883efaf` |
| admin-manual/open-api/fe-http/profile-action | docs/admin-manual/open-api/fe-http/profile-action.md | `71d1a52fddf4f5077c201cd7cd9080f53eabe2c501546b485655aac4f2e0743d` |
| admin-manual/open-api/fe-http/query-schema-action | docs/admin-manual/open-api/fe-http/query-schema-action.md | `58e330bcfd1cf2434a73c981e177cc3ff552f3e1e2f8feccf9c7adbe811e2d24` |
| admin-manual/open-api/fe-http/query-stats-action | docs/admin-manual/open-api/fe-http/query-stats-action.md | `6d569311ff7d97b3db4fa8a9e7ed6d86a3996f7469d39a6a675c093c4ac74c03` |
| admin-manual/open-api/fe-http/row-count-action | docs/admin-manual/open-api/fe-http/row-count-action.md | `bc324d82d3b6c7cf56fd6f9c1aa51d616f2570e53cab9cc7104c19f382126c8e` |
| admin-manual/open-api/fe-http/set-config-action | docs/admin-manual/open-api/fe-http/set-config-action.md | `073402ac92a770caab86256830920e6da38806b073843a78c6c83111861274b1` |
| admin-manual/open-api/fe-http/show-data-action | docs/admin-manual/open-api/fe-http/show-data-action.md | `a0bd8c24705bc7dfee19001cce1826bd35bc05257c63b27d3d3eaa815edd7271` |
| admin-manual/open-api/fe-http/show-meta-info-action | docs/admin-manual/open-api/fe-http/show-meta-info-action.md | `9bb6e703bc0777b74fb50345f6fee9e3e0302a07df8a3a1c348171087c40d656` |
| admin-manual/open-api/fe-http/show-proc-action | docs/admin-manual/open-api/fe-http/show-proc-action.md | `7325b5936a711688066824a9d57862ff453040dfa0b83d7c1ae0fd61e3a8f7b1` |
| admin-manual/open-api/fe-http/show-runtime-info-action | docs/admin-manual/open-api/fe-http/show-runtime-info-action.md | `9a93d43d499d97dc31ff90a714be8b0c86c0a78234cbd5201cfd8043f425b2a6` |
| admin-manual/open-api/fe-http/show-table-data-action | docs/admin-manual/open-api/fe-http/show-table-data-action.md | `20bb1c3890a018a2957309c8c942676d5a162a7dac0a1e647bae676646ea2ce6` |
| admin-manual/open-api/fe-http/statement-execution-action | docs/admin-manual/open-api/fe-http/statement-execution-action.md | `e8d2e6a452d452663706d28e043816c1db8f05bb394b6117bdc5377c772e244e` |
| admin-manual/open-api/fe-http/table-query-plan-action | docs/admin-manual/open-api/fe-http/table-query-plan-action.md | `3129ea36fae5676d3b70499a070050c3ac7ded86ecd6933a06df01d978a373e6` |
| admin-manual/open-api/fe-http/table-row-count-action | docs/admin-manual/open-api/fe-http/table-row-count-action.md | `2c249fe29fc8630cbe6b99123135d8e7bcd068e82157c9e5078c08dcb81c3af3` |
| admin-manual/open-api/fe-http/table-schema-action | docs/admin-manual/open-api/fe-http/table-schema-action.md | `37797f3aeac9b3fcecef47b27f3d7a21c5a79625b566f72b12fcb1daf734f4e1` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-027

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1097.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| admin-manual/open-api/fe-http/upload-action | docs/admin-manual/open-api/fe-http/upload-action.md | `e3fe2cedc250612698af1e78f68a806c6b0f748a15b15e159ba8183c9f4d89a4` |
| admin-manual/open-api/fe-http/import-action | docs/admin-manual/open-api/fe-http/import-action.md | `79bce6bba764fecd9798f24032d13aa60bea6c2e3fb573a97e44475cf5dc8d08` |
| admin-manual/open-api/fe-http/meta-info-action-V2 | docs/admin-manual/open-api/fe-http/meta-info-action-V2.md | `8e4db95e2399cf870fb0626eb7594761f2dba30793c44d97120024bec4a97931` |
| admin-manual/open-api/fe-http/debug-point-action | docs/admin-manual/open-api/fe-http/debug-point-action.md | `93bb1f2bbb5d577e1bd1384a2009b7d7879fdcf39912d63dd71d2c4bda982acd` |
| admin-manual/open-api/fe-http/statistic-action | docs/admin-manual/open-api/fe-http/statistic-action.md | `6c3186267d486851506c2dac2cf66f24ad7a7cb5ea1e1cb9fab1a59d185bf342` |
| admin-manual/open-api/be-http/check-rpc-channel | docs/admin-manual/open-api/be-http/check-rpc-channel.md | `b2caea994bc3034a3fb456708417f29e3e4432fb748f303445a8d70762d6030c` |
| admin-manual/open-api/be-http/reset-rpc-channel | docs/admin-manual/open-api/be-http/reset-rpc-channel.md | `7b60e0560c9ae9ff7a29987ef9d539af41d68afa7bf8c2f969406561ea600732` |
| admin-manual/open-api/be-http/compaction-status | docs/admin-manual/open-api/be-http/compaction-status.md | `ba1fde74912be259cefdf224f3c061902da6a4eb5b114afafc1a4ab1cce10855` |
| admin-manual/open-api/be-http/compaction-run | docs/admin-manual/open-api/be-http/compaction-run.md | `4edc564ac4eaad19b9a0df703556f4231adf8dbc231b55f9db026ba94ce2ffdc` |
| admin-manual/open-api/be-http/meta | docs/admin-manual/open-api/be-http/meta.md | `6c561b93bdb52b298de5ed4a66b46a9c708382fa81418005de1e67ead1ef14b9` |
| admin-manual/open-api/be-http/snapshot | docs/admin-manual/open-api/be-http/snapshot.md | `816b6c44ea0a963cf0fd634fd82a76ecd7ad60833a1e7c87c87fac3eaacfe00e` |
| admin-manual/open-api/be-http/check-tablet-segment | docs/admin-manual/open-api/be-http/check-tablet-segment.md | `c35fc80b53731f883a707cbd63a2b7b6f6a82a52ad6e72d33ea473e1091787b1` |
| admin-manual/open-api/be-http/config | docs/admin-manual/open-api/be-http/config.md | `fea236c1f3f3c2713f542173aee05140661976c37bff70a1f0ecf7dc15aa1ca2` |
| admin-manual/open-api/be-http/metrics | docs/admin-manual/open-api/be-http/metrics.md | `f5f12d116c70619a63c8023af05a66d9fffe7f419bf77fdfdb8dfcd6c4999e17` |
| admin-manual/open-api/be-http/tablet-distribution | docs/admin-manual/open-api/be-http/tablet-distribution.md | `bb0c2b10e31f7ab633cdae0780add856b9c554db4de925eebcb801ebef94abb8` |
| admin-manual/open-api/be-http/tablet-migration | docs/admin-manual/open-api/be-http/tablet-migration.md | `2cadb867fa9b376b7882f98a0dac095c0a2ca7011f2396b3da7bc3264c895d12` |
| admin-manual/open-api/be-http/tablet-info | docs/admin-manual/open-api/be-http/tablet-info.md | `ff6bc20dfdd5502c107b333c738ba922a87bdfc66580dd96151f0c662b749236` |
| admin-manual/open-api/be-http/checksum | docs/admin-manual/open-api/be-http/checksum.md | `71e6fdcb1a6456950e75912e509301e4682343a8b45c6738de5cde024bd0f665` |
| admin-manual/open-api/be-http/download | docs/admin-manual/open-api/be-http/download.md | `fc27dbff6d35b4fa597b746297334a49324eb349c8c9378a1c5cc4004df3f837` |
| admin-manual/open-api/be-http/pad-rowset | docs/admin-manual/open-api/be-http/pad-rowset.md | `dc3f17d3fa46bcf2cc592a5a6043e6675aee117a8a7a6d588dd449393c0d5fba` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-028

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1077.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| admin-manual/open-api/be-http/version-info | docs/admin-manual/open-api/be-http/version-info.md | `b265a7ecf7fcab5e3e6dfefaad874cdd6b472a43cc8c13c4f82d9d3ba04ccd4e` |
| admin-manual/open-api/be-http/health | docs/admin-manual/open-api/be-http/health.md | `501e47f4b1d82635fccd8b4d7ae1acc64c328a96431ea18c89c49b2a837950d0` |
| admin-manual/open-api/be-http/tablet-reload | docs/admin-manual/open-api/be-http/tablet-reload.md | `c50d2819dc5cee00a358b1030df0f547697ae286258e7e1ae12ad893912615bb` |
| admin-manual/open-api/be-http/tablet-restore | docs/admin-manual/open-api/be-http/tablet-restore.md | `88bf083687ca27f66f47b25640ce6c60717e8ca2112c031f79c03cfbb8afd2db` |
| admin-manual/open-api/be-http/be-vlog | docs/admin-manual/open-api/be-http/be-vlog.md | `8879c248bfe430ac867b52a9fe650e3e53e3a4bd95d3754a82c875e8105c576d` |
| admin-manual/trouble-shooting/memory-management/overview | docs/admin-manual/trouble-shooting/memory-management/overview.md | `07ce71b93f2ab4f87fab496946116169793f9b296661247a50b7fdfd4f9c150f` |
| admin-manual/trouble-shooting/memory-management/memory-issue-faq | docs/admin-manual/trouble-shooting/memory-management/memory-issue-faq.md | `72a2293c1e0e36b3f9a70c757b033882b80c650261fed55b2a3cd3f906b97e43` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/jemalloc-memory-analysis | docs/admin-manual/trouble-shooting/memory-management/memory-analysis/jemalloc-memory-analysis.md | `019683e00e5c19d20a070bf0c9027842ce12a2503dad81cafb1f6d2a5700554d` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/global-memory-analysis | docs/admin-manual/trouble-shooting/memory-management/memory-analysis/global-memory-analysis.md | `b53b21a6923a19c4d1c743229eac715cf622a519acfad28e582d9338f641330e` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/doris-cache-memory-analysis | docs/admin-manual/trouble-shooting/memory-management/memory-analysis/doris-cache-memory-analysis.md | `e207f15ade1ddbdab399ddb4c949d9592852bd89d92af2cdfc05d8a4a358b386` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/metadata-memory-analysis | docs/admin-manual/trouble-shooting/memory-management/memory-analysis/metadata-memory-analysis.md | `34e0c7466a562720d2b03fa557b1fea0429a09da135a7d8ffb9450e02d4a4f3d` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/query-memory-analysis | docs/admin-manual/trouble-shooting/memory-management/memory-analysis/query-memory-analysis.md | `8981113b8d0b643eaf88dacd8c1c3549e13ce98c0f9e01c469a8d6648b87ec8c` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/load-memory-analysis | docs/admin-manual/trouble-shooting/memory-management/memory-analysis/load-memory-analysis.md | `750fcb96fc1a78617f626f46b26276930409f135aa6a430f4eca5cf79f2e9dfc` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/query-cancelled-after-process-memory-exceeded | docs/admin-manual/trouble-shooting/memory-management/memory-analysis/query-cancelled-after-process-memory-exceeded.md | `db4229bb45836a3f68f25eb61ea3d82e1c2c186611343e43085d386cc4a064e2` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/query-cancelled-after-query-memory-exceeded | docs/admin-manual/trouble-shooting/memory-management/memory-analysis/query-cancelled-after-query-memory-exceeded.md | `ebca2539590e6bdddc58f69dfa3f8945ab301d1b86a947a8e2441b7f3af01d65` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/oom-crash-analysis | docs/admin-manual/trouble-shooting/memory-management/memory-analysis/oom-crash-analysis.md | `e1af6400d376b0947e232ba3fe1d9611193d943d0d8d48c3627d38084afc3aed` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/memory-log-analysis | docs/admin-manual/trouble-shooting/memory-management/memory-analysis/memory-log-analysis.md | `f165688fb3f20669ddfc4011f6a16a9215a507372e4e4343907f0332edf56157` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/heap-profile-memory-analysis | docs/admin-manual/trouble-shooting/memory-management/memory-analysis/heap-profile-memory-analysis.md | `1ef27a03762e07ab7c2a255ace11a89fb00296faaed8cdabeaff8e9a79c02ed2` |
| admin-manual/trouble-shooting/memory-management/memory-feature/memory-tracker | docs/admin-manual/trouble-shooting/memory-management/memory-feature/memory-tracker.md | `91a2f6f36bef19faf3fb4a96816b0ed7fa57cbd7929aac5b91c378a7ae502f37` |
| admin-manual/trouble-shooting/memory-management/memory-feature/memory-control-strategy | docs/admin-manual/trouble-shooting/memory-management/memory-feature/memory-control-strategy.md | `cf9dad399061120808acdb19ad6f9c0e94e083e88a4f15e47219abd66ba7423e` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-029

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1057.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| admin-manual/trouble-shooting/compaction | docs/admin-manual/trouble-shooting/compaction.md | `20aa4388685584e0b72153eb51b3dd579995ba460bb8568a992aaf5feb259a1b` |
| admin-manual/trouble-shooting/compaction-principles | docs/admin-manual/trouble-shooting/compaction-principles.md | `c832de5481302f4d7b1c7ffb3fcb44c311ab3b76eeee513fcd0cb7011ede302d` |
| admin-manual/trouble-shooting/metadata-operation | docs/admin-manual/trouble-shooting/metadata-operation.md | `f4928968f43f71fe8239711f8aace9a8ae39bd2fc699f474017fadb0c27c886d` |
| admin-manual/trouble-shooting/frontend-lock-manager | docs/admin-manual/trouble-shooting/frontend-lock-manager.md | `c9fb0ae9505bd65f8538f1f9fa82a73e203c26387fb1dadd8a530df59f89963f` |
| admin-manual/trouble-shooting/tablet-local-debug | docs/admin-manual/trouble-shooting/tablet-local-debug.md | `ccbd274d34783c2481eb8d2ee79e60ad74adb1cabd2420e8184ef0a30c1c60b2` |
| admin-manual/trouble-shooting/tablet-meta-tool | docs/admin-manual/trouble-shooting/tablet-meta-tool.md | `180ed4e25707b430afb0834d2d22b3f013ab5783c97500339acb44b2d740cd7b` |
| admin-manual/trouble-shooting/repairing-data | docs/admin-manual/trouble-shooting/repairing-data.md | `e501091297dcfeac8d806d9321f5dc65133887638565d3dcab6810d358f5aa5c` |
| faq/install-faq | docs/faq/install-faq.md | `90fb6c11e2ec0ae6ac973761434fccb6d0112a8c3ff7160fc288b39f3847bb3a` |
| faq/data-faq | docs/faq/data-faq.md | `e59339132c10309a49f76642da45c9a362a404ab47f009292f3448c120c055da` |
| faq/sql-faq | docs/faq/sql-faq.md | `6368556a4756749e84a9fcdfd1fc7bee6d8449d8159bcdaf4a373439f6e35b7b` |
| faq/lakehouse-faq | docs/faq/lakehouse-faq.md | `1f8e4c05cf5a3fc58106830afa27431552a0abe8d6636fdf5be6992bc52dc44c` |
| faq/bi-faq | docs/faq/bi-faq.md | `4f45bc61fb90074ee09a8bbb32e6d1ee3c5e117f22b9f0478eb613273f56bef0` |
| faq/correctness-faq | docs/faq/correctness-faq.md | `d540f6aec81dabcd807abb128f05ef74cd86cca0fc4334bd55a60d06cda28e12` |
| faq/load-faq | docs/faq/load-faq.md | `23d78609e82060464bacc544acbea790ced0dfdeb3275566abe9beaa30e23159` |
| sql-manual/basic-element/sql-data-types/data-type-overview | docs/sql-manual/basic-element/sql-data-types/data-type-overview.md | `e52763bfe5049662e821e2803c80906ae056d069d6642ef978934256b6c2df18` |
| sql-manual/basic-element/sql-data-types/numeric/BOOLEAN | docs/sql-manual/basic-element/sql-data-types/numeric/BOOLEAN.md | `ed80a13ba056c04f52ad0f00c62405cf260253e88c4992678214f02309ea7cd8` |
| sql-manual/basic-element/sql-data-types/numeric/TINYINT | docs/sql-manual/basic-element/sql-data-types/numeric/TINYINT.md | `6c21a7fbcd49e43b1b35bb2582e74da29115a0587d93c8be6d968685dc101a16` |
| sql-manual/basic-element/sql-data-types/numeric/SMALLINT | docs/sql-manual/basic-element/sql-data-types/numeric/SMALLINT.md | `3f348b9077480998b3a14cd13c3995ed111f2ba34c66d1833480a0fa19ca07de` |
| sql-manual/basic-element/sql-data-types/numeric/INT | docs/sql-manual/basic-element/sql-data-types/numeric/INT.md | `be163231911536f29f77838f1a9ff3019afa2f0a2d261d5488d1814bd17986bd` |
| sql-manual/basic-element/sql-data-types/numeric/BIGINT | docs/sql-manual/basic-element/sql-data-types/numeric/BIGINT.md | `bf2a52b6a070bab9380321121b563a08590d49a525e63de920b727a183cec274` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-030

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1037.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/basic-element/sql-data-types/numeric/LARGEINT | docs/sql-manual/basic-element/sql-data-types/numeric/LARGEINT.md | `4e5767b9859fab9bb27088e01eef31e46122d5e087e8bbdb7d9974ea0dfb9573` |
| sql-manual/basic-element/sql-data-types/numeric/DECIMAL | docs/sql-manual/basic-element/sql-data-types/numeric/DECIMAL.md | `88f74fd65db09ff5c2ec6a57340d20a16133b251ec534a3dcd21b435995ecb39` |
| sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT | docs/sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT.md | `b742ab54bb1e8f17672df238666aa7a7ff9cb78b96444da8d9f4be04003375aa` |
| sql-manual/basic-element/sql-data-types/date-time/DATE | docs/sql-manual/basic-element/sql-data-types/date-time/DATE.md | `e1efe0685e075e454811a66bb037325134480ca25e4cba05c156d4895ad987a1` |
| sql-manual/basic-element/sql-data-types/date-time/TIME | docs/sql-manual/basic-element/sql-data-types/date-time/TIME.md | `cad6b0f8e16e6a3979919420922ab70d8b46c29793019685ef3d66189b73f594` |
| sql-manual/basic-element/sql-data-types/date-time/DATETIME | docs/sql-manual/basic-element/sql-data-types/date-time/DATETIME.md | `e490a64f56512acfd53ec209466ca9562922b7dfee3b9cf44a96f994ec264a8e` |
| sql-manual/basic-element/sql-data-types/date-time/TIMESTAMP-NS | docs/sql-manual/basic-element/sql-data-types/date-time/TIMESTAMP-NS.md | `1152ee5f855787b43f5e5aafd6009db42f4e3ae88ee671db6b297083c5c22cd2` |
| sql-manual/basic-element/sql-data-types/date-time/TIMESTAMPTZ | docs/sql-manual/basic-element/sql-data-types/date-time/TIMESTAMPTZ.md | `c6fc43ca2bc386402a7d0380688f1b7823763349c0a7ec3bd9b605d6b907c85a` |
| sql-manual/basic-element/sql-data-types/string-type/CHAR | docs/sql-manual/basic-element/sql-data-types/string-type/CHAR.md | `f205ede2f8ec31efd7e7207ef069e72fad407d2747f975db42030bf8abb377ac` |
| sql-manual/basic-element/sql-data-types/string-type/VARCHAR | docs/sql-manual/basic-element/sql-data-types/string-type/VARCHAR.md | `0f4fa9829196e9a8146697797a229c11ac03781b4143231cd0c084af6fa225d9` |
| sql-manual/basic-element/sql-data-types/string-type/STRING | docs/sql-manual/basic-element/sql-data-types/string-type/STRING.md | `9169b4533c57ecae822213ddb5190860ab2f49270db7bed387d70bd254f06867` |
| sql-manual/basic-element/sql-data-types/binary-type/VARBINARY | docs/sql-manual/basic-element/sql-data-types/binary-type/VARBINARY.md | `37686de7eed3e80c1ffe82ebe2189eece9f4e8fbfa3ac7af322af05e1af22a9b` |
| sql-manual/basic-element/sql-data-types/semi-structured/ARRAY | docs/sql-manual/basic-element/sql-data-types/semi-structured/ARRAY.md | `029508a024937fa8ab31835e767208b190ea745dddab438f2022642b8815be29` |
| sql-manual/basic-element/sql-data-types/semi-structured/GEO | docs/sql-manual/basic-element/sql-data-types/semi-structured/GEO.md | `b91e217238f3938c20fceb4c31bad4187942bc658fa7c3f1180dcc27f5af1e17` |
| sql-manual/basic-element/sql-data-types/semi-structured/MAP | docs/sql-manual/basic-element/sql-data-types/semi-structured/MAP.md | `51816178cc61439f2fe5fc304ca243ecf485cc8c8c5dd9dcbc60bec34b4c652a` |
| sql-manual/basic-element/sql-data-types/semi-structured/STRUCT | docs/sql-manual/basic-element/sql-data-types/semi-structured/STRUCT.md | `0e721c4cfaeadee043a4061e4dcf5e2424e102a894bd7a63ce85f7ddbd54632b` |
| sql-manual/basic-element/sql-data-types/semi-structured/JSON | docs/sql-manual/basic-element/sql-data-types/semi-structured/JSON.md | `44e0590952d928738a596a3b6bab8578a6112ead90fda4d25533df62e6c9266b` |
| sql-manual/basic-element/sql-data-types/semi-structured/VARIANT | docs/sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md | `2375517acc50a23a789a4ccfe075a7046b2964579e3e447dea0fe2b403f8f16e` |
| sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide | docs/sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide.md | `bec80bdd9204e324ea1c3dd03f54b067fba081a3cf9e00defa918e10b1ef1577` |
| sql-manual/basic-element/sql-data-types/aggregate/HLL | docs/sql-manual/basic-element/sql-data-types/aggregate/HLL.md | `d3691582124f5f8e6ce54fc8f87d18db1a381a05793822ca08e8a546ff13642d` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-031

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 1017.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/basic-element/sql-data-types/aggregate/BITMAP | docs/sql-manual/basic-element/sql-data-types/aggregate/BITMAP.md | `f819c0b9c57bf443e793aa861f7fdb0f70d60c36ac9214838b4d70a08cfb1bdb` |
| sql-manual/basic-element/sql-data-types/aggregate/QUANTILE-STATE | docs/sql-manual/basic-element/sql-data-types/aggregate/QUANTILE-STATE.md | `3d6f437469d18715c6e0e2a1a5545ee1975fc7ae94f930962614bb6bdd76ece3` |
| sql-manual/basic-element/sql-data-types/aggregate/AGG-STATE | docs/sql-manual/basic-element/sql-data-types/aggregate/AGG-STATE.md | `6c5832cc2b4eeb47dfaafefe4f5cc899798f3f8533f1c8de7a6fd09af98d9216` |
| sql-manual/basic-element/sql-data-types/ip/IPV4 | docs/sql-manual/basic-element/sql-data-types/ip/IPV4.md | `c950b977b3f698373b6609d62fd80e30260eca622c1645b558d64de45c4cdfc4` |
| sql-manual/basic-element/sql-data-types/ip/IPV6 | docs/sql-manual/basic-element/sql-data-types/ip/IPV6.md | `3c52ab31c8095057e5823b811920cf2cc92208f1b34c01b79292b9d17f086ed9` |
| sql-manual/basic-element/sql-data-types/uuid | docs/sql-manual/basic-element/sql-data-types/uuid.md | `38696c6457a8c52c7b2fcad3afa5b60456ad393a7d6753268d11d0eef75572d7` |
| sql-manual/basic-element/sql-data-types/conversion/overview | docs/sql-manual/basic-element/sql-data-types/conversion/overview.md | `db04a16ef780137380d4cb61908dde272e0d47d458443ac88c4063be6764ece1` |
| sql-manual/basic-element/sql-data-types/conversion/cast-expr | docs/sql-manual/basic-element/sql-data-types/conversion/cast-expr.md | `b91f1337d6df3bf0e7232fa40676e1aa3d4748255b8db69b3e8c392ce5debca4` |
| sql-manual/basic-element/sql-data-types/conversion/cast-to-string | docs/sql-manual/basic-element/sql-data-types/conversion/cast-to-string.md | `125ea6df0515b7be8d7ce6b12153eca918afe7dbe6be91f7e0605f0f5988d3f8` |
| sql-manual/basic-element/sql-data-types/conversion/array-conversion | docs/sql-manual/basic-element/sql-data-types/conversion/array-conversion.md | `4acae3bd9f08c048ae91bb25b3fe0ac868e81734e04940854f2ca9f5d56e6be2` |
| sql-manual/basic-element/sql-data-types/conversion/boolean-conversion | docs/sql-manual/basic-element/sql-data-types/conversion/boolean-conversion.md | `a803cddc9db2af327a71cfd799d1581d54082c8529fd49939d86ddf39e2e524e` |
| sql-manual/basic-element/sql-data-types/conversion/date-conversion | docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion.md | `1a83c2a98f5011ac242041e0e9018d90c50616ac1875282e65be3d90e4fcc9ef` |
| sql-manual/basic-element/sql-data-types/conversion/datetime-conversion | docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion.md | `91dea6c8438bfe5dbad9ec0a96f82e28437115c390361da8e7fe82510bb9b5a0` |
| sql-manual/basic-element/sql-data-types/conversion/timestamp-ns-conversion | docs/sql-manual/basic-element/sql-data-types/conversion/timestamp-ns-conversion.md | `6d99db16a6e285c7090ef0fba49612d6e07e7dd555cb8260ddc6cb5392210ba0` |
| sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion | docs/sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion.md | `f070d2a2ff14148300f646cb4519c5c43e0dbf3516438e4f1d0fc34533fb435f` |
| sql-manual/basic-element/sql-data-types/conversion/decimal-conversion | docs/sql-manual/basic-element/sql-data-types/conversion/decimal-conversion.md | `d1eee5837d2f0a73897d09deceb1443bc048b57aa619e745a11847e208dc0f93` |
| sql-manual/basic-element/sql-data-types/conversion/float-double-conversion | docs/sql-manual/basic-element/sql-data-types/conversion/float-double-conversion.md | `5c28061ad36ea5c202467587b9d9e6fc71ad70fd4e5ed4dd4f485a2a7abd190f` |
| sql-manual/basic-element/sql-data-types/conversion/int-conversion | docs/sql-manual/basic-element/sql-data-types/conversion/int-conversion.md | `f40d43e8c831e48a85d6de3604e1d7e7a731b2b3df77993ae0f2e622d81a211d` |
| sql-manual/basic-element/sql-data-types/conversion/ip-conversion | docs/sql-manual/basic-element/sql-data-types/conversion/ip-conversion.md | `3f8947c121018d2ff91d7aa1f1f1e238c945c41eefdc125627ad651931d1298e` |
| sql-manual/basic-element/sql-data-types/conversion/json-conversion | docs/sql-manual/basic-element/sql-data-types/conversion/json-conversion.md | `be9d3d54c8302dee146fcc6feef3d15b01aef63511ea505343db5887a4570fa6` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-032

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 997.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/basic-element/sql-data-types/conversion/map-conversion | docs/sql-manual/basic-element/sql-data-types/conversion/map-conversion.md | `d9880e4a74f003cdc30662d31e870e4a032bb3ec23700cbc2b007c7e1d37701b` |
| sql-manual/basic-element/sql-data-types/conversion/struct-conversion | docs/sql-manual/basic-element/sql-data-types/conversion/struct-conversion.md | `9672feff9fdbe4de67befcffa23739c9c9b91c633ed2fa80026887874ae08753` |
| sql-manual/basic-element/sql-data-types/conversion/time-conversion | docs/sql-manual/basic-element/sql-data-types/conversion/time-conversion.md | `f70c836adecd7c5bdb479985c01514ea9fcfa77a607ed87187a2bafb62dfa5ec` |
| sql-manual/basic-element/sql-data-types/conversion/uuid-conversion | docs/sql-manual/basic-element/sql-data-types/conversion/uuid-conversion.md | `838b4469fc773eb450f974718bf215495c4f634d9e748307ce524f6aa3bf959f` |
| sql-manual/basic-element/literal/numeric-literal | docs/sql-manual/basic-element/literal/numeric-literal.md | `a21c13f9a55b92772f3064a313eb2d9a0a1fdb8579423f1d3933b43633123f84` |
| sql-manual/basic-element/literal/string-literal | docs/sql-manual/basic-element/literal/string-literal.md | `a31cf1c6cdcb896da6088b05f08b92fa56b82f7f9e6e54e50ff576fe5e986849` |
| sql-manual/basic-element/literal/date-literal | docs/sql-manual/basic-element/literal/date-literal.md | `59d9c6d10ef78107e42a200db4e86ecd36dd69cf6400f4a7ba535619d71ad5a2` |
| sql-manual/basic-element/nulls | docs/sql-manual/basic-element/nulls.md | `8d8cd73e49ebc73593d66d6f2cbeef5ad71ff8d2ee30c2a19eb6d449d7f65dd4` |
| sql-manual/basic-element/object-identifiers | docs/sql-manual/basic-element/object-identifiers.md | `89737a3128c6cb2b5cec4c86eb51fbf1a2a360f3ad1d3d6a3a040ca5d82752d4` |
| sql-manual/basic-element/reserved-keywords | docs/sql-manual/basic-element/reserved-keywords.md | `de04309261acafdf729f4357f9d3cc422b2813f3c67f19ef1b87f904e2479e2e` |
| sql-manual/basic-element/variables | docs/sql-manual/basic-element/variables.md | `6c3d4b7d7693306963c2b4286b8f315719e3e2381755bd07789d1983d95ab664` |
| sql-manual/basic-element/session-variables | docs/sql-manual/basic-element/session-variables.md | `4f37b27e1ed6475d83f6086c83b0c1b6ef019b9ecd9a87ec7db907bc9b57f730` |
| sql-manual/basic-element/comments | docs/sql-manual/basic-element/comments.md | `c4ff6782cc393008739db78ab50bd64c18a19f3988e3e6078316e4e92d0fc902` |
| sql-manual/basic-element/file-path-pattern | docs/sql-manual/basic-element/file-path-pattern.md | `23a258f4a132c193b8b38e2e26d4f7308310acecfc63c72bd0257e9183c60b65` |
| sql-manual/basic-element/operators/arithmetic-operators | docs/sql-manual/basic-element/operators/arithmetic-operators.mdx | `3e189734e92dd098007f19ff885b97261401129520173668ef2233504c6a06ba` |
| sql-manual/basic-element/operators/conditional-operators/logical-operators | docs/sql-manual/basic-element/operators/conditional-operators/logical-operators.md | `ae6f6229b0226e4074c8478d01951b6fd0af75fc40123ac8ad77ccbf107b1609` |
| sql-manual/basic-element/operators/conditional-operators/comparison-operators | docs/sql-manual/basic-element/operators/conditional-operators/comparison-operators.md | `a082a405231f797934ffb242e64576235be10327abf4b784da46a5283268368a` |
| sql-manual/basic-element/operators/conditional-operators/boolean-testing-operators | docs/sql-manual/basic-element/operators/conditional-operators/boolean-testing-operators.md | `168545093d0d594a45519a7911815e3dc4f9efa1ff747fe9edc72edde08e2742` |
| sql-manual/basic-element/operators/conditional-operators/pattern-matching-operators | docs/sql-manual/basic-element/operators/conditional-operators/pattern-matching-operators.md | `9660f3e2e6ec8d97761e6e322d16f76781fdf9417bfb861953ad366e84892434` |
| sql-manual/basic-element/operators/conditional-operators/full-text-search-operators | docs/sql-manual/basic-element/operators/conditional-operators/full-text-search-operators.md | `12dac40073c99aca5697f3f048d92231b3d6a33d43706731ca8d0ea36b6f6fff` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-033

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 977.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/basic-element/operators/conditional-operators/in-operators | docs/sql-manual/basic-element/operators/conditional-operators/in-operators.md | `3978d283c30f3877a83bbeb95a332715553d9572944bdba48de8bbcf4de2738c` |
| sql-manual/basic-element/operators/conditional-operators/exists-operators | docs/sql-manual/basic-element/operators/conditional-operators/exists-operators.md | `9643b03904c1731c7567f692b22c734ee6ea7dbb28a891cbedb6d7b7b567a043` |
| sql-manual/basic-element/operators/bitwise-operators | docs/sql-manual/basic-element/operators/bitwise-operators.md | `837be4b3c8876304787e8208c2cc5ada08d09d240ba6a6d05140c4cf366ca813` |
| sql-manual/basic-element/operators/assignment-operators | docs/sql-manual/basic-element/operators/assignment-operators.md | `1bc3568ce97fa218363e3d8aa17b077f70cb3aa1b03bb91b8890a4c63b324a0c` |
| sql-manual/basic-element/operators/operator-precedence | docs/sql-manual/basic-element/operators/operator-precedence.md | `190096440b6317c9e2eaef951c15d38d5eb848c85c8136e15483599f5d82f840` |
| sql-manual/sql-functions/ai-functions/distance-functions/cosine-distance | docs/sql-manual/sql-functions/ai-functions/distance-functions/cosine-distance.md | `f38259b050965c8f804c5035eb6b65b686e18374bbd8015f233024a209c095a2` |
| sql-manual/sql-functions/ai-functions/distance-functions/cosine-similarity | docs/sql-manual/sql-functions/ai-functions/distance-functions/cosine-similarity.md | `4f3ca55a4165388cf54f3cadc8fc2b99b21abb8e693ece7460cd82cb4398578a` |
| sql-manual/sql-functions/ai-functions/distance-functions/inner-product | docs/sql-manual/sql-functions/ai-functions/distance-functions/inner-product.md | `2c71e038dd266a192383c9e626cc8b945dfbe2e464b565f08b7bb28d94f6d031` |
| sql-manual/sql-functions/ai-functions/distance-functions/l1-distance | docs/sql-manual/sql-functions/ai-functions/distance-functions/l1-distance.md | `2fb7bad1c36cb06bc559d92eaa43f180a326a9b72679c61281fa24b79425376a` |
| sql-manual/sql-functions/ai-functions/distance-functions/l2-distance | docs/sql-manual/sql-functions/ai-functions/distance-functions/l2-distance.md | `2203ac5e43234853dbe7a9e162d3713ed86bdd2c2b6cb697deee061a0e10c9bf` |
| sql-manual/sql-functions/ai-functions/distance-functions/embed | docs/sql-manual/sql-functions/ai-functions/distance-functions/embed.md | `f9e011efa596b674fbd99820e712992f5c4c2cfbe91165639798f9b3d500a65d` |
| sql-manual/sql-functions/ai-functions/overview | docs/sql-manual/sql-functions/ai-functions/overview.md | `b22304f55a5559c34b1a4887ba2d739ae0d95633cd0036d5a5e87aeee345a103` |
| sql-manual/sql-functions/ai-functions/ai-classify | docs/sql-manual/sql-functions/ai-functions/ai-classify.md | `02e55a6c5ac0765454280463c751930feba24aae5298e500f10df2d3a8186798` |
| sql-manual/sql-functions/ai-functions/ai-extract | docs/sql-manual/sql-functions/ai-functions/ai-extract.md | `3c8c643ecea9165fd4df989c1385c3000ff37846f9df64c6843352eb0662c0ba` |
| sql-manual/sql-functions/ai-functions/ai-filter | docs/sql-manual/sql-functions/ai-functions/ai-filter.md | `eab4f92faff07c6336ae58cd589bbe3a308c03d0a1c81828dadb7ab98e156f98` |
| sql-manual/sql-functions/ai-functions/ai-fixgrammar | docs/sql-manual/sql-functions/ai-functions/ai-fixgrammar.md | `83a87b0780d08ca96d02800da4e411e339af0967318c8b402cdfafbbf9b27c6a` |
| sql-manual/sql-functions/ai-functions/ai-generate | docs/sql-manual/sql-functions/ai-functions/ai-generate.md | `935e5e2a6719ceda072c6d0cbac167d396f532b176610fe6aecc22327f6ed3d2` |
| sql-manual/sql-functions/ai-functions/ai-mask | docs/sql-manual/sql-functions/ai-functions/ai-mask.md | `6783271d3d1a343809fd15f9cc54209e4946d8dd2b8b8563237a8ba722d0a4e6` |
| sql-manual/sql-functions/ai-functions/ai-sentiment | docs/sql-manual/sql-functions/ai-functions/ai-sentiment.md | `168188bf1e51e81df4b209cb340985677deee8df2046a8294c8d4caa470b6e9d` |
| sql-manual/sql-functions/ai-functions/ai-similarity | docs/sql-manual/sql-functions/ai-functions/ai-similarity.md | `3502c3fc5686f045b3d4e0d6946bfb7fec2f1612d683f95c6920124f439ecbd5` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-034

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 957.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/ai-functions/ai-summarize | docs/sql-manual/sql-functions/ai-functions/ai-summarize.md | `5edf9bba0d9c351b2a82d263178691e35f0c3fff2683a63b5291e830741d94f0` |
| sql-manual/sql-functions/ai-functions/ai-translate | docs/sql-manual/sql-functions/ai-functions/ai-translate.md | `43738adf3659de81b78eff5da99a2bc083ca9e6b04b337cb1bedf979a5379a61` |
| sql-manual/sql-functions/scalar-functions/uuid-functions/uuid-v4 | docs/sql-manual/sql-functions/scalar-functions/uuid-functions/uuid-v4.md | `8eaacff318f4aa5cf63c50c3f42b435df1df7800db2f0b73c9ff6a765d6db8bf` |
| sql-manual/sql-functions/scalar-functions/uuid-functions/uuid-v7 | docs/sql-manual/sql-functions/scalar-functions/uuid-functions/uuid-v7.md | `0161e7f53d4bbcc30a634d311238125a6e15c0fe0af5ff9e49441bf1e0c0abc5` |
| sql-manual/sql-functions/scalar-functions/uuid-functions/uuid-version | docs/sql-manual/sql-functions/scalar-functions/uuid-functions/uuid-version.md | `77bd8acb529b43e830dde79dd166f706798c98bbdc6b426fb99448a72b6bd01b` |
| sql-manual/sql-functions/scalar-functions/uuid-functions/to-uuid-or-null | docs/sql-manual/sql-functions/scalar-functions/uuid-functions/to-uuid-or-null.md | `c26ce70c13c9a308d5244edce70e3cc65093adf3f429b9782a1b7d886b0e83ae` |
| sql-manual/sql-functions/scalar-functions/uuid-functions/to-uuid-or-zero | docs/sql-manual/sql-functions/scalar-functions/uuid-functions/to-uuid-or-zero.md | `311bbd67680571d2f2e33d44b29c2d551808f3eca08b58c94082dec3eacaf4f0` |
| sql-manual/sql-functions/scalar-functions/uuid-functions/to-uuid-or-default | docs/sql-manual/sql-functions/scalar-functions/uuid-functions/to-uuid-or-default.md | `f23ff7e1d235cb28907f45495ea48c426861f2b525b33cd846de0de3b5f889a8` |
| sql-manual/sql-functions/scalar-functions/uuid-functions/uuid-v7-to-datetime | docs/sql-manual/sql-functions/scalar-functions/uuid-functions/uuid-v7-to-datetime.md | `6e727cebb3272b830e0b233a4d032b6bfd1bb2ddd0f6c88c8d50cc39a82cd424` |
| sql-manual/sql-functions/scalar-functions/uuid-functions/datetime-to-uuid-v7 | docs/sql-manual/sql-functions/scalar-functions/uuid-functions/datetime-to-uuid-v7.md | `07ac762b7cc202f38e1c0fe5ccce187baa20c79bcbe9829ccd5b9641b3fb7a70` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/abs | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/abs.md | `516e34fd5a54dc7e6ddfcf2e98cfd015d6440ba8757755193b5845918ded12ad` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/acos | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/acos.md | `144b868a63e7c1942ebe38705891409ad7155e8893facd28edd0230061843269` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/acosh | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/acosh.md | `e6532e1e59ebce57cf625518c51d38c768279ff8a582b0f22b2e9618877858eb` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/asin | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/asin.md | `d153b24ead67732c32cfe7bffc614f049e7edbb15c940ac5183eeab862dda421` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/asinh | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/asinh.md | `71df13b1382b8aab5f4f663fdab049e79c5d810cd5c934e491c02c615b32605b` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/atan | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/atan.md | `98fcd6d4237557ed5d074174ba1be818c6c301e122369eaad91183b63a9eb41e` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/atan2 | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/atan2.md | `4c18e6a974e5499cdb30f33eb93dddd61008fd6f05d103933858a96145c78411` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/atanh | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/atanh.md | `14e1729139930f46c5c02fbf80314586f90c957386a69f5591eaac69a1213550` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/bin | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/bin.md | `bdd568ff024c07de52d64522bfd3821575b00873b9e4663a77d17b04eadb2e6a` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/cbrt | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/cbrt.md | `ffc19331a956251dccffe3af3681534bffc40b2644dcc9d5af43c8b3aa3988b5` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-035

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 937.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/numeric-functions/ceil | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/ceil.md | `c2aff17d5b3468b6dc1396c0a638b14cccba3e0576019d80b9d2e9ce2ce1d9d9` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/conv | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/conv.md | `28fa89347deb4203cbcf2b2aed81e172bd203684ed424d05e8de19f3c52cb561` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/cos | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/cos.md | `94ecb3cd883c1f53624e76ecbb471d1863cabdb9b1739d7acc2b68c05aabfc8a` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/cosh | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/cosh.md | `05da784af4aaf3c3b93e4823f5c7d3050f38deb0f343aa1766ebd1433efb5818` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/cot | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/cot.md | `4a50de1c89dd1326e41927bc947f11a955be58f8d26a9aa1040712a9f243ea10` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/csc | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/csc.md | `b927045a5e0da78d00e1d38c45e15e89569f8a119dd283e40386c59733f7fbdb` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/degrees | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/degrees.md | `47296d3d6eaf8ee017e1b08eda62fccef1bd32f4ece239d037fef867273a06a1` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/e | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/e.md | `7a15705a16b9662357190583a3f605beea56877824e388cc34cd8a12838dc233` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/exp | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/exp.md | `640b68b822b793f18a644fca6eeb488e445fa9aad807aed1ccc3c0bc282ff23f` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/factorial | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/factorial.md | `49b2de90a1e8571d66424e514d7c3828cfca4f1e6233afe8827cb9765daf38be` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/floor | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/floor.md | `c5d6d401cbf206b87f947e8adea54425de3db58974e8aa9d58c68447bf02d6b9` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/fmod | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/fmod.md | `23408e7ef997ac1f55e4f6de77ee4b96614d4635090b7c09ff6062cbc2629700` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/format-round | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/format-round.md | `e23c7a7dd2617d6b234383f8840fd2442f76b8cd0afe6122b00c72aea1b03157` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/interval | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/interval.md | `b07125c640318eaa68639e8031095b11c3b532fbc833e45595b05bdb935f11ce` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/isinf | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/isinf.md | `18bb6d8652fb679eff2c2b77ad088cfa5515f655f603a1710d4fcc06d0f77caa` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/isnan | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/isnan.md | `4b19419fda3b66a4d71318760de69e14e71db822fe5c9fe6669ea142aa795d71` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/ln | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/ln.md | `dd803f19aa76a3abd00f60279fabf8a1de129a2d7e9ef2f98640ddb26cf34dab` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/log | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/log.md | `3ec8e3c24f155c3cfe322a5aa4f1c4361121a61f1ebe5392c295081dfd4d8fbb` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/log10 | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/log10.md | `40bdb411aaebe756eb9da70476d19351385f3dec78feafad8efb8a06e8fb6f92` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/log2 | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/log2.md | `d08413f2100b95ccf6e27f785c181ad73276a5e02ce337d1bec84d739e0baaed` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-036

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 917.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/numeric-functions/mod | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/mod.md | `4fd5d19b77a296fb5b5852ad1528500449feb7253c7af136579977ed5fb9e225` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/money-format | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/money-format.md | `0d98b41d61981874dc4ab8ea5dccf60d46f4a340f29f1d4f08713d4055102ebf` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/negative | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/negative.md | `e5284ebe0ea1d35a32a61c433212018d9d5a250a936ed0877ad4aa71afe464d3` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/normal-cdf | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/normal-cdf.md | `937e63eb624b03ab7faefd843b744a37262ee0571e965d67c061388975677354` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/pi | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/pi.md | `845e233fc50404ebbefcdf7719866244fd3bc7f933f320f117603c8af7e71d81` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/pmod | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/pmod.md | `d977c153b9c845420c58cc7e873e9f10326eea9b1ed7a2cf9bf4ff6e279acb86` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/positive | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/positive.md | `f26f1d38dffbd922cba8dda5a85863abf0202762a5c4d88a33cb410926a0f440` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/pow | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/pow.md | `4f4fbf6293a4804d1a90a61a91506d1cd6c9aa9647d656eafcb0ea8045c1605c` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/radians | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/radians.md | `fba9a594b2561dc5d2a5022e9a61a6b3bc4767c4f6ea64c77e24dd2b3fbfaef7` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/random | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/random.md | `4b0bb65cf72644132fb44b1cdf38be48704a8cf78b870acdb8364413d7da7df3` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/round | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/round.md | `296c03975e301833127b24e92425608917e1d0043e297640e176c10258295526` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/round-bankers | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/round-bankers.md | `18e3e4c1bd9d6ddb0b294989dd5979c7bc4dbc03188bc5a5c301866d4bb815a5` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/sec | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/sec.md | `3797ae945a4dff59613154fa2ff371978aa99e375c0e75dba5089db14585ed51` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/sign | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/sign.md | `8e527a11e55373d210471d3842cffcc83215d30e54564fbdcc1fbb014cfda316` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/sin | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/sin.md | `a704a240bbcbd367e646c19dba6e5b00907264b133f4295a21244044254f67fc` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/sinh | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/sinh.md | `0e12e9db93f515e2dba2423f7998f54f7200cbbac0b3fa1d4b2d8a40f1866ed9` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/sqrt | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/sqrt.md | `9124026d3d2f6dd9e7ec6e5f7a4621489e5d96ef8da47b6bd4a358f597f584cf` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/tan | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/tan.md | `3814450d250f72cab47ae6e9880e9ddfc5bb91c67953eef3a625c9751bfbf162` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/tanh | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/tanh.md | `630ea0f6a244d4b00f657dc352dc6273c5ca085333cca8a204569e6149c29a00` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/truncate | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/truncate.md | `5db4080137542ef7609b68e420ddd9251a60d46934fb694146cd87d5999004b2` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-037

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 897.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/numeric-functions/uniform | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/uniform.md | `e068bfd5958bc64480fa1932409f06233d5577ad5193153c7fbecb2eefca04b7` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/uuid_numeric | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/uuid_numeric.md | `70b67ba7ce89160a1130e10597442844dcc0dcdfafe3d50d55bd0c79f2b2e694` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/width-bucket | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/width-bucket.md | `ab0b6819a4d3a8b5a7a4497f30cc19971a05daa6db6c86ec5a07bcd39e3a0942` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/even | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/even.md | `438bae616bd346735f9afc1b44e3710652c1b4e844851d07aa05d92dc526cc14` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/signbit | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/signbit.md | `2b4fa504b1e3077a78aa6e3004ce2852e1d8b50fa585f777c89a834ce9216865` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/gcd | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/gcd.md | `b95bb5db92961783be1407e9e62a215543d3e8f4b4ed1d1d3592966591a5c7c9` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/lcm | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/lcm.md | `d62ebf2407855d8f242e5c052a663750deef69255127092049c2db2046edca79` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/xor | docs/sql-manual/sql-functions/scalar-functions/numeric-functions/xor.md | `286e610edcdabd5b89cd892d7cb751139b6bfbb77604df92abfb9363224ca32c` |
| sql-manual/sql-functions/scalar-functions/string-functions/overview | docs/sql-manual/sql-functions/scalar-functions/string-functions/overview.md | `3d7c10125d6dca7bbdccff395d80087670f5e073f8d1f5e5c7e9cbb4ef73d0b6` |
| sql-manual/sql-functions/scalar-functions/string-functions/append-trailing-char-if-absent | docs/sql-manual/sql-functions/scalar-functions/string-functions/append-trailing-char-if-absent.md | `0f7885043c7aa4ee03372d5b30361a3b60e7125ad1ba1d4cb4330c0ea381e5cc` |
| sql-manual/sql-functions/scalar-functions/string-functions/ascii | docs/sql-manual/sql-functions/scalar-functions/string-functions/ascii.md | `3e14d123d41ca705298bba6de6dcf8943d501b9a7398dc912a719a775729373d` |
| sql-manual/sql-functions/scalar-functions/string-functions/auto-partition-name | docs/sql-manual/sql-functions/scalar-functions/string-functions/auto-partition-name.md | `c766c02639d30b7c4bc2c7ff40bfa6af08c60e1b5e6be653d536072cc099fcc5` |
| sql-manual/sql-functions/scalar-functions/string-functions/char | docs/sql-manual/sql-functions/scalar-functions/string-functions/char.md | `834bfda7f4c213f2d7d9ecbf5ce6210b7ae27ef0679c4de509487253fefb7a4e` |
| sql-manual/sql-functions/scalar-functions/string-functions/char-length | docs/sql-manual/sql-functions/scalar-functions/string-functions/char-length.md | `71087c749ced75d6e43e937c4b6f16e4f864a89102900135417ba2a7b84fa405` |
| sql-manual/sql-functions/scalar-functions/string-functions/concat | docs/sql-manual/sql-functions/scalar-functions/string-functions/concat.md | `79a809cef2d63b530949e2e2dccb615ff17c619d723fb6d91cfb7937180f328e` |
| sql-manual/sql-functions/scalar-functions/string-functions/concat-ws | docs/sql-manual/sql-functions/scalar-functions/string-functions/concat-ws.md | `f5c8d14c3369ee7df99c1684b815e1927e6b4d8f526bcf679d026d628812a1f7` |
| sql-manual/sql-functions/scalar-functions/string-functions/compress | docs/sql-manual/sql-functions/scalar-functions/string-functions/compress.md | `63147c3c840b70169640f14e7425914288be57fd92c3b19cd42ca997bae47dcb` |
| sql-manual/sql-functions/scalar-functions/string-functions/count_substrings | docs/sql-manual/sql-functions/scalar-functions/string-functions/count_substrings.md | `a9193df1a6bf75c4902a59b84ef108038353f6f28a30f646739f67f1fe104446` |
| sql-manual/sql-functions/scalar-functions/string-functions/cut-to-first-significant-subdomain | docs/sql-manual/sql-functions/scalar-functions/string-functions/cut-to-first-significant-subdomain.md | `e462e705f7d8240570fca94a67ef131e21d106d398e41a4dc89a708ee26934f5` |
| sql-manual/sql-functions/scalar-functions/string-functions/damerau_levenshtein_distance | docs/sql-manual/sql-functions/scalar-functions/string-functions/damerau_levenshtein_distance.md | `5af7a9f17e75b7b403a69f151a11a732b2abd78dd411842268526acd9f9c271a` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-038

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 877.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/string-functions/digital-masking | docs/sql-manual/sql-functions/scalar-functions/string-functions/digital-masking.md | `2b761d6e4423fa27f25d08bc619356489ac2309f5f1ca60c56d53cb9683fc6ab` |
| sql-manual/sql-functions/scalar-functions/string-functions/domain | docs/sql-manual/sql-functions/scalar-functions/string-functions/domain.md | `89dbe5afc71db2afda019e0d139f72ea2694793b6541df6b8cc7600fdd4c8779` |
| sql-manual/sql-functions/scalar-functions/string-functions/domain-without-www | docs/sql-manual/sql-functions/scalar-functions/string-functions/domain-without-www.md | `a9de900099ccafe281a89ab5a1f23fd56fa8f5122269ee4317670e4706375eaa` |
| sql-manual/sql-functions/scalar-functions/string-functions/ends-with | docs/sql-manual/sql-functions/scalar-functions/string-functions/ends-with.md | `7f6b35cc22c5e39ad462d708497a4401551780c603c377c0fd2e6c896181713c` |
| sql-manual/sql-functions/scalar-functions/string-functions/export-set | docs/sql-manual/sql-functions/scalar-functions/string-functions/export-set.md | `e2615b26129a73082d1f5c23abf6561787a537a8001030d11a223a4b47a2079d` |
| sql-manual/sql-functions/scalar-functions/string-functions/elt | docs/sql-manual/sql-functions/scalar-functions/string-functions/elt.md | `57ad66b757435060dd5a6e50be20812d0d07f3875dca3e2182ca6c9990a22195` |
| sql-manual/sql-functions/scalar-functions/string-functions/extract-url-parameter | docs/sql-manual/sql-functions/scalar-functions/string-functions/extract-url-parameter.md | `e8ac138405e493f37f18152979f119d0e65a80d0a1b73111fbf4b3e09f57d823` |
| sql-manual/sql-functions/scalar-functions/string-functions/from-base64 | docs/sql-manual/sql-functions/scalar-functions/string-functions/from-base64.md | `8842cc0d37c72ffa48e6f466d18ce42083aca4791d118081cd57061d086001c8` |
| sql-manual/sql-functions/scalar-functions/string-functions/find-in-set | docs/sql-manual/sql-functions/scalar-functions/string-functions/find-in-set.md | `937320abcf7d98cfcb6d47060c12fe9760cc1a426da519e122e5cd90e9a0ee14` |
| sql-manual/sql-functions/scalar-functions/string-functions/first-significant-subdomain | docs/sql-manual/sql-functions/scalar-functions/string-functions/first-significant-subdomain.md | `eb9ff19598dd614dbff3eb39741047f449853885b0121c4c7da3960f8cce8514` |
| sql-manual/sql-functions/scalar-functions/string-functions/format | docs/sql-manual/sql-functions/scalar-functions/string-functions/format.md | `2872537c0676a32b95b4fb5338bcb8f1d526bc85c485040ec856a6c1914909b8` |
| sql-manual/sql-functions/scalar-functions/string-functions/format-number | docs/sql-manual/sql-functions/scalar-functions/string-functions/format-number.md | `51920a6784cc1c2c60a4066f178327bc6ccad2fdd9fc72067126afaa0a154acc` |
| sql-manual/sql-functions/scalar-functions/string-functions/hex | docs/sql-manual/sql-functions/scalar-functions/string-functions/hex.md | `29cc9ee57f18bb637647f6b34b9fcd3b163c788bc60c14b09316256d2d66a2a3` |
| sql-manual/sql-functions/scalar-functions/string-functions/initcap | docs/sql-manual/sql-functions/scalar-functions/string-functions/initcap.md | `a26e9e257b158f440528febef0900b04fe3012565f1f9238b79770afd53518e2` |
| sql-manual/sql-functions/scalar-functions/string-functions/instr | docs/sql-manual/sql-functions/scalar-functions/string-functions/instr.md | `4874398627ad056a928e0e1260495a7cc1ee18cabc799b28f7518427db1b515c` |
| sql-manual/sql-functions/scalar-functions/string-functions/int-to-uuid | docs/sql-manual/sql-functions/scalar-functions/string-functions/int-to-uuid.md | `6445af144c70fea741768a4337e653c8eef9f73ee8b4a08274d78f5f38fc420a` |
| sql-manual/sql-functions/scalar-functions/string-functions/is-uuid | docs/sql-manual/sql-functions/scalar-functions/string-functions/is-uuid.md | `98e418c65e1d11369924dfba69e49eefddec706a00518ef2f3c104087e1fd296` |
| sql-manual/sql-functions/scalar-functions/string-functions/is-valid-utf8 | docs/sql-manual/sql-functions/scalar-functions/string-functions/is-valid-utf8.md | `1bf0d9c3a98eacaa9b0f6a8be6989c5135938e47fab226c137ad42a1f48fe595` |
| sql-manual/sql-functions/scalar-functions/string-functions/lcase | docs/sql-manual/sql-functions/scalar-functions/string-functions/lcase.md | `d2394056ad4f8de4de5775d958f5a20ea6b03edb40a4878accc48266648e6684` |
| sql-manual/sql-functions/scalar-functions/string-functions/length | docs/sql-manual/sql-functions/scalar-functions/string-functions/length.md | `42ca0b65b2e34ae9a253154a469e6f8d542e56c1af08820d14585a3dadd489ef` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-039

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 857.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/string-functions/levenshtein | docs/sql-manual/sql-functions/scalar-functions/string-functions/levenshtein.md | `3902baebb8d6750d44d0d38d1c5b473ff61aeeb6577c8b1c4536d96bbc1d8864` |
| sql-manual/sql-functions/scalar-functions/string-functions/locate | docs/sql-manual/sql-functions/scalar-functions/string-functions/locate.md | `42cc96c13b780429a3d14b8ec2c3b845b301b873c865e59af00853cf6b22e79c` |
| sql-manual/sql-functions/scalar-functions/string-functions/lpad | docs/sql-manual/sql-functions/scalar-functions/string-functions/lpad.md | `77c8d4efa5d6cebf40e481613123315e4d1970f45da2b4ae836747dce7b14dda` |
| sql-manual/sql-functions/scalar-functions/string-functions/ltrim | docs/sql-manual/sql-functions/scalar-functions/string-functions/ltrim.md | `80b583050f391ac642e364bb73a52fb5e0f25f38acc2606f47a6228250d864da` |
| sql-manual/sql-functions/scalar-functions/string-functions/ltrim-in | docs/sql-manual/sql-functions/scalar-functions/string-functions/ltrim-in.md | `16dcaad7f2b89ef02dadee1186f5faef50afea86bc7983d7bbd2862f168c4121` |
| sql-manual/sql-functions/scalar-functions/string-functions/make-set | docs/sql-manual/sql-functions/scalar-functions/string-functions/make-set.md | `6c32764e0f0540265477e2043125f1f3e37ea75524b255c55369c514f85bfb0e` |
| sql-manual/sql-functions/scalar-functions/string-functions/mask | docs/sql-manual/sql-functions/scalar-functions/string-functions/mask.md | `f8c25d4dd29ebe31dc1898edf3d2257fb50da390e9d84f8f350023b7db7285c0` |
| sql-manual/sql-functions/scalar-functions/string-functions/mask-first-n | docs/sql-manual/sql-functions/scalar-functions/string-functions/mask-first-n.md | `e9a719d23326121b07f440411554d3f9da5f4e97c05d6f0a591cdfeb845f153b` |
| sql-manual/sql-functions/scalar-functions/string-functions/mask-last-n | docs/sql-manual/sql-functions/scalar-functions/string-functions/mask-last-n.md | `1875ea61b169f5ebc75b476cac42fc3f8a3c4d711aae35509d80717ad516c7de` |
| sql-manual/sql-functions/scalar-functions/string-functions/multi-match-any | docs/sql-manual/sql-functions/scalar-functions/string-functions/multi-match-any.md | `406f52c620405f3eff61b0dc5df8eb4caa5bcf31fabdaae6a843d153a639d0f1` |
| sql-manual/sql-functions/scalar-functions/string-functions/multi-search-all-positions | docs/sql-manual/sql-functions/scalar-functions/string-functions/multi-search-all-positions.md | `0b347199c2968020484b9d169259c20f896cfdff0cb6cec740c01eee0ccba77c` |
| sql-manual/sql-functions/scalar-functions/string-functions/ngram-search | docs/sql-manual/sql-functions/scalar-functions/string-functions/ngram-search.md | `ae3f40cd6d893d150123dadd4d3684ebb3df7d6fbe3b85689c615298aecc41b2` |
| sql-manual/sql-functions/scalar-functions/string-functions/overlay | docs/sql-manual/sql-functions/scalar-functions/string-functions/overlay.md | `8c7c14457ac60bfdcfbde7f0a1e2d7121c6cace28ae9ed8cf63e19ab332da93a` |
| sql-manual/sql-functions/scalar-functions/string-functions/parse-data-size | docs/sql-manual/sql-functions/scalar-functions/string-functions/parse-data-size.md | `729ef324163d98e5416b3c878920243796ff942c45585ead7b1f4104114a5c0b` |
| sql-manual/sql-functions/scalar-functions/string-functions/parse-url | docs/sql-manual/sql-functions/scalar-functions/string-functions/parse-url.md | `ff7fb3845febaa6c82819584f46a0dafd3f387e19d0bc06ceafbe86931d1f6b9` |
| sql-manual/sql-functions/scalar-functions/string-functions/position | docs/sql-manual/sql-functions/scalar-functions/string-functions/position.md | `d73423a0b1bcce0f63b45619bb2b2ee9a1020e5e8b289d5375de62b1a076a3f6` |
| sql-manual/sql-functions/scalar-functions/string-functions/protocol | docs/sql-manual/sql-functions/scalar-functions/string-functions/protocol.md | `12e5116fdc916e97b67a78fac14e64a03a9f6b00ec9cb083472bfa54b999537f` |
| sql-manual/sql-functions/scalar-functions/string-functions/quote | docs/sql-manual/sql-functions/scalar-functions/string-functions/quote.md | `acfb0c2aabcf47ad03575254d658a36f4d4c5fcee54fdc8cdc24bfcb7a1cc305` |
| sql-manual/sql-functions/scalar-functions/string-functions/random_bytes | docs/sql-manual/sql-functions/scalar-functions/string-functions/random_bytes.md | `388329c095de5f5d7e9262cb5d94ff39c0686b6c8da7f4fe93fdb3acab553f8d` |
| sql-manual/sql-functions/scalar-functions/string-functions/regexp | docs/sql-manual/sql-functions/scalar-functions/string-functions/regexp.md | `c860cf45635c80f0cc324f001985ee7540b72104d71e0c27394d43afe0571a50` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-040

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 837.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/string-functions/regexp-count | docs/sql-manual/sql-functions/scalar-functions/string-functions/regexp-count.md | `8e4aa2f78c654f2de0e8ceb33eb5d097510ba83beff26ba918045874adbbae0b` |
| sql-manual/sql-functions/scalar-functions/string-functions/regexp-extract | docs/sql-manual/sql-functions/scalar-functions/string-functions/regexp-extract.md | `51c8194622e96554c9293b12a7793f16436ab19ecedb7b375495016105a7bd8e` |
| sql-manual/sql-functions/scalar-functions/string-functions/regexp-extract-all | docs/sql-manual/sql-functions/scalar-functions/string-functions/regexp-extract-all.md | `25efa1ee2c69d67c97d084ae7e125307c78c5b2e1aa9101d76ab48657bfa8fd4` |
| sql-manual/sql-functions/scalar-functions/string-functions/regexp-extract-or-null | docs/sql-manual/sql-functions/scalar-functions/string-functions/regexp-extract-or-null.md | `57f93d048c83e4864801078a98128730d4968fd39b9dc19d5f59dd0fce43993d` |
| sql-manual/sql-functions/scalar-functions/string-functions/regexp-replace | docs/sql-manual/sql-functions/scalar-functions/string-functions/regexp-replace.md | `fdf9759d1c3bdf9563699e42757bfd3a7c978f73d38414c15a7bcd4f38ef0af3` |
| sql-manual/sql-functions/scalar-functions/string-functions/regexp-replace-one | docs/sql-manual/sql-functions/scalar-functions/string-functions/regexp-replace-one.md | `c909fc34abda301d3e52105feaa32c1b7f5707372d98de105be55a2ba863fdbc` |
| sql-manual/sql-functions/scalar-functions/string-functions/replace | docs/sql-manual/sql-functions/scalar-functions/string-functions/replace.md | `92e6a2736ebe237fc1ae2a6db0244e5559014db1df8d532f999f10d517441ef0` |
| sql-manual/sql-functions/scalar-functions/string-functions/replace-empty | docs/sql-manual/sql-functions/scalar-functions/string-functions/replace-empty.md | `2e565c8de5324f0e040f62f90eedb16d9c0aec0c6c9afe5fcb363f25633d10b6` |
| sql-manual/sql-functions/scalar-functions/string-functions/repeat | docs/sql-manual/sql-functions/scalar-functions/string-functions/repeat.md | `c3512ec5ad38db73314d4f9ef013095cc1471fee5323ed362dc34c9884e38bda` |
| sql-manual/sql-functions/scalar-functions/string-functions/reverse | docs/sql-manual/sql-functions/scalar-functions/string-functions/reverse.md | `b7b313e23dd37caa5a41026f676b84cff2aaeed0b0a9c913b2115fb7936f3c95` |
| sql-manual/sql-functions/scalar-functions/string-functions/rpad | docs/sql-manual/sql-functions/scalar-functions/string-functions/rpad.md | `fa6e5e3dc7e3ab6dc70c88fcb5c9e95b96e0bc0d026211ad8d4742f61c22f05a` |
| sql-manual/sql-functions/scalar-functions/string-functions/rtrim | docs/sql-manual/sql-functions/scalar-functions/string-functions/rtrim.md | `6a980fc34196f248824c5fdc64997d9fa858548bd3b19bb8b0ba06a9a1771931` |
| sql-manual/sql-functions/scalar-functions/string-functions/rtrim-in | docs/sql-manual/sql-functions/scalar-functions/string-functions/rtrim-in.md | `eb6bd595db13ed130db719ca6523472d715129ad761745a24408e9b0f141823e` |
| sql-manual/sql-functions/scalar-functions/string-functions/soundex | docs/sql-manual/sql-functions/scalar-functions/string-functions/soundex.md | `f5ea2b8a4b2d090f92f2b6aa7ac9d99c1ace36260b1c8874125cd26493c3247f` |
| sql-manual/sql-functions/scalar-functions/string-functions/strleft | docs/sql-manual/sql-functions/scalar-functions/string-functions/strleft.md | `99e45e7f41701de8ff760a7cf47931baf7ff8f8225a47d82b8d3c6adbc829e0a` |
| sql-manual/sql-functions/scalar-functions/string-functions/strright | docs/sql-manual/sql-functions/scalar-functions/string-functions/strright.md | `926426cc48c33da5fe0d602ff5a45be94a0f5b0cefe5d9640c9c3c96a71bc52c` |
| sql-manual/sql-functions/scalar-functions/string-functions/split-by-regexp | docs/sql-manual/sql-functions/scalar-functions/string-functions/split-by-regexp.md | `d93762890d8eb9dfabb1b93e174353ce943a539ee6147d59f3aaf2cac7f2c712` |
| sql-manual/sql-functions/scalar-functions/string-functions/split-by-string | docs/sql-manual/sql-functions/scalar-functions/string-functions/split-by-string.md | `2f7dce03250812a18b4d26b71a8fe65de089499df79e149ca7191e3579f4a91f` |
| sql-manual/sql-functions/scalar-functions/string-functions/split-part | docs/sql-manual/sql-functions/scalar-functions/string-functions/split-part.md | `790482792b02b1c5fa073157f1fc38a95b61b968ee020e446791e4fa5e89dd22` |
| sql-manual/sql-functions/scalar-functions/string-functions/space | docs/sql-manual/sql-functions/scalar-functions/string-functions/space.md | `58efacd1f638208da79a2ddb132df324c5dc1d5e7471ae25167665b993430663` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-041

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 817.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/string-functions/strcmp | docs/sql-manual/sql-functions/scalar-functions/string-functions/strcmp.md | `b3514d33281a8946965b2344749c23304b8441e8c7730004f1d979c248859d06` |
| sql-manual/sql-functions/scalar-functions/string-functions/starts-with | docs/sql-manual/sql-functions/scalar-functions/string-functions/starts-with.md | `794280620b0480a766b7a7e0ccbafc91450aca17c461a3a27cae341eda33d323` |
| sql-manual/sql-functions/scalar-functions/string-functions/sub-replace | docs/sql-manual/sql-functions/scalar-functions/string-functions/sub-replace.md | `d839932a54ba3665b6455ca9301589a11623b564535b4a95a6f4a392234369a6` |
| sql-manual/sql-functions/scalar-functions/string-functions/substring | docs/sql-manual/sql-functions/scalar-functions/string-functions/substring.md | `4aa6f6836096a5fae88484f20d390a4837ba7b766214f94e67b58a239734a4be` |
| sql-manual/sql-functions/scalar-functions/string-functions/substring-index | docs/sql-manual/sql-functions/scalar-functions/string-functions/substring-index.md | `2d8049e4092d9513aa98cb12ddc02e137b839113ca98eef88d600407b55b0337` |
| sql-manual/sql-functions/scalar-functions/string-functions/tokenize | docs/sql-manual/sql-functions/scalar-functions/string-functions/tokenize.md | `ebfbf044e63e2df4c4373a97ba67241d21a43c20414ee80b9d532b9f5d94b90b` |
| sql-manual/sql-functions/scalar-functions/string-functions/trim | docs/sql-manual/sql-functions/scalar-functions/string-functions/trim.md | `581ea900a2af26eca8e481fe3f1d9bee3fd933795605bae768973e8fc34a1abb` |
| sql-manual/sql-functions/scalar-functions/string-functions/trim-in | docs/sql-manual/sql-functions/scalar-functions/string-functions/trim-in.md | `f434ce6edabbf1adf37492a5a2e17974ed085ff04714ecff200d4040628a13f4` |
| sql-manual/sql-functions/scalar-functions/string-functions/top-level-domain | docs/sql-manual/sql-functions/scalar-functions/string-functions/top-level-domain.md | `f75b379ef554d7070d2285ff00c82511ce989d5bba36b81cbe92dcf53fd6f4cc` |
| sql-manual/sql-functions/scalar-functions/string-functions/to-base64 | docs/sql-manual/sql-functions/scalar-functions/string-functions/to-base64.md | `bd927b4b86b7b1b1c4b34721994f99044b975ea4a6a62ec869beb69b77b27b44` |
| sql-manual/sql-functions/scalar-functions/string-functions/translate | docs/sql-manual/sql-functions/scalar-functions/string-functions/translate.md | `f9a772f5c78e1bf49e7b7dffae62929aa4d74c11524c71de54062891b994afea` |
| sql-manual/sql-functions/scalar-functions/string-functions/uncompress | docs/sql-manual/sql-functions/scalar-functions/string-functions/uncompress.md | `410074051ace19020ee1f232a5cb40be5b0a300daec69194361b18ea77708035` |
| sql-manual/sql-functions/scalar-functions/string-functions/unhex | docs/sql-manual/sql-functions/scalar-functions/string-functions/unhex.md | `42dbd56911167944d7bdb45e67cfd9f51d4d83777a08a71ffdc082adc9e8052f` |
| sql-manual/sql-functions/scalar-functions/string-functions/ucase | docs/sql-manual/sql-functions/scalar-functions/string-functions/ucase.md | `4a32456626733fa70a7c92118e0b1db0752b4f0e84d70dba71eefee556d2fec1` |
| sql-manual/sql-functions/scalar-functions/string-functions/unicode_normalize | docs/sql-manual/sql-functions/scalar-functions/string-functions/unicode_normalize.md | `21abbfa1a38b3fea777f7f748bf1934a17ba88ce124ccfa2797bd2ba3eabc76c` |
| sql-manual/sql-functions/scalar-functions/string-functions/url-decode | docs/sql-manual/sql-functions/scalar-functions/string-functions/url-decode.md | `19481e2b3b8e0c63a6c965c49a71faf2b04ba47aedd8e17992f654dc03e0a8e3` |
| sql-manual/sql-functions/scalar-functions/string-functions/url-encode | docs/sql-manual/sql-functions/scalar-functions/string-functions/url-encode.md | `c9a648dc9e57a0d1c291bae4dfefd97fe9f48aebdddd2000ff42290a5492b32c` |
| sql-manual/sql-functions/scalar-functions/string-functions/uuid | docs/sql-manual/sql-functions/scalar-functions/string-functions/uuid.md | `0cbcefb4109070bcc3c5089acfdfdee7a27b641f505cb7c936324ba6d4be26e4` |
| sql-manual/sql-functions/scalar-functions/string-functions/xpath-string | docs/sql-manual/sql-functions/scalar-functions/string-functions/xpath-string.md | `ec5a67299789aeb48717d6bf0b2dc4095c364cbf63c7b8d04274d0f9e5be187c` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/add-time | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/add-time.md | `6f6581d07ae56be4d3b1cfb471eb5eaf4af1db212f97250e1944ff665592d225` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-042

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 797.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/date-time-functions/century | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/century.md | `28563d9d0984634ac0e246e7ee11715a284783dda681aa57cd721b29fa86e841` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/convert-tz | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/convert-tz.md | `c6d14c814cf882a51e48992701e55ad05324fe8c66b0109be5896ecb23f67e8d` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/curdate | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/curdate.md | `6e1c4e79d07ba3f0c28b17e39b06d5a0ca3f7cfc70b5ef5dfbeb75ef8a584457` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/curtime | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/curtime.md | `63da3bfb2be77411f574b739f16343a3b93ef6cd326364a16cfc69d9a58c0c4c` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/date | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/date.md | `b7b9243e0814fa99809b33679378ace1d5f71c4587d1a8d81e0d1c7571f59742` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/date-add | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/date-add.md | `01e31dfb27e774ad8c5d3bb5b38588e1f831e4e8cded390127259a429100a4aa` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/date-ceil | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/date-ceil.md | `390e97e8a2de178d9e3ce8e69d144be490199e12b56c9326c4b95ea1961df248` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/date-floor | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/date-floor.md | `2845c16b4c0c1a3deec34014914742fdee40e12ab5290298a19b9abca4acd702` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/date-format | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/date-format.md | `d6c135f2e69db62a1492c3cfb58c014d026939d5372dd2e802cf6c8145a5e7fc` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/date-sub | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/date-sub.md | `4a36bf13c4b20db3d217d6c376e7c7c4ef7f89e1a0889bff76008584063dbe3c` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/date-trunc | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/date-trunc.md | `5a68816a2944880dd46935d052e67c0bf33530e48536b3a54d7d93b8ff371d88` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/datediff | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/datediff.md | `50739efa85aa2f15dd4d82956b2a375027564504234233045948b1276dd467b6` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/day | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/day.md | `dc040e4a2ddebc8f2e37891886056eee3c41b38b56c58506ed4ad2bb06a019fd` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/day-ceil | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/day-ceil.md | `ff60488ca5576b22f3f14eb32c0fba8bd01580466df73b27292ba442678b30ae` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/day-floor | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/day-floor.md | `170ef1a7489cf39902aab06cc130eb97d7e84a84c5bc87dc04c6d840aee4d46a` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/dayname | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/dayname.md | `ac681652109f19f2ee64b827798912d6294334039faba90db6d1b1fab4e70aa2` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/dayofweek | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/dayofweek.md | `57f5e5389247b4d99c426f1facd00c589f112dc89bf1df656c3c713d347608fc` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/dayofyear | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/dayofyear.md | `0ff151a9709931b7668b9dfae35006a8091c667c8506d9256712903b429bc0cc` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/extract | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/extract.md | `72c9e3f0b34f10e035f60ead5bf8b529591a8ee82003dc8f6217ea75a633902c` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/from-days | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/from-days.md | `a8278ec16dda7c1ae0e49a080823f7fc658b0f9ef70a7cd9f2b2ac8600af64e6` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-043

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 777.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/date-time-functions/from-iso8601-date | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/from-iso8601-date.md | `b7e78e902421b90f2fe8bf8dab167319549b5e49497c6c9687c99b015d91867c` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/from-microsecond | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/from-microsecond.md | `5dd4c03247f8bfe2a8ad0c695ca6c37762447d0dd9da7e7db8846c0d101ee884` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/from-millisecond | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/from-millisecond.md | `3d4f39c4c1ea3ef8caa21406500236fd8176cfe5333fe78560c9c05ff2bf80f9` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/from-second | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/from-second.md | `75076f0f016660844b266b5e8502323dbbb49c26fa2affc282e24bd66884dd52` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/from-unixtime | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/from-unixtime.md | `9633d80a678a1c64dd7dae5a3c5786a690753de2b01eb9b5cebbeb333be36d77` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/get-format | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/get-format.md | `af7165091ce13a3b0373acc54d001158a3e5841d0d82889925bc3d660d8facaf` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/hour | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/hour.md | `49122c8ba80787dca9489f3d6609c854113d2573ed65c1dcb853668a5599357b` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/hour-ceil | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/hour-ceil.md | `3840283cf4eed7b23605423efdd1519d2429e1317312121c7e0339d1f34a12d0` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/hour-floor | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/hour-floor.md | `2a4051a245236efea406111a0cbcaf507e9d3ddc92a5ab9199d3eff18b35c782` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/hours-add | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/hours-add.md | `41b3c971a1d081027c24d3942e28fde3c9f510d5b5b267e40fbe1230ceb2ccc2` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/hours-diff | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/hours-diff.md | `83b83dd99b546e5e8510daaf5780b4a88c4b169771ba103b9499609d9b215a4c` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/hours-sub | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/hours-sub.md | `5f611e151f314f4f2858413a885b07a3ee3d3af42fe4f5873b51238d8c381381` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/last-day | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/last-day.md | `ef1cb3253e4a55d83c0700ba429a5cb3bb7f5568e7f4f4b668e961ac6cbff27e` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/makedate | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/makedate.md | `ca7a1cf24e6d583d86e8d5bf04cb034349ba1eebef4bb9599306927ff34e6ba2` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/maketime | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/maketime.md | `fade202f353f6319aa8fd35a9a8e46fc5b40f16b193b6153192ba4b7156a9be6` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/microsecond | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/microsecond.md | `df28f8997c3c847d1458745eedd539753f9a3cd60447941b5d412dff5011e986` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/microsecond-timestamp | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/microsecond-timestamp.md | `40ed75748a3d2763e23c4f5e7f20d0e3e853f906368d1e9aff1661e09196a146` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/microseconds-add | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/microseconds-add.md | `90039c8cf0bf538dd3dfa52e61e3826f5cb37101d46417abae467b2030132163` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/microseconds-diff | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/microseconds-diff.md | `2725359e410f6057e26ce18258e36fa02e02649b98bcb5e0ab0ce177e02041d9` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/microseconds-sub | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/microseconds-sub.md | `50b5c4a0d124a45d4c091125eb3c1f4b76af0dea2598fe2e7a7962a6f297ad60` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-044

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 757.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/date-time-functions/millisecond-timestamp | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/millisecond-timestamp.md | `0f95b79c42c25616c5df31139b52924689ffd8bb202c9e8fb248e80a6def6ac6` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/milliseconds-add | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/milliseconds-add.md | `ac7bbb21f6ad4e045e9533f662795edc361d42293d2c6eba8ecd9aa7faf38387` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/milliseconds-diff | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/milliseconds-diff.md | `3411c95e1331040091c297b91787462b9db08394c56b91e4df3c7853fc9650d3` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/milliseconds-sub | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/milliseconds-sub.md | `fb2601f582cb5d3b4275898010917e2d50d54fa170f5fbc168e56b305388098a` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/minute | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/minute.md | `b5d4aba3775973e32133e20b4fc501f18f55d46c7e802a0b582afd8f1caa4c5b` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/minute-ceil | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/minute-ceil.md | `a2591c56808e1de9cac82fb19de329925098040ea08a6d884cc4f716ee88d567` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/minute-floor | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/minute-floor.md | `48a8bc6a2a6fabf268129ce01e56c5989bcfd0790a1f8fb0dc30eaae94158d12` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/minutes-add | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/minutes-add.md | `83aee41c6092bdff23df81a10cee2238058bef70fe1dde9d1ab3ace3a607dc1b` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/minutes-diff | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/minutes-diff.md | `ecb18c57fdee02d6f04ac7944314959fdd80a82109f90ef55f09b2ae1c6c7c16` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/minutes-sub | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/minutes-sub.md | `62e7a44a09fb954658d1ccc9b89b57ec5d82a78a3c6c9e277fee5bcfa6a82930` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/month | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/month.md | `c8699804ea38e1d120ae8927498650d1ef89fb2d95fc8db1e1857b01199a1550` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/month-ceil | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/month-ceil.md | `526a4af81ae2669cff14e2e8cbf2fa5f3c13c9ebd99d07764418a4fa5c107840` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/month-floor | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/month-floor.md | `b87c99d1fbfb2fc8b95f19889aadddc274d24bbc0a5dd0f6c14d62f72885ac6c` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/monthname | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/monthname.md | `cebc33f7db528eb635843f187a7961f6f485d1266342cae920b301fd6301fc48` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/months-add | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/months-add.md | `1b465d2d3c033aa6dcd7fe6bbd45493d2ff6880a78f72ba686dc143eadd63227` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/months-between | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/months-between.md | `c2bdbd35140decaed33b49b106079bd48513c3477d3e595f2ba909b5f34f6ef6` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/months-diff | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/months-diff.md | `bf3b9d69e272e81cc5abc7996ecf8b96ab9147354ed3ebc47566b31fa8adb9fa` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/months-sub | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/months-sub.md | `2a1fbfc0567274c770034b994f87118dbc498087e5c47dd3f1626bd0f74ac091` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/nanosecond | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/nanosecond.md | `50b8543097d8eae4bd97bd195cf02d29734689ad15b77863f70298009ea86e08` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/nanoseconds-add | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/nanoseconds-add.md | `889f22b1e9047d2603bb5d0c1d95ef0a5d3e2daa162222472a1b1c92df26eab7` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-045

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 737.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/date-time-functions/nanoseconds-diff | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/nanoseconds-diff.md | `d290a164e6927faa545665adc6862a426d1d54be31e5b8a0b4c5400272dc8a0b` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/nanoseconds-sub | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/nanoseconds-sub.md | `22731e77063b248d43dd9a139942eb5ebc66b72bfc720a18bb6bdd3b15e67213` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/now | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/now.md | `f848158b2b0f6dd10ad24eb459953e8019b5872ce3a43816fb10081e7690b831` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/next-day | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/next-day.md | `7dbb675ba44e6ffbb05a90e945e73fc6991c34ed6e934675a34224d62db1bf3f` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/period-add | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/period-add.md | `bb07294c2a5dcf36bc035b0b61db728b29823eb4f18824a056127a8f351c22f7` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/period-diff | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/period-diff.md | `9ab8923c71cee0fb6799cba83c69d9e0438385df14f492da7bf74ee6e771e276` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/previous-day | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/previous-day.md | `e8acc96a7dfce33f326cc3b014c6ec695f8248024c37065c3de8889a6a478adf` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/quarter | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/quarter.md | `b02b5af0436d4b398e0c7c75f5f995f49abe023ab105b8afd18a6f2e2ac7cac7` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/quarters-add | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/quarters-add.md | `21b1aa35980844c6726a3b543bbcb7f1ed6387a828e3aef0268a35e5838ecd94` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/quarters-sub | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/quarters-sub.md | `c3a716131b88495b03fe82713706f53c3e7c689d92213170ff57125893ce4f24` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/sec-to-time | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/sec-to-time.md | `f3d65344464df605ad6b3edf43427bda0a2c89124af2c7009a3866d820a02dfc` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/second | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/second.md | `34d92d46179d18c80913ddbfd73eed430f6c04bf5923f3fab60d96e7c65741c4` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/second-ceil | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/second-ceil.md | `4d3918b5e8d06b3b606cef23ced39a616f30a1f6ee15ba62d8946a1fdc4e0c67` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/second-floor | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/second-floor.md | `e903cebbd8a85fa4bbc5a4110baf06894e491df95f87f9cb2574d03280c8f044` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/seconds-add | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/seconds-add.md | `b4ee46b1777371b60f4753f5c33144c0b094af571dbc9014bf4abb15850a2f82` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/seconds-diff | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/seconds-diff.md | `584d5a78c3dea3385e5d8aa6ffe1fa04851c233688ca8ac56d955ee07b79fe69` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/seconds-sub | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/seconds-sub.md | `b7079cf8c82761fb7cf24a63705295e470b1bf4db822b6b91bc18abdf7b6eb58` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/str-to-date | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/str-to-date.md | `5d87ce3e5149c01b32cbe0168028b3c62a783a84d5739af5125cee351f9e8cd1` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/sub-time | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/sub-time.md | `58598dafcc53e13a0ead43ab467d1d78f88495b6d2f4aa52563c6c44f59d7fa6` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/timestamp | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/timestamp.md | `e8bc4c37ad1d679df60d77a8a15eaa15aba6e62d09faccce1a6f447975dbd710` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-046

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 717.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/date-time-functions/timestampadd | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/timestampadd.md | `82ee215d5d713a3881850f95f27823338f544cd06048a51cc71103fe89df3b45` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/timestampdiff | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/timestampdiff.md | `ac88a92419e8ab1fde58b14062e170c64859780fbfe6ed8c243472bd55d13995` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/time | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/time.md | `b0c9664d5fb6c308fa165b5221e195d6248490fd3b9169a2e27caab795251606` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/timediff | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/timediff.md | `b299596df3d190efa5e404b2d84e761cc38cef843c18e54c7895c802c376bdd4` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/time-format | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/time-format.md | `92bddbcea4b27b297d24823f88237cbdd0823b02b1fec41ffbaf38cee01e4e1b` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/time-to-sec | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/time-to-sec.md | `3a1262178b7240c9c04744101f6d03c59d4b4c319dfa173c20e5520d0e89b517` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/to-date | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/to-date.md | `daf88d74f6c0f61ce930fdc9e1416019cca723b199f911274cd55f38bef844e8` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/to-days | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/to-days.md | `3789dd8bb34b0d122c581f9c27ce98255d49d092c39344041725e505d81ca06b` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/to-iso8601 | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/to-iso8601.md | `71df199d0bd87cc00aa155e598e8490325396473e24db9365210a8b811bfabe4` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/to-monday | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/to-monday.md | `11cfdf8429b514082b75d8be853679a61a577f29c0337641d9d8b11837fd6931` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/to-seconds | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/to-seconds.md | `80c893350df06d7cf36f18dfe5ab937aa9543fd18f668ec7688a542f8e76dd55` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/utc-date | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/utc-date.md | `a19afb059b0830b325cc56a5681e856b598fd80014a66f67044647f324dbd9a5` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/utc-time | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/utc-time.md | `7ae811b7a9361ff4646bf4a2f5448b69dfd5521f56fcf96e2662705a70421d5d` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/utc-timestamp | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/utc-timestamp.md | `29111db060bf1c38d0b3395f37a03842a4f9ba4de1bda836cb6c0be52c3b7f3c` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/unix-timestamp | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/unix-timestamp.md | `12a494813f5effe709ef7c856f7007835e02e9b068b31f31797443e02af9513a` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/week | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/week.md | `fc57eb2ab3f6f48c9c95b8e5d955118ac1de389a5d57961de6c0f0bc69316d0d` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/week-ceil | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/week-ceil.md | `3b57e13de70dcb93f4c5ad5d8bfae5793854aa3052d7d5f37baf7726eab7015f` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/week-floor | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/week-floor.md | `bb9494668c3cc531e8f464dce312c77104ade73eeac3fd88f20dc750609c2e3f` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/weekday | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/weekday.md | `b616cca4f0b0787e5b6f3fa0d1c4558b0dc549aa4497c36f739f0e91b856a34c` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/weekofyear | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/weekofyear.md | `da400dfb498dec78b8345ed65134723105435b28e22c0ad099ca4ef9253ee887` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-047

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 697.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/date-time-functions/weeks-add | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/weeks-add.md | `e39ea43fa58a433e83d035c51bb5d0b8f40804c87e581c21c72638dd501df8b5` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/weeks-diff | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/weeks-diff.md | `f2a1e3495ab7afa364427ec733eb428a5975a925eabf3a2b6d33cb7bb6815228` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/weeks-sub | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/weeks-sub.md | `81a4db3aa87d83ebf9b18ed3219971401ad60fb5544774f3ad8faccea38ef74f` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/year | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/year.md | `9a08e96e9f440a4c2d4c929dbc1caf016930da0929ee15b9031f76a92a44f296` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/year-ceil | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/year-ceil.md | `ea9437642ed088c212db377eb790c364b9dc7e5f2f78475dc53afdf9b6737503` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/year-floor | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/year-floor.md | `271f7f7a188b5b388b523be0fa6dbcb0aa7817fb09618b0a3e27029e9c968ff0` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/year-of-week | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/year-of-week.md | `ce8bf4d489850f845911966322f7c6f7033000886761432687e03c112050d558` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/yearweek | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/yearweek.md | `4bf7feaac15998fb214e9f59b51dc0475ab234380cca5c7a086f79ac85837bf3` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/years-add | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/years-add.md | `cb61529caa14a1db1bd8b93dc1ddba38a82ff3cb08cfe6bb36787869ed7a4e48` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/years-diff | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/years-diff.md | `66bc73ea4a1e7ff66b603b92931cdf077c8eb28727b7031c885c2f0fa2efbb9c` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/years-sub | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/years-sub.md | `eccb77700bb84c365aa546618ca7a184fbf34b946338903712526ac87f8b39d2` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-angle | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-angle.md | `f14301cc3f0bd48dda8b8e75688c876b04b77036b95f869bf04abe720a1f97f6` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-angle-sphere | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-angle-sphere.md | `52b997bb87a5b7ab6a9daec3683196309a18e45a7ee433eda7a0398916fd3233` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-area-square-km | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-area-square-km.md | `cce69ccd8b658c8dc643469890a43ad73b47c97a518e6b3e2a0fe7d248330eb3` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-area-square-meters | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-area-square-meters.md | `8277650d50c01d9482ca8025e7d0d68c55c4266a7d957996c56be5d369f31546` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-asbinary | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-asbinary.md | `d6d6eab7775735ade09988a5340d5e416cb2362dba64eaab3328b2796ee12ece` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-astext | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-astext.md | `b0bfc00517adf32c7c1428683193675278a34f9cdf0d6835ac108f9b6b372baf` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-azimuth | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-azimuth.md | `0da4751449f928796e35896eae96eb75548b51dbbf1b7783bc6072647ab544bd` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-circle | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-circle.md | `318393b07883973a29f7f2a1f4a6f5d00588d10b8a5baa79044ff21ae4811a93` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-contains | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-contains.md | `c885be933902d9bdf622abb6b7b3fd4b2919e9a33911b5c8d9faf5197766605a` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-048

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 677.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-disjoint | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-disjoint.md | `1118879b1938801594a2ec2708ca35d417eab04fb34a2de4b58f39b38311fb01` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-distance | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-distance.md | `aa464386a0dfefe6b3e613bdd92e3af92c7d2532789d68b30a7785ff4eacd535` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-distance-sphere | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-distance-sphere.md | `4c3e13b650538aab9369e4990df02de4d4d16c7287d361b39d8a1925109d028c` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-geometryfromtext | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-geometryfromtext.md | `da03ae5df0ed679f08778b828ea9d1cc94a744c04afd337a96fcdd2cfad4a72c` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-geometryfromwkb | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-geometryfromwkb.md | `9fbe6802f56d52f8c33cea306a950fdd35c86b7cb327ae67496a79329c00633d` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-geometrytype | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-geometrytype.md | `784888a75f4894b867b1859f011d3f340d2f01d5c5df911b1464f8594847a2f9` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-intersects | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-intersects.md | `c6502b4dc6ba0f2593e576439eac30a9f137121bc598fe98d0226950ce3b69ee` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-length | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-length.md | `fc67201b8658c682856a8c1a1d1e2c91f40a7d808999346f0bcb59d5ab1313eb` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-linefromtext | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-linefromtext.md | `6bb8c35859a6247c9ad2de4a56566a7b90740b140740b9fc786e26db55643cc7` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-point | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-point.md | `83d495bd114debbb77b5b9767aeaaf86ee87ff1a0915dedfdf1aa13468837e67` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-polygon | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-polygon.md | `47045fad7aaa2ce14f070a48d573dda414a9c1ed5ee52042c533da3ea40d7fd2` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-touches | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-touches.md | `5089b823f89364824f04f7d27437431aa8178f97e99a09f5970faa68bd7f7e61` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-x | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-x.md | `57448215a7f9b58640f55ec5616b106a312b9de7664979e705a010a5b522eb58` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-y | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-y.md | `20a0a1aff51a7e5f635f754c2e2fd9956e58ec4da05ccc866df3d808e659654f` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-decrypt | docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-decrypt.md | `5d8481a54a9787803fc789632feea47c48fff3477b46fbdb3a71ef25e58645e7` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-encrypt | docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-encrypt.md | `ae1ef3e94f89f5b3d15b1757af9c520f9208be4355bf7a5727dd46a683f67af9` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/crc32 | docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/crc32.md | `79b5974c6750d926449451faeae2b524229267b4cfbf52db045188959cfa8b92` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5 | docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5.md | `8e9693991e9ef0af5cfc335bb4b460cb310747ab0a1d9c6775bafeba21233094` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5sum | docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5sum.md | `225c9d23f776b81f9f616ef27d8dd007021295b8d757e7795da44b1318b50466` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-32 | docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-32.md | `48eea88b180ac7a386b3da0323a974c5ab2d82f15d5d2534f552566b91b8fb12` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-049

Status: IN_PROGRESS. [PR #4218](https://github.com/apache/doris-website/pull/4218) proposes all 20 Dev Japanese targets from master `3ddf1a2b41`. Independent machine-review state records are present. Japanese proofreading is not recorded.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 657.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-64 | docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-64.md | `907bb1deae73a6f25a4570062bf443a0b200cb5b13ce281c1bd0357793094c05` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-64-v2 | docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-64-v2.md | `ba559c57fee905e073b533dc702b9307799d33cc6683a68dc4260a4a3b05da58` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-u64-v2 | docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-u64-v2.md | `f543edf6cb062daa751657652f3bdd5df06f671602e7f53919a7581a19b768d3` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha | docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha.md | `cec14bd166f111636db4deaa01762ad89f2a13d430196774c3994669a2a46ac7` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha2 | docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha2.md | `a2e53904dbef0ed762fcd6ea2bacc2fe04b1a6f1cdaf0aaf676886b830d3c8f6` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3 | docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3.md | `b7429cc6b90a18989130762f0002f239621195478466a9c4ec6ff0a47968981c` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3sum | docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3sum.md | `553b14aefc87c7a23b52c9375cc3635e4372bac56fa386b50fec4c0d12fd4a99` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-decrypt | docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-decrypt.md | `1da31e44ee8757506f5a77fa621d987546a61803bc13bdb61cc714f0d1432e59` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-encrypt | docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-encrypt.md | `5a0bb5a2a99ee7d78609928f27415212727712dbe0d3a255638c9f8cb6c27f84` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/xxhash-32 | docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/xxhash-32.md | `af84351f954ff461c5c4131d55fb0266733ad2871c9bbe826198bf0b7971717b` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/xxhash-64 | docs/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/xxhash-64.md | `81842fae2952c62175f21758d04ce3d25415b10b21f405417e1b5a54567b2886` |
| sql-manual/sql-functions/scalar-functions/bitwise-functions/bit-length | docs/sql-manual/sql-functions/scalar-functions/bitwise-functions/bit-length.md | `d8c24f26095fb2394b6a517b0d1dea9f8a59f2dcddd080c60a088e3b22f8e557` |
| sql-manual/sql-functions/scalar-functions/bitwise-functions/bit-test | docs/sql-manual/sql-functions/scalar-functions/bitwise-functions/bit-test.md | `977e892df9e55e3700a9ce4f8ba76af84ceb0041ac688f996d32dbfa1d0870b8` |
| sql-manual/sql-functions/scalar-functions/bitwise-functions/bitand | docs/sql-manual/sql-functions/scalar-functions/bitwise-functions/bitand.md | `1787ebc04adc6a285d92019926f845ec67df8ae1c848f0b2a92cc909324d03cf` |
| sql-manual/sql-functions/scalar-functions/bitwise-functions/bitcount | docs/sql-manual/sql-functions/scalar-functions/bitwise-functions/bitcount.md | `4a5bbef62ee2c48d24b5989492d45c8dce620d1638f5696efc30ca1728cbedba` |
| sql-manual/sql-functions/scalar-functions/bitwise-functions/bitnot | docs/sql-manual/sql-functions/scalar-functions/bitwise-functions/bitnot.md | `c7808b1d6f0318600a10a1bc4e2a6393e962d90f7e4fe1bdfe98797221e2d9b8` |
| sql-manual/sql-functions/scalar-functions/bitwise-functions/bitor | docs/sql-manual/sql-functions/scalar-functions/bitwise-functions/bitor.md | `3d250102108390c4613933d52b7c12a5ea2f40f6f8d27ed1136535d318eb64a6` |
| sql-manual/sql-functions/scalar-functions/bitwise-functions/bitshiftleft | docs/sql-manual/sql-functions/scalar-functions/bitwise-functions/bitshiftleft.md | `257f42d9b7445f9a8953a6ea6280e2842f86759237522ff1d0fe18bde04cde07` |
| sql-manual/sql-functions/scalar-functions/bitwise-functions/bitshiftright | docs/sql-manual/sql-functions/scalar-functions/bitwise-functions/bitshiftright.md | `919f85e3c5d6b0e5e545d0159063e2da14994483f9516546c3b86203f49cf96a` |
| sql-manual/sql-functions/scalar-functions/bitwise-functions/xor | docs/sql-manual/sql-functions/scalar-functions/bitwise-functions/xor.md | `1eeb55b5b40b48d4b668e3ebd276939b448c63d39f1689e9531700a4a913b55a` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-050

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 637.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/array-functions/array | docs/sql-manual/sql-functions/scalar-functions/array-functions/array.md | `500ebdbb252548c2525550a32c157b93b6c67cc01397305254f2833e9a5c6b10` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-apply | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-apply.md | `dda0cfb4694591e4c56d88795442c3e713514645fa2250d7d4a8ce1deebf01d0` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-avg | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-avg.md | `b8bc92e862a34434a78ca153ee2b07229a1c476cb959ca7b1edffdb02af5d03c` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-compact | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-compact.md | `82f05821110ea1c4be6cf53d6e0dfda77009fae0f795287ec7c893ef407b3837` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-concat | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-concat.md | `7b8a354855da4b5d0957239ca4136f8c8a751aa011d0ce2d6c7e359a8c5bc300` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-contains | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-contains.md | `8806d4a0dab995056ba7843f0d582bf7c33a301dccd0590633087d26f49dfcaa` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-contains_all | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-contains_all.md | `e08182c0a55096d7825ac07d959eb5fd5ccf5b2e079270e6b17df6296c9ba81d` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-count | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-count.md | `f9455cb9dcf8463c4db02465dc9c839dee5457f487374da4243f6f4b476c2315` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-cross-product | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-cross-product.md | `3d144ed0b8e92f683d429b92fd5639fe6826178754ff3a9909cff285ed4f76a6` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-cum-sum | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-cum-sum.md | `e7053926e5670512b52c47a631ebd821eb8912b50400fb3c9184f5857bb9b067` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-difference | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-difference.md | `ac26d0e8d02db886bce4f82b8a3e529f2d0e6d467c8859b62b92b48913674c0e` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-distinct | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-distinct.md | `049ef1b974fac58d04fa9ca5e19d2cf822566a275c7fa9117ca8f646d885a2a6` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-enumerate | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-enumerate.md | `2383336f5b9fffd5b459f2b47362351da307ff08be3444129b88c320b5ef57a3` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-enumerate-uniq | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-enumerate-uniq.md | `2a5814ff2498be86dace978ceb36a4103163d4b8bcbfd17562fef3dcfca8a129` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-except | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-except.md | `b5bd14f69603565c5df805ba148b955cce017f60e0f145b50aca988ff7b1865d` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-except-all | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-except-all.md | `75bd5093f1495743f64cf494f312963a22a810490759ae8de721c4639413e3ef` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-exists | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-exists.md | `8618c9f282658ccfbd4e26dac008365be674048fa2f933f6993ae19a0b7cbf3a` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-filter | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-filter.md | `1294ae852e026ec7522b459b6363892f42aed075f2e8a31d069a9485b7031349` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-first | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-first.md | `63ee2aab670b53a28a68fda5b56886b7083bc9e3e1897f31592bf621230fe566` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-first-index | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-first-index.md | `5edd9903a5dea0ffc015149b73347e1c943c28f7eeb2636102d6c3e6a1a36063` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-051

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 617.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/array-functions/array-flatten | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-flatten.md | `19ecdb11508a0c7350dcc64573c9186af076c673ca35b3e947ed6e2fa11f4b01` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-intersect | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-intersect.md | `bcfb999781182cfddf20b30ffb6997b65fd5e6bd6a2691bbadbed44ba7825c8b` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-join | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-join.md | `9c9a9ebd52ea69634e17231327b796ef7e0f232e1fdf0425bc9211bc1c88c280` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-last | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-last.md | `ffaabf6db6e56f13e1b6390b10dca1ae99b44f3ea0d3f4695dc45993e92133fc` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-last-index | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-last-index.md | `670c70af5ce80d01b286a713fcb037c075f51c44b24722fafd0949ed47672eba` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-map | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-map.md | `1f8d0df451c167c3435fde42b3e8764efea5cc4314e606085e9483235a246c7b` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-match-all | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-match-all.md | `fd03224169981fc4ce63831d919062d7cd2e95fd6e207d509a4c80bcf21f5e68` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-match-any | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-match-any.md | `88a9455c4e5c37c8829f8f1e91e25cb29df12a600d669c971c69b069995f80dc` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-max | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-max.md | `7b530b5536ff59d22e0229718158d3e6d5dd60f64000a1493f4e88b90c7d8c29` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-min | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-min.md | `8b1abb7070bd32377dcd63aa169a0dafae8565d82c621d2adc6471975570f119` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-popback | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-popback.md | `fd4d04089ed3f8a8a34670801cf3db5797f250c52adb5f07e23ccd32d00e0974` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-popfront | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-popfront.md | `d721fe6a8b6c6779fd1dee1aba0adf81f0ae2e21449faf60ff09454883b1043c` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-position | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-position.md | `256c51d1815e76d40aa4a2bad62de1186f1acce9d0dceef077a8bb0e1591bf68` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-product | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-product.md | `7c974c651b26c08be2858b6822948f4a29a13f8d9b1be851a1012f31969681f6` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-pushback | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-pushback.md | `a6afa3ac8d24c5c739bd592c4e60ed824b2cd543fa18ae1befd5935dbf793f91` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-pushfront | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-pushfront.md | `658ec73cba2c1186c1a5100784efebe4aebde1c0c9c6c85ff6970eebe56b8540` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-range | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-range.md | `0267445a7c608cb23a3fcd4d1a9d28b2f697760a5d062c94d11d7c320b5ad0ed` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-remove | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-remove.md | `c2fcf97611f9252621fc27072ac1155e844fe73d1ad2c0f6c12bcc699343dde1` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-repeat | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-repeat.md | `788f236d7f2e39629b6dd2a5b32110ddc86fc249bef7f071c8f7bbfe83ba3406` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-reverse-sort | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-reverse-sort.md | `039b1c4bffc698b5cd255eea7c187529defc66a0058625008052fee445ae49e9` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-052

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 597.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/array-functions/array-reverse-split | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-reverse-split.md | `e19e7046b6d23910e71d53a06058ead1ca0bea33fd7aec1f5523a77ddc2873bd` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-shuffle | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-shuffle.md | `be9bbf07377e116337d65c398c63d3aa6e76fcab759fea06d6e161dd6af0179a` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-size | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-size.md | `a87e03293a632e5add65b971287419d95014c31588e81ab408a15d1023d24eea` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-slice | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-slice.md | `96f0346a8b2b61985f2463a0fc37a8501951ad92240a308e48a8a594eece8cdc` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-sort | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-sort.md | `fd2af6c136bd884bb29078d11aaf1c230873061c58422b1afbbece80c38efbfb` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-sortby | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-sortby.md | `b689d08b95afd29ac14003de15f3a1901311ba277bdb0bc32dacca254655ce05` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-split | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-split.md | `4ccd6bd26c671e7cb343a7205097d7ed807d317353254c2c77b57857843038ca` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-sum | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-sum.md | `865840fe2178ebf443dbecb306d4daaee0bf47e9b8a3c0a1b1e5e496c058f8a6` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-union | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-union.md | `f0d7a76f9ed2f4c5d4a173fa511013ac234b0646f4138d39450f1298d600a213` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-with-constant | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-with-constant.md | `891e3d13dffdf0225aa9322292d1ab82bdc8cb9bdb27d302b9f1eee3ec17c847` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-zip | docs/sql-manual/sql-functions/scalar-functions/array-functions/array-zip.md | `ba4b6d28e56d6c6bd40776b7b083ddf27ad85bde2674cb9a32fd70ec4a4ceef5` |
| sql-manual/sql-functions/scalar-functions/array-functions/arrays-overlap | docs/sql-manual/sql-functions/scalar-functions/array-functions/arrays-overlap.md | `6678385e7725bd84c3442d29b6349aa757a2ec9238a411ec00665f5ff1808af0` |
| sql-manual/sql-functions/scalar-functions/array-functions/countequal | docs/sql-manual/sql-functions/scalar-functions/array-functions/countequal.md | `30b8e414226c1a929b96c449086afd06860ee14ab98ed39a3b7541c11f9ecad7` |
| sql-manual/sql-functions/scalar-functions/array-functions/trim-array | docs/sql-manual/sql-functions/scalar-functions/array-functions/trim-array.md | `a1910c7b8b917f9371c243bb606cd4567a1a1d0fc17201a73a74f3d46316a36b` |
| sql-manual/sql-functions/scalar-functions/map-functions/deduplicate-map | docs/sql-manual/sql-functions/scalar-functions/map-functions/deduplicate-map.md | `f0dc9711a648d6e5d38682bc774fffca7b767a68938cba91ffd15a0b9dbc1947` |
| sql-manual/sql-functions/scalar-functions/map-functions/map | docs/sql-manual/sql-functions/scalar-functions/map-functions/map.md | `5a14915765d979cec676970256c5563fd8f892eb37ddb34715bcf1043630c3de` |
| sql-manual/sql-functions/scalar-functions/map-functions/map-contains-entry | docs/sql-manual/sql-functions/scalar-functions/map-functions/map-contains-entry.md | `0613960d8c8865ad5706cd8f2b5df2b6e8866636b3d46933af9e1b11ddcd329f` |
| sql-manual/sql-functions/scalar-functions/map-functions/map-contains-key | docs/sql-manual/sql-functions/scalar-functions/map-functions/map-contains-key.md | `1f5ae8747dc01cf3dc8cfa6f23d3b3c653da28e93b8de8d4d79b0c3c71c45cd6` |
| sql-manual/sql-functions/scalar-functions/map-functions/map-contains-value | docs/sql-manual/sql-functions/scalar-functions/map-functions/map-contains-value.md | `196bed602c9439a7a637883f9d9241e9622a53ee45b41b860f0c64037e53616b` |
| sql-manual/sql-functions/scalar-functions/map-functions/map-entries | docs/sql-manual/sql-functions/scalar-functions/map-functions/map-entries.md | `77606dd0c1b5d2ba4503bb0c4ca07a093a4912e4762b098d5b48e8e8ca9f34a2` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-053

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 577.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/map-functions/map-from-arrays | docs/sql-manual/sql-functions/scalar-functions/map-functions/map-from-arrays.md | `1c71066b331873984bdf65cdfd0dc466d2357ca9dc2c76e8ec9e38bce966acae` |
| sql-manual/sql-functions/scalar-functions/map-functions/map-from-entries | docs/sql-manual/sql-functions/scalar-functions/map-functions/map-from-entries.md | `b44aee62f39a9196a5db8a5d38017a39406214dcb130e07c680a7bd8235f903c` |
| sql-manual/sql-functions/scalar-functions/map-functions/map-keys | docs/sql-manual/sql-functions/scalar-functions/map-functions/map-keys.md | `e845be5a9ef7ff01c71898efcb848b9ce5b2ae9643b43e30e15feff2f239059c` |
| sql-manual/sql-functions/scalar-functions/map-functions/map-size | docs/sql-manual/sql-functions/scalar-functions/map-functions/map-size.md | `d854bcb4c2c65eb46f0321f9b9e23eb1a993e594815bb7efab07a54a86068417` |
| sql-manual/sql-functions/scalar-functions/map-functions/map-values | docs/sql-manual/sql-functions/scalar-functions/map-functions/map-values.md | `da8e431b96f86933eef15039fe20e0c27bc120630a80e5fb42cbab2ed0cb6af7` |
| sql-manual/sql-functions/scalar-functions/map-functions/str-to-map | docs/sql-manual/sql-functions/scalar-functions/map-functions/str-to-map.md | `6c20f2dc6f978bc12fe195d545bb49266984025cc03a29ef7d852607b8a8d335` |
| sql-manual/sql-functions/scalar-functions/struct-functions/named-struct | docs/sql-manual/sql-functions/scalar-functions/struct-functions/named-struct.md | `06e22fe30c479c33ec9383584cd5e012b8a7924480022b640a6cb7be745d412c` |
| sql-manual/sql-functions/scalar-functions/struct-functions/struct | docs/sql-manual/sql-functions/scalar-functions/struct-functions/struct.md | `06df78c8bdfb558acfc1bdd34ef1907cdf403997435262a905e09bd97fb84628` |
| sql-manual/sql-functions/scalar-functions/struct-functions/struct-element | docs/sql-manual/sql-functions/scalar-functions/struct-functions/struct-element.md | `c27240ec2c0477b268d5401a4303cab01f976e66b241f4b3eaf0102185c977bb` |
| sql-manual/sql-functions/scalar-functions/json-functions/get-json-bigint | docs/sql-manual/sql-functions/scalar-functions/json-functions/get-json-bigint.md | `6bbe796ecb280ebc05a4ab5375e73d445a6d8742b8c615c119bfacceb64bf8a3` |
| sql-manual/sql-functions/scalar-functions/json-functions/get-json-double | docs/sql-manual/sql-functions/scalar-functions/json-functions/get-json-double.md | `beb80f608c0aa0fe26eabef7d9db4510d6980e2ae1875841518bc99a71120545` |
| sql-manual/sql-functions/scalar-functions/json-functions/get-json-int | docs/sql-manual/sql-functions/scalar-functions/json-functions/get-json-int.md | `6d6334901c66c1a928877325a71e53eea754713d9dcc114517d1bd6c22f3a081` |
| sql-manual/sql-functions/scalar-functions/json-functions/get-json-string | docs/sql-manual/sql-functions/scalar-functions/json-functions/get-json-string.md | `34b99ab4c5af13bdadba4528c3856053041e7e1122e0c4a7447daa8c1aa5da76` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-array | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-array.md | `d2c186999632f426b62e3837307a58b30b79ab37787bf0020753acec77a3d664` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-array-ignore-null | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-array-ignore-null.md | `61439d481e866a3dcc7b131a57ab3560bc00da9ba066cee7d178a3a5479792a8` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-contains | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-contains.md | `360cf0e65c83eb5578fbcc3c6be1e726019963cd7b34a53459cbfe1bfbdbd100` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-exists-path | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-exists-path.md | `1037d939eb7dc2d95331b38a1335d7ab862c9752bfff28564e0278068d4e65c7` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-extract | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-extract.md | `7af9efd381f557a7422a89c5e935abc9ee197822b04a45d2db43fc21e68dea57` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-extract-bigint | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-extract-bigint.md | `ce6362895c563331b1a780227136a7eb0036c685dc7c97e099669ccd9502b938` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-extract-bool | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-extract-bool.md | `de031dab37c2864add1f2e2ae02b8dbc6d89f04cce2bf6827b585dd176136d8b` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-054

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 557.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/json-functions/json-extract-double | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-extract-double.md | `f54d097449fd56c97edd70573fc6323ddaef9007aec29fe507ac26a658c896de` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-extract-int | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-extract-int.md | `59e1b308603d916d5b8b475898e7b3a06c76288c0e61930f03a112ed6061f064` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-extract-isnull | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-extract-isnull.md | `695e2129b53e01e61640f9cddc1ded9c4a768d654f1dcf4cb9f8bcf92324f1ef` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-extract-largeint | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-extract-largeint.md | `f83fbb7e607ce893f0b13257cc2e5ba31093b66ab27b59278fc7102932a98ad1` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-extract-string | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-extract-string.md | `0e44b5eb877202e153dfa109fc0d61d96918ce5096a0688fc2fbee534a8a68f6` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-hash | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-hash.md | `0d27b73d6277020e19b5f0231e62d1f7b9a029af7ce3110c42d92bb2d405189b` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-insert | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-insert.md | `66347c867efa173f543c3208eb9e4fa1bfd40b8ac6478065aa06324bb8f67ab3` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-keys | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-keys.md | `73115c5b56490e6cb01de13f287f3d3e69dcafca02de6ed6226237b01d696166` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-length | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-length.md | `06e10fbd928d5addc4b6accf8c39f6095f0989f13cecac911251df75e66dd3fc` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-object | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-object.md | `b4a3a24dede8e5f98af71dc005336296b98fa9c176b34faec2ea89dd4e8fae68` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-object-flatten | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-object-flatten.md | `e1ac625975f06abed9f65da497f0e0c082985373def106265d393c1997f00a54` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-parse | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-parse.md | `d68c7c8e923c8818a4cb7a96c836cf34a6b6bf204f9c84a10f27b32280416f30` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-parse-error-to-null | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-parse-error-to-null.md | `5fef7098d93a3c736bd2242e235eb9ebfcb5e21b6f69ed121578be154bff240f` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-parse-error-to-value | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-parse-error-to-value.md | `29ff9ad98c4d49e438de0e71c67139018108c7ec606e2abaec3d237d0d145ac8` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-quote | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-quote.md | `60ea01f06e9195c772a7c87752168f51067e9cbf0ea9b98b548e2fc2a9eaed7e` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-replace | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-replace.md | `bc20c6676d8e14a84286dc7e71a73ae9f1e768d807d36557861a471bbc0c7b69` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-remove | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-remove.md | `645ede3af1c947ce7e01c67ead31866185c7bad8c5d16dae2c4cdb1b94e0f185` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-search | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-search.md | `c69b61b7f173104465a5abc54c20ed7e2a8cddb2c268b1a9c8b5fa06fbcdfc2d` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-set | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-set.md | `4d0d3d5e3f28f92371baec8b0ffff0857ebcdfec9b8db10e3be9bb381d6f12b7` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-type | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-type.md | `30a8a1df40d68ad1229351b9fe44668186fadd86802476d0869f690b2003bd72` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-055

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 537.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/json-functions/json-unquote | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-unquote.md | `124987a2cdccd6458a69b7d839ff6f26c3fc0e98d1d78ec38dc71a89f2163b2d` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-valid | docs/sql-manual/sql-functions/scalar-functions/json-functions/json-valid.md | `2b037fc55b7d387b50f8cd19d8bf915dc2a6ffdf6d7f7863a55f1cf0fdb2912c` |
| sql-manual/sql-functions/scalar-functions/json-functions/normalize-json-numbers-to-double | docs/sql-manual/sql-functions/scalar-functions/json-functions/normalize-json-numbers-to-double.md | `ba669573c14bdef01775207921d1b475296f889627dffbe506f44a14e4e72066` |
| sql-manual/sql-functions/scalar-functions/json-functions/sort-json-object-keys | docs/sql-manual/sql-functions/scalar-functions/json-functions/sort-json-object-keys.md | `0d86f72816a1071e05e489e6f0f7266ec8eed21981fc2dfd21f10eb4ae62069c` |
| sql-manual/sql-functions/scalar-functions/json-functions/strip-null-value | docs/sql-manual/sql-functions/scalar-functions/json-functions/strip-null-value.md | `f9b2d37cc9975d2f290a09abf20a0fdb6379374eb59c20068df3548b2aa32150` |
| sql-manual/sql-functions/scalar-functions/json-functions/to-json | docs/sql-manual/sql-functions/scalar-functions/json-functions/to-json.md | `a784911fc275e2ef330ddc673c8ee0e22fa685ac8fdc28feed0a7915f83ffd1c` |
| sql-manual/sql-functions/scalar-functions/variant-functions/element-at | docs/sql-manual/sql-functions/scalar-functions/variant-functions/element-at.md | `3313b47b54884a5501112614a6247843e6e7dac2919bd2a1753c36b4f15c92e8` |
| sql-manual/sql-functions/scalar-functions/variant-functions/parse-to-variant | docs/sql-manual/sql-functions/scalar-functions/variant-functions/parse-to-variant.md | `23eb00cc48a3252f511d33dc8924110e76aae0e79bbfe71e14a55d6d7e89f8c4` |
| sql-manual/sql-functions/scalar-functions/variant-functions/try-parse-to-variant | docs/sql-manual/sql-functions/scalar-functions/variant-functions/try-parse-to-variant.md | `445b23661efab740cf5ec9b853c2e4e7b0c3a9329fca9c78b06d9af993964208` |
| sql-manual/sql-functions/scalar-functions/variant-functions/variant-type | docs/sql-manual/sql-functions/scalar-functions/variant-functions/variant-type.md | `b079da6858fc5638209ffe7cff1a95641b35a284aeaee3e50bb97cb6d15aac2f` |
| sql-manual/sql-functions/scalar-functions/ip-functions/cut-ipv6 | docs/sql-manual/sql-functions/scalar-functions/ip-functions/cut-ipv6.md | `29ddd9382c119c175e62a229309d62da4c93e397ca7ffe6f89dde057f0a2ad53` |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-cidr-to-range | docs/sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-cidr-to-range.md | `bde9bc8b1c3a5d3676d69fea106238993350e6bb12286958cbb91f01619306d7` |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-num-to-string | docs/sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-num-to-string.md | `2856b3951235d91c26a0f128e5031ca6f5a5241f0f4f503310666c604de2f988` |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-string-to-num | docs/sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-string-to-num.md | `c24a1d506ad8962f9c670ccf3ec635486b5ae84172669b9c8059daeda751631f` |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-string-to-num-or-default | docs/sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-string-to-num-or-default.md | `0cd9e57348c012c99ffb31377f77fa257ef1f70df021c358f710308dee1f2ed5` |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-string-to-num-or-null | docs/sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-string-to-num-or-null.md | `154ea2635a7d4af6567e47687e47f22bccdc877ad0a145b792a79fbd08b447fb` |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-to-ipv6 | docs/sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-to-ipv6.md | `628c3f6a0bf3c9ad8fafb6fc633e950583132b1b7a54d9d275ad3584b84d20b5` |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-cidr-to-range | docs/sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-cidr-to-range.md | `85dc22eb79ed03f574d556fb975cbb4b00f1ac960dd6fd9ff4a36585c271ee74` |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-num-to-string | docs/sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-num-to-string.md | `f4d4e5cfd7f243efac8003690bd1e45fc6d49ddf65953b29981549f0f1c4accb` |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-string-to-num | docs/sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-string-to-num.md | `62087683ebdd9d6acd16abb30e115971a505d27559a3b13c7f4b260f5562fe65` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-056

Status: IN_PROGRESS. [PR #4219](https://github.com/apache/doris-website/pull/4219) proposes all 20 Dev Japanese targets from master `3ddf1a2b41`. Independent machine-review state records are present. Japanese proofreading is not recorded.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 517.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-string-to-num-or-default | docs/sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-string-to-num-or-default.md | `a5c8f7f72ec301ee2cb34aa2d27a5822b8ab2b4967cafe3ff47a18562b1adde0` |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-string-to-num-or-null | docs/sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-string-to-num-or-null.md | `2c5055ccdd9b64c408dcd852546c4f4ec1bbfb5b15385a9f14a4bd403697fe07` |
| sql-manual/sql-functions/scalar-functions/ip-functions/is-ip-address-in-range | docs/sql-manual/sql-functions/scalar-functions/ip-functions/is-ip-address-in-range.md | `0fe428a7fc5cf9af6fcc36df79369763a152b9d0319cf41f7f7f198d850f25e3` |
| sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv4-compat | docs/sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv4-compat.md | `6dda1ac60066d767b20564fa9c73ac2a24db176381bb85f5af71bfc3d7fc91f1` |
| sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv4-mapped | docs/sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv4-mapped.md | `f03c4f18f85fc9d337e22d3186bd57daad75ffc942345a1d14f30108d620dca7` |
| sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv4-string | docs/sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv4-string.md | `dd734e96dfe3f6a5fa3561ecc5dd3587a8ab0b1a472bd10b3397b026df5c934e` |
| sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv6-string | docs/sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv6-string.md | `3561ef2f1682ec3b1e6e2fc6125cba9632033ef912952bea9031f52783c0a6f0` |
| sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv4 | docs/sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv4.md | `654d9f7f817bcfd916ae6f780b7844eef1b90878905f30d4f46aa633a45689c0` |
| sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv4-or-default | docs/sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv4-or-default.md | `a342733812272df57b9bd1b5fbf2924da691e06d02fc2414689390373b98ac47` |
| sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv4-or-null | docs/sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv4-or-null.md | `45eca0ff7b4546147a93c43439bd4e1310d548aa93ebbf47a3fc1f7dddc7c0db` |
| sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv6 | docs/sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv6.md | `32c86ef9ea7c9bd6f6afa021877d3ae156de6a8042351ee2762fd67dbed92a6b` |
| sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv6-or-default | docs/sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv6-or-default.md | `f24f6094c1f87e4ef06df36695325850b67da4ae8a23d05d55e690f2721ec413` |
| sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv6-or-null | docs/sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv6-or-null.md | `c501a45b49e23b7dd5632d9f436ccf930f24ae1fe45bd480ad6f3fd0b927d6ee` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-and | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-and.md | `b122a873a7001bee48b1c99374cee0c020c07350269d428340ad4534f416f675` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-and-count | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-and-count.md | `7553f33af93c66d71fa207e5ba73b10e2708b987630f23f84e760b6a44d7f395` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-and-not | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-and-not.md | `d89a7fb75209afa6d0bfe1fe1ba8a7f3d2ce961a92c86d1e02e174a1d585cd27` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-and-not-count | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-and-not-count.md | `1c1d39979e96ea134639ef2baf89d3bcfc2ff46d185098b34b9930b2b93b39c7` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-contains | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-contains.md | `37c3a84e832a0b44b8de88b6d8f5318a3e78d6bf2299a8460a60e4e0012d10d8` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-count | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-count.md | `a04cf43a655117f48105179589341ba8981e1b1bb3b249882fcdf9978ca79ca0` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-empty | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-empty.md | `dab50ea71c8a4e4287ff6ae1861836a15ed46b48bb01c15cc9889e806c127702` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-057

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 497.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-from-array | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-from-array.md | `86aeefd42cbb4f6dd964c8447a730c393a03bfe03b645aecbcbf77c938735fa1` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-from-base64 | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-from-base64.md | `90882f63b1aeaf29947b2c290886946cadced85a1105f8f3699d8e9af02e7219` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-from-string | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-from-string.md | `e3ea89df4e860905b323cbd95ee5296275be00025e43e7dcdf2602df2c297748` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-has-all | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-has-all.md | `698a589e5c2c8d7df8c6ae7140ce084442f2a7ecd78cecef8aaa042e47bfd520` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-has-any | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-has-any.md | `af68cc16122c576a0fe88718a867a7fd0646208420d6ac8c04490a32399917c9` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-hash | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-hash.md | `27f55a1741a611511bf06a92f209fecb2ceb2f44def4eca87f2e66a331ac0be7` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-hash64 | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-hash64.md | `d6c21f81074e0b565344ebb82131d1f16980404062b613555f0d6d94aa9244dd` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-max | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-max.md | `027d23a822bb96b388724307c20e98224551954a2f73197d01687b827527b345` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-min | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-min.md | `358336b8c36ad46e966fc99eab0e292cdeb7b12a117a85807fa54c175b3d0693` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-not | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-not.md | `54cef847a57b7b66a3c6286eccc687034b1654cad30e00ac66534096e1c321f5` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-or | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-or.md | `b0840bdb69e861e21eb3beb7a09dcf40279023edc6b79870eec0905181ce561f` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-or-count | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-or-count.md | `4419c24a5a3ac741d26d2553777b0398836ccb96e0b78d42099b7e96c3209e61` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-remove | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-remove.md | `d940b930c32912dfdf8db5bd342f91ce282a9bb088bceec1f47482e1d754d983` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-subset-in-range | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-subset-in-range.md | `73ebf218c05157ec1d3544f8bebab2d7e7e6f47bee2f2e76bc2f76bd2d2df457` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-subset-limit | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-subset-limit.md | `e5eefa4b606c8e7e69d4790d33eab325581a843c8040512699c052992c7d8496` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-array | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-array.md | `27d4c1ea25f622e08ab8ea22d9b10bc3108a39f30e6678464ddd52e7c35a248f` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-base64 | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-base64.md | `1d8d491ef270822f1fa5bf6ab42ad74034c2ccf15661c35beaa0ecc53ed64079` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-string | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-string.md | `f812df9b1d04639c7127295dea8684e1104ebf2fe242785ccbbfd209f575cb27` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-xor | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-xor.md | `7e668cd243b7511c519a6725c55ad9638a47674fd92e9bf06b1cd6012b6d53e2` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-xor-count | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-xor-count.md | `3abf72b932d3478ff37a17ba94309084b0d01fdb492b77185c688311bc63dfe3` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-058

Status: IN_PROGRESS. [PR #4217](https://github.com/apache/doris-website/pull/4217) proposes all 20 Dev Japanese targets from master `3ddf1a2b41`. Independent machine-review state records are present. Japanese proofreading is not recorded.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 477.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/sub-bitmap | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/sub-bitmap.md | `98a350b68d1608c461a7801dd7430f9f55914a8c4422c45bdfb1fa63131f9f47` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/to-bitmap | docs/sql-manual/sql-functions/scalar-functions/bitmap-functions/to-bitmap.md | `e95344811acc3c6bdb0737c4d33a0a419348da806bbdb7938119e94a5142c1b6` |
| sql-manual/sql-functions/scalar-functions/hll-functions/hll-cardinality | docs/sql-manual/sql-functions/scalar-functions/hll-functions/hll-cardinality.md | `e21b185e94040ce93d699d909edbc89f888b48a8dc0a75bc1e22779e416c09a4` |
| sql-manual/sql-functions/scalar-functions/hll-functions/hll-empty | docs/sql-manual/sql-functions/scalar-functions/hll-functions/hll-empty.md | `ee0927c2ae95de8bae4925972e000914fe412c3e61789f18c0bfe70adbb01cda` |
| sql-manual/sql-functions/scalar-functions/hll-functions/hll-from-base64 | docs/sql-manual/sql-functions/scalar-functions/hll-functions/hll-from-base64.md | `ed97b51420bf2c52404967067ac339c0a969a6337cf7b43bc31e66b435443142` |
| sql-manual/sql-functions/scalar-functions/hll-functions/hll-hash | docs/sql-manual/sql-functions/scalar-functions/hll-functions/hll-hash.md | `7435826f3a44b3a94ef205e7eacc79211a5b5bf3b6520910e853d7326e8bebbb` |
| sql-manual/sql-functions/scalar-functions/hll-functions/hll-to-base64 | docs/sql-manual/sql-functions/scalar-functions/hll-functions/hll-to-base64.md | `af5572c2a9639e67fd8de4065b129b64832b32e5aa9725a30846c694e9ac9e01` |
| sql-manual/sql-functions/scalar-functions/binary-functions/from-base64-binary | docs/sql-manual/sql-functions/scalar-functions/binary-functions/from-base64-binary.md | `d9f4ca085c7cc2f1d17e5aa598735ef89bbc68706b80bfc55e5f5c07b9b73e4d` |
| sql-manual/sql-functions/scalar-functions/binary-functions/from_hex | docs/sql-manual/sql-functions/scalar-functions/binary-functions/from_hex.md | `3cc15c696d4a2895ca5f04e50cccc0013fbbe7b24877c241be471a1889692c27` |
| sql-manual/sql-functions/scalar-functions/binary-functions/sub-binary | docs/sql-manual/sql-functions/scalar-functions/binary-functions/sub-binary.md | `641a1431d2bcee01249f2dec6c0eb922994a02f84268e420ef8c8a00f547d35a` |
| sql-manual/sql-functions/scalar-functions/binary-functions/to-base64-binary | docs/sql-manual/sql-functions/scalar-functions/binary-functions/to-base64-binary.md | `8eb96b6e9c554253245d91ec318c12dbfa113a5d94e686fa86a1503c0e8bc1e6` |
| sql-manual/sql-functions/scalar-functions/binary-functions/to_hex | docs/sql-manual/sql-functions/scalar-functions/binary-functions/to_hex.md | `841cd079a456a0685dd247e1766ecf0d6ed86a0908d0e2d77bf0bb5e5b423f94` |
| sql-manual/sql-functions/scalar-functions/system-functions/connection-id | docs/sql-manual/sql-functions/scalar-functions/system-functions/connection-id.md | `a66ceb1984984fee724b4be258a65a8407ff053ff022e777cb38a767a99cc640` |
| sql-manual/sql-functions/scalar-functions/system-functions/current-catalog | docs/sql-manual/sql-functions/scalar-functions/system-functions/current-catalog.md | `6c6dc740b4c7fcde30b80050e9178c8408bc636d2743ce9b90592fb22137fa36` |
| sql-manual/sql-functions/scalar-functions/system-functions/current-user | docs/sql-manual/sql-functions/scalar-functions/system-functions/current-user.md | `468bd44b55b02a8868174589dddf22c0ff3fa60d9bbf5cb110d93f69bd430f75` |
| sql-manual/sql-functions/scalar-functions/system-functions/database | docs/sql-manual/sql-functions/scalar-functions/system-functions/database.md | `e7012b22d3c85078bbcb20e38c54b9bb5847fd850354e1b736d0436cf6fab841` |
| sql-manual/sql-functions/scalar-functions/system-functions/session-user | docs/sql-manual/sql-functions/scalar-functions/system-functions/session-user.md | `634bc088be4108f529f8aff4d64fa8486076cfb0227596be870c8df89fc66bb4` |
| sql-manual/sql-functions/scalar-functions/system-functions/user | docs/sql-manual/sql-functions/scalar-functions/system-functions/user.md | `8410b87c60643a2a58835d394589a8bf9f0c0da7df0c98a6fd1eb9ce504aa83c` |
| sql-manual/sql-functions/scalar-functions/system-functions/version-function | docs/sql-manual/sql-functions/scalar-functions/system-functions/version-function.md | `d95c5cb35e899e0f293f49d61b1c1c45f2f9cbdbe4ceb8b29a83f10ee32a83ee` |
| sql-manual/sql-functions/scalar-functions/system-functions/last-query-id | docs/sql-manual/sql-functions/scalar-functions/system-functions/last-query-id.md | `60df61aa8987e863ec23eae366f09b50a5ce40af769ee595af30045cc2d4b0a3` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-059

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 457.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/other-functions/convert-to | docs/sql-manual/sql-functions/scalar-functions/other-functions/convert-to.md | `0c2a92a5fe1b5c0e3ed998b82bcb93d5bdb04bb9661f8616527acf74984baac2` |
| sql-manual/sql-functions/scalar-functions/other-functions/esquery | docs/sql-manual/sql-functions/scalar-functions/other-functions/esquery.md | `b6b56e7f09490b15a711d52df479a213213cd68855efabc7eb173d433b0e9525` |
| sql-manual/sql-functions/scalar-functions/other-functions/default | docs/sql-manual/sql-functions/scalar-functions/other-functions/default.md | `10ddfda50675f7d625f9ce2b61284744bcf8a0bead1fe753e14984d7c0db78ea` |
| sql-manual/sql-functions/scalar-functions/other-functions/field | docs/sql-manual/sql-functions/scalar-functions/other-functions/field.md | `0e8320815aeb8d01d02cd3e2c4aa1077973917dceec95eb89b4bee3f5ee7e6ca` |
| sql-manual/sql-functions/scalar-functions/other-functions/grouping | docs/sql-manual/sql-functions/scalar-functions/other-functions/grouping.md | `a2404e22f33b5c8323720ffdcfad1c229c8952aebd1eedd4330818725eb8a2ac` |
| sql-manual/sql-functions/scalar-functions/other-functions/grouping-id | docs/sql-manual/sql-functions/scalar-functions/other-functions/grouping-id.md | `7128e42f3604f9db791b26f369f84d0a72425d4af72a14e41efad1f6d97ab711` |
| sql-manual/sql-functions/scalar-functions/quantile-functions/quantile-percent | docs/sql-manual/sql-functions/scalar-functions/quantile-functions/quantile-percent.md | `09fd31ec61d42d9358650414d9dac519c9a0f33e85e5c4463fb36a8d38116feb` |
| sql-manual/sql-functions/scalar-functions/quantile-functions/quantile-state-empty | docs/sql-manual/sql-functions/scalar-functions/quantile-functions/quantile-state-empty.md | `ad68f80f3e8aad6aa3b2bc705456ba8815e883f69d5d672cc4dc96caac1c5f5a` |
| sql-manual/sql-functions/scalar-functions/quantile-functions/to-quantile-state | docs/sql-manual/sql-functions/scalar-functions/quantile-functions/to-quantile-state.md | `c3afd2fe565bf0867d51713495c010dd060689a399f70b955189431776c991c0` |
| sql-manual/sql-functions/scalar-functions/conditional-functions/overview | docs/sql-manual/sql-functions/scalar-functions/conditional-functions/overview.md | `c8038fa0d3a3d1fa38f4fdc76dcb266e5843c35c9c8053d76df2da7ebba0e0e0` |
| sql-manual/sql-functions/scalar-functions/conditional-functions/coalesce | docs/sql-manual/sql-functions/scalar-functions/conditional-functions/coalesce.md | `4b807805cb3233fd482c170bd812dbcc1b52b7e797d23e7a83a37cd89dc05c35` |
| sql-manual/sql-functions/scalar-functions/conditional-functions/greatest | docs/sql-manual/sql-functions/scalar-functions/conditional-functions/greatest.md | `ab0b3fed6636259a7786ee410f0ac1c01ad45f4ad80069905783d3fe9c01616c` |
| sql-manual/sql-functions/scalar-functions/conditional-functions/if | docs/sql-manual/sql-functions/scalar-functions/conditional-functions/if.md | `e3b270b9a20228ddc7bb5762f226545ecae1356600c238fec830a24349babfbd` |
| sql-manual/sql-functions/scalar-functions/conditional-functions/ifnull | docs/sql-manual/sql-functions/scalar-functions/conditional-functions/ifnull.md | `d0f609d1981091bbff0f7466f6f2b25eacfbef73178dd90febcd7e64e541694b` |
| sql-manual/sql-functions/scalar-functions/conditional-functions/least | docs/sql-manual/sql-functions/scalar-functions/conditional-functions/least.md | `411df88e676c8aaffd125ee793d1098971660e8bafa965660211b2f09c0c6e22` |
| sql-manual/sql-functions/scalar-functions/conditional-functions/not-null-or-empty | docs/sql-manual/sql-functions/scalar-functions/conditional-functions/not-null-or-empty.md | `80cd081f2677fa4fd60495232e12ba3305a2da4e7d8e905fcd93fc2b4363b93b` |
| sql-manual/sql-functions/scalar-functions/conditional-functions/null-or-empty | docs/sql-manual/sql-functions/scalar-functions/conditional-functions/null-or-empty.md | `ac7ca44133ef24bdd588af8f8dd99a6a6d58a7a85760f14666faafb62997be65` |
| sql-manual/sql-functions/scalar-functions/conditional-functions/nullif | docs/sql-manual/sql-functions/scalar-functions/conditional-functions/nullif.md | `ae99910bf88a5a9f3324e03b6f7b58430993532f1a9be6ce4d5e64cc2c34371c` |
| sql-manual/sql-functions/aggregate-functions/ai-agg | docs/sql-manual/sql-functions/aggregate-functions/ai-agg.md | `f02c0c3cc608cc4a6bff781a4e365dd45e89fd5f2f25390496cc9686cda3253b` |
| sql-manual/sql-functions/aggregate-functions/any-value | docs/sql-manual/sql-functions/aggregate-functions/any-value.md | `e50a0aa92be39989f5976114fcb6b641627ae528e1e2b716846dd2bae7cde4e1` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-060

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 437.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/aggregate-functions/approx-count-distinct | docs/sql-manual/sql-functions/aggregate-functions/approx-count-distinct.md | `8d4ffee2b7ae55b15cadcdefdb860b5ca85fe41eb79276adb37c3915d1c6ba41` |
| sql-manual/sql-functions/aggregate-functions/array-agg | docs/sql-manual/sql-functions/aggregate-functions/array-agg.md | `a2a7b5fec080ca75e0be81aedf66151c03db9906f667369c07a0ea6924c5ade2` |
| sql-manual/sql-functions/aggregate-functions/avg | docs/sql-manual/sql-functions/aggregate-functions/avg.md | `dff337c7e23584814473da5d5eb47f4809f8219666327e76f8cb72690024b864` |
| sql-manual/sql-functions/aggregate-functions/avg-map | docs/sql-manual/sql-functions/aggregate-functions/avg-map.md | `dbe796a8132fe2623977cdd34505c8c7599f31ca549c71386665407ef474917f` |
| sql-manual/sql-functions/aggregate-functions/avg-weighted | docs/sql-manual/sql-functions/aggregate-functions/avg-weighted.md | `2f39788ba916b589823833f7484e5ff01b86cc6632aad3e67c9b836dc7f55869` |
| sql-manual/sql-functions/aggregate-functions/bitmap-agg | docs/sql-manual/sql-functions/aggregate-functions/bitmap-agg.md | `cf7e69659d254e1f6ca971fa3df774f2417aa9fa96af61da4346f391246c2eb3` |
| sql-manual/sql-functions/aggregate-functions/bitmap-intersect | docs/sql-manual/sql-functions/aggregate-functions/bitmap-intersect.md | `e3473d0a8f20f0b00f855ecc2ef6ad123099d1b11090186a242d3c50574feada` |
| sql-manual/sql-functions/aggregate-functions/bitmap-union | docs/sql-manual/sql-functions/aggregate-functions/bitmap-union.md | `573f2eef84632f9edec601585db24d07da9b07c7abafb4ba40b4bf6ca43b3ade` |
| sql-manual/sql-functions/aggregate-functions/bitmap-union-count | docs/sql-manual/sql-functions/aggregate-functions/bitmap-union-count.md | `172827826018f5eb6cfb3b3746962452dca299e015d5bd45df0c1627d1305aaf` |
| sql-manual/sql-functions/aggregate-functions/bitmap-union-int | docs/sql-manual/sql-functions/aggregate-functions/bitmap-union-int.md | `d0b223fe0eec3770de65bc139321ba693df54c8a4b3158f0c69ac505642046c1` |
| sql-manual/sql-functions/aggregate-functions/bool-and | docs/sql-manual/sql-functions/aggregate-functions/bool-and.md | `c6f98699201f47239c30e70097a748673640b7e4371ac99b198309735bdeadb3` |
| sql-manual/sql-functions/aggregate-functions/bool-or | docs/sql-manual/sql-functions/aggregate-functions/bool-or.md | `f37641a9a43b0f4697b9e84cbf625ded63229346e0a5b953a94ac70047b66ff7` |
| sql-manual/sql-functions/aggregate-functions/bool-xor | docs/sql-manual/sql-functions/aggregate-functions/bool-xor.md | `45a253ddacb3ba75e070e2e9f1bc0130a85e870034f40a84fcc9162bd9ff22c7` |
| sql-manual/sql-functions/aggregate-functions/collect-list | docs/sql-manual/sql-functions/aggregate-functions/collect-list.md | `0becbd565990bc4e8ee6a61ad01c2623cde4d63eaf84b99ae54b7de13157e6f1` |
| sql-manual/sql-functions/aggregate-functions/collect-set | docs/sql-manual/sql-functions/aggregate-functions/collect-set.md | `705c52bd1330c1bf5babe4ed72c1425df2fa9a9debd67d3e89e6b18df7105bfe` |
| sql-manual/sql-functions/aggregate-functions/corr-welford | docs/sql-manual/sql-functions/aggregate-functions/corr-welford.md | `f8e8df42228556ad94b2030ca9b4aa79952bf43ac50575ea68e38d66ea059b6b` |
| sql-manual/sql-functions/aggregate-functions/corr | docs/sql-manual/sql-functions/aggregate-functions/corr.md | `d69e01da8d1343acf78d9e51e2c6f444b42c71bad56eb5fb2320093836ad8974` |
| sql-manual/sql-functions/aggregate-functions/count | docs/sql-manual/sql-functions/aggregate-functions/count.md | `390ded406dd7f722ac35251da1fcb31d20c482054c3fb1cb849b3396e135bfcd` |
| sql-manual/sql-functions/aggregate-functions/count-by-enum | docs/sql-manual/sql-functions/aggregate-functions/count-by-enum.md | `bdf1b49e663a0e54e7dead3800d90a8bb3b0548af1102a77aef301617b75bd20` |
| sql-manual/sql-functions/aggregate-functions/count-map | docs/sql-manual/sql-functions/aggregate-functions/count-map.md | `520adba0733c4c4054f13b930235804e053ad18c49775b047b7dfc006fc7c05a` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-061

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 417.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/aggregate-functions/covar | docs/sql-manual/sql-functions/aggregate-functions/covar.md | `4566c4359db09b8802749fcea970ff8ade68c4c61049eb68536e5fe421330895` |
| sql-manual/sql-functions/aggregate-functions/covar-samp | docs/sql-manual/sql-functions/aggregate-functions/covar-samp.md | `966d9b4a80f74ad3e6d101ab039742ec13163150a85ab0c22649b5230557027c` |
| sql-manual/sql-functions/aggregate-functions/datasketches_hll_union_agg | docs/sql-manual/sql-functions/aggregate-functions/datasketches_hll_union_agg.md | `94094452a54b766e808ddc2b906400769b37e8d97d5aebf7de610614382da95c` |
| sql-manual/sql-functions/aggregate-functions/exponential-moving-average | docs/sql-manual/sql-functions/aggregate-functions/exponential-moving-average.md | `0002fd3023048d68f0ead07edac5751ef6741e0ec61efdd0359ec77b57a9b159` |
| sql-manual/sql-functions/aggregate-functions/group-array-intersect | docs/sql-manual/sql-functions/aggregate-functions/group-array-intersect.md | `28869e8453d2fb3e00023e66502aa64578279a54ba26c4b0c315dac61026ef7f` |
| sql-manual/sql-functions/aggregate-functions/group-array-union | docs/sql-manual/sql-functions/aggregate-functions/group-array-union.md | `ca31d1d6c94af5abc78f5223d2f0aea813f4bc26b87bac230a9893eb18de1d3b` |
| sql-manual/sql-functions/aggregate-functions/group-bit-and | docs/sql-manual/sql-functions/aggregate-functions/group-bit-and.md | `969624e91e1aff4bdb2e56d3aa201c104a20d7e3ce31d7eaf3c46be8f694de54` |
| sql-manual/sql-functions/aggregate-functions/group-bit-or | docs/sql-manual/sql-functions/aggregate-functions/group-bit-or.md | `919ae27ec7a9d6eb0f8fed1aacbe70af5cf7f1bbd64176e7b113d44f67a10aa6` |
| sql-manual/sql-functions/aggregate-functions/group-bit-xor | docs/sql-manual/sql-functions/aggregate-functions/group-bit-xor.md | `48be311748cee9ca2ad799f3ad06160b7db94caaf462d4f4b067289f11956fbf` |
| sql-manual/sql-functions/aggregate-functions/group-bitmap-xor | docs/sql-manual/sql-functions/aggregate-functions/group-bitmap-xor.md | `4e78ff7d74e5e964cbe131d0bcce134fb7bf24364a762076dd1c738afab14a0c` |
| sql-manual/sql-functions/aggregate-functions/group-concat | docs/sql-manual/sql-functions/aggregate-functions/group-concat.md | `b50ff8746fb9564b6cc6a46ff2958293f6dda92bf80e36bdf1d038fed4a0bab6` |
| sql-manual/sql-functions/aggregate-functions/histogram | docs/sql-manual/sql-functions/aggregate-functions/histogram.md | `b97f3f1a2b22030acf57feeba0d1d53bbe9bbe65ea4fa149f34949fdde539fd4` |
| sql-manual/sql-functions/aggregate-functions/hll-raw-agg | docs/sql-manual/sql-functions/aggregate-functions/hll-raw-agg.md | `8c3a238f7cf14bbde32de0f667583c551c587d930b39a9f7faf098cbc1fea482` |
| sql-manual/sql-functions/aggregate-functions/hll-union-agg | docs/sql-manual/sql-functions/aggregate-functions/hll-union-agg.md | `21769d0f779555691a57421a3174b0ce597d652caadb0b642941e96b7b4d3b57` |
| sql-manual/sql-functions/aggregate-functions/intersect-count | docs/sql-manual/sql-functions/aggregate-functions/intersect-count.md | `99f3499019f57d7e11fe3b5f97a0cd0425671e309aefe370ce7704e5d61947bf` |
| sql-manual/sql-functions/aggregate-functions/kurt | docs/sql-manual/sql-functions/aggregate-functions/kurt.md | `1a42a827120d6bc2b2086c8dd8c52a5f26f9792e2b25cf321f28f43ff7e46c09` |
| sql-manual/sql-functions/aggregate-functions/linear-histogram | docs/sql-manual/sql-functions/aggregate-functions/linear-histogram.md | `64f17409c81bd9b0ba3606d0aab4f6cd1947afd2682b449b424d99746ec33689` |
| sql-manual/sql-functions/aggregate-functions/map-agg | docs/sql-manual/sql-functions/aggregate-functions/map-agg.md | `cee73403d9be2d30012c88172ffa320890497b88cb58cca2740ea5423c56676f` |
| sql-manual/sql-functions/aggregate-functions/max | docs/sql-manual/sql-functions/aggregate-functions/max.md | `daa4fd0b1584c9418bc825f005d0efa5f507b16369ca0f54711b9d4c68049fc7` |
| sql-manual/sql-functions/aggregate-functions/max-by | docs/sql-manual/sql-functions/aggregate-functions/max-by.md | `d729dd3518d1177935e251408c0f94990cb99cb6016d001dde3503cd61cdae2d` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-062

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 397.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/aggregate-functions/max-map | docs/sql-manual/sql-functions/aggregate-functions/max-map.md | `e8af4f0f8a757293b486548a86bce098ad83646c432f36a1f5a2f44bed2a4a9c` |
| sql-manual/sql-functions/aggregate-functions/median | docs/sql-manual/sql-functions/aggregate-functions/median.md | `71c1e8aa692dfed31e1b8910ec704887768d4eb2461fbc487e388edc64198164` |
| sql-manual/sql-functions/aggregate-functions/min | docs/sql-manual/sql-functions/aggregate-functions/min.md | `0ac02cff92cce0a91ac88c873202ade38c4e6eca9fdc79c0b6452b3a5d7ca834` |
| sql-manual/sql-functions/aggregate-functions/min-by | docs/sql-manual/sql-functions/aggregate-functions/min-by.md | `bbc8c8c75996bec3493bca0d86062b14616ad3f48cbb55098b2cf71ff9d8dbe3` |
| sql-manual/sql-functions/aggregate-functions/min-map | docs/sql-manual/sql-functions/aggregate-functions/min-map.md | `2482e126cb941454a246fe14fcf102e173a0cf26980ace90cee1ad4975622f4f` |
| sql-manual/sql-functions/aggregate-functions/percentile | docs/sql-manual/sql-functions/aggregate-functions/percentile.md | `3292ed32c1d33851910f56904cf949e84c07c82e50525654ff5be57c00f776b0` |
| sql-manual/sql-functions/aggregate-functions/percentile-approx | docs/sql-manual/sql-functions/aggregate-functions/percentile-approx.md | `d99cb16180eab3f21eebe207a661fb4287e57072648d91794663d72fb920cc52` |
| sql-manual/sql-functions/aggregate-functions/percentile-approx-array | docs/sql-manual/sql-functions/aggregate-functions/percentile-approx-array.md | `def2b34c597c5bc690350fecc45499ca2884a091d33e47b2f167b480b457a561` |
| sql-manual/sql-functions/aggregate-functions/percentile-array | docs/sql-manual/sql-functions/aggregate-functions/percentile-array.md | `7732dfad156610c7ba13e240e19a6ec1f0879bd421a773526dcfa25d2129cfb3` |
| sql-manual/sql-functions/aggregate-functions/percentile-approx-weighted | docs/sql-manual/sql-functions/aggregate-functions/percentile-approx-weighted.md | `af112f4309eb7d19d705833a5e310a43cf01c85c96f2b55395c87f7016a11954` |
| sql-manual/sql-functions/aggregate-functions/percentile_reservoir | docs/sql-manual/sql-functions/aggregate-functions/percentile_reservoir.md | `96848feac2604375066c1ee011d08feeb597d04c682f26bb83465019076efaa3` |
| sql-manual/sql-functions/aggregate-functions/quantile-union | docs/sql-manual/sql-functions/aggregate-functions/quantile-union.md | `4fa605d33bbd4971b7a9dcbc875a976806f2cdc456dd8053bb10c4e57935835c` |
| sql-manual/sql-functions/aggregate-functions/regr-avgx | docs/sql-manual/sql-functions/aggregate-functions/regr-avgx.md | `2c0753d4176bde67b3e9e3b967e39ef218656e7532f6daab7efde8ba00ab3952` |
| sql-manual/sql-functions/aggregate-functions/regr-avgy | docs/sql-manual/sql-functions/aggregate-functions/regr-avgy.md | `76300d327b8c8625684ab73bb52fb12d31dcfa0ac057a7cf5fd91e241e1ead53` |
| sql-manual/sql-functions/aggregate-functions/regr-count | docs/sql-manual/sql-functions/aggregate-functions/regr-count.md | `95048aee088018038e52eb3480a1ca44cf07119e77485cc04b38b59814a050f1` |
| sql-manual/sql-functions/aggregate-functions/regr-intercept | docs/sql-manual/sql-functions/aggregate-functions/regr-intercept.md | `2a6d5bb98b2fb826f67151ea7c4c46d8b962930b9afb9487adc05b9fd5694f6b` |
| sql-manual/sql-functions/aggregate-functions/regr-r2 | docs/sql-manual/sql-functions/aggregate-functions/regr-r2.md | `3efbc3cedbb4c91554533dbe8e1d5fd1e8466092e7553ea4d845abc23ece3763` |
| sql-manual/sql-functions/aggregate-functions/regr-slope | docs/sql-manual/sql-functions/aggregate-functions/regr-slope.md | `7ab8c4e74462af164e3177115c0b500adbf3a0274b7b01a2dbff73db9f5e9734` |
| sql-manual/sql-functions/aggregate-functions/regr-sxx | docs/sql-manual/sql-functions/aggregate-functions/regr-sxx.md | `66442f0c63d7d84aa20db8bb814d3abb285e2962f8656ac69fb5dcbbdc274438` |
| sql-manual/sql-functions/aggregate-functions/regr-sxy | docs/sql-manual/sql-functions/aggregate-functions/regr-sxy.md | `ed32cf82dca3dc27d7e31213ab33172308d572960457a2a27e88331e5ed12e7d` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-063

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 377.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/aggregate-functions/regr-syy | docs/sql-manual/sql-functions/aggregate-functions/regr-syy.md | `078c79ba58e79cc818f19062b0d2b5e54f6572b1c979a3b737824c0b57d2ae48` |
| sql-manual/sql-functions/aggregate-functions/retention | docs/sql-manual/sql-functions/aggregate-functions/retention.md | `5469828a51b3b7de7436d22dbd947450bd9187c36d1f8841ecb3f37d7b9fa5d7` |
| sql-manual/sql-functions/aggregate-functions/sem | docs/sql-manual/sql-functions/aggregate-functions/sem.md | `780daa6144838247d61d61b4400896f4007f0b098e5bf9eb45cfda3539105a96` |
| sql-manual/sql-functions/aggregate-functions/sequence-count | docs/sql-manual/sql-functions/aggregate-functions/sequence-count.md | `32d1801d74fa6e40e619bf4eece54e478742dab7f4bc1a31d517d786896e72fc` |
| sql-manual/sql-functions/aggregate-functions/sequence-match | docs/sql-manual/sql-functions/aggregate-functions/sequence-match.md | `67058fbfc8c83c7a530b60b55c34bf50654e367651fee9022b934ceb6d4a6ad5` |
| sql-manual/sql-functions/aggregate-functions/skew | docs/sql-manual/sql-functions/aggregate-functions/skew.md | `54ebb8fe24500d58b6380c85281ddfb72095760c9ab4a9eb934894a5a709eaca` |
| sql-manual/sql-functions/aggregate-functions/stddev | docs/sql-manual/sql-functions/aggregate-functions/stddev.md | `2f5a1bbd4a026aba7393b4f28d93fab5c39fade75ee5374e7f67c0c8b102a0c7` |
| sql-manual/sql-functions/aggregate-functions/stddev-samp | docs/sql-manual/sql-functions/aggregate-functions/stddev-samp.md | `ac34359078404567632d09703b61507617796106896dec6d08a0289e1fc22f19` |
| sql-manual/sql-functions/aggregate-functions/sum | docs/sql-manual/sql-functions/aggregate-functions/sum.md | `26706f57f7a11cd39c50b37b394294dfaea24a84fe6ba2827a33de6784217387` |
| sql-manual/sql-functions/aggregate-functions/sum0 | docs/sql-manual/sql-functions/aggregate-functions/sum0.md | `e0994760899f244934a29c000c15fd96f2f97750d4dcddfeb92d337819fcad36` |
| sql-manual/sql-functions/aggregate-functions/sum-map | docs/sql-manual/sql-functions/aggregate-functions/sum-map.md | `f6f88d1afb091f178fed17e25911cab095b932ade3b9e495377df28c4863d131` |
| sql-manual/sql-functions/aggregate-functions/topn | docs/sql-manual/sql-functions/aggregate-functions/topn.md | `36187f0edbaf21acc62e0b3e950e555137e7e53b9fc5a387a99c50b8bf9afa72` |
| sql-manual/sql-functions/aggregate-functions/topn-array | docs/sql-manual/sql-functions/aggregate-functions/topn-array.md | `642b250ba1d5e55103d7756c4d86b7fc8a54b0d95457791b981a4da4efe9da80` |
| sql-manual/sql-functions/aggregate-functions/topn-weighted | docs/sql-manual/sql-functions/aggregate-functions/topn-weighted.md | `932c037c7202f26599b33c16f1deef89bf5ec05b3af62208dc15801f103d943d` |
| sql-manual/sql-functions/aggregate-functions/var-samp | docs/sql-manual/sql-functions/aggregate-functions/var-samp.md | `bae5c7c9f289aa0e3056b0255e1c622638e1329329482d6a04e14843e1efaba9` |
| sql-manual/sql-functions/aggregate-functions/variance | docs/sql-manual/sql-functions/aggregate-functions/variance.md | `b2dd309e3396021cafd4e5609fe05804c87da4f95b07b6ce5b95cdef9d928d95` |
| sql-manual/sql-functions/aggregate-functions/window-funnel | docs/sql-manual/sql-functions/aggregate-functions/window-funnel.md | `d72f84aab169b57da369fa38edd8bc103e9167f20383823309118bf02fc0f881` |
| sql-manual/sql-functions/combinators/foreach | docs/sql-manual/sql-functions/combinators/foreach.md | `53e484eb057c01e070182ac19c9f27cad6efb1603d6f540d71a3ed6c5c174753` |
| sql-manual/sql-functions/combinators/merge | docs/sql-manual/sql-functions/combinators/merge.md | `abda7355363afb8cff418b0187a37abc11a979bf394908bad6fda9552b0306da` |
| sql-manual/sql-functions/combinators/state | docs/sql-manual/sql-functions/combinators/state.md | `dfddde7371e2f39f3d06ab6b262bbde7d648bd1cefde71dc746002b997bfdbdb` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-064

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 357.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/combinators/union | docs/sql-manual/sql-functions/combinators/union.md | `408309954448f8eb006fa521c2df0bd702a29fc1939d1a787048f05ecd0bc08a` |
| sql-manual/sql-functions/window-functions/overview | docs/sql-manual/sql-functions/window-functions/overview.md | `d900f6be634efecc5fbd1f974fd6eec1616a58b3376f50ae0cdcdc6c1b936136` |
| sql-manual/sql-functions/window-functions/cume-dist | docs/sql-manual/sql-functions/window-functions/cume-dist.md | `00da9e17986ec79fb3e9cd425ac3013ebc82d2315eafe6c7d166b727d3b4ea06` |
| sql-manual/sql-functions/window-functions/dense-rank | docs/sql-manual/sql-functions/window-functions/dense-rank.md | `3901365d069fddfe816fe2bcc8de38a9ca8931debb8b2019961d5a75bfb23e6d` |
| sql-manual/sql-functions/window-functions/first-value | docs/sql-manual/sql-functions/window-functions/first-value.md | `06b65fa4a96d8052bdf942d8a08f5495f7f6c95e508779d2dd1ff917386cd18f` |
| sql-manual/sql-functions/window-functions/lag | docs/sql-manual/sql-functions/window-functions/lag.md | `25f8ab9b6ef16f7ea199f525aa0dfd2920db2a19178f6533da5a05f0672d90a1` |
| sql-manual/sql-functions/window-functions/last-value | docs/sql-manual/sql-functions/window-functions/last-value.md | `55cd266ecfa3e459ed157e58fb26c011e926bc857045e76fa1c14a938f28bd45` |
| sql-manual/sql-functions/window-functions/lead | docs/sql-manual/sql-functions/window-functions/lead.md | `9814b62ff4b61448865709cad2ddc7432356a7c3d10d1074d18cc5d1d5fa0c1b` |
| sql-manual/sql-functions/window-functions/ntile | docs/sql-manual/sql-functions/window-functions/ntile.md | `f7eb4ed8169751db348837c456ec6fbf7e87283983e196b74d36b0a503528a60` |
| sql-manual/sql-functions/window-functions/percent-rank | docs/sql-manual/sql-functions/window-functions/percent-rank.md | `bb85bf2c652043d0f103e3c7d8c3d81adc75f4014960418b3b893ea71fcc432c` |
| sql-manual/sql-functions/window-functions/rank | docs/sql-manual/sql-functions/window-functions/rank.md | `5032af683c45911d4ca5363cd93e63a3c54791df0e27ce002ebff0996b91a627` |
| sql-manual/sql-functions/window-functions/row-number | docs/sql-manual/sql-functions/window-functions/row-number.md | `8175f5429becf9f6ec53cdee8bfff91dfcb84a7a4cc9e437f0e882ccbcbd5f5f` |
| sql-manual/sql-functions/table-functions/explode | docs/sql-manual/sql-functions/table-functions/explode.md | `5c7186c36743b03ec1b0789b287556d4e757810c150de54ab4bd1fd375470679` |
| sql-manual/sql-functions/table-functions/explode-outer | docs/sql-manual/sql-functions/table-functions/explode-outer.md | `660e734df286f6be2c82d1113c12e698d4964ef80ddf4e54dd0d261c9ffb70f2` |
| sql-manual/sql-functions/table-functions/explode-bitmap | docs/sql-manual/sql-functions/table-functions/explode-bitmap.md | `091ab95a6ea5dc46001a0b5378eddcef3dc1ada44a19483248de020673d714d2` |
| sql-manual/sql-functions/table-functions/explode-bitmap-outer | docs/sql-manual/sql-functions/table-functions/explode-bitmap-outer.md | `39e036cc88c6d66fa301cee5cd7b6bf4c345f1eaefe1e40891b58331a3ab7738` |
| sql-manual/sql-functions/table-functions/explode-json-array-double | docs/sql-manual/sql-functions/table-functions/explode-json-array-double.md | `b593ca4c09807fafe6d98d64f6984b7299f230a690a7c79bc4838a324d86f63c` |
| sql-manual/sql-functions/table-functions/explode-json-array-double-outer | docs/sql-manual/sql-functions/table-functions/explode-json-array-double-outer.md | `672453b40e6efa675360c3deffb0395f172f27d59946c47d1ab76dfc99efa9fa` |
| sql-manual/sql-functions/table-functions/explode-json-array-int | docs/sql-manual/sql-functions/table-functions/explode-json-array-int.md | `787c5bbaa6411f2a77bad5b6eb6de9178a30d219996d379354f0f7228b8ce2eb` |
| sql-manual/sql-functions/table-functions/explode-json-array-int-outer | docs/sql-manual/sql-functions/table-functions/explode-json-array-int-outer.md | `cc460000e9f807bbcbfd3026a6c8b1df53ecc91bfa87ccebffc62b3da5d8752b` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-065

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 337.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/table-functions/explode-json-array-json | docs/sql-manual/sql-functions/table-functions/explode-json-array-json.md | `9628bff83cc8794e023fe37484ea26790acc6a367242acfb7df5b6f35ac2e134` |
| sql-manual/sql-functions/table-functions/explode-json-array-json-outer | docs/sql-manual/sql-functions/table-functions/explode-json-array-json-outer.md | `569bfb0e07c25bb8e001a7da6ee2e7a1a60e5fbc137f0071322b01dcdd75ea4a` |
| sql-manual/sql-functions/table-functions/explode-json-array-string | docs/sql-manual/sql-functions/table-functions/explode-json-array-string.md | `890abdbe76492bc0640afee45b50babce8a19f2b0e2ee1461f736395edbc30b1` |
| sql-manual/sql-functions/table-functions/explode-json-array-string-outer | docs/sql-manual/sql-functions/table-functions/explode-json-array-string-outer.md | `0b489436118b392c39e535b23f0d20b9e8fec03d69928dc63c9b8009d6921616` |
| sql-manual/sql-functions/table-functions/explode-json-object | docs/sql-manual/sql-functions/table-functions/explode-json-object.md | `8fb86b97fe0046da97a349e38e1ff3e210b6ff42963306a36fd002c76f808624` |
| sql-manual/sql-functions/table-functions/explode-map | docs/sql-manual/sql-functions/table-functions/explode-map.md | `71e7f3fb39e24960282cb68ddc9c232bbb4e439f7d6bbf806abbe0831767bddf` |
| sql-manual/sql-functions/table-functions/explode-map-outer | docs/sql-manual/sql-functions/table-functions/explode-map-outer.md | `476f8a8aba30587103c38ef437dab255f86c291e61946b40c65bef6888073653` |
| sql-manual/sql-functions/table-functions/explode-numbers | docs/sql-manual/sql-functions/table-functions/explode-numbers.md | `03d0e5525f06a8fcfa8415681befef46d8ec4291a6c80d3d82d31d3b6d05ada1` |
| sql-manual/sql-functions/table-functions/explode-numbers-outer | docs/sql-manual/sql-functions/table-functions/explode-numbers-outer.md | `0440a7cfc896bd9edf9ab36daccb6002f9a36086baaefc6c565852af1d9a38db` |
| sql-manual/sql-functions/table-functions/explode-split | docs/sql-manual/sql-functions/table-functions/explode-split.md | `d7004d9b12c7f1d4a143a76bbbd7610a8fe146c3a39664c9c44924d70e32cab2` |
| sql-manual/sql-functions/table-functions/explode-split-outer | docs/sql-manual/sql-functions/table-functions/explode-split-outer.md | `d84179ab2855720dbda865aaeb13f03afa7fded3d2c476276d75270d3cb45393` |
| sql-manual/sql-functions/table-functions/json-each | docs/sql-manual/sql-functions/table-functions/json-each.md | `cc287ddbcf348db7038c957ab5a819ff77876b094630d4375b2f329e195c8b53` |
| sql-manual/sql-functions/table-functions/json-each-outer | docs/sql-manual/sql-functions/table-functions/json-each-outer.md | `2d31d3b2dc332781f7c84869b1d3c0a1514dec3eb1dded9a7f8da2ed7db34673` |
| sql-manual/sql-functions/table-functions/json-each-text | docs/sql-manual/sql-functions/table-functions/json-each-text.md | `2dfef7ad1ef162c6edcc4a51b9db30c202ec3f23749a12231e9dedbeb19b4bf6` |
| sql-manual/sql-functions/table-functions/json-each-text-outer | docs/sql-manual/sql-functions/table-functions/json-each-text-outer.md | `3acc22779435bc1e3d732e3687411222cfde6fe1e609de032a1333e042d4fd99` |
| sql-manual/sql-functions/table-functions/posexplode | docs/sql-manual/sql-functions/table-functions/posexplode.md | `dd25fd61edca87cd24f549c0042b23cd717d2380e9ab33d8d2f283e84815da22` |
| sql-manual/sql-functions/table-functions/posexplode-outer | docs/sql-manual/sql-functions/table-functions/posexplode-outer.md | `4b4b26e7a38738fcb15dcb33ac4e9ff501a7a8e07673bb095529a0c7f34629c7` |
| sql-manual/sql-functions/table-functions/unnest | docs/sql-manual/sql-functions/table-functions/unnest.md | `31d2f1d648be1c556e37f5e4adcd989b21a55317071ec202cd7c1cbf9aad3d10` |
| sql-manual/sql-functions/table-valued-functions/backends | docs/sql-manual/sql-functions/table-valued-functions/backends.md | `c65ac0d8c3d778b24daab83bd09a369377a2a41bca1612e93c60226616384c0a` |
| sql-manual/sql-functions/table-valued-functions/binlog | docs/sql-manual/sql-functions/table-valued-functions/binlog.md | `9ce183c6ca41de947d30a6f055e6039e449cb78541e3b130d9f85820cef6dc90` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-066

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 317.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/table-valued-functions/cdc-stream | docs/sql-manual/sql-functions/table-valued-functions/cdc-stream.md | `eb8c139d0245924d782d9d0b798b3d403ea8d8da5722ef5dd0089e6729226963` |
| sql-manual/sql-functions/table-valued-functions/catalogs | docs/sql-manual/sql-functions/table-valued-functions/catalogs.md | `2ffdfb931062a6f0b0a22903dc51baa25d7b689b0408ed637ce49fff7e5eb81c` |
| sql-manual/sql-functions/table-valued-functions/file | docs/sql-manual/sql-functions/table-valued-functions/file.md | `b54ef96328c2d40d6b733f43dab917cce93b3b7f1b966341d1c7f2acaa7c8e17` |
| sql-manual/sql-functions/table-valued-functions/frontends | docs/sql-manual/sql-functions/table-valued-functions/frontends.md | `e26a862e6523354d3daaabc25dfbf0adc37cbf1596732436a9d8a83864591b31` |
| sql-manual/sql-functions/table-valued-functions/frontends_disks | docs/sql-manual/sql-functions/table-valued-functions/frontends_disks.md | `82c63621e77e4f8ed3ea5c4e79658f00bf9a8af1e5c8cb5709df0c1478e7cec5` |
| sql-manual/sql-functions/table-valued-functions/hdfs | docs/sql-manual/sql-functions/table-valued-functions/hdfs.md | `c5c098a1287fffd6231e8dcc8585dd9b12e6ea8d93174c512a7236389207f816` |
| sql-manual/sql-functions/table-valued-functions/http | docs/sql-manual/sql-functions/table-valued-functions/http.md | `2438c11bde8e91e4e38c4f1b9bf3a801d6eb947ecb916a9c15532417b73d37a7` |
| sql-manual/sql-functions/table-valued-functions/hudi-meta | docs/sql-manual/sql-functions/table-valued-functions/hudi-meta.md | `adcef4cbccb0205841440f5636598dc2e8652fa03f2478ce20f8fc72a1ecc745` |
| sql-manual/sql-functions/table-valued-functions/iceberg-meta | docs/sql-manual/sql-functions/table-valued-functions/iceberg-meta.md | `97bf5c2d25ff8b4edc21c3f748601fe2c2c43b338303eed959587ab6c59b6ed3` |
| sql-manual/sql-functions/table-valued-functions/jobs | docs/sql-manual/sql-functions/table-valued-functions/jobs.md | `29be1f7bc53a2eb48633b34f869bd14662201a4257ef7d606c1410d82f96fef2` |
| sql-manual/sql-functions/table-valued-functions/local | docs/sql-manual/sql-functions/table-valued-functions/local.md | `c5c098a1287fffd6231e8dcc8585dd9b12e6ea8d93174c512a7236389207f816` |
| sql-manual/sql-functions/table-valued-functions/mv_infos | docs/sql-manual/sql-functions/table-valued-functions/mv_infos.md | `758c469b894f1b3c0eae104192c713a162f3115028e5111689c3e0df96fdf85f` |
| sql-manual/sql-functions/table-valued-functions/numbers | docs/sql-manual/sql-functions/table-valued-functions/numbers.md | `0c36e4266f98a0104f9265473f26340a0fe16023c0e2a89f278e261428d08958` |
| sql-manual/sql-functions/table-valued-functions/parquet-meta | docs/sql-manual/sql-functions/table-valued-functions/parquet-meta.md | `a19a40cabaee920613dce316160b12f14584b837de937ff4fc2bf37304190adb` |
| sql-manual/sql-functions/table-valued-functions/partition-values | docs/sql-manual/sql-functions/table-valued-functions/partition-values.md | `e59f301ec54840d65046513b3671cb3481e31d1ee0f1b40c233d482e56256a0d` |
| sql-manual/sql-functions/table-valued-functions/partitions | docs/sql-manual/sql-functions/table-valued-functions/partitions.md | `222ef37a4687c9dee3bfeb41836985714ef9696460cc817f07c7c952d7066fbc` |
| sql-manual/sql-functions/table-valued-functions/query | docs/sql-manual/sql-functions/table-valued-functions/query.md | `e7278e658b46d3a85af1e120462814f339613baa628c8ffd792ca677d14d9d39` |
| sql-manual/sql-functions/table-valued-functions/s3 | docs/sql-manual/sql-functions/table-valued-functions/s3.md | `1c2666fa6086626dce7206667f50b34d0c868a680776e0c30f0bb0150dea10e7` |
| sql-manual/sql-functions/table-valued-functions/tasks | docs/sql-manual/sql-functions/table-valued-functions/tasks.md | `16d5a7c1588a77117909ce58634ed7b260be36f2b74896fada9e57c1ddb4389a` |
| sql-manual/sql-statements/data-query/SELECT | docs/sql-manual/sql-statements/data-query/SELECT.md | `a5e38a94a8aeeea2d827d547587c2a7e3b26f9a90666a7e9129361b5187f910f` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-067

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 297.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/data-query/EXPLAIN | docs/sql-manual/sql-statements/data-query/EXPLAIN.md | `0667393dba5049b3efb4fa5587ecaee9fc51b3cd8abe05021821b06be0445dfb` |
| sql-manual/sql-statements/data-modification/DML/INSERT | docs/sql-manual/sql-statements/data-modification/DML/INSERT.md | `8f7e7a7bd0a33fdfe819f40886000448884bdc49dc180c0861a3e5e5b42c4310` |
| sql-manual/sql-statements/data-modification/DML/INSERT-OVERWRITE | docs/sql-manual/sql-statements/data-modification/DML/INSERT-OVERWRITE.md | `607c38ddcd9120529f6bff803c8b9a338035bc3aceab3f71b8d0585201defb6b` |
| sql-manual/sql-statements/data-modification/DML/SHOW-LAST-INSERT | docs/sql-manual/sql-statements/data-modification/DML/SHOW-LAST-INSERT.md | `e5a80c538ab3b8ee5dbfa254a33420c850f64fb038fa4db0ff48802582166292` |
| sql-manual/sql-statements/data-modification/DML/UPDATE | docs/sql-manual/sql-statements/data-modification/DML/UPDATE.md | `bf5d73b5c4945a3bec824994761d85e88ec63fbdaa621a15d6ce3a08a2b9558e` |
| sql-manual/sql-statements/data-modification/DML/MERGE-INTO | docs/sql-manual/sql-statements/data-modification/DML/MERGE-INTO.md | `4b16a2de691425477abcc58b642e6fb0f8fe7fb24f8dd4bcc2e8fd33cf633503` |
| sql-manual/sql-statements/data-modification/DML/DELETE | docs/sql-manual/sql-statements/data-modification/DML/DELETE.md | `46740f8f426514500a1de9b6b6279e166165c06ad86f47ce4b029766c5f72f18` |
| sql-manual/sql-statements/data-modification/DML/SHOW-DELETE | docs/sql-manual/sql-statements/data-modification/DML/SHOW-DELETE.md | `572ed1e714ccb369d939e6f088934edbd03ed593c4cf35b9fb72517e91a9f9fc` |
| sql-manual/sql-statements/data-modification/load-and-export/BROKER-LOAD | docs/sql-manual/sql-statements/data-modification/load-and-export/BROKER-LOAD.md | `e73841fb748d54d0625b5a1d6e21cea5021b5e9d54f42b59d0f8c9056a36feb7` |
| sql-manual/sql-statements/data-modification/load-and-export/MYSQL-LOAD | docs/sql-manual/sql-statements/data-modification/load-and-export/MYSQL-LOAD.md | `c021f4c158766d6d19877df0a4bcfc36562c2a3dcd204098ddd3a0ea2caa9378` |
| sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD | docs/sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD.md | `7bf201e7681737d46731a3edea6e6f54361a53d09f08e3d8636fc59b5aa1674a` |
| sql-manual/sql-statements/data-modification/load-and-export/SHOW-STREAM-LOAD | docs/sql-manual/sql-statements/data-modification/load-and-export/SHOW-STREAM-LOAD.md | `066119a536e726480d6b3f6aae9ae3382abb4fbbc0d879be35c2a9a47c05fcbe` |
| sql-manual/sql-statements/data-modification/load-and-export/SHOW-CREATE-LOAD | docs/sql-manual/sql-statements/data-modification/load-and-export/SHOW-CREATE-LOAD.md | `2ac29d93f8c20680988a380cb2cd9da19ad0d7b4798595eeb156bb5bb4333df6` |
| sql-manual/sql-statements/data-modification/load-and-export/CANCEL-LOAD | docs/sql-manual/sql-statements/data-modification/load-and-export/CANCEL-LOAD.md | `af6b16cc8fbf87afb3b79c8e4670ffe113f9d3aaff87b3e9de4f04e73b2fb86a` |
| sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD-WARNINGS | docs/sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD-WARNINGS.md | `52438df203468911bd44aba30147ff2fe5dda4f5d2f305a24a05b5c1e783559c` |
| sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD | docs/sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD.md | `c8b3adee00f02b03fcc80a2cff5a0d0ae627bbc93a444ae78ad833c2f7c657e8` |
| sql-manual/sql-statements/data-modification/load-and-export/ALTER-ROUTINE-LOAD | docs/sql-manual/sql-statements/data-modification/load-and-export/ALTER-ROUTINE-LOAD.md | `c934d4b5eb22a78f5f894abc24a2a6c7e0494af477475d9d3d0f0729723e455c` |
| sql-manual/sql-statements/data-modification/load-and-export/PAUSE-ROUTINE-LOAD | docs/sql-manual/sql-statements/data-modification/load-and-export/PAUSE-ROUTINE-LOAD.md | `43eb559e1b9208e21d57d24c24b734033d921225842261cf5c9fca13fd274fdb` |
| sql-manual/sql-statements/data-modification/load-and-export/RESUME-ROUTINE-LOAD | docs/sql-manual/sql-statements/data-modification/load-and-export/RESUME-ROUTINE-LOAD.md | `8550ecec06c3e035968e8f748f043121527c5170fa7c37156df6184fe636faff` |
| sql-manual/sql-statements/data-modification/load-and-export/STOP-ROUTINE-LOAD | docs/sql-manual/sql-statements/data-modification/load-and-export/STOP-ROUTINE-LOAD.md | `d57a35ba0707452c6ee28e951fcaba24bf269ab6c897a39130f559f048ff6dd4` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-068

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 277.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD | docs/sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD.md | `a5d6bfdec403a1f054ebac0495bb5ee3af8e372d1c9c75862932ce639c64faf5` |
| sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD-TASK | docs/sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD-TASK.md | `dedae9dcf917c37aa614a1134c33b47ca9c9bb6f77d1e20ce326f5c041e5063d` |
| sql-manual/sql-statements/data-modification/load-and-export/SHOW-CREATE-ROUTINE-LOAD | docs/sql-manual/sql-statements/data-modification/load-and-export/SHOW-CREATE-ROUTINE-LOAD.md | `9e4a682ac54f558e6868fca0caeb7ee3ee49a6c2f4a8ce73b8abc6a55a644081` |
| sql-manual/sql-statements/data-modification/load-and-export/SYNC | docs/sql-manual/sql-statements/data-modification/load-and-export/SYNC.md | `bddfa669cfd1dd3a9142a0c31c6e2e53668c9483b83289cd9589cdc5cb00d2c6` |
| sql-manual/sql-statements/data-modification/load-and-export/EXPORT | docs/sql-manual/sql-statements/data-modification/load-and-export/EXPORT.md | `cdb9c13112b0d5bdbcd7eac42eb74c4b0658ceb0fe706966eb08ba2003b1e8ed` |
| sql-manual/sql-statements/data-modification/load-and-export/CANCEL-EXPORT | docs/sql-manual/sql-statements/data-modification/load-and-export/CANCEL-EXPORT.md | `3494f2a53d6248313625d7502dc4a56ff7611170c4d9836b437c050bde67379e` |
| sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT | docs/sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT.md | `6b2b78c429f424465a56a0c9f6784c2c129decaefaa3b640e4be577bb53b98b0` |
| sql-manual/sql-statements/data-modification/load-and-export/OUTFILE | docs/sql-manual/sql-statements/data-modification/load-and-export/OUTFILE.md | `38b59164e659e649fcb37518c3b40cbfbef9975801cb85eba818f7fea2ee34e6` |
| sql-manual/sql-statements/data-modification/load-and-export/CLEAN-LABEL | docs/sql-manual/sql-statements/data-modification/load-and-export/CLEAN-LABEL.md | `d63253640be082c31763cb5fc3ef634c1e6b6da1d9355e810a47aa1094f279ba` |
| sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY | docs/sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY.md | `1c20144f257a2f9dfaa7d6f5fba8161dd78ee3c995408c6ebfcb407aa04d7130` |
| sql-manual/sql-statements/data-modification/backup-and-restore/DROP-REPOSITORY | docs/sql-manual/sql-statements/data-modification/backup-and-restore/DROP-REPOSITORY.md | `a6ca45f30583f6d5630e73a2b371cbbe5fee1e601402ce442e839d81c034f47a` |
| sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-CREATE-REPOSITORY | docs/sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-CREATE-REPOSITORY.md | `14690427a2f494410ac3ba34b4ee86bafb00c13cf2f9b9db735beaafe2087ede` |
| sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-REPOSITORIES | docs/sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-REPOSITORIES.md | `27c59b63bf784498ba1edca7f25d5b02325175765ebaccb5c41950f42b8d1541` |
| sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP | docs/sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP.md | `5424899f9ed0590360a73c03389486e72f1049df057007288f6f6efbd079d48e` |
| sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-BACKUP | docs/sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-BACKUP.md | `dddd3299016158e1b55e692376c0792a060f29375f7979851cdd4e9f2f7c491f` |
| sql-manual/sql-statements/data-modification/backup-and-restore/RESTORE | docs/sql-manual/sql-statements/data-modification/backup-and-restore/RESTORE.md | `c233788b44167ab23a1792e03a02653540a1b19388e4e59b8ba1214ccfdc561a` |
| sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-RESTORE | docs/sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-RESTORE.md | `162ad7cb1c2b9e1607ee133224e4725912939f6dcdce9cca6587b37a07037fe0` |
| sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-RESTORE | docs/sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-RESTORE.md | `cebf4f74470320060ee8be783e94f852ef7fee9ae1e2d51ad6f6b19bdef66e34` |
| sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-SNAPSHOT | docs/sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-SNAPSHOT.md | `d5131842f8cfbf9d46aa94f981e96d0fc2c7ceb29e5abd961cf3857eda6077eb` |
| sql-manual/sql-statements/account-management/CREATE-USER | docs/sql-manual/sql-statements/account-management/CREATE-USER.md | `9769a6aa60807fad11a30784db8e32c7f8bc1e5b46872be306930f5913bb9345` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-069

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 257.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/account-management/ALTER-USER | docs/sql-manual/sql-statements/account-management/ALTER-USER.md | `0c50f660a6e9ec4d8b0995cf6180478be890054831030649c4d8aeef91658070` |
| sql-manual/sql-statements/account-management/DROP-USER | docs/sql-manual/sql-statements/account-management/DROP-USER.md | `73cf48d4aa8207d360b92cf6da4b8b69bc95aa04bf2cbb00550807db111183ba` |
| sql-manual/sql-statements/account-management/SET-PASSWORD | docs/sql-manual/sql-statements/account-management/SET-PASSWORD.md | `a83c470134ac6d44c1eb98c56f11710cb57fbdfa8d756c7b8b886a468d87cd53` |
| sql-manual/sql-statements/account-management/CREATE-ROLE | docs/sql-manual/sql-statements/account-management/CREATE-ROLE.md | `5e57abd27c77f76db7b6e55f1dfd437545644abd9d7c470b648ed57f90290615` |
| sql-manual/sql-statements/account-management/ALTER-ROLE | docs/sql-manual/sql-statements/account-management/ALTER-ROLE.md | `85e2f87aa4f6cf6bb40a87303b9af1043cfa861e963087449e6dfd845c321283` |
| sql-manual/sql-statements/account-management/DROP-ROLE | docs/sql-manual/sql-statements/account-management/DROP-ROLE.md | `9970456bbde187edf424c53c29a9856a0847cfd8138175633936713c667e9db4` |
| sql-manual/sql-statements/account-management/SHOW-ROLES | docs/sql-manual/sql-statements/account-management/SHOW-ROLES.md | `08a00b91e2f2dadecdf5f2ae98ee2717beb4f9524e026eddaa42b3748c12acb9` |
| sql-manual/sql-statements/account-management/GRANT-TO | docs/sql-manual/sql-statements/account-management/GRANT-TO.md | `fe89064712ab4c77320f0d31c36d8e4a63ad236a0377c6ca25773506b23c325f` |
| sql-manual/sql-statements/account-management/REVOKE-FROM | docs/sql-manual/sql-statements/account-management/REVOKE-FROM.md | `5dbd70421778a9b59c38e6fa9feb9f0d9aa850605a6ccc7d941bfb6ab711ff35` |
| sql-manual/sql-statements/account-management/SHOW-CREATE-USER | docs/sql-manual/sql-statements/account-management/SHOW-CREATE-USER.md | `0900ce9cbb99293818f705e8bc8e6af97e15f734fcacf122255418d51527a5dc` |
| sql-manual/sql-statements/account-management/SHOW-PRIVILEGES | docs/sql-manual/sql-statements/account-management/SHOW-PRIVILEGES.md | `561ceba70f5ea4e9da6edc4c8791c53ba2c5e20734c337a5a4920c760e7711ee` |
| sql-manual/sql-statements/account-management/SHOW-GRANTS | docs/sql-manual/sql-statements/account-management/SHOW-GRANTS.md | `30a2d016fc796392a978149ab8673f989cffabd8c3aa99f20ccd0ec660cd415a` |
| sql-manual/sql-statements/account-management/REFRESH-LDAP | docs/sql-manual/sql-statements/account-management/REFRESH-LDAP.md | `0b18b3c938a0f8e72362162da6daedfaa204d2d4cb40587842d8de31e85187ca` |
| sql-manual/sql-statements/account-management/SET-LDAP_ADMIN_PASSWORD | docs/sql-manual/sql-statements/account-management/SET-LDAP_ADMIN_PASSWORD.md | `95a9072532338a335da35af8e4bc37f0f67961d2d6568e913786f01267757cfb` |
| sql-manual/sql-statements/account-management/SET-PROPERTY | docs/sql-manual/sql-statements/account-management/SET-PROPERTY.md | `28a8c785b38c1bdb3ab32e60dfaaefdead58e3d07847b4f8387c03d8861c1ea1` |
| sql-manual/sql-statements/account-management/SHOW-PROPERTY | docs/sql-manual/sql-statements/account-management/SHOW-PROPERTY.md | `20b800cb7ae470ffa27a96bc1ecb4549cb5c369d7f95c232c600dddd721bf8ca` |
| sql-manual/sql-statements/session/context/USE-COMPUTE-GROUP | docs/sql-manual/sql-statements/session/context/USE-COMPUTE-GROUP.md | `4178b9dc5413d63126451558cd665a3490693b52c38fb8441088fffbdb1045c0` |
| sql-manual/sql-statements/session/context/SWITCH-CATALOG | docs/sql-manual/sql-statements/session/context/SWITCH-CATALOG.md | `590e8260804b98c191b69209a9d8bbbd8748930b3cbbb8b722dc1fae7952ed9f` |
| sql-manual/sql-statements/session/context/USE-DATABASE | docs/sql-manual/sql-statements/session/context/USE-DATABASE.md | `206ce0b8499486ae5eaaf9d99a4fb2a973a20100e637f64faa4686899fb59e99` |
| sql-manual/sql-statements/session/variable/SET-VARIABLE | docs/sql-manual/sql-statements/session/variable/SET-VARIABLE.md | `d3c4ad60808cabc89fa177f3c6a775f6b8cf29ef5cc4b0745cc84fa99ebde283` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-070

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 237.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/session/variable/UNSET-VARIABLE | docs/sql-manual/sql-statements/session/variable/UNSET-VARIABLE.md | `0c76c424b2203094a721a83e8781c3367fbab1b9c71d9702f25b9d55dd98a83c` |
| sql-manual/sql-statements/session/variable/SHOW-VARIABLES | docs/sql-manual/sql-statements/session/variable/SHOW-VARIABLES.md | `c619a804538ecf9a372e12bc2e12673d4f7457319fb42404c561c72222304bee` |
| sql-manual/sql-statements/session/queries/SHOW-PROCESSLIST | docs/sql-manual/sql-statements/session/queries/SHOW-PROCESSLIST.md | `ca876803fa3e9ecb520daaecbdc8e43eee97c31bc15604038a7ae5a9223a1483` |
| sql-manual/sql-statements/session/queries/KILL-QUERY | docs/sql-manual/sql-statements/session/queries/KILL-QUERY.md | `f2ad0070b63aabd53c7ae1e18846a06a2520fc7dd03ccbea5be962fdf1ee91f9` |
| sql-manual/sql-statements/session/queries/CLEAN-ALL-PROFILE | docs/sql-manual/sql-statements/session/queries/CLEAN-ALL-PROFILE.md | `771273be0b9dc412a9c2431e69f74456e429b2cb9ebebc338c207a1cfb930f36` |
| sql-manual/sql-statements/session/queries/SHOW-QUERY-STATS | docs/sql-manual/sql-statements/session/queries/SHOW-QUERY-STATS.md | `663413a48bddcd8929128109868d734c2451bb0117103d48d94d59b0635d6886` |
| sql-manual/sql-statements/session/queries/CLEAN-ALL-QUERY-STATS | docs/sql-manual/sql-statements/session/queries/CLEAN-ALL-QUERY-STATS.md | `39bee638ef43d567d3fb5d76ea1d4d88f8ef232eb25f3c4d0b83087bf62c877e` |
| sql-manual/sql-statements/session/connection/KILL-CONNECTION | docs/sql-manual/sql-statements/session/connection/KILL-CONNECTION.md | `f82977fe00c2deb5b84f3cbe13542bdd40a35b14ca1f7858e4e5a52e34e25c34` |
| sql-manual/sql-statements/transaction/BEGIN | docs/sql-manual/sql-statements/transaction/BEGIN.md | `85b229fa700afd4136e428dbb23ea7baeb039d750a87625536effbbc671f1435` |
| sql-manual/sql-statements/transaction/COMMIT | docs/sql-manual/sql-statements/transaction/COMMIT.md | `f43e1708d774cb6e6395f13dd71f77e1b57ab1cf3287477315efa3c584cb1151` |
| sql-manual/sql-statements/transaction/ROLLBACK | docs/sql-manual/sql-statements/transaction/ROLLBACK.md | `819aba3d2cc944a9ca434f13f3ccfb69cd4b9f9eb3604deb5508977759cca3d0` |
| sql-manual/sql-statements/transaction/SHOW-TRANSACTION | docs/sql-manual/sql-statements/transaction/SHOW-TRANSACTION.md | `895a09d67dd1b53cabd56e8c96b6afabf43c1e871ebd647b5f71a3d7754e6151` |
| sql-manual/sql-statements/catalog/CREATE-CATALOG | docs/sql-manual/sql-statements/catalog/CREATE-CATALOG.md | `d462f81ed1789a8444f2107b2edb8c2001c727d07e46271beb6e820678c200bf` |
| sql-manual/sql-statements/catalog/ALTER-CATALOG | docs/sql-manual/sql-statements/catalog/ALTER-CATALOG.md | `1e77822ff370cfa2468461a2d5ec6d3642f5e9df708764415da4e278b0f0b42d` |
| sql-manual/sql-statements/catalog/DROP-CATALOG | docs/sql-manual/sql-statements/catalog/DROP-CATALOG.md | `d0b85fb449551b206d99664546992b5ddd183205a2849a9da57acd02afb13567` |
| sql-manual/sql-statements/catalog/SHOW-CREATE-CATALOG | docs/sql-manual/sql-statements/catalog/SHOW-CREATE-CATALOG.md | `dc31c7fbf63ad6cede489f0f7f8d632d01e058e18c92376f49a7126f01e8b1ae` |
| sql-manual/sql-statements/catalog/SHOW-CATALOG | docs/sql-manual/sql-statements/catalog/SHOW-CATALOG.md | `407f5625cdb2ff7d97bc14965dc64c7822c3ec2d05007950a667e01ce33dff76` |
| sql-manual/sql-statements/catalog/SHOW-CATALOGS | docs/sql-manual/sql-statements/catalog/SHOW-CATALOGS.md | `a9c78d74b2ee473135acc949cc1d8139475a7c1b8a961317f6efe95f549a4274` |
| sql-manual/sql-statements/catalog/REFRESH | docs/sql-manual/sql-statements/catalog/REFRESH.md | `761f6e073a66eaa08d718008edfc9962416dbc9b0db314de8dfe70d30cf014e1` |
| sql-manual/sql-statements/database/CREATE-DATABASE | docs/sql-manual/sql-statements/database/CREATE-DATABASE.md | `17965b92d4ccd5fc1cbff2912183cb1cae61eaf5d136a324908f209825d7ad36` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-071

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 217.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/database/ALTER-DATABASE | docs/sql-manual/sql-statements/database/ALTER-DATABASE.md | `c18426fc5374af5b67eedce528caddcb35cc2f3264ed1f944b4969bfca28764c` |
| sql-manual/sql-statements/database/DROP-DATABASE | docs/sql-manual/sql-statements/database/DROP-DATABASE.md | `8f29349a50432ac48064cfe61ab1aee8dee0da9b41922757eeaf821fe39c3930` |
| sql-manual/sql-statements/database/SHOW-CREATE-DATABASE | docs/sql-manual/sql-statements/database/SHOW-CREATE-DATABASE.md | `57debf9f33d3a31c5b5f6b586710c01f730e91385d90e53a2e65156670f7fc63` |
| sql-manual/sql-statements/database/SHOW-DATABASES | docs/sql-manual/sql-statements/database/SHOW-DATABASES.md | `1597cbeeb8cfaeae1aa265b2b58dd3cd37960afd576bcfc0528e72736376247c` |
| sql-manual/sql-statements/database/SHOW-DATABASE-ID | docs/sql-manual/sql-statements/database/SHOW-DATABASE-ID.md | `f3bd46c531b10316563d26657d317ab2c7e03c3e0db4e6a43d3eddc58eb9c73b` |
| sql-manual/sql-statements/table-and-view/table/CREATE-TABLE | docs/sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md | `417ff10f91e7d3d4524feb55afad4bd81f7f3163fd268fd45e79fc3c55cb288d` |
| sql-manual/sql-statements/table-and-view/table/DESC-TABLE | docs/sql-manual/sql-statements/table-and-view/table/DESC-TABLE.md | `9628078267ba0cff3b673a4250fe53b74ad78ff14cd6125591eedc7c5bf4cd31` |
| sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN | docs/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN.md | `6715b7a0e5a912b22af46b1e1aebeb815ac25bbf49cd2006169234da67fa1b09` |
| sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PARTITION | docs/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PARTITION.md | `a89115a0ddfa26c0385ae52c7ddfff1e38eb66fd6591640619cddc0a743584ca` |
| sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-ROLLUP | docs/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-ROLLUP.md | `7abde5ba503c98fc85475520a305993846407955a4df42dcded1b7a7bfe3d8ca` |
| sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-RENAME | docs/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-RENAME.md | `a574e1bf3875a1de62e4bcb7f51a8f2d88d65b1e06933b066d5c0eb06d31ae88` |
| sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-REPLACE | docs/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-REPLACE.md | `7de37330e4d8a3cdfdfb4e368a16224fb252a42a3e68dcf6a26e61c4c3e0ed55` |
| sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PROPERTY | docs/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PROPERTY.md | `fddafbe4b2907d1f97f3eb7a968f0181f7f354a75144143c0e53463b874fe9d7` |
| sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COMMENT | docs/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COMMENT.md | `71ff7174f6e0210444c0fcbcdaa3ea1a882e54265f874918f65391c5f721dcb2` |
| sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-DISTRIBUTION | docs/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-DISTRIBUTION.md | `f78fbb4477b6958d6ac201f2b755b88bd767303a0267ecec4a0f401b5171e67a` |
| sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-ADD-GENERATED-COLUMN | docs/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-ADD-GENERATED-COLUMN.md | `3a1bd8a6ffbcacc96e8dc21ed1f4fc41e5519b5486d842baee9ad336cc020e7f` |
| sql-manual/sql-statements/table-and-view/table/CANCEL-ALTER-TABLE | docs/sql-manual/sql-statements/table-and-view/table/CANCEL-ALTER-TABLE.md | `0d02229a6c3c5b9b81a09d30de0b72f9a481a5cee7393b36bd62998a616e1221` |
| sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE | docs/sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE.md | `71ba50f435f5007c8452f54828f4c60714bdae099b7e6e214ffa0fde9edbb188` |
| sql-manual/sql-statements/table-and-view/table/TRUNCATE-TABLE | docs/sql-manual/sql-statements/table-and-view/table/TRUNCATE-TABLE.md | `9a22a8306640928094d72449ae30990c16b202576d2439ae732f4e3e83ee6301` |
| sql-manual/sql-statements/table-and-view/table/DROP-TABLE | docs/sql-manual/sql-statements/table-and-view/table/DROP-TABLE.md | `0f4152d8beabfef99a40ed3e35dc1fbc41294b4ed07f6596b5490ea47f444086` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-072

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 197.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/table-and-view/table/SHOW-CREATE-TABLE | docs/sql-manual/sql-statements/table-and-view/table/SHOW-CREATE-TABLE.md | `7e8f40eb691cbf43ec66191f6b51cea0726646d7f30cfab495b45ff3a9836b8c` |
| sql-manual/sql-statements/table-and-view/table/SHOW-TABLES | docs/sql-manual/sql-statements/table-and-view/table/SHOW-TABLES.md | `49d812814286030d341599c5526ff87ecc2580845b1fbe9cece1a382ce21cc5d` |
| sql-manual/sql-statements/table-and-view/table/SHOW-TABLE-ID | docs/sql-manual/sql-statements/table-and-view/table/SHOW-TABLE-ID.md | `6d50bc0b7e4b893d6ac9c40a24807d342d8bc1afad610df689a958ff66f7b11a` |
| sql-manual/sql-statements/table-and-view/table/SHOW-TABLE-STATUS | docs/sql-manual/sql-statements/table-and-view/table/SHOW-TABLE-STATUS.md | `92eddb15d19724cf958ec265e8e5e8f114d790b39ba93832f5de203188178c5e` |
| sql-manual/sql-statements/table-and-view/table/SHOW-CONVERT-LIGHT-SCHEMA-CHANGE-PROCESS | docs/sql-manual/sql-statements/table-and-view/table/SHOW-CONVERT-LIGHT-SCHEMA-CHANGE-PROCESS.md | `fa0839ab04f700098ba55d96f53d9e8ec56a59af05461cc6cfb6b69feb1dd38f` |
| sql-manual/sql-statements/table-and-view/table/SHOW-PARTITION | docs/sql-manual/sql-statements/table-and-view/table/SHOW-PARTITION.md | `7c10b4f4736a725fa47b7c54d3495843c57e4dd463e90b6b89b7515117d9e6de` |
| sql-manual/sql-statements/table-and-view/table/SHOW-PARTITION-ID | docs/sql-manual/sql-statements/table-and-view/table/SHOW-PARTITION-ID.md | `83a3bc35a112e7959cafabff6d61ecb5e57ab1d5ea62b6c4b64207fa553fd295` |
| sql-manual/sql-statements/table-and-view/table/SHOW-PARTITIONS | docs/sql-manual/sql-statements/table-and-view/table/SHOW-PARTITIONS.md | `6dd92e13b900661c5c3fd56e3e3eb43fedd7fa875b2a6b3737e7639efc1278a5` |
| sql-manual/sql-statements/table-and-view/table/SHOW-DYNAMIC-PARTITION-TABLES | docs/sql-manual/sql-statements/table-and-view/table/SHOW-DYNAMIC-PARTITION-TABLES.md | `227355c040db02e38d4ca76b887bb80f5abac246ff336faba79bf90cc9c5a9c9` |
| sql-manual/sql-statements/table-and-view/table/SHOW-COLUMNS | docs/sql-manual/sql-statements/table-and-view/table/SHOW-COLUMNS.md | `8ff0b532f4e2d675793a3c619fc24c9632a1cb3b8a15b04cb33399167f2b41ab` |
| sql-manual/sql-statements/table-and-view/table/ALTER-COLOCATE-GROUP | docs/sql-manual/sql-statements/table-and-view/table/ALTER-COLOCATE-GROUP.md | `69fcf417df7b5229a1a246b69d93c3463def9d6d38e51c694eeeac286d8d163f` |
| sql-manual/sql-statements/table-and-view/index/CREATE-INDEX | docs/sql-manual/sql-statements/table-and-view/index/CREATE-INDEX.md | `3bc081f389d53c69d8f4f6c2f6e2dc5a71f64762a5db16d90943f7c6d13532c6` |
| sql-manual/sql-statements/table-and-view/index/DROP-INDEX | docs/sql-manual/sql-statements/table-and-view/index/DROP-INDEX.md | `2a5f775ba0dfeec836cc8e8c05368d1b0787f00056254c02f238defdc51bc966` |
| sql-manual/sql-statements/table-and-view/index/SHOW-INDEX | docs/sql-manual/sql-statements/table-and-view/index/SHOW-INDEX.md | `900527bdb70d9d9c0cf870aded7e30ab7a7ce5b7526ba71722bf1e5b677ed555` |
| sql-manual/sql-statements/table-and-view/index/BUILD-INDEX | docs/sql-manual/sql-statements/table-and-view/index/BUILD-INDEX.md | `54e4d71e3e812f72580e63aecc36bc677a64735136a1d3f21949fefd879d2c1d` |
| sql-manual/sql-statements/table-and-view/index/CANCEL-BUILD-INDEX | docs/sql-manual/sql-statements/table-and-view/index/CANCEL-BUILD-INDEX.md | `9800c6153cc574731cb85c5c962dd4acd39e4c3b96ef2097860d03f7da47ebc5` |
| sql-manual/sql-statements/table-and-view/index/SHOW-BUILD-INDEX | docs/sql-manual/sql-statements/table-and-view/index/SHOW-BUILD-INDEX.md | `7f8e8d891ba87b4d9a66743429bcd891b02a23adf8311acd08cf26c6d3db6f12` |
| sql-manual/sql-statements/table-and-view/view/CREATE-VIEW | docs/sql-manual/sql-statements/table-and-view/view/CREATE-VIEW.md | `1a16e17af6571ad74a883a7d0b136f5467bba2c377dea77c1d5cbee14b30bf7a` |
| sql-manual/sql-statements/table-and-view/view/ALTER-VIEW | docs/sql-manual/sql-statements/table-and-view/view/ALTER-VIEW.md | `2d1fccac0cb398f75cb5accd1737ab3bd3d693886b62466d4a03c9f46db468c8` |
| sql-manual/sql-statements/table-and-view/view/DROP-VIEW | docs/sql-manual/sql-statements/table-and-view/view/DROP-VIEW.md | `1ad1a5f2ace8c9f115421e50fa08685e649bb2f73a8ec9fa81ee160905b01c0e` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-073

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 177.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/table-and-view/view/SHOW-CREATE-VIEW | docs/sql-manual/sql-statements/table-and-view/view/SHOW-CREATE-VIEW.md | `b82a03b4bc5863fdc5c77cdb02735e9622d777b7a218a9cf6cafb6143f2a515c` |
| sql-manual/sql-statements/table-and-view/view/SHOW-VIEW | docs/sql-manual/sql-statements/table-and-view/view/SHOW-VIEW.md | `90dd186de58564ed0853db0899e7e9896de681c601814d461877768183860ff2` |
| sql-manual/sql-statements/table-and-view/stream/CREATE-STREAM | docs/sql-manual/sql-statements/table-and-view/stream/CREATE-STREAM.md | `aebe6117548d85ebb44d5c443c27ea3e64ecd54a3c742669119b77cf50a23018` |
| sql-manual/sql-statements/table-and-view/stream/ALTER-STREAM | docs/sql-manual/sql-statements/table-and-view/stream/ALTER-STREAM.md | `7ff6ca0af64c6bcbbea5b380f37f117b4420c54ce124077167e35df52fc08a05` |
| sql-manual/sql-statements/table-and-view/stream/DROP-STREAM | docs/sql-manual/sql-statements/table-and-view/stream/DROP-STREAM.md | `cb52e0c6bcf25e0c486c81299b95aca9610fed36b5738602c6a9ea63ae650e3f` |
| sql-manual/sql-statements/table-and-view/stream/SHOW-CREATE-STREAM | docs/sql-manual/sql-statements/table-and-view/stream/SHOW-CREATE-STREAM.md | `4618d98a75ddb2423382bd1e592d207ec9df8a1a05aa053d58d2576214ee6f91` |
| sql-manual/sql-statements/table-and-view/stream/SHOW-STREAMS | docs/sql-manual/sql-statements/table-and-view/stream/SHOW-STREAMS.md | `eb37c71f3c74e05fdde1ef5335de9fb157efc85e4e0cccde6a4ff1fb43bd9024` |
| sql-manual/sql-statements/table-and-view/sync-materialized-view/CREATE-MATERIALIZED-VIEW | docs/sql-manual/sql-statements/table-and-view/sync-materialized-view/CREATE-MATERIALIZED-VIEW.md | `498e92a60097014f82fd8c104ac4b9b73d6813eaa930c681093c1ede685cc25c` |
| sql-manual/sql-statements/table-and-view/sync-materialized-view/DROP-MATERIALIZED-VIEW | docs/sql-manual/sql-statements/table-and-view/sync-materialized-view/DROP-MATERIALIZED-VIEW.md | `b68421c4094f8e689035ae958ee43d6f2f4b83d4e86c850ec9cb2204bb709ec5` |
| sql-manual/sql-statements/table-and-view/sync-materialized-view/SHOW-ALTER-TABLE-MATERIALIZED-VIEW | docs/sql-manual/sql-statements/table-and-view/sync-materialized-view/SHOW-ALTER-TABLE-MATERIALIZED-VIEW.md | `27871927e0c0837356a36f2f43c392a02d44b563714bae6fe51cebbfd43610dd` |
| sql-manual/sql-statements/table-and-view/sync-materialized-view/SHOW-CREATE-MATERIALIZED-VIEW | docs/sql-manual/sql-statements/table-and-view/sync-materialized-view/SHOW-CREATE-MATERIALIZED-VIEW.md | `216e509f9d3ba79bb04e20a11397de811ac02e3a77954245e29d3406df090df4` |
| sql-manual/sql-statements/table-and-view/async-materialized-view/ALTER-ASYNC-MATERIALIZED-VIEW | docs/sql-manual/sql-statements/table-and-view/async-materialized-view/ALTER-ASYNC-MATERIALIZED-VIEW.md | `724128df997dbed9b00b802780f2bf57e558da0cbb1a596e08263419e5f43130` |
| sql-manual/sql-statements/table-and-view/async-materialized-view/CANCEL-MATERIALIZED-VIEW-TASK | docs/sql-manual/sql-statements/table-and-view/async-materialized-view/CANCEL-MATERIALIZED-VIEW-TASK.md | `0cf01da72f15c8286bdebdcd18d2f5e0c7dbcd78b69bf9799625e525a940ae1b` |
| sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW | docs/sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW.md | `5f5109a4bf51e5f5a006f2f64a971c4d7baf4b501f827f37f42c4a172fa8ead4` |
| sql-manual/sql-statements/table-and-view/async-materialized-view/PAUSE-MATERIALIZED-VIEW-JOB | docs/sql-manual/sql-statements/table-and-view/async-materialized-view/PAUSE-MATERIALIZED-VIEW-JOB.md | `68bdc05f14bc460d5001047bfe5bda942586a081dde47b5040d858a0501f78fc` |
| sql-manual/sql-statements/table-and-view/async-materialized-view/DROP-ASYNC-MATERIALIZED-VIEW | docs/sql-manual/sql-statements/table-and-view/async-materialized-view/DROP-ASYNC-MATERIALIZED-VIEW.md | `4ed48ff94566cb2d84a3f91f5a699e1c74688efa4d56989def0fc7a37a79d4ae` |
| sql-manual/sql-statements/table-and-view/async-materialized-view/REFRESH-MATERIALIZED-VIEW | docs/sql-manual/sql-statements/table-and-view/async-materialized-view/REFRESH-MATERIALIZED-VIEW.md | `c7c84ce5a60e96fc4402016049977bfe3f1a25bebdf5d341c3fbb736d0d9a71f` |
| sql-manual/sql-statements/table-and-view/async-materialized-view/RESUME-MATERIALIZED-VIEW-JOB | docs/sql-manual/sql-statements/table-and-view/async-materialized-view/RESUME-MATERIALIZED-VIEW-JOB.md | `6e5482d8e10f2a9b19845fc44aba5c00b08101a31092c7be733e5049978e74b7` |
| sql-manual/sql-statements/table-and-view/async-materialized-view/SHOW-CREATE-ASYNC-MATERIALIZED-VIEW | docs/sql-manual/sql-statements/table-and-view/async-materialized-view/SHOW-CREATE-ASYNC-MATERIALIZED-VIEW.md | `f6e07065e1f819d921918beb448c77f4e76bb50362416e5d624441e0be020867` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/REBALANCE-DISK | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/REBALANCE-DISK.md | `1d20365a3e82f81393f6e556fcf038de3ac66f0d1227fa5b97635aaa3dc25493` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-074

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 157.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/table-and-view/data-and-status-management/CANCEL-REBALANCE-DISK | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/CANCEL-REBALANCE-DISK.md | `5b30baa82150c61d877de07e4f29f1700d22c7c4d3f2814d64144020ff7f2479` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-DATA | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-DATA.md | `993b883c56044a7b0f5356c51364ef1418c4fc3a5811a29af38d8de2be0d4797` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-DATA-SKEW | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-DATA-SKEW.md | `9ee725a13fb8ac2240c6f5fe4e15864ba5f248f9922bd0fa6bd24be89156eb6b` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/COMPACT-TABLE | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/COMPACT-TABLE.md | `fcb89107bb083d68951d5a6ebd20db5149c57e52ebda0e449febab2fb52f2429` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/REPAIR-TABLE | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/REPAIR-TABLE.md | `3975b497567fc376147db3ab87db83bed4acda8b8e820383100d92a947718580` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/CANCEL-REPAIR-TABLE | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/CANCEL-REPAIR-TABLE.md | `3d71e5d2d2d0d9f3e713db792f420f1b479067cc680f9b2b25118228ebff9ea9` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SET-TABLE-STATUS | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/SET-TABLE-STATUS.md | `eccc03e94a072ef2409f34365a0762c1087909ce35d087ba5f7051682a4556c0` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SET-TABLE-PARTITION-VERSION | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/SET-TABLE-PARTITION-VERSION.md | `2782f051e6917c20283a384716f78ba77e3914348659fe8e5ec600f57c91a0b5` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/DIAGNOSE-TABLET | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/DIAGNOSE-TABLET.md | `b346950525ace9b5c3bdff79fa61880cf95a3c177b9e0558eb183f54235d9e97` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/ADMIN-COPY-TABLET | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/ADMIN-COPY-TABLET.md | `c43088e8d0f5a7f26869d25aafafcb509bd344ec0ca1812181332bbdf859c750` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/ADMIN-CHECK-TABLET | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/ADMIN-CHECK-TABLET.md | `b6e27cfe11b6f3ee62fdd16ea1215f6fc72ffedf797f3c11743c039e52e42569` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET.md | `591386fc4ddf7c9043df5c304737d649ff059c04a992e8097aed019fc3e3609f` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLETS-BELONG | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLETS-BELONG.md | `3d47255e9ce774e0625430a996904b242e63be29341687c820bf584b5af053c4` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET-STORAGE-FORMAT | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET-STORAGE-FORMAT.md | `96d85592f0533bbd22d60cf88722f251b231283062c70c277908d30b8b1ff935` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET-DIAGNOSIS | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET-DIAGNOSIS.md | `41322c6f07783dad093843e720307c3957c06aa0ab74d7a3ee9054a10a925586` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/ADMIN-SET-REPLICA-STATUS | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/ADMIN-SET-REPLICA-STATUS.md | `d5365bf43f31d16726f0444e9e8ae402392023b429c34d09ac809be56096e2da` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/ADMIN-SET-REPLICA-VERSION | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/ADMIN-SET-REPLICA-VERSION.md | `9d1f3751686b915bbb7de83bd756aaa4f6e9357298c15fcf9cf9159b813176b7` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-REPLICA-STATUS | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-REPLICA-STATUS.md | `6972ea03879b2abf007edfe0a9e9c1dd577ff2d1f501350b2eb673225ee8a3be` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-REPLICA-DISTRIBUTION | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-REPLICA-DISTRIBUTION.md | `51b1d5ce3dfb9043cfcd8e7b634ae8138bbf0c30d8a796daee02e77e3844e21f` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/CLEAN-TRASH | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/CLEAN-TRASH.md | `fe07d7fc65e05041e5fabeb0fd86a171989aba850af61066426affbdbb14a583` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-075

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 137.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TRASH | docs/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TRASH.md | `333c2c08a822a4f3e3176b354e6d2ed4d34789af102f0e0cd97f4a5e6afae622` |
| sql-manual/sql-statements/recycle/SHOW-CATALOG-RECYCLE-BIN | docs/sql-manual/sql-statements/recycle/SHOW-CATALOG-RECYCLE-BIN.md | `3095e232cc2629a9ceb2eebd6a8bf91411d7813bc8e71486d4291443da5ad7c1` |
| sql-manual/sql-statements/recycle/DROP-CATALOG-RECYCLE-BIN | docs/sql-manual/sql-statements/recycle/DROP-CATALOG-RECYCLE-BIN.md | `7550abb7dfbb08b5f516c35802685a4bcc8fbeb27cba1b795b41fcef8454b49d` |
| sql-manual/sql-statements/recycle/RECOVER | docs/sql-manual/sql-statements/recycle/RECOVER.md | `dd397620db8baa8583654417ce2fabf404a3b3182a295656f98531fd7e9ceae0` |
| sql-manual/sql-statements/function/CREATE-FUNCTION | docs/sql-manual/sql-statements/function/CREATE-FUNCTION.md | `24d46cfc4001c15baff27ca85c9fbc03b312e8b5ea7322123171740ae52f1921` |
| sql-manual/sql-statements/function/DROP-FUNCTION | docs/sql-manual/sql-statements/function/DROP-FUNCTION.md | `285c8ca04a4fb477fbe0181672a6b4fdf47cd90139004b9d4795a0c620abd43c` |
| sql-manual/sql-statements/function/SHOW-CREATE-FUNCTION | docs/sql-manual/sql-statements/function/SHOW-CREATE-FUNCTION.md | `d3ca6fbd54a1b286efeed9f80187dfb09217ff06fe0836bf69e071fad4908669` |
| sql-manual/sql-statements/function/DESC-FUNCTION | docs/sql-manual/sql-statements/function/DESC-FUNCTION.md | `277c4be4eca4534de7a794dd11ac469c6ac2c968d0306e9a43e76a3688084237` |
| sql-manual/sql-statements/function/SHOW-FUNCTIONS | docs/sql-manual/sql-statements/function/SHOW-FUNCTIONS.md | `0e9ddd0122075be6b07adb585fe2c1240fad2d0f42a4fd0fd3f6d4e8dfe2f5cd` |
| sql-manual/sql-statements/statistics/ANALYZE | docs/sql-manual/sql-statements/statistics/ANALYZE.md | `233686534cd61bbe507cc4c8f65d3027f8bb8093f3821ad52c0dc0a23343d8fe` |
| sql-manual/sql-statements/statistics/ALTER-STATS | docs/sql-manual/sql-statements/statistics/ALTER-STATS.md | `1cbed2ffee04f9de2c7081cbc3f3571c81d7a4579bbbc70d5953912600cadb04` |
| sql-manual/sql-statements/statistics/DROP-STATS | docs/sql-manual/sql-statements/statistics/DROP-STATS.md | `0f82b90082ee7d82543ab2dd83661c263351b32a94812c55a0f24e3a11e3cf11` |
| sql-manual/sql-statements/statistics/SHOW-TABLE-STATS | docs/sql-manual/sql-statements/statistics/SHOW-TABLE-STATS.md | `42e4c200b65db95f0380a444fb596edebfdbf8834f51b239baf89311556d8e1a` |
| sql-manual/sql-statements/statistics/SHOW-STATS | docs/sql-manual/sql-statements/statistics/SHOW-STATS.md | `fe2c108577a747f8952a05197b64e25dedc18fb78a17de3faeb6558951dba8d4` |
| sql-manual/sql-statements/statistics/DROP-ANALYZE-JOB | docs/sql-manual/sql-statements/statistics/DROP-ANALYZE-JOB.md | `616b566dfd1b7fdabe1a0c1d1f5ccb4156866a8d658ec1e1d74fe1a395a1efb1` |
| sql-manual/sql-statements/statistics/KILL-ANALYZE-JOB | docs/sql-manual/sql-statements/statistics/KILL-ANALYZE-JOB.md | `722ad8feffd110c2bb95fd043c039bfb0be6626ab678871ab882ba47ad4a4e24` |
| sql-manual/sql-statements/statistics/SHOW-ANALYZE | docs/sql-manual/sql-statements/statistics/SHOW-ANALYZE.md | `d9dc75c118889f055812f504778994c93bf6f0551effd4bce666973b63e6c5b5` |
| sql-manual/sql-statements/cluster-management/instance-management/ADD-FOLLOWER | docs/sql-manual/sql-statements/cluster-management/instance-management/ADD-FOLLOWER.md | `2300e0b173869de08acb9b46450f8ecaa13ab5df8ba9bfafccc3feac811203cc` |
| sql-manual/sql-statements/cluster-management/instance-management/DROP-FOLLOWER | docs/sql-manual/sql-statements/cluster-management/instance-management/DROP-FOLLOWER.md | `21f3c6adde7a8c6f9de91f4c35b345999fe4184f2454c1798c7583eae130c6ce` |
| sql-manual/sql-statements/cluster-management/instance-management/ADD-OBSERVER | docs/sql-manual/sql-statements/cluster-management/instance-management/ADD-OBSERVER.md | `560ec912cfaf078dea2824996b2ea49d3d69a50526d62f23c57122df917f9b1e` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-076

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 117.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/cluster-management/instance-management/DROP-OBSERVER | docs/sql-manual/sql-statements/cluster-management/instance-management/DROP-OBSERVER.md | `856573d1eeeafee38c75a38964991ea4a1249bb400af63a1c64429924d83e8a0` |
| sql-manual/sql-statements/cluster-management/instance-management/SET-FRONTEND-CONFIG | docs/sql-manual/sql-statements/cluster-management/instance-management/SET-FRONTEND-CONFIG.md | `22531121d0410c34dc2de5bc9fcd72faaf468d820b21d02d5dd2cb50d085f6df` |
| sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG | docs/sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG.md | `2752e47d15491c720bc577e5a3f3f9acd9541692765bc9e26a198b051a86fcff` |
| sql-manual/sql-statements/cluster-management/instance-management/MODIFY-FRONTEND-HOSTNAME | docs/sql-manual/sql-statements/cluster-management/instance-management/MODIFY-FRONTEND-HOSTNAME.md | `ccfad8fdb9fdd4d69047dde221d300e81bac8f990e521c904afb4bd169a6e42e` |
| sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTENDS | docs/sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTENDS.md | `f86da97d5d1811f540ee3abfaca18fa158beea668a9a1f0926fb5a78b90d764f` |
| sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTENDS-DISKS | docs/sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTENDS-DISKS.md | `c0e2db4a21c57821ed1c82c8f7e5a5f069b6a61478dfef4b578c71808a1d430f` |
| sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND | docs/sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND.md | `342e237a86df2f9c7306fad685cc37b405940a6fdbae0256429a7727affb774f` |
| sql-manual/sql-statements/cluster-management/instance-management/DROP-BACKEND | docs/sql-manual/sql-statements/cluster-management/instance-management/DROP-BACKEND.md | `526c9244e2b3bc1a8d828b7776c69109f81690d7a0b289365bdfd1715342de82` |
| sql-manual/sql-statements/cluster-management/instance-management/MODIFY-BACKEND | docs/sql-manual/sql-statements/cluster-management/instance-management/MODIFY-BACKEND.md | `0739c1625bcb2004aab14fa63341b1b2217d3713435af07fed93d1acec7336d1` |
| sql-manual/sql-statements/cluster-management/instance-management/SHOW-BACKENDS | docs/sql-manual/sql-statements/cluster-management/instance-management/SHOW-BACKENDS.md | `7ccfdce12171f9d8e691f69e3ff67ecab26abd7ef9c95c366f4acdf004b868db` |
| sql-manual/sql-statements/cluster-management/instance-management/SHOW-BACKEND-CONFIG | docs/sql-manual/sql-statements/cluster-management/instance-management/SHOW-BACKEND-CONFIG.md | `83818a9fc9884d3cdc108860973179aa47e8e112332bf095075e2bf11dcf9ff2` |
| sql-manual/sql-statements/cluster-management/instance-management/DECOMMISSION-BACKEND | docs/sql-manual/sql-statements/cluster-management/instance-management/DECOMMISSION-BACKEND.md | `257bda4eae6b40a8209e606e966f8d646fc0acbef1a3502a26a0cac079471bf6` |
| sql-manual/sql-statements/cluster-management/instance-management/CANCEL-DECOMMISSION-BACKEND | docs/sql-manual/sql-statements/cluster-management/instance-management/CANCEL-DECOMMISSION-BACKEND.md | `58eb8bef85f5a557819f4510579e96163354f374895596f50a5a53a4b9a54954` |
| sql-manual/sql-statements/cluster-management/instance-management/ADD-BROKER | docs/sql-manual/sql-statements/cluster-management/instance-management/ADD-BROKER.md | `bc7208ed4f9f7ca75b45fc5fe1f3cded2c0493062294506504876dd0fe06a750` |
| sql-manual/sql-statements/cluster-management/instance-management/DROP-BROKER | docs/sql-manual/sql-statements/cluster-management/instance-management/DROP-BROKER.md | `13de315e41016fdf74b6e6d3b353c6460ef782a8ea04076fdf5fcae8710dd57a` |
| sql-manual/sql-statements/cluster-management/instance-management/SHOW-BROKER | docs/sql-manual/sql-statements/cluster-management/instance-management/SHOW-BROKER.md | `a11cc054c2cba7ecd1ff0553e9cb8c05b277016dcd4b23c3cfb80079071c930a` |
| sql-manual/sql-statements/cluster-management/compute-management/CREATE-RESOURCE | docs/sql-manual/sql-statements/cluster-management/compute-management/CREATE-RESOURCE.md | `b033c4164bb1e14f14fca86c4ee72fbf27dcbe3c8fb26e1d1e6ad4bdb623312e` |
| sql-manual/sql-statements/cluster-management/compute-management/ALTER-RESOURCE | docs/sql-manual/sql-statements/cluster-management/compute-management/ALTER-RESOURCE.md | `5734be5af146436dca0457e25274d8ad05f5e88b62f3bec14c2fbd5c3320c3bd` |
| sql-manual/sql-statements/cluster-management/compute-management/DROP-RESOURCE | docs/sql-manual/sql-statements/cluster-management/compute-management/DROP-RESOURCE.md | `e445233678d794905d2ec2e8bd13e16ea1809053c27b2f773f0741b6436905f4` |
| sql-manual/sql-statements/cluster-management/compute-management/SHOW-RESOURCES | docs/sql-manual/sql-statements/cluster-management/compute-management/SHOW-RESOURCES.md | `5dc23ff52fe2dc3f83dbb710fd8ed587f156f7484114b52ac152ebc8dc024207` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-077

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 97.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-GROUP | docs/sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-GROUP.md | `032b7914f488c5f9ee2d14ba84a472c090cfbe88555fb9ac30aa03ae6956215e` |
| sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-GROUP | docs/sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-GROUP.md | `500d23650c686d2a0cf227889f916f28b93cbdb1c70efe66156d9bea5c420459` |
| sql-manual/sql-statements/cluster-management/compute-management/DROP-WORKLOAD-GROUP | docs/sql-manual/sql-statements/cluster-management/compute-management/DROP-WORKLOAD-GROUP.md | `5a517162f0aa143c850a248822f085e57ecb4834b890bb184498771c08659bab` |
| sql-manual/sql-statements/cluster-management/compute-management/SHOW-WORKLOAD-GROUPS | docs/sql-manual/sql-statements/cluster-management/compute-management/SHOW-WORKLOAD-GROUPS.md | `45101971735896edce99f0195ac7a24fd33a305048121148dbe9b6765a1a0490` |
| sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-POLICY | docs/sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-POLICY.md | `290dcba0952bf516d8003596dad3bd80cc01f357f822ce163e55c59175c16c5e` |
| sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-POLICY | docs/sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-POLICY.md | `1f437bd64af128c74a5ee9392ac43fade5270e94f4a302215b4f480a77191406` |
| sql-manual/sql-statements/cluster-management/compute-management/DROP-WORKLOAD-POLICY | docs/sql-manual/sql-statements/cluster-management/compute-management/DROP-WORKLOAD-POLICY.md | `f33c83cfe328335951f509d3374cf492d242d9b8bfe36848a69b57de484267b3` |
| sql-manual/sql-statements/cluster-management/compute-management/SHOW-COMPUTE-GROUPS | docs/sql-manual/sql-statements/cluster-management/compute-management/SHOW-COMPUTE-GROUPS.md | `2ea7aa3e640337d59b0e932b5a926cc63140bb605bf1deaeeaadeadfe227b48a` |
| sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT | docs/sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT.md | `c32be7cdea3c5906280001ba1f50457cf147894354d6759022d0c884e84365c8` |
| sql-manual/sql-statements/cluster-management/storage-management/ALTER-STORAGE-VAULT | docs/sql-manual/sql-statements/cluster-management/storage-management/ALTER-STORAGE-VAULT.md | `5d8f7bbb4010b3ef582716225ffa414aa2ff71d3fbf500f4776429c23d29c933` |
| sql-manual/sql-statements/cluster-management/storage-management/SET-DEFAULT-STORAGE-VAULT | docs/sql-manual/sql-statements/cluster-management/storage-management/SET-DEFAULT-STORAGE-VAULT.md | `9ee2d588ee460f959389c4e72e643e7ea3a94de69fc055a807bdaee48bca1544` |
| sql-manual/sql-statements/cluster-management/storage-management/UNSET-DEFAULT-STORAGE-VAULT | docs/sql-manual/sql-statements/cluster-management/storage-management/UNSET-DEFAULT-STORAGE-VAULT.md | `8009913461d8d4277f32fa7258831cbf721899a961f0963bc4a67f8a1803dade` |
| sql-manual/sql-statements/cluster-management/storage-management/SHOW-STORAGE-VAULTS | docs/sql-manual/sql-statements/cluster-management/storage-management/SHOW-STORAGE-VAULTS.md | `13a09cde36746891099a2009fb1baad10b751b5148786544c33ac41d7741cb47` |
| sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-POLICY | docs/sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-POLICY.md | `7b8699a0bf715bfbdf068523aadc654bc7c1f580b74d050c72a4614601c311cb` |
| sql-manual/sql-statements/cluster-management/storage-management/ALTER-STORAGE-POLICY | docs/sql-manual/sql-statements/cluster-management/storage-management/ALTER-STORAGE-POLICY.md | `f236897614d1d9eab7b942dd26c1e0ed23abd50fd6d8fa463209dc5fdb7628c8` |
| sql-manual/sql-statements/cluster-management/storage-management/DROP-STORAGE-POLICY | docs/sql-manual/sql-statements/cluster-management/storage-management/DROP-STORAGE-POLICY.md | `a1e4a00c680970e6b15a09a91d984dda9db6be7d13461e768f693d2c21bbce3d` |
| sql-manual/sql-statements/cluster-management/storage-management/SHOW-STORAGE-POLICY | docs/sql-manual/sql-statements/cluster-management/storage-management/SHOW-STORAGE-POLICY.md | `cb6b525e4f6e11c0e8e93ab7f74fe8fa489dcf153cc43a7a9f464eae3df0577b` |
| sql-manual/sql-statements/cluster-management/storage-management/WARM-UP | docs/sql-manual/sql-statements/cluster-management/storage-management/WARM-UP.md | `6f2f5999a08e8df547ddf5952874e964db39edcafebd0787daf10eb847e7b5f9` |
| sql-manual/sql-statements/cluster-management/storage-management/CANCEL-WARM-UP | docs/sql-manual/sql-statements/cluster-management/storage-management/CANCEL-WARM-UP.md | `127048c3fcd2244a9cd1ae67b7d673f84516ea09a1bf8d4de3fe94d9b3c1cb13` |
| sql-manual/sql-statements/cluster-management/storage-management/SHOW-WARM-UP-JOB | docs/sql-manual/sql-statements/cluster-management/storage-management/SHOW-WARM-UP-JOB.md | `b084ffc5491352129af2194fa94672f83e3feee01cbd3e99eed2c776a2dc13e3` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-078

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 77.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/cluster-management/storage-management/SHOW-CACHE-HOTSPOT | docs/sql-manual/sql-statements/cluster-management/storage-management/SHOW-CACHE-HOTSPOT.md | `432130a2145bb0df3314fc4840082a4e7bac1928fa6d0ebca7752ff3c188cbb6` |
| sql-manual/sql-statements/security/CREATE-FILE | docs/sql-manual/sql-statements/security/CREATE-FILE.md | `60b695564c048cd515ad0d6c07a5b31bf9d6de7b44d7fd1b9ff16092bf90722c` |
| sql-manual/sql-statements/security/DROP-FILE | docs/sql-manual/sql-statements/security/DROP-FILE.md | `d5f09efad67fb11e9e7a0c58c51c1b833ab8bcb73579596f4da97c6723c45641` |
| sql-manual/sql-statements/security/SHOW-FILE | docs/sql-manual/sql-statements/security/SHOW-FILE.md | `5d208abc06e59cc4c0c64867d63557f1355434333711dab868b7660485f0e261` |
| sql-manual/sql-statements/security/CREATE-ENCRYPTKEY | docs/sql-manual/sql-statements/security/CREATE-ENCRYPTKEY.md | `0437e78e5a680dbbb0252b6bc9e9b26b2d27f5fafebf1ca2c9f021730a3fbe92` |
| sql-manual/sql-statements/security/DROP-ENCRYPTKEY | docs/sql-manual/sql-statements/security/DROP-ENCRYPTKEY.md | `bbf941629b886f44ab32b61795694f0e1ccdcaf97b1fc4e22e53c04328e2f07d` |
| sql-manual/sql-statements/security/SHOW-ENCRYPTKEY | docs/sql-manual/sql-statements/security/SHOW-ENCRYPTKEY.md | `2365dd65665f0232b867063dab9838d4ac5533d077df0c6e386008996609641a` |
| sql-manual/sql-statements/data-governance/CREATE-SQL_BLOCK_RULE | docs/sql-manual/sql-statements/data-governance/CREATE-SQL_BLOCK_RULE.md | `1d3ffa52f6a05e7e1e04e34f6397ec7bac78593de884afb628cb3737bebb6323` |
| sql-manual/sql-statements/data-governance/ALTER-SQL_BLOCK_RULE | docs/sql-manual/sql-statements/data-governance/ALTER-SQL_BLOCK_RULE.md | `edc6957b50f7b28e1f087ec7750fde5a8eee67b5d9cd7e3c396073ca34bbba4b` |
| sql-manual/sql-statements/data-governance/DROP-SQL_BLOCK_RULE | docs/sql-manual/sql-statements/data-governance/DROP-SQL_BLOCK_RULE.md | `a5bbee11987e8f622096af7460b6b4b83ddd907aa04cb70b28f8a34d31b27076` |
| sql-manual/sql-statements/data-governance/SHOW-SQL_BLOCK_RULE | docs/sql-manual/sql-statements/data-governance/SHOW-SQL_BLOCK_RULE.md | `e0a5fcfa2b1dce11fc5f52a7e44230f33e80aebc608cf6e0a7f7caba128c77a5` |
| sql-manual/sql-statements/data-governance/CREATE-ROW-POLICY | docs/sql-manual/sql-statements/data-governance/CREATE-ROW-POLICY.md | `f1011b64b599bcf558592343325e454fb18225522a0076a24558643b234c01f0` |
| sql-manual/sql-statements/data-governance/DROP-ROW-POLICY | docs/sql-manual/sql-statements/data-governance/DROP-ROW-POLICY.md | `584a2047ab8f22477015532bfee3cc2b5ec10efd741f1f5d3321447a2a4eb5c2` |
| sql-manual/sql-statements/data-governance/SHOW-ROW-POLICY | docs/sql-manual/sql-statements/data-governance/SHOW-ROW-POLICY.md | `a5023cb7c6a6f8366efd16be8ce95a3070a01e5dbcdae306d408dff9f94fbff5` |
| sql-manual/sql-statements/job/CREATE-JOB | docs/sql-manual/sql-statements/job/CREATE-JOB.md | `dca80109fd31c0888b4353fada4dc7832a1fe20b331b5f5ce0df2f69a1c4b7e1` |
| sql-manual/sql-statements/job/CREATE-STREAMING-JOB | docs/sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md | `a17ae96ee1bf2ff7c5e4f1f5cd4ab8812e36c1c48ab0716a4b60d0cbeaa04d2e` |
| sql-manual/sql-statements/job/ALTER-JOB | docs/sql-manual/sql-statements/job/ALTER-JOB.md | `1858982063830e2a004306697bb77d29d1a6596ee3fb3034f9f2f7f54362ca9e` |
| sql-manual/sql-statements/job/PAUSE-JOB | docs/sql-manual/sql-statements/job/PAUSE-JOB.md | `471c11f532a20d7ea79363ba54e00609d9f2b3e5534984daade9eb16ae408cc5` |
| sql-manual/sql-statements/job/DROP-JOB | docs/sql-manual/sql-statements/job/DROP-JOB.md | `34c6f5b9d3bdce8d6164e33586896a4e4af7443ed1b7d33762f91ee6fd6215f0` |
| sql-manual/sql-statements/job/RESUME-JOB | docs/sql-manual/sql-statements/job/RESUME-JOB.md | `7d96aefe7fa972cbcab2f297e131e25a01f49ca852c581d7df8cc5ef84d892e9` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-079

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 57.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/job/CANCEL-TASK | docs/sql-manual/sql-statements/job/CANCEL-TASK.md | `e4c644c1af39f5839807a59d7996874a30e1fe04a7429ed8bd6d3a77c07f9745` |
| sql-manual/sql-statements/plugin/INSTALL-PLUGIN | docs/sql-manual/sql-statements/plugin/INSTALL-PLUGIN.md | `84855047348dbd1b95210c4aa804f024cf26735642eabac4d0196b9db5919bee` |
| sql-manual/sql-statements/plugin/UNINSTALL-PLUGIN | docs/sql-manual/sql-statements/plugin/UNINSTALL-PLUGIN.md | `c0a143bc935517d8a92728e11a10c52dc6ae9aaca549f1cd4f7a5a488e95262b` |
| sql-manual/sql-statements/plugin/SHOW-PLUGINS | docs/sql-manual/sql-statements/plugin/SHOW-PLUGINS.md | `535fc76eeae6cc4e9a7d2c633ad51de173c0c32c8ec659c6e71d561678076b5f` |
| sql-manual/sql-statements/character-set/SHOW-COLLATION | docs/sql-manual/sql-statements/character-set/SHOW-COLLATION.md | `6ff5e38868dcca9d89b3cab93294b9a91b8f246c4da158fb938d2dcc6681cba7` |
| sql-manual/sql-statements/character-set/SHOW-CHARSET | docs/sql-manual/sql-statements/character-set/SHOW-CHARSET.md | `f01b6aa6d1f29d4b9e1450b2529520e72dd2c28d804c6fdc4d738b922653a3c2` |
| sql-manual/sql-statements/types/SHOW-DATA-TYPES | docs/sql-manual/sql-statements/types/SHOW-DATA-TYPES.md | `63500ada1e3bf5ad8f56e035402f6bb6190a0c648c551ae8eeb2408e139c0ea0` |
| sql-manual/sql-statements/types/SHOW-TYPECAST | docs/sql-manual/sql-statements/types/SHOW-TYPECAST.md | `2733d55bbabd4b83d626b1bdc3bc3558d96fd08e27f76d00ce98a469e7089244` |
| sql-manual/sql-statements/system-info-and-help/SHOW-PROC | docs/sql-manual/sql-statements/system-info-and-help/SHOW-PROC.md | `eb641fb9d728ac73583282382e0673a2b2d6e5596201844bf0e40bfe228ac7e5` |
| admin-manual/auth/authentication-and-authorization | docs/admin-manual/auth/authentication-and-authorization.md | `36e82c03adf6fc59eee707f71d8196390889a7c741b7d6e9f06d56c605b52f34` |
| admin-manual/system-tables/information_schema/backend_metrics | docs/admin-manual/system-tables/information_schema/backend_metrics.md | `a408f8aed14c003f570b3d2ff3426d8f4ac50b317040d3169e5f8260162b8c41` |
| admin-manual/system-tables/information_schema/frontend_metrics | docs/admin-manual/system-tables/information_schema/frontend_metrics.md | `927c2528b083b54345320d865759d84fa515ce13c04b3f5cfce3515848413966` |
| data-operate/overview | docs/data-operate/overview.mdx | `ab77b65606715fb4ff8fe2a28fd15a4a9ee23cc34de1b20972bd195d44add338` |
| data-operate/update/unique-update | docs/data-operate/update/unique-update.md | `cd1a28fa1bc01c7faf0cd5c716eb4b5375901528a08d74a02b3d9f059fa721ac` |
| features-architecture/versioning | docs/features-architecture/versioning.md | `556c92b1bcfbcc58d1cc81cdcdef3987f5cfc9d13c096aa10fea7df557f246ae` |
| key-features/analytic-functions | docs/key-features/analytic-functions.mdx | `2f7ad400e06c8f2653cc59afe3f95b73ac7c254c9232d3e5667a08b57d09ffa8` |
| key-features/batch-load | docs/key-features/batch-load.mdx | `4df549d984ae39a2ead1f79a197edaa14e115ff8e82b31c408c5f0af74e91883` |
| key-features/binlog-table-stream | docs/key-features/binlog-table-stream.mdx | `356bc83db9d7493df3a685acc7e3abda565764fd25d27fb502355eea3b5b6adf` |
| key-features/bm25 | docs/key-features/bm25.mdx | `c767dea43ef41ff4a582dc8a9a6a2b691812d54feee6b8854cc6731fabe08487` |
| key-features/catalog-integrations | docs/key-features/catalog-integrations.mdx | `90a42dc24853f80d59a3774569b882b737982e8bbf07bf5c031fdc989136e84e` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-080

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 37.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| key-features/columnar-storage | docs/key-features/columnar-storage.mdx | `be9b301dc2106c6722d08b0b52cc0c55482f68d0330da4093cc2fad323fabb5b` |
| key-features/compute-group | docs/key-features/compute-group.mdx | `ad3936df194dc496cb4a505e8980836b5cf2586715debf46d949364770bfa1af` |
| key-features/condition-cache | docs/key-features/condition-cache.mdx | `97196341b35ad004d6a5f000363e4565de57d38600c832e58523e9fcbe24ff54` |
| key-features/data-cache-page-cache | docs/key-features/data-cache-page-cache.mdx | `0fef2c7d90e18062053be7194bcb6e826184003309f55f3001729db9823ee596` |
| key-features/data-compaction | docs/key-features/data-compaction.mdx | `26b555a3006571847c66550e2677ddea60053a3a5555dc042856993dfeae95a6` |
| key-features/data-lineage | docs/key-features/data-lineage.mdx | `8fd437ac1c233f79c1affbd9b169809881f107264a7ec0ce8be37a3cd4cd0d2c` |
| key-features/data-model | docs/key-features/data-model.mdx | `2ff3b4cf58a821fded3a6272d359bd3d27af7ec29979c20289875fb15d4cad4c` |
| key-features/data-pruning | docs/key-features/data-pruning.mdx | `c6bb00499fd6a1ff9a28cf3756f55f22f85d25aebdff2e6c8b19314d87c1ee74` |
| key-features/data-update-delete | docs/key-features/data-update-delete.mdx | `7afc3aa9b3f0aea213dc376223b53952733cc6db2342a2a9d86fb9e0df83caf5` |
| key-features/embedding | docs/key-features/embedding.mdx | `d8f115ca21c0970891cf97090614c9ad262326457583455f9767c2eae0405f1e` |
| key-features/full-text-search | docs/key-features/full-text-search.mdx | `4daf9ebbda94fc09599eece02ef0d280cf147ee5fc598a4e774c75adc6e18d2e` |
| key-features/group-commit | docs/key-features/group-commit.mdx | `f698bcd7814f8c86ed209953dcada377c7686192ae627366c1eabfce782e9065` |
| key-features/high-concurrency-point-query | docs/key-features/high-concurrency-point-query.mdx | `f27485d05bbbbab58808dd27da93f459eb13732ee62f2b835a655da801db7f19` |
| key-features/hybrid-search | docs/key-features/hybrid-search.mdx | `5770d9c7abdd25e58f09b37cbd471c5a4b3419761ac9d06a78b7f3c959995b34` |
| key-features/iceberg | docs/key-features/iceberg.mdx | `d95c7a10897df6ce6f2e51246eeedf21a5e54c0a923d5a4d9cb2624c7d9329c1` |
| key-features/incremental-materialized-view | docs/key-features/incremental-materialized-view.mdx | `c4954023b15bd05420a5026e798618c118ecf2fab60bb6719f33ebfbd72338e8` |
| key-features/inverted-index | docs/key-features/inverted-index.mdx | `28c2335cb0af8475a3b504826048b2aed9e79a48163385b92eef68115605a62a` |
| key-features/kafka-cdc-integration | docs/key-features/kafka-cdc-integration.mdx | `069040d369e31122d3f64af3d83bd5241c1ebdf55dd13623131c42446b93e145` |
| key-features/llm-sql-functions | docs/key-features/llm-sql-functions.mdx | `93fb4073dab77e5c4073de47ad82c9cc5ed786d54066628e1f889bb8c2bbf469` |
| key-features/load-transaction | docs/key-features/load-transaction.mdx | `7b5601c86d1ce2a2bfc3c2290bc2854fc642599a92c4101c161a5d5628e41d26` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-081

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in DEV after this batch: 17.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| key-features/managing-lake-table | docs/key-features/managing-lake-table.mdx | `e6c89d385b6b29afec0828343f8d0fabb388e7a532429d2edf31571bf9d0161e` |
| key-features/mcp-server | docs/key-features/mcp-server.mdx | `446ff073a98f3d7873226869bafdbb5bb54fc11294c014333fdd015f5e9cb91f` |
| key-features/metadata-cache | docs/key-features/metadata-cache.mdx | `89e067434a360fead54a0a220eed56e45976f9099e8468eb59eff5eeeda55511` |
| key-features/mpp | docs/key-features/mpp.mdx | `3f5eeae988337df2f11dec0eaf43790a8634d470c4ee7a5a0af50710a6893980` |
| key-features/multi-catalog | docs/key-features/multi-catalog.mdx | `918853b9add6586228bbfc8fa1e504c581f78eafe93d5d08785f9ba93b03e1de` |
| key-features/parquet-reader-optimization | docs/key-features/parquet-reader-optimization.mdx | `0ed0057c0e1d007529971cbe9bf2023e0d9e10fbb1d759fc1c54b6ec013ca3af` |
| key-features/partitioning-and-bucketing | docs/key-features/partitioning-and-bucketing.mdx | `dd14dc780abfedbdcf4453a3a045e95b091fdeed5097e21216fd2eefe4c78667` |
| key-features/pipeline-execution-engine | docs/key-features/pipeline-execution-engine.mdx | `f74dd5ded6b023c9afe48ef694bb2d56adb0e7733e651dd10472c40d291ab6ea` |
| key-features/pluggable-auth | docs/key-features/pluggable-auth.mdx | `ccfc5e2a156ae8fb3b74ae3eb6d5a1df0a4ba04dc28bc11856dd794b919c49fb` |
| key-features/preaggregation-and-rollup | docs/key-features/preaggregation-and-rollup.mdx | `e2e100e6c25aed1b21c17447ee129cd727fe656570fde0c65b009195ceae94cd` |
| key-features/prepared-statement | docs/key-features/prepared-statement.mdx | `fdc267dba9012490934edcf0689928200d0cedd68a99e0cb9b303c72551cbef7` |
| key-features/query-cache | docs/key-features/query-cache.mdx | `ea916fb4bc8238c9917b52d3da9d78ba540bdef28dd49ab018d9415692ef7b7a` |
| key-features/reciprocal-rank-fusion | docs/key-features/reciprocal-rank-fusion.mdx | `0a30652b953d5c2fb2c9a45251bfed8bfd659f1b39fb845ca4b09eac6344ad04` |
| key-features/resource-group | docs/key-features/resource-group.mdx | `126b2a35dee41106cb753447df028859631cab7d74e200d88bbdda52dd7ed8c2` |
| key-features/spill-to-disk | docs/key-features/spill-to-disk.mdx | `242b51f77f4ad0a3e85cac18549d43acde925037131e8e2c76c845630f5162bd` |
| key-features/stream-load | docs/key-features/stream-load.mdx | `3aff2bc07fa1adfc6c04036675b4bd238e6ed37a19e38df4661506583e0855cf` |
| key-features/unique-key | docs/key-features/unique-key.mdx | `9489b879a8824c4d7c5d7481094a062697ea289a8ba7b6b8c260a907fded1cf8` |
| key-features/variant-data-type | docs/key-features/variant-data-type.mdx | `5ea74cb0b91b395a3ce76c72efe0c6e4062c1097c2b3bf0aa70a90256300b288` |
| key-features/vector-index | docs/key-features/vector-index.mdx | `83476c8dadae2e1aafa55234c71001a95c34660d562df8866cc3af9d770616ca` |
| key-features/vectorized-execution | docs/key-features/vectorized-execution.mdx | `ca3716ec1d89b1f801a2d2ea49574b798512ff43c5ec25762e4d76be9c163de0` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-DEV-082

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 17. Remaining in DEV after this batch: 0.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| key-features/vertical-compaction | docs/key-features/vertical-compaction.mdx | `a22ecc28cf117b68572242dd5513fc9dc57afa525fb983fa633d895c1a2ab5c1` |
| key-features/workload-group | docs/key-features/workload-group.mdx | `bfea58d76f4aadd0610c9581d17d776b2e0fd167b5a14a3e3713bc43b01857be` |
| query-acceleration/hints/distribute-hint | docs/query-acceleration/hints/distribute-hint.md | `b01667f200e7b585d844941169622f45b8d816a07b41227a5d72d4c9d0d23532` |
| query-acceleration/hints/leading-hint | docs/query-acceleration/hints/leading-hint.md | `f96fc4d71ac53793f0bf27eca12d58e9eb96cd392106c6f459cf360aa13e78ea` |
| query-acceleration/query-cache | docs/query-acceleration/query-cache.md | `cd06d32f0e43f9d06e8a648ed1100707e3ebd70f33f415714aeb27150962c321` |
| query-acceleration/tuning/parallelism-tuning | docs/query-acceleration/tuning/parallelism-tuning.md | `7788799695134ca5ccb89487f83fe7254c129641401a8f7e248cecff81f8087a` |
| sql-manual/sql-functions/ai-functions/distance-functions/inner-product-approximate | docs/sql-manual/sql-functions/ai-functions/distance-functions/inner-product-approximate.md | `ea4f96217d104cdf9d724ff8e6650dc6e73bfdcbc01842cb4866855a126c803b` |
| sql-manual/sql-functions/ai-functions/distance-functions/l2-distance-approximate | docs/sql-manual/sql-functions/ai-functions/distance-functions/l2-distance-approximate.md | `639bcebe1324b51c839b0008c6d3629c108a6a150e0f54dd7ecdbeb93d58da5e` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/quarter-ceil | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/quarter-ceil.md | `a81318d3636c75c6c79e3a7369d76639d69816e5e210c46e155f3569505aac95` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/quarter-floor | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/quarter-floor.md | `1cff31dfc8e325c44027adc677417ac5b743c49ed232b2fd6d27b8adca8244fd` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/quarters-diff | docs/sql-manual/sql-functions/scalar-functions/date-time-functions/quarters-diff.md | `8928bdd7c5430c581ccd94d416934eb0ca9a6c526ae4b46ab88b0dfa6d69f508` |
| sql-manual/sql-functions/scalar-functions/quantile-functions/quantile-state-from-base64 | docs/sql-manual/sql-functions/scalar-functions/quantile-functions/quantile-state-from-base64.md | `0eaeab30f034b24ce478311e937d24bb3f5246ca5eccb239e1dbc2c552082042` |
| sql-manual/sql-functions/scalar-functions/quantile-functions/quantile-state-to-base64 | docs/sql-manual/sql-functions/scalar-functions/quantile-functions/quantile-state-to-base64.md | `c43f2879195fbbbbd347e74126eda4b71ebafff8e19c7dd7799eff06e8074ebc` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-geometries | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-geometries.md | `a79d980bc7e5ca7f4a8225518dc600e7a7c46d7710025806adb131a596927903` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-numgeometries | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-numgeometries.md | `b579fd6c766361272d5cd54e5efc7f1e3fb068e4e741a0dda0f1bf52857ab20d` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-numpoints | docs/sql-manual/sql-functions/scalar-functions/spatial-functions/st-numpoints.md | `257c56596e0dc1180a8da66b6f818661f35820022864b67f5069fc345dbaf500` |
| sql-manual/sql-functions/scalar-functions/string-functions/hamming_distance | docs/sql-manual/sql-functions/scalar-functions/string-functions/hamming_distance.md | `fd67a20fa052b6048f8f1cecf44f8e85c3d337b83d7cfe033901298c85686138` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-001

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1575.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| getting-started/intro | versioned_docs/version-4.x/getting-started/intro.mdx | `5c870a2583db46c203dcd610b575d3888bf2ba442e41a58a8acb7177d9db4abe` |
| getting-started/quick-start | versioned_docs/version-4.x/getting-started/quick-start.mdx | `c1f1c82c39f02f2368e4f214b72a7be258983de46fcb04615078a1dd8d35a60b` |
| getting-started/before-you-start-the-poc | versioned_docs/version-4.x/getting-started/before-you-start-the-poc.md | `e717192eda8e5ae3eee2bd55c779fe74a854223daed3821541e2dc94d8611d36` |
| features-architecture/intro | versioned_docs/version-4.x/features-architecture/intro.mdx | `9cbb22571e0ccf8dbe9d59eb1026785bae2c3e77cb85085506ae7a1a69814c2a` |
| features-architecture/system-architecture | versioned_docs/version-4.x/features-architecture/system-architecture.md | `c9fa2e126f1410ed74133eef9d43e164a2c7ee19a4501204dbebe070e0023c46` |
| features-architecture/product-concepts | versioned_docs/version-4.x/features-architecture/product-concepts.md | `ee18de809dc6f273c127439c5a7e6ca77e51fec9b1b9a61c4a0c66f97f676305` |
| install/intro | versioned_docs/version-4.x/install/intro.mdx | `94cf9e5ac5dfa295b24073bf9111a052c5b5f7b20409fd905622ddaa279f99e8` |
| install/choosing-deployment-mode | versioned_docs/version-4.x/install/choosing-deployment-mode.md | `5ee2a41996bd2bdc24951d57f1c7ca9ae51c0f429e4c775fc53ba255ab2aef4e` |
| install/preparation/env-checking | versioned_docs/version-4.x/install/preparation/env-checking.md | `4e8bf0b7821d5579f66027b6a1993c369c00cce660eddef8353c4fc789746329` |
| install/preparation/cluster-planning | versioned_docs/version-4.x/install/preparation/cluster-planning.md | `98cc6623a4232da72425eefe614f4fa16cee18d420e8681ae5133f821856004a` |
| install/preparation/os-checking | versioned_docs/version-4.x/install/preparation/os-checking.md | `9fca792023c144bedbfba0cf91d1c802c0ae34a02180657d9807f6336d0f8493` |
| install/deploy-manually/intro | versioned_docs/version-4.x/install/deploy-manually/intro.mdx | `bc44fa25459baa31abb32da893fbdd3333827925746514c597c67485bf07d65b` |
| install/deploy-manually/integrated-storage-compute-deploy-manually | versioned_docs/version-4.x/install/deploy-manually/integrated-storage-compute-deploy-manually.md | `249905350a4e4b80ef3f85a974222867979aadf8abf2618dadc4cb185c4fc377` |
| install/deploy-manually/separating-storage-compute-deploy-manually | versioned_docs/version-4.x/install/deploy-manually/separating-storage-compute-deploy-manually.md | `c6aa94409756fa57e2cfbad37f1d3dffa1f8d35893672ab96276c51071e6734b` |
| install/deploy-on-kubernetes/intro | versioned_docs/version-4.x/install/deploy-on-kubernetes/intro.mdx | `981dc82e6bc7d141bd3021d323996f804ad46260680e13c23565b5bce65b86fa` |
| install/deploy-on-kubernetes/doris-operator/intro | versioned_docs/version-4.x/install/deploy-on-kubernetes/doris-operator/intro.mdx | `67ee131943040669472126c9c0a281e477039b0b1b00270ca64de21e67b325e3` |
| install/deploy-on-kubernetes/doris-operator/doris-operator-overview | versioned_docs/version-4.x/install/deploy-on-kubernetes/doris-operator/doris-operator-overview.md | `6d5d9a2899036320c33448e453b7776b7587affbf1ef82b6f22f13c96fcccd7c` |
| install/deploy-on-kubernetes/doris-operator/architecture | versioned_docs/version-4.x/install/deploy-on-kubernetes/doris-operator/architecture.md | `9148843b2ba08a27887d6877061b1fb5356968f92468706902e7d5f314523486` |
| install/deploy-on-kubernetes/doris-operator/resource-model | versioned_docs/version-4.x/install/deploy-on-kubernetes/doris-operator/resource-model.md | `ed592b339af755e2bed976e389440d9e8c31c7b24f1b65769905707bee96571c` |
| install/deploy-on-kubernetes/doris-operator/lifecycle | versioned_docs/version-4.x/install/deploy-on-kubernetes/doris-operator/lifecycle.md | `f363eeaef7db75223e49266f9c38843e528efb15f2683ef4aee25cf4b0e2fb21` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-002

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1555.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| install/deploy-on-kubernetes/doris-operator/status-and-troubleshooting | versioned_docs/version-4.x/install/deploy-on-kubernetes/doris-operator/status-and-troubleshooting.md | `da5974b7499a537b8ade5a8d65a92d98abedfec4e00fce656db4c2b770720096` |
| install/deploy-on-kubernetes/doris-operator/preparation | versioned_docs/version-4.x/install/deploy-on-kubernetes/doris-operator/preparation.mdx | `1ffb8bce4ee7adad70f7c492ac27733efad6bd29d12dcccf4268a076c3c623b2` |
| install/deploy-on-kubernetes/doris-operator/on-alibaba | versioned_docs/version-4.x/install/deploy-on-kubernetes/doris-operator/on-alibaba.md | `796f9a87d92ed7f872f0d9acb6195bd881f1c099af6dec2a76518c570c41d608` |
| install/deploy-on-kubernetes/doris-operator/on-aws | versioned_docs/version-4.x/install/deploy-on-kubernetes/doris-operator/on-aws.md | `13aa32656161461b924d436bc24a705dddfc9e4cf06d6f7b462f439a85ad13b4` |
| install/deploy-on-kubernetes/integrated-storage-compute/intro | versioned_docs/version-4.x/install/deploy-on-kubernetes/integrated-storage-compute/intro.mdx | `b1d5ba5805581c58b64404811d1b749b637e33214d3096b8bf5671c97a58619a` |
| install/deploy-on-kubernetes/integrated-storage-compute/install-doris-operator | versioned_docs/version-4.x/install/deploy-on-kubernetes/integrated-storage-compute/install-doris-operator.md | `0827643ef46dcc6264232b3ec5d204b25b27c0ad73b6ad078ac8ff0f37fb1cd8` |
| install/deploy-on-kubernetes/integrated-storage-compute/install-config-cluster | versioned_docs/version-4.x/install/deploy-on-kubernetes/integrated-storage-compute/install-config-cluster.md | `cd22ab94ec5012929caff1e0ca2e9d916563b24cc1ec33898e689a0241aed77d` |
| install/deploy-on-kubernetes/integrated-storage-compute/install-doris-cluster | versioned_docs/version-4.x/install/deploy-on-kubernetes/integrated-storage-compute/install-doris-cluster.md | `56821822efd43ad6dd59023a87e095a887da3886e07ad1410beb4097ac4acb19` |
| install/deploy-on-kubernetes/integrated-storage-compute/access-cluster | versioned_docs/version-4.x/install/deploy-on-kubernetes/integrated-storage-compute/access-cluster.md | `790c3171d1814b4a393b1d064572f7402f9e984c99b1bef26a9d94ae3005e266` |
| install/deploy-on-kubernetes/integrated-storage-compute/cluster-operation | versioned_docs/version-4.x/install/deploy-on-kubernetes/integrated-storage-compute/cluster-operation.md | `e90fea7fb163dd85ebd94d0a952cb455a41ed6b926645b10f8d80603b52de951` |
| install/deploy-on-kubernetes/separating-storage-compute/install-doris-cluster | versioned_docs/version-4.x/install/deploy-on-kubernetes/separating-storage-compute/install-doris-cluster.md | `13b63a635c68f4d7c368dd59829160b11cf1ba481960c3068da5dcac61022e14` |
| install/deploy-on-kubernetes/separating-storage-compute/install-fdb | versioned_docs/version-4.x/install/deploy-on-kubernetes/separating-storage-compute/install-fdb.md | `5e1c2edefcbc11390a7aa9cb2f8c86c8c7e09ff026151069676421cfb8077b06` |
| install/deploy-on-kubernetes/separating-storage-compute/config-ms | versioned_docs/version-4.x/install/deploy-on-kubernetes/separating-storage-compute/config-ms.md | `a7b4343fc33c36c4f488f8a65088e166ad1acc2680d77227755adb440737d064` |
| install/deploy-on-kubernetes/separating-storage-compute/config-fe | versioned_docs/version-4.x/install/deploy-on-kubernetes/separating-storage-compute/config-fe.md | `af1474677fc59b708718449fb10fdc133836c4217644277c0755f61a4f3abf92` |
| install/deploy-on-kubernetes/separating-storage-compute/config-cg | versioned_docs/version-4.x/install/deploy-on-kubernetes/separating-storage-compute/config-cg.md | `8caac48161b3e51a6e61dfd7e04f5d57886c5526d4ae8f212e2b5f8ec5ab2f95` |
| install/deploy-on-kubernetes/separating-storage-compute/config-cluster | versioned_docs/version-4.x/install/deploy-on-kubernetes/separating-storage-compute/config-cluster.md | `12e35bb31b75712c10032544126ec066a25aff379b194126108cbd9fc5519611` |
| install/deploy-on-kubernetes/separating-storage-compute/install-prometheus-and-grafana | versioned_docs/version-4.x/install/deploy-on-kubernetes/separating-storage-compute/install-prometheus-and-grafana.md | `de8870e8ac513d424d04205d9e915344c7cc6479e419ca1ca849767f69268815` |
| install/deploy-on-cloud/doris-on-aws | versioned_docs/version-4.x/install/deploy-on-cloud/doris-on-aws.md | `402ccffe67666655d93a38689119f4311238afa675278575cedd5b986e64a8d4` |
| compute-storage-decoupled/intro | versioned_docs/version-4.x/compute-storage-decoupled/intro.mdx | `c2af015e291bbdf0266078bae9ea342d6142079a5c4aec867d24832fb1d8ee76` |
| compute-storage-decoupled/managing-compute-cluster | versioned_docs/version-4.x/compute-storage-decoupled/managing-compute-cluster.md | `910dadae3c18aa62978bd05054ff1f7c7ebf2e5b3adf5695106f7fb34dcb9f2c` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-003

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1535.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| compute-storage-decoupled/managing-storage-vault | versioned_docs/version-4.x/compute-storage-decoupled/managing-storage-vault.md | `3a8a92c5477c428c3adca52963bc51cc9ae564d2b7d17d833997a7dcae05444d` |
| compute-storage-decoupled/recycler | versioned_docs/version-4.x/compute-storage-decoupled/recycler.md | `c0d64589777c333a4051a55010a1f86287fbaff5a666c193fabc678271a5470e` |
| compute-storage-decoupled/upgrade | versioned_docs/version-4.x/compute-storage-decoupled/upgrade.md | `27aec86be3acfb3221a0d68fb2690a7fec2a7e6fca256e606a32c4d2d05e3714` |
| compute-storage-decoupled/file-cache/file-cache | versioned_docs/version-4.x/compute-storage-decoupled/file-cache/file-cache.md | `980bacf1b836fd9c4c3ae8a45ed6df90aba63761f5385337cbc58bde70f7be77` |
| compute-storage-decoupled/file-cache/file-cache-internals | versioned_docs/version-4.x/compute-storage-decoupled/file-cache/file-cache-internals.md | `166732dfa9685d680b1e8b8c6c165d702941ad92f788a9e5d6a10e926bdf5286` |
| compute-storage-decoupled/file-cache/file-cache-peer-read | versioned_docs/version-4.x/compute-storage-decoupled/file-cache/file-cache-peer-read.md | `7ef9dd79f8350236e36b3d53467720fc956a28fd4d28bf99081b9fd0337cd2ba` |
| compute-storage-decoupled/rw/read-write-separation | versioned_docs/version-4.x/compute-storage-decoupled/rw/read-write-separation.md | `6c1aa1c02d5c678b0766994591e116cf59fedc6197c8acb9b126d8fde770254f` |
| compute-storage-decoupled/rw/file-cache-rw-compute-group-best-practice | versioned_docs/version-4.x/compute-storage-decoupled/rw/file-cache-rw-compute-group-best-practice.md | `b70ec0bbb73279e0b6d3d2a24380f9f048bfb327fe662ea136753d804e3d4f64` |
| connection-integration/mysql-proto | versioned_docs/version-4.x/connection-integration/mysql-proto.mdx | `975c5cfb3026f413dc6fb2e2060cdb583c6297c7c1d92a2f405963d73f2b8aac` |
| connection-integration/arrow-flight-sql | versioned_docs/version-4.x/connection-integration/arrow-flight-sql.md | `f9bd173d613fc8d03491c7adb68f779737c056ea16dd3de1f3289f95ed177960` |
| connection-integration/data-integration/intro | versioned_docs/version-4.x/connection-integration/data-integration/intro.mdx | `9c6d995105f3003f095378a00b76a03606c1b4eed62f2bf3669701741b08be6c` |
| connection-integration/data-integration/automq | versioned_docs/version-4.x/connection-integration/data-integration/automq.md | `207136b159139d1dcf415500385704de4d083dc079fce2b65ef25e4c6bebfb98` |
| connection-integration/data-integration/beats | versioned_docs/version-4.x/connection-integration/data-integration/beats.md | `f41d01f52d1af989fe576c94f14c3e8f0845c7fc453a24e3af5b4bbe12a6b650` |
| connection-integration/data-integration/cloudcanal | versioned_docs/version-4.x/connection-integration/data-integration/cloudcanal.md | `f91cfd860165a66dc453303c16e4c2e2dc8679c038257da0fde9c3a1c3f50877` |
| connection-integration/data-integration/clouddm | versioned_docs/version-4.x/connection-integration/data-integration/clouddm.md | `06d1bc592dab17e7d5aa98d258e72477b2dcdf6a0479c15036703a02510db72e` |
| connection-integration/data-integration/datagrip | versioned_docs/version-4.x/connection-integration/data-integration/datagrip.md | `29365b8903f7ef2bee35f5a564ae1f3f76ed8369cac58cbc38f17490749e81f8` |
| connection-integration/data-integration/datax | versioned_docs/version-4.x/connection-integration/data-integration/datax.md | `5526c552e5c5c39127af83f1331ee95bc8b6d836917810ee82cfe58fb682cb7a` |
| connection-integration/data-integration/dbeaver | versioned_docs/version-4.x/connection-integration/data-integration/dbeaver.md | `24783e79e90a3548ac7b75c304682fcfd61fdaf3e2d74d515b541d770536005f` |
| connection-integration/data-integration/dbt-doris-adapter | versioned_docs/version-4.x/connection-integration/data-integration/dbt-doris-adapter.md | `edfd31e1e6b7cf84ec59a2a8c715dc078c52cb892af7c7193e8af477ec0394d8` |
| connection-integration/data-integration/doris-kafka-connector | versioned_docs/version-4.x/connection-integration/data-integration/doris-kafka-connector.md | `9039f505f5effec24b8a9aa1f5fce99fba8d4ad692a33fe5793efa00233954a6` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-004

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1515.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| connection-integration/data-integration/doris-streamloader | versioned_docs/version-4.x/connection-integration/data-integration/doris-streamloader.md | `7acc01b42a31a5bfce304c0b2d3358723f846feb2e507c09456d4c021b7d4223` |
| connection-integration/data-integration/finebi | versioned_docs/version-4.x/connection-integration/data-integration/finebi.md | `4c1df0ff4ffb02654abefc0a69c8291acd3f2218d649df6468d027595cbe028c` |
| connection-integration/data-integration/flink-doris-connector | versioned_docs/version-4.x/connection-integration/data-integration/flink-doris-connector.md | `ab7314eff7113156c91b238e1354a345e2c75b434ca317a8744ca60ad67c9ab6` |
| connection-integration/data-integration/fluentbit | versioned_docs/version-4.x/connection-integration/data-integration/fluentbit.md | `3c79723365f02526d28e68d0a5ebbf90df78bf9f3315a7512219b4f2943badd8` |
| connection-integration/data-integration/hive-udf | versioned_docs/version-4.x/connection-integration/data-integration/hive-udf.md | `a86c53fcd1c1bdf051e88634800903b14474b9a0a43aeb03c73093b9f9005e2d` |
| connection-integration/data-integration/kettle | versioned_docs/version-4.x/connection-integration/data-integration/kettle.md | `43e3bf09f826041e41e2594502df8d97ae6a947dc70ffa804cf21af66f3ce387` |
| connection-integration/data-integration/kyuubi | versioned_docs/version-4.x/connection-integration/data-integration/kyuubi.md | `28e0e05b62c03c49891584d9daafc21a96fd5e162e9cacb20517cab2ae53abc8` |
| connection-integration/data-integration/langfuse | versioned_docs/version-4.x/connection-integration/data-integration/langfuse.md | `7925a7536000561de9559970b7d16d329ec1ba14bb0ad18a6583a627efc06c29` |
| connection-integration/data-integration/logstash | versioned_docs/version-4.x/connection-integration/data-integration/logstash.md | `654e71f6af77a96f17a37bfbfbdc56ee7a26c36f6ea6e06f2cbc90e887cd8f75` |
| connection-integration/data-integration/loongcollector | versioned_docs/version-4.x/connection-integration/data-integration/loongcollector.md | `00ed20c11ebc6e12395f9964da71dc5327084134c41154f1e591d3c564176bad` |
| connection-integration/data-integration/metabase | versioned_docs/version-4.x/connection-integration/data-integration/metabase.md | `ab451bf871a5f6c785845009a5bef7c96bdffa54f5f476d9ca1258403e25aae0` |
| connection-integration/data-integration/opentelemetry | versioned_docs/version-4.x/connection-integration/data-integration/opentelemetry.md | `e2758b6238934e3ca0f05ddb690ef4729d2774af1bc1528a05ff05eeb2bfb4e3` |
| connection-integration/data-integration/powerbi | versioned_docs/version-4.x/connection-integration/data-integration/powerbi.md | `1c2866875301b91f7cddca42d59267f5332022fba5163dd5ef78a9e1555bdaba` |
| connection-integration/data-integration/quickbi | versioned_docs/version-4.x/connection-integration/data-integration/quickbi.md | `c70b6db8bfbba37940923e08b0953d502980a2075f97034059b75dbc8cd65dcd` |
| connection-integration/data-integration/quicksight | versioned_docs/version-4.x/connection-integration/data-integration/quicksight.md | `2020228ce200a69554b5e197cd262b6acfa43347630c401cb20aa360727ca57d` |
| connection-integration/data-integration/seatunnel | versioned_docs/version-4.x/connection-integration/data-integration/seatunnel.md | `4e06235afb88b4e81a795e22def4f6824fed7f877318222616d631d89556adf9` |
| connection-integration/data-integration/smartbi | versioned_docs/version-4.x/connection-integration/data-integration/smartbi.md | `7eaba64470f171a47e11b0d1b7ca02e566bd84b3e902eef039ae275cb8bdb0d9` |
| connection-integration/data-integration/spark-doris-connector | versioned_docs/version-4.x/connection-integration/data-integration/spark-doris-connector.md | `ec479b6a3dde11ea58cf91ee69c2b224fc670bee04458e7c84fec5382474cad5` |
| connection-integration/data-integration/superset | versioned_docs/version-4.x/connection-integration/data-integration/superset.md | `b572431f679029c1c47e43cb9ca6ce98c2c8b610cfff905f2b88b5355ce30050` |
| connection-integration/data-integration/tableau | versioned_docs/version-4.x/connection-integration/data-integration/tableau.md | `7712fe8c0436809309f66b9c4902e0a8a56ed678472e562d957026fee28f5b34` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-005

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1495.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| connection-integration/data-integration/vector | versioned_docs/version-4.x/connection-integration/data-integration/vector.md | `9f3695100683dc063f1a0f51792423f192eefd1b3de5d30f7555d173d925d91c` |
| table-design/overview | versioned_docs/version-4.x/table-design/overview.mdx | `8f0271205a9a1963db16597eea5a6bf196f68a54ff8c3075873015790cf452d5` |
| table-design/data-model/intro | versioned_docs/version-4.x/table-design/data-model/intro.mdx | `4f8f54e0df79cc3467e00add7c3e7966e108516de78820d7258a79cac28dc98c` |
| table-design/data-model/duplicate | versioned_docs/version-4.x/table-design/data-model/duplicate.md | `bf6283b4e2b10542ef36767454bf1031f0eb8deb6df59747230942a81ad3e49e` |
| table-design/data-model/unique | versioned_docs/version-4.x/table-design/data-model/unique.md | `6b378116d758ffa7290561a48d29761a4857c82013f04e7c136523a33fa381e7` |
| table-design/data-model/merge-on-write | versioned_docs/version-4.x/table-design/data-model/merge-on-write.md | `72da37504f19e0ff307b2458afef79e01e515cd7bd6ef54da86fa8aa7476a5fc` |
| table-design/data-model/aggregate | versioned_docs/version-4.x/table-design/data-model/aggregate.md | `f68f9b11fdb49cbea6ee654a219ccda04211f0364729e68fc1f3a6e631d8297a` |
| table-design/data-model/tips | versioned_docs/version-4.x/table-design/data-model/tips.md | `e5657529db80fb24c64bbd9f142e535d5c714966cd05ae5b38980d171d263fbc` |
| table-design/data-type | versioned_docs/version-4.x/table-design/data-type.md | `eebe1b24f2449c5f0dba326e458ef444b5a23d5a5b26911431300306615c9935` |
| table-design/data-partitioning/basic-concepts | versioned_docs/version-4.x/table-design/data-partitioning/basic-concepts.mdx | `e143245e07d5ad1a7afd8af3d4ca5764b84b15afec692159be3e05031591cc9c` |
| table-design/data-partitioning/manual-partitioning | versioned_docs/version-4.x/table-design/data-partitioning/manual-partitioning.md | `1c9282bfc86a7f695fb09e12778425aba150ef1f9e11792f9b6c2f7a6a8c35f0` |
| table-design/data-partitioning/dynamic-partitioning | versioned_docs/version-4.x/table-design/data-partitioning/dynamic-partitioning.md | `9d57fff34947f71bcc8cba61d62d710ecf3069107411a1fcdba1e6fd5b135171` |
| table-design/data-partitioning/auto-partitioning | versioned_docs/version-4.x/table-design/data-partitioning/auto-partitioning.md | `08885daca4ac8937c0676669c81ef537c238fe9bd3f5b1319a9dfdfebdbd81f1` |
| table-design/data-partitioning/data-bucketing | versioned_docs/version-4.x/table-design/data-partitioning/data-bucketing.md | `58291839133e329fa9f5cf8a7f786078ec5e2976ab5cf3e8fba62a7624943a05` |
| table-design/data-partitioning/common-issues | versioned_docs/version-4.x/table-design/data-partitioning/common-issues.md | `cc11224d7babb79a62defcae69405d9cc252e8d08497df7132443832705e0057` |
| table-design/index/index-overview | versioned_docs/version-4.x/table-design/index/index-overview.md | `7e31322e1b7bda720eba44c4bd32143124ec70649d6b2fa0a4a25097fbb24c65` |
| table-design/index/prefix-index | versioned_docs/version-4.x/table-design/index/prefix-index.md | `482d8e08df4eb40cdf75e5c57a532e1432c80fb498ba97b2952e0b3a62e9943e` |
| table-design/index/bloomfilter | versioned_docs/version-4.x/table-design/index/bloomfilter.md | `e6417f22674a837f9c0618e7567bacfb8ce65f6460300ee6cf7c6c5b61d61dea` |
| table-design/index/ngram-bloomfilter-index | versioned_docs/version-4.x/table-design/index/ngram-bloomfilter-index.md | `02238d2ae99d46939d108e17e8a3199ab266a159a8bce6337a74057d790106e9` |
| table-design/index/inverted-index/overview | versioned_docs/version-4.x/table-design/index/inverted-index/overview.md | `882513123c5f31135ab5c25ecf69fd30f67337a637502b930ce8d450b76652f1` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-006

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1475.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| table-design/index/inverted-index/custom-analyzer | versioned_docs/version-4.x/table-design/index/inverted-index/custom-analyzer.md | `61532386bb644b88a6e4d61e684396605e9e750f2040ef048cacc1cde602bca0` |
| table-design/index/inverted-index/custom-normalizer | versioned_docs/version-4.x/table-design/index/inverted-index/custom-normalizer.md | `4b3e12c6de2c7d3a496c03b911567da67e65cf01100b1546846f207afd6b260b` |
| table-design/index/inverted-index/search-operators | versioned_docs/version-4.x/table-design/index/inverted-index/search-operators.md | `ed2911734ed12b19dda81a7ffab09b65762a003b711300bf5368426efb3b5f8a` |
| table-design/index/inverted-index/search-function | versioned_docs/version-4.x/table-design/index/inverted-index/search-function.md | `9bba18ad86f25fa602eddd3ff8e2e4ca7bf4dcad678baa8fe6339501da90b811` |
| table-design/index/inverted-index/scoring | versioned_docs/version-4.x/table-design/index/inverted-index/scoring.md | `7f7d49bee863793e694103d36856ff0bb4af3e31f5f779e14d5e0b70b782e5a8` |
| table-design/index/vector-index/overview | versioned_docs/version-4.x/table-design/index/vector-index/overview.md | `c01fde75791fd51c1b7b99a107de9d2dcb579addf19113326910d16e606f60fc` |
| table-design/index/vector-index/practical-guide | versioned_docs/version-4.x/table-design/index/vector-index/practical-guide.md | `2b35afccd21be8e8eb7e5cb705d8b4db19a687c9805ef88b67dbd03623c0b468` |
| table-design/index/vector-index/hnsw | versioned_docs/version-4.x/table-design/index/vector-index/hnsw.md | `a2526ad820a5b5bd4764c054b5dd7d9cb1e6b75881dcec4ea2651a2e8e02bd97` |
| table-design/index/vector-index/ivf | versioned_docs/version-4.x/table-design/index/vector-index/ivf.md | `8d7110283bc5ca00a42f6ecdfef16850d0afbd50c65a43e2faff5a49f4e3ec38` |
| table-design/index/vector-index/ivf-on-disk | versioned_docs/version-4.x/table-design/index/vector-index/ivf-on-disk.md | `e3d2bfde910e7c6a80f9b460d7ea4cf2549849a734b5a93daf321db9a81bb395` |
| table-design/index/vector-index/index-management | versioned_docs/version-4.x/table-design/index/vector-index/index-management.md | `6cf433510d3358a9671ea4958843fb8db02d07bb772d19d66ef510bc0fd66354` |
| table-design/index/vector-index/resource-estimation | versioned_docs/version-4.x/table-design/index/vector-index/resource-estimation.md | `454078c114baa06e0e6d3c6b1591f9f749058f83fbfd02432dbe3175121685b5` |
| table-design/index/vector-index/quantization-survey | versioned_docs/version-4.x/table-design/index/vector-index/quantization-survey.md | `06364abeab7e4969077ba9c86e371cbc52572da6e8af06971ee2c1080161b709` |
| table-design/index/vector-index/performance | versioned_docs/version-4.x/table-design/index/vector-index/performance.md | `698d0345b867ccb4921d0b5d45eef70ab17e67a1dd4cf90622bc48322d7ce3da` |
| table-design/index/vector-index/performance-large-scale | versioned_docs/version-4.x/table-design/index/vector-index/performance-large-scale.md | `8361f4d44a0d0462bead8c32631348cf3a1a1d3f940c9fc10c3bc08619b947f1` |
| table-design/index/vector-index/behind-index | versioned_docs/version-4.x/table-design/index/vector-index/behind-index.md | `658711171d5b3eb3143ff02d3b1d77a44cbffb9be882a5f93f7f4692b301e02f` |
| table-design/storage-layout-overview | versioned_docs/version-4.x/table-design/storage-layout-overview.mdx | `a865e8eb896abae382c28b34244c0d212b5170ae6e6acd0a8f3a37be8715d803` |
| table-design/column-compression | versioned_docs/version-4.x/table-design/column-compression.md | `6049a098a9edde869604aedae7ca396c2b9447f002e273efbaaa31d5fc773715` |
| table-design/row-store | versioned_docs/version-4.x/table-design/row-store.md | `f01324f733d705f896a468e500a59a3e0ee66c820cbb041e9d570ba6c7790790` |
| table-design/tiered-storage/overview | versioned_docs/version-4.x/table-design/tiered-storage/overview.md | `6ec25a936c0503f9b1d1e835460d87d7972bd6e5aa948bbb6c8fd5d303d3ff7c` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-007

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1455.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| table-design/tiered-storage/tiered-ssd-hdd | versioned_docs/version-4.x/table-design/tiered-storage/tiered-ssd-hdd.md | `5573c48352a5f014208b6cd5d202a66076ca0a47df52ebf2f6bb3a601b7534ac` |
| table-design/tiered-storage/remote-storage | versioned_docs/version-4.x/table-design/tiered-storage/remote-storage.md | `1f31a324b0dbd6cfe2a95612a9425d762606e55f999e411e4cd700ad0f5c8f00` |
| table-design/storage-format | versioned_docs/version-4.x/table-design/storage-format.md | `b7f86b8b9a197f7cf8ff2fe1f2c90aa98adab2e17438cc5a28110b7b56d2bf17` |
| table-design/schema-change | versioned_docs/version-4.x/table-design/schema-change.md | `fc124c632c83b650f53ddb81211275542cebd192a61a796287cf65b9f958d716` |
| table-design/auto-increment | versioned_docs/version-4.x/table-design/auto-increment.md | `f0742191b4a2d9f2b0c4e8deb595d3d6595a0d64b31bfbe0871ee0fcf0ac79ae` |
| table-design/temporary-table | versioned_docs/version-4.x/table-design/temporary-table.md | `0242e02605cfcde7b19541edf00595b7973d6f6b6721c74c7974ca2d1fe37e09` |
| data-operate/import/load-manual | versioned_docs/version-4.x/data-operate/import/load-manual.md | `6a6f78369e10ff0e11bca0c19629e265fd298898b1d05f7fc19c8a9341b0274c` |
| data-operate/import/data-source/local-file | versioned_docs/version-4.x/data-operate/import/data-source/local-file.md | `3f011b79fad8df7fd2102589a89d5ddfa9aa240c829144a3cada733f4df150b0` |
| data-operate/import/data-source/kafka | versioned_docs/version-4.x/data-operate/import/data-source/kafka.md | `27019d66b8780ecfe2b3922f4886a9cbd2bb89992c3ec77dc1859a09433d0c85` |
| data-operate/import/data-source/aws-msk | versioned_docs/version-4.x/data-operate/import/data-source/aws-msk.md | `534acfea1668d3ea8891aade8e8a9c1b43014ef245a65140f15476797b6db323` |
| data-operate/import/data-source/flink | versioned_docs/version-4.x/data-operate/import/data-source/flink.md | `be061e9bc8a5f47f409572e6c52a5cdfeaa5b204f490aab78a40e4e83b39be74` |
| data-operate/import/data-source/hdfs | versioned_docs/version-4.x/data-operate/import/data-source/hdfs.md | `cfd9711925f5f963a8cbe255a9c8c2d7e8190b46b36332aeed89f14b044ac021` |
| data-operate/import/data-source/amazon-s3 | versioned_docs/version-4.x/data-operate/import/data-source/amazon-s3.md | `ca94f799c99260becf89bd1419e5abb4db3fa11137043d53a616a9176523d8f4` |
| data-operate/import/data-source/google-cloud-storage | versioned_docs/version-4.x/data-operate/import/data-source/google-cloud-storage.md | `b9e69e4038bdab0b313343414b46fc777f26321137ad700689fbca132d9c9d19` |
| data-operate/import/data-source/azure-storage | versioned_docs/version-4.x/data-operate/import/data-source/azure-storage.md | `215614aa3636568b042e71678e6890b2bd4b7402a9e796699a013a78468d7e36` |
| data-operate/import/data-source/aliyun-oss | versioned_docs/version-4.x/data-operate/import/data-source/aliyun-oss.md | `4d983d9d7b138aab64193319f32189ae898a28294d9a888b15c8dddddd28d42e` |
| data-operate/import/data-source/huawei-obs | versioned_docs/version-4.x/data-operate/import/data-source/huawei-obs.md | `7877cd099e94c6c79d957432d5447f89e615e82b4e1be810b7b817e9cf1fa9cc` |
| data-operate/import/data-source/tencent-cos | versioned_docs/version-4.x/data-operate/import/data-source/tencent-cos.md | `ef59f346e2b29daf6c3e8fcd340bb972614102b50d0f6249f0576bcf2733c77d` |
| data-operate/import/data-source/minio | versioned_docs/version-4.x/data-operate/import/data-source/minio.md | `6918ee7a82b81a97087cfe4cadbe31eb40f7085ac9b747dc0b3cae1263f36241` |
| data-operate/import/data-source/s3-compatible | versioned_docs/version-4.x/data-operate/import/data-source/s3-compatible.md | `0b356484fc0606c54522d8694d1c3ccb99dbddb58ed2b624c75b07c7871b5043` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-008

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1435.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| data-operate/import/data-source/snowflake | versioned_docs/version-4.x/data-operate/import/data-source/snowflake.md | `fd4d3a2788660f4466b5e724ba224f41a12392824044925924e1a01dcf7b26fb` |
| data-operate/import/data-source/bigquery | versioned_docs/version-4.x/data-operate/import/data-source/bigquery.md | `f6802e8f9d67405d55cea0380028398a6cf51eb12c707c85596f2eb7041dec05` |
| data-operate/import/data-source/redshift | versioned_docs/version-4.x/data-operate/import/data-source/redshift.md | `afa37e93022c6340dbcc2493a247d16a003ddee3cd194ee2298ed04e1e6cc5f3` |
| data-operate/import/data-source/mysql | versioned_docs/version-4.x/data-operate/import/data-source/mysql.md | `586dd227680e67c2fba62ff784f9ebc1912a0200786f7c4afaf3d124ed128a6b` |
| data-operate/import/data-source/postgresql | versioned_docs/version-4.x/data-operate/import/data-source/postgresql.md | `d2c689ec5104e36b510090f6cb5a74686004d81c45b1c91a290006417417adcf` |
| data-operate/import/data-source/migrate-data-from-other-olap | versioned_docs/version-4.x/data-operate/import/data-source/migrate-data-from-other-olap.md | `c8ac2f1bbef43f68c42ecf21a65f3c55ddb8b6096b5bc37e7131c99e9e306fce` |
| data-operate/import/data-source/migrate-data-from-other-oltp | versioned_docs/version-4.x/data-operate/import/data-source/migrate-data-from-other-oltp.md | `52bd4bf3d46f13aa99c9f347e8d8a8a8736a966397f15a82bbe39813a7ef9df4` |
| data-operate/import/import-way/stream-load-manual | versioned_docs/version-4.x/data-operate/import/import-way/stream-load-manual.md | `02acf9e4e47c71f94a2d3554725f0db4bb09fe728130bf246b94d52c7a0f4e83` |
| data-operate/import/import-way/broker-load-manual | versioned_docs/version-4.x/data-operate/import/import-way/broker-load-manual.md | `897a1ab20b043ecdd36d8494bc3b403d023f2cd2ade37a64500089aaf2a90de4` |
| data-operate/import/import-way/routine-load-manual | versioned_docs/version-4.x/data-operate/import/import-way/routine-load-manual.md | `87c0bd952ad220ac77fe2cba723de66f1ba0536eaec3129b1274e9660e08f60d` |
| data-operate/import/import-way/insert-into-manual | versioned_docs/version-4.x/data-operate/import/import-way/insert-into-manual.md | `961c22142059b06ed9afed00c63ca7eeda1e8c9f746cb40ff64ba55438f55bba` |
| data-operate/import/import-way/insert-into-values-manual | versioned_docs/version-4.x/data-operate/import/import-way/insert-into-values-manual.md | `1f9b2dc29ddada32e9ee16d24f1f7874eb7012a6a68c41d88ef58a7330958191` |
| data-operate/import/import-way/mysql-load-manual | versioned_docs/version-4.x/data-operate/import/import-way/mysql-load-manual.md | `4c22bfffd8598bdff898febaf78fd8d7f4db7f031aef73651635c8d8c0b6cddd` |
| data-operate/import/import-way/spark-load | versioned_docs/version-4.x/data-operate/import/import-way/spark-load.md | `cef55ca65c1d4739e73259e8b1a8b69080ed8acccf0f336e519b01c557aab703` |
| data-operate/import/import-way/streaming-job/continuous-load-overview | versioned_docs/version-4.x/data-operate/import/import-way/streaming-job/continuous-load-overview.md | `8288e8210e7232ce68129862db1c7f0c12618b9ddaf2922aa2ae16f01b64ebe7` |
| data-operate/import/import-way/streaming-job/continuous-load-mysql-table | versioned_docs/version-4.x/data-operate/import/import-way/streaming-job/continuous-load-mysql-table.md | `fd0df854ee8804ca79d3a4abe48fd84074bc50afb8d3b534821f7a59ccc5eb75` |
| data-operate/import/import-way/streaming-job/continuous-load-mysql-database | versioned_docs/version-4.x/data-operate/import/import-way/streaming-job/continuous-load-mysql-database.md | `4e0998cbe0c8dfa5f6c76c883bfc7280d3ebd8fbe8cf3f6aafdc7644fd0e582a` |
| data-operate/import/import-way/streaming-job/schema-change-mysql | versioned_docs/version-4.x/data-operate/import/import-way/streaming-job/schema-change-mysql.md | `94f63db2538e67c4df30c3cdcb41a93ba407d6603b43c0d5ee25526c7e15a3d5` |
| data-operate/import/import-way/streaming-job/data-type-mapping-mysql | versioned_docs/version-4.x/data-operate/import/import-way/streaming-job/data-type-mapping-mysql.md | `1fa11c2e4608bb7b8c229643df07d87ef4b229bbf869d11a2e58b103ce17b925` |
| data-operate/import/import-way/streaming-job/prerequisites/amazon-rds-mysql | versioned_docs/version-4.x/data-operate/import/import-way/streaming-job/prerequisites/amazon-rds-mysql.md | `3c863f744dd4c9850eaa0cd8b6257415c40b3c036d7fe41df5ce6e53880d4fa2` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-009

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1415.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| data-operate/import/import-way/streaming-job/prerequisites/amazon-aurora-mysql | versioned_docs/version-4.x/data-operate/import/import-way/streaming-job/prerequisites/amazon-aurora-mysql.md | `a26ae88ea722583e332f686cbee7f436f3808fbb79bfff389a5cf092a88c10ba` |
| data-operate/import/import-way/streaming-job/continuous-load-postgresql-table | versioned_docs/version-4.x/data-operate/import/import-way/streaming-job/continuous-load-postgresql-table.md | `9d1878589b264c2e101f07c8b3ae3af91d74b37a40af06704e4c56ef89ac48ea` |
| data-operate/import/import-way/streaming-job/continuous-load-postgresql-database | versioned_docs/version-4.x/data-operate/import/import-way/streaming-job/continuous-load-postgresql-database.md | `38c8570d44569f85c317c4c39e64319e83a9c55c4f2348d94a2ee9771e9adf4d` |
| data-operate/import/import-way/streaming-job/schema-change-postgresql | versioned_docs/version-4.x/data-operate/import/import-way/streaming-job/schema-change-postgresql.md | `f6fc4c7247836367cfd29e7f77537494f837b530c841071cf07057138953ebc6` |
| data-operate/import/import-way/streaming-job/data-type-mapping-postgresql | versioned_docs/version-4.x/data-operate/import/import-way/streaming-job/data-type-mapping-postgresql.md | `515c7a1fe9b5fd5877fca42918610bf16a892f812b592ee8dd73393939cb99ad` |
| data-operate/import/import-way/streaming-job/prerequisites/amazon-rds-postgresql | versioned_docs/version-4.x/data-operate/import/import-way/streaming-job/prerequisites/amazon-rds-postgresql.md | `ed5d4a089a78cf343356b37ee2042ca42ddc572f7e578870c5fdcdd44a2c3e37` |
| data-operate/import/import-way/streaming-job/prerequisites/amazon-aurora-postgresql | versioned_docs/version-4.x/data-operate/import/import-way/streaming-job/prerequisites/amazon-aurora-postgresql.md | `5b6137a794933bd818e991a185a7e54bcd78525328fa6c954bf840a0eb31159e` |
| data-operate/import/import-way/streaming-job/continuous-load-oceanbase-database | versioned_docs/version-4.x/data-operate/import/import-way/streaming-job/continuous-load-oceanbase-database.md | `8efd902ad347012713cc5ad67253a164fa57b353309cb2a2120c12ada150d508` |
| data-operate/import/import-way/streaming-job/schema-change-oceanbase | versioned_docs/version-4.x/data-operate/import/import-way/streaming-job/schema-change-oceanbase.md | `d534b172591f2127a5706380ab06f01aa210bda12a8da17950fe8a3910763735` |
| data-operate/import/import-way/streaming-job/data-type-mapping-oceanbase | versioned_docs/version-4.x/data-operate/import/import-way/streaming-job/data-type-mapping-oceanbase.md | `6e929513742565e816506c13ca9f31d0c056a4ab4b9f1c70aff0ef26a384bcac` |
| data-operate/import/import-way/streaming-job/continuous-load-s3 | versioned_docs/version-4.x/data-operate/import/import-way/streaming-job/continuous-load-s3.md | `9cbdf58b5e569f684dd432b8c29b1e87e063365b8f90da161bf2a7ac630125c8` |
| data-operate/import/file-format/csv | versioned_docs/version-4.x/data-operate/import/file-format/csv.md | `6297168b241c1ee49008b191d5b7554a8a8288187d382cdcccbec6f50b3d0cd5` |
| data-operate/import/file-format/json | versioned_docs/version-4.x/data-operate/import/file-format/json.md | `46efd94f39c4060074f7669b90e84a6e6efb2174d67a9a34ed1f59f737dcf2bc` |
| data-operate/import/file-format/parquet | versioned_docs/version-4.x/data-operate/import/file-format/parquet.md | `6217a7cc62dd9025ce582ae01c87cfcb5c3b08aa1a728537cfd7028a4a270310` |
| data-operate/import/file-format/orc | versioned_docs/version-4.x/data-operate/import/file-format/orc.md | `dc24d17af311b9a5c4d528b6ce53930a81c5648ee288d701af2f2d317de479a8` |
| data-operate/import/complex-types/array | versioned_docs/version-4.x/data-operate/import/complex-types/array.md | `023a43cacfe9a14fa5dadc52d990becb98dd9f8d05e491280b06447cd312d0d1` |
| data-operate/import/complex-types/map | versioned_docs/version-4.x/data-operate/import/complex-types/map.md | `8b90cff640875e8ee1f923fa8a90ef69cce41d2bb0606795e3325cf2a3cda28c` |
| data-operate/import/complex-types/struct | versioned_docs/version-4.x/data-operate/import/complex-types/struct.md | `e5fa7d4c3e7a547069bf94ee244062ff4500d27a36e68c77d7c519d2ebab50b8` |
| data-operate/import/complex-types/json | versioned_docs/version-4.x/data-operate/import/complex-types/json.md | `1e1d0aeda96b9cee77a9456f765dac6a3cac36b17bd7a7a365fa4693520d6365` |
| data-operate/import/complex-types/bitmap | versioned_docs/version-4.x/data-operate/import/complex-types/bitmap.md | `fa118828337fc4e1767005c286f1b26ba9a467350b0f20f45bcfec41e8d577a2` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-010

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1395.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| data-operate/import/complex-types/hll | versioned_docs/version-4.x/data-operate/import/complex-types/hll.md | `b4fba5973bc58d67e4ff65cc6863951597fc25fd7b1cb1d5ea35412b926f9111` |
| data-operate/import/complex-types/variant | versioned_docs/version-4.x/data-operate/import/complex-types/variant.md | `a638ecfaa747a02eec75681e179f1d8d4646fa02a392ca5ebce3947d80bab9e3` |
| data-operate/import/handling-messy-data | versioned_docs/version-4.x/data-operate/import/handling-messy-data.md | `80cbb07b9ab95b025b6258c4592a30ab88e4199f1e583635f60d16dc8acb618e` |
| data-operate/import/load-data-convert | versioned_docs/version-4.x/data-operate/import/load-data-convert.md | `e67c9e8efa977beab8966343ae50f07db3c456d6577ce1bb6ef4d6349968c768` |
| data-operate/import/load-best-practices/load-best-practices | versioned_docs/version-4.x/data-operate/import/load-best-practices/load-best-practices.md | `287c739772b3d2f6195bc95b40a283aa48c423c67e40414aae5e9a5928f98a98` |
| data-operate/import/load-best-practices/load-high-availability | versioned_docs/version-4.x/data-operate/import/load-best-practices/load-high-availability.md | `b0d89ac3f3ea80ddc86931d91bafc85ab2d365cf188e04897d5aafb7c616f1e7` |
| data-operate/import/load-best-practices/group-commit-manual | versioned_docs/version-4.x/data-operate/import/load-best-practices/group-commit-manual.md | `c368e4c4dd13a61a2dd3f365f7388576de352cdf6513601fb4e9d6349ea49ad3` |
| data-operate/import/load-best-practices/routine-load-best-practices | versioned_docs/version-4.x/data-operate/import/load-best-practices/routine-load-best-practices.md | `d800a94209c540553531c1b0ff9c819a7537597ee21cd622052d863461732097` |
| data-operate/import/load-best-practices/stream-load-in-complex-network | versioned_docs/version-4.x/data-operate/import/load-best-practices/stream-load-in-complex-network.md | `336c549ee94e144a890160a95ba77789a7c410697ba026a794254ba3c07fdd9f` |
| data-operate/update-and-delete | versioned_docs/version-4.x/data-operate/update-and-delete.mdx | `f643e194681b938e17919bc8cf0299e2d4c8c11c2456a656cf199a5f60474ee9` |
| data-operate/update/update-overview | versioned_docs/version-4.x/data-operate/update/update-overview.md | `a5fdc425fd27bf3f3d58f5456ce952907d5fb5f9fab885e445fbb0aff029f9b5` |
| data-operate/update/unique-update-sql | versioned_docs/version-4.x/data-operate/update/unique-update-sql.md | `067995b388e1731e955bf4a0fe84bd81575c6f8ba9529814413c2b7dee1681ab` |
| data-operate/update/update-of-unique-model | versioned_docs/version-4.x/data-operate/update/update-of-unique-model.md | `fd0f02a03a596f241e33ca3d66fe42bb03be608cf0c6891dd65ea6defbc39694` |
| data-operate/update/update-of-aggregate-model | versioned_docs/version-4.x/data-operate/update/update-of-aggregate-model.md | `9032ca31680810fc4869c081537a51ed37b382420500ebc7bd592f01c54b0fc2` |
| data-operate/update/partial-column-update | versioned_docs/version-4.x/data-operate/update/partial-column-update.md | `30052012a8457a9a9bdd6291ec54fccfb64487b834dc42db8f8a5728f1a5c9e5` |
| data-operate/update/unique-update-concurrent-control | versioned_docs/version-4.x/data-operate/update/unique-update-concurrent-control.md | `8fc9b3dd5064182a2947f0802559e1d69e9ba7083550df3b3b2b150837b8b5d9` |
| data-operate/update/multi-stream-update-for-unique-model | versioned_docs/version-4.x/data-operate/update/multi-stream-update-for-unique-model.md | `416b7fa15cd57123c911c42bb04495daadd5ca57268da5104d99ea0a52ce2497` |
| data-operate/delete/delete-overview | versioned_docs/version-4.x/data-operate/delete/delete-overview.md | `42d157bb2c27a6e2274ab53fd4d6dbc02891971a08ceb13f641191adb5db7186` |
| data-operate/delete/delete-manual | versioned_docs/version-4.x/data-operate/delete/delete-manual.md | `7a6feacad14ada402f7adb1162bd11380ef5ee1bd238a1ca8c0c9675c57f3c08` |
| data-operate/delete/batch-delete-manual | versioned_docs/version-4.x/data-operate/delete/batch-delete-manual.md | `c713aa523f5fe8bed0f6334a527fa7cee14cc8fc57f9dcb6c86ccdb5e36a24c2` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-011

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1375.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| data-operate/delete/truncate-manual | versioned_docs/version-4.x/data-operate/delete/truncate-manual.md | `0020dfdaf4a83a51ee65621905229ed64d32f1df7eeb3ffc7a0688156727325d` |
| data-operate/delete/atomicity-replace | versioned_docs/version-4.x/data-operate/delete/atomicity-replace.md | `04ab7515a3f6076a106d99e3eb6f2c56f3d702e3117e251e16e4c08aa02e1c1d` |
| data-operate/delete/table-temp-partition | versioned_docs/version-4.x/data-operate/delete/table-temp-partition.md | `503636e4d6487d6df488baac0750823056d55385131bb2d6f3a69aade332f590` |
| data-operate/transaction | versioned_docs/version-4.x/data-operate/transaction.md | `04aefe8892a00ae59b64ba9d38da3cc70408383070301fe73e75c594be8b8d08` |
| data-operate/export/export-overview | versioned_docs/version-4.x/data-operate/export/export-overview.md | `a1c1b20f715dc5a2b486a69da8bb84f06f6b460693ac4a1931d67d51a85f4c83` |
| data-operate/export/export-manual | versioned_docs/version-4.x/data-operate/export/export-manual.md | `36d2a74bd445bc86dc9794d08ae0d9c1ed2c455b30cfcbe4c8be830407bfc388` |
| data-operate/export/outfile | versioned_docs/version-4.x/data-operate/export/outfile.md | `4077bdabd00d4dc50ba6d9730817110ee7cf0746067efacda8911f43eaf59e96` |
| data-operate/export/export-with-mysql-dump | versioned_docs/version-4.x/data-operate/export/export-with-mysql-dump.md | `41a6ac45c4790d26a50c12b875863554d34484dca2144ed04876250c21db16a2` |
| data-operate/export/export-best-practice | versioned_docs/version-4.x/data-operate/export/export-best-practice.md | `a72f91ce9191972d14dbd35b6601b12088ce0873571f433ef64352b1181b8096` |
| query-data/querying-overview | versioned_docs/version-4.x/query-data/querying-overview.mdx | `176f779a3d629daec2b16697c178045ef542a06d4a98223ddae1996d930854df` |
| query-data/mysql-compatibility | versioned_docs/version-4.x/query-data/mysql-compatibility.md | `3bc37f9066f6321366d758ab978340fc32d8fd4f6b2d026799e43b8c3d3ab349` |
| query-data/join | versioned_docs/version-4.x/query-data/join.md | `b515f4e5ddefeb903d15edbd3083455a71b2a89631d9700b23980627f3de4341` |
| query-data/asof-join | versioned_docs/version-4.x/query-data/asof-join.md | `4888e84ec080206ae4f4ed4ca1ac5ba8451446dce5ca1969d85566c6f151148c` |
| query-data/subquery | versioned_docs/version-4.x/query-data/subquery.md | `58356bf430fff67a1acd608cd8caad75c8e8f99e1f565e0ca8dcb6c408b34f09` |
| query-data/multi-dimensional-analytics | versioned_docs/version-4.x/query-data/multi-dimensional-analytics.md | `e8c9fd2da35dbb32f63ad32d4efcbd0d298b3d4b28764d1cd81303ace1dd0eee` |
| query-data/window-function | versioned_docs/version-4.x/query-data/window-function.md | `8b1cb2ca215046ac1ba23ac5574bc3c446cfa24bb2c18f77dd74cf41437391d4` |
| query-data/cte | versioned_docs/version-4.x/query-data/cte.md | `928875f4a7adac1f5216eb9af9ea96d5d39d87068163cc96d9aa7f39062aca38` |
| query-data/udf/alias-function | versioned_docs/version-4.x/query-data/udf/alias-function.md | `8e18de8457fea3a9dbd10487d8e6794d38bdb1edc5629697e9067725a2aa9c7f` |
| query-data/udf/java-user-defined-function | versioned_docs/version-4.x/query-data/udf/java-user-defined-function.md | `2b580f0086194bbd53357c5e345718c6570e91e83390add6609a3f439cae83a4` |
| query-data/udf/python-user-defined-function | versioned_docs/version-4.x/query-data/udf/python-user-defined-function.md | `77b7be0aae6c08d3f2182f73582a593ded616c31e00dffe76a5ddaff87500e32` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-012

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1355.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| query-data/complex-type | versioned_docs/version-4.x/query-data/complex-type.md | `98a1f39f95547db68a2ef351ea6e210d75ff57a8545eecb432a865bdf1dd6c9f` |
| query-data/lateral-view | versioned_docs/version-4.x/query-data/lateral-view.md | `d075331112ffc2bde21d685b94d295c96496a212a638daf01d1cf28e2dc362c6` |
| query-acceleration/materialized-view/intro | versioned_docs/version-4.x/query-acceleration/materialized-view/intro.mdx | `f02036b5441cd72b76b92590b5e9e5091723f377e05d523f03cb7d82deff59cb` |
| query-acceleration/materialized-view/overview | versioned_docs/version-4.x/query-acceleration/materialized-view/overview.md | `8da4beae745471b9a011763f4f994f4334bf5f37831ae8cb8925dbc8149631a3` |
| query-acceleration/materialized-view/sync-materialized-view | versioned_docs/version-4.x/query-acceleration/materialized-view/sync-materialized-view.md | `44622e5d7d8a6d9f131f44f9ae4a388007da705a660bdc509ca10568cffde98b` |
| query-acceleration/tuning/tuning-plan/transparent-rewriting-with-sync-mv | versioned_docs/version-4.x/query-acceleration/tuning/tuning-plan/transparent-rewriting-with-sync-mv.md | `a271ff0827914190054d693c8251fabe10db2de706f099d6a0fb4ca3ed07e91c` |
| query-acceleration/materialized-view/async-materialized-view/overview | versioned_docs/version-4.x/query-acceleration/materialized-view/async-materialized-view/overview.md | `b87f436575b2c82c79b93df29d2a41a0c004721a436b3e4e60e90750a563aa94` |
| query-acceleration/materialized-view/async-materialized-view/functions-and-demands | versioned_docs/version-4.x/query-acceleration/materialized-view/async-materialized-view/functions-and-demands.md | `d74d44cd2f1383811b3d4ebc8e9092a597c16558f953c9ea8956b4c5b5b4f223` |
| query-acceleration/materialized-view/async-materialized-view/use-guide | versioned_docs/version-4.x/query-acceleration/materialized-view/async-materialized-view/use-guide.md | `517383a260e3f808d080e508b4248067c30e36e8f8f69a148ad5cf91e7c6270a` |
| query-acceleration/tuning/tuning-plan/transparent-rewriting-with-async-mv | versioned_docs/version-4.x/query-acceleration/tuning/tuning-plan/transparent-rewriting-with-async-mv.md | `92e43ba2e38ced23186fcaad3e3011bc7ecc63aa2d3c0662a67e471551a99047` |
| query-acceleration/materialized-view/async-materialized-view/faq | versioned_docs/version-4.x/query-acceleration/materialized-view/async-materialized-view/faq.md | `86195192f9d72de69c1d3bbb47f1ff19379cd1e96b11fed9759450445e03d634` |
| query-acceleration/performance-tuning-intro | versioned_docs/version-4.x/query-acceleration/performance-tuning-intro.mdx | `09bd7e1c963e30c0fa148b57dee95fbfbe92e53072175467c6bcfda7ecafaef6` |
| query-acceleration/performance-tuning-overview/tuning-overview | versioned_docs/version-4.x/query-acceleration/performance-tuning-overview/tuning-overview.md | `837f255823ff7f826c6e268c17a59039401bfbd7f5eb62e19e6af3eafbbde811` |
| query-acceleration/performance-tuning-overview/diagnostic-tools | versioned_docs/version-4.x/query-acceleration/performance-tuning-overview/diagnostic-tools.md | `c7c6eb568bb95618afbc315b09c81e1c7c2af446d4d079a5f6404c80264088b1` |
| query-acceleration/performance-tuning-overview/analysis-tools | versioned_docs/version-4.x/query-acceleration/performance-tuning-overview/analysis-tools.md | `46435172727e10414dd4414fa28ef91ae56ddb67a30fdb2178941cb010b1ebd2` |
| query-acceleration/performance-tuning-overview/tuning-process | versioned_docs/version-4.x/query-acceleration/performance-tuning-overview/tuning-process.md | `e565c6f8f0859ed810a626a3a91e32e9d43df976ff590cfd88178c7eb084f6e7` |
| query-acceleration/tuning/tuning-plan/schema-and-index-optimization | versioned_docs/version-4.x/query-acceleration/tuning/tuning-plan/schema-and-index-optimization.mdx | `3b8e8dfb05437d761256cc9900e7957cd20044d054363674bda82fe287f6e090` |
| query-acceleration/tuning/tuning-plan/optimizing-table-schema | versioned_docs/version-4.x/query-acceleration/tuning/tuning-plan/optimizing-table-schema.md | `ff8d9ebe258cb3fa73a7dc65637864a9de986cfb85a18550c31413a0e9972ff3` |
| query-acceleration/tuning/tuning-plan/optimizing-table-index | versioned_docs/version-4.x/query-acceleration/tuning/tuning-plan/optimizing-table-index.md | `e2645b3c98f0a872aeb1e1306247097d44b07c7da82313dc22c97153c40789b0` |
| query-acceleration/tuning/tuning-plan/optimizing-table-scanning | versioned_docs/version-4.x/query-acceleration/tuning/tuning-plan/optimizing-table-scanning.md | `4ad9cfd21122082f64b84972891a12ad031b65e4ba42a65926256626b1cf6b00` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-013

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1335.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| query-acceleration/materialized-view/intro-link | versioned_docs/version-4.x/query-acceleration/materialized-view/intro-link.mdx | `73d1497a03f54536e539d6bc486073f15a6fad1710da0df760715b3eb21082fc` |
| query-acceleration/join-optimization-intro | versioned_docs/version-4.x/query-acceleration/join-optimization-intro.mdx | `8a58110213d8343fff8b037092b8d48134020ee2d6fb9b1681620ed38f13f917` |
| query-acceleration/colocation-join | versioned_docs/version-4.x/query-acceleration/colocation-join.md | `134c5f3373e0a1c44b862a5bbab7e3027449287b982f8ed663b2f06bc3527311` |
| query-acceleration/tuning/tuning-plan/adjusting-join-shuffle | versioned_docs/version-4.x/query-acceleration/tuning/tuning-plan/adjusting-join-shuffle.md | `4cd3c4b1c0898008e2ed6127c5fd9836fa5d05a5e4e3731b7f9954b078fecbe3` |
| query-acceleration/tuning/tuning-plan/reordering-join-with-leading-hint | versioned_docs/version-4.x/query-acceleration/tuning/tuning-plan/reordering-join-with-leading-hint.md | `ff1419cbde6af2dc569afe11d57f82358b0949c72dd72450786696955ef8efa0` |
| query-acceleration/caching-intro | versioned_docs/version-4.x/query-acceleration/caching-intro.mdx | `0f0868d39a9e9e3a3e675930d0d00d095136e3aef983c61ed88315bdf0f7ef64` |
| query-acceleration/sql-cache-manual | versioned_docs/version-4.x/query-acceleration/sql-cache-manual.md | `59f514c081dc12477ef6a0bca9daa8a192dab71f0f4bb5cf45cfdf005cebe2a7` |
| query-acceleration/condition-cache | versioned_docs/version-4.x/query-acceleration/condition-cache.md | `f1e69642757fcee2fdbdafe2869625bda7fab97a8e38850460129f9e5f5f8c39` |
| query-acceleration/tuning/tuning-execution/intro | versioned_docs/version-4.x/query-acceleration/tuning/tuning-execution/intro.mdx | `41f5292ddd4b683851d1d43f29bf5538c972fb71fc774287c389a7fa93824c1b` |
| query-acceleration/tuning/tuning-execution/parallelism-tuning | versioned_docs/version-4.x/query-acceleration/tuning/tuning-execution/parallelism-tuning.md | `e4c18daa8db17510c98fb8c270e64410aa32a8e12cf2922546097d911f76aab9` |
| query-acceleration/tuning/tuning-execution/adjustment-of-runtimefilter-wait-time | versioned_docs/version-4.x/query-acceleration/tuning/tuning-execution/adjustment-of-runtimefilter-wait-time.md | `5d6e5315724171c3d5e8f0156b9d48259d78adacc3435c987bfe86abf397dc66` |
| query-acceleration/tuning/tuning-execution/data-skew-handling | versioned_docs/version-4.x/query-acceleration/tuning/tuning-execution/data-skew-handling.md | `30637ac337f83998e28465426aeb899f67fe04430a12bd89698f12df44e12a48` |
| query-acceleration/tuning/tuning-plan/controlling-hints-with-cbo-rule | versioned_docs/version-4.x/query-acceleration/tuning/tuning-plan/controlling-hints-with-cbo-rule.md | `223d57211fd9494299651b2060c08ba89d7b208a40c7437e864f8c3e858c3c5d` |
| query-acceleration/high-concurrency-intro | versioned_docs/version-4.x/query-acceleration/high-concurrency-intro.mdx | `048d474cbd44da8902877b055ca7c13b1b767875807c92193641776737af86a1` |
| query-acceleration/high-concurrent-point-query | versioned_docs/version-4.x/query-acceleration/high-concurrent-point-query.md | `6c5f067467b59a9c16f8555eeee08e509f3a36facfcce0177eea6583978e069e` |
| query-acceleration/dictionary | versioned_docs/version-4.x/query-acceleration/dictionary.md | `6df3023c9ca855bd36f445ad68a8e78238d17106ff0b0912d46bb63a04d4cffa` |
| query-acceleration/distinct-counts/intro | versioned_docs/version-4.x/query-acceleration/distinct-counts/intro.mdx | `96893486f34c42d91a3509dc06b84dbd82eb646c2a2486f35209464bebd4b064` |
| query-acceleration/distinct-counts/bitmap-precise-deduplication | versioned_docs/version-4.x/query-acceleration/distinct-counts/bitmap-precise-deduplication.md | `1a5c4473d3ec05390e8bf9743ffb9adfe98525f4cf36bce2b3cedc7e24ade3da` |
| query-acceleration/distinct-counts/hll-approximate-deduplication | versioned_docs/version-4.x/query-acceleration/distinct-counts/hll-approximate-deduplication.md | `42b68d52f29bbafd32e07be01c9a914e8a22607403db80f96f1afb329abbdd70` |
| query-acceleration/query-profile | versioned_docs/version-4.x/query-acceleration/query-profile.md | `ac9f6b79f13dda7eb98e1c5478bcb51dbf210b430333372d453099b30d5eef8e` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-014

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1315.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| query-acceleration/tuning/tuning-plan/dml-tuning-plan | versioned_docs/version-4.x/query-acceleration/tuning/tuning-plan/dml-tuning-plan.md | `fc0179ae9a93f5f69c86b7c2f1aae2a80a6c91689a56a7dc83aad2d2cef8dc90` |
| query-acceleration/optimization-technology-principle/query-optimizer | versioned_docs/version-4.x/query-acceleration/optimization-technology-principle/query-optimizer.md | `c6debc8b4b29f3ae2f9847524a2a53328944edff58dd387654c03d7c14ae18b4` |
| query-acceleration/optimization-technology-principle/pipeline-execution-engine | versioned_docs/version-4.x/query-acceleration/optimization-technology-principle/pipeline-execution-engine.md | `264eee7ae0c5d6b13dfe88d3d4ac54119ea226f4eaa13096623d184724b78d76` |
| query-acceleration/optimization-technology-principle/runtime-filter | versioned_docs/version-4.x/query-acceleration/optimization-technology-principle/runtime-filter.md | `22fdcd322fec302531c17e7e37b4184f8990b3110e542ae9162540fe84fd98da` |
| query-acceleration/optimization-technology-principle/topn-optimization | versioned_docs/version-4.x/query-acceleration/optimization-technology-principle/topn-optimization.md | `42b95df505229d91bdf1c66b3e324485566602e3aab688eee22cf30b3041488f` |
| query-acceleration/optimization-technology-principle/statistics | versioned_docs/version-4.x/query-acceleration/optimization-technology-principle/statistics.md | `f143c20019a97bb60c6fd8219f249b88885d94b4ac907bac72c33d5831a6cc14` |
| lakehouse/lakehouse-overview | versioned_docs/version-4.x/lakehouse/lakehouse-overview.md | `7e4410bd769bf4a40ac694878a09f46e24717cfeed8e74ac30ead935d67dbb92` |
| lakehouse/catalog-overview | versioned_docs/version-4.x/lakehouse/catalog-overview.md | `b90d0f3f62af7606c96e3e0e39c2ca10887b39f9c28daebd546b603a6204f00b` |
| lakehouse/catalogs/hive-catalog | versioned_docs/version-4.x/lakehouse/catalogs/hive-catalog.mdx | `cc4256fe8de7528d53437226904f10e1ef9666fc90d06ef23af041bc3a29cd88` |
| lakehouse/catalogs/iceberg-catalog | versioned_docs/version-4.x/lakehouse/catalogs/iceberg-catalog.mdx | `ff83c21d232bcd9a3f33ba4c9c0fdd97cd5e359fd10d35ce024f0ba7959fb08e` |
| lakehouse/best-practices/doris-iceberg | versioned_docs/version-4.x/lakehouse/best-practices/doris-iceberg.md | `25332d82eb124649b01b6ef4f670da32a40b59f60191ce1def3470439cd74775` |
| lakehouse/best-practices/doris-aws-s3tables | versioned_docs/version-4.x/lakehouse/best-practices/doris-aws-s3tables.md | `ff9b6a19eeadf33f02b9a3f616e5d1b6f2117dbe50a726990c47cfd56895c7b7` |
| lakehouse/best-practices/doris-polaris | versioned_docs/version-4.x/lakehouse/best-practices/doris-polaris.md | `9d209d465a3f19b2a3bb7a547587533daec8edb1847202a3f0fafa8e17f207f4` |
| lakehouse/best-practices/doris-gravitino | versioned_docs/version-4.x/lakehouse/best-practices/doris-gravitino.md | `bfd12a3768a39511e5facfc1b39b1bb7c3e90f65dd522da4c6b0a2d6b2691e4a` |
| lakehouse/best-practices/doris-onelake | versioned_docs/version-4.x/lakehouse/best-practices/doris-onelake.md | `a35da61d3f732b24b8a839f1d65cefe77b261040819e5615d8f2d9c99cbb3b36` |
| lakehouse/best-practices/doris-unity-catalog | versioned_docs/version-4.x/lakehouse/best-practices/doris-unity-catalog.md | `1dc3d6523046cd239467676140efc79d246f2ad354faa33fcec7993ab5fba1cf` |
| lakehouse/best-practices/doris-snowflake-catalog | versioned_docs/version-4.x/lakehouse/best-practices/doris-snowflake-catalog.md | `7347ecf695e1e8ba3bb26418d59f49d9ab8379ad657cd2b0bc1882334930fa3b` |
| lakehouse/best-practices/doris-lakekeeper | versioned_docs/version-4.x/lakehouse/best-practices/doris-lakekeeper.md | `1ef0478fe87619aa9e32194b1c9f9b6e922f4eb398edbacc1cdf61ac5d9c3a6d` |
| lakehouse/best-practices/doris-seaweedfs | versioned_docs/version-4.x/lakehouse/best-practices/doris-seaweedfs.md | `de2445d11d476bce769a818eb61b388463361b835199d4d4fdcb26e7eb0b465c` |
| lakehouse/best-practices/doris-nessie | versioned_docs/version-4.x/lakehouse/best-practices/doris-nessie.md | `ea0ca2b7fd780eeea6eefa749ba4e62f5e25d281eb7dc2fa42a9c0c85bb181d7` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-015

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1295.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| lakehouse/best-practices/doris-dlf-iceberg | versioned_docs/version-4.x/lakehouse/best-practices/doris-dlf-iceberg.md | `fed4821ef70d0e5f9021f5c91207a2451268e06dfede2656400f0a87e743704e` |
| lakehouse/catalogs/lance-catalog | versioned_docs/version-4.x/lakehouse/catalogs/lance-catalog.mdx | `2fbaef9c184a0494b7c0a7c1bacd1dbf22f9999260b774e71cd46c75fef47b44` |
| lakehouse/catalogs/paimon-catalog | versioned_docs/version-4.x/lakehouse/catalogs/paimon-catalog.mdx | `0a264f1ca1329e164de8df975f3e0fa4bc458a845ff3830da9e596e38dfa11c8` |
| lakehouse/best-practices/doris-paimon | versioned_docs/version-4.x/lakehouse/best-practices/doris-paimon.md | `12f87ffc4be2ee4d9c1b3dfd14214fcd6d9f19ed1e9529867de08dd65da04142` |
| lakehouse/best-practices/doris-dlf-paimon | versioned_docs/version-4.x/lakehouse/best-practices/doris-dlf-paimon.md | `07fccf98ed655cbdeea3d065c9b6e63f428bc610019eda64346890fca3657736` |
| lakehouse/catalogs/hudi-catalog | versioned_docs/version-4.x/lakehouse/catalogs/hudi-catalog.md | `41371fdf9ad2becd5d100792efc6b3556eecbc3cc508c36181c690456fa41d09` |
| lakehouse/best-practices/doris-hudi | versioned_docs/version-4.x/lakehouse/best-practices/doris-hudi.md | `8880a294e357497d667a5eddc6e8e6ecc251a4a4436de28060ded6970f383449` |
| lakehouse/catalogs/maxcompute-catalog | versioned_docs/version-4.x/lakehouse/catalogs/maxcompute-catalog.md | `4235105182809ad99d5494c2270de52c27ed9b2057c434a5e6841068c945397c` |
| lakehouse/best-practices/doris-maxcompute | versioned_docs/version-4.x/lakehouse/best-practices/doris-maxcompute.md | `fc10288f13cfb3584d96da1e727032497995d7c2c5bbd47c3efe4b5d7ed7a687` |
| lakehouse/catalogs/delta-lake-catalog | versioned_docs/version-4.x/lakehouse/catalogs/delta-lake-catalog.md | `ef36159a43b8afe8e22234f85cbb4c72d09037236b54caf0a78756e4d913af12` |
| lakehouse/catalogs/bigquery-catalog | versioned_docs/version-4.x/lakehouse/catalogs/bigquery-catalog.md | `1335118b58ba841b70db9e30cc29f78dd403bf9836da1381a692feeafb8ce848` |
| lakehouse/catalogs/kudu-catalog | versioned_docs/version-4.x/lakehouse/catalogs/kudu-catalog.md | `5a6925159b62ef92b7029c8ea6740a8c627f23f68e3b24aa72ea8aa749248390` |
| lakehouse/catalogs/kafka-catalog | versioned_docs/version-4.x/lakehouse/catalogs/kafka-catalog.md | `6d2e02d9d0849d016e7ec0f7cbb75200a060e118ecd405d28e63a3c7a13319ae` |
| lakehouse/catalogs/es-catalog | versioned_docs/version-4.x/lakehouse/catalogs/es-catalog.md | `75b3ff0fc8ed8bfc79c972598022a4449beb323cd75336e74eff18951336e189` |
| lakehouse/catalogs/doris-catalog | versioned_docs/version-4.x/lakehouse/catalogs/doris-catalog.mdx | `fa8649cc26d1a79f193a79d02d1d107efd14c0dd2564f764833637cf8a3bc577` |
| lakehouse/catalogs/jdbc-catalog-overview | versioned_docs/version-4.x/lakehouse/catalogs/jdbc-catalog-overview.md | `1067d4e4060e5203cf362fbbd0a8dbba9e471500db9facfb854afaadffe98e51` |
| lakehouse/catalogs/jdbc-mysql-catalog | versioned_docs/version-4.x/lakehouse/catalogs/jdbc-mysql-catalog.md | `2e953ecf983aefbf0958e5cd372daa0948d50134c54968a32131d5a185e017a1` |
| lakehouse/catalogs/jdbc-pg-catalog | versioned_docs/version-4.x/lakehouse/catalogs/jdbc-pg-catalog.md | `4aeaaac0be3b07633a2d3ba18dc8568873b98bef994ad93a8d70259f63e0e5d0` |
| lakehouse/catalogs/jdbc-oracle-catalog | versioned_docs/version-4.x/lakehouse/catalogs/jdbc-oracle-catalog.md | `8fe00fede5978e5c6d2da8129bc7e14fd362066adbb57d32c121d5edb522cade` |
| lakehouse/catalogs/jdbc-sqlserver-catalog | versioned_docs/version-4.x/lakehouse/catalogs/jdbc-sqlserver-catalog.md | `e4f2c79061892cd0d5cc98abe1cb7bcf1f0151d7e5b5db1d54fe888e6434367a` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-016

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1275.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| lakehouse/catalogs/jdbc-ibmdb2-catalog | versioned_docs/version-4.x/lakehouse/catalogs/jdbc-ibmdb2-catalog.md | `7b5b77e1670474399eff58ff75558f48e09361e4f96ced6972915a278fd6e514` |
| lakehouse/catalogs/jdbc-clickhouse-catalog | versioned_docs/version-4.x/lakehouse/catalogs/jdbc-clickhouse-catalog.md | `12c97d003a8353749d368771af3497e0ba840b14dc50009fce21729aa136e61a` |
| lakehouse/catalogs/jdbc-saphana-catalog | versioned_docs/version-4.x/lakehouse/catalogs/jdbc-saphana-catalog.md | `6b220ebb17d2cab83644d4937c3591457886cc10a3c854cdb034ff5e9d585a7f` |
| lakehouse/catalogs/jdbc-oceanbase-catalog | versioned_docs/version-4.x/lakehouse/catalogs/jdbc-oceanbase-catalog.md | `de6f8fbc51673e5154e5d489571df1bd2a8ea81bd91dd162fc859d8bd0d1b99f` |
| lakehouse/file-analysis | versioned_docs/version-4.x/lakehouse/file-analysis.md | `7d8cb370d1895a05f7610a75938e02a841ec52b5833d3c4d469d1858af46d42e` |
| lakehouse/huggingface | versioned_docs/version-4.x/lakehouse/huggingface.md | `cf59a85bfb12b0cb975ebbe065d0f53b3c5298398c2088188b643b9d4c6d0391` |
| lakehouse/metastores/hive-metastore | versioned_docs/version-4.x/lakehouse/metastores/hive-metastore.md | `a88df59c31f7e5b71b00c36eb4d54830ad477322c65f0422bcd06ad0ee80d07f` |
| lakehouse/metastores/aws-glue | versioned_docs/version-4.x/lakehouse/metastores/aws-glue.md | `9d924ec1171547e0004bd14b429b35ec48ff95f014bf5b0fd26a0fa2366c2f3a` |
| lakehouse/metastores/google-dataproc-metastore | versioned_docs/version-4.x/lakehouse/metastores/google-dataproc-metastore.md | `0da7ef56ce473752b70a177c38c3890b8ec23f6ccce1976fa742a3196698e4f0` |
| lakehouse/metastores/aliyun-dlf | versioned_docs/version-4.x/lakehouse/metastores/aliyun-dlf.md | `6f6310aa02ff8eaea187abd55173551fdd296c2eb80b3d44bf51c7307e47b48f` |
| lakehouse/metastores/iceberg-rest | versioned_docs/version-4.x/lakehouse/metastores/iceberg-rest.md | `3157eeb1d90e5511d8fed90b75354f54a1eeb674c008347052778117872fc6cb` |
| lakehouse/metastores/iceberg-jdbc | versioned_docs/version-4.x/lakehouse/metastores/iceberg-jdbc.md | `8c2b202a71f6a4e91b1eddf872606abdbe650770a9e7fb624729e72429b6078e` |
| lakehouse/metastores/paimon-jdbc | versioned_docs/version-4.x/lakehouse/metastores/paimon-jdbc.md | `ad904b9ffc2e3cd3a0582d20bba881e67c293a7e9d1cdcd7137f3e2507c82f6c` |
| lakehouse/metastores/filesystem | versioned_docs/version-4.x/lakehouse/metastores/filesystem.md | `cc498b604120a5086b7e067000848c936017431aca39479f02f14693426152ce` |
| lakehouse/storages/hdfs | versioned_docs/version-4.x/lakehouse/storages/hdfs.md | `49fc36f58407bbe35fdf2ea00b5b5edd32411ffcc8999043457298ecc7f09e02` |
| lakehouse/storages/s3 | versioned_docs/version-4.x/lakehouse/storages/s3.md | `d17d29d2a613259b00b747ec721158240cb6c6ea90d0d67c3a971d99988dbb6a` |
| lakehouse/storages/azure-blob | versioned_docs/version-4.x/lakehouse/storages/azure-blob.md | `2dda2db8a8809e66901a8793d3d7b02b43d7319b2f661cbe4e517b6085e36356` |
| lakehouse/storages/gcs | versioned_docs/version-4.x/lakehouse/storages/gcs.md | `1fa09b9f5d79e8a5655418ea930e234032aec031399fd1250c4e6d5049496699` |
| lakehouse/storages/aliyun-oss | versioned_docs/version-4.x/lakehouse/storages/aliyun-oss.md | `149d9afba2be5de5f69f6d53531cb522bc15651691d9d7a04dfb2f8bba456327` |
| lakehouse/storages/tencent-cos | versioned_docs/version-4.x/lakehouse/storages/tencent-cos.md | `e3fdb0333784205ce12a4103c1c5e89a43f6cfff45c92f7b0eb536e63c0f4fb7` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-017

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1255.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| lakehouse/storages/huawei-obs | versioned_docs/version-4.x/lakehouse/storages/huawei-obs.md | `e425f6f43b19c06fdd53521cda8c75a064384ac4602aa6d888711c2c97c78930` |
| lakehouse/storages/baidu-bos | versioned_docs/version-4.x/lakehouse/storages/baidu-bos.md | `62b940936921555629f51521a168ab2a914abe30d8d89b6820e74657c0651fe7` |
| lakehouse/storages/seaweedfs | versioned_docs/version-4.x/lakehouse/storages/seaweedfs.md | `98efaa96c8000e100762f99bd87e15fd8419ef85dc46166f0c34518468e1b868` |
| lakehouse/storages/minio | versioned_docs/version-4.x/lakehouse/storages/minio.md | `a786a8f80095dd2871cc6eb70f16360f44302f58386cc164c4ab3efef6a85be5` |
| lakehouse/storages/juicefs | versioned_docs/version-4.x/lakehouse/storages/juicefs.md | `fb2c69dc58ea2fa8814ecdf996502fa6b5bc345329d98b7e7835ee2bae8880a3` |
| lakehouse/storages/ozone | versioned_docs/version-4.x/lakehouse/storages/ozone.md | `b39d091c3635b5ca793809a46f4472a510f07aad8e519cec94e394addcac5bd3` |
| lakehouse/file-formats/parquet | versioned_docs/version-4.x/lakehouse/file-formats/parquet.md | `69280e4466fc77ff46da2330aa432b37b0e4cfa86a82f75b79315841eea27cb7` |
| lakehouse/file-formats/orc | versioned_docs/version-4.x/lakehouse/file-formats/orc.md | `dd1006f0eda76e64c0e8e9148261338447c93a62ab77938fc25123212d350aeb` |
| lakehouse/file-formats/text | versioned_docs/version-4.x/lakehouse/file-formats/text.md | `fb9dd260afbd0ab5f28f1e3f13504818b297b25296fed743c0f87b7a06d9f9b3` |
| lakehouse/file-formats/lance | versioned_docs/version-4.x/lakehouse/file-formats/lance.md | `82cbc465d87e877327c56f28493068253b286724a7379cb0423f95b1c0109543` |
| lakehouse/data-cache | versioned_docs/version-4.x/lakehouse/data-cache.md | `0a99866a53017a4dcd4ea64d56e7d24f886e0568ae36dd4cd51c7060f77b0c97` |
| lakehouse/meta-cache | versioned_docs/version-4.x/lakehouse/meta-cache.md | `e4792402d6e53b8bcd9bdaa60576a49b11b31e28aee759b8753ebc02e3d935e4` |
| lakehouse/external-meta-cache-memory-management | versioned_docs/version-4.x/lakehouse/external-meta-cache-memory-management.md | `72597ce4562d915ddd39e56fe82e053732f278d40652c4cdd3d52eaa190dc8eb` |
| lakehouse/compute-node | versioned_docs/version-4.x/lakehouse/compute-node.md | `4bd3ea41d63132bf7d7f2199682cc80bf2675dfb7847e1b0d9b1883a60949e79` |
| lakehouse/statistics | versioned_docs/version-4.x/lakehouse/statistics.md | `ec30c737a92c9263279a76c9f919b39ff23fd569cb5e370e1a5a2750f2e84fd1` |
| lakehouse/best-practices/optimization | versioned_docs/version-4.x/lakehouse/best-practices/optimization.md | `2afffb6c3ee662b29e415c94773434b349f1b3b419b987d60a0af4453aeaa250` |
| lakehouse/best-practices/doris-lance | versioned_docs/version-4.x/lakehouse/best-practices/doris-lance.mdx | `9b29ba78a6a89be5f1eb86e73c300231f9472e7c0d55bba8d5cf6ab22bca1fb4` |
| lakehouse/best-practices/lance-hybrid-search | versioned_docs/version-4.x/lakehouse/best-practices/lance-hybrid-search.mdx | `950968b91fd4d61cd494e6ca06b097eb2b4166f1c9b2082dafdf788c04274d39` |
| lakehouse/best-practices/kerberos | versioned_docs/version-4.x/lakehouse/best-practices/kerberos.md | `3cf272cc91a73588ffe34998c9de5c37d78637b5659e1e343faea38c78ff432b` |
| lakehouse/best-practices/tpch | versioned_docs/version-4.x/lakehouse/best-practices/tpch.md | `01f110c83b5757a16d095ff711d4edacbbfc57d88f7437ee95711c113b34e8cf` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-018

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1235.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| lakehouse/best-practices/tpcds | versioned_docs/version-4.x/lakehouse/best-practices/tpcds.md | `905fcfe2d3ddd755a336e3eb52a6f5827a954be0f5ce9956a29f6a6ba7adda0a` |
| data-governance/data-lineage | versioned_docs/version-4.x/data-governance/data-lineage.md | `0498916655be833d827d325d0e152e4b1ab6ec3373948b962fd6dea05dc0e038` |
| ai/ai-overview | versioned_docs/version-4.x/ai/ai-overview.md | `4d23ee7a42bd450ef6c46f0a8f91f0905e513909c5a7145020ea8082d4d6f360` |
| ai/ai-function-overview | versioned_docs/version-4.x/ai/ai-function-overview.md | `5cbcf71720c2c5ae0b4502f3a3fb3e99e1d40a044838470024cb3149cce6e100` |
| observability/intro | versioned_docs/version-4.x/observability/intro.mdx | `5333aa7bff9666ff1a7f23bf6bc310342f5ea9f9f378986eb0b61654d2188b7a` |
| observability/dogstack/overview | versioned_docs/version-4.x/observability/dogstack/overview.md | `6f12cd64cd1350beceda5c063800a13d340b43efcc7579fddc1261d2aa7cf3bf` |
| observability/dogstack/quickstart | versioned_docs/version-4.x/observability/dogstack/quickstart.md | `9ce961037a59a9e026b015fdde260d6c7a54c7041f6f429750f09baf2d99d3e0` |
| observability/dogstack/deployment | versioned_docs/version-4.x/observability/dogstack/deployment.md | `7c72b8b674facd0f761c66a021af0cc037f56043f20cf2fc42bac9021aca0dd8` |
| observability/dogstack/search | versioned_docs/version-4.x/observability/dogstack/search.md | `8ec1a30970ab94883c55836aff861cbd338f234b3ab22e77c601c0525b4ceb7f` |
| observability/dogstack/trace | versioned_docs/version-4.x/observability/dogstack/trace.md | `354c103f8cd1bdbacee303972cab04f2453369957f3713f30663b4271e31883b` |
| observability/dogstack/dashboard | versioned_docs/version-4.x/observability/dogstack/dashboard.md | `6be236221c87fc5cbd27d5d6c1b7128fa3ea085c42dedbe3d5ee47d0e83a8bbf` |
| observability/dogstack/alert | versioned_docs/version-4.x/observability/dogstack/alert.md | `9dc4f3b9f999bd9c97a8d7452f2e8355bde83c32a49d2ced4367138874ff59c5` |
| observability/overview | versioned_docs/version-4.x/observability/overview.mdx | `008cf7014ce6cfa03e1225a11ed2a2d546958472085a17611fd67f0303a41aab` |
| observability/log | versioned_docs/version-4.x/observability/log.md | `76932378bc5d338825ea7d3a4264426095656f2a6f14f0f95de15f9de99b0047` |
| observability/trace | versioned_docs/version-4.x/observability/trace.md | `faa116c4dc9343bf4a4dc81df1806cb510a9759e5aaa82c6604077c0384b9a1f` |
| admin-manual/cluster-management/intro | versioned_docs/version-4.x/admin-manual/cluster-management/intro.mdx | `d0d82e16cab529bd2bc4c60fe18470405354c662e900ce5f90177ccecd8885db` |
| admin-manual/cluster-management/upgrade | versioned_docs/version-4.x/admin-manual/cluster-management/upgrade.md | `0b9a9775852463c448e6e5b8057d436a91d21f34f4ad2bc9307105a2f3527e96` |
| admin-manual/cluster-management/elastic-expansion | versioned_docs/version-4.x/admin-manual/cluster-management/elastic-expansion.md | `4ee93bb676416316b0f5e9a627f3f1d8b1643206f29f078480dfa5ac4ffbc93e` |
| admin-manual/cluster-management/load-balancing | versioned_docs/version-4.x/admin-manual/cluster-management/load-balancing.md | `486f80a5da5e2d73ab7d357dcd8113ec8c0ef12f971aefe41d4ec0a281d9bbb4` |
| admin-manual/cluster-management/fqdn | versioned_docs/version-4.x/admin-manual/cluster-management/fqdn.md | `7d4ab23543024ceac15b7899c1ef5c029560cd05e4c0c740fe9c56ae49e13c1b` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-019

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1215.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| admin-manual/maint-monitor/automatic-service-start | versioned_docs/version-4.x/admin-manual/maint-monitor/automatic-service-start.md | `6fc335287cad909f2b65a7b0b4e1792ef06df9d5507975af1c39198c6eefea36` |
| admin-manual/maint-monitor/tablet-repair-and-balance | versioned_docs/version-4.x/admin-manual/maint-monitor/tablet-repair-and-balance.md | `de3e9de84ba9a5fce923ab808e38a755ac32091da4ec9d0ff3d1d35eb25780e7` |
| admin-manual/config/config-dir | versioned_docs/version-4.x/admin-manual/config/config-dir.md | `25fe24acdc2ad518e53ce80d853c693b370640634244fb6bf0e6f5e61656462a` |
| admin-manual/config/fe-config | versioned_docs/version-4.x/admin-manual/config/fe-config.md | `eaab0a984ba90e06633299ef38d9e90404d719f005a545b537b706c20ea2b32b` |
| admin-manual/config/be-config | versioned_docs/version-4.x/admin-manual/config/be-config.md | `dfb19a391c020dacdc6c71bdfadb6b6974d5dd1d79b022a4c827ea972b0b991f` |
| admin-manual/config/user-property | versioned_docs/version-4.x/admin-manual/config/user-property.md | `caf59cf1e334c6b0a965a6f16f7a2eca4f4570441f14c32aec888f227b3bc0b4` |
| admin-manual/cluster-management/time-zone | versioned_docs/version-4.x/admin-manual/cluster-management/time-zone.md | `11aba19a318141afa7e2a3a4025ae3f8861dd32a7ec771d6f4778e4d2eb1e96f` |
| admin-manual/auth/security-overview | versioned_docs/version-4.x/admin-manual/auth/security-overview.md | `53f866ba350869eec3d9e85ebc4d03cdfe3b16a50455ecffe63a448bb82c332a` |
| admin-manual/auth/authentication/internal | versioned_docs/version-4.x/admin-manual/auth/authentication/internal.md | `3121dc26e0f59386c7bfacbfa7149e54def6ebc38047c72ff8972e68da5f4c40` |
| admin-manual/auth/authentication/ldap | versioned_docs/version-4.x/admin-manual/auth/authentication/ldap.md | `a21febd795c9269f97523e47da3618890e3329a1c44c996685be8f5f0deb0b92` |
| admin-manual/auth/authorization/internal | versioned_docs/version-4.x/admin-manual/auth/authorization/internal.md | `016913a97a1ff76324524542eba9c1286dd0acc3cb8165094cf6807de13ae12c` |
| admin-manual/auth/authorization/ranger | versioned_docs/version-4.x/admin-manual/auth/authorization/ranger.md | `edc920bd4a6a15e8575f2f3f40efd5e2771dd50caff194ec908ce13da35e210a` |
| admin-manual/auth/authorization/ranger-hive | versioned_docs/version-4.x/admin-manual/auth/authorization/ranger-hive.md | `8d621e57b734f7eb8aad8bed61410936614243190f0d4d4714f57f57135b25a6` |
| admin-manual/auth/authorization/data | versioned_docs/version-4.x/admin-manual/auth/authorization/data.md | `448714b09c24123c8fb8cfbc617ed2f11da970b272c67643ce4903741a552dfa` |
| admin-manual/audit-plugin | versioned_docs/version-4.x/admin-manual/audit-plugin.md | `074ae9416f22a99ff602305ddbf4c4bb3f22be34088918377e43b4f035cce6ee` |
| admin-manual/auth/certificate | versioned_docs/version-4.x/admin-manual/auth/certificate.md | `efbfc5df855603b3fb9c93c65fa16dfab974c63a71d763c4f755a0b143532e59` |
| admin-manual/auth/fe-certificate | versioned_docs/version-4.x/admin-manual/auth/fe-certificate.md | `d5bf68e5f09c16df7c00dc8ec94e31fdfc42726f32249bca2ad61e6f0bcfc41d` |
| admin-manual/auth/encryption-function | versioned_docs/version-4.x/admin-manual/auth/encryption-function.md | `bc2c2bc281b0eee3fbfbc307e7e04eac10e9d11961577300eb567fad40f7697a` |
| admin-manual/auth/integrations/aws-authentication-and-authorization | versioned_docs/version-4.x/admin-manual/auth/integrations/aws-authentication-and-authorization.md | `c8164e0662b9952b58da4a78af3acd7ba8b33163cb42eb71a19ddb3ed5d4125e` |
| admin-manual/auth/integrations/aws-iam-role | versioned_docs/version-4.x/admin-manual/auth/integrations/aws-iam-role.md | `5fa2e37e21fc665b36e342c9eb1b7f4483f9d0b7e37df9af5d372e32cbea3bc8` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-020

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1195.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| admin-manual/workload-management/workload-management-summary | versioned_docs/version-4.x/admin-manual/workload-management/workload-management-summary.md | `953bef6c894202a558838e55f42dc8986482294f1579778c6e679afdea9091da` |
| admin-manual/workload-management/resource-isolation-intro | versioned_docs/version-4.x/admin-manual/workload-management/resource-isolation-intro.mdx | `65184792d602bf40261062ffe8f01b108e2e6738d0a895235b6125bca502fcee` |
| admin-manual/workload-management/resource-group | versioned_docs/version-4.x/admin-manual/workload-management/resource-group.md | `996562bcf5094fa091ec1d1865d6ed6c2a829ff32991913cc80a82f64d2a3246` |
| admin-manual/workload-management/compute-group | versioned_docs/version-4.x/admin-manual/workload-management/compute-group.md | `4e4b8edb0ebc33a6db9734a33deb0319b5c6a0d6a3e0ca4f1a5b03922884e6ae` |
| admin-manual/workload-management/workload-group | versioned_docs/version-4.x/admin-manual/workload-management/workload-group.md | `9e20883d8e25f43f3a374f5abf59a7e4874f9f2bd23895f87e6f480e45c2be94` |
| admin-manual/workload-management/workload-group-bind-compute-group | versioned_docs/version-4.x/admin-manual/workload-management/workload-group-bind-compute-group.md | `0259a3550cd29d03bfd37912b27268d7d04383f1b216cfe9628b87a28b793734` |
| admin-manual/workload-management/concurrency-control-and-queuing | versioned_docs/version-4.x/admin-manual/workload-management/concurrency-control-and-queuing.md | `927cc4f64a4058e980bcaaa029a4914f2344180eac27c7d548512709f2cd16e0` |
| admin-manual/workload-management/spill-disk | versioned_docs/version-4.x/admin-manual/workload-management/spill-disk.md | `0421aca6f76dd39a7c3fa6164bccd308c27a6d6d5c147b5f74dbddc443fba593` |
| admin-manual/workload-management/sql-blocking | versioned_docs/version-4.x/admin-manual/workload-management/sql-blocking.md | `eb3f4ae8106d14d8bc2376293fefbb87a76a0d4d3aece7326330ad541fb64da6` |
| admin-manual/workload-management/kill-query | versioned_docs/version-4.x/admin-manual/workload-management/kill-query.md | `b6b3b1a9aff6fb27f6e269cb59f1041b7347209da608c9c9cb2bf570086eca23` |
| admin-manual/workload-management/query-progress-monitor | versioned_docs/version-4.x/admin-manual/workload-management/query-progress-monitor.md | `8a0481f9b2988c16a8e3730b309fc76e82cabc1bbfdf66c0ee477548cc264563` |
| admin-manual/workload-management/analysis-diagnosis | versioned_docs/version-4.x/admin-manual/workload-management/analysis-diagnosis.md | `592e609505451698c8040d3d946e5bb4b2ae215d2a56572bfb99f20401ebe0db` |
| admin-manual/workload-management/job-scheduler | versioned_docs/version-4.x/admin-manual/workload-management/job-scheduler.md | `3b700dc993a19acbdf63305103a049b2ee51f9279a42a192f39cc99273db44d9` |
| admin-manual/data-admin/overview | versioned_docs/version-4.x/admin-manual/data-admin/overview.md | `b578f5d0182d44fd20dc455d8f81de30c3c877138cc70df5b760e65037cef40b` |
| admin-manual/data-admin/backup-restore/overview | versioned_docs/version-4.x/admin-manual/data-admin/backup-restore/overview.md | `049f27035b6899b9af38a16d3e29e83f24670e5c85b3f229453217d80efb136d` |
| admin-manual/data-admin/backup-restore/backup | versioned_docs/version-4.x/admin-manual/data-admin/backup-restore/backup.md | `965e9af739e135d45b5a82b375265f04685519410cf1d381b10a3eb283ad30e2` |
| admin-manual/data-admin/backup-restore/restore | versioned_docs/version-4.x/admin-manual/data-admin/backup-restore/restore.md | `b67b5cd8429b5203d07cafa23accccfeeada32b24d666e4e5ddd6206e3a3825c` |
| admin-manual/data-admin/recyclebin | versioned_docs/version-4.x/admin-manual/data-admin/recyclebin.md | `0912f1bf0757783bef17805c35315d4ac4358e1b75909229a4c5862e0f35a857` |
| admin-manual/maint-monitor/monitor-alert | versioned_docs/version-4.x/admin-manual/maint-monitor/monitor-alert.md | `7ab6f3c72465c8b364418a5388b4873d2dccf817daf265142d14777c71491ac3` |
| admin-manual/maint-monitor/metrics | versioned_docs/version-4.x/admin-manual/maint-monitor/metrics.md | `b98bce4c2099e4c60ab37fb3326da083488394ddac018f3efd54f8a3691ee668` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-021

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1175.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| admin-manual/maint-monitor/disk-capacity | versioned_docs/version-4.x/admin-manual/maint-monitor/disk-capacity.md | `1c87f65dd60bd8b53f73b5c7a7cc8a834c186490bba8891cb1740226a57b7081` |
| admin-manual/log-management/intro | versioned_docs/version-4.x/admin-manual/log-management/intro.mdx | `9ea46af7a5ae4c57f302126815e88ac6d735d3cf013d5965b9bded6d6385f329` |
| admin-manual/log-management/fe-log | versioned_docs/version-4.x/admin-manual/log-management/fe-log.md | `644da2ff342ed74713935a54f2521fd99a96e77acedb586f5adf892eae84d7e8` |
| admin-manual/log-management/be-log | versioned_docs/version-4.x/admin-manual/log-management/be-log.md | `b9608fc81b4da8d5e843a0b8523057f0ad6df1aca6c3578266d284e35e5e44fc` |
| admin-manual/system-tables/overview | versioned_docs/version-4.x/admin-manual/system-tables/overview.md | `98173d751fb746af9a9a50f900eec54041c8321b88f847d9cf03ab84653f791a` |
| admin-manual/system-tables/information_schema/active_queries | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/active_queries.md | `300618949cfd3b6a0f9b1c99d9add1549d683f6951ade0a5bf3bf96394334ccb` |
| admin-manual/system-tables/information_schema/backend_active_tasks | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/backend_active_tasks.md | `7a3af538b3dd6b4e4fded87b5afd39c4eab42a1393a4808a0babc745a32616db` |
| admin-manual/system-tables/information_schema/backend_configuration | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/backend_configuration.md | `766e3eaa2ab507935f41ec4938476f53944a47b739b933844f87a7405261cdbe` |
| admin-manual/system-tables/information_schema/backend_tablets | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/backend_tablets.md | `1b28d6c2e020ac13887ab386936513e90bf867379230cda9b4447bee26bb7055` |
| admin-manual/system-tables/information_schema/catalog_meta_cache_statistics | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md | `d1323fc3185f94c06f39bd2b760926fb2bda186568f8bf93e77c4a09a003fd2f` |
| admin-manual/system-tables/information_schema/character_sets | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/character_sets.md | `e711baf27dcbec7d103bf7d70b50ec22cf4d0dd7e548354bbf6354ff29976358` |
| admin-manual/system-tables/information_schema/collations | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/collations.md | `7fe75479ba4baa368ca95eab1036a0f34c23da8836f442673090d165a62cf613` |
| admin-manual/system-tables/information_schema/column_privileges | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/column_privileges.md | `4cbb194470bade032177c97b515fd8f77757a506aec37ace3fb29c4a5f61decc` |
| admin-manual/system-tables/information_schema/column_statistics | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/column_statistics.md | `e733707b4cdc11fe7fd1115aa1ba8841cf5354134bdb88a1d9aab87d6f05ad53` |
| admin-manual/system-tables/information_schema/columns | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/columns.md | `a992603739ba4f15d1fbaf58a68ab7e8057a16b213af7917a53675ffe440ee74` |
| admin-manual/system-tables/information_schema/engines | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/engines.md | `a9eb75da7619acf1ad059d43054167de1bf1f8b66ac6b726ee62799a82a0e738` |
| admin-manual/system-tables/information_schema/events | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/events.md | `10a4ce643564e582d84937aa2edc61a9b47811505569dbb9b68b85747b1bc76b` |
| admin-manual/system-tables/information_schema/file_cache_info | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/file_cache_info.md | `5da6b1aeb0c62eba993bec6b3d5c00aa145debffcd22a69ce6b6044d58aa3df7` |
| admin-manual/system-tables/information_schema/file_cache_statistics | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/file_cache_statistics.md | `9147f2c8b8c57d62a0b7ce91c9424b23c390d64e891b47e840de9d5d8881f8bb` |
| admin-manual/system-tables/information_schema/files | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/files.md | `ba0597b43d351919e907feca08f4b6aeeca6361d12d60a69a037997cda13736e` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-022

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1155.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| admin-manual/system-tables/information_schema/global_variables | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/global_variables.md | `a7b0a0231a90b197603d663b4b5f88bc211b62023e98bab5f87d28f313af611b` |
| admin-manual/system-tables/information_schema/key_column_usage | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/key_column_usage.md | `374049816a5bea26244d582206a2bd65d992c7f3a54c5f820e118f8e627f56ab` |
| admin-manual/system-tables/information_schema/metadata_name_ids | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/metadata_name_ids.md | `82b4472a984fe9abe8eff6e4f33bf107df41f4701059117a77e6b436b2e9dace` |
| admin-manual/system-tables/information_schema/parameters | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/parameters.md | `7d9c55d6563551b302c3358bca3c20012826d1ddade82f4432ac0cc6ecd78e7d` |
| admin-manual/system-tables/information_schema/partitions | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/partitions.md | `5606cf9ee8db088beae428cf913c717d8ad21612a90c039b594298242e5bbe93` |
| admin-manual/system-tables/information_schema/processlist | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/processlist.md | `5e8fe61b2a336af9dc90facdecfe3fa4c4124243b57e859236a4a2b0d2615cee` |
| admin-manual/system-tables/information_schema/profiling | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/profiling.md | `8392f48b13cdfc8c87f37711ea73cf5050e4cf4621d742b04b67e850e04ada61` |
| admin-manual/system-tables/information_schema/referential_constraints | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/referential_constraints.md | `a44ff39cf267e07b28187f5675f6772581820448a6938a7289d690e7ef0184fb` |
| admin-manual/system-tables/information_schema/routines | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/routines.md | `84d4e47f17d401a03553caa68801ac7c31de1662a940760d86050638434258be` |
| admin-manual/system-tables/information_schema/routine_load_job | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/routine_load_job.md | `11614db21ede2b1b17bc6109e0b1727786b195fe111fdbca136cb8736e87df72` |
| admin-manual/system-tables/information_schema/rowsets | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/rowsets.md | `c192f32120aebff19386de4e80cbea2eab8da83a5a511213910ac0a47eed0e6d` |
| admin-manual/system-tables/information_schema/schema_privileges | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/schema_privileges.md | `f6f631e59af54760c73ab29958517ab3dc420805abeadac85de6b5fbe3621fae` |
| admin-manual/system-tables/information_schema/schemata | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/schemata.md | `9d16b4ee2036ca78bfff400e9d2acc8b95f518b671cbaedaf2bc3eaca2d48b8e` |
| admin-manual/system-tables/information_schema/session_variables | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/session_variables.md | `be01f743edd85ba8d914f3d96773d85d7ec43c5508ddba3448cdc95e445bd895` |
| admin-manual/system-tables/information_schema/statistics | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/statistics.md | `c9e78d2f5b5f2c8097d35686f7f73d10a7f7f23b822316947dd45f57d723e888` |
| admin-manual/system-tables/information_schema/table_constraints | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/table_constraints.md | `506c02bc053ccf85b9a7358d7f0638d2f8afd7263511d0da03a65a124f85a618` |
| admin-manual/system-tables/information_schema/table_options | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/table_options.md | `98ec6a2e09a131710cd659890dffe1cfd1066bb0752707474714cbd9fe2d30ed` |
| admin-manual/system-tables/information_schema/table_privileges | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/table_privileges.md | `e63cabda83de46ef945edf8a887ebf6b8289c6be6d0101621e9685e4256de5de` |
| admin-manual/system-tables/information_schema/table_properties | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/table_properties.md | `3a1336aaf3e8b7223336621284b0f56ec73e718b0ea234d24ec1db911797dc96` |
| admin-manual/system-tables/information_schema/tables | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/tables.md | `d1cae8b064259c0e29453408dcdd6241480dca80ae7d8fa486bebafddadc8417` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-023

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1135.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| admin-manual/system-tables/information_schema/triggers | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/triggers.md | `8c869c939c63d9ea1f43f1b990fe4fd5a62addc648bc6ef9816098cdb905f3a0` |
| admin-manual/system-tables/information_schema/user_privileges | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/user_privileges.md | `d565993e94b1b47546cc7ea9f8b08dd2b62b6e2e00f5c685d6d9d6d9cd1dfa87` |
| admin-manual/system-tables/information_schema/views | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/views.md | `9661be2edcd4ae6de9473d3c9192c698f5054fd1aa142bb4a50f2e4d450e2b3b` |
| admin-manual/system-tables/information_schema/workload_group_privileges | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/workload_group_privileges.md | `3798073ea3f1fceeed95ab1bf24695de95d4d854e28832ad3808ac47fc3c75b8` |
| admin-manual/system-tables/information_schema/workload_group_resource_usage | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/workload_group_resource_usage.md | `ee7f38f17c86931071bed53c54f9fb114701388eec6a47c51b71a3fffb778528` |
| admin-manual/system-tables/information_schema/workload_groups | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/workload_groups.md | `ccdaaca957c7171570744b5b569c5b7316888ef6584bbe645485afa7e94864d9` |
| admin-manual/system-tables/information_schema/workload_policy | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/workload_policy.md | `fa6d2c060bfdd35f1ef43c768e7b7e5e4d7ff4e9e8c865fd4e67aba2ca1ca153` |
| admin-manual/system-tables/mysql/procs_priv | versioned_docs/version-4.x/admin-manual/system-tables/mysql/procs_priv.md | `4443bce311ed5ef1e3f45d86dd6b3d5228b7b2f787ec1b49c647b983ef70bd3a` |
| admin-manual/system-tables/mysql/user | versioned_docs/version-4.x/admin-manual/system-tables/mysql/user.md | `e744e2475984e42df15465fe1eae9d6f1a48de03b8027fce828d0ef4ab369318` |
| admin-manual/system-tables/internal_schema/audit_log | versioned_docs/version-4.x/admin-manual/system-tables/internal_schema/audit_log.md | `a53600b95177379c8974e9843d596dfe7de91daf69cc1c3685a262699d801263` |
| admin-manual/system-tables/internal_schema/column_statistics | versioned_docs/version-4.x/admin-manual/system-tables/internal_schema/column_statistics.md | `62ca51bf03fe0e3e7caffa4917c9fa5aaaa67b8fa33f3fc63538ec6ff5d07b45` |
| admin-manual/system-tables/internal_schema/partition_statistics | versioned_docs/version-4.x/admin-manual/system-tables/internal_schema/partition_statistics.md | `89684a9b8d4ce6287d6f1b3dbc659781dbe6a94c68e496ff321f7650c547a180` |
| admin-manual/open-api/overview | versioned_docs/version-4.x/admin-manual/open-api/overview.md | `102362eb7fe64fed44d7b14d5e960d332b4bd3a182f254968b972b269fd48fdd` |
| admin-manual/open-api/fe-http/config-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/config-action.md | `00def175ba2f0a273431bf42cb88f8821880834b3283b9c259424cfba24ede6a` |
| admin-manual/open-api/fe-http/ha-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/ha-action.md | `585172568679ae87462c3b26b85b1d1f8dc253efda0e92ceaa716a581d615803` |
| admin-manual/open-api/fe-http/hardware-info-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/hardware-info-action.md | `cc928a0a35b04a4d9927dc0dc6fb748fa609d45224117862a5599d6bd62d3259` |
| admin-manual/open-api/fe-http/help-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/help-action.md | `449635540217f2e22e0f49a4fcab34ffbd5b08f1df11ba62d86004a3e1075bab` |
| admin-manual/open-api/fe-http/log-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/log-action.md | `92f17b3f23ff7cc2a3cb119b6254f651831fbdaf3fd2e4ec81b47089c8cc9718` |
| admin-manual/open-api/fe-http/login-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/login-action.md | `bf27f443eb274c8c92aa9344f2e037ebbf501494a37fb31938bc844f50afc968` |
| admin-manual/open-api/fe-http/logout-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/logout-action.md | `06f6a59cdd5e86fa9a856d1c91edf82a4922249f4dd1f98c64fa4ca0f1d88de9` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-024

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1115.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| admin-manual/open-api/fe-http/query-profile-action-controller | versioned_docs/version-4.x/admin-manual/open-api/fe-http/query-profile-action-controller.md | `cea497eb478e5430de0c668c875278a23d59e68ff8678bcf7db6076f0f9a5f21` |
| admin-manual/open-api/fe-http/session-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/session-action.md | `47a561a605f18ae94382733814487d004f2c3159bb806396427d3dadfe598064` |
| admin-manual/open-api/fe-http/system-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/system-action.md | `8101cd8bffb67822659643b97e510278262ef77a0fdb31d21702f81fa34a5310` |
| admin-manual/open-api/fe-http/colocate-meta-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/colocate-meta-action.md | `3d75d81cdd7ab6986aeba7ca2ff042e350ab77ded43fb3be09a51d86e2fa1318` |
| admin-manual/open-api/fe-http/meta-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/meta-action.md | `e86d9923c179c3b4514f24d1d0cbfe1d75131b8d874c20c1f2d5b83412658764` |
| admin-manual/open-api/fe-http/meta-backup-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/meta-backup-action.md | `8cd709db351987933046dd45c2e948639637ca00c3725bc99081b5bc54b98d87` |
| admin-manual/open-api/fe-http/cluster-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/cluster-action.md | `096b661d0712fa892aa9efe659a8fc6c1ea01d78283b7793cb0d4ca210ac61ca` |
| admin-manual/open-api/fe-http/node-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/node-action.md | `8dd23530da2e17d4ca2068689b37b3885b616a8290baea7f1b81ff9e19ea8f27` |
| admin-manual/open-api/fe-http/query-profile-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/query-profile-action.md | `cf36c17328c439fd427ef3b521d00d24cd959f02181ea22460158a200f50ceaf` |
| admin-manual/open-api/fe-http/backends-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/backends-action.md | `2def1fc6b6f1d5a46d19893dc639d2736df5bb6cabc35d9b0f14672a8aeaf9dd` |
| admin-manual/open-api/fe-http/bootstrap-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/bootstrap-action.md | `fa0ec3dbd6d21135db54408bf5813c77d358ea9be66b7f7a621b75a11d750be8` |
| admin-manual/open-api/fe-http/cancel-load-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/cancel-load-action.md | `263f8d577ea88c3f6c71c1659cffb27f295ca91fe4776cc6d3d108b7e5489864` |
| admin-manual/open-api/fe-http/check-decommission-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/check-decommission-action.md | `6d77a8665473233a8614c8564a1e5f434919931e58b0378350c33267874a9a14` |
| admin-manual/open-api/fe-http/check-storage-type-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/check-storage-type-action.md | `a154d493e60a583e075f178b4f1d35b9fe7242a13117955338c93b4e7daa00d4` |
| admin-manual/open-api/fe-http/connection-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/connection-action.md | `c6a42cd93536ad377f6aa680a0c0f91dc7be14a32f4443f964300d7938b9d860` |
| admin-manual/open-api/fe-http/extra-basepath-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/extra-basepath-action.md | `94f307289ee8eeb51db3433c8c18aca5502625dc76b117a4224d63ba32ebae17` |
| admin-manual/open-api/fe-http/fe-version-info-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/fe-version-info-action.md | `5791839869d87602b3f964d9cbc9815a97d746aa73c48319edd754875bdf2dc7` |
| admin-manual/open-api/fe-http/get-ddl-stmt-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/get-ddl-stmt-action.md | `7f1f2d8b79fc975304ec6fe48810e4371bb0baaa087353ce99fa2ef9d38844af` |
| admin-manual/open-api/fe-http/get-load-info-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/get-load-info-action.md | `d6c5a3b2ed6766b1fd97cf1bbe01afbee77c8a50812473b939077d227cd1eaaf` |
| admin-manual/open-api/fe-http/get-load-state | versioned_docs/version-4.x/admin-manual/open-api/fe-http/get-load-state.md | `6f7c785ab8c48e082c7d4330898c06ab0cdb1a78f16a7a5d698622e7bf495678` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-025

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1095.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| admin-manual/open-api/fe-http/get-log-file-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/get-log-file-action.md | `38599dde35e55b93b7dec102c78bd02c464ea11a286e22eb13325ca0cf82cada` |
| admin-manual/open-api/fe-http/get-small-file | versioned_docs/version-4.x/admin-manual/open-api/fe-http/get-small-file.md | `5bb4a13dab907944b129d4aed9e5afd906f8fa8e0eb4851d72c09f2b4e68c725` |
| admin-manual/open-api/fe-http/get-wal-size-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/get-wal-size-action.md | `d89ed4cf7b21b2346ce8290ca91ac484ed2be554e240e0a49bf84c9573026a5f` |
| admin-manual/open-api/fe-http/health-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/health-action.md | `ab3b3cb61ac3043c4fcc33097022b0f7d002c78e1ff7fa4c234f14924ff788ee` |
| admin-manual/open-api/fe-http/meta-info-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/meta-info-action.md | `1b2630a48a9a4c7846eeb8245351100416186d0658d918cc9f4eb6a0a69b9fd6` |
| admin-manual/open-api/fe-http/meta-replay-state-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/meta-replay-state-action.md | `73d5e9664ac765d7141e4b274195534d2ea67ddbf973dbfa6cde78283212a2d6` |
| admin-manual/open-api/fe-http/metrics-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/metrics-action.md | `22e0ce8401cb8db72b605dd849404e25a48367231e2f9597dc9cfc813883efaf` |
| admin-manual/open-api/fe-http/profile-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/profile-action.md | `71d1a52fddf4f5077c201cd7cd9080f53eabe2c501546b485655aac4f2e0743d` |
| admin-manual/open-api/fe-http/query-schema-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/query-schema-action.md | `58e330bcfd1cf2434a73c981e177cc3ff552f3e1e2f8feccf9c7adbe811e2d24` |
| admin-manual/open-api/fe-http/query-stats-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/query-stats-action.md | `6d569311ff7d97b3db4fa8a9e7ed6d86a3996f7469d39a6a675c093c4ac74c03` |
| admin-manual/open-api/fe-http/row-count-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/row-count-action.md | `bc324d82d3b6c7cf56fd6f9c1aa51d616f2570e53cab9cc7104c19f382126c8e` |
| admin-manual/open-api/fe-http/set-config-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/set-config-action.md | `073402ac92a770caab86256830920e6da38806b073843a78c6c83111861274b1` |
| admin-manual/open-api/fe-http/show-data-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/show-data-action.md | `a0bd8c24705bc7dfee19001cce1826bd35bc05257c63b27d3d3eaa815edd7271` |
| admin-manual/open-api/fe-http/show-meta-info-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/show-meta-info-action.md | `9bb6e703bc0777b74fb50345f6fee9e3e0302a07df8a3a1c348171087c40d656` |
| admin-manual/open-api/fe-http/show-proc-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/show-proc-action.md | `7325b5936a711688066824a9d57862ff453040dfa0b83d7c1ae0fd61e3a8f7b1` |
| admin-manual/open-api/fe-http/show-runtime-info-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/show-runtime-info-action.md | `9a93d43d499d97dc31ff90a714be8b0c86c0a78234cbd5201cfd8043f425b2a6` |
| admin-manual/open-api/fe-http/show-table-data-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/show-table-data-action.md | `20bb1c3890a018a2957309c8c942676d5a162a7dac0a1e647bae676646ea2ce6` |
| admin-manual/open-api/fe-http/statement-execution-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/statement-execution-action.md | `e8d2e6a452d452663706d28e043816c1db8f05bb394b6117bdc5377c772e244e` |
| admin-manual/open-api/fe-http/table-query-plan-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/table-query-plan-action.md | `3129ea36fae5676d3b70499a070050c3ac7ded86ecd6933a06df01d978a373e6` |
| admin-manual/open-api/fe-http/table-row-count-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/table-row-count-action.md | `2c249fe29fc8630cbe6b99123135d8e7bcd068e82157c9e5078c08dcb81c3af3` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-026

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1075.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| admin-manual/open-api/fe-http/table-schema-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/table-schema-action.md | `37797f3aeac9b3fcecef47b27f3d7a21c5a79625b566f72b12fcb1daf734f4e1` |
| admin-manual/open-api/fe-http/upload-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/upload-action.md | `e3fe2cedc250612698af1e78f68a806c6b0f748a15b15e159ba8183c9f4d89a4` |
| admin-manual/open-api/fe-http/import-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/import-action.md | `79bce6bba764fecd9798f24032d13aa60bea6c2e3fb573a97e44475cf5dc8d08` |
| admin-manual/open-api/fe-http/meta-info-action-V2 | versioned_docs/version-4.x/admin-manual/open-api/fe-http/meta-info-action-V2.md | `8e4db95e2399cf870fb0626eb7594761f2dba30793c44d97120024bec4a97931` |
| admin-manual/open-api/fe-http/debug-point-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/debug-point-action.md | `93bb1f2bbb5d577e1bd1384a2009b7d7879fdcf39912d63dd71d2c4bda982acd` |
| admin-manual/open-api/fe-http/statistic-action | versioned_docs/version-4.x/admin-manual/open-api/fe-http/statistic-action.md | `6c3186267d486851506c2dac2cf66f24ad7a7cb5ea1e1cb9fab1a59d185bf342` |
| admin-manual/open-api/be-http/check-rpc-channel | versioned_docs/version-4.x/admin-manual/open-api/be-http/check-rpc-channel.md | `b2caea994bc3034a3fb456708417f29e3e4432fb748f303445a8d70762d6030c` |
| admin-manual/open-api/be-http/reset-rpc-channel | versioned_docs/version-4.x/admin-manual/open-api/be-http/reset-rpc-channel.md | `7b60e0560c9ae9ff7a29987ef9d539af41d68afa7bf8c2f969406561ea600732` |
| admin-manual/open-api/be-http/compaction-status | versioned_docs/version-4.x/admin-manual/open-api/be-http/compaction-status.md | `ba1fde74912be259cefdf224f3c061902da6a4eb5b114afafc1a4ab1cce10855` |
| admin-manual/open-api/be-http/compaction-run | versioned_docs/version-4.x/admin-manual/open-api/be-http/compaction-run.md | `4edc564ac4eaad19b9a0df703556f4231adf8dbc231b55f9db026ba94ce2ffdc` |
| admin-manual/open-api/be-http/meta | versioned_docs/version-4.x/admin-manual/open-api/be-http/meta.md | `6c561b93bdb52b298de5ed4a66b46a9c708382fa81418005de1e67ead1ef14b9` |
| admin-manual/open-api/be-http/snapshot | versioned_docs/version-4.x/admin-manual/open-api/be-http/snapshot.md | `816b6c44ea0a963cf0fd634fd82a76ecd7ad60833a1e7c87c87fac3eaacfe00e` |
| admin-manual/open-api/be-http/check-tablet-segment | versioned_docs/version-4.x/admin-manual/open-api/be-http/check-tablet-segment.md | `cb334a73094db4d382cee390cf2fe061350dadc922afaa11369f173dc003be71` |
| admin-manual/open-api/be-http/config | versioned_docs/version-4.x/admin-manual/open-api/be-http/config.md | `fea236c1f3f3c2713f542173aee05140661976c37bff70a1f0ecf7dc15aa1ca2` |
| admin-manual/open-api/be-http/metrics | versioned_docs/version-4.x/admin-manual/open-api/be-http/metrics.md | `f5f12d116c70619a63c8023af05a66d9fffe7f419bf77fdfdb8dfcd6c4999e17` |
| admin-manual/open-api/be-http/tablet-distribution | versioned_docs/version-4.x/admin-manual/open-api/be-http/tablet-distribution.md | `bb0c2b10e31f7ab633cdae0780add856b9c554db4de925eebcb801ebef94abb8` |
| admin-manual/open-api/be-http/tablet-migration | versioned_docs/version-4.x/admin-manual/open-api/be-http/tablet-migration.md | `2cadb867fa9b376b7882f98a0dac095c0a2ca7011f2396b3da7bc3264c895d12` |
| admin-manual/open-api/be-http/tablet-info | versioned_docs/version-4.x/admin-manual/open-api/be-http/tablet-info.md | `ff6bc20dfdd5502c107b333c738ba922a87bdfc66580dd96151f0c662b749236` |
| admin-manual/open-api/be-http/checksum | versioned_docs/version-4.x/admin-manual/open-api/be-http/checksum.md | `71e6fdcb1a6456950e75912e509301e4682343a8b45c6738de5cde024bd0f665` |
| admin-manual/open-api/be-http/download | versioned_docs/version-4.x/admin-manual/open-api/be-http/download.md | `fc27dbff6d35b4fa597b746297334a49324eb349c8c9378a1c5cc4004df3f837` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-027

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1055.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| admin-manual/open-api/be-http/pad-rowset | versioned_docs/version-4.x/admin-manual/open-api/be-http/pad-rowset.md | `dc3f17d3fa46bcf2cc592a5a6043e6675aee117a8a7a6d588dd449393c0d5fba` |
| admin-manual/open-api/be-http/version-info | versioned_docs/version-4.x/admin-manual/open-api/be-http/version-info.md | `b265a7ecf7fcab5e3e6dfefaad874cdd6b472a43cc8c13c4f82d9d3ba04ccd4e` |
| admin-manual/open-api/be-http/health | versioned_docs/version-4.x/admin-manual/open-api/be-http/health.md | `501e47f4b1d82635fccd8b4d7ae1acc64c328a96431ea18c89c49b2a837950d0` |
| admin-manual/open-api/be-http/tablet-reload | versioned_docs/version-4.x/admin-manual/open-api/be-http/tablet-reload.md | `c50d2819dc5cee00a358b1030df0f547697ae286258e7e1ae12ad893912615bb` |
| admin-manual/open-api/be-http/tablet-restore | versioned_docs/version-4.x/admin-manual/open-api/be-http/tablet-restore.md | `88bf083687ca27f66f47b25640ce6c60717e8ca2112c031f79c03cfbb8afd2db` |
| admin-manual/open-api/be-http/be-vlog | versioned_docs/version-4.x/admin-manual/open-api/be-http/be-vlog.md | `8879c248bfe430ac867b52a9fe650e3e53e3a4bd95d3754a82c875e8105c576d` |
| admin-manual/trouble-shooting/memory-management/overview | versioned_docs/version-4.x/admin-manual/trouble-shooting/memory-management/overview.md | `07ce71b93f2ab4f87fab496946116169793f9b296661247a50b7fdfd4f9c150f` |
| admin-manual/trouble-shooting/memory-management/memory-issue-faq | versioned_docs/version-4.x/admin-manual/trouble-shooting/memory-management/memory-issue-faq.md | `72a2293c1e0e36b3f9a70c757b033882b80c650261fed55b2a3cd3f906b97e43` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/jemalloc-memory-analysis | versioned_docs/version-4.x/admin-manual/trouble-shooting/memory-management/memory-analysis/jemalloc-memory-analysis.md | `019683e00e5c19d20a070bf0c9027842ce12a2503dad81cafb1f6d2a5700554d` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/global-memory-analysis | versioned_docs/version-4.x/admin-manual/trouble-shooting/memory-management/memory-analysis/global-memory-analysis.md | `b53b21a6923a19c4d1c743229eac715cf622a519acfad28e582d9338f641330e` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/doris-cache-memory-analysis | versioned_docs/version-4.x/admin-manual/trouble-shooting/memory-management/memory-analysis/doris-cache-memory-analysis.md | `e207f15ade1ddbdab399ddb4c949d9592852bd89d92af2cdfc05d8a4a358b386` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/metadata-memory-analysis | versioned_docs/version-4.x/admin-manual/trouble-shooting/memory-management/memory-analysis/metadata-memory-analysis.md | `34e0c7466a562720d2b03fa557b1fea0429a09da135a7d8ffb9450e02d4a4f3d` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/query-memory-analysis | versioned_docs/version-4.x/admin-manual/trouble-shooting/memory-management/memory-analysis/query-memory-analysis.md | `8981113b8d0b643eaf88dacd8c1c3549e13ce98c0f9e01c469a8d6648b87ec8c` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/load-memory-analysis | versioned_docs/version-4.x/admin-manual/trouble-shooting/memory-management/memory-analysis/load-memory-analysis.md | `750fcb96fc1a78617f626f46b26276930409f135aa6a430f4eca5cf79f2e9dfc` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/query-cancelled-after-process-memory-exceeded | versioned_docs/version-4.x/admin-manual/trouble-shooting/memory-management/memory-analysis/query-cancelled-after-process-memory-exceeded.md | `db4229bb45836a3f68f25eb61ea3d82e1c2c186611343e43085d386cc4a064e2` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/query-cancelled-after-query-memory-exceeded | versioned_docs/version-4.x/admin-manual/trouble-shooting/memory-management/memory-analysis/query-cancelled-after-query-memory-exceeded.md | `ebca2539590e6bdddc58f69dfa3f8945ab301d1b86a947a8e2441b7f3af01d65` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/oom-crash-analysis | versioned_docs/version-4.x/admin-manual/trouble-shooting/memory-management/memory-analysis/oom-crash-analysis.md | `e1af6400d376b0947e232ba3fe1d9611193d943d0d8d48c3627d38084afc3aed` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/memory-log-analysis | versioned_docs/version-4.x/admin-manual/trouble-shooting/memory-management/memory-analysis/memory-log-analysis.md | `f165688fb3f20669ddfc4011f6a16a9215a507372e4e4343907f0332edf56157` |
| admin-manual/trouble-shooting/memory-management/memory-analysis/heap-profile-memory-analysis | versioned_docs/version-4.x/admin-manual/trouble-shooting/memory-management/memory-analysis/heap-profile-memory-analysis.md | `1ef27a03762e07ab7c2a255ace11a89fb00296faaed8cdabeaff8e9a79c02ed2` |
| admin-manual/trouble-shooting/memory-management/memory-feature/memory-tracker | versioned_docs/version-4.x/admin-manual/trouble-shooting/memory-management/memory-feature/memory-tracker.md | `91a2f6f36bef19faf3fb4a96816b0ed7fa57cbd7929aac5b91c378a7ae502f37` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-028

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1035.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| admin-manual/trouble-shooting/memory-management/memory-feature/memory-control-strategy | versioned_docs/version-4.x/admin-manual/trouble-shooting/memory-management/memory-feature/memory-control-strategy.md | `cf9dad399061120808acdb19ad6f9c0e94e083e88a4f15e47219abd66ba7423e` |
| admin-manual/trouble-shooting/compaction | versioned_docs/version-4.x/admin-manual/trouble-shooting/compaction.md | `20aa4388685584e0b72153eb51b3dd579995ba460bb8568a992aaf5feb259a1b` |
| admin-manual/trouble-shooting/compaction-principles | versioned_docs/version-4.x/admin-manual/trouble-shooting/compaction-principles.md | `c832de5481302f4d7b1c7ffb3fcb44c311ab3b76eeee513fcd0cb7011ede302d` |
| admin-manual/trouble-shooting/metadata-operation | versioned_docs/version-4.x/admin-manual/trouble-shooting/metadata-operation.md | `f4928968f43f71fe8239711f8aace9a8ae39bd2fc699f474017fadb0c27c886d` |
| admin-manual/trouble-shooting/frontend-lock-manager | versioned_docs/version-4.x/admin-manual/trouble-shooting/frontend-lock-manager.md | `c9fb0ae9505bd65f8538f1f9fa82a73e203c26387fb1dadd8a530df59f89963f` |
| admin-manual/trouble-shooting/tablet-local-debug | versioned_docs/version-4.x/admin-manual/trouble-shooting/tablet-local-debug.md | `ccbd274d34783c2481eb8d2ee79e60ad74adb1cabd2420e8184ef0a30c1c60b2` |
| admin-manual/trouble-shooting/tablet-meta-tool | versioned_docs/version-4.x/admin-manual/trouble-shooting/tablet-meta-tool.md | `180ed4e25707b430afb0834d2d22b3f013ab5783c97500339acb44b2d740cd7b` |
| admin-manual/trouble-shooting/repairing-data | versioned_docs/version-4.x/admin-manual/trouble-shooting/repairing-data.md | `e501091297dcfeac8d806d9321f5dc65133887638565d3dcab6810d358f5aa5c` |
| faq/install-faq | versioned_docs/version-4.x/faq/install-faq.md | `90fb6c11e2ec0ae6ac973761434fccb6d0112a8c3ff7160fc288b39f3847bb3a` |
| faq/data-faq | versioned_docs/version-4.x/faq/data-faq.md | `e59339132c10309a49f76642da45c9a362a404ab47f009292f3448c120c055da` |
| faq/sql-faq | versioned_docs/version-4.x/faq/sql-faq.md | `6368556a4756749e84a9fcdfd1fc7bee6d8449d8159bcdaf4a373439f6e35b7b` |
| faq/lakehouse-faq | versioned_docs/version-4.x/faq/lakehouse-faq.md | `1f8e4c05cf5a3fc58106830afa27431552a0abe8d6636fdf5be6992bc52dc44c` |
| faq/bi-faq | versioned_docs/version-4.x/faq/bi-faq.md | `4f45bc61fb90074ee09a8bbb32e6d1ee3c5e117f22b9f0478eb613273f56bef0` |
| faq/correctness-faq | versioned_docs/version-4.x/faq/correctness-faq.md | `d540f6aec81dabcd807abb128f05ef74cd86cca0fc4334bd55a60d06cda28e12` |
| faq/load-faq | versioned_docs/version-4.x/faq/load-faq.md | `23d78609e82060464bacc544acbea790ced0dfdeb3275566abe9beaa30e23159` |
| sql-manual/basic-element/sql-data-types/data-type-overview | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/data-type-overview.md | `d4989b5f81974a5a96e8a8ecb0650f90fad5cec88d70d8f46aa89d056bc5166a` |
| sql-manual/basic-element/sql-data-types/numeric/BOOLEAN | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/numeric/BOOLEAN.md | `ed80a13ba056c04f52ad0f00c62405cf260253e88c4992678214f02309ea7cd8` |
| sql-manual/basic-element/sql-data-types/numeric/TINYINT | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/numeric/TINYINT.md | `6c21a7fbcd49e43b1b35bb2582e74da29115a0587d93c8be6d968685dc101a16` |
| sql-manual/basic-element/sql-data-types/numeric/SMALLINT | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/numeric/SMALLINT.md | `3f348b9077480998b3a14cd13c3995ed111f2ba34c66d1833480a0fa19ca07de` |
| sql-manual/basic-element/sql-data-types/numeric/INT | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/numeric/INT.md | `be163231911536f29f77838f1a9ff3019afa2f0a2d261d5488d1814bd17986bd` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-029

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 1015.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/basic-element/sql-data-types/numeric/BIGINT | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/numeric/BIGINT.md | `bf2a52b6a070bab9380321121b563a08590d49a525e63de920b727a183cec274` |
| sql-manual/basic-element/sql-data-types/numeric/LARGEINT | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/numeric/LARGEINT.md | `4e5767b9859fab9bb27088e01eef31e46122d5e087e8bbdb7d9974ea0dfb9573` |
| sql-manual/basic-element/sql-data-types/numeric/DECIMAL | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/numeric/DECIMAL.md | `88f74fd65db09ff5c2ec6a57340d20a16133b251ec534a3dcd21b435995ecb39` |
| sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT.md | `b742ab54bb1e8f17672df238666aa7a7ff9cb78b96444da8d9f4be04003375aa` |
| sql-manual/basic-element/sql-data-types/date-time/DATE | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/date-time/DATE.md | `e1efe0685e075e454811a66bb037325134480ca25e4cba05c156d4895ad987a1` |
| sql-manual/basic-element/sql-data-types/date-time/TIME | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/date-time/TIME.md | `cad6b0f8e16e6a3979919420922ab70d8b46c29793019685ef3d66189b73f594` |
| sql-manual/basic-element/sql-data-types/date-time/DATETIME | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/date-time/DATETIME.md | `43953cc585e43c65f44d6679ebc38a708c1eb39b530b1bea6037309c73dba067` |
| sql-manual/basic-element/sql-data-types/date-time/TIMESTAMPTZ | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/date-time/TIMESTAMPTZ.md | `c09d7cdbec22e1525a53de97e33d228810dc6af796e440492b9cc4a6183df1c6` |
| sql-manual/basic-element/sql-data-types/string-type/CHAR | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/string-type/CHAR.md | `f205ede2f8ec31efd7e7207ef069e72fad407d2747f975db42030bf8abb377ac` |
| sql-manual/basic-element/sql-data-types/string-type/VARCHAR | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/string-type/VARCHAR.md | `0f4fa9829196e9a8146697797a229c11ac03781b4143231cd0c084af6fa225d9` |
| sql-manual/basic-element/sql-data-types/string-type/STRING | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/string-type/STRING.md | `9169b4533c57ecae822213ddb5190860ab2f49270db7bed387d70bd254f06867` |
| sql-manual/basic-element/sql-data-types/binary-type/VARBINARY | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/binary-type/VARBINARY.md | `37686de7eed3e80c1ffe82ebe2189eece9f4e8fbfa3ac7af322af05e1af22a9b` |
| sql-manual/basic-element/sql-data-types/semi-structured/ARRAY | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/semi-structured/ARRAY.md | `9f21694924c426fe0213a6419941a278b0c7d2e6e5245101a6479b019f9de5ea` |
| sql-manual/basic-element/sql-data-types/semi-structured/GEO | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/semi-structured/GEO.md | `b91e217238f3938c20fceb4c31bad4187942bc658fa7c3f1180dcc27f5af1e17` |
| sql-manual/basic-element/sql-data-types/semi-structured/MAP | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/semi-structured/MAP.md | `648cc3b37d3a08d7f599181dddd09306a9353db8e84dd854396ab6a154125e91` |
| sql-manual/basic-element/sql-data-types/semi-structured/STRUCT | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/semi-structured/STRUCT.md | `dd09845dc643de42dd1ec54196b6d3fdf62cf048ac474656e9d04700f21204f8` |
| sql-manual/basic-element/sql-data-types/semi-structured/JSON | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/semi-structured/JSON.md | `41267b8a890c26709692f86935e0a0f0984cea676554c27b16f19936c7c7e2c5` |
| sql-manual/basic-element/sql-data-types/semi-structured/VARIANT | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md | `654acc060b2672ee2cb2d11561e2181055bf6efe7be506ce12fe6132caf80aa8` |
| sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide.md | `09171094090087846c666cd792b20e4388e69a5b38f5a9eda67164d31f46fce2` |
| sql-manual/basic-element/sql-data-types/aggregate/HLL | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/aggregate/HLL.md | `d3691582124f5f8e6ce54fc8f87d18db1a381a05793822ca08e8a546ff13642d` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-030

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 995.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/basic-element/sql-data-types/aggregate/BITMAP | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/aggregate/BITMAP.md | `f819c0b9c57bf443e793aa861f7fdb0f70d60c36ac9214838b4d70a08cfb1bdb` |
| sql-manual/basic-element/sql-data-types/aggregate/QUANTILE-STATE | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/aggregate/QUANTILE-STATE.md | `3d6f437469d18715c6e0e2a1a5545ee1975fc7ae94f930962614bb6bdd76ece3` |
| sql-manual/basic-element/sql-data-types/aggregate/AGG-STATE | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/aggregate/AGG-STATE.md | `6c5832cc2b4eeb47dfaafefe4f5cc899798f3f8533f1c8de7a6fd09af98d9216` |
| sql-manual/basic-element/sql-data-types/ip/IPV4 | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/ip/IPV4.md | `c950b977b3f698373b6609d62fd80e30260eca622c1645b558d64de45c4cdfc4` |
| sql-manual/basic-element/sql-data-types/ip/IPV6 | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/ip/IPV6.md | `3c52ab31c8095057e5823b811920cf2cc92208f1b34c01b79292b9d17f086ed9` |
| sql-manual/basic-element/sql-data-types/conversion/overview | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/conversion/overview.md | `ef90fac7d96f679af32e70987f5275ec1ab6269840b3bca300be5523887d2bd3` |
| sql-manual/basic-element/sql-data-types/conversion/cast-expr | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/conversion/cast-expr.md | `56a95773f82958530461f64a2344dd4649113ff6a60200176e46b25b1d7dae33` |
| sql-manual/basic-element/sql-data-types/conversion/cast-to-string | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/conversion/cast-to-string.md | `1a0ce0b71fd1a498865a76a07ea9649f114a505a8fe9c9ae10c6af8183b56085` |
| sql-manual/basic-element/sql-data-types/conversion/array-conversion | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/conversion/array-conversion.md | `4acae3bd9f08c048ae91bb25b3fe0ac868e81734e04940854f2ca9f5d56e6be2` |
| sql-manual/basic-element/sql-data-types/conversion/boolean-conversion | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/conversion/boolean-conversion.md | `a803cddc9db2af327a71cfd799d1581d54082c8529fd49939d86ddf39e2e524e` |
| sql-manual/basic-element/sql-data-types/conversion/date-conversion | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/conversion/date-conversion.md | `e97fee1f0d5bb162cbb75876be80bb594ad6099b41abb54305d7a6dc0eb8548d` |
| sql-manual/basic-element/sql-data-types/conversion/datetime-conversion | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion.md | `487e98d8ca9f8dcb77075f1b4d1a1ffb07a2bae308cda506f2c463f0b188c520` |
| sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion.md | `2f2db332590ff56a611515d2e03d3aabfe1ec3b5e1683ac3412b3a41e558f5a7` |
| sql-manual/basic-element/sql-data-types/conversion/decimal-conversion | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/conversion/decimal-conversion.md | `1d17dca8db6d50cbb6178d4f7e5959a82424012820f8ab135b1e6957923e19ed` |
| sql-manual/basic-element/sql-data-types/conversion/float-double-conversion | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/conversion/float-double-conversion.md | `5d43bc08b82cdcf6d8941b57e4e22a19c73e212fd146f9e31d8d937ed587a604` |
| sql-manual/basic-element/sql-data-types/conversion/int-conversion | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/conversion/int-conversion.md | `99466c529ec883db2d4809c761570737bc4a96f0e61d02e6cdcf2064c9191587` |
| sql-manual/basic-element/sql-data-types/conversion/ip-conversion | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/conversion/ip-conversion.md | `3f8947c121018d2ff91d7aa1f1f1e238c945c41eefdc125627ad651931d1298e` |
| sql-manual/basic-element/sql-data-types/conversion/json-conversion | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/conversion/json-conversion.md | `be9d3d54c8302dee146fcc6feef3d15b01aef63511ea505343db5887a4570fa6` |
| sql-manual/basic-element/sql-data-types/conversion/map-conversion | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/conversion/map-conversion.md | `d9880e4a74f003cdc30662d31e870e4a032bb3ec23700cbc2b007c7e1d37701b` |
| sql-manual/basic-element/sql-data-types/conversion/struct-conversion | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/conversion/struct-conversion.md | `9672feff9fdbe4de67befcffa23739c9c9b91c633ed2fa80026887874ae08753` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-031

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 975.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/basic-element/sql-data-types/conversion/time-conversion | versioned_docs/version-4.x/sql-manual/basic-element/sql-data-types/conversion/time-conversion.md | `0faf50df61ea1ef9963f10f92fcbf35e6895f8a86c09b986996fb78ddc1b6414` |
| sql-manual/basic-element/literal/numeric-literal | versioned_docs/version-4.x/sql-manual/basic-element/literal/numeric-literal.md | `a21c13f9a55b92772f3064a313eb2d9a0a1fdb8579423f1d3933b43633123f84` |
| sql-manual/basic-element/literal/string-literal | versioned_docs/version-4.x/sql-manual/basic-element/literal/string-literal.md | `a31cf1c6cdcb896da6088b05f08b92fa56b82f7f9e6e54e50ff576fe5e986849` |
| sql-manual/basic-element/literal/date-literal | versioned_docs/version-4.x/sql-manual/basic-element/literal/date-literal.md | `211ea31cf38bb1d10485e434e4845060fdf06fee79d5c73d0a8e9b4a9c27fe89` |
| sql-manual/basic-element/nulls | versioned_docs/version-4.x/sql-manual/basic-element/nulls.md | `8d8cd73e49ebc73593d66d6f2cbeef5ad71ff8d2ee30c2a19eb6d449d7f65dd4` |
| sql-manual/basic-element/object-identifiers | versioned_docs/version-4.x/sql-manual/basic-element/object-identifiers.md | `89737a3128c6cb2b5cec4c86eb51fbf1a2a360f3ad1d3d6a3a040ca5d82752d4` |
| sql-manual/basic-element/reserved-keywords | versioned_docs/version-4.x/sql-manual/basic-element/reserved-keywords.md | `de04309261acafdf729f4357f9d3cc422b2813f3c67f19ef1b87f904e2479e2e` |
| sql-manual/basic-element/variables | versioned_docs/version-4.x/sql-manual/basic-element/variables.md | `6c3d4b7d7693306963c2b4286b8f315719e3e2381755bd07789d1983d95ab664` |
| sql-manual/basic-element/session-variables | versioned_docs/version-4.x/sql-manual/basic-element/session-variables.md | `13e4b842362625b86e7232c3507ab5fab65c11c70d3d2a62142bcfb01ad63100` |
| sql-manual/basic-element/comments | versioned_docs/version-4.x/sql-manual/basic-element/comments.md | `c4ff6782cc393008739db78ab50bd64c18a19f3988e3e6078316e4e92d0fc902` |
| sql-manual/basic-element/file-path-pattern | versioned_docs/version-4.x/sql-manual/basic-element/file-path-pattern.md | `23a258f4a132c193b8b38e2e26d4f7308310acecfc63c72bd0257e9183c60b65` |
| sql-manual/basic-element/operators/arithmetic-operators | versioned_docs/version-4.x/sql-manual/basic-element/operators/arithmetic-operators.mdx | `3e189734e92dd098007f19ff885b97261401129520173668ef2233504c6a06ba` |
| sql-manual/basic-element/operators/conditional-operators/logical-operators | versioned_docs/version-4.x/sql-manual/basic-element/operators/conditional-operators/logical-operators.md | `ae6f6229b0226e4074c8478d01951b6fd0af75fc40123ac8ad77ccbf107b1609` |
| sql-manual/basic-element/operators/conditional-operators/comparison-operators | versioned_docs/version-4.x/sql-manual/basic-element/operators/conditional-operators/comparison-operators.md | `a082a405231f797934ffb242e64576235be10327abf4b784da46a5283268368a` |
| sql-manual/basic-element/operators/conditional-operators/boolean-testing-operators | versioned_docs/version-4.x/sql-manual/basic-element/operators/conditional-operators/boolean-testing-operators.md | `168545093d0d594a45519a7911815e3dc4f9efa1ff747fe9edc72edde08e2742` |
| sql-manual/basic-element/operators/conditional-operators/pattern-matching-operators | versioned_docs/version-4.x/sql-manual/basic-element/operators/conditional-operators/pattern-matching-operators.md | `9660f3e2e6ec8d97761e6e322d16f76781fdf9417bfb861953ad366e84892434` |
| sql-manual/basic-element/operators/conditional-operators/full-text-search-operators | versioned_docs/version-4.x/sql-manual/basic-element/operators/conditional-operators/full-text-search-operators.md | `12dac40073c99aca5697f3f048d92231b3d6a33d43706731ca8d0ea36b6f6fff` |
| sql-manual/basic-element/operators/conditional-operators/in-operators | versioned_docs/version-4.x/sql-manual/basic-element/operators/conditional-operators/in-operators.md | `3978d283c30f3877a83bbeb95a332715553d9572944bdba48de8bbcf4de2738c` |
| sql-manual/basic-element/operators/conditional-operators/exists-operators | versioned_docs/version-4.x/sql-manual/basic-element/operators/conditional-operators/exists-operators.md | `9643b03904c1731c7567f692b22c734ee6ea7dbb28a891cbedb6d7b7b567a043` |
| sql-manual/basic-element/operators/bitwise-operators | versioned_docs/version-4.x/sql-manual/basic-element/operators/bitwise-operators.md | `837be4b3c8876304787e8208c2cc5ada08d09d240ba6a6d05140c4cf366ca813` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-032

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 955.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/basic-element/operators/assignment-operators | versioned_docs/version-4.x/sql-manual/basic-element/operators/assignment-operators.md | `1bc3568ce97fa218363e3d8aa17b077f70cb3aa1b03bb91b8890a4c63b324a0c` |
| sql-manual/basic-element/operators/operator-precedence | versioned_docs/version-4.x/sql-manual/basic-element/operators/operator-precedence.md | `190096440b6317c9e2eaef951c15d38d5eb848c85c8136e15483599f5d82f840` |
| sql-manual/sql-functions/ai-functions/distance-functions/cosine-distance | versioned_docs/version-4.x/sql-manual/sql-functions/ai-functions/distance-functions/cosine-distance.md | `f38259b050965c8f804c5035eb6b65b686e18374bbd8015f233024a209c095a2` |
| sql-manual/sql-functions/ai-functions/distance-functions/cosine-similarity | versioned_docs/version-4.x/sql-manual/sql-functions/ai-functions/distance-functions/cosine-similarity.md | `56e69fa6ada727f2a1a707848f8e3ae1df103279492aa954fd8554d88382e6b8` |
| sql-manual/sql-functions/ai-functions/distance-functions/inner-product | versioned_docs/version-4.x/sql-manual/sql-functions/ai-functions/distance-functions/inner-product.md | `45dbaf7e7fcae8b96fe52dc273b5391d799256a8b937d44daad07abdec3d3ec3` |
| sql-manual/sql-functions/ai-functions/distance-functions/l1-distance | versioned_docs/version-4.x/sql-manual/sql-functions/ai-functions/distance-functions/l1-distance.md | `2fb7bad1c36cb06bc559d92eaa43f180a326a9b72679c61281fa24b79425376a` |
| sql-manual/sql-functions/ai-functions/distance-functions/l2-distance | versioned_docs/version-4.x/sql-manual/sql-functions/ai-functions/distance-functions/l2-distance.md | `2203ac5e43234853dbe7a9e162d3713ed86bdd2c2b6cb697deee061a0e10c9bf` |
| sql-manual/sql-functions/ai-functions/distance-functions/embed | versioned_docs/version-4.x/sql-manual/sql-functions/ai-functions/distance-functions/embed.md | `f9e011efa596b674fbd99820e712992f5c4c2cfbe91165639798f9b3d500a65d` |
| sql-manual/sql-functions/ai-functions/overview | versioned_docs/version-4.x/sql-manual/sql-functions/ai-functions/overview.md | `b22304f55a5559c34b1a4887ba2d739ae0d95633cd0036d5a5e87aeee345a103` |
| sql-manual/sql-functions/ai-functions/ai-classify | versioned_docs/version-4.x/sql-manual/sql-functions/ai-functions/ai-classify.md | `02e55a6c5ac0765454280463c751930feba24aae5298e500f10df2d3a8186798` |
| sql-manual/sql-functions/ai-functions/ai-extract | versioned_docs/version-4.x/sql-manual/sql-functions/ai-functions/ai-extract.md | `3c8c643ecea9165fd4df989c1385c3000ff37846f9df64c6843352eb0662c0ba` |
| sql-manual/sql-functions/ai-functions/ai-filter | versioned_docs/version-4.x/sql-manual/sql-functions/ai-functions/ai-filter.md | `eab4f92faff07c6336ae58cd589bbe3a308c03d0a1c81828dadb7ab98e156f98` |
| sql-manual/sql-functions/ai-functions/ai-fixgrammar | versioned_docs/version-4.x/sql-manual/sql-functions/ai-functions/ai-fixgrammar.md | `83a87b0780d08ca96d02800da4e411e339af0967318c8b402cdfafbbf9b27c6a` |
| sql-manual/sql-functions/ai-functions/ai-generate | versioned_docs/version-4.x/sql-manual/sql-functions/ai-functions/ai-generate.md | `935e5e2a6719ceda072c6d0cbac167d396f532b176610fe6aecc22327f6ed3d2` |
| sql-manual/sql-functions/ai-functions/ai-mask | versioned_docs/version-4.x/sql-manual/sql-functions/ai-functions/ai-mask.md | `6783271d3d1a343809fd15f9cc54209e4946d8dd2b8b8563237a8ba722d0a4e6` |
| sql-manual/sql-functions/ai-functions/ai-sentiment | versioned_docs/version-4.x/sql-manual/sql-functions/ai-functions/ai-sentiment.md | `168188bf1e51e81df4b209cb340985677deee8df2046a8294c8d4caa470b6e9d` |
| sql-manual/sql-functions/ai-functions/ai-similarity | versioned_docs/version-4.x/sql-manual/sql-functions/ai-functions/ai-similarity.md | `3502c3fc5686f045b3d4e0d6946bfb7fec2f1612d683f95c6920124f439ecbd5` |
| sql-manual/sql-functions/ai-functions/ai-summarize | versioned_docs/version-4.x/sql-manual/sql-functions/ai-functions/ai-summarize.md | `5edf9bba0d9c351b2a82d263178691e35f0c3fff2683a63b5291e830741d94f0` |
| sql-manual/sql-functions/ai-functions/ai-translate | versioned_docs/version-4.x/sql-manual/sql-functions/ai-functions/ai-translate.md | `43738adf3659de81b78eff5da99a2bc083ca9e6b04b337cb1bedf979a5379a61` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/abs | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/abs.md | `516e34fd5a54dc7e6ddfcf2e98cfd015d6440ba8757755193b5845918ded12ad` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-033

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 935.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/numeric-functions/acos | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/acos.md | `144b868a63e7c1942ebe38705891409ad7155e8893facd28edd0230061843269` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/acosh | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/acosh.md | `e6532e1e59ebce57cf625518c51d38c768279ff8a582b0f22b2e9618877858eb` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/asin | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/asin.md | `d153b24ead67732c32cfe7bffc614f049e7edbb15c940ac5183eeab862dda421` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/asinh | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/asinh.md | `71df13b1382b8aab5f4f663fdab049e79c5d810cd5c934e491c02c615b32605b` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/atan | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/atan.md | `98fcd6d4237557ed5d074174ba1be818c6c301e122369eaad91183b63a9eb41e` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/atan2 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/atan2.md | `4c18e6a974e5499cdb30f33eb93dddd61008fd6f05d103933858a96145c78411` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/atanh | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/atanh.md | `14e1729139930f46c5c02fbf80314586f90c957386a69f5591eaac69a1213550` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/bin | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/bin.md | `bdd568ff024c07de52d64522bfd3821575b00873b9e4663a77d17b04eadb2e6a` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/cbrt | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/cbrt.md | `ffc19331a956251dccffe3af3681534bffc40b2644dcc9d5af43c8b3aa3988b5` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/ceil | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/ceil.md | `c2aff17d5b3468b6dc1396c0a638b14cccba3e0576019d80b9d2e9ce2ce1d9d9` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/conv | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/conv.md | `28fa89347deb4203cbcf2b2aed81e172bd203684ed424d05e8de19f3c52cb561` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/cos | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/cos.md | `94ecb3cd883c1f53624e76ecbb471d1863cabdb9b1739d7acc2b68c05aabfc8a` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/cosh | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/cosh.md | `05da784af4aaf3c3b93e4823f5c7d3050f38deb0f343aa1766ebd1433efb5818` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/cot | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/cot.md | `4a50de1c89dd1326e41927bc947f11a955be58f8d26a9aa1040712a9f243ea10` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/csc | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/csc.md | `b927045a5e0da78d00e1d38c45e15e89569f8a119dd283e40386c59733f7fbdb` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/degrees | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/degrees.md | `47296d3d6eaf8ee017e1b08eda62fccef1bd32f4ece239d037fef867273a06a1` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/e | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/e.md | `7a15705a16b9662357190583a3f605beea56877824e388cc34cd8a12838dc233` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/exp | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/exp.md | `640b68b822b793f18a644fca6eeb488e445fa9aad807aed1ccc3c0bc282ff23f` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/factorial | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/factorial.md | `49b2de90a1e8571d66424e514d7c3828cfca4f1e6233afe8827cb9765daf38be` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/floor | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/floor.md | `c5d6d401cbf206b87f947e8adea54425de3db58974e8aa9d58c68447bf02d6b9` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-034

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 915.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/numeric-functions/fmod | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/fmod.md | `23408e7ef997ac1f55e4f6de77ee4b96614d4635090b7c09ff6062cbc2629700` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/format-round | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/format-round.md | `e23c7a7dd2617d6b234383f8840fd2442f76b8cd0afe6122b00c72aea1b03157` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/interval | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/interval.md | `b07125c640318eaa68639e8031095b11c3b532fbc833e45595b05bdb935f11ce` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/isinf | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/isinf.md | `18bb6d8652fb679eff2c2b77ad088cfa5515f655f603a1710d4fcc06d0f77caa` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/isnan | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/isnan.md | `4b19419fda3b66a4d71318760de69e14e71db822fe5c9fe6669ea142aa795d71` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/ln | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/ln.md | `dd803f19aa76a3abd00f60279fabf8a1de129a2d7e9ef2f98640ddb26cf34dab` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/log | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/log.md | `3ec8e3c24f155c3cfe322a5aa4f1c4361121a61f1ebe5392c295081dfd4d8fbb` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/log10 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/log10.md | `bdc15899f8459a7449dad2532a108cb8915bef0fd8b0706b9132cff22cad670b` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/log2 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/log2.md | `d08413f2100b95ccf6e27f785c181ad73276a5e02ce337d1bec84d739e0baaed` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/mod | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/mod.md | `4fd5d19b77a296fb5b5852ad1528500449feb7253c7af136579977ed5fb9e225` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/money-format | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/money-format.md | `0d98b41d61981874dc4ab8ea5dccf60d46f4a340f29f1d4f08713d4055102ebf` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/negative | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/negative.md | `e5284ebe0ea1d35a32a61c433212018d9d5a250a936ed0877ad4aa71afe464d3` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/normal-cdf | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/normal-cdf.md | `937e63eb624b03ab7faefd843b744a37262ee0571e965d67c061388975677354` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/pi | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/pi.md | `845e233fc50404ebbefcdf7719866244fd3bc7f933f320f117603c8af7e71d81` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/pmod | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/pmod.md | `d977c153b9c845420c58cc7e873e9f10326eea9b1ed7a2cf9bf4ff6e279acb86` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/positive | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/positive.md | `f26f1d38dffbd922cba8dda5a85863abf0202762a5c4d88a33cb410926a0f440` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/pow | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/pow.md | `4f4fbf6293a4804d1a90a61a91506d1cd6c9aa9647d656eafcb0ea8045c1605c` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/radians | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/radians.md | `fba9a594b2561dc5d2a5022e9a61a6b3bc4767c4f6ea64c77e24dd2b3fbfaef7` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/random | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/random.md | `4b0bb65cf72644132fb44b1cdf38be48704a8cf78b870acdb8364413d7da7df3` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/round | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/round.md | `296c03975e301833127b24e92425608917e1d0043e297640e176c10258295526` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-035

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 895.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/numeric-functions/round-bankers | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/round-bankers.md | `18e3e4c1bd9d6ddb0b294989dd5979c7bc4dbc03188bc5a5c301866d4bb815a5` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/sec | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/sec.md | `3797ae945a4dff59613154fa2ff371978aa99e375c0e75dba5089db14585ed51` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/sign | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/sign.md | `8e527a11e55373d210471d3842cffcc83215d30e54564fbdcc1fbb014cfda316` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/sin | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/sin.md | `a704a240bbcbd367e646c19dba6e5b00907264b133f4295a21244044254f67fc` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/sinh | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/sinh.md | `0e12e9db93f515e2dba2423f7998f54f7200cbbac0b3fa1d4b2d8a40f1866ed9` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/sqrt | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/sqrt.md | `9124026d3d2f6dd9e7ec6e5f7a4621489e5d96ef8da47b6bd4a358f597f584cf` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/tan | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/tan.md | `3814450d250f72cab47ae6e9880e9ddfc5bb91c67953eef3a625c9751bfbf162` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/tanh | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/tanh.md | `630ea0f6a244d4b00f657dc352dc6273c5ca085333cca8a204569e6149c29a00` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/truncate | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/truncate.md | `5db4080137542ef7609b68e420ddd9251a60d46934fb694146cd87d5999004b2` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/uniform | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/uniform.md | `e068bfd5958bc64480fa1932409f06233d5577ad5193153c7fbecb2eefca04b7` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/uuid_numeric | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/uuid_numeric.md | `e22f268d7ed8adac4a6451955d59f73202220a422f2b6cbd931b0cbf468c0931` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/width-bucket | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/width-bucket.md | `ab0b6819a4d3a8b5a7a4497f30cc19971a05daa6db6c86ec5a07bcd39e3a0942` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/even | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/even.md | `438bae616bd346735f9afc1b44e3710652c1b4e844851d07aa05d92dc526cc14` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/signbit | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/signbit.md | `2b4fa504b1e3077a78aa6e3004ce2852e1d8b50fa585f777c89a834ce9216865` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/gcd | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/gcd.md | `b95bb5db92961783be1407e9e62a215543d3e8f4b4ed1d1d3592966591a5c7c9` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/lcm | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/lcm.md | `d62ebf2407855d8f242e5c052a663750deef69255127092049c2db2046edca79` |
| sql-manual/sql-functions/scalar-functions/numeric-functions/xor | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/numeric-functions/xor.md | `286e610edcdabd5b89cd892d7cb751139b6bfbb77604df92abfb9363224ca32c` |
| sql-manual/sql-functions/scalar-functions/string-functions/overview | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/overview.md | `3d7c10125d6dca7bbdccff395d80087670f5e073f8d1f5e5c7e9cbb4ef73d0b6` |
| sql-manual/sql-functions/scalar-functions/string-functions/append-trailing-char-if-absent | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/append-trailing-char-if-absent.md | `0f7885043c7aa4ee03372d5b30361a3b60e7125ad1ba1d4cb4330c0ea381e5cc` |
| sql-manual/sql-functions/scalar-functions/string-functions/ascii | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/ascii.md | `3e14d123d41ca705298bba6de6dcf8943d501b9a7398dc912a719a775729373d` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-036

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 875.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/string-functions/auto-partition-name | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/auto-partition-name.md | `c766c02639d30b7c4bc2c7ff40bfa6af08c60e1b5e6be653d536072cc099fcc5` |
| sql-manual/sql-functions/scalar-functions/string-functions/char | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/char.md | `834bfda7f4c213f2d7d9ecbf5ce6210b7ae27ef0679c4de509487253fefb7a4e` |
| sql-manual/sql-functions/scalar-functions/string-functions/char-length | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/char-length.md | `71087c749ced75d6e43e937c4b6f16e4f864a89102900135417ba2a7b84fa405` |
| sql-manual/sql-functions/scalar-functions/string-functions/concat | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/concat.md | `79a809cef2d63b530949e2e2dccb615ff17c619d723fb6d91cfb7937180f328e` |
| sql-manual/sql-functions/scalar-functions/string-functions/concat-ws | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/concat-ws.md | `f5c8d14c3369ee7df99c1684b815e1927e6b4d8f526bcf679d026d628812a1f7` |
| sql-manual/sql-functions/scalar-functions/string-functions/compress | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/compress.md | `63147c3c840b70169640f14e7425914288be57fd92c3b19cd42ca997bae47dcb` |
| sql-manual/sql-functions/scalar-functions/string-functions/count_substrings | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/count_substrings.md | `a9193df1a6bf75c4902a59b84ef108038353f6f28a30f646739f67f1fe104446` |
| sql-manual/sql-functions/scalar-functions/string-functions/cut-to-first-significant-subdomain | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/cut-to-first-significant-subdomain.md | `e462e705f7d8240570fca94a67ef131e21d106d398e41a4dc89a708ee26934f5` |
| sql-manual/sql-functions/scalar-functions/string-functions/damerau_levenshtein_distance | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/damerau_levenshtein_distance.md | `965ed037a23ca135fa7ca70d0a151db08f313b4943653ef735f1796a1202d168` |
| sql-manual/sql-functions/scalar-functions/string-functions/digital-masking | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/digital-masking.md | `2b761d6e4423fa27f25d08bc619356489ac2309f5f1ca60c56d53cb9683fc6ab` |
| sql-manual/sql-functions/scalar-functions/string-functions/domain | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/domain.md | `89dbe5afc71db2afda019e0d139f72ea2694793b6541df6b8cc7600fdd4c8779` |
| sql-manual/sql-functions/scalar-functions/string-functions/domain-without-www | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/domain-without-www.md | `a9de900099ccafe281a89ab5a1f23fd56fa8f5122269ee4317670e4706375eaa` |
| sql-manual/sql-functions/scalar-functions/string-functions/ends-with | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/ends-with.md | `7f6b35cc22c5e39ad462d708497a4401551780c603c377c0fd2e6c896181713c` |
| sql-manual/sql-functions/scalar-functions/string-functions/export-set | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/export-set.md | `e2615b26129a73082d1f5c23abf6561787a537a8001030d11a223a4b47a2079d` |
| sql-manual/sql-functions/scalar-functions/string-functions/elt | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/elt.md | `57ad66b757435060dd5a6e50be20812d0d07f3875dca3e2182ca6c9990a22195` |
| sql-manual/sql-functions/scalar-functions/string-functions/extract-url-parameter | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/extract-url-parameter.md | `e8ac138405e493f37f18152979f119d0e65a80d0a1b73111fbf4b3e09f57d823` |
| sql-manual/sql-functions/scalar-functions/string-functions/from-base64 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/from-base64.md | `8842cc0d37c72ffa48e6f466d18ce42083aca4791d118081cd57061d086001c8` |
| sql-manual/sql-functions/scalar-functions/string-functions/find-in-set | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/find-in-set.md | `937320abcf7d98cfcb6d47060c12fe9760cc1a426da519e122e5cd90e9a0ee14` |
| sql-manual/sql-functions/scalar-functions/string-functions/first-significant-subdomain | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/first-significant-subdomain.md | `eb9ff19598dd614dbff3eb39741047f449853885b0121c4c7da3960f8cce8514` |
| sql-manual/sql-functions/scalar-functions/string-functions/format | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/format.md | `2872537c0676a32b95b4fb5338bcb8f1d526bc85c485040ec856a6c1914909b8` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-037

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 855.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/string-functions/format-number | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/format-number.md | `51920a6784cc1c2c60a4066f178327bc6ccad2fdd9fc72067126afaa0a154acc` |
| sql-manual/sql-functions/scalar-functions/string-functions/hex | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/hex.md | `3d3915c81ca5417ec64a8f76b93f3c9622880feae42819afc09599f007c3c571` |
| sql-manual/sql-functions/scalar-functions/string-functions/initcap | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/initcap.md | `62b73fc9fef3f65439622198b090122523c8ba8edb4f8a8c322f74312da4a5fb` |
| sql-manual/sql-functions/scalar-functions/string-functions/instr | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/instr.md | `4874398627ad056a928e0e1260495a7cc1ee18cabc799b28f7518427db1b515c` |
| sql-manual/sql-functions/scalar-functions/string-functions/int-to-uuid | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/int-to-uuid.md | `b6b90a95c5d072fe6833fd97b106fe8d0f86e3e081d46a2f1235e8e6b995f2a2` |
| sql-manual/sql-functions/scalar-functions/string-functions/is-uuid | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/is-uuid.md | `4a69dfc8fba2bc352c3d79fe8712fd6a8c5b0fa84723cea6c9f8ecfdfd319e06` |
| sql-manual/sql-functions/scalar-functions/string-functions/is-valid-utf8 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/is-valid-utf8.md | `1bf0d9c3a98eacaa9b0f6a8be6989c5135938e47fab226c137ad42a1f48fe595` |
| sql-manual/sql-functions/scalar-functions/string-functions/lcase | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/lcase.md | `2c57fa411624fb04b56718118fd5f5fb32c363567cc4cb607844a77e8ce70e8d` |
| sql-manual/sql-functions/scalar-functions/string-functions/length | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/length.md | `42ca0b65b2e34ae9a253154a469e6f8d542e56c1af08820d14585a3dadd489ef` |
| sql-manual/sql-functions/scalar-functions/string-functions/levenshtein | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/levenshtein.md | `d20ffe1d83e29aeed05b629ce10d2557b06a35f3cd3e2daec5d3852d67904e9f` |
| sql-manual/sql-functions/scalar-functions/string-functions/locate | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/locate.md | `42cc96c13b780429a3d14b8ec2c3b845b301b873c865e59af00853cf6b22e79c` |
| sql-manual/sql-functions/scalar-functions/string-functions/lpad | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/lpad.md | `77c8d4efa5d6cebf40e481613123315e4d1970f45da2b4ae836747dce7b14dda` |
| sql-manual/sql-functions/scalar-functions/string-functions/ltrim | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/ltrim.md | `4572d4bbda664cb7fccc4660436b3e411b0810e4e7ff774b6cc9a6265afcb1c8` |
| sql-manual/sql-functions/scalar-functions/string-functions/ltrim-in | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/ltrim-in.md | `16dcaad7f2b89ef02dadee1186f5faef50afea86bc7983d7bbd2862f168c4121` |
| sql-manual/sql-functions/scalar-functions/string-functions/make-set | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/make-set.md | `6c32764e0f0540265477e2043125f1f3e37ea75524b255c55369c514f85bfb0e` |
| sql-manual/sql-functions/scalar-functions/string-functions/mask | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/mask.md | `f8c25d4dd29ebe31dc1898edf3d2257fb50da390e9d84f8f350023b7db7285c0` |
| sql-manual/sql-functions/scalar-functions/string-functions/mask-first-n | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/mask-first-n.md | `e9a719d23326121b07f440411554d3f9da5f4e97c05d6f0a591cdfeb845f153b` |
| sql-manual/sql-functions/scalar-functions/string-functions/mask-last-n | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/mask-last-n.md | `1875ea61b169f5ebc75b476cac42fc3f8a3c4d711aae35509d80717ad516c7de` |
| sql-manual/sql-functions/scalar-functions/string-functions/multi-match-any | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/multi-match-any.md | `406f52c620405f3eff61b0dc5df8eb4caa5bcf31fabdaae6a843d153a639d0f1` |
| sql-manual/sql-functions/scalar-functions/string-functions/multi-search-all-positions | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/multi-search-all-positions.md | `0b347199c2968020484b9d169259c20f896cfdff0cb6cec740c01eee0ccba77c` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-038

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 835.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/string-functions/ngram-search | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/ngram-search.md | `ae3f40cd6d893d150123dadd4d3684ebb3df7d6fbe3b85689c615298aecc41b2` |
| sql-manual/sql-functions/scalar-functions/string-functions/overlay | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/overlay.md | `8c7c14457ac60bfdcfbde7f0a1e2d7121c6cace28ae9ed8cf63e19ab332da93a` |
| sql-manual/sql-functions/scalar-functions/string-functions/parse-data-size | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/parse-data-size.md | `729ef324163d98e5416b3c878920243796ff942c45585ead7b1f4104114a5c0b` |
| sql-manual/sql-functions/scalar-functions/string-functions/parse-url | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/parse-url.md | `ff7fb3845febaa6c82819584f46a0dafd3f387e19d0bc06ceafbe86931d1f6b9` |
| sql-manual/sql-functions/scalar-functions/string-functions/position | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/position.md | `d73423a0b1bcce0f63b45619bb2b2ee9a1020e5e8b289d5375de62b1a076a3f6` |
| sql-manual/sql-functions/scalar-functions/string-functions/protocol | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/protocol.md | `12e5116fdc916e97b67a78fac14e64a03a9f6b00ec9cb083472bfa54b999537f` |
| sql-manual/sql-functions/scalar-functions/string-functions/quote | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/quote.md | `8df1e34dc238b33e7d55d9e0aa1362c1e8d2dde3cfdb783d4707cc4f8a49b2a3` |
| sql-manual/sql-functions/scalar-functions/string-functions/random_bytes | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/random_bytes.md | `388329c095de5f5d7e9262cb5d94ff39c0686b6c8da7f4fe93fdb3acab553f8d` |
| sql-manual/sql-functions/scalar-functions/string-functions/regexp | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/regexp.md | `c860cf45635c80f0cc324f001985ee7540b72104d71e0c27394d43afe0571a50` |
| sql-manual/sql-functions/scalar-functions/string-functions/regexp-count | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/regexp-count.md | `8e4aa2f78c654f2de0e8ceb33eb5d097510ba83beff26ba918045874adbbae0b` |
| sql-manual/sql-functions/scalar-functions/string-functions/regexp-extract | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/regexp-extract.md | `51c8194622e96554c9293b12a7793f16436ab19ecedb7b375495016105a7bd8e` |
| sql-manual/sql-functions/scalar-functions/string-functions/regexp-extract-all | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/regexp-extract-all.md | `25efa1ee2c69d67c97d084ae7e125307c78c5b2e1aa9101d76ab48657bfa8fd4` |
| sql-manual/sql-functions/scalar-functions/string-functions/regexp-extract-or-null | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/regexp-extract-or-null.md | `57f93d048c83e4864801078a98128730d4968fd39b9dc19d5f59dd0fce43993d` |
| sql-manual/sql-functions/scalar-functions/string-functions/regexp-replace | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/regexp-replace.md | `fdf9759d1c3bdf9563699e42757bfd3a7c978f73d38414c15a7bcd4f38ef0af3` |
| sql-manual/sql-functions/scalar-functions/string-functions/regexp-replace-one | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/regexp-replace-one.md | `c909fc34abda301d3e52105feaa32c1b7f5707372d98de105be55a2ba863fdbc` |
| sql-manual/sql-functions/scalar-functions/string-functions/replace | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/replace.md | `2220a624fb9b6a749099f422fde8ccd5e274f38cf1f9c6ec70f32b954ca317f2` |
| sql-manual/sql-functions/scalar-functions/string-functions/replace-empty | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/replace-empty.md | `e5138c6d8db8a15c99430b3fe0655dea226a2fe34ddab7d5d2c295e1fbd78465` |
| sql-manual/sql-functions/scalar-functions/string-functions/repeat | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/repeat.md | `c3512ec5ad38db73314d4f9ef013095cc1471fee5323ed362dc34c9884e38bda` |
| sql-manual/sql-functions/scalar-functions/string-functions/reverse | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/reverse.md | `b7b313e23dd37caa5a41026f676b84cff2aaeed0b0a9c913b2115fb7936f3c95` |
| sql-manual/sql-functions/scalar-functions/string-functions/rpad | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/rpad.md | `fa6e5e3dc7e3ab6dc70c88fcb5c9e95b96e0bc0d026211ad8d4742f61c22f05a` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-039

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 815.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/string-functions/rtrim | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/rtrim.md | `6a980fc34196f248824c5fdc64997d9fa858548bd3b19bb8b0ba06a9a1771931` |
| sql-manual/sql-functions/scalar-functions/string-functions/rtrim-in | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/rtrim-in.md | `eb6bd595db13ed130db719ca6523472d715129ad761745a24408e9b0f141823e` |
| sql-manual/sql-functions/scalar-functions/string-functions/soundex | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/soundex.md | `f5ea2b8a4b2d090f92f2b6aa7ac9d99c1ace36260b1c8874125cd26493c3247f` |
| sql-manual/sql-functions/scalar-functions/string-functions/strleft | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/strleft.md | `99e45e7f41701de8ff760a7cf47931baf7ff8f8225a47d82b8d3c6adbc829e0a` |
| sql-manual/sql-functions/scalar-functions/string-functions/strright | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/strright.md | `926426cc48c33da5fe0d602ff5a45be94a0f5b0cefe5d9640c9c3c96a71bc52c` |
| sql-manual/sql-functions/scalar-functions/string-functions/split-by-regexp | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/split-by-regexp.md | `d93762890d8eb9dfabb1b93e174353ce943a539ee6147d59f3aaf2cac7f2c712` |
| sql-manual/sql-functions/scalar-functions/string-functions/split-by-string | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/split-by-string.md | `2f7dce03250812a18b4d26b71a8fe65de089499df79e149ca7191e3579f4a91f` |
| sql-manual/sql-functions/scalar-functions/string-functions/split-part | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/split-part.md | `790482792b02b1c5fa073157f1fc38a95b61b968ee020e446791e4fa5e89dd22` |
| sql-manual/sql-functions/scalar-functions/string-functions/space | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/space.md | `58efacd1f638208da79a2ddb132df324c5dc1d5e7471ae25167665b993430663` |
| sql-manual/sql-functions/scalar-functions/string-functions/strcmp | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/strcmp.md | `b3514d33281a8946965b2344749c23304b8441e8c7730004f1d979c248859d06` |
| sql-manual/sql-functions/scalar-functions/string-functions/starts-with | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/starts-with.md | `794280620b0480a766b7a7e0ccbafc91450aca17c461a3a27cae341eda33d323` |
| sql-manual/sql-functions/scalar-functions/string-functions/sub-replace | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/sub-replace.md | `d839932a54ba3665b6455ca9301589a11623b564535b4a95a6f4a392234369a6` |
| sql-manual/sql-functions/scalar-functions/string-functions/substring | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/substring.md | `4aa6f6836096a5fae88484f20d390a4837ba7b766214f94e67b58a239734a4be` |
| sql-manual/sql-functions/scalar-functions/string-functions/substring-index | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/substring-index.md | `2d8049e4092d9513aa98cb12ddc02e137b839113ca98eef88d600407b55b0337` |
| sql-manual/sql-functions/scalar-functions/string-functions/tokenize | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/tokenize.md | `758d89668037618fc16bffa161e3604208f8d4f0921fb17d199cf2fda1ac4a3f` |
| sql-manual/sql-functions/scalar-functions/string-functions/trim | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/trim.md | `581ea900a2af26eca8e481fe3f1d9bee3fd933795605bae768973e8fc34a1abb` |
| sql-manual/sql-functions/scalar-functions/string-functions/trim-in | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/trim-in.md | `a2afc0d34f08b00b8d09bb6e0a32feec1f0f25df022d0ff81d93ee9396a5ae96` |
| sql-manual/sql-functions/scalar-functions/string-functions/top-level-domain | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/top-level-domain.md | `f75b379ef554d7070d2285ff00c82511ce989d5bba36b81cbe92dcf53fd6f4cc` |
| sql-manual/sql-functions/scalar-functions/string-functions/to-base64 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/to-base64.md | `bd927b4b86b7b1b1c4b34721994f99044b975ea4a6a62ec869beb69b77b27b44` |
| sql-manual/sql-functions/scalar-functions/string-functions/translate | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/translate.md | `a8ad2a8c9d46c1cb8eb53bf98589708fa118a3fde4f9eeab5bdfcbbd437bac7a` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-040

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 795.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/string-functions/uncompress | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/uncompress.md | `410074051ace19020ee1f232a5cb40be5b0a300daec69194361b18ea77708035` |
| sql-manual/sql-functions/scalar-functions/string-functions/unhex | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/unhex.md | `42dbd56911167944d7bdb45e67cfd9f51d4d83777a08a71ffdc082adc9e8052f` |
| sql-manual/sql-functions/scalar-functions/string-functions/ucase | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/ucase.md | `4a32456626733fa70a7c92118e0b1db0752b4f0e84d70dba71eefee556d2fec1` |
| sql-manual/sql-functions/scalar-functions/string-functions/unicode_normalize | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/unicode_normalize.md | `21abbfa1a38b3fea777f7f748bf1934a17ba88ce124ccfa2797bd2ba3eabc76c` |
| sql-manual/sql-functions/scalar-functions/string-functions/url-decode | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/url-decode.md | `b1422383763def6d8f353f07932b998c7685e5cb73aa6604a598ec2c0e919aca` |
| sql-manual/sql-functions/scalar-functions/string-functions/url-encode | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/url-encode.md | `c9a648dc9e57a0d1c291bae4dfefd97fe9f48aebdddd2000ff42290a5492b32c` |
| sql-manual/sql-functions/scalar-functions/string-functions/uuid | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/uuid.md | `6dfdf4a70a0e5c1e18b02f0b446f659b72437b30a1249b395787f275a49d969b` |
| sql-manual/sql-functions/scalar-functions/string-functions/xpath-string | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/xpath-string.md | `f00af2255b3c0c9d3a7377eebe19568b94ed347de327d8e36fe1ca9367eb26ef` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/add-time | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/add-time.md | `a1b0c83f8d878269e2eb3dc8cb4bed986eea7115aa6ee1b1f82c9e496e758501` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/century | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/century.md | `a46d3be47bf98feda8e726996fe0c84d94bed44cbd538e74f6a6a54598f89a66` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/convert-tz | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/convert-tz.md | `ac2597a5e3cea01e0461227f62627fbfedbf005c12d19d5a6f32836c83e5fc62` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/curdate | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/curdate.md | `6e1c4e79d07ba3f0c28b17e39b06d5a0ca3f7cfc70b5ef5dfbeb75ef8a584457` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/curtime | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/curtime.md | `63da3bfb2be77411f574b739f16343a3b93ef6cd326364a16cfc69d9a58c0c4c` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/date | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/date.md | `78ea73a0aa4849143014b3b3ffd4f56651fb17684e55992e5c54e72aa4662905` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/date-add | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/date-add.md | `e5ff8f3be5c695aaf83a8fc08d380b73d0ca3b24e38b08177a5c06218b3bee25` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/date-ceil | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/date-ceil.md | `09ae9deb382434cf51847e33a8bf78c19654421bb4d6a545093731695e251611` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/date-floor | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/date-floor.md | `c1f0f82c7bada9d0fec040b588636d81f0a54ff9ad293521c38f184e15bfa175` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/quarter-ceil | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/quarter-ceil.md | `ed8c5fb819f948ea66a242932686aea2f25be36fd550afd865895a417cd44886` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/quarter-floor | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/quarter-floor.md | `4856b9bbdf5de324fbbe497c87bd2bf5fcce78b65d93af4010a834576d9e69f9` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/quarters-diff | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/quarters-diff.md | `c990b5e3351445ac59b14b4dfd52ffea3df32071edbb3aa3db1c9704d6d7c19b` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-041

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 775.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/date-time-functions/date-format | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/date-format.md | `2404cd609fbe408715481bd76ae48d2d910e8de78459023f9a6f852b0e4badab` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/date-sub | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/date-sub.md | `9f223d7bbcd77dbf89345ae33aaabfe69445affc22e85ad603db3795f8f1d889` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/date-trunc | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/date-trunc.md | `196b3b174e3e5ec43e6e2b14bda1fd239dc337ae263a9a4caffd82738a42baa2` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/datediff | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/datediff.md | `0f235fe6a8f490f4e6e786afbd7f49224ae1ad2ab4089807ec5bb0165091cb30` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/day | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/day.md | `95370990b7a4c4632e7d4f67008e8bc3491ea93fedc029ca7a6c6498fe7e839d` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/day-ceil | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/day-ceil.md | `44a04c9c88dbd7eee594267e9155de62f730db082c2fab8ea9e3b718c2329fbf` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/day-floor | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/day-floor.md | `0f86ee32f975609acb31bb3cae770bd532f0ba050acb75778143ec1229e8ca5b` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/dayname | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/dayname.md | `6ac0ac0df71085634f34a53b2f6741fd78269281c8f1d41b2867572f4b844be8` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/dayofweek | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/dayofweek.md | `5ad70581045fa7cbbc91fb6c08694bafbed66305c6b58ba91e9bb8418ee4c355` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/dayofyear | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/dayofyear.md | `1efeb051d077a43a15d0a62ae91863088ed77c5287a7dcb8ab2a1a315a044fad` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/extract | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/extract.md | `72c9e3f0b34f10e035f60ead5bf8b529591a8ee82003dc8f6217ea75a633902c` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/from-days | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/from-days.md | `a8278ec16dda7c1ae0e49a080823f7fc658b0f9ef70a7cd9f2b2ac8600af64e6` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/from-iso8601-date | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/from-iso8601-date.md | `b7e78e902421b90f2fe8bf8dab167319549b5e49497c6c9687c99b015d91867c` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/from-microsecond | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/from-microsecond.md | `5dd4c03247f8bfe2a8ad0c695ca6c37762447d0dd9da7e7db8846c0d101ee884` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/from-millisecond | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/from-millisecond.md | `3d4f39c4c1ea3ef8caa21406500236fd8176cfe5333fe78560c9c05ff2bf80f9` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/from-second | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/from-second.md | `75076f0f016660844b266b5e8502323dbbb49c26fa2affc282e24bd66884dd52` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/from-unixtime | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/from-unixtime.md | `7f957f03a9b19f64b5eb69ff7015a3f0d92f47d2fc882bd3798433e1e10567fc` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/get-format | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/get-format.md | `af7165091ce13a3b0373acc54d001158a3e5841d0d82889925bc3d660d8facaf` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/hour | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/hour.md | `6ec0816a6421c2872b9f7fe0eb3eefc416bd9ecd25464eb7437a2ee5cb2468ac` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/hour-ceil | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/hour-ceil.md | `8ae5b8a28ecec193aa4aa1005dcbc56eaf1a6270d26405452410046e9e478624` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-042

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 755.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/date-time-functions/hour-floor | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/hour-floor.md | `66193411e7e956cc600967da16ce73dad78f187b5fe217eab185438b0db426d6` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/hours-add | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/hours-add.md | `fdb5798e78285ebb744fbfcaaefc21e5f991d945b6ddca5dd4b396c2d0b7f9de` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/hours-diff | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/hours-diff.md | `cf1c3efa7bab5dc88f14497ecf7a9bfd391db2ca02b76521b0c00539c8c7cc67` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/hours-sub | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/hours-sub.md | `190faca5494c230bcae0666fee77652b0051ad86ee8f4c7788b620677ad8906b` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/last-day | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/last-day.md | `d48e13a45c9945b0416193554e8bcd925f87b461af0373f3f2edd7183e07fb0c` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/makedate | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/makedate.md | `ca7a1cf24e6d583d86e8d5bf04cb034349ba1eebef4bb9599306927ff34e6ba2` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/maketime | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/maketime.md | `fade202f353f6319aa8fd35a9a8e46fc5b40f16b193b6153192ba4b7156a9be6` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/microsecond | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/microsecond.md | `5676ad810d9c8ecf02635b90656c43485868295cdcc6d51e42ead972f3172c7e` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/microsecond-timestamp | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/microsecond-timestamp.md | `dc341bf7bbe054c5f35eafafeb3cdda731cf02a4ec7afdda4d63825f7d57ebd7` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/microseconds-add | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/microseconds-add.md | `e9c7ea265a0ea8925e594d3707df758c6a04d7c648ad7715227f1d5fb4640eb1` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/microseconds-diff | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/microseconds-diff.md | `0c112c7f3635a9df14f8f93632a3e0f41473967cf8d306d2edc7f0ac53ca9383` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/microseconds-sub | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/microseconds-sub.md | `ca792ca620d86785de8e6e774b34698e830932b19e63606e1391f24ba581be15` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/millisecond-timestamp | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/millisecond-timestamp.md | `21e26fd35deaea5dd6126691512d6d2f61092ca586c2eaa9966ddc5c528b1164` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/milliseconds-add | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/milliseconds-add.md | `4cdb32ad3cec5af429070b260e6e0f16a2af181fb297ae7b7386af41582f392e` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/milliseconds-diff | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/milliseconds-diff.md | `425189ba138ce10bc1a188298d3ac8a464126f8c7eebb3a00fe8954d50f3b6f2` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/milliseconds-sub | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/milliseconds-sub.md | `18a1d18f4b856a4014c6037f57164ea85cdc95e57f0997ff4cc6a4fbf1564c93` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/minute | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/minute.md | `608939a95b2c323c51b3c69b2a40dc140f51276331fbb292111249f30521b08c` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/minute-ceil | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/minute-ceil.md | `0d8bb1bafb80f02a24272977ecf62ff2f7bbe8a3e71b9c2db4b1181d028dae34` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/minute-floor | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/minute-floor.md | `b05cc0cdf39beae77834f63a2489cfad14dd15ee143dadd7460207e8f824ae30` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/minutes-add | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/minutes-add.md | `234b30bbbb134d276c7485921cc251598eb92cf16caaf020295120182e26194d` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-043

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 735.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/date-time-functions/minutes-diff | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/minutes-diff.md | `9a740eb88b3fd23d8c63675620fa4546b8d82f78cb41da595d02e515a5c44620` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/minutes-sub | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/minutes-sub.md | `b10f088b1f748ffca1898cf69e18cf1c824e68f4dea750065c33650eb553f82f` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/month | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/month.md | `058ac66b72bf1f7776ee6fb01d902323d96e72fd03b3746d625362021aeba4fa` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/month-ceil | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/month-ceil.md | `e1d7d0b50343a7b2e12b1a470c41717bf3c308093f50b3f1a026300997af3e60` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/month-floor | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/month-floor.md | `72f7148582ab576314f09c35a63fd8b4a1b0a394a62c286504cb43a7baaee62e` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/monthname | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/monthname.md | `608abcb2732ec6248100f1d9b4b8f4624783f2d4bf3406de0bec990d10546ae0` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/months-add | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/months-add.md | `71f59e566ce2e2ad65244f284ec0d0d4106592319001428d15e937366060a3e2` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/months-between | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/months-between.md | `57047ce4b283a376b1d7799d52fef43c3ddb18be6dec404ff33258999ab56e45` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/months-diff | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/months-diff.md | `8b276b20582f047138a03f978a0bfa02ef29bef49f8aacfb9e1614b0b117338e` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/months-sub | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/months-sub.md | `e86592e9e063465fc0204c24bf3ca20cbeebc7f400ed16d1999b87e52bee2078` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/now | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/now.md | `1690c85e4a1f15275ca1576316a9314f85b0ec0f0cdac18242e3cc111d346822` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/next-day | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/next-day.md | `6dd886ea974f9b6fb93ae18734611efccbb8dd050357e4770dadfc6ed7915667` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/period-add | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/period-add.md | `bb07294c2a5dcf36bc035b0b61db728b29823eb4f18824a056127a8f351c22f7` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/period-diff | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/period-diff.md | `9ab8923c71cee0fb6799cba83c69d9e0438385df14f492da7bf74ee6e771e276` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/previous-day | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/previous-day.md | `725287fed916928a02de96526e2ee21e57f63edda99454c4ae59257d72846217` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/quarter | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/quarter.md | `e002843ab2c66a3d3be7655c8deb90be014e85ca399f2954a25f1716166e72e2` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/quarters-add | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/quarters-add.md | `2023136ce135dcf7580badd0a206ee4bd3353ceb412bbb40d0ff5be8e4f374d8` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/quarters-sub | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/quarters-sub.md | `78268f429b398055de8057454389a1480182b6d615d04528a9b56adc55d1efa1` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/sec-to-time | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/sec-to-time.md | `f3d65344464df605ad6b3edf43427bda0a2c89124af2c7009a3866d820a02dfc` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/second | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/second.md | `ee2a08f6f4151283c6ea4b2ea9bbc0d980f0be1e928130111a25fdb577925ccf` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-044

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 715.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/date-time-functions/second-ceil | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/second-ceil.md | `cc7c21b9f53ffc71cacd796e17767d6913a1b7e9b6c64de7aabf75e81617f925` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/second-floor | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/second-floor.md | `79d4030b7de45c7279b91d81740071d1341ca873c5096b1705f921acc3a00792` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/seconds-add | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/seconds-add.md | `f8a65d18a2dd501139543287a229242e85a27c1d6e258af48fb7415834d45c69` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/seconds-diff | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/seconds-diff.md | `f3003fbf1b4b102cd8875f9e661472ca69bc6a183b9662218bac3a3f1d80f7b8` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/seconds-sub | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/seconds-sub.md | `9631d6cab67480fc89b464807797ab7538cc4322c253e99ced6c53e649969d7d` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/str-to-date | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/str-to-date.md | `5d87ce3e5149c01b32cbe0168028b3c62a783a84d5739af5125cee351f9e8cd1` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/sub-time | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/sub-time.md | `03ab556f512c62fda5c06eaa5b558a00d743a276d237bb14cc6e8b5ee5348c31` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/timestamp | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/timestamp.md | `d9b3f6cbbb4eb7ab822a237a0514b49215dd3005594ce9c4d9dda3070d08b7c8` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/timestampadd | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/timestampadd.md | `82ee215d5d713a3881850f95f27823338f544cd06048a51cc71103fe89df3b45` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/timestampdiff | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/timestampdiff.md | `ac88a92419e8ab1fde58b14062e170c64859780fbfe6ed8c243472bd55d13995` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/time | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/time.md | `45d77c904d5adba08e8855bb7039e2be76b1f189c76b01a2df94542bdd9adf4f` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/timediff | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/timediff.md | `47315c3730c7887c3a0919ee2b81f453d0a81b2fc67fc59b15e20964496ad117` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/time-format | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/time-format.md | `90307f8650a54d54a33a6e79fb5ad372eede9f740360e1a8a425688a8b085f40` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/time-to-sec | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/time-to-sec.md | `bf40540db1127d1f5af40b9d8bddd66ba656dbe225d2a33a6e70b3caf2643a14` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/to-date | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/to-date.md | `48f42315c6dcdf6171e94d3c12a2a555cbea98b8fa2eea9e9db5e2cf8cfab437` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/to-days | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/to-days.md | `522c27640dacf80936b20f5a66c4f0fd1c9329cdf9b0f9976ddb51639966ad5b` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/to-iso8601 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/to-iso8601.md | `e0a6ce10e62856596d903d5f97b02ec3de0b30a6233bdfad941eed93b72249bc` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/to-monday | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/to-monday.md | `759b3430db7a4b8670f534692c0d45c99d6cdcddb35ba989ac44562e149f3085` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/to-seconds | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/to-seconds.md | `70dff143d54bfa55693186f9a4e168f92b5032a8622691a07dabd56589b382ef` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/utc-date | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/utc-date.md | `a19afb059b0830b325cc56a5681e856b598fd80014a66f67044647f324dbd9a5` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-045

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 695.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/date-time-functions/utc-time | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/utc-time.md | `7ae811b7a9361ff4646bf4a2f5448b69dfd5521f56fcf96e2662705a70421d5d` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/utc-timestamp | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/utc-timestamp.md | `d13b7868743ebda2ad057066157e346ce50d55287c882793646b1b666423b9cf` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/unix-timestamp | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/unix-timestamp.md | `722415879d6d7bf8a7277f49e1a0d3925f143a07c0dd3954cae98cf7050147c6` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/week | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/week.md | `bb55f2d6508544fe546bdb86fdeacf6d5e7a9b2d3bcd9d5e4f2ce17506f7f2cf` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/week-ceil | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/week-ceil.md | `9ab6a21ddb4658a77fb78574a3a178b273a0002a771ecc6e53ae6fb41cdf4a1f` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/week-floor | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/week-floor.md | `2f15842317d6dd7dbd0e0be268d4f25ba3ab67e5c272cd5cdacb2a47f059ac06` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/weekday | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/weekday.md | `63339f56aac3ae6cf0f594872073e412e5c9aab0604d8a2208c50f87ec9c5b13` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/weekofyear | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/weekofyear.md | `2bb8b89ea8fb43a74c1fb2a8cf64d2008cd4e0c948a0714ec1eed0ab1aac981f` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/weeks-add | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/weeks-add.md | `0c921840afb14c4dce486ad651f5087d2c71d8826b500314bb31d7297eec382f` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/weeks-diff | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/weeks-diff.md | `3886c5a103f6f4e57ee03843833858911f43314bce80b5e6104cffb4007f951d` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/weeks-sub | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/weeks-sub.md | `f6e4fb858de5fd7dbded05801fa771fd5d2387aade78a865e7e76ce6ace4348f` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/year | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/year.md | `eff3f03b0d9728d55dd771061d2d7c79f03842433f8c9e6fe076f2b472929dbc` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/year-ceil | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/year-ceil.md | `c7f4dbeefdf9dd171ecb006ce5bf75994189630a6ac8b7fed8e64fcfaffd0896` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/year-floor | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/year-floor.md | `a925b5ba8d895e7ef50edf0b329ab6ae9e47f5b1041fb7baba8a2e286fdd8b1f` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/year-of-week | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/year-of-week.md | `959f835fedd93ad8365835a12ac1687da298830fefb1023f32b84c111544bd79` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/yearweek | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/yearweek.md | `4bf7feaac15998fb214e9f59b51dc0475ab234380cca5c7a086f79ac85837bf3` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/years-add | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/years-add.md | `286b0ca2fd573aeda2703bb84a37b1cd6ce6b79ea781d08fd888dd53b585ab22` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/years-diff | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/years-diff.md | `e9e76e8d037c9d9431a7a5f571f9d233413db53d725017a19344900e7bb92222` |
| sql-manual/sql-functions/scalar-functions/date-time-functions/years-sub | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/date-time-functions/years-sub.md | `671951a757d78868b115ce2bae9e8a3aa0f6fc19dfc01a0c853cfe50adc99fa6` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-angle | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-angle.md | `f14301cc3f0bd48dda8b8e75688c876b04b77036b95f869bf04abe720a1f97f6` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-046

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 675.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-angle-sphere | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-angle-sphere.md | `52b997bb87a5b7ab6a9daec3683196309a18e45a7ee433eda7a0398916fd3233` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-area-square-km | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-area-square-km.md | `cce69ccd8b658c8dc643469890a43ad73b47c97a518e6b3e2a0fe7d248330eb3` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-area-square-meters | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-area-square-meters.md | `8277650d50c01d9482ca8025e7d0d68c55c4266a7d957996c56be5d369f31546` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-asbinary | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-asbinary.md | `d6d6eab7775735ade09988a5340d5e416cb2362dba64eaab3328b2796ee12ece` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-astext | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-astext.md | `b0bfc00517adf32c7c1428683193675278a34f9cdf0d6835ac108f9b6b372baf` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-azimuth | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-azimuth.md | `0da4751449f928796e35896eae96eb75548b51dbbf1b7783bc6072647ab544bd` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-circle | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-circle.md | `318393b07883973a29f7f2a1f4a6f5d00588d10b8a5baa79044ff21ae4811a93` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-contains | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-contains.md | `c885be933902d9bdf622abb6b7b3fd4b2919e9a33911b5c8d9faf5197766605a` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-disjoint | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-disjoint.md | `1118879b1938801594a2ec2708ca35d417eab04fb34a2de4b58f39b38311fb01` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-distance | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-distance.md | `aa464386a0dfefe6b3e613bdd92e3af92c7d2532789d68b30a7785ff4eacd535` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-distance-sphere | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-distance-sphere.md | `4c3e13b650538aab9369e4990df02de4d4d16c7287d361b39d8a1925109d028c` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-geometryfromtext | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-geometryfromtext.md | `da03ae5df0ed679f08778b828ea9d1cc94a744c04afd337a96fcdd2cfad4a72c` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-geometryfromwkb | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-geometryfromwkb.md | `9fbe6802f56d52f8c33cea306a950fdd35c86b7cb327ae67496a79329c00633d` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-geometrytype | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-geometrytype.md | `784888a75f4894b867b1859f011d3f340d2f01d5c5df911b1464f8594847a2f9` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-intersects | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-intersects.md | `c6502b4dc6ba0f2593e576439eac30a9f137121bc598fe98d0226950ce3b69ee` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-length | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-length.md | `fc67201b8658c682856a8c1a1d1e2c91f40a7d808999346f0bcb59d5ab1313eb` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-linefromtext | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-linefromtext.md | `6bb8c35859a6247c9ad2de4a56566a7b90740b140740b9fc786e26db55643cc7` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-point | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-point.md | `83d495bd114debbb77b5b9767aeaaf86ee87ff1a0915dedfdf1aa13468837e67` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-polygon | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-polygon.md | `47045fad7aaa2ce14f070a48d573dda414a9c1ed5ee52042c533da3ea40d7fd2` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-touches | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-touches.md | `5089b823f89364824f04f7d27437431aa8178f97e99a09f5970faa68bd7f7e61` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-047

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 655.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-x | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-x.md | `57448215a7f9b58640f55ec5616b106a312b9de7664979e705a010a5b522eb58` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-y | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-y.md | `20a0a1aff51a7e5f635f754c2e2fd9956e58ec4da05ccc866df3d808e659654f` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-decrypt | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-decrypt.md | `5d8481a54a9787803fc789632feea47c48fff3477b46fbdb3a71ef25e58645e7` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-encrypt | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-encrypt.md | `ae1ef3e94f89f5b3d15b1757af9c520f9208be4355bf7a5727dd46a683f67af9` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/crc32 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/crc32.md | `79b5974c6750d926449451faeae2b524229267b4cfbf52db045188959cfa8b92` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5.md | `8e9693991e9ef0af5cfc335bb4b460cb310747ab0a1d9c6775bafeba21233094` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5sum | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5sum.md | `225c9d23f776b81f9f616ef27d8dd007021295b8d757e7795da44b1318b50466` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-32 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-32.md | `48eea88b180ac7a386b3da0323a974c5ab2d82f15d5d2534f552566b91b8fb12` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-64 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-64.md | `907bb1deae73a6f25a4570062bf443a0b200cb5b13ce281c1bd0357793094c05` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-64-v2 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-64-v2.md | `ba559c57fee905e073b533dc702b9307799d33cc6683a68dc4260a4a3b05da58` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-u64-v2 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-u64-v2.md | `f543edf6cb062daa751657652f3bdd5df06f671602e7f53919a7581a19b768d3` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha.md | `cec14bd166f111636db4deaa01762ad89f2a13d430196774c3994669a2a46ac7` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha2 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha2.md | `6fe20bea7b06c499e55911d3f4114f4919cc36a40c7ba939bd18d52fb20bc38c` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3.md | `b7429cc6b90a18989130762f0002f239621195478466a9c4ec6ff0a47968981c` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3sum | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3sum.md | `553b14aefc87c7a23b52c9375cc3635e4372bac56fa386b50fec4c0d12fd4a99` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-decrypt | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-decrypt.md | `1da31e44ee8757506f5a77fa621d987546a61803bc13bdb61cc714f0d1432e59` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-encrypt | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-encrypt.md | `5a0bb5a2a99ee7d78609928f27415212727712dbe0d3a255638c9f8cb6c27f84` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/xxhash-32 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/xxhash-32.md | `af84351f954ff461c5c4131d55fb0266733ad2871c9bbe826198bf0b7971717b` |
| sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/xxhash-64 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/xxhash-64.md | `81842fae2952c62175f21758d04ce3d25415b10b21f405417e1b5a54567b2886` |
| sql-manual/sql-functions/scalar-functions/bitwise-functions/bit-length | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitwise-functions/bit-length.md | `d8c24f26095fb2394b6a517b0d1dea9f8a59f2dcddd080c60a088e3b22f8e557` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-048

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 635.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/bitwise-functions/bit-test | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitwise-functions/bit-test.md | `977e892df9e55e3700a9ce4f8ba76af84ceb0041ac688f996d32dbfa1d0870b8` |
| sql-manual/sql-functions/scalar-functions/bitwise-functions/bitand | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitwise-functions/bitand.md | `1787ebc04adc6a285d92019926f845ec67df8ae1c848f0b2a92cc909324d03cf` |
| sql-manual/sql-functions/scalar-functions/bitwise-functions/bitcount | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitwise-functions/bitcount.md | `4a5bbef62ee2c48d24b5989492d45c8dce620d1638f5696efc30ca1728cbedba` |
| sql-manual/sql-functions/scalar-functions/bitwise-functions/bitnot | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitwise-functions/bitnot.md | `c7808b1d6f0318600a10a1bc4e2a6393e962d90f7e4fe1bdfe98797221e2d9b8` |
| sql-manual/sql-functions/scalar-functions/bitwise-functions/bitor | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitwise-functions/bitor.md | `3d250102108390c4613933d52b7c12a5ea2f40f6f8d27ed1136535d318eb64a6` |
| sql-manual/sql-functions/scalar-functions/bitwise-functions/bitshiftleft | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitwise-functions/bitshiftleft.md | `257f42d9b7445f9a8953a6ea6280e2842f86759237522ff1d0fe18bde04cde07` |
| sql-manual/sql-functions/scalar-functions/bitwise-functions/bitshiftright | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitwise-functions/bitshiftright.md | `919f85e3c5d6b0e5e545d0159063e2da14994483f9516546c3b86203f49cf96a` |
| sql-manual/sql-functions/scalar-functions/bitwise-functions/xor | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitwise-functions/xor.md | `1eeb55b5b40b48d4b668e3ebd276939b448c63d39f1689e9531700a4a913b55a` |
| sql-manual/sql-functions/scalar-functions/array-functions/array | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array.md | `d027deb3aab016449cef2f936639afb23adfb9ed47aa5b2f1becf51d435be3b9` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-apply | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-apply.md | `c9e153030c2696fb16c6c226977a101d05bb467c11fe8c7ef966e5e529f285df` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-avg | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-avg.md | `b8bc92e862a34434a78ca153ee2b07229a1c476cb959ca7b1edffdb02af5d03c` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-compact | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-compact.md | `9005e95a24516d29481dfa6946272e9ae7393902b7e7b3d8930f8d5b816ca1af` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-concat | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-concat.md | `fba0ad984d31569632e4c51ba7ad9fe73576c283978e1ef903128184b8dea8a9` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-contains | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-contains.md | `4c73c47e33dbe72f7d0226c557c68dbad07b45e3e20c0256bc195b15f8bd3161` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-contains_all | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-contains_all.md | `e08182c0a55096d7825ac07d959eb5fd5ccf5b2e079270e6b17df6296c9ba81d` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-count | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-count.md | `74be7145b0848eaadb9cc2fa7e7c4a4a73340cd735cbed81af286eeab63a5025` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-cross-product | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-cross-product.md | `99a77818f49cf8623a5907153f2781032abec2b09673ae1fed332613391da8a8` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-cum-sum | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-cum-sum.md | `e7053926e5670512b52c47a631ebd821eb8912b50400fb3c9184f5857bb9b067` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-difference | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-difference.md | `ac26d0e8d02db886bce4f82b8a3e529f2d0e6d467c8859b62b92b48913674c0e` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-distinct | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-distinct.md | `b400b4e2df3270a2918d18b65140752079dacb055c799a2895c705054bdc74ad` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-049

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 615.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/array-functions/array-enumerate | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-enumerate.md | `e7de812ae187c0b58ce49c58ad08c98818f3e18b3908ec558516475aa228eed4` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-enumerate-uniq | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-enumerate-uniq.md | `f513ab600ef88721a39604d187540c7bdb1bfcf949175e71f0202416d260b4b8` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-except | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-except.md | `1a830f6e64d8279707c1480c9c84a749c86f1c1ec27592e236c2e79509fdd62d` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-except-all | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-except-all.md | `e2b68fd41d9e340311d989b880c698a87ce2c0a8fa5e223afe1cf98a1100f292` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-exists | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-exists.md | `cdeeb359feb95d13a31a5c3c6c5fe0c8ef3fa0aa777c733381041b817eb64334` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-filter | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-filter.md | `5518ea73b5f3eed3779638d8186fe87f46206746525173271ce2e4648b54c89a` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-first | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-first.md | `b8fc201bdad3d246d32bf20b9905f14fe3f0420785b41ac8f8b4b97054b7cdc3` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-first-index | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-first-index.md | `374350538b5ebd4d6ec35402a7373475a0e7d3b78db63b161f19685da8b023aa` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-flatten | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-flatten.md | `19ecdb11508a0c7350dcc64573c9186af076c673ca35b3e947ed6e2fa11f4b01` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-intersect | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-intersect.md | `4f6bfd7e35052240dc079fff7d2e6e7f0fc08a518a0ff2d6e49493534dadf7ba` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-join | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-join.md | `ed90ec505addca611d2d4180404dd7797e6fbd9497212ccd0c20785bd78c1e0e` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-last | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-last.md | `bbdb2795a7b12acb27eb0d66bed588a64ae2b773c569981e077a859104786eea` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-last-index | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-last-index.md | `a4c9cf1d038b4e2845b3a73c36ca94874b1e1ed2d19d3da7abd4a47e13d9e8b2` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-map | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-map.md | `1578b915c5cc9ebbbfc8dfbeeb0f51f7f4872617a1b15fc74acdf5a4a09d874a` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-match-all | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-match-all.md | `fd03224169981fc4ce63831d919062d7cd2e95fd6e207d509a4c80bcf21f5e68` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-match-any | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-match-any.md | `88a9455c4e5c37c8829f8f1e91e25cb29df12a600d669c971c69b069995f80dc` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-max | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-max.md | `c2bf4667cde1d397a888d4605486daa46dee15672fb12d1103b4eeee72ccf5cf` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-min | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-min.md | `36ed5d9b770cd78621c55d9142e98778fc69e4b530ff229895030af343b48576` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-popback | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-popback.md | `2d446a89c5d0b74db6958e0b090ea138e9edb375913de0d3b25089db18177a33` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-popfront | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-popfront.md | `aa12840505aa315e25108e67bee2630444b2a14ffe0de8083feba7afea373b1d` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-050

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 595.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/array-functions/array-position | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-position.md | `d1d274b454ba49e7bec6241753282611684ce6c1ae51cd161cb8affbb3d010c2` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-product | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-product.md | `7c974c651b26c08be2858b6822948f4a29a13f8d9b1be851a1012f31969681f6` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-pushback | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-pushback.md | `9a0756f0721aa412e2085687e85230ca5dd11818127a40e1789d19eb12be37c3` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-pushfront | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-pushfront.md | `3e21fd2a4e390a1daac6b34a2b04d492dfdd2e54bbdda10fb87eb71a3036fa69` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-range | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-range.md | `7a90b1523fd845f74b1a6b456e9ff4df86da77145283691145856c86daa2bc65` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-remove | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-remove.md | `1c8aed7adf28a5067d8a4f947ac766aa2eb208231ea5d023ba5c1a84b2366993` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-repeat | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-repeat.md | `788f236d7f2e39629b6dd2a5b32110ddc86fc249bef7f071c8f7bbfe83ba3406` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-reverse-sort | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-reverse-sort.md | `851b4d3d038a3ab584218bca3927507b0c387f4c5b0a6224453669a84721f9d1` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-reverse-split | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-reverse-split.md | `e19e7046b6d23910e71d53a06058ead1ca0bea33fd7aec1f5523a77ddc2873bd` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-shuffle | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-shuffle.md | `1add2afb10a98fe97270845cc4bc6518bb0de772cd50188e6ed5bc54f30a248c` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-size | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-size.md | `a87e03293a632e5add65b971287419d95014c31588e81ab408a15d1023d24eea` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-slice | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-slice.md | `96f0346a8b2b61985f2463a0fc37a8501951ad92240a308e48a8a594eece8cdc` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-sort | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-sort.md | `7206ee3d412d8d7df557b434114a7596342a52713c38214aa5400909336929fc` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-sortby | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-sortby.md | `0880754b1b79dcc76e571917ba73f164887b3d0ffc0e4fbec3730caa49730bbf` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-split | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-split.md | `4ccd6bd26c671e7cb343a7205097d7ed807d317353254c2c77b57857843038ca` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-sum | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-sum.md | `865840fe2178ebf443dbecb306d4daaee0bf47e9b8a3c0a1b1e5e496c058f8a6` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-union | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-union.md | `e7183fe9ac0105ca08a3e8e10735e00848ba41b01582107d9c19ecf04a5a75d3` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-with-constant | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-with-constant.md | `891e3d13dffdf0225aa9322292d1ab82bdc8cb9bdb27d302b9f1eee3ec17c847` |
| sql-manual/sql-functions/scalar-functions/array-functions/array-zip | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/array-zip.md | `ba4b6d28e56d6c6bd40776b7b083ddf27ad85bde2674cb9a32fd70ec4a4ceef5` |
| sql-manual/sql-functions/scalar-functions/array-functions/arrays-overlap | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/arrays-overlap.md | `03e60f3d5df46c7178902e2279be7e1b2daf5bce7414b9c8e7183a932e501d19` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-051

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 575.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/array-functions/countequal | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/array-functions/countequal.md | `154c3ac0284c8b6edeefadb10680256451fccb405d18e174855fe47d785052d8` |
| sql-manual/sql-functions/scalar-functions/map-functions/deduplicate-map | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/map-functions/deduplicate-map.md | `f0dc9711a648d6e5d38682bc774fffca7b767a68938cba91ffd15a0b9dbc1947` |
| sql-manual/sql-functions/scalar-functions/map-functions/map | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/map-functions/map.md | `5a14915765d979cec676970256c5563fd8f892eb37ddb34715bcf1043630c3de` |
| sql-manual/sql-functions/scalar-functions/map-functions/map-contains-entry | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/map-functions/map-contains-entry.md | `0613960d8c8865ad5706cd8f2b5df2b6e8866636b3d46933af9e1b11ddcd329f` |
| sql-manual/sql-functions/scalar-functions/map-functions/map-contains-key | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/map-functions/map-contains-key.md | `1f5ae8747dc01cf3dc8cfa6f23d3b3c653da28e93b8de8d4d79b0c3c71c45cd6` |
| sql-manual/sql-functions/scalar-functions/map-functions/map-contains-value | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/map-functions/map-contains-value.md | `196bed602c9439a7a637883f9d9241e9622a53ee45b41b860f0c64037e53616b` |
| sql-manual/sql-functions/scalar-functions/map-functions/map-entries | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/map-functions/map-entries.md | `77606dd0c1b5d2ba4503bb0c4ca07a093a4912e4762b098d5b48e8e8ca9f34a2` |
| sql-manual/sql-functions/scalar-functions/map-functions/map-from-arrays | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/map-functions/map-from-arrays.md | `16e6523a39ac93a2ad60085d69a3507c276271ceac2a5c516d7dbf8e6806daa9` |
| sql-manual/sql-functions/scalar-functions/map-functions/map-from-entries | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/map-functions/map-from-entries.md | `b713b86d3539876c7bcf21ec4ab1da8ac42e87823a2fdf28b8673d19f1ff4875` |
| sql-manual/sql-functions/scalar-functions/map-functions/map-keys | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/map-functions/map-keys.md | `e845be5a9ef7ff01c71898efcb848b9ce5b2ae9643b43e30e15feff2f239059c` |
| sql-manual/sql-functions/scalar-functions/map-functions/map-size | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/map-functions/map-size.md | `d854bcb4c2c65eb46f0321f9b9e23eb1a993e594815bb7efab07a54a86068417` |
| sql-manual/sql-functions/scalar-functions/map-functions/map-values | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/map-functions/map-values.md | `da8e431b96f86933eef15039fe20e0c27bc120630a80e5fb42cbab2ed0cb6af7` |
| sql-manual/sql-functions/scalar-functions/map-functions/str-to-map | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/map-functions/str-to-map.md | `6c20f2dc6f978bc12fe195d545bb49266984025cc03a29ef7d852607b8a8d335` |
| sql-manual/sql-functions/scalar-functions/struct-functions/named-struct | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/struct-functions/named-struct.md | `06e22fe30c479c33ec9383584cd5e012b8a7924480022b640a6cb7be745d412c` |
| sql-manual/sql-functions/scalar-functions/struct-functions/struct | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/struct-functions/struct.md | `06df78c8bdfb558acfc1bdd34ef1907cdf403997435262a905e09bd97fb84628` |
| sql-manual/sql-functions/scalar-functions/struct-functions/struct-element | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/struct-functions/struct-element.md | `c27240ec2c0477b268d5401a4303cab01f976e66b241f4b3eaf0102185c977bb` |
| sql-manual/sql-functions/scalar-functions/json-functions/get-json-bigint | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/get-json-bigint.md | `6bbe796ecb280ebc05a4ab5375e73d445a6d8742b8c615c119bfacceb64bf8a3` |
| sql-manual/sql-functions/scalar-functions/json-functions/get-json-double | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/get-json-double.md | `beb80f608c0aa0fe26eabef7d9db4510d6980e2ae1875841518bc99a71120545` |
| sql-manual/sql-functions/scalar-functions/json-functions/get-json-int | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/get-json-int.md | `6d6334901c66c1a928877325a71e53eea754713d9dcc114517d1bd6c22f3a081` |
| sql-manual/sql-functions/scalar-functions/json-functions/get-json-string | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/get-json-string.md | `34b99ab4c5af13bdadba4528c3856053041e7e1122e0c4a7447daa8c1aa5da76` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-052

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 555.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/json-functions/json-array | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-array.md | `d2c186999632f426b62e3837307a58b30b79ab37787bf0020753acec77a3d664` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-array-ignore-null | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-array-ignore-null.md | `61439d481e866a3dcc7b131a57ab3560bc00da9ba066cee7d178a3a5479792a8` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-contains | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-contains.md | `360cf0e65c83eb5578fbcc3c6be1e726019963cd7b34a53459cbfe1bfbdbd100` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-exists-path | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-exists-path.md | `1037d939eb7dc2d95331b38a1335d7ab862c9752bfff28564e0278068d4e65c7` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-extract | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-extract.md | `8973ff98eade87312604a0441532b8a2d0171d0bf8cce58f92c96ab90fd04505` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-extract-bigint | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-extract-bigint.md | `ce6362895c563331b1a780227136a7eb0036c685dc7c97e099669ccd9502b938` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-extract-bool | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-extract-bool.md | `de031dab37c2864add1f2e2ae02b8dbc6d89f04cce2bf6827b585dd176136d8b` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-extract-double | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-extract-double.md | `f54d097449fd56c97edd70573fc6323ddaef9007aec29fe507ac26a658c896de` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-extract-int | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-extract-int.md | `59e1b308603d916d5b8b475898e7b3a06c76288c0e61930f03a112ed6061f064` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-extract-isnull | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-extract-isnull.md | `695e2129b53e01e61640f9cddc1ded9c4a768d654f1dcf4cb9f8bcf92324f1ef` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-extract-largeint | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-extract-largeint.md | `f83fbb7e607ce893f0b13257cc2e5ba31093b66ab27b59278fc7102932a98ad1` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-extract-string | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-extract-string.md | `0e44b5eb877202e153dfa109fc0d61d96918ce5096a0688fc2fbee534a8a68f6` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-hash | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-hash.md | `0d27b73d6277020e19b5f0231e62d1f7b9a029af7ce3110c42d92bb2d405189b` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-insert | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-insert.md | `66347c867efa173f543c3208eb9e4fa1bfd40b8ac6478065aa06324bb8f67ab3` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-keys | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-keys.md | `73115c5b56490e6cb01de13f287f3d3e69dcafca02de6ed6226237b01d696166` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-length | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-length.md | `06e10fbd928d5addc4b6accf8c39f6095f0989f13cecac911251df75e66dd3fc` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-object | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-object.md | `b4a3a24dede8e5f98af71dc005336296b98fa9c176b34faec2ea89dd4e8fae68` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-object-flatten | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-object-flatten.md | `e1ac625975f06abed9f65da497f0e0c082985373def106265d393c1997f00a54` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-parse | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-parse.md | `d68c7c8e923c8818a4cb7a96c836cf34a6b6bf204f9c84a10f27b32280416f30` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-parse-error-to-null | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-parse-error-to-null.md | `5fef7098d93a3c736bd2242e235eb9ebfcb5e21b6f69ed121578be154bff240f` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-053

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 535.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/json-functions/json-parse-error-to-value | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-parse-error-to-value.md | `29ff9ad98c4d49e438de0e71c67139018108c7ec606e2abaec3d237d0d145ac8` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-quote | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-quote.md | `60ea01f06e9195c772a7c87752168f51067e9cbf0ea9b98b548e2fc2a9eaed7e` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-replace | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-replace.md | `bc20c6676d8e14a84286dc7e71a73ae9f1e768d807d36557861a471bbc0c7b69` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-remove | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-remove.md | `645ede3af1c947ce7e01c67ead31866185c7bad8c5d16dae2c4cdb1b94e0f185` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-search | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-search.md | `c69b61b7f173104465a5abc54c20ed7e2a8cddb2c268b1a9c8b5fa06fbcdfc2d` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-set | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-set.md | `4d0d3d5e3f28f92371baec8b0ffff0857ebcdfec9b8db10e3be9bb381d6f12b7` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-type | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-type.md | `b7752114eabed644c47bdeb1ddc1c14c2a673738dc62869101aaf108dd9a94dc` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-unquote | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-unquote.md | `124987a2cdccd6458a69b7d839ff6f26c3fc0e98d1d78ec38dc71a89f2163b2d` |
| sql-manual/sql-functions/scalar-functions/json-functions/json-valid | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/json-valid.md | `2b037fc55b7d387b50f8cd19d8bf915dc2a6ffdf6d7f7863a55f1cf0fdb2912c` |
| sql-manual/sql-functions/scalar-functions/json-functions/normalize-json-numbers-to-double | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/normalize-json-numbers-to-double.md | `ba669573c14bdef01775207921d1b475296f889627dffbe506f44a14e4e72066` |
| sql-manual/sql-functions/scalar-functions/json-functions/sort-json-object-keys | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/sort-json-object-keys.md | `0d86f72816a1071e05e489e6f0f7266ec8eed21981fc2dfd21f10eb4ae62069c` |
| sql-manual/sql-functions/scalar-functions/json-functions/strip-null-value | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/strip-null-value.md | `f9b2d37cc9975d2f290a09abf20a0fdb6379374eb59c20068df3548b2aa32150` |
| sql-manual/sql-functions/scalar-functions/json-functions/to-json | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/json-functions/to-json.md | `f327bc696a529c298fd9d9134830731d44d37b2273751256e7d29d42ac0eda94` |
| sql-manual/sql-functions/scalar-functions/variant-functions/element-at | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/variant-functions/element-at.md | `db6f90346e1eb85ad05b686b54142a9281f7d456046a68c773bcb3b97cde7b38` |
| sql-manual/sql-functions/scalar-functions/variant-functions/parse-to-variant | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/variant-functions/parse-to-variant.md | `abbf7b6c2c8e3b0a2ae4ad3863a5b5f2a848058fa2ff6947fd0a569645d5ec8d` |
| sql-manual/sql-functions/scalar-functions/variant-functions/try-parse-to-variant | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/variant-functions/try-parse-to-variant.md | `72e3d718ad12f85ba4540e75fc4bc919c6f038f92dbca04995a3a5e923d4fff6` |
| sql-manual/sql-functions/scalar-functions/variant-functions/variant-type | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/variant-functions/variant-type.md | `07263c22a3782dd20e85e2674335aff4bd7e6ee8470544d4b4cf5342162d861d` |
| sql-manual/sql-functions/scalar-functions/ip-functions/cut-ipv6 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/cut-ipv6.md | `29ddd9382c119c175e62a229309d62da4c93e397ca7ffe6f89dde057f0a2ad53` |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-cidr-to-range | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-cidr-to-range.md | `bde9bc8b1c3a5d3676d69fea106238993350e6bb12286958cbb91f01619306d7` |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-num-to-string | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-num-to-string.md | `2856b3951235d91c26a0f128e5031ca6f5a5241f0f4f503310666c604de2f988` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-054

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 515.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-string-to-num | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-string-to-num.md | `c24a1d506ad8962f9c670ccf3ec635486b5ae84172669b9c8059daeda751631f` |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-string-to-num-or-default | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-string-to-num-or-default.md | `0cd9e57348c012c99ffb31377f77fa257ef1f70df021c358f710308dee1f2ed5` |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-string-to-num-or-null | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-string-to-num-or-null.md | `154ea2635a7d4af6567e47687e47f22bccdc877ad0a145b792a79fbd08b447fb` |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-to-ipv6 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-to-ipv6.md | `628c3f6a0bf3c9ad8fafb6fc633e950583132b1b7a54d9d275ad3584b84d20b5` |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-cidr-to-range | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-cidr-to-range.md | `85dc22eb79ed03f574d556fb975cbb4b00f1ac960dd6fd9ff4a36585c271ee74` |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-num-to-string | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-num-to-string.md | `f4d4e5cfd7f243efac8003690bd1e45fc6d49ddf65953b29981549f0f1c4accb` |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-string-to-num | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-string-to-num.md | `62087683ebdd9d6acd16abb30e115971a505d27559a3b13c7f4b260f5562fe65` |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-string-to-num-or-default | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-string-to-num-or-default.md | `a5c8f7f72ec301ee2cb34aa2d27a5822b8ab2b4967cafe3ff47a18562b1adde0` |
| sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-string-to-num-or-null | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-string-to-num-or-null.md | `2c5055ccdd9b64c408dcd852546c4f4ec1bbfb5b15385a9f14a4bd403697fe07` |
| sql-manual/sql-functions/scalar-functions/ip-functions/is-ip-address-in-range | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/is-ip-address-in-range.md | `0fe428a7fc5cf9af6fcc36df79369763a152b9d0319cf41f7f7f198d850f25e3` |
| sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv4-compat | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv4-compat.md | `6dda1ac60066d767b20564fa9c73ac2a24db176381bb85f5af71bfc3d7fc91f1` |
| sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv4-mapped | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv4-mapped.md | `f03c4f18f85fc9d337e22d3186bd57daad75ffc942345a1d14f30108d620dca7` |
| sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv4-string | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv4-string.md | `dd734e96dfe3f6a5fa3561ecc5dd3587a8ab0b1a472bd10b3397b026df5c934e` |
| sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv6-string | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv6-string.md | `3561ef2f1682ec3b1e6e2fc6125cba9632033ef912952bea9031f52783c0a6f0` |
| sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv4 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv4.md | `654d9f7f817bcfd916ae6f780b7844eef1b90878905f30d4f46aa633a45689c0` |
| sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv4-or-default | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv4-or-default.md | `a342733812272df57b9bd1b5fbf2924da691e06d02fc2414689390373b98ac47` |
| sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv4-or-null | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv4-or-null.md | `45eca0ff7b4546147a93c43439bd4e1310d548aa93ebbf47a3fc1f7dddc7c0db` |
| sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv6 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv6.md | `32c86ef9ea7c9bd6f6afa021877d3ae156de6a8042351ee2762fd67dbed92a6b` |
| sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv6-or-default | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv6-or-default.md | `f24f6094c1f87e4ef06df36695325850b67da4ae8a23d05d55e690f2721ec413` |
| sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv6-or-null | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv6-or-null.md | `c501a45b49e23b7dd5632d9f436ccf930f24ae1fe45bd480ad6f3fd0b927d6ee` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-055

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 495.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-and | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-and.md | `b122a873a7001bee48b1c99374cee0c020c07350269d428340ad4534f416f675` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-and-count | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-and-count.md | `7553f33af93c66d71fa207e5ba73b10e2708b987630f23f84e760b6a44d7f395` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-and-not | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-and-not.md | `d89a7fb75209afa6d0bfe1fe1ba8a7f3d2ce961a92c86d1e02e174a1d585cd27` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-and-not-count | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-and-not-count.md | `1c1d39979e96ea134639ef2baf89d3bcfc2ff46d185098b34b9930b2b93b39c7` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-contains | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-contains.md | `37c3a84e832a0b44b8de88b6d8f5318a3e78d6bf2299a8460a60e4e0012d10d8` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-count | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-count.md | `a04cf43a655117f48105179589341ba8981e1b1bb3b249882fcdf9978ca79ca0` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-empty | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-empty.md | `dab50ea71c8a4e4287ff6ae1861836a15ed46b48bb01c15cc9889e806c127702` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-from-array | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-from-array.md | `86aeefd42cbb4f6dd964c8447a730c393a03bfe03b645aecbcbf77c938735fa1` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-from-base64 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-from-base64.md | `90882f63b1aeaf29947b2c290886946cadced85a1105f8f3699d8e9af02e7219` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-from-string | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-from-string.md | `e3ea89df4e860905b323cbd95ee5296275be00025e43e7dcdf2602df2c297748` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-has-all | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-has-all.md | `698a589e5c2c8d7df8c6ae7140ce084442f2a7ecd78cecef8aaa042e47bfd520` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-has-any | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-has-any.md | `af68cc16122c576a0fe88718a867a7fd0646208420d6ac8c04490a32399917c9` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-hash | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-hash.md | `27f55a1741a611511bf06a92f209fecb2ceb2f44def4eca87f2e66a331ac0be7` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-hash64 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-hash64.md | `d6c21f81074e0b565344ebb82131d1f16980404062b613555f0d6d94aa9244dd` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-max | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-max.md | `027d23a822bb96b388724307c20e98224551954a2f73197d01687b827527b345` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-min | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-min.md | `358336b8c36ad46e966fc99eab0e292cdeb7b12a117a85807fa54c175b3d0693` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-not | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-not.md | `54cef847a57b7b66a3c6286eccc687034b1654cad30e00ac66534096e1c321f5` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-or | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-or.md | `b0840bdb69e861e21eb3beb7a09dcf40279023edc6b79870eec0905181ce561f` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-or-count | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-or-count.md | `4419c24a5a3ac741d26d2553777b0398836ccb96e0b78d42099b7e96c3209e61` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-remove | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-remove.md | `d940b930c32912dfdf8db5bd342f91ce282a9bb088bceec1f47482e1d754d983` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-056

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 475.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-subset-in-range | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-subset-in-range.md | `73ebf218c05157ec1d3544f8bebab2d7e7e6f47bee2f2e76bc2f76bd2d2df457` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-subset-limit | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-subset-limit.md | `e5eefa4b606c8e7e69d4790d33eab325581a843c8040512699c052992c7d8496` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-array | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-array.md | `27d4c1ea25f622e08ab8ea22d9b10bc3108a39f30e6678464ddd52e7c35a248f` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-base64 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-base64.md | `1d8d491ef270822f1fa5bf6ab42ad74034c2ccf15661c35beaa0ecc53ed64079` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-string | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-string.md | `f812df9b1d04639c7127295dea8684e1104ebf2fe242785ccbbfd209f575cb27` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-xor | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-xor.md | `7e668cd243b7511c519a6725c55ad9638a47674fd92e9bf06b1cd6012b6d53e2` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-xor-count | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-xor-count.md | `3abf72b932d3478ff37a17ba94309084b0d01fdb492b77185c688311bc63dfe3` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/sub-bitmap | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/sub-bitmap.md | `98a350b68d1608c461a7801dd7430f9f55914a8c4422c45bdfb1fa63131f9f47` |
| sql-manual/sql-functions/scalar-functions/bitmap-functions/to-bitmap | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/bitmap-functions/to-bitmap.md | `e95344811acc3c6bdb0737c4d33a0a419348da806bbdb7938119e94a5142c1b6` |
| sql-manual/sql-functions/scalar-functions/hll-functions/hll-cardinality | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/hll-functions/hll-cardinality.md | `e21b185e94040ce93d699d909edbc89f888b48a8dc0a75bc1e22779e416c09a4` |
| sql-manual/sql-functions/scalar-functions/hll-functions/hll-empty | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/hll-functions/hll-empty.md | `ee0927c2ae95de8bae4925972e000914fe412c3e61789f18c0bfe70adbb01cda` |
| sql-manual/sql-functions/scalar-functions/hll-functions/hll-from-base64 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/hll-functions/hll-from-base64.md | `ed97b51420bf2c52404967067ac339c0a969a6337cf7b43bc31e66b435443142` |
| sql-manual/sql-functions/scalar-functions/hll-functions/hll-hash | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/hll-functions/hll-hash.md | `7435826f3a44b3a94ef205e7eacc79211a5b5bf3b6520910e853d7326e8bebbb` |
| sql-manual/sql-functions/scalar-functions/hll-functions/hll-to-base64 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/hll-functions/hll-to-base64.md | `af5572c2a9639e67fd8de4065b129b64832b32e5aa9725a30846c694e9ac9e01` |
| sql-manual/sql-functions/scalar-functions/binary-functions/from-base64-binary | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/binary-functions/from-base64-binary.md | `d9f4ca085c7cc2f1d17e5aa598735ef89bbc68706b80bfc55e5f5c07b9b73e4d` |
| sql-manual/sql-functions/scalar-functions/binary-functions/from_hex | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/binary-functions/from_hex.md | `3cc15c696d4a2895ca5f04e50cccc0013fbbe7b24877c241be471a1889692c27` |
| sql-manual/sql-functions/scalar-functions/binary-functions/sub-binary | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/binary-functions/sub-binary.md | `641a1431d2bcee01249f2dec6c0eb922994a02f84268e420ef8c8a00f547d35a` |
| sql-manual/sql-functions/scalar-functions/binary-functions/to-base64-binary | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/binary-functions/to-base64-binary.md | `8eb96b6e9c554253245d91ec318c12dbfa113a5d94e686fa86a1503c0e8bc1e6` |
| sql-manual/sql-functions/scalar-functions/binary-functions/to_hex | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/binary-functions/to_hex.md | `841cd079a456a0685dd247e1766ecf0d6ed86a0908d0e2d77bf0bb5e5b423f94` |
| sql-manual/sql-functions/scalar-functions/system-functions/connection-id | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/system-functions/connection-id.md | `a66ceb1984984fee724b4be258a65a8407ff053ff022e777cb38a767a99cc640` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-057

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 455.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/system-functions/current-catalog | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/system-functions/current-catalog.md | `6c6dc740b4c7fcde30b80050e9178c8408bc636d2743ce9b90592fb22137fa36` |
| sql-manual/sql-functions/scalar-functions/system-functions/current-user | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/system-functions/current-user.md | `468bd44b55b02a8868174589dddf22c0ff3fa60d9bbf5cb110d93f69bd430f75` |
| sql-manual/sql-functions/scalar-functions/system-functions/database | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/system-functions/database.md | `e7012b22d3c85078bbcb20e38c54b9bb5847fd850354e1b736d0436cf6fab841` |
| sql-manual/sql-functions/scalar-functions/system-functions/session-user | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/system-functions/session-user.md | `634bc088be4108f529f8aff4d64fa8486076cfb0227596be870c8df89fc66bb4` |
| sql-manual/sql-functions/scalar-functions/system-functions/user | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/system-functions/user.md | `8410b87c60643a2a58835d394589a8bf9f0c0da7df0c98a6fd1eb9ce504aa83c` |
| sql-manual/sql-functions/scalar-functions/system-functions/version-function | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/system-functions/version-function.md | `d95c5cb35e899e0f293f49d61b1c1c45f2f9cbdbe4ceb8b29a83f10ee32a83ee` |
| sql-manual/sql-functions/scalar-functions/system-functions/last-query-id | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/system-functions/last-query-id.md | `60df61aa8987e863ec23eae366f09b50a5ce40af769ee595af30045cc2d4b0a3` |
| sql-manual/sql-functions/scalar-functions/other-functions/convert-to | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/other-functions/convert-to.md | `0c2a92a5fe1b5c0e3ed998b82bcb93d5bdb04bb9661f8616527acf74984baac2` |
| sql-manual/sql-functions/scalar-functions/other-functions/esquery | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/other-functions/esquery.md | `b6b56e7f09490b15a711d52df479a213213cd68855efabc7eb173d433b0e9525` |
| sql-manual/sql-functions/scalar-functions/other-functions/default | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/other-functions/default.md | `10ddfda50675f7d625f9ce2b61284744bcf8a0bead1fe753e14984d7c0db78ea` |
| sql-manual/sql-functions/scalar-functions/other-functions/field | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/other-functions/field.md | `0e8320815aeb8d01d02cd3e2c4aa1077973917dceec95eb89b4bee3f5ee7e6ca` |
| sql-manual/sql-functions/scalar-functions/other-functions/grouping | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/other-functions/grouping.md | `a2404e22f33b5c8323720ffdcfad1c229c8952aebd1eedd4330818725eb8a2ac` |
| sql-manual/sql-functions/scalar-functions/other-functions/grouping-id | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/other-functions/grouping-id.md | `43007516a991b9d79f53c706fd14586e250135505d2d2ace95fea74c9efcd5be` |
| sql-manual/sql-functions/scalar-functions/quantile-functions/quantile-percent | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/quantile-functions/quantile-percent.md | `09fd31ec61d42d9358650414d9dac519c9a0f33e85e5c4463fb36a8d38116feb` |
| sql-manual/sql-functions/scalar-functions/quantile-functions/quantile-state-empty | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/quantile-functions/quantile-state-empty.md | `ad68f80f3e8aad6aa3b2bc705456ba8815e883f69d5d672cc4dc96caac1c5f5a` |
| sql-manual/sql-functions/scalar-functions/quantile-functions/to-quantile-state | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/quantile-functions/to-quantile-state.md | `c3afd2fe565bf0867d51713495c010dd060689a399f70b955189431776c991c0` |
| sql-manual/sql-functions/scalar-functions/conditional-functions/overview | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/conditional-functions/overview.md | `c8038fa0d3a3d1fa38f4fdc76dcb266e5843c35c9c8053d76df2da7ebba0e0e0` |
| sql-manual/sql-functions/scalar-functions/conditional-functions/coalesce | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/conditional-functions/coalesce.md | `2c598b6ef8a9035769161f7aa9fa7f56cbf22a1af0cdcee44aff061ffe429286` |
| sql-manual/sql-functions/scalar-functions/conditional-functions/greatest | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/conditional-functions/greatest.md | `e78ad91474820fedfa71798a860fe183ab8d720f20994362c88141a7636604a1` |
| sql-manual/sql-functions/scalar-functions/conditional-functions/if | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/conditional-functions/if.md | `e3b270b9a20228ddc7bb5762f226545ecae1356600c238fec830a24349babfbd` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-058

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 435.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/scalar-functions/conditional-functions/ifnull | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/conditional-functions/ifnull.md | `d0f609d1981091bbff0f7466f6f2b25eacfbef73178dd90febcd7e64e541694b` |
| sql-manual/sql-functions/scalar-functions/conditional-functions/least | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/conditional-functions/least.md | `e2033552165e808876bbd6fb1283d71e5905921b91df6879a0d12626988b9548` |
| sql-manual/sql-functions/scalar-functions/conditional-functions/not-null-or-empty | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/conditional-functions/not-null-or-empty.md | `80cd081f2677fa4fd60495232e12ba3305a2da4e7d8e905fcd93fc2b4363b93b` |
| sql-manual/sql-functions/scalar-functions/conditional-functions/null-or-empty | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/conditional-functions/null-or-empty.md | `ac7ca44133ef24bdd588af8f8dd99a6a6d58a7a85760f14666faafb62997be65` |
| sql-manual/sql-functions/scalar-functions/conditional-functions/nullif | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/conditional-functions/nullif.md | `7ac2c54f3c5518cc51c7dbf79e02cb59da4924d7e2220d5fe21550570f1d0a72` |
| sql-manual/sql-functions/aggregate-functions/ai-agg | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/ai-agg.md | `f02c0c3cc608cc4a6bff781a4e365dd45e89fd5f2f25390496cc9686cda3253b` |
| sql-manual/sql-functions/aggregate-functions/any-value | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/any-value.md | `b539d8c845f8acd1e783f607a6edf303983f8bd339a9b24117d06877b1e31408` |
| sql-manual/sql-functions/aggregate-functions/approx-count-distinct | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/approx-count-distinct.md | `051013e94f7d052cad45ebe26acf94dad4c7ad9c4232a5fc16e3b79d77beca31` |
| sql-manual/sql-functions/aggregate-functions/array-agg | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/array-agg.md | `9308ae9ff4b600490009d744d902f606a34d356e2607ced9b4b9df4e9d081f86` |
| sql-manual/sql-functions/aggregate-functions/avg | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/avg.md | `dff337c7e23584814473da5d5eb47f4809f8219666327e76f8cb72690024b864` |
| sql-manual/sql-functions/aggregate-functions/avg-map | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/avg-map.md | `dbe796a8132fe2623977cdd34505c8c7599f31ca549c71386665407ef474917f` |
| sql-manual/sql-functions/aggregate-functions/avg-weighted | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/avg-weighted.md | `2f39788ba916b589823833f7484e5ff01b86cc6632aad3e67c9b836dc7f55869` |
| sql-manual/sql-functions/aggregate-functions/bitmap-agg | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/bitmap-agg.md | `804b1acdfa63c171c201a7e70f817f6efd94563863919efeb6ed85a6212e1602` |
| sql-manual/sql-functions/aggregate-functions/bitmap-intersect | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/bitmap-intersect.md | `e3473d0a8f20f0b00f855ecc2ef6ad123099d1b11090186a242d3c50574feada` |
| sql-manual/sql-functions/aggregate-functions/bitmap-union | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/bitmap-union.md | `573f2eef84632f9edec601585db24d07da9b07c7abafb4ba40b4bf6ca43b3ade` |
| sql-manual/sql-functions/aggregate-functions/bitmap-union-count | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/bitmap-union-count.md | `172827826018f5eb6cfb3b3746962452dca299e015d5bd45df0c1627d1305aaf` |
| sql-manual/sql-functions/aggregate-functions/bitmap-union-int | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/bitmap-union-int.md | `d0b223fe0eec3770de65bc139321ba693df54c8a4b3158f0c69ac505642046c1` |
| sql-manual/sql-functions/aggregate-functions/bool-and | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/bool-and.md | `c6f98699201f47239c30e70097a748673640b7e4371ac99b198309735bdeadb3` |
| sql-manual/sql-functions/aggregate-functions/bool-or | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/bool-or.md | `f37641a9a43b0f4697b9e84cbf625ded63229346e0a5b953a94ac70047b66ff7` |
| sql-manual/sql-functions/aggregate-functions/bool-xor | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/bool-xor.md | `45a253ddacb3ba75e070e2e9f1bc0130a85e870034f40a84fcc9162bd9ff22c7` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-059

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 415.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/aggregate-functions/collect-list | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/collect-list.md | `09373a2cfa80b1cf3cdc8dc3f5c0dec6ec7faff276641b2ae798f6b72c3018b2` |
| sql-manual/sql-functions/aggregate-functions/collect-set | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/collect-set.md | `8454ebd7fc4cff3c137567e86fe1bcd617d661d850e6ac3180f03bdb754321a2` |
| sql-manual/sql-functions/aggregate-functions/corr-welford | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/corr-welford.md | `e5ea782a0489e5b8fa0251c8750f404c3581520e688cc1e567f1f44c4513b4f3` |
| sql-manual/sql-functions/aggregate-functions/corr | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/corr.md | `d69e01da8d1343acf78d9e51e2c6f444b42c71bad56eb5fb2320093836ad8974` |
| sql-manual/sql-functions/aggregate-functions/count | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/count.md | `390ded406dd7f722ac35251da1fcb31d20c482054c3fb1cb849b3396e135bfcd` |
| sql-manual/sql-functions/aggregate-functions/count-by-enum | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/count-by-enum.md | `bdf1b49e663a0e54e7dead3800d90a8bb3b0548af1102a77aef301617b75bd20` |
| sql-manual/sql-functions/aggregate-functions/count-map | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/count-map.md | `520adba0733c4c4054f13b930235804e053ad18c49775b047b7dfc006fc7c05a` |
| sql-manual/sql-functions/aggregate-functions/covar | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/covar.md | `4566c4359db09b8802749fcea970ff8ade68c4c61049eb68536e5fe421330895` |
| sql-manual/sql-functions/aggregate-functions/covar-samp | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/covar-samp.md | `966d9b4a80f74ad3e6d101ab039742ec13163150a85ab0c22649b5230557027c` |
| sql-manual/sql-functions/aggregate-functions/datasketches_hll_union_agg | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/datasketches_hll_union_agg.md | `4f9340176c7fc7fff2e7da80e7ab7d393e48a588b5c561136fa592e24dead9cc` |
| sql-manual/sql-functions/aggregate-functions/group-array-intersect | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/group-array-intersect.md | `28869e8453d2fb3e00023e66502aa64578279a54ba26c4b0c315dac61026ef7f` |
| sql-manual/sql-functions/aggregate-functions/group-array-union | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/group-array-union.md | `ca31d1d6c94af5abc78f5223d2f0aea813f4bc26b87bac230a9893eb18de1d3b` |
| sql-manual/sql-functions/aggregate-functions/group-bit-and | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/group-bit-and.md | `969624e91e1aff4bdb2e56d3aa201c104a20d7e3ce31d7eaf3c46be8f694de54` |
| sql-manual/sql-functions/aggregate-functions/group-bit-or | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/group-bit-or.md | `919ae27ec7a9d6eb0f8fed1aacbe70af5cf7f1bbd64176e7b113d44f67a10aa6` |
| sql-manual/sql-functions/aggregate-functions/group-bit-xor | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/group-bit-xor.md | `48be311748cee9ca2ad799f3ad06160b7db94caaf462d4f4b067289f11956fbf` |
| sql-manual/sql-functions/aggregate-functions/group-bitmap-xor | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/group-bitmap-xor.md | `4e78ff7d74e5e964cbe131d0bcce134fb7bf24364a762076dd1c738afab14a0c` |
| sql-manual/sql-functions/aggregate-functions/group-concat | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/group-concat.md | `b50ff8746fb9564b6cc6a46ff2958293f6dda92bf80e36bdf1d038fed4a0bab6` |
| sql-manual/sql-functions/aggregate-functions/histogram | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/histogram.md | `494f5431a7538279bf5d46a9975ab95978cab9cbf2d75b643ac393f0b8d14864` |
| sql-manual/sql-functions/aggregate-functions/hll-raw-agg | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/hll-raw-agg.md | `8c3a238f7cf14bbde32de0f667583c551c587d930b39a9f7faf098cbc1fea482` |
| sql-manual/sql-functions/aggregate-functions/hll-union-agg | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/hll-union-agg.md | `21769d0f779555691a57421a3174b0ce597d652caadb0b642941e96b7b4d3b57` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-060

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 395.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/aggregate-functions/intersect-count | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/intersect-count.md | `a6337de4cbf28c3d4db12a83c4b300d609e5652ec91f698b09d938652939fc17` |
| sql-manual/sql-functions/aggregate-functions/kurt | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/kurt.md | `1a42a827120d6bc2b2086c8dd8c52a5f26f9792e2b25cf321f28f43ff7e46c09` |
| sql-manual/sql-functions/aggregate-functions/linear-histogram | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/linear-histogram.md | `64f17409c81bd9b0ba3606d0aab4f6cd1947afd2682b449b424d99746ec33689` |
| sql-manual/sql-functions/aggregate-functions/map-agg | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/map-agg.md | `584b406e88d5e2512e263e2412517792e0a081262f89ba1fdc047b31a557961c` |
| sql-manual/sql-functions/aggregate-functions/max | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/max.md | `a516191fc093af9b05a62b060b62aac1291daa1601ee070952c37d87610ba1c2` |
| sql-manual/sql-functions/aggregate-functions/max-by | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/max-by.md | `c6f6527a6dc7431aeffce1dfcb4e8fd5298789427b44d30310ae99faf37a2302` |
| sql-manual/sql-functions/aggregate-functions/max-map | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/max-map.md | `e8af4f0f8a757293b486548a86bce098ad83646c432f36a1f5a2f44bed2a4a9c` |
| sql-manual/sql-functions/aggregate-functions/median | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/median.md | `66869fb96827ce63ee4017d4520b2fc160f34374b7d294cbca76fb54e74c4e29` |
| sql-manual/sql-functions/aggregate-functions/min | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/min.md | `ea9314225e5aac71833957e9d7f0bdef77a80c02644904c407a82f816304a113` |
| sql-manual/sql-functions/aggregate-functions/min-by | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/min-by.md | `d38ac023c2d1d64b6c8ec36f972bd8992481703655d550d962b211b1dd2beaa2` |
| sql-manual/sql-functions/aggregate-functions/min-map | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/min-map.md | `2482e126cb941454a246fe14fcf102e173a0cf26980ace90cee1ad4975622f4f` |
| sql-manual/sql-functions/aggregate-functions/percentile | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/percentile.md | `3292ed32c1d33851910f56904cf949e84c07c82e50525654ff5be57c00f776b0` |
| sql-manual/sql-functions/aggregate-functions/percentile-approx | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/percentile-approx.md | `d99cb16180eab3f21eebe207a661fb4287e57072648d91794663d72fb920cc52` |
| sql-manual/sql-functions/aggregate-functions/percentile-approx-array | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/percentile-approx-array.md | `def2b34c597c5bc690350fecc45499ca2884a091d33e47b2f167b480b457a561` |
| sql-manual/sql-functions/aggregate-functions/percentile-array | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/percentile-array.md | `7732dfad156610c7ba13e240e19a6ec1f0879bd421a773526dcfa25d2129cfb3` |
| sql-manual/sql-functions/aggregate-functions/percentile-approx-weighted | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/percentile-approx-weighted.md | `af112f4309eb7d19d705833a5e310a43cf01c85c96f2b55395c87f7016a11954` |
| sql-manual/sql-functions/aggregate-functions/percentile_reservoir | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/percentile_reservoir.md | `96848feac2604375066c1ee011d08feeb597d04c682f26bb83465019076efaa3` |
| sql-manual/sql-functions/aggregate-functions/quantile-union | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/quantile-union.md | `4fa605d33bbd4971b7a9dcbc875a976806f2cdc456dd8053bb10c4e57935835c` |
| sql-manual/sql-functions/aggregate-functions/regr-avgx | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/regr-avgx.md | `2c0753d4176bde67b3e9e3b967e39ef218656e7532f6daab7efde8ba00ab3952` |
| sql-manual/sql-functions/aggregate-functions/regr-avgy | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/regr-avgy.md | `76300d327b8c8625684ab73bb52fb12d31dcfa0ac057a7cf5fd91e241e1ead53` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-061

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 375.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/aggregate-functions/regr-count | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/regr-count.md | `95048aee088018038e52eb3480a1ca44cf07119e77485cc04b38b59814a050f1` |
| sql-manual/sql-functions/aggregate-functions/regr-intercept | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/regr-intercept.md | `2a6d5bb98b2fb826f67151ea7c4c46d8b962930b9afb9487adc05b9fd5694f6b` |
| sql-manual/sql-functions/aggregate-functions/regr-r2 | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/regr-r2.md | `3efbc3cedbb4c91554533dbe8e1d5fd1e8466092e7553ea4d845abc23ece3763` |
| sql-manual/sql-functions/aggregate-functions/regr-slope | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/regr-slope.md | `7ab8c4e74462af164e3177115c0b500adbf3a0274b7b01a2dbff73db9f5e9734` |
| sql-manual/sql-functions/aggregate-functions/regr-sxx | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/regr-sxx.md | `66442f0c63d7d84aa20db8bb814d3abb285e2962f8656ac69fb5dcbbdc274438` |
| sql-manual/sql-functions/aggregate-functions/regr-sxy | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/regr-sxy.md | `ed32cf82dca3dc27d7e31213ab33172308d572960457a2a27e88331e5ed12e7d` |
| sql-manual/sql-functions/aggregate-functions/regr-syy | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/regr-syy.md | `078c79ba58e79cc818f19062b0d2b5e54f6572b1c979a3b737824c0b57d2ae48` |
| sql-manual/sql-functions/aggregate-functions/retention | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/retention.md | `5469828a51b3b7de7436d22dbd947450bd9187c36d1f8841ecb3f37d7b9fa5d7` |
| sql-manual/sql-functions/aggregate-functions/sem | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/sem.md | `780daa6144838247d61d61b4400896f4007f0b098e5bf9eb45cfda3539105a96` |
| sql-manual/sql-functions/aggregate-functions/sequence-count | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/sequence-count.md | `a900337ef307dc34e38b33bd4544336f2ee123cf79bdd17489cc46d07ec66918` |
| sql-manual/sql-functions/aggregate-functions/sequence-match | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/sequence-match.md | `9a2ed81d0ac0b8e73e31dee671d72f4b8b1b9de17bbc8f8586146b1118b64018` |
| sql-manual/sql-functions/aggregate-functions/skew | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/skew.md | `54ebb8fe24500d58b6380c85281ddfb72095760c9ab4a9eb934894a5a709eaca` |
| sql-manual/sql-functions/aggregate-functions/stddev | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/stddev.md | `2f5a1bbd4a026aba7393b4f28d93fab5c39fade75ee5374e7f67c0c8b102a0c7` |
| sql-manual/sql-functions/aggregate-functions/stddev-samp | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/stddev-samp.md | `ac34359078404567632d09703b61507617796106896dec6d08a0289e1fc22f19` |
| sql-manual/sql-functions/aggregate-functions/sum | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/sum.md | `26706f57f7a11cd39c50b37b394294dfaea24a84fe6ba2827a33de6784217387` |
| sql-manual/sql-functions/aggregate-functions/sum0 | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/sum0.md | `e0994760899f244934a29c000c15fd96f2f97750d4dcddfeb92d337819fcad36` |
| sql-manual/sql-functions/aggregate-functions/sum-map | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/sum-map.md | `f6f88d1afb091f178fed17e25911cab095b932ade3b9e495377df28c4863d131` |
| sql-manual/sql-functions/aggregate-functions/topn | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/topn.md | `aa214af874a1c36c0d5069854f8e12f43c23ee8b1f37bc8f408d10c79344b44b` |
| sql-manual/sql-functions/aggregate-functions/topn-array | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/topn-array.md | `0d1a1c1a4fa472856c4feaff17accfca1b15b214c279aed5a9bf734b54fe79bd` |
| sql-manual/sql-functions/aggregate-functions/topn-weighted | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/topn-weighted.md | `ab4d6b879aba84680e834eb9416783d3d86bd1bd2e3e967aa430f106dfe5d2fa` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-062

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 355.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/aggregate-functions/var-samp | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/var-samp.md | `bae5c7c9f289aa0e3056b0255e1c622638e1329329482d6a04e14843e1efaba9` |
| sql-manual/sql-functions/aggregate-functions/variance | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/variance.md | `b2dd309e3396021cafd4e5609fe05804c87da4f95b07b6ce5b95cdef9d928d95` |
| sql-manual/sql-functions/aggregate-functions/window-funnel | versioned_docs/version-4.x/sql-manual/sql-functions/aggregate-functions/window-funnel.md | `547446883b06d5aa295fd7eb462317134a48ff29c8ad253dfa7c962f87b1bffb` |
| sql-manual/sql-functions/combinators/foreach | versioned_docs/version-4.x/sql-manual/sql-functions/combinators/foreach.md | `53e484eb057c01e070182ac19c9f27cad6efb1603d6f540d71a3ed6c5c174753` |
| sql-manual/sql-functions/combinators/merge | versioned_docs/version-4.x/sql-manual/sql-functions/combinators/merge.md | `abda7355363afb8cff418b0187a37abc11a979bf394908bad6fda9552b0306da` |
| sql-manual/sql-functions/combinators/state | versioned_docs/version-4.x/sql-manual/sql-functions/combinators/state.md | `dfddde7371e2f39f3d06ab6b262bbde7d648bd1cefde71dc746002b997bfdbdb` |
| sql-manual/sql-functions/combinators/union | versioned_docs/version-4.x/sql-manual/sql-functions/combinators/union.md | `408309954448f8eb006fa521c2df0bd702a29fc1939d1a787048f05ecd0bc08a` |
| sql-manual/sql-functions/window-functions/overview | versioned_docs/version-4.x/sql-manual/sql-functions/window-functions/overview.md | `73dc02aba5261bf6f65981a18d29931f65ff81e895907234069521d7c27bdeea` |
| sql-manual/sql-functions/window-functions/cume-dist | versioned_docs/version-4.x/sql-manual/sql-functions/window-functions/cume-dist.md | `00da9e17986ec79fb3e9cd425ac3013ebc82d2315eafe6c7d166b727d3b4ea06` |
| sql-manual/sql-functions/window-functions/dense-rank | versioned_docs/version-4.x/sql-manual/sql-functions/window-functions/dense-rank.md | `878fe68463e0483812bab00a56c7ec4e26b46c3c71532f4de4f88e8495526d04` |
| sql-manual/sql-functions/window-functions/first-value | versioned_docs/version-4.x/sql-manual/sql-functions/window-functions/first-value.md | `06b65fa4a96d8052bdf942d8a08f5495f7f6c95e508779d2dd1ff917386cd18f` |
| sql-manual/sql-functions/window-functions/lag | versioned_docs/version-4.x/sql-manual/sql-functions/window-functions/lag.md | `25f8ab9b6ef16f7ea199f525aa0dfd2920db2a19178f6533da5a05f0672d90a1` |
| sql-manual/sql-functions/window-functions/last-value | versioned_docs/version-4.x/sql-manual/sql-functions/window-functions/last-value.md | `55cd266ecfa3e459ed157e58fb26c011e926bc857045e76fa1c14a938f28bd45` |
| sql-manual/sql-functions/window-functions/lead | versioned_docs/version-4.x/sql-manual/sql-functions/window-functions/lead.md | `9814b62ff4b61448865709cad2ddc7432356a7c3d10d1074d18cc5d1d5fa0c1b` |
| sql-manual/sql-functions/window-functions/ntile | versioned_docs/version-4.x/sql-manual/sql-functions/window-functions/ntile.md | `f7eb4ed8169751db348837c456ec6fbf7e87283983e196b74d36b0a503528a60` |
| sql-manual/sql-functions/window-functions/percent-rank | versioned_docs/version-4.x/sql-manual/sql-functions/window-functions/percent-rank.md | `bb85bf2c652043d0f103e3c7d8c3d81adc75f4014960418b3b893ea71fcc432c` |
| sql-manual/sql-functions/window-functions/rank | versioned_docs/version-4.x/sql-manual/sql-functions/window-functions/rank.md | `5032af683c45911d4ca5363cd93e63a3c54791df0e27ce002ebff0996b91a627` |
| sql-manual/sql-functions/window-functions/row-number | versioned_docs/version-4.x/sql-manual/sql-functions/window-functions/row-number.md | `8175f5429becf9f6ec53cdee8bfff91dfcb84a7a4cc9e437f0e882ccbcbd5f5f` |
| sql-manual/sql-functions/table-functions/explode | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/explode.md | `5c7186c36743b03ec1b0789b287556d4e757810c150de54ab4bd1fd375470679` |
| sql-manual/sql-functions/table-functions/explode-outer | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/explode-outer.md | `660e734df286f6be2c82d1113c12e698d4964ef80ddf4e54dd0d261c9ffb70f2` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-063

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 335.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/table-functions/explode-bitmap | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/explode-bitmap.md | `091ab95a6ea5dc46001a0b5378eddcef3dc1ada44a19483248de020673d714d2` |
| sql-manual/sql-functions/table-functions/explode-bitmap-outer | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/explode-bitmap-outer.md | `39e036cc88c6d66fa301cee5cd7b6bf4c345f1eaefe1e40891b58331a3ab7738` |
| sql-manual/sql-functions/table-functions/explode-json-array-double | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/explode-json-array-double.md | `b593ca4c09807fafe6d98d64f6984b7299f230a690a7c79bc4838a324d86f63c` |
| sql-manual/sql-functions/table-functions/explode-json-array-double-outer | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/explode-json-array-double-outer.md | `672453b40e6efa675360c3deffb0395f172f27d59946c47d1ab76dfc99efa9fa` |
| sql-manual/sql-functions/table-functions/explode-json-array-int | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/explode-json-array-int.md | `787c5bbaa6411f2a77bad5b6eb6de9178a30d219996d379354f0f7228b8ce2eb` |
| sql-manual/sql-functions/table-functions/explode-json-array-int-outer | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/explode-json-array-int-outer.md | `cc460000e9f807bbcbfd3026a6c8b1df53ecc91bfa87ccebffc62b3da5d8752b` |
| sql-manual/sql-functions/table-functions/explode-json-array-json | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/explode-json-array-json.md | `9628bff83cc8794e023fe37484ea26790acc6a367242acfb7df5b6f35ac2e134` |
| sql-manual/sql-functions/table-functions/explode-json-array-json-outer | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/explode-json-array-json-outer.md | `569bfb0e07c25bb8e001a7da6ee2e7a1a60e5fbc137f0071322b01dcdd75ea4a` |
| sql-manual/sql-functions/table-functions/explode-json-array-string | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/explode-json-array-string.md | `890abdbe76492bc0640afee45b50babce8a19f2b0e2ee1461f736395edbc30b1` |
| sql-manual/sql-functions/table-functions/explode-json-array-string-outer | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/explode-json-array-string-outer.md | `0b489436118b392c39e535b23f0d20b9e8fec03d69928dc63c9b8009d6921616` |
| sql-manual/sql-functions/table-functions/explode-json-object | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/explode-json-object.md | `8fb86b97fe0046da97a349e38e1ff3e210b6ff42963306a36fd002c76f808624` |
| sql-manual/sql-functions/table-functions/explode-map | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/explode-map.md | `71e7f3fb39e24960282cb68ddc9c232bbb4e439f7d6bbf806abbe0831767bddf` |
| sql-manual/sql-functions/table-functions/explode-map-outer | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/explode-map-outer.md | `476f8a8aba30587103c38ef437dab255f86c291e61946b40c65bef6888073653` |
| sql-manual/sql-functions/table-functions/explode-numbers | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/explode-numbers.md | `03d0e5525f06a8fcfa8415681befef46d8ec4291a6c80d3d82d31d3b6d05ada1` |
| sql-manual/sql-functions/table-functions/explode-numbers-outer | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/explode-numbers-outer.md | `0440a7cfc896bd9edf9ab36daccb6002f9a36086baaefc6c565852af1d9a38db` |
| sql-manual/sql-functions/table-functions/explode-split | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/explode-split.md | `d7004d9b12c7f1d4a143a76bbbd7610a8fe146c3a39664c9c44924d70e32cab2` |
| sql-manual/sql-functions/table-functions/explode-split-outer | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/explode-split-outer.md | `d84179ab2855720dbda865aaeb13f03afa7fded3d2c476276d75270d3cb45393` |
| sql-manual/sql-functions/table-functions/json-each | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/json-each.md | `cc287ddbcf348db7038c957ab5a819ff77876b094630d4375b2f329e195c8b53` |
| sql-manual/sql-functions/table-functions/json-each-outer | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/json-each-outer.md | `2d31d3b2dc332781f7c84869b1d3c0a1514dec3eb1dded9a7f8da2ed7db34673` |
| sql-manual/sql-functions/table-functions/json-each-text | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/json-each-text.md | `2dfef7ad1ef162c6edcc4a51b9db30c202ec3f23749a12231e9dedbeb19b4bf6` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-064

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 315.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/table-functions/json-each-text-outer | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/json-each-text-outer.md | `3acc22779435bc1e3d732e3687411222cfde6fe1e609de032a1333e042d4fd99` |
| sql-manual/sql-functions/table-functions/posexplode | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/posexplode.md | `dd25fd61edca87cd24f549c0042b23cd717d2380e9ab33d8d2f283e84815da22` |
| sql-manual/sql-functions/table-functions/posexplode-outer | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/posexplode-outer.md | `4b4b26e7a38738fcb15dcb33ac4e9ff501a7a8e07673bb095529a0c7f34629c7` |
| sql-manual/sql-functions/table-functions/unnest | versioned_docs/version-4.x/sql-manual/sql-functions/table-functions/unnest.md | `31d2f1d648be1c556e37f5e4adcd989b21a55317071ec202cd7c1cbf9aad3d10` |
| sql-manual/sql-functions/table-valued-functions/backends | versioned_docs/version-4.x/sql-manual/sql-functions/table-valued-functions/backends.md | `c65ac0d8c3d778b24daab83bd09a369377a2a41bca1612e93c60226616384c0a` |
| sql-manual/sql-functions/table-valued-functions/cdc-stream | versioned_docs/version-4.x/sql-manual/sql-functions/table-valued-functions/cdc-stream.md | `f98388c46b3eabeb7ee4a030418cfaa8fa5efd8cd3b2d57a410aa041c8388886` |
| sql-manual/sql-functions/table-valued-functions/catalogs | versioned_docs/version-4.x/sql-manual/sql-functions/table-valued-functions/catalogs.md | `2ffdfb931062a6f0b0a22903dc51baa25d7b689b0408ed637ce49fff7e5eb81c` |
| sql-manual/sql-functions/table-valued-functions/file | versioned_docs/version-4.x/sql-manual/sql-functions/table-valued-functions/file.md | `b54ef96328c2d40d6b733f43dab917cce93b3b7f1b966341d1c7f2acaa7c8e17` |
| sql-manual/sql-functions/table-valued-functions/frontends | versioned_docs/version-4.x/sql-manual/sql-functions/table-valued-functions/frontends.md | `e26a862e6523354d3daaabc25dfbf0adc37cbf1596732436a9d8a83864591b31` |
| sql-manual/sql-functions/table-valued-functions/frontends_disks | versioned_docs/version-4.x/sql-manual/sql-functions/table-valued-functions/frontends_disks.md | `82c63621e77e4f8ed3ea5c4e79658f00bf9a8af1e5c8cb5709df0c1478e7cec5` |
| sql-manual/sql-functions/table-valued-functions/hdfs | versioned_docs/version-4.x/sql-manual/sql-functions/table-valued-functions/hdfs.md | `c5c098a1287fffd6231e8dcc8585dd9b12e6ea8d93174c512a7236389207f816` |
| sql-manual/sql-functions/table-valued-functions/http | versioned_docs/version-4.x/sql-manual/sql-functions/table-valued-functions/http.md | `2438c11bde8e91e4e38c4f1b9bf3a801d6eb947ecb916a9c15532417b73d37a7` |
| sql-manual/sql-functions/table-valued-functions/hudi-meta | versioned_docs/version-4.x/sql-manual/sql-functions/table-valued-functions/hudi-meta.md | `adcef4cbccb0205841440f5636598dc2e8652fa03f2478ce20f8fc72a1ecc745` |
| sql-manual/sql-functions/table-valued-functions/iceberg-meta | versioned_docs/version-4.x/sql-manual/sql-functions/table-valued-functions/iceberg-meta.md | `97bf5c2d25ff8b4edc21c3f748601fe2c2c43b338303eed959587ab6c59b6ed3` |
| sql-manual/sql-functions/table-valued-functions/jobs | versioned_docs/version-4.x/sql-manual/sql-functions/table-valued-functions/jobs.md | `8bea49a8621c76f2b952334683e0ab3aa5a271892ebdc7b5ac79a611c270d864` |
| sql-manual/sql-functions/table-valued-functions/local | versioned_docs/version-4.x/sql-manual/sql-functions/table-valued-functions/local.md | `c5c098a1287fffd6231e8dcc8585dd9b12e6ea8d93174c512a7236389207f816` |
| sql-manual/sql-functions/table-valued-functions/mv_infos | versioned_docs/version-4.x/sql-manual/sql-functions/table-valued-functions/mv_infos.md | `94044e902ce5dc3b3f265aa57c53e76a7b40774bbcffd739b6b749aa6efc3b54` |
| sql-manual/sql-functions/table-valued-functions/numbers | versioned_docs/version-4.x/sql-manual/sql-functions/table-valued-functions/numbers.md | `0c36e4266f98a0104f9265473f26340a0fe16023c0e2a89f278e261428d08958` |
| sql-manual/sql-functions/table-valued-functions/parquet-meta | versioned_docs/version-4.x/sql-manual/sql-functions/table-valued-functions/parquet-meta.md | `a19a40cabaee920613dce316160b12f14584b837de937ff4fc2bf37304190adb` |
| sql-manual/sql-functions/table-valued-functions/partition-values | versioned_docs/version-4.x/sql-manual/sql-functions/table-valued-functions/partition-values.md | `e59f301ec54840d65046513b3671cb3481e31d1ee0f1b40c233d482e56256a0d` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-065

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 295.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-functions/table-valued-functions/partitions | versioned_docs/version-4.x/sql-manual/sql-functions/table-valued-functions/partitions.md | `222ef37a4687c9dee3bfeb41836985714ef9696460cc817f07c7c952d7066fbc` |
| sql-manual/sql-functions/table-valued-functions/query | versioned_docs/version-4.x/sql-manual/sql-functions/table-valued-functions/query.md | `e7278e658b46d3a85af1e120462814f339613baa628c8ffd792ca677d14d9d39` |
| sql-manual/sql-functions/table-valued-functions/s3 | versioned_docs/version-4.x/sql-manual/sql-functions/table-valued-functions/s3.md | `1c2666fa6086626dce7206667f50b34d0c868a680776e0c30f0bb0150dea10e7` |
| sql-manual/sql-functions/table-valued-functions/tasks | versioned_docs/version-4.x/sql-manual/sql-functions/table-valued-functions/tasks.md | `db2a13ac6e923932d62f21fd694443126a0ed86d3b62291d848755094264935f` |
| sql-manual/sql-statements/data-query/SELECT | versioned_docs/version-4.x/sql-manual/sql-statements/data-query/SELECT.md | `487935a7779ee25948d245adb231d3536ecd3c12d3dbabea375dc388f9cbaf19` |
| sql-manual/sql-statements/data-query/EXPLAIN | versioned_docs/version-4.x/sql-manual/sql-statements/data-query/EXPLAIN.md | `0667393dba5049b3efb4fa5587ecaee9fc51b3cd8abe05021821b06be0445dfb` |
| sql-manual/sql-statements/data-modification/DML/INSERT | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/DML/INSERT.md | `8f7e7a7bd0a33fdfe819f40886000448884bdc49dc180c0861a3e5e5b42c4310` |
| sql-manual/sql-statements/data-modification/DML/INSERT-OVERWRITE | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/DML/INSERT-OVERWRITE.md | `bc521baa0c417cc2242242f1d1693c14a9e27288b7f6d2eff41d66ed1f00f46b` |
| sql-manual/sql-statements/data-modification/DML/SHOW-LAST-INSERT | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/DML/SHOW-LAST-INSERT.md | `e5a80c538ab3b8ee5dbfa254a33420c850f64fb038fa4db0ff48802582166292` |
| sql-manual/sql-statements/data-modification/DML/UPDATE | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/DML/UPDATE.md | `0d6dbb206a8c7cdb23c1f49f869a33446624bcc0c21c8d4a844c54b7a704d1fd` |
| sql-manual/sql-statements/data-modification/DML/MERGE-INTO | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/DML/MERGE-INTO.md | `4b16a2de691425477abcc58b642e6fb0f8fe7fb24f8dd4bcc2e8fd33cf633503` |
| sql-manual/sql-statements/data-modification/DML/DELETE | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/DML/DELETE.md | `ad0f907374106a3e561cb83e1ac7ca75d3b58afbc44953fea9661331396d39b0` |
| sql-manual/sql-statements/data-modification/DML/SHOW-DELETE | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/DML/SHOW-DELETE.md | `572ed1e714ccb369d939e6f088934edbd03ed593c4cf35b9fb72517e91a9f9fc` |
| sql-manual/sql-statements/data-modification/load-and-export/BROKER-LOAD | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/BROKER-LOAD.md | `e73841fb748d54d0625b5a1d6e21cea5021b5e9d54f42b59d0f8c9056a36feb7` |
| sql-manual/sql-statements/data-modification/load-and-export/MYSQL-LOAD | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/MYSQL-LOAD.md | `c021f4c158766d6d19877df0a4bcfc36562c2a3dcd204098ddd3a0ea2caa9378` |
| sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD.md | `7bf201e7681737d46731a3edea6e6f54361a53d09f08e3d8636fc59b5aa1674a` |
| sql-manual/sql-statements/data-modification/load-and-export/SHOW-STREAM-LOAD | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/SHOW-STREAM-LOAD.md | `066119a536e726480d6b3f6aae9ae3382abb4fbbc0d879be35c2a9a47c05fcbe` |
| sql-manual/sql-statements/data-modification/load-and-export/SHOW-CREATE-LOAD | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/SHOW-CREATE-LOAD.md | `2ac29d93f8c20680988a380cb2cd9da19ad0d7b4798595eeb156bb5bb4333df6` |
| sql-manual/sql-statements/data-modification/load-and-export/CANCEL-LOAD | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/CANCEL-LOAD.md | `af6b16cc8fbf87afb3b79c8e4670ffe113f9d3aaff87b3e9de4f04e73b2fb86a` |
| sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD-WARNINGS | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD-WARNINGS.md | `52438df203468911bd44aba30147ff2fe5dda4f5d2f305a24a05b5c1e783559c` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-066

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 275.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD.md | `c8b3adee00f02b03fcc80a2cff5a0d0ae627bbc93a444ae78ad833c2f7c657e8` |
| sql-manual/sql-statements/data-modification/load-and-export/ALTER-ROUTINE-LOAD | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/ALTER-ROUTINE-LOAD.md | `c934d4b5eb22a78f5f894abc24a2a6c7e0494af477475d9d3d0f0729723e455c` |
| sql-manual/sql-statements/data-modification/load-and-export/PAUSE-ROUTINE-LOAD | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/PAUSE-ROUTINE-LOAD.md | `43eb559e1b9208e21d57d24c24b734033d921225842261cf5c9fca13fd274fdb` |
| sql-manual/sql-statements/data-modification/load-and-export/RESUME-ROUTINE-LOAD | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/RESUME-ROUTINE-LOAD.md | `8550ecec06c3e035968e8f748f043121527c5170fa7c37156df6184fe636faff` |
| sql-manual/sql-statements/data-modification/load-and-export/STOP-ROUTINE-LOAD | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/STOP-ROUTINE-LOAD.md | `d57a35ba0707452c6ee28e951fcaba24bf269ab6c897a39130f559f048ff6dd4` |
| sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD.md | `a5d6bfdec403a1f054ebac0495bb5ee3af8e372d1c9c75862932ce639c64faf5` |
| sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD-TASK | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD-TASK.md | `f718c510cc24891c4a0a5616b2763473fb47ab21334dafa7dcfe0542f29f9554` |
| sql-manual/sql-statements/data-modification/load-and-export/SHOW-CREATE-ROUTINE-LOAD | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/SHOW-CREATE-ROUTINE-LOAD.md | `9e4a682ac54f558e6868fca0caeb7ee3ee49a6c2f4a8ce73b8abc6a55a644081` |
| sql-manual/sql-statements/data-modification/load-and-export/SYNC | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/SYNC.md | `bddfa669cfd1dd3a9142a0c31c6e2e53668c9483b83289cd9589cdc5cb00d2c6` |
| sql-manual/sql-statements/data-modification/load-and-export/EXPORT | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/EXPORT.md | `cdb9c13112b0d5bdbcd7eac42eb74c4b0658ceb0fe706966eb08ba2003b1e8ed` |
| sql-manual/sql-statements/data-modification/load-and-export/CANCEL-EXPORT | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/CANCEL-EXPORT.md | `3494f2a53d6248313625d7502dc4a56ff7611170c4d9836b437c050bde67379e` |
| sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT.md | `6b2b78c429f424465a56a0c9f6784c2c129decaefaa3b640e4be577bb53b98b0` |
| sql-manual/sql-statements/data-modification/load-and-export/OUTFILE | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/OUTFILE.md | `1f08027ec74e43c8dda27bc320e8f10ffb5999d69fb89618b79e1ed78cbe1e9c` |
| sql-manual/sql-statements/data-modification/load-and-export/CLEAN-LABEL | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/load-and-export/CLEAN-LABEL.md | `d63253640be082c31763cb5fc3ef634c1e6b6da1d9355e810a47aa1094f279ba` |
| sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY.md | `1c20144f257a2f9dfaa7d6f5fba8161dd78ee3c995408c6ebfcb407aa04d7130` |
| sql-manual/sql-statements/data-modification/backup-and-restore/DROP-REPOSITORY | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/backup-and-restore/DROP-REPOSITORY.md | `a6ca45f30583f6d5630e73a2b371cbbe5fee1e601402ce442e839d81c034f47a` |
| sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-CREATE-REPOSITORY | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-CREATE-REPOSITORY.md | `14690427a2f494410ac3ba34b4ee86bafb00c13cf2f9b9db735beaafe2087ede` |
| sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-REPOSITORIES | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-REPOSITORIES.md | `27c59b63bf784498ba1edca7f25d5b02325175765ebaccb5c41950f42b8d1541` |
| sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP.md | `5424899f9ed0590360a73c03389486e72f1049df057007288f6f6efbd079d48e` |
| sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-BACKUP | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-BACKUP.md | `dddd3299016158e1b55e692376c0792a060f29375f7979851cdd4e9f2f7c491f` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-067

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 255.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/data-modification/backup-and-restore/RESTORE | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/backup-and-restore/RESTORE.md | `c233788b44167ab23a1792e03a02653540a1b19388e4e59b8ba1214ccfdc561a` |
| sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-RESTORE | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-RESTORE.md | `162ad7cb1c2b9e1607ee133224e4725912939f6dcdce9cca6587b37a07037fe0` |
| sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-RESTORE | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-RESTORE.md | `cebf4f74470320060ee8be783e94f852ef7fee9ae1e2d51ad6f6b19bdef66e34` |
| sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-SNAPSHOT | versioned_docs/version-4.x/sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-SNAPSHOT.md | `d5131842f8cfbf9d46aa94f981e96d0fc2c7ceb29e5abd961cf3857eda6077eb` |
| sql-manual/sql-statements/account-management/CREATE-USER | versioned_docs/version-4.x/sql-manual/sql-statements/account-management/CREATE-USER.md | `9769a6aa60807fad11a30784db8e32c7f8bc1e5b46872be306930f5913bb9345` |
| sql-manual/sql-statements/account-management/ALTER-USER | versioned_docs/version-4.x/sql-manual/sql-statements/account-management/ALTER-USER.md | `0c50f660a6e9ec4d8b0995cf6180478be890054831030649c4d8aeef91658070` |
| sql-manual/sql-statements/account-management/DROP-USER | versioned_docs/version-4.x/sql-manual/sql-statements/account-management/DROP-USER.md | `73cf48d4aa8207d360b92cf6da4b8b69bc95aa04bf2cbb00550807db111183ba` |
| sql-manual/sql-statements/account-management/SET-PASSWORD | versioned_docs/version-4.x/sql-manual/sql-statements/account-management/SET-PASSWORD.md | `a83c470134ac6d44c1eb98c56f11710cb57fbdfa8d756c7b8b886a468d87cd53` |
| sql-manual/sql-statements/account-management/CREATE-ROLE | versioned_docs/version-4.x/sql-manual/sql-statements/account-management/CREATE-ROLE.md | `5e57abd27c77f76db7b6e55f1dfd437545644abd9d7c470b648ed57f90290615` |
| sql-manual/sql-statements/account-management/ALTER-ROLE | versioned_docs/version-4.x/sql-manual/sql-statements/account-management/ALTER-ROLE.md | `85e2f87aa4f6cf6bb40a87303b9af1043cfa861e963087449e6dfd845c321283` |
| sql-manual/sql-statements/account-management/DROP-ROLE | versioned_docs/version-4.x/sql-manual/sql-statements/account-management/DROP-ROLE.md | `9970456bbde187edf424c53c29a9856a0847cfd8138175633936713c667e9db4` |
| sql-manual/sql-statements/account-management/SHOW-ROLES | versioned_docs/version-4.x/sql-manual/sql-statements/account-management/SHOW-ROLES.md | `08a00b91e2f2dadecdf5f2ae98ee2717beb4f9524e026eddaa42b3748c12acb9` |
| sql-manual/sql-statements/account-management/GRANT-TO | versioned_docs/version-4.x/sql-manual/sql-statements/account-management/GRANT-TO.md | `fe89064712ab4c77320f0d31c36d8e4a63ad236a0377c6ca25773506b23c325f` |
| sql-manual/sql-statements/account-management/REVOKE-FROM | versioned_docs/version-4.x/sql-manual/sql-statements/account-management/REVOKE-FROM.md | `5dbd70421778a9b59c38e6fa9feb9f0d9aa850605a6ccc7d941bfb6ab711ff35` |
| sql-manual/sql-statements/account-management/SHOW-CREATE-USER | versioned_docs/version-4.x/sql-manual/sql-statements/account-management/SHOW-CREATE-USER.md | `0900ce9cbb99293818f705e8bc8e6af97e15f734fcacf122255418d51527a5dc` |
| sql-manual/sql-statements/account-management/SHOW-PRIVILEGES | versioned_docs/version-4.x/sql-manual/sql-statements/account-management/SHOW-PRIVILEGES.md | `561ceba70f5ea4e9da6edc4c8791c53ba2c5e20734c337a5a4920c760e7711ee` |
| sql-manual/sql-statements/account-management/SHOW-GRANTS | versioned_docs/version-4.x/sql-manual/sql-statements/account-management/SHOW-GRANTS.md | `30a2d016fc796392a978149ab8673f989cffabd8c3aa99f20ccd0ec660cd415a` |
| sql-manual/sql-statements/account-management/REFRESH-LDAP | versioned_docs/version-4.x/sql-manual/sql-statements/account-management/REFRESH-LDAP.md | `0b18b3c938a0f8e72362162da6daedfaa204d2d4cb40587842d8de31e85187ca` |
| sql-manual/sql-statements/account-management/SET-LDAP_ADMIN_PASSWORD | versioned_docs/version-4.x/sql-manual/sql-statements/account-management/SET-LDAP_ADMIN_PASSWORD.md | `95a9072532338a335da35af8e4bc37f0f67961d2d6568e913786f01267757cfb` |
| sql-manual/sql-statements/account-management/SET-PROPERTY | versioned_docs/version-4.x/sql-manual/sql-statements/account-management/SET-PROPERTY.md | `28a8c785b38c1bdb3ab32e60dfaaefdead58e3d07847b4f8387c03d8861c1ea1` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-068

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 235.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/account-management/SHOW-PROPERTY | versioned_docs/version-4.x/sql-manual/sql-statements/account-management/SHOW-PROPERTY.md | `20b800cb7ae470ffa27a96bc1ecb4549cb5c369d7f95c232c600dddd721bf8ca` |
| sql-manual/sql-statements/session/context/USE-COMPUTE-GROUP | versioned_docs/version-4.x/sql-manual/sql-statements/session/context/USE-COMPUTE-GROUP.md | `4178b9dc5413d63126451558cd665a3490693b52c38fb8441088fffbdb1045c0` |
| sql-manual/sql-statements/session/context/SWITCH-CATALOG | versioned_docs/version-4.x/sql-manual/sql-statements/session/context/SWITCH-CATALOG.md | `590e8260804b98c191b69209a9d8bbbd8748930b3cbbb8b722dc1fae7952ed9f` |
| sql-manual/sql-statements/session/context/USE-DATABASE | versioned_docs/version-4.x/sql-manual/sql-statements/session/context/USE-DATABASE.md | `206ce0b8499486ae5eaaf9d99a4fb2a973a20100e637f64faa4686899fb59e99` |
| sql-manual/sql-statements/session/variable/SET-VARIABLE | versioned_docs/version-4.x/sql-manual/sql-statements/session/variable/SET-VARIABLE.md | `d3c4ad60808cabc89fa177f3c6a775f6b8cf29ef5cc4b0745cc84fa99ebde283` |
| sql-manual/sql-statements/session/variable/UNSET-VARIABLE | versioned_docs/version-4.x/sql-manual/sql-statements/session/variable/UNSET-VARIABLE.md | `0c76c424b2203094a721a83e8781c3367fbab1b9c71d9702f25b9d55dd98a83c` |
| sql-manual/sql-statements/session/variable/SHOW-VARIABLES | versioned_docs/version-4.x/sql-manual/sql-statements/session/variable/SHOW-VARIABLES.md | `c619a804538ecf9a372e12bc2e12673d4f7457319fb42404c561c72222304bee` |
| sql-manual/sql-statements/session/queries/SHOW-PROCESSLIST | versioned_docs/version-4.x/sql-manual/sql-statements/session/queries/SHOW-PROCESSLIST.md | `ca876803fa3e9ecb520daaecbdc8e43eee97c31bc15604038a7ae5a9223a1483` |
| sql-manual/sql-statements/session/queries/KILL-QUERY | versioned_docs/version-4.x/sql-manual/sql-statements/session/queries/KILL-QUERY.md | `f2ad0070b63aabd53c7ae1e18846a06a2520fc7dd03ccbea5be962fdf1ee91f9` |
| sql-manual/sql-statements/session/queries/CLEAN-ALL-PROFILE | versioned_docs/version-4.x/sql-manual/sql-statements/session/queries/CLEAN-ALL-PROFILE.md | `771273be0b9dc412a9c2431e69f74456e429b2cb9ebebc338c207a1cfb930f36` |
| sql-manual/sql-statements/session/queries/SHOW-QUERY-STATS | versioned_docs/version-4.x/sql-manual/sql-statements/session/queries/SHOW-QUERY-STATS.md | `663413a48bddcd8929128109868d734c2451bb0117103d48d94d59b0635d6886` |
| sql-manual/sql-statements/session/queries/CLEAN-ALL-QUERY-STATS | versioned_docs/version-4.x/sql-manual/sql-statements/session/queries/CLEAN-ALL-QUERY-STATS.md | `39bee638ef43d567d3fb5d76ea1d4d88f8ef232eb25f3c4d0b83087bf62c877e` |
| sql-manual/sql-statements/session/queries/PLAN-REPLAYER-DUMP | versioned_docs/version-4.x/sql-manual/sql-statements/session/queries/PLAN-REPLAYER-DUMP.md | `356d7ccc63d73e1088af26637958476a87e6f60591db266ab7c5ccdef587501c` |
| sql-manual/sql-statements/session/connection/KILL-CONNECTION | versioned_docs/version-4.x/sql-manual/sql-statements/session/connection/KILL-CONNECTION.md | `f82977fe00c2deb5b84f3cbe13542bdd40a35b14ca1f7858e4e5a52e34e25c34` |
| sql-manual/sql-statements/transaction/BEGIN | versioned_docs/version-4.x/sql-manual/sql-statements/transaction/BEGIN.md | `85b229fa700afd4136e428dbb23ea7baeb039d750a87625536effbbc671f1435` |
| sql-manual/sql-statements/transaction/COMMIT | versioned_docs/version-4.x/sql-manual/sql-statements/transaction/COMMIT.md | `f43e1708d774cb6e6395f13dd71f77e1b57ab1cf3287477315efa3c584cb1151` |
| sql-manual/sql-statements/transaction/ROLLBACK | versioned_docs/version-4.x/sql-manual/sql-statements/transaction/ROLLBACK.md | `819aba3d2cc944a9ca434f13f3ccfb69cd4b9f9eb3604deb5508977759cca3d0` |
| sql-manual/sql-statements/transaction/SHOW-TRANSACTION | versioned_docs/version-4.x/sql-manual/sql-statements/transaction/SHOW-TRANSACTION.md | `895a09d67dd1b53cabd56e8c96b6afabf43c1e871ebd647b5f71a3d7754e6151` |
| sql-manual/sql-statements/catalog/CREATE-CATALOG | versioned_docs/version-4.x/sql-manual/sql-statements/catalog/CREATE-CATALOG.md | `d462f81ed1789a8444f2107b2edb8c2001c727d07e46271beb6e820678c200bf` |
| sql-manual/sql-statements/catalog/ALTER-CATALOG | versioned_docs/version-4.x/sql-manual/sql-statements/catalog/ALTER-CATALOG.md | `1e77822ff370cfa2468461a2d5ec6d3642f5e9df708764415da4e278b0f0b42d` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-069

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 215.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/catalog/DROP-CATALOG | versioned_docs/version-4.x/sql-manual/sql-statements/catalog/DROP-CATALOG.md | `d0b85fb449551b206d99664546992b5ddd183205a2849a9da57acd02afb13567` |
| sql-manual/sql-statements/catalog/SHOW-CREATE-CATALOG | versioned_docs/version-4.x/sql-manual/sql-statements/catalog/SHOW-CREATE-CATALOG.md | `dc31c7fbf63ad6cede489f0f7f8d632d01e058e18c92376f49a7126f01e8b1ae` |
| sql-manual/sql-statements/catalog/SHOW-CATALOG | versioned_docs/version-4.x/sql-manual/sql-statements/catalog/SHOW-CATALOG.md | `407f5625cdb2ff7d97bc14965dc64c7822c3ec2d05007950a667e01ce33dff76` |
| sql-manual/sql-statements/catalog/SHOW-CATALOGS | versioned_docs/version-4.x/sql-manual/sql-statements/catalog/SHOW-CATALOGS.md | `a9c78d74b2ee473135acc949cc1d8139475a7c1b8a961317f6efe95f549a4274` |
| sql-manual/sql-statements/catalog/REFRESH | versioned_docs/version-4.x/sql-manual/sql-statements/catalog/REFRESH.md | `761f6e073a66eaa08d718008edfc9962416dbc9b0db314de8dfe70d30cf014e1` |
| sql-manual/sql-statements/database/CREATE-DATABASE | versioned_docs/version-4.x/sql-manual/sql-statements/database/CREATE-DATABASE.md | `17965b92d4ccd5fc1cbff2912183cb1cae61eaf5d136a324908f209825d7ad36` |
| sql-manual/sql-statements/database/ALTER-DATABASE | versioned_docs/version-4.x/sql-manual/sql-statements/database/ALTER-DATABASE.md | `c18426fc5374af5b67eedce528caddcb35cc2f3264ed1f944b4969bfca28764c` |
| sql-manual/sql-statements/database/DROP-DATABASE | versioned_docs/version-4.x/sql-manual/sql-statements/database/DROP-DATABASE.md | `8f29349a50432ac48064cfe61ab1aee8dee0da9b41922757eeaf821fe39c3930` |
| sql-manual/sql-statements/database/SHOW-CREATE-DATABASE | versioned_docs/version-4.x/sql-manual/sql-statements/database/SHOW-CREATE-DATABASE.md | `57debf9f33d3a31c5b5f6b586710c01f730e91385d90e53a2e65156670f7fc63` |
| sql-manual/sql-statements/database/SHOW-DATABASES | versioned_docs/version-4.x/sql-manual/sql-statements/database/SHOW-DATABASES.md | `1597cbeeb8cfaeae1aa265b2b58dd3cd37960afd576bcfc0528e72736376247c` |
| sql-manual/sql-statements/database/SHOW-DATABASE-ID | versioned_docs/version-4.x/sql-manual/sql-statements/database/SHOW-DATABASE-ID.md | `f3bd46c531b10316563d26657d317ab2c7e03c3e0db4e6a43d3eddc58eb9c73b` |
| sql-manual/sql-statements/table-and-view/table/CREATE-TABLE | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md | `601d25809b0d424abe8544c44c1f3c98ef14baa900a51ee92dd02a9a116a8367` |
| sql-manual/sql-statements/table-and-view/table/DESC-TABLE | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/DESC-TABLE.md | `9628078267ba0cff3b673a4250fe53b74ad78ff14cd6125591eedc7c5bf4cd31` |
| sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN.md | `6715b7a0e5a912b22af46b1e1aebeb815ac25bbf49cd2006169234da67fa1b09` |
| sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PARTITION | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PARTITION.md | `a89115a0ddfa26c0385ae52c7ddfff1e38eb66fd6591640619cddc0a743584ca` |
| sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-ROLLUP | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-ROLLUP.md | `7abde5ba503c98fc85475520a305993846407955a4df42dcded1b7a7bfe3d8ca` |
| sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-RENAME | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-RENAME.md | `a574e1bf3875a1de62e4bcb7f51a8f2d88d65b1e06933b066d5c0eb06d31ae88` |
| sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-REPLACE | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-REPLACE.md | `7de37330e4d8a3cdfdfb4e368a16224fb252a42a3e68dcf6a26e61c4c3e0ed55` |
| sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PROPERTY | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PROPERTY.md | `fddafbe4b2907d1f97f3eb7a968f0181f7f354a75144143c0e53463b874fe9d7` |
| sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COMMENT | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COMMENT.md | `71ff7174f6e0210444c0fcbcdaa3ea1a882e54265f874918f65391c5f721dcb2` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-070

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 195.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-DISTRIBUTION | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-DISTRIBUTION.md | `f78fbb4477b6958d6ac201f2b755b88bd767303a0267ecec4a0f401b5171e67a` |
| sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-ADD-GENERATED-COLUMN | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-ADD-GENERATED-COLUMN.md | `3a1bd8a6ffbcacc96e8dc21ed1f4fc41e5519b5486d842baee9ad336cc020e7f` |
| sql-manual/sql-statements/table-and-view/table/CANCEL-ALTER-TABLE | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/CANCEL-ALTER-TABLE.md | `0d02229a6c3c5b9b81a09d30de0b72f9a481a5cee7393b36bd62998a616e1221` |
| sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE.md | `71ba50f435f5007c8452f54828f4c60714bdae099b7e6e214ffa0fde9edbb188` |
| sql-manual/sql-statements/table-and-view/table/TRUNCATE-TABLE | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/TRUNCATE-TABLE.md | `9a22a8306640928094d72449ae30990c16b202576d2439ae732f4e3e83ee6301` |
| sql-manual/sql-statements/table-and-view/table/DROP-TABLE | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/DROP-TABLE.md | `0f4152d8beabfef99a40ed3e35dc1fbc41294b4ed07f6596b5490ea47f444086` |
| sql-manual/sql-statements/table-and-view/table/SHOW-CREATE-TABLE | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/SHOW-CREATE-TABLE.md | `7e8f40eb691cbf43ec66191f6b51cea0726646d7f30cfab495b45ff3a9836b8c` |
| sql-manual/sql-statements/table-and-view/table/SHOW-TABLES | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/SHOW-TABLES.md | `49d812814286030d341599c5526ff87ecc2580845b1fbe9cece1a382ce21cc5d` |
| sql-manual/sql-statements/table-and-view/table/SHOW-TABLE-ID | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/SHOW-TABLE-ID.md | `6d50bc0b7e4b893d6ac9c40a24807d342d8bc1afad610df689a958ff66f7b11a` |
| sql-manual/sql-statements/table-and-view/table/SHOW-TABLE-STATUS | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/SHOW-TABLE-STATUS.md | `92eddb15d19724cf958ec265e8e5e8f114d790b39ba93832f5de203188178c5e` |
| sql-manual/sql-statements/table-and-view/table/SHOW-CONVERT-LIGHT-SCHEMA-CHANGE-PROCESS | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/SHOW-CONVERT-LIGHT-SCHEMA-CHANGE-PROCESS.md | `fa0839ab04f700098ba55d96f53d9e8ec56a59af05461cc6cfb6b69feb1dd38f` |
| sql-manual/sql-statements/table-and-view/table/SHOW-PARTITION | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/SHOW-PARTITION.md | `4e4237406862249b2c89e33f98c1ed37cdfa7b8c3ffc00cf4d563a53ba5a3100` |
| sql-manual/sql-statements/table-and-view/table/SHOW-PARTITION-ID | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/SHOW-PARTITION-ID.md | `83a3bc35a112e7959cafabff6d61ecb5e57ab1d5ea62b6c4b64207fa553fd295` |
| sql-manual/sql-statements/table-and-view/table/SHOW-PARTITIONS | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/SHOW-PARTITIONS.md | `6dd92e13b900661c5c3fd56e3e3eb43fedd7fa875b2a6b3737e7639efc1278a5` |
| sql-manual/sql-statements/table-and-view/table/SHOW-DYNAMIC-PARTITION-TABLES | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/SHOW-DYNAMIC-PARTITION-TABLES.md | `227355c040db02e38d4ca76b887bb80f5abac246ff336faba79bf90cc9c5a9c9` |
| sql-manual/sql-statements/table-and-view/table/SHOW-COLUMNS | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/SHOW-COLUMNS.md | `8ff0b532f4e2d675793a3c619fc24c9632a1cb3b8a15b04cb33399167f2b41ab` |
| sql-manual/sql-statements/table-and-view/table/ALTER-COLOCATE-GROUP | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/table/ALTER-COLOCATE-GROUP.md | `69fcf417df7b5229a1a246b69d93c3463def9d6d38e51c694eeeac286d8d163f` |
| sql-manual/sql-statements/table-and-view/index/CREATE-INDEX | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/index/CREATE-INDEX.md | `3bc081f389d53c69d8f4f6c2f6e2dc5a71f64762a5db16d90943f7c6d13532c6` |
| sql-manual/sql-statements/table-and-view/index/DROP-INDEX | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/index/DROP-INDEX.md | `2a5f775ba0dfeec836cc8e8c05368d1b0787f00056254c02f238defdc51bc966` |
| sql-manual/sql-statements/table-and-view/index/SHOW-INDEX | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/index/SHOW-INDEX.md | `579760693bf7a56561ab1dd95517dfd71086b97f176c51e72d0ed9e0dfa60dc4` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-071

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 175.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/table-and-view/index/BUILD-INDEX | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/index/BUILD-INDEX.md | `54e4d71e3e812f72580e63aecc36bc677a64735136a1d3f21949fefd879d2c1d` |
| sql-manual/sql-statements/table-and-view/index/CANCEL-BUILD-INDEX | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/index/CANCEL-BUILD-INDEX.md | `9800c6153cc574731cb85c5c962dd4acd39e4c3b96ef2097860d03f7da47ebc5` |
| sql-manual/sql-statements/table-and-view/index/SHOW-BUILD-INDEX | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/index/SHOW-BUILD-INDEX.md | `7f8e8d891ba87b4d9a66743429bcd891b02a23adf8311acd08cf26c6d3db6f12` |
| sql-manual/sql-statements/table-and-view/view/CREATE-VIEW | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/view/CREATE-VIEW.md | `1a16e17af6571ad74a883a7d0b136f5467bba2c377dea77c1d5cbee14b30bf7a` |
| sql-manual/sql-statements/table-and-view/view/ALTER-VIEW | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/view/ALTER-VIEW.md | `2d1fccac0cb398f75cb5accd1737ab3bd3d693886b62466d4a03c9f46db468c8` |
| sql-manual/sql-statements/table-and-view/view/DROP-VIEW | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/view/DROP-VIEW.md | `1ad1a5f2ace8c9f115421e50fa08685e649bb2f73a8ec9fa81ee160905b01c0e` |
| sql-manual/sql-statements/table-and-view/view/SHOW-CREATE-VIEW | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/view/SHOW-CREATE-VIEW.md | `b82a03b4bc5863fdc5c77cdb02735e9622d777b7a218a9cf6cafb6143f2a515c` |
| sql-manual/sql-statements/table-and-view/view/SHOW-VIEW | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/view/SHOW-VIEW.md | `90dd186de58564ed0853db0899e7e9896de681c601814d461877768183860ff2` |
| sql-manual/sql-statements/table-and-view/sync-materialized-view/CREATE-MATERIALIZED-VIEW | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/sync-materialized-view/CREATE-MATERIALIZED-VIEW.md | `185a3846950a5a34d0b7abb78bf3220fe78b9d5d2b11e5fb757ca03459b9b292` |
| sql-manual/sql-statements/table-and-view/sync-materialized-view/DROP-MATERIALIZED-VIEW | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/sync-materialized-view/DROP-MATERIALIZED-VIEW.md | `b68421c4094f8e689035ae958ee43d6f2f4b83d4e86c850ec9cb2204bb709ec5` |
| sql-manual/sql-statements/table-and-view/sync-materialized-view/SHOW-ALTER-TABLE-MATERIALIZED-VIEW | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/sync-materialized-view/SHOW-ALTER-TABLE-MATERIALIZED-VIEW.md | `27871927e0c0837356a36f2f43c392a02d44b563714bae6fe51cebbfd43610dd` |
| sql-manual/sql-statements/table-and-view/sync-materialized-view/SHOW-CREATE-MATERIALIZED-VIEW | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/sync-materialized-view/SHOW-CREATE-MATERIALIZED-VIEW.md | `216e509f9d3ba79bb04e20a11397de811ac02e3a77954245e29d3406df090df4` |
| sql-manual/sql-statements/table-and-view/async-materialized-view/ALTER-ASYNC-MATERIALIZED-VIEW | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/async-materialized-view/ALTER-ASYNC-MATERIALIZED-VIEW.md | `f5d01fbbe1f462a56a4f7b75004dd28bd3f2dc34b1d6ea8f8d1139cc5818bc99` |
| sql-manual/sql-statements/table-and-view/async-materialized-view/CANCEL-MATERIALIZED-VIEW-TASK | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/async-materialized-view/CANCEL-MATERIALIZED-VIEW-TASK.md | `0cf01da72f15c8286bdebdcd18d2f5e0c7dbcd78b69bf9799625e525a940ae1b` |
| sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW.md | `6697edda21a3fe94d29c7f51fbe12509a04fc8578425c2a574e4d9512741d850` |
| sql-manual/sql-statements/table-and-view/async-materialized-view/PAUSE-MATERIALIZED-VIEW-JOB | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/async-materialized-view/PAUSE-MATERIALIZED-VIEW-JOB.md | `68bdc05f14bc460d5001047bfe5bda942586a081dde47b5040d858a0501f78fc` |
| sql-manual/sql-statements/table-and-view/async-materialized-view/DROP-ASYNC-MATERIALIZED-VIEW | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/async-materialized-view/DROP-ASYNC-MATERIALIZED-VIEW.md | `4ed48ff94566cb2d84a3f91f5a699e1c74688efa4d56989def0fc7a37a79d4ae` |
| sql-manual/sql-statements/table-and-view/async-materialized-view/REFRESH-MATERIALIZED-VIEW | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/async-materialized-view/REFRESH-MATERIALIZED-VIEW.md | `058fe30a1278a3b92190524a9cc08fc97869d9ca29eee07a8bae81c1644cdbef` |
| sql-manual/sql-statements/table-and-view/async-materialized-view/RESUME-MATERIALIZED-VIEW-JOB | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/async-materialized-view/RESUME-MATERIALIZED-VIEW-JOB.md | `6e5482d8e10f2a9b19845fc44aba5c00b08101a31092c7be733e5049978e74b7` |
| sql-manual/sql-statements/table-and-view/async-materialized-view/SHOW-CREATE-ASYNC-MATERIALIZED-VIEW | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/async-materialized-view/SHOW-CREATE-ASYNC-MATERIALIZED-VIEW.md | `f6e07065e1f819d921918beb448c77f4e76bb50362416e5d624441e0be020867` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-072

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 155.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/table-and-view/data-and-status-management/REBALANCE-DISK | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/REBALANCE-DISK.md | `1d20365a3e82f81393f6e556fcf038de3ac66f0d1227fa5b97635aaa3dc25493` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/CANCEL-REBALANCE-DISK | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/CANCEL-REBALANCE-DISK.md | `5b30baa82150c61d877de07e4f29f1700d22c7c4d3f2814d64144020ff7f2479` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-DATA | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-DATA.md | `993b883c56044a7b0f5356c51364ef1418c4fc3a5811a29af38d8de2be0d4797` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-DATA-SKEW | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-DATA-SKEW.md | `9ee725a13fb8ac2240c6f5fe4e15864ba5f248f9922bd0fa6bd24be89156eb6b` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/COMPACT-TABLE | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/COMPACT-TABLE.md | `fcb89107bb083d68951d5a6ebd20db5149c57e52ebda0e449febab2fb52f2429` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/REPAIR-TABLE | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/REPAIR-TABLE.md | `3975b497567fc376147db3ab87db83bed4acda8b8e820383100d92a947718580` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/CANCEL-REPAIR-TABLE | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/CANCEL-REPAIR-TABLE.md | `3d71e5d2d2d0d9f3e713db792f420f1b479067cc680f9b2b25118228ebff9ea9` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SET-TABLE-STATUS | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/SET-TABLE-STATUS.md | `eccc03e94a072ef2409f34365a0762c1087909ce35d087ba5f7051682a4556c0` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SET-TABLE-PARTITION-VERSION | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/SET-TABLE-PARTITION-VERSION.md | `2782f051e6917c20283a384716f78ba77e3914348659fe8e5ec600f57c91a0b5` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/DIAGNOSE-TABLET | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/DIAGNOSE-TABLET.md | `b346950525ace9b5c3bdff79fa61880cf95a3c177b9e0558eb183f54235d9e97` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/ADMIN-COPY-TABLET | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/ADMIN-COPY-TABLET.md | `c43088e8d0f5a7f26869d25aafafcb509bd344ec0ca1812181332bbdf859c750` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/ADMIN-CHECK-TABLET | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/ADMIN-CHECK-TABLET.md | `b6e27cfe11b6f3ee62fdd16ea1215f6fc72ffedf797f3c11743c039e52e42569` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET.md | `f529c1872f32314d9326037e2ea964850c887ce82df1441a0334a140c650c2f4` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLETS-BELONG | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLETS-BELONG.md | `3d47255e9ce774e0625430a996904b242e63be29341687c820bf584b5af053c4` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET-STORAGE-FORMAT | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET-STORAGE-FORMAT.md | `96d85592f0533bbd22d60cf88722f251b231283062c70c277908d30b8b1ff935` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET-DIAGNOSIS | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET-DIAGNOSIS.md | `41322c6f07783dad093843e720307c3957c06aa0ab74d7a3ee9054a10a925586` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/ADMIN-SET-REPLICA-STATUS | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/ADMIN-SET-REPLICA-STATUS.md | `d5365bf43f31d16726f0444e9e8ae402392023b429c34d09ac809be56096e2da` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/ADMIN-SET-REPLICA-VERSION | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/ADMIN-SET-REPLICA-VERSION.md | `9d1f3751686b915bbb7de83bd756aaa4f6e9357298c15fcf9cf9159b813176b7` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-REPLICA-STATUS | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-REPLICA-STATUS.md | `6972ea03879b2abf007edfe0a9e9c1dd577ff2d1f501350b2eb673225ee8a3be` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-REPLICA-DISTRIBUTION | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-REPLICA-DISTRIBUTION.md | `51b1d5ce3dfb9043cfcd8e7b634ae8138bbf0c30d8a796daee02e77e3844e21f` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-073

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 135.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/table-and-view/data-and-status-management/CLEAN-TRASH | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/CLEAN-TRASH.md | `fe07d7fc65e05041e5fabeb0fd86a171989aba850af61066426affbdbb14a583` |
| sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TRASH | versioned_docs/version-4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TRASH.md | `333c2c08a822a4f3e3176b354e6d2ed4d34789af102f0e0cd97f4a5e6afae622` |
| sql-manual/sql-statements/recycle/SHOW-CATALOG-RECYCLE-BIN | versioned_docs/version-4.x/sql-manual/sql-statements/recycle/SHOW-CATALOG-RECYCLE-BIN.md | `3095e232cc2629a9ceb2eebd6a8bf91411d7813bc8e71486d4291443da5ad7c1` |
| sql-manual/sql-statements/recycle/DROP-CATALOG-RECYCLE-BIN | versioned_docs/version-4.x/sql-manual/sql-statements/recycle/DROP-CATALOG-RECYCLE-BIN.md | `7550abb7dfbb08b5f516c35802685a4bcc8fbeb27cba1b795b41fcef8454b49d` |
| sql-manual/sql-statements/recycle/RECOVER | versioned_docs/version-4.x/sql-manual/sql-statements/recycle/RECOVER.md | `dd397620db8baa8583654417ce2fabf404a3b3182a295656f98531fd7e9ceae0` |
| sql-manual/sql-statements/function/CREATE-FUNCTION | versioned_docs/version-4.x/sql-manual/sql-statements/function/CREATE-FUNCTION.md | `a4eee84093fcd3d29bc6f06815398bbfd017c12c45541d1dd5b28440cb9da7e6` |
| sql-manual/sql-statements/function/DROP-FUNCTION | versioned_docs/version-4.x/sql-manual/sql-statements/function/DROP-FUNCTION.md | `285c8ca04a4fb477fbe0181672a6b4fdf47cd90139004b9d4795a0c620abd43c` |
| sql-manual/sql-statements/function/SHOW-CREATE-FUNCTION | versioned_docs/version-4.x/sql-manual/sql-statements/function/SHOW-CREATE-FUNCTION.md | `d3ca6fbd54a1b286efeed9f80187dfb09217ff06fe0836bf69e071fad4908669` |
| sql-manual/sql-statements/function/DESC-FUNCTION | versioned_docs/version-4.x/sql-manual/sql-statements/function/DESC-FUNCTION.md | `277c4be4eca4534de7a794dd11ac469c6ac2c968d0306e9a43e76a3688084237` |
| sql-manual/sql-statements/function/SHOW-FUNCTIONS | versioned_docs/version-4.x/sql-manual/sql-statements/function/SHOW-FUNCTIONS.md | `0e9ddd0122075be6b07adb585fe2c1240fad2d0f42a4fd0fd3f6d4e8dfe2f5cd` |
| sql-manual/sql-statements/statistics/ANALYZE | versioned_docs/version-4.x/sql-manual/sql-statements/statistics/ANALYZE.md | `7fff46f665bc5c1bfa9968a5cf8f0d5533f84b60149324aa47683796f8bfad71` |
| sql-manual/sql-statements/statistics/ALTER-STATS | versioned_docs/version-4.x/sql-manual/sql-statements/statistics/ALTER-STATS.md | `1cbed2ffee04f9de2c7081cbc3f3571c81d7a4579bbbc70d5953912600cadb04` |
| sql-manual/sql-statements/statistics/DROP-STATS | versioned_docs/version-4.x/sql-manual/sql-statements/statistics/DROP-STATS.md | `0f82b90082ee7d82543ab2dd83661c263351b32a94812c55a0f24e3a11e3cf11` |
| sql-manual/sql-statements/statistics/SHOW-TABLE-STATS | versioned_docs/version-4.x/sql-manual/sql-statements/statistics/SHOW-TABLE-STATS.md | `42e4c200b65db95f0380a444fb596edebfdbf8834f51b239baf89311556d8e1a` |
| sql-manual/sql-statements/statistics/SHOW-STATS | versioned_docs/version-4.x/sql-manual/sql-statements/statistics/SHOW-STATS.md | `fe2c108577a747f8952a05197b64e25dedc18fb78a17de3faeb6558951dba8d4` |
| sql-manual/sql-statements/statistics/DROP-ANALYZE-JOB | versioned_docs/version-4.x/sql-manual/sql-statements/statistics/DROP-ANALYZE-JOB.md | `616b566dfd1b7fdabe1a0c1d1f5ccb4156866a8d658ec1e1d74fe1a395a1efb1` |
| sql-manual/sql-statements/statistics/KILL-ANALYZE-JOB | versioned_docs/version-4.x/sql-manual/sql-statements/statistics/KILL-ANALYZE-JOB.md | `722ad8feffd110c2bb95fd043c039bfb0be6626ab678871ab882ba47ad4a4e24` |
| sql-manual/sql-statements/statistics/SHOW-ANALYZE | versioned_docs/version-4.x/sql-manual/sql-statements/statistics/SHOW-ANALYZE.md | `d9dc75c118889f055812f504778994c93bf6f0551effd4bce666973b63e6c5b5` |
| sql-manual/sql-statements/cluster-management/instance-management/ADD-FOLLOWER | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/instance-management/ADD-FOLLOWER.md | `2300e0b173869de08acb9b46450f8ecaa13ab5df8ba9bfafccc3feac811203cc` |
| sql-manual/sql-statements/cluster-management/instance-management/DROP-FOLLOWER | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/instance-management/DROP-FOLLOWER.md | `21f3c6adde7a8c6f9de91f4c35b345999fe4184f2454c1798c7583eae130c6ce` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-074

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 115.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/cluster-management/instance-management/ADD-OBSERVER | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/instance-management/ADD-OBSERVER.md | `560ec912cfaf078dea2824996b2ea49d3d69a50526d62f23c57122df917f9b1e` |
| sql-manual/sql-statements/cluster-management/instance-management/DROP-OBSERVER | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/instance-management/DROP-OBSERVER.md | `856573d1eeeafee38c75a38964991ea4a1249bb400af63a1c64429924d83e8a0` |
| sql-manual/sql-statements/cluster-management/instance-management/SET-FRONTEND-CONFIG | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/instance-management/SET-FRONTEND-CONFIG.md | `22531121d0410c34dc2de5bc9fcd72faaf468d820b21d02d5dd2cb50d085f6df` |
| sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG.md | `2752e47d15491c720bc577e5a3f3f9acd9541692765bc9e26a198b051a86fcff` |
| sql-manual/sql-statements/cluster-management/instance-management/MODIFY-FRONTEND-HOSTNAME | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/instance-management/MODIFY-FRONTEND-HOSTNAME.md | `ccfad8fdb9fdd4d69047dde221d300e81bac8f990e521c904afb4bd169a6e42e` |
| sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTENDS | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTENDS.md | `f86da97d5d1811f540ee3abfaca18fa158beea668a9a1f0926fb5a78b90d764f` |
| sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTENDS-DISKS | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTENDS-DISKS.md | `c0e2db4a21c57821ed1c82c8f7e5a5f069b6a61478dfef4b578c71808a1d430f` |
| sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND.md | `342e237a86df2f9c7306fad685cc37b405940a6fdbae0256429a7727affb774f` |
| sql-manual/sql-statements/cluster-management/instance-management/DROP-BACKEND | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/instance-management/DROP-BACKEND.md | `526c9244e2b3bc1a8d828b7776c69109f81690d7a0b289365bdfd1715342de82` |
| sql-manual/sql-statements/cluster-management/instance-management/MODIFY-BACKEND | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/instance-management/MODIFY-BACKEND.md | `0739c1625bcb2004aab14fa63341b1b2217d3713435af07fed93d1acec7336d1` |
| sql-manual/sql-statements/cluster-management/instance-management/SHOW-BACKENDS | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/instance-management/SHOW-BACKENDS.md | `7ccfdce12171f9d8e691f69e3ff67ecab26abd7ef9c95c366f4acdf004b868db` |
| sql-manual/sql-statements/cluster-management/instance-management/SHOW-BACKEND-CONFIG | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/instance-management/SHOW-BACKEND-CONFIG.md | `83818a9fc9884d3cdc108860973179aa47e8e112332bf095075e2bf11dcf9ff2` |
| sql-manual/sql-statements/cluster-management/instance-management/DECOMMISSION-BACKEND | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/instance-management/DECOMMISSION-BACKEND.md | `257bda4eae6b40a8209e606e966f8d646fc0acbef1a3502a26a0cac079471bf6` |
| sql-manual/sql-statements/cluster-management/instance-management/CANCEL-DECOMMISSION-BACKEND | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/instance-management/CANCEL-DECOMMISSION-BACKEND.md | `58eb8bef85f5a557819f4510579e96163354f374895596f50a5a53a4b9a54954` |
| sql-manual/sql-statements/cluster-management/instance-management/ADD-BROKER | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/instance-management/ADD-BROKER.md | `bc7208ed4f9f7ca75b45fc5fe1f3cded2c0493062294506504876dd0fe06a750` |
| sql-manual/sql-statements/cluster-management/instance-management/DROP-BROKER | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/instance-management/DROP-BROKER.md | `13de315e41016fdf74b6e6d3b353c6460ef782a8ea04076fdf5fcae8710dd57a` |
| sql-manual/sql-statements/cluster-management/instance-management/SHOW-BROKER | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/instance-management/SHOW-BROKER.md | `a11cc054c2cba7ecd1ff0553e9cb8c05b277016dcd4b23c3cfb80079071c930a` |
| sql-manual/sql-statements/cluster-management/compute-management/CREATE-RESOURCE | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/compute-management/CREATE-RESOURCE.md | `b033c4164bb1e14f14fca86c4ee72fbf27dcbe3c8fb26e1d1e6ad4bdb623312e` |
| sql-manual/sql-statements/cluster-management/compute-management/ALTER-RESOURCE | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/compute-management/ALTER-RESOURCE.md | `5734be5af146436dca0457e25274d8ad05f5e88b62f3bec14c2fbd5c3320c3bd` |
| sql-manual/sql-statements/cluster-management/compute-management/DROP-RESOURCE | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/compute-management/DROP-RESOURCE.md | `e445233678d794905d2ec2e8bd13e16ea1809053c27b2f773f0741b6436905f4` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-075

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 95.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/cluster-management/compute-management/SHOW-RESOURCES | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/compute-management/SHOW-RESOURCES.md | `5dc23ff52fe2dc3f83dbb710fd8ed587f156f7484114b52ac152ebc8dc024207` |
| sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-GROUP | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-GROUP.md | `032b7914f488c5f9ee2d14ba84a472c090cfbe88555fb9ac30aa03ae6956215e` |
| sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-GROUP | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-GROUP.md | `500d23650c686d2a0cf227889f916f28b93cbdb1c70efe66156d9bea5c420459` |
| sql-manual/sql-statements/cluster-management/compute-management/DROP-WORKLOAD-GROUP | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/compute-management/DROP-WORKLOAD-GROUP.md | `5a517162f0aa143c850a248822f085e57ecb4834b890bb184498771c08659bab` |
| sql-manual/sql-statements/cluster-management/compute-management/SHOW-WORKLOAD-GROUPS | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/compute-management/SHOW-WORKLOAD-GROUPS.md | `45101971735896edce99f0195ac7a24fd33a305048121148dbe9b6765a1a0490` |
| sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-POLICY | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-POLICY.md | `290dcba0952bf516d8003596dad3bd80cc01f357f822ce163e55c59175c16c5e` |
| sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-POLICY | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-POLICY.md | `1f437bd64af128c74a5ee9392ac43fade5270e94f4a302215b4f480a77191406` |
| sql-manual/sql-statements/cluster-management/compute-management/DROP-WORKLOAD-POLICY | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/compute-management/DROP-WORKLOAD-POLICY.md | `f33c83cfe328335951f509d3374cf492d242d9b8bfe36848a69b57de484267b3` |
| sql-manual/sql-statements/cluster-management/compute-management/SHOW-COMPUTE-GROUPS | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/compute-management/SHOW-COMPUTE-GROUPS.md | `2ea7aa3e640337d59b0e932b5a926cc63140bb605bf1deaeeaadeadfe227b48a` |
| sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT.md | `c32be7cdea3c5906280001ba1f50457cf147894354d6759022d0c884e84365c8` |
| sql-manual/sql-statements/cluster-management/storage-management/ALTER-STORAGE-VAULT | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/storage-management/ALTER-STORAGE-VAULT.md | `5d8f7bbb4010b3ef582716225ffa414aa2ff71d3fbf500f4776429c23d29c933` |
| sql-manual/sql-statements/cluster-management/storage-management/SET-DEFAULT-STORAGE-VAULT | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/storage-management/SET-DEFAULT-STORAGE-VAULT.md | `9ee2d588ee460f959389c4e72e643e7ea3a94de69fc055a807bdaee48bca1544` |
| sql-manual/sql-statements/cluster-management/storage-management/UNSET-DEFAULT-STORAGE-VAULT | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/storage-management/UNSET-DEFAULT-STORAGE-VAULT.md | `8009913461d8d4277f32fa7258831cbf721899a961f0963bc4a67f8a1803dade` |
| sql-manual/sql-statements/cluster-management/storage-management/SHOW-STORAGE-VAULTS | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/storage-management/SHOW-STORAGE-VAULTS.md | `13a09cde36746891099a2009fb1baad10b751b5148786544c33ac41d7741cb47` |
| sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-POLICY | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-POLICY.md | `7b8699a0bf715bfbdf068523aadc654bc7c1f580b74d050c72a4614601c311cb` |
| sql-manual/sql-statements/cluster-management/storage-management/ALTER-STORAGE-POLICY | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/storage-management/ALTER-STORAGE-POLICY.md | `f236897614d1d9eab7b942dd26c1e0ed23abd50fd6d8fa463209dc5fdb7628c8` |
| sql-manual/sql-statements/cluster-management/storage-management/DROP-STORAGE-POLICY | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/storage-management/DROP-STORAGE-POLICY.md | `a1e4a00c680970e6b15a09a91d984dda9db6be7d13461e768f693d2c21bbce3d` |
| sql-manual/sql-statements/cluster-management/storage-management/SHOW-STORAGE-POLICY | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/storage-management/SHOW-STORAGE-POLICY.md | `cb6b525e4f6e11c0e8e93ab7f74fe8fa489dcf153cc43a7a9f464eae3df0577b` |
| sql-manual/sql-statements/cluster-management/storage-management/WARM-UP | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/storage-management/WARM-UP.md | `6f2f5999a08e8df547ddf5952874e964db39edcafebd0787daf10eb847e7b5f9` |
| sql-manual/sql-statements/cluster-management/storage-management/CANCEL-WARM-UP | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/storage-management/CANCEL-WARM-UP.md | `127048c3fcd2244a9cd1ae67b7d673f84516ea09a1bf8d4de3fe94d9b3c1cb13` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-076

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 75.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/cluster-management/storage-management/SHOW-WARM-UP-JOB | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/storage-management/SHOW-WARM-UP-JOB.md | `b084ffc5491352129af2194fa94672f83e3feee01cbd3e99eed2c776a2dc13e3` |
| sql-manual/sql-statements/cluster-management/storage-management/SHOW-CACHE-HOTSPOT | versioned_docs/version-4.x/sql-manual/sql-statements/cluster-management/storage-management/SHOW-CACHE-HOTSPOT.md | `432130a2145bb0df3314fc4840082a4e7bac1928fa6d0ebca7752ff3c188cbb6` |
| sql-manual/sql-statements/security/CREATE-FILE | versioned_docs/version-4.x/sql-manual/sql-statements/security/CREATE-FILE.md | `60b695564c048cd515ad0d6c07a5b31bf9d6de7b44d7fd1b9ff16092bf90722c` |
| sql-manual/sql-statements/security/DROP-FILE | versioned_docs/version-4.x/sql-manual/sql-statements/security/DROP-FILE.md | `d5f09efad67fb11e9e7a0c58c51c1b833ab8bcb73579596f4da97c6723c45641` |
| sql-manual/sql-statements/security/SHOW-FILE | versioned_docs/version-4.x/sql-manual/sql-statements/security/SHOW-FILE.md | `5d208abc06e59cc4c0c64867d63557f1355434333711dab868b7660485f0e261` |
| sql-manual/sql-statements/security/CREATE-ENCRYPTKEY | versioned_docs/version-4.x/sql-manual/sql-statements/security/CREATE-ENCRYPTKEY.md | `0437e78e5a680dbbb0252b6bc9e9b26b2d27f5fafebf1ca2c9f021730a3fbe92` |
| sql-manual/sql-statements/security/DROP-ENCRYPTKEY | versioned_docs/version-4.x/sql-manual/sql-statements/security/DROP-ENCRYPTKEY.md | `bbf941629b886f44ab32b61795694f0e1ccdcaf97b1fc4e22e53c04328e2f07d` |
| sql-manual/sql-statements/security/SHOW-ENCRYPTKEY | versioned_docs/version-4.x/sql-manual/sql-statements/security/SHOW-ENCRYPTKEY.md | `2365dd65665f0232b867063dab9838d4ac5533d077df0c6e386008996609641a` |
| sql-manual/sql-statements/data-governance/CREATE-SQL_BLOCK_RULE | versioned_docs/version-4.x/sql-manual/sql-statements/data-governance/CREATE-SQL_BLOCK_RULE.md | `9a4deb32654927118b5e8454cb5ff4ef498e1dc0718fc4e6ad800a1126a0a6dd` |
| sql-manual/sql-statements/data-governance/ALTER-SQL_BLOCK_RULE | versioned_docs/version-4.x/sql-manual/sql-statements/data-governance/ALTER-SQL_BLOCK_RULE.md | `edc6957b50f7b28e1f087ec7750fde5a8eee67b5d9cd7e3c396073ca34bbba4b` |
| sql-manual/sql-statements/data-governance/DROP-SQL_BLOCK_RULE | versioned_docs/version-4.x/sql-manual/sql-statements/data-governance/DROP-SQL_BLOCK_RULE.md | `a5bbee11987e8f622096af7460b6b4b83ddd907aa04cb70b28f8a34d31b27076` |
| sql-manual/sql-statements/data-governance/SHOW-SQL_BLOCK_RULE | versioned_docs/version-4.x/sql-manual/sql-statements/data-governance/SHOW-SQL_BLOCK_RULE.md | `d750ab9b04f2dab21da7634a1d81b3a95ecf5546aeb684bc4fa950b2c41de9ba` |
| sql-manual/sql-statements/data-governance/CREATE-ROW-POLICY | versioned_docs/version-4.x/sql-manual/sql-statements/data-governance/CREATE-ROW-POLICY.md | `f1011b64b599bcf558592343325e454fb18225522a0076a24558643b234c01f0` |
| sql-manual/sql-statements/data-governance/DROP-ROW-POLICY | versioned_docs/version-4.x/sql-manual/sql-statements/data-governance/DROP-ROW-POLICY.md | `584a2047ab8f22477015532bfee3cc2b5ec10efd741f1f5d3321447a2a4eb5c2` |
| sql-manual/sql-statements/data-governance/SHOW-ROW-POLICY | versioned_docs/version-4.x/sql-manual/sql-statements/data-governance/SHOW-ROW-POLICY.md | `a5023cb7c6a6f8366efd16be8ce95a3070a01e5dbcdae306d408dff9f94fbff5` |
| sql-manual/sql-statements/job/CREATE-JOB | versioned_docs/version-4.x/sql-manual/sql-statements/job/CREATE-JOB.md | `dca80109fd31c0888b4353fada4dc7832a1fe20b331b5f5ce0df2f69a1c4b7e1` |
| sql-manual/sql-statements/job/CREATE-STREAMING-JOB | versioned_docs/version-4.x/sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md | `6ece6c0632091655838b822f565d6bd5d113baa550f035a096c452d54a47a292` |
| sql-manual/sql-statements/job/ALTER-JOB | versioned_docs/version-4.x/sql-manual/sql-statements/job/ALTER-JOB.md | `3f4a4e331b505041c52244df00489fd7f2437d4be8fd71f57a21071effd2ea18` |
| sql-manual/sql-statements/job/PAUSE-JOB | versioned_docs/version-4.x/sql-manual/sql-statements/job/PAUSE-JOB.md | `471c11f532a20d7ea79363ba54e00609d9f2b3e5534984daade9eb16ae408cc5` |
| sql-manual/sql-statements/job/DROP-JOB | versioned_docs/version-4.x/sql-manual/sql-statements/job/DROP-JOB.md | `34c6f5b9d3bdce8d6164e33586896a4e4af7443ed1b7d33762f91ee6fd6215f0` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-077

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 55.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| sql-manual/sql-statements/job/RESUME-JOB | versioned_docs/version-4.x/sql-manual/sql-statements/job/RESUME-JOB.md | `7d96aefe7fa972cbcab2f297e131e25a01f49ca852c581d7df8cc5ef84d892e9` |
| sql-manual/sql-statements/job/CANCEL-TASK | versioned_docs/version-4.x/sql-manual/sql-statements/job/CANCEL-TASK.md | `e4c644c1af39f5839807a59d7996874a30e1fe04a7429ed8bd6d3a77c07f9745` |
| sql-manual/sql-statements/plugin/INSTALL-PLUGIN | versioned_docs/version-4.x/sql-manual/sql-statements/plugin/INSTALL-PLUGIN.md | `84855047348dbd1b95210c4aa804f024cf26735642eabac4d0196b9db5919bee` |
| sql-manual/sql-statements/plugin/UNINSTALL-PLUGIN | versioned_docs/version-4.x/sql-manual/sql-statements/plugin/UNINSTALL-PLUGIN.md | `c0a143bc935517d8a92728e11a10c52dc6ae9aaca549f1cd4f7a5a488e95262b` |
| sql-manual/sql-statements/plugin/SHOW-PLUGINS | versioned_docs/version-4.x/sql-manual/sql-statements/plugin/SHOW-PLUGINS.md | `535fc76eeae6cc4e9a7d2c633ad51de173c0c32c8ec659c6e71d561678076b5f` |
| sql-manual/sql-statements/character-set/SHOW-COLLATION | versioned_docs/version-4.x/sql-manual/sql-statements/character-set/SHOW-COLLATION.md | `6ff5e38868dcca9d89b3cab93294b9a91b8f246c4da158fb938d2dcc6681cba7` |
| sql-manual/sql-statements/character-set/SHOW-CHARSET | versioned_docs/version-4.x/sql-manual/sql-statements/character-set/SHOW-CHARSET.md | `f01b6aa6d1f29d4b9e1450b2529520e72dd2c28d804c6fdc4d738b922653a3c2` |
| sql-manual/sql-statements/types/SHOW-DATA-TYPES | versioned_docs/version-4.x/sql-manual/sql-statements/types/SHOW-DATA-TYPES.md | `111c0a6cac0a72804554cd2ca7519b3c4bda10f7270e11d0d00b415512ccc5e6` |
| sql-manual/sql-statements/types/SHOW-TYPECAST | versioned_docs/version-4.x/sql-manual/sql-statements/types/SHOW-TYPECAST.md | `2733d55bbabd4b83d626b1bdc3bc3558d96fd08e27f76d00ce98a469e7089244` |
| sql-manual/sql-statements/system-info-and-help/SHOW-PROC | versioned_docs/version-4.x/sql-manual/sql-statements/system-info-and-help/SHOW-PROC.md | `eb641fb9d728ac73583282382e0673a2b2d6e5596201844bf0e40bfe228ac7e5` |
| admin-manual/auth/authentication-and-authorization | versioned_docs/version-4.x/admin-manual/auth/authentication-and-authorization.md | `36e82c03adf6fc59eee707f71d8196390889a7c741b7d6e9f06d56c605b52f34` |
| admin-manual/system-tables/information_schema/backend_metrics | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/backend_metrics.md | `a408f8aed14c003f570b3d2ff3426d8f4ac50b317040d3169e5f8260162b8c41` |
| admin-manual/system-tables/information_schema/frontend_metrics | versioned_docs/version-4.x/admin-manual/system-tables/information_schema/frontend_metrics.md | `927c2528b083b54345320d865759d84fa515ce13c04b3f5cfce3515848413966` |
| data-operate/overview | versioned_docs/version-4.x/data-operate/overview.mdx | `ab77b65606715fb4ff8fe2a28fd15a4a9ee23cc34de1b20972bd195d44add338` |
| data-operate/update/unique-update | versioned_docs/version-4.x/data-operate/update/unique-update.md | `cd1a28fa1bc01c7faf0cd5c716eb4b5375901528a08d74a02b3d9f059fa721ac` |
| features-architecture/versioning | versioned_docs/version-4.x/features-architecture/versioning.md | `556c92b1bcfbcc58d1cc81cdcdef3987f5cfc9d13c096aa10fea7df557f246ae` |
| key-features/analytic-functions | versioned_docs/version-4.x/key-features/analytic-functions.mdx | `2f7ad400e06c8f2653cc59afe3f95b73ac7c254c9232d3e5667a08b57d09ffa8` |
| key-features/batch-load | versioned_docs/version-4.x/key-features/batch-load.mdx | `4df549d984ae39a2ead1f79a197edaa14e115ff8e82b31c408c5f0af74e91883` |
| key-features/binlog-table-stream | versioned_docs/version-4.x/key-features/binlog-table-stream.mdx | `a6d0717e8ae7e4a214e441488241445cd294e63876f6058f87f35251fe3465a5` |
| key-features/bm25 | versioned_docs/version-4.x/key-features/bm25.mdx | `c767dea43ef41ff4a582dc8a9a6a2b691812d54feee6b8854cc6731fabe08487` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-078

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 35.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| key-features/catalog-integrations | versioned_docs/version-4.x/key-features/catalog-integrations.mdx | `90a42dc24853f80d59a3774569b882b737982e8bbf07bf5c031fdc989136e84e` |
| key-features/columnar-storage | versioned_docs/version-4.x/key-features/columnar-storage.mdx | `be9b301dc2106c6722d08b0b52cc0c55482f68d0330da4093cc2fad323fabb5b` |
| key-features/compute-group | versioned_docs/version-4.x/key-features/compute-group.mdx | `ad3936df194dc496cb4a505e8980836b5cf2586715debf46d949364770bfa1af` |
| key-features/condition-cache | versioned_docs/version-4.x/key-features/condition-cache.mdx | `97196341b35ad004d6a5f000363e4565de57d38600c832e58523e9fcbe24ff54` |
| key-features/data-cache-page-cache | versioned_docs/version-4.x/key-features/data-cache-page-cache.mdx | `0fef2c7d90e18062053be7194bcb6e826184003309f55f3001729db9823ee596` |
| key-features/data-compaction | versioned_docs/version-4.x/key-features/data-compaction.mdx | `26b555a3006571847c66550e2677ddea60053a3a5555dc042856993dfeae95a6` |
| key-features/data-lineage | versioned_docs/version-4.x/key-features/data-lineage.mdx | `8fd437ac1c233f79c1affbd9b169809881f107264a7ec0ce8be37a3cd4cd0d2c` |
| key-features/data-model | versioned_docs/version-4.x/key-features/data-model.mdx | `2ff3b4cf58a821fded3a6272d359bd3d27af7ec29979c20289875fb15d4cad4c` |
| key-features/data-pruning | versioned_docs/version-4.x/key-features/data-pruning.mdx | `c6bb00499fd6a1ff9a28cf3756f55f22f85d25aebdff2e6c8b19314d87c1ee74` |
| key-features/data-update-delete | versioned_docs/version-4.x/key-features/data-update-delete.mdx | `7afc3aa9b3f0aea213dc376223b53952733cc6db2342a2a9d86fb9e0df83caf5` |
| key-features/embedding | versioned_docs/version-4.x/key-features/embedding.mdx | `d8f115ca21c0970891cf97090614c9ad262326457583455f9767c2eae0405f1e` |
| key-features/full-text-search | versioned_docs/version-4.x/key-features/full-text-search.mdx | `faf92571eb8326bf27cba0354aea6fc5b624e137a015d3e95566e14f50d23076` |
| key-features/group-commit | versioned_docs/version-4.x/key-features/group-commit.mdx | `f698bcd7814f8c86ed209953dcada377c7686192ae627366c1eabfce782e9065` |
| key-features/high-concurrency-point-query | versioned_docs/version-4.x/key-features/high-concurrency-point-query.mdx | `f27485d05bbbbab58808dd27da93f459eb13732ee62f2b835a655da801db7f19` |
| key-features/hybrid-search | versioned_docs/version-4.x/key-features/hybrid-search.mdx | `74856103a72e6be68fecfe66956660b212112b8d839d02caf1f8558168d15ca0` |
| key-features/iceberg | versioned_docs/version-4.x/key-features/iceberg.mdx | `d95c7a10897df6ce6f2e51246eeedf21a5e54c0a923d5a4d9cb2624c7d9329c1` |
| key-features/incremental-materialized-view | versioned_docs/version-4.x/key-features/incremental-materialized-view.mdx | `c4954023b15bd05420a5026e798618c118ecf2fab60bb6719f33ebfbd72338e8` |
| key-features/inverted-index | versioned_docs/version-4.x/key-features/inverted-index.mdx | `62e9abaf1fd9272bad84dc7596d9a8580472e750543f559a1ccab60762d0c81b` |
| key-features/kafka-cdc-integration | versioned_docs/version-4.x/key-features/kafka-cdc-integration.mdx | `69abf2cf2aceadda27f24f6dfd03c0017f98e2c307b1a2cfc4f2b1926ef3d480` |
| key-features/llm-sql-functions | versioned_docs/version-4.x/key-features/llm-sql-functions.mdx | `93fb4073dab77e5c4073de47ad82c9cc5ed786d54066628e1f889bb8c2bbf469` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-079

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in 4X after this batch: 15.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| key-features/load-transaction | versioned_docs/version-4.x/key-features/load-transaction.mdx | `7b5601c86d1ce2a2bfc3c2290bc2854fc642599a92c4101c161a5d5628e41d26` |
| key-features/managing-lake-table | versioned_docs/version-4.x/key-features/managing-lake-table.mdx | `e6c89d385b6b29afec0828343f8d0fabb388e7a532429d2edf31571bf9d0161e` |
| key-features/mcp-server | versioned_docs/version-4.x/key-features/mcp-server.mdx | `446ff073a98f3d7873226869bafdbb5bb54fc11294c014333fdd015f5e9cb91f` |
| key-features/metadata-cache | versioned_docs/version-4.x/key-features/metadata-cache.mdx | `89e067434a360fead54a0a220eed56e45976f9099e8468eb59eff5eeeda55511` |
| key-features/mpp | versioned_docs/version-4.x/key-features/mpp.mdx | `3f5eeae988337df2f11dec0eaf43790a8634d470c4ee7a5a0af50710a6893980` |
| key-features/multi-catalog | versioned_docs/version-4.x/key-features/multi-catalog.mdx | `918853b9add6586228bbfc8fa1e504c581f78eafe93d5d08785f9ba93b03e1de` |
| key-features/parquet-reader-optimization | versioned_docs/version-4.x/key-features/parquet-reader-optimization.mdx | `0ed0057c0e1d007529971cbe9bf2023e0d9e10fbb1d759fc1c54b6ec013ca3af` |
| key-features/partitioning-and-bucketing | versioned_docs/version-4.x/key-features/partitioning-and-bucketing.mdx | `dd14dc780abfedbdcf4453a3a045e95b091fdeed5097e21216fd2eefe4c78667` |
| key-features/pipeline-execution-engine | versioned_docs/version-4.x/key-features/pipeline-execution-engine.mdx | `f74dd5ded6b023c9afe48ef694bb2d56adb0e7733e651dd10472c40d291ab6ea` |
| key-features/pluggable-auth | versioned_docs/version-4.x/key-features/pluggable-auth.mdx | `ccfc5e2a156ae8fb3b74ae3eb6d5a1df0a4ba04dc28bc11856dd794b919c49fb` |
| key-features/preaggregation-and-rollup | versioned_docs/version-4.x/key-features/preaggregation-and-rollup.mdx | `e2e100e6c25aed1b21c17447ee129cd727fe656570fde0c65b009195ceae94cd` |
| key-features/prepared-statement | versioned_docs/version-4.x/key-features/prepared-statement.mdx | `fdc267dba9012490934edcf0689928200d0cedd68a99e0cb9b303c72551cbef7` |
| key-features/query-cache | versioned_docs/version-4.x/key-features/query-cache.mdx | `ea916fb4bc8238c9917b52d3da9d78ba540bdef28dd49ab018d9415692ef7b7a` |
| key-features/reciprocal-rank-fusion | versioned_docs/version-4.x/key-features/reciprocal-rank-fusion.mdx | `0a30652b953d5c2fb2c9a45251bfed8bfd659f1b39fb845ca4b09eac6344ad04` |
| key-features/resource-group | versioned_docs/version-4.x/key-features/resource-group.mdx | `126b2a35dee41106cb753447df028859631cab7d74e200d88bbdda52dd7ed8c2` |
| key-features/spill-to-disk | versioned_docs/version-4.x/key-features/spill-to-disk.mdx | `242b51f77f4ad0a3e85cac18549d43acde925037131e8e2c76c845630f5162bd` |
| key-features/stream-load | versioned_docs/version-4.x/key-features/stream-load.mdx | `3aff2bc07fa1adfc6c04036675b4bd238e6ed37a19e38df4661506583e0855cf` |
| key-features/unique-key | versioned_docs/version-4.x/key-features/unique-key.mdx | `75350ab4df426b009c6bc0b1e8bba1b44bc62cafedf5041ad91fdfd71cd2fa3d` |
| key-features/variant-data-type | versioned_docs/version-4.x/key-features/variant-data-type.mdx | `e7e255131b4a819db1fdf4bc11a822d62672a150ac2ec7c9a8fa6b134e2b0a3c` |
| key-features/vector-index | versioned_docs/version-4.x/key-features/vector-index.mdx | `2fa15f7d2229b5748aa8a7c79c4a0070465f4149382314dbbabdf3042b478da7` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-4X-080

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 15. Remaining in 4X after this batch: 0.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| key-features/vectorized-execution | versioned_docs/version-4.x/key-features/vectorized-execution.mdx | `ca3716ec1d89b1f801a2d2ea49574b798512ff43c5ec25762e4d76be9c163de0` |
| key-features/vertical-compaction | versioned_docs/version-4.x/key-features/vertical-compaction.mdx | `a22ecc28cf117b68572242dd5513fc9dc57afa525fb983fa633d895c1a2ab5c1` |
| key-features/workload-group | versioned_docs/version-4.x/key-features/workload-group.mdx | `bfea58d76f4aadd0610c9581d17d776b2e0fd167b5a14a3e3713bc43b01857be` |
| query-acceleration/hints/distribute-hint | versioned_docs/version-4.x/query-acceleration/hints/distribute-hint.md | `b01667f200e7b585d844941169622f45b8d816a07b41227a5d72d4c9d0d23532` |
| query-acceleration/hints/leading-hint | versioned_docs/version-4.x/query-acceleration/hints/leading-hint.md | `f96fc4d71ac53793f0bf27eca12d58e9eb96cd392106c6f459cf360aa13e78ea` |
| query-acceleration/query-cache | versioned_docs/version-4.x/query-acceleration/query-cache.md | `9ec56debf4f9bf08432a77994d82e4e1d706c5c6cf345546dfdf68f3667fc466` |
| query-acceleration/tuning/parallelism-tuning | versioned_docs/version-4.x/query-acceleration/tuning/parallelism-tuning.md | `7788799695134ca5ccb89487f83fe7254c129641401a8f7e248cecff81f8087a` |
| sql-manual/sql-functions/ai-functions/distance-functions/inner-product-approximate | versioned_docs/version-4.x/sql-manual/sql-functions/ai-functions/distance-functions/inner-product-approximate.md | `ea4f96217d104cdf9d724ff8e6650dc6e73bfdcbc01842cb4866855a126c803b` |
| sql-manual/sql-functions/ai-functions/distance-functions/l2-distance-approximate | versioned_docs/version-4.x/sql-manual/sql-functions/ai-functions/distance-functions/l2-distance-approximate.md | `639bcebe1324b51c839b0008c6d3629c108a6a150e0f54dd7ecdbeb93d58da5e` |
| sql-manual/sql-functions/scalar-functions/quantile-functions/quantile-state-from-base64 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/quantile-functions/quantile-state-from-base64.md | `0eaeab30f034b24ce478311e937d24bb3f5246ca5eccb239e1dbc2c552082042` |
| sql-manual/sql-functions/scalar-functions/quantile-functions/quantile-state-to-base64 | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/quantile-functions/quantile-state-to-base64.md | `c43f2879195fbbbbd347e74126eda4b71ebafff8e19c7dd7799eff06e8074ebc` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-geometries | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-geometries.md | `efe7d2ac8dff668af83641284b38ec596ccfbafc7153d5e318ceee37963c512b` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-numgeometries | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-numgeometries.md | `0ed88acd82a11357cc0debd2ebaefe825966837e7af96fc75e09b7274b9b67df` |
| sql-manual/sql-functions/scalar-functions/spatial-functions/st-numpoints | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/spatial-functions/st-numpoints.md | `9b998d741e36dd3e958e149fa1f8222193fc1fc98b22f7888d036712756e2710` |
| sql-manual/sql-functions/scalar-functions/string-functions/hamming_distance | versioned_docs/version-4.x/sql-manual/sql-functions/scalar-functions/string-functions/hamming_distance.md | `e4cb49096416136c455826f64de1379a987f843bf3513ca9faff096fc1301337` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-COMMUNITY-001

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in COMMUNITY after this batch: 30.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| subscribe-mail-list | community/subscribe-mail-list.md | `4ccda3a3258f033d15102695cddfc90df24acd5c0870940e51d5f64b5af3d0db` |
| feedback | community/feedback.md | `c4dec690dd07cf838fbc778e913a3ac75063fc1627e08d0f8fc74426a69e47cf` |
| security | community/security.md | `64393453ccf596107b99ab55a98765754f3ce836864e81dcdbd03b4fddf603bd` |
| team | community/team.md | `508d2db69e130fc87b34ad1cee0c5dbc1ab08c1b1b4a647a11004192a3e3f5a1` |
| how-to-contribute/contribute-to-doris | community/how-to-contribute/contribute-to-doris.mdx | `37e4791b16a41684c8d3f54c4f1fc2e976cb26aefc234b3944945064c50639b3` |
| how-to-contribute/community-badges | community/how-to-contribute/community-badges.mdx | `38f8cca8a40b80af2ca018acc180ec08718851dc844c970dd8bd49848b3232af` |
| how-to-contribute/pull-request | community/how-to-contribute/pull-request.md | `ed3064f9e7c889c04c77929170c2de07d4c4987a8803f2cc3277406e120ef018` |
| how-to-contribute/review-and-ci | community/how-to-contribute/review-and-ci.md | `bf5837b2b202c767dea45e9378f8bdde135e89eacc69f4c96c5762a844493616` |
| how-to-contribute/contribute-doc | community/how-to-contribute/contribute-doc.md | `92adddc806e422b80b5be3a9f2c075d436e64edfe50b6241939addb25f2b77c0` |
| how-to-contribute/docs-format-specification | community/how-to-contribute/docs-format-specification.md | `a60fc3e28bc9e7309d726035a8322fe86027c43ae83f9051827f6fb7312017c7` |
| how-to-contribute/how-to-share-blogs | community/how-to-contribute/how-to-share-blogs.md | `f097fb1b367dbcbbfc8e3b053cdce3aa0c5f8bb01e7636ed5ee53acbe845a7e2` |
| source-install/compilation-with-docker | community/source-install/compilation-with-docker.md | `5a1eb2b58ab6125ed5cf8ad953f970abc79d380854778245b00393ab0f4d6e48` |
| source-install/compilation-with-ldb-toolchain | community/source-install/compilation-with-ldb-toolchain.md | `947b5311f04c927e3e7587fb1f64c51c6c9f2a93669e53c9570ec0e98cd80f25` |
| source-install/compilation-linux | community/source-install/compilation-linux.md | `bdda7f9142db9fb755410dfbd8b6b700228ecc3d3e3fcf6cea3894fe1bc68fad` |
| source-install/compilation-arm | community/source-install/compilation-arm.mdx | `c3616ed425c1546529429a3c1f9f42ee5b7af25d1e5b51a53e826399dc0843cf` |
| source-install/compilation-mac | community/source-install/compilation-mac.md | `82855c544dde6fcca4e993b522f1146a19acd297807eec6ad3c1c885264a17e1` |
| source-install/compilation-win | community/source-install/compilation-win.md | `ae83839f16c2116e72cbbe390c339b04ae9de7f24217fa5803a5e9a4e4c82f35` |
| developer-guide/fe-idea-dev | community/developer-guide/fe-idea-dev.md | `860ed3be932ac17c9e42a8f4e57d7e4d8e6b81e6f7802b47955de096125a5b65` |
| developer-guide/fe-vscode-dev | community/developer-guide/fe-vscode-dev.md | `9a062b190b54b238911c0f7e00fc92de5f6bab12138e28f603037a7476e7639c` |
| developer-guide/be-clion-dev | community/developer-guide/be-clion-dev.md | `c1a6fe03f5876a09c93b8fe39c2efaf96f1797757fe851ef51c1f660ff7f8fc0` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-COMMUNITY-002

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 20. Remaining in COMMUNITY after this batch: 10.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| developer-guide/be-vscode-dev | community/developer-guide/be-vscode-dev.md | `791a3e1aa9f7e97883fa484a03cb1210b9d71c12a152f62822b58e07053f38b1` |
| developer-guide/be-multi-directory | community/developer-guide/be-multi-directory.md | `2a43c2971e6012865e4c10d784c3477d5530d73a4f91aa2c89bf4f16a29a2676` |
| developer-guide/docker-dev | community/developer-guide/docker-dev.md | `a2c59f18ff5236e120fb525640a7d1bb2fbf00d0d75dab36433617b404da3a95` |
| developer-guide/java-format-code | community/developer-guide/java-format-code.md | `7bf89f963c1b96263f4848f56dd01d97e7cd8c58812208e68da1c3b685ca748f` |
| developer-guide/cpp-format-code | community/developer-guide/cpp-format-code.md | `9732d8f0d9c7ff1d027eb0888d2eb72c0d8a449a18239942de43073bef7a02af` |
| developer-guide/cpp-diagnostic-code | community/developer-guide/cpp-diagnostic-code.md | `af05bde852f81f871fa010e47879dcca4562fa52350701f6ce2697719b4a3703` |
| developer-guide/debug-tool | community/developer-guide/debug-tool.md | `1833713dcf3f1d0f7c0a74680f00a6623c1dcf52c7696b8f237c9030711bf64b` |
| developer-guide/be-stack-trace | community/developer-guide/be-stack-trace.md | `f3e0ff94973174c1d876c17f0b43678c60d7ee58f77f417b707404ee717691e1` |
| developer-guide/arthas | community/developer-guide/arthas.md | `89cdb23643bb3c68649b54229a9d3840fde921b0346b31493ad8433abf1e5323` |
| developer-guide/fe-profiler | community/developer-guide/fe-profiler.md | `b7a41239c628d4e78f07d7fe1bb46c351b0aaaac3d0a6014a97ea45b3e5a8ea8` |
| developer-guide/pipeline-tracing | community/developer-guide/pipeline-tracing.md | `bbbce7e3c2eb3401eff11531f06c1314048d731e9244b5da413c0b28c0ad87b6` |
| developer-guide/benchmark-tool | community/developer-guide/benchmark-tool.md | `89de2ee64a969ee4ba46db8bf3d2a757469ef73e153df3f36f256a26ae2c9bb4` |
| developer-guide/regression-testing | community/developer-guide/regression-testing.md | `0a4397b7166e070c2a65324325252ac02624f77c773d87cfab4d5be1cf07dfc7` |
| developer-guide/all-in-one-image | community/developer-guide/all-in-one-image.md | `7c1ddcd70b0fff15ef2f855c8dd0cb5a4a02aeb7fffb776a3f8555421a0a4eb3` |
| developer-guide/data-source-extension/jdbc-catalog-developer-guide | community/developer-guide/data-source-extension/jdbc-catalog-developer-guide.md | `6d8e0fb68f696d001f98da9895f97df3ffa9fbbe9b429d25e60bf8024ffee58a` |
| developer-guide/data-source-extension/trino-connector-developer-guide | community/developer-guide/data-source-extension/trino-connector-developer-guide.md | `025defbecc4c37d780b7f0d79515e252313be69583b8ae281b4e9232f4ca56c0` |
| developer-guide/data-lineage-plugin-development | community/developer-guide/data-lineage-plugin-development.md | `8343125666e24bdfd0d25a1ad11206b968ded264e4b95c1be99895bad7d32aaf` |
| developer-guide/bitmap-hll-file-format | community/developer-guide/bitmap-hll-file-format.md | `b01a2e299fb7753ee169f4d5929a1d8680ad3f0f16ebabbda4589c5df5d6e633` |
| release-and-verify/release-versioning | community/release-and-verify/release-versioning.md | `51d0d5cc2729aec867f3e04e5ecd455c59aa473c8873ae9e5f6ba35b2276a4c4` |
| release-and-verify/release-prepare | community/release-and-verify/release-prepare.md | `32832aabf90be26c7a55611a9b082c96279cd43388d516567dcbf87af2b9e966` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.

## T09-COMMUNITY-003

Status: TODO. PR: none. Japanese proofreading: pending.

Dependencies: T03 and T04. Pages: 10. Remaining in COMMUNITY after this batch: 0.

| Doc ID | Source file | Source SHA-256 |
| --- | --- | --- |
| release-and-verify/release-doris-core-with-ai-agent | community/release-and-verify/release-doris-core-with-ai-agent.md | `bd195169f561f6c64e388d4fe46a5982085bb630714ef443665a7420e370210f` |
| release-and-verify/release-doris-core | community/release-and-verify/release-doris-core.md | `a996390c16847a04adcfede37fb4d2feb13f1d90fa6903b7c356ef6bb2aa7c21` |
| release-and-verify/release-doris-connectors | community/release-and-verify/release-doris-connectors.md | `7f4da269e3874f7069b25d7925092bb1f45f94d8a47c800ba361491f9062e51a` |
| release-and-verify/release-doris-shade | community/release-and-verify/release-doris-shade.md | `3287c647f3a0cba0b132187a9f96b2f073de6dabee53013ae22a2dc1520b6846` |
| release-and-verify/release-doris-sdk | community/release-and-verify/release-doris-sdk.md | `20183394ab27a49a04696f8707091c78e8b999da3575c745f2bf6e147a075cda` |
| release-and-verify/release-doris-manager | community/release-and-verify/release-doris-manager.md | `80e9d1e69530fb2fbb99f60baeb6c3fa2eb56222d71d126881cf016b9df6efe3` |
| release-and-verify/release-complete | community/release-and-verify/release-complete.md | `f55e0c2d595675fb42c828264aec37b18a7e7365b11a1be8da6f2b4f072d1b93` |
| release-and-verify/release-verify | community/release-and-verify/release-verify.md | `385109806bd16926815fab6a08afa1477a644903bf2cd01b3fcf5092553c9593` |
| design/grouping_sets_design | community/design/grouping_sets_design.md | `e53b3bc1330298ec54014a6abc5dd83b8c919b2e2e26ac73572e16b35055a499` |
| design/metadata-design | community/design/metadata-design.md | `e9c7809d3224997d9344624c487911ff23a33af21577503a2ae9a604eaed22ed` |

Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;
source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.
