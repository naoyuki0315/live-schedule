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

// 【バグ修正】曜日配列のタイポを修正して綺麗な「土」に直しました
const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

document.addEventListener('DOMContentLoaded', function() {
    // 【新機能】画像タップでスケジュール切り替え
    setupHeaderClickEvents();
    renderView();
});

// 画像の左右タップでタブを切り替える設定
function setupHeaderClickEvents() {
    const maskLeft = document.getElementById('maskLeft');
    const maskRight = document.getElementById('maskRight');

    if (maskLeft && maskRight) {
        // グレーアウト用の設定をJSからクリックできるように邪魔しない設定を解除
        maskLeft.style.pointerEvents = 'auto';
        maskRight.style.pointerEvents = 'auto';
        maskLeft.style.cursor = 'pointer';
        maskRight.style.cursor = 'pointer';

        // 左半分（DROP DOWN MAMA側）がタップされたら
        maskLeft.addEventListener('click', function() {
            // もしすでにMAMAが選ばれているなら「総合」に戻し、そうでないならMAMAに切り替える
            if (currentBand === 'DROP DOWN MAMA') {
                switchTabByName('ALL');
            } else {
                switchTabByName('DROP DOWN MAMA');
            }
        });

        // 右半分（2120側）がタップされたら
        maskRight.addEventListener('click', function() {
            // もしすでに2120が選ばれているなら「総合」に戻し、そうでないなら2120に切り替える
            if (currentBand === '2120 BLUES BAND') {
                switchTabByName('ALL');
            } else {
                switchTabByName('2120 BLUES BAND');
            }
        });
    }
}

// 名前から自動的にタブのボタンを探して切り替える関数
function switchTabByName(bandName) {
    const buttons = document.querySelectorAll('#bandTabs button');
    buttons.forEach(btn => {
        // ボタンの文字にバンド名が含まれているかチェック
        if (bandName === 'ALL' && btn.innerText.includes('総合')) {
            btn.click();
        } else if (btn.innerText.includes(bandName)) {
            btn.click();
        }
    });
}

function getBandColorClass(bandName) {
    if (bandName === 'DROP DOWN MAMA') return 'bg-dropdown-mama';
    if (bandName === '2120 BLUES BAND') return 'bg-2120-blues';
    if (bandName === 'スズナPA') return 'bg-suzuna-pa';
    return 'bg-default-band';
}

function getBandHexColor(bandName) {
    if (bandName === 'DROP DOWN MAMA') return '#1a365d'; 
    if (bandName === '2120 BLUES BAND') return '#800020'; 
    if (bandName === 'スズナPA') return '#00ced1'; 
    return '#4a5568';
}

function renderView() {
    const todayStr = new Date().toISOString().split('T')[0];
    let upcomingData = liveData.filter(item => item.date >= todayStr);

    const filteredData = (currentBand === 'ALL') ? upcomingData : upcomingData.filter(item => item.band === currentBand);
    filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));

    const maskLeft = document.getElementById('maskLeft');
    const maskRight = document.getElementById('maskRight');
    
    // 画像タップの挙動と矛盾しないようにマスクの透明度を調整
    if (currentBand === 'DROP DOWN MAMA') {
        maskLeft.style.opacity = '0';   // MAMA側は明るく
        maskRight.style.opacity = '0.7'; // 2120側はグレーアウト
    } else if (currentBand === '2120 BLUES BAND') {
        maskLeft.style.opacity = '0.7';  // MAMA側はグレーアウト
        maskRight.style.opacity = '0';  // 2120側は明るく
    } else {
        maskLeft.style.opacity = '0';   // 総合の時は両方100%明るい
        maskRight.style.opacity = '0';
    }

    const listView = document.getElementById('list-view');
    listView.innerHTML = '';

    if (filteredData.length === 0) {
        listView.innerHTML = '<p class="text-center text-muted py-5">これから開催予定のライブはありません。</p>';
    } else {
        filteredData.forEach(item => {
            const dateObj = new Date(item.date);
            const dayOfWeek = weekDays[dateObj.getDay()];
            const venueDisplay = item.url ? `<a href="${item.url}" target="_blank" class="text-decoration-none fw-bold text-dark">${item.venue} 🔗</a>` : `<span class="fw-bold">${item.venue}</span>`;
            const noteDisplay = item.note ? `<span class="text-muted small d-block">ℹ️ ${item.note}</span>` : '';
            
            const badgeClass = getBandColorClass(item.band);

            listView.innerHTML += `
                <div class="col-12 col-md-12 mb-2">
                    <div class="card shadow-sm live-card">
                        <div class="card-body">
                            <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-1 gap-md-2 mb-1">
                                <h6 class="card-title text-primary fw-bold m-0">${item.date} (${dayOfWeek})</h6>
                                <div>
                                    <span class="badge ${badgeClass}">${item.band}</span>
                                </div>
                            </div>
                            <p class="card-text text-dark">
                                ${venueDisplay}
                                <span class="loc-break text-muted style-small">(${item.location})</span>
                            </p>
                            <p class="card-text text-dark">⏰ ${item.time}</p>
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
        backgroundColor: getBandHexColor(item.band), 
        borderColor: 'transparent'
    }));

    if (calendar) { calendar.destroy(); }
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ja',
        dayCellContent: function(e) {
            return e.dayNumberText.replace('日', '');
        },
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
    // 引数イベントではなく現在のアクティブ状態を保つためにボタン側で動的処理
    renderView();
}
