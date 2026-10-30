# Art Gallery by Enso：中国大陆部署迁移

更新时间：2026-10-31（Asia/Shanghai）

## 目标与当前状态

保持现有艺术家、作品、界面和来源记录，将生产访问路径迁入中国大陆。验收包括页面、图片、收藏、笔记及手机/微信内访问；不能用海外构建成功代替国内网络测试。

- 原站：https://artgallerybyenso.netlify.app
- 源码：EnsobyShuffle/artgallerybyenso
- 迁移分支：`migration/tencent-mainland`
- 本轮基于 main：`399df0d2601d5575da5004183fc66553679aa54a`
- 状态：已完成首轮代码准备与离线检查，尚未部署腾讯云，尚未切域名。
- 腾讯云控制台需要正常登录；账号、实名、环境、域名、备案、资源费用仍待实际核对。
- 内容任务仍可能更新 main，每轮先比较最新 main，保留并合入新增内容后重跑审计，不能用本快照覆盖更新。

## 第一轮成果

- 当前数据合并后：9 位艺术家、324 条作品记录；这些是记录数量，不是完整性或许可审核结论。
- 20 条作品使用仓库内的图片；其余自动加载图像仍依赖外部来源。
- 审计发现 616 处运行时外部资源引用、344 个去重 URL；清单见 `research/mainland-migration-audit.json`。
- 外部引用不等于该域名在国内一定被封。需逐项确认许可、原图及实际可达性；关键展示图像优先合法再托管。
- 新增 `/personal-data.html`：收藏/笔记备份下载、导入预览、合并、冲突保护和失败回退。旧域名上的数据不会自动出现在新域名，必须先在原域名导出再在新域名导入。
- 已建立公开文件白名单打包脚本，不上传研究目录、环境配置、凭证、测试或私人笔记。
- 本轮预览包包含 28 个文件，约 5.29 MB；包名明确标注 preview，不代表国内生产验收通过。

## 可重复执行的准备流程

```bash
node scripts/test-personal-data.cjs
node --check personal-data.js
node --check personal-data-core.js
python3 scripts/prepare-cloudbase.py
```

产物：`build/cloudbase/`、`build/cloudbase-files.json`、`build/artgallery-cloudbase-preview.zip`。

生产检查：`python3 scripts/prepare-cloudbase.py --release`。当前会因外部图像引用而阻止生成生产包；不要将失败屏蔽后称为已就绪。每轮内容更新后重新核对清单。严格模式仅是一项静态检查，不能替代国内网络、授权、交互和回退验收。

## 腾讯云部署准备

官方文档（2026-10-31 已阅读）：
- https://docs.cloudbase.net/cli-v1/hosting
- https://docs.cloudbase.net/cli-v1/config

`cloudbaserc.example.json` 使用官方 hosting 配置，目标为上海地域。它是模板，不含真实环境 ID 或凭证。

在账号与具体环境确认后，复制成未跟踪的 `cloudbaserc.json`，以安全的运行时方式提供 `TCB_ENV_ID`。实际部署前检查环境属于用户、静态托管已开通、域名路由正确且路径不与其他站点冲突。不要把多个网站都直接部署到同一个托管根目录；应使用独立应用/正确域名路由。当前模板仅用于单独的画廊应用根路径。

以下命令需已有正常登录状态、有效环境 ID 和已批准的目标站点；本轮未执行：

```bash
tcb hosting detail -e "$TCB_ENV_ID"
tcb hosting deploy ./build/cloudbase --verify --safe -e "$TCB_ENV_ID"
```

不使用 `--prune` 清理远端。正式域名需要检查备案及 HTTPS。Netlify `_headers` 不会自动成为 CloudBase 响应头；在目标平台另核对 `X-Robots-Tag: noindex, nofollow`、`X-Content-Type-Options: nosniff` 和内容类型。HTML 已有 noindex 元信息，但这不是访问控制。不得将需要私密访问的内容改为公开。

