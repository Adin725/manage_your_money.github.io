document.addEventListener('DOMContentLoaded', () => {
  // logic splash screen
  setTimeout(() => { 
    const splashScreen = document.getElementById('splash-screen');
    
    if (splashScreen) {
        splashScreen.classList.add('fade-out');
    }
    document.getElementById('loading-screen').style.display = 'flex';
    
    setTimeout(() => {
        if (splashScreen) splashScreen.style.display = 'none';
    }, 1000); 

    // sembunyiin loading & cek status login user
    setTimeout(() => {
      document.getElementById('loading-screen').style.display = 'none';
      
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        showWelcomeScreen(currentUser);
      } else {
        showAuthContainer();
      }
    }, 3000); 

  }, 3000); 
  
  // toggle mata password
  const togglePassword = document.getElementById('toggle-password');
  const authPasswordInput = document.getElementById('auth-password');
  if (togglePassword && authPasswordInput) {
    togglePassword.addEventListener('click', () => {
      const type = authPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      authPasswordInput.setAttribute('type', type);
      togglePassword.classList.toggle('fa-eye-slash');
    });
  }

  // handle klik login/register
  const authBtn = document.getElementById('auth-btn');
  if (authBtn) {
    authBtn.addEventListener('click', () => {
      const emailInput = document.getElementById('auth-email');
      const passwordInput = document.getElementById('auth-password');
      if (!emailInput || !passwordInput) return;

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      const users = JSON.parse(localStorage.getItem('users')) || {};

      if (isLogin) {
        // proses login
        if (users[email] && users[email] === password) {
          showLoading('Menyambung...');
          setTimeout(() => {
            localStorage.setItem('currentUser', email);
            showWelcomeScreen(email);
            hideLoading();
          }, 3000);
        } else {
          showNotification('Email atau password salah', 'danger');
        }
      } else {
        // proses register
        if (users[email]) {
          showNotification('Email sudah terdaftar', 'danger');
        } else {
          users[email] = password;
          localStorage.setItem('users', JSON.stringify(users));
          showNotification('Registrasi berhasil! Silakan login.', 'success');
          isLogin = true;
          switchToLoginForm();
        }
      }
    });
  }

  // switch form mode
  const switchToRegister = document.getElementById('switch-to-register');
  if (switchToRegister) {
    switchToRegister.addEventListener('click', (e) => {
      e.preventDefault();
      isLogin = false;
      switchToRegisterForm();
    });
  }

  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'switch-to-login') {
      e.preventDefault();
      isLogin = true;
      switchToLoginForm();
    }
  });

  // tombol tips
  const dailyTipsButton = document.getElementById('daily-tips-button');
  const categoryTipsButton = document.getElementById('category-tips-button');

  if (dailyTipsButton) {
    dailyTipsButton.addEventListener('click', () => {
      showTipsModal("Ketuk titik pada grafik untuk detail harian, atau tombol expand untuk layar penuh.");
    });
  }

  if (categoryTipsButton) {
    categoryTipsButton.addEventListener('click', () => {
      showTipsModal("Tekan diagram untuk komposisi barang, atau tombol expand untuk layar penuh.");
    });
  }
});

// state global
let isLogin = true;

// variabel buat nyimpen instance chart
let dailyExpenseChart;
let categoryExpenseChart;
let categoryDailyExpenseChart;
let historyDailyExpenseChart;
let historyCategoryExpenseChart;

// variabel modal & animasi
let zoomModal;
let zoomChartInstance;
let dailyDetailModal;
let isDailyChartAnimating = false; 
let dailyChartAnimationTimeout; 

// variabel fitur analisis & DOM lainnya
let anomalyChart; 
let predictionChart; 
let allUserExpensesCache = []; 
let analysisDataLoaded = false; 
let infoModalInstance = null;
let budgetAlertShownThisMonth = false;
let budgetModal; 
let pemasukanModal; 
let transferModal; 
let pdfConfigModal; 
let customConfirmModal; 
const EXP_SALDO_DEFAULT_VIEW = 'tunai'; 
let onConfirmCallback = () => {};

// nampilin halaman auth (login/register)
function showAuthContainer() {
  const authContainer = document.getElementById('auth-container');
  if (authContainer) {
      authContainer.style.display = 'block';
      document.body.style.backgroundColor = '#4b0082';
  }
}

function switchToRegisterForm() {
  const authTitle = document.getElementById('auth-title');
  const authBtn = document.getElementById('auth-btn');
  const authSwitchLink = document.getElementById('auth-switch-link');
  if (authTitle && authBtn && authSwitchLink) {
    authTitle.textContent = 'Register';
    authBtn.textContent = 'Register';
    authSwitchLink.innerHTML = 'Sudah punya akun? <a href="#" id="switch-to-login">Login di sini</a>';
  }
}

function switchToLoginForm() {
  const authTitle = document.getElementById('auth-title');
  const authBtn = document.getElementById('auth-btn');
  const authSwitchLink = document.getElementById('auth-switch-link');
  if (authTitle && authBtn && authSwitchLink) {
    authTitle.textContent = 'Log in';
    authBtn.textContent = 'Login';
    authSwitchLink.innerHTML = 'Belum punya akun? <a href="#" id="switch-to-register">Register di sini</a>';
  }
}

// toast notifikasi 
function showNotification(message, type) {
  const notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) return;

  const notification = document.createElement('div');
  notification.classList.add('notification');
  if (type === 'success') {
    notification.style.backgroundColor = '#28a745'; 
  } else if (type === 'danger') {
    notification.style.backgroundColor = '#dc3545'; 
  }
  notification.textContent = message;
  notificationContainer.appendChild(notification);

  // auto hide
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.5s forwards';
    notification.addEventListener('animationend', () => {
      notification.remove();
    });
  }, 3000); 
}

function showLoading(text) {
  const loadingScreen = document.getElementById('loading-screen');
  if (!loadingScreen) return;
  const loadingText = loadingScreen.querySelector('.loading-text');
  if (loadingText) {
      loadingText.textContent = text;
  }
  loadingScreen.style.display = 'flex';
}

function hideLoading() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
      loadingScreen.style.display = 'none';
  }
}

function showApp() {
  const authContainer = document.getElementById('auth-container');
  const appContainer = document.getElementById('app-container');
  if (authContainer) authContainer.style.display = 'none';
  if (appContainer) appContainer.style.display = 'block';
  document.body.style.backgroundColor = '#f4f6f9';
  initializeApp();
}

// inject css dinamis buat benerin styling bawaan yang berantakan
function applyDynamicStyles() {
    const styleId = 'dynamic-mumy-styles';
    const oldStyle = document.getElementById(styleId);
    if (oldStyle) {
        oldStyle.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
        /* konsistensi form input */
        .expense-form #barang,
        .expense-form #amount,
        .category-dropdown > button#kategori-button {
            padding: 12px 16px !important; 
            margin-bottom: 15px !important;
            background-color: #ffffff !important;
            color: #333333 !important;
            border: 1px solid #d1d3e2 !important;
            border-radius: 8px !important;
            font-size: 1rem !important; 
            height: calc(1.5em + 0.75rem + 2px) !important; 
            box-sizing: border-box !important;
        }
        
        .category-dropdown > button#kategori-button {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            text-align: left !important;
            width: 100% !important;
            line-height: 1.5 !important; 
        }

        /* wrapper riwayat */
        div.expenses-list {
            padding: 12px 16px !important; 
            margin-top: 15px !important;
            background-color: #ffffff !important;
            border: 1px solid #d1d3e2 !important; 
            border-radius: 8px !important; 
            text-align: left;
            max-height: 200px; 
            overflow-y: auto; 
        }

        /* ukuran header tanggal di riwayat */
        ul#expenses-ul > li {
            background-color: #f0f0f0 !important; 
            font-weight: 600 !important; 
            padding: 10px 15px !important; 
            margin-bottom: 8px !important;
            border-radius: 8px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
            cursor: pointer; 
        }

        /* icon panah collapse */
        ul#expenses-ul > li i.toggle-category {
            color: #4b0082 !important; 
            transition: transform 0.2s ease;
        }
        
        ul#expenses-ul > li.expanded i.toggle-category {
            transform: rotate(180deg);
        }

        ul#expenses-ul ul li {
            background: #ffffff !important;
            padding: 10px 15px !important; 
            margin-bottom: 5px !important;
            box-shadow: none !important; 
            font-weight: normal !important;
            cursor: default;
        }

        /* fix badge stats biar ga wrap / patah barisnya */
        #daily-stats-container .badge,
        #history-content .badge,
        .category-expense-enhanced .badge {
            max-width: none !important; 
            white-space: nowrap !important; 
            display: inline-block !important;
        }
        #daily-stats-container .list-group-item > div:first-child,
        #history-content .list-group-item > div:first-child,
        .category-expense-enhanced .list-group-item > div:first-child {
            flex-shrink: 1; 
            margin-right: 8px; 
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* rapihin stat list */
        .category-expense-enhanced .statistic,
        #history-content .statistic-container {
            padding: 0 !important; 
            background-color: transparent !important;
            border: none !important;
            text-align: left !important;
            margin-top: 20px !important; 
        }
        
        .category-expense-enhanced .list-group,
        #history-content .list-group {
            border: 1px solid #dee2e6; 
            border-radius: 0.375rem; 
            overflow: hidden; 
        }

        .category-expense-enhanced .list-group-item,
        #history-content .list-group-item {
          border-bottom: 1px solid #eee;
          padding: 0.8rem 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1rem;
          min-height: 50px;
        }
        .category-expense-enhanced .list-group-item:last-child,
        #history-content .list-group-item:last-child {
            border-bottom: none;
        }
        
        .category-expense-enhanced .list-group-item > div:first-child,
        #history-content .list-group-item > div:first-child {
          display: flex;
          align-items: center;
          flex-grow: 1;
          flex-shrink: 1;
          padding-right: 8px;
          text-align: left;
        }

        .category-expense-enhanced .list-group-item > div:first-child i:first-of-type,
        #history-content .list-group-item > div:first-child i:first-of-type {
          width: 16px;
          text-align: center;
          margin-right: 5px;
          font-size: 1em;
          color: #6c757d;
          flex-shrink: 0;
        }

        .category-expense-enhanced .list-group-item > div:last-child,
        #history-content .list-group-item > div:last-child {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        
        .category-expense-enhanced .badge,
        #history-content .badge {
          font-size: 1rem;
          font-weight: 600;
          padding: 0.35em 0.6em;
          text-align: right;
        }

        .category-expense-enhanced i.text-primary, #history-content i.text-primary { color: #4b0082 !important; }
        .category-expense-enhanced i.text-secondary, #history-content i.text-secondary { color: #6c757d !important; }
        .category-expense-enhanced i.text-danger, #history-content i.text-danger { color: #dc3545 !important; }
        .category-expense-enhanced i.text-success, #history-content i.text-success { color: #198754 !important; }
        .category-expense-enhanced i.text-warning, #history-content i.text-warning { color: #fd7e14 !important; }
        .category-expense-enhanced i.text-info, #history-content i.text-info { color: #0dcaf0 !important; }
    `;
    document.head.appendChild(style);
}

function showWelcomeScreen(email) {
  const welcomeScreen = document.getElementById('welcome-screen');
  if (!welcomeScreen) {
      showApp(); 
      return;
  }
  welcomeScreen.style.display = 'flex';

  const welcomeText = document.getElementById('welcome-text');
  const fullText = "Meraih Masa Depan Sukses Bersama Beasiswa Unggulan dengan Menjadi Insan Cerdas dan Kompetitif.";
  if (welcomeText) {
    welcomeText.textContent = ''; 
    typeWriter(welcomeText, fullText, 30, () => {
      setTimeout(() => {
        welcomeScreen.style.display = 'none';
        showApp();
      }, 2000);
    });
  } else {
      setTimeout(() => {
        welcomeScreen.style.display = 'none';
        showApp();
      }, 2000);
  }
}

// bikin efek ngetik buat welcome text
function typeWriter(element, text, speed, callback) {
  let i = 0;
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    } else {
      if (callback) callback();
    }
  }
  type();
}

// full screen mode
async function enterFullscreen(element) {
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      await element.msRequestFullscreen();
    }

    // lock rotasi ke landscape kalo di hp
    if (window.screen.orientation && window.innerWidth < 768) {
        await window.screen.orientation.lock('landscape');
    }
  } catch (err) {
    console.error(`Error full-screen: ${err.message}`);
    showNotification("Gagal masuk mode layar penuh.", "danger");
  }
}

async function exitFullscreen() {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      await document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { 
      await document.msExitFullscreen();
    }
    // balikin rotasi
    if (window.screen.orientation) {
      window.screen.orientation.unlock();
    }
  } catch (err) {
    console.error(`Error exit full-screen: ${err.message}`);
  }
}

function handleFullscreenClick(chartInstance) {
    const modalElement = document.getElementById('zoomModal');
    if (!modalElement || !chartInstance) return;

    modalElement.addEventListener('shown.bs.modal', async () => {
        await enterFullscreen(modalElement);
        renderChartInZoomModal(chartInstance);
    }, { once: true }); 

    modalElement.addEventListener('hidden.bs.modal', async () => {
        await exitFullscreen();
        if (zoomChartInstance instanceof Chart) {
            zoomChartInstance.destroy();
            zoomChartInstance = null;
        }
    }, { once: true }); 

    zoomModal.show();
}

// render ulang chart di dalem modal zoom
function renderChartInZoomModal(originalChartInstance) {
  const zoomCtx = document.getElementById('zoom-chart-canvas').getContext('2d');

  if (zoomChartInstance instanceof Chart) {
    zoomChartInstance.destroy();
  }

  // copy config chart aslinya
  const newConfig = structuredClone(originalChartInstance.config);

  if (!newConfig.options.plugins) {
    newConfig.options.plugins = {};
  }

  // enable pan & zoom plugin
  newConfig.options.plugins.zoom = {
    pan: {
      enabled: true,
      mode: 'xy',
      threshold: 5,
    },
    zoom: {
      wheel: { enabled: true },
      pinch: { enabled: true },
      mode: 'xy',
    }
  };

  newConfig.options.responsive = true;
  newConfig.options.maintainAspectRatio = false;

  // matiin click/hover default pas lagi di zoom
  if (newConfig.options.onClick) delete newConfig.options.onClick;
  if (newConfig.options.onHover) delete newConfig.options.onHover;

  zoomChartInstance = new Chart(zoomCtx, newConfig);
}

// popup detail harian
function showDailyDetailModal(date) {
  const currentUser = localStorage.getItem('currentUser');
  const currentMonth = getCurrentMonth();
  const currentYear = getCurrentYear();
  const expensesKey = `expenses_${currentUser}_${currentYear}_${currentMonth}`;
  const expenses = JSON.parse(localStorage.getItem(expensesKey)) || [];

  const expensesOnDate = expenses.filter(exp => {
    const expDateOnly = new Date(exp.date).toLocaleDateString('id-ID');
    return expDateOnly === date;
  });

  const detailList = document.getElementById('daily-detail-list');
  const detailTotal = document.getElementById('daily-detail-total');
  const modalLabel = document.getElementById('dailyDetailModalLabel');
  if (!detailList || !detailTotal || !modalLabel) return; 

  modalLabel.textContent = `Detail Pengeluaran - ${date}`;
  detailList.innerHTML = ''; 

  if (expensesOnDate.length === 0) {
    detailList.innerHTML = '<li class="list-group-item text-center">Tidak ada pengeluaran pada hari ini.</li>';
    detailTotal.textContent = 'Total: Rp0';
    dailyDetailModal.show();
    return;
  }

  // group berdasar barang biar ga numpuk kalo nama & kategorinya sama
  const groupedByItem = expensesOnDate.reduce((acc, exp) => {
    const key = `${exp.kategori}#${exp.barang}`;
    if (!acc[key]) {
      acc[key] = {
        kategori: exp.kategori,
        barang: exp.barang,
        amount: 0
      };
    }
    acc[key].amount += exp.amount;
    return acc;
  }, {});

  let totalAmount = 0;
  const sortedExpenses = Object.values(groupedByItem).sort((a, b) => a.kategori.localeCompare(b.kategori));

  sortedExpenses.forEach(exp => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.innerHTML = `
      <div>
        <strong>${capitalizeFirstLetter(exp.kategori)}</strong>
        <small class="d-block text-muted">${capitalizeFirstLetter(exp.barang)}</small>
      </div>
      <span>Rp${exp.amount.toLocaleString('id-ID')}</span>
    `;
    detailList.appendChild(li);
    totalAmount += exp.amount;
  });

  detailTotal.textContent = `Total: Rp${totalAmount.toLocaleString('id-ID')}`;
  dailyDetailModal.show();
}

// ambil data saldo (tunai & bank)
function getSaldo() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return { tunai: 0, bank: 0 };
    const key = `saldo_${currentUser}`;
    try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data && typeof data.tunai === 'number' && typeof data.bank === 'number') {
            return data;
        }
    } catch (e) {
        console.error("Gagal parsing data saldo:", e);
    }
    return { tunai: 0, bank: 0 };
}

function saveSaldo(saldo) {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;
    const key = `saldo_${currentUser}`;
    try {
        localStorage.setItem(key, JSON.stringify(saldo));
    } catch (e) {
        console.error("Gagal menyimpan data saldo:", e);
        showNotification("Error: Gagal menyimpan saldo.", "danger");
    }
}

// ambil target budget bulanan
function getBudget() {
    const currentUser = localStorage.getItem('currentUser');
    const currentMonthKey = `${getCurrentYear()}-${getCurrentMonth()}`;
    if (!currentUser) return null;
    const key = `budget_${currentUser}_${currentMonthKey}`; 
    try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data && typeof data.budget === 'number') {
            return data.budget;
        }
    } catch (e) {
        console.error("Gagal parsing data budget:", e);
    }
    return null; 
}

function saveBudget(budgetAmount) {
    const currentUser = localStorage.getItem('currentUser');
    const currentMonthKey = `${getCurrentYear()}-${getCurrentMonth()}`;
    if (!currentUser) return;
    const key = `budget_${currentUser}_${currentMonthKey}`;
    try {
        localStorage.setItem(key, JSON.stringify({ budget: budgetAmount }));
    } catch (e) {
        console.error("Gagal menyimpan data budget:", e);
        showNotification("Error: Gagal menyimpan budget.", "danger");
    }
}

