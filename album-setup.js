(() => {
  const setup = document.getElementById('album-setup');
  const input = document.getElementById('photo-files');
  const list = document.getElementById('photo-list');
  const status = document.getElementById('photo-status');
  const start = document.getElementById('start-photos');
  const demo = document.getElementById('start-demo');
  const photos = [];
  let busy = false;
  function controls() {
    input.disabled = demo.disabled = busy;
    start.disabled = busy || !photos.length;
    list.querySelectorAll('button').forEach(b => b.disabled = busy || b.dataset.edge === 'true');
  }
  function render() {
    list.replaceChildren();
    photos.forEach((photo, index) => {
      const row = document.createElement('li');
      const img = document.createElement('img'); img.src = photo.url; img.alt = '';
      const name = document.createElement('span'); name.textContent = (index+1) + '. ' + photo.name;
      row.append(img, name);
      for (const [label, delta] of [['上移',-1],['下移',1],['移除',0]]) {
        const b = document.createElement('button'); b.textContent = label;
        b.setAttribute('aria-label', label + ' ' + photo.name);
        b.dataset.edge = String(delta !== 0 && (index+delta < 0 || index+delta >= photos.length));
        b.onclick = () => {
          if (busy) return;
          if (!delta) { URL.revokeObjectURL(photo.url); photos.splice(index,1); }
          else [photos[index],photos[index+delta]] = [photos[index+delta],photos[index]];
          render();
          status.textContent = '已選 ' + photos.length + ' 張。可用上移／下移調整次序。';
        };
        row.append(b);
      }
      list.append(row);
    }); controls();
  }
  input.onchange = async () => {
    busy = true; controls();
    const errors = [];
    for (const file of input.files) {
      if (photos.length >= 30) { errors.push('最多可選 30 張。'); break; }
      let source;
      try {
        if (!/\.(jpe?g|png)$/i.test(file.name) || file.size > 50*1024*1024) throw new Error('請用 50MB 以下的 JPG／PNG');
        source = URL.createObjectURL(file);
        const img = new Image(); img.src = source; await img.decode();
        if (Math.abs(img.naturalWidth / img.naturalHeight - 2) > .05) throw new Error('需要 2:1 全景相片');
        const width = Math.min(4096,img.naturalWidth), height = Math.round(width*img.naturalHeight/img.naturalWidth);
        if (photos.reduce((sum,p)=>sum+p.pixels,0)+width*height > 64*1024*1024) throw new Error('相簿已達此 Demo 的圖片容量，請先移除部分相片');
        const canvas = document.createElement('canvas'); canvas.width=width; canvas.height=height;
        canvas.getContext('2d').drawImage(img,0,0,width,height);
        const blob = await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.92));
        if (!blob) throw new Error('無法處理圖片');
        photos.push({name:file.name,url:URL.createObjectURL(blob),pixels:width*height});
        canvas.width=canvas.height=1;
      } catch(e) { errors.push(file.name + '：' + e.message); }
      finally { if(source) URL.revokeObjectURL(source); }
    }
    input.value=''; busy=false; render();
    status.textContent = '已選 ' + photos.length + ' 張。' + (errors.length ? errors.join('；') : '可用上移／下移調整次序。');
  };
  function enter(custom) {
    busy=true; controls(); status.textContent='正在載入播放器及相片，請稍候…';
    startUnity(custom ? photos.map(({name,url})=>({name,url})) : null);
  }
  start.onclick=()=>enter(true); demo.onclick=()=>enter(false);
  window.addEventListener('album-import-result', e => {
    if (e.detail) { busy=false; controls(); status.textContent=e.detail; return; }
    setup.hidden=true;
    photos.forEach(p=>URL.revokeObjectURL(p.url));
  });
  render();
})();
