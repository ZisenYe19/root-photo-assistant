// APK 内导出成片：写入应用缓存 → 调出系统分享面板（存相册 / 发微信 / 存文件）。
// 注意：这是"分享导出"，不是静默存入相册——所以在安卓里把按钮文案改成一致的叫法。
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const blob2base64 = blob => new Promise((ok, err) => {
  const r = new FileReader();
  r.onloadend = () => ok(String(r.result).split(',')[1]);
  r.onerror = err;
  r.readAsDataURL(blob);
});

window.__nativeSave = Capacitor.isNativePlatform()
  ? async items => {
      const files = [];
      for (const it of items) {
        const blob = await fetch(it.url).then(r => r.blob());
        const { uri } = await Filesystem.writeFile({
          path: it.name, data: await blob2base64(blob), directory: Directory.Cache,
        });
        files.push(uri);
      }
      await Share.share({ title: '分享成片', files });
    }
  : null;

if (Capacitor.isNativePlatform()) {
  // 等 DOM 就绪再改文案；入口脚本先于 body 执行，直接取会拿到 undefined
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('download-btn');
    if (btn) btn.textContent = '保存 / 分享成片';
  });
}