function getTotalPengeluaranBulanIni() {
    const currentUser = localStorage.getItem('currentUser');
    const currentMonth = getCurrentMonth();
    const currentYear = getCurrentYear();
    const expensesKey = `expenses_${currentUser}_${currentYear}_${currentMonth}`;
    let expenses = [];
    try {
        expenses = JSON.parse(localStorage.getItem(expensesKey)) || [];
    } catch (e) {
        console.error("Gagal parsing data pengeluaran:", e);
    }   
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
}

// refresh dompet view
function updateSaldoDisplay() {
    const saldo = getSaldo();
    const saldoTunaiEl = document.getElementById('saldo-tunai-display');
    const saldoBankEl = document.getElementById('saldo-bank-display');
    
    if (saldoTunaiEl) saldoTunaiEl.textContent = `Rp${saldo.tunai.toLocaleString('id-ID')}`;
    if (saldoBankEl) saldoBankEl.textContent = `Rp${saldo.bank.toLocaleString('id-ID')}`;

    const transferSaldoBankEl = document.getElementById('transfer-saldo-bank');
    if (transferSaldoBankEl) transferSaldoBankEl.textContent = `Rp${saldo.bank.toLocaleString('id-ID')}`;
}

// hitung sisa budget dan render progress bar
function updateBudgetDisplay() {
    const budget = getBudget();
    
    const budgetSummaryHeader = document.getElementById('budget-summary-header');
    const budgetStatsContent = document.getElementById('budget-stats-content');
    const budgetSisaEl = document.getElementById('budget-sisa');
    const budgetProgressEl = document.getElementById('budget-progress-bar');
    const budgetPercentageEl = document.getElementById('budget-percentage');
    const btnAturBudget = document.getElementById('btn-atur-budget');

    if (!budgetSummaryHeader || !budgetStatsContent || !budgetSisaEl || !budgetProgressEl || !budgetPercentageEl || !btnAturBudget) return;
    
    updateExpenditureVsSaldoBar(); 

    if (!budget) {
        if (budgetSisaEl) budgetSisaEl.textContent = "Budget belum diatur";
        if (budgetProgressEl) {
            budgetProgressEl.style.width = '0%';
            budgetProgressEl.classList.remove('color-warn', 'color-danger');
        }
        if (budgetPercentageEl) budgetPercentageEl.textContent = "Atur";
        if (btnAturBudget) btnAturBudget.textContent = "Atur Budget Bulanan";
        
        budgetStatsContent.innerHTML = '<p class="text-muted small text-center">Atur budget Anda untuk melihat statistik detail.</p>';
        return;
    }

    const saldo = getSaldo();
    const { expenses, pengeluaranTunai, pengeluaranBank } = getMonthlyExpenseDetails(); 
    const totalPengeluaran = pengeluaranTunai + pengeluaranBank;
    
    const sisaBudget = budget - totalPengeluaran;
    const persentaseTerpakai = (budget > 0) ? (totalPengeluaran / budget) * 100 : 0;
    const persentaseTampil = Math.min(100, persentaseTerpakai);

    const today = new Date();
    const hariDiBulan = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const hariTelahLewat = today.getDate();
    const sisaHari = Math.max(0, hariDiBulan - hariTelahLewat);

    const avgAktual = (hariTelahLewat > 0) ? (totalPengeluaran / hariTelahLewat) : 0;
    const avgTarget = (sisaHari > 0 && sisaBudget > 0) ? (sisaBudget / sisaHari) : 0;

    const totalTunaiDimiliki = saldo.tunai + pengeluaranTunai;
    const persentasePengeluaranTunai = (totalTunaiDimiliki > 0) ? (pengeluaranTunai / totalTunaiDimiliki) * 100 : 0;

    if (budgetSisaEl) {
        budgetSisaEl.textContent = sisaBudget >= 0 
            ? `Sisa: Rp${sisaBudget.toLocaleString('id-ID')}`
            : `Lebih: Rp${Math.abs(sisaBudget).toLocaleString('id-ID')}`;
        budgetSisaEl.style.color = sisaBudget >= 0 ? '#6c757d' : '#dc3545';
    }
    
    if (budgetPercentageEl) budgetPercentageEl.textContent = `${persentaseTerpakai.toFixed(0)}%`;
    if (btnAturBudget) btnAturBudget.textContent = "Atur/Edit Budget"; 

    if (budgetProgressEl) {
        budgetProgressEl.style.width = `${persentaseTampil}%`;
        budgetProgressEl.classList.remove('color-warn', 'color-danger');
        if (persentaseTerpakai >= 90) {
            budgetProgressEl.classList.add('color-danger');
        } else if (persentaseTerpakai >= 70) {
            budgetProgressEl.classList.add('color-warn');
        }
    }
    
    budgetStatsContent.innerHTML = `
        <ul>
            <li>
                <span><i class="fas fa-bullseye me-2 text-primary"></i>Total Budget</span>
                <strong>Rp${budget.toLocaleString('id-ID')}</strong>
            </li>
            <li>
                <span><i class="fas fa-shopping-cart me-2 text-danger"></i>Total Pengeluaran</span>
                <strong>Rp${totalPengeluaran.toLocaleString('id-ID')}</strong>
            </li>
            <li>
                <span><i class="fas fa-check-circle me-2 text-success"></i>Sisa Budget</span>
                <strong style="color: ${sisaBudget >= 0 ? '#198754' : '#dc3545'}">Rp${sisaBudget.toLocaleString('id-ID')}</strong>
            </li>
            <li>
                <span><i class="fas fa-wallet me-2 text-info"></i>Pengeluaran Tunai</span>
                <strong>Rp${pengeluaranTunai.toLocaleString('id-ID')}</strong>
            </li>
            <li>
                <span><i class="fas fa-university me-2 text-secondary"></i>Pengeluaran Bank</span>
                <strong>Rp${pengeluaranBank.toLocaleString('id-ID')}</strong>
            </li>
            <li>
                <span><i class="fas fa-percentage me-2 text-warning"></i>% Pengeluaran dari Tunai</span>
                <strong>${persentasePengeluaranTunai.toFixed(0)}% <small>(dari total tunai bulan ini)</small></strong>
            </li>
            <li>
                <span><i class="fas fa-calculator me-2"></i>Rata-rata/hari (Target)</span>
                <strong style="color: #198754">Rp${avgTarget.toLocaleString('id-ID', {maximumFractionDigits: 0})} <small>(${sisaHari} hari lagi)</small></strong>
            </li>
            <li>
                <span><i class="fas fa-calculator me-2"></i>Rata-rata/hari (Aktual)</span>
                <strong style="color: #dc3545">Rp${avgAktual.toLocaleString('id-ID', {maximumFractionDigits: 0})} <small>(${hariTelahLewat} hari lewat)</small></strong>
            </li>
        </ul>
    `;
}

function updateSaldoInfoDiForm() {
    const saldo = getSaldo();
    const tunaiInfoEl = document.getElementById('sumber-tunai-info');
    const bankInfoEl = document.getElementById('sumber-bank-info');
    
    if (tunaiInfoEl) tunaiInfoEl.textContent = `Sisa: Rp${saldo.tunai.toLocaleString('id-ID')}`;
    if (bankInfoEl) bankInfoEl.textContent = `Sisa: Rp${saldo.bank.toLocaleString('id-ID')}`;
}

// cek klo budget udh mepet 70%
function checkBudgetAlert() {
    const currentUser = localStorage.getItem('currentUser');
    const currentMonthKey = `${getCurrentYear()}-${getCurrentMonth()}`;
    const alertKey = `budgetAlert_${currentUser}_${currentMonthKey}`;

    if (localStorage.getItem(alertKey)) {
        budgetAlertShownThisMonth = true;
        return;
    }

    const budget = getBudget();
    if (!budget || budget === 0) return; 

    const totalPengeluaran = getTotalPengeluaranBulanIni();
    const persentaseTerpakai = (totalPengeluaran / budget) * 100;

    if (persentaseTerpakai >= 70 && !budgetAlertShownThisMonth) {
        const sisaBudget = budget - totalPengeluaran;
        const sisaSaldoTunai = getSaldo().tunai; 
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const sisaHari = Math.max(0, daysInMonth - today.getDate()); 

        const pesan = `Pengeluaranmu bulan ini sudah <strong>${persentaseTerpakai.toFixed(0)}%</strong>.
                  <br><br>
                     Saat ini anda hanya memiliki sisa uang sebesar <strong>Rp${sisaSaldoTunai.toLocaleString('id-ID')}</strong> (di dompet tunai) yang digunakan selama <strong>${sisaHari} hari</strong> lagi.
                     <br><br>
                     (Total sisa budget Anda: Rp${sisaBudget.toLocaleString('id-ID')})
                     <br><br>
                     Yuk, lebih hemat!`;

        showInfoModal("⚠️ Peringatan Budget!", pesan);

        budgetAlertShownThisMonth = true;
        localStorage.setItem(alertKey, 'true');
    }
}

// popup overlay transfer uang
function showTransferAnimation() {
    const overlay = document.getElementById('transfer-animation');
    if (overlay) {
        const textElement = overlay.querySelector('.transfer-animation-text');
        if (textElement) {
            textElement.textContent = "Mengirim ke dompet anda..."; 
        }
        
        overlay.style.display = 'flex';
        
        setTimeout(() => {
            overlay.style.display = 'none';
            if (textElement) {
                 textElement.textContent = "Mengirim uang ke dompet..."; 
            }
        }, 2500); 
    }
}

// Setup awal waktu buka app
function initializeApp() {
  Chart.register(ChartZoom, Chart.TimeScale);

  zoomModal = new bootstrap.Modal(document.getElementById('zoomModal'));
  dailyDetailModal = new bootstrap.Modal(document.getElementById('dailyDetailModal'));
  
  if (document.getElementById('budgetModal')) budgetModal = new bootstrap.Modal(document.getElementById('budgetModal'));
  if (document.getElementById('pemasukanModal')) pemasukanModal = new bootstrap.Modal(document.getElementById('pemasukanModal'));
  if (document.getElementById('transferModal')) transferModal = new bootstrap.Modal(document.getElementById('transferModal'));
  if (document.getElementById('infoModal')) infoModalInstance = new bootstrap.Modal(document.getElementById('infoModal')); 
  if (document.getElementById('customConfirmModal')) customConfirmModal = new bootstrap.Modal(document.getElementById('customConfirmModal'));
  
  document.getElementById('custom-confirm-yes-btn')?.addEventListener('click', () => {
      if (typeof onConfirmCallback === 'function') {
          onConfirmCallback();
      }
      customConfirmModal.hide();
      onConfirmCallback = () => {};
  });

  // routing menu
  document.getElementById('menu-add-expense')?.addEventListener('click', () => showSection('add-expense-section'));
  document.getElementById('menu-daily-expense')?.addEventListener('click', () => showSection('daily-expense-section'));
  document.getElementById('menu-category-expense')?.addEventListener('click', () => showSection('category-expense-section'));
  document.getElementById('menu-print-expense')?.addEventListener('click', () => showSection('print-expense-section'));
  document.getElementById('menu-export-excel')?.addEventListener('click', handleExportExcel);
  document.getElementById('menu-history-expense')?.addEventListener('click', () => showSection('history-expense-section'));
  document.getElementById('menu-dompet')?.addEventListener('click', () => showSection('dompet-section'));

  document.querySelectorAll('[id^="back-to-dashboard"], [id^="back-dompet-to-dashboard"], #back-analisis-to-dashboard').forEach(button => {
    button?.addEventListener('click', () => showSection('dashboard-section'));
  });
  
  document.getElementById('back-anomali-to-analisis')?.addEventListener('click', () => showSection('analisis-section'));
  document.getElementById('back-prediksi-to-analisis')?.addEventListener('click', () => showSection('analisis-section'));
  
  document.getElementById('budget-form')?.addEventListener('submit', handleSaveBudget);
  document.getElementById('pemasukan-form')?.addEventListener('submit', handleTambahPemasukan);
  document.getElementById('transfer-form')?.addEventListener('submit', handleTransferInternal);
  
  document.getElementById('btn-reset-tunai')?.addEventListener('click', handleResetTunai);
  document.getElementById('btn-reset-bank')?.addEventListener('click', handleResetBank);
  document.getElementById('btn-reset-budget')?.addEventListener('click', handleResetBudget);
  
  // dropdown toggle buat bar perbandingan
  const expSaldoDropdown = document.querySelector('.exp-saldo-dropdown .dropdown-menu');
  if (expSaldoDropdown) {
      expSaldoDropdown.addEventListener('click', (e) => {
          e.preventDefault();
          if (e.target.classList.contains('dropdown-item')) {
              const value = e.target.getAttribute('data-value');
              const button = document.getElementById('expenditure-saldo-select');
              
              if (value === 'tunai') button.textContent = "Total Keluar vs Tunai";
              else if (value === 'bank') button.textContent = "Total Keluar vs Bank";
              else button.textContent = "Total Keluar vs Total";
              
              expSaldoDropdown.querySelectorAll('.dropdown-item').forEach(item => item.classList.remove('active'));
              e.target.classList.add('active');
              button.setAttribute('data-current-value', value); 
              updateExpenditureVsSaldoBar();
          }
      });
  }

  document.getElementById('btn-reset-exp-saldo')?.addEventListener('click', handleResetExpSaldoFilter);
  // document.getElementById('btn-reset-monthly-expenses')?.addEventListener('click', handleResetMonthlyExpenses);

  document.getElementById('anomali-kategori-filter')?.addEventListener('change', filterAnomalyChart);
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

  const expenseForm = document.getElementById('expense-form');
  if (expenseForm) expenseForm.addEventListener('submit', handleAddExpense);

  const printForm = document.getElementById('print-expense-form');
  if (printForm) printForm.addEventListener('submit', handlePrintExpense);

  document.getElementById('menu-analisis')?.addEventListener('click', () => showSection('analisis-section'));
  document.getElementById('goto-anomali')?.addEventListener('click', () => showSection('anomali-detail-section'));
  document.getElementById('goto-prediksi')?.addEventListener('click', () => showSection('prediksi-detail-section'));
  
  const expensesUl = document.getElementById('expenses-ul');
  if (expensesUl) {
      expensesUl.removeEventListener('click', handleExpenseListClick);
      expensesUl.addEventListener('click', handleExpenseListClick);
  }

  initializeHistoryYearOptions();
  initializePrintYearOptions();
  setDefaultDateTime();
  renderDashboard();
  
  loadSavedCategories();
  initializeDropdown('kategori-button', 'category-options', 'kategori-selected', 'add-new-category', 'add-category-input', 'new-category-input', 'save-new-category', 'category');

  if (document.getElementById('tipsModal')) {
    new bootstrap.Modal(document.getElementById('tipsModal'));
  }

  initializeCategoryExpenseEnhanced();

  // toggle garis rata2
  const toggleAvgButton = document.getElementById('toggle-average-line');
  if (toggleAvgButton) {
      toggleAvgButton.addEventListener('click', (e) => {
          if (dailyExpenseChart) {
              const button = e.currentTarget;
              const isToggled = button.getAttribute('data-toggled') === 'true';
              const newState = !isToggled;
              button.setAttribute('data-toggled', newState);
              button.innerHTML = newState ? '<i class="fas fa-check-circle"></i> Garis Rata-rata' : '<i class="fas fa-times-circle"></i> Garis Rata-rata';
              dailyExpenseChart.setDatasetVisibility(1, newState);
              dailyExpenseChart.update();
          }
      });
  }
  
  const animateButton = document.getElementById('animate-daily-chart');
  if (animateButton) {
      animateButton.addEventListener('click', animateDailyChart);
  }
  
  document.addEventListener('click', (e) => {
      const fullscreenBtn = e.target.closest('.fullscreen-button');
      if (fullscreenBtn) {
          const chartTargetId = fullscreenBtn.getAttribute('data-chart-target');
          let targetChartInstance = null;
          switch(chartTargetId) {
              case 'daily-expense-chart': targetChartInstance = dailyExpenseChart; break;
              case 'category-expense-chart': targetChartInstance = categoryExpenseChart; break;
              case 'category-daily-chart': targetChartInstance = categoryDailyExpenseChart; break;
              case 'history-daily-chart': targetChartInstance = historyDailyExpenseChart; break;
              case 'history-category-chart': targetChartInstance = historyCategoryExpenseChart; break;
          }
          if (targetChartInstance) {
              handleFullscreenClick(targetChartInstance);
          }
      }
  });

  applyDynamicStyles();
}

function setDefaultDateTime() {
    const dateInput = document.getElementById('expense-date');
    const timeInput = document.getElementById('expense-time');
    
    if (dateInput && timeInput) {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        
        dateInput.value = `${year}-${month}-${day}`;
        timeInput.value = `${hours}:${minutes}`;
    }
}

// fungsi general buat dropdown kaya kategori
function initializeDropdown(buttonId, optionsId, selectedInputId, addNewBtnId, addInputContainerId, newInputId, saveBtnId, type) {
    const dropdownButton = document.getElementById(buttonId);
    const optionsContainer = document.getElementById(optionsId);
    const selectedInput = document.getElementById(selectedInputId);
    const addNewButton = document.getElementById(addNewBtnId);
    const addInputContainer = document.getElementById(addInputContainerId);
    const newInput = document.getElementById(newInputId);
    const saveButton = document.getElementById(saveBtnId);

    if (!dropdownButton || !optionsContainer || !selectedInput || !addNewButton || !addInputContainer || !newInput || !saveButton) {
        return; 
    }
    
    dropdownButton.addEventListener('click', () => {
        optionsContainer.classList.toggle('show');
    });

    optionsContainer.addEventListener('click', (e) => {
        const targetButton = e.target.closest(`button[data-${type}]`);
        if (targetButton) {
            const selectedValue = targetButton.getAttribute(`data-${type}`);
            if (selectedValue === `add-new-${type}`) {
                addInputContainer.style.display = 'block';
            } else {
                selectedInput.value = selectedValue;
                dropdownButton.innerHTML = `${capitalizeFirstLetter(selectedValue)} <i class="fas fa-chevron-down float-end"></i>`;
                optionsContainer.classList.remove('show');
                addInputContainer.style.display = 'none'; 
                newInput.value = ''; 
            }
        }
    });

    saveButton.addEventListener('click', () => {
        const newValue = newInput.value.trim();
        if (newValue) {
            const lowerCaseValue = newValue.toLowerCase();
            const existingOptions = optionsContainer.querySelectorAll(`button[data-${type}]`);
            let isDuplicate = false;
            existingOptions.forEach(opt => {
                if (opt.getAttribute(`data-${type}`) === lowerCaseValue) {
                    isDuplicate = true;
                }
            });

            if (isDuplicate) {
                showNotification(`${capitalizeFirstLetter(type)} "${capitalizeFirstLetter(newValue)}" sudah ada.`, 'danger');
                return;
            }
            
            const newButton = document.createElement('button');
            newButton.type = 'button';
            newButton.setAttribute(`data-${type}`, lowerCaseValue);
            newButton.textContent = capitalizeFirstLetter(newValue);
            optionsContainer.insertBefore(newButton, addNewButton);

            if (type === 'category') {
                saveCategory(newValue); 
            }

            selectedInput.value = lowerCaseValue;
            dropdownButton.innerHTML = `${capitalizeFirstLetter(newValue)} <i class="fas fa-chevron-down float-end"></i>`;
            optionsContainer.classList.remove('show');
            addInputContainer.style.display = 'none';
            newInput.value = '';
            showNotification(`${capitalizeFirstLetter(type)} "${capitalizeFirstLetter(newValue)}" berhasil ditambahkan.`, 'success');
        }
    });
}

