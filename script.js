// 【固定設定】ご指定のスプレッドシート公開CSVのURL
const SPREADSHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQluhuOEDERWVDgxgvKrY7cPLfIF2Qw38VP9BnjGxl318Sy5Fu2RBUm3lwIFot78JLO7-5TO3b5oy1_/pub?gid=544725873&single=true&output=csv";

let liveData = []; 
let currentBand = 'ALL';
let currentView = 'list'; // 'list', 'calendar', 'detail' の3つの状態を管理
let previousView = 'list'; // 詳細から戻る時用に直前のビューを記憶
let calendar = null;
const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

document.addEventListener('DOMContentLoaded', function() {
    setupHeaderClickEvents();
    fetchSpreadsheetData(); 
});

function fetchSpreadsheetData() {
    const listView = document.getElementById('list-view');
    listView.innerHTML = '<p class="text-center text-muted py-5">最新のスケジュールを読み込み中...</p>';

    fetch(SPREADSHEET_CSV_URL)
        .then(response => {
            if (!response.ok) throw new Error('データの読み込みに失敗しました。');
            return response.text();
        })
        .then(csvText => {
            liveData = parseCSV(csvText); 
            renderView(); 
        })
        .catch(error => {
            console.error(error);
            listView.innerHTML = '<p class="text-center text-danger py-5">スケジュールデータの読み込みに失敗しました。<br>スプレッドシートの「Webに公開」設定を確認してください。</p>';
        });
}

