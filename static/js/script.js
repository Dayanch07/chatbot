let sessions = JSON.parse(localStorage.getItem('sessions')) || {}
let currentSession = localStorage.getItem('currentSession') || 'Chat 1'
if (!sessions[currentSession]) sessions[currentSession] = []

const chatContainer = document.querySelector('.chat-container')

function renderChatList() {
    const chatList = document.getElementById('chatList')
    chatList.innerHTML = ''
    for (const name in sessions) {
        const wrapper = document.createElement('div')
        wrapper.style.display = 'flex'
        wrapper.style.alignItems = 'center'
        wrapper.style.justifyContent = 'space-between'
        wrapper.style.gap = '5px'

        const btn = document.createElement('button')
        btn.textContent = name
        btn.style.flex = '1'
        btn.style.textAlign = 'left'
        btn.style.padding = '6px'
        btn.style.cursor = 'pointer'
        if (name === currentSession) btn.style.fontWeight = 'bold'
        btn.onclick = () => switchSession(name)

        const renameBtn = document.createElement('button')
        renameBtn.textContent = '✏️'
        renameBtn.title = 'Rename'
        renameBtn.style.padding = '2px'
        renameBtn.onclick = (e) => {
            e.stopPropagation()
            const newName = prompt('Rename chat:', name)
            if (!newName || sessions[newName]) return
            sessions[newName] = sessions[name]
            delete sessions[name]
            if (currentSession === name) currentSession = newName
            localStorage.setItem('sessions', JSON.stringify(sessions))
            localStorage.setItem('currentSession', currentSession)
            renderChatList()
            renderChat()
        }

        const deleteBtn = document.createElement('button')
        deleteBtn.textContent = '🗑️'
        deleteBtn.title = 'Delete'
        deleteBtn.style.padding = '2px'
        deleteBtn.onclick = (e) => {
            e.stopPropagation()
            if (!confirm(`Delete "${name}"?`)) return
            delete sessions[name]
            if (currentSession === name) {
                const remaining = Object.keys(sessions)[0] || 'Chat 1'
                currentSession = remaining
                if (!sessions[remaining]) sessions[remaining] = []
            }
            localStorage.setItem('sessions', JSON.stringify(sessions))
            localStorage.setItem('currentSession', currentSession)
            renderChatList()
            renderChat()
        }

        wrapper.appendChild(btn)
        wrapper.appendChild(renameBtn)
        wrapper.appendChild(deleteBtn)
        chatList.appendChild(wrapper)
    }
}

function switchSession(name) {
    currentSession = name
    localStorage.setItem('currentSession', currentSession)
    renderChatList()
    renderChat()
}

function startNewChat() {
    const name = prompt('New chat name:')
    if (!name || sessions[name]) return
    sessions[name] = []
    currentSession = name
    localStorage.setItem('sessions', JSON.stringify(sessions))
    localStorage.setItem('currentSession', name)
    renderChatList()
    renderChat()
}

function renderChat() {
    chatContainer.innerHTML = ''
    const chat = sessions[currentSession] || []
    chat.forEach((msg) => {
        const msgBubble = document.createElement('div')
        msgBubble.className = 'message ' + (msg.role === 'user' ? 'user' : 'bot')
        msgBubble.innerText = msg.content
        chatContainer.appendChild(msgBubble)
    })
    chatContainer.scrollTop = chatContainer.scrollHeight
}

async function sendPrompt() {
    const input = document.getElementById('prompt')
    const prompt = input.value
    if (!prompt) return
    input.value = ''

    const userMsg = document.createElement('div')
    userMsg.className = 'message user'
    userMsg.innerText = prompt
    chatContainer.appendChild(userMsg)

    const loadingBubble = document.createElement('div')
    loadingBubble.className = 'dots-loader'
    loadingBubble.innerHTML = '<span>.</span><span>.</span><span>.</span>'
    chatContainer.appendChild(loadingBubble)

    chatContainer.scrollTop = chatContainer.scrollHeight

    try {
        const res = await fetch('/api/prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        })
        const data = await res.json()

        chatContainer.removeChild(loadingBubble)
        const botMsg = document.createElement('div')
        botMsg.className = 'message bot'
        botMsg.innerText = data.response
        chatContainer.appendChild(botMsg)

        // Save to session
        sessions[currentSession].push({ role: 'user', content: prompt })
        sessions[currentSession].push({ role: 'bot', content: data.response })
        localStorage.setItem('sessions', JSON.stringify(sessions))

        chatContainer.scrollTop = chatContainer.scrollHeight
    } catch (err) {
        chatContainer.removeChild(loadingBubble)
        const errorMsg = document.createElement('div')
        errorMsg.className = 'message bot'
        errorMsg.innerText = '❌ Error: ' + err.message
        chatContainer.appendChild(errorMsg)
    }
}

function handleKey(event) {
    if (event.key === 'Enter') sendPrompt()
}
chatContainer.addEventListener('scroll', () => {
    localStorage.setItem('chatScroll', chatContainer.scrollTop);
});
window.onload = () => {
    renderChatList()
    renderChat()
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        document.getElementById('theme-icon').src = '/static/images/sun.png';
    } else {
        // Default to light theme or do nothing if you want
        document.body.classList.remove('dark');
        document.getElementById('theme-icon').src = '/static/images/moon.png';
    }
    const savedScroll = localStorage.getItem('chatScroll');
    if (savedScroll !== null) {
        chatContainer.scrollTop = parseInt(savedScroll, 10);
    } else {
        chatContainer.scrollTop = chatContainer.scrollHeight; // scroll to bottom by default
    }
}
const changeTheme = () => {
    const body = document.body
    const themeIcon = document.getElementById('theme-icon')

    if (body.classList.contains('dark')) {
        body.classList.remove('dark')
        themeIcon.src = '/static/images/moon.png' // Light mode → show moon
        localStorage.setItem('theme', 'light')
    } else {
        body.classList.add('dark')
        themeIcon.src = '/static/images/sun.png' // Dark mode → show sun
        localStorage.setItem('theme', 'dark')
    }
}