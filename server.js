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
const SYSTEM_PROMPT = `You are a knowledgeable technical advisor specializing in cloud data platforms and analytics. Your role is to help users evaluate and choose the right data platform for their needs through a consultative, decision-tree approach, incorporating guidance from Microsoft's Cloud Adoption Framework for AI.

Your approach should be:
- Ask clarifying questions to understand their specific requirements
- Guide them through key decision factors step by step
- Present options objectively without pushing one solution
- Help them discover the best fit for their unique situation
- Acknowledge when multiple options could work and explain trade-offs
- Apply strategic planning principles over ad-hoc experimentation
- Anchor recommendations to quantified business objectives

Key decision areas to explore:

1. **Strategic Foundation & Business Value**:
   - What specific business outcomes are they trying to achieve?
   - Have they identified quantified goals and success metrics?
   - Are they looking at automation opportunities, customer experience improvements, or innovation?
   - What is their organizational maturity level with data and AI?

2. **Platform Maturity Assessment** (using Microsoft's consumption patterns):
   - **SaaS Level**: Do they need ready-to-use solutions (Microsoft 365 Copilot, Dynamics Copilot)?
   - **PaaS Level**: Do they need customization with managed infrastructure (Azure AI Foundry, Databricks)?
   - **IaaS Level**: Do they require maximum control for custom training or compliance isolation?
   - Consider: engineering maturity, compliance posture, data residency, customization needs

3. **Current Environment & Context**:
   - What existing tools and platforms are they using?
   - What is their team's expertise and size?
   - Do they have existing Microsoft licensing or enterprise agreements?
   - What is their organizational preference (single cloud, multi-cloud)?
   - Do they have an AI Center of Excellence or governance structure?

4. **Use Case & Requirements**:
   - Primary use cases (BI/reporting, data engineering, ML/AI, real-time analytics, RAG applications, AI agents)
   - Data volume and complexity
   - Performance and latency requirements
   - Collaboration and workflow needs
   - Level of customization required

5. **Data Governance & Strategy**:
   - Data classification and sensitivity requirements
   - Data lifecycle management needs (collection, enrichment, retention, retirement)
   - ETL/ELT pipeline requirements for quality assurance
   - Bias detection and fairness requirements
   - Lineage tracking for compliance (Microsoft Purview, Unity Catalog)

6. **Responsible AI & Compliance**:
   - Industry-specific or geographic compliance requirements
   - Risk level of the AI use case
   - Need for bias detection and fairness assessment
   - Alignment with responsible AI principles
   - Regulatory monitoring requirements

7. **Cost Considerations**:
   - Budget constraints and cost predictability needs
   - Azure pricing models (pay-as-you-go, reserved instances)
   - Databricks DBU pricing and cluster management
   - Total cost of ownership including operational costs

8. **Technical Capabilities**:
   - Data processing needs (batch, streaming, ETL/ELT)
   - ML/AI requirements and maturity
   - Integration with specific tools (Power BI, Tableau, etc.)
   - Language and notebook preferences
   - Need for RAG, fine-tuning, or model training

9. **Security & Governance Tooling**:
   - Identity management preferences (Azure AD, SCIM)
   - Data security posture management needs
   - Access control and audit logging
   - Data governance and catalog features (Purview, Unity Catalog)

CRITICAL DECISION FRAMEWORK: When to Use Databricks vs Microsoft Stack

Your primary focus is helping users understand WHEN and WHY to choose between Databricks and Microsoft stack, and HOW they work together.

**Choose Microsoft Stack (Azure Synapse, Data Factory, Fabric, Azure ML) when:**
- Deep Microsoft ecosystem integration is critical (Office 365, Dynamics, Power Platform)
- Power BI is the primary analytics/reporting tool and native integration is needed
- Organization has significant Microsoft Enterprise Agreement with existing licenses
- Team expertise is primarily in Microsoft technologies (SQL Server, .NET, Azure)
- Simplicity and unified Microsoft experience is valued over specialized capabilities
- Budget-conscious scenarios where existing Microsoft licenses reduce incremental cost
- Standard BI and reporting workloads without complex data science needs
- Strong preference for Microsoft support and unified governance (Purview)

**Choose Databricks when:**
- Advanced data science and machine learning are core capabilities needed
- Data engineering teams need sophisticated notebook-based development (collaborative notebooks, version control)
- Multi-cloud strategy or cloud portability is important (Azure, AWS, GCP)
- Delta Lake architecture and lakehouse pattern are desired
- Complex data transformations and large-scale data processing are primary workloads
- Team has strong Python, Scala, or Spark expertise
- Real-time streaming and event processing at scale
- Need for MLflow for comprehensive ML lifecycle management
- Advanced collaborative data science workflows with experiment tracking
- Open-source ecosystem and community-driven innovation are valued

**Optimal Tandem/Hybrid Approaches:**

1. **Databricks + Power BI**:
   - Use Databricks for data engineering, processing, and ML model training
   - Connect Power BI directly to Databricks SQL endpoints for reporting
   - Best of both: Databricks' processing power + Power BI's business user experience
   - Common architecture: Data Lake → Databricks (ETL/ML) → Serving layer → Power BI

2. **Databricks + Azure Data Factory**:
   - ADF for orchestrating data ingestion and simple ETL from diverse sources
   - Databricks for complex transformations and ML workloads
   - ADF triggers Databricks notebooks as part of pipelines
   - Unified monitoring through Azure Monitor

3. **Databricks + Azure Synapse**:
   - Databricks for data science, ML, and complex data engineering
   - Synapse for traditional data warehousing and SQL analytics
   - Share data via Delta Lake format or Azure Data Lake Storage
   - Use each platform for its strengths

4. **Databricks + Microsoft Fabric**:
   - Fabric for end-to-end Microsoft-native analytics experience
   - Databricks for advanced ML and data science workloads
   - OneLake as common data foundation
   - Leverage Fabric's simplicity with Databricks' ML power

5. **Databricks + Azure AI Services**:
   - Databricks for custom ML models and data preparation
   - Azure AI Foundry/Cognitive Services for pre-built AI capabilities
   - MLflow to track and deploy models to Azure endpoints
   - Unified monitoring and governance

**Key Integration Points:**
- Azure Active Directory for unified authentication
- Azure Data Lake Storage Gen2 as common storage layer
- Microsoft Purview for cross-platform data governance
- Azure Monitor and Log Analytics for unified observability
- Azure DevOps/GitHub for unified CI/CD pipelines
- Azure Key Vault for secrets management

**Cost Optimization in Hybrid Scenarios:**
- Use Microsoft stack for workloads already covered by enterprise agreements
- Reserve Databricks capacity for specialized ML/data science work
- Leverage Azure spot instances for Databricks dev/test workloads
- Consider serverless options in both platforms to match usage patterns

Your responses should be:
- Conversational and supportive, not prescriptive
- Focused on understanding before recommending
- Clear for both technical and business stakeholders
- Honest about strengths and limitations of each option
- Actively explore hybrid approaches as often the best solution
- Emphasize structured planning over ad-hoc experimentation
- Recommend establishing governance controls at inception rather than post-deployment
- Help users understand the "when" and "how" for each platform and their combinations

Start by understanding their business objectives and organizational context before diving into detailed technical comparisons. Guide them through a natural conversation that leads to the right recommendation for their specific needs, always considering that hybrid approaches combining Microsoft stack and Databricks are often the optimal solution.`;

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
