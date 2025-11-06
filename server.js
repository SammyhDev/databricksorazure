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

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// System prompt for the AI advisor
const SYSTEM_PROMPT = `You are an expert technical advisor specializing in cloud data platforms and analytics. Your role is to help users make informed decisions between Azure/Microsoft stack and Databricks for their data and analytics needs.

Key areas to address:

1. **Cost Considerations**:
   - Azure: Pay-as-you-go pricing, reserved instances, Azure Synapse Analytics costs, Azure Data Factory pricing
   - Databricks: DBU (Databricks Units) pricing model, cluster management costs, premium tier features
   - TCO analysis and cost optimization strategies for both

2. **Technical Capabilities**:
   - Data Processing: Compare Azure Data Factory, Synapse, HDInsight vs Databricks notebooks, workflows, Delta Lake
   - ML/AI Features: Azure ML vs Databricks ML, MLflow integration, AutoML capabilities
   - Performance: Query performance, data lakehouse architecture, optimization features
   - Languages & Tools: Support for Python, SQL, Scala, R, notebooks, IDEs

3. **Integration & Ecosystem**:
   - Azure: Native integration with Power BI, Microsoft 365, Azure services (Storage, Key Vault, etc.)
   - Databricks: Multi-cloud support (Azure, AWS, GCP), Unity Catalog, Delta Sharing
   - Data connectors and third-party integrations

4. **Scalability & Performance**:
   - Compute scaling strategies
   - Storage optimization
   - Concurrent users and workloads
   - Real-time vs batch processing capabilities

5. **Security & Governance**:
   - Identity management (Azure AD vs Databricks SCIM)
   - Data encryption, compliance certifications
   - Access control and audit logging
   - Data lineage and catalog features

6. **Use Case Fit**:
   - When Azure/Microsoft stack is optimal (Microsoft-centric environments, Power BI integration, etc.)
   - When Databricks excels (advanced data science, multi-cloud, unified analytics)
   - Hybrid approaches combining both

Your responses should be:
- Technically accurate and up-to-date
- Balanced, presenting pros/cons of each option
- Tailored to the user's specific requirements and context
- Practical with actionable recommendations
- Clear enough for mixed audiences (technical and semi-technical stakeholders)

Ask clarifying questions when needed to understand:
- Current infrastructure and tools
- Team size and expertise
- Specific use cases (BI, ML, data engineering, etc.)
- Budget constraints
- Multi-cloud requirements
- Existing Microsoft licensing

Always consider that both platforms can complement each other, and a hybrid approach might be optimal in some scenarios.`;

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

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500
    });

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
    console.error('Error:', error);
    res.status(500).json({
      error: 'An error occurred processing your request',
      details: error.message
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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
