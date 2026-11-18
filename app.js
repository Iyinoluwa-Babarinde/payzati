/* -----------------------------------------------------------------
   Payzati — B2B Global Payroll Platform Logic
   ----------------------------------------------------------------- */

// Mock Currency Exchange Rates relative to USD (Base Currency)
const EXCHANGE_RATES = {
    "USD": 1.0,
    "GBP": 0.8,
    "INR": 83.0,
    "CAD": 1.35,
    "EUR": 0.92
};

// Global App State
const state = {
    currentUser: null,
    users: [],
    wallets: {},
    transactions: [],
    taxCompliance: [],
    selectedLoginRole: 'business', // 'business' or 'employee'
    activeEmployeeMock: 'john.doe@payzati.io' // sandbox testing email
};

// Quick DOM Selector helper
function $(sel) { return document.querySelector(sel); }
function $all(sel) { return document.querySelectorAll(sel); }

// Load data from persistent DB
async function loadData() {
    try {
        const response = await fetch('/api/data');
        if (response.ok) {
            const data = await response.json();
            state.users = data.users || [];
            state.wallets = data.wallets || {};
            state.transactions = data.transactions || [];
            state.taxCompliance = data.taxCompliance || [];
            return;
        }
    } catch (e) {
        console.warn('Persistence connection unavailable. Running in local memory.');
    }

    // High fidelity seed fallback in case of connection failure
    state.users = [
        { email: "hr@acme.corp", name: "Acme HR Corp", password: "password", role: "business", company: "Acme Global Corp", country: "United States" },
        { email: "john.doe@payzati.io", name: "John Doe", password: "password", role: "employee", country: "United Kingdom", currency: "GBP", walletAddress: "$ilp.payzati.io/john-doe", salary: 4800 },
        { email: "priya.patel@payzati.io", name: "Priya Patel", password: "password", role: "employee", country: "India", currency: "INR", walletAddress: "$ilp.payzati.io/priya-patel", salary: 320000 },
        { email: "sarah.connor@payzati.io", name: "Sarah Connor", password: "password", role: "employee", country: "Canada", currency: "CAD", walletAddress: "$ilp.payzati.io/sarah-connor", salary: 5400 },
        { email: "hans.muller@payzati.io", name: "Hans Müller", password: "password", role: "employee", country: "Germany", currency: "EUR", walletAddress: "$ilp.payzati.io/hans-muller", salary: 4500 }
    ];
    state.wallets = {
        "hr@acme.corp": { balance: 280000, currency: "USD" },
        "john.doe@payzati.io": { balance: 9600, currency: "GBP" },
        "priya.patel@payzati.io": { balance: 640000, currency: "INR" },
        "sarah.connor@payzati.io": { balance: 10800, currency: "CAD" },
        "hans.muller@payzati.io": { balance: 9000, currency: "EUR" }
    };
    state.transactions = [
        { id: "PZ-ILP-749102", sender: "Acme Global Corp", receiver: "John Doe", amount: 4800, currency: "GBP", country: "United Kingdom", date: "2026-05-01", status: "delivered", feeSaved: 168.00 },
        { id: "PZ-ILP-381904", sender: "Acme Global Corp", receiver: "Priya Patel", amount: 320000, currency: "INR", country: "India", date: "2026-05-01", status: "delivered", feeSaved: 112.50 }
    ];
    state.taxCompliance = [
        { country: "United Kingdom", taxRate: 20, status: "compliant", requirements: "PAYE tax codes assigned, real-time RTI filings up to date" },
        { country: "India", taxRate: 12, status: "compliant", requirements: "TDS deducted under Section 192, quarterly Form 24Q complete" },
        { country: "Canada", taxRate: 18, status: "compliant", requirements: "CPP & EI employer rates matched, T4 slips queued for fiscal close" },
        { country: "Germany", taxRate: 25, status: "attention", requirements: "Lohnsteuer certificates pending local validation, W-8BEN-E renew required" }
    ];
}

// Persist state to JSON DB
async function persistState() {
    try {
        await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                users: state.users,
                wallets: state.wallets,
                transactions: state.transactions,
                taxCompliance: state.taxCompliance
            })
        });
    } catch (e) {
        console.warn('Network offline. Data saved in browser session cache.');
    }
}