function handleResetExpSaldoFilter() {
    const button = document.getElementById('expenditure-saldo-select');
    const dropdownMenu = document.querySelector('.exp-saldo-dropdown .dropdown-menu');
    
    if (!button || !dropdownMenu) return;

    button.setAttribute('data-current-value', EXP_SALDO_DEFAULT_VIEW);
    button.textContent = "Total Keluar vs Tunai"; 
    
    dropdownMenu.querySelectorAll('.dropdown-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-value') === EXP_SALDO_DEFAULT_VIEW) {
            item.classList.add('active');
        }
    });
    
    updateExpenditureVsSaldoBar();
    showNotification("Filter bar telah direset.", "success");
}

function saveCategory(categoryValue) {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return; 
    const key = `categories_${currentUser}`; 
    let savedCategories = [];
    try {
        const existingData = localStorage.getItem(key);
        savedCategories = existingData ? JSON.parse(existingData) : [];
        if (!Array.isArray(savedCategories)) savedCategories = [];
    } catch (error) {
        console.error("Error parsing saved categories:", error);
        savedCategories = []; 
    }

    const lowerCaseValue = categoryValue.toLowerCase();
    if (!savedCategories.some(cat => cat.toLowerCase() === lowerCaseValue)) {
        savedCategories.push(categoryValue); 
        try {
            localStorage.setItem(key, JSON.stringify(savedCategories));
        } catch (e) {
            console.error("Error saving categories to localStorage:", e);
            showNotification("Gagal menyimpan kategori baru.", "danger");
        }
    }
}

function loadSavedCategories() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return; 

    const key = `categories_${currentUser}`;
    let savedCategories = [];
     try {
        const existingData = localStorage.getItem(key);
        savedCategories = existingData ? JSON.parse(existingData) : [];
        if (!Array.isArray(savedCategories)) savedCategories = [];
    } catch (error) {
        console.error("Error parsing saved categories:", error);
        savedCategories = [];
    }

    const optionsContainer = document.getElementById('category-options');
    const addNewButton = document.getElementById('add-new-category');

    if (!optionsContainer || !addNewButton) return; 

    const defaultCategories = new Set();
    optionsContainer.querySelectorAll('button[data-category]:not(#add-new-category)')
        .forEach(btn => defaultCategories.add(btn.getAttribute('data-category')));

    savedCategories.forEach(category => {
        const lowerCaseCategory = category.toLowerCase();
        if (!defaultCategories.has(lowerCaseCategory) && !optionsContainer.querySelector(`button[data-category="${lowerCaseCategory}"]`)) {
            const newButton = document.createElement('button');
            newButton.type = 'button';
            newButton.setAttribute('data-category', lowerCaseCategory);
            newButton.textContent = capitalizeFirstLetter(category); 
            optionsContainer.insertBefore(newButton, addNewButton);
        } 
    });
}

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.toggle('active', section.id === sectionId);
  });

  // clear cache pas pindah modul analisis/dashboard
  if (sectionId === 'dashboard-section' || sectionId === 'analisis-section') {
      analysisDataLoaded = false;
      allUserExpensesCache = []; 
      resetAnalysisViews(); 
  }
  
  switch (sectionId) {
    case 'dashboard-section':
      renderDashboard(); 
      break;
    case 'dompet-section': 
      renderDompetPage(); 
      break;
    case 'daily-expense-section':
      renderDailyExpenseChart();
      break;
    case 'category-expense-section':
      renderCategoryExpenseChart();
      initializeCategoryExpenseEnhanced();
      break;
    case 'history-expense-section':
      initializeHistoryYearOptions();
      const historyContent = document.getElementById('history-content');
      if (historyContent) {
          historyContent.innerHTML = '<p class="text-muted">Pilih tahun dan bulan.</p>';
      }
      const exportButtons = document.getElementById('history-export-buttons');
      if (exportButtons) exportButtons.style.display = 'none';
      break;
    case 'print-expense-section':
      initializePrintYearOptions();
      break;
    case 'add-expense-section':
      renderExpensesList();
      loadSavedCategories();
      updateSaldoInfoDiForm(); 
      break;
    case 'analisis-section':
      break;
    case 'anomali-detail-section':
      loadAndRunAnomalyDetection(); 
      break;
    case 'prediksi-detail-section':
      loadAndSetupPrediction(); 
      break;
  }
  
  toggleLogoutButton(sectionId);
}

function toggleLogoutButton(sectionId) {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    if (sectionId === 'dashboard-section') {
      logoutBtn.classList.add('visible');
    } else {
      logoutBtn.classList.remove('visible');
    }
  }
}

function handleLogout() {
  showNotification('Keluar dari akun...', 'success'); 
  setTimeout(() => {
    localStorage.removeItem('currentUser');
    location.reload();
  }, 2000); 
}

// handle form tambah pengeluaran (cek saldo dll)
function handleAddExpense(e) {
  e.preventDefault();
  const dateInput = document.getElementById('expense-date');
  const timeInput = document.getElementById('expense-time');
  const barangInput = document.getElementById('barang');
  const amountInput = document.getElementById('amount');
  const kategoriInput = document.getElementById('kategori-selected');
  const currentUser = localStorage.getItem('currentUser');
  
  const sumberPembayaranEl = document.querySelector('input[name="sumber-pembayaran"]:checked');
  
  if (!dateInput || !timeInput || !barangInput || !amountInput || !kategoriInput || !currentUser || !sumberPembayaranEl) {
      showNotification('Terjadi kesalahan pada form. Pastikan semua terisi.', 'danger');
      return;
  }

  const tanggal = dateInput.value;
  const jam = timeInput.value;
  const barang = barangInput.value.trim();
  let amount = parseFloat(amountInput.value.trim());
  const kategori = kategoriInput.value.trim();
  const sumberPembayaran = sumberPembayaranEl.value; 

  if (barang && !isNaN(amount) && amount > 0 && kategori && tanggal && jam && sumberPembayaran) {
    
    // pastiin duitnya ada
    let saldo = getSaldo();
    if (sumberPembayaran === 'tunai' && amount > saldo.tunai) {
        showNotification("Gagal! Saldo Dompet (Tunai) Anda tidak mencukupi.", "danger");
        return;
    }
    if (sumberPembayaran === 'bank' && amount > saldo.bank) {
        showNotification("Gagal! Saldo Bank (Non-Tunai) Anda tidak mencukupi.", "danger");
        return;
    }

    const dateTimeString = `${tanggal}T${jam}:00`;
    const expenseDate = new Date(dateTimeString);

    if (isNaN(expenseDate.getTime())) {
         showNotification('Format tanggal atau jam tidak valid.', 'danger');
         return;
    }

    const expense = {
      id: Date.now(),
      barang,
      kategori,
      amount: amount,
      date: expenseDate.toISOString(),
      sumber: sumberPembayaran 
    };

    const expenseMonth = expenseDate.getMonth() + 1;
    const expenseYear = expenseDate.getFullYear();
    const expensesKey = `expenses_${currentUser}_${expenseYear}_${expenseMonth}`;
    let expenses = [];
    try {
        expenses = JSON.parse(localStorage.getItem(expensesKey)) || [];
        if (!Array.isArray(expenses)) expenses = [];
    } catch (error) {
        expenses = [];
    }
    expenses.push(expense);
    
    try {
        localStorage.setItem(expensesKey, JSON.stringify(expenses));
    } catch (error) {
        showNotification('Gagal menyimpan pengeluaran.', 'danger');
        return;
    }

    // potong saldo
    if (sumberPembayaran === 'tunai') {
        saldo.tunai -= amount;
    } else {
        saldo.bank -= amount;
    }
    saveSaldo(saldo); 

    // reset
    document.getElementById('expense-form').reset();
    document.getElementById('kategori-button').innerHTML = `Pilih Kategori <i class="fas fa-chevron-down float-end"></i>`;
    setDefaultDateTime();
    updateSaldoInfoDiForm(); 

    // nampilin notif tergantung ini data bulan ini apa bukan
    if (expenseMonth === getCurrentMonth() && expenseYear === getCurrentYear()) {
        showNotification('Pengeluaran berhasil ditambahkan!', 'success');
        renderExpensesList();
    } else {
        const monthName = getMonthName(expenseMonth);
        showNotification(`Data disimpan di Riwayat (Bulan ${monthName} ${expenseYear}).`, 'success');
    }
    
    updateCategoryDropdownOptions();
    populateCategoryExpenseMonthOptions();
    
    const activeSection = document.querySelector('.section.active')?.id;
    if (activeSection === 'dashboard-section') renderDashboard();
    if (activeSection === 'dompet-section') renderDompetPage();
    checkBudgetAlert();

  } else {
    let errorMessage = 'Silakan isi semua bidang dengan benar.';
    if (isNaN(amount) || amount <= 0) errorMessage = 'Jumlah pengeluaran harus berupa angka positif.';
    else if (!kategori) errorMessage = 'Kategori belum dipilih.';
    else if (!sumberPembayaran) errorMessage = 'Sumber pembayaran belum dipilih.';
    showNotification(errorMessage, 'warning');
  }
}

function handleExpenseListClick(e) {
    const toggleIcon = e.target.closest('.toggle-category');
    if (toggleIcon) {
        const dateLi = toggleIcon.closest('li'); 
        if (dateLi) {
            const subUl = dateLi.nextElementSibling; 
            if (subUl && subUl.tagName === 'UL') {
                subUl.classList.toggle('d-none'); 
                dateLi.classList.toggle('expanded'); 
                toggleIcon.classList.toggle('fa-chevron-down'); 
                toggleIcon.classList.toggle('fa-chevron-up');
            } 
        }
    } else {
        const deleteButton = e.target.closest('.expense-delete-btn');
        if (deleteButton) {
            handleDeleteExpenseById(e); 
        }
    }
}

