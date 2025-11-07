require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize OpenAI client (supports both OpenAI and Azure OpenAI)
let openai;
const useAzureOpenAI = process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_KEY;

if (useAzureOpenAI) {
  // Azure OpenAI configuration
  const baseURL = `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`;
  console.log('🔧 Configuring Azure OpenAI:');
  console.log('   Endpoint:', process.env.AZURE_OPENAI_ENDPOINT);
  console.log('   Deployment:', process.env.AZURE_OPENAI_DEPLOYMENT);
  console.log('   API Version:', process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview');
  console.log('   Full URL:', baseURL);

  openai = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_KEY,
    baseURL: baseURL,
    defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview' },
    defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_KEY }
  });
  console.log('✓ Using Azure OpenAI Service');
} else {
  // Standard OpenAI configuration
  console.log('🔧 Configuring Standard OpenAI');
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log('✓ Using OpenAI API');
}

// System prompt for the AI advisor
const SYSTEM_PROMPT = `You are a knowledgeable technical advisor specializing in cloud data platforms and analytics. Your role is to help users evaluate and choose the right data platform for their needs through a consultative, decision-tree approach.

Your approach should be:
- Ask clarifying questions to understand their specific requirements
- Guide them through key decision factors step by step
- Present options objectively without pushing one solution
- Help them discover the best fit for their unique situation
- Acknowledge when multiple options could work and explain trade-offs

Key decision areas to explore:

1. **Current Environment & Context**:
   - What existing tools and platforms are they using?
   - What is their team's expertise and size?
   - Do they have existing Microsoft licensing or enterprise agreements?
   - What is their organizational preference (single cloud, multi-cloud)?

2. **Use Case & Requirements**:
   - Primary use cases (BI/reporting, data engineering, ML/AI, real-time analytics)
   - Data volume and complexity
   - Performance and latency requirements
   - Collaboration and workflow needs

3. **Cost Considerations**:
   - Budget constraints and cost predictability needs
   - Azure pricing models (pay-as-you-go, reserved instances)
   - Databricks DBU pricing and cluster management
   - Total cost of ownership including operational costs

4. **Technical Capabilities**:
   - Data processing needs (batch, streaming, ETL/ELT)
   - ML/AI requirements and maturity
   - Integration with specific tools (Power BI, Tableau, etc.)
   - Language and notebook preferences

5. **Scalability & Operations**:
   - Expected growth and scaling needs
   - DevOps and CI/CD requirements
   - Management and monitoring preferences

6. **Security & Governance**:
   - Compliance and regulatory requirements
   - Identity management preferences
   - Data governance and lineage needs

Your responses should be:
- Conversational and supportive, not prescriptive
- Focused on understanding before recommending
- Clear for both technical and business stakeholders
- Honest about strengths and limitations of each option
- Open to hybrid or multi-platform approaches

Start by understanding their situation before diving into detailed comparisons. Guide them through a natural conversation that leads to the right recommendation for their specific needs.`;

// Conversation history storage (in production, use a proper database)
const conversations = new Map();

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create conversation history
    const convId = conversationId || generateConversationId();
    let history = conversations.get(convId) || [];

    // Add user message to history
    history.push({
      role: 'user',
      content: message
    });

    // Prepare messages for API call
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history
    ];

    // Call OpenAI API (model parameter ignored for Azure OpenAI deployments)
    const completionParams = {
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500
    };

    // Only add model parameter if NOT using Azure OpenAI (deployment name is in the URL)
    if (!useAzureOpenAI) {
      completionParams.model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    }

    const completion = await openai.chat.completions.create(completionParams);

    const assistantMessage = completion.choices[0].message.content;

    // Add assistant response to history
    history.push({
      role: 'assistant',
      content: assistantMessage
    });

    // Store updated history (limit to last 20 messages to manage memory)
    if (history.length > 20) {
      history = history.slice(-20);
    }
    conversations.set(convId, history);

    // Send response
    res.json({
      message: assistantMessage,
      conversationId: convId
    });

  } catch (error) {
    console.error('❌ Error in /api/chat:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);

    if (error.response) {
      console.error('   API Response Status:', error.response.status);
      console.error('   API Response Data:', error.response.data);
    }

    res.status(500).json({
      error: 'An error occurred processing your request',
      details: error.message,
      type: error.constructor.name
    });
  }
});

// Reset conversation endpoint
app.post('/api/reset', (req, res) => {
  const { conversationId } = req.body;
  if (conversationId) {
    conversations.delete(conversationId);
  }
  res.json({ success: true });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    provider: useAzureOpenAI ? 'Azure OpenAI' : 'OpenAI',
    configuration: {}
  };

  if (useAzureOpenAI) {
    health.configuration = {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT ? 'Set' : 'Missing',
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT ? 'Set' : 'Missing',
      apiKey: process.env.AZURE_OPENAI_KEY ? 'Set' : 'Missing',
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview'
    };
  } else {
    health.configuration = {
      apiKey: process.env.OPENAI_API_KEY ? 'Set' : 'Missing',
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'
    };
  }

  res.json(health);
});

// Helper function to generate conversation IDs
function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Azure vs Databricks Advisor running on http://localhost:${PORT}`);
  console.log(`📊 API ready at http://localhost:${PORT}/api/chat`);
});