// Initialize navigation actions
function initNav() {
    $all('.nav-btn').forEach(button => {
        button.addEventListener('click', () => {
            const section = button.dataset.section;
            renderSection(section);
        });
    });
}

// Render dynamic sections
function renderSection(name) {
    // Toggle active classes
    $all('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.section === name));
    $all('.section').forEach(sec => sec.classList.remove('active'));
    $(`#sec-${name}`).classList.add('active');

    // Header updates
    let title = 'Portal';
    if (name === 'business-db') title = 'Business Dashboard Overview';
    else if (name === 'employee-db') title = 'Employee Remittance Terminal';
    else if (name === 'tax-compliance') title = 'Global Tax Compliance';
    else if (name === 'tx-history') title = 'Interledger Payment Ledger';
    else if (name === 'wallet') title = 'Open Payments Reserve Wallet';
    
    $('#section-title').textContent = title;

    // Load section specific data
    if (name === 'business-db') {
        renderBusinessDashboard();
    } else if (name === 'employee-db') {
        renderEmployeeDashboard();
    } else if (name === 'tax-compliance') {
        renderTaxCompliance();
    } else if (name === 'tx-history') {
        renderTransactionHistory();
    } else if (name === 'wallet') {
        renderWalletOverview();
    }
}

// Authentication Select Role Pill Switcher
function selectLoginRole(role) {
    state.selectedLoginRole = role;
    $('#pill-business').classList.toggle('active', role === 'business');
    $('#pill-employee').classList.toggle('active', role === 'employee');
    
    // Auto populate fields for easy testing
    if (role === 'business') {
        $('#email').value = 'hr@acme.corp';
    } else {
        $('#email').value = 'john.doe@payzati.io';
    }
}

// Handle traditional login
function handleLogin(event) {
    event.preventDefault();
    const email = $('#email').value.trim();
    const password = $('#password').value;
    
    const user = state.users.find(u => u.email === email && u.password === password);
    if (!user) {
        alert('Invalid email or password! Please verify details.');
        return;
    }
    
    // Set testing account context role
    user.role = state.selectedLoginRole;
    loginSession(user);
}

// Google Sign-In simulated bypass
function handleGoogleSignIn() {
    let mockUser;
    if (state.selectedLoginRole === 'business') {
        mockUser = state.users.find(u => u.email === 'google.test.user@gmail.com') || state.users[0];
        mockUser.role = 'business';
    } else {
        mockUser = state.users.find(u => u.email === 'john.doe@payzati.io') || state.users[1];
        mockUser.role = 'employee';
    }
    loginSession(mockUser);
}

// Establish login session
function loginSession(user) {
    state.currentUser = user;
    localStorage.setItem('payzati_user_email', user.email);
    localStorage.setItem('payzati_user_role', user.role);

    // Sync profile display name and role card in sidebar
    $('#user-avatar').textContent = user.name.split(' ').map(n=>n.charAt(0)).join('').toUpperCase().slice(0, 2);
    $('#user-display-name').textContent = user.name;
    $('#user-display-role').textContent = user.role.toUpperCase();

    // Adjust Sidebar Navigation view specific to role to avoid user clutter!
    const isBiz = user.role === 'business';
    $('#nav-business-db').style.display = isBiz ? 'flex' : 'none';
    $('#nav-employee-db').style.display = !isBiz ? 'flex' : 'none';
    
    // Employees do not access tax setup
    $all('.nav-btn[data-section="tax-compliance"]').forEach(btn => {
        btn.style.display = isBiz ? 'flex' : 'none';
    });

    // Populate balances
    renderBalancesUI();

    // Switch Screens
    $('#login-screen').classList.add('hidden');
    $('#app').classList.remove('hidden');

    // Load initial section
    renderSection(isBiz ? 'business-db' : 'employee-db');
}

// Handle logout
function handleLogout() {
    state.currentUser = null;
    localStorage.removeItem('payzati_user_email');
    localStorage.removeItem('payzati_user_role');
    $('#app').classList.add('hidden');
    $('#login-screen').classList.remove('hidden');
}

// Sync Balances UI
function renderBalancesUI() {
    if (!state.currentUser) return;
    const email = state.currentUser.email;
    const w = state.wallets[email] || { balance: 0, currency: 'USD' };
    
    const formatted = formatCurrency(w.balance, w.currency);
    $('#user-wallet-bal').textContent = formatted;
}

// Check Auto Login
function checkAutoLogin() {
    const email = localStorage.getItem('payzati_user_email');
    const role = localStorage.getItem('payzati_user_role');
    if (email && role) {
        const user = state.users.find(u => u.email === email);
        if (user) {
            user.role = role;
            loginSession(user);
        }
    }
}

// Currency formatter
function formatCurrency(amount, currency) {
    let symbol = '$';
    if (currency === 'GBP') symbol = '£';
    else if (currency === 'INR') symbol = '₹';
    else if (currency === 'EUR') symbol = '€';
    else if (currency === 'CAD') symbol = 'C$ ';
    
    return symbol + parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// -----------------------------------------------------------------
// BUSINESS DASHBOARD TERMINAL
// -----------------------------------------------------------------
let payrollRows = [];

function renderBusinessDashboard() {
    // Stat 1: Total Payroll Sent
    const totalSentUSD = state.transactions
        .filter(t => t.status === 'delivered')
        .reduce((sum, t) => sum + (t.amount / EXCHANGE_RATES[t.currency]), 0);
    $('#biz-stat-total-sent').textContent = formatCurrency(totalSentUSD, 'USD');

    // Stat 2: Number of Employees Paid
    const uniqueEmployees = [...new Set(state.transactions.map(t => t.receiver))];
    $('#biz-stat-count-paid').textContent = uniqueEmployees.length;

    // Stat 3: Countries Covered
    const uniqueCountries = [...new Set(state.transactions.map(t => t.country))];
    $('#biz-stat-countries').textContent = uniqueCountries.length || 1;

    // Stat 4: Fees Saved
    const totalFeesSaved = state.transactions.reduce((sum, t) => sum + (t.feeSaved || 0), 0);
    $('#biz-stat-fees-saved').textContent = formatCurrency(totalFeesSaved, 'USD');

    // Prepopulate Payroll rows list
    const employees = state.users.filter(u => u.role === 'employee');
    payrollRows = employees.map(emp => ({
        name: emp.name,
        country: emp.country,
        walletAddress: emp.walletAddress || `$ilp.payzati.io/${emp.name.toLowerCase().replace(/ /g, '-')}`,
        amount: emp.salary,
        currency: emp.currency || 'USD'
    }));

    renderPayrollRows();
}

function renderPayrollRows() {
    const container = $('#payroll-rows-container');
    container.innerHTML = '';

    payrollRows.forEach((row, index) => {
        const item = document.createElement('div');
        item.className = 'payroll-row';
        item.innerHTML = `
            <input type="text" placeholder="Employee/Vendor Name" value="${row.name}" oninput="updatePayrollRow(${index}, 'name', this.value)" />
            
            <select onchange="updatePayrollRow(${index}, 'country', this.value); handlePayrollCountryChange(${index}, this.value)">
                <option value="United Kingdom" ${row.country === 'United Kingdom' ? 'selected' : ''}>United Kingdom</option>
                <option value="India" ${row.country === 'India' ? 'selected' : ''}>India</option>
                <option value="Canada" ${row.country === 'Canada' ? 'selected' : ''}>Canada</option>
                <option value="Germany" ${row.country === 'Germany' ? 'selected' : ''}>Germany</option>
            </select>
            
            <input type="text" placeholder="ILP Wallet pointer" value="${row.walletAddress}" oninput="updatePayrollRow(${index}, 'walletAddress', this.value)" style="font-family: monospace;" />
            
            <div style="display: flex; align-items: center; gap: 0.25rem;">
                <span style="font-size: 0.8rem; font-weight: bold; color: var(--color-turquoise);" id="row-curr-lbl-${index}">${row.currency}</span>
                <input type="number" placeholder="Salary" value="${row.amount}" oninput="updatePayrollRow(${index}, 'amount', this.value)" style="width: 100%;" />
            </div>
            
            <button class="remove-row-btn" onclick="removePayrollRow(${index})">✕</button>
        `;
        container.appendChild(item);
    });

    calculatePayrollSummary();
}

function addPayrollRow() {
    payrollRows.push({
        name: "",
        country: "United Kingdom",
        walletAddress: "$ilp.payzati.io/",
        amount: 3000,
        currency: "GBP"
    });
    renderPayrollRows();
}

function removePayrollRow(index) {
    payrollRows.splice(index, 1);
    renderPayrollRows();
}

function updatePayrollRow(index, field, value) {
    if (field === 'amount') {
        payrollRows[index][field] = parseFloat(value) || 0;
    } else {
        payrollRows[index][field] = value;
    }
    calculatePayrollSummary();
}

function handlePayrollCountryChange(index, country) {
    let currency = 'USD';
    if (country === 'United Kingdom') currency = 'GBP';
    else if (country === 'India') currency = 'INR';
    else if (country === 'Canada') currency = 'CAD';
    else if (country === 'Germany') currency = 'EUR';
    
    payrollRows[index].currency = currency;
    payrollRows[index].walletAddress = `$ilp.payzati.io/${payrollRows[index].name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'worker'}`;
    
    // Auto recalculate or refresh UI elements
    renderPayrollRows();
}

function calculatePayrollSummary() {
    let totalUsd = 0;
    payrollRows.forEach(row => {
        const rate = EXCHANGE_RATES[row.currency] || 1.0;
        totalUsd += (row.amount / rate);
    });

    $('#payroll-sum-total').textContent = formatCurrency(totalUsd, 'USD');
    return totalUsd;
}

// Switch between Employee Mock options in Business view for demonstration
function switchEmployeeMockContext(email) {
    state.activeEmployeeMock = email;
}

function simulateContextShift() {
    const user = state.users.find(u => u.email === state.activeEmployeeMock);
    if (user) {
        user.role = 'employee';
        loginSession(user);
    }
}

// -----------------------------------------------------------------
// BATCH PACKET DISPERSION SIMULATOR
// -----------------------------------------------------------------
function executeBatchPayroll() {
    if (payrollRows.length === 0) {
        alert("Please add at least one worker to execute payroll.");
        return;
    }

    const totalUsdNeeded = calculatePayrollSummary();
    const bizEmail = state.currentUser.email;
    const w = state.wallets[bizEmail];

    if (w.balance < totalUsdNeeded) {
        alert(`Insufficient reserves! Your balance is ${formatCurrency(w.balance, 'USD')}, but this payroll requires ${formatCurrency(totalUsdNeeded, 'USD')}. Please Top Up your settlement wallet.`);
        return;
    }

    // Launch progressive batch modal
    const overlay = $('#batch-modal-overlay');
    const log = $('#batch-steps-log');
    const btnDismiss = $('#btn-close-batch-modal');

    overlay.classList.remove('hidden');
    log.innerHTML = '';
    btnDismiss.style.display = 'none';

    // Steps logging sequence
    let currentStep = 0;
    const steps = [
        { msg: "🔑 Initiating batch payroll via corporate settlement keys...", delay: 200 },
        { msg: "📶 Fetching live FX conversion sheets for GBP, INR, EUR, CAD...", delay: 500 },
        { msg: "🛡️ Performing real-time automated tax compliance matching...", delay: 800 }
    ];

    // Build specific payout step records
    payrollRows.forEach(row => {
        const standardWireFee = 35.00; // typical wire charge
        const spreadFee = (row.amount / EXCHANGE_RATES[row.currency]) * 0.025; // 2.5% fx spread savings
        const savings = standardWireFee + spreadFee;

        steps.push({
            msg: `📡 Streaming micro-packets to ${row.name} (${row.walletAddress}) | Amount: ${formatCurrency(row.amount, row.currency)} | fee saved: $${savings.toFixed(2)}`,
            delay: 1100,
            execPay: () => {
                // credit employee wallet instantly
                const empUser = state.users.find(u => u.name === row.name);
                if (empUser && state.wallets[empUser.email]) {
                    state.wallets[empUser.email].balance += row.amount;
                }

                // deduct from business
                const usdVal = row.amount / (EXCHANGE_RATES[row.currency] || 1);
                state.wallets[bizEmail].balance -= usdVal;

                // Log transaction record
                state.transactions.unshift({
                    id: "PZ-ILP-" + Math.floor(100000 + Math.random() * 900000),
                    sender: state.currentUser.company || "Acme Global Corp",
                    receiver: row.name,
                    amount: row.amount,
                    currency: row.currency,
                    country: row.country,
                    date: new Date().toISOString().split('T')[0],
                    status: 'delivered',
                    feeSaved: parseFloat(savings.toFixed(2))
                });
            }
        });
    });

    steps.push({ msg: "⚡ Dynamic routing complete. Instant multi-currency settlements finalized!", delay: 2600 });
    steps.push({ msg: "✅ Batch status: DELIVERED | Settlement time: 2.4s | Total fees saved: standard SWIFT wires eliminated.", delay: 3000 });

    // Run steps in sequence
    steps.forEach((step, idx) => {
        setTimeout(() => {
            const p = document.createElement('div');
            p.className = 'process-step-item success';
            p.textContent = step.msg;
            log.appendChild(p);
            log.scrollTop = log.scrollHeight;

            if (step.execPay) step.execPay();

            if (idx === steps.length - 1) {
                btnDismiss.style.display = 'inline-flex';
                // Sync balances
                renderBalancesUI();
                persistState();
            }
        }, step.delay);
    });
}

function closeBatchModal() {
    $('#batch-modal-overlay').classList.add('hidden');
    renderSection('tx-history');
}

// -----------------------------------------------------------------
// EMPLOYEE DASHBOARD
// -----------------------------------------------------------------
function renderEmployeeDashboard() {
    if (!state.currentUser || state.currentUser.role !== 'employee') return;
    const email = state.currentUser.email;
    const w = state.wallets[email] || { balance: 0, currency: 'USD' };

    $('#emp-card-subtitle').textContent = `${state.currentUser.name}'s Salary Balance`;
    $('#emp-balance-huge').textContent = formatCurrency(w.balance, w.currency);
    $('#emp-pointer-label').textContent = state.currentUser.walletAddress || `$ilp.payzati.io/worker`;
    $('#emp-base-salary').textContent = formatCurrency(state.currentUser.salary, w.currency);
    $('#emp-country-origin').textContent = state.currentUser.country;

    // Filter personal wages
    const personalHistory = state.transactions.filter(t => t.receiver === state.currentUser.name);
    const tbody = $('#employee-history-table');
    tbody.innerHTML = '';

    if (personalHistory.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No payroll remittances discovered. Run payroll from the Business Portal to credit this employee!</td></tr>`;
        return;
    }

    personalHistory.forEach(t => {
        const tr = document.createElement('tr');
        
        // Calculate tax withholding estimation
        const matchedTax = state.taxCompliance.find(tc => tc.country === state.currentUser.country);
        const taxRate = matchedTax ? matchedTax.taxRate : 15;
        const taxDeducted = t.amount * (taxRate / 100);
        const netReceived = t.amount - taxDeducted;

        tr.innerHTML = `
            <td style="font-family: monospace; font-weight: 700; color: var(--color-turquoise);">${t.id}</td>
            <td>${t.sender}</td>
            <td style="font-weight: 600;">${formatCurrency(t.amount, t.currency)}</td>
            <td style="color: #fda4af;">${formatCurrency(taxDeducted, t.currency)} (${taxRate}%)</td>
            <td style="font-weight: 800; color: var(--color-emerald);">${formatCurrency(netReceived, t.currency)}</td>
            <td>${t.date}</td>
            <td><span class="status-pill delivered">Delivered</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function triggerMockPacketReceiver() {
    const flow = $('#emp-packet-flow');
    const status = $('#emp-stream-status');
    const desc = $('#emp-stream-desc');

    status.textContent = "SYNCHRONIZING INCOMING STREAM...";
    status.style.color = 'var(--color-turquoise)';
    
    // Simulate streaming packets
    let packetCount = 0;
    const interval = setInterval(() => {
        packetCount += 25;
        desc.textContent = `Streaming packets received: ${packetCount} / 100 settled successfully`;
        
        if (packetCount >= 100) {
            clearInterval(interval);
            status.textContent = "PACKET DISPERSION STREAM COMPLETE";
            status.style.color = 'var(--color-emerald)';
            desc.textContent = `Salaries deposited instantly. Settlement fees zero.`;
        }
    }, 450);
}

// -----------------------------------------------------------------
// GLOBAL TAX COMPLIANCE
// -----------------------------------------------------------------
function renderTaxCompliance() {
    const container = $('#compliance-countries-container');
    container.innerHTML = '';

    state.taxCompliance.forEach(tc => {
        const bar = document.createElement('div');
        bar.className = 'country-compliance-bar';
        
        let flag = '🌍';
        if (tc.country === 'United Kingdom') flag = '🇬🇧';
        else if (tc.country === 'India') flag = '🇮🇳';
        else if (tc.country === 'Canada') flag = '🇨🇦';
        else if (tc.country === 'Germany') flag = '🇩🇪';

        const statusClass = tc.status === 'compliant' ? 'ok' : 'attention';
        const statusLabel = tc.status === 'compliant' ? '✔ Compliant' : '⚠ Action Needed';

        bar.innerHTML = `
            <div class="country-flag-title">
                <span class="flag-icon">${flag}</span>
                <div class="country-info-wrap">
                    <span class="country-name">${tc.country}</span>
                    <span class="country-reqs">${tc.requirements}</span>
                </div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 1.5rem;">
                <span class="tax-badge">Withholding rate: ${tc.taxRate}%</span>
                <span class="compliance-status ${statusClass}">${statusLabel}</span>
            </div>
        `;
        container.appendChild(bar);
    });

    runTaxCalculator();
}

function runTaxCalculator() {
    const country = $('#tax-calc-country').value;
    const gross = parseFloat($('#tax-calc-amount').value) || 0;
    
    const tc = state.taxCompliance.find(t => t.country === country);
    const rate = tc ? tc.taxRate : 15;
    const result = gross * (rate / 100);

    $('#tax-calc-result').textContent = formatCurrency(result, 'USD');
}

// -----------------------------------------------------------------
// INTERLEDGER TRANSACTION HISTORY
// -----------------------------------------------------------------
function renderTransactionHistory() {
    const tbody = $('#history-table-body');
    tbody.innerHTML = '';

    if (state.transactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted);">No payroll payments discovered yet.</td></tr>`;
        return;
    }

    state.transactions.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-family: monospace; font-weight: 700; color: var(--color-turquoise);">${t.id}</td>
            <td>${t.sender}</td>
            <td>${t.receiver}</td>
            <td style="font-weight: 700;">${formatCurrency(t.amount, t.currency)}</td>
            <td style="font-weight: bold; color: var(--text-secondary);">${t.currency}</td>
            <td>${t.country}</td>
            <td>${t.date}</td>
            <td><span class="status-pill ${t.status}">${t.status}</span></td>
            <td style="font-weight: 800; color: var(--color-emerald);">${formatCurrency(t.feeSaved, 'USD')}</td>
        `;
        tbody.appendChild(tr);
    });

    // Render total platform savings
    const totalFeesSaved = state.transactions.reduce((sum, t) => sum + (t.feeSaved || 0), 0);
    $('#ledger-savings-stat').textContent = formatCurrency(totalFeesSaved, 'USD');
}

// -----------------------------------------------------------------
// WALLET MANAGEMENT & OPEN PAYMENTS TOP-UP
// -----------------------------------------------------------------
function renderWalletOverview() {
    if (!state.currentUser) return;
    const email = state.currentUser.email;
    const w = state.wallets[email] || { balance: 0, currency: 'USD' };

    $('#wallet-balance-display').textContent = formatCurrency(w.balance, w.currency);
}

function openBankWidget() {
    const amt = parseFloat($('#topup-amount').value);
    if (isNaN(amt) || amt <= 0) {
        alert("Please enter a valid positive dollar amount to fund.");
        return;
    }
    $('#bank-modal-overlay').classList.remove('hidden');
}

function closeBankWidget() {
    $('#bank-modal-overlay').classList.add('hidden');
}

function executeBankSelection(bankName) {
    const amt = parseFloat($('#topup-amount').value) || 0;
    const email = state.currentUser.email;

    closeBankWidget();

    // Trigger instant Open Payments funding load
    alert(`Successfully authorized via ${bankName}!\nDeposited ${formatCurrency(amt, 'USD')} into your Payzati reserve wallet instantly.`);

    state.wallets[email].balance += amt;
    
    // Add transaction history line
    state.transactions.unshift({
        id: "PZ-OPY-" + Math.floor(100000 + Math.random() * 900000),
        sender: `${bankName} Settlement Account`,
        receiver: state.currentUser.company || "Acme Global Corp",
        amount: amt,
        currency: "USD",
        country: "United States",
        date: new Date().toISOString().split('T')[0],
        status: 'delivered',
        feeSaved: 0
    });

    persistState();
    renderBalancesUI();
    renderWalletOverview();
}

// On startup
window.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    checkAutoLogin();
    initNav();
});