function renderExpensesList() {
  const currentUser = localStorage.getItem('currentUser');
  const currentMonth = getCurrentMonth();
  const currentYear = getCurrentYear();
  const expensesKey = `expenses_${currentUser}_${currentYear}_${currentMonth}`;
  const expenses = JSON.parse(localStorage.getItem(expensesKey)) || [];
  const expensesUl = document.getElementById('expenses-ul');
  if (!expensesUl) return;
  expensesUl.innerHTML = '';
  
  expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const groupedByDate = expenses.reduce((acc, exp) => {
      const dateKey = new Date(exp.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      acc[dateKey] = acc[dateKey] || [];
      acc[dateKey].push(exp);
      return acc;
  }, {});
  
  for (const [dateKey, itemsOnDate] of Object.entries(groupedByDate)) {
      const dateLi = document.createElement('li');
      dateLi.innerHTML = `
          <span>${dateKey}</span>
          <i class="fas fa-chevron-down toggle-category"></i> 
      `;
      expensesUl.appendChild(dateLi);
      
      const subUl = document.createElement('ul');
      subUl.classList.add('ms-3', 'mt-2', 'mb-2', 'd-none');
      itemsOnDate.forEach(exp => {
          const itemLi = document.createElement('li');
          const sumberIkon = exp.sumber === 'tunai' 
              ? '<i class="fas fa-wallet fa-xs me-2 text-info"></i>' 
              : '<i class="fas fa-university fa-xs me-2 text-primary"></i>';
          
          itemLi.innerHTML = `
              <span>
                  ${sumberIkon}
                  ${capitalizeFirstLetter(exp.barang)}: Rp${exp.amount.toLocaleString('id-ID')}
              </span>
              <i class="fas fa-trash text-danger expense-delete-btn" data-id="${exp.id}" title="Hapus" style="cursor:pointer;"></i>
          `;
          subUl.appendChild(itemLi);
      });
      expensesUl.appendChild(subUl);
  }
}

function handleDeleteExpenseById(e) {
  const expenseId = e.target.getAttribute('data-id');
  if (!expenseId) return;

  if (!confirm("Apakah Anda yakin ingin menghapus pengeluaran ini? Saldo Anda akan dikembalikan.")) {
      return;
  }

  const idToDelete = parseInt(expenseId);
  const currentUser = localStorage.getItem('currentUser');
  let expenseDeleted = false;
  let deletedItemInfo = "";
  let amountToRestore = 0;
  let sumberToRestore = null;

  for (let key in localStorage) {
    if (key.startsWith(`expenses_${currentUser}_`)) {
      let expensesInMonth = JSON.parse(localStorage.getItem(key)) || [];
      const initialLength = expensesInMonth.length;
      
      expensesInMonth = expensesInMonth.filter(exp => {
          if (exp.id === idToDelete) {
              deletedItemInfo = `"${capitalizeFirstLetter(exp.barang)}"`;
              amountToRestore = exp.amount; 
              sumberToRestore = exp.sumber; 
              return false;
          }
          return true;
      });

      if (expensesInMonth.length < initialLength) {
        if (expensesInMonth.length > 0) {
          localStorage.setItem(key, JSON.stringify(expensesInMonth));
        } else {
          localStorage.removeItem(key);
        }
        expenseDeleted = true;
        break;
      }
    }
  }

  if (expenseDeleted) {
    if (amountToRestore > 0 && sumberToRestore) {
        let saldo = getSaldo();
        if (sumberToRestore === 'tunai') {
            saldo.tunai += amountToRestore;
        } else {
            saldo.bank += amountToRestore;
        }
        saveSaldo(saldo);
        showNotification(`Pengeluaran ${deletedItemInfo} dihapus. Saldo dikembalikan.`, 'success');
    } else {
        showNotification(`Pengeluaran ${deletedItemInfo} telah dihapus.`, 'success');
    }
    
    const activeSection = document.querySelector('.section.active');
    if (activeSection && activeSection.id === 'add-expense-section') {
      renderExpensesList();
      updateSaldoInfoDiForm(); 
    }
    
    updateCategoryDropdownOptions();
    populateCategoryExpenseMonthOptions();
    initializeHistoryYearOptions();
    initializePrintYearOptions();

    if (activeSection && activeSection.id === 'history-expense-section') {
      renderHistoryContent();
    }
    if (activeSection === 'dashboard-section') renderDashboard();
    if (activeSection === 'dompet-section') renderDompetPage();

  } else {
    showNotification('Gagal menghapus pengeluaran. Item tidak ditemukan.', 'danger');
  }
}

function renderDailyExpenseChart() {
  const currentUser = localStorage.getItem('currentUser');
  const currentMonth = getCurrentMonth();
  const currentYear = getCurrentYear();
  const expensesKey = `expenses_${currentUser}_${currentYear}_${currentMonth}`;
  const expenses = JSON.parse(localStorage.getItem(expensesKey)) || [];

  const grouped = expenses.reduce((acc, exp) => {
    const date = new Date(exp.date);
    const formattedDate = date.toLocaleDateString('id-ID');
    acc[formattedDate] = (acc[formattedDate] || 0) + exp.amount;
    return acc;
  }, {});

  const allDates = getAllDatesInMonth(currentYear, currentMonth);
  const labels = allDates.map(date => date.toLocaleDateString('id-ID'));
  const data = allDates.map(date => {
    const formattedDate = date.toLocaleDateString('id-ID');
    return grouped[formattedDate] || 0;
  });

  const ctx = document.getElementById('daily-expense-chart')?.getContext('2d');
  if (!ctx) return; 

  const totalPengeluaran = data.reduce((sum, val) => sum + val, 0);
  const daysWithExpenses = data.filter(val => val > 0).length;
  const average = daysWithExpenses > 0 ? (totalPengeluaran / daysWithExpenses) : 0;
  
  const averageData = new Array(labels.length).fill(average);
  
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(75, 0, 130, 0.4)');
  gradient.addColorStop(1, 'rgba(75, 0, 130, 0)');

  if (dailyExpenseChart instanceof Chart) {
    dailyExpenseChart.destroy();
  }

  dailyExpenseChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Pengeluaran Harian (Rp)',
          data: data,
          fill: true,
          backgroundColor: gradient, 
          borderColor: '#4b0082',
          tension: 0.4,
          pointBackgroundColor: '#4b0082', 
          pointBorderColor: '#4b0082',   
          pointRadius: 3,                 
          pointHoverRadius: 8,
        },
        {
          label: 'Rata-rata Pengeluaran',
          data: averageData,
          fill: false,
          borderColor: '#fd7e14', 
          borderDash: [5, 5], 
          pointRadius: 0, 
          borderWidth: 2,
          hidden: !(document.getElementById('toggle-average-line')?.getAttribute('data-toggled') === 'true')
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { 
        duration: 800, 
        easing: 'easeInOutQuad'
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#333333',
            filter: (legendItem, chartData) => legendItem.datasetIndex === 0
          }
        },
        title: {
          display: true,
          text: 'Grafik Pengeluaran Harian',
          color: '#333333'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              if (context.datasetIndex === 1) {
                return `Rata-rata: Rp${Math.round(context.parsed.y).toLocaleString('id-ID')}`;
              }
              const value = context.parsed.y;
              return `Pengeluaran: Rp${value.toLocaleString('id-ID')}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#333333' },
          grid: { color: '#e0e0e0' },
          title: { display: true, text: 'Tanggal', color: '#333333' }
        },
        y: {
          ticks: { color: '#333333' },
          grid: { color: '#e0e0e0' },
          title: { display: true, text: 'Jumlah (Rp)', color: '#333333' }
        }
      },
      onClick: (evt, activeElements) => {
        if (activeElements.length > 0) {
          if (activeElements[0].datasetIndex === 0) { 
            const dataIndex = activeElements[0].index;
            const selectedDate = labels[dataIndex];
            showDailyDetailModal(selectedDate);
          }
        } 
      },
      onHover: (event, chartElement) => {
        const canvas = event.native.target;
        canvas.style.cursor = (chartElement[0] && chartElement[0].datasetIndex === 0) ? 'pointer' : 'default';
      }
    },
  });

  displayDailyStats(grouped, expenses);
}

function animateDailyChart() {
    if (!dailyExpenseChart || isDailyChartAnimating) return; 

    isDailyChartAnimating = true;
    const animateButton = document.getElementById('animate-daily-chart');
    if (animateButton) {
        animateButton.disabled = true;
        animateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menganimasikan...';
    }
    
    const originalData = structuredClone(dailyExpenseChart.data.datasets[0].data);
    const dataLength = originalData.length;
    const emptyData = new Array(dataLength).fill(0);
    dailyExpenseChart.data.datasets[0].data = emptyData;
    dailyExpenseChart.update('none'); 

    let currentStep = 0;
    const animationSpeed = 150; 

    function animationStep() {
        if (currentStep < dataLength) {
            const newData = originalData.slice(0, currentStep + 1).concat(new Array(dataLength - (currentStep + 1)).fill(null)); 
            dailyExpenseChart.data.datasets[0].data = newData;
            dailyExpenseChart.update('none'); 
            currentStep++;
            dailyChartAnimationTimeout = setTimeout(animationStep, animationSpeed);
        } else {
            isDailyChartAnimating = false;
            if (animateButton) {
                animateButton.disabled = false;
                animateButton.innerHTML = '<i class="fas fa-play-circle"></i> Animasikan Ulang';
            }
            dailyExpenseChart.data.datasets[0].data = originalData;
            dailyExpenseChart.update('none');
        }
    }

    clearTimeout(dailyChartAnimationTimeout);
    animationStep();
}

function displayDailyStats(groupedDaily, expenses) {
  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) return; 

  const totalBulanIni = Object.values(groupedDaily).reduce((sum, val) => sum + val, 0);
  const daysWithExpenses = Object.keys(groupedDaily).length;
  const avgBulanIni = daysWithExpenses > 0 ? (totalBulanIni / daysWithExpenses) : 0;

  const [prevYear, prevMonth] = getPreviousMonth();
  const prevExpensesKey = `expenses_${currentUser}_${prevYear}_${prevMonth}`;
  const prevExpenses = JSON.parse(localStorage.getItem(prevExpensesKey)) || [];

  let totalBulanLalu = 0;
  let avgBulanLalu = 0;
  if (prevExpenses.length > 0) {
    totalBulanLalu = prevExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const prevGrouped = prevExpenses.reduce((acc, exp) => {
      const dateObj = new Date(exp.date);
      if (isNaN(dateObj.getTime())) return acc; 
      const date = dateObj.toLocaleDateString('id-ID');
      acc[date] = (acc[date] || 0) + exp.amount;
      return acc;
    }, {});
    const prevDaysWithExpenses = Object.keys(prevGrouped).length;
    avgBulanLalu = prevDaysWithExpenses > 0 ? (totalBulanLalu / prevDaysWithExpenses) : 0;
  }

  const [totalComparisonHtml, totalComparisonClass] = getComparisonHtml(totalBulanIni, totalBulanLalu);
  const [avgComparisonHtml, avgComparisonClass] = getComparisonHtml(avgBulanIni, avgBulanLalu);

  let hariTerboros = { date: '-', amount: -1 }; 
  let hariTerhemat = { date: '-', amount: Infinity };

  if (daysWithExpenses > 0) {
    for (const [date, amount] of Object.entries(groupedDaily)) {
      if (amount > hariTerboros.amount) {
        hariTerboros = { date, amount };
      }
      if (amount > 0 && amount < hariTerhemat.amount) {
        hariTerhemat = { date, amount };
      }
    }
     if (hariTerhemat.amount === Infinity) hariTerhemat = { date: '-', amount: Infinity };
  }


  let transTertinggi = { barang: '-', kategori: '-', amount: 0 };
  let transTerendah = { barang: '-', kategori: '-', amount: Infinity };

  if (expenses.length > 0) {
    expenses.forEach(exp => {
      if (exp.amount > transTertinggi.amount) {
        transTertinggi = exp;
      }
      if (exp.amount > 0 && exp.amount < transTerendah.amount) {
        transTerendah = exp;
      }
    });
     if (transTerendah.amount === Infinity) transTerendah = { barang: '-', kategori: '-', amount: Infinity };
  }

  const totalBadge = document.getElementById('total-pengeluaran');
  if (totalBadge) {
      totalBadge.innerHTML = `Rp${totalBulanIni.toLocaleString('id-ID')}`;
      const oldTotalComp = totalBadge.closest('li')?.querySelector('.stat-comparison');
      if(oldTotalComp) oldTotalComp.remove();
      if (totalBulanLalu > 0) {
        totalBadge.insertAdjacentHTML('afterend', `<span class="stat-comparison ${totalComparisonClass}">${totalComparisonHtml}</span>`);
      }
  }


  const avgBadge = document.getElementById('rata-rata-harian');
  if(avgBadge) {
      avgBadge.innerHTML = `Rp${Math.round(avgBulanIni).toLocaleString('id-ID')}`;
      const oldAvgComp = avgBadge.closest('li')?.querySelector('.stat-comparison');
      if(oldAvgComp) oldAvgComp.remove();
      if (avgBulanLalu > 0) {
        avgBadge.insertAdjacentHTML('afterend', `<span class="stat-comparison ${avgComparisonClass}">${avgComparisonHtml}</span>`);
      }
  }

  const borosBadge = document.getElementById('hari-terboros');
  if (borosBadge) {
    if (hariTerboros.amount > 0) {
      borosBadge.innerHTML = `${hariTerboros.date} <small>(Rp${hariTerboros.amount.toLocaleString('id-ID')})</small>`;
    } else {
      borosBadge.textContent = '-';
    }
  }

  const hematBadge = document.getElementById('hari-terhemat');
   if (hematBadge) {
    if (hariTerhemat.amount !== Infinity) {
      hematBadge.innerHTML = `${hariTerhemat.date} <small>(Rp${hariTerhemat.amount.toLocaleString('id-ID')})</small>`;
    } else {
      hematBadge.textContent = '-';
    }
  }

  const tinggiBadge = document.getElementById('pengeluaran-tertinggi');
  if (tinggiBadge) {
    if (transTertinggi.amount > 0) {
      tinggiBadge.innerHTML = `${capitalizeFirstLetter(transTertinggi.barang)} <small>(Rp${transTertinggi.amount.toLocaleString('id-ID')})</small>`;
    } else {
      tinggiBadge.textContent = '-';
    }
  }

  const rendahBadge = document.getElementById('pengeluaran-terendah');
  if (rendahBadge) {
    if (transTerendah.amount !== Infinity && transTerendah.amount > 0) {
      rendahBadge.innerHTML = `${capitalizeFirstLetter(transTerendah.barang)} <small>(Rp${transTerendah.amount.toLocaleString('id-ID')})</small>`;
    } else {
      rendahBadge.textContent = '-';
    }
  }
}

function getComparisonHtml(current, previous) {
  if (previous === 0) return ['', ''];

  const diff = current - previous;
  if (previous > 0 && current <= 0) {
      return [`<i class="fas fa-arrow-down"></i> Turun 100%+ vs bln lalu`, 'stat-up'];
  }
   if (previous <= 0 && current > 0) {
       return [`<i class="fas fa-arrow-up"></i> Naik vs bln lalu`, 'stat-down'];
   }
  if (previous <= 0 && current <= 0) {
       return ['<i class="fas fa-equals"></i> Sama vs bln lalu', 'stat-same'];
  }

  const percentage = Math.abs((diff / previous) * 100);

  if (diff > 0) {
    return [`<i class="fas fa-arrow-up"></i> Naik ${percentage.toFixed(0)}% vs bln lalu`, 'stat-down'];
  } else if (diff < 0) {
    return [`<i class="fas fa-arrow-down"></i> Turun ${Math.abs(percentage).toFixed(0)}% vs bln lalu`, 'stat-up'];
  } else {
    return ['<i class="fas fa-equals"></i> Sama vs bln lalu', 'stat-same'];
  }
}

function getPreviousMonth() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth(); 

  if (currentMonthIndex === 0) { 
    return [currentYear - 1, 12]; 
  } else {
    return [currentYear, currentMonthIndex]; 
  }
}

function showInfoModal(title, message) {
    const modalEl = document.getElementById('infoModal');
    if (!modalEl) return;

    const modalTitleEl = document.getElementById('infoModalLabel');
    const modalBodyEl = document.getElementById('infoModalBody');

    if (modalTitleEl) modalTitleEl.textContent = title;
    if (modalBodyEl) modalBodyEl.innerHTML = message; 

    if (!infoModalInstance) {
        infoModalInstance = new bootstrap.Modal(modalEl);
    }
    infoModalInstance.show();
}

function renderCategoryExpenseChart() {
  const currentUser = localStorage.getItem('currentUser');
  const currentMonth = getCurrentMonth();
  const currentYear = getCurrentYear();
  const expensesKey = `expenses_${currentUser}_${currentYear}_${currentMonth}`;
  const expenses = JSON.parse(localStorage.getItem(expensesKey)) || [];

  if (!Array.isArray(expenses)) return;

  const grouped = expenses.reduce((acc, exp) => {
    acc[exp.kategori] = acc[exp.kategori] || 0;
    acc[exp.kategori] += exp.amount;
    return acc;
  }, {});

  const labels = Object.keys(grouped);
  const data = labels.map(label => grouped[label]);

  const ctx = document.getElementById('category-expense-chart')?.getContext('2d');
   if (!ctx) return; 

  if (categoryExpenseChart instanceof Chart) {
    categoryExpenseChart.destroy();
  }

  categoryExpenseChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'Pengeluaran per Kategori (Rp)',
        data: data,
        backgroundColor: generateBrightColorPalette(labels.length),
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#333333' },
          position: 'right',
        },
        title: {
          display: true,
          text: 'Pengeluaran per Kategori',
          color: '#333333'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = data.reduce((sum, val) => sum + val, 0);
              const value = context.parsed;
              const percentage = total === 0 ? 0 : ((value / total) * 100).toFixed(2);
              const label = context.label ? capitalizeFirstLetter(context.label) : '';
              return `${label}: Rp${value.toLocaleString('id-ID')} (${percentage}%)`;
            }
          }
        }
      },
      onClick: (evt, activeElements) => {
        if (activeElements.length > 0) {
          const index = activeElements[0].index;
          const selectedKategori = labels[index];
          showCategoryDetails(selectedKategori); 
        }
      },
      onHover: (event, chartElement) => {
        const canvas = event.native.target;
        canvas.style.cursor = chartElement[0] ? 'pointer' : 'default';
      }
    },
  });
}

function showCategoryDetails(kategori) {
  const currentUser = localStorage.getItem('currentUser');
  const currentMonth = getCurrentMonth();
  const currentYear = getCurrentYear();
  const expensesKey = `expenses_${currentUser}_${currentYear}_${currentMonth}`;
  const expenses = JSON.parse(localStorage.getItem(expensesKey)) || [];

  const filteredExpenses = expenses.filter(exp => exp.kategori.toLowerCase() === kategori.toLowerCase());

  const oldModal = document.getElementById('categoryDetailModal');
  if (oldModal) {
     const modalInstance = bootstrap.Modal.getInstance(oldModal);
     if (modalInstance) {
         modalInstance.hide();
     }
    oldModal.remove();
  }

  const modal = document.createElement('div');
  modal.classList.add('modal', 'fade');
  modal.setAttribute('tabindex', '-1');
  modal.id = 'categoryDetailModal'; 
  modal.innerHTML = `
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Komposisi Barang - ${capitalizeFirstLetter(kategori)}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
           <div class="chart-container" style="height: 400px; width: 100%; margin-top: 0; padding: 10px; position: relative;">
             <button class="fullscreen-button category-detail-fullscreen-btn">
                <i class="fas fa-expand"></i>
             </button>
             <canvas id="category-detail-chart"></canvas>
           </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const ctx = modal.querySelector('#category-detail-chart')?.getContext('2d');
  if (!ctx) return;

  const groupedBarang = filteredExpenses.reduce((acc, exp) => {
    acc[exp.barang] = acc[exp.barang] || 0;
    acc[exp.barang] += exp.amount;
    return acc;
  }, {});

  const labels = Object.keys(groupedBarang);
  const data = labels.map(label => groupedBarang[label]);

  const detailChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        label: 'Pengeluaran Barang (Rp)',
        data: data,
        backgroundColor: generateBrightColorPalette(labels.length),
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#333333' },
          position: 'right',
        },
        title: {
          display: true,
          text: `Komposisi Barang: ${capitalizeFirstLetter(kategori)}`,
          color: '#333333'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = data.reduce((sum, val) => sum + val, 0);
              const value = context.parsed;
              const percentage = total === 0 ? 0 : ((value / total) * 100).toFixed(2);
              const label = context.label ? capitalizeFirstLetter(context.label) : '';
              return `${label}: Rp${value.toLocaleString('id-ID')} (${percentage}%)`;
            }
          }
        }
      },
      onClick: null,
      onHover: null
    },
  });

   modal.querySelector('.category-detail-fullscreen-btn')?.addEventListener('click', () => {
       handleFullscreenClick(detailChart);
   });


  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();

  modal.addEventListener('hidden.bs.modal', () => {
    if (detailChart) detailChart.destroy(); 
    modal.remove();
  });
}

// render bagian riwayat pengeluaran
function renderHistoryContent() {
  const selectedMonth = document.getElementById('history-month')?.value;
  const selectedYear = document.getElementById('history-year')?.value;
  const historyContent = document.getElementById('history-content');
  if (!historyContent) return; 
  historyContent.innerHTML = ''; 

  if (!selectedMonth || !selectedYear) {
    historyContent.innerHTML = '<p class="text-muted text-center">Silakan pilih tahun dan bulan untuk melihat riwayat pengeluaran.</p>';
    return;
  }

  const currentUser = localStorage.getItem('currentUser');
  const expensesKey = `expenses_${currentUser}_${selectedYear}_${selectedMonth}`;
  const expenses = JSON.parse(localStorage.getItem(expensesKey)) || [];

  if (expenses.length === 0) {
    historyContent.innerHTML = '<p class="text-muted text-center">Tidak ada data pengeluaran untuk bulan ini.</p>';
    return;
  }

  const groupedByCategory = expenses.reduce((acc, exp) => {
    acc[exp.kategori] = acc[exp.kategori] || 0;
    acc[exp.kategori] += exp.amount;
    return acc;
  }, {});
  const total = Object.values(groupedByCategory).reduce((sum, val) => sum + val, 0);
  
  const daysWithExpenses = new Set(expenses.map(exp => {
      const dateObj = new Date(exp.date);
      return !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('id-ID') : null;
  })).size;
  
  const average = daysWithExpenses > 0 ? (total / daysWithExpenses) : 0;

  let maxExpense = { amount: 0, kategori: '-', barang: '-', date: '' };
  let minExpense = { amount: Infinity, kategori: '-', barang: '-', date: '' };
  expenses.forEach(exp => {
    if (exp.amount > maxExpense.amount) {
      maxExpense = { ...exp, date: new Date(exp.date).toLocaleDateString('id-ID') };
    }
    if (exp.amount > 0 && exp.amount < minExpense.amount) {
      minExpense = { ...exp, date: new Date(exp.date).toLocaleDateString('id-ID') };
    }
  });
   if (minExpense.amount === Infinity) minExpense = { amount: Infinity, kategori: '-', barang: '-', date: '-' };


  const statsHtml = `
    <div class="statistic-container mb-3">
        <h5 class="mb-3 text-primary text-center">Ringkasan Bulan ${capitalizeFirstLetter(getMonthName(selectedMonth))} ${selectedYear}</h5>
        <ul class="list-group">
            <li class="list-group-item">
                <div><i class="fas fa-wallet me-2 text-primary"></i>Total Pengeluaran</div>
                <div><span class="badge bg-primary rounded-pill">Rp${total.toLocaleString('id-ID')}</span></div>
            </li>
            <li class="list-group-item">
                <div><i class="fas fa-calculator me-2 text-secondary"></i>Rata-rata Harian</div>
                <div><span class="badge bg-secondary rounded-pill">Rp${Math.round(average).toLocaleString('id-ID')}</span></div>
            </li>
            <li class="list-group-item">
                <div><i class="fas fa-arrow-trend-up me-2 text-danger"></i>Pengeluaran Tertinggi (1x)</div>
                <div><span class="badge bg-danger rounded-pill">${capitalizeFirstLetter(maxExpense.barang)} <small>(${maxExpense.date})</small></span></div>
            </li>
            <li class="list-group-item">
                <div><i class="fas fa-arrow-trend-down me-2 text-success"></i>Pengeluaran Terendah (1x)</div>
                <div><span class="badge bg-success rounded-pill">${capitalizeFirstLetter(minExpense.barang)} <small>(Rp${minExpense.amount !== Infinity ? minExpense.amount.toLocaleString('id-ID') : '0'})</small></span></div>
            </li>
        </ul>
    </div>
  `;
  historyContent.innerHTML += statsHtml;

  const dailyExpenses = expenses.reduce((acc, exp) => {
    const dateObj = new Date(exp.date);
     if (isNaN(dateObj.getTime())) return acc; 
    const date = dateObj.toLocaleDateString('id-ID');
    acc[date] = (acc[date] || 0) + exp.amount;
    return acc;
  }, {});

  const allDates = getAllDatesInMonth(selectedYear, selectedMonth);
  const labelsDaily = allDates.map(date => date.toLocaleDateString('id-ID'));
  const dataDaily = allDates.map(date => {
    const formattedDate = date.toLocaleDateString('id-ID');
    return dailyExpenses[formattedDate] || 0;
  });

  const historyDailyContainer = document.createElement('div');
  historyDailyContainer.className = 'chart-container';
  historyDailyContainer.style.height = '300px';
  historyDailyContainer.innerHTML = `
      <button class="fullscreen-button" data-chart-target="history-daily-chart">
          <i class="fas fa-expand"></i>
      </button>
      <canvas id="history-daily-chart"></canvas>
  `;
  historyContent.appendChild(historyDailyContainer);
  const historyDailyCtx = historyDailyContainer.querySelector('#history-daily-chart')?.getContext('2d');

  if (historyDailyExpenseChart instanceof Chart) {
    historyDailyExpenseChart.destroy();
  }

  if (historyDailyCtx) {
    historyDailyExpenseChart = new Chart(historyDailyCtx, {
      type: 'line',
      data: {
        labels: labelsDaily,
        datasets: [{
          label: 'Pengeluaran Harian (Rp)',
          data: dataDaily,
          fill: true,
          backgroundColor: 'rgba(75, 0, 130, 0.2)',
          borderColor: '#4b0082',
          tension: 0.4,
          pointBackgroundColor: '#4b0082',
          pointBorderColor: '#4b0082'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: '#333333' } },
          title: { display: true, text: `Grafik Harian (${getMonthName(selectedMonth)} ${selectedYear})`, color: '#333333' },
          tooltip: {
            callbacks: { label: (c) => `Rp${c.parsed.y.toLocaleString('id-ID')}` }
          }
        },
        scales: {
          x: { ticks: { color: '#333333' }, grid: { color: '#e0e0e0' } },
          y: { ticks: { color: '#333333' }, grid: { color: '#e0e0e0' }, title: { display: true, text: 'Jumlah (Rp)' } }
        },
        onClick: null,
        onHover: null
      },
    });
  }

  const categoryLabels = Object.keys(groupedByCategory);
  const categoryData = categoryLabels.map(label => groupedByCategory[label]);

  const historyCategoryContainer = document.createElement('div');
  historyCategoryContainer.className = 'chart-container';
  historyCategoryContainer.style.height = '300px';
  historyCategoryContainer.innerHTML = `
      <button class="fullscreen-button" data-chart-target="history-category-chart">
          <i class="fas fa-expand"></i>
      </button>
      <canvas id="history-category-chart"></canvas>
  `;
  historyContent.appendChild(historyCategoryContainer);
  const historyCategoryCtx = historyCategoryContainer.querySelector('#history-category-chart')?.getContext('2d');

  if (historyCategoryExpenseChart instanceof Chart) {
    historyCategoryExpenseChart.destroy();
  }

  if (historyCategoryCtx) {
    historyCategoryExpenseChart = new Chart(historyCategoryCtx, {
      type: 'pie',
      data: {
        labels: categoryLabels,
        datasets: [{
          label: 'Pengeluaran per Kategori (Rp)',
          data: categoryData,
          backgroundColor: generateBrightColorPalette(categoryLabels.length),
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#333333' }, position: 'right' },
          title: { display: true, text: `Kategori (${getMonthName(selectedMonth)} ${selectedYear})`, color: '#333333' },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = categoryData.reduce((sum, val) => sum + val, 0);
                const value = context.parsed;
                const percentage = total === 0 ? 0 : ((value / total) * 100).toFixed(2);
                const label = context.label ? capitalizeFirstLetter(context.label) : '';
                return `${label}: Rp${value.toLocaleString('id-ID')} (${percentage}%)`;
              }
            }
          }
        },
        onClick: null,
        onHover: null
      },
    });
  }
}

