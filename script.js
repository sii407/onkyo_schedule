// Firebase SDK の読み込み
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    doc, 
    updateDoc, 
    deleteDoc,
    query,
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ⚠️ 【重要】ここにFirebaseコンソールで取得したあなたの設定情報を貼り付けてください
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
  apiKey: "AIzaSyCjnBEyIT5B74BtexjQtQdcNC0YOHMhozk",
  authDomain: "onkyo-schedule.firebaseapp.com",
  projectId: "onkyo-schedule",
  storageBucket: "onkyo-schedule.firebasestorage.app",
  messagingSenderId: "608016974026",
  appId: "1:608016974026:web:4484b01bf151b11ca97433",
  measurementId: "G-42NR2GFW7M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// データを保存する「コレクション（フォルダのようなもの）」への参照
const tasksCollection = collection(db, "tasks");

// 画面にタスクを描画する関数
function renderTasks(tasks) {
    document.getElementById('todo-list').innerHTML = '';
    document.getElementById('progress-list').innerHTML = '';
    document.getElementById('done-list').innerHTML = '';

    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card';
        
        const deadlineText = task.deadline ? task.deadline : '未設定';
        const assigneeText = task.assignee ? task.assignee : '未設定';

        // ボタンの制御（Firebaseでは一意の文字列IDを使うため、IDをシングルクォーテーションで囲む文字列型にして関数に渡します）
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

// ☁️ クラウド（Firestore）からリアルタイムにデータを取得して監視する
// （別のPCでデータが変わったときも、この処理が自動で走って画面が更新されます）
const q = query(tasksCollection, orderBy("createdAt", "asc"));
onSnapshot(q, (snapshot) => {
    const tasks = [];
    snapshot.forEach((doc) => {
        tasks.push({
            id: doc.id, // Firestoreが自動生成するランダムなID
            ...doc.data()
        });
    });
    renderTasks(tasks);
});

// ☁️ クラウドへタスクを追加する関数
async function addTask() {
    const titleInput = document.getElementById('taskTitle');
    const deadlineInput = document.getElementById('taskDeadline');
    const assigneeInput = document.getElementById('taskAssignee');
    const statusSelect = document.getElementById('taskStatus');

    if (!titleInput.value.trim()) {
        alert('タスク名を入力してください');
        return;
    }

    try {
        await addDoc(tasksCollection, {
            title: titleInput.value,
            deadline: deadlineInput.value,
            assignee: assigneeInput.value,
            status: statusSelect.value,
            createdAt: Date.now() // 並び替え用のタイムスタンプ
        });

        // フォームをリセット
        titleInput.value = '';
        deadlineInput.value = '';
        assigneeInput.value = '';
    } catch (e) {
        console.error("エラーが発生しました: ", e);
    }
}

// ☁️ クラウドのタスクのステータスを変更する関数
window.moveTask = async function(id, newStatus) {
    const taskDocRef = doc(db, "tasks", id);
    try {
        await updateDoc(taskDocRef, {
            status: newStatus
        });
    } catch (e) {
        console.error("更新エラー: ", e);
    }
}

// ☁️ クラウドのタスクを削除する関数
window.deleteTask = async function(id) {
    if (confirm('このタスクを削除してもよろしいですか？')) {
        const taskDocRef = doc(db, "tasks", id);
        try {
            await deleteDoc(taskDocRef);
        } catch (e) {
            console.error("削除エラー: ", e);
        }
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