document.addEventListener('DOMContentLoaded', function() {
    let tasks = JSON.parse(localStorage.getItem('thingsTasks')) || [];
    let minions = JSON.parse(localStorage.getItem('thingsMinions')) || [];
    const taskList = document.getElementById('thingsTaskList');
    const addBtn = document.getElementById('thingsAddBtn');
    let editingId = null;

    // Minion modal elements
    const minionModal = document.getElementById('minionModal');
    const addMinionsBtn = document.getElementById('addMinionsBtn');
    const closeMinionModal = document.getElementById('closeMinionModal');
    const minionForm = document.getElementById('minionForm');
    const minionNameInput = document.getElementById('minionName');
    const minionList = document.getElementById('minionList');

    // Label modal elements
    const labelModal = document.getElementById('labelModal');
    const closeLabelModal = document.getElementById('closeLabelModal');
    const labelForm = document.getElementById('labelForm');
    const labelNameInput = document.getElementById('labelName');
    const labelColorInput = document.getElementById('labelColor');
    const labelList = document.getElementById('labelList');
    let editingLabelKey = null;
    const addLabelBtn = document.getElementById('addLabelBtn');

    let justOpenedLabelModal = false;

    // Open/close minion modal
    addMinionsBtn.addEventListener('click', () => {
        minionModal.style.display = 'block';
        renderMinionList();
    });
    closeMinionModal.addEventListener('click', () => {
        minionModal.style.display = 'none';
    });
    window.addEventListener('click', (e) => {
        if (e.target === minionModal) minionModal.style.display = 'none';
    });

    // Open label modal
    function openLabelModal() {
        labelModal.style.display = 'block';
        renderLabelList();
        labelNameInput.value = '';
        labelColorInput.value = '#bdbdbd';
        editingLabelKey = null;
        justOpenedLabelModal = true;
    }
    // Close label modal
    closeLabelModal.addEventListener('click', () => { labelModal.style.display = 'none'; });
    window.addEventListener('click', (e) => {
        if (justOpenedLabelModal) {
            justOpenedLabelModal = false;
            return;
        }
        if (e.target === labelModal) labelModal.style.display = 'none';
    });

    // Add minion
    minionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = minionNameInput.value.trim();
        if (name && !minions.some(m => m.name === name)) {
            minions.push({ name });
            saveMinions();
            renderMinionList();
            minionNameInput.value = '';
        }
    });

    // Remove minion
    function removeMinion(name) {
        minions = minions.filter(m => m.name !== name);
        // Remove minion from tasks
        tasks.forEach(t => { if (t.minion === name) t.minion = null; });
        saveMinions();
        saveTasks();
        renderMinionList();
        renderTasks();
    }

    // Render minion list in modal
    function renderMinionList() {
        minionList.innerHTML = '';
        minions.forEach(m => {
            const li = document.createElement('li');
            li.textContent = m.name;
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-minion-btn';
            removeBtn.title = 'Remove';
            removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
            removeBtn.onclick = () => removeMinion(m.name);
            li.appendChild(removeBtn);
            minionList.appendChild(li);
        });
    }

    // Default labels
    let labels = JSON.parse(localStorage.getItem('thingsLabels')) || [
        { key: 'done', name: 'Done', color: 'done', editable: false },
        { key: 'working', name: 'Working on it', color: 'working', editable: true },
        { key: 'stuck', name: 'Stuck', color: 'stuck', editable: true },
        { key: 'blank', name: '', color: 'bdbdbd', editable: false }
    ];

    function renderTasks() {
        taskList.innerHTML = '';
        // Group tasks by minion
        const grouped = {};
        minions.forEach(m => { grouped[m.name] = []; });
        grouped['Unassigned'] = [];
        tasks.forEach(task => {
            if (task.minion && grouped[task.minion]) {
                grouped[task.minion].push(task);
            } else {
                grouped['Unassigned'].push(task);
            }
        });
        // Render each group
        Object.keys(grouped).forEach(minionName => {
            if (grouped[minionName].length === 0) return;
            // Group header
            const groupHeader = document.createElement('div');
            groupHeader.className = 'minion-group-header';
            groupHeader.textContent = (minionName === 'Unassigned') ? 'Unassigned To-Do' : minionName + ' To-Do';
            taskList.appendChild(groupHeader);
            // Tasks in group
            grouped[minionName].forEach(task => {
                const taskDiv = document.createElement('div');
                taskDiv.className = 'things-task' + (editingId === task.id ? ' editing' : '');
                taskDiv.tabIndex = 0;
                taskDiv.dataset.id = task.id;

                const row = document.createElement('div');
                row.className = 'things-task-row';

                // Status label (replaces checkbox)
                const statusLabel = document.createElement('button');
                const labelObj = labels.find(l => l.key === (task.status || 'working')) || labels[1];
                statusLabel.className = 'status-label status-' + labelObj.color;
                statusLabel.textContent = labelObj.name;
                statusLabel.type = 'button';
                statusLabel.onclick = function(e) {
                    e.stopPropagation();
                    closeAllStatusDropdowns();
                    showStatusDropdown(statusLabel, task);
                };
                // Balloon animation for Done
                if (labelObj.key === 'done') {
                    const balloonAnim = document.createElement('span');
                    balloonAnim.className = 'balloon-anim';
                    balloonAnim.innerHTML = '';
                    statusLabel.appendChild(balloonAnim);
                    if (!task._justDone && !task.completed) task._justDone = false;
                    if (task._justDone) {
                        playBalloonAnimation(balloonAnim);
                        task._justDone = false;
                    }
                }
                row.appendChild(statusLabel);

                // Title (inline editable)
                const title = document.createElement('input');
                title.type = 'text';
                title.className = 'things-task-title';
                title.value = task.title;
                title.placeholder = 'New To-do';
                title.readOnly = editingId !== task.id;
                title.addEventListener('click', e => {
                    if (editingId !== task.id) {
                        editingId = task.id;
                        renderTasks();
                    }
                    e.stopPropagation();
                });
                title.addEventListener('input', () => {
                    task.title = title.value;
                    saveTasks();
                });
                title.addEventListener('keydown', e => {
                    if (e.key === 'Enter') {
                        editingId = null;
                        renderTasks();
                    }
                });
                row.appendChild(title);

                // Minion dropdown (only when editing)
                if (editingId === task.id) {
                    const minionSelect = document.createElement('select');
                    minionSelect.className = 'minion-select';
                    const defaultOpt = document.createElement('option');
                    defaultOpt.value = '';
                    defaultOpt.textContent = 'Assign minion...';
                    minionSelect.appendChild(defaultOpt);
                    minions.forEach(m => {
                        const opt = document.createElement('option');
                        opt.value = m.name;
                        opt.textContent = m.name;
                        if (task.minion === m.name) opt.selected = true;
                        minionSelect.appendChild(opt);
                    });
                    minionSelect.addEventListener('change', () => {
                        task.minion = minionSelect.value || null;
                        saveTasks();
                        renderTasks();
                    });
                    row.appendChild(minionSelect);
                } else if (task.minion) {
                    // Show assigned minion in collapsed view
                    const minionTag = document.createElement('span');
                    minionTag.className = 'minion-tag';
                    minionTag.textContent = task.minion;
                    row.appendChild(minionTag);
                }

                // Delete button (shows only when editing)
                if (editingId === task.id) {
                    const delBtn = document.createElement('button');
                    delBtn.className = 'action-btn delete-task';
                    delBtn.title = 'Delete';
                    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
                    delBtn.addEventListener('click', e => {
                        tasks = tasks.filter(t => t.id !== task.id);
                        editingId = null;
                        saveTasks();
                        renderTasks();
                        e.stopPropagation();
                    });
                    row.appendChild(delBtn);
                }

                taskDiv.appendChild(row);

                // Notes (expand/collapse)
                const notes = document.createElement('textarea');
                notes.className = 'things-task-notes';
                notes.value = task.notes || '';
                notes.readOnly = editingId !== task.id;
                notes.placeholder = 'Notes...';
                notes.addEventListener('input', () => {
                    task.notes = notes.value;
                    saveTasks();
                });
                taskDiv.appendChild(notes);

                // Notes preview (single line, grey, only if notes exist and not editing)
                if (task.notes && editingId !== task.id) {
                    const notesPreview = document.createElement('div');
                    notesPreview.className = 'things-task-notes-preview';
                    notesPreview.textContent = (task.notes || '').split('\n')[0];
                    taskDiv.appendChild(notesPreview);
                }

                // Expand/collapse on click
                taskDiv.addEventListener('click', e => {
                    if (editingId !== task.id) {
                        editingId = task.id;
                        renderTasks();
                    }
                    e.stopPropagation();
                });

                taskList.appendChild(taskDiv);
            });
        });
    }

    // Add new task inline
    addBtn.addEventListener('click', () => {
        const newTask = { id: Date.now(), title: '', notes: '', completed: false, minion: null };
        tasks.unshift(newTask);
        editingId = newTask.id;
        saveTasks();
        renderTasks();
        setTimeout(() => {
            const firstInput = document.querySelector('.things-task-title');
            if (firstInput) firstInput.focus();
        }, 50);
    });

    // Collapse expanded task if clicking outside
    document.addEventListener('mousedown', function(e) {
        if (editingId !== null) {
            const expanded = document.querySelector('.things-task.editing');
            if (expanded && !expanded.contains(e.target) && (!minionModal || !minionModal.contains(e.target))) {
                editingId = null;
                renderTasks();
            }
        }
    });

    function saveTasks() {
        localStorage.setItem('thingsTasks', JSON.stringify(tasks));
    }
    function saveMinions() {
        localStorage.setItem('thingsMinions', JSON.stringify(minions));
    }

    function showStatusDropdown(labelElem, task) {
        closeAllStatusDropdowns();
        const dropdown = document.createElement('div');
        dropdown.className = 'status-dropdown-menu';
        labels.forEach(l => {
            const opt = document.createElement('button');
            opt.className = 'status-dropdown-option status-' + (l.key === 'done' ? 'done' : (l.color || 'default'));
            opt.textContent = l.name;
            opt.style.background = l.key === 'done' ? '#00c875' : (l.color.startsWith('#') ? l.color : ('#'+l.color));
            opt.style.color = '#fff';
            opt.addEventListener('pointerdown', function(e) {
                e.stopPropagation();
                if (l.key === 'done' && task.status !== 'done') {
                    task._justDone = true;
                }
                task.status = l.key;
                saveTasks();
                renderTasks();
                closeAllStatusDropdowns();
            });
            dropdown.appendChild(opt);
        });
        // Footer for edit labels
        const footer = document.createElement('div');
        footer.className = 'status-dropdown-footer';
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '<i class="fas fa-pen"></i> Edit Labels';
        editBtn.onclick = function(e) {
            e.stopPropagation();
            closeAllStatusDropdowns();
            setTimeout(() => openLabelModal(), 50);
        };
        footer.appendChild(editBtn);
        dropdown.appendChild(footer);
        labelElem.parentElement.appendChild(dropdown);
        setTimeout(() => {
            document.addEventListener('mousedown', closeAllStatusDropdowns, { once: true });
        }, 0);
    }
    function closeAllStatusDropdowns() {
        document.querySelectorAll('.status-dropdown-menu').forEach(d => d.remove());
    }
    function playBalloonAnimation(container) {
        // Simple balloon animation (placeholder)
        container.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const b = document.createElement('span');
            b.style.position = 'absolute';
            b.style.left = (10 + Math.random() * 70) + '%';
            b.style.bottom = '-10px';
            b.style.width = b.style.height = (10 + Math.random() * 10) + 'px';
            b.style.borderRadius = '50%';
            b.style.background = ['#fff', '#f7b500', '#e2445c', '#00c875'][i % 4];
            b.style.opacity = 0.8;
            b.style.animation = `balloonUp 1.2s ${i * 0.1}s forwards`;
            container.appendChild(b);
        }
        setTimeout(() => { container.innerHTML = ''; }, 1600);
    }
    // Add keyframes for balloon animation
    const style = document.createElement('style');
    style.innerHTML = `@keyframes balloonUp { 0% { transform: translateY(0); opacity: 0.8; } 100% { transform: translateY(-40px); opacity: 0; } }`;
    document.head.appendChild(style);

    // Add/edit label
    labelForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = labelNameInput.value.trim();
        const color = labelColorInput.value;
        if (!name) return;
        if (editingLabelKey) {
            // Edit existing
            labels = labels.map(l => l.key === editingLabelKey ? { ...l, name, color: color.replace('#','') } : l);
        } else {
            // Add new
            const key = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '') + '-' + Math.random().toString(36).slice(2,6);
            labels.push({ key, name, color: color.replace('#',''), editable: true });
        }
        saveLabels();
        renderLabelList();
        labelNameInput.value = '';
        labelColorInput.value = '#bdbdbd';
        editingLabelKey = null;
        renderTasks();
    });

    // Render label list in modal (inline editing)
    function renderLabelList() {
        labelList.innerHTML = '';
        labels.forEach(l => {
            const row = document.createElement('div');
            row.className = 'label-row';
            // Color swatch with paint bucket
            const swatchBtn = document.createElement('button');
            swatchBtn.className = 'label-swatch-btn';
            swatchBtn.type = 'button';
            const swatch = document.createElement('span');
            swatch.className = 'label-swatch';
            swatch.style.background = l.key === 'done' ? '#00c875' : (l.color.startsWith('#') ? l.color : ('#'+l.color));
            const paintIcon = document.createElement('i');
            paintIcon.className = 'fas fa-fill-drip';
            swatch.appendChild(paintIcon);
            swatchBtn.appendChild(swatch);
            if (l.editable) {
                swatchBtn.onclick = () => {
                    // Open color picker
                    const colorInput = document.createElement('input');
                    colorInput.type = 'color';
                    colorInput.value = l.color.startsWith('#') ? l.color : ('#'+l.color);
                    colorInput.style.position = 'absolute';
                    colorInput.style.left = '-9999px';
                    document.body.appendChild(colorInput);
                    colorInput.click();
                    colorInput.oninput = (e) => {
                        l.color = colorInput.value.replace('#','');
                        saveLabels();
                        renderLabelList();
                        renderTasks();
                    };
                    colorInput.onblur = () => colorInput.remove();
                };
            }
            row.appendChild(swatchBtn);
            // Editable name
            const nameInput = document.createElement('input');
            nameInput.className = 'label-name-input';
            nameInput.value = l.name;
            nameInput.disabled = !l.editable;
            nameInput.oninput = () => {
                l.name = nameInput.value;
                saveLabels();
                renderTasks();
            };
            row.appendChild(nameInput);
            // Remove button
            if (l.editable) {
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-label-btn';
                removeBtn.title = 'Delete';
                removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
                removeBtn.onclick = () => {
                    labels = labels.filter(lbl => lbl.key !== l.key);
                    // Remove this label from any tasks
                    tasks.forEach(t => { if (t.status === l.key) t.status = 'working'; });
                    saveLabels();
                    renderLabelList();
                    renderTasks();
                };
                row.appendChild(removeBtn);
            }
            labelList.appendChild(row);
        });
    }
    addLabelBtn.onclick = () => {
        // Add a new label row
        const key = 'label-' + Math.random().toString(36).slice(2,8);
        labels.push({ key, name: 'New label', color: 'bdbdbd', editable: true });
        saveLabels();
        renderLabelList();
        renderTasks();
    };
    function saveLabels() {
        localStorage.setItem('thingsLabels', JSON.stringify(labels));
    }

    renderTasks();
}); 