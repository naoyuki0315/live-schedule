const SPREADSHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQluhuOEDERWVDgxgvKrY7cPLfIF2Qw38VP9BnjGxl318Sy5Fu2RBUm3lwIFot78JLO7-5TO3b5oy1_/pub?gid=544725873&single=true&output=csv";

let liveData = []; 
let currentBand = 'ALL';
let currentView = 'list'; 
let previousView = 'list'; 
let calendar = null;
const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

document.addEventListener('DOMContentLoaded', function() {
    setupHeaderClickEvents(); 
    fetchSpreadsheetData(); 
});

// onComplete(success) は更新ボタンの表示を元に戻すためのコールバック（省略可）
function fetchSpreadsheetData(onComplete) {
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
            if (onComplete) onComplete(true);
        })
        .catch(error => {
            console.error(error);
            listView.innerHTML = '<p class="text-center text-danger py-5">データの読み込みに失敗しました。</p>';
            if (onComplete) onComplete(false);
        });
}

// 更新ボタン用：画面を閉じずにその場でスプレッドシートを再取得する
function refreshData() {
    const btn = document.getElementById('btn-refresh');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '🔄 更新中...';
    }
    fetchSpreadsheetData(function(success) {
        if (!btn) return;
        btn.disabled = false;
        btn.innerHTML = success ? '✅ 更新しました' : '⚠️ 失敗しました';
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = '🔄 更新';
        }, 1500);
    });
}

// 【完全版】セル内改行・列ズレを防ぎ、GitHubのURLも確実に画像化するパース処理
function parseCSV(text) {
    let lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        let c = text[i];
        let next = text[i+1];
        if (c === '"') {
            if (inQuotes && next === '"') {
                row[row.length - 1] += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            row.push("");
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
            if (c === '\r' && next === '\n') { i++; }
            lines.push(row);
            row = [""];
        } else {
            row[row.length - 1] += c;
        }
    }
    if (row.length > 1 || row[0] !== "") {
        lines.push(row);
    }
    if (lines.length === 0) return [];

    const headers = lines[0].map(v => v.trim());
    // フライヤー列の位置を「見出し名」から動的に特定する（列の追加・並び替えに強くするため）
    const flyerHeaderIndex = headers.findIndex(h => h.includes("フライヤー"));
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const currentline = lines[i];
        if (currentline.length === 1 && currentline[0] === "") continue;
        
        const obj = {};
        let detectedFlyer = "";

        headers.forEach((header, index) => {
            let value = currentline[index] ? currentline[index].trim() : "";
            if (header === "日付" && value.includes("/")) {
                value = value.replace(/\//g, "-");
            }
            obj[header] = value;
        });

        // ① 見出し名「フライヤー」の列からURLを取得（固定インデックスではなく見出し名で判定）
        if (flyerHeaderIndex !== -1) {
            const flyerValue = currentline[flyerHeaderIndex] ? currentline[flyerHeaderIndex].trim() : "";
            if (flyerValue.startsWith("http")) {
                detectedFlyer = flyerValue;
            }
        }

        // ③ どこかしらの列にGitHubなどの画像URLが紛れ込んでいたら自動で救出
        if (!detectedFlyer) {
            for (let col of currentline) {
                if (col && col.trim().startsWith("http") && (col.includes("raw=true") || col.includes("flyer") || col.includes(".PNG") || col.includes(".png"))) {
                    detectedFlyer = col.trim();
                    break;
                }
            }
        }

        // 🚀【最重要：GitHub画像の表示エラー対策】
        // github.com/～/blob/～ の形式のURLを、確実に画像表示できるraw直リンクURLへ自動強制変換する
        if (detectedFlyer && detectedFlyer.includes("github.com") && detectedFlyer.includes("/blob/")) {
            detectedFlyer = detectedFlyer
                .replace("github.com", "raw.githubusercontent.com")
                .replace("/blob/", "/");
        }
        
        obj["フライヤー"] = detectedFlyer;
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
                switchTab('ALL');
            } else {
                switchTab('DROP DOWN MAMA');
            }
        });

        maskRight.addEventListener('click', function() {
            if (currentBand === '2120 BLUES BAND') {
                switchTab('ALL');
            } else {
                switchTab('2120 BLUES BAND');
            }
        });
    }
}

