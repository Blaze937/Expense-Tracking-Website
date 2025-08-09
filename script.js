// Storage data
let expenses = [];
let budget = 0;
let reminder = null;

// DOM Elements
const expenseForm = document.getElementById('expense-form');
const expenseName = document.getElementById('expense-name');
const expenseAmount = document.getElementById('expense-amount');
const expenseCategory = document.getElementById('expense-category');
const expenseDate = document.getElementById('expense-date');
const expenseList = document.getElementById('expense-list');
const totalAmount = document.getElementById('total-amount');
const totalAmountStat = document.getElementById('total-amount-stat');
const filterCategory = document.getElementById('filter-category');
const budgetForm = document.getElementById('budget-form');
const budgetAmount = document.getElementById('budget-amount');
const budgetDisplay = document.getElementById('budget-display');
const budgetDisplayStat = document.getElementById('budget-display-stat');
const budgetStatus = document.getElementById('budget-status');
const budgetProgressFill = document.getElementById('budget-progress-fill');
const budgetProgressText = document.getElementById('budget-progress-text');
const remainingAmount = document.getElementById('remaining-amount');
const chartCanvas = document.getElementById('expense-chart');
const reminderForm = document.getElementById('reminder-form');
const reminderEmail = document.getElementById('reminder-email');
const reminderTime = document.getElementById('reminder-time');
const reminderStatus = document.getElementById('reminder-status');
const reportTotal = document.getElementById('report-total');
const reportCategories = document.getElementById('report-categories');

let chart;
let editIndex = null;

// Initialize the app
function init() {
    // Load data from localStorage
    expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    budget = Number(localStorage.getItem('budget')) || 0;
    reminder = JSON.parse(localStorage.getItem('reminder')) || null;
    
    // Set today's date as default
    expenseDate.valueAsDate = new Date();
    
    // Display initial data
    renderExpenses();
    updateBudgetDisplay();
    updateChart();
    updateReport();
    updateStats();
    
    if (reminder) {
        displayReminderStatus();
    }
}

