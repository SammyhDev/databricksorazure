// State management
let conversationId = null;
let isWaitingForResponse = false;

// DOM elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const resetButton = document.getElementById('resetButton');
const typingIndicator = document.getElementById('typingIndicator');
const suggestionChips = document.querySelectorAll('.suggestion-chip');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    adjustTextareaHeight();
});

// Event listeners
function setupEventListeners() {
    // Send message on button click
    sendButton.addEventListener('click', handleSendMessage);

    // Send message on Enter (but allow Shift+Enter for new lines)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Auto-resize textarea
    userInput.addEventListener('input', adjustTextareaHeight);

    // Reset conversation
    resetButton.addEventListener('click', handleReset);

    // Suggestion chips
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const message = chip.getAttribute('data-message');
            userInput.value = message;
            adjustTextareaHeight();
            handleSendMessage();
        });
    });
}

// Handle sending a message
async function handleSendMessage() {
    const message = userInput.value.trim();

    if (!message || isWaitingForResponse) {
        return;
    }

    // Add user message to chat
    addMessage(message, 'user');

    // Clear input
    userInput.value = '';
    adjustTextareaHeight();

    // Show typing indicator
    setLoading(true);

    try {
        // Send message to backend
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                conversationId: conversationId
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Update conversation ID
        conversationId = data.conversationId;

        // Add bot response to chat with typing effect
        addMessage(data.message, 'bot', false, true);

    } catch (error) {
        console.error('Error:', error);
        addMessage(
            'Sorry, I encountered an error processing your request. Please make sure the server is running and configured correctly.',
            'bot',
            true,
            false
        );
    } finally {
        setLoading(false);
    }
}

// Add message to chat
function addMessage(content, sender, isError = false, useTypingEffect = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    if (isError) {
        messageContent.style.background = '#fee';
        messageContent.style.color = '#c33';
    }

    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);

    if (sender === 'bot' && useTypingEffect && !isError) {
        // Typing effect for bot messages
        typeMessage(content, messageContent);
    } else {
        // Instant display for user messages and errors
        const formattedContent = formatMessage(content);
        messageContent.innerHTML = formattedContent;
    }

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Type out message with animation
function typeMessage(content, element) {
    const formattedContent = formatMessage(content);
    element.innerHTML = '';
    element.style.opacity = '0';

    // Fade in the container
    setTimeout(() => {
        element.style.transition = 'opacity 0.3s';
        element.style.opacity = '1';
    }, 50);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedContent;

    let currentIndex = 0;
    const text = tempDiv.innerText;
    const speed = 15; // milliseconds per character

    function type() {
        if (currentIndex < text.length) {
            // Re-format the partial text to maintain HTML structure
            const partialText = text.substring(0, currentIndex + 1);
            element.innerHTML = formatMessage(partialText);
            currentIndex++;

            // Scroll to bottom as we type
            chatMessages.scrollTop = chatMessages.scrollHeight;

            setTimeout(type, speed);
        } else {
            // Final formatted version
            element.innerHTML = formattedContent;
        }
    }

    type();
}

// Format message with basic markdown support
function formatMessage(text) {
    // Convert **bold** to <strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert *italic* to <em>
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Convert numbered lists
    text = text.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');

    // Convert bullet points
    text = text.replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)/s, (match) => {
        if (!match.includes('<ol>')) {
            return '<ul>' + match + '</ul>';
        }
        return match;
    });

    // Convert paragraphs
    const paragraphs = text.split('\n\n');
    text = paragraphs.map(p => {
        if (!p.match(/^<(ul|ol|li)/)) {
            return `<p>${p.replace(/\n/g, '<br>')}</p>`;
        }
        return p;
    }).join('');

    return text;
}

// Toggle loading state
function setLoading(loading) {
    isWaitingForResponse = loading;
    sendButton.disabled = loading;
    userInput.disabled = loading;

    if (loading) {
        typingIndicator.style.display = 'flex';
    } else {
        typingIndicator.style.display = 'none';
    }
}

// Adjust textarea height based on content
function adjustTextareaHeight() {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
}

// Reset conversation
async function handleReset() {
    if (!confirm('Start a new conversation? This will clear the current chat history.')) {
        return;
    }

    try {
        // Clear conversation on backend
        if (conversationId) {
            await fetch('/api/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conversationId: conversationId
                })
            });
        }

        // Reset local state
        conversationId = null;

        // Clear chat messages
        chatMessages.innerHTML = '';

        // Add welcome message
        addMessage(
            `👋 Hello! I'm your Azure vs Databricks advisor. I can help you compare these platforms across:

💰 Cost & Pricing Models
🔧 Technical Capabilities (Data Processing, ML/AI)
🔗 Integration & Ecosystem
📈 Scalability & Performance
🔒 Security & Governance

What would you like to know? Feel free to share your specific use case, current setup, or any questions you have!`,
            'bot'
        );

    } catch (error) {
        console.error('Error resetting conversation:', error);
        alert('Failed to reset conversation. Please refresh the page.');
    }
}
