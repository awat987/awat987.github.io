// Expense Report Logic

document.addEventListener('DOMContentLoaded', function() {
    const expenseModal = document.getElementById('expenseModal');
    const openExpenseModalBtn = document.getElementById('openExpenseModal');
    const closeExpenseModalBtn = document.getElementById('closeExpenseModal');
    const expenseForm = document.getElementById('expenseForm');
    const expenseList = document.getElementById('expenseList');
    const expenseTotal = document.getElementById('expenseTotal');
    let editingIdx = null;

    function getExpenses() {
        return JSON.parse(localStorage.getItem('expensesList') || '[]');
    }
    function saveExpenses(expenses) {
        localStorage.setItem('expensesList', JSON.stringify(expenses));
    }
    function formatAmount(amount) {
        return '$' + Number(amount).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
    }
    function renderExpenses() {
        const expenses = getExpenses();
        let total = 0;
        expenseList.innerHTML = '';
        if (!expenses.length) {
            expenseList.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#bbb;">No expenses yet.</td></tr>';
        } else {
            expenses.forEach((exp, idx) => {
                total += Number(exp.amount) || 0;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${exp.photo ? `<img src="${exp.photo}" alt="Receipt" style="width:48px;height:48px;object-fit:cover;border-radius:6px;">` : ''}</td>
                    <td>${formatAmount(exp.amount)}</td>
                    <td>${exp.date || ''}</td>
                    <td>${exp.vendor || ''}</td>
                    <td>${(exp.tags||[]).map(tag => `<span class='expense-tag' data-tag='${tag}'>${tag}</span>`).join('')}</td>
                    <td><span class="expense-notes" title="${exp.notes ? exp.notes.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''}">${exp.notes || ''}</span></td>
                    <td><button class="action-btn delete-expense-btn" data-idx="${idx}"><i class="fas fa-trash"></i></button></td>
                `;
                expenseList.appendChild(tr);
            });
        }
        expenseTotal.textContent = formatAmount(total);
        // Attach delete handlers
        document.querySelectorAll('.delete-expense-btn').forEach(btn => btn.onclick = function() {
            const idx = this.getAttribute('data-idx');
            let expenses = getExpenses();
            expenses.splice(idx, 1);
            saveExpenses(expenses);
            renderExpenses();
        });
    }

    // Modal logic
    function openModal() {
        expenseModal.style.display = 'block';
        expenseForm.reset();
        editingIdx = null;
        // Autofocus first field
        setTimeout(() => { expenseForm.expensePhoto.focus(); }, 100);
        // Remove old preview
        const oldPreview = document.getElementById('expenseReceiptPreview');
        if (oldPreview) oldPreview.remove();
    }
    function closeModal() {
        expenseModal.style.display = 'none';
        expenseForm.reset();
        editingIdx = null;
        // Remove preview
        const oldPreview = document.getElementById('expenseReceiptPreview');
        if (oldPreview) oldPreview.remove();
    }
    openExpenseModalBtn && openExpenseModalBtn.addEventListener('click', openModal);
    closeExpenseModalBtn && closeExpenseModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', function(e) {
        if (e.target === expenseModal) closeModal();
    });

    // Receipt image preview
    expenseForm.expensePhoto.addEventListener('change', function(e) {
        const file = this.files[0];
        const oldPreview = document.getElementById('expenseReceiptPreview');
        if (oldPreview) oldPreview.remove();
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'expense-receipt-preview';
                img.id = 'expenseReceiptPreview';
                expenseForm.expensePhoto.parentElement.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });

    // Add expense
    expenseForm && expenseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const form = e.target;
        const amount = form.expenseAmount.value;
        const date = form.expenseDate.value;
        const vendor = form.expenseVendor.value.trim();
        const notes = form.expenseNotes.value.trim();
        const tags = Array.from(form.expenseTags.selectedOptions).map(opt => opt.value);
        const file = form.expensePhoto.files[0];
        function saveExpense(photoDataUrl) {
            let expenses = getExpenses();
            const expense = { amount, date, vendor, notes, tags, photo: photoDataUrl };
            expenses.unshift(expense);
            saveExpenses(expenses);
            renderExpenses();
            closeModal();
        }
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                saveExpense(e.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            saveExpense('');
        }
    });

    renderExpenses();
}); 