// form submit cetak PDF
function handlePrintExpense(e) {
  e.preventDefault();
  const printYear = document.getElementById('print-year')?.value;
  const printMonth = document.getElementById('print-month')?.value;
  const tujuanPengeluaran = document.getElementById('tujuan-pengeluaran')?.value.trim();
  const targetInput = document.getElementById('print-monthly-target')?.value.trim();
  const currentUser = localStorage.getItem('currentUser');
  if (!printYear || !printMonth || !tujuanPengeluaran || !targetInput || !currentUser) {
       showNotification('Silakan isi semua bidang dengan benar.', 'danger');
       return;
  }

  const targetNumber = parseFloat(targetInput);
  if (isNaN(targetNumber)) {
    showNotification('Silakan isi saldo awal dengan benar.', 'danger');
    return;
  }

  const expensesKey = `expenses_${currentUser}_${printYear}_${printMonth}`;
  const expenses = JSON.parse(localStorage.getItem(expensesKey)) || [];

  if (expenses.length === 0) {
    showNotification('Tidak ada data pengeluaran untuk periode ini.', 'danger');
    return;
  }

  showPrintAnimation();

  setTimeout(() => {
    generateRekapDataPDF(printYear, printMonth, currentUser, expenses, targetNumber, tujuanPengeluaran);
    hidePrintAnimation();
  }, 4000);
}

function showPrintAnimation() {
  const printAnimation = document.getElementById('print-animation');
  if (printAnimation) printAnimation.style.display = 'flex';
}

function hidePrintAnimation() {
  const printAnimation = document.getElementById('print-animation');
   if (printAnimation) printAnimation.style.display = 'none';
}

function renderDashboard() {
  if (document.getElementById('expenses-ul')) renderExpensesList();
  if (document.getElementById('daily-expense-chart')) renderDailyExpenseChart();
  if (document.getElementById('category-expense-chart')) renderCategoryExpenseChart();
  
  initializeCategoryExpenseEnhanced();
  checkBudgetAlert(); 
}

function renderDompetPage() {
    updateSaldoDisplay(); 
    updateBudgetDisplay(); 
    checkBudgetAlert();
}

function handleResetTunai() {
    showCustomConfirm(
        "Konfirmasi Reset Saldo", 
        "Anda yakin ingin mereset saldo <strong>Dompet (Tunai)</strong> menjadi Rp0?", 
        () => { 
            let saldo = getSaldo();
            saldo.tunai = 0;
            saveSaldo(saldo);
            renderDompetPage(); 
            showNotification("Saldo Dompet (Tunai) berhasil direset.", "success");
        }
    );
}

function handleResetBank() {
    showCustomConfirm(
        "Konfirmasi Reset Saldo", 
        "Anda yakin ingin mereset saldo <strong>Bank (Non-Tunai)</strong> menjadi Rp0?", 
        () => { 
            let saldo = getSaldo();
            saldo.bank = 0;
            saveSaldo(saldo);
            renderDompetPage(); 
            showNotification("Saldo Bank (Non-Tunai) berhasil direset.", "success");
        }
    );
}

// simpan budget bulanan dari modal
function handleSaveBudget(e) {
    e.preventDefault();
    const budgetInput = document.getElementById('budget-jumlah');
    if (!budgetInput) return;

    const budgetAmount = parseFloat(budgetInput.value);
    if (isNaN(budgetAmount) || budgetAmount < 0) {
        showNotification("Masukkan jumlah budget yang valid.", "warning");
        return;
    }

    // validasi jgn sampe budget lebih gede dari saldo
    const saldo = getSaldo(); 
    const totalSaldo = saldo.tunai + saldo.bank;

    if (budgetAmount > totalSaldo) {
        showNotification(`Budget (Rp${budgetAmount.toLocaleString('id-ID')}) tidak boleh melebihi Total Saldo Anda (Rp${totalSaldo.toLocaleString('id-ID')}).`, "danger");
        return; 
    }

    saveBudget(budgetAmount); 
    showNotification("Budget bulanan berhasil disimpan!", "success");
    budgetModal.hide(); 
    
    renderDompetPage();
}

function showCustomConfirm(title, message, onConfirm) {
    const titleEl = document.getElementById('custom-confirm-title');
    const bodyEl = document.getElementById('custom-confirm-body');
    const headerEl = document.getElementById('custom-confirm-header');

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = message; 

    if(headerEl) {
        headerEl.classList.add('bg-danger', 'text-white');
    }

    onConfirmCallback = onConfirm; 
    if (customConfirmModal) customConfirmModal.show();
}

function handleResetBudget() {
    showCustomConfirm(
        "Konfirmasi Reset Budget",
        "Anda yakin ingin mereset <strong>Budget Bulan Ini</strong>? Anda harus mengaturnya lagi.",
        () => { 
            const currentUser = localStorage.getItem('currentUser');
            const currentMonthKey = `${getCurrentYear()}-${getCurrentMonth()}`;
            if (!currentUser) return;
            const key = `budget_${currentUser}_${currentMonthKey}`;
            
            localStorage.removeItem(key); 
            
            renderDompetPage(); 
            showNotification("Budget bulan ini telah direset.", "success");
        }
    );
}

// show animasi ketika nambah pemasukan tunai/bank
function showPemasukanAnimation(tipeTujuan) {
    const overlay = document.getElementById('pemasukan-animation');
    const textElement = document.getElementById('pemasukan-anim-text');
    
    if (overlay) {
        overlay.classList.remove('anim-tunai', 'anim-bank');
        
        if (tipeTujuan === 'tunai') {
            if(textElement) textElement.textContent = "Menyimpan ke Dompet...";
            overlay.classList.add('anim-tunai'); 
        } else {
            if(textElement) textElement.textContent = "Menyimpan ke Bank...";
            overlay.classList.add('anim-bank'); 
        }
        
        overlay.style.display = 'flex';
        
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.classList.remove('anim-tunai', 'anim-bank');
        }, 2500); 
    }
}

function getMonthlyExpenseDetails() {
    const currentUser = localStorage.getItem('currentUser');
    const currentMonth = getCurrentMonth();
    const currentYear = getCurrentYear();
    const expensesKey = `expenses_${currentUser}_${currentYear}_${currentMonth}`;
    let expenses = [];
    try {
        expenses = JSON.parse(localStorage.getItem(expensesKey)) || [];
    } catch (e) { expenses = []; }
    
    const pengeluaranTunai = expenses
        .filter(exp => exp.sumber === 'tunai')
        .reduce((sum, exp) => sum + exp.amount, 0);
    const pengeluaranBank = expenses
        .filter(exp => exp.sumber === 'bank')
        .reduce((sum, exp) => sum + exp.amount, 0);
        
    return { expenses, pengeluaranTunai, pengeluaranBank };
}

function updateExpenditureVsSaldoBar() {
    const selectBtn = document.getElementById('expenditure-saldo-select');
    const compareType = selectBtn ? selectBtn.getAttribute('data-current-value') || 'tunai' : 'tunai';

    const bar = document.getElementById('exp-saldo-progress-bar');
    const percentText = document.getElementById('exp-saldo-percentage');
    const infoText = document.getElementById('exp-saldo-info-text');

    if (!bar || !percentText || !infoText) return; 

    const { pengeluaranTunai, pengeluaranBank } = getMonthlyExpenseDetails();
    const totalPengeluaran = pengeluaranTunai + pengeluaranBank;
    const saldo = getSaldo();

    const totalAvailableTunai = saldo.tunai + pengeluaranTunai;
    const totalAvailableBank = saldo.bank + pengeluaranBank;
    const totalAvailableGabungan = totalAvailableTunai + totalAvailableBank;

    let totalAvailable = 0;
    let label = "Tunai";

    if (compareType === 'tunai') {
        totalAvailable = totalAvailableTunai;
        label = "Total Tunai";
    } else if (compareType === 'bank') {
        totalAvailable = totalAvailableBank;
        label = "Total Bank";
    } else { 
        totalAvailable = totalAvailableGabungan;
        label = "Total Saldo";
    }

    const percentage = (totalAvailable > 0) ? (totalPengeluaran / totalAvailable) * 100 : 0;
    
    bar.style.width = `${Math.min(100, percentage)}%`;
    percentText.textContent = `${percentage.toFixed(0)}%`;
    infoText.textContent = `Total Keluar Rp${totalPengeluaran.toLocaleString('id-ID')} / ${label} Rp${totalAvailable.toLocaleString('id-ID')}`;
    
    bar.classList.remove('bg-danger', 'bg-warning'); 
    
    // warnain progress bar berdasar persen
    if (percentage >= 90) {
        bar.classList.add('bg-danger');
    } else if (percentage >= 70) {
        bar.classList.add('bg-warning');
    }
}

function handleTambahPemasukan(e) {
    e.preventDefault();
    const jumlahInput = document.getElementById('pemasukan-jumlah');
    const keteranganInput = document.getElementById('pemasukan-keterangan');
    const tujuan = document.querySelector('input[name="pemasukan-tujuan"]:checked');
    
    if (!jumlahInput || !tujuan) return;

    const jumlah = parseFloat(jumlahInput.value);
    if (isNaN(jumlah) || jumlah <= 0) {
        showNotification("Masukkan jumlah pemasukan yang valid.", "warning");
        return;
    }

    const keterangan = keteranganInput.value || "Pemasukan";
    const tipeTujuan = tujuan.value; 

    let saldo = getSaldo();

    if (tipeTujuan === 'tunai') {
        saldo.tunai += jumlah;
    } else {
        saldo.bank += jumlah;
    }

    saveSaldo(saldo);
    
    pemasukanModal.hide(); 
    showPemasukanAnimation(tipeTujuan); 
    
    setTimeout(() => {
        showNotification(`Pemasukan Rp${jumlah.toLocaleString('id-ID')} ke ${tipeTujuan} berhasil!`, "success");
        renderDompetPage();
    }, 2500); 

    document.getElementById('pemasukan-form').reset();
}

function handleTransferInternal(e) {
    e.preventDefault();
    const jumlahInput = document.getElementById('transfer-jumlah');
    if (!jumlahInput) return;

    const jumlah = parseFloat(jumlahInput.value);
    let saldo = getSaldo();

    if (isNaN(jumlah) || jumlah <= 0) {
        showNotification("Masukkan jumlah transfer yang valid.", "warning");
        return;
    }
    if (jumlah > saldo.bank) {
        showNotification("Saldo Bank Anda tidak mencukupi untuk transfer ini.", "danger");
        return;
    }

    saldo.bank -= jumlah;
    saldo.tunai += jumlah;

    saveSaldo(saldo);
    
    transferModal.hide();
    showTransferAnimation(); 
    
    setTimeout(() => {
        showNotification(`Rp${jumlah.toLocaleString('id-ID')} berhasil dipindah ke Dompet.`, "success");
        renderDompetPage();
    }, 2500); 

    document.getElementById('transfer-form').reset();
}

function resetAnalysisViews() {
    // reset anomali dom
    const anomalyLoading = document.getElementById('anomali-loading');
    const anomalyNoData = document.getElementById('anomali-no-data');
    const chartContainer = document.getElementById('anomali-chart-container');
    if (anomalyChart instanceof Chart) { anomalyChart.destroy(); anomalyChart = null; }
    if (chartContainer) chartContainer.style.height = '400px'; 
    if (anomalyLoading) anomalyLoading.style.display = 'none';
    if (anomalyNoData) anomalyNoData.style.display = 'none';
    const anomDescCollapse = document.getElementById('anomali-description-collapse');
    if (anomDescCollapse) {
        const bsCollapse = bootstrap.Collapse.getInstance(anomDescCollapse);
        if (bsCollapse) bsCollapse.hide();
    }
    const insightContent = document.getElementById('anomali-insight-content');
    if(insightContent) insightContent.innerHTML = '';

    // reset prediksi
    const predictionResults = document.getElementById('prediksi-results-container');
    const predictionAnimation = document.getElementById('prediksi-processing-animation'); 
    const predictionInsight = document.getElementById('prediksi-insight-content'); 
    const predictionNoData = document.getElementById('prediksi-no-data');
    const predictionForm = document.getElementById('prediksi-form');

    if (predictionResults) predictionResults.style.display = 'none';
    if (predictionAnimation) predictionAnimation.style.display = 'none';
    if (predictionInsight) {
        predictionInsight.style.display = 'none';
        predictionInsight.innerHTML = ''; 
    }
    if (predictionNoData) predictionNoData.style.display = 'none';

    if (predictionForm) {
        document.getElementById('prediksi-kriteria-1').value = '';
        document.getElementById('enable-kriteria-2').checked = false;
        
        if (typeof updatePredictionValueOptions === 'function') {
            updatePredictionValueOptions(document.getElementById('prediksi-kriteria-1'), document.getElementById('prediksi-nilai-1'), allUserExpensesCache);
        }
        if (typeof handleEnableKriteria2Change === 'function') { 
             handleEnableKriteria2Change();
        }
        if (typeof updatePredictionButtonState === 'function') {
            updatePredictionButtonState();
        }
    }
}

// proses deteksi otomatis untuk bulan ini doang
function loadAndRunAnomalyDetection() {
    const loadingEl = document.getElementById('anomali-loading');
    const noDataEl = document.getElementById('anomali-no-data');
    const chartContainer = document.getElementById('anomali-chart-container');
    const insightContent = document.getElementById('anomali-insight-content');

    const collapseEl = document.getElementById('anomali-description-collapse');
    const bsCollapse = bootstrap.Collapse.getInstance(collapseEl);

    if (loadingEl) loadingEl.style.display = 'flex';
    if (noDataEl) noDataEl.style.display = 'none';
    if (anomalyChart instanceof Chart) { anomalyChart.destroy(); anomalyChart = null; }
    if (chartContainer) chartContainer.style.height = '400px';

    if (insightContent) insightContent.innerHTML = ''; 
    if (bsCollapse) bsCollapse.hide(); 

    const currentMonth = getCurrentMonth();
    const currentYear = getCurrentYear();

    setTimeout(() => {
        if (!analysisDataLoaded || allUserExpensesCache.length === 0) {
            console.log("Loading all user expenses for anomaly detection...");
            allUserExpensesCache = getAllUserExpenses();
            analysisDataLoaded = true;
        }

        if (loadingEl) loadingEl.style.display = 'none';

        if (allUserExpensesCache.length < 10) {
            console.log("Not enough total data for anomaly detection.");
            if (noDataEl) {
                noDataEl.style.display = 'flex';
                noDataEl.querySelector('p').textContent = "Data historis total (min. 10) tidak cukup.";
            }
            if (chartContainer) chartContainer.style.height = '150px';
            return;
        }

        const expensesForCurrentMonth = allUserExpensesCache.filter(exp => {
            const date = new Date(exp.date);
            return date.getFullYear() == currentYear && (date.getMonth() + 1) == currentMonth;
        });

        if (expensesForCurrentMonth.length < 5) {
             console.log("Not enough data for current month.");
             if (noDataEl) {
                noDataEl.style.display = 'flex';
                noDataEl.querySelector('p').textContent = "Data bulan ini tidak cukup untuk analisis (min. 5).";
            }
             if (chartContainer) chartContainer.style.height = '150px';
             return;
        }

        populateAnomalyCategoryFilter(expensesForCurrentMonth);

        const { anomalies, categoryBounds } = detectSpendingAnomalies(allUserExpensesCache, expensesForCurrentMonth);
        
        renderAnomalyChart(anomalies, expensesForCurrentMonth, categoryBounds); 
        renderAnomalyInsight(anomalies, expensesForCurrentMonth.length);

    }, 250); 
}

