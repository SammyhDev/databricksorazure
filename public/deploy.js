// State management
let currentStep = 1;
let selectedProvider = null;
let config = {};

// DOM elements
const providerCards = document.querySelectorAll('.provider-card');
const selectProviderBtns = document.querySelectorAll('.select-provider-btn');
const nextBtn = document.getElementById('nextBtn');
const backBtn = document.getElementById('backBtn');
const backBtn2 = document.getElementById('backBtn2');
const deployButton = document.getElementById('deployButton');
const configSummary = document.getElementById('configSummary');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    // Provider selection
    selectProviderBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.provider-card');
            selectProvider(card.dataset.provider);
        });
    });

    providerCards.forEach(card => {
        card.addEventListener('click', () => {
            selectProvider(card.dataset.provider);
        });
    });

    // Navigation
    nextBtn.addEventListener('click', () => {
        if (validateStep(currentStep)) {
            goToStep(currentStep + 1);
        }
    });

    backBtn.addEventListener('click', () => goToStep(currentStep - 1));
    backBtn2.addEventListener('click', () => goToStep(currentStep - 1));

    // Form inputs
    document.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('change', updateConfig);
    });
}

function selectProvider(provider) {
    selectedProvider = provider;

    // Update UI
    providerCards.forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.provider === provider) {
            card.classList.add('selected');
        }
    });

    // Show/hide config sections
    const openaiConfig = document.getElementById('openaiConfig');
    const azureConfig = document.getElementById('azureConfig');

    if (provider === 'openai') {
        openaiConfig.style.display = 'block';
        azureConfig.style.display = 'none';
        config.useAzureOpenAI = false;
    } else {
        openaiConfig.style.display = 'none';
        azureConfig.style.display = 'block';
        config.useAzureOpenAI = true;
    }

    // Enable next button
    setTimeout(() => {
        goToStep(2);
    }, 300);
}

function goToStep(step) {
    if (step < 1 || step > 3) return;

    // Update step indicators
    document.querySelectorAll('.step').forEach(s => {
        const stepNum = parseInt(s.dataset.step);
        s.classList.remove('active', 'completed');

        if (stepNum === step) {
            s.classList.add('active');
        } else if (stepNum < step) {
            s.classList.add('completed');
        }
    });

    // Update content
    document.querySelectorAll('.step-content').forEach(content => {
        content.classList.remove('active');
        if (parseInt(content.dataset.step) === step) {
            content.classList.add('active');
        }
    });

    currentStep = step;

    // Update config and summary on step 3
    if (step === 3) {
        updateConfig();
        generateSummary();
        generateDeployUrl();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateStep(step) {
    if (step === 1) {
        if (!selectedProvider) {
            alert('Please select an AI provider');
            return false;
        }
    } else if (step === 2) {
        if (selectedProvider === 'openai') {
            const key = document.getElementById('openaiKey').value.trim();
            if (!key) {
                alert('Please enter your OpenAI API key');
                return false;
            }
        } else {
            const endpoint = document.getElementById('azureEndpoint').value.trim();
            const key = document.getElementById('azureKey').value.trim();
            const deployment = document.getElementById('azureDeployment').value.trim();

            if (!endpoint || !key || !deployment) {
                alert('Please fill in all required Azure OpenAI fields');
                return false;
            }

            // Validate endpoint format
            if (!endpoint.startsWith('https://')) {
                alert('Azure OpenAI Endpoint must start with https://');
                return false;
            }

            if (endpoint.includes('/openai/deployments')) {
                alert('Please remove /openai/deployments and everything after it from your endpoint URL');
                return false;
            }
        }
    }

    return true;
}

function updateConfig() {
    // Get common values
    config.appName = document.getElementById('appName').value.trim() || 'azure-databricks-advisor';
    config.pricingTier = document.getElementById('pricingTier').value;
    config.region = document.getElementById('region').value;

    if (selectedProvider === 'openai') {
        config.openaiKey = document.getElementById('openaiKey').value.trim();
        config.openaiModel = document.getElementById('openaiModel').value;
    } else {
        config.azureEndpoint = document.getElementById('azureEndpoint').value.trim();
        config.azureKey = document.getElementById('azureKey').value.trim();
        config.azureDeployment = document.getElementById('azureDeployment').value.trim();
        config.azureApiVersion = document.getElementById('azureApiVersion').value;
    }
}

function generateSummary() {
    let html = '';

    html += createSummaryItem('AI Provider', selectedProvider === 'openai' ? 'Standard OpenAI' : 'Azure OpenAI');
    html += createSummaryItem('Application Name', config.appName);
    html += createSummaryItem('Pricing Tier', config.pricingTier);
    html += createSummaryItem('Region', config.region);

    if (selectedProvider === 'openai') {
        html += createSummaryItem('OpenAI Model', config.openaiModel);
        html += createSummaryItem('API Key', maskSecret(config.openaiKey));
    } else {
        html += createSummaryItem('Azure Endpoint', config.azureEndpoint);
        html += createSummaryItem('Deployment Name', config.azureDeployment);
        html += createSummaryItem('API Version', config.azureApiVersion);
        html += createSummaryItem('API Key', maskSecret(config.azureKey));
    }

    configSummary.innerHTML = html;
}

function createSummaryItem(label, value) {
    return `
        <div class="summary-item">
            <span class="summary-label">${label}:</span>
            <span class="summary-value">${value}</span>
        </div>
    `;
}

function maskSecret(secret) {
    if (!secret) return '';
    if (secret.length <= 8) return '***';
    return secret.substring(0, 4) + '***' + secret.substring(secret.length - 4);
}

function generateDeployUrl() {
    const baseUrl = 'https://portal.azure.com/#create/Microsoft.Template/uri/';
    const templateUrl = 'https://raw.githubusercontent.com/SammyhDev/databricksorazure/main/azuredeploy.json';

    // Build parameters object
    const params = {
        appName: config.appName,
        sku: config.pricingTier,
        location: config.region
    };

    if (selectedProvider === 'openai') {
        params.useAzureOpenAI = 'false';
        params.openaiApiKey = config.openaiKey;
        params.openaiModel = config.openaiModel;
    } else {
        params.useAzureOpenAI = 'true';
        params.openaiApiKey = 'not-required-if-using-azure-openai';
        params.azureOpenAIEndpoint = config.azureEndpoint;
        params.azureOpenAIKey = config.azureKey;
        params.azureOpenAIDeployment = config.azureDeployment;
        params.azureOpenAIApiVersion = config.azureApiVersion;
    }

    // Create form parameters JSON
    const formParams = {
        '$schema': 'https://schema.management.azure.com/schemas/2015-01-01/deploymentParameters.json#',
        'contentVersion': '1.0.0.0',
        'parameters': {}
    };

    // Add parameters
    Object.keys(params).forEach(key => {
        formParams.parameters[key] = { value: params[key] };
    });

    // Encode the template URL and create the deployment link
    const encodedTemplateUrl = encodeURIComponent(templateUrl);

    // For better UX, we'll use a form approach
    const deployUrl = baseUrl + encodedTemplateUrl;

    deployButton.href = deployUrl;

    // Store config in sessionStorage so Azure can access it
    sessionStorage.setItem('azureDeployConfig', JSON.stringify(params));
}

// Helper to copy config to clipboard
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}
