# Azure Deployment Guide

This guide provides detailed instructions for deploying the Azure vs Databricks Advisor to Azure.

## Quick Deploy Options

### Option 1: Deploy to Azure App Service (Recommended)

Click the button below to deploy directly to Azure App Service:

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FSammyhDev%2Fdatabricksorazure%2Fmain%2Fazuredeploy.json)

### Option 2: Deploy to Azure Container Apps

For container-based deployment:

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FSammyhDev%2Fdatabricksorazure%2Fmain%2Fazuredeploy-containerapp.json)

## Prerequisites

Before deploying, ensure you have:

1. **Azure Subscription**: [Create one free](https://azure.microsoft.com/free/)
2. **OpenAI API Key**: [Get one here](https://platform.openai.com/api-keys)
3. **Azure CLI** (for manual deployment): [Install here](https://docs.microsoft.com/cli/azure/install-azure-cli)

## Deployment Steps

### Using the "Deploy to Azure" Button

1. Click one of the "Deploy to Azure" buttons above
2. Sign in to your Azure account
3. Fill in the required parameters:
   - **Subscription**: Select your Azure subscription
   - **Resource Group**: Create new or select existing
   - **Region**: Choose a region close to your users
   - **App Name**: Enter a globally unique name (will be part of URL)
   - **OpenAI API Key**: Paste your OpenAI API key (stored securely)
   - **OpenAI Model**: Select the model (gpt-4-turbo-preview recommended)
   - **SKU/Pricing Tier**: Choose based on your needs
4. Review terms and click "Create"
5. Wait 5-10 minutes for deployment to complete
6. Once done, you'll see the application URL in the outputs

### Using Azure CLI

#### App Service Deployment

```bash
# 1. Login to Azure
az login

# 2. Set your subscription (if you have multiple)
az account set --subscription "Your-Subscription-Name"

# 3. Create a resource group
az group create \
  --name azure-databricks-advisor-rg \
  --location eastus

# 4. Deploy using ARM template
az deployment group create \
  --resource-group azure-databricks-advisor-rg \
  --template-file azuredeploy.json \
  --parameters \
    appName="my-databricks-advisor" \
    openaiApiKey="sk-your-openai-key" \
    openaiModel="gpt-4-turbo-preview" \
    sku="B1"

# 5. Get the application URL
az deployment group show \
  --resource-group azure-databricks-advisor-rg \
  --name azuredeploy \
  --query properties.outputs.webAppUrl.value
```

#### Container Apps Deployment

```bash
# 1. Login to Azure
az login

# 2. Register Container Apps provider (first time only)
az provider register --namespace Microsoft.App

# 3. Create a resource group
az group create \
  --name azure-databricks-advisor-rg \
  --location eastus

# 4. Deploy using ARM template
az deployment group create \
  --resource-group azure-databricks-advisor-rg \
  --template-file azuredeploy-containerapp.json \
  --parameters \
    containerAppName="my-databricks-advisor" \
    openaiApiKey="sk-your-openai-key" \
    openaiModel="gpt-4-turbo-preview"

# 5. Get the application URL
az deployment group show \
  --resource-group azure-databricks-advisor-rg \
  --name azuredeploy-containerapp \
  --query properties.outputs.containerAppUrl.value
```

### Using Azure Portal (Manual)

#### App Service Manual Deployment

1. **Create App Service**:
   - Go to Azure Portal
   - Click "Create a resource" → "Web App"
   - Fill in the basics:
     - Name: Choose unique name
     - Runtime: Node 18 LTS
     - OS: Linux
     - Region: Your preferred region
   - Select pricing tier (B1 recommended)
   - Click "Review + Create"

2. **Configure Environment Variables**:
   - Go to your App Service
   - Navigate to "Configuration" → "Application settings"
   - Add:
     - `OPENAI_API_KEY`: Your OpenAI API key
     - `OPENAI_MODEL`: gpt-4-turbo-preview
     - `PORT`: 8080
   - Click "Save"

3. **Deploy Code**:
   - Option A: Use GitHub Actions (recommended)
     - Go to "Deployment Center"
     - Select "GitHub"
     - Authorize and select repository
     - Select branch: main
     - Save

   - Option B: Use Local Git
     - Go to "Deployment Center"
     - Select "Local Git"
     - Copy the Git URL
     - Push from local machine:
       ```bash
       git remote add azure <git-url>
       git push azure main
       ```

## Configuration Options

### App Service Pricing Tiers

| Tier | Price/Month | Best For | Features |
|------|-------------|----------|----------|
| F1 (Free) | $0 | Testing | 60 min/day CPU, 1GB RAM |
| B1 (Basic) | ~$13 | Small production | Always on, custom domains |
| B2 (Basic) | ~$26 | Medium traffic | 2 cores, 3.5GB RAM |
| S1 (Standard) | ~$70 | Production | Auto-scale, staging slots |
| P1V2 (Premium) | ~$117 | High performance | Better CPU, more RAM |

### Container Apps Pricing

Container Apps pricing is based on:
- vCPU: ~$0.000012 per vCPU-second
- Memory: ~$0.000001 per GB-second
- HTTP requests: First 2M requests free

**Example cost**: Running 1 container (0.5 vCPU, 1GB RAM) 24/7:
- ~$20-30/month depending on usage

### OpenAI Model Selection

| Model | Cost per 1K tokens | Response Time | Best For |
|-------|-------------------|---------------|----------|
| gpt-3.5-turbo | $0.0015 / $0.002 | Fast (1-2s) | Quick responses, cost-sensitive |
| gpt-4-turbo-preview | $0.01 / $0.03 | Medium (5-10s) | Balanced quality and speed |
| gpt-4 | $0.03 / $0.06 | Slow (10-30s) | Highest quality responses |

*Note: Input / Output token costs*

## Post-Deployment Configuration

### Enable Application Insights (Recommended)

```bash
# Create Application Insights
az monitor app-insights component create \
  --app my-databricks-advisor-insights \
  --location eastus \
  --resource-group azure-databricks-advisor-rg \
  --application-type web

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app my-databricks-advisor-insights \
  --resource-group azure-databricks-advisor-rg \
  --query instrumentationKey -o tsv)

# Add to App Service
az webapp config appsettings set \
  --name my-databricks-advisor \
  --resource-group azure-databricks-advisor-rg \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="$INSTRUMENTATION_KEY"
```

### Enable Custom Domain

```bash
# Map custom domain
az webapp config hostname add \
  --webapp-name my-databricks-advisor \
  --resource-group azure-databricks-advisor-rg \
  --hostname advisor.yourdomain.com

# Bind SSL certificate
az webapp config ssl bind \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI \
  --name my-databricks-advisor \
  --resource-group azure-databricks-advisor-rg
```

### Enable Auto-Scaling (Standard tier and above)

```bash
# Create autoscale rule
az monitor autoscale create \
  --resource-group azure-databricks-advisor-rg \
  --resource my-databricks-advisor \
  --resource-type Microsoft.Web/serverfarms \
  --name autoscale-rule \
  --min-count 1 \
  --max-count 3 \
  --count 1

# Add scale-out rule (CPU > 70%)
az monitor autoscale rule create \
  --resource-group azure-databricks-advisor-rg \
  --autoscale-name autoscale-rule \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 1
```

## Troubleshooting

### Deployment Failed

1. Check deployment logs in Azure Portal:
   - Go to Resource Group → Deployments
   - Click on failed deployment
   - Review error messages

2. Common issues:
   - **App name not unique**: Choose a different name
   - **Invalid API key**: Verify your OpenAI API key
   - **Quota exceeded**: Check subscription limits
   - **Region not available**: Try a different region

### Application Not Starting

1. Check Application Logs:
   ```bash
   az webapp log tail \
     --name my-databricks-advisor \
     --resource-group azure-databricks-advisor-rg
   ```

2. Verify environment variables:
   ```bash
   az webapp config appsettings list \
     --name my-databricks-advisor \
     --resource-group azure-databricks-advisor-rg
   ```

3. Common issues:
   - Missing OPENAI_API_KEY
   - Incorrect PORT configuration
   - Node.js version mismatch

### Performance Issues

1. **Slow responses**:
   - Consider using gpt-3.5-turbo for faster responses
   - Upgrade to higher pricing tier
   - Enable Application Insights to monitor performance

2. **High costs**:
   - Switch to cheaper OpenAI model
   - Implement request caching
   - Add rate limiting

## Security Best Practices

1. **Use Azure Key Vault** for storing OpenAI API key:
   ```bash
   # Create Key Vault
   az keyvault create \
     --name my-advisor-keyvault \
     --resource-group azure-databricks-advisor-rg \
     --location eastus

   # Store secret
   az keyvault secret set \
     --vault-name my-advisor-keyvault \
     --name openai-api-key \
     --value "sk-your-key"

   # Reference in App Service
   # @Microsoft.KeyVault(SecretUri=https://my-advisor-keyvault.vault.azure.net/secrets/openai-api-key/)
   ```

2. **Enable HTTPS only** (enabled by default in templates)

3. **Restrict access** with Azure Front Door or API Management

4. **Enable authentication** using Azure AD:
   ```bash
   az webapp auth update \
     --name my-databricks-advisor \
     --resource-group azure-databricks-advisor-rg \
     --enabled true \
     --action LoginWithAzureActiveDirectory
   ```

## Monitoring and Maintenance

### View Logs

```bash
# Stream logs
az webapp log tail \
  --name my-databricks-advisor \
  --resource-group azure-databricks-advisor-rg

# Download logs
az webapp log download \
  --name my-databricks-advisor \
  --resource-group azure-databricks-advisor-rg
```

### Monitor Costs

1. Go to Azure Portal → Cost Management + Billing
2. Set up budget alerts
3. Monitor OpenAI API usage at platform.openai.com

### Update Application

For GitHub-connected deployments:
```bash
git push origin main  # Automatically triggers deployment
```

For manual updates:
```bash
# Update code
az webapp deployment source sync \
  --name my-databricks-advisor \
  --resource-group azure-databricks-advisor-rg
```

## Clean Up Resources

To delete all resources and stop charges:

```bash
az group delete \
  --name azure-databricks-advisor-rg \
  --yes \
  --no-wait
```

## Support

For issues or questions:
- Check [troubleshooting section](#troubleshooting)
- Review Azure App Service logs
- Open an issue on GitHub
- Contact Azure Support

## Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Azure Container Apps Documentation](https://docs.microsoft.com/azure/container-apps/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Azure ARM Template Reference](https://docs.microsoft.com/azure/templates/)