function loadAndSetupPrediction() {
    const kriteria1Select = document.getElementById('prediksi-kriteria-1');
    const predictButton = document.getElementById('btn-prediksi');
    const noDataEl = document.getElementById('prediksi-no-data'); 

    const predictionResultsContainer = document.getElementById('prediksi-results-container');
    if (predictionResultsContainer) predictionResultsContainer.style.display = 'none';
    if (predictionChart instanceof Chart) { predictionChart.destroy(); predictionChart = null; }
    const predictionDescContent = document.getElementById('prediksi-description-content');
    if (predictionDescContent) predictionDescContent.innerHTML = '';
    const predDescCollapse = document.getElementById('prediksi-description-collapse');
    if (predDescCollapse) bootstrap.Collapse.getInstance(predDescCollapse)?.hide();
    
    if (noDataEl) noDataEl.style.display = 'none'; 

    if (!analysisDataLoaded || allUserExpensesCache.length === 0) {
        console.log("Loading all user expenses for prediction setup...");
        showLoading("Memuat data histori...");
        setTimeout(() => {
            allUserExpensesCache = getAllUserExpenses();
            analysisDataLoaded = true;
            hideLoading();
            if (allUserExpensesCache.length < 10) { 
                showNotification("Data historis belum cukup untuk prediksi.", "warning");
                if (kriteria1Select) kriteria1Select.disabled = true;
                if (predictButton) predictButton.disabled = true;
            } else {
                setupPredictionForm(allUserExpensesCache);
            }
        }, 100);
    } else {
        console.log("Using cached user expenses for prediction setup.");
        if (allUserExpensesCache.length < 10) {
            showNotification("Data historis belum cukup untuk prediksi.", "warning");
            if (kriteria1Select) kriteria1Select.disabled = true;
            if (predictButton) predictButton.disabled = true;
        } else {
            setupPredictionForm(allUserExpensesCache);
        }
    }
}


function detectSpendingAnomalies(allExpenses, currentMonthExpenses) {
    console.log("Detecting anomalies...");
    const anomalies = [];
    const expensesByCategory = allExpenses.reduce((acc, exp) => {
        const key = exp.kategori ? exp.kategori.toLowerCase() : 'tanpa_kategori'; 
        if (!acc[key]) acc[key] = [];
        const amount = parseFloat(exp.amount);
        if (!isNaN(amount)) {
             acc[key].push(amount);
        }
        return acc;
    }, {});

    const categoryBounds = {}; 

    for (const category in expensesByCategory) {
        const prices = expensesByCategory[category].sort((a, b) => a - b);
        if (prices.length < 5) continue; 

        const q1Index = Math.floor(prices.length / 4);
        const q3Index = Math.ceil(prices.length * (3 / 4)) - 1; 
        const q1 = prices[q1Index];
        const q3 = prices[q3Index];
        const iqr = q3 - q1;
        
        const lowerBound = Math.max(0, q1 - (1.5 * iqr)); 
        const upperBound = q3 + (1.5 * iqr);

        categoryBounds[category] = { 
            lower: Math.round(lowerBound), 
            upper: Math.round(upperBound)  
        };

        currentMonthExpenses.forEach(exp => {
            const expCategoryKey = exp.kategori ? exp.kategori.toLowerCase() : 'tanpa_kategori';
            const expAmount = parseFloat(exp.amount); 

            if (expCategoryKey === category && !isNaN(expAmount)) { 
                // cek apakah ngaco harganya (di luar range iqr)
                if (expAmount < lowerBound || expAmount > upperBound) {
                    console.log("Anomaly found:", exp);
                    anomalies.push({
                        ...exp, 
                        normalLower: Math.round(lowerBound), 
                        normalUpper: Math.round(upperBound)
                    });
                }
            }
        });
    }
    console.log("Category bounds calculated:", categoryBounds);
    console.log("Total anomalies found:", anomalies.length);
    
    return { anomalies, categoryBounds }; 
}

function populateAnomalyCategoryFilter(currentMonthExpenses) {
    const filterSelect = document.getElementById('anomali-kategori-filter');
    if (!filterSelect) return;

    const currentValue = filterSelect.value;

    const categories = new Set(currentMonthExpenses.map(exp => 
        exp.kategori ? capitalizeFirstLetter(exp.kategori) : 'Lainnya'
    ));

    filterSelect.innerHTML = '<option value="semua" selected>Tampilkan Semua Kategori</option>';

    Array.from(categories).sort().forEach(cat => {
        const option = document.createElement('option');
        option.value = cat; 
        option.textContent = cat;
        filterSelect.appendChild(option);
    });

    if (filterSelect.querySelector(`option[value="${currentValue}"]`)) {
        filterSelect.value = currentValue;
    }
}

// jalankan filter pas dropdown onchange
function filterAnomalyChart() {
    if (!anomalyChart || !anomalyChart.originalData) {
        return; 
    }

    const filterSelect = document.getElementById('anomali-kategori-filter');
    if (!filterSelect) return;

    const selectedCategory = filterSelect.value;

    const originalNormalData = anomalyChart.originalData.normal;
    const originalAnomalyData = anomalyChart.originalData.anomaly;

    if (selectedCategory === 'semua') {
        anomalyChart.data.datasets[0].data = originalNormalData;
        anomalyChart.data.datasets[1].data = originalAnomalyData;
    } else {
        const filteredNormal = originalNormalData.filter(p => p.category === selectedCategory);
        const filteredAnomaly = originalAnomalyData.filter(p => p.category === selectedCategory);
        
        anomalyChart.data.datasets[0].data = filteredNormal;
        anomalyChart.data.datasets[1].data = filteredAnomaly;
    }

    anomalyChart.update();
}


function renderAnomalyChart(anomalies, currentMonthExpenses, categoryBounds) {
    const ctx = document.getElementById('anomali-chart')?.getContext('2d');
    if (!ctx) { 
        console.error("Anomaly chart canvas not found!"); 
        return; 
    }
    if (anomalyChart instanceof Chart) { 
        anomalyChart.destroy(); 
    }

    const normalData = [];
    const anomalyData = [];
    const anomalyIds = new Set(anomalies.map(a => a.id));

    currentMonthExpenses.forEach(exp => {
        try {
            const expenseDate = new Date(exp.date);
            const expenseAmount = parseFloat(exp.amount);

            if (!exp || !exp.date || !exp.amount || isNaN(expenseDate.getTime()) || isNaN(expenseAmount) || expenseAmount <= 0) {
                console.warn("Skipping invalid expense:", exp);
                return;
            }
            
            const expCategoryKey = (exp.kategori || 'tanpa_kategori').toLowerCase();
            const bounds = categoryBounds ? categoryBounds[expCategoryKey] : null;

            const dataPoint = {
                x: expenseDate, 
                y: expenseAmount,
                label: `${capitalizeFirstLetter(exp.barang || 'Unknown')} (${capitalizeFirstLetter(exp.kategori || 'Unknown')})`,
                category: capitalizeFirstLetter(exp.kategori || 'Lainnya'),
                normalLower: bounds ? bounds.lower : 0,
                normalUpper: bounds ? bounds.upper : Infinity 
            };

            if (anomalyIds.has(exp.id)) {
                anomalyData.push(dataPoint);
            } else {
                normalData.push(dataPoint);
            }
        } catch (error) {
            console.error("Error processing expense for chart:", exp, error);
        }
    });

    try {
        anomalyChart = new Chart(ctx, {
            type: 'line', 
            data: {
                datasets: [
                    {
                        label: 'Normal',
                        data: normalData,
                        backgroundColor: 'rgba(15, 12, 227, 0.7)',
                        borderColor:  'rgba(15, 12, 227, 0.7)',
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        pointStyle: 'circle',
                        showLine: false 
                    },
                    {
                        label: 'Anomali',
                        data: anomalyData,
                        backgroundColor: 'rgba(255, 0, 25, 0.7)',
                        borderColor: 'rgba(255, 0, 25, 0.7)',
                        pointRadius: 8,
                        pointHoverRadius: 10,
                        pointStyle: 'triangle',
                        showLine: false 
                    }
                ]
            },
            options: {
                responsive: true, 
                maintainAspectRatio: false,
                onClick: (evt, activeElements) => {
                    if (activeElements.length > 0) {
                        const dataIndex = activeElements[0].index;
                        const datasetIndex = activeElements[0].datasetIndex;
                        const clickedPoint = anomalyChart.data.datasets[datasetIndex].data[dataIndex];
                        
                        if (clickedPoint) {
                            const category = clickedPoint.category;
                            const lower = clickedPoint.normalLower;
                            const upper = clickedPoint.normalUpper;
                            const amount = clickedPoint.y;
                            const item = clickedPoint.label.split(' (')[0]; 
                            const dateObj = clickedPoint.x;
                            const formattedDate = dateObj.toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'long', year: 'numeric'
                            });

                            const title = `Detail Transaksi`;
                            const message = `
                                <div style="text-align: left; line-height: 1.6;">
                                    <strong>Barang:</strong> ${item}<br>
                                    <strong>Tanggal:</strong> ${formattedDate}<br>
                                    <strong>Jumlah:</strong> Rp${amount.toLocaleString('id-ID')}
                                    <hr style="margin: 8px 0;">
                                    <strong>Kategori:</strong> ${category}<br>
                                    <strong>Batas Normal Kategori:</strong><br>
                                    Rp${lower.toLocaleString('id-ID')} - Rp${upper.toLocaleString('id-ID')}
                                </div>
                            `;
                            showInfoModal(title, message);
                        }
                    }
                },
                onHover: (event, chartElement) => {
                    const canvas = event.native.target;
                    canvas.style.cursor = chartElement[0] ? 'pointer' : 'default';
                },
                scales: {
                    x: {
                        type: 'time', 
                        time: { 
                            unit: 'day', 
                            tooltipFormat: 'dd MMM yyyy',
                            displayFormats: {
                                day: 'dd MMM'
                            }
                        },
                        title: { display: true, text: 'Tanggal' },
                        grid: {
                            color: '#e9ecef',
                            drawBorder: false,
                            borderDash: [2, 3]
                        },
                        ticks: {
                            display: true,
                            color: '#333333',
                            autoSkip: true, 
                            autoSkipPadding: 15, 
                            maxRotation: 45,
                            minRotation: 0
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Jumlah Pengeluaran (Rp)' },
                        ticks: { 
                            callback: value => `Rp${Math.round(value).toLocaleString('id-ID')}` 
                        },
                        grid: {
                            color: '#e9ecef',
                            drawBorder: false,
                            borderDash: [2, 3]
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.raw.label || '';
                                return `${label}: Rp${Math.round(context.parsed.y).toLocaleString('id-ID')}`;
                            }
                        }
                    },
                    legend: { position: 'top' }
                }
            }
        });
        
        anomalyChart.originalData = {
            normal: normalData,
            anomaly: anomalyData
        };

    } catch (error) {
        console.error("Error creating anomaly chart:", error);
        showNotification("Gagal membuat grafik anomali.", "danger");
    }
}

// tulisan insight kecil yg muncul di bawah grafik
function renderAnomalyInsight(anomalies, totalTransactionsInMonth) {
    const insightContent = document.getElementById('anomali-insight-content');
    if (!insightContent) return;

    let insightHtml = '';
    const anomalyCount = anomalies.length;

    if (anomalyCount === 0) {
        // kalo aman ga ada anomali
        insightHtml = `
            <div class="alert alert-success p-2" role="alert">
                <h5 class="alert-heading mb-1" style="font-size: 1.1rem;">🎉 Luar Biasa!</h5>
                <p class="mb-0 small">
                    Tidak ada anomali terdeteksi dari <strong>${totalTransactionsInMonth}</strong> transaksi bulan ini. 
                    Pola pengeluaran Anda sangat konsisten!
                </p>
            </div>
        `;
    } else {
        const mostExpensiveAnomaly = anomalies.reduce((max, a) => a.amount > max.amount ? a : max, anomalies[0]);
        
        insightHtml = `
            <div class="alert alert-warning p-2" role="alert">
                <h5 class="alert-heading mb-1" style="font-size: 1.1rem;">🧐 Perhatian!</h5>
                <p class="mb-0 small">
                    Sistem mendeteksi <strong>${anomalyCount}</strong> transaksi anomali (ditandai 🌟) 
                    dari total <strong>${totalTransactionsInMonth}</strong> transaksi bulan ini.
                </p>
                <hr class="my-1 py-0">
                <p class="mb-0 small">
                    Anomali terbesar adalah pembelian <strong>"${capitalizeFirstLetter(mostExpensiveAnomaly.barang)}"</strong> 
                    seharga <strong>Rp${mostExpensiveAnomaly.amount.toLocaleString('id-ID')}</strong>.
                    <br>
                    Anda bisa <strong>klik titik</strong> di grafik untuk melihat detailnya.
                </p>
            </div>
        `;
    }
    
    insightContent.innerHTML = insightHtml;
    
    // auto buka tab insight kalo dapet anomali
    if (anomalyCount > 0) {
        const collapseEl = document.getElementById('anomali-description-collapse');
        const bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseEl);
        bsCollapse.show();
    }
}

function updatePredictionButtonState() {
    const kriteria1Select = document.getElementById('prediksi-kriteria-1');
    const nilai1Select = document.getElementById('prediksi-nilai-1');
    const enableKriteria2Checkbox = document.getElementById('enable-kriteria-2');
    const kriteria2Select = document.getElementById('prediksi-kriteria-2');
    const nilai2Select = document.getElementById('prediksi-nilai-2');
    const predictButton = document.getElementById('btn-prediksi');

    if (!kriteria1Select || !nilai1Select || !enableKriteria2Checkbox || !kriteria2Select || !nilai2Select || !predictButton) {
        return;
    }

    const k1 = kriteria1Select.value;
    const v1 = nilai1Select.value;
    const enabled2 = enableKriteria2Checkbox.checked;
    const k2 = kriteria2Select.value;
    const v2 = nilai2Select.value;

    let isButtonDisabled = true; 

    if (k1 && v1) { 
        if (enabled2) { 
            if (k2 && v2) { 
                isButtonDisabled = false;
            }
        } else { 
            isButtonDisabled = false;
        }
    }

    predictButton.disabled = isButtonDisabled;
}

function handleNilai2Change() {
    updatePredictionButtonState(); 
}

function setupPredictionForm(allExpenses) {
    const kriteria1Select = document.getElementById('prediksi-kriteria-1');
    const nilai1Select = document.getElementById('prediksi-nilai-1');
    const enableKriteria2Checkbox = document.getElementById('enable-kriteria-2');
    const kriteria2Group = document.getElementById('prediksi-kriteria-2-group'); 
    const kriteria2Inputs = document.getElementById('prediksi-kriteria-2-inputs');
    const kriteria2Select = document.getElementById('prediksi-kriteria-2');
    const nilai2Select = document.getElementById('prediksi-nilai-2');
    const predictButton = document.getElementById('btn-prediksi');

    if (!kriteria1Select || !nilai1Select || !enableKriteria2Checkbox || !kriteria2Inputs || !kriteria2Select || !nilai2Select || !predictButton) {
        return; 
    }

    kriteria1Select.disabled = false;
    kriteria1Select.value = '';
    nilai1Select.disabled = true;
    nilai1Select.innerHTML = '<option value="">(Pilih Kriteria Utama Dulu)</option>';
    enableKriteria2Checkbox.checked = false;
    enableKriteria2Checkbox.disabled = true;
    if (kriteria2Group) kriteria2Group.style.display = 'block';
    kriteria2Inputs.style.display = 'none';
    kriteria2Select.disabled = true;
    kriteria2Select.innerHTML = '';
    nilai2Select.disabled = true;
    nilai2Select.innerHTML = '<option value="">(Pilih Kriteria Kombinasi Dulu)</option>';
    predictButton.disabled = true;

    kriteria1Select.addEventListener('change', () => {
        handleKriteria1Change(allExpenses); 
    });
    
    nilai1Select.addEventListener('change', handleNilai1Change);

    enableKriteria2Checkbox.addEventListener('change', handleEnableKriteria2Change);

    kriteria2Select.addEventListener('change', () => {
        handleKriteria2Change(allExpenses); 
    });
    
    if (nilai2Select) {
        nilai2Select.addEventListener('change', handleNilai2Change);
    }

    predictButton.addEventListener('click', runPredictionHandler);
}

function handleKriteria1Change(allExpenses) {
    const kriteria1Select = document.getElementById('prediksi-kriteria-1');
    const nilai1Select = document.getElementById('prediksi-nilai-1');
    const enableKriteria2Checkbox = document.getElementById('enable-kriteria-2');
    const kriteria2Select = document.getElementById('prediksi-kriteria-2');
    const predictButton = document.getElementById('btn-prediksi');

    if (!kriteria1Select || !nilai1Select || !enableKriteria2Checkbox || !kriteria2Select || !predictButton) {
        return;
    }

    const kriteria1Value = kriteria1Select.value;

    updatePredictionValueOptions(kriteria1Select, nilai1Select, allExpenses);

    enableKriteria2Checkbox.checked = false;
    handleEnableKriteria2Change(); 

    enableKriteria2Checkbox.disabled = !kriteria1Value; 

    if (kriteria1Value) {
        updatePredictionKriteriaOptions(kriteria2Select, kriteria1Value);
    } else {
        kriteria2Select.innerHTML = ''; 
        kriteria2Select.disabled = true; 
    }
    
    updatePredictionButtonState();
}

function handleNilai1Change() {
    updatePredictionButtonState();
}

function handleEnableKriteria2Change() {
    const enableKriteria2Checkbox = document.getElementById('enable-kriteria-2');
    const kriteria2Inputs = document.getElementById('prediksi-kriteria-2-inputs');
    const kriteria2Select = document.getElementById('prediksi-kriteria-2');
    const nilai2Select = document.getElementById('prediksi-nilai-2');
    const predictButton = document.getElementById('btn-prediksi');
    const nilai1Select = document.getElementById('prediksi-nilai-1'); 

    if (!enableKriteria2Checkbox || !kriteria2Inputs || !kriteria2Select || !nilai2Select || !predictButton || !nilai1Select) {
         return;
    }

    const isEnabled = enableKriteria2Checkbox.checked;
    kriteria2Inputs.style.display = isEnabled ? 'flex' : 'none'; 
    kriteria2Select.disabled = !isEnabled; 
    nilai2Select.disabled = true; 

    if (!isEnabled) {
         kriteria2Select.value = '';
         nilai2Select.innerHTML = '<option value="">(Pilih Kriteria Kombinasi Dulu)</option>';
         nilai2Select.value = ''; 
    }

    updatePredictionButtonState();
}

function handleKriteria2Change(allExpenses) {
    const kriteria2Select = document.getElementById('prediksi-kriteria-2');
    const nilai2Select = document.getElementById('prediksi-nilai-2');
    const predictButton = document.getElementById('btn-prediksi');
    const nilai1Select = document.getElementById('prediksi-nilai-1'); 

    if (!kriteria2Select || !nilai2Select || !predictButton || !nilai1Select) {
        return;
    }

    updatePredictionValueOptions(kriteria2Select, nilai2Select, allExpenses);
    updatePredictionButtonState();
}

