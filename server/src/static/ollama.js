const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const modeToggle = document.getElementById('modeToggle');
const modeLabel = document.getElementById('mode-label');

// Store conversation history and summary
let conversationHistory = [];
let conversationSummary = ""; // Initialize the summary

// Function to set the theme
function setTheme(isDarkMode) {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        modeLabel.textContent = 'Light';
        modeToggle.checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        modeLabel.textContent = 'Dark';
        modeToggle.checked = false;
    }
}

// Check for user's theme preference on page load
const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
setTheme(prefersDarkMode);

// Mode toggle event listener
modeToggle.addEventListener('change', () => {
    const isDarkMode = document.body.classList.contains('dark-mode');
    setTheme(!isDarkMode);
});

function setRandomEmojiFavicon() {
    const emojis = ['😀', '😂', '😍', '🤩', '🥳', '🚀', '🌈', '🔥', '🎉', '💯'];
    const randomIndex = Math.floor(Math.random() * emojis.length);
    const randomEmoji = emojis[randomIndex];

    // Set favicon
    let faviconLink = document.querySelector("link[rel~='icon']");
    if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink);
    }
    faviconLink.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${randomEmoji}</text></svg>`;

    // Set emoji in header title
    const headerTitle = document.querySelector('.header-title h2');
    headerTitle.textContent = `${randomEmoji} Local Ollama`;
}

function formatearMensaje(mensaje) {
    const regexCodigo = /(`+)([\s\S]*?)\1/g;
    const regexListaNumerada = /^(\s*\d+\.\s+.*)/gm;
    const regexListaNoNumerada = /^(\s*[\*\-\+]\s+.*)/gm;
    const regexNegrita = /\*\*([^\*\*]+)\*\*/g; // **text**
    const regexNegritaCursiva = /\*\*\*([^\*]+)\*\*\*/g; // ***text***

    // Function to format lists
    function formatLists(text) {
        const lines = text.split('\n');
        let inList = false;
        let listType = null;
        let formattedText = '';

        for (let i = 0; i < lines.length; i++) {
            const isNumbered = regexListaNumerada.test(lines[i]);
            const isBulleted = regexListaNoNumerada.test(lines[i]);

            if (isNumbered || isBulleted) {
                if (!inList) {
                    inList = true;
                    listType = isNumbered ? 'ol' : 'ul';
                    formattedText += `<${listType}>`;
                }
                formattedText += `<li>${lines[i].replace(isNumbered ? regexListaNumerada : regexListaNoNumerada, '$1').trim()}</li>`;
            } else {
                if (inList) {
                    inList = false;
                    formattedText += `</${listType}>`;
                }
                formattedText += lines[i] + (i < lines.length - 1 ? '<br>' : '');
            }
        }

        if (inList) {
            formattedText += `</${listType}>`;
        }

        return formattedText;
    }

    // Function to format bold and italic text
    function formatBoldItalic(text) {
        text = text.replace(regexNegritaCursiva, '<strong><em>$1</em></strong>'); // ***text*** to bold italic
        text = text.replace(regexNegrita, '<strong>$1</strong>'); // **text** to bold
        return text;
    }

    let resultado = "";
    let lastIndex = 0;
    let match;

    while ((match = regexCodigo.exec(mensaje)) !== null) {
        // Add non-code text before the current code block, formatted for lists, bold, and italics
        if (match.index > lastIndex) {
            const nonCodeText = mensaje.substring(lastIndex, match.index);
            resultado += formatBoldItalic(formatLists(nonCodeText));
        }

        let codigo = match[2].trim();
        if (match[1].length >= 3) {
            // Block code
            resultado += `<pre><code style="font-family: monospace; font-weight: bold; padding-left: 1em;">${codigo}</code></pre>`;
        } else {
            // Inline code
            resultado += `<code style="font-family: monospace; font-weight: bold;">${codigo}</code>`;
        }

        lastIndex = regexCodigo.lastIndex;
    }

    // Add any remaining non-code text after the last code block, formatted for lists, bold, and italics
    if (lastIndex < mensaje.length) {
        const remainingText = mensaje.substring(lastIndex);
        resultado += formatBoldItalic(formatLists(remainingText));
    }

    return resultado;
}

function addMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    messageElement.innerHTML = formatearMensaje(message);

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    hljs.highlightAll();
}

// ... other code ...

async function sendMessage() {
  const message = messageInput.value.trim();
  if (message) {
      // Add user message to the chat and history
      addMessage('user', message);
      conversationHistory.push({ role: 'user', content: message });
      messageInput.value = '';

      // 1. Token-based Truncation (Approximation using word count)
      const maxRecentTokens = 300; // Limit for recent messages
      let recentTokenCount = 0;
      let recentMessages = [];
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
          const msgTokens = conversationHistory[i].content.split(/\s+/).length; // Simple word count
          if (recentTokenCount + msgTokens <= maxRecentTokens) {
              recentMessages.unshift(conversationHistory[i]);
              recentTokenCount += msgTokens;
          } else {
              break;
          }
      }

      // 2. Summarization (if needed)
      const summarizationThreshold = 5; // Summarize after this many messages
      if (conversationHistory.length > summarizationThreshold) {
          const messagesToSummarize = conversationHistory.slice(0, -recentMessages.length); // Messages before recent ones

          // Only summarize if there are messages to summarize
          if (messagesToSummarize.length > 0) {
              try {
                  conversationSummary = await summarizeConversation(messagesToSummarize);
              } catch (error) {
                  console.error('Error during summarization:', error);
                  // Handle summarization error, maybe fallback to truncation
                  conversationSummary = "Error during summarization.";
              }
          }
      }

      // 3. Construct the context
      let formattedConversationHistory = "**As the AI assistant in this conversation, please use the following history to provide the next response, avoid repeating yourself and telling any reference to this text:**\n";
      if (conversationSummary) {
          formattedConversationHistory += `Summary of earlier conversation: ${conversationSummary}\n`;
      }
      for (const msg of recentMessages) {
          formattedConversationHistory += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      }

      // Show waiting message
      const waitingMessage = document.getElementById('waitingMessage');
      waitingMessage.style.display = 'flex';

      try {
          const response = await fetch(window.location.origin+'/ollama_message', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ message: formattedConversationHistory }),
          });

          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          // Hide waiting message
          waitingMessage.style.display = 'none';

          // Add Ollama's response to the chat and history
          addMessage('bot', data.response);
          conversationHistory.push({ role: 'assistant', content: data.response });

      } catch (error) {
          console.error('Error:', error);

          // Hide waiting message
          waitingMessage.style.display = 'none';

          addMessage('bot', 'Error: Could not get a response from the server.');
      }
  }
}

// ... other code ...

// Function to summarize the conversation using Ollama
async function summarizeConversation(messages) {
    const prompt = `**Summarize the following conversation:**\n${messages.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}\n**Summary:**`;
    try {
        const response = await fetch(window.location.origin+'/ollama_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: prompt }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error:', error);
        throw error; // Re-throw the error after logging
    }
}

// Call the function on page load
setRandomEmojiFavicon();

sendMessageBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});