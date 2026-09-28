// APK 内保存：写入缓存 → 调出系统分享面板（存相册 / 发微信 / 存文件）
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const b2s = blob => new Promise((ok, err) => {
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
          path: it.name, data: await b2s(blob), directory: Directory.Cache,
        });
        files.push(uri);
      }
      await Share.share({ title: '保存成片', files });
    }
  : null;

if (Capacitor.isNativePlatform()) {
  const btn = document.getElementById('download-btn');
  if (btn) btn.textContent = '保存成片';
}