function runPredictionHandler() {
    runPrediction(allUserExpensesCache); 
}

function updatePredictionValueOptions(selectKriteriaElement, selectNilaiElement, allExpenses) {
    const selectedKriteria = selectKriteriaElement.value;
    const currentNilai = selectNilaiElement.value; 
    selectNilaiElement.innerHTML = '';
    selectNilaiElement.disabled = true;

    if (!selectedKriteria) {
        selectNilaiElement.innerHTML = `<option value="">(Pilih Kriteria Dulu)</option>`;
        return;
    }

    let options = new Set();
    try {
        switch (selectedKriteria) {
            case 'Nama Hari': options = new Set(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']); break;
            case 'Jenis Hari': options = new Set(['Weekday', 'Weekend']); break;
            case 'Bagian Hari': options = new Set(['Pagi', 'Siang', 'Sore', 'Malam']); break;
            case 'Bagian Bulan': options = new Set(['Awal Bulan', 'Tengah Bulan', 'Akhir Bulan']); break;
            case 'Minggu ke-': options = new Set(['1', '2', '3', '4', '5']); break;
            case 'Kategori':
                const savedCategoriesKey = `categories_${localStorage.getItem('currentUser')}`;
                const savedCategories = JSON.parse(localStorage.getItem(savedCategoriesKey)) || [];
                savedCategories.forEach(cat => options.add(capitalizeFirstLetter(cat)));
                
                allExpenses.forEach(exp => {
                    if (exp.kategori) {
                        options.add(capitalizeFirstLetter(exp.kategori));
                    }
                });
                break;
            default:
                 selectNilaiElement.innerHTML = `<option value="">(Kriteria Tdk Valid)</option>`;
                 return;
        }
    } catch (e) {
        console.error("Error populating prediction values:", e);
        showNotification("Gagal memuat opsi nilai.", "danger");
    }

    selectNilaiElement.innerHTML = `<option value="" selected>(Pilih Nilai)</option>`;
    const doNotSort = ['Nama Hari', 'Minggu ke-', 'Bagian Bulan', 'Bagian Hari'];
    const sortedOptions = doNotSort.includes(selectedKriteria) ? Array.from(options) : Array.from(options).sort();
    
    sortedOptions.forEach(opt => {
        if(opt) selectNilaiElement.add(new Option(opt, opt)); 
    });
    selectNilaiElement.value = currentNilai; 
    selectNilaiElement.disabled = false;
}

function updatePredictionKriteriaOptions(selectKriteria2Element, excludeKriteria) {
     const allKriteria = ["Nama Hari", "Jenis Hari", "Bagian Hari", "Bagian Bulan", "Minggu ke-", "Kategori"];
     selectKriteria2Element.innerHTML = '<option value="" selected>(Pilih Kriteria Kombinasi)</option>';
     allKriteria.forEach(kriteria => {
         if (kriteria !== excludeKriteria) {
            selectKriteria2Element.add(new Option(kriteria, kriteria));
         }
     });
}

function runPrediction(allExpenses) {
    const kriteria1 = document.getElementById('prediksi-kriteria-1').value;
    const nilai1 = document.getElementById('prediksi-nilai-1').value;
    const useKriteria2 = document.getElementById('enable-kriteria-2').checked;
    const kriteria2 = useKriteria2 ? document.getElementById('prediksi-kriteria-2').value : null;
    const nilai2 = useKriteria2 ? document.getElementById('prediksi-nilai-2').value : null;

    const resultsContainer = document.getElementById('prediksi-results-container');
    const animationEl = document.getElementById('prediksi-processing-animation');
    const insightEl = document.getElementById('prediksi-insight-content');
    const noDataEl = document.getElementById('prediksi-no-data');

    if (!kriteria1 || !nilai1 || (useKriteria2 && (!kriteria2 || !nilai2))) {
        showNotification("Pilih kriteria dan nilai prediksi yang valid.", "warning"); return;
    }

    console.log(`Running prediction for: ${kriteria1}=${nilai1}` + (useKriteria2 ? ` AND ${kriteria2}=${nilai2}` : ''));

    if (resultsContainer) resultsContainer.style.display = 'block';
    if (animationEl) animationEl.style.display = 'flex'; 
    if (insightEl) insightEl.style.display = 'none';
    if (noDataEl) noDataEl.style.display = 'none';

    setTimeout(() => {
        const filteredExpenses = allExpenses.filter(exp => {
            const dateObj = new Date(exp.date);
            if (isNaN(dateObj.getTime())) return false;
            
            const parts = getDateParts(dateObj); 
            const namaHari = getNamaHari(dateObj);
            const jenisHari = getJenisHari(namaHari);
            const bagianHari = getBagianHari(dateObj); 

            let match1 = false;
            switch (kriteria1) {
                case 'Nama Hari': match1 = namaHari === nilai1; break;
                case 'Jenis Hari': match1 = jenisHari === nilai1; break;
                case 'Bagian Hari': match1 = bagianHari === nilai1; break; 
                case 'Bagian Bulan': match1 = parts.bagianBulan === nilai1; break;
                case 'Minggu ke-': match1 = parts.mingguKe.toString() === nilai1; break;
                case 'Kategori': match1 = capitalizeFirstLetter(exp.kategori) === nilai1; break;
            }

            let match2 = true; 
            if (useKriteria2 && kriteria2 && nilai2) {
                match2 = false; 
                 switch (kriteria2) {
                    case 'Nama Hari': match2 = namaHari === nilai2; break;
                    case 'Jenis Hari': match2 = jenisHari === nilai2; break;
                    case 'Bagian Hari': match2 = bagianHari === nilai2; break; 
                    case 'Bagian Bulan': match2 = parts.bagianBulan === nilai2; break;
                    case 'Minggu ke-': match2 = parts.mingguKe.toString() === nilai2; break;
                    case 'Kategori': match2 = capitalizeFirstLetter(exp.kategori) === nilai2; break;
                }
            }
            return match1 && match2;
        });

        if (filteredExpenses.length === 0) {
            console.warn("No historical data matches the prediction criteria.");
            if (animationEl) animationEl.style.display = 'none'; 
            if (noDataEl) noDataEl.style.display = 'block'; 
            if (insightEl) insightEl.style.display = 'none'; 
            return; 
        }

        const dailyTotals = filteredExpenses.reduce((acc, exp) => {
            const dateString = new Date(exp.date).toDateString();
            acc[dateString] = (acc[dateString] || 0) + exp.amount;
            return acc;
        }, {});
        const dailyTotalValues = Object.values(dailyTotals);
        const totalDays = dailyTotalValues.length; 

        const totalTransactions = filteredExpenses.length;
        const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const predictedAverage = totalDays > 0 ? (totalAmount / totalDays) : 0; 
        
        let minHist = Infinity, maxHist = 0;
        if (dailyTotalValues.length > 0) {
            minHist = Math.min(...dailyTotalValues);
            maxHist = Math.max(...dailyTotalValues);
        }
        const minAmount = (minHist === Infinity) ? 0 : minHist;
        const maxAmount = maxHist;

        const avgPerTransaction = totalTransactions > 0 ? (totalAmount / totalTransactions) : 0;

        const categoryCounts = filteredExpenses.reduce((acc, exp) => {
            const cat = capitalizeFirstLetter(exp.kategori || 'Lainnya');
            acc[cat] = (acc[cat] || 0) + 1; return acc;
        }, {});
        const dominantCategory = Object.entries(categoryCounts).sort((a,b) => b[1] - a[1])[0]; 

        const itemCounts = filteredExpenses.reduce((acc, exp) => {
            const item = capitalizeFirstLetter(exp.barang || 'Item');
            acc[item] = (acc[item] || 0) + 1; return acc;
        }, {});
        const dominantItem = Object.entries(itemCounts).sort((a,b) => b[1] - a[1])[0]; 

        let criteriaText = `${kriteria1}: ${nilai1}`;
        if (useKriteria2 && kriteria2 && nilai2) {
            criteriaText += ` & ${kriteria2}: ${nilai2}`;
        }

        const insightHTML = `
            <div class="insight-header">
                Gambaran untuk: <strong>${criteriaText}</strong>
            </div>

            <div class="insight-main-metric">
                <span class="metric-label">Rata-Rata Pengeluaran per Hari</span>
                <span class="metric-value">Rp${predictedAverage.toLocaleString('id-ID', {maximumFractionDigits: 0})}</span>
            </div>

            <div class="insight-grid">
                <div class="insight-card">
                    <span class="metric-label">Nilai Minimal Pengeluaran</span>
                    <span class="metric-value">Rp${minAmount.toLocaleString('id-ID')}</span>
                </div>
                <div class="insight-card">
                    <span class="metric-label">Nilai Maksimal Pengeluaran</span>
                    <span class="metric-value">Rp${maxAmount.toLocaleString('id-ID')}</span>
                </div>
            </div>

            <ul class="list-group list-group-flush insight-list-group">
                <li class="list-group-item">
                    <span>Total Transaksi</span>
                    <strong>${totalTransactions}</strong>
                </li>
                <li class="list-group-item">
                    <span>Jumlah Hari (Unik)</span>
                    <strong>${totalDays}</strong>
                </li>
                <li class="list-group-item">
                    <span>Rata-Rata per Transaksi</span>
                    <strong>Rp${avgPerTransaction.toLocaleString('id-ID', {maximumFractionDigits: 0})}</strong>
                </li>
                <li class="list-group-item">
                    <span>Kategori Paling Sering</span>
                    <strong>${dominantCategory[0]} <small>(${dominantCategory[1]}x)</small></strong>
                </li>
                <li class="list-group-item">
                    <span>Item Paling Sering</span>
                    <strong>${dominantItem[0]} <small>(${dominantItem[1]}x)</small></strong>
                </li>
            </ul>
            
            <div class="insight-footer">
                *Berdasarkan ${totalTransactions} riwayat transaksi yang sesuai kriteria.
            </div>
        `;

        if (animationEl) animationEl.style.display = 'none'; 
        if (noDataEl) noDataEl.style.display = 'none'; 
        if (insightEl) {
            insightEl.innerHTML = insightHTML; 
            insightEl.style.display = 'block'; 
        }

    }, 1500); 
}

function generateRekapDataPDF(year, month, user, expenses, targetNumber, tujuanPengeluaran) {
  const totalRealisasi = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const saldoAkhir = targetNumber - totalRealisasi;
  const percentage = targetNumber === 0 ? 0 : ((totalRealisasi / targetNumber) * 100).toFixed(2);
  const tujuanFormatted = capitalizeFirstLetter(tujuanPengeluaran);
  const monthName = capitalizeFirstLetter(getMonthName(month));

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageMargin = 15;
  let currentY = pageMargin; 

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const title = `Rekap Pengeluaran ${tujuanFormatted}`;
  const subtitle = `Bulan ${monthName} ${year}`; 
  doc.text(title, pageWidth / 2, currentY, { align: 'center' });
  currentY += 7; 
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, pageWidth / 2, currentY, { align: 'center' });
  currentY += 12; 

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan Keuangan:', pageMargin, currentY);
  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Saldo Awal`, pageMargin, currentY);
  doc.text(`: Rp${targetNumber.toLocaleString('id-ID')}`, pageMargin + 50, currentY);
  currentY += 6;
  doc.text(`Total Pengeluaran`, pageMargin, currentY);
  doc.text(`: Rp${totalRealisasi.toLocaleString('id-ID')}`, pageMargin + 50, currentY);
  currentY += 6;
  doc.text(`Saldo Akhir`, pageMargin, currentY);
  doc.text(`: Rp${saldoAkhir.toLocaleString('id-ID')}`, pageMargin + 50, currentY);
  currentY += 6;
  doc.text(`Persentase Realisasi`, pageMargin, currentY);
  doc.text(`: ${percentage}%`, pageMargin + 50, currentY);
  currentY += 10; 

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Detail Transaksi:', pageMargin, currentY);
  currentY += 6;

  const tableColumn = ["Tanggal", "Barang", "Kategori", "Jumlah (Rp)"];
  const tableRows = [];

  expenses.sort((a, b) => new Date(a.date) - new Date(b.date));

  expenses.forEach(exp => {
    const dateObj = new Date(exp.date);
    const tanggal = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('id-ID') : '-';
    const barang = capitalizeFirstLetter(exp.barang);
    const kategori = capitalizeFirstLetter(exp.kategori);
    const jumlah = exp.amount.toLocaleString('id-ID');
    const rowData = [tanggal, barang, kategori, jumlah]; 
    tableRows.push(rowData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: currentY,
    theme: 'striped',
    headStyles: { fillColor: [75, 0, 130], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 
      0: { halign: 'center', cellWidth: 28 },
      1: { halign: 'left', cellWidth: 'auto' }, 
      2: { halign: 'left', cellWidth: 45 },
      3: { halign: 'right', cellWidth: 35 }
    },
    didDrawPage: function (data) {
       const pageCount = doc.internal.getNumberOfPages(); doc.setFontSize(9); doc.setTextColor(150);
       doc.text(`Generated by Mumy - Halaman ${data.pageNumber} dari ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
  });

  const fileName = `Rekap_Pengeluaran_${tujuanFormatted.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`;
  doc.save(fileName);
}

function initializeCategoryExpenseEnhanced() {
  const selectMonth = document.getElementById('select-category-month');
  const selectCategory = document.getElementById('select-category');
  const categoryStatistic = document.getElementById('category-statistic');
  const toggleStatsButton = document.getElementById('toggle-category-stats'); 

  if (!selectMonth || !selectCategory || !categoryStatistic || !toggleStatsButton) return; 

  populateCategoryExpenseMonthOptions();
  populateCategoryExpenseCategoryOptions(); 

  selectMonth.addEventListener('change', () => {
    const selectedOption = selectMonth.options[selectMonth.selectedIndex];
    const selectedMonth = selectedOption.value;
    const selectedYear = selectedOption.getAttribute('data-year');

    const collapseElement = document.getElementById('category-stats-collapse');
    if (collapseElement) {
        const bsCollapse = bootstrap.Collapse.getInstance(collapseElement) || new bootstrap.Collapse(collapseElement, {toggle: false});
        bsCollapse.hide();
        toggleStatsButton.innerHTML = '<i class="fas fa-info-circle me-2"></i> Lihat Detail Statistik'; 
        toggleStatsButton.setAttribute('aria-expanded', 'false');
    }

    if (selectedMonth && selectedYear) {
      populateCategoryExpenseCategoryOptions(selectedMonth, selectedYear);
      selectCategory.disabled = false;
    } else {
      populateCategoryExpenseCategoryOptions(); 
      selectCategory.innerHTML = '<option value="">Pilih Kategori</option>';
      selectCategory.disabled = true;
    }
    
    if (categoryDailyExpenseChart instanceof Chart) {
      categoryDailyExpenseChart.destroy();
      categoryDailyExpenseChart = null; 
    }
    categoryStatistic.innerHTML = ''; 
  });

  selectCategory.addEventListener('change', () => {
    const selectedOption = selectMonth.options[selectMonth.selectedIndex];
    const selectedMonth = selectedOption.value;
    const selectedYear = selectedOption.getAttribute('data-year');
    const selectedCategory = selectCategory.value;

    const collapseElement = document.getElementById('category-stats-collapse');
     if (collapseElement) {
        const bsCollapse = bootstrap.Collapse.getInstance(collapseElement) || new bootstrap.Collapse(collapseElement, {toggle: false});
        bsCollapse.hide();
        toggleStatsButton.innerHTML = '<i class="fas fa-info-circle me-2"></i> Lihat Detail Statistik';
        toggleStatsButton.setAttribute('aria-expanded', 'false');
     }

    if (selectedCategory && selectedMonth && selectedYear) {
      renderCategoryDailyExpenseChart(selectedMonth, selectedYear, selectedCategory, categoryStatistic);
      toggleStatsButton.disabled = false; 
    } else {
      if (categoryDailyExpenseChart instanceof Chart) {
        categoryDailyExpenseChart.destroy();
         categoryDailyExpenseChart = null; 
      }
      categoryStatistic.innerHTML = ''; 
      toggleStatsButton.disabled = true; 
    }
  });

   toggleStatsButton.addEventListener('click', (e) => {
        const isExpanded = e.currentTarget.getAttribute('aria-expanded') === 'true';
        e.currentTarget.innerHTML = !isExpanded
            ? '<i class="fas fa-eye-slash me-2"></i> Sembunyikan Detail'
            : '<i class="fas fa-info-circle me-2"></i> Lihat Detail Statistik';
   });
}

function populateCategoryExpenseMonthOptions() {
  const selectMonth = document.getElementById('select-category-month');
  if (!selectMonth) return;
  const currentUser = localStorage.getItem('currentUser');
  const yearMonths = new Set();

  for (let key in localStorage) {
    if (key.startsWith(`expenses_${currentUser}_`)) {
      const parts = key.split('_');
      if (parts.length === 4) {
        yearMonths.add(`${parts[2]}-${parts[3]}`); 
      }
    }
  }

  const yearMonthArray = Array.from(yearMonths).sort((a, b) => {
    const [yearA, monthA] = a.split('-').map(Number);
    const [yearB, monthB] = b.split('-').map(Number);
    return yearB - yearA || monthB - monthA; 
  });

  const currentSelection = selectMonth.value + '-' + selectMonth.options[selectMonth.selectedIndex]?.getAttribute('data-year'); 
  selectMonth.innerHTML = '<option value="">Pilih Bulan</option>'; 

  if (yearMonthArray.length === 0) {
    selectMonth.innerHTML = '<option value="">Tidak ada data</option>';
  } else {
    yearMonthArray.forEach(ym => {
      const [year, month] = ym.split('-');
      const option = document.createElement('option');
      option.value = month; 
      option.setAttribute('data-year', year); 
      option.textContent = `${getMonthName(month)} ${year}`;
       if (`${month}-${year}` === currentSelection) {
           option.selected = true;
       }
      selectMonth.appendChild(option);
    });
  }
}

