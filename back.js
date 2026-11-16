// 도시 안내·주간 날씨 페이지의 '← 도우미로' 버튼
// 앱에서 들어왔으면 뒤로 가기(휴대폰 뒤로가기와 같음), 링크로 바로 들어왔으면 앱 첫 화면으로 이동
(function () {
  const back = document.getElementById('back');
  if (!back) return;
  back.addEventListener('click', (e) => {
    let fromApp = false;
    try { fromApp = sessionStorage.getItem('returnTab') !== null; } catch {}
    if (fromApp && history.length > 1) { e.preventDefault(); history.back(); return; }
    try { if (back.dataset.tab) sessionStorage.setItem('returnTab', back.dataset.tab); } catch {}
  });
})();
