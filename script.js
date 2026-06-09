const liveData = [
  { "date": "2026-06-06", "band": "DROP DOWN MAMA", "venue": "戸塚ベイブルース", "location": "神奈川県横浜市", "time": "昼・午後", "note": "", "url": "", "flyer": "" },
  { "date": "2026-06-27", "band": "DROP DOWN MAMA", "venue": "イセヤセラヴィ", "location": "神奈川県横浜市", "time": "昼・午後", "note": "", "url": "", "flyer": "" },
  { "date": "2026-06-28", "band": "DROP DOWN MAMA", "venue": "本牧ゴールデンカップ", "location": "神奈川県横浜市", "time": "午後・夕方", "note": "", "url": "", "flyer": "" },
  { "date": "2026-07-05", "band": "スズナPA", "venue": "kt.Bears", "location": "神奈川県横浜市", "time": "午後", "note": "ミュージックバー", "url": "", "flyer": "" },
  { "date": "2026-07-11", "band": "DROP DOWN MAMA", "venue": "ミッシェル", "location": "神奈川県秦野市", "time": "夜", "note": "ライブレストラン", "url": "", "flyer": "" },
  { "date": "2026-07-12", "band": "DROP DOWN MAMA", "venue": "綱島フライドポテト", "location": "神奈川県横浜市", "time": "夕方・夜", "note": "1ドリンク付1100円", "url": "", "flyer": "" },
  { "date": "2026-07-18", "band": "2120 BLUES BAND", "venue": "武蔵小山cool smile66", "location": "東京都品川区", "time": "夕方・夜", "note": "ライブバー", "url": "", "flyer": "" },
  { "date": "2026-08-15", "band": "DROP DOWN MAMA", "venue": "イセヤセラヴィ", "location": "神奈川県横浜市", "time": "夜", "note": "", "url": "", "flyer": "" },
  { "date": "2026-09-05", "band": "2120 BLUES BAND", "venue": "y's SOUND BASE", "location": "神奈川県厚木市", "time": "昼・午後・夕方・夜", "note": "", "url": "", "flyer": "" },
  { "date": "2026-09-19", "band": "DROP DOWN MAMA", "venue": "大船ハニービー", "location": "神奈川県鎌倉市", "time": "昼・午後", "note": "", "url": "", "flyer": "" },
  { "date": "2026-10-04", "band": "2120 BLUES BAND", "venue": "kt.Bears", "location": "神奈川県横浜市", "time": "昼・午後", "note": "ミュージックバー", "url": "", "flyer": "" },
  { "date": "2026-10-10", "band": "2120 BLUES BAND", "venue": "Ｈｅｙ−ＪＯＥ", "location": "神奈川県横浜市", "time": "昼・午後", "note": "Live House", "url": "", "flyer": "" },
  { "date": "2026-10-11", "band": "2120 BLUES BAND", "venue": "kt.Bears", "location": "神奈川県横浜市", "time": "昼・午後", "note": "横濱ジャズプロムナード", "url": "", "flyer": "" },
  { "date": "2026-10-24", "band": "DROP DOWN MAMA", "venue": "渋谷nob", "location": "東京都渋谷区", "time": "昼・午後", "note": "", "url": "", "flyer": "" },
  { "date": "2026-11-03", "band": "2120 BLUES BAND", "venue": "赤坂エルカミーノ", "location": "東京都港区", "time": "昼・午後", "note": "", "url": "", "flyer": "" }
];

let currentBand = 'ALL';
let currentView = 'list';
let calendar = null;
const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

document.addEventListener('DOMContentLoaded', function() {
    renderView();
});

function renderView() {
    // 【仕様①：終わったライブの自動非表示】今日以降のデータのみに絞り込む
    const todayStr = new Date().toISOString().split('T')[0]; // "2026-06-09" 形式を取得
    let upcomingData = liveData.filter(item => item.date >= todayStr);

    // バンド名での絞り込み
    const filteredData = (currentBand === 'ALL') ? upcomingData : upcomingData.filter(item => item.band === currentBand);
    filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 【仕様②：看板画像のグレーアウト連動】
    const maskLeft = document.getElementById('maskLeft');
    const maskRight = document.getElementById('maskRight');
    
    if (currentBand === 'DROP DOWN MAMA') {
        maskLeft.style.opacity = '0';    // 自分はそのまま
        maskRight.style.opacity = '1';   // 相方（2120）をグレーアウト
    } else if (currentBand === '2120 BLUES BAND') {
        maskLeft.style.opacity = '1';    // 相方（MAMA）をグレーアウト
        maskRight.style.opacity = '0';   // 自分はそのまま
    } else {
        // 総合スケジュール、またはスズナPAの時は両方100%表示
        maskLeft.style.opacity = '0';
        maskRight.style.opacity = '0';
    }

    // リスト表示の生成
    const listView = document.getElementById('list-view');
    listView.innerHTML = '';

    if (filteredData.length === 0) {
        listView.innerHTML = '<p class="text-center text-muted py-5">これから開催予定のライブはありません。</p>';
    } else {
        filteredData.forEach(item => {
            const dateObj = new Date(item.date);
            const dayOfWeek = weekDays[dateObj.getDay()];
            const venueDisplay = item.url ? `<a href="${item.url}" target="_blank" class="text-decoration-none fw-bold text-dark">${item.venue} 🔗</a>` : `<span class="fw-bold">${item.venue}</span>`;
            const noteDisplay = item.note ? `<div class="text-muted small">ℹ️ ${item.note}</div>` : '';

            listView.innerHTML += `
                <div class="col-md-8 mb-3">
                    <div class="card shadow-sm live-card">
                        <div class="card-body">
                            <h5 class="card-title mb-1 text-primary fw-bold">${item.date} (${dayOfWeek})</h5>
                            <span class="badge bg-secondary mb-2">${item.band}</span>
                            <p class="card-text mb-1">${venueDisplay} <span class="text-muted small">(${item.location})</span></p>
                            <p class="card-text mb-1 text-dark">⏰ ${item.time}</p>
                            ${noteDisplay}
                        </div>
                    </div>
                </div>
            `;
        });
    }

    initCalendar(filteredData);
}

function initCalendar(data) {
    const calendarEl = document.getElementById('calendar');
    const calendarEvents = data.map(item => ({
        title: `${item.band} @${item.venue}`,
        start: item.date,
        url: item.url || null,
        backgroundColor: item.band === 'DROP DOWN MAMA' ? '#1a365d' : (item.band === '2120 BLUES BAND' ? '#b91c1c' : '#4a5568'),
        borderColor: 'transparent'
    }));

    if (calendar) { calendar.destroy(); }
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ja',
        events: calendarEvents,
        headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
        height: 'auto'
    });
    if (currentView === 'calendar') { calendar.render(); }
}

function switchTab(bandName) {
    currentBand = bandName;
    const buttons = document.querySelectorAll('#bandTabs button');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderView();
}

function setView(viewType) {
    currentView = viewType;
    const listViewEl = document.getElementById('list-view');
    const calendarViewEl = document.getElementById('calendar-view');
    const btnList = document.getElementById('btn-list');
    const btnCal = document.getElementById('btn-cal');

    if (viewType === 'list') {
        listViewEl.classList.remove('d-none');
        calendarViewEl.classList.add('d-none');
        btnList.classList.add('active');
        btnCal.classList.remove('active');
    } else {
        listViewEl.classList.add('d-none');
        calendarViewEl.classList.remove('d-none');
        btnList.classList.remove('active');
        btnCal.classList.add('active');
        if (calendar) { calendar.render(); }
    }
}
