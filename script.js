// 📦 ブラウザのローカル保存庫（LocalStorage）からデータを読み込む関数
function getLocalTasks() {
    const tasks = localStorage.getItem('my_tasks');
    return tasks ? JSON.parse(tasks) : [];
}

// 📦 ブラウザのローカル保存庫にデータを保存する関数
function saveLocalTasks(tasks) {
    localStorage.setItem('my_tasks', JSON.stringify(tasks));
}

// 画面にタスクを描画する関数
function renderTasks() {
    const tasks = getLocalTasks();

    document.getElementById('todo-list').innerHTML = '';
    document.getElementById('progress-list').innerHTML = '';
    document.getElementById('done-list').innerHTML = '';

    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card';
        
        const deadlineText = task.deadline ? task.deadline : '未設定';
        const assigneeText = task.assignee ? task.assignee : '未設定';

        let actionButtons = '';
        if (task.status === 'todo') {
            actionButtons = `<button class="btn-action" onclick="moveTask('${task.id}', 'progress')">進行中に変更 ➔</button>`;
        } else if (task.status === 'progress') {
            actionButtons = `
                <button class="btn-action" onclick="moveTask('${task.id}', 'todo')">↩ 戻す</button>
                <button class="btn-action" onclick="moveTask('${task.id}', 'done')">完了 ➔</button>
            `;
        } else if (task.status === 'done') {
            actionButtons = `
                <button class="btn-action" onclick="moveTask('${task.id}', 'progress')">↩ 戻す</button>
                <button class="btn-action btn-delete" onclick="deleteTask('${task.id}')">削除</button>
            `;
        }

        card.innerHTML = `
            <div class="task-info">
                <h3>${escapeHTML(task.title)}</h3>
                <div class="task-meta">
                    <span><strong>締切:</strong> ${deadlineText}</span>
                    <span><strong>担当:</strong> ${escapeHTML(assigneeText)}</span>
                </div>
            </div>
            <div class="task-actions">
                ${actionButtons}
            </div>
        `;

        document.getElementById(`${task.status}-list`).appendChild(card);
    });
}

// ➕ タスクを追加する関数
function addTask() {
    const titleInput = document.getElementById('taskTitle');
    const deadlineInput = document.getElementById('taskDeadline');
    const assigneeInput = document.getElementById('taskAssignee');
    const statusSelect = document.getElementById('taskStatus');

    if (!titleInput.value.trim()) {
        alert('タスク名を入力してください');
        return;
    }

    const tasks = getLocalTasks();
    const newTask = {
        id: new Date().getTime().toString(), // 被らないIDを生成
        title: titleInput.value,
        deadline: deadlineInput.value,
        assignee: assigneeInput.value,
        status: statusSelect.value
    };

    tasks.push(newTask);
    saveLocalTasks(tasks);
    renderTasks(); // 画面を更新

    // フォームをリセット
    titleInput.value = '';
    deadlineInput.value = '';
    assigneeInput.value = '';
}

// 🔄 タスクのステータスを変更する関数
window.moveTask = function(id, newStatus) {
    let tasks = getLocalTasks();
    tasks = tasks.map(task => {
        if (task.id === id) {
            task.status = newStatus;
        }
        return task;
    });
    saveLocalTasks(tasks);
    renderTasks();
}

// ❌ タスクを削除する関数
window.deleteTask = function(id) {
    if (confirm('このタスクを削除してもよろしいですか？')) {
        let tasks = getLocalTasks();
        tasks = tasks.filter(task => task.id !== id);
        saveLocalTasks(tasks);
        renderTasks();
    }
}

// セキュリティ対策（XSS防止用のエスケープ関数）
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// 追加ボタンのクリックイベントを設定
document.getElementById('addTaskBtn').addEventListener('click', addTask);

// 最初に画面を開いたときにタスクを表示する
renderTasks();