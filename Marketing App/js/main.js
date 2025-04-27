document.addEventListener('DOMContentLoaded', function() {
    // Remove SPA navigation logic so links work normally
    // (No navLinks.forEach or e.preventDefault())

    // You can keep search and smooth scrolling if needed, or remove if not used
    // ...

    // --- Clients Page Modal Logic ---
    if (window.location.pathname.includes('clients.html')) {
        const addClientBtns = document.querySelectorAll('.add-client-btn');
        const addClientModal = document.getElementById('addClientModal');
        const closeAddClientModal = document.getElementById('closeAddClientModal');
        const cleaningType = document.getElementById('cleaningType');
        const occurrenceGroup = document.getElementById('occurrenceGroup');
        const addClientForm = document.getElementById('addClientForm');
        const clientTableBody = document.querySelector('.client-table tbody');

        function openModal() {
            addClientModal.style.display = 'block';
        }
        function closeModal() {
            addClientModal.style.display = 'none';
            addClientForm.reset();
            occurrenceGroup.style.display = 'none';
            editingClientIdx = null;
        }
        addClientBtns.forEach(btn => btn.addEventListener('click', openModal));
        closeAddClientModal && closeAddClientModal.addEventListener('click', closeModal);
        window.addEventListener('click', function(e) {
            if (e.target === addClientModal) closeModal();
        });
        cleaningType && cleaningType.addEventListener('change', function() {
            if (this.value === 'Routine Cleaning') {
                occurrenceGroup.style.display = 'block';
            } else {
                occurrenceGroup.style.display = 'none';
            }
        });

        // --- Client Table Logic ---
        function getClients() {
            return JSON.parse(localStorage.getItem('clientsList') || '[]');
        }
        function saveClients(clients) {
            localStorage.setItem('clientsList', JSON.stringify(clients));
        }
        function getInitials(name, email) {
            if (name) {
                const parts = name.trim().split(' ');
                if (parts.length === 1) return parts[0][0].toUpperCase();
                return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
            }
            if (email) return email[0].toUpperCase();
            return '?';
        }
        function renderClients() {
            const clients = getClients();
            clientTableBody.innerHTML = '';
            if (!clients.length) {
                clientTableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#bbb;">No clients yet.</td></tr>';
                return;
            }
            clients.forEach((client, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><div class="client-avatar">${getInitials(client.name, client.email)}</div></td>
                    <td>${client.name}</td>
                    <td>${client.email}</td>
                    <td>${client.phone}</td>
                    <td>${client.address}</td>
                    <td>${client.cleaningDate ? client.cleaningDate : ''}${client.cleaningTime ? '<br><span class=\'secondary\'>' + client.cleaningTime + '</span>' : ''}</td>
                    <td>${client.cleaningType}${client.occurrence ? '<br><span class=\'secondary\'>' + client.occurrence + '</span>' : ''}</td>
                    <td>${client.price ? '$'+client.price : ''}</td>
                    <td><button class="action-btn edit-client-btn" data-idx="${idx}"><i class="fas fa-edit"></i></button> <button class="action-btn delete-client-btn" data-idx="${idx}"><i class="fas fa-trash"></i></button></td>
                `;
                if (client.notes) tr.title = client.notes;
                clientTableBody.appendChild(tr);
            });
            // Attach edit/delete handlers
            document.querySelectorAll('.edit-client-btn').forEach(btn => btn.onclick = function() {
                const idx = this.getAttribute('data-idx');
                openEditClientModal(idx);
            });
            document.querySelectorAll('.delete-client-btn').forEach(btn => btn.onclick = function() {
                const idx = this.getAttribute('data-idx');
                if (confirm('Delete this client?')) {
                    const clients = getClients();
                    // Remove from calendarEvents as well
                    const clientName = clients[idx].name;
                    let calendarEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
                    calendarEvents = calendarEvents.filter(ev => ev.client !== clientName);
                    localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
                    // Remove from clients
                    clients.splice(idx, 1);
                    saveClients(clients);
                    renderClients();
                }
            });
        }
        // Edit client modal logic
        let editingClientIdx = null;
        function openEditClientModal(idx) {
            const clients = getClients();
            const client = clients[idx];
            editingClientIdx = idx;
            openModal();
            addClientForm.clientName.value = client.name;
            addClientForm.clientPhone.value = client.phone;
            addClientForm.clientEmail.value = client.email;
            addClientForm.clientAddress.value = client.address;
            addClientForm.cleaningDate.value = client.cleaningDate;
            addClientForm.cleaningTime.value = client.cleaningTime;
            addClientForm.cleaningType.value = client.cleaningType;
            if (client.cleaningType === 'Routine Cleaning') {
                occurrenceGroup.style.display = 'block';
                addClientForm.occurrence.value = client.occurrence;
            } else {
                occurrenceGroup.style.display = 'none';
                addClientForm.occurrence.value = '';
            }
            addClientForm.clientNotes.value = client.notes;
            addClientForm.clientPrice.value = client.price;
        }
        // Save (add or edit) client
        addClientForm && addClientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const form = e.target;
            const client = {
                name: form.clientName.value.trim(),
                phone: form.clientPhone.value.trim(),
                email: form.clientEmail.value.trim(),
                address: form.clientAddress.value.trim(),
                cleaningDate: form.cleaningDate.value,
                cleaningTime: form.cleaningTime.value,
                cleaningType: form.cleaningType.value,
                occurrence: form.cleaningType.value === 'Routine Cleaning' ? form.occurrence.value : '',
                notes: form.clientNotes.value.trim(),
                price: form.clientPrice.value.trim()
            };
            let clients = getClients();
            if (editingClientIdx !== null) {
                clients[editingClientIdx] = client;
                editingClientIdx = null;
            } else {
                clients.unshift(client); // Add to top
            }
            saveClients(clients);
            // --- Add to calendarEvents ---
            let calendarEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
            // Determine duration
            let duration = 4;
            if (client.cleaningType === 'Deep Cleaning' || client.cleaningType === 'Move in/out Cleaning') duration = 5;
            // Calculate end time
            let start = client.cleaningTime || '09:00';
            let [sh, sm] = start.split(':').map(Number);
            let endH = sh + duration;
            let end = `${String(endH).padStart(2, '0')}:${sm === 0 ? '00' : String(sm).padStart(2, '0')}`;
            // Recurrence
            let recurring = '';
            if (client.occurrence) {
                if (client.occurrence === 'Every week') recurring = 'weekly';
                else if (client.occurrence === 'Bi-weekly') recurring = 'weekly'; // Could be custom
                else if (client.occurrence === 'Monthly') recurring = 'monthly';
                else if (client.occurrence === 'Quarterly') recurring = 'monthly'; // Could be custom
            }
            // Event color by type
            let color = 'event-blue';
            if (client.cleaningType === 'Deep Cleaning' || client.cleaningType === 'Move in/out Cleaning') color = 'event-purple';
            else if (client.cleaningType === 'Routine Cleaning') color = 'event-green';
            // Notes
            let notes = `Phone: ${client.phone}\nEmail: ${client.email}\nAddress: ${client.address}\nType: ${client.cleaningType}\nPrice: ${client.price}\nNotes: ${client.notes}`;
            // Create event
            calendarEvents.push({
                id: Date.now() + Math.floor(Math.random()*10000),
                title: `${client.name} - ${client.cleaningType}`,
                type: 'Cleaning',
                client: client.name,
                date: client.cleaningDate,
                start: start,
                end: end,
                notes: notes,
                color: color,
                recurring: recurring
            });
            localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
            // --- End calendar event add ---
            renderClients();
            closeModal();
        });
        renderClients();
    }
}); 