// 「状態」列が「中止」かどうかを判定する共通関数
function isCancelledItem(item) {
    return (item["状態"] || "").trim() === "中止";
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

function getMonthLabel(dateStr) {
    const targetDate = new Date(dateStr);
    const today = new Date();
    
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const monthDiff = (targetYear - currentYear) * 12 + (targetMonth - currentMonth);

    if (monthDiff === 0) return "今月";
    if (monthDiff === 1) return "来月";
    return `${targetMonth + 1}月`;
}

function renderView() {
    if (currentView === 'detail') return;

    const todayStr = new Date().toISOString().split('T')[0];
    let bandFilteredData = (currentBand === 'ALL') ? liveData : liveData.filter(item => item["バンド名"] === currentBand);

    let upcomingData = bandFilteredData.filter(item => item["日付"] && item["日付"] >= todayStr);
    upcomingData.sort((a, b) => new Date(a["日付"]) - new Date(b["日付"]));

    const maskLeft = document.getElementById('maskLeft');
    const maskRight = document.getElementById('maskRight');
    if (currentBand === 'DROP DOWN MAMA') {
        maskLeft.style.opacity = '0';   
        maskRight.style.opacity = '0.6'; 
    } else if (currentBand === '2120 BLUES BAND') {
        maskLeft.style.opacity = '0.6';  
        maskRight.style.opacity = '0';  
    } else {
        maskLeft.style.opacity = '0';   
        maskRight.style.opacity = '0';
    }

    const countText = `これから開催予定のライブ：${upcomingData.length} 件`;
    document.getElementById('live-count-list').innerText = countText;
    document.getElementById('live-count-calendar').innerText = countText;

    const listView = document.getElementById('list-view');
    listView.innerHTML = '';

    if (upcomingData.length === 0) {
        listView.innerHTML = '<p class="text-center text-muted py-5">これから開催予定のライブはありません。</p>';
    } else {
        let lastMonthLabel = '';

        upcomingData.forEach(item => {
            const dateObj = new Date(item["日付"]);
            const dayOfWeek = weekDays[dateObj.getDay()];
            const isCancelled = isCancelledItem(item);

            const currentMonthLabel = getMonthLabel(item["日付"]);
            if (currentMonthLabel !== lastMonthLabel) {
                listView.innerHTML += `
                    <div class="col-12 mt-4 mb-2 animate-fade-in">
                        <h5 class="border-start border-4 border-primary ps-2 py-1 fw-bold text-secondary bg-white shadow-sm rounded-end">${currentMonthLabel}</h5>
                    </div>
                `;
                lastMonthLabel = currentMonthLabel;
            }

            const hasFlyer = item["フライヤー"] && item["フライヤー"].trim().length > 0;
            const flyerRow = hasFlyer ? `<div class="text-secondary small mt-2 fw-bold">🖼️ フライヤーあり</div>` : '';

            const venueDisplay = `<span class="fw-bold text-dark">${item["会場名"]}</span>`;
            const noteDisplay = item["備考"]
                ? `<div class="${isCancelled ? 'text-danger fw-bold' : 'text-muted'} small mt-2">${isCancelled ? '⚠️' : 'ℹ️'} ${item["備考"]}</div>`
                : '';
            const badgeClass = getBandColorClass(item["バンド名"]);
            const cancelBadge = isCancelled ? `<span class="badge bg-danger ms-1">中止</span>` : '';
            const cardClass = isCancelled ? 'border-start border-4 border-danger' : 'border-0';

            listView.innerHTML += `
                <div class="col-12 mb-2 animate-fade-in" onclick="showDetailView(${item.id})" style="cursor: pointer;">
                    <div class="card shadow-sm live-card ${cardClass}">
                        <div class="card-body py-3">
                            <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-1 gap-md-2 mb-2">
                                <h6 class="text-primary fw-bold m-0">${item["日付"]} (${dayOfWeek})</h6>
                                <span class="badge ${badgeClass}">${item["バンド名"]}</span>
                                ${cancelBadge}
                            </div>
                            <p class="card-text mb-1">
                                ${venueDisplay} <span class="text-muted small">(${item["エリア"]})</span>
                            </p>
                            <p class="card-text text-secondary small mb-0">⏰ ${item["時間帯"]}</p>
                            ${noteDisplay}
                            ${flyerRow}
                        </div>
                    </div>
                </div>
            `;
        });
    }

    initCalendar(bandFilteredData);
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
        titleEl.innerText = `${currentYear}年${currentMonth + 1}月 (${monthCount}件)`;
    }
}