## 下一工作包

1. 核对图像许可，从已具备明确可复用来源的作品开始迁移；保留来源页与权利信息。
2. 在原站交付备份入口后，验证一组收藏/笔记导出并导入新域名；有冲突保留当前笔记，用户原备份文件留作对照。
3. 完成腾讯云登录、账号与环境核对，提交真实首付款、续费与备案条件；不在公开仓库存放实名材料或账单。
4. 发布到腾讯云测试目标并验证文件一致性；暂不切正式域名。
5. 国内电信、移动、联通及微信内测试页面、图片、搜索、详情、收藏、笔记、刷新与手机布局，记录日期/网络/结果；没有证据的项目保持待验证。
6. 保留原站和代码版本，验收通过后再切入口；内容持续任务随后改用新发布流程。

## 验证边界

本轮执行的是源码和离线数据验证；未执行真实浏览器交互、国内多运营商测试、ICP备案、腾讯云上传或付款。数据恢复测试覆盖合并、冲突、重复导入、错误格式、恶意属性、写入失败回退及原数据损坏时不覆盖。不得将“准备完成”写成“已迁移上线”。


## 并发内容检查点｜2026-10-31 03:38 Asia/Shanghai

本轮比较迁移分支与最新 main，未直接把旧快照覆盖到 main 或反向重置分支：

- migration/tencent-mainland 当前头：b47b527113890c25cd1d2cb97bd73869419784bd；共同基线：399df0d2601d5575da5004183fc66553679aa54a。
- main 当前头：c9c092bc5065fcde8407647d00c62e59b557fad6，提交说明为 Monet 30 prepared / production verification pending。
- GitHub compare 显示分支已分叉：迁移分支领先6个提交、落后1个提交。差异涉及 impressionism.js、renaissance.js、index.html、两个进度JSON及10张 Monet 图像资产。
- 结论：迁移分支尚未吸收 main 的最新 Monet 内容；本轮不宣称数据已合并或迁移包已更新。合并时需保留迁移适配与 main 的新增画作/资产，再重跑计数、来源/图像审计、个人数据回归和 CloudBase preview/release 检查。
- 验证边界：本轮完成 GitHub 分支/commit 比较；没有国内网络或腾讯云账号会话，未部署、未切域名、未做运营商/微信访问验收。

下一步：先以当前 main 和迁移分支为双端输入，在本地重建可比较工作树；逐文件合并新增作品和页面适配后，生成新的 migration 分支提交与审计产物。不能只更新本说明而把合并记作完成。


## 并发内容与合并检查点｜2026-10-31 04:43 Asia/Shanghai

