// APK 内保存成片到系统相册。
// 为什么必须走这个插件：相册只认 MediaStore 登记过的文件。把成片放应用私有缓存
// 再交给分享面板，系统不会给出"保存到相册"的入口；Capacitor 官方 Filesystem 也写不了公共
// 相册目录（ExternalStorage 仅 Android 9 及以下，Documents 在 Android 11+ 只限本应用的文件）。
// media 插件把文件写进 Pictures 下本应用的相册目录并 scanPhoto() 登记，相册即可见。
// 该插件保存到自己的相册不需要任何存储权限。普通浏览器里本模块静默失败，网页版仍走 a.click() 下载。
import { Capacitor } from '@capacitor/core';
import { Media } from '@capacitor-community/media';

const ALBUM = 'Root';   // 相册名，固定即可，不放进配置

// 原生端读不到 blob: 协议，转成 data URL 传过去（插件原生实现专门支持 data: 前缀）
const blob2dataUrl = blob => new Promise((ok, err) => {
  const r = new FileReader();
  r.onloadend = () => ok(String(r.result));
  r.onerror = err;
  r.readAsDataURL(blob);
});

// 相册必须先存在；已存在时 createAlbum 会 reject，忽略即可
async function ensureAlbum() {
  try { await Media.createAlbum({ name: ALBUM }); } catch (e) { /* 已存在 */ }
  const { albums } = await Media.getAlbums();
  const found = albums.find(a => a.name === ALBUM);
  if (!found) throw new Error('album-not-found:' + albums.map(a => a.name).join(','));
  return found.identifier;
}

async function saveAll(items) {
  const albumIdentifier = await ensureAlbum();
  let ok = 0;
  for (const it of items) {
    try {
      const blob = await fetch(it.url).then(r => r.blob());
      await Media.savePhoto({ path: await blob2dataUrl(blob), albumIdentifier });
      ok++;
    } catch (e) { /* 单张失败不影响其余 */ }
  }
  return ok;
}

// 返回 true 表示已在原生侧处理完，调用方不必再走网页下载
window.__nativeSave = Capacitor.isNativePlatform()
  ? async items => (items.length ? (await saveAll(items), true) : false)
  : null;

if (Capacitor.isNativePlatform()) {
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('download-btn');
    if (btn) btn.textContent = '保存到相册';
  });
}