function initCalendar(allBandData) {
    const calendarEl = document.getElementById('calendar');
    
    const calendarEvents = allBandData.map(item => {
        const isCancelled = isCancelledItem(item);
        return {
            id: item.id,
            title: isCancelled
                ? `［中止］${item["バンド名"]} @${item["会場名"]}`
                : `${item["バンド名"]} @${item["会場名"]}`,
            start: item["日付"],
            backgroundColor: isCancelled ? '#A32D2D' : getBandHexColor(item["バンド名"]),
            borderColor: 'transparent'
        };
    });

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
        eventClick: function(info) {
            info.jsEvent.preventDefault(); 
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

// 詳細画面：初期1/8表示 ＆ タップでその場で等倍トグル機能
function showDetailView(id) {
    const item = liveData.find(live => live.id == id);
    if (!item) return;

    if (currentView !== 'detail') {
        previousView = currentView;
    }
    currentView = 'detail';

    document.getElementById('header-container').classList.add('d-none');
    document.getElementById('view-tabs').classList.add('d-none');
    document.getElementById('bandTabs').classList.add('d-none');

    document.getElementById('list-view-container').classList.add('d-none');
    document.getElementById('calendar-view').classList.add('d-none');
    document.getElementById('detail-view').classList.remove('d-none');

    const dateObj = new Date(item["日付"]);
    const dayOfWeek = weekDays[dateObj.getDay()];
    const badgeClass = getBandColorClass(item["バンド名"]);
    const isCancelled = isCancelledItem(item);
    const cancelBadgeDetail = isCancelled ? `<span class="badge bg-danger ms-1">中止</span>` : '';
    
    const venueDisplay = item["会場URL"] ? `<a href="${item["会場URL"]}" target="_blank" class="btn btn-outline-primary btn-sm mt-2 shadow-sm">会場公式サイトを開く 🔗</a>` : '';
    const noteDisplay = item["備考"]
        ? `<div class="alert ${isCancelled ? 'alert-danger' : 'alert-secondary'} mt-3 small"><strong>${isCancelled ? '⚠️ 中止' : 'ℹ️ 備考・詳細'}</strong><br>${item["備考"].replace(/\n/g, '<br>')}</div>`
        : '';
    
    // フライヤー初期は1/8サイズ(max-width:140px)、タップで拡大トグル
    let flyerDisplay = '';
    if (item["フライヤー"] && item["フライヤー"].trim().length > 0) {
        flyerDisplay = `
            <div class="mt-4 border-top pt-3">
                <p class="text-muted small mb-2">🔍 フライヤー（タップで拡大・縮小できます）</p>
                <div class="d-inline-block" onclick="toggleFlyerImage()" style="cursor: pointer; user-select: none;">
                    <img id="flyer-image" src="${item["フライヤー"].trim()}" alt="フライヤー" class="img-fluid rounded shadow-sm" style="max-width: 140px; height: auto; object-fit: contain; border: 1px solid #ddd; transition: max-width 0.25s ease-in-out;">
                </div>
            </div>
        `;
    }

    document.getElementById('detail-content').innerHTML = `
        <div class="card shadow border-0 mt-2">
            <div class="card-body p-4">
                <span class="badge ${badgeClass} mb-2">${item["バンド名"]}</span>
                ${cancelBadgeDetail}
                <h3 class="text-primary fw-bold mb-3">${item["日付"]} (${dayOfWeek})</h3>
                <h5 class="fw-bold text-dark mb-1">📍 会場: ${item["会場名"]}</h5>
                <p class="text-muted small mb-3">（エリア：${item["エリア"]}）</p>
                <h6 class="text-dark mb-3">⏰ 時間帯: <strong>${item["時間帯"]}</strong></h6>
                ${venueDisplay}
                ${noteDisplay}
                ${flyerDisplay}
            </div>
        </div>
    `;
    
    window.scrollTo(0, 0);
}

function toggleFlyerImage() {
    const img = document.getElementById('flyer-image');
    if (img) {
        if (img.style.maxWidth === '140px') {
            img.style.maxWidth = '100%';
            img.style.maxHeight = '550px';
            img.classList.remove('shadow-sm');
            img.classList.add('shadow');
        } else {
            img.style.maxWidth = '140px';
            img.style.maxHeight = 'none';
            img.classList.remove('shadow');
            img.classList.add('shadow-sm');
        }
    }
}

function closeDetailView() {
    currentView = previousView;
    document.getElementById('detail-view').classList.add('d-none');
    setView(currentView);
}

function switchTab(bandName) {
    currentBand = bandName;
    const buttons = document.querySelectorAll('#bandTabs button');
    
    buttons.forEach(btn => {
        if ((bandName === 'ALL' && btn.innerText.includes('総合')) || 
            (bandName !== 'ALL' && btn.innerText.includes(bandName))) {
            btn.classList.add('active'); 
        } else {
            btn.classList.remove('active'); 
        }
    });
    
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

    const headerContainer = document.getElementById('header-container');
    const viewTabs = document.getElementById('view-tabs');
    const bandTabs = document.getElementById('bandTabs');

    if (viewType === 'list') {
        headerContainer.classList.remove('d-none');
        viewTabs.classList.remove('d-none');
        bandTabs.classList.remove('d-none');

        listViewContainer.classList.remove('d-none');
        calendarViewEl.classList.add('d-none');
        detailViewEl.classList.add('d-none');
        btnList.classList.add('active');
        btnCal.classList.remove('active');
        renderView();
    } else if (viewType === 'calendar') {
        headerContainer.classList.remove('d-none');
        viewTabs.classList.remove('d-none');
        bandTabs.classList.remove('d-none');

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