// Render expenses in table
function renderExpenses(filter = "All") {
    expenseList.innerHTML = '';
    let filtered = filter === "All" ? expenses : expenses.filter(e => e.category === filter);
    let total = 0;
    
    if (filtered.length === 0) {
        expenseList.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: #718096;">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    No expenses found
                </td>
            </tr>
        `;
    } else {
        filtered.forEach((expense, idx) => {
            total += Number(expense.amount);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="font-weight: 500;">${expense.name}</div>
                </td>
                <td style="font-weight: 600; color: #667eea;">₹${Number(expense.amount).toFixed(2)}</td>
                <td>${getCategoryDisplay(expense.category)}</td>
                <td>${formatDate(expense.date)}</td>
                <td>
                    <button onclick="editExpense(${idx})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteExpense(${idx})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            expenseList.appendChild(tr);
        });
    }
    
    totalAmount.textContent = total.toFixed(2);
    updateStats();
    updateBudgetStatus();
    updateChart();
    updateReport();
}

// Get category display with emoji
function getCategoryDisplay(category) {
    const categoryMap = {
        'Food': '🍽️ Food & Dining',
        'Transport': '🚗 Transport',
        'Entertainment': '🎬 Entertainment',
        'Shopping': '🛍️ Shopping',
        'Bills': '💡 Bills & Utilities',
        'Health': '🏥 Healthcare',
        'Other': '📦 Other'
    };
    return categoryMap[category] || category;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Update stats cards
function updateStats() {
    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    totalAmountStat.textContent = total.toFixed(2);
    budgetDisplayStat.textContent = budget.toFixed(2);
    
    const remaining = budget - total;
    remainingAmount.textContent = remaining.toFixed(2);
    remainingAmount.style.color = remaining >= 0 ? '#48bb78' : '#f56565';
}

// Add or update expense
expenseForm.onsubmit = function(e) {
    e.preventDefault();
    const name = expenseName.value.trim();
    const amount = Number(expenseAmount.value);
    const category = expenseCategory.value;
    const date = expenseDate.value;

    if (editIndex !== null) {
        // Update existing expense
        const filter = filterCategory.value;
        let filtered = filter === "All" ? expenses : expenses.filter(e => e.category === filter);
        const expenseToEdit = filtered[editIndex];
        const realIdx = expenses.findIndex(e =>
            e.name === expenseToEdit.name &&
            e.amount === expenseToEdit.amount &&
            e.category === expenseToEdit.category &&
            e.date === expenseToEdit.date
        );
        if (realIdx > -1) {
            expenses[realIdx] = { name, amount, category, date };
            localStorage.setItem('expenses', JSON.stringify(expenses));
        }
        editIndex = null;
        expenseForm.querySelector('button[type="submit"]').innerHTML = `
            <i class="fas fa-plus"></i>
            <span>Add Expense</span>
        `;
    } else {
        // Add new expense
        expenses.push({ name, amount, category, date });
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }
    
    expenseForm.reset();
    expenseDate.valueAsDate = new Date(); // Reset to today's date
    renderExpenses(filterCategory.value);
    
    // Show success animation
    showNotification('Expense saved successfully!', 'success');
};

// Edit expense
window.editExpense = function(idx) {
    const filter = filterCategory.value;
    let filtered = filter === "All" ? expenses : expenses.filter(e => e.category === filter);
    const expense = filtered[idx];
    
    expenseName.value = expense.name;
    expenseAmount.value = expense.amount;
    expenseCategory.value = expense.category;
    expenseDate.value = expense.date;
    editIndex = idx;
    
    expenseForm.querySelector('button[type="submit"]').innerHTML = `
        <i class="fas fa-save"></i>
        <span>Update Expense</span>
    `;
    
    expenseName.focus();
    expenseName.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// Delete expense
window.deleteExpense = function(idx) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    const filter = filterCategory.value;
    let filtered = filter === "All" ? expenses : expenses.filter(e => e.category === filter);
    const expenseToDelete = filtered[idx];
    const realIdx = expenses.findIndex(e =>
        e.name === expenseToDelete.name &&
        e.amount === expenseToDelete.amount &&
        e.category === expenseToDelete.category &&
        e.date === expenseToDelete.date
    );
    
    if (realIdx > -1) {
        expenses.splice(realIdx, 1);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        renderExpenses(filterCategory.value);
        showNotification('Expense deleted successfully!', 'success');
    }
    
    // Reset form if deleting the expense being edited
    if (editIndex === idx) {
        expenseForm.reset();
        editIndex = null;
        expenseForm.querySelector('button[type="submit"]').innerHTML = `
            <i class="fas fa-plus"></i>
            <span>Add Expense</span>
        `;
    }
};

// Filter by category
filterCategory.onchange = function() {
    renderExpenses(this.value);
};

// Budget form submission
budgetForm.onsubmit = function(e) {
    e.preventDefault();
    budget = Number(budgetAmount.value);
    localStorage.setItem('budget', budget);
    updateBudgetDisplay();
    updateStats();
    budgetForm.reset();
    showNotification('Budget updated successfully!', 'success');
};

// Update budget display
function updateBudgetDisplay() {
    budgetDisplay.textContent = budget.toFixed(2);
    budgetDisplayStat.textContent = budget.toFixed(2);
    updateBudgetStatus();
}

// Update budget status and progress
function updateBudgetStatus() {
    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    
    if (!budget) {
        budgetStatus.textContent = '';
        budgetProgressFill.style.width = '0%';
        budgetProgressText.textContent = 'No budget set';
        return;
    }
    
    const percentage = Math.min((total / budget) * 100, 100);
    const remaining = budget - total;
    
    budgetProgressFill.style.width = `${percentage}%`;
    budgetProgressText.textContent = `${Math.round(percentage)}% used`;
    
    if (total > budget) {
        budgetStatus.textContent = `Over budget by ₹${Math.abs(remaining).toFixed(2)}`;
        budgetStatus.style.background = 'linear-gradient(135deg, #fc466b, #3f5efb)';
        budgetStatus.style.color = 'white';
        budgetProgressFill.style.background = 'linear-gradient(90deg, #fc466b, #3f5efb)';
    } else if (percentage >= 80) {
        budgetStatus.textContent = `₹${remaining.toFixed(2)} remaining (${Math.round(100-percentage)}% left)`;
        budgetStatus.style.background = 'linear-gradient(135deg, #feca57, #ff9ff3)';
        budgetStatus.style.color = 'white';
        budgetProgressFill.style.background = 'linear-gradient(90deg, #feca57, #ff9ff3)';
    } else {
        budgetStatus.textContent = `₹${remaining.toFixed(2)} remaining (${Math.round(100-percentage)}% left)`;
        budgetStatus.style.background = 'linear-gradient(135deg, #11998e, #38ef7d)';
        budgetStatus.style.color = 'white';
        budgetProgressFill.style.background = 'linear-gradient(90deg, #48bb78, #68d391)';
    }
}

// Update chart visualization
function updateChart() {
    const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'];
    const data = categories.map(cat =>
        expenses.filter(e => e.category === cat).reduce((sum, e) => sum + Number(e.amount), 0)
    );
    
    // Filter out categories with no expenses
    const filteredData = [];
    const filteredLabels = [];
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b'];
    const filteredColors = [];
    
    categories.forEach((cat, idx) => {
        if (data[idx] > 0) {
            filteredData.push(data[idx]);
            filteredLabels.push(getCategoryDisplay(cat));
            filteredColors.push(colors[idx]);
        }
    });
    
    if (chart) chart.destroy();
    
    if (filteredData.length === 0) {
        // Show empty state
        const ctx = chartCanvas.getContext('2d');
        ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
        ctx.font = '16px Inter';
        ctx.fillStyle = '#718096';
        ctx.textAlign = 'center';
        ctx.fillText('No expenses to display', chartCanvas.width / 2, chartCanvas.height / 2);
        return;
    }
    
    chart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
            labels: filteredLabels,
            datasets: [{
                data: filteredData,
                backgroundColor: filteredColors,
                borderWidth: 3,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            family: 'Inter',
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = '₹' + context.parsed.toFixed(2);
                            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Update report
function updateReport() {
    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    reportTotal.textContent = total.toFixed(2);

    const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'];
    reportCategories.innerHTML = '';
    
    categories.forEach(cat => {
        const catTotal = expenses
            .filter(e => e.category === cat)
            .reduce((sum, e) => sum + Number(e.amount), 0);
        
        if (catTotal > 0) {
            const div = document.createElement('div');
            div.className = 'category-item';
            div.innerHTML = `
                <span class="category-name">${getCategoryDisplay(cat)}</span>
                <span class="category-amount">₹${catTotal.toFixed(2)}</span>
            `;
            reportCategories.appendChild(div);
        }
    });
}

// Email reminder form
reminderForm.onsubmit = function(e) {
    e.preventDefault();
    reminder = {
        email: reminderEmail.value,
        time: reminderTime.value
    };
    localStorage.setItem('reminder', JSON.stringify(reminder));
    displayReminderStatus();
    reminderForm.reset();
    showNotification('Reminder set successfully!', 'success');
};

// Display reminder status
function displayReminderStatus() {
    reminderStatus.innerHTML = `
        <i class="fas fa-check-circle"></i>
        Reminder set for <strong>${reminder.email}</strong> at <strong>${reminder.time}</strong>
        <small style="display: block; margin-top: 0.5rem; opacity: 0.8;">(UI demonstration only)</small>
    `;
    reminderStatus.style.background = 'linear-gradient(135deg, #48bb78, #68d391)';
    reminderStatus.style.color = 'white';
    reminderStatus.style.padding = '1rem';
    reminderStatus.style.borderRadius = '8px';
    reminderStatus.style.marginTop = '1rem';
}

// Print report
document.getElementById('print-report-btn').onclick = function() {
    window.print();
};

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === 'success' ? 'linear-gradient(135deg, #48bb78, #68d391)' : 'linear-gradient(135deg, #667eea, #764ba2)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        font-weight: 500;
        z-index: 1000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}" style="margin-right: 0.5rem;"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);