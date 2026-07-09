'use client';

import { useState } from 'react';
import { IntegrationCard, PageHeader, Tabs, TabsContent, TabsList, TabsTrigger } from '@genie/ui';

const INTEGRATIONS = {
  popular: [
    { name: 'Slack', description: 'Get notified in Slack when conversations need attention', connected: false },
    { name: 'Zapier', description: 'Connect Genie to 5,000+ apps with Zapier', connected: true },
    { name: 'Webhooks', description: 'Send real-time events to your server', connected: false },
    { name: 'Custom API', description: 'Build custom integrations with our REST API', connected: false },
  ],
  communication: [
    { name: 'Slack', description: 'Team notifications and alerts', connected: false },
    { name: 'Microsoft Teams', description: 'Collaborate on conversations in Teams', connected: false },
    { name: 'Email', description: 'Forward conversations to email', connected: false },
  ],
  crm: [
    { name: 'HubSpot', description: 'Sync leads and contacts with HubSpot', connected: false },
    { name: 'Salesforce', description: 'Connect conversations to Salesforce records', connected: false },
  ],
  automation: [
    { name: 'Zapier', description: 'Automate workflows across apps', connected: true },
    { name: 'Make', description: 'Build complex automation scenarios', connected: false },
  ],
  developer: [
    { name: 'REST API', description: 'Full API access for custom integrations', connected: false },
    { name: 'JavaScript SDK', description: 'Embed and customize with our SDK', connected: false },
    { name: 'Webhooks', description: 'Real-time event notifications', connected: false },
  ],
};

export default function IntegrationsPage() {
  const [connected, setConnected] = useState<Record<string, boolean>>({
    Zapier: true,
  });

  function handleConnect(name: string) {
    setConnected((prev) => ({ ...prev, [name]: true }));
  }

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Connect Genie with your favorite tools and services."
      />

      <Tabs defaultValue="popular">
        <TabsList>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="developer">Developer Tools</TabsTrigger>
        </TabsList>

        {(Object.keys(INTEGRATIONS) as Array<keyof typeof INTEGRATIONS>).map((category) => (
          <TabsContent key={category} value={category} className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {INTEGRATIONS[category].map((integration) => (
                <IntegrationCard
                  key={integration.name}
                  name={integration.name}
                  description={integration.description}
                  connected={connected[integration.name] ?? integration.connected}
                  onConnect={() => handleConnect(integration.name)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