function parseCSV(text) {
    const lines = text.split(/\r\n|\n/);
    if (lines.length === 0 || lines[0] === "") return [];

    const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === "") continue; 
        
        const currentline = lines[i].split(',');
        const obj = {};
        
        headers.forEach((header, index) => {
            let value = currentline[index] ? currentline[index].replace(/^["']|["']$/g, '').trim() : "";
            if (header === "日付" && value.includes("/")) {
                value = value.replace(/\//g, "-");
            }
            obj[header] = value;
        });
        
        // 識別のために各データに一意のID（インデックス）を振る
        obj["id"] = i;
        result.push(obj);
    }
    return result;
}

function setupHeaderClickEvents() {
    const maskLeft = document.getElementById('maskLeft');
    const maskRight = document.getElementById('maskRight');

    if (maskLeft && maskRight) {
        maskLeft.style.pointerEvents = 'auto';
        maskRight.style.pointerEvents = 'auto';
        maskLeft.style.cursor = 'pointer';
        maskRight.style.cursor = 'pointer';

        maskLeft.addEventListener('click', function() {
            if (currentBand === 'DROP DOWN MAMA') {
                switchTabByName('ALL');
            } else {
                switchTabByName('DROP DOWN MAMA');
            }
        });

        maskRight.addEventListener('click', function() {
            if (currentBand === '2120 BLUES BAND') {
                switchTabByName('ALL');
            } else {
                switchTabByName('2120 BLUES BAND');
            }
        });
    }
}

function switchTabByName(bandName) {
    const buttons = document.querySelectorAll('#bandTabs button');
    buttons.forEach(btn => {
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

// 日付から「今月」「来月」「◯月」の見出し文字を判定する関数
function getMonthLabel(dateStr) {
    const targetDate = new Date(dateStr);
    const today = new Date();
    
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // ヶ月の差分を計算
    const monthDiff = (targetYear - currentYear) * 12 + (targetMonth - currentMonth);

    if (monthDiff === 0) return "今月";
    if (monthDiff === 1) return "来月";
    return `${targetMonth + 1}月`;
}

function renderView() {
    if (currentView === 'detail') return; // 詳細表示中は描画をスキップ

    const todayStr = new Date().toISOString().split('T')[0];
    let upcomingData = liveData.filter(item => item["日付"] && item["日付"] >= todayStr);

    const filteredData = (currentBand === 'ALL') ? upcomingData : upcomingData.filter(item => item["バンド名"] === currentBand);
    filteredData.sort((a, b) => new Date(a["日付"]) - new Date(b["日付"]));

    // マスクレイヤー制御
    const maskLeft = document.getElementById('maskLeft');
    const maskRight = document.getElementById('maskRight');
    if (currentBand === 'DROP DOWN MAMA') {
        maskLeft.style.opacity = '0';   
        maskRight.style.opacity = '0.7'; 
    } else if (currentBand === '2120 BLUES BAND') {
        maskLeft.style.opacity = '0.7';  
        maskRight.style.opacity = '0';  
    } else {
        maskLeft.style.opacity = '0';   
        maskRight.style.opacity = '0';
    }

    const countText = `これから開催予定のライブ：${filteredData.length} 件`;
    document.getElementById('live-count-list').innerText = countText;
    document.getElementById('live-count-calendar').innerText = countText;

    const listView = document.getElementById('list-view');
    listView.innerHTML = '';

    if (filteredData.length === 0) {
        listView.innerHTML = '<p class="text-center text-muted py-5">これから開催予定のライブはありません。</p>';
    } else {
        let lastMonthLabel = ''; // 直前に描画した月のラベルを記憶

        filteredData.forEach(item => {
            const dateObj = new Date(item["日付"]);
            const dayOfWeek = weekDays[dateObj.getDay()];
            
            // 【新機能】月が変わったら見出しを挿入
            const currentMonthLabel = getMonthLabel(item["日付"]);
            if (currentMonthLabel !== lastMonthLabel) {
                listView.innerHTML += `
                    <div class="col-12 mt-3 mb-2">
                        <h4 class="border-start border-4 border-primary ps-2 bg-light py-1 fw-bold text-dark month-header">${currentMonthLabel}</h4>
                    </div>
                `;
                lastMonthLabel = currentMonthLabel;
            }

            const venueDisplay = `<span class="fw-bold">${item["会場名"]}</span>`;
            const noteDisplay = item["備考"] ? `<div class="text-muted small mt-2">ℹ️ ${item["備考"]}</div>` : '';
            
            let flyerDisplay = '';
            if (item["フライヤー"] && item["フライヤー"].trim().startsWith('http')) {
                flyerDisplay = `
                    <div class="mt-3 text-center">
                        <img src="${item["フライヤー"].trim()}" alt="フライヤー" class="img-fluid rounded shadow-sm" style="max-height: 200px; object-fit: contain;">
                    </div>
                `;
            }
            
            const badgeClass = getBandColorClass(item["バンド名"]);

            // カード全体をクリックできるように変更 (onclickで詳細表示へ)
            listView.innerHTML += `
                <div class="col-12 col-md-12 mb-2" onclick="showDetailView(${item.id})" style="cursor: pointer;">
                    <div class="card shadow-sm live-card h-100 hover-shadow">
                        <div class="card-body">
                            <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-1 gap-md-2 mb-1">
                                <h6 class="card-title text-primary fw-bold m-0">${item["日付"]} (${dayOfWeek})</h6>
                                <div>
                                    <span class="badge ${badgeClass}">${item["バンド名"]}</span>
                                </div>
                            </div>
                            <p class="card-text text-dark mb-1">
                                ${venueDisplay}
                                <span class="loc-break text-muted style-small">(${item["エリア"]})</span>
                            </p>
                            <p class="card-text text-dark mb-0">⏰ ${item["時間帯"]}</p>
                            ${noteDisplay}
                            ${flyerDisplay}
                        </div>
                    </div>
                </div>
            `;
        });
    }

    initCalendar(filteredData);
}

function updateCalendarTitleWithCount() {
    if (!calendar) return;

    const currentPeriod = calendar.getDate(); 
    const currentYear = currentPeriod.getFullYear();
    const currentMonth = currentPeriod.getMonth(); 

    const events = calendar.getEvents();
    const monthCount = events.filter(event => {
        const eventDate = event.start;
        return eventDate.getFullYear() === currentYear && eventDate.getMonth() === currentMonth;
    }).length;

    const titleEl = document.querySelector('.fc .fc-toolbar-title');
    if (titleEl) {
        const correctTitle = `${currentYear}年${currentMonth + 1}月`;
        titleEl.innerText = `${correctTitle} (${monthCount}件)`;
    }
}

function initCalendar(data) {
    const calendarEl = document.getElementById('calendar');
    
    const calendarEvents = data.map(item => ({
        id: item.id, // IDをカレンダーのイベントにも紐付ける
        title: `${item["バンド名"]} @${item["会場名"]}`,
        start: item["日付"],
        backgroundColor: getBandHexColor(item["バンド名"]), 
        borderColor: 'transparent'
    }));

    if (calendar) { calendar.destroy(); }
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        initialDate: new Date(),
        locale: 'ja',
        dayCellContent: function(e) {
            return e.dayNumberText.replace('日', '');
        },
        events: calendarEvents,
        headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
        height: 'auto',
        // 【重要】カレンダーのイベントクリック時に詳細ビューを呼び出す
        eventClick: function(info) {
            info.jsEvent.preventDefault(); // 404への遷移を完全にブロック
            showDetailView(info.event.id);
        },
        datesSet: function() {
            setTimeout(updateCalendarTitleWithCount, 10); 
        }
    });
    if (currentView === 'calendar') { 
        calendar.render(); 
        setTimeout(updateCalendarTitleWithCount, 10);
    }
}

// 【新機能】タップされたライブの詳細情報を1枚絵で綺麗に表示する関数
function showDetailView(id) {
    const item = liveData.find(live => live.id == id);
    if (!item) return;

    // 直前の状態（リストかカレンダーか）を記憶しておく
    if (currentView !== 'detail') {
        previousView = currentView;
    }
    currentView = 'detail';

    // 表示エリアのコントロール
    document.getElementById('list-view-container').classList.add('d-none');
    document.getElementById('calendar-view').classList.add('d-none');
    document.getElementById('detail-view').classList.remove('d-none');

    const dateObj = new Date(item["日付"]);
    const dayOfWeek = weekDays[dateObj.getDay()];
    const badgeClass = getBandColorClass(item["バンド名"]);
    
    const venueDisplay = item["会場URL"] ? `<a href="${item["会場URL"]}" target="_blank" class="btn btn-primary btn-sm mt-2">会場公式サイトを開く 🔗</a>` : '';
    const noteDisplay = item["備考"] ? `<div class="alert alert-secondary mt-3"><strong>ℹ️ 備考・詳細情報</strong><br>${item["備考"]}</div>` : '';
    
    let flyerDisplay = '';
    if (item["フライヤー"] && item["フライヤー"].trim().startsWith('http')) {
        flyerDisplay = `
            <div class="mt-4 text-center">
                <img src="${item["フライヤー"].trim()}" alt="フライヤー" class="img-fluid rounded shadow animate-fade-in" style="max-height: 500px; object-fit: contain;">
            </div>
        `;
    }

    document.getElementById('detail-content').innerHTML = `
        <div class="card shadow border-0 mt-2">
            <div class="card-body p-4">
                <span class="badge ${badgeClass} mb-2 fs-6">${item["バンド名"]}</span>
                <h2 class="text-primary fw-bold mb-3">${item["日付"]} (${dayOfWeek})</h2>
                
                <h4 class="fw-bold text-dark mb-1">📍 ${item["会場名"]}</h4>
                <p class="text-muted mb-3">（${item["エリア"]}）</p>
                
                <h5 class="text-dark mb-3">⏰ 時間帯: <strong>${item["時間帯"]}</strong></h5>
                
                ${venueDisplay}
                ${noteDisplay}
                ${flyerDisplay}
            </div>
        </div>
    `;
    
    // スクロールを最上部に戻す
    window.scrollTo(0, 0);
}

// 【新機能】詳細画面から元の表示に戻る関数
function closeDetailView() {
    currentView = previousView;
    document.getElementById('detail-view').classList.add('d-none');
    setView(currentView);
}

function switchTab(bandName) {
    currentBand = bandName;
    const buttons = document.querySelectorAll('#bandTabs button');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // 詳細表示中にタブが押されたら、詳細を閉じて一覧に戻す
    if (currentView === 'detail') {
        document.getElementById('detail-view').classList.add('d-none');
        currentView = previousView;
    }
    renderView();
}

function setView(viewType) {
    currentView = viewType;
    const listViewContainer = document.getElementById('list-view-container');
    const calendarViewEl = document.getElementById('calendar-view');
    const detailViewEl = document.getElementById('detail-view');
    const btnList = document.getElementById('btn-list');
    const btnCal = document.getElementById('btn-cal');

    if (viewType === 'list') {
        listViewContainer.classList.remove('d-none');
        calendarViewEl.classList.add('d-none');
        detailViewEl.classList.add('d-none');
        btnList.classList.add('active');
        btnCal.classList.remove('active');
        renderView();
    } else if (viewType === 'calendar') {
        listViewContainer.classList.add('d-none');
        calendarViewEl.classList.remove('d-none');
        detailViewEl.classList.add('d-none');
        btnList.classList.remove('active');
        btnCal.classList.add('active');
        if (calendar) { 
            calendar.render(); 
            setTimeout(updateCalendarTitleWithCount, 10);
        }
    }
}