- 已重新比较最新分支：migration/tencent-mainland 头为 `13aa70c8e99ac072165e58686544b449aeeb7fef`；当前 main 头为 `e1587c4f34d999f24f556f09b79cb25b87d31b21`（Van Gogh 内容提交记录）。共同基线仍为 `399df0d2601d5575da5004183fc66553679aa54a`；分支已分叉，migration 比 main 领先 10 个提交，落后 2 个提交。
- main 新增/更新的并发内容包括 abstract.js、modern.js、gallery queue、Hilma af Klint 与 Vincent van Gogh 进度，以及 Monet 图像；共享修改文件包括 index.html、impressionism.js、renaissance.js 和相应进度 JSON。旧审计仍是 9 位艺术家/324 条作品，不能代表最新 main 的覆盖量。
- 已建立 PR [#2：Merge latest gallery content into mainland migration](https://github.com/EnsobyShuffle/artgallerybyenso/pull/2)，目标仅为迁移工作分支，基于上述两端 SHA。GitHub 当前回报 `mergeable=false`，PR 未合并；不把新增内容记作已同步，也未更改 main、Netlify 生产站或正式入口。
- 阻塞原因：文本/数据文件有重叠修改，需逐文件保留大陆迁移适配与内容更新后再合并；旧本地检查产物不是最新 Git 工作树，不能拿它覆盖远端。腾讯云控制台仍需Henry正常登录以核实真实环境、域名、备案与额度。

下一步：针对 PR #2 的共享文件做三方差异核对并解决冲突，在 migration/tencent-mainland 上完成合并后重新生成艺术家/作品和外链资源审计，运行个人数据回归、预览包与 release 阻断检查；国内网络验收继续待登录与测试条件。

## 并发内容跟进｜2026-10-31 05:35 Asia/Shanghai

- 重新读取 PR #2 与最新 compare：migration 分支检查点头为 `5a1a8af9f99ed3ffe9a2287c6765b8d2b145a912`，main 目前推进到 `f1470b5d2b1576a3a061165ed4252e0c2ae93800`；分叉为 migration 领先12、落后3，PR 仍 open/draft 且 `mergeable=false`。未合并。
- 最新 main 的印象派进度文件记录 Monet 共35件核验记录，其中20件已发布、15件待发布；本批新增图中仍有远程 Wikimedia Commons 地址，未全部自托管。不得把35件写成国内发布完成。
- 最新 main 的文艺复兴进度记录8个核验作品单元、8件配有图像解读、3件线上已核验；新增件的图片许可/发布和线上展示状态并不相同，当前迁移包不可沿用旧计数。
- PR共享文件补丁显示冲突/并发范围含 `index.html`、`impressionism.js`、`renaissance.js` 和两份进度 JSON。要保留 main 的艺术内容与逐件状态，同时保留迁移适配；完成逐文件三方合并后才可重建CloudBase包。此次 Sites 工作目录另完成 `node --check dist/app.js`、`git diff --check`，Shuffle源码当前为V5提交且工作区干净。

下一步：先解决PR #2共享文件冲突；合并后按最新源重新计算作品/已发布/待发布、图片本地化与权利状态，重跑离线迁移检查。腾讯云登录、真实资源和国内运营商/微信验收仍待Henry登录及测试环境。

## 并发内容跟进｜2026-10-31 06:40 Asia/Shanghai

- 重新读取迁移检查说明、PR #2、最新 compare 与 main 上的研究进度文件。迁移分支检查点提交为 `13aa70c8e99ac072165e58686544b449aeeb7fef`，最新 main 为 `dd4829cbbf2b3871414a8c6ad9cf57d8fc5ea60b`，共同基线为 `399df0d2601d5575da5004183fc66553679aa54a`；compare 显示迁移分支领先4、落后14。PR #2 仍 open/draft、`mergeable=false`，未合并。
- main 的并发研究记录已经变化：Monet 35条核验/20条发布/15条待发布；Renaissance 13个作品单元已核验并配有图像解读、3个线上核验；Hilma af Klint 10个候选中5件已核验并提交、线上0；Van Gogh 6件已核验、配图并提交、线上0。以上是 main 分支记录，不等于迁移分支已同步，也不等于大陆线上发布。
- 本次确认的迁移工作包仍包含共享页面与研究数据文件；PR文件表列有 `index.html`、`impressionism.js`、`renaissance.js`、`modern.js`、`abstract.js`、gallery queue及多份进度JSON。当前PR还纳入10张Monet图像。先逐文件比较两端，合并时保留新增作品、来源与迁移适配，不能用旧审计快照覆盖main。
- 当前实际推进：更新本检查点以反映最新分支差异和有效计数；未改动main、Netlify生产站、艺术内容文件或正式入口。尚未完成冲突解决、重算外链/图像许可审计与新迁移包。
- 下一步：在迁移分支建立双端工作树，按共享文件逐项解冲突并补齐Monet/Hilma/Van Gogh/Renaissance新内容；重跑数据/资源盘点、个人数据回归及CloudBase预览/发布阻断检查。腾讯云资源和国内运营商/微信验收仍需账号及国内测试条件。