function populateCategoryExpenseCategoryOptions(selectedMonth = null, selectedYear = null) {
  const selectCategory = document.getElementById('select-category');
  if (!selectCategory) return;
  const currentUser = localStorage.getItem('currentUser');
  let expenses = [];

  if (selectedMonth && selectedYear) {
    const expensesKey = `expenses_${currentUser}_${selectedYear}_${selectedMonth}`;
    expenses = JSON.parse(localStorage.getItem(expensesKey)) || [];
  } else {
    for (let key in localStorage) {
      if (key.startsWith(`expenses_${currentUser}_`)) {
        const monthExpenses = JSON.parse(localStorage.getItem(key)) || [];
        expenses = expenses.concat(monthExpenses);
      }
    }
  }

  const categories = new Set(expenses.map(exp => exp.kategori));
  const currentSelection = selectCategory.value; 
  selectCategory.innerHTML = ''; 

  if (categories.size === 0) {
    selectCategory.innerHTML = '<option value="">Tidak ada kategori</option>';
    selectCategory.disabled = true;
  } else {
    selectCategory.innerHTML = '<option value="">Pilih Kategori</option>';
    Array.from(categories).sort().forEach(kategori => {
      const option = document.createElement('option');
      option.value = kategori.toLowerCase();
      option.textContent = capitalizeFirstLetter(kategori);
       if (kategori.toLowerCase() === currentSelection) {
           option.selected = true;
       }
      selectCategory.appendChild(option);
    });
    selectCategory.disabled = !(selectedMonth && selectedYear);
  }
}

function renderCategoryDailyExpenseChart(selectedMonth, selectedYear, selectedCategory, statisticDiv) {
  const currentUser = localStorage.getItem('currentUser');
  const expensesKey = `expenses_${currentUser}_${selectedYear}_${selectedMonth}`;
  const expenses = JSON.parse(localStorage.getItem(expensesKey)) || [];
  const totalExpensesMonthKey = `expenses_${currentUser}_${selectedYear}_${selectedMonth}`; 
  const totalExpensesInMonth = JSON.parse(localStorage.getItem(totalExpensesMonthKey)) || [];

  const filteredExpenses = expenses.filter(exp => exp.kategori.toLowerCase() === selectedCategory.toLowerCase());

  const grouped = filteredExpenses.reduce((acc, exp) => {
    const dateObj = new Date(exp.date);
    if (isNaN(dateObj.getTime())) return acc;
    const formattedDate = dateObj.toLocaleDateString('id-ID');
    acc[formattedDate] = (acc[formattedDate] || 0) + exp.amount;
    return acc;
  }, {});

  const allDates = getAllDatesInMonth(selectedYear, selectedMonth);
  const labels = allDates.map(date => date.toLocaleDateString('id-ID'));
  const data = allDates.map(date => {
    const formattedDate = date.toLocaleDateString('id-ID');
    return grouped[formattedDate] || 0;
  });

  const ctx = document.getElementById('category-daily-chart')?.getContext('2d');
  if (!ctx) return; 

  if (categoryDailyExpenseChart instanceof Chart) {
    categoryDailyExpenseChart.destroy();
    categoryDailyExpenseChart = null;
  }

  categoryDailyExpenseChart = new Chart(ctx, {
    type: 'line', 
    data: {
      labels: labels,
      datasets: [{
        label: `Pengeluaran Harian (${capitalizeFirstLetter(selectedCategory)})`,
        data: data,
        fill: true, 
        backgroundColor: 'rgba(75, 0, 130, 0.2)',
        borderColor: '#4b0082',
        tension: 0.4, 
        pointBackgroundColor: '#4b0082',
        pointBorderColor: '#4b0082',
        pointRadius: 3,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }, 
        title: {
          display: true,
          text: `Grafik Harian Kategori ${capitalizeFirstLetter(selectedCategory)} (${capitalizeFirstLetter(getMonthName(selectedMonth))} ${selectedYear})`,
          color: '#333333'
        },
        tooltip: {
            callbacks: { label: (c) => `Rp${c.parsed.y.toLocaleString('id-ID')}` }
        }
      },
      scales: {
        x: { ticks: { color: '#333333' }, grid: { color: '#e0e0e0' }, title: { display: true, text: 'Tanggal' } },
        y: { ticks: { color: '#333333' }, grid: { color: '#e0e0e0' }, title: { display: true, text: 'Jumlah (Rp)' } }
      },
      onClick: null,
      onHover: null
    },
  });

  displayCategoryStatistic(filteredExpenses, totalExpensesInMonth, selectedCategory, statisticDiv);
}

function displayCategoryStatistic(categoryExpenses, totalMonthExpenses, kategori, statisticDiv) {
   if (!statisticDiv) return; 
   
  if (categoryExpenses.length === 0) {
    statisticDiv.innerHTML = '<p class="text-center text-muted">Tidak ada data pengeluaran untuk kategori ini pada bulan yang dipilih.</p>';
    return;
  }

  const totalKategori = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const totalBulan = totalMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const kontribusi = totalBulan > 0 ? ((totalKategori / totalBulan) * 100).toFixed(1) : 0;

  const daysWithCategoryExpenses = new Set(categoryExpenses.map(exp => {
      const dateObj = new Date(exp.date);
      return !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('id-ID') : null;
  })).size;
  const avgKategoriHarian = daysWithCategoryExpenses > 0 ? (totalKategori / daysWithCategoryExpenses) : 0;

   const groupedDailyCategory = categoryExpenses.reduce((acc, exp) => {
    const dateObj = new Date(exp.date);
    if (isNaN(dateObj.getTime())) return acc;
    const formattedDate = dateObj.toLocaleDateString('id-ID');
    acc[formattedDate] = (acc[formattedDate] || 0) + exp.amount;
    return acc;
  }, {});
  const maxDailyAmount = Math.max(...Object.values(groupedDailyCategory), 0);
  const maxDailyDate = Object.keys(groupedDailyCategory).find(date => groupedDailyCategory[date] === maxDailyAmount) || '-';

  const statsHtml = `
    <ul class="list-group">
        <li class="list-group-item">
            <div><i class="fas fa-wallet me-2 text-primary"></i>Total Kategori ${capitalizeFirstLetter(kategori)}</div>
            <div><span class="badge bg-primary rounded-pill">Rp${totalKategori.toLocaleString('id-ID')}</span></div>
        </li>
        <li class="list-group-item">
            <div><i class="fas fa-chart-pie me-2 text-info"></i>Kontribusi</div>
            <div><span class="badge bg-info rounded-pill">${kontribusi}%</span></div>
        </li>
        <li class="list-group-item">
            <div><i class="fas fa-calculator me-2 text-secondary"></i>Rata-rata Harian Kategori</div>
            <div><span class="badge bg-secondary rounded-pill">Rp${Math.round(avgKategoriHarian).toLocaleString('id-ID')}</span></div>
        </li>
        <li class="list-group-item">
            <div><i class="fas fa-arrow-trend-up me-2 text-danger"></i>Pengeluaran Harian Tertinggi</div>
            <div><span class="badge bg-danger rounded-pill">Rp${maxDailyAmount.toLocaleString('id-ID')} <small>(${maxDailyDate})</small></span></div>
        </li>
    </ul>
  `;
  statisticDiv.innerHTML = statsHtml;
}

function initializeHistoryYearOptions() {
  const historyYearSelect = document.getElementById('history-year');
  if (!historyYearSelect) return; 
  const currentUser = localStorage.getItem('currentUser');
  const years = new Set();

  for (let key in localStorage) {
    if (key.startsWith(`expenses_${currentUser}_`)) {
      const parts = key.split('_');
      if (parts.length === 4) { 
        years.add(parts[2]);
      }
    }
  }

  const currentSelection = historyYearSelect.value; 
  historyYearSelect.innerHTML = ''; 

  if (years.size === 0) {
    historyYearSelect.innerHTML = '<option value="">Tidak ada riwayat</option>';
  } else {
    historyYearSelect.innerHTML = '<option value="">Pilih Tahun</option>';
    Array.from(years).sort((a,b) => b - a).forEach(year => { 
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      historyYearSelect.appendChild(option);
    });
  }

  historyYearSelect.value = currentSelection; 
  if (!historyYearSelect.value) { 
      populateHistoryMonthOptions(null); 
      document.getElementById('history-content').innerHTML = '<p>Silakan pilih tahun dan bulan untuk melihat riwayat pengeluaran.</p>'; 
  } else {
       populateHistoryMonthOptions(historyYearSelect.value);
  }

  historyYearSelect.removeEventListener('change', historyYearChangeListener); 
  historyYearSelect.addEventListener('change', historyYearChangeListener); 
}

function historyYearChangeListener() {
    const selectedYear = document.getElementById('history-year').value;
    populateHistoryMonthOptions(selectedYear);
    const historyContent = document.getElementById('history-content');
    if (historyContent) historyContent.innerHTML = '<p>Silakan pilih tahun dan bulan untuk melihat riwayat pengeluaran.</p>';
}

function initializePrintYearOptions() {
  const printYearSelect = document.getElementById('print-year');
   if (!printYearSelect) return; 
  const currentUser = localStorage.getItem('currentUser');
  const years = new Set();

  for (let key in localStorage) {
    if (key.startsWith(`expenses_${currentUser}_`)) {
      const parts = key.split('_');
      if (parts.length === 4) { 
        years.add(parts[2]);
      }
    }
  }

  const currentSelection = printYearSelect.value; 
  printYearSelect.innerHTML = ''; 

  if (years.size === 0) {
    printYearSelect.innerHTML = '<option value="">Tidak ada riwayat</option>';
  } else {
    printYearSelect.innerHTML = '<option value="">Pilih Tahun</option>';
    Array.from(years).sort((a,b) => b - a).forEach(year => { 
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      printYearSelect.appendChild(option);
    });
  }

  printYearSelect.value = currentSelection; 
  if (!printYearSelect.value) {
      populatePrintMonthOptions(null); 
  } else {
      populatePrintMonthOptions(printYearSelect.value); 
  }

  printYearSelect.removeEventListener('change', printYearChangeListener); 
  printYearSelect.addEventListener('change', printYearChangeListener); 
}

function printYearChangeListener() {
    const selectedYear = document.getElementById('print-year').value;
    populatePrintMonthOptions(selectedYear);
}

function populateHistoryMonthOptions(selectedYear) {
  const historyMonthSelect = document.getElementById('history-month');
   if (!historyMonthSelect) return; 
  const currentUser = localStorage.getItem('currentUser');
  const months = [];

  const currentSelection = historyMonthSelect.value; 
  historyMonthSelect.innerHTML = ''; 

  if (!selectedYear) {
    historyMonthSelect.innerHTML = '<option value="">Pilih Tahun Dulu</option>';
    return;
  }

  for (let i = 1; i <= 12; i++) {
    const key = `expenses_${currentUser}_${selectedYear}_${i}`;
    if (localStorage.getItem(key)) {
      months.push(i);
    }
  }

  if (months.length === 0) {
    historyMonthSelect.innerHTML = '<option value="">Tidak ada riwayat</option>';
  } else {
    historyMonthSelect.innerHTML = '<option value="">Pilih Bulan</option>';
    months.sort((a, b) => b - a).forEach(month => {
      const option = document.createElement('option');
      option.value = month;
      option.textContent = getMonthName(month);
       if (month == currentSelection) {
           option.selected = true;
       }
      historyMonthSelect.appendChild(option);
    });
  }
   
   if (historyMonthSelect.value) {
       renderHistoryContent();
   }


  historyMonthSelect.removeEventListener('change', renderHistoryContent); 
  historyMonthSelect.addEventListener('change', renderHistoryContent); 
}

function populatePrintMonthOptions(selectedYear) {
  const printMonthSelect = document.getElementById('print-month');
  if (!printMonthSelect) return; 
  const currentUser = localStorage.getItem('currentUser');
  const months = [];

  const currentSelection = printMonthSelect.value; 
  printMonthSelect.innerHTML = ''; 

  if (!selectedYear) {
    printMonthSelect.innerHTML = '<option value="">Pilih Tahun Dulu</option>';
    return;
  }

  for (let i = 1; i <= 12; i++) {
    const key = `expenses_${currentUser}_${selectedYear}_${i}`;
    if (localStorage.getItem(key)) {
      months.push(i);
    }
  }

  if (months.length === 0) {
    printMonthSelect.innerHTML = '<option value="">Tidak ada riwayat</option>';
  } else {
    printMonthSelect.innerHTML = '<option value="">Pilih Bulan</option>';
    months.sort((a, b) => b - a).forEach(month => {
      const option = document.createElement('option');
      option.value = month;
      option.textContent = getMonthName(month);
       if (month == currentSelection) {
           option.selected = true;
       }
      printMonthSelect.appendChild(option);
    });
  }
}

function getAllDatesInMonth(year, month) {
  const date = new Date(year, month - 1, 1);
  const dates = [];
  while (date.getMonth() === month - 1) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

// ngasilin palette hex color otomatis 
function generateBrightColorPalette(num) {
  const palette = [];
  const predefinedColors = [
    '#4b0082', '#E91E63', '#FF9800', '#20c997', '#03A9F4', 
    '#FBC02D', '#e63946', '#9C27B0', '#4CAF50', '#2196F3', 
    '#FF5722', '#8BC34A', '#00BCD4', '#673AB7', '#CDDC39', 
    '#FFEB3B', '#795548', '#009688', '#FFC107', '#607D8B', 
    '#EC407A', '#FFEE58', '#9CCC65', '#29B6F6', '#AB47BC', 
    '#FFA726', '#7E57C2', '#EF5350', '#66BB6A', '#42A5F5', 
    '#FF7043', '#D4E157', '#26C6DA', '#BDBDBD', '#8D6E63', 
    '#5C6BC0', '#D81B60', '#FDD835', '#00897B', '#C2185B'  
  ];

  for (let i = 0; i < num; i++) {
    palette.push(predefinedColors[i % predefinedColors.length]);
  }
  return palette;
}

function getCurrentMonth() {
  const now = new Date();
  return now.getMonth() + 1; 
}

function getCurrentYear() {
  const now = new Date();
  return now.getFullYear();
}

function getMonthName(monthNumber) {
   if (!monthNumber || monthNumber < 1 || monthNumber > 12) return ''; 
  const date = new Date();
  date.setDate(1); 
  date.setMonth(monthNumber - 1);
  return date.toLocaleString('id-ID', { month: 'long' });
}

function capitalizeFirstLetter(string) {
  if (!string || typeof string !== 'string') return '';
  return string.replace(/\b\w/g, char => char.toUpperCase());
}

function updateCategoryDropdownOptions() {
  populateCategoryExpenseCategoryOptions();
}

function showTipsModal(message) {
  const tipsModalContent = document.querySelector('#tipsModal .modal-body');
  if(tipsModalContent) {
      tipsModalContent.textContent = message;
  }
  const tipsModalEl = document.getElementById('tipsModal');
  if(tipsModalEl) {
      const tipsModal = bootstrap.Modal.getOrCreateInstance(tipsModalEl);
      tipsModal.show();
  }
}

// logic export ke excel
function handleExportExcel() {
    showLoading("Mengumpulkan data..."); 
    setTimeout(() => { 
        try {
            const allExpenses = getAllUserExpenses();
            if (allExpenses.length === 0) {
                showNotification("Tidak ada data pengeluaran untuk diekspor.", "warning");
                hideLoading();
                return;
            }
            
            showLoading("Memproses dataset...");
            const excelData = transformDataForExcel(allExpenses);
            
            showLoading("Membuat file Excel...");
            generateExcelFile(excelData);
            
            hideLoading();
            showNotification("File Excel berhasil dibuat!", "success");
        } catch (error) {
            console.error("Error exporting to Excel:", error);
            hideLoading();
            showNotification("Terjadi kesalahan saat membuat file Excel.", "danger");
        }
    }, 500); 
}

function getAllUserExpenses() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return [];
    
    let allExpenses = [];
    for (let key in localStorage) {
        if (key.startsWith(`expenses_${currentUser}_`)) {
            const monthExpenses = JSON.parse(localStorage.getItem(key)) || [];
            allExpenses = allExpenses.concat(monthExpenses);
        }
    }
    allExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));
    return allExpenses;
}

function transformDataForExcel(expenses) {
    return expenses.map((exp, index) => {
        const dateObj = new Date(exp.date);
        const { tanggal, bulan, mingguKe, bagianBulan, tahun, jam } = getDateParts(dateObj); 
        const namaHari = getNamaHari(dateObj);
        const jenisHari = getJenisHari(namaHari);
        const bagianHari = getBagianHari(dateObj);

        return {
            "No": index + 1,
            "Nama Item": capitalizeFirstLetter(exp.barang),
            "Kategori": capitalizeFirstLetter(exp.kategori),
            "Tahun": tahun,
            "Tanggal": tanggal,
            "Jam": jam,                      
            "Nama Hari": namaHari,
            "Jenis Hari": jenisHari,
            "Bagian Hari": bagianHari,
            "Minggu ke-": mingguKe,
            "Bulan": bulan,
            "Bagian Bulan": bagianBulan,
            "Harga": exp.amount                              
        };
    });
}

function generateExcelFile(data) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pengeluaran"); 

     const colWidths = Object.keys(data[0]).map(key => {
         const headerLength = key.length;
         const dataLengths = data.map(row => String(row[key] || '').length);
         const maxLength = Math.max(headerLength, ...dataLengths);
         return { wch: maxLength + 2 }; 
     });
     worksheet["!cols"] = colWidths;

    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    const fileName = `Dataset_Pengeluaran_Mumy_${timestamp}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}

function getDateParts(dateObj) {
     if (isNaN(dateObj.getTime())) {
         return { tanggal: '-', bulan: '-', mingguKe: '-', bagianBulan: '-', tahun: '-', jam: '-' };
     }
    const tanggal = dateObj.getDate(); 
    const bulan = dateObj.getMonth() + 1; 
    const tahun = dateObj.getFullYear(); 
    const jam = dateObj.getHours().toString(); 

    const mingguKe = Math.ceil(tanggal / 7); 

    let bagianBulan;
    if (tanggal <= 10) bagianBulan = "Awal Bulan";
    else if (tanggal <= 20) bagianBulan = "Tengah Bulan";
    else bagianBulan = "Akhir Bulan";

    return { tanggal, bulan, mingguKe, bagianBulan, tahun, jam };
}

function getNamaHari(dateObj) {
    if (isNaN(dateObj.getTime())) return '-';
    return dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
}

function getJenisHari(namaHari) {
    if (namaHari === "Sabtu" || namaHari === "Minggu") {
        return "Weekend";
    } else if (['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].includes(namaHari)){
        return "Weekday";
    } else {
        return '-';
    }
}

function getBagianHari(dateObj) {
     if (isNaN(dateObj.getTime())) return '-';
    const jam = dateObj.getHours(); 
    if (jam >= 5 && jam < 12) return "Pagi";
    if (jam >= 12 && jam < 15) return "Siang";
    if (jam >= 15 && jam < 19) return "Sore";
    return "Malam"; 
}
